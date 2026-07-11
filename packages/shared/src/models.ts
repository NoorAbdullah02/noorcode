export type ModelPricing = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
};

export type SupportedProvider = "anthropic" | "bynara" | "opencode" | "openai";

type SupportedChatModelDefinition = {
  id: string;
  provider: SupportedProvider;
  pricing: ModelPricing;
};

export const SUPPORTED_CHAT_MODELS = [
  {
    id: "mistral-large",
    provider: "bynara",
    pricing: {
      inputUsdPerMillionTokens: 2,
      outputUsdPerMillionTokens: 6,
    },
  },
  {
    id: "deepseek-v4-flash-free",
    provider: "opencode",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "nemotron-3-ultra-free",
    provider: "opencode",
    pricing: {
      inputUsdPerMillionTokens: 0,
      outputUsdPerMillionTokens: 0,
    },
  },
  {
    id: "gpt-4o",
    provider: "openai",
    pricing: {
      inputUsdPerMillionTokens: 2.5,
      outputUsdPerMillionTokens: 10,
    },
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    pricing: {
      inputUsdPerMillionTokens: 0.15,
      outputUsdPerMillionTokens: 0.6,
    },
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    pricing: {
      inputUsdPerMillionTokens: 3,
      outputUsdPerMillionTokens: 15,
    },
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    pricing: {
      inputUsdPerMillionTokens: 1,
      outputUsdPerMillionTokens: 5,
    },
  },
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    pricing: {
      inputUsdPerMillionTokens: 5,
      outputUsdPerMillionTokens: 25,
    },
  },
] as const satisfies readonly SupportedChatModelDefinition[];

export type SupportedChatModel = (typeof SUPPORTED_CHAT_MODELS)[number];
export type SupportedChatModelId = SupportedChatModel["id"];

export function findSupportedChatModel(modelId: string) {
  return SUPPORTED_CHAT_MODELS.find((model) => model.id === modelId);
}

export const DEFAULT_CHAT_MODEL_ID: SupportedChatModelId = "mistral-large";
