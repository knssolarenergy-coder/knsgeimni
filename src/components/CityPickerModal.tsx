import React, { useState } from 'react';
import { X, MapPin, Check, Search } from 'lucide-react';
import { CITIES } from '../data/mockData';

interface CityPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  onSelectCity: (city: string) => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  onSelectCity,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="absolute inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl max-h-[80%] flex flex-col shadow-2xl border-t border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 mb-2" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-stone-900 text-base">Select Your City</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/60">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Pakistani city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* City List */}
        <div className="overflow-y-auto p-3 space-y-1 divide-y divide-stone-100 flex-1">
          {filtered.map((city) => {
            const isSelected = city.toLowerCase() === currentCity.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => {
                  onSelectCity(city);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-amber-50 text-amber-950 font-bold border border-amber-200'
                    : 'text-stone-700 hover:bg-stone-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">📍</span>
                  <span className="text-sm">{city}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
