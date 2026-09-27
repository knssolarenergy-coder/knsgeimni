import React, { useState, useEffect } from 'react';
import {
  Database,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { NeonDbService, NeonConnectionStatus } from '../services/neonDb';

interface NeonDbMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported?: () => void;
}

type MigrationTarget =
  | 'bookings'
  | 'complaints'
  | 'quotes'
  | 'technicians'
  | 'installations'
  | 'accounts'
  | 'warranties'
  | 'full_bundle';

export const NeonDbMigrationModal: React.FC<NeonDbMigrationModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'import' | 'guide'>('live');
  const [targetTable, setTargetTable] = useState<MigrationTarget>('bookings');
  const [rawInput, setRawInput] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [neonStatus, setNeonStatus] = useState<NeonConnectionStatus>(() => NeonDbService.getStatus());

  useEffect(() => {
    if (!isOpen) return;
    const unsub = NeonDbService.subscribeStatus((st) => {
      setNeonStatus(st);
    });
    // Trigger fresh health check
    NeonDbService.checkHealth().catch(() => {});
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  // Live Sync Handlers
  const handleTestConnection = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await NeonDbService.checkHealth();
      setNeonStatus(res);
      if (res.isConnected) {
        setSyncFeedback({
          type: 'success',
          message: `Cloud Database Connected successfully! Latency: ${res.latencyMs || 80}ms`,
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.error || 'Failed to connect to Cloud Database',
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: e?.message || 'Connection error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await StorageService.initNeonDbSync();
      const updatedStatus = await NeonDbService.checkHealth();
      setNeonStatus(updatedStatus);
      if (onDataImported) onDataImported();
      setSyncFeedback({
        type: 'success',
        message: 'Cloud Database se sara fresh data kamiyabi se sync ho chuka hai!',
      });
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: `Sync error: ${e?.message || 'Failed to pull from Cloud Database'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const bookings = StorageService.getBookings();
      const complaints = StorageService.getComplaints();
      const quotes = StorageService.getQuotes();
      const accounts = StorageService.getAccounts();
      const sites = StorageService.getWorkingSites();
      const attendance = StorageService.getAttendanceRecords();
      const warranties = StorageService.getWarranties();
      const settings = StorageService.getSettings();

      const res = await NeonDbService.pushAllLocalData({
        bookings,
        complaints,
        quotes,
        accounts,
        sites,
        attendance,
        warranties,
        settings,
      });

      const updatedStatus = await NeonDbService.checkHealth();
      setNeonStatus(updatedStatus);
      setSyncFeedback({
        type: 'success',
        message: res.message || 'Sara local data Cloud Database me kamiyabi se sync ho chuka hai!',
      });
    } catch (e: any) {
      setSyncFeedback({
        type: 'error',
        message: `Sync error: ${e?.message || 'Failed to push to Cloud Database'}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Smart parser for JSON
  const handleParseData = (text: string) => {
    setParseError(null);
    setParsedPreview(null);
    setSyncFeedback(null);

    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          setParsedPreview(json);
        } else if (typeof json === 'object') {
          if (json.bookings || json.complaints || json.quotes || json.accounts || json.warranties) {
            setTargetTable('full_bundle');
            setParsedPreview([json]);
          } else {
            setParsedPreview([json]);
          }
        }
        return;
      }
      setParseError('Invalid format. Please paste a valid JSON array or object.');
    } catch (e: any) {
      setParseError(`JSON Parse error: ${e.message || 'Please check syntax'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#041525] via-[#092b45] to-[#041525] text-white p-4 shrink-0 flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Cloud Database Manager</h3>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Central SQL Database · Active Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition active:scale-95 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 border-b border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'live'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Live Sync &amp; Status</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>JSON Import</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Database Guide</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* ======================================================== */}
          {/* TAB 1: LIVE SYNC & REALTIME DATABASE STATUS              */}
          {/* ======================================================== */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              {/* Connection Status Card */}
              <div className="bg-gradient-to-br from-indigo-950 via-[#071d2e] to-slate-900 text-white rounded-2xl p-4 border border-indigo-800/40 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
                    <span className="font-extrabold text-sm text-emerald-300">
                      Cloud Database Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {neonStatus.latencyMs && (
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                        ⚡ {neonStatus.latencyMs}ms
                      </span>
                    )}
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      PostgreSQL
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 font-mono break-all bg-black/30 p-2 rounded-xl border border-white/10 mb-3">
                  postgresql://cloud_db_owner:***@central-pooler.aws.kssolar/database
                </p>

                {/* Roman Urdu Explanation */}
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/10 text-[11px] text-slate-200 space-y-1">
                  <p className="font-bold text-amber-300">
                    ✅ Aapka Central Cloud Database is app ke sath DIRECT connect ho chuka hai!
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    Koi alag se transfer karne ki zaroorat nahi hai. Nayi bookings, complaints, attendance aur users seedha aapke isi Central Cloud database me sync hotay rahenge.
                  </p>
                </div>
              </div>

              {/* Feedback Alert */}
              {syncFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                    syncFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {syncFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{syncFeedback.message}</span>
                </div>
              )}

              {/* Real-Time Table Row Counts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Database Tables (Central Cloud)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Last Checked: {neonStatus.lastSyncTime || 'Just now'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.users}</p>
                    <p className="text-[10px] font-bold text-slate-500">Users &amp; Techs</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.bookings}</p>
                    <p className="text-[10px] font-bold text-slate-500">Bookings</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.complaints}</p>
                    <p className="text-[10px] font-bold text-slate-500">Complaints</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.quotes}</p>
                    <p className="text-[10px] font-bold text-slate-500">Quotes / Visits</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.sites}</p>
                    <p className="text-[10px] font-bold text-slate-500">Working Sites</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.attendance}</p>
                    <p className="text-[10px] font-bold text-slate-500">Attendance Pings</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.warranties}</p>
                    <p className="text-[10px] font-bold text-slate-500">Warranties</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                    <p className="text-base font-black text-slate-900">{neonStatus.rowCounts.settings}</p>
                    <p className="text-[10px] font-bold text-slate-500">Settings</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePullFromCloud}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-extrabold flex items-center justify-center gap-2 active:scale-95 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isSyncing ? 'Syncing...' : 'Sync from Cloud (Pull)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushToCloud}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold flex items-center justify-center gap-2 active:scale-95 transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isSyncing ? 'Uploading...' : 'Push Local Data to Cloud'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isSyncing}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Test Database Connection</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MANUAL JSON IMPORT                                */}
          {/* ======================================================== */}
          {activeTab === 'import' && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Direct JSON Backup Fallback</span>
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Agar aapke paas database ka koi alag JSON backup hai to aap use yahan paste karke directly import kar sakte hain.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Table:</label>
                <select
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                >
                  <option value="bookings">Bookings (Washing Orders)</option>
                  <option value="complaints">Complaints</option>
                  <option value="quotes">Quotes &amp; Surveys</option>
                  <option value="accounts">User Accounts &amp; Techs</option>
                  <option value="warranties">Customer Warranties</option>
                  <option value="full_bundle">Full Multi-Table Bundle</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">JSON Data:</label>
                <textarea
                  value={rawInput}
                  onChange={(e) => {
                    setRawInput(e.target.value);
                    handleParseData(e.target.value);
                  }}
                  placeholder="Paste JSON array or object here..."
                  className="w-full h-36 font-mono text-[11px] p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {parseError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                  {parseError}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: DATABASE GUIDE                                    */}
          {/* ======================================================== */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <h4 className="font-extrabold text-slate-900 mb-1">How Central Cloud Sync Works</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Aapki app high-speed secure serverless HTTP driver ke zariye direct Central Cloud Database ke sath link hai. Koi extra setup ki zaroorat nahi hai.
                </p>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] space-y-1">
                <p className="text-slate-400">// Direct SQL query format used by this app:</p>
                <p className="text-emerald-400">SELECT * FROM bookings ORDER BY created_at DESC;</p>
                <p className="text-emerald-400">SELECT * FROM users WHERE role = 'admin';</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div>
                  <h5 className="font-bold text-indigo-950">Cloud Sync Status</h5>
                  <p className="text-[11px] text-indigo-800">Direct Live Replication Active</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Status: <span className="font-bold text-emerald-600">Live Active</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs active:scale-95 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
