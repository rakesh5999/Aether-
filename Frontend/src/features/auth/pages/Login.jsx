import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hook/useAuth'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [unverifiedState, setUnverifiedState] = useState(null)
  const [resendStatus, setResendStatus] = useState({ loading: false, message: '', error: false })
  const [cooldown, setCooldown] = useState(0)

  const user = useSelector(state => state.auth.user)
  const loading = useSelector(state => state.auth.loading)

  const navigate = useNavigate();
  const { handleLogin, handleResendVerification } = useAuth();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errorMsg) setErrorMsg('')
    if (unverifiedState) setUnverifiedState(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMsg('')
    setUnverifiedState(null)

    try {
      await handleLogin(formData);
      navigate('/chat')
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.isUnverified) {
        setUnverifiedState({
          email: errData.email || formData.email,
          message: errData.message || 'Your email address has not been verified yet. Please check your Gmail inbox and verify your email to continue.'
        });
      } else {
        const message = errData?.message || 'Invalid email or password. Please try again.';
        setErrorMsg(message);
      }
    }
  }

  const onResendVerification = async () => {
    const targetEmail = unverifiedState?.email || formData.email;
    if (!targetEmail) return;

    setResendStatus({ loading: true, message: '', error: false });
    try {
      const res = await handleResendVerification(targetEmail);
      setResendStatus({ loading: false, message: res.message || 'Verification link sent to your Gmail inbox!', error: false });
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification email.';
      const rem = err.response?.data?.cooldownRemaining || 60;
      setResendStatus({ loading: false, message: msg, error: true });
      if (err.response?.status === 429) setCooldown(rem);
    }
  };

  if (!loading && user) {
    return <Navigate to="/chat" replace />
  }

  return (
    <div className="min-h-screen w-screen bg-white text-[#171717] font-sans grid grid-cols-1 lg:grid-cols-2 overflow-x-hidden">
      
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

        {/* Center Copy */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B2C] text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse" />
            Welcome Back
          </div>

          <h2 className="text-4xl font-black text-[#171717] tracking-tight leading-tight">
            Your Personal AI Workspace <span className="text-[#FF6B2C]">Awaits.</span>
          </h2>

          <p className="text-base text-[#6B6B6B] leading-relaxed font-medium">
            Sign in to access your saved conversations, multi-model reasoning engines, and high-performance coding tools.
          </p>

          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold text-[#171717]">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6B2C] flex items-center justify-center font-black text-xs">✓</div>
              <span>Seamless Persistent Chat Context</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-[#171717]">
              <div className="w-5 h-5 rounded-full bg-orange-100 text-[#FF6B2C] flex items-center justify-center font-black text-xs">✓</div>
              <span>Automated Smart Model Routing</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-neutral-400 font-medium">
          © {new Date().getFullYear()} Aether AI. All rights reserved.
        </div>

      </div>

      {/* RIGHT SIDE: Login Form */}
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
            Sign in to Aether AI
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6B6B6B] font-medium">
            Enter your credentials to access your workspace
          </p>
        </div>

        {unverifiedState && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium space-y-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{unverifiedState.message}</span>
            </div>

            {resendStatus.message && (
              <div className={`p-2.5 rounded-xl border ${resendStatus.error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                {resendStatus.message}
              </div>
            )}

            <button
              type="button"
              onClick={onResendVerification}
              disabled={cooldown > 0 || resendStatus.loading}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {resendStatus.loading ? 'Sending verification link...' : cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend Verification Email'}
            </button>
          </div>
        )}

        {errorMsg && !unverifiedState && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold text-neutral-600 uppercase tracking-wider">
              Gmail Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none transition-all focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 font-medium"
              placeholder="you@gmail.com"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none transition-all focus:bg-white focus:border-[#FF6B2C] focus:ring-2 focus:ring-[#FF6B2C]/20 font-medium"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B6B6B] font-medium">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-bold text-[#FF6B2C] hover:underline transition-colors">
            Create one
          </Link>
        </p>

      </div>

    </div>
  )
}

export default Login
