import { TextAttributes } from "@opentui/core";
import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/prompt-config";
import { Mode } from "@noorcode/shared";

export function StatusBar() {
  const { mode, model } = usePromptConfig();
  const { colors } = useTheme();

  return (
    <box flexDirection="row" gap={1}>
      
      <text fg={mode === Mode.BUILD ? colors.primary : mode === Mode.PLAN ? colors.planMode : colors.reviewMode}>
        {mode === Mode.BUILD ? "Build" : mode === Mode.PLAN ? "Plan" : "Review"}
      </text>

      <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
        ›
      </text>
      <text>{model}</text>
    </box>
  );
};
