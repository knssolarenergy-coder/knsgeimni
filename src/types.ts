export type PanelType = 'monocrystalline' | 'polycrystalline' | 'bifacial';

export type PreferredTime = 'morning' | 'afternoon' | 'evening';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type TechJobProgress = 'assigned' | 'en_route' | 'working' | 'completed';

export interface Booking {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  panelCount: number;
  panelType: PanelType;
  preferredDate: string;
  preferredTime: PreferredTime;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  estimatedPrice: number;
  // Technician Assignment (Single & Multiple Crew support)
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianIds?: string[];
  assignedTechnicianNames?: string[];
  techJobProgress?: TechJobProgress;
  technicianNotes?: string;
  completedAt?: string;
}

export interface InverterBrand {
  id: string;
  name: string;
  portalUrl: string;
  tagline: string;
  statusText: string;
  features: string[];
}

export type ComplaintSubject =
  | 'inverter_offline'
  | 'low_generation'
  | 'washing_issue'
  | 'wiring_leakage'
  | 'other';

export type ComplaintStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved';

export interface Complaint {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  address?: string;
  systemCategory?: string;
  subject: ComplaintSubject;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  // Technician Assignment (Single & Multiple Crew support)
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianIds?: string[];
  assignedTechnicianNames?: string[];
  technicianNotes?: string;
  resolvedAt?: string;
}

export type PropertyType = 'residential' | 'commercial' | 'industrial';
export type SystemType = 'on_grid' | 'hybrid' | 'off_grid' | 'daytime' | 'tubewell' | 'commercial_scale';
export type QuoteStatus = 'pending' | 'reviewed' | 'quoted' | 'closed';

export interface QuoteRequest {
  id: string;
  customerName: string;
  phone: string;
  city: string;
  address?: string;
  monthlyBill?: string;
  installationArea?: string;
  notes?: string;
  systemSizeKw: number;
  propertyType: PropertyType;
  systemType: SystemType;
  batteryBackup: boolean;
  estimatedCostPkr: number;
  estimatedMonthlySavingsPkr: number;
  status: QuoteStatus;
  createdAt: string;
  // Technician Assignment for Site Survey (Single & Multiple Crew support)
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianIds?: string[];
  assignedTechnicianNames?: string[];
  surveyDate?: string;
  technicianNotes?: string;
}

// Site Installation Project Models
export type InstallationStatus =
  | 'survey_scheduled'
  | 'design_procurement'
  | 'structure_mounting'
  | 'wiring_commissioning'
  | 'net_metering'
  | 'completed'
  | 'on_hold';

export type StructureType = 'standard_l2' | 'elevated_l3' | 'custom_shed' | 'ground_mount';

export type InstallationMilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface InstallationMilestone {
  id: string;
  title: string;
  titleUrdu: string;
  description: string;
  status: InstallationMilestoneStatus;
  completedAt?: string;
  technicianRemarks?: string;
}

export interface SiteInstallation {
  id: string; // e.g. "KSI-501"
  customerName: string;
  phone: string;
  city: string;
  address: string;
  systemSizeKw: number;
  propertyType: PropertyType;
  systemType: SystemType;
  structureType: StructureType;
  inverterBrand: string;
  netMeteringRequired: boolean;
  discoName?: string; // e.g. LESCO, K-Electric, IESCO
  status: InstallationStatus;
  progressPercent: number; // 0 to 100
  createdAt: string;
  targetDate?: string;
  estimatedBudgetPkr: number;
  // Multiple Technicians Crew Assignment
  assignedTechnicianIds: string[];
  assignedTechnicianNames: string[];
  milestones: InstallationMilestone[];
  notes?: string;
}

export type TechnicianSpecialty =
  | 'Solar Panel Wash Specialist'
  | 'Inverter & Electrical Specialist'
  | 'Solar System Rooftop Engineer'
  | 'General Solar Technician';

export type TechnicianStatus = 'available' | 'on_duty' | 'off_duty';

export interface RouteBreadcrumb {
  id: string;
  lat: number;
  lng: number;
  label: string;
  address: string;
  time: string;
  type: 'origin' | 'stop' | 'current' | 'destination';
  status?: string;
}

export type TechTrackingStatus = 'moving' | 'at_customer' | 'idle' | 'offline';

export interface TechnicianLiveLocation {
  technicianId: string;
  technicianName: string;
  phone: string;
  city: string;
  lat: number;
  lng: number;
  address: string;
  speedKmh: number;
  heading: number;
  batteryLevel: number;
  status: TechTrackingStatus;
  vehicle: 'bike' | 'van';
  currentJobId?: string;
  currentJobType?: 'wash' | 'complaint' | 'survey';
  destinationCustomer?: string;
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  distanceRemainingKm?: number;
  etaMinutes?: number;
  lastPing: string;
  isLiveBeaconActive: boolean;
  is24hTrackingEnforced?: boolean;
  isLocationLockActive?: boolean;
  lastHeartbeat?: string;
  routeHistory: RouteBreadcrumb[];
}

export interface Technician {
  id: string;
  name: string;
  email?: string;
  username?: string;
  password?: string;
  phone: string;
  city: string;
  specialty: TechnicianSpecialty;
  status: TechnicianStatus;
  activeJobsCount: number;
  completedJobsCount: number;
  rating: number;
  joinedDate: string;
}

export interface WorkingSite {
  id: string;
  name: string;
  clientName: string;
  phone: string;
  city: string;
  address: string;
  assignedTechnicianNames: string[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  technicianId: string;
  technicianName: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  status: 'present' | 'absent' | 'late';
  date: string;
}

export interface AppSettings {
  whatsapp_booking: string;
  whatsapp_complaint: string;
  whatsapp_installation: string;
  whatsapp_support: string;
  ai_support_chat_enabled?: boolean;
  ai_support_phone?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  website_url?: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  contact_hours: string;
  // Referral System
  referral_system_enabled?: boolean;
  referral_points_per_referral?: number;
  referral_pkr_per_point?: number;
  timezone_offset_hours?: number;
  app_version?: string;
  admin_password?: string;
  // 24/7 Technician Live Tracking Policy
  enforce_24h_tech_tracking: boolean;
  tech_tracking_ping_interval_sec: number;
  // Referral & Cash Prize Program
  referral_program_enabled: boolean;
  referral_reward_amount_pkr: number;
  referral_reward_trigger: 'on_registration' | 'on_first_service';
  referral_terms?: string;
}

export type UserRole = 'customer' | 'technician' | 'admin';

export type AccountApprovalStatus = 'approved' | 'pending' | 'rejected' | 'suspended';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isAdmin: boolean;
  city: string;
  activeTechnicianId?: string;
  technicianSpecialty?: string;
  // Referral & Cash Prize
  referralCode?: string;
  referredBy?: string;
  referralEarningsPkr?: number;
  referralWithdrawnPkr?: number;
  points?: number;
  approved?: boolean;
  approvalStatus?: AccountApprovalStatus;
  registeredAt?: string;
  inverterBrand?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountTitle?: string;
}

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  username?: string;
  password: string;
  phone: string;
  city: string;
  role: UserRole;
  technicianId?: string;
  referralCode?: string;
  referredBy?: string;
  approvalStatus?: AccountApprovalStatus;
  createdAt?: string;
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referrerName: string;
  referrerPhone: string;
  referrerCode: string;
  refereeUserId: string;
  refereeName: string;
  refereePhone: string;
  refereeCity?: string;
  rewardAmountPkr: number;
  triggerEvent: 'on_registration' | 'on_first_service';
  status: 'rewarded' | 'pending';
  createdAt: string;
}

export type ReferralPayoutStatus = 'pending' | 'paid' | 'rejected';

export interface ReferralPayoutRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amountPkr: number;
  paymentMethod: 'easypaisa' | 'jazzcash' | 'bank';
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  status: ReferralPayoutStatus;
  requestedAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export type WarrantyStatus = 'active' | 'expiring_soon' | 'expired' | 'claimed';
export type WarrantyCategory =
  | 'solar_panel'
  | 'inverter'
  | 'battery'
  | 'complete_system'
  | 'structure'
  | 'other';

export interface CustomerWarranty {
  id: string; // e.g. "KS-WRN-101"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  city?: string;
  invoiceNumber: string; // e.g. "KSI-2024-8841"
  productName: string; // e.g. "Longi Hi-MO 6 585W Bifacial Solar Panels"
  productCategory: WarrantyCategory;
  brand: string; // e.g. "Longi", "Growatt", "Huawei", "Solis", "Livoltek"
  serialNumber: string; // e.g. "SN-LG-89420-B"
  systemSizeKw?: number;
  purchaseDate: string; // YYYY-MM-DD
  warrantyDurationYears: number; // e.g. 25, 10, 5, 2
  expiryDate: string; // YYYY-MM-DD
  coverageType: string; // e.g. "25-Year Performance & 12-Year Product Guarantee"
  status: WarrantyStatus;
  authorizedDealer: string; // e.g. "K&S Solar Energy (Pvt) Ltd"
  technicianNotes?: string;
  createdAt: string;
}
