import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { FRONTEND_PRICING_CONFIG } from '../../../config/pricing.config';

const LandingPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-neutral-100 font-sans overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0 opacity-60" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="fixed top-1/3 -right-40 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-delayed z-0" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-blue-900/30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black border border-blue-500/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform">
              <span className="text-base font-black tracking-wider text-blue-400">AE</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              Aether AI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-400 transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('registration-notice')} className="hover:text-blue-400 transition-colors cursor-pointer text-blue-400 font-bold">
              Notice
            </button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-400 transition-colors cursor-pointer">
              Pricing
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-blue-400 transition-colors cursor-pointer">
              How It Works
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/chat')}
                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2 px-4 text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 transition-all"
                >
                  Sign Up
                </Link>
                <button
                  onClick={() => navigate('/chat')}
                  className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-2 px-4 text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Start Chatting
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => navigate('/chat')}
              className="rounded-lg bg-blue-600 text-white text-xs font-bold px-3 py-1.5"
            >
              Chat Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-blue-900/40 bg-neutral-950/95 backdrop-blur-xl px-4 py-4 space-y-3 text-sm">
            <button onClick={() => scrollToSection('features')} className="block w-full text-left py-1.5 text-neutral-300">Features</button>
            <button onClick={() => scrollToSection('registration-notice')} className="block w-full text-left py-1.5 text-blue-400 font-bold">Registration Notice</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-1.5 text-neutral-300">Pricing</button>
            <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left py-1.5 text-neutral-300">How It Works</button>
            <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
              <Link to="/login" className="text-center py-2 text-neutral-300 border border-neutral-800 rounded-xl">Sign In</Link>
              <Link to="/register" className="text-center py-2 text-blue-400 border border-blue-500/40 bg-blue-950/40 rounded-xl">Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/40 bg-blue-950/40 text-blue-300 text-xs font-semibold tracking-wide mb-6 animate-pulse">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
            Next-Generation AI Intelligence Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            Build & Code Faster with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Aether AI
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg lg:text-xl text-neutral-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Your unified intelligent AI assistant. Harness multi-model power (GPT-4o Mini, Mistral Large, Llama 3.3 70B, Gemma 2 9B), real-time web search, and automated smart routing in one seamless workspace.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => navigate('/chat')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Chatting Now</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            <button
              onClick={() => scrollToSection('pricing')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-blue-500/30 text-neutral-200 font-semibold text-sm transition-all cursor-pointer"
            >
              Explore Plans
            </button>
          </div>

          {/* Guest prompt info highlight */}
          <p className="mt-4 text-xs text-neutral-400">
            ⚡ Try <strong className="text-blue-400">3 free guest prompts</strong> instantly without signing in!
          </p>

          {/* HIGH-VISIBILITY REGISTRATION NOTICE */}
          <div id="registration-notice" className="mt-10 max-w-3xl mx-auto p-5 md:p-6 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-950/80 border-2 border-blue-500/60 text-left shadow-[0_0_30px_rgba(37,99,235,0.35)] relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 px-3.5 py-1 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-bl-xl shadow-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              Registration Notice
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-900/60 border border-blue-400/50 text-blue-300 flex-shrink-0 shadow-inner mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1.5 pr-16">
                <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Registration Notice</span>
                </h4>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                  <strong className="text-blue-300 font-bold">Important:</strong> To create an Aether AI account, you must use a real and active <span className="font-extrabold text-cyan-300 underline decoration-cyan-400/60 underline-offset-4">@gmail.com</span> address. After registration, we will send a verification email to your Gmail inbox. You must verify your email before you can fully access your account.
                </p>
              </div>
            </div>
          </div>

        </section>


        {/* WHAT IS AETHER AI */}
        <section id="what-is-aether" className="py-16 md:py-20 border-t border-neutral-900 bg-neutral-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Architected For Builders</h2>
              <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                What is Aether AI?
              </h3>
              <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed">
                Aether AI is a state-of-the-art coding and reasoning assistant that brings together world-class open-source and proprietary AI models into a single, unified interface. Whether you need fast auto-routing, complex reasoning, live internet web search, or code generation, Aether AI handles it effortlessly.
              </p>
            </div>

            {/* Core Pillars */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-6 border border-blue-500/20 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold mb-4">
                  01
                </div>
                <h4 className="text-lg font-bold text-white">Smart Model Auto-Routing</h4>
                <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Our Aether Auto engine dynamically inspects your query and routes it to the fastest, most effective AI model automatically.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-blue-500/20 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold mb-4">
                  02
                </div>
                <h4 className="text-lg font-bold text-white">Real-Time Web Diagnostics</h4>
                <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Connect AI reasoning with live web search to reference up-to-date documentation, API references, and real-time internet data.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-blue-500/20 shadow-md">
                <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold mb-4">
                  03
                </div>
                <h4 className="text-lg font-bold text-white">Pro Model Preview Access</h4>
                <p className="mt-2 text-xs md:text-sm text-neutral-400 leading-relaxed">
                  Free account holders get generous preview access to industry-standard models like GPT-4o Mini and Mistral Large.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* FEATURES & CAPABILITIES */}
        <section id="features" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Capabilities</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything You Need in an AI Assistant
            </h3>
            <p className="mt-3 text-sm text-neutral-400">
              Designed to optimize productivity, provide accurate code explanations, and maintain seamless conversation context.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-blue-900/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Multi-Model Engine</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Switch effortlessly between Google Gemini, OpenAI GPT-4o Mini, Mistral Small/Large, Llama 3.3 70B, and Gemma 2 9B.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-indigo-900/30 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Live Web Search Integration</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Instantly fetch latest web results and external knowledge sources directly into your chat workflow.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-purple-900/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Groq & Fast Inference</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Powered by high-throughput LPU inference for lighting-fast response latency on Llama 3.3 70B and Gemma 2 9B.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-amber-900/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Gmail Account Security</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Strict mandatory email verification ensuring valid account registration, spam prevention, and secure user data.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-emerald-900/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Persistent Chat History</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Save, resume, rename, and manage your previous coding conversations seamlessly across sessions.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 hover:border-blue-500/40 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-cyan-900/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-white">Transparent Pro Pricing</h4>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Affordable Pro subscription ($2.99/mo with $1 intro month offer) giving you high daily request ceilings and full model access.
              </p>
            </div>

          </div>
        </section>





        {/* PRICING & COMPARISON */}
        <section id="pricing" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pricing Plans</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Simple, Transparent Pricing
            </h3>
            <p className="mt-3 text-sm text-neutral-400">
              Start with 3 free guest prompts, register for Free plan, or upgrade to Pro for full multi-model access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

            {/* Free Plan Card */}
            <div className="rounded-3xl border border-neutral-800 bg-neutral-950/80 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">Free Plan</h4>
                <p className="mt-1 text-xs text-neutral-400">Perfect for exploring and lightweight tasks</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-neutral-400">/ forever</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-neutral-300">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    3 Guest Prompts without logging in
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Access to all Free Models (Aether Auto, Gemini, Llama, Gemma)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    5 Pro Preview Messages
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    Live Web Search
                  </li>
                  <li className="flex items-center gap-2 text-neutral-500 line-through">
                    Unlimited Pro Model Access
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/chat')}
                className="mt-8 w-full rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 text-xs transition-colors cursor-pointer"
              >
                Try Free Chat
              </button>
            </div>

            {/* Pro Plan Card */}
            <div className="relative rounded-3xl border-2 border-blue-500 bg-neutral-950 p-6 md:p-8 flex flex-col justify-between shadow-[0_0_40px_rgba(37,99,235,0.25)]">
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                Most Popular
              </div>

              <div>
                <h4 className="text-xl font-bold text-white">Pro Plan</h4>
                <p className="mt-1 text-xs text-neutral-400">Full power for software engineers & power users</p>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-blue-400">{FRONTEND_PRICING_CONFIG.introductoryPrice}</span>
                  <span className="text-xs text-neutral-400">{FRONTEND_PRICING_CONFIG.introductoryPeriodText}, then {FRONTEND_PRICING_CONFIG.monthlyPrice}/mo</span>
                </div>

                <div className="mt-2 p-2 rounded-lg bg-blue-950/50 border border-blue-500/30 text-[11px] text-blue-300">
                  🔥 Early supporter introductory rate! Cancel anytime.
                </div>

                <ul className="mt-6 space-y-3 text-xs text-neutral-300">
                  {FRONTEND_PRICING_CONFIG.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => navigate('/pricing')}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold py-3 text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>

          </div>
        </section>


        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 md:py-20 border-t border-neutral-900 bg-neutral-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Workflow</h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How Aether AI Works
            </h3>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-neutral-800 bg-black/60">
                <div className="h-12 w-12 rounded-2xl bg-blue-950 border border-blue-500/40 text-blue-400 font-black text-lg flex items-center justify-center mb-4">
                  1
                </div>
                <h4 className="text-base font-bold text-white">Enter Prompt or Code Problem</h4>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Start chatting as a guest immediately or log in with your verified Gmail account.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-neutral-800 bg-black/60">
                <div className="h-12 w-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 font-black text-lg flex items-center justify-center mb-4">
                  2
                </div>
                <h4 className="text-base font-bold text-white">Smart Engine Processing</h4>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Aether Auto evaluates model suitability, executes internet web search if needed, and streams the answer.
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-neutral-800 bg-black/60">
                <div className="h-12 w-12 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-black text-lg flex items-center justify-center mb-4">
                  3
                </div>
                <h4 className="text-base font-bold text-white">Iterate & Solution Delivery</h4>
                <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                  Copy formatted code snippets, inspect reasoning logs, and store conversation history.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* FINAL CTA */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card rounded-3xl border border-blue-500/30 p-8 md:p-12 shadow-[0_0_60px_rgba(37,99,235,0.2)]">
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Ready to Experience Next-Gen AI?
            </h3>
            <p className="mt-3 text-sm text-neutral-300 max-w-2xl mx-auto">
              Start chatting instantly as a guest or create your account using your active Gmail address.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/chat')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer text-sm"
              >
                Launch Aether Chatbot
              </button>
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 font-bold text-sm transition-all"
              >
                Register with Gmail
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-900 bg-black py-10 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
              AE
            </div>
            <span className="font-bold text-neutral-300">Aether AI Platform</span>
          </div>

          <p>© {new Date().getFullYear()} Aether AI. All rights reserved.</p>

          <div className="flex items-center gap-4 text-neutral-400">
            <Link to="/chat" className="hover:text-white transition-colors">Chat</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
