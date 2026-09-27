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
  ComplaintSubject,
  SystemType,
  PropertyType,
  InverterBrand,
  TrashItem,
  TrashItemType,
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
  Database,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { ResendService } from '../services/resendService';
import { CITIES } from '../data/mockData';
import { LiveFleetMap } from './LiveFleetMap';
import { MultiTechnicianPickerModal } from './MultiTechnicianPickerModal';
import { AdminWarrantiesTab } from './AdminWarrantiesTab';
import { NeonDbMigrationModal } from './NeonDbMigrationModal';

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
  onCreateBooking?: (data: Booking) => void;
  onCreateComplaint?: (data: Complaint) => void;
  onCreateQuote?: (data: QuoteRequest) => void;
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
  onCreateBooking,
  onCreateComplaint,
  onCreateQuote,
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
    | 'trash'
  >('dashboard');

  // Local copy of AppSettings with instant feedback toasts
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saveToast, setSaveToast] = useState<string>('');

  // Working Sites & Attendance state
  const [workingSites, setWorkingSites] = useState<WorkingSite[]>(() => StorageService.getWorkingSites());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendanceRecords()
  );

  // Trash & Recycle Bin State
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => StorageService.getTrash());
  const [trashFilter, setTrashFilter] = useState<'all' | TrashItemType>('all');
  const [trashSearchQuery, setTrashSearchQuery] = useState('');
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    itemType: TrashItemType;
    id: string;
    title: string;
    subtitle?: string;
    isPermanent?: boolean;
  } | null>(null);

  // Local synced copies for instant UI responsiveness on delete/restore
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [localComplaints, setLocalComplaints] = useState<Complaint[]>(complaints);
  const [localQuotes, setLocalQuotes] = useState<QuoteRequest[]>(quotes);
  const [localTechnicians, setLocalTechnicians] = useState<Technician[]>(technicians);

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);
  useEffect(() => {
    setLocalComplaints(complaints);
  }, [complaints]);
  useEffect(() => {
    setLocalQuotes(quotes);
  }, [quotes]);
  useEffect(() => {
    setLocalTechnicians(technicians);
  }, [technicians]);

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
  const [isNeonDbModalOpen, setIsNeonDbModalOpen] = useState(false);
  const [newSiteClient, setNewSiteClient] = useState('');
  const [newSitePhone, setNewSitePhone] = useState('');
  const [newSiteCity, setNewSiteCity] = useState(CITIES[0] || 'Lahore');
  const [newSiteAddress, setNewSiteAddress] = useState('');
  const [newSiteTechs, setNewSiteTechs] = useState<string[]>([]);

  // Manual Create Booking Modal State
  const [isCreateBookingModalOpen, setIsCreateBookingModalOpen] = useState(false);
  const [newBkCustomerName, setNewBkCustomerName] = useState('');
  const [newBkPhone, setNewBkPhone] = useState('');
  const [newBkCity, setNewBkCity] = useState(CITIES[0] || 'Bhakkar');
  const [newBkAddress, setNewBkAddress] = useState('');
  const [newBkServiceType, setNewBkServiceType] = useState('Solar Panel Washing');
  const [newBkCapacityKw, setNewBkCapacityKw] = useState('10');
  const [newBkPanelCount, setNewBkPanelCount] = useState('18');
  const [newBkDate, setNewBkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newBkTime, setNewBkTime] = useState('morning');
  const [newBkAmount, setNewBkAmount] = useState('3500');
  const [newBkTechIds, setNewBkTechIds] = useState<string[]>([]);

  // Manual Create Complaint Modal State
  const [isCreateComplaintModalOpen, setIsCreateComplaintModalOpen] = useState(false);
  const [newCpCustomerName, setNewCpCustomerName] = useState('');
  const [newCpPhone, setNewCpPhone] = useState('');
  const [newCpCity, setNewCpCity] = useState(CITIES[0] || 'Bhakkar');
  const [newCpAddress, setNewCpAddress] = useState('');
  const [newCpSubject, setNewCpSubject] = useState<ComplaintSubject>('inverter_fault');
  const [newCpSystemType, setNewCpSystemType] = useState<SystemType>('hybrid');
  const [newCpInverterBrand, setNewCpInverterBrand] = useState<string>('Growatt');
  const [newCpCapacity, setNewCpCapacity] = useState('10 kW');
  const [newCpDescription, setNewCpDescription] = useState('');
  const [newCpPriority, setNewCpPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [newCpTechIds, setNewCpTechIds] = useState<string[]>([]);

  // Manual Create Site Visit / EPC Survey Modal State
  const [isCreateSiteVisitModalOpen, setIsCreateSiteVisitModalOpen] = useState(false);
  const [newSvCustomerName, setNewSvCustomerName] = useState('');
  const [newSvPhone, setNewSvPhone] = useState('');
  const [newSvCity, setNewSvCity] = useState(CITIES[0] || 'Bhakkar');
  const [newSvAddress, setNewSvAddress] = useState('');
  const [newSvSystemSizeKw, setNewSvSystemSizeKw] = useState('10');
  const [newSvPropertyType, setNewSvPropertyType] = useState<PropertyType>('residential');
  const [newSvSystemType, setNewSvSystemType] = useState<SystemType>('hybrid');
  const [newSvBatteryBackup, setNewSvBatteryBackup] = useState(true);
  const [newSvDate, setNewSvDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newSvEstimatedCost, setNewSvEstimatedCost] = useState('1650000');
  const [newSvTechIds, setNewSvTechIds] = useState<string[]>([]);

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

  // Email API Key & Verification state
  const [emailApiKey, setEmailApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [senderFromAddress, setSenderFromAddress] = useState('K&S Solar Security <noreply@knssolar.com.pk>');
  const [testEmailRecipient, setTestEmailRecipient] = useState('yousafkhan6323@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    ResendService.getApiKey().then((key) => {
      if (key) setEmailApiKey(key);
    });
    ResendService.getFromAddress().then((from) => {
      if (from) setSenderFromAddress(from);
    });
  }, []);

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

  const handleSaveEmailApiKey = async () => {
    const key = emailApiKey.trim();
    const fromAddr = senderFromAddress.trim();
    await ResendService.saveApiKey(key);
    if (fromAddr) {
      await ResendService.saveFromAddress(fromAddr);
    }
    handleSaveSettingField('email_api_key', key, 'Email Delivery Settings');
  };

  const handleTestEmailSend = async () => {
    if (!testEmailRecipient.trim()) return;
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await ResendService.testEmailDelivery(
        testEmailRecipient,
        emailApiKey.trim(),
        senderFromAddress.trim()
      );
      setTestEmailResult({
        success: res.success,
        message: res.message,
      });
    } catch (e: any) {
      setTestEmailResult({
        success: false,
        message: e?.message || 'Failed to send test email',
      });
    } finally {
      setIsTestingEmail(false);
    }
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

  // Manual Create Booking Submit Handler with Multi-Technician support
  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBkCustomerName.trim() || !newBkPhone.trim()) {
      triggerSaveToast('Customer name and phone number are required.');
      return;
    }

    const assignedTechs = technicians.filter((t) => newBkTechIds.includes(t.id));

    const newBooking: Booking = {
      id: `KSB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newBkCustomerName.trim(),
      phone: newBkPhone.trim(),
      city: newBkCity,
      address: newBkAddress.trim() || newBkCity,
      notes: `${newBkServiceType} (${newBkCapacityKw} kW)`,
      panelCount: parseInt(newBkPanelCount, 10) || 18,
      panelType: 'monocrystalline',
      preferredDate: newBkDate,
      preferredTime: newBkTime as any,
      estimatedPrice: parseFloat(newBkAmount) || 3500,
      status: assignedTechs.length > 0 ? 'confirmed' : 'pending',
      assignedTechnicianId: assignedTechs[0]?.id,
      assignedTechnicianName: assignedTechs.map((t) => t.name).join(', ') || undefined,
      assignedTechnicianIds: assignedTechs.map((t) => t.id),
      assignedTechnicianNames: assignedTechs.map((t) => t.name),
      techJobProgress: assignedTechs.length > 0 ? 'assigned' : undefined,
      createdAt: new Date().toISOString(),
    };

    StorageService.addBooking(newBooking);
    const updatedBookings = StorageService.getBookings();
    setLocalBookings(updatedBookings);
    if (onCreateBooking) {
      onCreateBooking(newBooking);
    }
    if (assignedTechs.length > 0 && onAssignBookingTechs) {
      onAssignBookingTechs(
        newBooking.id,
        assignedTechs.map((t) => t.id),
        assignedTechs.map((t) => t.name),
        'Assigned on booking creation'
      );
    } else if (assignedTechs.length > 0) {
      onAssignBookingTech(newBooking.id, assignedTechs[0].id, assignedTechs[0].name, 'Assigned on booking creation');
    }

    setIsCreateBookingModalOpen(false);
    setNewBkCustomerName('');
    setNewBkPhone('');
    setNewBkAddress('');
    setNewBkTechIds([]);
    triggerSaveToast(
      `✓ Booking created for ${newBooking.customerName}${
        assignedTechs.length > 0 ? ` & assigned to ${assignedTechs.map((t) => t.name).join(', ')}` : ''
      }!`
    );
  };

  // Manual Create Complaint Submit Handler with Multi-Technician support
  const handleCreateComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCpCustomerName.trim() || !newCpPhone.trim()) {
      triggerSaveToast('Customer name and phone number are required.');
      return;
    }

    const assignedTechs = technicians.filter((t) => newCpTechIds.includes(t.id));

    const newComplaint: Complaint = {
      id: `KSC-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newCpCustomerName.trim(),
      phone: newCpPhone.trim(),
      city: newCpCity,
      address: newCpAddress.trim() || newCpCity,
      subject: newCpSubject,
      systemCategory: newCpSystemType,
      description: newCpDescription.trim() || 'Site inspection and issue resolution required.',
      status: assignedTechs.length > 0 ? 'assigned' : 'pending',
      assignedTechnicianId: assignedTechs[0]?.id,
      assignedTechnicianName: assignedTechs.map((t) => t.name).join(', ') || undefined,
      assignedTechnicianIds: assignedTechs.map((t) => t.id),
      assignedTechnicianNames: assignedTechs.map((t) => t.name),
      createdAt: new Date().toISOString(),
    };

    StorageService.addComplaint(newComplaint);
    const updatedComplaints = StorageService.getComplaints();
    setLocalComplaints(updatedComplaints);
    if (onCreateComplaint) {
      onCreateComplaint(newComplaint);
    }
    if (assignedTechs.length > 0 && onAssignComplaintTechs) {
      onAssignComplaintTechs(
        newComplaint.id,
        assignedTechs.map((t) => t.id),
        assignedTechs.map((t) => t.name),
        'Assigned on complaint creation'
      );
    } else if (assignedTechs.length > 0) {
      onAssignComplaintTech(newComplaint.id, assignedTechs[0].id, assignedTechs[0].name, 'Assigned on complaint creation');
    }

    setIsCreateComplaintModalOpen(false);
    setNewCpCustomerName('');
    setNewCpPhone('');
    setNewCpAddress('');
    setNewCpDescription('');
    setNewCpTechIds([]);
    triggerSaveToast(
      `✓ Complaint created for ${newComplaint.customerName}${
        assignedTechs.length > 0 ? ` & assigned to ${assignedTechs.map((t) => t.name).join(', ')}` : ''
      }!`
    );
  };

  // Manual Create Site Visit / EPC Survey Submit Handler with Multi-Technician support
  const handleCreateSiteVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvCustomerName.trim() || !newSvPhone.trim()) {
      triggerSaveToast('Customer name and phone number are required.');
      return;
    }

    const assignedTechs = technicians.filter((t) => newSvTechIds.includes(t.id));

    const newQuote: QuoteRequest = {
      id: `KSQ-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newSvCustomerName.trim(),
      phone: newSvPhone.trim(),
      city: newSvCity,
      address: newSvAddress.trim() || newSvCity,
      systemSizeKw: parseFloat(newSvSystemSizeKw) || 10,
      propertyType: newSvPropertyType,
      systemType: newSvSystemType,
      batteryBackup: newSvBatteryBackup,
      estimatedCostPkr: parseFloat(newSvEstimatedCost) || 1650000,
      estimatedMonthlySavingsPkr: Math.round((parseFloat(newSvSystemSizeKw) || 10) * 4.8 * 30 * 58),
      status: assignedTechs.length > 0 ? 'reviewed' : 'pending',
      assignedTechnicianId: assignedTechs[0]?.id,
      assignedTechnicianName: assignedTechs.map((t) => t.name).join(', ') || undefined,
      assignedTechnicianIds: assignedTechs.map((t) => t.id),
      assignedTechnicianNames: assignedTechs.map((t) => t.name),
      surveyDate: newSvDate,
      notes: `Site visit scheduled for ${newSvDate}. Location: ${newSvAddress || newSvCity}`,
      createdAt: new Date().toISOString(),
    };

    StorageService.addQuote(newQuote);
    const updatedQuotes = StorageService.getQuotes();
    setLocalQuotes(updatedQuotes);
    if (onCreateQuote) {
      onCreateQuote(newQuote);
    }
    if (assignedTechs.length > 0 && onAssignQuoteTechs) {
      onAssignQuoteTechs(
        newQuote.id,
        assignedTechs.map((t) => t.id),
        assignedTechs.map((t) => t.name),
        'Assigned on site visit schedule'
      );
    } else if (assignedTechs.length > 0 && onAssignQuoteTech) {
      onAssignQuoteTech(newQuote.id, assignedTechs[0].id, assignedTechs[0].name);
    }

    setIsCreateSiteVisitModalOpen(false);
    setNewSvCustomerName('');
    setNewSvPhone('');
    setNewSvAddress('');
    setNewSvTechIds([]);
    triggerSaveToast(
      `✓ Site visit scheduled for ${newQuote.customerName}${
        assignedTechs.length > 0 ? ` & assigned to ${assignedTechs.map((t) => t.name).join(', ')}` : ''
      }!`
    );
  };

  // Trash & Recycle Bin Handlers
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const { itemType, id, title, isPermanent } = deleteConfirmTarget;

    if (isPermanent) {
      StorageService.deletePermanentlyFromTrash(id);
      setTrashItems(StorageService.getTrash());
      triggerSaveToast(`✓ Permanently deleted "${title}"`);
    } else {
      if (itemType === 'booking') {
        StorageService.deleteBooking(id, true);
        setLocalBookings(StorageService.getBookings());
      } else if (itemType === 'complaint') {
        StorageService.deleteComplaint(id, true);
        setLocalComplaints(StorageService.getComplaints());
      } else if (itemType === 'site') {
        StorageService.deleteWorkingSite(id, true);
        setWorkingSites(StorageService.getWorkingSites());
      } else if (itemType === 'site_visit') {
        StorageService.deleteQuote(id, true);
        setLocalQuotes(StorageService.getQuotes());
      } else if (itemType === 'technician') {
        StorageService.deleteTechnician(id, true);
        setLocalTechnicians(StorageService.getTechnicians());
      } else if (itemType === 'user') {
        StorageService.deleteAccount(id, true);
        setAccounts(StorageService.getAccounts());
      }
      setTrashItems(StorageService.getTrash());
      triggerSaveToast(`✓ Moved "${title}" to Trash (Recycle Bin)`);
    }
    setDeleteConfirmTarget(null);
  };

  const handleRestoreTrashItem = (trashId: string, title: string) => {
    const success = StorageService.restoreFromTrash(trashId);
    if (success) {
      setLocalBookings(StorageService.getBookings());
      setLocalComplaints(StorageService.getComplaints());
      setWorkingSites(StorageService.getWorkingSites());
      setLocalQuotes(StorageService.getQuotes());
      setLocalTechnicians(StorageService.getTechnicians());
      setAccounts(StorageService.getAccounts());
      setTrashItems(StorageService.getTrash());
      triggerSaveToast(`✓ Restored "${title}" back to active list!`);
    }
  };

  const handleEmptyTrash = () => {
    StorageService.emptyTrash();
    setTrashItems([]);
    triggerSaveToast('✓ Trash emptied successfully');
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
    setDeleteConfirmTarget({
      itemType: 'user',
      id: account.id,
      title: account.name,
      subtitle: `${account.email || account.username || account.phone} · Role: ${account.role}`,
    });
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
            <button
              type="button"
              onClick={() => setIsNeonDbModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-400/50 text-emerald-300 text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 backdrop-blur-xs transition active:scale-95 shadow-xs cursor-pointer"
              title="Central Cloud Database"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cloud DB Live</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-400/40 text-rose-200 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-xs transition active:scale-95 shadow-xs cursor-pointer"
              title="Trash & Recycle Bin"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              <span>Trash ({trashItems.length})</span>
            </button>
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

            {/* 13. Customer Warranties & Certificates */}
            <div
              onClick={() => setActiveTab('warranties')}
              className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black">Customer Warranties</h3>
                <p className="text-xs text-amber-100 font-medium">
                  {StorageService.getWarranties().length} registered certificates
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 14. Central Cloud Database Connection */}
            <div
              onClick={() => setIsNeonDbModalOpen(true)}
              className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95 border border-indigo-700/50"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Database className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-1.5">
                  <span>Central Cloud DB</span>
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    Connected
                  </span>
                </h3>
                <p className="text-xs text-indigo-200 font-medium">
                  Direct Live Cloud Synchronization
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>

            {/* 15. Recycle Bin & Trash */}
            <div
              onClick={() => setActiveTab('trash')}
              className="bg-gradient-to-br from-rose-700 via-rose-800 to-slate-900 text-white rounded-3xl p-4 shadow-sm flex flex-col justify-between h-36 relative cursor-pointer active:scale-98 transition hover:opacity-95 border border-rose-600/40"
            >
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-1.5">
                  <span>Trash &amp; Restore</span>
                  {trashItems.length > 0 && (
                    <span className="text-[9px] bg-white text-rose-800 px-1.5 py-0.5 rounded-full font-bold">
                      {trashItems.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-rose-200 font-medium">
                  {trashItems.length} items in recycle bin
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80 absolute right-4 bottom-4" />
            </div>
          </div>

          {/* Cloud Database Direct Connect Quick Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-3.5 border border-indigo-700/40 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-400/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Live Cloud Database</span>
                  <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live Active
                  </span>
                </h4>
                <p className="text-[10px] text-indigo-200">
                  Your application is directly connected to the Central PostgreSQL Cloud Database
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNeonDbModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold active:scale-95 transition shadow-sm cursor-pointer"
            >
              Open Database Manager
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. BOOKINGS SUBVIEW (Matching Screenshot 11)              */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className="p-4 space-y-4">
          {/* Header & Create Action */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Solar Wash Orders
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{localBookings.length} total orders</p>
            </div>
            <button
              onClick={() => setIsCreateBookingModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#0096aa] hover:bg-[#00838f] text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Create Booking</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filterKey) => {
              const count =
                filterKey === 'all'
                  ? localBookings.length
                  : localBookings.filter((b) => b.status === filterKey).length;
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
            {localBookings
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

                      <div className="flex items-center gap-1.5">
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
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              itemType: 'booking',
                              id: b.id,
                              title: `Order ${b.id} (${b.customerName})`,
                              subtitle: `${b.city} · ${b.panelCount} panels · Rs. ${b.estimatedPrice}`,
                            })
                          }
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      {/* 3. COMPLAINTS SUBVIEW (Matching Screenshot 10)            */}
      {/* ========================================================= */}
      {activeTab === 'complaints' && (
        <div className="p-4 space-y-4">
          {/* Header & Create Action */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Technical Complaints
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{localComplaints.length} total issues</p>
            </div>
            <button
              onClick={() => setIsCreateComplaintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ New Complaint</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(['all', 'pending', 'assigned', 'in_progress', 'resolved'] as const).map((filterKey) => {
              const count =
                filterKey === 'all'
                  ? localComplaints.length
                  : localComplaints.filter((c) => c.status === filterKey).length;
              return (
                <button
                  key={filterKey}
                  onClick={() => setComplaintFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                    complaintFilter === filterKey
                      ? 'bg-rose-600 text-white shadow-xs'
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
            {localComplaints
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

                    <div className="flex items-center gap-1.5">
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
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            itemType: 'complaint',
                            id: c.id,
                            title: `Complaint ${c.id} (${c.customerName})`,
                            subtitle: `${c.city} · ${c.subject}`,
                          })
                        }
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirmTarget({
                          itemType: 'site',
                          id: site.id,
                          title: site.name,
                          subtitle: `${site.clientName} · ${site.city}`,
                        })
                      }
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            {localTechnicians.map((t) => {
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
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        ID: {t.id}
                      </span>
                      <button
                        onClick={() => handleOpenWhatsApp(t.phone, t.name, 'Staff Dispatch')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmTarget({
                            itemType: 'technician',
                            id: t.id,
                            title: t.name,
                            subtitle: `${t.city} · ${t.phone} · ${t.specialty}`,
                          })
                        }
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                            <span>✓ Approve Account</span>
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

          <LiveFleetMap technicians={technicians} />
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
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Site Visits &amp; EPC Surveys
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">{localQuotes.length} total surveys</p>
            </div>
            <button
              onClick={() => setIsCreateSiteVisitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Schedule Site Visit</span>
            </button>
          </div>

          <div className="space-y-3">
            {localQuotes.map((q) => (
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

                  <div className="flex items-center gap-1.5">
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
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirmTarget({
                          itemType: 'site_visit',
                          id: q.id,
                          title: `Site Survey ${q.id} (${q.customerName})`,
                          subtitle: `${q.city} · ${q.systemSizeKw}kW · Rs. ${q.estimatedCostPkr.toLocaleString()}`,
                        })
                      }
                      className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                      title="Move to Trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

          {/* SECTION: EMAIL & VERIFICATION SERVICE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                EMAIL &amp; VERIFICATION SERVICE
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  emailApiKey.trim().startsWith('re_')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {emailApiKey.trim().startsWith('re_')
                  ? 'Cloud Email Active'
                  : 'API Key Required'}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900">Email Delivery API Key (Resend)</h4>
                <p className="text-[10px] text-slate-500">
                  Resend API key used to deliver 6-digit password reset OTP codes and official notifications directly to inboxes.
                </p>
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={emailApiKey}
                  onChange={(e) => setEmailApiKey(e.target.value)}
                  placeholder="Paste your API key here (e.g. re_...)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold pr-10 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-black text-slate-900">Official Sender Address (From Email)</h4>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Domain Verified: knssolar.com.pk
                  </span>
                </div>
                <input
                  type="text"
                  value={senderFromAddress}
                  onChange={(e) => setSenderFromAddress(e.target.value)}
                  placeholder="K&S Solar Security <noreply@knssolar.com.pk>"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[9px] text-slate-500 mt-1">
                  Verified Hostinger Domain: <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-bold">knssolar.com.pk</code>. Delivers official transactional emails to all customers and technicians.
                </p>
              </div>

              <button
                onClick={handleSaveEmailApiKey}
                className="w-full py-2 rounded-xl bg-[#0096aa] hover:bg-cyan-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition cursor-pointer"
              >
                <span>💾</span>
                <span>Save Email Settings</span>
              </button>

              {/* Informative Guidance Box about Verified Domain */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-[10px] space-y-1.5 text-emerald-950">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <span>✅</span>
                  <span>Commercial Email Ready (knssolar.com.pk Verified):</span>
                </div>
                <p className="leading-relaxed">
                  Official domain <strong className="font-bold underline">knssolar.com.pk</strong> is verified and active. All customers, technicians, and administrators receive verification codes directly in their inbox.
                </p>
              </div>

              {/* Instant Test Email */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[11px] font-bold text-slate-800">Live Test Email Delivery</h5>
                  <span className="text-[10px] text-emerald-600 font-bold">Direct to Recipient</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="yousafkhan6323@gmail.com"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                  <button
                    type="button"
                    disabled={isTestingEmail || !emailApiKey.trim()}
                    onClick={handleTestEmailSend}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold transition whitespace-nowrap cursor-pointer"
                  >
                    {isTestingEmail ? 'Sending...' : 'Send Test'}
                  </button>
                </div>

                {testEmailResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-start gap-2 ${
                      testEmailResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testEmailResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span className="leading-snug">{testEmailResult.message}</span>
                  </div>
                )}
              </div>
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
      {/* 14. TRASH & RECYCLE BIN VIEW                              */}
      {/* ========================================================= */}
      {activeTab === 'trash' && (
        <div className="p-4 space-y-4">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 text-white p-4 rounded-3xl shadow-sm border border-rose-700/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
                <Trash2 className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">Trash &amp; Recycle Bin</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/30 text-rose-200 text-[10px] font-bold">
                    {trashItems.length} Deleted Items
                  </span>
                </div>
                <p className="text-xs text-rose-200 font-medium">
                  Deleted bookings, complaints, sites, visits, technicians &amp; users can be restored or erased permanently.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {trashItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEmptyTrashConfirmOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black border border-rose-400/40 flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty Entire Trash</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs & Search Bar */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { key: 'all', label: 'All Items', count: trashItems.length },
                { key: 'booking', label: 'Bookings', count: trashItems.filter((t) => t.itemType === 'booking').length },
                { key: 'complaint', label: 'Complaints', count: trashItems.filter((t) => t.itemType === 'complaint').length },
                { key: 'site', label: 'Working Sites', count: trashItems.filter((t) => t.itemType === 'site').length },
                { key: 'site_visit', label: 'Site Visits', count: trashItems.filter((t) => t.itemType === 'site_visit').length },
                { key: 'technician', label: 'Technicians', count: trashItems.filter((t) => t.itemType === 'technician').length },
                { key: 'user', label: 'Users', count: trashItems.filter((t) => t.itemType === 'user').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTrashFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                    trashFilter === tab.key
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      trashFilter === tab.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={trashSearchQuery}
                onChange={(e) => setTrashSearchQuery(e.target.value)}
                placeholder="Search deleted items by title, customer, phone, city or ID..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {trashSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTrashSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs absolute right-3 top-2.5"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Trashed Items List */}
          {(() => {
            const filtered = trashItems.filter((t) => {
              if (trashFilter !== 'all' && t.itemType !== trashFilter) return false;
              if (trashSearchQuery.trim()) {
                const q = trashSearchQuery.toLowerCase();
                const matchTitle = t.title?.toLowerCase().includes(q);
                const matchSub = t.subtitle?.toLowerCase().includes(q);
                const matchOrig = t.originalId?.toLowerCase().includes(q);
                return matchTitle || matchSub || matchOrig;
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      {trashItems.length === 0 ? 'Recycle Bin is Empty' : 'No Matching Items Found'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {trashItems.length === 0
                        ? 'Deleted bookings, complaints, sites, visits, technicians and users will appear here.'
                        : 'Try adjusting your search query or category filter.'}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-2.5">
                {filtered.map((item) => {
                  const badgeColor =
                    item.itemType === 'booking'
                      ? 'bg-cyan-100 text-cyan-800'
                      : item.itemType === 'complaint'
                      ? 'bg-rose-100 text-rose-800'
                      : item.itemType === 'site'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.itemType === 'site_visit'
                      ? 'bg-purple-100 text-purple-800'
                      : item.itemType === 'technician'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800';

                  const itemLabel =
                    item.itemType === 'booking'
                      ? 'Booking'
                      : item.itemType === 'complaint'
                      ? 'Complaint'
                      : item.itemType === 'site'
                      ? 'Working Site'
                      : item.itemType === 'site_visit'
                      ? 'Site Visit'
                      : item.itemType === 'technician'
                      ? 'Technician'
                      : 'User Account';

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                            {itemLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">ID: {item.originalId}</span>
                          <span className="text-[10px] text-slate-400">
                            Deleted: {new Date(item.deletedAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 truncate">{item.title}</h4>
                        {item.subtitle && <p className="text-xs text-slate-600 truncate">{item.subtitle}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleRestoreTrashItem(item.id, item.title)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore / بحال کریں</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirmTarget({
                              itemType: item.itemType,
                              id: item.id,
                              title: item.title,
                              subtitle: item.subtitle,
                              isPermanent: true,
                            })
                          }
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL CREATE BOOKING                              */}
      {/* ========================================================= */}
      {isCreateBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#0096aa]" />
                <span>Create New Booking (Wash / Service)</span>
              </h3>
              <button
                onClick={() => setIsCreateBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBookingSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newBkCustomerName}
                    onChange={(e) => setNewBkCustomerName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newBkPhone}
                    onChange={(e) => setNewBkPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                  <select
                    value={newBkCity}
                    onChange={(e) => setNewBkCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Service Type</label>
                  <select
                    value={newBkServiceType}
                    onChange={(e) => setNewBkServiceType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="Solar Panel Washing">Solar Panel Washing</option>
                    <option value="Deep Chemical Panel Wash">Deep Chemical Panel Wash</option>
                    <option value="System Inspection & Wash">System Inspection & Wash</option>
                    <option value="Commercial Rooftop Cleaning">Commercial Rooftop Cleaning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Street / House Address</label>
                <input
                  type="text"
                  value={newBkAddress}
                  onChange={(e) => setNewBkAddress(e.target.value)}
                  placeholder="House 12, Sector B, Bhakkar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Capacity (kW)</label>
                  <input
                    type="number"
                    value={newBkCapacityKw}
                    onChange={(e) => setNewBkCapacityKw(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Panel Count</label>
                  <input
                    type="number"
                    value={newBkPanelCount}
                    onChange={(e) => setNewBkPanelCount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount (Rs)</label>
                  <input
                    type="number"
                    value={newBkAmount}
                    onChange={(e) => setNewBkAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={newBkDate}
                    onChange={(e) => setNewBkDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Time Slot</label>
                  <select
                    value={newBkTime}
                    onChange={(e) => setNewBkTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="morning">Morning (08:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (12:00 PM - 04:00 PM)</option>
                    <option value="evening">Evening (04:00 PM - 07:00 PM)</option>
                  </select>
                </div>
              </div>

              {/* Technician Assignment (Multi-Technician Selection Allowed) */}
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-cyan-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Assign Technicians / Crew ({newBkTechIds.length} Selected)</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewBkTechIds(technicians.map((t) => t.id))}
                      className="text-cyan-800 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-cyan-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewBkTechIds([])}
                      className="text-slate-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {technicians.map((t) => {
                    const isSelected = newBkTechIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewBkTechIds(newBkTechIds.filter((id) => id !== t.id));
                          } else {
                            setNewBkTechIds([...newBkTechIds, t.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                          isSelected
                            ? 'bg-cyan-100/90 border-cyan-500 text-cyan-950 font-bold shadow-xs'
                            : 'bg-white border-cyan-200/80 text-slate-700 hover:border-cyan-300'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <p className="truncate text-[11px]">👨‍🔧 {t.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{t.city} · {t.phone}</p>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isSelected ? 'bg-cyan-700 text-white' : 'border border-cyan-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>

                {newBkTechIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-cyan-200/60">
                    {technicians
                      .filter((t) => newBkTechIds.includes(t.id))
                      .map((t) => (
                        <span
                          key={t.id}
                          onClick={() => setNewBkTechIds(newBkTechIds.filter((id) => id !== t.id))}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-200/80 text-cyan-900 text-[10px] font-bold cursor-pointer hover:bg-rose-100 hover:text-rose-800 transition"
                          title="Click to remove"
                        >
                          <span>{t.name}</span>
                          <span>✕</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-cyan-700">
                    Ek ya multiple technicians ko select karein. Booking create hote hi un sab ko assign ho jayegi.
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBookingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0096aa] hover:bg-[#00838f] text-white text-xs font-black shadow-md active:scale-98 transition"
                >
                  Save &amp; Assign Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL CREATE COMPLAINT                            */}
      {/* ========================================================= */}
      {isCreateComplaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Create New Technical Complaint</span>
              </h3>
              <button
                onClick={() => setIsCreateComplaintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaintSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCpCustomerName}
                    onChange={(e) => setNewCpCustomerName(e.target.value)}
                    placeholder="e.g. Asif Raza"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newCpPhone}
                    onChange={(e) => setNewCpPhone(e.target.value)}
                    placeholder="03009876543"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                  <select
                    value={newCpCity}
                    onChange={(e) => setNewCpCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Issue Category</label>
                  <select
                    value={newCpSubject}
                    onChange={(e) => setNewCpSubject(e.target.value as ComplaintSubject)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    <option value="inverter_fault">Inverter Fault / Red Error Light</option>
                    <option value="low_generation">Low Generation / Power Output Drop</option>
                    <option value="battery_not_charging">Battery Not Charging / Backup Loss</option>
                    <option value="wiring_physical_damage">Wiring / Cable / Breaker Trip</option>
                    <option value="leakage_earthing">Earthing / Structure Current Leakage</option>
                    <option value="other">Other Technical Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Site / Customer Address</label>
                <input
                  type="text"
                  value={newCpAddress}
                  onChange={(e) => setNewCpAddress(e.target.value)}
                  placeholder="Near Grid Station, Bhakkar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">System Type</label>
                  <select
                    value={newCpSystemType}
                    onChange={(e) => setNewCpSystemType(e.target.value as SystemType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="on_grid">On-Grid</option>
                    <option value="off_grid">Off-Grid</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Inverter Brand</label>
                  <select
                    value={newCpInverterBrand}
                    onChange={(e) => setNewCpInverterBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="Growatt">Growatt</option>
                    <option value="Huawei">Huawei</option>
                    <option value="Fronus">Fronus</option>
                    <option value="Knox">Knox</option>
                    <option value="Inverex">Inverex</option>
                    <option value="SolarMax">SolarMax</option>
                    <option value="Tesla Solar">Tesla Solar</option>
                    <option value="Solis">Solis</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Priority</label>
                  <select
                    value={newCpPriority}
                    onChange={(e) => setNewCpPriority(e.target.value as 'normal' | 'high' | 'urgent')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent (Emergency)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Issue Description / Fault Details</label>
                <textarea
                  rows={2}
                  value={newCpDescription}
                  onChange={(e) => setNewCpDescription(e.target.value)}
                  placeholder="Inverter showing error code F08, grid trip occurred..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs resize-none"
                />
              </div>

              {/* Technician Assignment (Multi-Technician Selection Allowed) */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-rose-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-700" />
                    <span>Assign Technicians / Crew ({newCpTechIds.length} Selected)</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewCpTechIds(technicians.map((t) => t.id))}
                      className="text-rose-800 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-rose-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewCpTechIds([])}
                      className="text-slate-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {technicians.map((t) => {
                    const isSelected = newCpTechIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewCpTechIds(newCpTechIds.filter((id) => id !== t.id));
                          } else {
                            setNewCpTechIds([...newCpTechIds, t.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                          isSelected
                            ? 'bg-rose-100/90 border-rose-500 text-rose-950 font-bold shadow-xs'
                            : 'bg-white border-rose-200/80 text-slate-700 hover:border-rose-300'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <p className="truncate text-[11px]">👨‍🔧 {t.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{t.city} · {t.phone}</p>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isSelected ? 'bg-rose-700 text-white' : 'border border-rose-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>

                {newCpTechIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-rose-200/60">
                    {technicians
                      .filter((t) => newCpTechIds.includes(t.id))
                      .map((t) => (
                        <span
                          key={t.id}
                          onClick={() => setNewCpTechIds(newCpTechIds.filter((id) => id !== t.id))}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-200/80 text-rose-900 text-[10px] font-bold cursor-pointer hover:bg-slate-200 transition"
                          title="Click to remove"
                        >
                          <span>{t.name}</span>
                          <span>✕</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-rose-700">
                    Ek ya multiple technicians ko select karein. Complaint create hote hi unko assign ho jayegi.
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateComplaintModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md active:scale-98 transition"
                >
                  Save &amp; Dispatch Tech
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL SCHEDULE SITE VISIT / SURVEY                */}
      {/* ========================================================= */}
      {isCreateSiteVisitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Send className="w-4 h-4 text-purple-600" />
                <span>Schedule Site Visit &amp; EPC Survey</span>
              </h3>
              <button
                onClick={() => setIsCreateSiteVisitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSiteVisitSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Customer / Client Name *</label>
                  <input
                    type="text"
                    required
                    value={newSvCustomerName}
                    onChange={(e) => setNewSvCustomerName(e.target.value)}
                    placeholder="e.g. Malik Shahbaz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newSvPhone}
                    onChange={(e) => setNewSvPhone(e.target.value)}
                    placeholder="03017778899"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                  <select
                    value={newSvCity}
                    onChange={(e) => setNewSvCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">System Size (kW)</label>
                  <input
                    type="number"
                    value={newSvSystemSizeKw}
                    onChange={(e) => setNewSvSystemSizeKw(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Site Location / Address</label>
                <input
                  type="text"
                  value={newSvAddress}
                  onChange={(e) => setNewSvAddress(e.target.value)}
                  placeholder="Plot 45, Industrial Estate, Bhakkar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Property Type</label>
                  <select
                    value={newSvPropertyType}
                    onChange={(e) => setNewSvPropertyType(e.target.value as PropertyType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="agricultural">Agricultural / Tube-well</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">System Type</label>
                  <select
                    value={newSvSystemType}
                    onChange={(e) => setNewSvSystemType(e.target.value as SystemType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  >
                    <option value="hybrid">Hybrid</option>
                    <option value="on_grid">On-Grid</option>
                    <option value="off_grid">Off-Grid</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={newSvDate}
                    onChange={(e) => setNewSvDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Technician Assignment (Multi-Technician Selection Allowed) */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-purple-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-700" />
                    <span>Assign Surveyors / Crew ({newSvTechIds.length} Selected)</span>
                  </label>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNewSvTechIds(technicians.map((t) => t.id))}
                      className="text-purple-800 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span className="text-purple-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSvTechIds([])}
                      className="text-slate-500 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {technicians.map((t) => {
                    const isSelected = newSvTechIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewSvTechIds(newSvTechIds.filter((id) => id !== t.id));
                          } else {
                            setNewSvTechIds([...newSvTechIds, t.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                          isSelected
                            ? 'bg-purple-100/90 border-purple-500 text-purple-950 font-bold shadow-xs'
                            : 'bg-white border-purple-200/80 text-slate-700 hover:border-purple-300'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <p className="truncate text-[11px]">👨‍🔧 {t.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{t.city} · {t.phone}</p>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isSelected ? 'bg-purple-700 text-white' : 'border border-purple-300 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>

                {newSvTechIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-purple-200/60">
                    {technicians
                      .filter((t) => newSvTechIds.includes(t.id))
                      .map((t) => (
                        <span
                          key={t.id}
                          onClick={() => setNewSvTechIds(newSvTechIds.filter((id) => id !== t.id))}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-200/80 text-purple-900 text-[10px] font-bold cursor-pointer hover:bg-slate-200 transition"
                          title="Click to remove"
                        >
                          <span>{t.name}</span>
                          <span>✕</span>
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-purple-700">
                    Ek ya multiple technicians ko select karein. Survey schedule hote hi unko assign ho jayega.
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSiteVisitModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md active:scale-98 transition"
                >
                  Schedule &amp; Assign Visit
                </button>
              </div>
            </form>
          </div>
        </div>
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

            {/* Technicians Multi-Assignment */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Assign Technicians ({newSiteTechs.length} Selected)</span>
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNewSiteTechs(technicians.map((t) => t.name))}
                    className="text-emerald-800 hover:underline font-bold"
                  >
                    Select All
                  </button>
                  <span className="text-emerald-300">|</span>
                  <button
                    type="button"
                    onClick={() => setNewSiteTechs([])}
                    className="text-slate-500 hover:underline font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {technicians.map((t) => {
                  const isSelected = newSiteTechs.includes(t.name);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setNewSiteTechs(newSiteTechs.filter((name) => name !== t.name));
                        } else {
                          setNewSiteTechs([...newSiteTechs, t.name]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                        isSelected
                          ? 'bg-emerald-100/90 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-emerald-200/80 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <p className="truncate text-[11px]">👨‍🔧 {t.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{t.city} · {t.phone}</p>
                      </div>
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          isSelected ? 'bg-emerald-700 text-white' : 'border border-emerald-300 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>

              {newSiteTechs.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-emerald-200/60">
                  {newSiteTechs.map((tn) => (
                    <span
                      key={tn}
                      onClick={() => setNewSiteTechs(newSiteTechs.filter((x) => x !== tn))}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-200/80 text-emerald-900 text-[10px] font-bold cursor-pointer hover:bg-rose-100 hover:text-rose-800 transition"
                      title="Click to remove"
                    >
                      <span>{tn}</span>
                      <span>✕</span>
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
                <span>Technician Login Credentials</span>
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
                Technician account has been created. Note credentials or share via WhatsApp.
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
                <span>Copy Credentials</span>
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

      {/* ========================================================= */}
      {/* CLOUD DATABASE MIGRATION & DATA TRANSFER MODAL            */}
      {/* ========================================================= */}
      <NeonDbMigrationModal
        isOpen={isNeonDbModalOpen}
        onClose={() => setIsNeonDbModalOpen(false)}
        onDataImported={() => {
          triggerSaveToast('Central database records synchronized successfully!');
        }}
      />

      {/* ========================================================= */}
      {/* CONFIRM DELETE MODAL (MOVE TO TRASH / PERMANENT DELETE)   */}
      {/* ========================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  deleteConfirmTarget.isPermanent
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {deleteConfirmTarget.isPermanent ? 'Delete Permanently?' : 'Move to Trash?'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {deleteConfirmTarget.isPermanent
                    ? 'Permanent erase · ناقابلِ واپسی'
                    : 'Recycle Bin Safety · ٹریش میں محفوظ'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                Item: {deleteConfirmTarget.itemType.toUpperCase()}
              </span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{deleteConfirmTarget.title}</h4>
              {deleteConfirmTarget.subtitle && (
                <p className="text-[11px] text-slate-600 font-mono">{deleteConfirmTarget.subtitle}</p>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {deleteConfirmTarget.isPermanent
                ? 'Kya aap waqai is item ko permanently delete karna chahte hain? Is ke baad ye item hamesha ke liye khatam ho jayega aur restore nahi ho sakega.'
                : 'Kya aap waqai is record ko delete karna chahte hain? Ye item Admin Trash (Recycle Bin) mein mehfooz rahega jahan se aap ise kisi bhi waqt Restore kar sakte hain.'}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel / منسوخ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition ${
                  deleteConfirmTarget.isPermanent
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {deleteConfirmTarget.isPermanent ? 'Delete Forever' : 'Yes, Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONFIRM EMPTY ENTIRE TRASH MODAL                          */}
      {/* ========================================================= */}
      {isEmptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 border border-rose-100">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  Empty Entire Trash?
                </h3>
                <p className="text-[11px] text-rose-600 font-bold mt-0.5">
                  Permanent Action · تمام ٹریش صاف کریں
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kya aap waqai recycle bin ke tamam items ({trashItems.length}) ko permanent delete karna chahte hain? Is ke baad koi bhi deleted record restore nahi ho sakega.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEmptyTrashConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleEmptyTrash();
                  setIsEmptyTrashConfirmOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition"
              >
                Empty Trash Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Watermark */}
      <div className="w-full text-center py-4 px-4 text-[9px] font-extrabold tracking-widest uppercase text-slate-400 select-none">
        Design and Developed by Yousuf Enterprises
      </div>
    </div>
  );
};
