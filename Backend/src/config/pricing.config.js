// Centralized Pricing, Token Cost Rates, and Financial Safety Config for Aether AI

export const PRICING_CONFIG = {
  // Subscription Plan Config
  subscription: {
    monthlyPriceUSD: 2.99,
    introductoryPriceUSD: 1.00,
    currencySymbol: "$",
    currencyCode: "USD",
    earlySupporterLimit: 100,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_monthly",
    stripeCouponId: process.env.STRIPE_INTRO_COUPON_ID || "coupon_intro_1off"
  },

  // Pro Preview Config for Free users
  proPreview: {
    grantedMessages: 5
  },

  // Financial Safety & Budget Protection Ceilings (USD)
  budgets: {
    globalDailyUSD: parseFloat(process.env.GLOBAL_DAILY_BUDGET_USD || "5.00"),
    globalMonthlyUSD: parseFloat(process.env.GLOBAL_MONTHLY_BUDGET_USD || "50.00"),
    userMonthlyProCeilingUSD: parseFloat(process.env.USER_MONTHLY_COST_CAP_USD || "5.00"),
    userMonthlyFreeCeilingUSD: 0.50,
    warningThresholdPercent: 80
  },

  // Estimated API Costs per 1,000 Tokens (USD)
  // [inputCostPer1k, outputCostPer1k]
  tokenRates: {
    "gemini-2.5-flash-lite": { input: 0.000075, output: 0.0003 },
    "gemini-2.5-flash": { input: 0.00015, output: 0.0006 },
    "llama-3.3-70b-versatile": { input: 0.00059, output: 0.00079 },
    "gemma2-9b-it": { input: 0.0002, output: 0.0002 },
    "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
    "mistral-small-latest": { input: 0.0002, output: 0.0006 },
    "mistral-large-latest": { input: 0.002, output: 0.006 }
  }
};


 //Calculates estimated API cost for a request given input and output token counts.
 
export function calculateEstimatedCost(modelId, inputTokens = 0, outputTokens = 0) {
  const rate = PRICING_CONFIG.tokenRates[modelId] || { input: 0.0002, output: 0.0004 };
  const inputCost = (inputTokens / 1000) * rate.input;
  const outputCost = (outputTokens / 1000) * rate.output;
  return Number((inputCost + outputCost).toFixed(6));
}
