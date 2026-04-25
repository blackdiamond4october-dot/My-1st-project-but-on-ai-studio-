import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Receipt, 
  Package, 
  ClipboardList, 
  Save, 
  RotateCcw,
  Printer,
  Minus,
  Download
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { AppSettings, BillingDocument, DocumentType, LineItem } from '../types';
import DocumentPreview from './DocumentPreview';

interface DocumentFormProps {
  settings: AppSettings;
  onSave: (doc: BillingDocument) => void;
}

export default function DocumentForm({ settings, onSave }: DocumentFormProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = (searchParams.get('type') as DocumentType) || 'bill';

  const [type, setType] = useState<DocumentType>(initialType);

  useEffect(() => {
    const newType = (searchParams.get('type') as DocumentType) || 'bill';
    if (newType !== type) {
      setType(newType);
      // Reset form when type changes via URL
      setCustomer('');
      setPoNo('');
      setDeliveryPeriod('');
      setNotes('');
      // Standardize terms to default when switching types to ensure they are always present
      setTerms(settings.defaultTerms);
      setItems([{ desc: '', qty: 1, price: 0, deliveryPeriod: '' }]);
    }
  }, [searchParams, type, settings.defaultTerms]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customer, setCustomer] = useState('');
  const [poNo, setPoNo] = useState('');
  const [deliveryPeriod, setDeliveryPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(settings.defaultTerms);
  const [showSignature, setShowSignature] = useState(settings.showSignatureByDefault);
  const [items, setItems] = useState<LineItem[]>([{ desc: '', qty: 1, price: 0, deliveryPeriod: '' }]);
  const [previewScale, setPreviewScale] = useState(0.48);
  const [isSaving, setIsSaving] = useState(false);

  const refNo = useMemo(() => {
    let counter, prefix;
    if (type === 'bill') { counter = settings.billCounter; prefix = 'BILL-'; }
    else if (type === 'challan') { counter = settings.challanCounter; prefix = 'CH-'; }
    else { counter = settings.quoteCounter; prefix = 'QT-'; }
    return prefix + String(counter).padStart(4, '0');
  }, [type, settings]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { desc: '', qty: 1, price: 0, deliveryPeriod: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value } as LineItem;
    setItems(newItems);
  };

  const handleSave = () => {
    if (!customer.trim()) {
      alert('Please enter customer name');
      return;
    }

    // [FIX] Invisible Item Bug: Ensure at least one valid item exists
    const validItems = items.filter(item => item.desc.trim());
    if (validItems.length === 0) {
      alert('Please add at least one item description');
      return;
    }

    // [FIX] Document Overrun Warning
    if (validItems.length > 22) {
      const confirmLarge = window.confirm('Your document has more than 22 items, which might not fit on a single page in the print preview. Continue anyway?');
      if (!confirmLarge) return;
    }

    // Validate items
    const invalidItem = items.find(item => item.desc.trim() && item.qty <= 0);
    if (invalidItem) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    const doc: BillingDocument = {
      type,
      refNo,
      date,
      poNo,
      deliveryPeriod,
      customer,
      items,
      terms,
      notes,
      showLogo: true,
      showWatermark: true,
      showSignature,
      currency: settings.currency,
      total: subtotal,
      createdAt: new Date().toISOString()
    };

    onSave(doc);
    setTimeout(() => {
      navigate('/history');
    }, 500);
  };

  const handleReset = () => {
    setCustomer('');
    setPoNo('');
    setDeliveryPeriod('');
    setNotes('');
    setItems([{ desc: '', qty: 1, price: 0, deliveryPeriod: '' }]);
  };

  const formData = {
    type,
    refNo,
    date,
    poNo,
    deliveryPeriod,
    customer,
    items,
    terms,
    notes,
    showLogo: true,
    showWatermark: true,
    showSignature,
    currency: settings.currency,
    total: subtotal,
    address: settings.address,
    phone1: settings.phone1,
    phone2: settings.phone2,
    email: settings.email,
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Form Panel */}
      <div className={cn(
        "border rounded-2xl p-6 lg:p-8 space-y-8 transition-all duration-500 shadow-2xl",
        settings.theme === 'dark' 
          ? "bg-[#1a1a2e] border-white/5 shadow-orange-500/5" 
          : "bg-white border-black/5 shadow-black/5"
      )}>
        <div className="flex items-center justify-between">
          <h2 className={cn("text-xl font-bold flex items-center gap-3", settings.theme === 'dark' ? "text-white" : "text-black")}>
            New <span className="text-orange-500">
              {type === 'bill' ? 'Bill / Invoice' : 
               type === 'challan' ? 'Delivery Challan' : 'Quotation'}
            </span>
          </h2>
        </div>

        <div className={cn("flex flex-wrap gap-1 p-1 rounded-xl border", settings.theme === 'dark' ? "bg-[#07070d] border-white/5" : "bg-gray-100 border-black/5")}>
          <TypeTab active={type === 'bill'} onClick={() => navigate('/new?type=bill')} icon={<Receipt size={16} />} label="Bill" theme={settings.theme} />
          <TypeTab active={type === 'challan'} onClick={() => navigate('/new?type=challan')} icon={<Package size={16} />} label="Challan" theme={settings.theme} />
          <TypeTab active={type === 'quotation'} onClick={() => navigate('/new?type=quotation')} icon={<ClipboardList size={16} />} label="Quotation" theme={settings.theme} />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Ref / Bill No." theme={settings.theme}>
              <div className="relative group">
                <input type="text" value={refNo} readOnly className={cn(
                  "rounded-lg px-4 py-2.5 text-sm cursor-not-allowed w-full outline-none border",
                  settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white/50" : "bg-gray-50 border-black/5 text-black/50"
                )} />
                <div className={cn(
                  "absolute -top-8 left-0 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap",
                  settings.theme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                )}>
                  Auto-increments after save
                </div>
              </div>
            </FormGroup>
            <FormGroup label="Date" theme={settings.theme}>
              <div 
                className="relative cursor-pointer group"
                onClick={() => {
                  const input = document.getElementById('form-date-picker') as HTMLInputElement;
                  input?.showPicker?.();
                }}
              >
                <input 
                  id="form-date-picker"
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  onClick={(e) => e.stopPropagation()}
                  max="9999-12-31"
                  className={cn(
                    "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors border cursor-pointer",
                    settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                  )} 
                />
              </div>
            </FormGroup>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup label="Purchase Order No." theme={settings.theme}>
                <input type="text" value={poNo} onChange={e => setPoNo(e.target.value)} placeholder="PO number (if any)" className={cn(
                  "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors border",
                  settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                )} />
              </FormGroup>
              {type === 'quotation' && (
                <FormGroup label="Delivery Period" theme={settings.theme}>
                  <input type="text" value={deliveryPeriod} onChange={e => setDeliveryPeriod(e.target.value)} placeholder="e.g. 2 weeks" className={cn(
                    "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors border",
                    settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                  )} />
                </FormGroup>
              )}
            </div>

          <FormGroup label="M/S (Party Name)" theme={settings.theme}>
            <input type="text" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Company or individual name" className={cn(
              "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors border",
              settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
            )} />
          </FormGroup>

          {/* Line Items */}
          <div className="space-y-4">
            <div className={cn("text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Line Items</div>
            <div className={cn("border rounded-xl overflow-hidden", settings.theme === 'dark' ? "bg-[#07070d] border-white/5" : "bg-gray-50 border-black/5")}>
              <div className={cn(
                "hidden md:grid gap-px text-[9px] tracking-widest uppercase font-bold p-3", 
                type === 'challan' ? "grid-cols-[1fr_80px_40px]" : 
                type === 'quotation' ? "grid-cols-[1fr_120px_100px_40px]" : 
                "grid-cols-[1fr_80px_100px_100px_40px]",
                settings.theme === 'dark' ? "bg-white/5 text-white/30" : "bg-black/5 text-black/30"
              )}>
                <div>Description</div>
                {type === 'quotation' && <div className="text-center">Delivery Period</div>}
                {type !== 'quotation' && <div className="text-center">Qty</div>}
                {type !== 'challan' && <div className="text-right">Unit Price</div>}
                {type === 'bill' && <div className="text-right">Amount</div>}
                <div></div>
              </div>
              <div className={cn("divide-y", settings.theme === 'dark' ? "divide-white/5" : "divide-black/5")}>
                {items.map((item, i) => (
                  <div key={i} className={cn(
                    "grid gap-2 p-3 md:p-0 md:gap-px items-center",
                    type === 'challan' ? "grid-cols-1 md:grid-cols-[1fr_80px_40px]" : 
                    type === 'quotation' ? "grid-cols-1 md:grid-cols-[1fr_120px_100px_40px]" : 
                    "grid-cols-1 md:grid-cols-[1fr_80px_100px_100px_40px]"
                  )}>
                    <div className="space-y-1 md:space-y-0">
                      <label className="md:hidden text-[8px] font-bold text-orange-500 uppercase">Description</label>
                      <input 
                        type="text" 
                        value={item.desc} 
                        onChange={e => handleItemChange(i, 'desc', e.target.value)}
                        placeholder="Item description"
                        className={cn("bg-transparent md:px-3 py-2 md:py-3 text-xs outline-none focus:bg-orange-500/5 w-full", settings.theme === 'dark' ? "text-white" : "text-black")}
                      />
                    </div>
                    {type === 'quotation' && (
                      <div className="space-y-1 md:space-y-0">
                        <label className="md:hidden text-[8px] font-bold text-orange-500 uppercase">Delivery Period</label>
                        <input 
                          type="text" 
                          value={item.deliveryPeriod || ''} 
                          onChange={e => handleItemChange(i, 'deliveryPeriod', e.target.value)}
                          placeholder="e.g. 2 weeks"
                          className={cn("bg-transparent md:px-3 py-2 md:py-3 text-xs md:text-center outline-none focus:bg-orange-500/5 w-full", settings.theme === 'dark' ? "text-white" : "text-black")}
                        />
                      </div>
                    )}
                    {type !== 'quotation' && (
                      <div className="space-y-1 md:space-y-0">
                        <label className="md:hidden text-[8px] font-bold text-orange-500 uppercase">Qty</label>
                        <input 
                          type="number"
                          value={item.qty} 
                          onChange={e => handleItemChange(i, 'qty', parseFloat(e.target.value) || 1)}
                          className={cn("bg-transparent md:px-3 py-2 md:py-3 text-xs md:text-center outline-none focus:bg-orange-500/5 w-full", settings.theme === 'dark' ? "text-white" : "text-black")}
                        />
                      </div>
                    )}
                    {type !== 'challan' && (
                      <div className="space-y-1 md:space-y-0 relative">
                        <label className="md:hidden text-[8px] font-bold text-orange-500 uppercase">Unit Price</label>
                        <input 
                          type="number" 
                          value={item.price} 
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val <= 100000000) {
                              handleItemChange(i, 'price', val);
                            }
                          }}
                          className={cn(
                            "bg-transparent md:px-3 py-2 md:py-3 text-xs md:text-right outline-none focus:bg-orange-500/5 w-full", 
                            settings.theme === 'dark' ? "text-white" : "text-black"
                          )}
                        />
                      </div>
                    )}
                    {type === 'bill' && (
                      <div className="space-y-1 md:space-y-0">
                        <label className="md:hidden text-[8px] font-bold text-orange-500 uppercase">Amount</label>
                        <div className="md:px-3 py-2 md:py-3 text-xs text-orange-500 font-mono md:text-right">
                          {formatCurrency(item.qty * item.price, settings.currency)}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleRemoveItem(i)}
                        className="p-2 md:p-0 flex items-center justify-center text-red-500/20 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={handleAddItem}
              className={cn(
                "w-full py-3 rounded-xl border border-dashed text-xs font-bold transition-all flex items-center justify-center gap-2",
                settings.theme === 'dark' ? "border-white/10 text-white/40 hover:border-orange-500/50 hover:text-orange-500" : "border-black/10 text-black/40 hover:border-orange-500/50 hover:text-orange-500"
              )}
            >
              <Plus size={14} /> ADD ITEM
            </button>
          </div>

          {/* Totals */}
          {type !== 'challan' && (
            <div className={cn("border rounded-xl p-5 space-y-3", settings.theme === 'dark' ? "bg-[#07070d] border-orange-500/20" : "bg-orange-50 border-orange-500/20")}>
              <div className={cn("flex justify-between text-xs", settings.theme === 'dark' ? "text-white/50" : "text-black/50")}>
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, settings.currency)}</span>
              </div>
              <div className={cn("pt-3 border-t flex justify-between items-center", settings.theme === 'dark' ? "border-white/5" : "border-black/5")}>
                <span className="text-sm font-bold uppercase tracking-wider">Total</span>
                <span className="text-xl font-bold text-orange-500 font-mono drop-shadow-[0_0_8px_rgba(249,115,22,0.3)]">{formatCurrency(subtotal, settings.currency)}</span>
              </div>
            </div>
          )}

          {type === 'quotation' && (
            <FormGroup label="Terms & Conditions" theme={settings.theme}>
              <textarea 
                value={terms} 
                onChange={e => setTerms(e.target.value)}
                rows={4}
                className={cn(
                  "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors resize-none border",
                  settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
                )}
              />
            </FormGroup>
          )}

          <div className="flex items-center gap-6 p-4 rounded-xl border border-dashed border-white/5 bg-white/5">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={showSignature} 
                  onChange={e => setShowSignature(e.target.checked)} 
                />
                <div className={cn(
                  "w-10 h-5 rounded-full transition-all duration-300",
                  showSignature ? "bg-orange-500" : "bg-white/10"
                )}></div>
                <div className={cn(
                  "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all duration-300",
                  showSignature ? "translate-x-5" : "translate-x-0"
                )}></div>
              </div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", settings.theme === 'dark' ? "text-white/60" : "text-black/60")}>Show Authorized Sign</span>
            </label>
          </div>

          <FormGroup label="Notes / Remarks" theme={settings.theme}>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm w-full outline-none focus:border-orange-500 transition-colors resize-none border",
                settings.theme === 'dark' ? "bg-[#07070d] border-white/5 text-white" : "bg-gray-50 border-black/5 text-black"
              )}
            />
          </FormGroup>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex-[4] flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-black font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm",
                isSaving && "opacity-50 cursor-wait pointer-events-none"
              )}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  SAVING...
                </>
              ) : (
                <>
                  <Save size={18} /> GENERATE & SAVE
                </>
              )}
            </button>
            <button 
              onClick={handleReset}
              className={cn(
                "flex-1 flex items-center justify-center rounded-xl border font-bold transition-all",
                settings.theme === 'dark' ? "border-white/5 text-white/50 hover:bg-white/5" : "border-black/5 text-black/50 hover:bg-black/5"
              )}
              title="Reset Form"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="hidden xl:block space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] tracking-[3px] text-white/30 uppercase font-bold">Live Preview</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewScale(s => Math.max(0.2, s - 0.05))} className="p-1.5 rounded bg-white/5 text-white/50 hover:text-white"><Minus size={14} /></button>
            <button onClick={() => setPreviewScale(s => Math.min(1, s + 0.05))} className="p-1.5 rounded bg-white/5 text-white/50 hover:text-white"><Plus size={14} /></button>
          </div>
        </div>

        <div className="bg-[#1a1a2e] border border-white/5 rounded-2xl overflow-hidden sticky top-24">
          <div className="h-[calc(100vh-200px)] overflow-auto p-4 bg-black/20">
            <div 
              style={{ 
                transform: `scale(${previewScale})`, 
                transformOrigin: 'top left',
                width: '794px',
                height: '1123px'
              }}
            >
              <DocumentPreview data={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TypeTab({ active, onClick, icon, label, theme }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, theme: 'dark' | 'light' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
        active 
          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-black shadow-lg shadow-orange-500/20" 
          : theme === 'dark' ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FormGroup({ label, theme, children }: { label: string, theme: 'dark' | 'light', children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className={cn("block text-[10px] tracking-widest uppercase font-bold", theme === 'dark' ? "text-white/40" : "text-black/40")}>{label}</label>
      {children}
    </div>
  );
}
