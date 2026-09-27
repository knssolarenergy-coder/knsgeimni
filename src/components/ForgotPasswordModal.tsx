import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Inbox,
  Loader2,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { ResendService } from '../services/resendService';
import { AuthAccount } from '../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  // Step: 1 = Identifier, 2 = Verify OTP from Email, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState('');
  const [targetAccount, setTargetAccount] = useState<AuthAccount | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [verifiedTokenId, setVerifiedTokenId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSandboxRelayed, setIsSandboxRelayed] = useState(false);

  // Reset modal state when closed or opened
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIdentifier('');
      setTargetAccount(null);
      setMaskedEmail('');
      setOtpCodeInput('');
      setVerifiedTokenId('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setStatusFeedback('');
      setResendCooldown(0);
      setIsSandboxRelayed(false);
    }
  }, [isOpen]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Find Account and Send OTP exclusively to user's email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusFeedback('');

    const cleanInput = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    if (!cleanInput) {
      setErrorMsg('Please enter your registered email, username, or phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const accounts = StorageService.getAccounts();
      const matched = accounts.find((a) => {
        const emailMatch = a.email.toLowerCase() === cleanInput;
        const userMatch = !!(a.username && a.username.toLowerCase() === cleanInput);
        const aDigits = (a.phone || '').replace(/\D/g, '');
        const phoneMatch =
          cleanDigits.length >= 7 &&
          (aDigits === cleanDigits ||
            (cleanDigits.length >= 10 && aDigits.endsWith(cleanDigits.slice(-10))) ||
            (aDigits.length >= 10 && cleanDigits.endsWith(aDigits.slice(-10))));
        return emailMatch || userMatch || phoneMatch;
      });

      let matchedAccount: AuthAccount | null = matched || null;
      if (!matchedAccount) {
        // Fallback check against central database
        try {
          const dbUser = await ResendService.findUserByIdentifier(cleanInput, cleanDigits);
          if (dbUser) {
            matchedAccount = dbUser;
          }
        } catch (_) {}
      }

      if (!matchedAccount) {
        setErrorMsg('No registered account found with this email or phone number.');
        setIsLoading(false);
        return;
      }

      setTargetAccount(matchedAccount);

      // Call Email OTP service - delivers strictly to real inbox
      const res = await ResendService.sendPasswordResetOtp(
        matchedAccount.email,
        matchedAccount.name || 'User',
        matchedAccount.id
      );

      if (!res.success) {
        setErrorMsg(res.message);
        setIsLoading(false);
        return;
      }

      setMaskedEmail(res.maskedEmail || ResendService.maskEmail(matchedAccount.email));
      setStatusFeedback(res.message);
      setIsSandboxRelayed(!!res.sandboxRelayed);
      setStep(2);
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP Code against database
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEntered = otpCodeInput.trim();
    if (!cleanEntered || cleanEntered.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code from your email.');
      return;
    }

    if (!targetAccount) {
      setErrorMsg('Session expired. Please restart the reset process.');
      setStep(1);
      return;
    }

    setIsLoading(true);

    try {
      const verifyRes = await ResendService.verifyOtpCode(
        targetAccount.id,
        cleanEntered,
        targetAccount.email
      );
      if (!verifyRes.success) {
        setErrorMsg(verifyRes.message);
        setIsLoading(false);
        return;
      }

      setVerifiedTokenId(verifyRes.tokenId || '');
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to verify verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set and Save New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!targetAccount) return;

    setIsLoading(true);

    try {
      // 1. Update in Central Cloud Database (PostgreSQL) and invalidate used token
      await ResendService.resetPasswordInNeon(
        targetAccount.id,
        newPassword.trim(),
        verifiedTokenId,
        targetAccount.email
      );

      // 2. Update in Local Storage & Firestore
      StorageService.resetAccountPassword(targetAccount.id, newPassword.trim());

      setStep(4);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP strictly to email
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !targetAccount || isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await ResendService.sendPasswordResetOtp(
        targetAccount.email,
        targetAccount.name,
        targetAccount.id
      );
      if (res.success) {
        setStatusFeedback(res.message);
        setResendCooldown(60);
      } else {
        setErrorMsg(res.message);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#041525] via-[#092b45] to-[#041525] text-white p-4 flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">Reset Password</h3>
              <p className="text-[10px] text-slate-300 font-medium">K&amp;S Solar Energy · Commercial Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 text-xs">
          {errorMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 font-semibold ${
                errorMsg.includes('403') || errorMsg.includes('Sandbox')
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorMsg.includes('403') || errorMsg.includes('Sandbox')
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              />
              <div className="space-y-1">
                <span className="leading-snug block">{errorMsg}</span>
                {errorMsg.includes('403') && (
                  <p className="text-[10px] text-amber-800 font-normal leading-relaxed mt-1 border-t border-amber-200/80 pt-1">
                    💡 <strong>Quick Test Note:</strong> Testing ke liye apna registered email <code className="font-bold underline">knssolarenergy43@gmail.com</code> enter karein — code foran aapke inbox mein aa jayega.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: ENTER REGISTERED EMAIL                            */}
          {/* ======================================================== */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-3.5">
              <div className="text-center space-y-1 py-1">
                <p className="text-xs font-bold text-slate-800">Forgot your password?</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Enter your registered email address. A 6-digit verification code will be delivered directly to your inbox.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Registered Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. yousafkhan6323@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: VERIFY OTP CODE RECEIVED ON EMAIL                 */}
          {/* ======================================================== */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verification Code Dispatched</span>
                </div>
                <h4 className="text-xs font-black text-slate-900">Check Your Email Inbox</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed px-2">
                  We have sent a 6-digit verification code to{' '}
                  <strong className="text-slate-900 font-extrabold">{maskedEmail}</strong>.
                </p>
                {isSandboxRelayed && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[10px] text-left leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-950">
                      <span>💡</span>
                      <span>Development Notice:</span>
                    </div>
                    <p>
                      Your verification OTP code has been delivered to your testing inbox (<strong className="font-bold underline text-amber-950">knssolarenergy43@gmail.com</strong>). Please check your email and enter the code below.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 border border-cyan-200 text-cyan-800 flex items-center justify-center shrink-0">
                  <Inbox className="w-5 h-5 text-[#0096aa]" />
                </div>
                <div className="text-[11px] text-slate-600 leading-tight">
                  <span className="font-bold text-slate-800">Check Your Email Inbox:</span>
                  <br />
                  If the email does not arrive in your Primary inbox, please check your <strong>Spam / Junk folder</strong>.
                </div>
              </div>

              {statusFeedback && !isSandboxRelayed && (
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-[11px] font-medium text-center">
                  {statusFeedback}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 text-center">
                  Enter 6-Digit Code from Email:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center font-mono text-2xl tracking-[0.35em] font-black py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCodeInput.trim().length < 6}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-[11px] text-amber-700 font-bold hover:underline disabled:text-slate-400 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend Code in ${resendCooldown}s`
                      : 'Resend Code to Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 3: ENTER NEW PASSWORD                               */}
          {/* ======================================================== */}
          {step === 3 && (
            <form onSubmit={handleSetNewPassword} className="space-y-3.5">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Code Verified</span>
                </div>
                <h4 className="text-xs font-black text-slate-900">Set New Password</h4>
                <p className="text-[11px] text-slate-500">
                  Create a secure new password for <strong>{targetAccount?.email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  New Password (minimum 6 characters):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Confirm New Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 4: SUCCESS CONFIRMATION                             */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="text-center space-y-3.5 py-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900">Password Reset Successful!</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully updated in the central database. You can now log in using your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onSuccessLogin && targetAccount) {
                    onSuccessLogin(targetAccount.email);
                  }
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold active:scale-95 transition cursor-pointer shadow-md"
              >
                Log In With New Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
