import React, { useState } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, ReferralPayoutRequest, ReferralRecord, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  settings: AppSettings;
  onUserUpdated?: (updated: UserProfile) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  onUserUpdated,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'share' | 'withdraw' | 'history'>('share');

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState<number>(settings.referral_reward_amount_pkr || 500);
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [accountTitle, setAccountTitle] = useState(user.name || '');
  const [accountNumber, setAccountNumber] = useState(user.phone?.replace(/\D/g, '') || '');
  const [bankName, setBankName] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  if (!isOpen) return null;

  const referralCode = user.referralCode || 'KS-7842';
  const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;
  const rewardAmount = settings.referral_reward_amount_pkr || 500;
  const isProgramActive = settings.referral_program_enabled;

  const totalEarnings = user.referralEarningsPkr ?? 1500;
  const totalWithdrawn = user.referralWithdrawnPkr ?? 500;
  const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

  // User's referral history
  const allReferrals = StorageService.getReferrals();
  const myReferrals = allReferrals.filter(
    (r) => r.referrerUserId === user.id || (r.referrerCode && r.referrerCode.toUpperCase() === referralCode.toUpperCase())
  );

  // User's payout requests
  const myPayouts = StorageService.getPayoutRequests().filter((p) => p.userId === user.id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `🌟 *K&S Solar Energy App — کیش انعام اور سولر سروسز!*
میری طرف سے K&S Solar Energy کی ایپ ڈاؤن لوڈ کریں اور بہترین سولر واشنگ، انورٹر وائرنگ اور سولر سسٹم انسٹالیشن پر زبردست ڈسکاؤنٹ حاصل کریں۔

🎁 *میرا ریفرل کوڈ درج کریں:* ${referralCode}
📲 *ڈاؤن لوڈ لنک:* ${shareUrl}

کے اینڈ ایس سولر انرجی (پرائیویٹ) لمیٹڈ پاکستان۔`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    if (withdrawAmount <= 0) {
      setWithdrawError('براہ کرم درست رقم درج کریں۔');
      return;
    }

    if (withdrawAmount > availableBalance) {
      setWithdrawError(`آپ کے پاس صرف PKR ${availableBalance.toLocaleString()} بیلنس دستیاب ہے۔`);
      return;
    }

    if (!accountTitle.trim() || !accountNumber.trim()) {
      setWithdrawError('اکاؤنٹ ٹائٹل اور موبائل/اکاؤنٹ نمبر درج کرنا ضروری ہے۔');
      return;
    }

    const res = StorageService.requestPayout({
      userId: user.id,
      userName: user.name,
      userPhone: user.phone,
      amountPkr: withdrawAmount,
      paymentMethod,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      bankName: paymentMethod === 'bank' ? bankName.trim() : undefined,
    });

    if (res.error) {
      setWithdrawError(res.error);
      return;
    }

    setWithdrawSuccess(
      `مبارک ہو! آپ کی PKR ${withdrawAmount.toLocaleString()} کیش انعام کی درخواست درج ہو گئی ہے۔ ایڈمن ٹیم جلد ہی آپ کے ${paymentMethod.toUpperCase()} اکاؤنٹ میں رقم منتقل کرے گی۔`
    );

    // Update user state in memory
    const updatedUser: UserProfile = {
      ...user,
      referralWithdrawnPkr: (user.referralWithdrawnPkr || 0) + withdrawAmount,
    };
    if (onUserUpdated) {
      onUserUpdated(updatedUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#072844] via-[#0b3860] to-[#072844] p-4 sm:p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-black shadow-lg shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Referral Cash Prize Program
                </span>
                {isProgramActive ? (
                  <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ایکٹیو
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded">
                    عارضی موقوف
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                ریفر کریں اور کیش انعام پائیں
              </h2>
              <p className="text-xs text-sky-200 mt-0.5">
                ہر دوست کو ایپ ڈاؤن لوڈ کروانے پر نقد کیش انعام EasyPaisa/JazzCash میں حاصل کریں
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-stone-800 flex-1">
          {/* If Program Disabled Alert */}
          {!isProgramActive && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ریفرل کیش انعام پروگرام اس وقت ایڈمن کی طرف سے عارضی طور پر بند ہے</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  پروگرام بحال ہوتے ہی آپ اپنے ریفرل لنک کے ذریعے نئے انعامات کما سکیں گے۔ آپ کا سابقہ بیلنس محفوظ ہے۔
                </p>
              </div>
            </div>
          )}

          {/* Highlights & Wallet Overview */}
          <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-stone-50 to-stone-100 p-3 rounded-2xl border border-stone-200 text-center">
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase">کل کیش انعام</p>
              <p className="text-base font-black text-amber-600 mt-0.5">
                PKR {totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="border-x border-stone-200 px-1">
              <p className="text-[10px] font-bold text-stone-500 uppercase">دستیاب بیلنس</p>
              <p className="text-base font-black text-emerald-600 mt-0.5">
                PKR {availableBalance.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-stone-500 uppercase">کامیاب دوست</p>
              <p className="text-base font-black text-sky-700 mt-0.5">
                {myReferrals.length} فرینڈز
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('share')}
              className={`flex-1 py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                activeSubTab === 'share'
                  ? 'bg-white text-stone-900 shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500" />
              <span>ریفرل لنک و کوڈ</span>
            </button>
            <button
              onClick={() => setActiveSubTab('withdraw')}
              className={`flex-1 py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                activeSubTab === 'withdraw'
                  ? 'bg-white text-stone-900 shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>کیش نکلوائیں ({availableBalance > 0 ? `PKR ${availableBalance}` : '0'})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex-1 py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                activeSubTab === 'history'
                  ? 'bg-white text-stone-900 shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>ہسٹری ({myReferrals.length})</span>
            </button>
          </div>

          {/* TAB 1: Share Link & Code */}
          {activeSubTab === 'share' && (
            <div className="space-y-4">
              {/* Prize Highlight Box */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 rounded-2xl text-stone-950 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-950/15">
                      Special Cash Reward
                    </span>
                    <h3 className="text-xl font-black mt-1">
                      PKR {rewardAmount.toLocaleString()} فی ریفرل!
                    </h3>
                    <p className="text-xs font-semibold mt-0.5 opacity-90">
                      جب بھی کوئی آپ کے لنک یا کوڈ سے ایپ ڈاؤن لوڈ اور سائن اپ کرے گا، آپ کو فوری نقد کیش انعام ملے گا۔
                    </p>
                  </div>
                  <Sparkles className="w-8 h-8 text-stone-950/70" />
                </div>
              </div>

              {/* Referral Code Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1">
                  آپ کا منفرد ریفرل کوڈ (Your Referral Code)
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border-2 border-dashed border-amber-400 rounded-xl px-4 py-2 font-mono text-lg font-black text-stone-900 tracking-wider text-center">
                    {referralCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'کاپی ہو گیا' : 'کوڈ کاپی'}</span>
                  </button>
                </div>
              </div>

              {/* Referral Link Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-stone-500 uppercase block mb-1">
                  ڈائریکٹ ریفرل ڈاؤن لوڈ لنک (Direct App Link)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono text-stone-700 truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'کاپی ہو گیا' : 'لنک کاپی'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click WhatsApp Share Button */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>واٹس ایپ پر دوستوں کو بھیجیں (Share on WhatsApp)</span>
              </button>

              {/* How it works steps */}
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-xs text-sky-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sky-900">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>یہ پروگرام کیسے کام کرتا ہے؟</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-[11px] text-sky-800">
                  <p>1️⃣ واٹس ایپ پر اپنا لنک یا کوڈ اپنے دوستوں اور رشتہ داروں کو بھیجیں۔</p>
                  <p>2️⃣ وہ ایپ انسٹال کر کے آپ کا کوڈ درج کریں گے۔</p>
                  <p>3️⃣ آپ کے والٹ میں فوری <strong>PKR {rewardAmount}</strong> کا کیش انعام شامل ہو جائے گا جسے آپ EasyPaisa یا JazzCash میں نکلوا سکتے ہیں۔</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Withdraw Cash Prize */}
          {activeSubTab === 'withdraw' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-emerald-950">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">آپ کا دستیاب انعام</span>
                  <span className="text-lg font-black text-emerald-700">
                    PKR {availableBalance.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-1">
                  آپ کم از کم PKR {rewardAmount} کا کیش انعام EasyPaisa، JazzCash یا بینک اکاؤنٹ میں حاصل کر سکتے ہیں۔
                </p>
              </div>

              {withdrawSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-400 p-3 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              {withdrawError && (
                <div className="bg-rose-50 border border-rose-300 p-3 rounded-2xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {availableBalance <= 0 ? (
                <div className="text-center py-6 px-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <Wallet className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="font-bold text-xs text-stone-700">اس وقت نکالنے کے لیے کوئی بیلنس موجود نہیں ہے</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    مزید دوستوں کو اپنا ریفرل لنک شیئر کریں اور کیش انعام کمائیں۔
                  </p>
                  <button
                    onClick={() => setActiveSubTab('share')}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    ریفرل لنک شیئر کریں &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-3">
                  {/* Select Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      ادائیگی کا طریقہ (Payment Method)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('easypaisa')}
                        className={`p-2.5 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'easypaisa'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>EasyPaisa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('jazzcash')}
                        className={`p-2.5 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'jazzcash'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>JazzCash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`p-2.5 rounded-xl border text-xs font-black transition flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'bank'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span>Bank Transfer</span>
                      </button>
                    </div>
                  </div>

                  {/* Amount to withdraw */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رقم (Withdrawal Amount in PKR)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={availableBalance}
                      step={100}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-black text-stone-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Account Title */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      اکاؤنٹ ٹائٹل / اکاؤنٹ ہولڈر کا نام (Account Title)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed Khan"
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Account / Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {paymentMethod === 'bank' ? 'بینک اکاؤنٹ یا IBAN نمبر' : 'موبائل اکاؤنٹ نمبر (e.g. 03001234567)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={paymentMethod === 'bank' ? 'PK00BANK...' : '03001234567'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {paymentMethod === 'bank' && (
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        بینک کا نام (Bank Name)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Meezan Bank, HBL, Allied Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md active:scale-95 transition"
                  >
                    کیش انعام کی درخواست بھیجیں (Submit Payout Request)
                  </button>
                </form>
              )}

              {/* Past payout requests */}
              {myPayouts.length > 0 && (
                <div className="pt-3 border-t border-stone-200">
                  <span className="text-[11px] font-bold text-stone-500 uppercase block mb-2">
                    آپ کی سابقہ کیش ادائیگی کی درخواستیں
                  </span>
                  <div className="space-y-1.5">
                    {myPayouts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-stone-900">
                            PKR {p.amountPkr.toLocaleString()} via {p.paymentMethod.toUpperCase()}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {new Date(p.requestedAt).toLocaleDateString()} • {p.accountNumber}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'paid' ? 'ادا ہو گیا' : p.status === 'rejected' ? 'مسترد' : 'پینڈنگ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: History */}
          {activeSubTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  آپ کے ریفرل سے جوائن کرنے والے دوست
                </span>
                <span className="text-xs font-mono font-bold text-stone-500">
                  Total: {myReferrals.length}
                </span>
              </div>

              {myReferrals.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-200">
                  <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="font-bold text-xs text-stone-700">ابھی تک کسی دوست نے جوائن نہیں کیا</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    اپنا ریفرل لنک واٹس ایپ پر شیئر کریں اور انعامات حاصل کریں۔
                  </p>
                  <button
                    onClick={() => setActiveSubTab('share')}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs"
                  >
                    لنک شیئر کریں
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myReferrals.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                          {r.refereeName ? r.refereeName[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{r.refereeName}</p>
                          <p className="text-[10px] text-stone-500">
                            {r.refereePhone} • {r.refereeCity || 'Pakistan'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 text-xs">
                          +PKR {r.rewardAmountPkr}
                        </span>
                        <p className="text-[10px] text-stone-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 p-3 px-5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span className="text-[11px]">
            K&amp;S Solar Energy • ہیڈ آفس کیش انعام پروگرام
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
