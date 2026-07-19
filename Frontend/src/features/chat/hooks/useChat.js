import { initailzeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages, deleteChat, createChat } from "../service/chat.api";
import { setChats, setCurrentChatId, setLoading, setError, createNewChat, addNewMessages, addMessages, updateChatTitle } from "../chat.slice";
import { useDispatch } from "react-redux";

export const useChat = () => {

  const dispatch = useDispatch()

  async function handleSendMessage({ message, chatId, model }) {
    if (!chatId) return;

    // 1. Immediately add the user's message to the UI state
    dispatch(addNewMessages({
      chatId,
      content: message,
      role: "user"
    }));

    dispatch(setLoading(true));

    try {
      // 2. Call the API (no page reload)
      const data = await sendMessage({ message, chatId, model })
      const { title, aiMessage } = data

      // 3. Automatically add the AI response when it arrives
      dispatch(addNewMessages({
        chatId,
        content: aiMessage.content,
        role: "ai"
      }));

      // 4. Update the chat title if it was generated/updated on first message
      if (title) {
        dispatch(updateChatTitle({
          chatId,
          title
        }));
      }
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleCreateNewChat() {
    dispatch(setLoading(true))
    try {
      const data = await createChat()
      const { chat } = data
      
      dispatch(createNewChat({
        chatId: chat._id,
        title: chat.title
      }))
      dispatch(setCurrentChatId(chat._id))
      return chat._id
    } catch (error) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setLoading(false))
    }
  }

  async function handleGetChats() {
    dispatch(setLoading(true))
    try {
      const data = await getChats()
      const { chats } = data
      dispatch(setChats(chats.reduce((acc, chat) => {
        acc[chat._id] = {
          id: chat._id,
          title: chat.title,
          messages: [],
          lastUpdated: chat.updatedAt
        }
        return acc
      }, {})))
    } catch (error) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setLoading(false))
    }
  }

  async function handleOpenChat(chatId) {
    dispatch(setLoading(true))
    try {
      const data = await getMessages(chatId)
      const { messages } = data
      const formattedMessages = messages.map(msg => ({
        content: msg.content,
        role: msg.role
      }))

      dispatch(addMessages({
        chatId,
        messages: formattedMessages
      }))

      dispatch(setCurrentChatId(chatId))
    } catch (error) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setLoading(false))
    }
  }

  async function handleDeleteChat(chatId) {
    dispatch(setLoading(true))
    try {
      await deleteChat(chatId)
      // Refresh the chat list after deletion
      await handleGetChats()
      dispatch(setCurrentChatId(null))
    } catch (error) {
      dispatch(setError(error.message))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return {
    initailzeSocketConnection,
    handleSendMessage,
    handleGetChats,
    handleOpenChat,
    handleCreateNewChat,
    handleDeleteChat
  }
}

