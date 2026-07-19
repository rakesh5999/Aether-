import { Server } from "socket.io"

let io;

export function initSocket(httpServer) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    }
  })

  console.log("Socket.io sever is Running");


  io.on("connection", (socket) => {
    console.log("A useer is connected" + socket.id);

  })

}

export function getIO() {
  if (!io) {
    throw new Error("Socket is not initialized")
  }
  return io
}

