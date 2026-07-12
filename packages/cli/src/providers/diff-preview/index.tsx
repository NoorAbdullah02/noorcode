import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { DiffPreviewDialog } from "../../components/dialogs/diff-preview";
import { useToast } from "../toast";

type PendingPreview = {
  id: string;
  path: string;
  oldContent: string;
  newContent: string;
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

  const requestPreview = useCallback((path: string, oldContent: string, newContent: string) => {
    return new Promise<boolean>((resolve) => {
      const id = String(nextId.current++);
      setQueue((q) => [...q, { id, path, oldContent, newContent, resolve }]);
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
      {queue.length > 0 && (
        <DiffPreviewDialog
          pending={queue}
          onResolve={handleResolve}
          onResolveAll={handleResolveAll}
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
