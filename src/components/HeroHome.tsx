import React from 'react';
import {
  Sparkles,
  Droplets,
  Activity,
  Calculator,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  SunMedium,
  Zap,
  Clock,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  Download,
} from 'lucide-react';
import { AppSettings, Booking, UserProfile } from '../types';

interface HeroHomeProps {
  user: UserProfile;
  bookings: Booking[];
  settings: AppSettings;
  onOpenBookingModal: () => void;
  onOpenComplaintModal: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenInstallModal?: () => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({
  user,
  bookings,
  settings,
  onOpenBookingModal,
  onOpenComplaintModal,
  onNavigateTab,
  onOpenInstallModal,
}) => {
  const pendingOrders = bookings.filter((b) => b.status === 'pending').length;
  const confirmedOrders = bookings.filter((b) => b.status === 'confirmed').length;
  const completedOrders = bookings.filter((b) => b.status === 'completed').length;
  const totalWashedPanels = bookings
    .filter((b) => b.status === 'completed')
    .reduce((acc, curr) => acc + curr.panelCount, 0);

  const handleWhatsApp = (number: string, message: string) => {
    const clean = number.replace(/\D/g, '');
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-4 border border-amber-500/30">
              <SunMedium className="w-3.5 h-3.5" />
              <span>Solar Peak Yield Season • {user.city}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome back, {user.name}
            </h1>
            <p className="text-stone-300 text-sm leading-relaxed">
              Maximize your solar generation with certified high-pressure panel washing, live
              inverter status tracking, and 24/7 technical assistance.
            </p>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              id="hero-book-wash-cta"
              onClick={onOpenBookingModal}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-102 active:scale-98"
            >
              <Droplets className="w-4 h-4" />
              <span>Book Panel Wash</span>
            </button>
            <button
              id="hero-check-inverter-cta"
              onClick={() => onNavigateTab('inverters')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 flex items-center justify-center gap-2 transition-colors"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Inverter Portals</span>
            </button>
            {onOpenInstallModal && (
              <button
                id="hero-install-app-cta"
                onClick={onOpenInstallModal}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-sm border border-amber-400/40 flex items-center justify-center gap-2 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install Mobile App</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile App PWA Banner */}
      {onOpenInstallModal && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 rounded-2xl p-4 sm:p-5 text-stone-950 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base">Mobile App Available</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-950 text-amber-400">
                  Android &amp; iOS PWA
                </span>
              </div>
              <p className="text-xs text-stone-900 font-medium">
                Install K&amp;S Solar Energy on your phone's home screen for one-tap bookings and offline access.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenInstallModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-md transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Install on My Phone</span>
          </button>
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Total Bookings</p>
            <p className="text-2xl font-bold text-stone-900">{bookings.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active / Pending</p>
            <p className="text-2xl font-bold text-blue-600">{pendingOrders + confirmedOrders}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Panels Washed</p>
            <p className="text-2xl font-bold text-emerald-600">{totalWashedPanels}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Yield Boost</p>
            <p className="text-2xl font-bold text-stone-900">+18% - 25%</p>
          </div>
        </div>
      </div>

      {/* Main Services 2x2 Bento Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Services &amp; Tools</h2>
            <p className="text-xs text-stone-500">Essential solar maintenance &amp; monitoring tools</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Solar Panel Washing */}
          <div
            id="service-card-wash"
            onClick={onOpenBookingModal}
            className="group relative bg-white p-6 rounded-2xl border border-stone-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                  Most Popular
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-600 transition-colors mb-1">
                Solar Panel Washing
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-4">
                High-pressure deionized pure-water washing. Removes dust, bird droppings, and urban
                soiling to immediately restore module wattage.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-semibold text-stone-800">
              <span className="text-amber-600">Starting from PKR 200 / panel</span>
              <span className="flex items-center gap-1 text-blue-600 group-hover:translate-x-1 transition-transform">
                Book Service <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 2: Inverter Monitoring Portals */}
          <div
            id="service-card-inverter"
            onClick={() => onNavigateTab('inverters')}
            className="group relative bg-white p-6 rounded-2xl border border-stone-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 8 Portals
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-600 transition-colors mb-1">
                Inverter Portals &amp; Status
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-4">
                Access official web clouds: Livoltek, Solis, GoodWe, Huawei, Growatt, SolarEdge,
                Fronius, and Deye/Solarman without downloading extra apps.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-semibold text-stone-800">
              <span className="text-stone-500">Telemetry &amp; Alarms</span>
              <span className="flex items-center gap-1 text-emerald-600 group-hover:translate-x-1 transition-transform">
                View Portals <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 3: Solar Installation & Calculator */}
          <div
            id="service-card-calculator"
            onClick={() => onNavigateTab('calculator')}
            className="group relative bg-white p-6 rounded-2xl border border-stone-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Calculator className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  Interactive
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-600 transition-colors mb-1">
                System Size &amp; Savings Calculator
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-4">
                Determine the optimal system capacity (kW), required roof area, and estimated monthly
                PKR bill reduction with On-Grid net-metering and Hybrid setups.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-semibold text-stone-800">
              <span className="text-amber-700">Instant Estimate &amp; Quote</span>
              <span className="flex items-center gap-1 text-amber-600 group-hover:translate-x-1 transition-transform">
                Calculate Now <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Card 4: Technical Complaints & Support */}
          <div
            id="service-card-complaints"
            onClick={onOpenComplaintModal}
            className="group relative bg-white p-6 rounded-2xl border border-stone-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                  Priority Dispatch
                </span>
              </div>
              <h3 className="text-base font-bold text-stone-900 group-hover:text-rose-600 transition-colors mb-1">
                Register Service Complaint
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-4">
                Experiencing inverter error codes, earthing trip, or generation drop? File a ticket
                for immediate technician diagnosis and on-site support.
              </p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs font-semibold text-stone-800">
              <span className="text-stone-500">Avg response: &lt; 2 hours</span>
              <span className="flex items-center gap-1 text-rose-600 group-hover:translate-x-1 transition-transform">
                File Ticket <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Support Callout */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <MessageCircle className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Need Immediate Solar Assistance?</h3>
            <p className="text-emerald-100 text-xs max-w-lg mt-0.5">
              Connect directly with our senior solar engineers and service coordinators on WhatsApp
              for rapid help.
            </p>
          </div>
        </div>

        <button
          id="hero-whatsapp-connect-btn"
          onClick={() =>
            handleWhatsApp(
              settings.whatsapp_support,
              'Hello K&S Solar team, I need support with my solar system in ' + user.city,
            )
          }
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shrink-0 flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat on WhatsApp</span>
        </button>
      </div>
    </div>
  );
};
