import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  FileSpreadsheet,
  Calendar,
  User,
  Hash,
  History as HistoryIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { BillingDocument, AppSettings } from '../types';
import { cn, formatCurrency, formatDate } from '../lib/utils';
import DocumentModal from './DocumentModal';

interface DocumentHistoryProps {
  documents: BillingDocument[];
  onDelete: (id: string) => void;
  settings: AppSettings;
}

export default function DocumentHistory({ documents, onDelete, settings }: DocumentHistoryProps) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [exportRange, setExportRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [selectedDoc, setSelectedDoc] = useState<BillingDocument | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.customer.toLowerCase().includes(search.toLowerCase()) ||
      doc.refNo.toLowerCase().includes(search.toLowerCase()) ||
      doc.items.some(item => item.desc.toLowerCase().includes(search.toLowerCase()));
    
    const matchesType = filterType === '' || doc.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getExportDocs = () => {
    const now = new Date();
    return filteredDocs.filter(doc => {
      const docDate = new Date(doc.date);
      if (exportRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return docDate >= weekAgo;
      }
      if (exportRange === 'month') {
        return docDate.getMonth() === now.getMonth() && docDate.getFullYear() === now.getFullYear();
      }
      if (exportRange === 'year') {
        return docDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const handleExportExcel = async () => {
    const docsToExport = getExportDocs();
    if (docsToExport.length === 0) {
      alert('No documents found for the selected range.');
      return;
    }
    setIsExporting(true);
    try {
      // Create a CSV string with proper escaping
      const headers = ["Ref No", "Type", "Date", "Customer", "Total", "Items"];
      const escapeCSV = (val: any) => {
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = docsToExport.map(doc => [
        doc.refNo,
        doc.type,
        doc.date,
        doc.customer,
        doc.total,
        doc.items.map(i => `${i.desc} (x${i.qty})`).join('; ')
      ]);

      const csvContent = [headers, ...rows].map(row => row.map(escapeCSV).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Send to backend for "storage"
      const formData = new FormData();
      formData.append('file', blob, `export-${Date.now()}.csv`);

      const response = await fetch('/api/store-excel', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Trigger browser download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ZA_Precision_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Failed to store export on server');
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2", settings.theme === 'dark' ? "text-white/30" : "text-black/30")} size={18} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={cn(
              "w-full border rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-500 transition-all",
              settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5 text-white" : "bg-white border-black/5 text-black shadow-sm"
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/50" size={14} />
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className={cn(
                "w-full border rounded-xl pl-9 pr-4 py-3 text-sm outline-none appearance-none focus:border-orange-500 transition-all cursor-pointer",
                settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5 text-white" : "bg-white border-black/5 text-black shadow-sm"
              )}
            >
              <option value="">All Types</option>
              <option value="bill">Bills</option>
              <option value="charge">Charges</option>
              <option value="payment">Payments</option>
              <option value="challan">Challans</option>
              <option value="quotation">Quotations</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/50" size={14} />
            <select 
              value={exportRange}
              onChange={e => setExportRange(e.target.value as any)}
              className={cn(
                "w-full border rounded-xl pl-9 pr-4 py-3 text-sm outline-none appearance-none focus:border-orange-500 transition-all cursor-pointer",
                settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5 text-white" : "bg-white border-black/5 text-black shadow-sm"
              )}
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <button 
            onClick={handleExportExcel}
            disabled={isExporting || filteredDocs.length === 0}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[10px] tracking-widest sm:col-span-2 lg:col-span-1",
              settings.theme === 'dark' 
                ? "border-orange-500/20 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10" 
                : "border-orange-500/20 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 shadow-sm"
            )}
          >
            {isExporting ? <span className="loading-spinner h-4 w-4" /> : <FileSpreadsheet size={16} />}
            EXPORT RESULTS
          </button>
        </div>
      </div>

      {/* Table / Card View */}
      <div className="space-y-4">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <div 
                key={doc.id} 
                className={cn(
                  "p-5 rounded-2xl border space-y-4",
                  settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-orange-500/50" />
                    <span className="font-mono text-xs text-orange-500 font-bold">{doc.refNo}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    doc.type === 'bill' ? "bg-orange-500/10 text-orange-500" :
                    doc.type === 'charge' ? "bg-purple-500/10 text-purple-400" :
                    doc.type === 'payment' ? "bg-emerald-500/10 text-emerald-400" :
                    doc.type === 'challan' ? "bg-blue-500/10 text-blue-400" :
                    "bg-gray-500/10 text-gray-400"
                  )}>
                    {doc.type}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User size={14} className={cn(settings.theme === 'dark' ? "text-white/20" : "text-black/20")} />
                    {doc.customer}
                  </div>
                  <div className={cn("flex items-center justify-between text-xs", settings.theme === 'dark' ? "text-white/50" : "text-black/50")}>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {formatDate(doc.date)}
                    </div>
                    <div className="font-mono font-bold text-sm text-white">
                      {doc.type !== 'challan' ? formatCurrency(doc.total, doc.currency) : '—'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => setSelectedDoc(doc)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                      settings.theme === 'dark' ? "bg-white/5 text-white/70" : "bg-black/5 text-black/70"
                    )}
                  >
                    <Eye size={16} /> VIEW
                  </button>
                  <button 
                    onClick={() => onDelete(doc.id!)}
                    className={cn(
                      "px-4 py-2.5 rounded-lg transition-all",
                      settings.theme === 'dark' ? "bg-red-500/10 text-red-500/50 hover:text-red-500" : "bg-red-500/10 text-red-500/50 hover:text-red-500"
                    )}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={cn(
              "p-12 rounded-2xl border border-dashed flex flex-col items-center gap-3",
              settings.theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-black/5 bg-black/[0.02]"
            )}>
              <HistoryIcon size={32} className="opacity-20" />
              <p className="text-xs italic opacity-40">No documents found.</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className={cn(
          "hidden md:block border rounded-2xl overflow-hidden shadow-xl",
          settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5"
        )}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={cn(
                  "text-[10px] tracking-widest uppercase font-bold",
                  settings.theme === 'dark' ? "bg-white/5 text-white/30" : "bg-black/5 text-black/30"
                )}>
                  <th className="px-6 py-4">Ref No.</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Customer / Party</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y", settings.theme === 'dark' ? "divide-white/5" : "divide-black/5")}>
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className={cn("transition-colors group", settings.theme === 'dark' ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Hash size={14} className="text-orange-500/50" />
                          <span className="font-mono text-xs text-orange-500 font-bold">{doc.refNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          doc.type === 'bill' ? "bg-orange-500/10 text-orange-500" :
                          doc.type === 'charge' ? "bg-purple-500/10 text-purple-400" :
                          doc.type === 'payment' ? "bg-emerald-500/10 text-emerald-400" :
                          doc.type === 'challan' ? "bg-blue-500/10 text-blue-400" :
                          "bg-gray-500/10 text-gray-400"
                        )}>
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className={cn(settings.theme === 'dark' ? "text-white/20" : "text-black/20")} />
                          <span className="text-sm font-medium">{doc.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn("flex items-center gap-2 text-xs", settings.theme === 'dark' ? "text-white/50" : "text-black/50")}>
                          <Calendar size={14} />
                          {formatDate(doc.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm">
                        {doc.type !== 'challan' ? formatCurrency(doc.total, doc.currency) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedDoc(doc)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              settings.theme === 'dark' ? "bg-white/5 text-white/50 hover:text-white hover:bg-white/10" : "bg-black/5 text-black/50 hover:text-black hover:bg-black/10"
                            )}
                            title="View Document"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => onDelete(doc.id!)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              settings.theme === 'dark' ? "bg-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10" : "bg-black/5 text-black/20 hover:text-red-500 hover:bg-red-500/10"
                            )}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className={cn("flex flex-col items-center gap-2", settings.theme === 'dark' ? "text-white/20" : "text-black/20")}>
                        <HistoryIcon size={48} strokeWidth={1} />
                        <p className="text-sm italic">No documents found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {selectedDoc && (
        <DocumentModal 
          document={selectedDoc} 
          settings={settings}
          onClose={() => setSelectedDoc(null)} 
        />
      )}
    </div>
  );
}
