import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

async function testOrderCreation() {
  console.log("=========================================");
  console.log("🧪 TESTING FRESH RAZORPAY KEYS");
  console.log("=========================================\n");

  console.log("   Key ID:", process.env.RAZORPAY_KEY_ID);

  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: 8500, // ₹85 ($1 intro)
    currency: "INR",
    receipt: `rcpt_test_${Date.now().toString().slice(-6)}`,
    notes: {
      userId: "60d0fe4f5311236168a109ca",
      useIntroOffer: "true"
    }
  };

  const order = await instance.orders.create(options);
  console.log("✅ FRESH KEY ORDER CREATION SUCCESSFUL!");
  console.log("   Order ID:", order.id);
  console.log("   Amount:  ", order.amount, order.currency);
  console.log("   Status:  ", order.status);

  console.assert(order.id && order.id.startsWith("order_"), "Order ID must start with order_");
}

testOrderCreation().catch((err) => {
  console.error("❌ Order Creation Failed:", err.message || err);
  process.exit(1);
});
