import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { useKeyboard } from "@opentui/react";
import { TextAttributes, RGBA } from "@opentui/core";
import { diffLines } from "diff";
import { DiffPreviewDialog, CompactDiffWidget } from "../../components/dialogs/diff-preview";
import { useToast } from "../toast";

type PendingPreview = {
  id: string;
  path: string;
  oldContent: string;
  newContent: string;
  additions: number;
  deletions: number;
  resolve: (accepted: boolean) => void;
};

type DiffPreviewContextType = {
  requestPreview: (path: string, oldContent: string, newContent: string) => Promise<boolean>;
};

const DiffPreviewContext = createContext<DiffPreviewContextType | null>(null);

export function DiffPreviewProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [queue, setQueue] = useState<PendingPreview[]>([]);
  const nextId = useRef(0);
  const [summary, setSummary] = useState<{ accepted: number; rejected: number } | null>(null);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  useKeyboard((key) => {
    if (queue.length === 0) return;
    if (key.ctrl && key.name.toLowerCase() === "v") {
      setIsFullViewOpen((v) => !v);
    }
  });

  const requestPreview = useCallback((path: string, oldContent: string, newContent: string) => {
    return new Promise<boolean>((resolve) => {
      const id = String(nextId.current++);
      const chunks = diffLines(oldContent, newContent);
      let additions = 0;
      let deletions = 0;
      for (const chunk of chunks) {
        if (chunk.added) additions += chunk.count ?? 0;
        if (chunk.removed) deletions += chunk.count ?? 0;
      }
      setQueue((q) => {
        if (q.length === 0) setIsFullViewOpen(false); // Default to compact widget
        return [...q, { id, path, oldContent, newContent, additions, deletions, resolve }];
      });
    });
  }, []);

  const handleResolve = useCallback((id: string, accepted: boolean) => {
    setQueue((q) => {
      const item = q.find((i) => i.id === id);
      if (item) {
        item.resolve(accepted);
        setSummary((s) => ({
          accepted: (s?.accepted ?? 0) + (accepted ? 1 : 0),
          rejected: (s?.rejected ?? 0) + (!accepted ? 1 : 0),
        }));
      }
      return q.filter((i) => i.id !== id);
    });
  }, []);

  const handleResolveAll = useCallback((accepted: boolean) => {
    setQueue((q) => {
      let currentAccepted = summary?.accepted ?? 0;
      let currentRejected = summary?.rejected ?? 0;

      for (const item of q) {
        item.resolve(accepted);
        if (accepted) currentAccepted++;
        else currentRejected++;
      }

      setSummary({ accepted: currentAccepted, rejected: currentRejected });
      return [];
    });
  }, [summary]);

  useEffect(() => {
    if (queue.length === 0 && summary !== null) {
      toast.show({
        message: `Visual Diff applied: ${summary.accepted} accepted, ${summary.rejected} rejected.`,
        variant: summary.rejected > 0 ? "error" : "success",
        duration: 4000,
      });
      setSummary(null);
    }
  }, [queue.length, summary, toast]);

  const wrappedRequestPreview = useCallback((path: string, oldContent: string, newContent: string) => {
    return requestPreview(path, oldContent, newContent);
  }, [requestPreview]);

  return (
    <DiffPreviewContext.Provider value={{ requestPreview: wrappedRequestPreview }}>
      {children}
      {queue.length > 0 && !isFullViewOpen && (
        <CompactDiffWidget
          pending={queue}
          onResolve={handleResolve}
          onResolveAll={handleResolveAll}
          onView={() => setIsFullViewOpen(true)}
        />
      )}
      {queue.length > 0 && isFullViewOpen && (
        <DiffPreviewDialog
          pending={queue}
          onResolve={handleResolve}
          onResolveAll={handleResolveAll}
          onHide={() => setIsFullViewOpen(false)}
        />
      )}
    </DiffPreviewContext.Provider>
  );
}

export function useDiffPreview() {
  const ctx = useContext(DiffPreviewContext);
  if (!ctx) throw new Error("useDiffPreview must be used within DiffPreviewProvider");
  return ctx;
}
