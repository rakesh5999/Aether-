import Stripe from "stripe";
import Razorpay from "razorpay";
import crypto from "crypto";
import userModel from "../models/user.model.js";

let stripeInstance = null;
function getStripe() {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
    stripeInstance = new Stripe(apiKey);
  }
  return stripeInstance;
}

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates a Stripe Checkout Session for upgrading to Aether Pro.
 */
export async function createCheckoutSession(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.plan === "pro" && user.subscriptionStatus === "active") {
      return res.status(400).json({ success: false, message: "You are already subscribed to Aether Pro." });
    }

    // Ensure customer exists in Stripe
    if (!user.paymentCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.username,
        metadata: { userId: userId.toString() }
      });
      user.paymentCustomerId = customer.id;
      user.paymentProvider = "stripe";
      await user.save();
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const sessionConfig = {
      customer: user.paymentCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${frontendUrl}/settings?checkout=success`,
      cancel_url: `${frontendUrl}/pricing?checkout=cancel`,
      metadata: {
        userId: userId.toString(),
        useIntroOffer: (!user.introductoryOfferUsed).toString(),
      },
    };

    // Apply introductory coupon if offer is not used
    if (!user.introductoryOfferUsed && process.env.STRIPE_INTRO_COUPON_ID) {
      sessionConfig.discounts = [
        {
          coupon: process.env.STRIPE_INTRO_COUPON_ID,
        },
      ];
    }

    const session = await getStripe().checkout.sessions.create(sessionConfig);
    return res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("createCheckoutSession error:", error);
    return res.status(500).json({ success: false, message: "Failed to create checkout session", error: error.message });
  }
}

/**
 * Generates a secure link to the Stripe Customer Portal for managing/canceling subscriptions.
 */
export async function createPortalSession(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    
    if (user && user.paymentProvider === "razorpay") {
      return res.status(400).json({ 
        success: false, 
        message: "Your Aether Pro access was purchased as a one-time pass via Razorpay. It will not auto-renew and no further billing management is required." 
      });
    }

    if (!user || !user.paymentCustomerId) {
      return res.status(400).json({ success: false, message: "No billing profile found for this user." });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.paymentCustomerId,
      return_url: `${frontendUrl}/settings`,
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("createPortalSession error:", error);
    return res.status(500).json({ success: false, message: "Failed to create portal session", error: error.message });
  }
}

/**
 * Webhook handler to securely process async billing events sent by Stripe.
 */
export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Stripe Webhook Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const useIntroOffer = session.metadata?.useIntroOffer === "true";

        if (userId) {
          const subscriptionId = session.subscription;
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);

          const updateData = {
            plan: "pro",
            subscriptionStatus: subscription.status,
            paymentSubscriptionId: subscriptionId,
            proStartedAt: new Date(subscription.start_date * 1000),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          };

          if (useIntroOffer) {
            updateData.introductoryOfferUsed = true;
          }

          await userModel.findByIdAndUpdate(userId, updateData);
          console.log(`✅ Subscription created/unlocked for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          await userModel.findOneAndUpdate(
            { paymentSubscriptionId: subscriptionId },
            {
              plan: "pro",
              subscriptionStatus: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            }
          );
          console.log(`✅ Invoice paid & subscription renewed: ${subscriptionId}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          await userModel.findOneAndUpdate(
            { paymentSubscriptionId: subscriptionId },
            { subscriptionStatus: "past_due" }
          );
          console.log(`⚠️ Invoice payment failed for subscription: ${subscriptionId}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const updateData = {
          subscriptionStatus: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        };

        if (["canceled", "unpaid"].includes(subscription.status)) {
          updateData.plan = "free";
          updateData.paymentSubscriptionId = null;
        }

        await userModel.findOneAndUpdate(
          { paymentSubscriptionId: subscription.id },
          updateData
        );
        console.log(`ℹ️ Subscription updated: ${subscription.id} status is now ${subscription.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await userModel.findOneAndUpdate(
          { paymentSubscriptionId: subscription.id },
          {
            plan: "free",
            subscriptionStatus: "canceled",
            paymentSubscriptionId: null,
            cancelAtPeriodEnd: false,
          }
        );
        console.log(`❌ Subscription canceled and user downgraded: ${subscription.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ==========================================
// RAZORPAY INTEGRATION ENDPOINTS
// ==========================================

/**
 * Creates a server-side Razorpay Order for upgrading to Aether Pro.
 * Returns order details and public keyId (NEVER exposes keySecret).
 */
export async function createRazorpayOrder(req, res) {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID === "rzp_test_placeholder") {
      return res.status(400).json({
        success: false,
        message: "Razorpay API keys (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are missing from Backend/.env. Please add your Razorpay keys to Backend/.env."
      });
    }

    // Mode detection log
    const isLiveMode = process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_");
    console.log(`💳 Razorpay Order Creation: [${isLiveMode ? "LIVE PRODUCTION" : "TEST SANDBOX"}] Mode`);

    // Introductory offer calculation ($1 ≈ ₹96 = 9600 paisa; Regular $2.99 ≈ ₹249 = 24900 paisa)
    const isIntro = !user.introductoryOfferUsed;
    const amountPaisa = isIntro ? 9600 : 24900;

    const options = {
      amount: amountPaisa,
      currency: "INR",
      receipt: `rcpt_${userId.toString().substring(0, 8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        userId: userId.toString(),
        useIntroOffer: isIntro.toString()
      }
    };

    const order = await getRazorpay().orders.create(options);

    return res.status(200).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      user: {
        name: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("createRazorpayOrder error:", error);
    const errMsg = error.error?.description || error.message || "Failed to create Razorpay order";
    return res.status(400).json({ success: false, message: errMsg });
  }
}

/**
 * Verifies Razorpay payment HMAC SHA-256 signature server-side and unlocks Aether Pro.
 */
export async function verifyRazorpayPayment(req, res) {
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing Razorpay verification parameters." });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(razorpay_signature, "utf-8")
    );

    if (!isSignatureValid) {
      console.warn(`⚠️ Razorpay signature validation failed for user ${userId}`);
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    // Double check payment status with Razorpay API servers
    try {
      const paymentEntity = await getRazorpay().payments.fetch(razorpay_payment_id);
      if (!["captured", "authorized"].includes(paymentEntity.status)) {
        return res.status(400).json({
          success: false,
          message: `Payment status is '${paymentEntity.status}'. Aether Pro requires verified payment.`
        });
      }
    } catch (apiErr) {
      console.error("Razorpay API fetch payment error:", apiErr.message);
      return res.status(400).json({ success: false, message: "Could not verify payment status with Razorpay servers." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Activate Aether Pro plan idempotently
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days access

    user.plan = "pro";
    user.subscriptionStatus = "active";
    user.paymentProvider = "razorpay";
    user.paymentCustomerId = user.paymentCustomerId || `rzp_cust_${userId}`;
    user.paymentSubscriptionId = razorpay_payment_id;
    user.proStartedAt = user.proStartedAt || periodStart;
    user.currentPeriodStart = periodStart;
    user.currentPeriodEnd = periodEnd;
    user.cancelAtPeriodEnd = false;
    user.introductoryOfferUsed = true;

    await user.save();

    console.log(`✅ Razorpay payment verified & Aether Pro activated for user ${user._id}`);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Welcome to Aether Pro!",
      user: {
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus
      }
    });
  } catch (error) {
    console.error("verifyRazorpayPayment error:", error);
    return res.status(500).json({ success: false, message: "Razorpay payment verification failed", error: error.message });
  }
}

/**
 * Processes Razorpay Webhook events asynchronously for background payment confirmation.
 */
export async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: "Missing Razorpay webhook signature or secret." });
    }

    const rawBody = typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠️ Razorpay Webhook signature verification failed.");
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const payload = typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString())
      : req.body;

    const event = payload.event;
    console.log(`🔔 Razorpay Webhook Event Received: ${event}`);

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload.payment?.entity || payload.payload.order?.entity;
      const userId = paymentEntity?.notes?.userId;
      const paymentId = paymentEntity?.id;

      if (userId) {
        const periodStart = new Date();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await userModel.findByIdAndUpdate(userId, {
          plan: "pro",
          subscriptionStatus: "active",
          paymentProvider: "razorpay",
          paymentSubscriptionId: paymentId,
          proStartedAt: periodStart,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          introductoryOfferUsed: true
        });
        console.log(`✅ Webhook: Aether Pro activated for user ${userId}`);
      }
    } else if (event === "subscription.halted" || event === "subscription.cancelled") {
      const subEntity = payload.payload.subscription?.entity;
      const subId = subEntity?.id;
      if (subId) {
        await userModel.findOneAndUpdate(
          { paymentSubscriptionId: subId },
          { plan: "free", subscriptionStatus: "canceled" }
        );
        console.log(`❌ Webhook: User downgraded for canceled Razorpay subscription ${subId}`);
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("handleRazorpayWebhook error:", error);
    return res.status(500).json({ success: false, message: "Razorpay webhook processing error", error: error.message });
  }
}
