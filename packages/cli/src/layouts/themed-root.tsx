import type { ReactNode } from "react";
import { useTheme } from "../providers/theme";
import { UpdateBanner } from "../components/update-banner";
type Props = {
  children: ReactNode;
};

export function ThemedRoot({ children }: Props) {
  const { colors, isWin32 } = useTheme();

  return (
    <box 
      backgroundColor={colors.background} 
      width="100%" 
      height="100%" 
      flexGrow={1}
      flexDirection="column"
    >
      <UpdateBanner />
      {children}
    </box>
  );
};
