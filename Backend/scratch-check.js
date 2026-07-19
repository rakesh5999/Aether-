import mongoose from "mongoose";
import "dotenv/config";
import userModel from "./src/models/user.model.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Database connected");

  const existingUser = await userModel.findOne({ email: "test@aether.ai" });
  if (existingUser) {
    existingUser.verified = true;
    // Keep password simple, if we update it let's make sure it's correct
    // Let's set password directly to "Password123!" using standard save (will hash via pre-save)
    existingUser.password = "Password123!";
    await existingUser.save();
    console.log("Updated existing test user to verified and reset password");
  } else {
    await userModel.create({
      username: "testuser",
      email: "test@aether.ai",
      password: "Password123!",
      verified: true
    });
    console.log("Created verified test user");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
