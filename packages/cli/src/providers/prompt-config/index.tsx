import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { 
  DEFAULT_CHAT_MODEL_ID, 
  Mode,
  type ModeType,
  type SupportedChatModelId,
} from "@noorcode/shared";

type PromptConfigContextValue = {
  mode: ModeType;
  toggleMode: () => void;
  setMode: (mode: ModeType) => void;
  model: SupportedChatModelId;
  setModel: (model: SupportedChatModelId) => void;
  autoProceed: boolean;
  setAutoProceed: (autoProceed: boolean) => void;
  toggleAutoProceed: () => void;
};

const PromptConfigContext = createContext<PromptConfigContextValue | null>(null);

export function usePromptConfig(): PromptConfigContextValue {
  const value = useContext(PromptConfigContext);
  if (!value) {
    throw new Error("usePromptConfig must be used within a PromptConfigProvider");
  }
  return value;
};

type PromptConfigProviderProps = {
  children: ReactNode;
};

export function PromptConfigProvider({ children }: PromptConfigProviderProps) {
  const [mode, setMode] = useState<ModeType>(Mode.BUILD);
  const [model, setModel] = useState<SupportedChatModelId>(DEFAULT_CHAT_MODEL_ID);
  const [autoProceed, setAutoProceed] = useState<boolean>(false);

  const toggleMode = useCallback(() => {
    setMode((m) => {
      if (m === Mode.BUILD) return Mode.PLAN;
      if (m === Mode.PLAN) return Mode.REVIEW;
      return Mode.BUILD;
    });
  }, []);

  const toggleAutoProceed = useCallback(() => {
    setAutoProceed((v) => !v);
  }, []);

  return (
    <PromptConfigContext.Provider 
      value={{ 
        mode, 
        toggleMode, 
        setMode, 
        model, 
        setModel,
        autoProceed,
        setAutoProceed,
        toggleAutoProceed
    }}>
      {children}
    </PromptConfigContext.Provider>
  );
};
