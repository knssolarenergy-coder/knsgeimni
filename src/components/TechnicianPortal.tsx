import React, { useState, useEffect } from 'react';
import {
  Booking,
  Complaint,
  QuoteRequest,
  Technician,
  TechJobProgress,
  BookingStatus,
  ComplaintStatus,
  AppSettings,
  WorkingSite,
  AttendanceRecord,
} from '../types';
import {
  Wrench,
  Droplets,
  AlertCircle,
  FileText,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Shield,
  Send,
  Calendar,
  ExternalLink,
  Globe,
  Radio,
  Check,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface TechnicianPortalProps {
  technicians: Technician[];
  activeTechId: string;
  onSelectTechnician: (techId: string) => void;
  onUpdateTechStatus: (techId: string, status: Technician['status']) => void;
  bookings: Booking[];
  complaints: Complaint[];
  quotes: QuoteRequest[];
  settings?: AppSettings;
  onUpdateBookingProgress: (bookingId: string, progress: TechJobProgress, notes?: string) => void;
  onUpdateComplaintStatus: (complaintId: string, status: ComplaintStatus, notes?: string) => void;
  onUpdateQuoteNotes: (quoteId: string, notes: string) => void;
  onNavigateHome: () => void;
  onLogout?: () => void;
}

export function TechnicianPortal({
  technicians,
  activeTechId,
  onSelectTechnician,
  onUpdateTechStatus,
  bookings,
  complaints,
  quotes,
  settings,
  onUpdateBookingProgress,
  onUpdateComplaintStatus,
  onUpdateQuoteNotes,
  onNavigateHome,
  onLogout,
}: TechnicianPortalProps) {
  const currentTech = technicians.find((t) => t.id === activeTechId) || technicians[0];

  const [activeFilter, setActiveFilter] = useState<'all' | 'washing' | 'complaints' | 'surveys' | 'sites'>('all');
  const [selectedBookingForNote, setSelectedBookingForNote] = useState<Booking | null>(null);
  const [techNoteInput, setTechNoteInput] = useState<string>('');
  const [selectedComplaintForNote, setSelectedComplaintForNote] = useState<Complaint | null>(null);
  const [complaintNoteInput, setComplaintNoteInput] = useState<string>('');
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>(() => StorageService.getWorkingSites());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => StorageService.getAttendanceRecords());
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState('');

  // Silent Background Location Tracking:
  // Updates current technician's coordinates silently to Admin live dispatch map
  // WITHOUT showing any UI, tracking radar, or alerts to the technician.
  useEffect(() => {
    if (!currentTech?.id) return;
    const cleanup = StorageService.startSilentTechnicianTracking(currentTech.id);
    return () => {
      cleanup();
    };
  }, [currentTech?.id]);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceRecords.find(
    (a) => a.technicianId === currentTech?.id && a.date === todayStr
  );
  const isCheckedInToday = !!todayRecord;

  // Assigned Tasks for Current Technician
  const techBookings = bookings.filter(
    (b) =>
      b.assignedTechnicianId === currentTech?.id ||
      b.assignedTechnicianIds?.includes(currentTech?.id) ||
      b.assignedTechnicianName?.toLowerCase().includes(currentTech?.name.toLowerCase())
  );
  const techComplaints = complaints.filter(
    (c) =>
      c.assignedTechnicianId === currentTech?.id ||
      c.assignedTechnicianIds?.includes(currentTech?.id) ||
      c.assignedTechnicianName?.toLowerCase().includes(currentTech?.name.toLowerCase())
  );
  const techQuotes = quotes.filter(
    (q) =>
      q.assignedTechnicianId === currentTech?.id ||
      q.assignedTechnicianIds?.includes(currentTech?.id)
  );
  const techSites = workingSites.filter(
    (s) =>
      s.assignedTechnicianNames?.includes(currentTech?.name) ||
      s.assignedTechnicianNames?.some((n) => currentTech?.name?.includes(n))
  );

  const activeWashings = techBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');
  const completedWashings = techBookings.filter((b) => b.status === 'completed');

  const handleOpenWhatsApp = (phone: string, customerName: string, jobTitle: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${customerName}, I am ${currentTech.name} from K&S Solar Energy team regarding your ${jobTitle}.`
    );
    window.open(`https://wa.me/${intlPhone}?text=${msg}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleSupportWhatsApp = () => {
    const num = settings?.whatsapp_support || '923280454939';
    const cleanPhone = num.replace(/[^0-9]/g, '');
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Assalam-o-Alaikum K&S Solar Admin, I am Technician ${currentTech?.name}. Requesting operational assistance.`
      )}`,
      '_blank'
    );
  };

  const handleCheckInNow = () => {
    if (!currentTech) return;
    const locName = `${currentTech.city} District Site · GPS Verified`;
    const rec = StorageService.recordAttendance(currentTech.id, currentTech.name, locName);
    setAttendanceRecords(StorageService.getAttendanceRecords());
    setAttendanceSuccessMessage(`Check-in recorded at ${rec.checkInTime} with GPS stamp!`);
    setTimeout(() => {
      setAttendanceSuccessMessage('');
      setIsAttendanceModalOpen(false);
    }, 1800);
  };

  return (
    <div className="bg-slate-100 min-h-screen pb-24 text-slate-800">
      {/* Top Teal Header Banner (Matching Screenshots 14 & 18) */}
      <div className="bg-gradient-to-b from-[#008ea6] to-[#0096aa] text-white pt-3 pb-6 px-4 shadow-md">
        {/* Top Pills Row with Back, Tech badge, Online indicator & Logout */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateHome}
              title="Back to Customer App"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white active:scale-90 transition shrink-0"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-extrabold tracking-wider uppercase backdrop-blur-xs">
              <Wrench className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>TECH</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log Out"
                className="w-8 h-8 rounded-full bg-rose-500/30 hover:bg-rose-500/50 border border-rose-300/40 flex items-center justify-center text-white active:scale-90 transition shrink-0"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>

        {/* Center Logo Card */}
        <div className="flex flex-col items-center justify-center text-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center mb-2 ring-2 ring-white/50">
            <img
              src="/ks-solar-logo.png"
              alt="K&S Solar Energy Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <p className="text-[11px] font-extrabold text-teal-100 tracking-widest uppercase">
            🏢 TECHNICIAN PORTAL
          </p>
          <p className="text-xs text-white/80 font-medium mt-0.5">Welcome back,</p>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-xl font-black text-white">{currentTech?.name}</h2>
            <span className="text-base">🔧</span>
          </div>

          {/* Quick Profile Switcher */}
          <div className="mt-2 relative">
            <select
              value={currentTech?.id}
              onChange={(e) => onSelectTechnician(e.target.value)}
              className="bg-teal-900/40 hover:bg-teal-900/60 border border-white/30 text-white text-xs rounded-full px-3.5 py-1 pr-7 font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  Switch to: {t.name} ({t.city})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-3">
        {/* 4 Stat Badges in a Row (Screenshot 18) */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveFilter('washing')}
            className={`p-2 rounded-2xl text-center border transition shadow-xs ${
              activeFilter === 'washing'
                ? 'bg-blue-600 text-white border-blue-600 font-bold'
                : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
            }`}
          >
            <p className="text-base font-black leading-none">{techBookings.length}</p>
            <p className="text-[10px] mt-1 font-semibold opacity-90 leading-tight">Bookings</p>
          </button>

          <button
            onClick={() => setActiveFilter('complaints')}
            className={`p-2 rounded-2xl text-center border transition shadow-xs ${
              activeFilter === 'complaints'
                ? 'bg-rose-600 text-white border-rose-600 font-bold'
                : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50'
            }`}
          >
            <p className="text-base font-black leading-none">{techComplaints.length}</p>
            <p className="text-[10px] mt-1 font-semibold opacity-90 leading-tight">Complaints</p>
          </button>

          <button
            onClick={() => setActiveFilter('sites')}
            className={`p-2 rounded-2xl text-center border transition shadow-xs ${
              activeFilter === 'sites'
                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <p className="text-base font-black leading-none">{workingSites.length}</p>
            <p className="text-[10px] mt-1 font-semibold opacity-90 leading-tight">Sites</p>
          </button>

          <button
            onClick={() => setActiveFilter('surveys')}
            className={`p-2 rounded-2xl text-center border transition shadow-xs ${
              activeFilter === 'surveys'
                ? 'bg-purple-600 text-white border-purple-600 font-bold'
                : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50'
            }`}
          >
            <p className="text-base font-black leading-none">{techQuotes.length}</p>
            <p className="text-[10px] mt-1 font-semibold opacity-90 leading-tight">Visits</p>
          </button>
        </div>

        {/* 2x2 Grid of Quick Cards (Screenshot 18) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Bookings */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'washing' ? 'all' : 'washing')}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-blue-300 transition"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5 fill-blue-500 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Bookings</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{techBookings.length} assigned</p>
            </div>
          </div>

          {/* Card 2: Complaints */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'complaints' ? 'all' : 'complaints')}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-rose-300 transition"
          >
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Complaints</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{techComplaints.length} assigned</p>
            </div>
          </div>

          {/* Card 3: Sites */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'sites' ? 'all' : 'sites')}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-emerald-300 transition"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Sites</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{workingSites.length} assigned</p>
            </div>
          </div>

          {/* Card 4: Site Visits */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'surveys' ? 'all' : 'surveys')}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-purple-300 transition"
          >
            <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Site Visits</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{techQuotes.length} assigned</p>
            </div>
          </div>
        </div>

        {/* Full-width Attendance Card (Screenshot 18) */}
        <div
          onClick={() => setIsAttendanceModalOpen(true)}
          className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-cyan-400 transition active:scale-99"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 leading-tight">Attendance</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isCheckedInToday
                  ? `Checked in at ${todayRecord.checkInTime}`
                  : 'Not checked in today'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>

        {/* Active Filter Title */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {activeFilter === 'all' ? 'Assigned Field Jobs' : `${activeFilter.toUpperCase()} JOBS`}
          </p>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-xs text-[#0096aa] font-bold"
            >
              Show All
            </button>
          )}
        </div>

        {/* Assigned Job Cards (Screenshot 18) */}
        <div className="space-y-3">
          {/* Washings / Bookings */}
          {(activeFilter === 'all' || activeFilter === 'washing') &&
            techBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      💧
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{b.customerName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {b.id} · {b.assignedTechnicianName || currentTech.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : b.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    ● {b.status.toUpperCase()}
                  </span>
                </div>

                {/* Details Badges Row (Screenshot 18) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">📍 {b.city}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">⊞ {b.panelCount} panels</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">📅 {b.preferredDate}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">🕒 {b.preferredTime}</span>
                </div>

                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">🏠 Address:</span>
                  <span>{b.address}</span>
                </div>

                {/* Job Progress Update Buttons */}
                <div className="border-t border-slate-100 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCall(b.phone)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(b.phone, b.customerName, 'Solar Washing Service')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1 border border-emerald-200"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Status Steps */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateBookingProgress(b.id, 'en_route', 'Technician on the way')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        b.techJobProgress === 'en_route'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      En Route
                    </button>
                    <button
                      onClick={() => onUpdateBookingProgress(b.id, 'working', 'Washing in progress')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        b.techJobProgress === 'working'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Working
                    </button>
                    <button
                      onClick={() => onUpdateBookingProgress(b.id, 'completed', 'Wash completed and tested')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        b.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      }`}
                    >
                      Done ✓
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {/* Complaints */}
          {(activeFilter === 'all' || activeFilter === 'complaints') &&
            techComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{c.customerName}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {c.id} · {c.subject.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    ● {c.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                  {c.description}
                </p>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCall(c.phone)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(c.phone, c.customerName, 'Inverter Complaint')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200"
                    >
                      WhatsApp
                    </button>
                  </div>

                  <button
                    onClick={() => onUpdateComplaintStatus(c.id, c.status === 'resolved' ? 'in_progress' : 'resolved')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      c.status === 'resolved'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {c.status === 'resolved' ? 'Reopen' : 'Mark Resolved ✓'}
                  </button>
                </div>
              </div>
            ))}

          {/* Working Sites */}
          {(activeFilter === 'all' || activeFilter === 'sites') &&
            workingSites.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {s.clientName} · {s.phone}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ● Active
                  </span>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span>📍 {s.address}</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Techs: {s.assignedTechnicianNames.join(', ')}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* Big Action Cards (Screenshot 19) */}
        <div className="space-y-3 pt-2">
          {/* Card: My Jobs */}
          <div
            onClick={() => setActiveFilter('all')}
            className="bg-[#1e88e5] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-blue-600 transition"
          >
            <div>
              <h3 className="text-base font-black">My Jobs</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                View and manage your assigned bookings &amp; complaints
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-white shrink-0" />
          </div>

          {/* Card: WhatsApp Support */}
          <div
            onClick={handleSupportWhatsApp}
            className="bg-[#2e7d32] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between cursor-pointer hover:bg-emerald-700 transition"
          >
            <div>
              <h3 className="text-base font-black">WhatsApp Support</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Contact admin or office via WhatsApp
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-white shrink-0" />
          </div>
        </div>

        {/* Follow Us Section (Screenshot 19) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Follow Us
          </h4>
          <button
            onClick={() => window.open(settings?.website_url || 'https://knssolar.com.pk', '_blank')}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-600" />
              <span>Official Website</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Contact Us Section (Screenshot 19) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Contact Us
          </h4>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 w-16">Phone:</span>
              <span className="font-mono text-cyan-700 font-bold">{settings?.contact_phone || '923280454939'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 w-16">Email:</span>
              <span className="text-slate-600">{settings?.contact_email || 'info@knssolar.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 w-16">Hours:</span>
              <span className="text-slate-600">{settings?.contact_hours || '8:30am to 6:00pm'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0096aa]" />
                <h3 className="font-black text-slate-900 text-base">Daily Attendance</h3>
              </div>
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <p className="text-xs text-slate-500 font-medium">Technician Name</p>
              <h4 className="text-base font-black text-slate-900">{currentTech?.name}</h4>
              <p className="text-xs text-cyan-700 font-semibold">{currentTech?.city} Operations Hub</p>
            </div>

            {attendanceSuccessMessage ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{attendanceSuccessMessage}</span>
              </div>
            ) : isCheckedInToday ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-center text-xs text-emerald-800 font-semibold space-y-1">
                <p className="font-bold">✓ Already Checked In Today</p>
                <p className="text-[11px] text-emerald-700">
                  Time: {todayRecord.checkInTime}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Status: Not Checked In</p>
                <p className="text-[11px] text-slate-500">
                  Tap below to record your check-in time for today's field duty.
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                onClick={handleCheckInNow}
                disabled={isCheckedInToday}
                className={`w-full py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition ${
                  isCheckedInToday
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0096aa] hover:bg-[#008294] text-white shadow-md active:scale-98'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{isCheckedInToday ? 'Checked In for Today' : 'Record Check-In Now'}</span>
              </button>

              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
