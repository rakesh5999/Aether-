import {Router} from "express"
import { sendMessage,getChats,getMessage,deleteChat,createChat,getModelsRegistry,getUsageStats } from "../controller/chat.controller.js"
import { authUser } from "../middleware/auth.middleware.js"

const chatRouter = Router()

chatRouter.get("/models", authUser, getModelsRegistry)
chatRouter.get("/usage", authUser, getUsageStats)

chatRouter.post("/message",authUser,sendMessage)

chatRouter.post("/create",authUser,createChat)

chatRouter.get("/",authUser,getChats)

chatRouter.get("/:chatId/messages",authUser,getMessage)

chatRouter.delete("/delete/:chatId",authUser,deleteChat)

export default chatRouter


 