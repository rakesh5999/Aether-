import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { getUsageStats, getModelsRegistry, createPortalSession } from "../service/subscription.api";
import { FRONTEND_PRICING_CONFIG } from "../../../config/pricing.config";
import { useAuth } from "../../auth/hook/useAuth";

const Account = () => {
  const user = useSelector((state) => state.auth.user);
  const auth = useAuth();
  const [usage, setUsage] = useState(null);
  const [models, setModels] = useState(null);
  const [proPreviewRemaining, setProPreviewRemaining] = useState(5);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [usageRes, modelsRes] = await Promise.all([
          getUsageStats(),
          getModelsRegistry()
        ]);
        setUsage(usageRes.usage);
        setModels(modelsRes.models);
        if (usageRes.proPreviewRemaining !== undefined) {
          setProPreviewRemaining(usageRes.proPreviewRemaining);
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
        setErrorMsg("Failed to retrieve subscription and usage data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      setErrorMsg("");
      const res = await createPortalSession();
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Billing portal url not returned.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to launch billing portal. Please verify you have an active payment record.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    if (confirm("Are you sure you want to log out of Aether AI?")) {
      await auth.handleLogout();
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-screen bg-black text-neutral-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">Loading Account Settings...</span>
        </div>
      </div>
    );
  }

  const isPro = user?.plan === "pro";
  const renewDate = user?.currentPeriodEnd ? new Date(user.currentPeriodEnd).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : null;

  return (
    <div className="relative min-h-screen w-screen bg-black px-4 py-8 text-neutral-100 flex flex-col items-center font-sans overflow-x-hidden select-none">
      {/* Cybernetic ambient grid and background highlights */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />

      {/* Floating orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-float-delayed z-0" />

      <div className="relative w-full max-w-4xl z-10 flex flex-col gap-6 pt-4 px-4">
        {/* Navigation back to Dashboard */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 group focus:outline-none">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <span className="font-black text-xs text-white">AE</span>
            </div>
            <span className="text-sm font-bold text-neutral-450 group-hover:text-white transition-colors">Aether AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Chat
            </Link>

            <button
              onClick={handleLogoutClick}
              className="text-xs font-semibold text-neutral-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-red-900/50 bg-neutral-950 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H8.25" />
              </svg>
              Log Out
            </button>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
          Account & Subscription Settings
        </h1>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Subscription and Billing Panel */}
          <div className="md:col-span-1 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 backdrop-blur-xl shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Subscription</h2>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-400">
                Current Plan
              </span>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className={`text-lg font-black tracking-tight ${isPro ? "text-blue-400" : "text-neutral-200"}`}>
                  {isPro ? "Aether Pro" : "Free Plan"}
                </span>
                <span className="text-xs font-semibold text-neutral-500">{isPro ? FRONTEND_PRICING_CONFIG.monthlyPrice : "$0"}</span>
              </div>
            </div>

            {!isPro && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-xs text-neutral-300 flex flex-col gap-1">
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  ⚡ Pro Preview Messages
                </span>
                <p className="text-[11px] text-neutral-400">
                  You have <strong>{proPreviewRemaining}</strong> premium messages remaining on your account.
                </p>
              </div>
            )}

            {isPro ? (
              <div className="text-xs space-y-2 text-neutral-400">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-semibold text-green-400 capitalize">{user?.subscriptionStatus || "Active"}</span>
                </div>
                {renewDate && (
                  <div className="flex justify-between">
                    <span>{user?.cancelAtPeriodEnd ? "Expires on:" : "Next renewal:"}</span>
                    <span className="font-semibold text-neutral-200">{renewDate}</span>
                  </div>
                )}
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="w-full mt-3 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 text-xs font-bold text-neutral-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  {portalLoading ? "Connecting..." : "Manage Subscription"}
                </button>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                <p className="leading-relaxed mb-4">
                  Get Aether Pro for $1 for your first month. Then $2.99/month. Cancel anytime.
                </p>
                <Link
                  to="/pricing"
                  className="w-full text-center py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl shadow-md transition-all inline-block"
                >
                  Upgrade to Aether Pro
                </Link>
              </div>
            )}

            <button
              onClick={handleLogoutClick}
              className="w-full mt-2 py-2 px-3 bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/50 text-neutral-400 hover:text-red-400 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H8.25" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>

          {/* Daily Usage and Metrics Panel */}
          <div className="md:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 backdrop-blur-xl shadow-lg flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">Today's Usage Metrics</h2>

            {!usage || !models ? (
              <div className="text-xs text-neutral-500 py-6 text-center select-none">
                No usage logged for today yet. Make a request to track.
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(models).map((modelId) => {
                  const mConfig = models[modelId];
                  const mUsage = usage[modelId] || { requests: 0, totalTokens: 0 };
                  const percent = Math.min(100, Math.ceil((mUsage.requests / mConfig.dailyRequestLimit) * 100));
                  const isModelPro = mConfig.plan === "pro";

                  return (
                    <div key={modelId} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-200">{mConfig.displayName}</span>
                            {isModelPro && (
                              <span className="text-[8px] font-black tracking-widest bg-blue-600/10 text-blue-400 px-1.5 py-0.25 rounded border border-blue-900/50 uppercase">
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{mConfig.desc}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-neutral-300">{mUsage.requests}</span>
                          <span className="text-xs text-neutral-500"> / {mConfig.dailyRequestLimit} reqs</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-neutral-800/40">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-blue-500"
                            }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
