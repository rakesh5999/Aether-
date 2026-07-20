import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "./src/models/user.model.js";

dotenv.config();

async function resetAllUsersToFree() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const result = await userModel.updateMany(
      {},
      {
        $set: {
          plan: "free",
          subscriptionStatus: "inactive",
          paymentProvider: null,
          paymentCustomerId: null,
          paymentSubscriptionId: null,
          proStartedAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          proPreviewRemaining: 5,
          introductoryOfferUsed: false
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} user(s) back to Aether Free plan with 5 Pro preview messages!`);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error resetting users:", err);
    process.exit(1);
  }
}

resetAllUsersToFree();
