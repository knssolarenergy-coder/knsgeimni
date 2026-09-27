import React, { useState } from 'react';
import {
  Sun,
  Shield,
  MapPin,
  MessageCircle,
  Wrench,
  User,
  ArrowLeft,
  LogOut,
  LogIn,
  Gift,
  Home,
  Activity,
  List,
  Lock,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { KS_LOGO_SRC } from '../assets/logoData';

interface MobileFrameProps {
  children: React.ReactNode;
  user: UserProfile | null;
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onNavigateBack?: () => void;
  canGoBack?: boolean;
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
  onNavigateBack,
  canGoBack = false,
  isAdminMode,
  onOpenCityPicker,
  onOpenReferralModal,
  whatsappSupportNumber,
  pendingTechJobsCount = 0,
  pendingAdminJobsCount = 0,
  onLogout,
  onRequestAuthRole,
}) => {
  const handleWhatsAppHelp = () => {
    const clean = whatsappSupportNumber.replace(/\D/g, '');
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent('Salam K&S Solar Energy!')}`,
      '_blank'
    );
  };

  const isTechnicianTab = activeTab === 'technician';
  const isAdminTab = activeTab === 'admin';
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true || isAdminMode;
  const isTechnician = !isAdmin && (user?.role === 'technician' || !!user?.activeTechnicianId);

  // Sub-screens where back button should be available
  const isSubScreen = canGoBack || (activeTab !== 'home' && activeTab !== 'admin' && activeTab !== 'technician');

  return (
    <div className="w-full min-h-screen bg-stone-50 text-stone-900 flex flex-col justify-between max-w-lg mx-auto relative select-none">
      {/* Mobile App Header (Native App Bar - hidden in Admin and Tech portals as they render their custom headers) */}
      {!(activeTab === 'admin' || activeTab === 'technician') && (
        <header className="sticky top-0 bg-gradient-to-r from-[#07243a] via-[#0a2e4c] to-[#07243a] border-b border-[#124268]/80 px-3.5 py-2.5 flex items-center justify-between z-30 shrink-0 shadow-md">
          {/* Left: Back button (if on subpage) + Logo & Brand */}
          <div className="flex items-center gap-2 text-left">
            {isSubScreen && onNavigateBack && (
              <button
                type="button"
                onClick={onNavigateBack}
                title="Go Back"
                className="w-8 h-8 rounded-xl bg-[#081d2d] hover:bg-[#0c2e47] text-amber-400 border border-[#144369] flex items-center justify-center active:scale-95 transition shrink-0 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            <div className="relative shrink-0">
              <img
                src={KS_LOGO_SRC}
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
                  <Sun className="w-2.5 h-2.5 inline text-amber-400" /> CUSTOMER APP
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5">
            {/* City Selector Badge (Customer & Guest View) */}
            <button
              id="mobile-city-selector-btn"
              type="button"
              onClick={onOpenCityPicker}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#081d2d] hover:bg-[#0c2e47] text-slate-200 text-[10px] font-semibold border border-[#144369] active:scale-95 transition shadow-xs"
            >
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>{user?.city || 'Lahore'}</span>
              <span className="text-[8px] text-slate-400">▾</span>
            </button>

            {/* Referral Cash Badge (Only shown when user is actually logged in, NEVER on Sign In or Sign Up screen) */}
            {Boolean(user) && onOpenReferralModal && (
              <button
                id="mobile-referral-btn"
                type="button"
                onClick={onOpenReferralModal}
                title="Refer & Earn Cash Rewards"
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-[10px] font-black active:scale-95 transition shadow-sm animate-pulse"
              >
                <Gift className="w-3 h-3 stroke-[2.5]" />
                <span>Rewards</span>
              </button>
            )}

            {/* Logout / Switch Account Button */}
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                title="Log out & Switch Portal"
                className="px-2 py-1 rounded-lg bg-[#081d2d] hover:bg-[#0c2e47] text-slate-300 text-[10px] font-bold border border-[#144369] flex items-center gap-1 active:scale-95 transition"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span className="hidden xs:inline">Exit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRequestAuthRole('customer')}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-[10px] font-black flex items-center gap-1 active:scale-95 shadow-sm"
              >
                <LogIn className="w-3 h-3" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>
      )}

      {/* Main Viewport Content - Fits Screen Directly */}
      <main className="flex-1 w-full bg-stone-50 text-stone-900 relative pb-20 flex flex-col justify-between">
        <div className="flex-1 w-full">
          {children}
        </div>
        <div className="w-full text-center py-3 px-4 text-[9px] font-extrabold tracking-widest uppercase text-slate-400 select-none">
          Design and Developed by Yousuf Enterprises
        </div>
      </main>

      {/* Floating WhatsApp Bubble */}
      <button
        type="button"
        onClick={handleWhatsAppHelp}
        title="WhatsApp Support"
        className="fixed bottom-20 right-4 z-40 p-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white transition-all"
      >
        <MessageCircle className="w-5 h-5 fill-white" />
      </button>

      {/* Bottom Navigation Bar: Fixed at viewport bottom so it never scrolls away or disappears */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 z-40 flex items-center justify-around select-none shadow-xl">
        {/* 1. Admin Role Navigation: Persistent across all screens (Home, Admin, Orders, Account) */}
        {isAdmin && (
          <>
            <button
              id="mobile-nav-home"
              type="button"
              onClick={() => onNavigateTab('home')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                activeTab === 'home'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Home className="w-5 h-5 mb-0.5 stroke-[2]" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              id="mobile-nav-admin"
              type="button"
              onClick={() => onNavigateTab('admin')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition relative ${
                activeTab === 'admin'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Shield className="w-5 h-5 mb-0.5 stroke-[2]" />
                {pendingAdminJobsCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingAdminJobsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px]">Admin</span>
            </button>

            <button
              id="mobile-nav-orders"
              type="button"
              onClick={() => onNavigateTab('orders')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                activeTab === 'orders'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <List className="w-5 h-5 mb-0.5 stroke-[2]" />
              <span className="text-[10px]">Orders</span>
            </button>

            <button
              id="mobile-nav-account"
              type="button"
              onClick={() => onNavigateTab('account')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                activeTab === 'account'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <User className="w-5 h-5 mb-0.5 stroke-[2]" />
              <span className="text-[10px]">Account</span>
            </button>
          </>
        )}

        {/* 2. Technician Role Navigation: Persistent across all screens (Portal, Orders, Account) */}
        {isTechnician && (
          <>
            <button
              id="mobile-nav-tech-portal"
              type="button"
              onClick={() => onNavigateTab('technician')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition relative ${
                activeTab === 'technician'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Wrench className="w-5 h-5 mb-0.5 stroke-[2.5]" />
                {pendingTechJobsCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                    {pendingTechJobsCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold">Portal</span>
            </button>

            <button
              id="mobile-nav-tech-orders"
              type="button"
              onClick={() => onNavigateTab('orders')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                activeTab === 'orders'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <List className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium">Orders</span>
            </button>

            <button
              id="mobile-nav-tech-account"
              type="button"
              onClick={() => onNavigateTab('account')}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition ${
                activeTab === 'account'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] font-medium">Account</span>
            </button>
          </>
        )}

        {/* 3. Customer & Guest Navigation */}
        {!isAdmin && !isTechnician && (
          <>
            <button
              id="mobile-nav-home"
              type="button"
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
              type="button"
              onClick={() => {
                if (!user) {
                  onRequestAuthRole('customer');
                } else {
                  onNavigateTab('inverters');
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition relative ${
                activeTab === 'inverters'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Activity className="w-5 h-5 mb-0.5 stroke-[2]" />
                {!user && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Lock className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[11px] flex items-center gap-0.5">
                Inverter {!user && <span className="text-[9px] text-amber-600 font-bold">🔒</span>}
              </span>
            </button>

            <button
              id="mobile-nav-orders"
              type="button"
              onClick={() => {
                if (!user) {
                  onRequestAuthRole('customer');
                } else {
                  onNavigateTab('orders');
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition relative ${
                activeTab === 'orders'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <List className="w-5 h-5 mb-0.5 stroke-[2]" />
                {!user && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Lock className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[11px] flex items-center gap-0.5">
                My Orders {!user && <span className="text-[9px] text-amber-600 font-bold">🔒</span>}
              </span>
            </button>

            <button
              id="mobile-nav-account"
              type="button"
              onClick={() => {
                if (!user) {
                  onRequestAuthRole('customer');
                } else {
                  onNavigateTab('account');
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition relative ${
                activeTab === 'account'
                  ? 'text-[#0096aa] font-black'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <User className="w-5 h-5 mb-0.5 stroke-[2]" />
                {!user && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                    <Lock className="w-2 h-2 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[11px] flex items-center gap-0.5">
                Account {!user && <span className="text-[9px] text-amber-600 font-bold">🔒</span>}
              </span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};
