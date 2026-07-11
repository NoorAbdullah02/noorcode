import type { ReactNode } from "react";
import { useTheme } from "../providers/theme";

type Props = {
  children: ReactNode;
};

export function ThemedRoot({ children }: Props) {
  const { colors, isWin32 } = useTheme();

  return (
    <box 
      backgroundColor={isWin32 ? undefined : colors.background} 
      width="100%" 
      height="100%" 
      flexGrow={1}
    >
      {children}
    </box>
  );
};
