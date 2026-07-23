import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { createCheckoutSession, createRazorpayOrder, verifyRazorpayPayment } from "../service/subscription.api";
import { FRONTEND_PRICING_CONFIG } from "../../../config/pricing.config";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Pricing = () => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleStripeUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await createCheckoutSession();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (err) {
      console.error("Stripe error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to initiate Stripe checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setRazorpayLoading(true);
      setErrorMsg("");

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const orderData = await createRazorpayOrder();
      if (!orderData || !orderData.orderId) {
        throw new Error("Failed to create Razorpay payment order.");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Aether AI Pro",
        description: "Aether Pro Subscription",
        order_id: orderData.orderId,
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: "#2563EB",
        },
        handler: async function (response) {
          try {
            setRazorpayLoading(true);
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              window.location.href = "/settings?checkout=success";
            } else {
              setErrorMsg(verifyRes.message || "Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            setErrorMsg(verifyErr.response?.data?.message || "Payment verification failed.");
          } finally {
            setRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Razorpay checkout failed.");
      setRazorpayLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-black px-4 py-12 text-neutral-100 flex flex-col items-center justify-center font-sans overflow-x-hidden select-none">
      {/* Cybernetic ambient grid and background highlights */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />

      {/* Floating orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-delayed z-0" />

      <div className="relative w-full max-w-4xl z-10 text-center px-4">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="font-black text-xs text-white">AE</span>
            </div>
            <span className="text-sm font-bold text-neutral-450 group-hover:text-white transition-colors">Aether AI</span>
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            Choose Your AI Workspace Plan
          </h1>
          <p className="mt-3 text-sm md:text-base text-neutral-400 font-medium max-w-md mx-auto">
            Upgrade your workflows with Aether Auto smart routing, all 7 AI models, and real action tools.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-2.5 max-w-md mx-auto">
            <svg className="w-4.5 h-4.5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left max-w-3xl mx-auto">

          {/* Free Tier Card */}
          <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6 flex flex-col justify-between shadow-lg backdrop-blur-xl">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-neutral-200">Aether Free</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700/50">
                  Current
                </span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-white">$0</span>
                <span className="text-xs text-neutral-500 font-medium"> / forever</span>
              </div>

              <ul className="space-y-3.5 mb-8">
                <li className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Aether Auto basic model routing</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Access to <strong>4 Free models</strong> (Llama 3.3 70B, Gemma 2 9B, Gemini Flash/Lite)</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span><strong>5 Pro Preview Messages</strong> included</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-neutral-300">
                  <svg className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Core internet search & coding tools</span>
                </li>
              </ul>
            </div>

            <Link
              to="/"
              className="w-full text-center py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-900 transition-all cursor-pointer"
            >
              Continue with Free
            </Link>
          </div>

          {/* Pro Tier Card */}
          <div className="relative rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl border border-blue-500/30 bg-neutral-900/60 overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  Aether Pro
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
                    PRO
                  </span>
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/20">
                  Intro Offer
                </span>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-black text-white">₹96</span>
                <span className="text-xs text-neutral-400 font-semibold"> ($1) for your {FRONTEND_PRICING_CONFIG.introductoryPeriodText}</span>
                <p className="text-[11px] text-neutral-500 font-semibold mt-1">Then ₹249 ($2.99)/month automatically</p>
              </div>

              <ul className="space-y-3 mb-6">
                {FRONTEND_PRICING_CONFIG.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-[10px] text-center text-neutral-500 select-none leading-relaxed italic">
                "{FRONTEND_PRICING_CONFIG.offerHeadline}"
              </p>

              {/* Razorpay Checkout Button (UPI, Cards, NetBanking, Wallets) */}
              <button
                onClick={handleRazorpayUpgrade}
                disabled={razorpayLoading || loading || (user?.plan === "pro" && user?.subscriptionStatus === "active")}
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-extrabold tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:scale-[1.01] transition-all transform active:translate-y-0.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {razorpayLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Launching Razorpay...</span>
                  </>
                ) : (
                  <span>Pay with Razorpay (UPI / Cards / NetBanking)</span>
                )}
              </button>

              {/* Stripe Secondary Button */}
              <button
                onClick={handleStripeUpgrade}
                disabled={loading || razorpayLoading || (user?.plan === "pro" && user?.subscriptionStatus === "active")}
                className="w-full text-center py-2 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Connecting Stripe..." : "Or Pay via International Credit Card (Stripe)"}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Pricing;
