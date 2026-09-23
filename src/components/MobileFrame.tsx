import React, { useState, useEffect } from 'react';
import {
  Sun,
  Shield,
  Smartphone,
  Wifi,
  Battery,
  MapPin,
  MessageCircle,
  Wrench,
  User,
  ArrowLeft,
  LogOut,
  LogIn,
  KeyRound,
  CheckCircle2,
  Gift,
  Home,
  Activity,
  List,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

export type DeviceModel = 'iphone' | 'galaxy' | 'fullscreen';

interface MobileFrameProps {
  children: React.ReactNode;
  user: UserProfile | null;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  onOpenCityPicker: () => void;
  onOpenInstallModal?: () => void;
  onOpenReferralModal?: () => void;
  whatsappSupportNumber: string;
  pendingTechJobsCount?: number;
  pendingAdminJobsCount?: number;
  onLogout: () => void;
  onRequestAuthRole: (role: UserRole) => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  user,
  activeTab,
  onNavigateTab,
  isAdminMode,
  onToggleAdminMode,
  onOpenCityPicker,
  onOpenInstallModal,
  onOpenReferralModal,
  whatsappSupportNumber,
  pendingTechJobsCount = 0,
  pendingAdminJobsCount = 0,
  onLogout,
  onRequestAuthRole,
}) => {
  const [deviceModel, setDeviceModel] = useState<DeviceModel>('iphone');
  const [currentTime, setCurrentTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleWhatsAppHelp = () => {
    const clean = whatsappSupportNumber.replace(/\D/g, '');
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent('Salam K&S Solar Energy!')}`,
      '_blank'
    );
  };

  // Dimensions based on device
  const getDeviceStyle = () => {
    if (deviceModel === 'fullscreen') {
      return 'w-full max-w-md h-screen max-h-screen rounded-none border-none shadow-none';
    }
    if (deviceModel === 'galaxy') {
      return 'w-[384px] h-[820px] rounded-[42px] border-[10px] border-stone-850 shadow-2xl';
    }
    // iPhone 16 Pro default
    return 'w-[393px] h-[844px] rounded-[50px] border-[11px] border-stone-900 shadow-2xl';
  };

  const isTechnicianTab = activeTab === 'technician';
  const isAdminTab = activeTab === 'admin';
  const currentUserRole = user?.role || 'customer';

  return (
    <div className="min-h-screen bg-[#040e17] text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 select-none">
      {/* Presentation Bar (Above phone mockup) */}
      <div className="w-full max-w-2xl hidden sm:flex flex-col gap-2 mb-3 px-4 py-3 bg-[#081d2d]/95 backdrop-blur-md rounded-2xl border border-[#103a5a]/80 shadow-xl text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/ks-solar-logo.png"
              alt="K&S Solar Energy Pvt. Ltd"
              className="w-8 h-8 rounded-full object-contain bg-white p-0.5 shadow-sm ring-1 ring-amber-400/40"
            />
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight block">K&amp;S Solar Energy (Pvt.) Ltd</span>
              <span className="text-[10px] text-amber-400/90 font-medium">Pakistan's Trusted Solar Maintenance &amp; Field Dispatch</span>
            </div>
          </div>

          {/* Active Logged-in User Badge */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0b273d] border border-[#144369] text-[11px]">
                {user.role === 'admin' && (
                  <span className="flex items-center gap-1 font-bold text-rose-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin: {user.name}</span>
                  </span>
                )}
                {user.role === 'technician' && (
                  <span className="flex items-center gap-1 font-bold text-sky-400">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Tech: {user.name}</span>
                  </span>
                )}
                {user.role === 'customer' && (
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer: {user.name}</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Log out and switch account"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold active:scale-95 transition"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <KeyRound className="w-3 h-3" />
              <span>Authentication Required</span>
            </div>
          )}
        </div>

        {/* 3 Dedicated Role Login / Switcher Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#103a5a]/60 gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
              Switch Portal:
            </span>

            {/* 1. Customer App Button */}
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'customer') {
                  onNavigateTab('home');
                } else {
                  onRequestAuthRole('customer');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                user?.role === 'customer' && !isTechnicianTab && !isAdminTab
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-[#0b273d] hover:bg-[#0e3350] text-slate-300 border border-[#144369]'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Customer App</span>
              {user?.role === 'customer' && <CheckCircle2 className="w-3 h-3 ml-0.5 text-slate-950" />}
            </button>

            {/* 2. Technician Portal Button */}
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'technician') {
                  onNavigateTab('technician');
                } else {
                  onRequestAuthRole('technician');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                user?.role === 'technician'
                  ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md font-black'
                  : 'bg-[#0b273d] hover:bg-[#0e3350] text-slate-300 border border-[#144369]'
              }`}
            >
              <Wrench className="w-3 h-3" />
              <span>Tech Portal</span>
              {user?.role === 'technician' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              {pendingTechJobsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                  {pendingTechJobsCount}
                </span>
              )}
            </button>

            {/* 3. Admin Dispatch Button */}
            <button
              type="button"
              onClick={() => {
                if (user?.role === 'admin') {
                  onNavigateTab('admin');
                } else {
                  onRequestAuthRole('admin');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                user?.role === 'admin'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md font-black'
                  : 'bg-[#0b273d] hover:bg-[#0e3350] text-slate-300 border border-[#144369]'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin Dispatch</span>
              {user?.role === 'admin' && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
              {pendingAdminJobsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                  {pendingAdminJobsCount}
                </span>
              )}
            </button>
          </div>

          {/* Device Switcher Pills */}
          <div className="flex items-center gap-1 bg-[#05131f] p-1 rounded-xl border border-[#103a5a] shrink-0">
            <button
              onClick={() => setDeviceModel('iphone')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                deviceModel === 'iphone'
                  ? 'bg-[#144369] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              iOS
            </button>
            <button
              onClick={() => setDeviceModel('galaxy')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                deviceModel === 'galaxy'
                  ? 'bg-[#144369] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Galaxy
            </button>
            <button
              onClick={() => setDeviceModel('fullscreen')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                deviceModel === 'fullscreen'
                  ? 'bg-[#144369] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fit
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Frame Container */}
      <div
        id="mobile-phone-chassis"
        className={`relative bg-[#051421] flex flex-col overflow-hidden transition-all duration-300 ring-1 ring-white/10 shadow-2xl ${getDeviceStyle()}`}
      >
        {/* Dynamic Island / Camera Punch Hole */}
        {deviceModel === 'iphone' && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-50 w-28 h-6 bg-black rounded-full flex items-center justify-between px-2.5 pointer-events-none shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2 h-2 rounded-full bg-amber-400/90 animate-pulse" />
          </div>
        )}

        {deviceModel === 'galaxy' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 w-3.5 h-3.5 bg-black rounded-full border border-slate-800 pointer-events-none" />
        )}

        {/* Mobile Status Bar */}
        <div className="h-11 w-full bg-[#051421] text-white flex items-center justify-between px-7 pt-1 text-xs font-semibold z-40 select-none shrink-0">
          <span className="tracking-tight text-[11px] font-mono">{currentTime}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-sky-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] text-emerald-400 font-mono">100%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            </div>
          </div>
        </div>

        {/* Mobile App Header (Native App Bar - hidden in Admin and Tech portals as they render their custom headers) */}
        {!(activeTab === 'admin' || activeTab === 'technician') && (
          <header className="bg-gradient-to-r from-[#07243a] via-[#0a2e4c] to-[#07243a] border-b border-[#124268]/80 px-3.5 py-2.5 flex items-center justify-between z-30 shrink-0 shadow-sm">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5 text-left">
              <div className="relative shrink-0">
                <img
                  src="/ks-solar-logo.png"
                  alt="K&S Solar Logo"
                  className="w-8 h-8 rounded-full object-contain bg-white p-0.5 shadow-md ring-1 ring-amber-400/60"
                />
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-1 ring-[#07243a]" />
              </div>
              <div>
                <div className="text-xs font-black tracking-tight text-white leading-none flex items-center gap-1">
                  <span>K&amp;S SOLAR</span>
                  <span className="text-[9px] text-amber-400 font-bold">ENERGY</span>
                </div>
                <div className="text-[9px] font-bold tracking-wider mt-0.5">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Sun className="w-2.5 h-2.5 inline text-amber-400" /> CUSTOMER APP (کسٹمر)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-1.5">
              {/* City Selector Badge (customer view) */}
              {user && (
                <button
                  id="mobile-city-selector-btn"
                  onClick={onOpenCityPicker}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#081d2d] hover:bg-[#0c2e47] text-slate-200 text-[10px] font-semibold border border-[#144369] active:scale-95 transition shadow-xs"
                >
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{user.city}</span>
                  <span className="text-[8px] text-slate-400">▾</span>
                </button>
              )}

              {/* Referral Cash Badge (Customer View) */}
              {onOpenReferralModal && (
                <button
                  id="mobile-referral-btn"
                  onClick={onOpenReferralModal}
                  title="Refer & Earn Cash Prizes"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-[10px] font-black active:scale-95 transition shadow-sm animate-pulse"
                >
                  <Gift className="w-3 h-3 stroke-[2.5]" />
                  <span>انعام</span>
                </button>
              )}

              {/* Logout / Switch Account Button */}
              {user ? (
                <button
                  onClick={onLogout}
                  title="Log out & Switch Portal"
                  className="px-2.5 py-1 rounded-lg bg-[#081d2d] hover:bg-[#0c2e47] text-slate-300 text-[10px] font-bold border border-[#144369] flex items-center gap-1 active:scale-95 transition"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span className="hidden xs:inline">Exit</span>
                </button>
              ) : (
                <button
                  onClick={() => onRequestAuthRole('customer')}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </header>
        )}

        {/* Mobile Viewport Screen Content */}
        <main className="flex-1 overflow-y-auto bg-stone-50 text-stone-900 relative">
          {children}
        </main>

        {/* Floating WhatsApp Bubble inside Mobile (Only in customer or tech view) */}
        <button
          onClick={handleWhatsAppHelp}
          title="WhatsApp Support"
          className="absolute bottom-16 right-4 z-40 p-3 bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white rounded-full shadow-xl flex items-center justify-center border-2 border-white transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white" />
        </button>

        {/* Mobile Bottom Navigation Bar (Tailored to Role & Exact Screenshot Match) */}
        {user && (
          <nav className="bg-white border-t border-slate-200/90 py-1.5 px-3 z-40 flex items-center justify-around shrink-0 select-none shadow-xs">
            {/* Customer Navigation */}
            {currentUserRole === 'customer' && (
              <>
                <button
                  id="mobile-nav-home"
                  onClick={() => onNavigateTab('home')}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                    activeTab === 'home'
                      ? 'text-[#0096aa] font-black'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <Home className="w-5 h-5 mb-0.5 stroke-[2]" />
                  <span className="text-[11px]">Home</span>
                </button>

                <button
                  id="mobile-nav-inverters"
                  onClick={() => onNavigateTab('inverters')}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                    activeTab === 'inverters'
                      ? 'text-[#0096aa] font-black'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <Activity className="w-5 h-5 mb-0.5 stroke-[2]" />
                  <span className="text-[11px]">Inverter</span>
                </button>

                <button
                  id="mobile-nav-orders"
                  onClick={() => onNavigateTab('orders')}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                    activeTab === 'orders'
                      ? 'text-[#0096aa] font-black'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <List className="w-5 h-5 mb-0.5 stroke-[2]" />
                  <span className="text-[11px]">My Orders</span>
                </button>

                <button
                  id="mobile-nav-account"
                  onClick={() => onNavigateTab('account')}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition ${
                    activeTab === 'account'
                      ? 'text-[#0096aa] font-black'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`}
                >
                  <User className="w-5 h-5 mb-0.5 stroke-[2]" />
                  <span className="text-[11px]">Account</span>
                </button>
              </>
            )}

            {/* Technician View Navigation */}
            {activeTab === 'technician' && (
              <>
                <button
                  onClick={() => onNavigateTab('home')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-slate-400 hover:text-slate-600 transition"
                >
                  <Home className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-medium">Home</span>
                </button>

                <button
                  onClick={() => onNavigateTab('technician')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-[#0096aa] font-black transition"
                >
                  <Wrench className="w-5 h-5 mb-0.5 stroke-[2.5]" />
                  <span className="text-[11px] font-bold">Portal</span>
                </button>

                <button
                  onClick={() => onNavigateTab('admin')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-slate-400 hover:text-slate-600 transition"
                  title="Switch to Admin Console"
                >
                  <Shield className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-medium">Admin</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex flex-col items-center justify-center py-1 px-3 text-slate-400 hover:text-rose-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Exit</span>
                </button>
              </>
            )}

            {/* Admin View Navigation */}
            {activeTab === 'admin' && (
              <>
                <button
                  onClick={() => onNavigateTab('home')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-slate-400 hover:text-slate-600 transition"
                >
                  <Home className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-medium">Home</span>
                </button>

                <button
                  onClick={() => onNavigateTab('admin')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-[#0096aa] font-black transition"
                >
                  <Shield className="w-5 h-5 mb-0.5 stroke-[2.5]" />
                  <span className="text-[11px] font-bold">Admin</span>
                </button>

                <button
                  onClick={() => onNavigateTab('technician')}
                  className="flex flex-col items-center justify-center py-1 px-4 text-slate-400 hover:text-slate-600 transition"
                  title="Technician Portal"
                >
                  <Wrench className="w-5 h-5 mb-0.5" />
                  <span className="text-[11px] font-medium">Tech</span>
                </button>

                <button
                  onClick={onLogout}
                  className="flex flex-col items-center justify-center py-1 px-3 text-slate-400 hover:text-rose-500 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Exit</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* iOS Home Indicator Bar */}
        <div className="h-4 w-full bg-[#051624] flex items-center justify-center shrink-0">
          <div className="w-32 h-1 bg-[#103a5a] rounded-full" />
        </div>
      </div>
    </div>
  );
};
