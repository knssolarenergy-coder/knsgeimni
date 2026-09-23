import React, { useState } from 'react';
import {
  Droplets,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { Booking, PanelType, PreferredTime, UserProfile } from '../types';

interface MobileBookWashProps {
  user: UserProfile;
  onBookingCreated: (booking: Booking) => void;
  onNavigateHome: () => void;
  whatsappNumber: string;
}

export const MobileBookWash: React.FC<MobileBookWashProps> = ({
  user,
  onBookingCreated,
  onNavigateHome,
  whatsappNumber,
}) => {
  const [panelCount, setPanelCount] = useState<number>(18);
  const [panelType, setPanelType] = useState<PanelType>('monocrystalline');
  const [preferredDate, setPreferredDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [preferredTime, setPreferredTime] = useState<PreferredTime>('morning');
  const [address, setAddress] = useState('House #14, Street 8, Phase 4');
  const [customerName, setCustomerName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [notes, setNotes] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Pricing: PKR 200/panel with 10% discount for >= 24 panels
  const rawPrice = panelCount * 200;
  const hasDiscount = panelCount >= 24;
  const discountAmount = hasDiscount ? rawPrice * 0.1 : 0;
  const totalPrice = Math.round(rawPrice - discountAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address) return;

    const newBooking: Booking = {
      id: `KSW-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone,
      address,
      city: user.city || 'Lahore',
      panelCount,
      panelType,
      preferredDate,
      preferredTime,
      notes: notes || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedPrice: totalPrice,
    };

    onBookingCreated(newBooking);
    setConfirmedBooking(newBooking);
  };

  const handleWhatsAppBooking = (b: Booking) => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar! I just booked a panel wash order #${b.id}:\n- Panels: ${b.panelCount} (${b.panelType})\n- Date: ${b.preferredDate} (${b.preferredTime})\n- City: ${b.city}\n- Address: ${b.address}\n- Total Price: PKR ${b.estimatedPrice}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (confirmedBooking) {
    return (
      <div className="p-5 flex flex-col items-center justify-center min-h-[500px] text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg border-4 border-emerald-50">
          <CheckCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Booking Confirmed!
          </span>
          <h2 className="text-xl font-extrabold text-stone-900 mt-2">
            Order #{confirmedBooking.id}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            K&amp;S technician dispatched for {confirmedBooking.preferredDate} ({confirmedBooking.preferredTime})
          </p>
        </div>

        {/* Order Details Card */}
        <div className="w-full bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-2.5 text-xs text-stone-700">
          <div className="flex justify-between pb-2 border-b border-stone-200">
            <span className="text-stone-500">Service:</span>
            <span className="font-bold text-stone-900">De-ionized Pressure Wash</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Total Panels:</span>
            <span className="font-semibold text-stone-900">{confirmedBooking.panelCount} Units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Location:</span>
            <span className="font-semibold text-stone-900">{confirmedBooking.city}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-stone-200 text-sm">
            <span className="font-bold text-stone-900">Total Amount:</span>
            <span className="font-extrabold text-emerald-600">PKR {confirmedBooking.estimatedPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          <button
            onClick={() => handleWhatsAppBooking(confirmedBooking)}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send Details via WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setConfirmedBooking(null);
              onNavigateHome();
            }}
            className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-amber-500" />
            Book Panel Washing
          </h2>
          <p className="text-xs text-stone-500">
            Professional de-mineralized solar panel pressure wash
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          City: {user.city}
        </span>
      </div>

      {/* Panel Stepper Card */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700">Number of Solar Panels</span>
          <span className="text-base font-extrabold text-amber-600">
            {panelCount} Panels
          </span>
        </div>

        {/* Stepper buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPanelCount(Math.max(4, panelCount - 2))}
            className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-90 flex items-center justify-center text-stone-800 font-bold transition"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <div className="flex-1 text-center bg-stone-50 py-2.5 rounded-xl border border-stone-200">
            <span className="text-xl font-extrabold text-stone-900">{panelCount}</span>
            <span className="text-[11px] text-stone-500 block">units (~{(panelCount * 0.55).toFixed(1)} kW)</span>
          </div>

          <button
            type="button"
            onClick={() => setPanelCount(Math.min(120, panelCount + 2))}
            className="w-12 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-90 flex items-center justify-center text-stone-800 font-bold transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick select chips */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[12, 18, 24, 36].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPanelCount(num)}
              className={`py-1.5 rounded-lg text-xs font-bold transition ${
                panelCount === num
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {num} Pcs
            </button>
          ))}
        </div>
      </div>

      {/* Panel Tech Type */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-2">
        <label className="text-xs font-bold text-stone-700 block">
          Panel Glass Technology
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'monocrystalline', label: 'Mono Perc', desc: 'Standard' },
              { id: 'bifacial', label: 'Bifacial Glass', desc: 'Dual side' },
              { id: 'polycrystalline', label: 'Poly Blue', desc: 'Older' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanelType(item.id)}
              className={`p-2.5 rounded-xl border text-center transition ${
                panelType === item.id
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className="text-[10px] text-stone-500">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Slot */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <label className="text-xs font-bold text-stone-700 block">
          Preferred Date &amp; Shift
        </label>

        <div className="relative">
          <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'morning', label: 'Morning', time: '8am - 12pm' },
              { id: 'afternoon', label: 'Afternoon', time: '12pm - 4pm' },
              { id: 'evening', label: 'Evening', time: '4pm - 7pm' },
            ] as const
          ).map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setPreferredTime(slot.id)}
              className={`p-2 rounded-xl border text-center transition ${
                preferredTime === slot.id
                  ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                  : 'border-stone-200 text-stone-600'
              }`}
            >
              <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-stone-400" />
              <div className="text-xs">{slot.label}</div>
              <div className="text-[9px] text-stone-500">{slot.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Address & Customer Input */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        <label className="text-xs font-bold text-stone-700 block">
          Service Location in {user.city}
        </label>
        <div>
          <input
            type="text"
            placeholder="Street address, house #, sector..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Your Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden"
            required
          />
          <input
            type="tel"
            placeholder="0300-1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden"
            required
          />
        </div>
      </div>

      {/* Pricing Summary Card */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-300">
          <span>Rate (PKR 200 × {panelCount} panels)</span>
          <span>PKR {rawPrice.toLocaleString()}</span>
        </div>

        {hasDiscount && (
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 10% Volume Discount (≥24 panels)
            </span>
            <span>- PKR {discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
              Estimated Total
            </span>
            <span className="text-xl font-extrabold text-amber-400">
              PKR {totalPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pay on completion</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        id="mobile-confirm-booking-btn"
        type="button"
        onClick={handleSubmit}
        className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-400 active:scale-98 text-stone-950 font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
      >
        <span>Confirm &amp; Place Wash Order</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </button>
    </div>
  );
};
