import { createSlice, current } from "@reduxjs/toolkit";

const chatSlice=createSlice({
  name:'chat',
  initialState:{
    chats:{},
    currentChatId:null,
    isLoading:false,
    error:null
  },
  reducers:{
    createNewChat:(state,action)=>{
      const {chatId,title}=action.payload 
    state.chats[chatId] = {
      id: chatId,
      title,
      messages: [],
      lastUpdated: new Date().toISOString(),
    };
},
    addNewMessages:(state,action)=>{
      const {chatId,content,role}=action.payload
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          id: chatId,
          title: "New Chat",
          messages: [],
          lastUpdated: new Date().toISOString(),
        }
      }
      state.chats[chatId].messages.push({content,role})
      state.chats[chatId].lastUpdated = new Date().toISOString()
    },
    updateChatTitle:(state,action)=>{
      const {chatId,title}=action.payload
      if (state.chats[chatId]) {
        state.chats[chatId].title = title
      }
    },
    addMessages:(state,action)=>{
        const {chatId,messages}= action.payload
       if(!state.chats[chatId]) return
      state.chats[chatId].messages = messages   // replace, not push
    },
    setChats:(state,action)=>{
      state.chats=action.payload
    },
    setCurrentChatId:(state,action)=>{
      state.currentChatId=action.payload
    },
    setLoading:(state,action)=>{
      state.isLoading=action.payload
    },
    setError:(state,action)=>{
      state.error=action.payload
    }
  }
})


export const {setChats,setCurrentChatId,setLoading,setError,setMessages,createNewChat,addNewMessages,addMessages,updateChatTitle} = chatSlice.actions
export default chatSlice.reducer