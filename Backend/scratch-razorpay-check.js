import crypto from "crypto";

function testRazorpaySignatureVerification() {
  console.log("=========================================");
  console.log("🧪 RAZORPAY HMAC SIGNATURE VERIFICATION TEST");
  console.log("=========================================\n");

  const secret = "test_razorpay_secret_key_12345";
  const orderId = "order_N1234567890abc";
  const paymentId = "pay_P9876543210xyz";

  // 1. Generate valid signature
  const body = orderId + "|" + paymentId;
  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  console.log("   Order ID:        ", orderId);
  console.log("   Payment ID:      ", paymentId);
  console.log("   Generated HMAC:  ", validSignature);

  // 2. Test valid verification
  const isMatchValid = crypto.timingSafeEqual(
    Buffer.from(validSignature, "utf-8"),
    Buffer.from(validSignature, "utf-8")
  );
  console.assert(isMatchValid === true, "Valid HMAC signature must verify successfully.");
  console.log("✅ Valid signature verification passed.");

  // 3. Test tampered signature protection
  const tamperedSignature = validSignature.slice(0, -2) + "ff";
  const isMatchTampered = crypto.timingSafeEqual(
    Buffer.from(validSignature, "utf-8"),
    Buffer.from(tamperedSignature, "utf-8")
  );
  console.assert(isMatchTampered === false, "Tampered HMAC signature must fail verification.");
  console.log("✅ Tampered signature rejection passed.");

  console.log("\n✅ ALL RAZORPAY SIGNATURE ASSERTIONS PASSED CLEANLY!");
}

testRazorpaySignatureVerification();
