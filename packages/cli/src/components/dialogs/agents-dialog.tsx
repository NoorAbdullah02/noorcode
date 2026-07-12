import { useCallback } from "react";
import { TextAttributes } from "@opentui/core";
import { useDialog } from "../../providers/dialog";
import { useTheme } from "../../providers/theme";
import { DialogSearchList } from "../dialog-search-list";
import { Mode, type ModeType } from "@noorcode/shared";

const AVAILABLE_MODES: ModeType[] = [Mode.BUILD, Mode.PLAN, Mode.REVIEW];

type AgentsDialogContentProps = {
  currentMode: ModeType;
  onSelectMode: (mode: ModeType) => void;
};

function getModeLabel(mode: ModeType) {
  return mode === Mode.BUILD ? "Build" : mode === Mode.PLAN ? "Plan" : "Review";
}

export const AgentsDialogContent = ({ 
  currentMode, 
  onSelectMode 
}: AgentsDialogContentProps) => {
  const dialog = useDialog();
  const { isWin32, colors } = useTheme();

  const handleSelect = useCallback(
    (nextMode: ModeType) => {
      onSelectMode(nextMode);
      dialog.close();
    },
    [onSelectMode, dialog],
  );

  return (
    <DialogSearchList
      items={AVAILABLE_MODES}
      onSelect={handleSelect}
      filterFn={(item, query) => getModeLabel(item).toLowerCase().includes(query.toLowerCase())}
      renderItem={(item, isSelected) => {
        const textFg = isSelected ? "black" : "white";
        const prefix = isSelected && isWin32 ? "> " : (isWin32 ? "  " : "");
        return (
          <text selectable={false} fg={textFg}>
            {prefix}
            {item === currentMode ? " • " : "   "}
            {getModeLabel(item)}
          </text>
        );
      }}
      getKey={(item) => item}
      placeholder="Search agents"
      emptyText="No matching agents"
    />
  );
};
