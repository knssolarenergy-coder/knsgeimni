import React from 'react';
import { Sun, Shield, User, MapPin, CheckCircle2, Smartphone, Download } from 'lucide-react';
import { UserProfile } from '../types';
import { CITIES } from '../data/mockData';

interface NavbarProps {
  user: UserProfile;
  onUpdateCity: (city: string) => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  onOpenInstallModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onUpdateCity,
  isAdminMode,
  onToggleAdminMode,
  activeTab,
  setActiveTab,
  pendingCount,
  onOpenInstallModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            id="nav-brand-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-stone-950 shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sun className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-stone-900">K&amp;S Solar</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Energy
                </span>
              </div>
              <p className="text-xs text-stone-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Services across Pakistan
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              id="nav-tab-home"
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Home
            </button>
            <button
              id="nav-tab-inverters"
              onClick={() => setActiveTab('inverters')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'inverters'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              Inverter Portals
            </button>
            <button
              id="nav-tab-orders"
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'orders'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              My Orders
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-stone-950 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              id="nav-tab-calculator"
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              System Calculator
            </button>
            {isAdminMode && (
              <button
                id="nav-tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* City Selector */}
            <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
              <select
                id="city-selector-dropdown"
                value={user.city}
                onChange={(e) => onUpdateCity(e.target.value)}
                className="bg-transparent text-xs font-semibold text-stone-800 focus:outline-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile App Install Button */}
            {onOpenInstallModal && (
              <button
                id="nav-install-app-btn"
                onClick={onOpenInstallModal}
                title="Install Mobile App"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all animate-pulse hover:animate-none"
              >
                <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* Admin Mode Switcher */}
            <button
              id="toggle-admin-mode-btn"
              onClick={onToggleAdminMode}
              title={isAdminMode ? 'Switch to Customer View' : 'Switch to Admin View'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isAdminMode
                  ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAdminMode ? 'Admin View Active' : 'Staff / Admin'}</span>
            </button>

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-stone-800 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-stone-100 text-xs font-medium text-stone-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-full ${activeTab === 'home' ? 'bg-stone-900 text-white' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('inverters')}
            className={`px-3 py-1.5 rounded-full ${activeTab === 'inverters' ? 'bg-stone-900 text-white' : ''}`}
          >
            Inverters
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-full ${activeTab === 'orders' ? 'bg-stone-900 text-white' : ''}`}
          >
            Orders ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-full ${activeTab === 'calculator' ? 'bg-stone-900 text-white' : ''}`}
          >
            Calculator
          </button>
          {isAdminMode && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-full ${activeTab === 'admin' ? 'bg-amber-600 text-white' : 'text-amber-700'}`}
            >
              Admin
            </button>
          )}
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="px-3 py-1.5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center gap-1 shrink-0"
            >
              <Smartphone className="w-3 h-3" />
              <span>Install App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
