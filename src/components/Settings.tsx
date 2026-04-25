import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings2, 
  Database, 
  Info, 
  Save, 
  Download, 
  Upload, 
  Trash2,
  CheckCircle2,
  Moon,
  Sun,
  Cloud,
  Phone,
  Mail,
  Bot,
  Mic,
  Volume2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, BillingDocument } from '../types';
import { cn } from '../lib/utils';

interface SettingsProps {
  settings: AppSettings;
  documents: BillingDocument[];
  onSave: (settings: AppSettings) => void;
  onImport: (docs: BillingDocument[], settings: AppSettings) => void;
  onClear: () => void;
  onConnectDrive: () => void;
  driveToken: string | null;
  isConnectingDrive?: boolean;
}

export default function Settings({ settings, documents, onSave, onImport, onClear, onConnectDrive, driveToken, isConnectingDrive }: SettingsProps) {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeletionRequested, setIsDeletionRequested] = useState(false);
  const [isDeletionConfirmed, setIsDeletionConfirmed] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isDeletionRequested && !isDeletionConfirmed) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/check-deletion-status');
          const data = await res.json();
          if (data.confirmed) {
            setIsDeletionConfirmed(true);
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isDeletionRequested, isDeletionConfirmed]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBoostCounters = () => {
    const nextSettings = {
      ...formData,
      billCounter: formData.billCounter + 1,
      challanCounter: formData.challanCounter + 1,
      quoteCounter: formData.quoteCounter + 1
    };
    setFormData(nextSettings);
    onSave(nextSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportBackup = () => {
    const data = {
      settings: formData,
      documents: documents,
      version: '2.0',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `za_precision_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.settings && data.documents) {
          onImport(data.documents, data.settings);
        }
      } catch (err) {
        console.error('Error reading backup file.', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Company Info */}
        <div className={cn(
          "border rounded-2xl p-6 space-y-6 transition-all duration-500",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
        )}>
          <div className="flex items-center gap-3 text-orange-500">
            <Building2 size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Company Information</h3>
          </div>
          
          <div className="space-y-4">
            <SettingInput label="Company Name" value={formData.companyName} theme={settings.theme} onChange={v => handleChange('companyName', v)} />
            <SettingInput label="Address" value={formData.address} theme={settings.theme} onChange={v => handleChange('address', v)} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={cn("block text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Phone 1</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500">+92</span>
                  <input 
                    type="text" 
                    value={formData.phone1.replace('+92 ', '')} 
                    onChange={e => handleChange('phone1', '+92 ' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={cn(
                      "w-full border rounded-lg pl-12 pr-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-all",
                      settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={cn("block text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Phone 2</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500">+92</span>
                  <input 
                    type="text" 
                    value={formData.phone2.replace('+92 ', '')} 
                    onChange={e => handleChange('phone2', '+92 ' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={cn(
                      "w-full border rounded-lg pl-12 pr-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-all",
                      settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                    )}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={cn("block text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Company Email</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.email.split('@')[0]} 
                  onChange={e => handleChange('email', e.target.value.replace(/[^a-zA-Z0-9._-]/g, '') + '@gmail.com')}
                  className={cn(
                    "w-full border rounded-lg pl-4 pr-24 py-2.5 text-sm outline-none focus:border-orange-500 transition-all",
                    settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500">@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance & Preferences */}
        <div className={cn(
          "border rounded-2xl p-6 space-y-6 transition-all duration-500",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
        )}>
          <div className="flex items-center gap-3 text-orange-500">
            <Settings2 size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Appearance & Preferences</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>System Theme</label>
              <div className={cn("flex p-1 rounded-xl border", settings.theme === 'dark' ? "bg-[#07070d] border-white/5" : "bg-gray-100 border-black/5")}>
                <button 
                  onClick={() => handleChange('theme', 'dark')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                    formData.theme === 'dark' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : cn(settings.theme === 'dark' ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70")
                  )}
                >
                  <Moon size={14} /> DARK
                </button>
                <button 
                  onClick={() => handleChange('theme', 'light')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                    formData.theme === 'light' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : cn(settings.theme === 'dark' ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70")
                  )}
                >
                  <Sun size={14} /> LIGHT
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Currency</label>
              <select 
                value={formData.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className={cn(
                  "w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-all",
                  settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                )}
              >
                <option value="Rs.">Rs. (Pakistani Rupee)</option>
                <option value="PKR">PKR</option>
                <option value="$">USD $</option>
                <option value="€">EUR €</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className={cn("text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Default Terms & Conditions</label>
              <textarea 
                value={formData.defaultTerms}
                onChange={e => handleChange('defaultTerms', e.target.value)}
                rows={4}
                className={cn(
                  "w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-all resize-none",
                  settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                )}
              />
            </div>
          </div>
        </div>

        {/* Document Counters */}
        <div className={cn(
          "border rounded-2xl p-6 space-y-6 transition-all duration-500",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-orange-500">
              <Database size={20} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Document Counters</h3>
            </div>
            <div className="text-[10px] text-orange-500/50 font-bold uppercase tracking-widest">Auto-Incrementing</div>
          </div>

          <p className={cn("text-[11px] leading-relaxed", settings.theme === 'dark' ? "text-white/40" : "text-black/40")}>
            Set the starting number for your documents. These will automatically increase by 1 each time you save a new document.
          </p>

          <div className="space-y-4">
            <SettingInput label="Bill Starting No." type="number" theme={settings.theme} value={formData.billCounter} onChange={v => handleChange('billCounter', parseInt(v) || 1)} />
            <SettingInput label="Challan Starting No." type="number" theme={settings.theme} value={formData.challanCounter} onChange={v => handleChange('challanCounter', parseInt(v) || 1)} />
            <SettingInput label="Quotation Starting No." type="number" theme={settings.theme} value={formData.quoteCounter} onChange={v => handleChange('quoteCounter', parseInt(v) || 1)} />
            
            <button 
              onClick={() => {
                const boost = 100;
                handleChange('billCounter', formData.billCounter + boost);
                handleChange('challanCounter', formData.challanCounter + boost);
                handleChange('quoteCounter', formData.quoteCounter + boost);
                alert(`All counters boosted by ${boost}!`);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-bold hover:bg-orange-500/20 transition-all border border-orange-500/20"
            >
              <Zap size={14} /> BOOST ALL COUNTERS (+100)
            </button>
          </div>
        </div>

        {/* Cloud & Backup */}
        <div className={cn(
          "border rounded-2xl p-6 space-y-6 transition-all duration-500",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
        )}>
          <div className="flex items-center gap-3 text-orange-500">
            <Cloud size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Cloud & Backup</h3>
          </div>

          <div className="space-y-4">
            <SettingInput label="Backup Email (All users data)" value={formData.backupEmail} theme={settings.theme} onChange={v => handleChange('backupEmail', v)} />
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-white/5 bg-white/5">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Global Signature Setting</span>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={formData.showSignatureByDefault} 
                    onChange={e => handleChange('showSignatureByDefault', e.target.checked)} 
                  />
                  <div className={cn(
                    "w-10 h-5 rounded-full transition-all duration-300",
                    formData.showSignatureByDefault ? "bg-orange-500" : "bg-white/10"
                  )}></div>
                  <div className={cn(
                    "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                    formData.showSignatureByDefault ? "translate-x-5" : "translate-x-0"
                  )}></div>
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", settings.theme === 'dark' ? "text-white/60" : "text-black/60")}>Show on all Docs by default</span>
              </label>
            </div>

            <button 
              onClick={onConnectDrive}
              disabled={isConnectingDrive}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                driveToken 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                  : "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]",
                isConnectingDrive && "opacity-50 cursor-wait"
              )}
            >
              {isConnectingDrive ? (
                <span className="loading-spinner h-4 w-4 border-2 border-white/30 border-t-white" />
              ) : driveToken ? (
                <CheckCircle2 size={16} />
              ) : (
                <Cloud size={16} />
              )}
              {isConnectingDrive ? 'CONNECTING...' : driveToken ? 'GOOGLE DRIVE CONNECTED' : 'CONNECT GOOGLE DRIVE'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExportBackup}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all border",
                  settings.theme === 'dark' ? "bg-white/5 border-white/5 text-white/70 hover:bg-white/10" : "bg-gray-50 border-black/5 text-black/70 hover:bg-gray-100"
                )}
              >
                <Download size={14} /> EXPORT BACKUP
              </button>
              
              <label className={cn(
                "flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all cursor-pointer border",
                settings.theme === 'dark' ? "bg-white/5 border-white/5 text-white/70 hover:bg-white/10" : "bg-gray-50 border-black/5 text-black/70 hover:bg-gray-100"
              )}>
                <Upload size={14} /> IMPORT BACKUP
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            <button 
              onClick={() => {
                const finalSurety = prompt("CRITICAL SECURITY CHECK: Type 'DELETE' to confirm complete system reset and remove all local data.");
                if (finalSurety && finalSurety.toUpperCase() === 'DELETE') {
                  onClear();
                  localStorage.clear();
                  window.location.reload();
                } else if (finalSurety !== null) {
                  alert("Deletion cancelled. Confirmation text did not match.");
                }
              }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95"
              )}
            >
              <Trash2 size={14} /> 
              DELETE ALL LOCAL DATA
            </button>
          </div>
        </div>

        {/* About */}
        <div className={cn(
          "border rounded-2xl p-6 space-y-6 transition-all duration-500",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
        )}>
          <div className="flex items-center gap-3 text-orange-500">
            <Info size={20} />
            <h3 className="text-sm font-bold uppercase tracking-widest">About Developer</h3>
          </div>

          <div className={cn("space-y-6 text-xs leading-relaxed", settings.theme === 'dark' ? "text-white/50" : "text-black/50")}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-orange-500/20">
                MK
              </div>
              <div>
                <h4 className={cn("text-lg font-black tracking-tight", settings.theme === 'dark' ? "text-white" : "text-black")}>Muhammad Khurram Abbas</h4>
                <p className="text-orange-500 font-bold tracking-widest uppercase text-[10px]">Lead Software Engineer</p>
              </div>
            </div>

            <div className="space-y-3">
              <p>
                I am <span className={cn("font-bold", settings.theme === 'dark' ? "text-white" : "text-black")}>Muhammad Khurram Abbas</span>, a dedicated software developer committed to delivering high-precision engineering solutions. My focus is on building robust, scalable, and user-centric applications that empower businesses to operate with maximum efficiency.
              </p>
              <p>
                This Billing System is a testament to my commitment to quality and professional excellence. I specialize in full-stack development, ensuring every line of code serves a purpose and every interface provides a seamless experience.
              </p>
            </div>

            <div className={cn("p-4 rounded-xl border space-y-3", settings.theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-black/5")}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Phone size={14} />
                </div>
                <div>
                  <div className={cn("text-[10px] font-bold uppercase opacity-50", settings.theme === 'dark' ? "text-white" : "text-black")}>Direct Contact</div>
                  <div className={cn("font-mono font-bold", settings.theme === 'dark' ? "text-white" : "text-black")}>03034008573</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Mail size={14} />
                </div>
                <div>
                  <div className={cn("text-[10px] font-bold uppercase opacity-50", settings.theme === 'dark' ? "text-white" : "text-black")}>Professional Email</div>
                  <div className={cn("font-mono font-bold", settings.theme === 'dark' ? "text-white" : "text-black")}>blackdiamond40ctober@gmail.com</div>
                </div>
              </div>
            </div>

            <p className="italic text-[10px] opacity-40 text-center">
              "Precision in Code, Excellence in Service."
            </p>
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] w-full max-w-md px-6 z-40">
        <button 
          onClick={handleSave}
          className={cn(
            "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold shadow-2xl transition-all transform active:scale-95",
            isSaved 
              ? "bg-emerald-500 text-black" 
              : "bg-orange-500 text-black hover:bg-orange-600 shadow-orange-500/20"
          )}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={20} /> SETTINGS SAVED
            </>
          ) : (
            <>
              <Save size={20} /> SAVE ALL SETTINGS
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function SettingInput({ label, value, onChange, theme, type = "text" }: { label: string, value: string | number | boolean, onChange: (v: string) => void, theme: 'dark' | 'light', type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className={cn("block text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "text-white/30" : "text-black/30")}>{label}</label>
      <input 
        type={type} 
        value={String(value ?? '')} 
        onChange={e => onChange(e.target.value)}
        className={cn(
          "w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-500 transition-all",
          theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
        )}
      />
    </div>
  );
}
