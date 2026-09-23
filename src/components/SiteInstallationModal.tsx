import React, { useState } from 'react';
import {
  Sun,
  Zap,
  Building,
  Wrench,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import { CITIES } from '../data/mockData';
import {
  PropertyType,
  SiteInstallation,
  StructureType,
  SystemType,
  Technician,
  UserProfile,
} from '../types';

interface SiteInstallationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile;
  onInstallationCreated?: (installation: SiteInstallation) => void;
  onCreateInstallation?: (installation: SiteInstallation) => void;
  whatsappNumber?: string;
  technicians?: Technician[];
}

export const SiteInstallationModal: React.FC<SiteInstallationModalProps> = ({
  isOpen,
  onClose,
  user,
  onInstallationCreated,
  onCreateInstallation,
  whatsappNumber = '03001234567',
  technicians = [],
}) => {
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || 'Lahore');
  const [address, setAddress] = useState('');
  const [systemSizeKw, setSystemSizeKw] = useState<number>(10);
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [systemType, setSystemType] = useState<SystemType>('hybrid');
  const [structureType, setStructureType] = useState<StructureType>('elevated_l3');
  const [inverterBrand, setInverterBrand] = useState<string>('Huawei FusionSolar');
  const [netMeteringRequired, setNetMeteringRequired] = useState<boolean>(true);
  const [discoName, setDiscoName] = useState<string>('LESCO');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdId, setCreatedId] = useState<string>('');

  if (!isOpen) return null;

  // Approximate PKR estimation based on system size & battery
  const baseCostPerKw = systemType === 'hybrid' ? 140000 : 105000;
  const estimatedCost = systemSizeKw * baseCostPerKw;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newInstallation: SiteInstallation = {
      id: `KSI-${Math.floor(500 + Math.random() * 500)}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      city,
      address: address.trim(),
      systemSizeKw,
      propertyType,
      systemType,
      structureType,
      inverterBrand,
      netMeteringRequired,
      discoName: netMeteringRequired ? discoName : undefined,
      status: 'survey_scheduled',
      progressPercent: 12,
      createdAt: new Date().toISOString(),
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedBudgetPkr: estimatedCost,
      assignedTechnicianIds: [],
      assignedTechnicianNames: [],
      milestones: [
        {
          id: 'm1',
          title: 'Site Shadow & Structural Survey',
          titleUrdu: 'سائٹ اور شیڈو سروے',
          description: 'Engineer site inspection, shadow analysis & roof stability test.',
          status: 'pending',
        },
        {
          id: 'm2',
          title: 'Custom Galvanized Structure Mounting',
          titleUrdu: 'گیلوینائزڈ سٹرکچر کی تنصیب',
          description: 'Heavy duty elevated or flush structure mounting.',
          status: 'pending',
        },
        {
          id: 'm3',
          title: 'Solar Panels Clamping & DC Stringing',
          titleUrdu: 'سولر پینلز کلکپنگ اور سٹرنگ وائرنگ',
          description: 'Tier-1 bifacial panels installation & 6mm solar cabling.',
          status: 'pending',
        },
        {
          id: 'm4',
          title: 'Inverter, Battery ESS & AC/DC DB Setup',
          titleUrdu: 'انورٹر اور ڈسٹری بیوشن باکس وائرنگ',
          description: 'Class-1 SPDs, ATS, and inverter connection.',
          status: 'pending',
        },
        {
          id: 'm5',
          title: 'Copper Earth Pit & Surge Testing (<5 Ohm)',
          titleUrdu: 'ارتھنگ بور اور ٹیسٹنگ',
          description: 'Dual chemical earth pits & resistance testing.',
          status: 'pending',
        },
        {
          id: 'm6',
          title: 'DisCo Net-Metering Commissioning',
          titleUrdu: 'گرین میٹر اور سسٹم چالو کرنا',
          description: 'DisCo green meter energization & handover.',
          status: 'pending',
        },
      ],
      notes: notes.trim(),
    };

    if (onInstallationCreated) {
      onInstallationCreated(newInstallation);
    }
    if (onCreateInstallation) {
      onCreateInstallation(newInstallation);
    }
    setCreatedId(newInstallation.id);
    setIsSuccess(true);
  };

  const handleWhatsAppInquiry = () => {
    const clean = whatsappNumber.replace(/\D/g, '');
    const msg = `Salam K&S Solar Energy! I want to book a New Site Solar Installation.\n\nProject ID: ${createdId}\nCustomer: ${customerName}\nCity: ${city}\nSystem Size: ${systemSizeKw}kW (${systemType.toUpperCase()})\nStructure: ${structureType}\nEstimated: PKR ${estimatedCost.toLocaleString()}`;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#071f33] border border-[#164b77] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#072a45] via-[#0d3f66] to-[#072a45] text-white flex items-center justify-between border-b border-[#144770]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Sun className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white leading-tight">
                  New Solar Site Installation
                </h3>
                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  سولر سیٹ اپ
                </span>
              </div>
              <p className="text-[11px] text-sky-200 font-medium">
                Turnkey Rooftop EPC &amp; Net-Metering in Pakistan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Booking Reference: {createdId}
                </span>
                <h4 className="text-lg font-black text-white mt-1">
                  Site Installation Project Registered!
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  Hamari engineering dispatch team site shadow survey aur structural analysis ke liye jald aapse rabta karegi.
                </p>
              </div>

              {/* Summary Pill */}
              <div className="bg-[#09253d] border border-[#185382] rounded-2xl p-3.5 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>System Capacity:</span>
                  <span className="font-bold text-white">{systemSizeKw} kW ({systemType.toUpperCase()})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Structure Type:</span>
                  <span className="font-bold text-white uppercase">{structureType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Estimated Budget:</span>
                  <span className="font-extrabold text-amber-400">PKR {estimatedCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Location:</span>
                  <span className="font-bold text-white">{city}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Project Details on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close &amp; Track Status
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* System Size & Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">System Size (kW)</label>
                  <select
                    value={systemSizeKw}
                    onChange={(e) => setSystemSizeKw(Number(e.target.value))}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value={5}>5 kW (Residential Basic)</option>
                    <option value={7}>7 kW (3-Bedroom House)</option>
                    <option value={10}>10 kW (Standard House)</option>
                    <option value={15}>15 kW (1 Kanal Villa)</option>
                    <option value={20}>20 kW (Heavy Residential)</option>
                    <option value={25}>25 kW (Commercial / Clinic)</option>
                    <option value={35}>35 kW (School / Factory)</option>
                    <option value={50}>50 kW (Industrial)</option>
                    <option value={100}>100 kW+ (Mega Commercial)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">System Architecture</label>
                  <select
                    value={systemType}
                    onChange={(e) => setSystemType(e.target.value as SystemType)}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="hybrid">Hybrid (Grid + Lithium Battery)</option>
                    <option value="on_grid">On-Grid (Direct Net-Metering)</option>
                    <option value="off_grid">Off-Grid (Pure Storage / Farm)</option>
                  </select>
                </div>
              </div>

              {/* Structure Type & Inverter Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Rooftop Structure</label>
                  <select
                    value={structureType}
                    onChange={(e) => setStructureType(e.target.value as StructureType)}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="elevated_l3">Elevated L3 (Roof Usable / 10-12ft)</option>
                    <option value="standard_l2">Standard L2 (Flush Rooftop Mount)</option>
                    <option value="custom_shed">Custom Industrial Shed</option>
                    <option value="ground_mount">Ground Mounted Structure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Preferred Inverter</label>
                  <select
                    value={inverterBrand}
                    onChange={(e) => setInverterBrand(e.target.value)}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Huawei FusionSolar">Huawei FusionSolar</option>
                    <option value="Livoltek Smart Hybrid">Livoltek Hybrid Cloud</option>
                    <option value="Solis 3-Phase">Solis (Ginlong)</option>
                    <option value="GoodWe Smart ESS">GoodWe</option>
                    <option value="Deye Hybrid 3-Phase">Deye / Solarman</option>
                    <option value="Fronius Austria">Fronius Solar.web</option>
                  </select>
                </div>
              </div>

              {/* Net Metering DisCo */}
              <div className="bg-[#09253d] border border-[#185382] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>DisCo Green Net-Metering Required?</span>
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={netMeteringRequired}
                      onChange={(e) => setNetMeteringRequired(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                  </label>
                </div>

                {netMeteringRequired && (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#134267]">
                    <span className="text-[11px] text-slate-400 shrink-0">Your Electricity DisCo:</span>
                    <select
                      value={discoName}
                      onChange={(e) => setDiscoName(e.target.value)}
                      className="flex-1 bg-[#061929] border border-[#144770] rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="LESCO">LESCO (Lahore &amp; Kasur)</option>
                      <option value="K-Electric">K-Electric (Karachi)</option>
                      <option value="IESCO">IESCO (Islamabad &amp; Rawalpindi)</option>
                      <option value="FESCO">FESCO (Faisalabad)</option>
                      <option value="MEPCO">MEPCO (Multan)</option>
                      <option value="GEPCO">GEPCO (Gujranwala &amp; Sialkot)</option>
                      <option value="PESCO">PESCO (Peshawar)</option>
                      <option value="QESCO">QESCO (Quetta)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Customer Contact Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ahmed Khan"
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Property</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="residential">Residential Villa / House</option>
                    <option value="commercial">Commercial Plaza / Office</option>
                    <option value="industrial">Industrial Shed / Factory</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Site Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot/House number, Street, Phase / Block..."
                  className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Site Notes (اختیاری)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 2nd floor rooftop, overhead water tank, 3-phase connection available..."
                  className="w-full bg-[#09253d] border border-[#185382] rounded-xl p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Estimated Budget Preview */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/30 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-amber-300 font-bold uppercase">Estimated Turnkey EPC Cost</div>
                  <div className="text-base font-black text-white">PKR {estimatedCost.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-300 block">Tier-1 Bifacial + Inverter</span>
                  <span className="text-[10px] text-emerald-400 font-bold">+ Structure &amp; Earthing</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Request Site Survey &amp; Installation</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
