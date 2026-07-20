import usageModel from "../models/usage.model.js";
import userModel from "../models/user.model.js";
import { modelsConfig } from "../config/models.config.js";
import { PRICING_CONFIG, calculateEstimatedCost } from "../config/pricing.config.js";

/**
 * Gets usage metrics for a user and model on the current day.
 */
export async function getUserDailyUsage(userId, modelId) {
  const dateStr = new Date().toISOString().split("T")[0];
  return await usageModel.findOne({ user: userId, date: dateStr, model: modelId });
}

/**
 * Gets consolidated usage metrics of all models for the current day.
 */
export async function getConsolidatedDailyUsage(userId) {
  const dateStr = new Date().toISOString().split("T")[0];
  const usages = await usageModel.find({ user: userId, date: dateStr });
  const user = await userModel.findById(userId);
  
  const result = {};
  for (const key of Object.keys(modelsConfig)) {
    const modelUsage = usages.find(u => u.model === key);
    result[key] = {
      requests: modelUsage ? modelUsage.requests : 0,
      totalTokens: modelUsage ? modelUsage.totalTokens : 0,
      limit: modelsConfig[key].dailyRequestLimit,
      tokenLimit: modelsConfig[key].tokenLimit
    };
  }

  return {
    models: result,
    proPreviewRemaining: user ? (user.proPreviewRemaining ?? 5) : 5,
    userPlan: user ? user.plan : "free"
  };
}

/**
 * Validates whether the user can make a request to the model.
 * Handles Pro Preview rules, Global Financial Budget caps, and user limits.
 */
export async function verifyUsageAndLimits(userId, modelId) {
  const user = await userModel.findById(userId);
  if (!user) {
    return { allowed: false, error: "USER_NOT_FOUND", message: "User not found." };
  }

  const model = modelsConfig[modelId];
  if (!model) {
    return { allowed: false, error: "MODEL_NOT_FOUND", message: `AI Model ${modelId} not found.` };
  }

  if (!model.enabled) {
    return { allowed: false, error: "MODEL_DISABLED", message: "This model is currently disabled." };
  }

  let isProPreviewActive = false;

  // Plan verification: Pro models require Pro plan or active Pro Preview
  if (model.plan === "pro" && user.plan !== "pro") {
    const previewRemaining = user.proPreviewRemaining ?? 5;
    if (previewRemaining > 0) {
      isProPreviewActive = true;
    } else {
      return {
        allowed: false,
        error: "UPGRADE_REQUIRED",
        message: "You've used all 5 Pro preview messages. Upgrade to Aether Pro for unlimited access to premium models."
      };
    }
  }

  // Financial Safety Check: Check Global Daily Budget Cap
  const dateStr = new Date().toISOString().split("T")[0];
  const globalDailyCostAgg = await usageModel.aggregate([
    { $match: { date: dateStr } },
    { $group: { _id: null, totalCost: { $sum: "$estimatedCost" } } }
  ]);
  const currentGlobalDailyCost = globalDailyCostAgg[0]?.totalCost || 0;

  if (currentGlobalDailyCost >= PRICING_CONFIG.budgets.globalDailyUSD) {
    console.warn(`🛑 Financial Emergency: Global daily budget cap of $${PRICING_CONFIG.budgets.globalDailyUSD} reached!`);
    // If global budget cap reached, allow only free basic models
    if (model.plan === "pro") {
      return {
        allowed: false,
        error: "BUDGET_CAP_REACHED",
        message: "Global daily AI budget ceiling reached. Premium models are temporarily paused until midnight."
      };
    }
  }

  // Fetch user's daily usage for target model
  const usage = await usageModel.findOne({ user: userId, date: dateStr, model: modelId }) || {
    requests: 0,
    totalTokens: 0
  };

  // Enforce Request Limit
  if (usage.requests >= model.dailyRequestLimit) {
    return {
      allowed: false,
      error: "LIMIT_EXCEEDED",
      message: `You've reached your daily limit of ${model.dailyRequestLimit} requests for ${model.displayName}.`
    };
  }

  // Enforce Token Limit
  if (usage.totalTokens >= model.tokenLimit) {
    return {
      allowed: false,
      error: "LIMIT_EXCEEDED",
      message: `You've reached your daily limit of ${model.tokenLimit} tokens for ${model.displayName}.`
    };
  }

  return {
    allowed: true,
    userPlan: user.plan,
    isProPreviewActive,
    proPreviewRemaining: user.proPreviewRemaining ?? 5,
    usage: {
      requests: usage.requests,
      totalTokens: usage.totalTokens,
      dailyRequestLimit: model.dailyRequestLimit,
      tokenLimit: model.tokenLimit
    }
  };
}

/**
 * Decrements the user's Pro Preview counter when a preview request finishes successfully.
 */
export async function decrementProPreview(userId) {
  const user = await userModel.findById(userId);
  if (user && user.plan !== "pro" && (user.proPreviewRemaining ?? 5) > 0) {
    const updated = await userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { proPreviewRemaining: -1 },
        $push: { proPreviewUsedAt: new Date() }
      },
      { new: true }
    );
    return updated.proPreviewRemaining;
  }
  return user ? user.proPreviewRemaining : 0;
}

/**
 * Records usage details for a user request, including token costs.
 */
export async function recordUsage(userId, modelId, inputTokens, outputTokens, toolCallsCount = 0) {
  const dateStr = new Date().toISOString().split("T")[0];
  const billingMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const model = modelsConfig[modelId];
  const provider = model ? model.provider : "Unknown";

  const total = inputTokens + outputTokens;
  const estimatedCost = calculateEstimatedCost(modelId, inputTokens, outputTokens);

  return await usageModel.findOneAndUpdate(
    { user: userId, date: dateStr, model: modelId },
    {
      $inc: {
        requests: 1,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: total,
        toolCallsCount: toolCallsCount,
        estimatedCost: estimatedCost
      },
      $setOnInsert: {
        provider: provider,
        billingPeriod: billingMonth
      }
    },
    { upsert: true, new: true }
  );
}
