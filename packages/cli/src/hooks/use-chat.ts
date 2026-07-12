import { useMemo } from "react";
import { useChat as useAiChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type InferUITools,
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";
import { type ModeType, type SupportedChatModelId, type ToolContracts } from "@noorcode/shared";
import { apiClient } from "../lib/api-client";
import { getAuth } from "../lib/auth";
import { executeLocalTool } from "../lib/local-tools";
import { useDiffPreview } from "../providers/diff-preview";

export type ChatMessageMetadata = {
  mode?: ModeType;
  model?: SupportedChatModelId | string;
  durationMs?: number;
  usage?: LanguageModelUsage;
  autoProceedStep?: number;
};

type ChatTools = {
  [Name in keyof InferUITools<ToolContracts>]: {
    input: InferUITools<ToolContracts>[Name]["input"];
    output: unknown;
  };
};

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>;

export function useChat(sessionId: string, initialMessages: Message[], autoProceed: boolean = false) {
  const { requestPreview } = useDiffPreview();

  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuth();
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      prepareSendMessagesRequest({ messages }) {
        const message = messages[messages.length - 1];
        if (!message) throw new Error("No message to send");

        const metadata = messages.findLast(
          (m) => m.metadata?.mode && m.metadata?.model,
        )?.metadata;
        const previousMessage = messages[messages.length - 2];
        const requestMessages =
          message.role === "assistant" && previousMessage?.role === "user"
            ? [previousMessage, message]
            : [message];

        return {
          body: {
            id: sessionId,
            messages: requestMessages,
            mode: message.metadata?.mode ?? metadata?.mode,
            model: message.metadata?.model ?? metadata?.model,
            autoProceed,
          },
        }
      }
    });
  }, [sessionId, autoProceed]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      const mode = chat.messages.at(-1)?.metadata?.mode ?? "BUILD";

      void executeLocalTool(
        toolCall.toolName, 
        toolCall.input, 
        mode, 
        autoProceed ? undefined : requestPreview
      )
        .then(async (output) => {
          if (autoProceed) {
            await new Promise((r) => setTimeout(r, 750));
          }
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output,
          });
        })
        .catch((error) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : String(error),
          }),
        );
    },
    sendAutomaticallyWhen: autoProceed ? lastAssistantMessageIsCompleteWithToolCalls : undefined,
  });

  const autoProceedStep = chat.messages.findLast((m) => m.role === "assistant")?.metadata?.autoProceedStep ?? 0;

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    autoProceedStep,
    submit: async (params: { userText: string; mode: ModeType; model: SupportedChatModelId }) => {
      let smartContext = "";
      try {
        const { projectIndexer } = require("../lib/indexer");
        smartContext = projectIndexer.getContextSummary(params.userText);
      } catch (e) {}

      let finalMessage = params.userText;
      if (params.mode === "REVIEW") {
        try {
          const { execSync } = require("child_process");
          const diff = execSync("git diff --cached", { encoding: "utf8" });
          if (diff.trim()) {
            finalMessage = `[System: The user wants you to review their staged changes. Here is the git diff:\n${diff}]\n\n[User Request]\n${params.userText}`;
          } else {
            finalMessage = `[System: The user is in REVIEW mode but has no staged changes.]\n\n[User Request]\n${params.userText}`;
          }
        } catch (e) {}
      } else if (smartContext) {
        finalMessage = `[System: Auto-Indexed Context for this query]\n${smartContext}\n\n[User Request]\n${params.userText}`;
      }

      let finalModel = params.model;
      const attachments: string[] = [];

      // Vision Mode Detection
      const imageRegex = /([a-zA-Z0-9_./\\-]+\.(?:png|jpg|jpeg|webp))/gi;
      const imagesFound = params.userText.match(imageRegex);
      if (imagesFound && imagesFound.length > 0) {
        if (!finalModel.includes("gpt-4o") && !finalModel.includes("claude-sonnet-4-6")) {
          finalModel = "claude-sonnet-4-6" as SupportedChatModelId;
        }

        try {
          const { readFileSync } = require("fs");
          const { resolve } = require("path");
          for (const img of imagesFound) {
            const resolvedPath = resolve(process.cwd(), img);
            const ext = img.split(".").pop()?.toLowerCase();
            const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
            const base64 = readFileSync(resolvedPath).toString("base64");
            attachments.push(`data:${contentType};base64,${base64}`);
          }
        } catch (e) {}
      }

      return chat.sendMessage({
        text: finalMessage,
        files: attachments as any,
        metadata: {
          mode: params.mode,
          model: finalModel,
        },
      })
    },
    abort: chat.stop,
    interrupt: chat.stop,
  };
};
