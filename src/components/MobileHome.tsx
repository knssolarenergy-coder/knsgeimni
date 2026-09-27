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
  Lock,
  LogIn,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
} from 'lucide-react';
import { AppSettings, Booking, UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { AIChatModal } from './AIChatModal';
import { WarrantySearchModal, MyWarrantiesModal } from './WarrantyModals';
import { KS_LOGO_SRC } from '../assets/logoData';
import { filterUserBookings } from '../utils/userFilter';
import { WeatherService, LiveWeatherData } from '../services/weatherService';

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
  onRequestSignIn?: (featureName?: string) => void;
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
  onRequestSignIn,
  onLogout,
}) => {
  const isGuest = !user || user.id === 'guest';
  // Modal states for interactive cards
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isWarrantySearchOpen, setIsWarrantySearchOpen] = useState(false);
  const [isMyWarrantiesOpen, setIsMyWarrantiesOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Live time ticker for weather widget (matches screenshot "2:44 pm")
  const [currentTime, setCurrentTime] = useState('');
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async (force = false) => {
      setIsLoadingWeather(true);
      try {
        const data = await WeatherService.fetchLiveWeather(user.city || 'Bhakkar', undefined, force);
        if (isMounted) setWeather(data);
      } catch (e) {
        console.warn('Weather error:', e);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    };

    fetchWeather();
    // Refresh weather every 10 minutes automatically
    const weatherTimer = setInterval(() => fetchWeather(false), 10 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(weatherTimer);
    };
  }, [user.city]);

  const handleRefreshWeatherManual = async () => {
    if (isLoadingWeather) return;
    setIsLoadingWeather(true);
    try {
      const data = await WeatherService.fetchLiveWeather(user.city || 'Bhakkar', undefined, true);
      setWeather(data);
    } catch {} finally {
      setIsLoadingWeather(false);
    }
  };

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

  // Filter bookings strictly for the current logged-in user
  const userBookings = isGuest ? [] : filterUserBookings(bookings, user);
  const totalOrders = userBookings.length;
  const pendingOrders = userBookings.filter((b) => b.status === 'pending').length;
  const completedOrders = userBookings.filter((b) => b.status === 'completed').length;

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
            src={KS_LOGO_SRC}
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
        {/* 2. SUBTITLE & GREETING */}
        <div>
          <div className="text-[10px] font-black tracking-widest text-[#008ea6] uppercase flex items-center gap-1">
            <span>☼</span>
            <span>CLEAN ENERGY SOLUTIONS</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {isGuest ? 'Welcome to K&S Solar,' : 'Welcome back,'}
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize leading-tight">
              {isGuest ? 'Guest Visitor' : user.name || 'sunny'}
            </h1>
            {isGuest && (
              <button
                type="button"
                onClick={() => onRequestSignIn?.('dashboard')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-black shadow-xs active:scale-95 transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. ORDERS COUNTER CARD (3 columns) */}
        <div
          onClick={() => {
            if (isGuest) {
              onRequestSignIn?.('orders');
            } else {
              onNavigateTab('orders');
            }
          }}
          className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs grid grid-cols-3 divide-x divide-slate-100 cursor-pointer hover:bg-slate-50/80 transition relative overflow-hidden"
        >
          {isGuest && (
            <div className="absolute top-1.5 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black border border-amber-200 shadow-2xs">
              <Lock className="w-2.5 h-2.5" />
              <span>Sign In to Track</span>
            </div>
          )}

          {/* Total Orders */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-slate-900">{isGuest ? '—' : totalOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Total Orders</div>
          </div>

          {/* Pending */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-[#d97706]">{isGuest ? '—' : pendingOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Pending</div>
          </div>

          {/* Completed */}
          <div className="text-center px-1">
            <div className="text-xl font-black text-[#059669]">{isGuest ? '—' : completedOrders}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Completed</div>
          </div>
        </div>

        {/* 4. WEATHER & SOLAR PRODUCTION WIDGET (Real Live Open-Meteo Weather) */}
        <div className="bg-gradient-to-r from-[#e65100] via-[#ef6c00] to-[#f57c00] text-white rounded-3xl p-4 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Left: City, Condition, Temperature */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onOpenCityPicker}
                  className="flex items-center gap-1 text-xs font-black text-white hover:text-amber-100 active:scale-95 transition bg-white/15 px-2 py-0.5 rounded-full border border-white/20"
                >
                  <span>📍</span>
                  <span>{weather?.cityName || user.city || 'Bhakkar'}</span>
                  <Pencil className="w-3 h-3 ml-0.5 opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={handleRefreshWeatherManual}
                  disabled={isLoadingWeather}
                  title="Refresh Live Weather"
                  className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white/90 border border-white/20 transition"
                >
                  <RotateCw className={`w-3 h-3 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-[11px] text-amber-100 font-medium">
                {weather?.condition || 'Sunny & Clear'}
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {weather?.temperature || '34°C'}
              </div>
            </div>

            {/* Center: Dynamic Weather Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25 shadow-inner">
              {weather?.iconType === 'rain' ? (
                <CloudRain className="w-8 h-8 text-sky-100 stroke-[2.2]" />
              ) : weather?.iconType === 'thunder' ? (
                <CloudLightning className="w-8 h-8 text-yellow-200 stroke-[2.2]" />
              ) : weather?.iconType === 'cloud' ? (
                <Cloud className="w-8 h-8 text-amber-100 stroke-[2.2]" />
              ) : weather?.iconType === 'cloud-sun' ? (
                <CloudSun className="w-8 h-8 text-amber-100 stroke-[2.2]" />
              ) : (
                <Sun className="w-8 h-8 text-amber-100 stroke-[2.2]" />
              )}
            </div>

            {/* Right: Solar rating, Description, Live Time */}
            <div className="text-right space-y-0.5">
              <div className="flex items-center justify-end gap-1 text-sm font-black text-white">
                <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
                <span>{weather?.solarRating || 'Excellent'}</span>
              </div>
              <div className="text-[11px] text-amber-100 font-medium max-w-[130px] truncate">
                {weather?.solarRatingDescription || 'Optimal solar conditions'}
              </div>
              <div className="flex items-center justify-end gap-2 text-[10px] text-amber-200/90 font-bold pt-0.5">
                {weather?.solarIrradianceWm2 !== undefined && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-md border border-white/25">
                    ☀️ {weather.solarIrradianceWm2} W/m²
                  </span>
                )}
                <span>{currentTime || '2:48 pm'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Weather Bar: Humidity, Wind & Generation Efficiency */}
          {weather && (
            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[10px] text-amber-100 font-semibold">
              <span>💧 Humidity: {weather.humidity}</span>
              <span>💨 Wind: {weather.windSpeed}</span>
              <span className="text-white font-extrabold bg-amber-950/30 px-2 py-0.5 rounded-full border border-white/20">
                ⚡ {weather.solarEfficiencyPercent}% Efficiency
              </span>
            </div>
          )}
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
                {weather?.dailyEstimatedKwhPer10Kw
                  ? `Est. ${weather.dailyEstimatedKwhPer10Kw} kWh daily for 10kW system based on live ${weather.cityName} weather`
                  : 'Enter your system size once — get daily kWh estimates based on live weather'}
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
            {/* Service 1: Inverter Status - LOCKED FOR GUESTS */}
            <div
              onClick={() => {
                if (isGuest) {
                  onRequestSignIn?.('inverters');
                } else {
                  onNavigateTab('inverters');
                }
              }}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-98 cursor-pointer flex flex-col justify-between h-28 relative overflow-hidden"
            >
              {isGuest && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] font-black border border-amber-200 shadow-2xs">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </div>
              )}
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 leading-tight flex items-center gap-1">
                  <span>Inverter Status</span>
                  {isGuest && <span className="text-[10px] text-amber-600">🔒</span>}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {isGuest ? 'Sign in to monitor' : 'Check your system live'}
                </p>
              </div>
            </div>

            {/* Service 2: Solar Panels Washing - UNLOCKED FOR EVERYONE */}
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

            {/* Service 3: Installation - UNLOCKED FOR EVERYONE */}
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

            {/* Service 4: Solar System Complaints - UNLOCKED FOR EVERYONE */}
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

        {/* 7. QUICK ACCESS LIST CARDS */}
        <div className="space-y-2">
          {/* Card 1: Solar Calculator - UNLOCKED */}
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

          {/* Card 2: Warranty Search - LOCKED FOR GUEST */}
          <div
            onClick={() => {
              if (isGuest) {
                onRequestSignIn?.('warranty');
              } else {
                setIsWarrantySearchOpen(true);
              }
            }}
            className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#0096aa] flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>Warranty Search</span>
                  {isGuest && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200">
                      🔒 Sign In
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500">Check warranty status by invoice number</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Card 3: My Warranties - LOCKED FOR GUEST */}
          <div
            onClick={() => {
              if (isGuest) {
                onRequestSignIn?.('my-warranties');
              } else {
                setIsMyWarrantiesOpen(true);
              }
            }}
            className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>My Warranties</span>
                  {isGuest && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 text-[9px] font-bold border border-amber-200">
                      🔒 Sign In
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {isGuest ? 'Sign in to access registered certificates' : 'View your solar warranties'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* 8. REFERRAL PROGRAM CARD */}
        {isGuest ? (
          /* Locked Referral Banner for Guest */
          <div className="bg-gradient-to-br from-[#00695c] via-[#005f53] to-[#004d40] text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                  <Gift className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>Referral Cash Rewards</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold border border-amber-400/30">
                      🔒 Locked
                    </span>
                  </h2>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Earn up to PKR 5,000+ per solar referral
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-100/90 leading-relaxed">
              Sign in or create a free account to unlock your personal referral code, track invites, and withdraw cash rewards directly to Easypaisa/JazzCash.
            </p>

            <button
              type="button"
              onClick={() => onRequestSignIn?.('referral')}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Sign In to Unlock Referral Code</span>
            </button>
          </div>
        ) : (
          /* Full Referral Dashboard for Logged-In User */
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
        )}

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
            <div className="flex items-center gap-2 text-white font-semibold">
              <span>🏢</span>
              <span>Head Office: Bhakkar, Pakistan</span>
            </div>
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

      {/* Footer Branding & Watermark */}
      <div className="text-center py-4 px-3 space-y-1 text-slate-400">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          K&amp;S Solar Energy • Head Office: Bhakkar
        </p>
        <p className="text-[9px] font-extrabold tracking-widest uppercase text-amber-500/90">
          Design and Developed by Yousuf Enterprises
        </p>
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
