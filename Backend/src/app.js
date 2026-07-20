import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";
import morgan from "morgan";
import chatRouter from "./routes/chat.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import adminRouter from "./routes/admin.route.js";

const app = express();

// Webhooks need the RAW request body buffer for signature validation.
// Hence, we register them BEFORE express.json().
app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
app.use("/api/subscription/razorpay/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/chats", chatRouter);
app.use("/api/subscription", subscriptionRouter);
app.use("/api/admin", adminRouter);

export default app;