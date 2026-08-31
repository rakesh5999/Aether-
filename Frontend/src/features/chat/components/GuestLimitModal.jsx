import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getGuestPromptStatus, formatTimeRemaining } from '../utils/guestLimit';

const GuestLimitModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      const status = getGuestPromptStatus();
      setTimeRemaining(status.timeRemainingMs);
      if (!status.isLimitReached && status.timeRemainingMs === 0) {
        if (onClose) onClose();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-neutral-950 border border-blue-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(37,99,235,0.25)] text-center overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950/80 border border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)] animate-bounce">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Guest Prompt Limit Reached
        </h3>

        <p className="mt-3 text-xs md:text-sm text-neutral-300 leading-relaxed">
          You&apos;ve used your <strong className="text-blue-400">3 free guest prompts</strong>. Your 3 free prompts refresh automatically every <strong>24 hours</strong>.
        </p>

        {/* 24-hr Countdown Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-neutral-200 text-xs flex flex-col items-center justify-center gap-1.5 shadow-inner">
          <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Refreshes In
          </span>
          <span className="font-mono text-base font-black text-white tracking-wider bg-black/40 px-3 py-1 rounded-xl border border-blue-500/20">
            {formatTimeRemaining(timeRemaining)}
          </span>
        </div>

        {/* Gmail requirement alert */}
        <div className="mt-4 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 text-xs text-left flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Sign up for a free account with your <strong className="text-blue-300">@gmail.com</strong> to continue chatting without waiting!</span>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate('/register')}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-4 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm"
          >
            Create Free Account
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold py-2.5 px-4 text-sm transition-colors cursor-pointer"
          >
            Sign In to Existing Account
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="block w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors pt-1 cursor-pointer"
            >
              Close & Wait
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestLimitModal;

