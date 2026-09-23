import React, { useState } from 'react';
import {
  Calendar,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Droplets,
  Wrench,
  MessageCircle,
  ChevronRight,
  Plus,
  Shield,
  Zap,
} from 'lucide-react';
import { Booking, BookingStatus, Complaint, ComplaintStatus, QuoteRequest, QuoteStatus } from '../types';

interface OrdersTrackerProps {
  bookings: Booking[];
  complaints?: Complaint[];
  quotes?: QuoteRequest[];
  onUpdateStatus?: (id: string, status: BookingStatus) => void;
  onOpenBookingModal: () => void;
  onOpenComplaintModal?: () => void;
  onOpenQuoteModal?: () => void;
  whatsappNumber: string;
}

export const OrdersTracker: React.FC<OrdersTrackerProps> = ({
  bookings = [],
  complaints = [],
  quotes = [],
  onUpdateStatus,
  onOpenBookingModal,
  onOpenComplaintModal,
  onOpenQuoteModal,
  whatsappNumber,
}) => {
  // Top Segment Tabs: 'bookings' | 'complaints' | 'quotes' (Matches Screenshots 1, 2, 3)
  const [activeSegment, setActiveSegment] = useState<'bookings' | 'complaints' | 'quotes'>('bookings');

  // Sub-filters for each segment
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'submitted' | 'in_progress' | 'resolved'>('all');
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'submitted' | 'under_review' | 'quote_sent'>('all');

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    if (complaintFilter === 'submitted') return c.status === 'pending';
    if (complaintFilter === 'in_progress') return c.status === 'in_progress' || c.status === 'assigned';
    if (complaintFilter === 'resolved') return c.status === 'resolved';
    return true;
  });

  // Filtered Quotes
  const filteredQuotes = quotes.filter((q) => {
    if (quoteFilter === 'all') return true;
    if (quoteFilter === 'submitted') return q.status === 'pending';
    if (quoteFilter === 'under_review') return q.status === 'reviewed';
    if (quoteFilter === 'quote_sent') return q.status === 'quoted' || q.status === 'closed';
    return true;
  });

  const handleWhatsAppInquiry = (booking: Booking) => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar Energy, I am inquiring about my wash booking #${booking.id} scheduled for ${booking.preferredDate} in ${booking.city}.`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-28">
      {/* Top Teal Header Banner (Exactly matches Screenshots 1, 2, 3) */}
      <div className="bg-[#0096aa] text-white pt-4 pb-4 px-4 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-white mb-0.5">My Orders</h1>
        <p className="text-xs text-white/85 font-medium mb-3.5">
          Track your bookings, complaints &amp; quotes
        </p>

        {/* 3 Segments Pill Selector (Capsule container) */}
        <div className="bg-black/15 p-1 rounded-2xl flex items-center justify-between gap-1 border border-white/20">
          {/* Segment 1: Bookings */}
          <button
            type="button"
            onClick={() => setActiveSegment('bookings')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSegment === 'bookings'
                ? 'bg-white text-[#008ea6] shadow-sm font-black'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bookings ({bookings.length})</span>
          </button>

          {/* Segment 2: Complaints */}
          <button
            type="button"
            onClick={() => setActiveSegment('complaints')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSegment === 'complaints'
                ? 'bg-white text-[#008ea6] shadow-sm font-black'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Complaints ({complaints.length})</span>
          </button>

          {/* Segment 3: Quotes */}
          <button
            type="button"
            onClick={() => setActiveSegment('quotes')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeSegment === 'quotes'
                ? 'bg-white text-[#008ea6] shadow-sm font-black'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Quotes ({quotes.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Filter Pills (Matching Screenshots 1, 2, 3) */}
      <div className="p-4 space-y-4">
        {/* Sub-filters for BOOKINGS */}
        {activeSegment === 'bookings' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setBookingFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                bookingFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setBookingFilter('pending')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                bookingFilter === 'pending'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setBookingFilter('confirmed')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                bookingFilter === 'confirmed'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setBookingFilter('completed')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                bookingFilter === 'completed'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Completed
            </button>
          </div>
        )}

        {/* Sub-filters for COMPLAINTS */}
        {activeSegment === 'complaints' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setComplaintFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                complaintFilter === 'all'
                  ? 'bg-[#0096aa] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setComplaintFilter('submitted')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                complaintFilter === 'submitted'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Submitted
            </button>
            <button
              onClick={() => setComplaintFilter('in_progress')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                complaintFilter === 'in_progress'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setComplaintFilter('resolved')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                complaintFilter === 'resolved'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>
        )}

        {/* Sub-filters for QUOTES */}
        {activeSegment === 'quotes' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setQuoteFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                quoteFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setQuoteFilter('submitted')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                quoteFilter === 'submitted'
                  ? 'bg-sky-100 text-sky-900 border border-sky-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Submitted
            </button>
            <button
              onClick={() => setQuoteFilter('under_review')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                quoteFilter === 'under_review'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Under Review
            </button>
            <button
              onClick={() => setQuoteFilter('quote_sent')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                quoteFilter === 'quote_sent'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Quote Sent
            </button>
          </div>
        )}

        {/* ================= SECTION 1: BOOKINGS LIST OR EMPTY STATE ================= */}
        {activeSegment === 'bookings' && (
          <div>
            {filteredBookings.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                {/* Outline Calendar Icon in soft light blue rounded square */}
                <div className="w-20 h-20 rounded-3xl bg-[#f0f4f9] border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                  <Calendar className="w-10 h-10 stroke-[1.5] text-slate-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No bookings yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                  Book your first solar panels washing service
                </p>
                <button
                  type="button"
                  onClick={onOpenBookingModal}
                  className="px-6 py-3 rounded-2xl bg-[#091b29] hover:bg-[#0c263a] active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            Wash Booking #{b.id}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {b.panelCount} Panels ({b.panelType})
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Date &amp; Time</span>
                        <span className="font-bold text-slate-800">
                          {b.preferredDate} ({b.preferredTime})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Estimated Price</span>
                        <span className="font-bold text-[#0096aa]">PKR {b.estimatedPrice}</span>
                      </div>
                    </div>

                    {b.assignedTechnicianName && (
                      <div className="flex items-center gap-2 text-xs bg-sky-50 text-sky-900 p-2 rounded-xl border border-sky-100">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span className="font-bold">Technician:</span> {b.assignedTechnicianName}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.city}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleWhatsAppInquiry(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Inquire</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 2: COMPLAINTS LIST OR EMPTY STATE ================= */}
        {activeSegment === 'complaints' && (
          <div>
            {filteredComplaints.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                {/* Outline Alert Icon in soft light blue rounded square */}
                <div className="w-20 h-20 rounded-3xl bg-[#f0f4f9] border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                  <AlertCircle className="w-10 h-10 stroke-[1.5] text-slate-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No complaints</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                  You have no complaints on record
                </p>
                {onOpenComplaintModal && (
                  <button
                    type="button"
                    onClick={onOpenComplaintModal}
                    className="px-6 py-3 rounded-2xl bg-[#0096aa] hover:bg-[#008799] active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Report an Issue</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            Ticket #{c.id}
                          </div>
                          <div className="text-[10px] text-slate-500 capitalize">
                            {c.subject.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          c.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'in_progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 leading-relaxed">
                      {c.description}
                    </p>

                    {c.assignedTechnicianName && (
                      <div className="text-xs text-sky-900 bg-sky-50 p-2 rounded-xl flex items-center gap-1.5 font-bold">
                        <Wrench className="w-3.5 h-3.5 text-sky-600" />
                        <span>Field Tech: {c.assignedTechnicianName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 3: QUOTES LIST OR EMPTY STATE ================= */}
        {activeSegment === 'quotes' && (
          <div>
            {filteredQuotes.length === 0 ? (
              <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
                {/* Outline Box Icon in soft light blue rounded square (Matches Screenshot 1) */}
                <div className="w-20 h-20 rounded-3xl bg-[#f0f4f9] border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
                  <Package className="w-10 h-10 stroke-[1.5] text-slate-500" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No quotes yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                  Request a solar installation quotation from the Installation screen
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenQuoteModal) onOpenQuoteModal();
                  }}
                  className="px-6 py-3 rounded-2xl bg-[#0b63a6] hover:bg-[#09548c] active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Request a Quote</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900">
                            Solar Quote #{q.id}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {q.systemSizeKw} kW ({q.systemType})
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          q.status === 'quoted'
                            ? 'bg-purple-100 text-purple-800'
                            : q.status === 'reviewed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Est. Budget</span>
                        <span className="font-bold text-[#0096aa]">
                          PKR {q.estimatedCostPkr.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Monthly Savings</span>
                        <span className="font-bold text-emerald-600">
                          PKR {q.estimatedMonthlySavingsPkr.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
