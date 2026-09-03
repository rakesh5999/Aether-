import userModel from "../models/user.model.js";
import usageModel from "../models/usage.model.js";
import { getProviderHealthStatus } from "../services/provider.service.js";

/**
 * Returns detailed internal analytics metrics for Beta Launch readiness and financial monitoring.
 */
export async function getAdminMetrics(req, res) {
  try {
    const adminSecret = req.headers["x-admin-secret"];
    const expectedSecret = process.env.ADMIN_SECRET_KEY || "aether_admin_secret_2026";
    
    if (adminSecret !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized admin request." });
    }

    const dateStr = new Date().toISOString().split("T")[0];

    // User counts & plan distribution
    const totalUsers = await userModel.countDocuments({});
    const proUsers = await userModel.countDocuments({ plan: "pro" });
    const freeUsers = totalUsers - proUsers;
    const conversionRate = totalUsers > 0 ? Number(((proUsers / totalUsers) * 100).toFixed(2)) : 0;

    // Daily Active Users (DAU) today
    const dauList = await usageModel.distinct("user", { date: dateStr });
    const dauCount = dauList.length;

    // Model and Provider usage breakdown today
    const usageAgg = await usageModel.aggregate([
      { $match: { date: dateStr } },
      {
        $group: {
          _id: "$model",
          provider: { $first: "$provider" },
          totalRequests: { $sum: "$requests" },
          totalInputTokens: { $sum: "$inputTokens" },
          totalOutputTokens: { $sum: "$outputTokens" },
          totalTokens: { $sum: "$totalTokens" },
          totalCostUSD: { $sum: "$estimatedCost" }
        }
      }
    ]);

    // Financial calculations
    const todayTotalCostUSD = usageAgg.reduce((acc, curr) => acc + (curr.totalCostUSD || 0), 0);
    const costPerActiveUser = dauCount > 0 ? Number((todayTotalCostUSD / dauCount).toFixed(4)) : 0;
    const costPerProSubscriber = proUsers > 0 ? Number((todayTotalCostUSD / proUsers).toFixed(4)) : 0;

    // Circuit breaker & provider health
    const providerHealth = getProviderHealthStatus();

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      userStats: {
        totalUsers,
        freeUsers,
        proUsers,
        conversionRatePercent: conversionRate,
        dauToday: dauCount
      },
      financialStats: {
        todayEstimatedCostUSD: Number(todayTotalCostUSD.toFixed(4)),
        costPerActiveUserUSD: costPerActiveUser,
        costPerProSubscriberUSD: costPerProSubscriber
      },
      modelUsageToday: usageAgg,
      providerHealth
    });
  } catch (err) {
    console.error("getAdminMetrics error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch admin metrics", error: err.message });
  }
}

import { generateResponse } from "../services/ai.service.js";
import { requestContext } from "../utils/context.js";

export async function testAllModels(req, res) {
  const modelsToTest = [
    "llama-3.3-70b-versatile",
    "gpt-4o-mini",
    "mistral-small-latest",
    "mistral-large-latest",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "auto"
  ];

  const results = {};

  for (const modelId of modelsToTest) {
    const start = Date.now();
    try {
      const messages = [{ role: "user", content: "Reply with the single word: HELLO" }];
      let response;
      await requestContext.run({ userId: "test-admin", modelId, allowedTools: ["all"] }, async () => {
        response = await generateResponse(messages, modelId, "pro", 5);
      });
      const latency = Date.now() - start;
      results[modelId] = {
        status: "ONLINE",
        actualModel: response.actualModel,
        fallbackUsed: response.fallbackUsed,
        fallbackReason: response.fallbackReason,
        latencyMs: latency,
        sampleOutput: response.text?.slice(0, 100)?.trim()
      };
    } catch (err) {
      const latency = Date.now() - start;
      results[modelId] = {
        status: "OFFLINE",
        error: err.lastError?.message || err.message,
        errorCode: err.code,
        latencyMs: latency
      };
    }
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    results
  });
}
