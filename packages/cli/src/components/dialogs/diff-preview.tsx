import { useState, useCallback, useMemo } from "react";
import { useKeyboard } from "@opentui/react";
import { TextAttributes, RGBA } from "@opentui/core";
import { useTheme } from "../../providers/theme";
import { diffLines } from "diff";

type PendingPreview = {
  id: string;
  path: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
  resolve: (accepted: boolean) => void;
};

type DiffPreviewDialogProps = {
  pending: PendingPreview[];
  onResolve: (id: string, accepted: boolean) => void;
  onResolveAll: (accepted: boolean) => void;
  onHide?: () => void;
};

export function DiffPreviewDialog({ pending, onResolve, onResolveAll, onHide }: DiffPreviewDialogProps) {
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const safeIndex = Math.min(selectedIndex, Math.max(0, pending.length - 1));
  const current = pending[safeIndex];

  const diffChunks = useMemo(() => {
    if (!current) return [];
    return diffLines(current.oldContent || "", current.newContent || "");
  }, [current]);

  useKeyboard((key) => {
    if (!current) return;
    
    // Reset confirm if key doesn't match
    const actionKey = key.name.toLowerCase();

    if (key.name === "up" || actionKey === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      setConfirmKey(null);
      return;
    }
    if (key.name === "down" || actionKey === "j") {
      setSelectedIndex((i) => Math.min(pending.length - 1, i + 1));
      setConfirmKey(null);
      return;
    }

    const validKeys = ["enter", "n", "a", "r", "q", "return"];
    
    if (!validKeys.includes(actionKey)) {
      setConfirmKey(null);
      return;
    }

    const normalizedKey = actionKey === "return" ? "enter" : actionKey;

    if (confirmKey === normalizedKey) {
      // Double confirm
      setConfirmKey(null);
      switch (normalizedKey) {
        case "enter":
          onResolve(current.id, true);
          break;
        case "n":
          onResolve(current.id, false);
          break;
        case "a":
          onResolveAll(true);
          break;
        case "r":
        case "q": // Q also rejects all remaining / exits
          onResolveAll(false);
          break;
      }
    } else {
      setConfirmKey(normalizedKey);
    }
  });

  if (!current) return null;

  let confirmMsg = "";
  if (confirmKey === "enter") confirmMsg = "Press Enter again to confirm...";
  else if (confirmKey === "n") confirmMsg = "Press N again to reject this file...";
  else if (confirmKey === "a") confirmMsg = "Press A again to accept ALL files...";
  else if (confirmKey === "r") confirmMsg = "Press R again to reject ALL files...";
  else if (confirmKey === "q") confirmMsg = "Press Q again to exit preview mode...";

  // Separate diff into left (old) and right (new) for side-by-side
  const leftLines: { text: string; color: string }[] = [];
  const rightLines: { text: string; color: string }[] = [];

  diffChunks.forEach((chunk) => {
    const lines = chunk.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop(); // remove trailing newline from chunk
    
    lines.forEach(line => {
      if (chunk.added) {
        rightLines.push({ text: `+ ${line}`, color: "green" });
      } else if (chunk.removed) {
        leftLines.push({ text: `- ${line}`, color: "red" });
      } else {
        leftLines.push({ text: `  ${line}`, color: "white" });
        rightLines.push({ text: `  ${line}`, color: "white" });
      }
    });
  });

  const { colors } = useTheme();

  return (
    <box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
      backgroundColor={RGBA.fromInts(0, 0, 0, 150)}
      zIndex={100}
    >
      <box
        width="90%"
        height="80%"
        flexDirection="column"
        padding={1}
        border
        borderStyle="single"
        backgroundColor={colors.dialogSurface}
      >
        {/* Header */}
        <box flexDirection="row" justifyContent="space-between" paddingBottom={1} border={["bottom"]} borderStyle="single">
          <text fg="cyan" attributes={TextAttributes.BOLD}>
            Visual Diff Preview (File {pending.length} pending)
          </text>
          <text fg="yellow">{current.path}</text>
        </box>

        {/* Body: Sidebar + Diff */}
        <box flexDirection="row" flexGrow={1} width="100%">
          {/* Sidebar: File List */}
          <box width="20%" flexDirection="column" paddingRight={1} border={["right"]} borderStyle="single">
            <text attributes={TextAttributes.BOLD} fg="magenta" paddingBottom={1}>
              Queue ({pending.length})
            </text>
            <scrollbox flexGrow={1} width="100%">
              {pending.map((p, i) => (
                <text key={p.id} fg={i === safeIndex ? "cyan" : "gray"}>
                  {i === safeIndex ? "▶ " : "  "}
                  {p.path.split("/").pop()}
                </text>
              ))}
            </scrollbox>
          </box>

          {/* Diff View */}
          <scrollbox flexGrow={1} width="80%" paddingLeft={1}>
            <box flexDirection="row" width="100%">
              {/* Left: Old */}
              <box width="50%" paddingRight={1}>
                {leftLines.map((l, i) => (
                  <text key={i} fg={l.color}>{l.text}</text>
                ))}
              </box>
              {/* Right: New */}
              <box width="50%" paddingLeft={1} border={["left"]} borderStyle="single">
                {rightLines.map((l, i) => (
                  <text key={i} fg={l.color}>{l.text}</text>
                ))}
              </box>
            </box>
          </scrollbox>
        </box>

        {/* Footer / Controls */}
        <box flexDirection="row" justifyContent="space-between" paddingTop={1} border={["top"]} borderStyle="single">
          <box flexDirection="row" gap={2}>
            <text fg="cyan">↑/↓: Navigate</text>
            <text fg="green">Enter×2: Accept</text>
            <text fg="red">N×2: Reject</text>
            <text fg="green">A×2: Accept All</text>
            <text fg="red">R×2: Reject All</text>
            <text fg="white">Q×2: Quit</text>
          </box>
          
          {confirmMsg ? (
            <text fg="yellow" attributes={TextAttributes.BOLD}>{confirmMsg}</text>
          ) : (
            <text fg="gray">Awaiting input...</text>
          )}
        </box>
      </box>
    </box>
  );
}

type CompactDiffWidgetProps = {
  pending: PendingPreview[];
  onResolve: (id: string, accepted: boolean) => void;
  onResolveAll: (accepted: boolean) => void;
  onView: () => void;
};

export function CompactDiffWidget({ pending, onResolve, onResolveAll, onView }: CompactDiffWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex = Math.min(selectedIndex, Math.max(0, pending.length - 1));
  const current = pending[safeIndex];

  useKeyboard((key) => {
    if (!current) return;
    const actionKey = key.name.toLowerCase();

    if (key.name === "up" || actionKey === "k") {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.name === "down" || actionKey === "j") {
      setSelectedIndex((i) => Math.min(pending.length - 1, i + 1));
      return;
    }

    if (actionKey === "a") {
      if (key.shift || key.ctrl) onResolveAll(true);
      else onResolve(current.id, true);
      return;
    }
    if (actionKey === "r" || actionKey === "n") {
      if (key.shift || key.ctrl) onResolveAll(false);
      else onResolve(current.id, false);
      return;
    }
    if (actionKey === "v" || actionKey === "enter" || actionKey === "return") {
      onView();
      return;
    }
  });

  const { colors } = useTheme();
  if (!current) return null;

  return (
    <box
      position="absolute"
      bottom={1}
      right={1}
      flexDirection="column"
      padding={1}
      border
      borderStyle="single"
      backgroundColor={colors.dialogSurface}
      zIndex={50}
    >
      <scrollbox flexGrow={0} height={Math.min(pending.length, 10)}>
        {pending.map((p, i) => {
          const isSelected = i === safeIndex;
          const shortPath = p.path.length > 20 ? "..." + p.path.slice(-20) : p.path;
          return (
            <box key={p.id} flexDirection="row" gap={1}>
              <text fg={isSelected ? "cyan" : "gray"}>
                {isSelected ? "▶" : " "}
              </text>
              <text fg="green">+{p.additions}</text>
              <text fg="red">-{p.deletions}</text>
              <text fg="yellow">{p.path.split("/").pop()}</text>
              <text fg="gray">{shortPath}</text>
            </box>
          );
        })}
      </scrollbox>

      <box flexDirection="column" paddingTop={1} border={["top"]} borderStyle="single">
        <box flexDirection="row" gap={1}>
          <text fg="cyan">↑/↓:Nav</text>
          <text fg="green">A:Acc</text>
          <text fg="red">R:Rej</text>
          <text fg="magenta">V:View</text>
        </box>
        <box flexDirection="row" gap={1}>
          <text fg="green">Shift+A:Acc All</text>
          <text fg="red">Shift+R:Rej All</text>
        </box>
      </box>
    </box>
  );
}
