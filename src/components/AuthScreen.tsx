import React, { useState } from 'react';
import {
  Sun,
  Shield,
  Wrench,
  User,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Phone,
  Gift,
  Clock,
  MessageCircle,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';
import { AuthAccount, UserProfile, UserRole } from '../types';
import { StorageService } from '../services/storage';
import { CITIES } from '../data/mockData';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  targetRole?: UserRole;
  onCancel?: () => void;
  whatsappSupport?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onCancel,
  whatsappSupport = '923280454939',
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Single Login Fields (Works for Customer, Technician, and Admin)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer Registration Fields
  const [name, setName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerCity, setRegisterCity] = useState(CITIES[1] || 'Lahore');
  const [referralCodeInput, setReferralCodeInput] = useState('');

  // Status & Feedback States
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dedicated Pending Approval State for Customer
  const [pendingApprovalAccount, setPendingApprovalAccount] = useState<{
    name: string;
    phone: string;
    email: string;
    createdAt?: string;
  } | null>(null);

  // Registration success modal awaiting approval
  const [showRegSuccessPending, setShowRegSuccessPending] = useState(false);

  // Auto-detect ?ref=... parameter
  React.useEffect(() => {
    try {
      const refParam = new URLSearchParams(window.location.search).get('ref');
      if (refParam) {
        setReferralCodeInput(refParam.toUpperCase());
        setIsRegisterMode(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Quick 1-Tap Demo Credentials
  const handleQuickFill = (type: 'customer' | 'technician' | 'admin' | 'pending') => {
    setErrorMessage('');
    setIsRegisterMode(false);
    setPendingApprovalAccount(null);
    setShowRegSuccessPending(false);

    if (type === 'admin') {
      setLoginIdentifier('admin@kssolar.pk');
      setPassword('admin123');
    } else if (type === 'technician') {
      setLoginIdentifier('usman@kssolar.pk');
      setPassword('tech123');
    } else if (type === 'pending') {
      setLoginIdentifier('taimoor@example.com');
      setPassword('user123');
    } else {
      setLoginIdentifier('ahmed@kssolar.pk');
      setPassword('user123');
    }
  };

  // WhatsApp activation request handler
  const handleContactAdminForApproval = (accName: string, accPhone: string) => {
    const cleanNum = whatsappSupport.replace(/\D/g, '');
    const message = `Salam K&S Solar Energy Admin, I registered my customer account on the app.\nName: ${accName}\nPhone: ${accPhone}\nPlease approve and activate my account. Thank you!`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Unified Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPendingApprovalAccount(null);

    if (isRegisterMode) {
      // Customer Registration
      if (!name.trim() || !registerPhone.trim() || !registerEmail.trim() || !password.trim()) {
        setErrorMessage('Please fill in all required registration fields.');
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        const res = StorageService.registerAccount(
          {
            name: name.trim(),
            email: registerEmail.trim(),
            phone: registerPhone.trim(),
            city: registerCity,
            password: password.trim(),
            role: 'customer',
          },
          referralCodeInput.trim()
        );

        setIsLoading(false);

        if (res.error) {
          setErrorMessage(res.error);
          return;
        }

        if (res.isPendingApproval && res.registeredAccount) {
          setPendingApprovalAccount({
            name: res.registeredAccount.name,
            phone: res.registeredAccount.phone,
            email: res.registeredAccount.email,
            createdAt: res.registeredAccount.createdAt,
          });
          setShowRegSuccessPending(true);
        }
      }, 400);
    } else {
      // Single Unified Login
      if (!loginIdentifier.trim() || !password.trim()) {
        setErrorMessage('Please enter your login ID (Username, Email, or Phone) and password.');
        return;
      }

      setIsLoading(true);

      setTimeout(() => {
        const res = StorageService.authenticate(loginIdentifier, password);
        setIsLoading(false);

        if (res.isPendingApproval && res.pendingAccount) {
          setPendingApprovalAccount({
            name: res.pendingAccount.name,
            phone: res.pendingAccount.phone,
            email: res.pendingAccount.email,
            createdAt: res.pendingAccount.createdAt,
          });
          return;
        }

        if (res.error) {
          if (res.error === 'ACCOUNT_SUSPENDED') {
            setErrorMessage('Account Suspended: This account is disabled. Please contact K&S Solar Support.');
          } else {
            setErrorMessage(res.error);
          }
          return;
        }

        if (res.user) {
          onLoginSuccess(res.user);
        }
      }, 350);
    }
  };

  return (
    <div className="min-h-full bg-[#05131f] text-slate-100 flex flex-col justify-center px-4 py-6">
      {/* Top Brand Logo */}
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex items-center justify-center p-2 rounded-3xl bg-gradient-to-tr from-[#0b3858] via-[#0e4b75] to-[#07243a] ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/10 mb-1">
          <img
            src="/ks-solar-logo.png"
            alt="K&S Solar Energy Pvt. Ltd"
            className="w-16 h-16 rounded-2xl object-contain bg-white p-1 shadow-md"
          />
        </div>
        <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
          <span>K&amp;S SOLAR</span>
          <span className="text-amber-400">ENERGY</span>
        </h1>
        <p className="text-[11px] text-sky-200/80 max-w-xs mx-auto">
          Pakistan's Trusted Solar Systems &amp; Maintenance Partner.
        </p>
      </div>

      {/* PENDING APPROVAL NOTIFICATION MODAL/CARD */}
      {pendingApprovalAccount && (
        <div className="mb-4 bg-gradient-to-b from-amber-500/15 to-amber-950/40 border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl text-center space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
              Verification Required • تصدیق درکار ہے
            </span>
            <h3 className="text-base font-black text-white mt-1">
              Account Pending Admin Approval
            </h3>
            <p className="text-xs font-bold text-amber-300">
              اکاؤنٹ کی منظوری زیر التواء ہے
            </p>
          </div>

          <div className="bg-[#071c2b]/90 border border-amber-400/30 rounded-2xl p-3 text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Customer Name:</span>
              <strong className="text-white capitalize">{pendingApprovalAccount.name}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Phone:</span>
              <span className="font-mono text-amber-300 font-bold">{pendingApprovalAccount.phone}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Pending Operations Review
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            آپ کا اکاؤنٹ کامیابی سے بن چکا ہے۔ سکیورٹی وجوہات کی بنا پر K&amp;S Solar ایڈمن کے تصدیق کرنے کے بعد آپ کا اکاؤنٹ ایکٹیویٹ ہو جائے گا۔ فوری منظوری کے لیے نیچے واٹس ایپ بٹن پر رابطہ کریں۔
          </p>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleContactAdminForApproval(pendingApprovalAccount.name, pendingApprovalAccount.phone)}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Admin for Instant Approval</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPendingApprovalAccount(null);
                setShowRegSuccessPending(false);
              }}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* REGISTRATION SUCCESS BANNER */}
      {showRegSuccessPending && !pendingApprovalAccount && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-black text-white">Registration Submitted!</h4>
          <p className="text-xs text-slate-300">
            Awaiting Admin Review. You will be able to login once approved.
          </p>
        </div>
      )}

      {/* Main Single Login / Registration Card */}
      {!pendingApprovalAccount && (
        <div className="bg-[#071c2b] border border-[#12446d] rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Header Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-[#123e61]">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>☼</span>
                <span>{isRegisterMode ? 'New Customer Registration' : 'Universal Sign In'}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isRegisterMode
                  ? 'Register your account. Admin will approve your access.'
                  : 'Enter your credentials. Automatic routing to your portal.'}
              </p>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#0d3450] text-sky-200 border border-[#194c73] font-mono">
              {isRegisterMode ? 'Sign Up' : 'Unified Login'}
            </span>
          </div>

          {/* Smart Notice */}
          {!isRegisterMode && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-2.5 flex items-center gap-2 text-[11px] text-sky-200">
              <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <p className="leading-tight">
                <strong>All Portals in One:</strong> Customers, Field Technicians, and Admin all sign in from this single form.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* 1. REGISTRATION FORM (Customer Only) */}
            {isRegisterMode ? (
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Full Name (پورا نام) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Muhammad Asad"
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="03001234567"
                        className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-8 pr-2 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City (شہر)</label>
                    <select
                      value={registerCity}
                      onChange={(e) => setRegisterCity(e.target.value)}
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl px-2 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email or Username <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="asad@example.com or asad12"
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Create Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-9 pr-9 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Referral Code Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>Referral Code (ریفرل کوڈ)</span>
                    </label>
                    <span className="text-[10px] text-amber-300/80 font-normal">Optional • اختیاری</span>
                  </div>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KS-7842"
                    className="w-full bg-[#0a273e] border border-amber-400/40 text-amber-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono tracking-wider font-bold"
                  />
                </div>

                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-2.5 text-[10px] text-amber-200 leading-tight">
                  ℹ️ <strong>Admin Approval Notice:</strong> After registration, K&amp;S Solar Admin will approve your account before you can log in.
                </div>
              </>
            ) : (
              /* 2. SINGLE UNIFIED LOGIN FORM */
              <>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Username, Email, or Phone Number
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. 03001234567, admin, usman"
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Password</label>
                    <span className="text-[10px] text-slate-400">
                      Secret Key
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0a273e] border border-[#144770] text-slate-100 rounded-xl pl-9 pr-9 py-2.5 text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>
                    {isRegisterMode ? 'Submit Registration for Approval' : 'Sign In / لاگ ان کریں'}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Registration */}
          <div className="pt-2 border-t border-[#123e61] flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {isRegisterMode ? 'Already registered?' : 'New Customer?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
              }}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              {isRegisterMode ? 'Sign In to Existing Account' : '+ Register New Customer Account'}
            </button>
          </div>

          {/* Quick 1-Tap Demo Credentials Bar (Demonstrates Auto-Routing & Approval) */}
          <div className="pt-2 border-t border-[#123e61] space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <KeyRound className="w-3 h-3 text-amber-400" />
                <span>1-Tap Test Accounts:</span>
              </span>
              <span className="text-[10px] text-slate-400">Auto-routes to role</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('customer')}
                className="p-2 rounded-xl bg-[#082135] hover:bg-[#0c2f4a] border border-[#144872] text-left transition active:scale-95"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                  <User className="w-3 h-3" />
                  <span>Customer (Ahmed)</span>
                </div>
                <p className="text-[9px] text-slate-300 font-mono truncate">ahmed@kssolar.pk</p>
                <p className="text-[8px] text-emerald-400 font-semibold">● Approved User</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('technician')}
                className="p-2 rounded-xl bg-[#082135] hover:bg-[#0c2f4a] border border-[#144872] text-left transition active:scale-95"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-sky-400">
                  <Wrench className="w-3 h-3" />
                  <span>Technician (Usman)</span>
                </div>
                <p className="text-[9px] text-slate-300 font-mono truncate">usman@kssolar.pk</p>
                <p className="text-[8px] text-sky-300 font-semibold">● Field Staff Portal</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="p-2 rounded-xl bg-[#082135] hover:bg-[#0c2f4a] border border-[#144872] text-left transition active:scale-95"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                  <Shield className="w-3 h-3" />
                  <span>Admin Operations</span>
                </div>
                <p className="text-[9px] text-slate-300 font-mono truncate">admin@kssolar.pk</p>
                <p className="text-[8px] text-rose-300 font-semibold">● Dispatch &amp; Approval</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('pending')}
                className="p-2 rounded-xl bg-[#082135] hover:bg-[#0c2f4a] border border-amber-500/30 text-left transition active:scale-95"
              >
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Pending Customer</span>
                </div>
                <p className="text-[9px] text-slate-300 font-mono truncate">taimoor@example.com</p>
                <p className="text-[8px] text-amber-400 font-semibold">● Tests Approval Check</p>
              </button>
            </div>
          </div>

          {/* Optional Cancel/Dismiss if user already had an active session */}
          {onCancel && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                Continue with current session
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center mt-5 text-[10px] text-slate-400 space-y-1">
        <p>K&amp;S Solar Energy (Pvt.) Ltd • Smart Solar Operations &amp; Dispatch</p>
        <p>Head Office: Bhakkar &amp; Lahore, Pakistan • 24/7 Helpline</p>
      </div>
    </div>
  );
};
