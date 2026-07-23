import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { useAuth } from '../hook/useAuth';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { handleVerifyEmail, handleResendVerification } = useAuth();

  const [status, setStatus] = useState({
    loading: true,
    success: false,
    message: '',
    email: '',
    expired: false
  });

  const [resendEmailInput, setResendEmailInput] = useState('');
  const [resendStatus, setResendStatus] = useState({ loading: false, message: '', error: false });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!token) {
      setStatus({
        loading: false,
        success: false,
        message: 'No verification token provided. Please check the link in your email.',
        email: '',
        expired: false
      });
      return;
    }

    const verify = async () => {
      try {
        const data = await handleVerifyEmail(token);
        setStatus({
          loading: false,
          success: true,
          message: data.message || 'Email verified successfully!',
          email: '',
          expired: false
        });
      } catch (err) {
        const errorData = err.response?.data;
        setStatus({
          loading: false,
          success: false,
          message: errorData?.message || 'Invalid or expired verification link.',
          email: errorData?.email || '',
          expired: !!errorData?.expired
        });
        if (errorData?.email) {
          setResendEmailInput(errorData.email);
        }
      }
    };

    verify();
  }, [token]);

  const onResendClick = async () => {
    const emailToUse = resendEmailInput || localStorage.getItem('aether_pending_email');
    if (!emailToUse) {
      setResendStatus({ loading: false, message: 'Please enter your Gmail address.', error: true });
      return;
    }

    setResendStatus({ loading: true, message: '', error: false });
    try {
      const res = await handleResendVerification(emailToUse);
      setResendStatus({ loading: false, message: res.message || 'New verification email sent!', error: false });
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification email.';
      const rem = err.response?.data?.cooldownRemaining || 60;
      setResendStatus({ loading: false, message: msg, error: true });
      if (err.response?.status === 429) setCooldown(rem);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FAFAF8] px-4 py-8 text-[#171717] flex items-center justify-center font-sans overflow-x-hidden select-none">
      
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EAEAEA] p-8 shadow-lg text-center">

        {status.loading ? (
          <div className="py-8 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6B2C]">
              <svg className="animate-spin h-7 w-7 text-[#FF6B2C]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-[#171717]">Verifying Email...</h2>
            <p className="text-xs text-[#6B6B6B]">Please wait while we validate your verification token.</p>
          </div>
        ) : status.success ? (
          <div className="py-4 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-emerald-600">
              Email Verified!
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] font-medium leading-relaxed">
              {status.message}
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="w-full inline-block rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold py-3 px-6 text-xs transition-all shadow-xs"
              >
                Sign In to Aether AI
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-amber-800">
              Verification Failed
            </h2>
            <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed font-medium">
              {status.message}
            </p>

            <div className="pt-4 text-left space-y-3">
              <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider">
                Request New Verification Link
              </label>
              <input
                type="email"
                value={resendEmailInput}
                onChange={(e) => setResendEmailInput(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full rounded-xl border border-[#EAEAEA] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#171717] placeholder-neutral-400 outline-none focus:bg-white focus:border-[#FF6B2C]"
              />

              {resendStatus.message && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${resendStatus.error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  {resendStatus.message}
                </div>
              )}

              <button
                onClick={onResendClick}
                disabled={cooldown > 0 || resendStatus.loading}
                className="w-full rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold py-3 px-4 text-xs transition-all duration-200 shadow-xs disabled:opacity-50"
              >
                {resendStatus.loading ? 'Sending link...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send New Verification Link'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-neutral-500 hover:text-[#171717] transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default VerifyEmail;
