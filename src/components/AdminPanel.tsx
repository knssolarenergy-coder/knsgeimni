import React, { useState, useEffect } from 'react';
import {
  Booking,
  Complaint,
  QuoteRequest,
  Technician,
  AppSettings,
  SiteInstallation,
  BookingStatus,
  ComplaintStatus,
  QuoteStatus,
  InstallationStatus,
  InstallationMilestoneStatus,
  TechnicianSpecialty,
  ReferralRecord,
  ReferralPayoutRequest,
  ReferralPayoutStatus,
  WorkingSite,
  AttendanceRecord,
  AuthAccount,
} from '../types';
import {
  Shield,
  Droplets,
  AlertCircle,
  Package,
  Wrench,
  Users,
  CreditCard,
  Clock,
  Navigation,
  Send,
  BarChart3,
  Settings,
  ChevronRight,
  Phone,
  MessageSquare,
  Plus,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Check,
  ExternalLink,
  Lock,
  Download,
  Trash2,
  UserCheck,
  UserX,
  RotateCcw,
  Sparkles,
  Award,
  DollarSign,
  Radio,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Copy,
  KeyRound,
  MessageCircle,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { CITIES } from '../data/mockData';
import { LiveFleetMap } from './LiveFleetMap';
import { MultiTechnicianPickerModal } from './MultiTechnicianPickerModal';
import { AdminWarrantiesTab } from './AdminWarrantiesTab';

interface AdminPanelProps {
  bookings: Booking[];
  complaints: Complaint[];
  quotes: QuoteRequest[];
  technicians: Technician[];
  settings: AppSettings;
  installations: SiteInstallation[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onAssignBookingTech: (bookingId: string, techId: string, techName: string, notes?: string) => void;
  onAssignBookingTechs?: (bookingId: string, techIds: string[], techNames: string[], notes?: string) => void;
  onUpdateComplaintStatus: (complaintId: string, status: ComplaintStatus, notes?: string) => void;
  onAssignComplaintTech: (complaintId: string, techId: string, techName: string, notes?: string) => void;
  onAssignComplaintTechs?: (complaintId: string, techIds: string[], techNames: string[], notes?: string) => void;
  onUpdateQuoteStatus: (quoteId: string, status: QuoteStatus, adminNotes?: string) => void;
  onAssignQuoteTech?: (quoteId: string, techId: string, techName: string) => void;
  onAssignQuoteTechs?: (quoteId: string, techIds: string[], techNames: string[], notes?: string) => void;
  onAssignInstallationTechs?: (installationId: string, techIds: string[], techNames: string[], notes?: string) => void;
  onCreateInstallation?: (data: SiteInstallation) => void;
  onUpdateInstallationStatus?: (installationId: string, status: InstallationStatus) => void;
  onUpdateInstallationMilestone?: (
    installationId: string,
    milestoneId: string,
    status: InstallationMilestoneStatus,
    notes?: string
  ) => void;
  onAddTechnician: (tech: Omit<Technician, 'id'>) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenTechPortal: (techId?: string) => void;
  onNavigateHome?: () => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  bookings,
  complaints,
  quotes,
  technicians,
  settings,
  installations,
  onUpdateBookingStatus,
  onAssignBookingTech,
  onAssignBookingTechs,
  onUpdateComplaintStatus,
  onAssignComplaintTech,
  onAssignComplaintTechs,
  onUpdateQuoteStatus,
  onAssignQuoteTech,
  onAssignQuoteTechs,
  onAssignInstallationTechs,
  onCreateInstallation,
  onUpdateInstallationStatus,
  onUpdateInstallationMilestone,
  onAddTechnician,
  onSaveSettings,
  onOpenTechPortal,
  onNavigateHome,
  onLogout,
}) => {
  // Navigation State: 'dashboard' is the default 12-card view
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'bookings'
    | 'complaints'
    | 'sites'
    | 'quotes'
    | 'technicians'
    | 'users'
    | 'payments'
    | 'attendance'
    | 'live_map'
    | 'site_visits'
    | 'reports'
    | 'settings'
    | 'warranties'
  >('dashboard');

  // Local copy of AppSettings with instant feedback toasts
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveToast, setSaveToast] = useState<string>('');

  // Working Sites & Attendance state
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>(() => StorageService.getWorkingSites());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendanceRecords()
  );

  // Referrals & Payouts state
  const [referralsList, setReferralsList] = useState<ReferralRecord[]>(() => StorageService.getReferrals());
  const [payoutsList, setPayoutsList] = useState<ReferralPayoutRequest[]>(() =>
    StorageService.getPayoutRequests()
  );

  // Filter States
  const [bookingFilter, setBookingFilter] = useState<'all' | BookingStatus>('all');
  const [complaintFilter, setComplaintFilter] = useState<'all' | ComplaintStatus>('all');
  const [selectedTechForReport, setSelectedTechForReport] = useState<string>(technicians[0]?.id || '');
  const [reportDateRange, setReportDateRange] = useState<'this_month' | 'last_month' | 'all'>('this_month');

  // Modals State
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteClient, setNewSiteClient] = useState('');
  const [newSitePhone, setNewSitePhone] = useState('');
  const [newSiteCity, setNewSiteCity] = useState(CITIES[0] || 'Lahore');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newSiteTechs, setNewSiteTechs] = useState<string[]>([]);

  // Add Tech form state with login credentials
  const [newTechName, setNewTechName] = useState('');
  const [newTechEmail, setNewTechEmail] = useState('');
  const [newTechPhone, setNewTechPhone] = useState('');
  const [newTechCity, setNewTechCity] = useState(CITIES[0] || 'Lahore');
  const [newTechSpecialty, setNewTechSpecialty] = useState<TechnicianSpecialty>('Solar Panel Wash Specialist');
  const [newTechUsername, setNewTechUsername] = useState('');
  const [newTechPassword, setNewTechPassword] = useState('tech123');

  // Registered Accounts & Approvals state
  const [accounts, setAccounts] = useState<AuthAccount[]>(() => StorageService.getAccounts());
  const [customerFilter, setCustomerFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Technician Credential Confirmation Modal
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    name: string;
    username: string;
    password: string;
    phone: string;
    email: string;
    specialty: string;
  } | null>(null);

  // Technician Password Edit Modal
  const [editingTechCreds, setEditingTechCreds] = useState<{
    technicianId: string;
    name: string;
    username: string;
    password: string;
  } | null>(null);

  // Customer Password Reset Modal
  const [editingCustomerPass, setEditingCustomerPass] = useState<{
    id: string;
    name: string;
    phone: string;
    newPass: string;
  } | null>(null);

  // Multi-Tech Picker State
  const [multiTechPicker, setMultiTechPicker] = useState<{
    isOpen: boolean;
    category: 'washing' | 'complaint' | 'survey' | 'installation';
    targetId: string;
    jobTitle: string;
    initialSelectedIds: string[];
    initialNotes: string;
  }>({
    isOpen: false,
    category: 'washing',
    targetId: '',
    jobTitle: '',
    initialSelectedIds: [],
    initialNotes: '',
  });

  // Admin Password change state
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync settings when props change
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Toast feedback timer
  const triggerSaveToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 2500);
  };

  const handleSaveSettingField = (field: keyof AppSettings, value: any, label: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSaveSettings(updated);
    triggerSaveToast(`Saved ${label} successfully!`);
  };

  const handleAdminPasswordChange = () => {
    if (!newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password cannot be empty' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    const updated = { ...formData, admin_password: newPassword };
    setFormData(updated);
    StorageService.saveSettings(updated);
    onSaveSettings(updated);
    setPasswordMessage({ type: 'success', text: 'Admin password updated successfully!' });
    setCurrPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(null), 3000);
  };

  // Helper to open WhatsApp
  const handleOpenWhatsApp = (phone: string, customerName: string, title: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const intl = clean.startsWith('0') ? '92' + clean.slice(1) : clean;
    const msg = encodeURIComponent(`Assalam-o-Alaikum ${customerName}, from K&S Solar Energy Admin regarding ${title}.`);
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Excel / CSV report download generator
  const handleDownloadExcelReport = () => {
    const tech = technicians.find((t) => t.id === selectedTechForReport) || technicians[0];
    if (!tech) return;

    const rows = [
      ['K&S SOLAR ENERGY (PVT) LTD - TECHNICIAN PERFORMANCE REPORT'],
      ['Generated On', new Date().toLocaleString()],
      ['Technician Name', tech.name],
      ['Email', tech.email || 'N/A'],
      ['Phone', tech.phone],
      ['City Base', tech.city],
      ['Specialty', tech.specialty],
      ['Performance Rating', `${tech.rating} / 5.0`],
      ['Total Completed Jobs', tech.completedJobsCount],
      ['Active Assigned Jobs', tech.activeJobsCount],
      [],
      ['ASSIGNED WASHING ORDERS'],
      ['Booking ID', 'Customer', 'City', 'Panels', 'Date', 'Status', 'Technicians'],
    ];

    bookings
      .filter((b) => b.assignedTechnicianIds?.includes(tech.id) || b.assignedTechnicianId === tech.id)
      .forEach((b) => {
        rows.push([b.id, b.customerName, b.city, `${b.panelCount}`, b.preferredDate, b.status, b.assignedTechnicianNames?.join('; ') || tech.name]);
      });

    rows.push([]);
    rows.push(['ASSIGNED CUSTOMER COMPLAINTS']);
    rows.push(['Complaint ID', 'Customer', 'City', 'Subject', 'Created', 'Status']);

    complaints
      .filter((c) => c.assignedTechnicianIds?.includes(tech.id) || c.assignedTechnicianId === tech.id)
      .forEach((c) => {
        rows.push([c.id, c.customerName, c.city, c.subject, c.createdAt, c.status]);
      });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KNS_Report_${tech.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSaveToast('Excel report generated & downloaded!');
  };

  // Add Working Site Handler
  const handleCreateWorkingSite = () => {
    if (!newSiteName || !newSiteClient) return;
    const site = StorageService.addWorkingSite({
      name: newSiteName,
      clientName: newSiteClient,
      phone: newSitePhone || '03000000000',
      city: newSiteCity,
      address: newSiteAddress || newSiteCity,
      assignedTechnicianNames: newSiteTechs.length > 0 ? newSiteTechs : [technicians[0]?.name || 'Staff'],
      status: 'active',
    });
    setWorkingSites(StorageService.getWorkingSites());
    setIsAddSiteModalOpen(false);
    setNewSiteName('');
    setNewSiteClient('');
    setNewSitePhone('');
    setNewSiteAddress('');
    setNewSiteTechs([]);
    triggerSaveToast(`Created working site: ${site.name}`);
  };

  // Add Technician Handler with Login Account Creation
  const handleCreateTechnician = () => {
    if (!newTechName.trim() || !newTechPhone.trim()) {
      triggerSaveToast('Technician name and phone are required.');
      return;
    }

    const genUsername = (newTechUsername.trim() || newTechName.toLowerCase().replace(/\s+/g, '')).toLowerCase();
    const genPassword = newTechPassword.trim() || 'tech123';
    const genEmail = newTechEmail.trim() || `${genUsername}@kssolar.pk`;

    onAddTechnician({
      name: newTechName.trim(),
      phone: newTechPhone.trim(),
      email: genEmail,
      username: genUsername,
      password: genPassword,
      city: newTechCity,
      specialty: newTechSpecialty,
      status: 'available',
      rating: 4.9,
      completedJobsCount: 0,
      activeJobsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    });

    // Refresh accounts list
    const updatedAccounts = StorageService.getAccounts();
    setAccounts(updatedAccounts);

    // Show credential confirmation popup so Admin can copy or WhatsApp to tech!
    setCreatedCredentialsModal({
      name: newTechName.trim(),
      username: genUsername,
      password: genPassword,
      phone: newTechPhone.trim(),
      email: genEmail,
      specialty: newTechSpecialty,
    });

    setIsAddTechModalOpen(false);
    setNewTechName('');
    setNewTechEmail('');
    setNewTechPhone('');
    setNewTechUsername('');
    setNewTechPassword('tech123');
    triggerSaveToast(`Technician account created for ${newTechName}!`);
  };

  // Customer Account Approval Handlers
  const handleApproveCustomer = (account: AuthAccount) => {
    const updated = StorageService.updateAccountApproval(account.id, 'approved');
    setAccounts(updated);
    triggerSaveToast(`Customer ${account.name} APPROVED! Account activated.`);
  };

  const handleRejectCustomer = (account: AuthAccount) => {
    const updated = StorageService.updateAccountApproval(account.id, 'rejected');
    setAccounts(updated);
    triggerSaveToast(`Customer ${account.name} rejected/suspended.`);
  };

  const handleDeleteCustomer = (account: AuthAccount) => {
    if (window.confirm(`Are you sure you want to permanently delete customer ${account.name}?`)) {
      const updated = StorageService.deleteAccount(account.id);
      setAccounts(updated);
      triggerSaveToast(`Customer ${account.name} deleted.`);
    }
  };

  const handleWhatsAppCustomerApproved = (account: AuthAccount) => {
    const cleanNum = account.phone.replace(/\D/g, '');
    const message = `Salam ${account.name},\nCongratulations! Your K&S Solar Energy account has been APPROVED by Admin.\n\nYou can now log in to the K&S Solar App using:\nLogin ID: ${account.email || account.phone}\nPassword: [Your chosen password]\n\nThank you for choosing K&S Solar Energy!`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppTechCredentials = (creds: { name: string; username: string; password: string; phone: string }) => {
    const cleanNum = creds.phone.replace(/\D/g, '');
    const message = `Salam ${creds.name},\nYour K&S Solar Field Technician login has been created by Admin!\n\nPortal: K&S Solar App\nUsername / Email: ${creds.username}\nPassword: ${creds.password}\n\nPlease log in and check your assigned solar jobs.`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSaveTechCredentials = () => {
    if (!editingTechCreds) return;
    StorageService.updateTechnicianCredentials(
      editingTechCreds.technicianId,
      editingTechCreds.username,
      editingTechCreds.password
    );
    setAccounts(StorageService.getAccounts());
    setEditingTechCreds(null);
    triggerSaveToast('Technician credentials updated successfully!');
  };

  const handleSaveCustomerPassword = () => {
    if (!editingCustomerPass || !editingCustomerPass.newPass.trim()) return;
    StorageService.resetAccountPassword(editingCustomerPass.id, editingCustomerPass.newPass.trim());
    setAccounts(StorageService.getAccounts());
    setEditingCustomerPass(null);
    triggerSaveToast('Customer password updated successfully!');
  };

  // Payout Handler
  const handleUpdatePayoutStatus = (payoutId: string, newStatus: ReferralPayoutStatus) => {
    const updated = StorageService.updatePayoutStatus(payoutId, newStatus);
    setPayoutsList(updated);
    triggerSaveToast(`Payout ${payoutId} updated to ${newStatus.toUpperCase()}`);
  };

  // Stats Counters & Accounts Calculation
  const customerAccounts = accounts.filter((a) => a.role === 'customer');
  const pendingCustomersCount = customerAccounts.filter(
    (a) => a.approvalStatus === 'pending' || (a.approvalStatus !== 'approved' && a.id.includes('pending'))
  ).length;
  const approvedCustomersCount = customerAccounts.filter((a) => a.approvalStatus === 'approved').length;

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const openComplaintsCount = complaints.filter((c) => c.status !== 'resolved').length;
  const pendingPayoutsCount = payoutsList.filter((p) => p.status === 'pending').length;

  return (
    <div className="bg-slate-100 min-h-screen pb-24 text-slate-800">
      {/* Save Feedback Toast */}
      {saveToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Teal/Cyan Header Banner (Matching Screenshots 1-17) */}
      <div className="bg-[#0096aa] text-white p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                title="Back to Customer App"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 flex items-center justify-center text-white active:scale-90 transition shrink-0"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight">Admin Panel</h1>
              <p className="text-xs text-white/80 font-medium">Full control · K&amp;S Solar Energy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-white/40 text-white text-[11px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN</span>
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

        {/* 4 Stat Boxes in a Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 text-center border border-white/10">
            <p className="text-sm font-black text-white">{bookings.length}</p>
            <p className="text-[10px] text-white/80 font-medium leading-tight">Bookings</p>
          </div>
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 text-center border border-white/10">
            <p className="text-sm font-black text-white">{pendingBookingsCount}</p>
            <p className="text-[10px] text-white/80 font-medium leading-tight">Pending</p>
          </div>
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 text-center border border-white/10">
            <p className="text-sm font-black text-white">{complaints.length}</p>
            <p className="text-[10px] text-white/80 font-medium leading-tight">Complaints</p>
          </div>
          <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2 text-center border border-white/10">
            <p className="text-sm font-black text-white">{openComplaintsCount}</p>
            <p className="text-[10px] text-white/80 font-medium leading-tight">Open</p>
          </div>
        </div>
      </div>

      {/* Subview Top Breadcrumb Bar */}
      {activeTab !== 'dashboard' && (
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-cyan-700 hover:text-cyan-800 font-extrabold text-xs flex items-center gap-1 active:scale-95 transition"
          >
            <span>← Dashboard</span>
          </button>
          <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
            {activeTab.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MAIN DASHBOARD: 12 COLORFUL CARDS (Screenshots 16 & 17) */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Bookings (Blue #1e88e5) */}
            <div
              onClick={() => setActiveTab('bookings')}
              className="bg-[#1e88e5] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Droplets className="w-6 h-6 fill-white text-white" />
              </div>
              <div>
                <h3 className="text-base font-black">Bookings</h3>
                <p className="text-xs text-white/85 font-medium">{bookings.length} total</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 2. Complaints (Red #e53935) */}
            <div
              onClick={() => setActiveTab('complaints')}
              className="bg-[#e53935] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black">Complaints</h3>
                <p className="text-xs text-white/85 font-medium">{openComplaintsCount} open</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 3. Sites (Teal #00897b) */}
            <div
              onClick={() => setActiveTab('sites')}
              className="bg-[#00897b] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Sites</h3>
                <p className="text-xs text-white/85 font-medium">{workingSites.length} working sites</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 4. Quotes (Vivid Cyan #0288d1) */}
            <div
              onClick={() => setActiveTab('quotes')}
              className="bg-[#0288d1] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Quotes</h3>
                <p className="text-xs text-white/85 font-medium">{quotes.length} requests</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 5. Technicians (Dark Navy #1a237e) */}
            <div
              onClick={() => setActiveTab('technicians')}
              className="bg-[#1a237e] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Technicians</h3>
                <p className="text-xs text-white/85 font-medium">{technicians.length} registered</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 6. Users & Approvals (Light Sky #03a9f4) */}
            <div
              onClick={() => setActiveTab('users')}
              className="bg-[#03a9f4] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-1.5">
                  <span>Users &amp; Approvals</span>
                  {pendingCustomersCount > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                  )}
                </h3>
                <p className="text-xs text-white/85 font-medium">
                  {pendingCustomersCount > 0
                    ? `⚡ ${pendingCustomersCount} Pending Approval`
                    : `${customerAccounts.length} customers registered`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 7. Payments (Emerald Green #00c853) */}
            <div
              onClick={() => setActiveTab('payments')}
              className="bg-[#00c853] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Payments</h3>
                <p className="text-xs text-white/85 font-medium">{pendingPayoutsCount} pending</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 8. Attendance (Cyan Sky #00bcd4) */}
            <div
              onClick={() => setActiveTab('attendance')}
              className="bg-[#00bcd4] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Attendance</h3>
                <p className="text-xs text-white/85 font-medium">GPS check-in records</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 9. Live Map (Deep Teal #00838f) */}
            <div
              onClick={() => setActiveTab('live_map')}
              className="bg-[#00838f] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Live Map</h3>
                <p className="text-xs text-white/85 font-medium">Real-time technician tracking</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 10. Site Visits (Purple #7c4dff) */}
            <div
              onClick={() => setActiveTab('site_visits')}
              className="bg-[#7c4dff] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Site Visits</h3>
                <p className="text-xs text-white/85 font-medium">{quotes.length + installations.length} visits</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 11. Reports (Deep Blue #0d47a1) */}
            <div
              onClick={() => setActiveTab('reports')}
              className="bg-[#0d47a1] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Reports</h3>
                <p className="text-xs text-white/85 font-medium">Download Excel reports</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 12. Settings (Slate Grey #546e7a) */}
            <div
              onClick={() => setActiveTab('settings')}
              className="bg-[#546e7a] text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Settings</h3>
                <p className="text-xs text-white/85 font-medium">Configure app</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 13. Customer Warranties & Certificates (Amber/Gold #d97706) */}
            <div
              onClick={() => setActiveTab('warranties')}
              className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95 col-span-2"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black">Customer Warranties</h3>
                <p className="text-xs text-amber-100 font-medium">
                  {StorageService.getWarranties().length} registered product certificates &amp; expiries
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>
          </div>

          {/* Quick Jump to Tech Portal Banner */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Switch to Technician Field View</h4>
                <p className="text-[10px] text-slate-500">Test technician portal experience</p>
              </div>
            </div>
            <button
              onClick={() => onOpenTechPortal()}
              className="px-3 py-1.5 rounded-xl bg-[#0096aa] hover:bg-[#008294] text-white text-xs font-bold active:scale-95 transition"
            >
              Open
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BOOKINGS SUBVIEW (Matching Screenshot 11)              */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className="p-4 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filterKey) => {
              const count =
                filterKey === 'all'
                  ? bookings.length
                  : bookings.filter((b) => b.status === filterKey).length;
              return (
                <button
                  key={filterKey}
                  onClick={() => setBookingFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                    bookingFilter === filterKey
                      ? 'bg-[#0096aa] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filterKey.replace('_', ' ').toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {bookings
              .filter((b) => bookingFilter === 'all' || b.status === bookingFilter)
              .map((b) => {
                const assignedNames = b.assignedTechnicianNames?.length
                  ? b.assignedTechnicianNames.join(', ')
                  : b.assignedTechnicianName || 'None assigned';

                return (
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
                            {b.id} · {b.preferredDate}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : b.status === 'cancelled'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ● {b.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Details badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">📍 {b.city}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">⊞ {b.panelCount} panels</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">🕒 {b.preferredTime}</span>
                      <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md font-bold">
                        Techs: {assignedNames}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl">
                      🏠 {b.address}
                    </p>

                    {/* Inline Status Toggle Buttons (Matching Screenshot 11) */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
                      {(['pending', 'confirmed', 'completed', 'cancelled'] as BookingStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => onUpdateBookingStatus(b.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition capitalize ${
                              b.status === st
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        )
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCall(b.phone)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>Call</span>
                        </button>
                        <button
                          onClick={() => handleOpenWhatsApp(b.phone, b.customerName, 'Panel Washing')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1 border border-emerald-200"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          setMultiTechPicker({
                            isOpen: true,
                            category: 'washing',
                            targetId: b.id,
                            jobTitle: `Wash for ${b.customerName}`,
                            initialSelectedIds: b.assignedTechnicianIds || (b.assignedTechnicianId ? [b.assignedTechnicianId] : []),
                            initialNotes: b.technicianNotes || '',
                          })
                        }
                        className="px-3 py-1 rounded-xl bg-[#0096aa] text-white text-[11px] font-bold active:scale-95 transition"
                      >
                        Assign Techs
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. COMPLAINTS SUBVIEW (Matching Screenshot 10)            */}
      {/* ========================================================= */}
      {activeTab === 'complaints' && (
        <div className="p-4 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'pending', 'assigned', 'in_progress', 'resolved'] as const).map((filterKey) => {
              const count =
                filterKey === 'all'
                  ? complaints.length
                  : complaints.filter((c) => c.status === filterKey).length;
              return (
                <button
                  key={filterKey}
                  onClick={() => setComplaintFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                    complaintFilter === filterKey
                      ? 'bg-[#0096aa] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filterKey.replace('_', ' ').toUpperCase()} ({count})
                </button>
              );
            })}
          </div>

          {/* Complaints List */}
          <div className="space-y-3">
            {complaints
              .filter((c) => complaintFilter === 'all' || c.status === complaintFilter)
              .map((c) => (
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
                          : c.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : c.status === 'assigned'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      ● {c.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">📍 {c.city}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">📞 {c.phone}</span>
                    <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md font-bold">
                      Techs: {c.assignedTechnicianNames?.join(', ') || c.assignedTechnicianName || 'None'}
                    </span>
                  </div>

                  {/* Inline Status Buttons (Screenshot 10) */}
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
                    {(['pending', 'assigned', 'in_progress', 'resolved'] as ComplaintStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateComplaintStatus(c.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition capitalize ${
                          c.status === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCall(c.phone)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold"
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
                      onClick={() =>
                        setMultiTechPicker({
                          isOpen: true,
                          category: 'complaint',
                          targetId: c.id,
                          jobTitle: `Complaint: ${c.subject}`,
                          initialSelectedIds: c.assignedTechnicianIds || (c.assignedTechnicianId ? [c.assignedTechnicianId] : []),
                          initialNotes: c.technicianNotes || '',
                        })
                      }
                      className="px-3 py-1 rounded-xl bg-[#0096aa] text-white text-[11px] font-bold active:scale-95 transition"
                    >
                      Assign Techs
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SITES SUBVIEW (Matching Screenshot 9)                  */}
      {/* ========================================================= */}
      {activeTab === 'sites' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Working Sites</h3>
            <button
              onClick={() => setIsAddSiteModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Working Site</span>
            </button>
          </div>

          <div className="space-y-3">
            {workingSites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{site.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {site.clientName} · {site.phone}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ● Active
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                  <p>📍 {site.address}</p>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Techs: {site.assignedTechnicianNames.join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 font-mono">ID: {site.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCall(site.phone)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(site.phone, site.clientName, `Site: ${site.name}`)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TECHNICIANS SUBVIEW                                    */}
      {/* ========================================================= */}
      {activeTab === 'technicians' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Registered Technicians</h3>
              <p className="text-[11px] text-slate-500">
                Admin creates technician accounts with login username &amp; password.
              </p>
            </div>
            <button
              onClick={() => setIsAddTechModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add New Technician</span>
            </button>
          </div>

          <div className="space-y-3">
            {technicians.map((t) => {
              const techAccount = accounts.find(
                (a) => a.technicianId === t.id || (a.role === 'technician' && (a.name === t.name || a.phone === t.phone))
              );
              const username = techAccount?.username || t.username || (t.email ? t.email.split('@')[0] : t.phone);
              const password = techAccount?.password || t.password || 'tech123';

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{t.name}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">{t.email || `${t.phone}@knssolar.com`}</p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ● Active Staff
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                    <span>📞 {t.phone}</span>
                    <span>📍 {t.city}</span>
                    <span>⭐ {t.rating || '4.9'}</span>
                    <span>🔧 {t.specialty}</span>
                  </div>

                  {/* Technician Login Credentials Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <span className="font-bold">Login ID:</span>
                        <code className="text-slate-800 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {username}
                        </code>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Password:</span>
                        <span className="font-mono text-slate-700 font-bold">••••••••</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
                          triggerSaveToast(`Credentials copied for ${t.name}!`);
                        }}
                        title="Copy Login Details"
                        className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => setEditingTechCreds({ technicianId: t.id, name: t.name, username, password })}
                        className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-[10px] font-bold"
                      >
                        Edit Pass
                      </button>
                      <button
                        onClick={() => handleWhatsAppTechCredentials({ name: t.name, username, password, phone: t.phone })}
                        className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">Status: {t.status}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenTechPortal(t.id)}
                        className="px-2.5 py-1 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-bold"
                      >
                        Login As Tech
                      </button>
                      <button
                        onClick={() => handleOpenWhatsApp(t.phone, t.name, 'Staff Dispatch')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. USERS & APPROVALS SUBVIEW                              */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>Customer Accounts &amp; Approvals</span>
                {pendingCustomersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                    {pendingCustomersCount} Pending
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                New customers must be approved by Admin before they can log in.
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 w-full sm:w-60 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setCustomerFilter('pending')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                customerFilter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending Approvals</span>
              {pendingCustomersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  {pendingCustomersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCustomerFilter('approved')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                customerFilter === 'approved'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Approved ({approvedCustomersCount})</span>
            </button>

            <button
              onClick={() => setCustomerFilter('all')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
                customerFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>All ({customerAccounts.length})</span>
            </button>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-3">
            {(() => {
              const query = customerSearchQuery.toLowerCase().trim();
              const filtered = customerAccounts.filter((u) => {
                const matchQuery =
                  !query ||
                  u.name.toLowerCase().includes(query) ||
                  u.phone.toLowerCase().includes(query) ||
                  u.email.toLowerCase().includes(query) ||
                  u.city.toLowerCase().includes(query);

                if (!matchQuery) return false;

                const isPending =
                  u.approvalStatus === 'pending' ||
                  (u.approvalStatus !== 'approved' && u.id.includes('pending'));

                if (customerFilter === 'pending') return isPending;
                if (customerFilter === 'approved') return u.approvalStatus === 'approved' || (!u.approvalStatus && !u.id.includes('pending'));
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      {customerFilter === 'pending' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {customerFilter === 'pending'
                        ? 'No Pending Approvals! All customers are reviewed.'
                        : 'No customer accounts found.'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {customerFilter === 'pending'
                        ? 'When a customer registers on the app, their account will appear here for one-click approval.'
                        : 'Try searching with a different term.'}
                    </p>
                  </div>
                );
              }

              return filtered.map((u) => {
                const isPending =
                  u.approvalStatus === 'pending' ||
                  (u.approvalStatus !== 'approved' && u.id.includes('pending'));
                const isRejected = u.approvalStatus === 'rejected' || u.approvalStatus === 'suspended';

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition ${
                      isPending ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isPending ? <Clock className="w-5 h-5 animate-pulse" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-slate-900">{u.name}</h4>
                            <span className="text-[10px] text-slate-500 font-medium">({u.city})</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{u.email || `${u.phone}@kssolar.pk`}</p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {isPending ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          Pending Review
                        </span>
                      ) : isRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-bold">
                          ● Suspended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                          ✓ Approved
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl gap-2">
                      <span className="font-mono font-bold text-slate-800">📞 {u.phone}</span>
                      <span>
                        Created:{' '}
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-GB')
                          : 'Recently'}
                      </span>
                      {u.referralCode && (
                        <span className="text-amber-800 font-mono font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                          Ref: {u.referralCode}
                        </span>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleApproveCustomer(u)}
                            className="px-3 py-1.5 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1 active:scale-95 transition"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>✓ Approve Account (منظور کریں)</span>
                          </button>
                          <button
                            onClick={() => handleRejectCustomer(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleWhatsAppCustomerApproved(u)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {isRejected ? (
                            <button
                              onClick={() => handleApproveCustomer(u)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold hover:bg-emerald-200"
                            >
                              Re-Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectCustomer(u)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100"
                            >
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setEditingCustomerPass({
                                id: u.id,
                                name: u.name,
                                phone: u.phone,
                                newPass: 'user123',
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-bold flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3 text-slate-500" />
                            <span>Reset Pass</span>
                          </button>
                          <button
                            onClick={() => handleWhatsAppCustomerApproved(u)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-[11px] font-bold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition ml-auto"
                            title="Delete customer account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. LIVE MAP SUBVIEW (Matching Screenshot 6)               */}
      {/* ========================================================= */}
      {activeTab === 'live_map' && (
        <div className="p-3 space-y-3">
          <div className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase text-slate-800">Fleet Live Map</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800">● 10 Tracked</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">● UPDATING</span>
            </div>
          </div>

          <LiveFleetMap technicians={technicians} onSelectTechnician={onOpenTechPortal} />
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. REPORTS SUBVIEW (Matching Screenshot 5)                */}
      {/* ========================================================= */}
      {activeTab === 'reports' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              TECHNICIAN PERFORMANCE REPORT
            </h3>

            {/* Horizontal Technician Selection Pills (Screenshot 5) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {technicians.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTechForReport(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    selectedTechForReport === t.id
                      ? 'bg-[#0096aa] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Date Range Chips */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportDateRange('this_month')}
                className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  reportDateRange === 'this_month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setReportDateRange('last_month')}
                className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  reportDateRange === 'last_month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setReportDateRange('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold ${
                  reportDateRange === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                All Time
              </button>
            </div>

            {/* Performance Stats Cards */}
            {(() => {
              const tech = technicians.find((t) => t.id === selectedTechForReport) || technicians[0];
              const tBookings = bookings.filter((b) => b.assignedTechnicianIds?.includes(tech.id) || b.assignedTechnicianId === tech.id);
              const tComplaints = complaints.filter((c) => c.assignedTechnicianIds?.includes(tech.id) || c.assignedTechnicianId === tech.id);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Total Jobs</p>
                      <p className="text-base font-black text-slate-900">{tBookings.length + tComplaints.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">Completed</p>
                      <p className="text-base font-black text-emerald-700">{tech.completedJobsCount}</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Rating</p>
                      <p className="text-base font-black text-amber-700">⭐ {tech.rating || '4.9'}</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownloadExcelReport}
                    className="w-full py-3 rounded-2xl bg-[#0096aa] hover:bg-[#008294] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md active:scale-98 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel Report</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. ATTENDANCE SUBVIEW (Matching Screenshot 12/13/14)       */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Technician GPS Attendance
            </h3>
            <button
              onClick={() => {
                const rec = StorageService.recordAttendance(technicians[0]?.id || 'tech-1', technicians[0]?.name || 'Staff', 'Admin Office HQ');
                setAttendanceRecords(StorageService.getAttendanceRecords());
                triggerSaveToast(`Recorded check-in for ${technicians[0]?.name}`);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0096aa] text-white text-xs font-bold active:scale-95 transition"
            >
              + Record Check-In
            </button>
          </div>

          <div className="space-y-3">
            {attendanceRecords.map((att) => (
              <div
                key={att.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{att.technicianName}</h4>
                    <p className="text-[11px] text-slate-500">
                      📅 {att.date} at {att.checkInTime}
                    </p>
                    <p className="text-[10px] text-cyan-700 font-semibold mt-0.5">
                      📍 {att.location}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                  ● Present
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. PAYMENTS / REFERRALS SUBVIEW (Screenshots 2 & 3)       */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="p-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              REFERRAL CASH PRIZES &amp; PAYOUTS
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Referrals</p>
                <p className="text-base font-black text-slate-900">{referralsList.length}</p>
              </div>
              <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                <p className="text-[10px] text-amber-700 font-bold uppercase">Pending</p>
                <p className="text-base font-black text-amber-700">{pendingPayoutsCount}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Points Rate</p>
                <p className="text-base font-black text-emerald-700">{formData.referral_pkr_per_point || 50} PKR</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {payoutsList.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{p.userName}</h4>
                    <p className="text-[11px] text-slate-500">
                      {p.paymentMethod.toUpperCase()}: {p.accountNumber} ({p.accountTitle})
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    ● {p.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl">
                  <span>Prize Amount:</span>
                  <span className="text-emerald-700 font-black text-sm">Rs. {p.amountPkr.toLocaleString()}</span>
                </div>

                {p.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdatePayoutStatus(p.id, 'rejected')}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdatePayoutStatus(p.id, 'paid')}
                      className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs active:scale-95 transition"
                    >
                      Approve &amp; Pay ✓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. SITE VISITS & INSTALLATIONS SUBVIEW                   */}
      {/* ========================================================= */}
      {activeTab === 'site_visits' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Site Visits &amp; EPC Surveys
            </h3>
            <span className="text-xs text-slate-500 font-mono">{quotes.length} total</span>
          </div>

          <div className="space-y-3">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{q.customerName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {q.city} · {q.systemSizeKw} kW {q.systemType}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                    ● {q.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                  <span>Type: {q.propertyType.toUpperCase()} · Est: Rs. {q.estimatedCostPkr.toLocaleString()}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">📞 {q.phone}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCall(q.phone)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => handleOpenWhatsApp(q.phone, q.customerName, `${q.systemSizeKw}kW Solar Quote`)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200"
                    >
                      WhatsApp
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setMultiTechPicker({
                        isOpen: true,
                        category: 'survey',
                        targetId: q.id,
                        jobTitle: `Site Survey for ${q.customerName}`,
                        initialSelectedIds: q.assignedTechnicianIds || (q.assignedTechnicianId ? [q.assignedTechnicianId] : []),
                        initialNotes: q.technicianNotes || '',
                      })
                    }
                    className="px-3 py-1 rounded-xl bg-[#7c4dff] text-white text-[11px] font-bold active:scale-95 transition"
                  >
                    Assign Surveyors
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. SETTINGS SUBVIEW (Matching Screenshots 1-4, 8)         */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="p-4 space-y-6">
          {/* SECTION 1: WHATSAPP CONTACT NUMBERS (Screenshot 1) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              WHATSAPP CONTACT NUMBERS
            </h3>

            {/* Booking WhatsApp */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Booking WhatsApp Number</h4>
                  <p className="text-[10px] text-slate-500">Used for solar wash bookings</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.whatsapp_booking}
                onChange={(e) => setFormData({ ...formData, whatsapp_booking: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSaveSettingField('whatsapp_booking', formData.whatsapp_booking, 'Booking WhatsApp')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>💾</span>
                <span>Save Booking Number</span>
              </button>
            </div>

            {/* Complaint WhatsApp */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Complaint WhatsApp Number</h4>
                  <p className="text-[10px] text-slate-500">Used for customer complaints</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.whatsapp_complaint}
                onChange={(e) => setFormData({ ...formData, whatsapp_complaint: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSaveSettingField('whatsapp_complaint', formData.whatsapp_complaint, 'Complaint WhatsApp')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>💾</span>
                <span>Save Complaint Number</span>
              </button>
            </div>

            {/* Installation WhatsApp */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Installation WhatsApp Number</h4>
                  <p className="text-[10px] text-slate-500">Used for new solar plant setup</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.whatsapp_installation}
                onChange={(e) => setFormData({ ...formData, whatsapp_installation: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSaveSettingField('whatsapp_installation', formData.whatsapp_installation, 'Installation WhatsApp')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>💾</span>
                <span>Save Installation Number</span>
              </button>
            </div>

            {/* Support WhatsApp */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Support WhatsApp Number</h4>
                  <p className="text-[10px] text-slate-500">Main support desk line</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.whatsapp_support}
                onChange={(e) => setFormData({ ...formData, whatsapp_support: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleSaveSettingField('whatsapp_support', formData.whatsapp_support, 'Support WhatsApp')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>💾</span>
                <span>Save Support Number</span>
              </button>
            </div>

            {/* AI Support Chat Button (Screenshot 1) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">AI Support Chat Button</h4>
                  <p className="text-[10px] text-slate-500">Show floating button on Home</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ai_support_chat_enabled}
                  onChange={(e) => handleSaveSettingField('ai_support_chat_enabled', e.target.checked, 'AI Support Toggle')}
                  className="w-5 h-5 accent-[#0096aa] cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={formData.ai_support_phone || ''}
                onChange={(e) => setFormData({ ...formData, ai_support_phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              />
              <button
                onClick={() => handleSaveSettingField('ai_support_phone', formData.ai_support_phone, 'AI Support WhatsApp')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>💾</span>
                <span>Save AI Support Number</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: SOCIAL MEDIA LINKS (Screenshot 2) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              SOCIAL MEDIA LINKS
            </h3>

            {/* Instagram */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Instagram URL</h4>
              <input
                type="text"
                value={formData.instagram_url || ''}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('instagram_url', formData.instagram_url, 'Instagram')}
                className="w-full py-2 rounded-xl bg-[#d81b60] hover:bg-pink-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Instagram</span>
              </button>
            </div>

            {/* Facebook */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Facebook URL</h4>
              <input
                type="text"
                value={formData.facebook_url || ''}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('facebook_url', formData.facebook_url, 'Facebook')}
                className="w-full py-2 rounded-xl bg-[#1877f2] hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Facebook</span>
              </button>
            </div>

            {/* TikTok */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">TikTok URL</h4>
              <input
                type="text"
                value={formData.tiktok_url || ''}
                onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('tiktok_url', formData.tiktok_url, 'TikTok')}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save TikTok</span>
              </button>
            </div>

            {/* LinkedIn */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">LinkedIn URL</h4>
              <input
                type="text"
                value={formData.linkedin_url || ''}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('linkedin_url', formData.linkedin_url, 'LinkedIn')}
                className="w-full py-2 rounded-xl bg-[#0077b5] hover:bg-sky-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save LinkedIn</span>
              </button>
            </div>

            {/* YouTube */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">YouTube URL</h4>
              <input
                type="text"
                value={formData.youtube_url || ''}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('youtube_url', formData.youtube_url, 'YouTube')}
                className="w-full py-2 rounded-xl bg-[#e53935] hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save YouTube</span>
              </button>
            </div>

            {/* Website */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Website URL</h4>
              <input
                type="text"
                value={formData.website_url || ''}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('website_url', formData.website_url, 'Website')}
                className="w-full py-2 rounded-xl bg-[#3949ab] hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Website</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: CONTACT US INFORMATION (Screenshot 3) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              CONTACT US INFORMATION
            </h3>

            {/* Phone Number */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Phone Number</h4>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              />
              <button
                onClick={() => handleSaveSettingField('contact_phone', formData.contact_phone, 'Phone Number')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Phone Number</span>
              </button>
            </div>

            {/* Email Address */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Email Address</h4>
              <input
                type="text"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => handleSaveSettingField('contact_email', formData.contact_email, 'Email Address')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Email Address</span>
              </button>
            </div>

            {/* Office Address */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Office Address</h4>
              <input
                type="text"
                value={formData.contact_address}
                onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <button
                onClick={() => handleSaveSettingField('contact_address', formData.contact_address, 'Office Address')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Office Address</span>
              </button>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Business Hours</h4>
              <input
                type="text"
                value={formData.contact_hours}
                onChange={(e) => setFormData({ ...formData, contact_hours: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <button
                onClick={() => handleSaveSettingField('contact_hours', formData.contact_hours, 'Business Hours')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Business Hours</span>
              </button>
            </div>
          </div>

          {/* SECTION 4: REFERRAL SYSTEM (Screenshot 3 & User Request) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              REFERRAL SYSTEM &amp; CASH PRIZES
            </h3>

            {/* Referral System Toggle */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Referral System</h4>
                  <p className="text-[10px] text-slate-500">
                    {formData.referral_system_enabled
                      ? 'System is ON — customers can earn cash prizes'
                      : 'System is OFF'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.referral_system_enabled}
                  onChange={(e) =>
                    handleSaveSettingField('referral_system_enabled', e.target.checked, 'Referral System')
                  }
                  className="w-5 h-5 accent-[#0096aa] cursor-pointer"
                />
              </div>

              {/* Points Per Referral */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Points Per Referral</h4>
                <input
                  type="number"
                  value={formData.referral_points_per_referral || 10}
                  onChange={(e) =>
                    setFormData({ ...formData, referral_points_per_referral: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <button
                  onClick={() =>
                    handleSaveSettingField(
                      'referral_points_per_referral',
                      formData.referral_points_per_referral,
                      'Points Per Referral'
                    )
                  }
                  className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>💾</span>
                  <span>Save Points Per Referral</span>
                </button>
              </div>

              {/* PKR Per Point */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">PKR Per Point (Cash Value)</h4>
                <input
                  type="number"
                  value={formData.referral_pkr_per_point || 50}
                  onChange={(e) =>
                    setFormData({ ...formData, referral_pkr_per_point: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <button
                  onClick={() =>
                    handleSaveSettingField('referral_pkr_per_point', formData.referral_pkr_per_point, 'PKR Per Point')
                  }
                  className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>💾</span>
                  <span>Save PKR Per Point</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: ATTENDANCE TIMING / TIMEZONE (Screenshot 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              ATTENDANCE TIMING / TIMEZONE
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div>
                <h4 className="text-xs font-black text-slate-900">UTC Offset (Hours)</h4>
                <p className="text-[10px] text-slate-500">
                  Select your timezone offset so attendance is stamped with exact local time.
                </p>
              </div>

              {/* Quick Pills (Screenshot 4) */}
              <div className="flex items-center gap-2">
                {[
                  { label: '+4', val: 4 },
                  { label: '+4:30', val: 4.5 },
                  { label: '+5 (PK)', val: 5 },
                  { label: '+5:30 (IN)', val: 5.5 },
                ].map((pill) => (
                  <button
                    key={pill.label}
                    onClick={() => setFormData({ ...formData, timezone_offset_hours: pill.val })}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      formData.timezone_offset_hours === pill.val
                        ? 'bg-[#0096aa] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <input
                type="number"
                step="0.5"
                value={formData.timezone_offset_hours || 5}
                onChange={(e) => setFormData({ ...formData, timezone_offset_hours: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono"
              />

              <button
                onClick={() => handleSaveSettingField('timezone_offset_hours', formData.timezone_offset_hours, 'Timezone')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Timezone</span>
              </button>
            </div>
          </div>

          {/* SECTION 6: APP UPDATE (Screenshot 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              APP UPDATE
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-black text-slate-900">Latest Version</h4>
              <input
                type="text"
                value={formData.app_version || '1.0.20'}
                onChange={(e) => setFormData({ ...formData, app_version: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
              />
              <button
                onClick={() => handleSaveSettingField('app_version', formData.app_version, 'Latest Version')}
                className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>💾</span>
                <span>Save Latest Version</span>
              </button>
            </div>
          </div>

          {/* SECTION 7: ADMIN PASSWORD (Screenshot 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              ADMIN PASSWORD
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              {passwordMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <button
                onClick={handleAdminPasswordChange}
                className="w-full py-2.5 rounded-xl bg-[#c62828] hover:bg-rose-800 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition"
              >
                <span>🛡️</span>
                <span>Change Admin Password</span>
              </button>
            </div>
          </div>

          {/* SECTION 8: FLEET LOCATION TRACKING */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              FLEET LOCATION TRACKING
            </h3>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Background Fleet Location</h4>
                  <p className="text-[10px] text-slate-500">
                    Silently relays field technician locations to the Admin Live Map without displaying tracking radar on technician screens.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enforce_24h_tech_tracking}
                  onChange={(e) =>
                    handleSaveSettingField(
                      'enforce_24h_tech_tracking',
                      e.target.checked,
                      'Fleet Tracking Policy'
                    )
                  }
                  className="w-5 h-5 accent-[#0096aa] cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700">Location Ping Frequency (seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={formData.tech_tracking_ping_interval_sec || 15}
                  onChange={(e) =>
                    setFormData({ ...formData, tech_tracking_ping_interval_sec: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
                <button
                  onClick={() =>
                    handleSaveSettingField(
                      'tech_tracking_ping_interval_sec',
                      formData.tech_tracking_ping_interval_sec,
                      'Ping Interval'
                    )
                  }
                  className="w-full py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>💾</span>
                  <span>Save Ping Interval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. CUSTOMER WARRANTIES & CERTIFICATES                     */}
      {/* ========================================================= */}
      {activeTab === 'warranties' && (
        <AdminWarrantiesTab
          bookings={bookings}
          quotes={quotes}
          whatsappNumber={settings.whatsapp_support || settings.whatsapp_booking}
          onShowToast={triggerSaveToast}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD WORKING SITE                                   */}
      {/* ========================================================= */}
      {isAddSiteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Add New Working Site</span>
              </h3>
              <button
                onClick={() => setIsAddSiteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Site Name</label>
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="e.g. Bhakkar Solar Project #2"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Client Name</label>
              <input
                type="text"
                value={newSiteClient}
                onChange={(e) => setNewSiteClient(e.target.value)}
                placeholder="e.g. M. Tariq"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                <input
                  type="text"
                  value={newSitePhone}
                  onChange={(e) => setNewSitePhone(e.target.value)}
                  placeholder="03268630029"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                <select
                  value={newSiteCity}
                  onChange={(e) => setNewSiteCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Address</label>
              <input
                type="text"
                value={newSiteAddress}
                onChange={(e) => setNewSiteAddress(e.target.value)}
                placeholder="Main Bazar, Bhakkar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Assign Technicians</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !newSiteTechs.includes(val)) {
                    setNewSiteTechs([...newSiteTechs, val]);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="">Select tech to add...</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
              {newSiteTechs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {newSiteTechs.map((tn) => (
                    <span
                      key={tn}
                      onClick={() => setNewSiteTechs(newSiteTechs.filter((x) => x !== tn))}
                      className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold cursor-pointer hover:line-through"
                    >
                      {tn} ✕
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreateWorkingSite}
                className="w-full py-2.5 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black shadow-md active:scale-98 transition"
              >
                Save Working Site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD TECHNICIAN WITH LOGIN CREDENTIALS              */}
      {/* ========================================================= */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>Register New Technician</span>
              </h3>
              <button
                onClick={() => setIsAddTechModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name</label>
              <input
                type="text"
                value={newTechName}
                onChange={(e) => {
                  setNewTechName(e.target.value);
                  if (!newTechUsername) {
                    setNewTechUsername(e.target.value.toLowerCase().replace(/\s+/g, ''));
                  }
                }}
                placeholder="e.g. Muhammad Aslam"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newTechPhone}
                  onChange={(e) => setNewTechPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">City Base</label>
                <select
                  value={newTechCity}
                  onChange={(e) => setNewTechCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Specialty</label>
              <select
                value={newTechSpecialty}
                onChange={(e) => setNewTechSpecialty(e.target.value as TechnicianSpecialty)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
              >
                <option value="Solar Panel Wash Specialist">Solar Wash</option>
                <option value="Inverter Diagnostic Engineer">Inverter Diagnostic</option>
                <option value="EPC Installation Lead">EPC Installation</option>
                <option value="High-Voltage Electrical Tech">High-Voltage Tech</option>
                <option value="Site Survey & Net Metering Specialist">Site Survey</option>
              </select>
            </div>

            {/* Credentials Section */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Technician Login Credentials (لاگ ان تفصیلات)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Username / Login ID</label>
                  <input
                    type="text"
                    value={newTechUsername}
                    onChange={(e) => setNewTechUsername(e.target.value)}
                    placeholder="e.g. aslam_tech"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Password</label>
                  <input
                    type="text"
                    value={newTechPassword}
                    onChange={(e) => setNewTechPassword(e.target.value)}
                    placeholder="e.g. tech123"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Official Email (Optional)</label>
                <input
                  type="email"
                  value={newTechEmail}
                  onChange={(e) => setNewTechEmail(e.target.value)}
                  placeholder="aslam@kssolar.pk"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleCreateTechnician}
                className="w-full py-2.5 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black shadow-md active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Create Tech &amp; Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TECHNICIAN CREDENTIALS CONFIRMATION & SHARE        */}
      {/* ========================================================= */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-base">Technician Account Created!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ٽیکنیشن اکاؤنٹ کامیابی سے بن گیا ہے۔ لاگ ان معلومات نوٹ کر لیں یا واٹس ایپ کریں۔
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500 font-medium">Technician Name:</span>
                <span className="font-bold text-slate-900">{createdCredentialsModal.name}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500 font-medium">Phone:</span>
                <span className="font-mono font-bold text-slate-800">{createdCredentialsModal.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-slate-500 font-medium">Login Username:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-emerald-800 font-mono">
                  {createdCredentialsModal.username}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Login Password:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800 font-mono">
                  {createdCredentialsModal.password}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `K&S Solar Technician Login\nName: ${createdCredentialsModal.name}\nUsername: ${createdCredentialsModal.username}\nPassword: ${createdCredentialsModal.password}\nPortal: K&S Solar App`
                  );
                  triggerSaveToast('Credentials copied to clipboard!');
                }}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Credentials (کاپی کریں)</span>
              </button>

              <button
                onClick={() =>
                  handleWhatsAppTechCredentials({
                    name: createdCredentialsModal.name,
                    username: createdCredentialsModal.username,
                    password: createdCredentialsModal.password,
                    phone: createdCredentialsModal.phone,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Login to Tech via WhatsApp</span>
              </button>

              <button
                onClick={() => setCreatedCredentialsModal(null)}
                className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT TECHNICIAN PASSWORD / USERNAME                */}
      {/* ========================================================= */}
      {editingTechCreds && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Edit Login Credentials</span>
              </h3>
              <button
                onClick={() => setEditingTechCreds(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Update login credentials for <span className="font-bold text-slate-900">{editingTechCreds.name}</span>.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Username / Login ID</label>
              <input
                type="text"
                value={editingTechCreds.username}
                onChange={(e) => setEditingTechCreds({ ...editingTechCreds, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Password</label>
              <input
                type="text"
                value={editingTechCreds.password}
                onChange={(e) => setEditingTechCreds({ ...editingTechCreds, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setEditingTechCreds(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTechCredentials}
                className="flex-1 py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET CUSTOMER PASSWORD                            */}
      {/* ========================================================= */}
      {editingCustomerPass && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Reset Customer Password</span>
              </h3>
              <button
                onClick={() => setEditingCustomerPass(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Set a new password for <span className="font-bold text-slate-900">{editingCustomerPass.name}</span> (Phone: {editingCustomerPass.phone}).
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">New Password</label>
              <input
                type="text"
                value={editingCustomerPass.newPass}
                onChange={(e) => setEditingCustomerPass({ ...editingCustomerPass, newPass: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setEditingCustomerPass(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomerPassword}
                className="flex-1 py-2 rounded-xl bg-[#2e7d32] hover:bg-emerald-700 text-white text-xs font-black shadow-md"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MULTI-TECHNICIAN PICKER MODAL                             */}
      {/* ========================================================= */}
      <MultiTechnicianPickerModal
        isOpen={multiTechPicker.isOpen}
        onClose={() => setMultiTechPicker({ ...multiTechPicker, isOpen: false })}
        technicians={technicians}
        initialSelectedIds={multiTechPicker.initialSelectedIds}
        jobTitle={multiTechPicker.jobTitle}
        initialNotes={multiTechPicker.initialNotes}
        onConfirm={(selectedIds, selectedNames, notes) => {
          if (multiTechPicker.category === 'washing' && onAssignBookingTechs) {
            onAssignBookingTechs(multiTechPicker.targetId, selectedIds, selectedNames, notes);
          } else if (multiTechPicker.category === 'complaint' && onAssignComplaintTechs) {
            onAssignComplaintTechs(multiTechPicker.targetId, selectedIds, selectedNames, notes);
          } else if (multiTechPicker.category === 'survey' && onAssignQuoteTechs) {
            onAssignQuoteTechs(multiTechPicker.targetId, selectedIds, selectedNames, notes);
          }
          setMultiTechPicker({ ...multiTechPicker, isOpen: false });
          triggerSaveToast(`Assigned ${selectedIds.length} technician(s)`);
        }}
      />
    </div>
  );
};
