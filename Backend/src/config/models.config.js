// Centralized AI Models Configuration for Aether AI
// You can easily add models, adjust daily limits, or change tool availability here.

export const modelsConfig = {
  "auto": {
    id: "auto",
    displayName: "Aether Auto",
    provider: "Aether Engine",
    providerKey: "aether",
    plan: "free",
    allowedTools: ["all"],
    dailyRequestLimit: 100,
    tokenLimit: 500000,
    enabled: true,
    isAutoRouter: true,
    badge: "Recommended",
    desc: "Intelligent smart router selecting the optimal model for your task",
    color: "text-emerald-400"
  },
  "gemini-2.5-flash-lite": {
    id: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    provider: "Google",
    providerKey: "google",
    plan: "free",
    allowedTools: ["searchInternet"],
    dailyRequestLimit: 25,
    tokenLimit: 100000,
    enabled: true,
    desc: "Speedy & light assistance (Limited Availability)",
    color: "text-blue-400"
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "Google",
    providerKey: "google",
    plan: "free",
    allowedTools: ["searchInternet"],
    dailyRequestLimit: 15,
    tokenLimit: 150000,
    enabled: true,
    desc: "Smart general model (Limited Availability)",
    color: "text-indigo-400"
  },
  "llama-3.3-70b-versatile": {
    id: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B (Groq)",
    provider: "Groq",
    providerKey: "groq",
    plan: "free",
    allowedTools: ["all"],
    dailyRequestLimit: 30,
    tokenLimit: 200000,
    enabled: true,
    desc: "Powerful open reasoning (All Tools enabled)",
    color: "text-amber-400"
  },
  "gemma2-9b-it": {
    id: "gemma2-9b-it",
    displayName: "Gemma 2 9B (Groq)",
    provider: "Groq",
    providerKey: "groq",
    plan: "free",
    allowedTools: ["all"],
    dailyRequestLimit: 50,
    tokenLimit: 200000,
    enabled: true,
    desc: "Fast & conversational (All Tools enabled)",
    color: "text-orange-400"
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "OpenAI",
    providerKey: "openai",
    plan: "pro",
    allowedTools: ["all"],
    dailyRequestLimit: 150,
    tokenLimit: 500000,
    enabled: true,
    desc: "Industry-standard accuracy & speed",
    color: "text-green-400"
  },
  "mistral-small-latest": {
    id: "mistral-small-latest",
    displayName: "Mistral Small",
    provider: "Mistral",
    providerKey: "mistral",
    plan: "pro",
    allowedTools: ["all"],
    dailyRequestLimit: 100,
    tokenLimit: 400000,
    enabled: true,
    desc: "Efficient reasoning & explanations",
    color: "text-teal-400"
  },
  "mistral-large-latest": {
    id: "mistral-large-latest",
    displayName: "Mistral Large",
    provider: "Mistral",
    providerKey: "mistral",
    plan: "pro",
    allowedTools: ["all"],
    dailyRequestLimit: 50,
    tokenLimit: 300000,
    enabled: true,
    desc: "Full-capability advanced reasoning",
    color: "text-purple-400"
  }
};

/**
 * Returns whether a model is allowed for a user plan.
 * Free plan users can only access models with plan === 'free'.
 * Pro plan users can access all models.
 */
export function isModelAllowedForPlan(modelId, userPlan = "free") {
  const config = modelsConfig[modelId];
  if (!config || !config.enabled) return false;
  if (userPlan === "pro") return true;
  return config.plan === "free";
}

/**
 * Checks if a tool execution is permitted for a model.
 */
export function isToolAllowedForModel(modelId, toolName) {
  const config = modelsConfig[modelId];
  if (!config) return false;
  if (config.allowedTools.includes("all")) return true;
  return config.allowedTools.includes(toolName);
}
