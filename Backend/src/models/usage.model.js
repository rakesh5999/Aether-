import mongoose from "mongoose";

const usageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  date: {
    type: String, // format YYYY-MM-DD
    required: true,
    index: true
  },
  billingPeriod: {
    type: String, // format YYYY-MM
    required: true
  },
  model: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  requests: {
    type: Number,
    default: 0
  },
  inputTokens: {
    type: Number,
    default: 0
  },
  outputTokens: {
    type: Number,
    default: 0
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  toolCallsCount: {
    type: Number,
    default: 0
  },
  estimatedCost: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ensure unique entry per user per day per model to enable clean atomic increments
usageSchema.index({ user: 1, date: 1, model: 1 }, { unique: true });

const usageModel = mongoose.model("Usage", usageSchema);
export default usageModel;
