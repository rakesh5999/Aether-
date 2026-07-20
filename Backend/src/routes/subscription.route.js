import { Router } from "express";
import { 
  createCheckoutSession, 
  createPortalSession, 
  handleWebhook,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook
} from "../controller/subscription.controller.js";
import { authUser } from "../middleware/auth.middleware.js";

const subscriptionRouter = Router();

// Webhook routes (requires raw request body parsing, configured in app.js)
subscriptionRouter.post("/webhook", handleWebhook);
subscriptionRouter.post("/razorpay/webhook", handleRazorpayWebhook);

// Protected Stripe subscription routes
subscriptionRouter.post("/checkout", authUser, createCheckoutSession);
subscriptionRouter.post("/portal", authUser, createPortalSession);

// Protected Razorpay subscription routes
subscriptionRouter.post("/razorpay/create-order", authUser, createRazorpayOrder);
subscriptionRouter.post("/razorpay/verify-payment", authUser, verifyRazorpayPayment);

export default subscriptionRouter;
