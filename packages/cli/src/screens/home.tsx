import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { InputBar } from "../components/input-bar";
import { usePromptConfig } from "../providers/prompt-config";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useKeyboardLayer } from "../providers/keyboard-layer";

export function Home() {
  const navigate = useNavigate();
  const { mode, model, autoProceed, toggleAutoProceed } = usePromptConfig();
  const { isTopLayer } = useKeyboardLayer();

  const handleSubmit = useCallback(
    (text: string) => {
      navigate("/sessions/new", { state: { message: text, mode, model, autoProceed } });
    },
    [navigate, mode, model, autoProceed],
  );

  useKeyboard((key) => {
    if (!isTopLayer("base")) return;
    if (key.ctrl && key.name === "a") {
      key.preventDefault();
      toggleAutoProceed();
    }
  });

  return (
    <box
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
      gap={2}
      position="relative"
      width="100%"
      height="100%"
    >
      <Header />
      <box width="100%" maxWidth={78} paddingX={2} flexDirection="column" gap={1}>
        <InputBar onSubmit={handleSubmit} />
        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          {autoProceed ? <text fg="magenta">[Auto-Proceed: ON]</text> : null}
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
};
