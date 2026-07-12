import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type InferUITools,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";
import { db } from "@noorcode/database/client";
import type { Prisma } from "@noorcode/database";
import { 
  getToolContracts, 
  modeSchema, 
  type ModeType, 
  type ToolContracts,
  MAX_AUTO_PROCEED_STEPS
} from "@noorcode/shared";
import { buildSystemPrompt } from "../system-prompt";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";
import { calculateCreditsForUsage } from "../lib/credits";
import { ingestAiUsage } from "../lib/polar";
import { isSupportedChatModel, resolveChatModel } from "../lib/models";

type ChatMessageMetadata = {
  mode?: ModeType;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
  autoProceedStep?: number;
};

type NoorcodeUIMessage = UIMessage<ChatMessageMetadata, never, InferUITools<ToolContracts>>;

const submitSchema = z.object({
  id: z.string(),
  messages: z
    .array(
      z.custom<NoorcodeUIMessage>((value) => {
        return value != null && typeof value === "object" && "id" in value && "parts" in value;
      }),
    )
    .min(1),
  mode: modeSchema,
  model: z.string().refine(isSupportedChatModel, "Unsupported model"),
  autoProceed: z.boolean().optional(),
});


const submitValidator = zValidator("json", submitSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }
});

function hasPendingToolCalls(message: NoorcodeUIMessage) {
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }

    return false;
  });
};

const app = new Hono<AuthenticatedEnv>()
  .post(
    "/",
    requireCreditsBalance,
    submitValidator,
    async (c) => {
      const userId = c.get("userId");
      const { id, messages, mode, model, autoProceed } = c.req.valid("json");

      const session = await db.session.findUnique({
        where: { id, userId },
      });

      if (!session) {
        return c.json({ error: "Session not found" }, 404);
      }

      const startTime = Date.now();
      const tools = getToolContracts(mode);
      const resolvedModel = resolveChatModel(model);
      const previousMessages = Array.isArray(session.messages)
        ? (session.messages as unknown as NoorcodeUIMessage[]).filter(
            (m) => m && Array.isArray(m.parts) && m.parts.length > 0
          )
        : [];
      const mergedMessages = [...previousMessages];
      
      for (const message of messages) {
        const incomingMessage = {
          ...message,
          metadata: { ...message.metadata, mode, model },
        } satisfies NoorcodeUIMessage;

        const existingMessageIndex = mergedMessages.findIndex((m) => m.id === incomingMessage.id);

        if (existingMessageIndex === -1) {
          mergedMessages.push(incomingMessage);
        } else {
          mergedMessages[existingMessageIndex] = incomingMessage;
        }
      }

      let stepCount = 1;
      if (autoProceed) {
        for (let i = mergedMessages.length - 1; i >= 0; i--) {
          const msg = mergedMessages[i];
          if (!msg) continue;
          if (msg.role === "user") break;
          if (msg.role === "assistant") stepCount++;
        }
      }

      const nextMessages = await validateUIMessages<NoorcodeUIMessage>({
        messages: mergedMessages,
        tools,
      });
      const modelMessages = await convertToModelMessages(nextMessages, { tools });
      let completedUsage: LanguageModelUsage | null = null;

      let systemPrompt = buildSystemPrompt({ mode });
      if (autoProceed && stepCount >= MAX_AUTO_PROCEED_STEPS) {
        systemPrompt = "The user has reached the maximum auto-proceed steps. You MUST reply ONLY with the exact text: 'Reached maximum auto-proceed steps (25). Pausing for your input.' Do not use any tools.";
      }

      const result = streamText({
        model: resolvedModel.model,
        system: systemPrompt,
        messages: modelMessages,
        tools,
        providerOptions: resolvedModel.providerOptions,
        onFinish(event) {
          completedUsage = event.totalUsage;
        },
      });

      const headers = new Headers();
      if (autoProceed) {
        headers.set("x-auto-proceed-step", stepCount.toString());
      }

      return result.toUIMessageStreamResponse<NoorcodeUIMessage>({
        headers,
        originalMessages: nextMessages,
        messageMetadata({ part }) {
          if (part.type === "start") {
            return {
              mode,
              model,
              autoProceedStep: autoProceed ? stepCount : undefined,
            };
          }

          if (part.type !== "finish") return undefined;

          return {
            mode,
            model,
            autoProceedStep: autoProceed ? stepCount : undefined,
            durationMs: Date.now() - startTime,
            ...(completedUsage ? { usage: completedUsage } : {}),
          };
        },
        async onFinish(event) {
          if (event.isAborted) return;

          if (hasPendingToolCalls(event.responseMessage)) return;

          await db.session.update({
            where: { id, userId },
            data: {
              messages: event.messages as unknown as Prisma.InputJsonValue,
            },
          });

          if (!completedUsage) return;

          try {
            const billableUsage = calculateCreditsForUsage({
              provider: resolvedModel.provider,
              model: resolvedModel.modelId,
              usage: completedUsage,
            });

            await ingestAiUsage({
              externalCustomerId: userId,
              eventId: `chat-message:${event.responseMessage.id}`,
              credits: billableUsage.credits,
            });
          } catch (error) {
            console.error("Failed to ingest Polar AI usage for chat message", {
              error,
              sessionId: id,
              messageId: event.responseMessage.id,
              userId,
            });
          }
        },
        onError(error) {
          return error instanceof Error ? error.message : String(error);
        },
      });
    },
  );

export default app;
