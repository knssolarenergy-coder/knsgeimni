import React, { useState } from 'react';
import { X, Droplets, Calendar, Clock, MapPin, CheckCircle, Info, Sparkles } from 'lucide-react';
import { Booking, PanelType, PreferredTime, UserProfile } from '../types';
import { CITIES } from '../data/mockData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onBookingCreated: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  user,
  onBookingCreated,
}) => {
  const [customerName, setCustomerName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city || 'Lahore');
  const [address, setAddress] = useState('House #42, Block B, DHA Phase 5');
  const [panelCount, setPanelCount] = useState<number>(16);
  const [panelType, setPanelType] = useState<PanelType>('monocrystalline');
  const [preferredDate, setPreferredDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0],
  );
  const [preferredTime, setPreferredTime] = useState<PreferredTime>('morning');
  const [notes, setNotes] = useState('');
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);

  if (!isOpen) return null;

  // Calculation: PKR 200/panel with 10% discount for >= 24 panels
  const rawPrice = panelCount * 200;
  const discount = panelCount >= 24 ? rawPrice * 0.1 : 0;
  const totalPrice = Math.round(rawPrice - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !address || !city) return;

    const newBooking: Booking = {
      id: `KSW-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone,
      address,
      city,
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
    setSubmittedBooking(newBooking);
  };

  const handleResetAndClose = () => {
    setSubmittedBooking(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
        <button
          id="close-booking-modal-btn"
          onClick={handleResetAndClose}
          className="absolute right-5 top-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedBooking ? (
          /* Confirmation View */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900">Booking Confirmed!</h3>
              <p className="text-xs text-stone-500">
                Order reference{' '}
                <span className="font-mono font-bold text-stone-800">
                  #{submittedBooking.id}
                </span>
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-800">{submittedBooking.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Service Area:</span>
                <span className="font-semibold text-stone-800">{submittedBooking.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Panels to Wash:</span>
                <span className="font-semibold text-stone-800">
                  {submittedBooking.panelCount} panels ({submittedBooking.panelType})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Scheduled Date:</span>
                <span className="font-semibold text-stone-800">
                  {submittedBooking.preferredDate} ({submittedBooking.preferredTime})
                </span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold">
                <span className="text-stone-900">Total Estimate:</span>
                <span className="text-emerald-700">PKR {submittedBooking.estimatedPrice.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Our dispatch team has received your order and will contact you via phone or WhatsApp
              to confirm your preferred time slot before arrival.
            </p>

            <button
              id="booking-success-done-btn"
              onClick={handleResetAndClose}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          /* Form View */
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">Book Solar Panel Washing</h2>
                <p className="text-xs text-stone-500">Deionized pure-water wash to restore wattage</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="booking-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="booking-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                  <select
                    id="booking-city-select"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Panel Count
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="booking-panel-count-input"
                      type="number"
                      min={4}
                      max={200}
                      value={panelCount}
                      onChange={(e) => setPanelCount(Math.max(4, parseInt(e.target.value) || 4))}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
                    />
                    <span className="text-xs text-stone-500 whitespace-nowrap">panels</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Installation Address
                </label>
                <input
                  id="booking-address-input"
                  type="text"
                  required
                  placeholder="House / Street / Sector / Landmark"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Panel Type
                  </label>
                  <select
                    id="booking-panel-type-select"
                    value={panelType}
                    onChange={(e) => setPanelType(e.target.value as PanelType)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="monocrystalline">Monocrystalline</option>
                    <option value="polycrystalline">Polycrystalline</option>
                    <option value="bifacial">Bifacial (Double-Glass)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    id="booking-date-input"
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Preferred Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Morning', time: '8AM – 12PM' },
                    { id: 'afternoon', label: 'Afternoon', time: '12PM – 4PM' },
                    { id: 'evening', label: 'Evening', time: '4PM – 7PM' },
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setPreferredTime(slot.id as PreferredTime)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        preferredTime === slot.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-bold'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <p className="text-xs font-semibold">{slot.label}</p>
                      <p className="text-[10px] text-stone-500">{slot.time}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Special Instructions / Roof Access
                </label>
                <textarea
                  id="booking-notes-input"
                  rows={2}
                  placeholder="e.g. 2-story building, ladder needed, rooftop water connection available..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Price Calculation Box */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-950">Estimated Service Cost</p>
                  <p className="text-[11px] text-amber-800/80">
                    {panelCount} panels @ PKR 200
                    {discount > 0 && ' (10% volume discount applied)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-amber-950">
                    PKR {totalPrice.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">Pay after job completion</p>
                </div>
              </div>

              <button
                id="submit-booking-order-btn"
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-all active:scale-98"
              >
                Confirm Washing Booking
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
