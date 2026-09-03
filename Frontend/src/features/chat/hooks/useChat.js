import { initailzeSocketConnection } from "../service/chat.socket";
import { sendMessage, getChats, getMessages, deleteChat, createChat } from "../service/chat.api";
import { setChats, setCurrentChatId, setLoading, setError, createNewChat, addNewMessages, addMessages, updateChatTitle, removeChat } from "../chat.slice";
import { useDispatch, useSelector } from "react-redux";

export const useChat = () => {

  const dispatch = useDispatch()
  const chats = useSelector((state) => state.chat.chats)

  async function handleSendMessage({ message, chatId, model, history }) {
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
      const data = await sendMessage({ message, chatId, model, history })
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

      return data;
    } catch (error) {
      const apiErr = error.response?.data;
      const safeMessage = apiErr?.error?.message || apiErr?.message || "Aether is temporarily unable to respond. Please try again shortly.";

      if (apiErr?.error?.code === "AI_PROVIDER_UNAVAILABLE" || error.response?.status === 503) {
        dispatch(addNewMessages({
          chatId,
          content: `⚠️ ${safeMessage}`,
          role: "ai"
        }));
      }

      dispatch(setError(safeMessage));
      throw error;
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
      const { chats: fetchedChats } = data
      // Merge fetched chat metadata with existing Redux state to preserve loaded messages
      dispatch(setChats(fetchedChats.reduce((acc, chat) => {
        acc[chat._id] = {
          id: chat._id,
          title: chat.title,
          // Preserve already-loaded messages if they exist in current state
          messages: chats[chat._id]?.messages || [],
          lastUpdated: chat.updatedAt
        }
        return acc
      }, {})))
    } catch (error) {
      if (error.response?.status !== 401) {
        dispatch(setError(error.message))
      }
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
      // Remove deleted chat from state directly — avoids re-fetching which wipes all loaded messages
      dispatch(removeChat(chatId))
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

