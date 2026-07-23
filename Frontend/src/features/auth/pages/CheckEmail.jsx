import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router';
import { useAuth } from '../hook/useAuth';

const CheckEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleResendVerification } = useAuth();

  const registeredEmail = location.state?.email || localStorage.getItem('aether_pending_email') || 'your Gmail inbox';

  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState({ loading: false, message: '', isError: false });

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const onResendClick = async () => {
    if (cooldown > 0 || resendStatus.loading) return;

    setResendStatus({ loading: true, message: '', isError: false });
    try {
      const targetEmail = location.state?.email || localStorage.getItem('aether_pending_email');
      if (!targetEmail) {
        setResendStatus({ loading: false, message: 'Please enter your email on the login page to resend.', isError: true });
        return;
      }

      const res = await handleResendVerification(targetEmail);
      setResendStatus({ loading: false, message: res.message || 'Verification link sent to your Gmail inbox!', isError: false });
      setCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend verification email. Please try again.';
      const remSeconds = err.response?.data?.cooldownRemaining || 60;
      setResendStatus({ loading: false, message: msg, isError: true });
      if (err.response?.status === 429) {
        setCooldown(remSeconds);
      }
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FAFAF8] px-4 py-8 text-[#171717] flex items-center justify-center font-sans overflow-x-hidden select-none">
      
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#EAEAEA] p-8 shadow-lg text-center space-y-6">

        {/* Orange Email Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6B2C] shadow-2xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171717] tracking-tight">
            Check your inbox
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#6B6B6B] font-medium leading-relaxed">
            We&apos;ve sent a verification link to your Gmail address:
          </p>
          <div className="mt-3 py-2.5 px-3 rounded-xl bg-orange-50 border border-orange-200 text-[#FF6B2C] font-bold text-sm break-all">
            {registeredEmail}
          </div>
        </div>

        <p className="text-xs text-neutral-500 leading-relaxed font-medium">
          Please open your Gmail inbox and click the link to activate your Aether AI account.
        </p>

        {/* Spam Alert Notice */}
        <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-orange-200 text-[#C2410C] text-xs text-left flex items-start gap-2.5">
          <svg className="w-4 h-4 flex-shrink-0 text-[#FF6B2C] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="block font-bold text-[#9A3412]">Can&apos;t find the email?</strong>
            Check your <span className="underline decoration-[#FF6B2C]">Spam / Junk</span> folder or confirm that your Gmail address was entered correctly.
          </div>
        </div>

        {resendStatus.message && (
          <div className={`p-3 rounded-xl border text-xs font-semibold ${resendStatus.isError ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {resendStatus.message}
          </div>
        )}

        {/* Resend Button with Cooldown */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onResendClick}
            disabled={cooldown > 0 || resendStatus.loading}
            className="w-full rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-bold py-3 px-4 text-xs transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {resendStatus.loading ? (
              <span>Sending email...</span>
            ) : cooldown > 0 ? (
              <span>Resend email in {cooldown}s</span>
            ) : (
              <span>Resend Verification Email</span>
            )}
          </button>

          <Link
            to="/login"
            className="block text-center text-xs font-bold text-[#FF6B2C] hover:underline transition-colors pt-1"
          >
            Verified your email? Back to Sign In
          </Link>
        </div>

      </div>

    </div>
  );
};

export default CheckEmail;
