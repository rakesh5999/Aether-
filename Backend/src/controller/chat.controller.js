import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { modelsConfig } from "../config/models.config.js";
import { verifyUsageAndLimits, recordUsage, getConsolidatedDailyUsage, decrementProPreview } from "../services/usage.service.js";
import { requestContext } from "../utils/context.js";

export async function getModelsRegistry(req, res) {
  try {
    res.status(200).json({
      success: true,
      models: modelsConfig
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch model registry", error: err.message });
  }
}

export async function getUsageStats(req, res) {
  try {
    const data = await getConsolidatedDailyUsage(req.user.id);
    res.status(200).json({
      success: true,
      usage: data.models,
      proPreviewRemaining: data.proPreviewRemaining,
      userPlan: data.userPlan
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch usage stats", error: err.message });
  }
}

export async function createChat(req, res) {
  try {
    const chat = await chatModel.create({
      user: req.user.id,
      title: "New Chat"
    });
    res.status(201).json({
      message: "Chat created successfully",
      chat
    });
  } catch (err) {
    console.error("createChat error:", err);
    res.status(500).json({ message: "Failed to create chat", error: err.message });
  }
}

export async function sendMessage(req, res) {
  const { message, chat: chatId, model, history } = req.body;
  const userId = req.user?.id;
  const targetModel = model || "auto";

  // Guest Chat logic for unauthenticated users
  if (!userId) {
    try {
      const allowedTools = ["all"];

      let formattedMessages = Array.isArray(history) && history.length > 0 ? history : [];
      formattedMessages.push({ role: "user", content: message });

      let responseObj;
      await requestContext.run({ userId: "guest", modelId: targetModel, allowedTools }, async () => {
        responseObj = await generateResponse(formattedMessages, targetModel, "free", 0);
      });

      return res.status(201).json({
        success: true,
        title: "Guest Chat",
        chat: null,
        aiMessage: {
          role: "ai",
          content: responseObj.text,
          createdAt: new Date().toISOString()
        },
        requestedModel: responseObj.requestedModel,
        actualModel: responseObj.actualModel,
        fallbackUsed: responseObj.fallbackUsed,
        fallbackReason: responseObj.fallbackReason,
        routingReason: responseObj.routingReason
      });
    } catch (guestErr) {
      console.error("Guest sendMessage error details:", guestErr.lastError || guestErr);
      return res.status(503).json({
        success: false,
        error: {
          code: guestErr.code || "AI_PROVIDER_UNAVAILABLE",
          message: "Aether is temporarily unable to respond. Please try again shortly."
        }
      });
    }
  }

  try {
    // 1. Verify model access permissions and daily usage limits
    const limitCheck = await verifyUsageAndLimits(userId, targetModel);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        success: false,
        error: limitCheck.error,
        message: limitCheck.message
      });
    }

    const { userPlan, proPreviewRemaining } = limitCheck;
    const allowedTools = ["all"];

    let title = null, chat = null;
    let activeChatId = chatId;

    if (!activeChatId) {
      title = await generateTitle(message);
      chat = await chatModel.create({
        user: userId,
        title
      });
      activeChatId = chat._id;
    } else {
      const existingChat = await chatModel.findById(activeChatId);
      const messagesCount = await messageModel.countDocuments({ chat: activeChatId });
      const hasDefaultTitle = !existingChat?.title || existingChat.title === "New Chat" || existingChat.title === "New Conversation" || existingChat.title === "Guest Chat";

      if (messagesCount === 0 || hasDefaultTitle) {
        title = await generateTitle(message);
        chat = await chatModel.findByIdAndUpdate(activeChatId, { title, updatedAt: new Date() }, { new: true });
      } else {
        chat = await chatModel.findByIdAndUpdate(activeChatId, { updatedAt: new Date() }, { new: true });
        title = chat.title;
      }
    }

    await messageModel.create({
      chat: activeChatId,
      content: message,
      role: "user"
    });

    const messages = await messageModel.find({ chat: activeChatId });

    // 2. Execute model response inside Request Context block
    let responseObj;
    await requestContext.run({ userId, modelId: targetModel, allowedTools }, async () => {
      responseObj = await generateResponse(messages, targetModel, userPlan, proPreviewRemaining);
    });

    const aiMessage = await messageModel.create({
      chat: activeChatId,
      content: responseObj.text,
      role: "ai"
    });

    // 3. Decrement Pro Preview counter if request used a Pro model under preview
    let updatedProPreviewRemaining = proPreviewRemaining;
    if (responseObj.isProPreviewEligible && userPlan !== "pro") {
      updatedProPreviewRemaining = await decrementProPreview(userId);
    }

    // 4. Increment request count and token usage
    await recordUsage(userId, responseObj.modelUsed, responseObj.inputTokens, responseObj.outputTokens, responseObj.toolCallsCount);

    res.status(201).json({
      success: true,
      title: title || (chat ? chat.title : null),
      chat: chat,
      aiMessage,
      requestedModel: responseObj.requestedModel,
      actualModel: responseObj.actualModel,
      fallbackUsed: responseObj.fallbackUsed,
      fallbackReason: responseObj.fallbackReason,
      routingReason: responseObj.routingReason,
      proPreviewRemaining: updatedProPreviewRemaining
    });
  } catch (err) {
    console.error("sendMessage error details:", err.lastError || err);
    const statusCode = err.code === "AI_PROVIDER_UNAVAILABLE" ? 503 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || "AI_PROVIDER_UNAVAILABLE",
        message: err.message || "Aether is temporarily unable to respond. Please try again shortly."
      }
    });
  }
}

export async function getChats(req, res) {
  const user = req.user;
  const chats = await chatModel.find({ user: user.id }).sort({ updatedAt: -1 });
  res.status(200).json({
    message: "Chats retrieved successfully",
    chats
  });
}

export async function getMessage(req, res) {
  const { chatId } = req.params;
  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id
  });
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const messages = await messageModel.find({ chat: chatId });
  res.status(200).json({
    message: "Messages retrieved successfully",
    messages
  });
}

export async function deleteChat(req, res) {
  const { chatId } = req.params;
  const chat = await chatModel.findOneAndDelete({
    _id: chatId,
    user: req.user.id
  });

  await messageModel.deleteMany({ chat: chatId });

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  res.status(200).json({ message: "Chat deleted successfully" });
}