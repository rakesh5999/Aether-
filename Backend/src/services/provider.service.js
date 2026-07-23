// Circuit Breaker and Provider Health Management Service for Aether AI

const PROVIDER_STATES = {
  AVAILABLE: "AVAILABLE",
  RATE_LIMITED: "RATE_LIMITED",
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",
  TEMPORARILY_UNAVAILABLE: "TEMPORARILY_UNAVAILABLE",
  DISABLED: "DISABLED"
};

const providers = {
  google: { state: PROVIDER_STATES.AVAILABLE, cooldownUntil: null, consecutiveFailures: 0 },
  groq: { state: PROVIDER_STATES.AVAILABLE, cooldownUntil: null, consecutiveFailures: 0 },
  openai: { state: PROVIDER_STATES.AVAILABLE, cooldownUntil: null, consecutiveFailures: 0 },
  mistral: { state: PROVIDER_STATES.AVAILABLE, cooldownUntil: null, consecutiveFailures: 0 }
};

/**
 * Checks if a provider is available to process requests.
 * Automatically recovers state if the cooldown period has expired.
 */
export function isProviderAvailable(providerKey) {
  const provider = providers[providerKey];
  if (!provider) return true;

  if (provider.state === PROVIDER_STATES.DISABLED) return false;

  if (provider.cooldownUntil) {
    if (Date.now() >= provider.cooldownUntil) {
      // Cooldown expired, probe recovery
      provider.state = PROVIDER_STATES.AVAILABLE;
      provider.cooldownUntil = null;
      provider.consecutiveFailures = 0;
      console.log(`🟢 Provider [${providerKey}] cooldown expired. State restored to AVAILABLE.`);
      return true;
    }
    return false;
  }

  return provider.state === PROVIDER_STATES.AVAILABLE;
}

/**
 * Reports a failure on a provider and updates its Circuit Breaker state & cooldown timer.
 */
export function reportProviderFailure(providerKey, error) {
  const provider = providers[providerKey];
  if (!provider) return;

  provider.consecutiveFailures += 1;
  const errMsg = (error?.message || "").toLowerCase();
  const status = error?.status || error?.response?.status;

  let cooldownMs = 60 * 1000; // Default 1 min cooldown
  let newState = PROVIDER_STATES.TEMPORARILY_UNAVAILABLE;

  if (status === 429 || errMsg.includes("rate limit") || errMsg.includes("too many requests")) {
    newState = PROVIDER_STATES.RATE_LIMITED;
    cooldownMs = 60 * 1000; // 1 minute
  } else if (errMsg.includes("quota") || errMsg.includes("exceeded your current quota") || errMsg.includes("out of tokens")) {
    newState = PROVIDER_STATES.QUOTA_EXHAUSTED;
    cooldownMs = 15 * 60 * 1000; // 15 minutes
  } else if (status >= 500) {
    newState = PROVIDER_STATES.TEMPORARILY_UNAVAILABLE;
    cooldownMs = 3 * 60 * 1000; // 3 minutes
  }

  provider.state = newState;
  provider.cooldownUntil = Date.now() + cooldownMs;
  console.warn(`⚠️ Circuit Breaker: Provider [${providerKey}] state set to ${newState} for ${cooldownMs / 1000}s due to error: ${error?.message}`);
}

/**
 * Reports a successful execution on a provider.
 */
export function reportProviderSuccess(providerKey) {
  const provider = providers[providerKey];
  if (provider) {
    provider.consecutiveFailures = 0;
    if (provider.state !== PROVIDER_STATES.AVAILABLE) {
      provider.state = PROVIDER_STATES.AVAILABLE;
      provider.cooldownUntil = null;
    }
  }
}

/**
 * Retrieves the current health overview of all registered providers.
 */
export function getProviderHealthStatus() {
  const result = {};
  for (const [key, val] of Object.entries(providers)) {
    result[key] = {
      state: val.state,
      cooldownUntil: val.cooldownUntil ? new Date(val.cooldownUntil).toISOString() : null,
      isAvailable: isProviderAvailable(key)
    };
  }
  return result;
}

/**
 * Returns an ordered array of fallback model IDs compatible with a target model.
 */
export function getFallbackChain(requestedModelId, userPlan = "free") {
  const fallbackMap = {
    "gemini-2.5-flash-lite": ["llama-3.3-70b-versatile", "mistral-small-latest", "gemini-2.5-flash", "gpt-4o-mini"],
    "gemini-2.5-flash": ["llama-3.3-70b-versatile", "mistral-small-latest", "gemini-2.5-flash-lite", "gpt-4o-mini"],
    "llama-3.3-70b-versatile": ["gemini-2.5-flash-lite", "mistral-small-latest", "gemini-2.5-flash", "gpt-4o-mini"],
    "gpt-4o-mini": ["mistral-small-latest", "llama-3.3-70b-versatile", "gemini-2.5-flash-lite", "mistral-large-latest"],
    "mistral-small-latest": ["llama-3.3-70b-versatile", "gemini-2.5-flash-lite", "gpt-4o-mini", "mistral-large-latest"],
    "mistral-large-latest": ["mistral-small-latest", "llama-3.3-70b-versatile", "gpt-4o-mini", "gemini-2.5-flash"]
  };

  const chain = fallbackMap[requestedModelId] || ["llama-3.3-70b-versatile", "gemini-2.5-flash-lite", "mistral-small-latest"];
  return chain;
}
