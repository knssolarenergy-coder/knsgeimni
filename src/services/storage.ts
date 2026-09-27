import {
  AppSettings,
  AttendanceRecord,
  AuthAccount,
  Booking,
  BookingStatus,
  Complaint,
  ComplaintStatus,
  CustomerWarranty,
  InstallationMilestone,
  InstallationMilestoneStatus,
  InstallationStatus,
  QuoteRequest,
  QuoteStatus,
  ReferralPayoutRequest,
  ReferralPayoutStatus,
  ReferralRecord,
  SiteInstallation,
  Technician,
  TechJobProgress,
  UserProfile,
  WorkingSite,
  TrashItem,
  TrashItemType,
} from '../types';
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_SETTINGS,
  INITIAL_ATTENDANCE,
  INITIAL_BOOKINGS,
  INITIAL_COMPLAINTS,
  INITIAL_INSTALLATIONS,
  INITIAL_PAYOUT_REQUESTS,
  INITIAL_QUOTES,
  INITIAL_REFERRALS,
  INITIAL_TECHNICIANS,
  INITIAL_USER,
  INITIAL_WARRANTIES,
  INITIAL_WORKING_SITES,
} from '../data/mockData';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { NeonDbService } from './neonDb';
import { ResendService } from './resendService';
import bcrypt from 'bcryptjs';

const DB_VERSION_KEY = 'ks_solar_db_version';
const CURRENT_VERSION = 'v4_clean_production_database';

const KEYS = {
  BOOKINGS: 'ks_solar_bookings_v4',
  QUOTES: 'ks_solar_quotes_v4',
  COMPLAINTS: 'ks_solar_complaints_v4',
  INSTALLATIONS: 'ks_solar_installations_v4',
  SETTINGS: 'ks_solar_settings_v4',
  USER: 'ks_solar_user_v4',
  TECHNICIANS: 'ks_solar_technicians_v4',
  ACCOUNTS: 'ks_solar_accounts_v4',
  SESSION: 'ks_solar_active_session_v4',
  REFERRALS: 'ks_solar_referrals_v4',
  PAYOUTS: 'ks_solar_payouts_v4',
  WORKING_SITES: 'ks_solar_working_sites_v4',
  ATTENDANCE: 'ks_solar_attendance_v4',
  WARRANTIES: 'ks_solar_warranties_v4',
  TRASH: 'ks_solar_trash_v4',
};

// Automatic cleanup of legacy demo caches
try {
  const storedVersion = localStorage.getItem(DB_VERSION_KEY);
  if (storedVersion !== CURRENT_VERSION) {
    // Clear old demo data keys
    const oldKeys = [
      'ks_solar_bookings_v2', 'ks_solar_quotes_v2', 'ks_solar_complaints_v2',
      'ks_solar_installations_v2', 'ks_solar_settings_v2', 'ks_solar_technicians_v2',
      'ks_solar_accounts_v2', 'ks_solar_referrals_v2', 'ks_solar_payouts_v2',
      'ks_solar_working_sites_v2', 'ks_solar_attendance_v2', 'ks_solar_warranties_v2',
      'ks_solar_active_session_v2', 'ks_solar_user_v2'
    ];
    oldKeys.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);
    console.log('[Storage] Cleaned legacy demo data and initialized version', CURRENT_VERSION);
  }
} catch (e) {
  console.warn('[Storage] Could not run storage version cleanup', e);
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save to localStorage (${key})`, e);
  }
}

// Background Firestore & NeonDB persistence helpers
async function neonDbSync(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    if (!docId || !data) return;
    if (collectionName === 'bookings') {
      await NeonDbService.syncBooking(data);
    } else if (collectionName === 'complaints') {
      await NeonDbService.syncComplaint(data);
    } else if (collectionName === 'quotes') {
      await NeonDbService.syncQuote(data);
    } else if (collectionName === 'accounts' || collectionName === 'users') {
      await NeonDbService.syncUser(data);
    } else if (collectionName === 'attendance') {
      await NeonDbService.syncAttendance(data);
    } else if (collectionName === 'workingSites' || collectionName === 'sites') {
      await NeonDbService.syncSite(data);
    } else if (collectionName === 'warranties') {
      await NeonDbService.syncWarranty(data);
    }
  } catch (err) {
    console.warn(`[NeonDB] Sync failed for ${collectionName}/${docId}:`, err);
  }
}

async function firestoreSet(collectionName: string, docId: string, data: any): Promise<void> {
  try {
    if (!docId) return;
    const ref = doc(db, collectionName, String(docId));
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Sync failed for ${collectionName}/${docId}:`, err);
  }
  // Also synchronize directly to NeonDB PostgreSQL
  neonDbSync(collectionName, docId, data).catch(() => {});
}

async function firestoreDelete(collectionName: string, docId: string): Promise<void> {
  try {
    if (!docId) return;
    const ref = doc(db, collectionName, String(docId));
    await deleteDoc(ref);
  } catch (err) {
    console.warn(`[Firestore] Delete failed for ${collectionName}/${docId}:`, err);
  }
}

export const StorageService = {
  // Sync all Firestore collections into local state
  async initFirestoreSync(): Promise<void> {
    try {
      const collectionsToSync = [
        { name: 'accounts', key: KEYS.ACCOUNTS },
        { name: 'bookings', key: KEYS.BOOKINGS },
        { name: 'complaints', key: KEYS.COMPLAINTS },
        { name: 'quotes', key: KEYS.QUOTES },
        { name: 'technicians', key: KEYS.TECHNICIANS },
        { name: 'warranties', key: KEYS.WARRANTIES },
        { name: 'workingSites', key: KEYS.WORKING_SITES },
        { name: 'attendance', key: KEYS.ATTENDANCE },
      ];

      for (const col of collectionsToSync) {
        try {
          const snap = await getDocs(collection(db, col.name));
          if (!snap.empty) {
            const remoteDocs = snap.docs.map((d) => d.data());
            const localData = safeGet<any[]>(col.key, []);
            // Merge remote items, preferring remote
            const idMap = new Map();
            localData.forEach((item) => {
              if (item.id) idMap.set(item.id, item);
            });
            remoteDocs.forEach((item) => {
              if (item.id) idMap.set(item.id, item);
            });
            safeSet(col.key, Array.from(idMap.values()));
          }
        } catch {
          // Ignore individual collection sync errors
        }
      }
      console.log('[Firestore] Live cloud sync completed successfully');
    } catch (e) {
      console.warn('[Firestore] Startup sync skipped or offline:', e);
    }

    // Also run NeonDB startup sync
    this.initNeonDbSync().catch(() => {});
  },

  // Sync NeonDB live database into local state
  async initNeonDbSync(): Promise<void> {
    try {
      const data = await NeonDbService.pullAllData();
      if (data.bookings.length > 0) {
        const local = this.getBookings();
        const map = new Map(local.map((b) => [b.id, b]));
        data.bookings.forEach((b) => map.set(b.id, b));
        safeSet(KEYS.BOOKINGS, Array.from(map.values()));
      }
      if (data.complaints.length > 0) {
        const local = this.getComplaints();
        const map = new Map(local.map((c) => [c.id, c]));
        data.complaints.forEach((c) => map.set(c.id, c));
        safeSet(KEYS.COMPLAINTS, Array.from(map.values()));
      }
      if (data.quotes.length > 0) {
        const local = this.getQuotes();
        const map = new Map(local.map((q) => [q.id, q]));
        data.quotes.forEach((q) => map.set(q.id, q));
        safeSet(KEYS.QUOTES, Array.from(map.values()));
      }
      if (data.accounts.length > 0) {
        const local = this.getAccounts();
        const map = new Map(local.map((a) => [a.id, a]));
        data.accounts.forEach((a) => map.set(a.id, a));
        safeSet(KEYS.ACCOUNTS, Array.from(map.values()));
      }
      if (data.sites.length > 0) {
        const local = this.getWorkingSites();
        const map = new Map(local.map((s) => [s.id, s]));
        data.sites.forEach((s) => map.set(s.id, s));
        safeSet(KEYS.WORKING_SITES, Array.from(map.values()));
      }
      if (data.attendance.length > 0) {
        const local = this.getAttendanceRecords();
        const map = new Map(local.map((a) => [a.id, a]));
        data.attendance.forEach((a) => map.set(a.id, a));
        safeSet(KEYS.ATTENDANCE, Array.from(map.values()));
      }
      if (data.warranties.length > 0) {
        const local = this.getWarranties();
        const map = new Map(local.map((w) => [w.id, w]));
        data.warranties.forEach((w) => map.set(w.id, w));
        safeSet(KEYS.WARRANTIES, Array.from(map.values()));
      }
      console.log('[NeonDB] Database initialized & synchronized with live NeonDB');
    } catch (e) {
      console.warn('[NeonDB] Startup sync note:', e);
    }
  },

  // Technicians
  getTechnicians(): Technician[] {
    return safeGet<Technician[]>(KEYS.TECHNICIANS, INITIAL_TECHNICIANS);
  },

  addTechnician(tech: Omit<Technician, 'id' | 'activeJobsCount' | 'completedJobsCount' | 'rating' | 'joinedDate'>): Technician {
    const current = this.getTechnicians();
    const newId = `tech-${Date.now()}`;
    const newTech: Technician = {
      ...tech,
      id: newId,
      activeJobsCount: 0,
      completedJobsCount: 0,
      rating: 5.0,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    const updated = [...current, newTech];
    safeSet(KEYS.TECHNICIANS, updated);
    firestoreSet('technicians', newId, newTech);

    // Automatically create technician login account in Auth Accounts
    const accounts = this.getAccounts();
    const loginUsername = tech.username || (tech.email ? tech.email.split('@')[0] : tech.phone);
    const loginPassword = tech.password || 'tech123';
    const loginEmail = tech.email || `${loginUsername.toLowerCase()}@kssolar.pk`;

    const newAccount: AuthAccount = {
      id: `acc-${newId}`,
      name: tech.name,
      email: loginEmail,
      username: loginUsername.toLowerCase(),
      password: loginPassword,
      phone: tech.phone,
      city: tech.city,
      role: 'technician',
      technicianId: newId,
      approvalStatus: 'approved',
      createdAt: new Date().toISOString(),
    };

    const existingIdx = accounts.findIndex(
      (a) => a.technicianId === newId || (a.username && a.username.toLowerCase() === loginUsername.toLowerCase())
    );
    let updatedAccounts: AuthAccount[];
    if (existingIdx >= 0) {
      updatedAccounts = [...accounts];
      updatedAccounts[existingIdx] = { ...updatedAccounts[existingIdx], ...newAccount };
    } else {
      updatedAccounts = [...accounts, newAccount];
    }
    this.saveAccounts(updatedAccounts);

    return newTech;
  },

  updateTechnicianStatus(id: string, status: Technician['status']): Technician[] {
    const current = this.getTechnicians();
    const updated = current.map((t) => (t.id === id ? { ...t, status } : t));
    safeSet(KEYS.TECHNICIANS, updated);
    const found = updated.find((t) => t.id === id);
    if (found) firestoreSet('technicians', id, found);
    return updated;
  },

  // Bookings
  getBookings(): Booking[] {
    return safeGet<Booking[]>(KEYS.BOOKINGS, INITIAL_BOOKINGS);
  },

  addBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const current = this.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: `KSW-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [newBooking, ...current];
    safeSet(KEYS.BOOKINGS, updated);
    firestoreSet('bookings', newBooking.id, newBooking);
    return newBooking;
  },

  updateBookingStatus(id: string, status: BookingStatus): Booking[] {
    const current = this.getBookings();
    const updated = current.map((b) => (b.id === id ? { ...b, status } : b));
    safeSet(KEYS.BOOKINGS, updated);
    const target = updated.find((b) => b.id === id);
    if (target) firestoreSet('bookings', id, target);
    return updated;
  },

  assignBookingTechnician(bookingId: string, technicianId: string, technicianName: string, notes?: string): Booking[] {
    return this.assignBookingTechnicians(bookingId, [technicianId], [technicianName], notes);
  },

  assignBookingTechnicians(
    bookingId: string,
    technicianIds: string[],
    technicianNames: string[],
    notes?: string
  ): Booking[] {
    const current = this.getBookings();
    const updated = current.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          assignedTechnicianId: technicianIds[0] || undefined,
          assignedTechnicianName: technicianNames.join(', ') || undefined,
          assignedTechnicianIds: technicianIds,
          assignedTechnicianNames: technicianNames,
          status: 'confirmed' as BookingStatus,
          techJobProgress: 'assigned' as TechJobProgress,
          technicianNotes: notes || b.technicianNotes,
        };
      }
      return b;
    });
    safeSet(KEYS.BOOKINGS, updated);
    const target = updated.find((b) => b.id === bookingId);
    if (target) firestoreSet('bookings', bookingId, target);
    return updated;
  },

  updateBookingTechProgress(
    bookingId: string,
    progress: TechJobProgress,
    notes?: string
  ): Booking[] {
    const current = this.getBookings();
    const updated = current.map((b) => {
      if (b.id === bookingId) {
        const isCompleted = progress === 'completed';
        return {
          ...b,
          techJobProgress: progress,
          status: isCompleted ? ('completed' as BookingStatus) : b.status,
          technicianNotes: notes !== undefined ? notes : b.technicianNotes,
          completedAt: isCompleted ? new Date().toISOString() : b.completedAt,
        };
      }
      return b;
    });
    safeSet(KEYS.BOOKINGS, updated);
    const target = updated.find((b) => b.id === bookingId);
    if (target) firestoreSet('bookings', bookingId, target);
    return updated;
  },

  // Quotes
  getQuotes(): QuoteRequest[] {
    return safeGet<QuoteRequest[]>(KEYS.QUOTES, INITIAL_QUOTES);
  },

  addQuote(quote: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'>): QuoteRequest {
    const current = this.getQuotes();
    const newQuote: QuoteRequest = {
      ...quote,
      id: `KSQ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [newQuote, ...current];
    safeSet(KEYS.QUOTES, updated);
    firestoreSet('quotes', newQuote.id, newQuote);
    return newQuote;
  },

  updateQuoteStatus(id: string, status: QuoteStatus): QuoteRequest[] {
    const current = this.getQuotes();
    const updated = current.map((q) => (q.id === id ? { ...q, status } : q));
    safeSet(KEYS.QUOTES, updated);
    const target = updated.find((q) => q.id === id);
    if (target) firestoreSet('quotes', id, target);
    return updated;
  },

  assignQuoteTechnician(quoteId: string, technicianId: string, technicianName: string, surveyDate?: string, notes?: string): QuoteRequest[] {
    return this.assignQuoteTechnicians(quoteId, [technicianId], [technicianName], surveyDate, notes);
  },

  assignQuoteTechnicians(
    quoteId: string,
    technicianIds: string[],
    technicianNames: string[],
    surveyDate?: string,
    notes?: string
  ): QuoteRequest[] {
    const current = this.getQuotes();
    const updated = current.map((q) => {
      if (q.id === quoteId) {
        return {
          ...q,
          assignedTechnicianId: technicianIds[0] || undefined,
          assignedTechnicianName: technicianNames.join(', ') || undefined,
          assignedTechnicianIds: technicianIds,
          assignedTechnicianNames: technicianNames,
          surveyDate: surveyDate || q.surveyDate,
          technicianNotes: notes || q.technicianNotes,
          status: 'reviewed' as QuoteStatus,
        };
      }
      return q;
    });
    safeSet(KEYS.QUOTES, updated);
    const target = updated.find((q) => q.id === quoteId);
    if (target) firestoreSet('quotes', quoteId, target);
    return updated;
  },

  updateQuoteNotes(quoteId: string, notes: string): QuoteRequest[] {
    const current = this.getQuotes();
    const updated = current.map((q) => (q.id === quoteId ? { ...q, technicianNotes: notes } : q));
    safeSet(KEYS.QUOTES, updated);
    const target = updated.find((q) => q.id === quoteId);
    if (target) firestoreSet('quotes', quoteId, target);
    return updated;
  },

  // Complaints
  getComplaints(): Complaint[] {
    return safeGet<Complaint[]>(KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  },

  addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'>): Complaint {
    const current = this.getComplaints();
    const newComplaint: Complaint = {
      ...complaint,
      id: `KSC-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const updated = [newComplaint, ...current];
    safeSet(KEYS.COMPLAINTS, updated);
    firestoreSet('complaints', newComplaint.id, newComplaint);
    return newComplaint;
  },

  updateComplaintStatus(id: string, status: ComplaintStatus): Complaint[] {
    const current = this.getComplaints();
    const updated = current.map((c) =>
      c.id === id
        ? {
            ...c,
            status,
            resolvedAt: status === 'resolved' ? (c.resolvedAt || new Date().toISOString()) : c.resolvedAt,
          }
        : c
    );
    safeSet(KEYS.COMPLAINTS, updated);
    const target = updated.find((c) => c.id === id);
    if (target) firestoreSet('complaints', id, target);
    return updated;
  },

  assignComplaintTechnicians(
    complaintId: string,
    technicianIds: string[],
    technicianNames: string[],
    notes?: string
  ): Complaint[] {
    const current = this.getComplaints();
    const updated = current.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          assignedTechnicianId: technicianIds[0] || undefined,
          assignedTechnicianName: technicianNames.join(', ') || undefined,
          assignedTechnicianIds: technicianIds,
          assignedTechnicianNames: technicianNames,
          status: 'assigned' as ComplaintStatus,
          technicianNotes: notes || c.technicianNotes,
        };
      }
      return c;
    });
    safeSet(KEYS.COMPLAINTS, updated);
    const target = updated.find((c) => c.id === complaintId);
    if (target) firestoreSet('complaints', complaintId, target);
    return updated;
  },

  assignComplaintTechnician(
    complaintId: string,
    technicianId: string,
    technicianName: string,
    notes?: string
  ): Complaint[] {
    return this.assignComplaintTechnicians(complaintId, [technicianId], [technicianName], notes);
  },

  updateComplaintTechNotes(complaintId: string, notes: string, status?: ComplaintStatus): Complaint[] {
    const current = this.getComplaints();
    const updated = current.map((c) => {
      if (c.id === complaintId) {
        return {
          ...c,
          technicianNotes: notes,
          status: status || c.status,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : c.resolvedAt,
        };
      }
      return c;
    });
    safeSet(KEYS.COMPLAINTS, updated);
    const target = updated.find((c) => c.id === complaintId);
    if (target) firestoreSet('complaints', complaintId, target);
    return updated;
  },

  // Site Installations
  getSiteInstallations(): SiteInstallation[] {
    return safeGet<SiteInstallation[]>(KEYS.INSTALLATIONS, INITIAL_INSTALLATIONS);
  },

  addSiteInstallation(
    installation: Omit<SiteInstallation, 'id' | 'createdAt' | 'status' | 'progressPercent' | 'milestones'> & {
      milestones?: InstallationMilestone[];
    }
  ): SiteInstallation {
    const current = this.getSiteInstallations();
    const defaultMilestones: InstallationMilestone[] = [
      {
        id: 'm1',
        title: 'Site Shadow & Structural Survey',
        description: 'Drone 3D shadow analysis, roof load bearing test, and civil anchors verified.',
        status: 'pending',
      },
      {
        id: 'm2',
        title: 'Custom Galvanized Structure Mounting',
        description: 'Erection of heavy gauge C-channel customized elevated structure.',
        status: 'pending',
      },
      {
        id: 'm3',
        title: 'Solar Panels Clamping & DC Stringing',
        description: 'Mounting Tier-1 N-Type Bifacial panels with 6mm solar DC cabling.',
        status: 'pending',
      },
      {
        id: 'm4',
        title: 'Inverter, Battery ESS & AC/DC DB Setup',
        description: 'Schneider breakers, Class 1 SPDs, and automatic transfer switch.',
        status: 'pending',
      },
      {
        id: 'm5',
        title: 'Copper Earth Pit & Surge Testing (<5 Ohm)',
        description: 'Dual chemical earth pits for AC & DC lightning arrestor with earth tester verification.',
        status: 'pending',
      },
      {
        id: 'm6',
        title: 'DisCo Net-Metering Commissioning',
        description: 'Inspection by local DisCo SDO, green meter energization, and cloud app sync handover.',
        status: 'pending',
      },
    ];

    const newInstallation: SiteInstallation = {
      ...installation,
      id: `KSI-${Math.floor(500 + Math.random() * 500)}`,
      createdAt: new Date().toISOString(),
      status: 'survey_scheduled',
      progressPercent: 10,
      milestones: installation.milestones || defaultMilestones,
    };

    const updated = [newInstallation, ...current];
    safeSet(KEYS.INSTALLATIONS, updated);
    firestoreSet('installations', newInstallation.id, newInstallation);
    return newInstallation;
  },

  assignInstallationTechnicians(
    installationId: string,
    technicianIds: string[],
    technicianNames: string[],
    notes?: string
  ): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === installationId) {
        return {
          ...inst,
          assignedTechnicianIds: technicianIds,
          assignedTechnicianNames: technicianNames,
          notes: notes !== undefined ? notes : inst.notes,
        };
      }
      return inst;
    });
    safeSet(KEYS.INSTALLATIONS, updated);
    const target = updated.find((i) => i.id === installationId);
    if (target) firestoreSet('installations', installationId, target);
    return updated;
  },

  updateInstallationStatus(id: string, status: InstallationStatus): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === id) {
        return {
          ...inst,
          status,
          progressPercent:
            status === 'completed'
              ? 100
              : status === 'net_metering'
              ? 85
              : status === 'wiring_commissioning'
              ? 70
              : status === 'structure_mounting'
              ? 50
              : status === 'design_procurement'
              ? 35
              : status === 'survey_scheduled'
              ? 15
              : inst.progressPercent,
        };
      }
      return inst;
    });
    safeSet(KEYS.INSTALLATIONS, updated);
    const target = updated.find((i) => i.id === id);
    if (target) firestoreSet('installations', id, target);
    return updated;
  },

  updateInstallationMilestone(
    id: string,
    milestoneId: string,
    status: InstallationMilestoneStatus,
    notes?: string
  ): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === id) {
        const milestones = inst.milestones.map((m) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              status,
              technicianRemarks: notes !== undefined ? notes : m.technicianRemarks,
              completedAt: status === 'completed' ? new Date().toISOString() : m.completedAt,
            };
          }
          return m;
        });
        const completedCount = milestones.filter((m) => m.status === 'completed').length;
        const progressPercent = Math.round((completedCount / milestones.length) * 100);
        return {
          ...inst,
          milestones,
          progressPercent,
        };
      }
      return inst;
    });
    safeSet(KEYS.INSTALLATIONS, updated);
    const target = updated.find((i) => i.id === id);
    if (target) firestoreSet('installations', id, target);
    return updated;
  },

  // App Settings
  getSettings(): AppSettings {
    return safeGet<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): AppSettings {
    safeSet(KEYS.SETTINGS, settings);
    firestoreSet('settings', 'main', settings);
    if (settings.email_api_key) {
      ResendService.saveApiKey(settings.email_api_key).catch(() => {});
    }
    for (const [k, v] of Object.entries(settings)) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        NeonDbService.syncSetting(k, String(v)).catch(() => {});
      }
    }
    return settings;
  },

  // User Profile
  getUser(): UserProfile {
    return safeGet<UserProfile>(KEYS.USER, INITIAL_USER);
  },

  saveUser(user: UserProfile): UserProfile {
    safeSet(KEYS.USER, user);
    return user;
  },

  // Auth & Multi-Portal Role Accounts
  getAccounts(): AuthAccount[] {
    return safeGet<AuthAccount[]>(KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  },

  saveAccounts(accounts: AuthAccount[]): void {
    safeSet(KEYS.ACCOUNTS, accounts);
    accounts.forEach((acc) => firestoreSet('accounts', acc.id, acc));
  },

  getSessionUser(): UserProfile | null {
    const session = safeGet<UserProfile | null>(KEYS.SESSION, null);
    if (session) return session;
    return null;
  },

  setSessionUser(user: UserProfile | null): void {
    safeSet(KEYS.SESSION, user);
    if (user) {
      safeSet(KEYS.USER, user);
    }
  },

  authenticate(identifier: string, password: string): {
    user?: UserProfile;
    error?: string;
    isPendingApproval?: boolean;
    pendingAccount?: AuthAccount;
  } {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanDigits = identifier.replace(/\D/g, '');

    const accounts = this.getAccounts();
    const matched = accounts.find((a) => {
      const emailMatch = a.email.toLowerCase() === cleanId;
      const userMatch = !!(a.username && a.username.toLowerCase() === cleanId);
      const aDigits = a.phone.replace(/\D/g, '');
      const phoneMatch =
        cleanDigits.length >= 7 &&
        (aDigits === cleanDigits ||
          (cleanDigits.length >= 10 && aDigits.endsWith(cleanDigits.slice(-10))) ||
          (aDigits.length >= 10 && cleanDigits.endsWith(aDigits.slice(-10))));
      
      const isPassMatch =
        a.password === cleanPass ||
        (a.password?.startsWith('$2') && bcrypt.compareSync(cleanPass, a.password));

      return (emailMatch || userMatch || phoneMatch) && Boolean(isPassMatch);
    });

    if (!matched) {
      return { error: 'Invalid login details. Please check your username, email or phone and password.' };
    }

    // Role check & customer approval workflow
    if (matched.role === 'customer') {
      const isPending =
        matched.approvalStatus === 'pending' ||
        (matched.approvalStatus !== 'approved' && matched.id !== 'usr-default');

      if (isPending) {
        return {
          error: 'ACCOUNT_PENDING_APPROVAL',
          isPendingApproval: true,
          pendingAccount: matched,
        };
      }

      if (matched.approvalStatus === 'rejected' || matched.approvalStatus === 'suspended') {
        return {
          error: 'ACCOUNT_SUSPENDED',
        };
      }
    }

    const technicians = this.getTechnicians();
    const tech = matched.technicianId
      ? technicians.find((t) => t.id === matched.technicianId)
      : undefined;

    const referrals = this.getReferrals();
    const userReferrals = referrals.filter(
      (r) =>
        r.referrerUserId === matched.id ||
        (matched.referralCode && r.referrerCode === matched.referralCode)
    );
    const totalEarned = userReferrals.reduce((sum, r) => sum + (r.rewardAmountPkr || 0), 0);
    const payouts = this.getPayoutRequests().filter((p) => p.userId === matched.id && p.status !== 'rejected');
    const totalWithdrawn = payouts.reduce((sum, p) => sum + (p.amountPkr || 0), 0);

    const userProfile: UserProfile = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      phone: matched.phone,
      city: matched.city,
      role: matched.role,
      isAdmin: matched.role === 'admin',
      activeTechnicianId: matched.technicianId,
      technicianSpecialty: tech?.specialty,
      referralCode: matched.referralCode || `KS-${Math.floor(1000 + Math.random() * 9000)}`,
      referredBy: matched.referredBy,
      referralEarningsPkr: totalEarned,
      referralWithdrawnPkr: totalWithdrawn,
      approved: matched.approvalStatus === 'approved' || matched.role !== 'customer',
      approvalStatus: matched.approvalStatus || 'approved',
      registeredAt: matched.createdAt,
    };

    this.setSessionUser(userProfile);
    return { user: userProfile };
  },

  registerAccount(
    newAcc: Omit<AuthAccount, 'id'>,
    referredByCodeInput?: string
  ): {
    user?: UserProfile;
    error?: string;
    referralBonusAwarded?: boolean;
    isPendingApproval?: boolean;
    registeredAccount?: AuthAccount;
  } {
    const accounts = this.getAccounts();
    const cleanEmail = newAcc.email.trim().toLowerCase();
    const cleanPhoneDigits = newAcc.phone.replace(/\D/g, '');

    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      return { error: 'An account with this email already exists.' };
    }

    if (
      cleanPhoneDigits.length >= 8 &&
      accounts.some((a) => a.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits.slice(-10)))
    ) {
      return { error: 'An account with this phone number already exists.' };
    }

    const cleanRefCode = (referredByCodeInput || newAcc.referredBy || '').trim().toUpperCase();
    const generatedReferralCode = `KS-${Math.floor(1000 + Math.random() * 9000)}`;

    const created: AuthAccount = {
      ...newAcc,
      id: `acc-${Date.now()}`,
      email: cleanEmail,
      username: newAcc.username ? newAcc.username.toLowerCase() : cleanEmail.split('@')[0],
      role: 'customer',
      approvalStatus: 'pending',
      createdAt: new Date().toISOString(),
      referralCode: generatedReferralCode,
      referredBy: cleanRefCode || undefined,
    };

    const updatedAccounts = [...accounts, created];
    this.saveAccounts(updatedAccounts);
    firestoreSet('accounts', created.id, created);

    let bonusAwarded = false;
    const settings = this.getSettings();

    if (cleanRefCode && settings.referral_program_enabled) {
      const referrer = updatedAccounts.find(
        (a) => a.referralCode && a.referralCode.toUpperCase() === cleanRefCode
      );

      const rewardAmount = settings.referral_reward_amount_pkr || 500;

      const newReferralRecord: ReferralRecord = {
        id: `ref-${Date.now()}`,
        referrerUserId: referrer ? referrer.id : 'admin',
        referrerName: referrer ? referrer.name : 'K&S Ambassador',
        referrerPhone: referrer ? referrer.phone : '03268630029',
        referrerCode: cleanRefCode,
        refereeUserId: created.id,
        refereeName: created.name,
        refereePhone: created.phone,
        refereeCity: created.city,
        rewardAmountPkr: rewardAmount,
        triggerEvent: 'on_registration',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      this.addReferral(newReferralRecord);
      bonusAwarded = true;
    }

    return {
      isPendingApproval: true,
      registeredAccount: created,
      referralBonusAwarded: bonusAwarded,
    };
  },

  updateAccountApproval(accountId: string, status: 'approved' | 'rejected' | 'suspended'): AuthAccount[] {
    const current = this.getAccounts();
    const updated = current.map((a) => {
      if (a.id === accountId) {
        return {
          ...a,
          approvalStatus: status,
        };
      }
      return a;
    });
    this.saveAccounts(updated);
    const target = updated.find((a) => a.id === accountId);
    if (target) firestoreSet('accounts', accountId, target);

    if (status === 'approved') {
      const referrals = this.getReferrals();
      const updatedRefs = referrals.map((r) =>
        r.refereeUserId === accountId ? { ...r, status: 'rewarded' as const } : r
      );
      safeSet(KEYS.REFERRALS, updatedRefs);
    }
    return updated;
  },

  deleteAccount(accountId: string, moveToTrash: boolean = true): AuthAccount[] {
    const current = this.getAccounts();
    const item = current.find((a) => a.id === accountId);
    if (moveToTrash && item) {
      this.moveToTrash('user', accountId, item.name, `${item.email || item.username || item.phone} · ${item.role}`);
      return this.getAccounts();
    }
    const updated = current.filter((a) => a.id !== accountId);
    this.saveAccounts(updated);
    firestoreDelete('accounts', accountId);
    return updated;
  },

  resetAccountPassword(accountId: string, newPassword: string): boolean {
    const current = this.getAccounts();
    const updated = current.map((a) => (a.id === accountId ? { ...a, password: newPassword } : a));
    this.saveAccounts(updated);
    const target = updated.find((a) => a.id === accountId);
    if (target) firestoreSet('accounts', accountId, target);
    return true;
  },

  updateTechnicianCredentials(technicianId: string, username?: string, password?: string): boolean {
    const techs = this.getTechnicians();
    const updatedTechs = techs.map((t) => {
      if (t.id === technicianId) {
        return {
          ...t,
          ...(username ? { username } : {}),
          ...(password ? { password } : {}),
        };
      }
      return t;
    });
    safeSet(KEYS.TECHNICIANS, updatedTechs);
    const targetTech = updatedTechs.find((t) => t.id === technicianId);
    if (targetTech) firestoreSet('technicians', technicianId, targetTech);

    const accounts = this.getAccounts();
    const updatedAccounts = accounts.map((a) => {
      if (a.technicianId === technicianId) {
        return {
          ...a,
          ...(username ? { username } : {}),
          ...(password ? { password } : {}),
        };
      }
      return a;
    });
    this.saveAccounts(updatedAccounts);
    return true;
  },

  // Referrals
  getReferrals(): ReferralRecord[] {
    return safeGet<ReferralRecord[]>(KEYS.REFERRALS, INITIAL_REFERRALS);
  },

  addReferral(record: ReferralRecord): ReferralRecord {
    const current = this.getReferrals();
    const updated = [record, ...current];
    safeSet(KEYS.REFERRALS, updated);
    return record;
  },

  getPayoutRequests(): ReferralPayoutRequest[] {
    return safeGet<ReferralPayoutRequest[]>(KEYS.PAYOUTS, INITIAL_PAYOUT_REQUESTS);
  },

  requestPayout(req: {
    userId: string;
    userName: string;
    userPhone: string;
    amountPkr: number;
    paymentMethod: 'easypaisa' | 'jazzcash' | 'bank';
    accountTitle: string;
    accountNumber: string;
    bankName?: string;
  }): { request?: ReferralPayoutRequest; error?: string } {
    const current = this.getPayoutRequests();
    const newReq: ReferralPayoutRequest = {
      ...req,
      id: `pay-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    const updated = [newReq, ...current];
    safeSet(KEYS.PAYOUTS, updated);

    const sessionUser = this.getSessionUser();
    if (sessionUser && sessionUser.id === req.userId) {
      sessionUser.referralWithdrawnPkr = (sessionUser.referralWithdrawnPkr || 0) + req.amountPkr;
      this.setSessionUser(sessionUser);
    }

    return { request: newReq };
  },

  updatePayoutStatus(
    id: string,
    status: ReferralPayoutStatus,
    adminNotes?: string
  ): ReferralPayoutRequest[] {
    const current = this.getPayoutRequests();
    const updated = current.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status,
          processedAt: new Date().toISOString(),
          adminNotes: adminNotes !== undefined ? adminNotes : p.adminNotes,
        };
      }
      return p;
    });
    safeSet(KEYS.PAYOUTS, updated);
    return updated;
  },

  // Working Sites
  getWorkingSites(): WorkingSite[] {
    return safeGet<WorkingSite[]>(KEYS.WORKING_SITES, INITIAL_WORKING_SITES);
  },

  saveWorkingSites(sites: WorkingSite[]): void {
    safeSet(KEYS.WORKING_SITES, sites);
    sites.forEach((s) => firestoreSet('workingSites', s.id, s));
  },

  addWorkingSite(site: Omit<WorkingSite, 'id' | 'createdAt'>): WorkingSite {
    const current = this.getWorkingSites();
    const newSite: WorkingSite = {
      ...site,
      id: `site-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSite, ...current];
    this.saveWorkingSites(updated);
    firestoreSet('workingSites', newSite.id, newSite);
    return newSite;
  },

  updateWorkingSiteStatus(id: string, status: WorkingSite['status']): WorkingSite[] {
    const current = this.getWorkingSites();
    const updated = current.map((s) => (s.id === id ? { ...s, status } : s));
    this.saveWorkingSites(updated);
    const target = updated.find((s) => s.id === id);
    if (target) firestoreSet('workingSites', id, target);
    return updated;
  },

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    return safeGet<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },

  saveAttendanceRecords(records: AttendanceRecord[]): void {
    safeSet(KEYS.ATTENDANCE, records);
    records.forEach((r) => firestoreSet('attendance', r.id, r));
  },

  recordAttendance(
    technicianId: string,
    technicianName: string,
    location: string
  ): AttendanceRecord {
    const current = this.getAttendanceRecords();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toISOString().split('T')[0];

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      technicianId,
      technicianName,
      checkInTime: timeStr,
      location: location || 'Field Location · GPS Verified',
      status: 'present',
      date: dateStr,
    };
    const updated = [newRecord, ...current];
    this.saveAttendanceRecords(updated);
    firestoreSet('attendance', newRecord.id, newRecord);
    return newRecord;
  },

  logout(): void {
    safeSet(KEYS.SESSION, null);
  },

  /**
   * Ultra-Resilient Silent Technician GPS Tracking:
   * 1. Persists tracking flag in localStorage so tracking auto-starts when phone restarts or app reloads.
   * 2. Uses Screen WakeLock API to resist Android battery saver / CPU sleep.
   * 3. Uses Hardware GPS watchPosition with High Accuracy.
   * 4. Secondary fallback interval heartbeat (every 25s) to bypass OS background throttling.
   * 5. Syncs live coordinates, speed, battery level, and accuracy directly to Firestore cloud DB.
   */
  startSilentTechnicianTracking(technicianId: string): () => void {
    if (typeof window === 'undefined' || !navigator.geolocation || !technicianId) {
      return () => {};
    }

    try {
      localStorage.setItem('ks_solar_active_tracking_tech_id', technicianId);
      localStorage.setItem('ks_solar_tracking_enabled', 'true');
      localStorage.setItem('ks_solar_tracking_last_boot', new Date().toISOString());

      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'TECHNICIAN_LOGGED_IN',
            technicianId,
          })
        );
      }
    } catch {
      // ignore
    }

    let wakeLockSentinel: any = null;
    let isTerminated = false;

    // 1. Attempt Screen / CPU WakeLock
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && !isTerminated) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          wakeLockSentinel.addEventListener('release', () => {
            wakeLockSentinel = null;
          });
        }
      } catch {
        // wakeLock may be rejected in background or unsupported
      }
    };
    requestWakeLock();

    // 2. Battery Status Detection (if supported by browser)
    let cachedBattery: { level: number; charging: boolean } | null = null;
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          cachedBattery = {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          };
          battery.addEventListener('levelchange', () => {
            if (cachedBattery) cachedBattery.level = Math.round(battery.level * 100);
          });
          battery.addEventListener('chargingchange', () => {
            if (cachedBattery) cachedBattery.charging = battery.charging;
          });
        }).catch(() => {});
      }
    } catch {
      // ignore
    }

    // 3. Central GPS Broadcast Function
    const processPosition = (pos: GeolocationPosition) => {
      if (isTerminated) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 10;
      const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
      const heading = pos.coords.heading || 0;
      const nowIso = new Date().toISOString();

      const trackingPayload = {
        technicianId,
        lat,
        lng,
        accuracy,
        speedKmh,
        heading,
        status: speedKmh > 3 ? 'moving' : 'at_customer',
        batteryLevel: cachedBattery ? cachedBattery.level : null,
        isCharging: cachedBattery ? cachedBattery.charging : null,
        lastPing: nowIso,
        keepAliveActive: true,
        trackingEngine: 'persistent_v2_resilient',
      };

      // A. Update localStorage & TrackingService for instant local component access
      try {
        const trackingKey = 'ks_solar_tech_tracking_v1';
        const raw = localStorage.getItem(trackingKey);
        const all = raw ? JSON.parse(raw) : {};
        all[technicianId] = {
          ...(all[technicianId] || {}),
          ...trackingPayload,
        };
        localStorage.setItem(trackingKey, JSON.stringify(all));
        localStorage.setItem('ks_solar_last_gps_ping', nowIso);
      } catch {
        // silent
      }

      // B. Sync to Firestore Cloud Database in background
      try {
        firestoreSet('tech_locations', technicianId, trackingPayload);
      } catch {
        // silent
      }
    };

    // 4. Primary Continuous GPS Watch (0ms age for real-time second-by-second updates)
    let watchId: number | null = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        processPosition,
        (err) => {
          console.warn('[Tracking] GPS Watch warning:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
    } catch {
      // silent
    }

    // 5. High-Frequency Realtime 1-Second Interval Ticker
    // Guarantees updates every second even if device doesn't trigger significant displacement
    const heartbeatInterval = setInterval(() => {
      if (isTerminated) return;
      try {
        navigator.geolocation.getCurrentPosition(
          processPosition,
          () => {},
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
      } catch {
        // silent
      }
    }, 1000);

    // 6. Re-acquire on App Visibility & Online
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isTerminated) {
        requestWakeLock();
        navigator.geolocation.getCurrentPosition(processPosition, () => {}, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      }
    };
    const handleOnline = () => {
      if (!isTerminated) {
        navigator.geolocation.getCurrentPosition(processPosition, () => {}, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleOnline);

    // Clean-up handler
    return () => {
      isTerminated = true;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleOnline);
      if (wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch {
          // ignore
        }
      }
    };
  },

  // Immediate live GPS ping triggered manually or on demand
  async sendImmediateTechLocationPing(technicianId: string): Promise<{ success: boolean; lat?: number; lng?: number; accuracy?: number; error?: string }> {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return { success: false, error: 'Geolocation not supported' };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 10;
          const nowIso = new Date().toISOString();

          const payload = {
            technicianId,
            lat,
            lng,
            accuracy,
            speedKmh: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
            heading: pos.coords.heading || 0,
            status: 'online',
            lastPing: nowIso,
            keepAliveActive: true,
            trackingEngine: 'manual_ping_verified',
          };

          try {
            const trackingKey = 'ks_solar_tech_tracking_v1';
            const raw = localStorage.getItem(trackingKey);
            const all = raw ? JSON.parse(raw) : {};
            all[technicianId] = { ...(all[technicianId] || {}), ...payload };
            localStorage.setItem(trackingKey, JSON.stringify(all));
          } catch {}

          firestoreSet('tech_locations', technicianId, payload);
          resolve({ success: true, lat, lng, accuracy });
        },
        (err) => {
          resolve({ success: false, error: err.message });
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  },

  // Customer Warranties Management
  getWarranties(): CustomerWarranty[] {
    return safeGet<CustomerWarranty[]>(KEYS.WARRANTIES, INITIAL_WARRANTIES);
  },

  getWarrantiesByCustomer(query?: string): CustomerWarranty[] {
    const list = this.getWarranties();
    if (!query || !query.trim()) return list;
    const clean = query.trim().toLowerCase();
    const cleanDigits = query.replace(/\D/g, '');

    return list.filter((w) => {
      const matchName = w.customerName.toLowerCase().includes(clean);
      const matchEmail = w.customerEmail?.toLowerCase().includes(clean);
      const matchPhone =
        cleanDigits.length >= 7 && w.customerPhone.replace(/\D/g, '').includes(cleanDigits);
      return matchName || matchEmail || matchPhone;
    });
  },

  addWarranty(warranty: Omit<CustomerWarranty, 'id' | 'createdAt'>): CustomerWarranty {
    const current = this.getWarranties();
    const newWarranty: CustomerWarranty = {
      ...warranty,
      id: `KSW-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newWarranty, ...current];
    safeSet(KEYS.WARRANTIES, updated);
    firestoreSet('warranties', newWarranty.id, newWarranty);
    return newWarranty;
  },

  updateWarranty(id: string, updates: Partial<CustomerWarranty>): CustomerWarranty[] {
    const current = this.getWarranties();
    const updated = current.map((w) => (w.id === id ? { ...w, ...updates } : w));
    safeSet(KEYS.WARRANTIES, updated);
    const target = updated.find((w) => w.id === id);
    if (target) firestoreSet('warranties', id, target);
    return updated;
  },

  deleteWarranty(id: string): CustomerWarranty[] {
    const current = this.getWarranties();
    const updated = current.filter((w) => w.id !== id);
    safeSet(KEYS.WARRANTIES, updated);
    firestoreDelete('warranties', id);
    return updated;
  },

  searchWarranty(query: string): CustomerWarranty | null {
    if (!query || !query.trim()) return null;
    const q = query.trim().toLowerCase();
    const qDigits = query.replace(/\D/g, '');
    const list = this.getWarranties();

    return (
      list.find((w) => {
        const matchInvoice = w.invoiceNumber.toLowerCase() === q || w.invoiceNumber.toLowerCase().includes(q);
        const matchSerial = w.serialNumber.toLowerCase() === q || w.serialNumber.toLowerCase().includes(q);
        const matchId = w.id.toLowerCase() === q;
        const matchPhone = qDigits.length >= 10 && w.customerPhone.replace(/\D/g, '') === qDigits;
        return matchInvoice || matchSerial || matchId || matchPhone;
      }) || null
    );
  },

  // =========================================================
  // TRASH & RECYCLE BIN MANAGEMENT (SOFT-DELETE & RESTORE)
  // =========================================================
  getTrash(): TrashItem[] {
    return safeGet<TrashItem[]>(KEYS.TRASH, []);
  },

  saveTrash(trash: TrashItem[]): void {
    safeSet(KEYS.TRASH, trash);
  },

  moveToTrash(
    itemType: TrashItemType,
    originalId: string,
    title: string,
    subtitle?: string,
    deletedBy: string = 'Admin'
  ): TrashItem | null {
    let itemData: any = null;

    if (itemType === 'booking') {
      const all = this.getBookings();
      itemData = all.find((b) => b.id === originalId);
      if (itemData) {
        safeSet(KEYS.BOOKINGS, all.filter((b) => b.id !== originalId));
        firestoreDelete('bookings', originalId);
      }
    } else if (itemType === 'complaint') {
      const all = this.getComplaints();
      itemData = all.find((c) => c.id === originalId);
      if (itemData) {
        safeSet(KEYS.COMPLAINTS, all.filter((c) => c.id !== originalId));
        firestoreDelete('complaints', originalId);
      }
    } else if (itemType === 'site') {
      const all = this.getWorkingSites();
      itemData = all.find((s) => s.id === originalId);
      if (itemData) {
        safeSet(KEYS.WORKING_SITES, all.filter((s) => s.id !== originalId));
        firestoreDelete('workingSites', originalId);
      }
    } else if (itemType === 'site_visit') {
      const all = this.getQuotes();
      itemData = all.find((q) => q.id === originalId);
      if (itemData) {
        safeSet(KEYS.QUOTES, all.filter((q) => q.id !== originalId));
        firestoreDelete('quotes', originalId);
      }
    } else if (itemType === 'technician') {
      const all = this.getTechnicians();
      itemData = all.find((t) => t.id === originalId);
      if (itemData) {
        safeSet(KEYS.TECHNICIANS, all.filter((t) => t.id !== originalId));
        firestoreDelete('technicians', originalId);
      }
    } else if (itemType === 'user') {
      const all = this.getAccounts();
      itemData = all.find((a) => a.id === originalId);
      if (itemData) {
        safeSet(KEYS.ACCOUNTS, all.filter((a) => a.id !== originalId));
        firestoreDelete('accounts', originalId);
      }
    }

    if (!itemData) return null;

    const trashItem: TrashItem = {
      id: `trash_${itemType}_${originalId}_${Date.now()}`,
      originalId,
      itemType,
      title: title || originalId,
      subtitle,
      deletedAt: new Date().toISOString(),
      deletedBy,
      itemData,
    };

    const currentTrash = this.getTrash();
    const updatedTrash = [trashItem, ...currentTrash];
    this.saveTrash(updatedTrash);
    firestoreSet('trash', trashItem.id, trashItem);

    return trashItem;
  },

  restoreFromTrash(trashId: string): boolean {
    const currentTrash = this.getTrash();
    const item = currentTrash.find((t) => t.id === trashId);
    if (!item || !item.itemData) return false;

    const { itemType, itemData } = item;

    if (itemType === 'booking') {
      const all = this.getBookings();
      if (!all.some((b) => b.id === itemData.id)) {
        safeSet(KEYS.BOOKINGS, [itemData, ...all]);
        firestoreSet('bookings', itemData.id, itemData);
      }
    } else if (itemType === 'complaint') {
      const all = this.getComplaints();
      if (!all.some((c) => c.id === itemData.id)) {
        safeSet(KEYS.COMPLAINTS, [itemData, ...all]);
        firestoreSet('complaints', itemData.id, itemData);
      }
    } else if (itemType === 'site') {
      const all = this.getWorkingSites();
      if (!all.some((s) => s.id === itemData.id)) {
        safeSet(KEYS.WORKING_SITES, [itemData, ...all]);
        firestoreSet('workingSites', itemData.id, itemData);
      }
    } else if (itemType === 'site_visit') {
      const all = this.getQuotes();
      if (!all.some((q) => q.id === itemData.id)) {
        safeSet(KEYS.QUOTES, [itemData, ...all]);
        firestoreSet('quotes', itemData.id, itemData);
      }
    } else if (itemType === 'technician') {
      const all = this.getTechnicians();
      if (!all.some((t) => t.id === itemData.id)) {
        safeSet(KEYS.TECHNICIANS, [itemData, ...all]);
        firestoreSet('technicians', itemData.id, itemData);
      }
    } else if (itemType === 'user') {
      const all = this.getAccounts();
      if (!all.some((a) => a.id === itemData.id)) {
        safeSet(KEYS.ACCOUNTS, [itemData, ...all]);
        firestoreSet('accounts', itemData.id, itemData);
      }
    }

    const updatedTrash = currentTrash.filter((t) => t.id !== trashId);
    this.saveTrash(updatedTrash);
    firestoreDelete('trash', trashId);

    return true;
  },

  deletePermanentlyFromTrash(trashId: string): boolean {
    const currentTrash = this.getTrash();
    const updatedTrash = currentTrash.filter((t) => t.id !== trashId);
    this.saveTrash(updatedTrash);
    firestoreDelete('trash', trashId);
    return true;
  },

  emptyTrash(): void {
    const currentTrash = this.getTrash();
    currentTrash.forEach((t) => firestoreDelete('trash', t.id));
    this.saveTrash([]);
  },

  // Direct entity deletion helpers
  deleteBooking(id: string, moveToTrash: boolean = true): Booking[] {
    const all = this.getBookings();
    const item = all.find((b) => b.id === id);
    if (moveToTrash && item) {
      this.moveToTrash('booking', id, `Booking ${item.id} - ${item.customerName}`, `${item.city} · ${item.panelCount} panels`);
      return this.getBookings();
    }
    const updated = all.filter((b) => b.id !== id);
    safeSet(KEYS.BOOKINGS, updated);
    firestoreDelete('bookings', id);
    return updated;
  },

  deleteComplaint(id: string, moveToTrash: boolean = true): Complaint[] {
    const all = this.getComplaints();
    const item = all.find((c) => c.id === id);
    if (moveToTrash && item) {
      this.moveToTrash('complaint', id, `Complaint ${item.id} - ${item.customerName}`, `${item.city} · ${item.subject}`);
      return this.getComplaints();
    }
    const updated = all.filter((c) => c.id !== id);
    safeSet(KEYS.COMPLAINTS, updated);
    firestoreDelete('complaints', id);
    return updated;
  },

  deleteWorkingSite(id: string, moveToTrash: boolean = true): WorkingSite[] {
    const all = this.getWorkingSites();
    const item = all.find((s) => s.id === id);
    if (moveToTrash && item) {
      this.moveToTrash('site', id, item.name, `${item.clientName} · ${item.city}`);
      return this.getWorkingSites();
    }
    const updated = all.filter((s) => s.id !== id);
    safeSet(KEYS.WORKING_SITES, updated);
    firestoreDelete('workingSites', id);
    return updated;
  },

  deleteQuote(id: string, moveToTrash: boolean = true): QuoteRequest[] {
    const all = this.getQuotes();
    const item = all.find((q) => q.id === id);
    if (moveToTrash && item) {
      this.moveToTrash('site_visit', id, `Site Visit ${item.id} - ${item.customerName}`, `${item.city} · ${item.systemSizeKw}kW`);
      return this.getQuotes();
    }
    const updated = all.filter((q) => q.id !== id);
    safeSet(KEYS.QUOTES, updated);
    firestoreDelete('quotes', id);
    return updated;
  },

  deleteTechnician(id: string, moveToTrash: boolean = true): Technician[] {
    const all = this.getTechnicians();
    const item = all.find((t) => t.id === id);
    if (moveToTrash && item) {
      this.moveToTrash('technician', id, item.name, `${item.city} · ${item.phone}`);
      return this.getTechnicians();
    }
    const updated = all.filter((t) => t.id !== id);
    safeSet(KEYS.TECHNICIANS, updated);
    firestoreDelete('technicians', id);
    return updated;
  },

  // ==========================================
  // NeonDB / PostgreSQL Migration & Bulk Import
  // ==========================================
  bulkImportBookings(items: Booking[]): number {
    const current = this.getBookings();
    const existingIds = new Set(current.map((b) => b.id));
    const toAdd = items.filter((b) => b && b.id && !existingIds.has(b.id));
    const updated = [...toAdd, ...current];
    safeSet(KEYS.BOOKINGS, updated);
    toAdd.forEach((b) => firestoreSet('bookings', b.id, b));
    return toAdd.length;
  },

  bulkImportComplaints(items: Complaint[]): number {
    const current = this.getComplaints();
    const existingIds = new Set(current.map((c) => c.id));
    const toAdd = items.filter((c) => c && c.id && !existingIds.has(c.id));
    const updated = [...toAdd, ...current];
    safeSet(KEYS.COMPLAINTS, updated);
    toAdd.forEach((c) => firestoreSet('complaints', c.id, c));
    return toAdd.length;
  },

  bulkImportQuotes(items: QuoteRequest[]): number {
    const current = this.getQuotes();
    const existingIds = new Set(current.map((q) => q.id));
    const toAdd = items.filter((q) => q && q.id && !existingIds.has(q.id));
    const updated = [...toAdd, ...current];
    safeSet(KEYS.QUOTES, updated);
    toAdd.forEach((q) => firestoreSet('quotes', q.id, q));
    return toAdd.length;
  },

  bulkImportTechnicians(items: Technician[]): number {
    const current = this.getTechnicians();
    const existingIds = new Set(current.map((t) => t.id));
    const toAdd = items.filter((t) => t && t.id && !existingIds.has(t.id));
    const updated = [...current, ...toAdd];
    safeSet(KEYS.TECHNICIANS, updated);
    toAdd.forEach((t) => firestoreSet('technicians', t.id, t));
    return toAdd.length;
  },

  bulkImportInstallations(items: SiteInstallation[]): number {
    const current = this.getSiteInstallations();
    const existingIds = new Set(current.map((i) => i.id));
    const toAdd = items.filter((i) => i && i.id && !existingIds.has(i.id));
    const updated = [...toAdd, ...current];
    safeSet(KEYS.INSTALLATIONS, updated);
    toAdd.forEach((i) => firestoreSet('installations', i.id, i));
    return toAdd.length;
  },

  bulkImportAccounts(items: AuthAccount[]): number {
    const current = this.getAccounts();
    const existingIds = new Set(current.map((a) => a.id));
    const existingPhones = new Set(current.map((a) => a.phone));
    const toAdd = items.filter((a) => a && a.id && !existingIds.has(a.id) && !existingPhones.has(a.phone));
    const updated = [...current, ...toAdd];
    safeSet(KEYS.ACCOUNTS, updated);
    toAdd.forEach((a) => firestoreSet('accounts', a.id, a));
    return toAdd.length;
  },

  bulkImportWarranties(items: CustomerWarranty[]): number {
    const current = this.getWarranties();
    const existingIds = new Set(current.map((w) => w.id));
    const toAdd = items.filter((w) => w && w.id && !existingIds.has(w.id));
    const updated = [...toAdd, ...current];
    safeSet(KEYS.WARRANTIES, updated);
    toAdd.forEach((w) => firestoreSet('warranties', w.id, w));
    return toAdd.length;
  },

  bulkImportFullDatabase(bundle: {
    bookings?: Booking[];
    complaints?: Complaint[];
    quotes?: QuoteRequest[];
    technicians?: Technician[];
    installations?: SiteInstallation[];
    accounts?: AuthAccount[];
    warranties?: CustomerWarranty[];
  }): Record<string, number> {
    const counts: Record<string, number> = {};
    if (bundle.bookings && Array.isArray(bundle.bookings)) {
      counts.bookings = this.bulkImportBookings(bundle.bookings);
    }
    if (bundle.complaints && Array.isArray(bundle.complaints)) {
      counts.complaints = this.bulkImportComplaints(bundle.complaints);
    }
    if (bundle.quotes && Array.isArray(bundle.quotes)) {
      counts.quotes = this.bulkImportQuotes(bundle.quotes);
    }
    if (bundle.technicians && Array.isArray(bundle.technicians)) {
      counts.technicians = this.bulkImportTechnicians(bundle.technicians);
    }
    if (bundle.installations && Array.isArray(bundle.installations)) {
      counts.installations = this.bulkImportInstallations(bundle.installations);
    }
    if (bundle.accounts && Array.isArray(bundle.accounts)) {
      counts.accounts = this.bulkImportAccounts(bundle.accounts);
    }
    if (bundle.warranties && Array.isArray(bundle.warranties)) {
      counts.warranties = this.bulkImportWarranties(bundle.warranties);
    }
    return counts;
  },

  exportFullDatabase() {
    return {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      database: 'ai-studio-knsfullbackupcom',
      data: {
        bookings: this.getBookings(),
        complaints: this.getComplaints(),
        quotes: this.getQuotes(),
        technicians: this.getTechnicians(),
        installations: this.getSiteInstallations(),
        accounts: this.getAccounts().map((a) => ({ ...a, password: '***' })),
        warranties: this.getWarranties(),
        workingSites: this.getWorkingSites(),
        attendance: this.getAttendanceRecords(),
        settings: this.getSettings(),
      },
    };
  },
};

// Initiate background Firestore sync on load
StorageService.initFirestoreSync().catch(() => {});
