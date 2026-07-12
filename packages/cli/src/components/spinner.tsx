import "opentui-spinner/react";
import { Mode, type ModeType } from "@noorcode/shared";
import { useTheme } from "../providers/theme";

type Props = {
  mode?: ModeType;
};

export function Spinner({ mode = Mode.BUILD }: Props) {
  const { colors } = useTheme();
  const activeColor = mode === Mode.BUILD ? colors.primary : mode === Mode.PLAN ? colors.planMode : colors.reviewMode;

  return <spinner name="aesthetic" color={activeColor} />;
};
