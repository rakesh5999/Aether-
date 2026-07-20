import mongoose from "mongoose";
import "dotenv/config";
import userModel from "./src/models/user.model.js";
import { modelsConfig } from "./src/config/models.config.js";
import { verifyUsageAndLimits, recordUsage, getConsolidatedDailyUsage } from "./src/services/usage.service.js";
import usageModel from "./src/models/usage.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("📊 Database connected successfully for testing.");

  // 1. Setup clean test user
  const email = "test-limits@aether.ai";
  await userModel.deleteMany({ email });
  await usageModel.deleteMany({}); // clear testing usages

  const user = await userModel.create({
    username: "limitTester",
    email,
    password: "Password123!",
    verified: true,
    plan: "free"
  });
  console.log("➡️ Created test user:", user.email, "Plan:", user.plan);

  // 2. Test FREE User trying to access a PRO model (gpt-4o-mini)
  console.log("\n🧪 Test 1: Accessing Pro model with Free plan...");
  const checkProModel = await verifyUsageAndLimits(user._id, "gpt-4o-mini");
  console.log("Allowed:", checkProModel.allowed);
  console.log("Error Code:", checkProModel.error);
  console.log("Message:", checkProModel.message);
  if (!checkProModel.allowed && checkProModel.error === "UPGRADE_REQUIRED") {
    console.log("✅ Test 1 Passed: Free users are blocked from Pro models.");
  } else {
    console.log("❌ Test 1 Failed.");
  }

  // 3. Test FREE User accessing a FREE model (gemma2-9b-it)
  console.log("\n🧪 Test 2: Accessing Free model with Free plan...");
  const checkFreeModel = await verifyUsageAndLimits(user._id, "gemma2-9b-it");
  console.log("Allowed:", checkFreeModel.allowed);
  if (checkFreeModel.allowed) {
    console.log("✅ Test 2 Passed: Free users can access Free models.");
  } else {
    console.log("❌ Test 2 Failed.");
  }

  // 4. Test limits recording and enforcement
  console.log("\n🧪 Test 3: Simulating request limit hits...");
  // Let's set the test user model request limit to 2 for gemini-2.5-flash-lite temporarily
  const testModelId = "gemini-2.5-flash-lite";
  const originalLimit = modelsConfig[testModelId].dailyRequestLimit;
  modelsConfig[testModelId].dailyRequestLimit = 2; // set to 2 requests

  console.log("Logging 1st request...");
  await recordUsage(user._id, testModelId, 100, 200, 0);
  console.log("Logging 2nd request...");
  await recordUsage(user._id, testModelId, 150, 250, 1);

  console.log("Verifying limits on 3rd request...");
  const checkLimit = await verifyUsageAndLimits(user._id, testModelId);
  console.log("Allowed:", checkLimit.allowed);
  console.log("Error Code:", checkLimit.error);
  console.log("Message:", checkLimit.message);

  if (!checkLimit.allowed && checkLimit.error === "LIMIT_EXCEEDED") {
    console.log("✅ Test 3 Passed: Daily request limits enforce correctly.");
  } else {
    console.log("❌ Test 3 Failed.");
  }

  // Restore model limit
  modelsConfig[testModelId].dailyRequestLimit = originalLimit;

  // 5. Upgrade user to PRO plan and check usage limits
  console.log("\n🧪 Test 4: Upgrading user to Pro plan and testing...");
  user.plan = "pro";
  await user.save();

  const checkProModelAfterUpgrade = await verifyUsageAndLimits(user._id, "gpt-4o-mini");
  console.log("Allowed after upgrade:", checkProModelAfterUpgrade.allowed);
  if (checkProModelAfterUpgrade.allowed) {
    console.log("✅ Test 4 Passed: Upgraded user can now access Pro models.");
  } else {
    console.log("❌ Test 4 Failed.");
  }

  // 6. Consolidated usage retrieval
  console.log("\n🧪 Test 5: Retrieving consolidated usage...");
  const usageStats = await getConsolidatedDailyUsage(user._id);
  console.log("Consolidated Usage stats for gemini-2.5-flash-lite:", usageStats["gemini-2.5-flash-lite"]);
  if (usageStats["gemini-2.5-flash-lite"] && usageStats["gemini-2.5-flash-lite"].requests === 2) {
    console.log("✅ Test 5 Passed: Consolidated usage fetched successfully.");
  } else {
    console.log("❌ Test 5 Failed.");
  }

  // Clean up
  await userModel.deleteMany({ email });
  await usageModel.deleteMany({});
  console.log("\n📊 Tests completed. Test user cleaned up.");

  await mongoose.disconnect();
}

run().catch(console.error);
