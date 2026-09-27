import { Booking, Complaint, QuoteRequest, Technician, UserProfile } from '../types';

/**
 * Normalizes phone numbers to standard national digits without leading 0 or country code 92.
 * E.g., "+92 300 1234567" -> "3001234567"
 * "0300-1234567" -> "3001234567"
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = digits.slice(4);
  else if (digits.startsWith('92')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

/**
 * Checks whether an order / complaint / quote belongs exclusively to the logged-in user.
 * - Admin users have access to all records.
 * - Guests (not logged in or id === 'guest') have NO access to other users' historical records.
 * - Customers ONLY see records that match their user ID, email, or verified phone number.
 */
export function isItemOwnedByUser(
  item: {
    userId?: string;
    customerId?: string;
    userEmail?: string;
    phone?: string;
    customerName?: string;
  },
  user?: UserProfile | null
): boolean {
  if (!user || user.id === 'guest') {
    return false;
  }

  // Admin sees all items
  if (user.role === 'admin' || user.isAdmin) {
    return true;
  }

  // 1. Direct User ID match
  if (item.userId && item.userId === user.id) {
    return true;
  }
  if (item.customerId && item.customerId === user.id) {
    return true;
  }

  // 2. Direct Email match
  if (
    item.userEmail &&
    user.email &&
    item.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim()
  ) {
    return true;
  }

  // 3. Phone Number match (fuzzy / normalized)
  const itemPhone = normalizePhone(item.phone);
  const userPhone = normalizePhone(user.phone);
  if (itemPhone.length >= 7 && userPhone.length >= 7) {
    if (
      itemPhone === userPhone ||
      itemPhone.endsWith(userPhone) ||
      userPhone.endsWith(itemPhone)
    ) {
      return true;
    }
  }

  // 4. Exact Customer Name match if user name is set
  if (
    item.customerName &&
    user.name &&
    item.customerName.trim().toLowerCase() === user.name.trim().toLowerCase()
  ) {
    // If phone exists on both, they must match
    if (itemPhone.length >= 7 && userPhone.length >= 7) {
      return itemPhone === userPhone || itemPhone.endsWith(userPhone) || userPhone.endsWith(itemPhone);
    }
    return true;
  }

  return false;
}

/**
 * Filter complaints strictly for the current logged-in user.
 */
export function filterUserComplaints(complaints: Complaint[], user?: UserProfile | null): Complaint[] {
  if (!user || user.id === 'guest') {
    return [];
  }
  if (user.role === 'admin' || user.isAdmin) {
    return complaints;
  }
  return complaints.filter((c) => isItemOwnedByUser(c, user));
}

/**
 * Filter bookings strictly for the current logged-in user.
 */
export function filterUserBookings(bookings: Booking[], user?: UserProfile | null): Booking[] {
  if (!user || user.id === 'guest') {
    return [];
  }
  if (user.role === 'admin' || user.isAdmin) {
    return bookings;
  }
  return bookings.filter((b) => isItemOwnedByUser(b, user));
}

/**
 * Filter quotes strictly for the current logged-in user.
 */
export function filterUserQuotes(quotes: QuoteRequest[], user?: UserProfile | null): QuoteRequest[] {
  if (!user || user.id === 'guest') {
    return [];
  }
  if (user.role === 'admin' || user.isAdmin) {
    return quotes;
  }
  return quotes.filter((q) => isItemOwnedByUser(q, user));
}

/**
 * Check whether a job / task is assigned to or was completed by a technician.
 */
export function isTechAssignedToTask(
  task: {
    assignedTechnicianId?: string;
    assignedTechnicianName?: string;
    assignedTechnicianIds?: string[];
    assignedTechnicianNames?: string[];
    technicianNotes?: string;
  },
  tech?: Technician | null
): boolean {
  if (!tech || !tech.id) return false;
  const techId = tech.id;
  const techName = tech.name.toLowerCase().trim();

  // ID checks
  if (task.assignedTechnicianId === techId) return true;
  if (task.assignedTechnicianIds?.includes(techId)) return true;

  // Name checks
  if (task.assignedTechnicianName && task.assignedTechnicianName.toLowerCase().includes(techName)) {
    return true;
  }
  if (task.assignedTechnicianNames?.some((n) => n.toLowerCase().includes(techName) || techName.includes(n.toLowerCase()))) {
    return true;
  }

  // Notes check
  if (task.technicianNotes && task.technicianNotes.toLowerCase().includes(techName)) {
    return true;
  }

  return false;
}
