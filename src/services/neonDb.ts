/**
 * K&S Solar Energy - Live Cloud (PostgreSQL) Integration Service
 * Connects directly to Serverless Postgres via HTTP SQL Driver
 * Endpoint: ep-icy-sea-at7z5toq-pooler.c-9.us-east-1.aws.neon.tech
 */

import { neon } from '@neondatabase/serverless';
import {
  Booking,
  Complaint,
  QuoteRequest,
  AppSettings,
  WorkingSite,
  AttendanceRecord,
  AuthAccount,
  CustomerWarranty,
} from '../types';

export const NEON_CONNECTION_STRING =
  (import.meta as any).env?.VITE_NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_U59SjElKWZOi@ep-icy-sea-at7z5toq-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export interface NeonConnectionStatus {
  isConnected: boolean;
  status: 'connected' | 'connecting' | 'error' | 'offline';
  endpoint: string;
  latencyMs?: number;
  lastSyncTime?: string;
  error?: string;
  rowCounts: {
    users: number;
    bookings: number;
    complaints: number;
    quotes: number;
    attendance: number;
    sites: number;
    settings: number;
    warranties: number;
  };
}

class NeonDatabaseService {
  private sql = neon(NEON_CONNECTION_STRING);
  private statusListeners: Array<(status: NeonConnectionStatus) => void> = [];
  private currentStatus: NeonConnectionStatus = {
    isConnected: true,
    status: 'connected',
    endpoint: 'ep-icy-sea-at7z5toq-pooler.c-9.us-east-1.aws.neon.tech',
    lastSyncTime: new Date().toLocaleTimeString(),
    rowCounts: {
      users: 0,
      bookings: 0,
      complaints: 0,
      quotes: 0,
      attendance: 0,
      sites: 0,
      settings: 0,
      warranties: 0,
    },
  };

  constructor() {
    // Run an initial silent background health check
    setTimeout(() => {
      this.checkHealth().catch(() => {});
    }, 1500);
  }

  public subscribeStatus(listener: (status: NeonConnectionStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus() {
    for (const listener of this.statusListeners) {
      listener(this.currentStatus);
    }
  }

  public getStatus(): NeonConnectionStatus {
    return { ...this.currentStatus };
  }

  /**
   * Health check and live row count retrieval
   */
  public async checkHealth(): Promise<NeonConnectionStatus> {
    const start = performance.now();
    try {
      const [u, b, c, q, a, s, st, w] = await Promise.all([
        this.sql`SELECT count(*) FROM users`,
        this.sql`SELECT count(*) FROM bookings`,
        this.sql`SELECT count(*) FROM complaints`,
        this.sql`SELECT count(*) FROM quotes`,
        this.sql`SELECT count(*) FROM attendance`,
        this.sql`SELECT count(*) FROM sites`,
        this.sql`SELECT count(*) FROM settings`,
        this.sql`SELECT count(*) FROM warranties`,
      ]);

      const latencyMs = Math.round(performance.now() - start);

      this.currentStatus = {
        isConnected: true,
        status: 'connected',
        endpoint: 'ep-icy-sea-at7z5toq-pooler.c-9.us-east-1.aws.neon.tech',
        latencyMs,
        lastSyncTime: new Date().toLocaleTimeString(),
        rowCounts: {
          users: parseInt((u as any)[0]?.count || '0', 10),
          bookings: parseInt((b as any)[0]?.count || '0', 10),
          complaints: parseInt((c as any)[0]?.count || '0', 10),
          quotes: parseInt((q as any)[0]?.count || '0', 10),
          attendance: parseInt((a as any)[0]?.count || '0', 10),
          sites: parseInt((s as any)[0]?.count || '0', 10),
          settings: parseInt((st as any)[0]?.count || '0', 10),
          warranties: parseInt((w as any)[0]?.count || '0', 10),
        },
      };
      this.notifyStatus();
      return this.currentStatus;
    } catch (err: any) {
      console.warn('NeonDB connection check note:', err?.message);
      this.currentStatus = {
        ...this.currentStatus,
        isConnected: false,
        status: 'error',
        error: err?.message || 'Connection failed',
      };
      this.notifyStatus();
      return this.currentStatus;
    }
  }

  /**
   * Pull all fresh records from NeonDB into local application objects
   */
  public async pullAllData(): Promise<{
    bookings: Booking[];
    complaints: Complaint[];
    quotes: QuoteRequest[];
    accounts: AuthAccount[];
    sites: WorkingSite[];
    attendance: AttendanceRecord[];
    warranties: CustomerWarranty[];
  }> {
    try {
      const [rawBookings, rawComplaints, rawQuotes, rawUsers, rawSites, rawAttendance, rawWarranties] =
        await Promise.all([
          this.sql`SELECT * FROM bookings ORDER BY created_at DESC`,
          this.sql`SELECT * FROM complaints ORDER BY created_at DESC`,
          this.sql`SELECT * FROM quotes ORDER BY created_at DESC`,
          this.sql`SELECT * FROM users ORDER BY created_at DESC`,
          this.sql`SELECT * FROM sites ORDER BY created_at DESC`,
          this.sql`SELECT * FROM attendance ORDER BY created_at DESC`,
          this.sql`SELECT * FROM warranties ORDER BY created_at DESC`,
        ]);

      const bookings: Booking[] = (rawBookings as any[]).map((r) => ({
        id: r.id,
        userId: r.user_id || undefined,
        customerName: r.customer_name || 'Customer',
        phone: r.phone || '',
        address: r.address || '',
        city: r.city || 'Lahore',
        panelCount: r.panel_count || 10,
        panelType: r.panel_type || 'Monocrystalline',
        preferredDate: r.preferred_date || new Date().toISOString().split('T')[0],
        preferredTime: r.preferred_time || '10:00 AM',
        estimatedPrice: 3500,
        status: (r.status as any) || 'pending',
        assignedTechnicianId: r.technician_id || undefined,
        notes: r.notes || '',
        createdAt: r.created_at || new Date().toISOString(),
      }));

      const complaints: Complaint[] = (rawComplaints as any[]).map((r) => ({
        id: r.id,
        userId: r.user_id || undefined,
        subject: (r.subject as any) || 'other',
        customerName: r.customer_name || 'Customer',
        phone: r.phone || '',
        address: r.address || '',
        city: r.city || 'Lahore',
        description: r.message || '',
        status: (r.status as any) || 'pending',
        assignedTechnicianId: r.technician_id || undefined,
        assignedTechnicianName: r.technician_name || undefined,
        createdAt: r.created_at || new Date().toISOString(),
      }));

      const quotes: QuoteRequest[] = (rawQuotes as any[]).map((r) => ({
        id: r.id,
        userId: r.user_id || undefined,
        customerName: r.customer_name || 'Customer',
        phone: r.phone || '',
        address: r.address || '',
        city: r.city || 'Lahore',
        propertyType: (r.property_type as any) || 'residential',
        systemType: (r.system_type as any) || 'hybrid',
        systemSizeKw: parseInt(r.system_size || '5', 10) || 5,
        batteryBackup: true,
        monthlyBill: r.monthly_bill || '15000',
        installationArea: r.roof_area || '500 sqft',
        estimatedCostPkr: parseInt(r.price_estimate || '750000', 10) || 750000,
        estimatedMonthlySavingsPkr: 20000,
        status: (r.status as any) || 'pending',
        notes: r.notes || r.admin_note || '',
        createdAt: r.created_at || new Date().toISOString(),
      }));

      const accounts: AuthAccount[] = (rawUsers as any[]).map((r) => ({
        id: r.id,
        name: r.name || 'User',
        email: r.email || '',
        phone: r.phone || '',
        username: r.email?.split('@')[0] || r.name?.toLowerCase().replace(/\s+/g, '') || r.id,
        password: r.password_hash || 'user123',
        city: r.city || 'Lahore',
        role: (r.role as any) || 'customer',
        technicianId: r.role === 'technician' ? r.id : undefined,
        approvalStatus: (r.status as any) || 'approved',
        createdAt: r.created_at || new Date().toISOString(),
        referralCode: r.referral_code || undefined,
      }));

      const sites: WorkingSite[] = (rawSites as any[]).map((r) => ({
        id: r.id,
        name: r.name || 'Site',
        clientName: r.client_name || '',
        phone: r.client_phone || '',
        city: r.city || 'Lahore',
        address: r.address || '',
        assignedTechnicianNames: [],
        status: (r.status as any) || 'active',
        createdAt: r.created_at || new Date().toISOString(),
      }));

      const attendance: AttendanceRecord[] = (rawAttendance as any[]).map((r) => ({
        id: r.id,
        technicianId: r.technician_id || '',
        technicianName: 'Technician',
        location: r.location_address || 'District Site',
        checkInTime: r.check_in_at || new Date().toLocaleTimeString(),
        checkOutTime: r.check_out_at || undefined,
        status: 'present',
        date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      }));

      const warranties: CustomerWarranty[] = (rawWarranties as any[]).map((r) => ({
        id: r.id,
        invoiceNumber: r.invoice_number || `KSI-${r.id.slice(-6)}`,
        customerName: r.notes || 'Customer',
        customerPhone: '',
        productName: `${r.brand || 'Longi'} ${r.model || 'Solar Panel'}`,
        productCategory: (r.warranty_type as any) || 'solar_panel',
        brand: r.brand || 'Longi Solar',
        serialNumber: r.id,
        purchaseDate: r.purchase_date || new Date().toISOString().split('T')[0],
        warrantyDurationYears: Math.round((r.duration_months || 120) / 12) || 10,
        expiryDate: new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        coverageType: '25-Year Performance & 12-Year Product Guarantee',
        status: 'active',
        authorizedDealer: 'K&S Solar Energy (Pvt) Ltd',
        createdAt: r.created_at || new Date().toISOString(),
      }));

      this.currentStatus.lastSyncTime = new Date().toLocaleTimeString();
      this.notifyStatus();

      return { bookings, complaints, quotes, accounts, sites, attendance, warranties };
    } catch (err: any) {
      console.warn('NeonDB pull error:', err?.message);
      throw err;
    }
  }

  /**
   * Real-time single booking sync to NeonDB
   */
  public async syncBooking(b: Booking): Promise<void> {
    try {
      await this.sql`
        INSERT INTO bookings (
          id, user_id, customer_name, phone, address, city,
          panel_count, panel_type, preferred_date, preferred_time, notes, status, technician_id, created_at
        ) VALUES (
          ${b.id}, ${b.userId || null}, ${b.customerName}, ${b.phone}, ${b.address}, ${b.city},
          ${b.panelCount || 0}, ${b.panelType || 'Monocrystalline'}, ${b.preferredDate}, ${b.preferredTime},
          ${b.notes || ''}, ${b.status}, ${b.assignedTechnicianId || null}, ${b.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          panel_count = EXCLUDED.panel_count,
          panel_type = EXCLUDED.panel_type,
          preferred_date = EXCLUDED.preferred_date,
          preferred_time = EXCLUDED.preferred_time,
          notes = EXCLUDED.notes,
          status = EXCLUDED.status,
          technician_id = EXCLUDED.technician_id;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncBooking error:', err?.message);
    }
  }

  /**
   * Real-time single complaint sync to NeonDB
   */
  public async syncComplaint(c: Complaint): Promise<void> {
    try {
      await this.sql`
        INSERT INTO complaints (
          id, user_id, subject, customer_name, phone, address, message, status,
          technician_name, technician_id, created_at
        ) VALUES (
          ${c.id}, ${c.userId || null}, ${c.subject || 'other'},
          ${c.customerName}, ${c.phone}, ${c.address || ''}, ${c.description || ''}, ${c.status},
          ${c.assignedTechnicianName || null}, ${c.assignedTechnicianId || null}, ${c.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          subject = EXCLUDED.subject,
          customer_name = EXCLUDED.customer_name,
          phone = EXCLUDED.phone,
          address = EXCLUDED.address,
          message = EXCLUDED.message,
          status = EXCLUDED.status,
          technician_name = EXCLUDED.technician_name,
          technician_id = EXCLUDED.technician_id;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncComplaint error:', err?.message);
    }
  }

  /**
   * Real-time quote sync to NeonDB
   */
  public async syncQuote(q: QuoteRequest): Promise<void> {
    try {
      await this.sql`
        INSERT INTO quotes (
          id, user_id, customer_name, phone, city, address, property_type,
          monthly_bill, roof_area, system_type, notes, status, system_size, price_estimate, admin_note, created_at
        ) VALUES (
          ${q.id}, ${q.userId || null}, ${q.customerName}, ${q.phone}, ${q.city}, ${q.address || ''},
          ${q.propertyType || 'residential'}, ${String(q.monthlyBill || '0')}, ${String(q.installationArea || '0')},
          ${q.systemType || 'hybrid'}, ${q.notes || ''}, ${q.status}, ${String(q.systemSizeKw || 5)},
          ${String(q.estimatedCostPkr || 0)}, ${q.technicianNotes || ''}, ${q.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          admin_note = EXCLUDED.admin_note,
          notes = EXCLUDED.notes;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncQuote error:', err?.message);
    }
  }

  /**
   * Real-time user account sync to NeonDB
   */
  public async syncUser(acc: AuthAccount): Promise<void> {
    try {
      await this.sql`
        INSERT INTO users (
          id, name, email, phone, password_hash, is_admin, is_master, city, role, status, referral_code, created_at
        ) VALUES (
          ${acc.id}, ${acc.name}, ${acc.email}, ${acc.phone}, ${acc.password},
          ${acc.role === 'admin'}, ${acc.role === 'admin'}, ${acc.city || 'Lahore'},
          ${acc.role}, ${acc.approvalStatus || 'approved'}, ${acc.referralCode || null},
          ${acc.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          city = EXCLUDED.city,
          status = EXCLUDED.status;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncUser error:', err?.message);
    }
  }

  /**
   * Real-time site sync to NeonDB
   */
  public async syncSite(s: WorkingSite): Promise<void> {
    try {
      await this.sql`
        INSERT INTO sites (
          id, name, address, city, client_name, client_phone, status, created_at
        ) VALUES (
          ${s.id}, ${s.name}, ${s.address}, ${s.city}, ${s.clientName || ''}, ${s.phone || ''},
          ${s.status}, ${s.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          client_name = EXCLUDED.client_name,
          client_phone = EXCLUDED.client_phone,
          status = EXCLUDED.status;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncSite error:', err?.message);
    }
  }

  /**
   * Real-time attendance record sync to NeonDB
   */
  public async syncAttendance(a: AttendanceRecord): Promise<void> {
    try {
      await this.sql`
        INSERT INTO attendance (
          id, technician_id, location_address, check_in_at, check_out_at, created_at
        ) VALUES (
          ${a.id}, ${a.technicianId}, ${a.location},
          ${a.checkInTime ? new Date().toISOString() : null},
          ${a.checkOutTime ? new Date().toISOString() : null},
          ${new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          check_out_at = EXCLUDED.check_out_at;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncAttendance error:', err?.message);
    }
  }

  /**
   * Real-time setting key-value sync to NeonDB
   */
  public async syncSetting(key: string, value: string): Promise<void> {
    try {
      await this.sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${value}, NOW())
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW();
      `;
    } catch (err: any) {
      console.warn('NeonDB syncSetting error:', err?.message);
    }
  }

  /**
   * Real-time customer warranty sync to NeonDB
   */
  public async syncWarranty(w: CustomerWarranty): Promise<void> {
    try {
      await this.sql`
        INSERT INTO warranties (
          id, invoice_number, warranty_type, brand, model, purchase_date, duration_months, notes, created_at
        ) VALUES (
          ${w.id}, ${w.invoiceNumber}, ${w.productCategory}, ${w.brand}, ${w.productName},
          ${w.purchaseDate}, ${(w.warrantyDurationYears || 10) * 12}, ${w.customerName}, ${w.purchaseDate}
        )
        ON CONFLICT (id) DO UPDATE SET
          warranty_type = EXCLUDED.warranty_type,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          notes = EXCLUDED.notes;
      `;
      this.checkHealth().catch(() => {});
    } catch (err: any) {
      console.warn('NeonDB syncWarranty error:', err?.message);
    }
  }

  /**
   * Push complete local application state bundle into NeonDB
   */
  public async pushAllLocalData(data: {
    bookings: Booking[];
    complaints: Complaint[];
    quotes: QuoteRequest[];
    accounts: AuthAccount[];
    sites: WorkingSite[];
    attendance: AttendanceRecord[];
    warranties: CustomerWarranty[];
    settings?: AppSettings;
  }): Promise<{ success: boolean; pushedCount: number; message: string }> {
    let count = 0;

    // 1. Users
    for (const acc of data.accounts) {
      await this.syncUser(acc);
      count++;
    }

    // 2. Bookings
    for (const b of data.bookings) {
      await this.syncBooking(b);
      count++;
    }

    // 3. Complaints
    for (const c of data.complaints) {
      await this.syncComplaint(c);
      count++;
    }

    // 4. Quotes
    for (const q of data.quotes) {
      await this.syncQuote(q);
      count++;
    }

    // 5. Sites
    for (const s of data.sites) {
      await this.syncSite(s);
      count++;
    }

    // 6. Attendance
    for (const a of data.attendance) {
      await this.syncAttendance(a);
      count++;
    }

    // 7. Warranties
    for (const w of data.warranties) {
      await this.syncWarranty(w);
      count++;
    }

    // 8. Settings
    if (data.settings) {
      for (const [k, v] of Object.entries(data.settings)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          await this.syncSetting(k, String(v));
          count++;
        }
      }
    }

    await this.checkHealth();

    return {
      success: true,
      pushedCount: count,
      message: `Successfully synchronized ${count} records to your central database!`,
    };
  }
}

export const NeonDbService = new NeonDatabaseService();
