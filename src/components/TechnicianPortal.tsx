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
import { KS_LOGO_SRC } from '../assets/logoData';
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
  Search,
  X,
  Filter,
  Sparkles,
  Share2,
  BatteryCharging,
  ShieldCheck,
  Zap,
  Smartphone,
  Lock,
  Sliders,
  Settings,
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

  const [mainView, setMainView] = useState<'active_tasks' | 'my_orders'>('active_tasks');
  const [activeFilter, setActiveFilter] = useState<'all' | 'washing' | 'complaints' | 'surveys' | 'sites'>('all');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'complaints' | 'washing' | 'surveys_sites'>('all');
  const [ordersSearch, setOrdersSearch] = useState<string>('');
  const [editingRemarksJob, setEditingRemarksJob] = useState<{
    id: string;
    type: 'complaint' | 'washing' | 'survey' | 'site';
    title: string;
    note: string;
  } | null>(null);

  const [selectedBookingForNote, setSelectedBookingForNote] = useState<Booking | null>(null);
  const [techNoteInput, setTechNoteInput] = useState<string>('');
  const [selectedComplaintForNote, setSelectedComplaintForNote] = useState<Complaint | null>(null);
  const [complaintNoteInput, setComplaintNoteInput] = useState<string>('');
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>(() => StorageService.getWorkingSites());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => StorageService.getAttendanceRecords());
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState('');
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const wizardSeenKey = `ks_solar_tech_wizard_seen_${currentTech?.id}`;
        return localStorage.getItem(wizardSeenKey) !== 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{
    success: boolean;
    lat?: number;
    lng?: number;
    accuracy?: number;
    error?: string;
    timestamp?: string;
  } | null>(null);

  const handleCloseBatteryModal = () => {
    setIsBatteryModalOpen(false);
    try {
      if (currentTech?.id) {
        localStorage.setItem(`ks_solar_tech_wizard_seen_${currentTech.id}`, 'true');
      }
    } catch (e) {}
  };

  const handleOpenPhoneSettings = () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'OPEN_APP_SETTINGS' })
        );
      } else {
        alert('Apne phone ki Settings > Apps > K&S Solar Energy mein ja kar Location ko "Allow all the time" aur Battery ko "Unrestricted" karein.');
      }
    } catch (e) {}
  };

  const handleTestLivePing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await StorageService.sendImmediateTechLocationPing(currentTech.id);
      setPingResult({
        ...res,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (e: any) {
      setPingResult({
        success: false,
        error: e?.message || 'Failed to ping GPS',
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  // Silent 24/7 Background Location Tracking:
  // Starts native background foreground service in Android APK and keeps continuous tracking active
  // even if technician closes, minimizes, or leaves the app!
  useEffect(() => {
    if (!currentTech?.id) return;

    // 1. Notify React Native WebView wrapper to start 24/7 native Android foreground service
    try {
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'TECHNICIAN_LOGGED_IN',
            technicianId: currentTech.id,
            name: currentTech.name,
            phone: currentTech.phone,
            city: currentTech.city,
          })
        );
      }
    } catch (e) {}

    // 2. Start high-frequency continuous GPS tracking in web/PWA
    const cleanup = StorageService.startSilentTechnicianTracking(currentTech.id);
    return () => {
      cleanup();
    };
  }, [currentTech?.id, currentTech?.name, currentTech?.phone, currentTech?.city]);
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
  const completedWashings = techBookings.filter(
    (b) => b.status === 'completed' || b.techJobProgress === 'completed' || !!b.completedAt
  );

  const resolvedComplaints = techComplaints.filter(
    (c) => c.status === 'resolved' || !!c.resolvedAt
  );
  const activeComplaints = techComplaints.filter((c) => c.status !== 'resolved');

  const completedQuotes = techQuotes.filter(
    (q) => q.status === 'closed' || q.status === 'quoted' || (q.surveyDate && q.technicianNotes)
  );
  const activeQuotes = techQuotes.filter(
    (q) => q.status !== 'closed' && !(q.surveyDate && q.technicianNotes)
  );

  const completedSites = techSites.filter((s) => s.status === 'completed');
  const activeSites = techSites.filter((s) => s.status !== 'completed');

  const totalCompletedCount =
    resolvedComplaints.length + completedWashings.length + completedQuotes.length + completedSites.length;
  const totalPanelsWashed = completedWashings.reduce((sum, b) => sum + (b.panelCount || 0), 0);

  // Unified list of all past completed / resolved records
  interface PastJobRecord {
    id: string;
    type: 'complaint' | 'washing' | 'survey' | 'site';
    badgeLabel: string;
    customerName: string;
    phone: string;
    city: string;
    address?: string;
    completedAt?: string;
    date: string;
    title: string;
    description: string;
    technicianNotes?: string;
    metaBadge?: string;
  }

  const allPastJobs: PastJobRecord[] = [
    ...resolvedComplaints.map((c) => ({
      id: c.id,
      type: 'complaint' as const,
      badgeLabel: 'Resolved Complaint',
      customerName: c.customerName,
      phone: c.phone,
      city: c.city,
      address: c.address,
      completedAt: c.resolvedAt || c.createdAt,
      date: c.createdAt,
      title: `${(c.systemCategory || 'Solar').toUpperCase()} System Complaint`,
      description: c.description,
      technicianNotes: c.technicianNotes,
      metaBadge: c.subject ? c.subject.replace(/_/g, ' ') : 'System Issue',
    })),
    ...completedWashings.map((b) => ({
      id: b.id,
      type: 'washing' as const,
      badgeLabel: 'Completed Wash',
      customerName: b.customerName,
      phone: b.phone,
      city: b.city,
      address: b.address,
      completedAt: b.completedAt || b.preferredDate,
      date: b.preferredDate || b.createdAt,
      title: `${b.panelCount} Solar Panels Wash (${b.panelType})`,
      description: `Washing completed for ${b.customerName} on ${b.preferredDate} (${b.preferredTime}).`,
      technicianNotes: b.technicianNotes,
      metaBadge: `PKR ${b.estimatedPrice.toLocaleString()}`,
    })),
    ...completedQuotes.map((q) => ({
      id: q.id,
      type: 'survey' as const,
      badgeLabel: 'Site Survey Completed',
      customerName: q.customerName,
      phone: q.phone,
      city: q.city,
      address: q.address,
      completedAt: q.surveyDate || q.createdAt,
      date: q.createdAt,
      title: `${q.systemSizeKw}kW ${q.systemType.replace(/_/g, ' ')} Survey`,
      description: `Site visit and survey conducted for ${q.propertyType} property.`,
      technicianNotes: q.technicianNotes,
      metaBadge: q.propertyType,
    })),
    ...completedSites.map((s) => ({
      id: s.id,
      type: 'site' as const,
      badgeLabel: 'Solar Site Completed',
      customerName: s.clientName,
      phone: s.phone,
      city: s.city,
      address: s.address,
      completedAt: s.createdAt,
      date: s.createdAt,
      title: `${s.name} Installation Project`,
      description: `Solar project completed in ${s.city}. Technicians: ${s.assignedTechnicianNames.join(', ')}.`,
      technicianNotes: `Site completed by ${s.assignedTechnicianNames.join(', ')}`,
      metaBadge: 'Solar Site',
    })),
  ].sort((a, b) => {
    const tA = new Date(a.completedAt || a.date).getTime();
    const tB = new Date(b.completedAt || b.date).getTime();
    return tB - tA;
  });

  const filteredPastJobs = allPastJobs.filter((job) => {
    if (ordersFilter === 'complaints' && job.type !== 'complaint') return false;
    if (ordersFilter === 'washing' && job.type !== 'washing') return false;
    if (ordersFilter === 'surveys_sites' && job.type !== 'survey' && job.type !== 'site') return false;

    if (ordersSearch.trim()) {
      const q = ordersSearch.toLowerCase().trim();
      return (
        job.id.toLowerCase().includes(q) ||
        job.customerName.toLowerCase().includes(q) ||
        job.phone.includes(q) ||
        job.city.toLowerCase().includes(q) ||
        (job.address && job.address.toLowerCase().includes(q)) ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        (job.technicianNotes && job.technicianNotes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleShareReport = () => {
    const reportText = `📋 *K&S Solar Energy - Technician Work Summary Report*\nTechnician: *${currentTech.name}* (${currentTech.city})\n\n✅ *Total Completed Jobs:* ${totalCompletedCount}\n- ⚠️ Resolved Complaints: ${resolvedComplaints.length}\n- 💧 Completed Panel Washes: ${completedWashings.length} (${totalPanelsWashed} panels washed)\n- 🏢 Completed Surveys & Sites: ${completedQuotes.length + completedSites.length}\n\nGenerated from Technician Portal.`;
    const adminPhone = (settings?.whatsapp_support || '923280454939').replace(/\D/g, '');
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(reportText)}`, '_blank');
  };

  const handleSaveJobRemarks = () => {
    if (!editingRemarksJob) return;
    const { id, type, note } = editingRemarksJob;
    if (type === 'complaint') {
      onUpdateComplaintStatus(id, 'resolved');
      StorageService.updateComplaintTechNotes(id, note, 'resolved');
    } else if (type === 'washing') {
      onUpdateBookingProgress(id, 'completed', note);
      StorageService.updateBookingTechProgress(id, 'completed', note);
    } else if (type === 'survey') {
      onUpdateQuoteNotes(id, note);
      StorageService.updateQuoteNotes(id, note);
    }
    setEditingRemarksJob(null);
  };

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
        {/* Top Pills Row with Tech badge, Online indicator & Logout */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-[11px] font-extrabold tracking-wider uppercase backdrop-blur-xs">
              <Wrench className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>TECH PORTAL</span>
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
              src={KS_LOGO_SRC}
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

          {/* Main View Switcher: Active Tasks vs My Orders (Past Completed History) */}
          <div className="bg-black/25 p-1 rounded-2xl flex items-center justify-between gap-1 max-w-sm w-full mx-auto mt-3 border border-white/20 shadow-inner">
            <button
              type="button"
              onClick={() => setMainView('active_tasks')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                mainView === 'active_tasks'
                  ? 'bg-white text-[#008ea6] shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Active ({activeWashings.length + activeComplaints.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setMainView('my_orders')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                mainView === 'my_orders'
                  ? 'bg-white text-[#008ea6] shadow-sm'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Orders ({totalCompletedCount})</span>
            </button>
          </div>

          {/* Device Setup & Performance Wizard Button */}
          <div className="mt-2.5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsBatteryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/35 hover:bg-black/50 border border-teal-300/40 text-[11px] font-bold text-white shadow-xs transition active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-300" />
              <span>📱 Phone Setup &amp; Performance Wizard</span>
              <ChevronRight className="w-3 h-3 text-teal-300" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-3">
        {/* ========================================================================= */}
        {/* VIEW 1: ACTIVE TASKS DASHBOARD                                            */}
        {/* ========================================================================= */}
        {mainView === 'active_tasks' && (
          <div className="space-y-4">
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
    )}

    {/* ========================================================================= */}
    {/* VIEW 2: MY ORDERS & COMPLETED WORK HISTORY                                */}
    {/* ========================================================================= */}
    {mainView === 'my_orders' && (
      <div className="space-y-4 animate-in fade-in duration-150">
        {/* Header / Intro Card */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#008ea6] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                Technician Field History
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">My Orders & Past History</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All resolved complaints, completed solar cleanings, and site visits by <strong>{currentTech?.name}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleShareReport}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition"
              title="Share work summary report on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-2.5 text-center border border-slate-200/70">
              <p className="text-lg font-black text-slate-900 leading-none">{totalCompletedCount}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-1 leading-tight">Total Done</p>
            </div>
            <div className="bg-emerald-50/70 rounded-2xl p-2.5 text-center border border-emerald-200/70">
              <p className="text-lg font-black text-emerald-700 leading-none">{resolvedComplaints.length}</p>
              <p className="text-[10px] font-bold text-emerald-800 mt-1 leading-tight">Complaints</p>
            </div>
            <div className="bg-blue-50/70 rounded-2xl p-2.5 text-center border border-blue-200/70">
              <p className="text-lg font-black text-blue-700 leading-none">{completedWashings.length}</p>
              <p className="text-[10px] font-bold text-blue-800 mt-1 leading-tight">Washes</p>
            </div>
            <div className="bg-amber-50/70 rounded-2xl p-2.5 text-center border border-amber-200/70">
              <p className="text-lg font-black text-amber-700 leading-none">{totalPanelsWashed}</p>
              <p className="text-[10px] font-bold text-amber-800 mt-1 leading-tight">Panels</p>
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={ordersSearch}
            onChange={(e) => setOrdersSearch(e.target.value)}
            placeholder="Search past orders by customer, ticket #, phone, city..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008ea6] shadow-2xs"
          />
          {ordersSearch && (
            <button
              type="button"
              onClick={() => setOrdersSearch('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setOrdersFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              ordersFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All Past Jobs ({totalCompletedCount})
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('complaints')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              ordersFilter === 'complaints'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Resolved Complaints ({resolvedComplaints.length})
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('washing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              ordersFilter === 'washing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Completed Washings ({completedWashings.length})
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('surveys_sites')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              ordersFilter === 'surveys_sites'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Surveys & Sites ({completedQuotes.length + completedSites.length})
          </button>
        </div>

        {/* Completed Jobs Cards List */}
        <div className="space-y-3">
          {filteredPastJobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                {ordersSearch ? 'No matching completed jobs' : 'No completed jobs in this filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {ordersSearch
                  ? 'Try adjusting your search query or clear the filter.'
                  : 'Completed bookings, washings, and resolved complaints will automatically be archived here.'}
              </p>
              {ordersSearch ? (
                <button
                  type="button"
                  onClick={() => setOrdersSearch('')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMainView('active_tasks')}
                  className="px-4 py-2 rounded-xl bg-[#008ea6] text-white text-xs font-bold shadow-xs"
                >
                  Go to Active Tasks
                </button>
              )}
            </div>
          ) : (
            filteredPastJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition"
              >
                {/* Header: Type Badge, ID, Completed Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        job.type === 'complaint'
                          ? 'bg-rose-100 text-rose-700'
                          : job.type === 'washing'
                          ? 'bg-blue-100 text-blue-700'
                          : job.type === 'survey'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {job.type === 'complaint' ? (
                        '⚠️'
                      ) : job.type === 'washing' ? (
                        '💧'
                      ) : job.type === 'survey' ? (
                        '📋'
                      ) : (
                        '🏢'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900">{job.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.type === 'complaint'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : job.type === 'washing'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {job.badgeLabel}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mt-0.5">{job.customerName}</h4>
                    </div>
                  </div>

                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    ✓ Resolved / Done
                  </span>
                </div>

                {/* Service & Technical Specs */}
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-semibold text-slate-900">{job.title}</p>
                  <p className="text-[11px] text-slate-600">{job.description}</p>
                </div>

                {/* Address & City */}
                <div className="flex items-start gap-1.5 text-xs text-slate-600 px-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {job.address ? `${job.address}, ` : ''}
                    <strong className="text-slate-800">{job.city}</strong>
                  </span>
                </div>

                {/* Technician's Work & Resolution Remarks */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-900 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Technician Resolution Remarks:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRemarksJob({
                          id: job.id,
                          type: job.type,
                          title: job.title,
                          note: job.technicianNotes || '',
                        })
                      }
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      {job.technicianNotes ? 'Edit Notes' : '+ Add Notes'}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                    {job.technicianNotes || 'Completed and verified on-site by technician.'}
                  </p>
                </div>

                {/* Footer with Date and Call/WhatsApp Actions */}
                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {job.completedAt
                        ? new Date(job.completedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Completed'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCall(job.phone)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>Call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenWhatsApp(job.phone, job.customerName, `${job.badgeLabel} follow-up`)
                      }
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1 border border-emerald-200"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
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

      {/* Remarks Edit Modal for Past Completed Jobs */}
      {editingRemarksJob && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0096aa]" />
                <h3 className="font-black text-slate-900 text-sm">Resolution Remarks</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRemarksJob(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium">Order / Job</p>
              <p className="text-xs font-bold text-slate-800">{editingRemarksJob.title}</p>
              <p className="text-[11px] font-mono text-slate-400">ID: {editingRemarksJob.id}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Technician Remarks & Action Taken</label>
              <textarea
                rows={3}
                value={editingRemarksJob.note}
                onChange={(e) =>
                  setEditingRemarksJob({ ...editingRemarksJob, note: e.target.value })
                }
                placeholder="e.g. Inverter firmware updated, pressure wash finished with pure RO water, system tested normal."
                className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#008ea6]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingRemarksJob(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveJobRemarks}
                className="flex-1 py-2.5 rounded-xl bg-[#008ea6] hover:bg-[#008294] text-white text-xs font-black shadow-xs active:scale-98 transition"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Setup & Optimization Wizard Modal */}
      {isBatteryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Device Setup &amp; Performance Wizard</h3>
                  <p className="text-[11px] text-teal-700 font-semibold">Real-Time Job Dispatch &amp; Alert Optimization</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseBatteryModal}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Intro Banner */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-xs text-teal-900 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-teal-950 mb-1">
                <span>⚡</span>
                <span>One-Time Setup for High App Performance</span>
              </p>
              Apne mobile par naye solar washing orders, customer complaint alerts, aur accurate customer site distance calculation ke liye yeh 3 zaroori settings complete karein:
            </div>

            {/* Shortcut Button to Phone Settings */}
            <button
              type="button"
              onClick={handleOpenPhoneSettings}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-98 transition"
            >
              <Smartphone className="w-4 h-4 text-teal-200" />
              <span>⚙️ Open Phone Settings (App Info) Directly</span>
              <ChevronRight className="w-4 h-4 text-teal-200" />
            </button>

            {/* STEP 1: Location Permission */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="text-xs font-black text-slate-900">Location Permission (Allow All The Time)</h4>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Required</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Customer location tak distance calculate karne aur navigation ke liye location ko <strong>"Allow all the time"</strong> select karein.
              </p>
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-[11px] text-slate-700">
                <strong>Tarika:</strong> Phone Settings &gt; Apps &gt; K&amp;S Solar &gt; Permissions &gt; Location &gt; <strong>"Allow all the time"</strong> (Har waqt ijazat dein).
              </div>
            </div>

            {/* STEP 2: Battery Optimization */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="text-xs font-black text-slate-900">Battery Saver Optimization (Unrestricted)</h4>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Recommended</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Mobile screen lock ya app band hone par bhi naye tasks ki instant notification receive karne ke liye battery restriction off karein.
              </p>
              <div className="space-y-1 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">Samsung / General:</p>
                  <p className="text-slate-600">Settings &gt; Apps &gt; K&amp;S Solar &gt; Battery &gt; <strong>"Unrestricted"</strong>.</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">Infinix / Tecno / Vivo / Oppo:</p>
                  <p className="text-slate-600">Settings &gt; Battery &gt; Background Power Consumption &gt; <strong>"Allow high background usage"</strong>.</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900">Xiaomi / Redmi / Poco:</p>
                  <p className="text-slate-600">Settings &gt; Apps &gt; Permissions &gt; <strong>Autostart: ON</strong>. Battery Saver &gt; <strong>"No restrictions"</strong>.</p>
                </div>
              </div>
            </div>

            {/* STEP 3: Autostart & Recent Apps Lock */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">3</span>
                  <h4 className="text-xs font-black text-slate-900">Autostart &amp; Lock in Recent Apps</h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Anti-Close</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Phone memory clean karne par app band na ho: Recent Apps switcher kholein aur K&amp;S Solar app window par <strong>Lock (🔒)</strong> icon daba dein.
              </p>
            </div>

            {/* Connection Check Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black">App Sync &amp; Network Test</p>
                  <p className="text-[10px] text-slate-400">Verify operations cloud connection</p>
                </div>
                <button
                  type="button"
                  onClick={handleTestLivePing}
                  disabled={isTestingPing}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-black transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isTestingPing ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              </div>

              {pingResult && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-mono space-y-0.5 ${
                    pingResult.success
                      ? 'bg-teal-950/80 border border-teal-500/40 text-teal-200'
                      : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  {pingResult.success ? (
                    <>
                      <p className="font-bold text-teal-400">✓ App Synchronized with Central Dispatch Server!</p>
                      <p className="text-[11px] opacity-90">Ready for instant job alerts and customer routing.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-rose-400">✕ Connection Notice:</p>
                      <p className="text-[11px]">{pingResult.error || 'Please ensure Location & Internet permissions are allowed.'}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCloseBatteryModal}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition"
            >
              Done / Close Setup
            </button>
          </div>
        </div>
      )}

      {/* Footer Watermark */}
      <div className="w-full text-center py-4 px-4 text-[9px] font-extrabold tracking-widest uppercase text-slate-400 select-none">
        Design and Developed by Yousuf Enterprises
      </div>
    </div>
  );
}
