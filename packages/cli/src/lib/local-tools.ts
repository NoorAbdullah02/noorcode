import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "path";
import { toolInputSchemas, Mode, type ModeType } from "@noorcode/shared";

const MAX_FILE_SIZE = 10_000;
const MAX_RESULTS = 200;
const MAX_MATCHES = 50;
const MAX_OUTPUT = 20_000;
const DEFAULT_TIMEOUT = 30_000;
const MAX_GREP_SCANNED_FILES = 5_000;
const GREP_IGNORED_DIRECTORIES = new Set(["node_modules", ".git"]);

function resolveInsideCwd(path: string) {
  const cwd = process.cwd();
  const resolved = resolve(cwd, path);
  const rel = relative(cwd, resolved);

  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error("Path is outside the project directory");
  }

  return { cwd, resolved };
}

function truncate(value: string, limit: number) {
  return value.length > limit
    ? `${value.slice(0, limit)}\n... (truncated, ${value.length} total chars)`
    : value;
}

async function collectGrepFiles(resolved: string, include: string | undefined) {
  const includeGlob = include ? new Bun.Glob(include) : null;
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    if (files.length >= MAX_GREP_SCANNED_FILES) return;

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (files.length >= MAX_GREP_SCANNED_FILES) return;
      if (GREP_IGNORED_DIRECTORIES.has(entry.name)) continue;

      const full = join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        if (includeGlob && !includeGlob.match(entry.name)) continue;
        files.push(full);
      }
    }
  }

  await walk(resolved);
  files.sort();
  return files;
}

function resolveShellCommand(command: string): string[] {
  if (process.platform === "win32") {
    const bash = Bun.which("bash");
    if (bash) return [bash, "-c", command];

    const shell = Bun.which("pwsh") ?? Bun.which("powershell");
    if (shell) return [shell, "-NoProfile", "-NonInteractive", "-Command", command];

    throw new Error(
      "No shell found on PATH. Install Git for Windows (provides bash) or ensure PowerShell is available.",
    );
  }

  const shell = Bun.which("bash") ?? Bun.which("sh");
  if (!shell) throw new Error("No shell (bash or sh) found on PATH.");
  return [shell, "-c", command];
}

type RequestPreviewFn = (path: string, oldContent: string, newContent: string) => Promise<boolean>;

export async function executeLocalTool(
  toolName: string, 
  input: unknown, 
  mode: ModeType,
  requestPreview?: RequestPreviewFn
) {
  if (mode === Mode.PLAN && !["readFile", "listDirectory", "glob", "grep"].includes(toolName)) {
    throw new Error(`Tool ${toolName} is not available in PLAN mode`);
  }

  switch (toolName) {
    case "readFile": {
      const { path } = toolInputSchemas.readFile.parse(input);
      const { resolved } = resolveInsideCwd(path);
      const content = await readFile(resolved, "utf-8");
      return content.length > MAX_FILE_SIZE
        ? { content: content.slice(0, MAX_FILE_SIZE), truncated: true, totalLength: content.length }
        : { content };
    }
    case "listDirectory": {
      const { path } = toolInputSchemas.listDirectory.parse(input);
      const { cwd, resolved } = resolveInsideCwd(path);
      const entries = await readdir(resolved);
      const results: { name: string; type: "file" | "directory" }[] = [];

      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules") continue;
        const info = await stat(join(resolved, entry));
        results.push({ name: entry, type: info.isDirectory() ? "directory" : "file" });
      }

      results.sort((a, b) =>
        a.type !== b.type ? (a.type === "directory" ? -1 : 1) : a.name.localeCompare(b.name),
      );
      return { path: relative(cwd, resolved) || ".", entries: results };
    }
    case "glob": {
      const { pattern, path } = toolInputSchemas.glob.parse(input);
      const { cwd, resolved } = resolveInsideCwd(path);
      const glob = new Bun.Glob(pattern);
      const files: string[] = [];
      let truncated = false;

      for await (const match of glob.scan({ cwd: resolved, dot: false, onlyFiles: true })) {
        if (match.includes("node_modules")) continue;
        if (files.length >= MAX_RESULTS) {
          truncated = true;
          break;
        }
        files.push(relative(cwd, resolve(resolved, match)));
      }

      files.sort();
      return { files, ...(truncated ? { truncated: true } : {}) };
    }
    case "grep": {
      const { pattern, path, include } = toolInputSchemas.grep.parse(input);
      const { cwd, resolved } = resolveInsideCwd(path);

      let regex: RegExp;
      try {
        regex = new RegExp(pattern);
      } catch (err) {
        throw new Error(`Invalid regex pattern: ${err instanceof Error ? err.message : String(err)}`);
      }

      const files = await collectGrepFiles(resolved, include);
      const matches: { file: string; line: number; content: string }[] = [];
      let totalMatches = 0;
      let truncated = false;

      for (const file of files) {
        let content: string;
        try {
          content = await readFile(file, "utf-8");
        } catch {
          continue;
        }
        if (content.includes("\0")) continue; // skip binary files

        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (!regex.test(lines[i]!)) continue;
          totalMatches++;
          if (matches.length < MAX_MATCHES) {
            matches.push({ file: relative(cwd, file), line: i + 1, content: lines[i]! });
          } else {
            truncated = true;
          }
        }
      }

      if (matches.length === 0) return { matches: [], message: "No matches found" };
      return { matches, ...(truncated ? { truncated: true, totalMatches } : {}) };
    }
    case "writeFile": {
      const { path, content } = toolInputSchemas.writeFile.parse(input);
      const { cwd, resolved } = resolveInsideCwd(path);
      
      let oldContent: string | null = null;
      try {
        oldContent = await readFile(resolved, "utf-8");
      } catch (err: any) {
        if (err.code !== "ENOENT") throw err;
      }

      await mkdir(dirname(resolved), { recursive: true });
      await writeFile(resolved, content, "utf-8");

      if (requestPreview) {
        requestPreview(relative(cwd, resolved), oldContent || "", content).then(async (accepted) => {
          if (!accepted) {
            if (oldContent === null) {
              const { unlink } = require("fs/promises");
              await unlink(resolved).catch(() => {});
            } else {
              await writeFile(resolved, oldContent, "utf-8");
            }
          }
        });
      }

      return {
        success: true as const,
        path: relative(cwd, resolved),
        bytesWritten: Buffer.byteLength(content, "utf-8"),
      };
    }
    case "editFile": {
      const { path, oldString, newString } = toolInputSchemas.editFile.parse(input);
      const { cwd, resolved } = resolveInsideCwd(path);
      const content = await readFile(resolved, "utf-8");
      const occurrences = content.split(oldString).length - 1;

      if (occurrences === 0) throw new Error("oldString not found in file");
      if (occurrences > 1) throw new Error(`oldString is ambiguous; found ${occurrences} matches`);

      const nextContent = content.replace(oldString, newString);
      await writeFile(resolved, nextContent, "utf-8");

      if (requestPreview) {
        requestPreview(relative(cwd, resolved), content, nextContent).then(async (accepted) => {
          if (!accepted) {
            await writeFile(resolved, content, "utf-8");
          }
        });
      }

      return { success: true as const, path: relative(cwd, resolved) };
    }
    case "bash": {
      const { command, timeout = DEFAULT_TIMEOUT } = toolInputSchemas.bash.parse(input);
      const proc = Bun.spawn(resolveShellCommand(command), {
        cwd: resolveInsideCwd(".").resolved,
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, TERM: "dumb" },
      });
      const timer = setTimeout(() => proc.kill(), timeout);
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;
      clearTimeout(timer);
      return {
        stdout: truncate(stdout, MAX_OUTPUT),
        stderr: truncate(stderr, MAX_OUTPUT),
        exitCode,
      };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
