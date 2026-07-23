import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'
import { useAuth } from '../hook/useAuth'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const user = useSelector(state => state.auth.user)
  const loading = useSelector(state => state.auth.loading)

  const { handleRegister } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errorMsg) setErrorMsg('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const cleanedEmail = formData.email.trim().toLowerCase();
    if (!cleanedEmail.endsWith('@gmail.com')) {
      setErrorMsg('Please use a valid Gmail address to create your Aether AI account.');
      return;
    }

    const localPart = cleanedEmail.slice(0, -10);
    if (localPart.length < 6 || localPart.length > 30) {
      setErrorMsg('Gmail address before @gmail.com must be between 6 and 30 characters.');
      return;
    }

    if (!/^[a-z0-9.]+$/.test(localPart)) {
      setErrorMsg('Gmail address can only contain letters, numbers, and dots.');
      return;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
      setErrorMsg('Gmail address has invalid dot formatting (cannot start/end with dot or contain ..).');
      return;
    }

    try {
      const res = await handleRegister({
        ...formData,
        email: cleanedEmail
      });

      localStorage.setItem('aether_pending_email', cleanedEmail);
      setSuccessMsg('Account created successfully! Verification email sent to your inbox.');

      setTimeout(() => {
        navigate('/check-email', { state: { email: cleanedEmail } });
      }, 1000);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create account. Please check your inputs.';
      setErrorMsg(message);
    }
  }

  if (!loading && user) {
    return <Navigate to="/chat" replace />
  }

  return (
    <div className="min-h-screen w-screen bg-white text-[#171717] font-sans flex grid grid-cols-1 lg:grid-cols-2 overflow-x-hidden">
      
      {/* LEFT SIDE: Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex relative bg-[#FAFAF8] border-r border-[#EAEAEA] p-12 flex-col justify-between overflow-hidden select-none">
        
        {/* Decorative Abstract Orange Waves/Rings */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] flex items-center justify-center shadow-md">
              <span className="font-black text-sm text-white">AE</span>
            </div>
            <span className="text-xl font-black tracking-tight text-[#171717]">Aether AI</span>
          </Link>
        </div>

        {/* Center Copy & Abstract Vector Graphics */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B2C] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse" />
            AI Intelligence Workspace
          </div>

          <h2 className="text-4xl font-black text-[#171717] tracking-tight leading-tight">
            Think Smarter. Create Faster.{' '}
            <span className="text-[#FF6B2C]">Powered by Aether AI.</span>
          </h2>

          <p className="text-base text-[#6B6B6B] leading-relaxed font-medium">
            Join thousands of developers, researchers, and creators using Aether AI for multi-model reasoning, code refactoring, and live web research.
          </p>

          {/* Feature Highlights List */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold text-[#171717]">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6B2C] flex items-center justify-center font-black text-xs">✓</div>
              <span>Multi-Model AI (Gemini, Llama 3.3, Mistral, GPT-4o)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#171717]">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6B2C] flex items-center justify-center font-black text-xs">✓</div>
              <span>Low-Latency Groq LPU Hardware Acceleration</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#171717]">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6B2C] flex items-center justify-center font-black text-xs">✓</div>
              <span>Instant Live Web Search & Diagnostics</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Aether AI. All rights reserved.
        </div>

      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 max-w-md w-full mx-auto my-auto">

        {/* Mobile Logo Header */}
        <div className="lg:hidden mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mx-auto">
            <div className="w-9 h-9 rounded-xl bg-[#FF6B2C] flex items-center justify-center shadow-md">
              <span className="font-black text-xs text-white">AE</span>
            </div>
            <span className="text-xl font-black text-[#171717]">Aether AI</span>
          </Link>
        </div>

        <div className="mb-6 text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
            Create an account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6B6B6B] font-medium">
            Start building smarter with your personal AI assistant
          </p>
        </div>

        {/* Information Notice Card */}
        <div className="mb-5 p-3.5 rounded-2xl bg-[#FFF8F5] border border-orange-200 text-[#C2410C] text-xs leading-relaxed flex items-start gap-2.5">
          <svg className="w-4 h-4 flex-shrink-0 text-[#FF6B2C] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="block font-bold text-[#9A3412]">Important Notice</strong>
            Please use a valid and accessible <span className="font-bold text-[#FF6B2C]">@gmail.com</span> address. A verification link will be sent to your inbox.
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username */}
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none transition-all focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 font-medium"
              placeholder="Enter your username"
            />
          </div>

          {/* Gmail Address */}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Gmail address (@gmail.com)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none transition-all focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 font-medium"
              placeholder="your.name@gmail.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none transition-all focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 font-medium"
              placeholder="Create a password"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <span>Sign Up</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6B6B] font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#FF6B2C] hover:underline transition-colors">
            Sign in
          </Link>
        </p>

      </div>

    </div>
  )
}

export default Register
