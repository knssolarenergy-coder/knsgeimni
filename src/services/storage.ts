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

const KEYS = {
  BOOKINGS: 'ks_solar_bookings_v2',
  QUOTES: 'ks_solar_quotes_v2',
  COMPLAINTS: 'ks_solar_complaints_v2',
  INSTALLATIONS: 'ks_solar_installations_v2',
  SETTINGS: 'ks_solar_settings_v2',
  USER: 'ks_solar_user_v2',
  TECHNICIANS: 'ks_solar_technicians_v2',
  ACCOUNTS: 'ks_solar_accounts_v2',
  SESSION: 'ks_solar_active_session_v2',
  REFERRALS: 'ks_solar_referrals_v2',
  PAYOUTS: 'ks_solar_payouts_v2',
  WORKING_SITES: 'ks_solar_working_sites_v2',
  ATTENDANCE: 'ks_solar_attendance_v2',
  WARRANTIES: 'ks_solar_warranties_v2',
};

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

export const StorageService = {
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

    // Also automatically create the technician's login account in Auth Accounts
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
    return newBooking;
  },

  updateBookingStatus(id: string, status: BookingStatus): Booking[] {
    const current = this.getBookings();
    const updated = current.map((b) => (b.id === id ? { ...b, status } : b));
    safeSet(KEYS.BOOKINGS, updated);
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
    return newQuote;
  },

  updateQuoteStatus(id: string, status: QuoteStatus): QuoteRequest[] {
    const current = this.getQuotes();
    const updated = current.map((q) => (q.id === id ? { ...q, status } : q));
    safeSet(KEYS.QUOTES, updated);
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
    return updated;
  },

  updateQuoteNotes(quoteId: string, notes: string): QuoteRequest[] {
    const current = this.getQuotes();
    const updated = current.map((q) => (q.id === quoteId ? { ...q, technicianNotes: notes } : q));
    safeSet(KEYS.QUOTES, updated);
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
    return newComplaint;
  },

  updateComplaintStatus(id: string, status: ComplaintStatus): Complaint[] {
    const current = this.getComplaints();
    const updated = current.map((c) => (c.id === id ? { ...c, status } : c));
    safeSet(KEYS.COMPLAINTS, updated);
    return updated;
  },

  assignComplaintTechnician(complaintId: string, technicianId: string, technicianName: string, notes?: string): Complaint[] {
    return this.assignComplaintTechnicians(complaintId, [technicianId], [technicianName], notes);
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
    return updated;
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
    return updated;
  },

  // Site Installations (New Solar Setup)
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
        titleUrdu: 'سائٹ اور شیڈو سروے',
        description: 'Drone 3D shadow analysis, roof load bearing test, and civil anchors verified.',
        status: 'pending',
      },
      {
        id: 'm2',
        title: 'Custom Galvanized Structure Mounting',
        titleUrdu: 'گیلوینائزڈ سٹرکچر کی تنصیب',
        description: 'Erection of heavy gauge C-channel customized elevated structure.',
        status: 'pending',
      },
      {
        id: 'm3',
        title: 'Solar Panels Clamping & DC Stringing',
        titleUrdu: 'سولر پینلز کلکپنگ اور سٹرنگ وائرنگ',
        description: 'Mounting Tier-1 N-Type Bifacial panels with 6mm solar DC cabling.',
        status: 'pending',
      },
      {
        id: 'm4',
        title: 'Inverter, Battery ESS & AC/DC DB Setup',
        titleUrdu: 'انورٹر اور ڈسٹری بیوشن باکس وائرنگ',
        description: 'Schneider breakers, Class 1 SPDs, and automatic transfer switch.',
        status: 'pending',
      },
      {
        id: 'm5',
        title: 'Copper Earth Pit & Surge Testing (<5 Ohm)',
        titleUrdu: 'ارتھنگ بور اور ٹیسٹنگ',
        description: 'Dual chemical earth pits for AC & DC lightning arrestor with earth tester verification.',
        status: 'pending',
      },
      {
        id: 'm6',
        title: 'DisCo Net-Metering Commissioning',
        titleUrdu: 'گرین میٹر اور سسٹم چالو کرنا',
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
    return newInstallation;
  },

  updateInstallationStatus(
    id: string,
    status: SiteInstallation['status'],
    progressPercent?: number
  ): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === id) {
        return {
          ...inst,
          status,
          progressPercent: progressPercent !== undefined ? progressPercent : inst.progressPercent,
        };
      }
      return inst;
    });
    safeSet(KEYS.INSTALLATIONS, updated);
    return updated;
  },

  assignInstallationTechnicians(
    id: string,
    technicianIds: string[],
    technicianNames: string[],
    notes?: string
  ): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === id) {
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
    return updated;
  },

  updateInstallationMilestone(
    installationId: string,
    milestoneId: string,
    milestoneStatus: 'pending' | 'in_progress' | 'completed',
    remarks?: string
  ): SiteInstallation[] {
    const current = this.getSiteInstallations();
    const updated = current.map((inst) => {
      if (inst.id === installationId) {
        const newMilestones = inst.milestones.map((m) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              status: milestoneStatus,
              completedAt: milestoneStatus === 'completed' ? new Date().toISOString() : m.completedAt,
              technicianRemarks: remarks !== undefined ? remarks : m.technicianRemarks,
            };
          }
          return m;
        });

        // Compute updated progress percentage based on completed milestones
        const completedCount = newMilestones.filter((m) => m.status === 'completed').length;
        const inProgressCount = newMilestones.filter((m) => m.status === 'in_progress').length;
        const total = newMilestones.length || 1;
        const calculatedPercent = Math.min(
          100,
          Math.round(((completedCount + inProgressCount * 0.4) / total) * 100)
        );

        let overallStatus: SiteInstallation['status'] = inst.status;
        if (completedCount === total) {
          overallStatus = 'completed';
        } else if (completedCount >= 3) {
          overallStatus = 'wiring_commissioning';
        } else if (completedCount >= 1) {
          overallStatus = 'structure_mounting';
        }

        return {
          ...inst,
          milestones: newMilestones,
          progressPercent: calculatedPercent,
          status: overallStatus,
        };
      }
      return inst;
    });
    safeSet(KEYS.INSTALLATIONS, updated);
    return updated;
  },

  // App Settings
  getSettings(): AppSettings {
    return safeGet<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): AppSettings {
    safeSet(KEYS.SETTINGS, settings);
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
  },

  getSessionUser(): UserProfile | null {
    const session = safeGet<UserProfile | null>(KEYS.SESSION, null);
    if (session) return session;
    // Default to initial customer session if not set, or null
    return safeGet<UserProfile>(KEYS.USER, INITIAL_USER);
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
      return (emailMatch || userMatch || phoneMatch) && a.password === cleanPass;
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

    // Calculate referral stats for this user
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
      referralEarningsPkr: Math.max(totalEarned, matched.id === 'usr-default' ? 1500 : 0),
      referralWithdrawnPkr: Math.max(totalWithdrawn, matched.id === 'usr-default' ? 500 : 0),
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
      approvalStatus: 'pending', // Awaiting Admin Approval
      createdAt: new Date().toISOString(),
      referralCode: generatedReferralCode,
      referredBy: cleanRefCode || undefined,
    };

    const updatedAccounts = [...accounts, created];
    this.saveAccounts(updatedAccounts);

    let bonusAwarded = false;
    const settings = this.getSettings();

    // Check if referral program is active and referee entered a valid code
    if (cleanRefCode && settings.referral_program_enabled) {
      const referrer = updatedAccounts.find(
        (a) => a.referralCode && a.referralCode.toUpperCase() === cleanRefCode
      );

      const rewardAmount = settings.referral_reward_amount_pkr || 500;

      const newReferralRecord: ReferralRecord = {
        id: `ref-${Date.now()}`,
        referrerUserId: referrer ? referrer.id : 'usr-default',
        referrerName: referrer ? referrer.name : 'K&S Ambassador',
        referrerPhone: referrer ? referrer.phone : '0300-9876543',
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

    // Do NOT set session user because customer must be approved by admin first!
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

    // If approved, also activate any pending referral records for this referee
    if (status === 'approved') {
      const referrals = this.getReferrals();
      const updatedRefs = referrals.map((r) =>
        r.refereeUserId === accountId ? { ...r, status: 'rewarded' as const } : r
      );
      safeSet(KEYS.REFERRALS, updatedRefs);
    }
    return updated;
  },

  deleteAccount(accountId: string): AuthAccount[] {
    const current = this.getAccounts();
    const updated = current.filter((a) => a.id !== accountId);
    this.saveAccounts(updated);
    return updated;
  },

  resetAccountPassword(accountId: string, newPassword: string): boolean {
    const current = this.getAccounts();
    const updated = current.map((a) => (a.id === accountId ? { ...a, password: newPassword } : a));
    this.saveAccounts(updated);
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

  // Referral System & Cash Rewards Management
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

    // Update active user's withdrawn amount
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
    return newSite;
  },

  updateWorkingSiteStatus(id: string, status: WorkingSite['status']): WorkingSite[] {
    const current = this.getWorkingSites();
    const updated = current.map((s) => (s.id === id ? { ...s, status } : s));
    this.saveWorkingSites(updated);
    return updated;
  },

  // Attendance Records
  getAttendanceRecords(): AttendanceRecord[] {
    return safeGet<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },

  saveAttendanceRecords(records: AttendanceRecord[]): void {
    safeSet(KEYS.ATTENDANCE, records);
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
    return newRecord;
  },

  logout(): void {
    safeSet(KEYS.SESSION, null);
  },

  /**
   * Silently tracks technician device GPS in background
   * Updates Admin live map without showing any UI, alerts, or banners to the technician.
   */
  startSilentTechnicianTracking(technicianId: string): () => void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return () => {};
    }

    let watchId: number | null = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 22;

          // Update tracking service silently
          try {
            const trackingKey = 'ks_solar_tech_tracking_v1';
            const raw = localStorage.getItem(trackingKey);
            if (raw) {
              const all = JSON.parse(raw);
              if (all[technicianId]) {
                all[technicianId].lat = lat;
                all[technicianId].lng = lng;
                all[technicianId].speedKmh = speedKmh;
                all[technicianId].lastPing = new Date().toISOString();
                all[technicianId].status = speedKmh > 3 ? 'moving' : 'at_customer';
                localStorage.setItem(trackingKey, JSON.stringify(all));
              }
            }
          } catch {
            // silent ignore
          }
        },
        () => {
          // Silent ignore error so technician experiences zero interruption
        },
        {
          enableHighAccuracy: true,
          maximumAge: 15000,
          timeout: 25000,
        }
      );
    } catch {
      // silent
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  },

  // ================= Customer Warranties Management =================
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
    return newWarranty;
  },

  updateWarranty(id: string, updates: Partial<CustomerWarranty>): CustomerWarranty[] {
    const current = this.getWarranties();
    const updated = current.map((w) => (w.id === id ? { ...w, ...updates } : w));
    safeSet(KEYS.WARRANTIES, updated);
    return updated;
  },

  deleteWarranty(id: string): CustomerWarranty[] {
    const current = this.getWarranties();
    const updated = current.filter((w) => w.id !== id);
    safeSet(KEYS.WARRANTIES, updated);
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
};
