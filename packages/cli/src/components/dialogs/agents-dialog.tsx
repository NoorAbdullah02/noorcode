import { useCallback } from "react";
import { TextAttributes } from "@opentui/core";
import { useDialog } from "../../providers/dialog";
import { useTheme } from "../../providers/theme";
import { DialogSearchList } from "../dialog-search-list";
import { Mode, type ModeType } from "@noorcode/shared";

const AVAILABLE_MODES: ModeType[] = [Mode.BUILD, Mode.PLAN];

type AgentsDialogContentProps = {
  currentMode: ModeType;
  onSelectMode: (mode: ModeType) => void;
};

function getModeLabel(mode: ModeType) {
  return mode === Mode.PLAN ? "Plan" : "Build";
}

export const AgentsDialogContent = ({ 
  currentMode, 
  onSelectMode 
}: AgentsDialogContentProps) => {
  const dialog = useDialog();
  const { isWin32 } = useTheme();

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
      renderItem={(item, isSelected) => (
        <text
          selectable={false}
          fg={!isWin32 && isSelected ? "black" : "white"}
          attributes={isWin32 && isSelected ? TextAttributes.REVERSE : undefined}
        >
          {item === currentMode ? " • " : "   "}
          {getModeLabel(item)}
        </text>
      )}
      getKey={(item) => item}
      placeholder="Search agents"
      emptyText="No matching agents"
    />
  );
};
