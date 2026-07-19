import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,
});

export const sendMessage = async ({ message, chatId, model }) => {
  const response = await api.post("/chats/message", { message, chat: chatId, model })
  return response.data
}

export const createChat = async () => {
  const response = await api.post("/chats/create")
  return response.data
}

export const getChats = async () => {
  const response = await api.get("/chats")
  return response.data
}

export const getMessages = async (chatId) => {
  const response = await api.get(`/chats/${chatId}/messages`)
  return response.data
}

export const deleteChat = async (chatId) => {
  const response = await api.delete(`/chats/delete/${chatId}`)
  return response.data
}