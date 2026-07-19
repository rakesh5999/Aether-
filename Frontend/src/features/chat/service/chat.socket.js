import { io } from "socket.io-client";

export const initailzeSocketConnection = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
  const socket = io(BACKEND_URL, {
    withCredentials: true,
  })

  socket.on("connect", () => {
    console.log("Connected to Socket.IO server")
  })

  socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server")
  })

  return socket
}