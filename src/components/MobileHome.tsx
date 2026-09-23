import React, { useState, useEffect } from 'react';
import {
  Sun,
  Droplets,
  Activity,
  Calculator,
  AlertCircle,
  MessageCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  PhoneCall,
  Clock,
  Wrench,
  Shield,
  Gift,
  Star,
  Users,
  Copy,
  Share2,
  Check,
  LogOut,
  Pencil,
  Search,
  Globe,
  Mail,
  ArrowUpRight,
  Hexagon,
  DollarSign,
  RotateCw,
} from 'lucide-react';
import { AppSettings, Booking, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { AIChatModal } from './AIChatModal';
import { WarrantySearchModal, MyWarrantiesModal } from './WarrantyModals';

interface MobileHomeProps {
  user: UserProfile;
  bookings: Booking[];
  settings: AppSettings;
  onNavigateTab: (tab: string) => void;
  onOpenComplaintModal: () => void;
  onOpenCityPicker: () => void;
  onOpenInstallModal?: () => void;
  onOpenSiteInstallationModal?: () => void;
  onOpenReferralModal?: () => void;
  onLogout?: () => void;
}

export const MobileHome: React.FC<MobileHomeProps> = ({
  user,
  bookings,
  settings,
  onNavigateTab,
  onOpenComplaintModal,
  onOpenCityPicker,
  onOpenInstallModal,
  onOpenSiteInstallationModal,
  onOpenReferralModal,
  onLogout,
}) => {
  // Modal states for interactive cards
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isWarrantySearchOpen, setIsWarrantySearchOpen] = useState(false);
  const [isMyWarrantiesOpen, setIsMyWarrantiesOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live time ticker for weather widget (matches screenshot "2:44 pm")
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter bookings for user
  const totalOrders = bookings.length;
  const pendingOrders = bookings.filter((b) => b.status === 'pending').length;
  const completedOrders = bookings.filter((b) => b.status === 'completed').length;

  // Referral code formatted with spaces e.g. "9 C F V W F"
  const referralCode = user.referralCode || '9CFVWF';
  const formattedCode = referralCode.split('').join(' ');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    const text = `Join K&S Solar Energy with my code ${referralCode} and get instant savings on panel washing & solar systems! https://knssolar.com?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({ title: 'K&S Solar Referral', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Referral link copied to clipboard!');
    }
  };

  const handleOpenWhatsApp = () => {
    const clean = settings.whatsapp_support.replace(/\D/g, '');
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent('Salam K&S Solar Energy, I need assistance with my solar system.')}`,
      '_blank'
    );
  };

  return (
    <div className="bg-[#eaf1f6] min-h-screen text-slate-800 pb-28">
      {/* 1. TOP HEADER BAR (Matches Screenshots 7, 8, 9) */}
      <div className="pt-3 px-4 pb-2 flex items-center justify-between gap-2">
        {/* Left: Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          title="Logout / Exit"
          className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:text-rose-600 hover:bg-slate-50 active:scale-95 transition"
        >
          <LogOut className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Center: Official Logo Badge Card */}
        <div className="flex-1 max-w-[210px] h-11 bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3 py-1 flex items-center justify-center">
          <img
            src="/ks-solar-logo.png"
            alt="K&S Solar Energy Pvt. Ltd"
            className="h-8 max-w-full object-contain"
          />
        </div>

        {/* Right: AI Chat Pill Button */}
        <button
          type="button"
          onClick={() => setIsAIChatOpen(true)}
          className="h-11 px-3.5 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-white text-[#00a86b]" />
          <span>AI Chat</span>
        </button>
      </div>

      <div className="px-4 space-y-3.5 pt-1">
        {/* 2. SUBTITLE & GREETING (Matches Screenshots 7, 8, 9) */}
        <div>
          <div className="text-[10px] font-black tracking-widest text-[#008ea6] uppercase flex items-center gap-1">
            <span>☼</span>
            <span>CLEAN ENERGY SOLUTIONS</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Welcome back,</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize leading-tight">
            {user.name || 'sunny'}
          </h1>
        </div>

        {/* 3. ORDERS COUNTER CARD (3 columns - Matches Screenshot 7) */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs grid grid-cols-3 divide-x divide-slate-100 cursor-pointer hover:bg-slate-50/80 transition"
        >
          {/* Total Orders */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-slate-900">{totalOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Total Orders</div>
          </div>

          {/* Pending */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-[#d97706]">{pendingOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Pending</div>
          </div>

          {/* Completed */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-[#059669]">{completedOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Completed</div>
          </div>
        </div>

        {/* 4. WEATHER & SOLAR PRODUCTION WIDGET (Orange Gradient Card - Matches Screenshot 7) */}
        <div className="bg-gradient-to-r from-[#e65100] via-[#ef6c00] to-[#f57c00] text-white rounded-3xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Left: City, Condition, Temperature */}
            <div>
              <button
                type="button"
                onClick={onOpenCityPicker}
                className="flex items-center gap-1 text-xs font-black text-white hover:text-amber-100 active:scale-95 transition"
              >
                <span>📍</span>
                <span>{user.city || 'Lahore'}</span>
                <Pencil className="w-3 h-3 ml-0.5 opacity-90" />
              </button>
              <div className="text-[11px] text-amber-100 font-medium mt-0.5">Mostly Clear</div>
              <div className="text-3xl font-black text-white mt-1 tracking-tight">35°C</div>
            </div>

            {/* Center: Sun Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25 shadow-inner">
              <Sun className="w-8 h-8 text-amber-100 stroke-[2.2]" />
            </div>

            {/* Right: Solar rating, Description, Live Time */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-sm font-black text-white">
                <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>Excellent</span>
              </div>
              <div className="text-[11px] text-amber-100 font-medium mt-0.5">Excellent solar day</div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-amber-200/90 font-bold mt-1">
                <RotateCw className="w-3 h-3" />
                <span>{currentTime || '2:48 pm'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. SOLAR ESTIMATE PROMPT CARD (Matches Screenshot 7) */}
        <div
          onClick={() => onNavigateTab('calculator')}
          className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f4f8] text-[#0096aa] flex items-center justify-center shrink-0 border border-[#bce3eb]">
              <Zap className="w-5 h-5 fill-[#0096aa]" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900 leading-tight">
                See Today's Solar Estimate
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                Enter your system size once — get daily kWh estimates based on live weather
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* 6. OUR SERVICES 2x2 GRID (Matches Screenshot 8) */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Our Services
          </h2>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Service 1: Inverter Status */}
            <div
              onClick={() => onNavigateTab('inverters')}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">Inverter Status</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Check your system live</p>
              </div>
            </div>

            {/* Service 2: Solar Panels Washing */}
            <div
              onClick={() => onNavigateTab('booking')}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0096aa] flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Solar Panels Washing
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Book cleaning service</p>
              </div>
            </div>

            {/* Service 3: Installation */}
            <div
              onClick={() => {
                if (onOpenSiteInstallationModal) onOpenSiteInstallationModal();
              }}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">Installation</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Get a free quotation</p>
              </div>
            </div>

            {/* Service 4: Solar System Complaints */}
            <div
              onClick={onOpenComplaintModal}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer flex flex-col justify-between h-28"
            >
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight">
                  Solar System Complaints
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Report an issue</p>
              </div>
            </div>
          </div>
        </div>

        {/* 7. QUICK ACCESS LIST CARDS (Matches Screenshot 8) */}
        <div className="space-y-2">
          {/* Card 1: Solar Calculator */}
          <div
            onClick={() => onNavigateTab('calculator')}
            className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                %
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Solar Calculator</h3>
                <p className="text-[10px] text-slate-500">Estimate system size &amp; savings instantly</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Card 2: Warranty Search */}
          <div
            onClick={() => setIsWarrantySearchOpen(true)}
            className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0096aa] flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Warranty Search</h3>
                <p className="text-[10px] text-slate-500">Check warranty status by invoice number</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Card 3: My Warranties */}
          <div
            onClick={() => setIsMyWarrantiesOpen(true)}
            className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">My Warranties</h3>
                <p className="text-[10px] text-slate-500">No warranties registered yet</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* 8. REFERRAL PROGRAM CARD (Emerald Green Gradient - Matches Screenshot 8) */}
        <div className="bg-gradient-to-br from-[#00695c] via-[#005f53] to-[#004d40] text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white">Referral Program</h2>
              <p className="text-[11px] text-emerald-100 font-medium">
                Share your code — earn bonus points
              </p>
            </div>
          </div>

          {/* Large Referral Code Display */}
          <div className="bg-black/15 border border-white/15 rounded-2xl p-3 text-center">
            <div className="text-[9px] tracking-widest uppercase font-extrabold text-emerald-200 mb-0.5">
              YOUR CODE
            </div>
            <div className="text-2xl font-black tracking-[0.25em] text-white">
              {formattedCode}
            </div>
          </div>

          {/* 3 Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-white/15 bg-white/10 rounded-2xl p-2.5 text-center text-xs">
            <div>
              <div className="flex items-center justify-center gap-1 font-black text-white">
                <Star className="w-3.5 h-3.5 fill-white/80" />
                <span>{user.points || 0}</span>
              </div>
              <div className="text-[10px] text-emerald-200 mt-0.5">Points</div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 font-black text-white">
                <Users className="w-3.5 h-3.5" />
                <span>{StorageService.getReferrals().filter((r) => r.referrerCode === referralCode).length}</span>
              </div>
              <div className="text-[10px] text-emerald-200 mt-0.5">Referrals</div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-0.5 font-black text-white text-[11px]">
                <span>PKR {user.referralEarningsPkr || 0}</span>
              </div>
              <div className="text-[10px] text-emerald-200 mt-0.5">Balance</div>
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
        </div>

        {/* 9. WHATSAPP SUPPORT BANNER (Matches Screenshot 9) */}
        <div
          onClick={handleOpenWhatsApp}
          className="bg-[#00897b] hover:bg-[#009688] text-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-98 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">WhatsApp Support</h3>
              <p className="text-[10px] text-emerald-100">We typically reply in minutes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/80" />
        </div>

        {/* 10. WHY CLEAN SOLAR PANELS? (Matches Screenshot 9) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Why Clean Solar Panels?
          </h3>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Up to 30% efficiency boost after cleaning</span>
            </div>

            <div className="flex items-start gap-2.5">
              <Hexagon className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>Extends panel lifespan significantly</span>
            </div>

            <div className="flex items-start gap-2.5">
              <DollarSign className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Saves money on electricity bills</span>
            </div>

            <div className="flex items-start gap-2.5">
              <Sun className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span>Maximum energy output year-round</span>
            </div>
          </div>
        </div>

        {/* 11. FOLLOW US CARD (Matches Screenshot 9) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Follow Us
          </h3>
          <a
            href="https://knssolar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition"
          >
            <Globe className="w-4 h-4 text-[#0096aa]" />
            <span>Website</span>
          </a>
        </div>

        {/* 12. CONTACT US CARD (Matches Screenshot 9) */}
        <div className="bg-[#007e94] text-white rounded-3xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-sky-100">
            Contact Us
          </h3>
          <div className="space-y-1.5 text-xs">
            <a
              href="tel:923280454939"
              className="flex items-center gap-2 text-white hover:text-sky-200 transition font-medium"
            >
              <span>📞</span>
              <span>923280454939</span>
            </a>
            <a
              href="mailto:info@knssolar.com"
              className="flex items-center gap-2 text-white hover:text-sky-200 transition font-medium"
            >
              <span>✉</span>
              <span>info@knssolar.com</span>
            </a>
            <div className="flex items-center gap-2 text-sky-100 font-medium">
              <span>🕒</span>
              <span>8:30am to 6:00pm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        whatsappNumber={settings.whatsapp_support}
      />

      <WarrantySearchModal
        isOpen={isWarrantySearchOpen}
        onClose={() => setIsWarrantySearchOpen(false)}
        userPhone={user.phone}
        whatsappNumber={settings.whatsapp_support}
      />

      <MyWarrantiesModal
        isOpen={isMyWarrantiesOpen}
        onClose={() => setIsMyWarrantiesOpen(false)}
        user={user}
        whatsappNumber={settings.whatsapp_support}
        onOpenSearch={() => {
          setIsMyWarrantiesOpen(false);
          setIsWarrantySearchOpen(true);
        }}
      />
    </div>
  );
};
