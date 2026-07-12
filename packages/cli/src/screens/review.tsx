import { useEffect, useState } from "react";
import { TextAttributes } from "@opentui/core";
import { Mode } from "@noorcode/shared";
import { useChat } from "../hooks/use-chat";
import { apiClient } from "../lib/api-client";
import { BotMessage } from "../components/messages/bot-message";

export function ReviewScreen() {
  const [diff, setDiff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const fetchDiff = async () => {
      try {
        const proc = Bun.spawn(["git", "diff", "--cached"], { stdout: "pipe" });
        const text = await new Response(proc.stdout).text();
        if (!text.trim()) {
          setError("No staged changes found in git.");
        } else {
          setDiff(text);
        }
      } catch (err: any) {
        setError(`Failed to run git diff: ${err.message}`);
      }
    };
    fetchDiff();
  }, []);

  useEffect(() => {
    if (!diff) return;
    const createSession = async () => {
      try {
        const res = await apiClient.sessions.$post({
          json: {
            title: "Code Review",
          },
        });
        if (!res.ok) throw new Error("Failed to create session");
        const data = await res.json();
        setSessionId(data.id);
      } catch (err: any) {
        setError(`Failed to create session: ${err.message}`);
      }
    };
    createSession();
  }, [diff]);

  const { messages, submit, status } = useChat(sessionId || "temp", []);
  
  useEffect(() => {
    if (sessionId && diff && !started) {
      setStarted(true);
      submit({
        userText: `Please review the following git diff. Output a structured code quality report containing:
1. Bugs or Logic Errors
2. Security Vulnerabilities
3. Performance Issues
4. Clean Code / Best Practices Suggestions

Use concise bullet points. Here is the diff:
\`\`\`diff
${diff}
\`\`\`
`,
        mode: Mode.PLAN,
        model: "claude-sonnet-4-6",
      });
    }
  }, [sessionId, diff, started, submit]);

  const aiMessage = messages.findLast((m) => m.role === "assistant");

  return (
    <box flexDirection="column" padding={1} width="100%" height="100%">
      <box paddingBottom={1} border borderStyle="single" flexDirection="row" justifyContent="space-between">
        <text fg="cyan" attributes={TextAttributes.BOLD}>
          AI Code Review
        </text>
        <text fg="gray">Press Ctrl+C to exit</text>
      </box>

      <box flexGrow={1} flexDirection="column" paddingTop={1}>
        {error ? (
          <text fg="red">{error}</text>
        ) : !diff ? (
          <text fg="yellow">Extracting staged git changes...</text>
        ) : !sessionId || !started ? (
          <text fg="yellow">Initializing AI session...</text>
        ) : (
          <scrollbox width="100%" height="100%" flexDirection="column">
            {aiMessage ? (
              <BotMessage 
                parts={aiMessage.parts} 
                model={aiMessage.metadata?.model || "claude-sonnet-4-6"} 
                mode={Mode.PLAN} 
                streaming={status === "streaming"} 
              />
            ) : (
              <text fg="gray">Waiting for AI response...</text>
            )}
            {status === "ready" && aiMessage && (
              <box marginTop={1}>
                <text fg="green" attributes={TextAttributes.BOLD}>
                  Review complete.
                </text>
              </box>
            )}
          </scrollbox>
        )}
      </box>
    </box>
  );
}
