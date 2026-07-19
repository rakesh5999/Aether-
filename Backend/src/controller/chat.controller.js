import { generateResponse, generateTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"
import { AIMessage } from "langchain";

export async function createChat(req, res) {
  try {
    const chat = await chatModel.create({
      user: req.user.id,
      title: "New Chat"
    })
    res.status(201).json({
      message: "Chat created successfully",
      chat
    })
  } catch (err) {
    console.error("createChat error:", err)
    res.status(500).json({ message: "Failed to create chat", error: err.message })
  }
}

export async function sendMessage(req, res) {
  const { message, chat: chatId, model } = req.body

  try {
    let title = null, chat = null
    let activeChatId = chatId

    if (!activeChatId) {
      title = await generateTitle(message)
      chat = await chatModel.create({
        user: req.user.id,
        title
      })
      activeChatId = chat._id
    } else {
      // Touch the chat to update its updatedAt timestamp
      const messagesCount = await messageModel.countDocuments({ chat: activeChatId })
      if (messagesCount === 0) {
        title = await generateTitle(message)
        chat = await chatModel.findByIdAndUpdate(activeChatId, { title, updatedAt: new Date() }, { new: true })
      } else {
        chat = await chatModel.findByIdAndUpdate(activeChatId, { updatedAt: new Date() }, { new: true })
      }
    }

    const userMessage = await messageModel.create({
      chat: activeChatId,
      content: message,
      role: "user"
    })

    const messages = await messageModel.find({ chat: activeChatId })

    const result = await generateResponse(messages, model)

    const aiMessage = await messageModel.create({
      chat: activeChatId,
      content: result,
      role: "ai"
    })

    res.status(201).json({
      title: title || (chat ? chat.title : null),
      chat: chat,
      aiMessage
    })
  } catch (err) {
    console.error("sendMessage error:", err)
    res.status(500).json({ message: "Failed to send message", error: err.message })
  }
}

export async function getChats(req, res) {
  const user = req.user

  const chats = await chatModel.find({ user: user.id }).sort({ updatedAt: -1 })

  res.status(200).json({
    message: "Chats retrieved succesfully",
    chats
  })
}

export async function getMessage(req, res) {
  const { chatId } = req.params

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id
  })
  if (!chat) {
    return res.status(404).json({
      message: "chat not found"
    })
  }

  const messages = await messageModel.find({
    chat: chatId
  })

  res.status(200).json({
    message: "messages retrieved succesfully",
    messages
  })



}

export async function deleteChat(req, res) {
  const { chatId } = req.params

  const chat = await chatModel.findOneAndDelete({
    _id: chatId,
    user: req.user.id
  })

  await messageModel.deleteMany({
    chat: chatId
  })


  if (!chat) {
    return res.status(404).json({
      message: "Chat not found"
    })
  }

  res.status(200).json({
    message: "Chat deleted Sucessfully"
  })




}