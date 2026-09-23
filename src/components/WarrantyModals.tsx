import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Zap,
  Sun,
  Battery,
  Award,
  MessageCircle,
  Printer,
  ChevronRight,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { CustomerWarranty, UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface WarrantySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
  whatsappNumber?: string;
}

export const WarrantySearchModal: React.FC<WarrantySearchModalProps> = ({
  isOpen,
  onClose,
  userPhone = '',
  whatsappNumber = '923001234567',
}) => {
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundWarranty, setFoundWarranty] = useState<CustomerWarranty | null>(null);
  const [selectedWarrantyForCert, setSelectedWarrantyForCert] = useState<CustomerWarranty | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const result = StorageService.searchWarranty(invoiceQuery);
    setFoundWarranty(result);
  };

  const handleWhatsAppClaim = (warranty: CustomerWarranty) => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar Energy, I would like to verify/claim warranty for my registered product:\n• Product: ${warranty.productName}\n• Serial Number: ${warranty.serialNumber}\n• Invoice #: ${warranty.invoiceNumber}\n• Purchase Date: ${warranty.purchaseDate}\n• Expiry Date: ${warranty.expiryDate}\nCustomer: ${warranty.customerName} (${warranty.customerPhone})`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Warranty Verification</h3>
              <p className="text-[11px] text-slate-500">Search by Invoice, Serial # or Phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="e.g. KSI-2024-8901, SN-GW-982411, or phone"
              className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#0096aa] hover:bg-[#008799] active:scale-98 text-white font-black text-xs shadow-xs transition"
          >
            Verify Warranty Status
          </button>
        </form>

        {hasSearched && (
          <div className="pt-1">
            {foundWarranty ? (
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                        {foundWarranty.status}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        #{foundWarranty.id}
                      </span>
                    </div>
                    <h4 className="font-black text-xs text-slate-900 mt-1">
                      {foundWarranty.productName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Brand: <span className="font-bold text-slate-700">{foundWarranty.brand}</span>
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Serial Number</span>
                    <span className="font-mono font-bold text-slate-800">{foundWarranty.serialNumber}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Invoice Ref</span>
                    <span className="font-mono font-bold text-slate-800">{foundWarranty.invoiceNumber}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Purchase Date</span>
                    <span className="font-bold text-slate-800">{foundWarranty.purchaseDate}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Warranty Expiry</span>
                    <span className="font-bold text-emerald-700">{foundWarranty.expiryDate}</span>
                  </div>
                </div>

                <div className="bg-emerald-100/60 p-2.5 rounded-2xl text-[11px] text-emerald-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{foundWarranty.coverageType}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppClaim(foundWarranty)}
                    className="flex-1 py-2.5 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Claim on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWarrantyForCert(foundWarranty)}
                    className="py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Certificate</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No warranty registered for "{invoiceQuery}"</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Please verify your invoice or serial number. If you recently purchased equipment from K&S Solar Energy, our operations team can instantly verify and issue your warranty.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const clean = whatsappNumber.replace(/\D/g, '');
                    window.open(
                      `https://wa.me/${clean}?text=${encodeURIComponent(
                        `Salam K&S Solar, please check my warranty for query: ${invoiceQuery}`
                      )}`,
                      '_blank'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Contact K&S Support on WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

interface MyWarrantiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  whatsappNumber?: string;
  onOpenSearch?: () => void;
}

export const MyWarrantiesModal: React.FC<MyWarrantiesModalProps> = ({
  isOpen,
  onClose,
  user,
  whatsappNumber = '923001234567',
  onOpenSearch,
}) => {
  const [selectedWarranty, setSelectedWarranty] = useState<CustomerWarranty | null>(null);

  if (!isOpen) return null;

  // Search warranties for current customer by phone, email, or name
  const userWarranties = StorageService.getWarrantiesByCustomer(
    user.phone || user.email || user.name
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">My Registered Warranties</h3>
              <p className="text-[11px] text-slate-500">Official digital product certificates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Badge */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Account Holder</span>
            <span className="font-black text-slate-800">{user.name || 'Customer'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Phone</span>
            <span className="font-mono font-bold text-slate-700">{user.phone || 'N/A'}</span>
          </div>
        </div>

        {userWarranties.length === 0 ? (
          <div className="py-8 px-4 text-center flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="w-7 h-7 stroke-[1.5]" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">No warranties registered under your number</h4>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-normal">
                If you purchased solar panels, inverters or batteries from K&S Solar Energy, you can search by invoice or ask our support team to link your warranty card.
              </p>
            </div>
            {onOpenSearch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#0096aa] hover:bg-[#008799] text-white font-bold text-xs shadow-xs transition"
              >
                Search by Invoice Number
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {userWarranties.map((w) => {
              // Calculate remaining time
              const expiry = new Date(w.expiryDate);
              const now = new Date();
              const diffMs = expiry.getTime() - now.getTime();
              const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
              const isExpired = diffMs < 0;

              return (
                <div
                  key={w.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        {w.productCategory === 'solar_panel' ? (
                          <Sun className="w-5 h-5" />
                        ) : w.productCategory === 'inverter' ? (
                          <Zap className="w-5 h-5" />
                        ) : (
                          <Battery className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isExpired
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">#{w.id}</span>
                        </div>
                        <h4 className="font-black text-xs text-slate-900 mt-1 leading-snug">
                          {w.productName}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Brand: <span className="font-bold text-slate-700">{w.brand}</span> · Invoice:{' '}
                          <span className="font-mono font-bold text-slate-700">{w.invoiceNumber}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold uppercase block">Serial #</span>
                      <span className="font-mono font-bold text-slate-800">{w.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] font-bold uppercase block">Valid Until</span>
                      <span className="font-bold text-emerald-700">
                        {w.expiryDate} {diffYears > 0 ? `(${diffYears} yrs remaining)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="line-clamp-1">{w.coverageType}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedWarranty(w)}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Certificate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const clean = whatsappNumber.replace(/\D/g, '');
                        const msg = `Salam K&S Solar Energy, I need technical service for my warranty:\n• Product: ${w.productName}\n• Serial: ${w.serialNumber}\n• Invoice: ${w.invoiceNumber}\n• Customer: ${user.name} (${user.phone})`;
                        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="py-2 px-3 rounded-xl bg-[#00a86b] hover:bg-[#00965e] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Claim</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Digital Certificate Modal */}
      {selectedWarranty && (
        <WarrantyCertificateModal
          warranty={selectedWarranty}
          onClose={() => setSelectedWarranty(null)}
          whatsappNumber={whatsappNumber}
        />
      )}
    </div>
  );
};

interface WarrantyCertificateModalProps {
  warranty: CustomerWarranty;
  onClose: () => void;
  whatsappNumber?: string;
}

export const WarrantyCertificateModal: React.FC<WarrantyCertificateModalProps> = ({
  warranty,
  onClose,
  whatsappNumber = '923001234567',
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border-4 border-amber-400/40 relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Certificate Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Certificate Header Banner */}
        <div className="text-center space-y-1 border-b border-amber-200/80 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md mb-2">
            <Shield className="w-7 h-7 stroke-[2.2]" />
          </div>
          <span className="text-[10px] tracking-[0.25em] uppercase font-black text-amber-600 block">
            OFFICIAL CERTIFICATE OF WARRANTY
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">K&amp;S SOLAR ENERGY (PVT) LTD</h2>
          <p className="text-[11px] text-slate-500">
            Registered Pakistan Solar EPC &amp; Inverter Technical Services
          </p>
        </div>

        {/* Customer & Product Details */}
        <div className="bg-amber-50/40 rounded-2xl p-4 border border-amber-100 space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Certificate Reference:</span>
            <span className="font-mono font-black text-slate-900">{warranty.id}</span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Customer Name:</span>
            <span className="font-black text-slate-900">{warranty.customerName}</span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Phone / Contact:</span>
            <span className="font-mono font-bold text-slate-900">{warranty.customerPhone}</span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Equipment / Product:</span>
            <span className="font-bold text-slate-900 text-right max-w-[240px]">
              {warranty.productName}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Serial Number (S/N):</span>
            <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {warranty.serialNumber}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Purchase / Commission Date:</span>
            <span className="font-bold text-slate-900">{warranty.purchaseDate}</span>
          </div>

          <div className="flex justify-between items-center border-b border-amber-200/40 pb-2">
            <span className="text-slate-500">Warranty Expiration Date:</span>
            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {warranty.expiryDate} ({warranty.warrantyDurationYears} Years)
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Guaranteed Coverage:</span>
            <p className="font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-amber-200/60 leading-relaxed text-[11px]">
              {warranty.coverageType}
            </p>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Authorized Signatory</span>
            <span className="font-bold text-slate-800">K&amp;S Quality Assurance Division</span>
          </div>
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-slate-400">Security Verification</span>
            <span className="font-mono font-bold text-emerald-600">✓ SECURED &amp; VERIFIED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const clean = whatsappNumber.replace(/\D/g, '');
              const msg = `Salam K&S Solar Energy, I am viewing Certificate #${warranty.id} for ${warranty.productName} (S/N: ${warranty.serialNumber}). Please assist me.`;
              window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="py-3 px-4 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};
