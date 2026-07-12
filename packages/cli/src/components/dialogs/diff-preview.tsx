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
  resolve: (accepted: boolean) => void;
};

type DiffPreviewDialogProps = {
  pending: PendingPreview[];
  onResolve: (id: string, accepted: boolean) => void;
  onResolveAll: (accepted: boolean) => void;
};

export function DiffPreviewDialog({ pending, onResolve, onResolveAll }: DiffPreviewDialogProps) {
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const current = pending[0];

  const diffChunks = useMemo(() => {
    if (!current) return [];
    return diffLines(current.oldContent || "", current.newContent || "");
  }, [current]);

  useKeyboard((key) => {
    if (!current) return;
    
    // Reset confirm if key doesn't match
    const actionKey = key.name.toLowerCase();
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

        {/* Body: Side-by-Side Diff */}
        <scrollbox flexGrow={1} width="100%">
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

        {/* Footer / Controls */}
        <box flexDirection="row" justifyContent="space-between" paddingTop={1} border={["top"]} borderStyle="single">
          <box flexDirection="row" gap={2}>
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
