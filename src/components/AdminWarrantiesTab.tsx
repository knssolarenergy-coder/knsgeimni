import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileText,
  Trash2,
  Edit2,
  MessageCircle,
  ExternalLink,
  X,
  Filter,
  Award,
  Zap,
  Sun,
  Battery,
  Layers,
  User,
  Phone,
  MapPin,
  Check,
  Copy,
} from 'lucide-react';
import { CustomerWarranty, WarrantyCategory, WarrantyStatus, Booking, QuoteRequest } from '../types';
import { StorageService } from '../services/storage';
import { CITIES } from '../data/mockData';
import { WarrantyCertificateModal } from './WarrantyModals';

interface AdminWarrantiesTabProps {
  bookings?: Booking[];
  quotes?: QuoteRequest[];
  whatsappNumber?: string;
  onShowToast: (msg: string) => void;
}

const COMMON_BRANDS = [
  'Growatt',
  'Huawei',
  'Solis',
  'Longi',
  'Jinko Solar',
  'Canadian Solar',
  'Inverex',
  'GoodWe',
  'Livoltek',
  'Fronius',
  'Crown Micro',
  'Knox Solar',
  'Other',
];

const COVERAGE_PRESETS = [
  '25-Year Linear Power Output (84.8%) & 12-Year Product Warranty',
  '5-Year Replacement Warranty (OEM Certified) + Free On-Site Maintenance',
  '10-Year Comprehensive Inverter Replacement & Smart Dongle Warranty',
  '12-Year Workmanship, Earthing Pit & Complete System Guarantee',
  '3-Year Free Preventive Maintenance & Bi-Annual Wash Service',
  '1-Year Complete System Electrical & Wiring Free Service',
];

export const AdminWarrantiesTab: React.FC<AdminWarrantiesTabProps> = ({
  bookings = [],
  quotes = [],
  whatsappNumber = '923001234567',
  onShowToast,
}) => {
  const [warranties, setWarranties] = useState<CustomerWarranty[]>(() =>
    StorageService.getWarranties()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WarrantyStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WarrantyCategory>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<CustomerWarranty | null>(null);
  const [selectedWarrantyForCert, setSelectedWarrantyForCert] = useState<CustomerWarranty | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState(CITIES[0] || 'Lahore');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [productCategory, setProductCategory] = useState<WarrantyCategory>('inverter');
  const [brand, setBrand] = useState(COMMON_BRANDS[0]);
  const [productName, setProductName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [systemSizeKw, setSystemSizeKw] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [warrantyDurationYears, setWarrantyDurationYears] = useState<number>(5);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split('T')[0];
  });
  const [coverageType, setCoverageType] = useState(COVERAGE_PRESETS[1]);
  const [status, setStatus] = useState<WarrantyStatus>('active');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Handle auto-calculating expiry when purchaseDate or duration changes
  const updateExpiryFromDuration = (startDateStr: string, years: number) => {
    try {
      const parts = startDateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10) + years;
        setExpiryDate(`${year}-${parts[1]}-${parts[2]}`);
      }
    } catch {
      // fallback
    }
  };

  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    updateExpiryFromDuration(val, warrantyDurationYears);
  };

  const handleDurationChange = (years: number) => {
    setWarrantyDurationYears(years);
    updateExpiryFromDuration(purchaseDate, years);
  };

  // Auto-generate invoice suggestion
  const generateRandomInvoice = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`KSI-${year}-${num}`);
  };

  // Quick Customer Prefill
  const handleSelectExistingCustomer = (name: string, phone: string, c?: string) => {
    setCustomerName(name);
    setCustomerPhone(phone);
    if (c) setCity(c);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingWarranty(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCity(CITIES[0] || 'Lahore');
    generateRandomInvoice();
    setProductCategory('inverter');
    setBrand('Growatt');
    setProductName('Growatt 10kW On-Grid Inverter (MOD 10KTL3-X)');
    setSerialNumber(`SN-GW-${Math.floor(100000 + Math.random() * 900000)}`);
    setSystemSizeKw('10');
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    setWarrantyDurationYears(5);
    updateExpiryFromDuration(today, 5);
    setCoverageType(COVERAGE_PRESETS[1]);
    setStatus('active');
    setTechnicianNotes('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (w: CustomerWarranty) => {
    setEditingWarranty(w);
    setCustomerName(w.customerName);
    setCustomerPhone(w.customerPhone);
    setCustomerEmail(w.customerEmail || '');
    setCustomerAddress(w.customerAddress || '');
    setCity(w.city || CITIES[0] || 'Lahore');
    setInvoiceNumber(w.invoiceNumber);
    setProductCategory(w.productCategory);
    setBrand(w.brand);
    setProductName(w.productName);
    setSerialNumber(w.serialNumber);
    setSystemSizeKw(w.systemSizeKw ? String(w.systemSizeKw) : '');
    setPurchaseDate(w.purchaseDate);
    setWarrantyDurationYears(w.warrantyDurationYears);
    setExpiryDate(w.expiryDate);
    setCoverageType(w.coverageType);
    setStatus(w.status);
    setTechnicianNotes(w.technicianNotes || '');
    setIsAddModalOpen(true);
  };

  // Save or Update Warranty
  const handleSaveWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !productName.trim() || !serialNumber.trim()) {
      alert('Please fill in required fields: Customer Name, Phone, Product Name, and Serial Number.');
      return;
    }

    if (editingWarranty) {
      // Update existing
      const updatedList = StorageService.updateWarranty(editingWarranty.id, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        city,
        invoiceNumber: invoiceNumber.trim() || `KSI-${new Date().getFullYear()}-0001`,
        productCategory,
        brand,
        productName: productName.trim(),
        serialNumber: serialNumber.trim(),
        systemSizeKw: systemSizeKw ? parseFloat(systemSizeKw) : undefined,
        purchaseDate,
        warrantyDurationYears,
        expiryDate,
        coverageType,
        status,
        technicianNotes: technicianNotes.trim() || undefined,
      });
      setWarranties(updatedList);
      onShowToast(`Warranty for ${customerName} updated!`);
    } else {
      // Add new warranty
      const created = StorageService.addWarranty({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        city,
        invoiceNumber: invoiceNumber.trim() || `KSI-${new Date().getFullYear()}-0001`,
        productCategory,
        brand,
        productName: productName.trim(),
        serialNumber: serialNumber.trim(),
        systemSizeKw: systemSizeKw ? parseFloat(systemSizeKw) : undefined,
        purchaseDate,
        warrantyDurationYears,
        expiryDate,
        coverageType,
        status,
        authorizedDealer: 'K&S Solar Energy (Pvt) Ltd',
        technicianNotes: technicianNotes.trim() || undefined,
      });
      setWarranties(StorageService.getWarranties());
      onShowToast(`Warranty registered for ${customerName}! (#${created.id})`);
    }

    setIsAddModalOpen(false);
  };

  // Delete Warranty
  const handleDeleteWarranty = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete warranty #${id} for ${name}?`)) {
      const updated = StorageService.deleteWarranty(id);
      setWarranties(updated);
      onShowToast(`Warranty #${id} deleted.`);
    }
  };

  // Share Warranty with Customer on WhatsApp
  const handleShareWarrantyWhatsApp = (w: CustomerWarranty) => {
    const cleanPhone = w.customerPhone.replace(/\D/g, '');
    const phoneToUse = cleanPhone.startsWith('92')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `92${cleanPhone.slice(1)}`
      : `92${cleanPhone}`;

    const text = `*OFFICIAL WARRANTY CERTIFICATE · K&S SOLAR ENERGY*\n\nDear *${w.customerName}*,\nYour equipment warranty has been verified and registered in the K&S Solar Energy Central Database.\n\n📄 *Certificate ID:* ${w.id}\n🧾 *Invoice #:* ${w.invoiceNumber}\n⚡ *Product:* ${w.productName}\n🏷️ *Brand:* ${w.brand}\n🔢 *Serial #:* ${w.serialNumber}\n📅 *Purchase Date:* ${w.purchaseDate}\n🛡️ *Valid Until:* ${w.expiryDate} (${w.warrantyDurationYears} Years)\n✅ *Coverage:* ${w.coverageType}\n\nYou can also view your digital certificate in your K&S Customer App.\nFor technical support or warranty claims, contact us directly at K&S Solar Energy Helpline: +92 300 1234567.`;

    window.open(`https://wa.me/${phoneToUse}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtered Warranties
  const filteredWarranties = warranties.filter((w) => {
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || w.productCategory === categoryFilter;

    if (!matchStatus || !matchCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      w.customerName.toLowerCase().includes(q) ||
      w.customerPhone.includes(q) ||
      w.invoiceNumber.toLowerCase().includes(q) ||
      w.serialNumber.toLowerCase().includes(q) ||
      w.brand.toLowerCase().includes(q) ||
      w.productName.toLowerCase().includes(q) ||
      w.id.toLowerCase().includes(q)
    );
  });

  // Unique Customer list for quick selection
  const customerSuggestions = Array.from(
    new Map(
      [
        ...bookings.map((b) => ({ name: b.customerName, phone: b.phone, city: b.city })),
        ...quotes.map((q) => ({ name: q.customerName, phone: q.phone, city: q.city })),
        ...warranties.map((w) => ({ name: w.customerName, phone: w.customerPhone, city: w.city })),
      ].map((item) => [item.phone, item])
    ).values()
  );

  return (
    <div className="p-4 space-y-4">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-3xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Customer Warranties &amp; Expiries</h2>
            <p className="text-xs text-amber-100 font-medium">
              Assign equipment warranties, set expiry dates, and issue digital certificates
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="py-2.5 px-4 rounded-2xl bg-white text-amber-800 hover:bg-amber-50 active:scale-95 text-xs font-black flex items-center justify-center gap-2 shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Issue New Warranty</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 text-center shadow-2xs">
          <p className="text-xs text-slate-500 font-bold">Total</p>
          <p className="text-lg font-black text-slate-900">{warranties.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-emerald-200/90 text-center shadow-2xs">
          <p className="text-xs text-emerald-700 font-bold">Active</p>
          <p className="text-lg font-black text-emerald-700">
            {warranties.filter((w) => w.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-amber-200/90 text-center shadow-2xs">
          <p className="text-xs text-amber-700 font-bold">Expiring</p>
          <p className="text-lg font-black text-amber-700">
            {warranties.filter((w) => w.status === 'expiring_soon').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-3 border border-rose-200/90 text-center shadow-2xs">
          <p className="text-xs text-rose-700 font-bold">Expired</p>
          <p className="text-lg font-black text-rose-700">
            {warranties.filter((w) => w.status === 'expired').length}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, serial #, invoice #, or brand..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['all', 'active', 'expiring_soon', 'expired'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Status' : st.replace('_', ' ').toUpperCase()}
            </button>
          ))}

          <span className="text-slate-300">|</span>

          {(['all', 'inverter', 'solar_panel', 'battery', 'complete_system'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all'
                ? 'All Categories'
                : cat === 'solar_panel'
                ? 'Solar Panels'
                : cat === 'inverter'
                ? 'Inverters'
                : cat === 'battery'
                ? 'Batteries'
                : 'Systems'}
            </button>
          ))}
        </div>
      </div>

      {/* Warranties List */}
      {filteredWarranties.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h4 className="font-black text-slate-800 text-sm">No Warranties Found</h4>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            {searchQuery
              ? 'No matching customer warranty was found for your search query.'
              : 'No warranties have been issued yet. Click "Issue New Warranty" to register a product warranty for a customer.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWarranties.map((w) => {
            const expDate = new Date(w.expiryDate);
            const now = new Date();
            const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isExpired = diffDays <= 0;
            const isExpiringSoon = !isExpired && diffDays <= 90;

            return (
              <div
                key={w.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:shadow-xs transition"
              >
                {/* Header: Customer & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      {w.productCategory === 'solar_panel' ? (
                        <Sun className="w-5 h-5" />
                      ) : w.productCategory === 'inverter' ? (
                        <Zap className="w-5 h-5" />
                      ) : (
                        <Battery className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">{w.customerName}</h4>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          #{w.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono font-medium">{w.customerPhone}</span>
                        {w.city && <span>· {w.city}</span>}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isExpired
                        ? 'bg-rose-100 text-rose-800'
                        : isExpiringSoon
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                  </span>
                </div>

                {/* Product & Warranty Details */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-black text-slate-900">{w.productName}</span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {w.brand}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">Serial Number</span>
                      <span className="font-mono font-bold text-slate-800">{w.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">Invoice Number</span>
                      <span className="font-mono font-bold text-slate-800">{w.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">Purchase Date</span>
                      <span className="font-bold text-slate-700">{w.purchaseDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] uppercase font-bold block">
                        Warranty Expiry ({w.warrantyDurationYears} Yrs)
                      </span>
                      <span
                        className={`font-black ${
                          isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'
                        }`}
                      >
                        {w.expiryDate} {isExpired ? '(Expired)' : `(${Math.floor(diffDays / 365.25)} yrs left)`}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="line-clamp-1">{w.coverageType}</span>
                  </div>

                  {w.technicianNotes && (
                    <p className="text-[10px] text-slate-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                      Note: {w.technicianNotes}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedWarrantyForCert(w)}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Certificate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareWarrantyWhatsApp(w)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>WhatsApp Customer</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(w)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95"
                      title="Edit Warranty"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWarranty(w.id, w.customerName)}
                      className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition active:scale-95"
                      title="Delete Warranty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* ISSUE / EDIT WARRANTY MODAL                                */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {editingWarranty ? 'Edit Warranty Record' : 'Issue Customer Warranty'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set product purchased, serial number, and expiry date
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWarranty} className="space-y-4 text-xs">
              {/* Customer Selector / Autocomplete */}
              {!editingWarranty && customerSuggestions.length > 0 && (
                <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/70">
                  <span className="text-[11px] font-black text-amber-900 block">
                    ⚡ Quick Select Existing Customer
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {customerSuggestions.slice(0, 6).map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectExistingCustomer(c.name, c.phone, c.city)}
                        className="py-1 px-2.5 rounded-full bg-white hover:bg-amber-100 text-slate-700 border border-amber-200 font-bold text-[10px] whitespace-nowrap active:scale-95 transition"
                      >
                        {c.name} ({c.phone.slice(-4)})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 1: Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Customer Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ahmed Khan"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Invoice Number *</label>
                    <button
                      type="button"
                      onClick={generateRandomInvoice}
                      className="text-[10px] text-amber-700 hover:underline font-bold"
                    >
                      Generate #
                    </button>
                  </div>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. KSI-2024-8901"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Section 2: Product & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product Category *</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value as WarrantyCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="inverter">Solar Inverter</option>
                    <option value="solar_panel">Solar Panels Tier-1</option>
                    <option value="battery">Lithium / Gel Battery ESS</option>
                    <option value="complete_system">Complete Solar System</option>
                    <option value="structure">Structure &amp; Earthing</option>
                    <option value="other">Other Solar Equipment</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Brand / OEM Manufacturer</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  >
                    {COMMON_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Product Name &amp; Model Description *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Longi Hi-MO 6 585W Bifacial Solar Panels (x18) or Growatt 10kW On-Grid Inverter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Serial Number (S/N) *</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-LG-8842104"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">System Capacity (kW) (Optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={systemSizeKw}
                    onChange={(e) => setSystemSizeKw(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Section 3: Dates & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Purchase / Installation Date *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => handlePurchaseDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warranty Duration *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10, 12, 25].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleDurationChange(yr)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-black transition ${
                          warrantyDurationYears === yr
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {yr}y
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warranty Expiry Date *</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warranty Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as WarrantyStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="active">Active &amp; Verified</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="claimed">Claimed / Serviced</option>
                  </select>
                </div>
              </div>

              {/* Coverage Presets */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Guaranteed Coverage Terms *</label>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {COVERAGE_PRESETS.slice(0, 3).map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverageType(term)}
                      className="py-1 px-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold whitespace-nowrap active:scale-95 transition"
                    >
                      {i === 0 ? '25y Linear' : i === 1 ? '5y Inverter OEM' : '10y Comprehensive'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={coverageType}
                  onChange={(e) => setCoverageType(e.target.value)}
                  placeholder="e.g. 25-Year Linear Power Output & 12-Year Product Guarantee"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                  required
                />
              </div>

              {/* Technician Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Technician Remarks / Installation Details</label>
                <input
                  type="text"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="e.g. SPD Class II, copper earthing pit checked, cloud monitoring online"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:outline-hidden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-xs transition"
                >
                  {editingWarranty ? 'Save Warranty Changes' : 'Issue & Register Warranty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Certificate Modal */}
      {selectedWarrantyForCert && (
        <WarrantyCertificateModal
          warranty={selectedWarrantyForCert}
          onClose={() => setSelectedWarrantyForCert(null)}
          whatsappNumber={whatsappNumber}
        />
      )}
    </div>
  );
};
