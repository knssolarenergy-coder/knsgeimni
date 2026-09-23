import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Send, MessageCircle } from 'lucide-react';
import { Complaint, ComplaintSubject, UserProfile } from '../types';
import { CITIES } from '../data/mockData';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onComplaintCreated: (complaint: Complaint) => void;
  whatsappNumber: string;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  user,
  onComplaintCreated,
  whatsappNumber,
}) => {
  const [customerName, setCustomerName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city || 'Lahore');
  const [subject, setSubject] = useState<ComplaintSubject>('low_generation');
  const [description, setDescription] = useState('');
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !description) return;

    const newComplaint: Complaint = {
      id: `KSC-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      phone,
      city,
      subject,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onComplaintCreated(newComplaint);
    setSubmittedComplaint(newComplaint);
  };

  const handleResetAndClose = () => {
    setSubmittedComplaint(null);
    onClose();
  };

  const handleWhatsAppEscalation = () => {
    if (!submittedComplaint) return;
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `URGENT Complaint Ticket #${submittedComplaint.id} registered for ${submittedComplaint.customerName} (${submittedComplaint.city}). Subject: ${submittedComplaint.subject}. Details: ${submittedComplaint.description}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
        <button
          id="close-complaint-modal-btn"
          onClick={handleResetAndClose}
          className="absolute right-5 top-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedComplaint ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900">Complaint Ticket Registered</h3>
              <p className="text-xs text-stone-500">
                Ticket Reference:{' '}
                <span className="font-mono font-bold text-stone-800">
                  #{submittedComplaint.id}
                </span>
              </p>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-800">{submittedComplaint.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">City:</span>
                <span className="font-semibold text-stone-800">{submittedComplaint.city}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Issue Category:</span>
                <span className="font-semibold text-stone-800 capitalize">
                  {submittedComplaint.subject.replace('_', ' ')}
                </span>
              </div>
              <div className="py-1">
                <span className="text-stone-500 block mb-0.5">Reported Issue:</span>
                <p className="text-stone-800 italic bg-white p-2 rounded-lg border border-stone-200">
                  "{submittedComplaint.description}"
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="complaint-escalate-whatsapp-btn"
                onClick={handleWhatsAppEscalation}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Escalate Immediately on WhatsApp</span>
              </button>
              <button
                id="complaint-done-btn"
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">File Technical Support Ticket</h2>
                <p className="text-xs text-stone-500">Fast on-site dispatch for solar and inverter faults</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="complaint-name-input"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="complaint-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                  <select
                    id="complaint-city-select"
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Issue Category
                  </label>
                  <select
                    id="complaint-subject-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as ComplaintSubject)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="inverter_offline">Inverter Offline / Fault Code</option>
                    <option value="low_generation">Low Generation / Yield Drop</option>
                    <option value="washing_issue">Washing Quality / Water Spots</option>
                    <option value="wiring_leakage">Earthing / Wiring Leakage</option>
                    <option value="other">Other System Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Describe Fault Details &amp; Symptoms
                </label>
                <textarea
                  id="complaint-description-input"
                  rows={4}
                  required
                  placeholder="Include error codes displayed on inverter screen, recent weather events, or unexpected sounds..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <button
                id="submit-complaint-ticket-btn"
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Support Ticket</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
