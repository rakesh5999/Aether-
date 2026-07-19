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
    try {
      await handleRegister(formData)
      setSuccessMsg('Account created successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create account. Please check your inputs.';
      setErrorMsg(message)
    }
  }

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="relative h-screen w-screen bg-black px-4 py-4 text-neutral-100 flex items-center justify-center font-sans overflow-hidden select-none">
      {/* Cybernetic ambient grid and background highlights */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-0" />
      
      {/* Floating orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-float-delayed z-0" />
      
      {/* Container with glowing border */}
      <div className="relative w-full max-w-md z-10 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-indigo-600/10 to-cyan-500/30 rounded-3xl blur-[2px] -z-10" />
        <div className="glass-card w-full rounded-3xl border border-blue-500/25 p-6 md:p-8 shadow-[0_0_50px_rgba(37,99,235,0.15)]">
          
          {/* Branding & Welcome Header */}
          <div className="mb-4 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-black border border-blue-500/40 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-pulse">
              <span className="text-xl font-black tracking-wider text-blue-400">AE</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
              Create account
            </h1>
            <p className="mt-1 text-xs md:text-sm text-neutral-400 font-medium leading-relaxed">
              Join us and start exploring the AI assistant
            </p>
          </div>

          {errorMsg && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2.5 animate-shake">
              <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-green-950/30 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            
            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1 block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-500/60">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-blue-900/40 bg-black/60 pl-11 pr-4 py-2 text-neutral-100 placeholder-neutral-600 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-500/60">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-blue-900/40 bg-black/60 pl-11 pr-4 py-2 text-neutral-100 placeholder-neutral-600 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-blue-500/60">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-blue-900/40 bg-black/60 pl-11 pr-4 py-2 text-neutral-100 placeholder-neutral-600 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm"
                  placeholder="Create a password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-400 text-white font-bold tracking-wide py-2.5 px-4 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs md:text-sm text-neutral-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

