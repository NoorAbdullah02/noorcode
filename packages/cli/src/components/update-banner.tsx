import { useEffect, useState } from "react";
import packageJson from "../../package.json";
import { useTheme } from "../providers/theme";
import { TextAttributes } from "@opentui/core";

export function UpdateBanner() {
  const { colors } = useTheme();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    // Check for updates in the background without blocking the UI
    fetch("https://registry.npmjs.org/@noorcode/cli/latest")
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.version && data.version !== packageJson.version) {
          setLatestVersion(data.version);
        }
      })
      .catch(() => {
        // Silently ignore network errors
      });
  }, []);

  if (!latestVersion) return null;

  return (
    <box 
      width="100%" 
      backgroundColor={colors.primary} 
      paddingX={1}
      flexDirection="row"
      justifyContent="center"
    >
      <text fg={colors.background} attributes={TextAttributes.BOLD}>
        Update available: {packageJson.version} → {latestVersion}. Run `npm install -g @noorcode/cli@latest`
      </text>
    </box>
  );
}
