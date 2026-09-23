import React, { useState } from 'react';
import {
  User,
  Gift,
  Star,
  Users,
  TrendingUp,
  CheckCircle2,
  Copy,
  Share2,
  DollarSign,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Check,
  Building2,
  Inbox,
  ShieldCheck,
  MapPin,
  ChevronDown,
  Sun,
  Zap,
  Battery,
  Award,
  FileText,
  MessageCircle,
  Search,
} from 'lucide-react';
import { CustomerWarranty, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { CITIES } from '../data/mockData';
import { WarrantyCertificateModal } from './WarrantyModals';

interface AccountScreenProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onOpenReferralModal?: () => void;
  onOpenWarrantySearch?: () => void;
  whatsappNumber?: string;
}

const INVERTER_OPTIONS = [
  'Growatt',
  'Huawei',
  'Solis',
  'Inverex',
  'GoodWe',
  'Fronius',
  'Sungrow',
  'Crown Micro',
  'Knox Solar',
  'Other',
];

export const AccountScreen: React.FC<AccountScreenProps> = ({
  user,
  onUpdateUser,
  onOpenReferralModal,
  onOpenWarrantySearch,
  whatsappNumber = '923001234567',
}) => {
  // Warranty state
  const [selectedWarrantyForCert, setSelectedWarrantyForCert] = useState<CustomerWarranty | null>(null);
  const userWarranties = StorageService.getWarrantiesByCustomer(
    user.phone || user.email || user.name
  );

  // Profile edit state
  const [fullName, setFullName] = useState(user.name || 'sunny');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '619643664');
  const [city, setCity] = useState(user.city || 'Lahore');
  const [inverterBrand, setInverterBrand] = useState(user.inverterBrand || 'Growatt');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Bank account state
  const [bankName, setBankName] = useState(user.bankName || '');
  const [accountNumber, setAccountNumber] = useState(user.bankAccountNumber || '');
  const [accountTitle, setAccountTitle] = useState(user.bankAccountTitle || '');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState(false);

  // Referral code display (split with spaces as in screenshot: "9 C F V W F")
  const referralCode = user.referralCode || '9CFVWF';
  const formattedCode = referralCode.split('').join(' ');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    const text = `Join K&S Solar Energy with my referral code ${referralCode} and earn instant bonus rewards! https://knssolar.com/join?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'K&S Solar Energy Referral',
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Referral link copied to clipboard!');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name: fullName.trim(),
      phone: phoneNumber.trim(),
      city,
      inverterBrand,
    };
    onUpdateUser(updated);
    StorageService.saveUser(updated);
    setProfileSuccessMsg('Profile updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      bankName: bankName.trim(),
      bankAccountNumber: accountNumber.trim(),
      bankAccountTitle: accountTitle.trim(),
    };
    onUpdateUser(updated);
    StorageService.saveUser(updated);
    setBankSuccessMsg('Bank account saved successfully!');
    setTimeout(() => setBankSuccessMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ text: 'Please enter your current password.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Passwords do not match.', isError: true });
      return;
    }

    // Update in stored accounts
    const accounts = StorageService.getAccounts();
    const cleanEmail = user.email.toLowerCase();
    const matchIdx = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
    if (matchIdx !== -1) {
      accounts[matchIdx].password = newPassword;
      StorageService.saveAccounts(accounts);
    }

    setPasswordMsg({ text: 'Password changed successfully!', isError: false });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3500);
  };

  // Withdrawals history from storage
  const payouts = StorageService.getPayoutRequests().filter((p) => p.userId === user.id);

  return (
    <div className="bg-[#032333] min-h-screen text-slate-800 pb-28">
      {/* Top Profile Header (Dark Teal / Cyan Gradient) */}
      <div className="pt-6 pb-6 px-4 text-center flex flex-col items-center">
        {/* Avatar Circle */}
        <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-black mb-2 shadow-inner">
          {(user.name || 'S').charAt(0).toUpperCase()}
        </div>

        {/* User Name */}
        <h1 className="text-xl font-black text-white capitalize tracking-tight">
          {user.name || 'sunny'}
        </h1>

        {/* Email */}
        <p className="text-xs text-sky-200/80 font-medium mt-0.5 mb-2.5">
          {user.email || 'yousafkahn43@gmail.com'}
        </p>

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#054d48] border border-emerald-400/30 text-emerald-300 text-[11px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Approved</span>
        </div>
      </div>

      {/* Main Body Content Cards */}
      <div className="p-4 space-y-4">
        {/* CARD 1: Referral Program (Emerald Green Card - Exactly matches Screenshot 6) */}
        <div className="bg-gradient-to-br from-[#00695c] via-[#005f53] to-[#004d40] text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white">Referral Program</h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Share your code — earn points &amp; balance
              </p>
            </div>
          </div>

          {/* 4-Grid Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Box 1: Points */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 text-center flex flex-col justify-center">
              <div className="flex items-center justify-center text-white mb-0.5">
                <Star className="w-3.5 h-3.5 fill-white/80" />
              </div>
              <div className="text-lg font-black text-white">{user.points || 0}</div>
              <div className="text-[10px] text-emerald-100 font-medium">Points</div>
            </div>

            {/* Box 2: Referrals */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 text-center flex flex-col justify-center">
              <div className="flex items-center justify-center text-white mb-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg font-black text-white">
                {StorageService.getReferrals().filter((r) => r.referrerCode === referralCode).length}
              </div>
              <div className="text-[10px] text-emerald-100 font-medium">Referrals</div>
            </div>

            {/* Box 3: Available Balance */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 text-left">
              <div className="flex items-center gap-1 text-[10px] text-emerald-100 font-medium mb-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
                <span>Available Balance</span>
              </div>
              <div className="text-sm font-black text-white">
                PKR {user.referralEarningsPkr || 0}
              </div>
              <div className="text-[9px] text-emerald-200">Ready to withdraw</div>
            </div>

            {/* Box 4: Total Received */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/10 text-left">
              <div className="flex items-center gap-1 text-[10px] text-emerald-100 font-medium mb-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>Total Received</span>
              </div>
              <div className="text-sm font-black text-white">
                PKR {user.referralWithdrawnPkr || 0}
              </div>
              <div className="text-[9px] text-emerald-200">All-time earnings</div>
            </div>
          </div>

          {/* Large Referral Code Box */}
          <div className="bg-black/15 border border-white/15 rounded-2xl p-3.5 text-center">
            <div className="text-[9px] tracking-widest uppercase font-extrabold text-emerald-200 mb-1">
              YOUR REFERRAL CODE
            </div>
            <div className="text-2xl font-black tracking-[0.25em] text-white">
              {formattedCode}
            </div>
          </div>

          {/* Action Buttons: Copy Code & Share */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyCode}
              className="py-2.5 px-3 rounded-2xl bg-white/15 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 transition text-white"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareCode}
              className="py-2.5 px-3 rounded-2xl bg-white/15 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-bold flex items-center justify-center gap-1.5 transition text-white"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Request Payment Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenReferralModal) {
                onOpenReferralModal();
              } else {
                alert('Payment withdrawal request opened! Your balance will be transferred to your registered bank account.');
              }
            }}
            className="w-full py-3 rounded-2xl bg-[#00897b] hover:bg-[#009688] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition border border-emerald-300/30"
          >
            <DollarSign className="w-4 h-4" />
            <span>Request Payment</span>
          </button>
        </div>

        {/* CARD 2: Received History (White card - Matches Screenshot 5) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Received History</h3>
              <p className="text-[11px] text-slate-500 font-medium">All payment withdrawals</p>
            </div>
          </div>

          {payouts.length === 0 ? (
            <div className="py-6 px-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                <Inbox className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h4 className="text-xs font-black text-slate-900">No payments yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-normal">
                Earn points by referring friends, then withdraw your balance here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">PKR {p.amountPkr}</p>
                    <p className="text-[10px] text-slate-500">
                      {p.paymentMethod.toUpperCase()} · {p.accountNumber}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD: Registered Equipment Warranties */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  My Equipment Warranties
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Verified system, inverter &amp; panel certificates
                </p>
              </div>
            </div>

            {onOpenWarrantySearch && (
              <button
                type="button"
                onClick={onOpenWarrantySearch}
                className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 border border-amber-200"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Invoice</span>
              </button>
            )}
          </div>

          {userWarranties.length === 0 ? (
            <div className="py-6 px-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-2.5">
                <FileText className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h4 className="text-xs font-black text-slate-900">No warranties linked yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-normal">
                Warranties issued by K&amp;S technicians appear here automatically once your installation or equipment order is completed.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {onOpenWarrantySearch && (
                  <button
                    type="button"
                    onClick={onOpenWarrantySearch}
                    className="py-2 px-3 rounded-xl bg-[#0096aa] hover:bg-[#008799] text-white text-[11px] font-bold transition"
                  >
                    Search by Invoice #
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const clean = whatsappNumber.replace(/\D/g, '');
                    window.open(
                      `https://wa.me/${clean}?text=${encodeURIComponent(
                        `Salam K&S Solar Energy, please help link my equipment warranty for ${user.name} (${user.phone}).`
                      )}`,
                      '_blank'
                    );
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Support</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {userWarranties.map((w) => {
                const expDate = new Date(w.expiryDate);
                const now = new Date();
                const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;
                const isExpiringSoon = !isExpired && diffDays <= 90;
                const diffYears = Math.floor(diffDays / 365.25);

                return (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 hover:bg-white transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                          {w.productCategory === 'solar_panel' ? (
                            <Sun className="w-4 h-4" />
                          ) : w.productCategory === 'inverter' ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Battery className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-800'
                                  : isExpiringSoon
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">#{w.id}</span>
                          </div>
                          <h4 className="font-black text-xs text-slate-900 mt-1">
                            {w.productName}
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Brand: <span className="font-bold text-slate-700">{w.brand}</span> · Invoice:{' '}
                            <span className="font-mono font-bold text-slate-700">{w.invoiceNumber}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-slate-400 text-[9px] font-bold uppercase block">Serial #</span>
                        <span className="font-mono font-bold text-slate-800">{w.serialNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] font-bold uppercase block">Valid Until</span>
                        <span className="font-bold text-emerald-700">
                          {w.expiryDate} {diffYears > 0 ? `(${diffYears} yrs left)` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="line-clamp-1">{w.coverageType}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setSelectedWarrantyForCert(w)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const clean = whatsappNumber.replace(/\D/g, '');
                          const msg = `Salam K&S Solar Energy, I need technical claim service for my registered warranty:\n• Product: ${w.productName}\n• Serial Number: ${w.serialNumber}\n• Invoice: ${w.invoiceNumber}\n• Customer: ${user.name} (${user.phone})`;
                          window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>Claim</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CARD 3: Edit Profile (White Card - Matches Screenshot 5) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Edit Profile</h3>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0096aa]/30 focus:border-[#0096aa] transition"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                  📞
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0096aa]/30 focus:border-[#0096aa] transition"
                  required
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">City</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0096aa]/30 focus:border-[#0096aa] appearance-none transition"
                >
                  <option value="">Select your city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Email Address (Locked) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                  ✉
                </span>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Inverter Brand */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Inverter Brand</label>
              <div className="relative">
                <select
                  value={inverterBrand}
                  onChange={(e) => setInverterBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0096aa]/30 focus:border-[#0096aa] appearance-none transition"
                >
                  {INVERTER_OPTIONS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[#0096aa] hover:bg-[#008799] active:scale-98 text-white font-bold text-xs shadow-xs transition mt-2"
            >
              Save Profile
            </button>
          </form>
        </div>

        {/* CARD 4: Bank Account (Matches Screenshot 4) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Bank Account</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                For receiving referral balance payments
              </p>
            </div>
          </div>

          {bankSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{bankSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveBank} className="space-y-3">
            {/* Bank Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Bank Name</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HBL, Meezan, UBL, JazzCash"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            {/* Account Number / IBAN */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Account Number / IBAN</label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                  #
                </span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 0123456789 or PK36SCBL..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            {/* Account Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Account Title</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="Account holder name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Bank Account</span>
            </button>
          </form>
        </div>

        {/* CARD 5: Change Password (Matches Screenshot 4) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Change Password</h3>
            </div>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                passwordMsg.isError
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              {passwordMsg.isError ? (
                <span>⚠️ {passwordMsg.text}</span>
              ) : (
                <span>✓ {passwordMsg.text}</span>
              )}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Current Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">New Password</label>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                  🔑
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-2xl bg-[#e53935] hover:bg-[#d32f2f] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Digital Warranty Certificate Modal */}
      {selectedWarrantyForCert && (
        <WarrantyCertificateModal
          warranty={selectedWarrantyForCert}
          onClose={() => setSelectedWarrantyForCert(null)}
          whatsappNumber={whatsappNumber}
        />
      )}
    </div>
  );
};
