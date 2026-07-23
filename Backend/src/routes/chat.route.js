import {Router} from "express"
import { sendMessage,getChats,getMessage,deleteChat,createChat,getModelsRegistry,getUsageStats } from "../controller/chat.controller.js"
import { authUser } from "../middleware/auth.middleware.js"
import { optionalAuth } from "../middleware/optionalAuth.middleware.js"

const chatRouter = Router()

chatRouter.get("/models", optionalAuth, getModelsRegistry)
chatRouter.get("/usage", authUser, getUsageStats)

chatRouter.post("/message", optionalAuth, sendMessage)

chatRouter.post("/create",authUser,createChat)

chatRouter.get("/",authUser,getChats)

chatRouter.get("/:chatId/messages",authUser,getMessage)

chatRouter.delete("/delete/:chatId",authUser,deleteChat)

export default chatRouter


 