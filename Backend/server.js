import app from "./src/app.js";
import "dotenv/config";
import http from "http"
import connectDB from "./src/config/database.js";
import { initSocket } from "./src/sockets/server.socket.js";

const PORT = process.env.PORT || 3000;

const httpServer= http.createServer(app)

initSocket(httpServer)

connectDB()

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});