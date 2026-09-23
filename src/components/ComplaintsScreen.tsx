import React, { useState } from 'react';
import {
  AlertCircle,
  Send,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Wrench,
  MessageCircle,
  Zap,
  Radio,
  Droplets,
  Battery,
  List,
  Edit3,
} from 'lucide-react';
import { Complaint, UserProfile } from '../types';

interface ComplaintsScreenProps {
  user: UserProfile;
  complaints: Complaint[];
  onComplaintCreated: (complaint: Complaint) => void;
  onNavigateHome: () => void;
  onNavigateMyOrders?: () => void;
  whatsappNumber: string;
}

export const ComplaintsScreen: React.FC<ComplaintsScreenProps> = ({
  user,
  complaints,
  onComplaintCreated,
  onNavigateHome,
  onNavigateMyOrders,
  whatsappNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [systemType, setSystemType] = useState<string>('hybrid');
  const [customerName, setCustomerName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.city ? `${user.city}, Pakistan` : '');
  const [details, setDetails] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !details.trim()) return;

    const newTicket: Complaint = {
      id: `KSC-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      city: user.city || 'Lahore',
      address: address.trim(),
      systemCategory: systemType,
      subject: 'other',
      description: `[${systemType.toUpperCase()} SYSTEM] ${details.trim()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onComplaintCreated(newTicket);
    setSubmittedComplaint(newTicket);
  };

  const handleWhatsAppInquiry = (ticket: Complaint) => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar Energy, I just submitted Complaint Ticket #${ticket.id} for my ${ticket.systemCategory || 'solar'} system at ${ticket.address || ticket.city}. Details: ${ticket.description}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 pb-28">
      {/* 1. Bright Red Header Banner (Matches WhatsApp Image 2026-09-23 at 2.58.34 PM) */}
      <div className="bg-[#ef4444] text-white pt-5 pb-5 px-5 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight text-white mb-0.5">Complaints</h1>
        <p className="text-xs text-white/90 font-medium">Submit or track your complaints</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 2. Top Segment Selector (Matches WhatsApp Image 2026-09-23 at 2.58.34 PM) */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              setSubmittedComplaint(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-[#ef4444] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>New Complaint</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'bg-[#ef4444] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>My Complaints</span>
          </button>
        </div>

        {/* 3. NEW COMPLAINT VIEW */}
        {activeTab === 'new' && (
          <div>
            {submittedComplaint ? (
              /* Success Screen */
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Complaint Submitted!</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Ticket Reference <span className="font-mono font-bold text-slate-900">#{submittedComplaint.id}</span>. Our technical dispatch team has been notified.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">System:</span>
                    <span className="font-bold text-slate-800 uppercase">{submittedComplaint.systemCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-bold text-slate-800">{submittedComplaint.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-bold text-slate-800">{submittedComplaint.phone}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppInquiry(submittedComplaint)}
                    className="w-full py-3 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Follow up on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <List className="w-4 h-4" />
                    <span>View My Complaints</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Complaint Submission Form (Exact match to screenshot) */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 2x2 System Type Selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Hybrid System */}
                  <button
                    type="button"
                    onClick={() => setSystemType('hybrid')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-2.5 transition text-left active:scale-98 ${
                      systemType === 'hybrid'
                        ? 'bg-red-50/70 border-red-500 ring-2 ring-red-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Zap className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-bold">Hybrid System</span>
                  </button>

                  {/* Option 2: OnGrid System */}
                  <button
                    type="button"
                    onClick={() => setSystemType('ongrid')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-2.5 transition text-left active:scale-98 ${
                      systemType === 'ongrid'
                        ? 'bg-red-50/70 border-red-500 ring-2 ring-red-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Zap className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-bold">OnGrid System</span>
                  </button>

                  {/* Option 3: Off-Grid System */}
                  <button
                    type="button"
                    onClick={() => setSystemType('offgrid')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-2.5 transition text-left active:scale-98 ${
                      systemType === 'offgrid'
                        ? 'bg-red-50/70 border-red-500 ring-2 ring-red-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Radio className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-bold">Off-Grid System</span>
                  </button>

                  {/* Option 4: Tubewell System */}
                  <button
                    type="button"
                    onClick={() => setSystemType('tubewell')}
                    className={`p-3.5 rounded-2xl border flex items-center gap-2.5 transition text-left active:scale-98 ${
                      systemType === 'tubewell'
                        ? 'bg-red-50/70 border-red-500 ring-2 ring-red-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Droplets className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-xs font-bold">Tubewell System</span>
                  </button>
                </div>

                {/* Form Inputs Container */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Muhammad Ali"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0300-1234567"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House #, Street, City"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Complaint Details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800">
                      Complaint Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="w-full p-3.5 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-400/20 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button (Matches screenshot: bright red with paper plane icon) */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Complaint</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 4. MY COMPLAINTS VIEW */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/90 shadow-2xs space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-900">No complaints</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  You have no active complaints on record.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className="px-5 py-2.5 rounded-2xl bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xs shadow-xs transition"
                >
                  Create a Complaint
                </button>
              </div>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      Ticket #{c.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    {c.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppInquiry(c)}
                      className="flex items-center gap-1 text-[#00a86b] font-bold hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Follow-up</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
