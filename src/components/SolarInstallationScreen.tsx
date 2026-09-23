import React, { useState } from 'react';
import {
  ArrowLeft,
  Home,
  Building2,
  Sun,
  Zap,
  Battery,
  Clock,
  Droplets,
  Building,
  Check,
  CheckCircle2,
  DollarSign,
  Maximize2,
  User,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  List,
} from 'lucide-react';
import { QuoteRequest, UserProfile } from '../types';

interface SolarInstallationScreenProps {
  user: UserProfile;
  onQuoteCreated: (quote: QuoteRequest) => void;
  onNavigateHome: () => void;
  onNavigateMyOrders?: () => void;
  whatsappNumber: string;
}

export const SolarInstallationScreen: React.FC<SolarInstallationScreenProps> = ({
  user,
  onQuoteCreated,
  onNavigateHome,
  onNavigateMyOrders,
  whatsappNumber,
}) => {
  // Wizard Step: 1 | 2 | 3 | 'success'
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);

  // Step 1 State: Property & System Type
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [systemType, setSystemType] = useState<
    'on_grid' | 'hybrid' | 'off_grid' | 'daytime' | 'tubewell' | 'commercial_scale'
  >('hybrid');

  // Step 2 State: Requirements
  const [monthlyBill, setMonthlyBill] = useState('');
  const [installationArea, setInstallationArea] = useState('');
  const [notes, setNotes] = useState('');

  // Step 3 State: Contact Details
  const [fullName, setFullName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [city, setCity] = useState(user.city || 'Lahore');
  const [address, setAddress] = useState('');

  // Created Quote Reference
  const [createdQuote, setCreatedQuote] = useState<QuoteRequest | null>(null);

  // Helper label getters
  const getPropertyLabel = () =>
    propertyType === 'residential' ? 'Residential / House' : 'Commercial Property';

  const getSystemLabel = () => {
    switch (systemType) {
      case 'on_grid':
        return 'On-Grid';
      case 'hybrid':
        return 'Hybrid';
      case 'off_grid':
        return 'Off-Grid';
      case 'daytime':
        return 'Day-Time Only';
      case 'tubewell':
        return 'Agri / Tubewell';
      case 'commercial_scale':
        return 'Commercial Scale';
    }
  };

  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyBill.trim()) {
      alert('Please enter your approximate monthly electricity bill');
      return;
    }
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !city.trim() || !address.trim()) {
      alert('Please fill in all required contact details');
      return;
    }

    // Estimate System Size (kW) based on monthly bill PKR
    const numericBill = parseFloat(monthlyBill.replace(/[^0-9]/g, '')) || 25000;
    // Rule of thumb in Pakistan: ~1kW produces ~110-120 units (~PKR 6,500-7,500 bill offset)
    const estimatedKw = Math.max(3, Math.min(50, Math.round(numericBill / 4500)));
    const baseCostPerKw = systemType === 'hybrid' ? 145000 : 110000;
    const estCost = estimatedKw * baseCostPerKw;
    const monthlySavings = Math.round(numericBill * 0.85);

    const newQuote: QuoteRequest = {
      id: `KSQ-${Math.floor(100 + Math.random() * 900)}`,
      customerName: fullName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim(),
      monthlyBill: monthlyBill.trim(),
      installationArea: installationArea.trim(),
      notes: notes.trim(),
      systemSizeKw: estimatedKw,
      propertyType,
      systemType,
      batteryBackup: systemType === 'hybrid' || systemType === 'off_grid',
      estimatedCostPkr: estCost,
      estimatedMonthlySavingsPkr: monthlySavings,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onQuoteCreated(newQuote);
    setCreatedQuote(newQuote);
    setStep('success');
  };

  const handleFollowUpWhatsApp = () => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar Energy, I just requested a Solar Installation Quote #${createdQuote?.id || ''}.\nProperty: ${getPropertyLabel()}\nSystem: ${getSystemLabel()}\nBill: ${monthlyBill}\nCity: ${city}\nAddress: ${address}\nName: ${fullName} (${phone})`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleResetForm = () => {
    setStep(1);
    setMonthlyBill('');
    setInstallationArea('');
    setNotes('');
    setAddress('');
    setCreatedQuote(null);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-800 pb-28">
      {/* ================= TOP HEADER BANNER (Exact Match: Dark Navy #091b29) ================= */}
      <div className="bg-[#0b1a28] text-white pt-4 pb-4 px-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Solar Installation</h1>
              <p className="text-[11px] text-white/80 font-medium">
                {step === 1 && 'Property & system type'}
                {step === 2 && 'Requirements'}
                {step === 3 && 'Contact details'}
                {step === 'success' && 'Quotation Request'}
              </p>
            </div>
          </div>

          {step !== 'success' && (
            <div className="px-3 py-1 rounded-full bg-white/15 text-white font-black text-xs">
              {step}/3
            </div>
          )}
        </div>

        {/* Progress Bar (Matches Screenshots) */}
        {step !== 'success' && (
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{
                width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%',
              }}
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* ================= STEP 1: PROPERTY & SYSTEM TYPE (Matches Screenshot 2:54) ================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Continue} className="space-y-4">
            {/* Section 1: Property Type (2 Cards) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Residential */}
              <div
                onClick={() => setPropertyType('residential')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-40 ${
                  propertyType === 'residential'
                    ? 'bg-white border-[#0b1a28] shadow-md ring-2 ring-[#0b1a28]/10'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {propertyType === 'residential' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0b1a28] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-2xl bg-[#e6f0fa] text-[#0b63a6] flex items-center justify-center">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">
                    Residential / House
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Single family home, villa, or residential property
                  </p>
                </div>
              </div>

              {/* Commercial */}
              <div
                onClick={() => setPropertyType('commercial')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-40 ${
                  propertyType === 'commercial'
                    ? 'bg-white border-[#0b1a28] shadow-md ring-2 ring-[#0b1a28]/10'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {propertyType === 'commercial' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0b1a28] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-10 h-10 rounded-2xl bg-[#e6f0fa] text-[#0b63a6] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">
                    Commercial Property
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Office, factory, shop, or commercial building
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: System Type (6 Cards Grid) */}
            <div className="grid grid-cols-2 gap-3">
              {/* On-Grid */}
              <div
                onClick={() => setSystemType('on_grid')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'on_grid'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'on_grid' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">On-Grid</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Grid-tied, reduces electricity bills
                  </p>
                </div>
              </div>

              {/* Hybrid */}
              <div
                onClick={() => setSystemType('hybrid')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'hybrid'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'hybrid' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Hybrid</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Grid + battery backup for 24/7 power
                  </p>
                </div>
              </div>

              {/* Off-Grid */}
              <div
                onClick={() => setSystemType('off_grid')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'off_grid'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'off_grid' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Battery className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Off-Grid</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Fully independent from the grid
                  </p>
                </div>
              </div>

              {/* Day-Time Only */}
              <div
                onClick={() => setSystemType('daytime')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'daytime'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'daytime' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Day-Time Only</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Daytime power, no battery
                  </p>
                </div>
              </div>

              {/* Agri / Tubewell */}
              <div
                onClick={() => setSystemType('tubewell')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'tubewell'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'tubewell' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Agri / Tubewell</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Agriculture &amp; tubewell solutions
                  </p>
                </div>
              </div>

              {/* Commercial Scale */}
              <div
                onClick={() => setSystemType('commercial_scale')}
                className={`relative p-4 rounded-3xl border cursor-pointer transition active:scale-98 flex flex-col justify-between h-36 ${
                  systemType === 'commercial_scale'
                    ? 'bg-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 shadow-2xs hover:bg-slate-50'
                }`}
              >
                {systemType === 'commercial_scale' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-tight">Commercial Scale</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Large-scale commercial setup
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button (Matches Screenshot: Dark Navy Continue button) */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#091b29] hover:bg-[#0c263a] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Continue</span>
              <span>➔</span>
            </button>
          </form>
        )}

        {/* ================= STEP 2: REQUIREMENTS (Matches Screenshot 2:54 PM (1)) ================= */}
        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="space-y-4">
            {/* Top Selected Summary Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>{getPropertyLabel()}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                <span>{getSystemLabel()}</span>
              </span>
            </div>

            {/* Form Fields Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              {/* Monthly Electricity Bill */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Monthly Electricity Bill <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(e.target.value)}
                    placeholder="e.g. Rs. 8,000 / month"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#091b29]/20 focus:border-[#091b29]"
                    required
                  />
                </div>
              </div>

              {/* Roof / Installation Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Roof / Installation Area <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Maximize2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={installationArea}
                    onChange={(e) => setInstallationArea(e.target.value)}
                    placeholder="e.g. 1000 sq ft"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#091b29]/20 focus:border-[#091b29]"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements, existing system info, etc."
                  className="w-full p-3.5 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#091b29]/20 focus:border-[#091b29]"
                />
              </div>
            </div>

            {/* Bottom Continue Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#091b29] hover:bg-[#0c263a] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Continue</span>
              <span>➔</span>
            </button>
          </form>
        )}

        {/* ================= STEP 3: CONTACT DETAILS (Matches Screenshot 2:54 PM (2) & 2:55) ================= */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            {/* Top Selected Summary Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>{getPropertyLabel()}</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                <span>{getSystemLabel()}</span>
              </span>
              {monthlyBill && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{monthlyBill}</span>
                </span>
              )}
            </div>

            {/* Form Fields Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="sunny"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#0b63a6]"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="619643664"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#0b63a6]"
                    required
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#0b63a6]"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No, Street, Area"
                    className="w-full px-3.5 py-3 rounded-2xl bg-[#f1f5f9] border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-[#0b63a6]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bottom Button (Matches Screenshot: Blue Submit Quotation Request) */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0b63a6] hover:bg-[#09548c] active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <Send className="w-4 h-4" />
              <span>Submit Quotation Request</span>
            </button>
          </form>
        )}

        {/* ================= SUCCESS SCREEN (Matches WhatsApp Image 2026-09-23 at 2.55) ================= */}
        {step === 'success' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* White Rounded Card with Big Green Checkmark */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-11 h-11 stroke-[2.2]" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900">Request Submitted!</h2>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-xs mx-auto">
                  Your solar installation quotation request has been received. Our team will review your requirements and respond with a tailored quote shortly.
                </p>
              </div>

              {/* Callout Box: Expected response within 24-48 hours */}
              <div className="p-3 rounded-2xl bg-[#f0f9ff] border border-[#bae6fd] flex items-center justify-center gap-2 text-xs font-bold text-[#0369a1]">
                <Clock className="w-4 h-4 text-[#0284c7]" />
                <span>Expected response within 24–48 hours</span>
              </div>
            </div>

            {/* Action Buttons (Matches Screenshot: Green WhatsApp Followup & Dark Navy View Quotes) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleFollowUpWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Follow up on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateMyOrders) onNavigateMyOrders();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#091b29] hover:bg-[#0c263a] active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <List className="w-4 h-4" />
                <span>View My Quotes</span>
              </button>
            </div>

            {/* Text Link: Submit another request */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition underline underline-offset-2"
              >
                Submit another request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
