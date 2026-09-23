import React, { useState, useEffect } from 'react';
import {
  Users,
  Check,
  X,
  Wrench,
  Shield,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { Technician } from '../types';

interface MultiTechnicianPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  initialSelectedIds?: string[];
  jobTitle: string;
  jobSubtitle?: string;
  jobCategory?: 'washing' | 'complaint' | 'survey' | 'installation';
  initialNotes?: string;
  onConfirm: (selectedTechIds: string[], selectedTechNames: string[], notes?: string) => void;
}

export const MultiTechnicianPickerModal: React.FC<MultiTechnicianPickerModalProps> = ({
  isOpen,
  onClose,
  technicians,
  initialSelectedIds = [],
  jobTitle,
  jobSubtitle,
  jobCategory = 'washing',
  initialNotes = '',
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedIds);
      setDispatchNotes(initialNotes || '');
    }
  }, [isOpen, initialSelectedIds, initialNotes]);

  if (!isOpen) return null;

  const toggleTech = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === technicians.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(technicians.map((t) => t.id));
    }
  };

  const handleConfirm = () => {
    const selectedTechs = technicians.filter((t) => selectedIds.includes(t.id));
    const names = selectedTechs.map((t) => t.name);
    onConfirm(selectedIds, names, dispatchNotes.trim());
    onClose();
  };

  const getCategoryColor = () => {
    switch (jobCategory) {
      case 'washing':
        return 'from-amber-600 to-amber-700 text-amber-300';
      case 'complaint':
        return 'from-rose-600 to-rose-700 text-rose-300';
      case 'survey':
        return 'from-sky-600 to-sky-700 text-sky-300';
      case 'installation':
        return 'from-emerald-600 to-emerald-700 text-emerald-300';
      default:
        return 'from-slate-800 to-slate-900 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#071f33] border border-[#164b77] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className={`p-4 bg-gradient-to-r ${getCategoryColor()} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white leading-tight">
                  Assign Multiple Technicians
                </h3>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-black/30">
                  Crew Dispatch
                </span>
              </div>
              <p className="text-[11px] opacity-90 truncate max-w-[280px]">
                {jobTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Subtitle / Explanation */}
          <div className="bg-[#0b2840] border border-[#1b5585] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-sky-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-white">Multiple Technicians (ٹیم / عملہ):</span> You can assign 1, 2, or more technicians together for large solar installations, multi-string washing, or complex inverter troubleshooting. Each assigned tech will see this task in their field roster.
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select Staff</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                {selectedIds.length} Selected
              </span>
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-sky-300 hover:text-sky-200 underline underline-offset-2"
            >
              {selectedIds.length === technicians.length ? 'Deselect All' : 'Select All Team'}
            </button>
          </div>

          {/* Technicians List Cards */}
          <div className="space-y-2">
            {technicians.map((tech) => {
              const isSelected = selectedIds.includes(tech.id);
              const isLead = isSelected && selectedIds[0] === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => toggleTech(tech.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    isSelected
                      ? 'bg-[#0e3b5e] border-amber-400/80 shadow-md ring-1 ring-amber-400/40 text-white'
                      : 'bg-[#092237] border-[#154670] hover:bg-[#0c2c47] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox circle */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : 'border border-slate-500 bg-slate-800 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white">
                          {tech.name}
                        </span>
                        {isLead && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">
                            LEAD
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            tech.status === 'available'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {tech.status === 'available' ? 'Available' : 'On Duty'}
                        </span>
                      </div>
                      <div className="text-[10px] text-sky-200 mt-0.5 flex items-center gap-2">
                        <span>{tech.specialty}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {tech.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 justify-end">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{tech.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {tech.activeJobsCount} active job{tech.activeJobsCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dispatch Notes / Instructions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Crew Instructions / Notes (اختیاری)</span>
              <span className="text-[10px] text-slate-400">Tools, safety, address notes</span>
            </label>
            <textarea
              rows={2}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="e.g. Carry 15m pressure hose, safety harnesses, and check DC breaker rating..."
              className="w-full bg-[#061929] border border-[#144770] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#051726] border-t border-[#144770] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-97 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {selectedIds.length === 0
                ? 'Clear Assignment'
                : `Assign ${selectedIds.length} Technician${selectedIds.length > 1 ? 's' : ''} (Confirm)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
