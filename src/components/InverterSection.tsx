import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, Search, Activity, ShieldCheck, Info } from 'lucide-react';
import { INVERTER_BRANDS } from '../data/mockData';

export const InverterSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBrands = INVERTER_BRANDS.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    brand.tagline.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header & Search */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Inverter Monitoring Portals
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time telemetry, inverter yield, and alarm diagnostics.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="inverter-search-input"
            type="text"
            placeholder="Search inverter brand (Livoltek, Solis...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Security Note Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-950 leading-relaxed">
          <span className="font-bold">Zero Credential Exposure:</span> Official direct link to OEM encrypted portals.
        </div>
      </div>

      {/* Inverter Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredBrands.map((brand) => (
          <div
            key={brand.id}
            id={`inverter-brand-${brand.id}`}
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {brand.statusText}
                </span>
              </div>

              <h3 className="font-bold text-stone-900 text-sm mb-0.5">{brand.name}</h3>
              <p className="text-[11px] text-stone-500 mb-3">{brand.tagline}</p>

              <div className="space-y-1 mb-4">
                {brand.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-stone-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              id={`launch-portal-btn-${brand.id}`}
              href={brand.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Launch Inverter App / Cloud</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
