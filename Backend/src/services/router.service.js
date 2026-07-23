import { isProviderAvailable } from "./provider.service.js";

/**
 * Deterministic Aether Auto Router Engine.
 * Evaluates prompt characteristics, tools, user plan, Pro preview eligibility,
 * and current provider health states to choose the optimal AI model without incurring LLM token costs.
 */
export function selectAutoModel({ prompt = "", messages = [], userPlan = "free", proPreviewRemaining = 0 }) {
  const fullText = (prompt + " " + messages.map(m => m.content).join(" ")).toLowerCase();

  // Heuristic classification flags
  const isCoding = /(function|const\s|let\s|var\s|class\s|import\s|def\s|return\s|error|bug|traceback|syntax|console\.log|code|refactor|script|sql|regex)/i.test(fullText);
  const isSearchNeeded = /(latest|news|today|current|weather|who is|2026|search|realtime|live)/i.test(fullText);
  const isComplexReasoning = /(explain step by step|architect|deep analysis|math|algorithm|compare|pros and cons|detailed summary)/i.test(fullText);

  const canUsePro = userPlan === "pro" || proPreviewRemaining > 0;

  let chosenModelId = "llama-3.3-70b-versatile";
  let routingReason = "Selected fast & efficient Llama 3.3 70B model.";
  let isPreviewEligible = false;

  if (canUsePro) {
    if (isCoding || isComplexReasoning) {
      if (isProviderAvailable("openai")) {
        chosenModelId = "gpt-4o-mini";
        routingReason = "Routed to OpenAI GPT-4o Mini for high-accuracy coding & reasoning.";
        isPreviewEligible = userPlan !== "pro";
      } else if (isProviderAvailable("mistral")) {
        chosenModelId = "mistral-large-latest";
        routingReason = "Routed to Mistral Large for complex reasoning.";
        isPreviewEligible = userPlan !== "pro";
      }
    } else if (isSearchNeeded) {
      if (isProviderAvailable("groq")) {
        chosenModelId = "llama-3.3-70b-versatile";
        routingReason = "Routed to Llama 3.3 70B with search tools.";
      }
    } else {
      if (isProviderAvailable("openai")) {
        chosenModelId = "gpt-4o-mini";
        routingReason = "Routed to GPT-4o Mini for reliable general conversation.";
        isPreviewEligible = userPlan !== "pro";
      } else if (isProviderAvailable("groq")) {
        chosenModelId = "llama-3.3-70b-versatile";
        routingReason = "Routed to Llama 3.3 70B for fast responses.";
      }
    }
  } else {
    // Free plan selection
    if (isCoding || isComplexReasoning) {
      if (isProviderAvailable("groq")) {
        chosenModelId = "llama-3.3-70b-versatile";
        routingReason = "Routed to Llama 3.3 70B (Groq) for powerful open reasoning & coding.";
      } else if (isProviderAvailable("google")) {
        chosenModelId = "gemini-2.5-flash";
        routingReason = "Routed to Gemini 2.5 Flash for reasoning assistance.";
      }
    } else if (isSearchNeeded) {
      if (isProviderAvailable("google")) {
        chosenModelId = "gemini-2.5-flash";
        routingReason = "Routed to Gemini 2.5 Flash with live search capability.";
      } else if (isProviderAvailable("groq")) {
        chosenModelId = "llama-3.3-70b-versatile";
        routingReason = "Routed to Llama 3.3 70B with search tool support.";
      }
    } else {
      if (isProviderAvailable("groq")) {
        chosenModelId = "llama-3.3-70b-versatile";
        routingReason = "Routed to Llama 3.3 70B for speedy conversation.";
      } else if (isProviderAvailable("google")) {
        chosenModelId = "gemini-2.5-flash-lite";
        routingReason = "Routed to Gemini Flash Lite for fast response.";
      }
    }
  }

  // Final sanity check: if chosen model's provider is currently unavailable, run fallback pick
  const providerKey = getProviderKeyForModel(chosenModelId);
  if (!isProviderAvailable(providerKey)) {
    const fallback = getNextAvailableModel(userPlan, proPreviewRemaining);
    chosenModelId = fallback.modelId;
    routingReason = `Provider ${providerKey} is cooling down. Fallback selected ${fallback.modelId}.`;
    isPreviewEligible = fallback.isPreviewEligible;
  }

  return {
    targetModelId: chosenModelId,
    routingReason,
    isPreviewEligible
  };
}

function getProviderKeyForModel(modelId) {
  if (modelId.startsWith("gemini")) return "google";
  if (modelId.includes("llama") || modelId.includes("gemma")) return "groq";
  if (modelId.startsWith("gpt")) return "openai";
  if (modelId.startsWith("mistral")) return "mistral";
  return "google";
}

function getNextAvailableModel(userPlan, proPreviewRemaining) {
  const canUsePro = userPlan === "pro" || proPreviewRemaining > 0;
  const candidates = canUsePro
    ? ["gpt-4o-mini", "llama-3.3-70b-versatile", "gemini-2.5-flash", "mistral-small-latest", "gemini-2.5-flash-lite"]
    : ["llama-3.3-70b-versatile", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

  for (const modelId of candidates) {
    const key = getProviderKeyForModel(modelId);
    if (isProviderAvailable(key)) {
      const isProModel = ["gpt-4o-mini", "mistral-small-latest", "mistral-large-latest"].includes(modelId);
      return { modelId, isPreviewEligible: isProModel && userPlan !== "pro" };
    }
  }

  return { modelId: "llama-3.3-70b-versatile", isPreviewEligible: false };
}
