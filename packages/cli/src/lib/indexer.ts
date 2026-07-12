import type { Tree, Parser as TreeSitterParser, Language as TreeSitterLanguage } from "web-tree-sitter";
import * as chokidar from "chokidar";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Parser, Language } = require("web-tree-sitter");

type FileIndex = {
  path: string;
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
};

class ProjectIndexer {
  private parser: TreeSitterParser | null = null;
  private langTsx: TreeSitterLanguage | null = null;
  private langTs: TreeSitterLanguage | null = null;
  
  private files: Map<string, FileIndex> = new Map();
  private watcher: chokidar.FSWatcher | null = null;
  private cwd: string = process.cwd();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    try {
      await Parser.init();
      this.parser = new Parser();

      const tsxWasmPath = require.resolve("tree-sitter-wasms/out/tree-sitter-tsx.wasm");
      const tsWasmPath = require.resolve("tree-sitter-wasms/out/tree-sitter-typescript.wasm");

      this.langTsx = await Language.load(tsxWasmPath);
      this.langTs = await Language.load(tsWasmPath);
      
      this.initialized = true;
      this.startWatching();
    } catch (e) {
      console.error("Failed to initialize tree-sitter indexer", e);
    }
  }

  private startWatching() {
    this.watcher = chokidar.watch("**/*.{ts,tsx,js,jsx}", {
      cwd: this.cwd,
      ignored: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      persistent: true,
      ignoreInitial: false,
    });

    this.watcher.on("add", (path) => this.indexFile(path));
    this.watcher.on("change", (path) => this.indexFile(path));
    this.watcher.on("unlink", (path) => {
      this.files.delete(path);
    });
  }

  private async indexFile(relPath: string) {
    if (!this.parser || !this.langTs || !this.langTsx) return;

    try {
      const fullPath = resolve(this.cwd, relPath);
      const content = await readFile(fullPath, "utf-8");

      const isTsx = relPath.endsWith(".tsx") || relPath.endsWith(".jsx");
      this.parser.setLanguage(isTsx ? this.langTsx : this.langTs);

      const tree = this.parser.parse(content);
      if (!tree) return;
      
      const exports: string[] = [];
      const imports: string[] = [];
      const functions: string[] = [];
      const classes: string[] = [];

      const walk = (node: any) => {
        if (node.type === "export_statement" || node.type === "lexical_declaration") {
          exports.push(node.text.slice(0, 50));
        }
        if (node.type === "import_statement") {
          imports.push(node.text);
        }
        if (node.type === "function_declaration" || node.type === "arrow_function") {
          const nameNode = node.childForFieldName("name");
          if (nameNode) functions.push(nameNode.text);
        }
        if (node.type === "class_declaration") {
          const nameNode = node.childForFieldName("name");
          if (nameNode) classes.push(nameNode.text);
        }
        
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child) walk(child);
        }
      };

      walk(tree.rootNode);

      this.files.set(relPath, {
        path: relPath,
        exports,
        imports,
        functions,
        classes,
      });

      tree.delete();
    } catch (e) {
      // ignore parse errors
    }
  }

  public getContextSummary(query: string): string {
    let summary = "Project Context Summary:\\n";
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

    if (keywords.length === 0) return "";

    let matchCount = 0;
    for (const [path, index] of this.files.entries()) {
      const matches = keywords.some(k => 
        path.toLowerCase().includes(k) || 
        index.functions.some(f => f.toLowerCase().includes(k)) ||
        index.classes.some(c => c.toLowerCase().includes(k))
      );

      if (matches && matchCount < 10) {
        summary += `- File: ${path}\\n`;
        if (index.functions.length > 0) summary += `  Functions: ${index.functions.join(", ")}\\n`;
        if (index.classes.length > 0) summary += `  Classes: ${index.classes.join(", ")}\\n`;
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return "";
    }

    return summary;
  }
}

export const projectIndexer = new ProjectIndexer();
