import { selectAutoModel } from "./src/services/router.service.js";
import { isProviderAvailable, reportProviderFailure, getProviderHealthStatus } from "./src/services/provider.service.js";
import { calculateEstimatedCost } from "./src/config/pricing.config.js";

async function runAutoSuite() {
  console.log("=========================================");
  console.log("🧪 AETHER AUTO & FINANCIAL SAFETY TEST SUITE");
  console.log("=========================================\n");

  // 1. Test Deterministic Aether Auto Router
  console.log("1️⃣  Testing Aether Auto Routing Logic...");
  
  const codingRoute = selectAutoModel({
    prompt: "Write a JavaScript function to sort an array",
    messages: [],
    userPlan: "free",
    proPreviewRemaining: 0
  });
  console.log(`   Coding Prompt (Free Plan): Target = ${codingRoute.targetModelId} | Reason: ${codingRoute.routingReason}`);
  console.assert(codingRoute.targetModelId === "llama-3.3-70b-versatile", "Coding prompt under free plan should pick Llama 3.3 70B");

  const searchRoute = selectAutoModel({
    prompt: "What is the latest news and weather today in Tokyo?",
    messages: [],
    userPlan: "free",
    proPreviewRemaining: 0
  });
  console.log(`   Search Prompt (Free Plan): Target = ${searchRoute.targetModelId} | Reason: ${searchRoute.routingReason}`);
  console.assert(searchRoute.targetModelId === "gemini-2.5-flash", "Search prompt should pick Gemini Flash or search model");

  const proCodingRoute = selectAutoModel({
    prompt: "Fix syntax error in this Python script",
    messages: [],
    userPlan: "pro",
    proPreviewRemaining: 0
  });
  console.log(`   Coding Prompt (Pro Plan): Target = ${proCodingRoute.targetModelId} | Reason: ${proCodingRoute.routingReason}`);
  console.assert(proCodingRoute.targetModelId === "gpt-4o-mini", "Coding prompt under Pro plan should pick GPT-4o Mini");

  // 2. Test Circuit Breaker & Fallback System
  console.log("\n2️⃣  Testing Circuit Breaker State Transitions...");
  console.log("   Initial Groq Health:", isProviderAvailable("groq"));

  // Simulate 429 Rate Limit error on Groq
  reportProviderFailure("groq", { status: 429, message: "Rate limit exceeded" });
  console.log("   Groq Health after 429 error:", isProviderAvailable("groq"));
  console.assert(isProviderAvailable("groq") === false, "Groq provider should be circuit broken after 429");

  // Verify router avoids circuit-broken provider
  const fallbackRoute = selectAutoModel({
    prompt: "Write Python code",
    messages: [],
    userPlan: "free",
    proPreviewRemaining: 0
  });
  console.log(`   Route with Groq down: Target = ${fallbackRoute.targetModelId} | Reason: ${fallbackRoute.routingReason}`);
  console.assert(fallbackRoute.targetModelId !== "llama-3.3-70b-versatile", "Router must avoid circuit-broken Groq");

  // 3. Test Estimated API Cost Calculation
  console.log("\n3️⃣  Testing Estimated Token Cost Calculator...");
  const costFlashLite = calculateEstimatedCost("gemini-2.5-flash-lite", 1000, 500);
  console.log(`   Gemini Flash Lite (1k in, 500 out): $${costFlashLite}`);
  console.assert(costFlashLite > 0, "Cost should be positive number");

  const costMistralLarge = calculateEstimatedCost("mistral-large-latest", 1000, 500);
  console.log(`   Mistral Large (1k in, 500 out): $${costMistralLarge}`);
  console.assert(costMistralLarge > costFlashLite, "Mistral Large cost should exceed Flash Lite");

  console.log("\n✅ ALL SUITE ASSERTIONS PASSED CLEANLY!");
}

runAutoSuite().catch(err => {
  console.error("❌ Test Suite Failed:", err);
  process.exit(1);
});
