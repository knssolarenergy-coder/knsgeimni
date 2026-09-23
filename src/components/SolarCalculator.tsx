import React, { useState } from 'react';
import {
  Calculator,
  Zap,
  TrendingUp,
  DollarSign,
  Maximize2,
  Calendar,
  Send,
  CheckCircle,
  HelpCircle,
  BatteryCharging,
} from 'lucide-react';
import { PropertyType, QuoteRequest, SystemType, UserProfile } from '../types';
import { CITIES } from '../data/mockData';

interface SolarCalculatorProps {
  user: UserProfile;
  onSubmitQuote: (quote: QuoteRequest) => void;
}

export const SolarCalculator: React.FC<SolarCalculatorProps> = ({ user, onSubmitQuote }) => {
  const [systemSizeKw, setSystemSizeKw] = useState<number>(10);
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [systemType, setSystemType] = useState<SystemType>('hybrid');
  const [batteryBackup, setBatteryBackup] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city || 'Lahore');
  const [isQuoteSent, setIsQuoteSent] = useState(false);

  // Calculations
  const dailyKwh = Math.round(systemSizeKw * 4.8);
  const monthlyKwh = Math.round(dailyKwh * 30);
  const annualKwh = Math.round(dailyKwh * 365);

  const tariffPerUnit = propertyType === 'commercial' ? 72 : propertyType === 'industrial' ? 68 : 58;
  const estimatedMonthlySavingsPkr = monthlyKwh * tariffPerUnit;
  const estimatedAnnualSavingsPkr = estimatedMonthlySavingsPkr * 12;

  const costPerKw =
    systemType === 'on_grid' ? 120000 : systemType === 'hybrid' ? 165000 : 200000;
  const batteryAddon = batteryBackup ? systemSizeKw * 25000 : 0;
  const estimatedTotalCostPkr = Math.round(systemSizeKw * costPerKw + batteryAddon);
  const paybackYears = (estimatedTotalCostPkr / estimatedAnnualSavingsPkr).toFixed(1);
  const requiredRoofSqFt = systemSizeKw * 75;

  const handleRequestQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) return;

    const newQuote: QuoteRequest = {
      id: `KSQ-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone,
      city,
      systemSizeKw,
      propertyType,
      systemType,
      batteryBackup,
      estimatedCostPkr: estimatedTotalCostPkr,
      estimatedMonthlySavingsPkr,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSubmitQuote(newQuote);
    setIsQuoteSent(true);
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-500" />
          Solar Sizing &amp; ROI Calculator
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Estimate energy yield, rooftop area, and PKR bill savings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 items-start">
        {/* Left: Interactive Controls */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          {/* System Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                System Capacity (kW)
              </label>
              <span className="text-lg font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                {systemSizeKw} kW
              </span>
            </div>
            <input
              id="calculator-capacity-slider"
              type="range"
              min={3}
              max={50}
              step={1}
              value={systemSizeKw}
              onChange={(e) => setSystemSizeKw(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-stone-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1 font-semibold">
              <span>3 kW (Small Home)</span>
              <span>10 kW (Standard Villa)</span>
              <span>25 kW (Commercial)</span>
              <span>50 kW (Industrial)</span>
            </div>
          </div>

          {/* Property Type Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
              Property Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['residential', 'commercial', 'industrial'] as PropertyType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  id={`prop-type-${type}`}
                  onClick={() => setPropertyType(type)}
                  className={`p-3 rounded-2xl border text-xs font-bold capitalize transition-all ${
                    propertyType === type
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* System Architecture */}
          <div>
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
              Inverter &amp; System Setup
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'on_grid', label: 'On-Grid', sub: 'Net Metering' },
                { id: 'hybrid', label: 'Hybrid', sub: 'Grid + Battery' },
                { id: 'off_grid', label: 'Off-Grid', sub: 'Stand-alone' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  id={`sys-type-${s.id}`}
                  onClick={() => setSystemType(s.id as SystemType)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    systemType === s.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <p className="text-xs font-bold">{s.label}</p>
                  <p className="text-[10px] text-stone-500">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Battery Storage Checkbox */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2.5">
              <BatteryCharging className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-stone-800">Lithium-ion Battery Storage</p>
                <p className="text-[10px] text-stone-500">Uninterrupted load-shedding backup</p>
              </div>
            </div>
            <input
              id="calculator-battery-checkbox"
              type="checkbox"
              checked={batteryBackup}
              onChange={(e) => setBatteryBackup(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Real-time Stats & Quote Request */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Metrics Display */}
          <div className="bg-stone-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Est. Monthly Savings
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                  PKR {estimatedMonthlySavingsPkr.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  Payback Period
                </span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">~{paybackYears} Years</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-800/80 p-3 rounded-xl">
                <span className="text-stone-400 text-[10px] uppercase font-semibold">
                  Daily Generation
                </span>
                <p className="text-base font-bold text-white mt-0.5">{dailyKwh} kWh / day</p>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-xl">
                <span className="text-stone-400 text-[10px] uppercase font-semibold">
                  Monthly Generation
                </span>
                <p className="text-base font-bold text-white mt-0.5">{monthlyKwh} Units</p>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-xl">
                <span className="text-stone-400 text-[10px] uppercase font-semibold">
                  Roof Space Required
                </span>
                <p className="text-base font-bold text-white mt-0.5">~{requiredRoofSqFt} sq ft</p>
              </div>
              <div className="bg-stone-800/80 p-3 rounded-xl">
                <span className="text-stone-400 text-[10px] uppercase font-semibold">
                  Approx. Turnkey Cost
                </span>
                <p className="text-sm font-bold text-amber-300 mt-0.5">
                  PKR {(estimatedTotalCostPkr / 100000).toFixed(1)} Lacs
                </p>
              </div>
            </div>
          </div>

          {/* Quick Quote Request Form */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
            {isQuoteSent ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-stone-900 text-sm">Quote Request Received!</h4>
                <p className="text-xs text-stone-500">
                  Our system design engineer will contact you shortly with an official engineering proposal.
                </p>
                <button
                  onClick={() => setIsQuoteSent(false)}
                  className="mt-2 text-xs font-semibold text-amber-600 underline"
                >
                  Calculate another system
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestQuote} className="space-y-3">
                <h4 className="font-bold text-stone-900 text-sm">Request Official EPC Quotation</h4>
                <p className="text-[11px] text-stone-500">
                  Receive a detailed CAD layout, tier-1 panel breakdown, and Net-Metering feasibility report.
                </p>

                <div className="space-y-2">
                  <input
                    id="quote-name-input"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <input
                    id="quote-phone-input"
                    type="tel"
                    required
                    placeholder="Mobile / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <select
                    id="quote-city-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="submit-quote-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Quote Request</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
