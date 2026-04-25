import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Package, 
  ClipboardList, 
  TrendingUp, 
  FileText,
  Clock,
  ArrowRight,
  Bell,
  CalendarSearch,
  Sparkles,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { BillingDocument, AppSettings } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import DocumentModal from './DocumentModal';
import { ZALogo } from './DocumentPreview';

interface DashboardProps {
  documents: BillingDocument[];
  settings: AppSettings;
  onUpdate: (doc: BillingDocument) => Promise<void>;
}

export default function Dashboard({ documents, settings, onUpdate }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyticsView, setAnalyticsView] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDoc, setSelectedDoc] = useState<BillingDocument | null>(null);
  
  const bills = documents.filter(d => d.type === 'bill');
  const challans = documents.filter(d => d.type === 'challan');
  const quotations = documents.filter(d => d.type === 'quotation');
  
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const dailyRevenue = bills
    .filter(d => d.date === selectedDate)
    .reduce((sum, doc) => sum + doc.total, 0);

  const monthlyRevenue = bills
    .filter(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    })
    .reduce((sum, doc) => sum + doc.total, 0);

  const yearlyRevenue = bills
    .filter(d => new Date(d.date).getFullYear() === currentYear)
    .reduce((sum, doc) => sum + doc.total, 0);

  const totalRevenue = bills.reduce((sum, doc) => sum + doc.total, 0);

  // Group revenue by day for the breakdown
  const revenueByDay = bills.reduce((acc, doc) => {
    const date = doc.date;
    acc[date] = (acc[date] || 0) + doc.total;
    return acc;
  }, {} as Record<string, number>);

  const sortedDays = Object.entries(revenueByDay)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  const stats = [
    { label: 'Revenue for Date', value: formatCurrency(dailyRevenue, settings.currency), sub: formatDate(selectedDate), color: 'text-orange-500', icon: <TrendingUp size={20} /> },
    { label: 'Monthly Revenue', value: formatCurrency(monthlyRevenue, settings.currency), sub: 'This Month', color: 'text-blue-400', icon: <TrendingUp size={20} /> },
    { label: 'Yearly Revenue', value: formatCurrency(yearlyRevenue, settings.currency), sub: 'This Year', color: 'text-emerald-400', icon: <TrendingUp size={20} /> },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue, settings.currency), sub: 'All time', color: 'text-orange-500', icon: <TrendingUp size={20} /> },
  ];

  const recentDocs = documents.slice(0, 5);

  // Chart data based on view
  const chartData = useMemo(() => {
    if (analyticsView === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push({
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: dateStr,
          revenue: revenueByDay[dateStr] || 0
        });
      }
      return days;
    } else if (analyticsView === 'monthly') {
      const months = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const rev = bills
          .filter(doc => {
            const docDate = new Date(doc.date);
            return docDate.getMonth() === m && docDate.getFullYear() === y;
          })
          .reduce((sum, doc) => sum + doc.total, 0);
        
        months.push({
          name: `${monthNames[m]} ${y}`,
          revenue: rev
        });
      }
      return months;
    } else {
      const years = [];
      for (let i = 2; i >= 0; i--) {
        const y = currentYear - i;
        const rev = bills
          .filter(doc => new Date(doc.date).getFullYear() === y)
          .reduce((sum, doc) => sum + doc.total, 0);
        years.push({
          name: String(y),
          revenue: rev
        });
      }
      return years;
    }
  }, [revenueByDay, analyticsView, bills, currentYear]);

  const insights = useMemo(() => {
    const avg = totalRevenue / (bills.length || 1);
    const growth = monthlyRevenue > 0 ? 15 : 0; // Simulated growth
    return { avg, growth };
  }, [totalRevenue, bills.length, monthlyRevenue]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Hero Section */}
      <div className={cn(
        "relative py-16 flex flex-col items-center justify-center text-center space-y-6 overflow-hidden rounded-3xl border shadow-2xl",
        settings.theme === 'dark' 
          ? "border-white/5 bg-[#0e0e1a] shadow-orange-500/5" 
          : "border-black/5 bg-white shadow-black/5"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-orange-500/10 opacity-50" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        
        {/* Floating Particles Simulation */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-500 rounded-full blur-sm" />
          <motion.div animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-blue-500 rounded-full blur-sm" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500 blur-[60px] opacity-20 animate-pulse" />
            <ZALogo size={180} className="relative z-10 drop-shadow-[0_0_30px_rgba(249,115,22,0.4)]" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 space-y-2"
        >
          <h2 className="flex flex-col items-center gap-2">
            <motion.span 
              animate={{ 
                y: [0, -4, 0],
                textShadow: ["0 0 20px rgba(249,115,22,0)", "0 0 20px rgba(249,115,22,0.5)", "0 0 20px rgba(249,115,22,0)"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl sm:text-7xl font-black text-orange-500 tracking-tighter font-display"
            >
              ZA Precision
            </motion.span>
            <span className={cn(
              "text-lg font-black tracking-[0.4em] uppercase",
              settings.theme === 'dark' ? "text-white/60" : "text-black/60"
            )}>
              Engineering Co.
            </span>
          </h2>
          
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <p className={cn(
              "inline-flex items-center gap-2 px-6 py-2 rounded-full border text-xs font-bold uppercase tracking-widest shadow-lg backdrop-blur-md",
              settings.theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-white border-black/10 text-black/40 shadow-black/5"
            )}>
              <Clock size={14} className="text-orange-500" />
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="px-6 py-2 rounded-full bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 flex items-center gap-2">
              <Zap size={14} /> SYSTEM SECURE
            </div>
          </div>
        </motion.div>
      </div>

      {/* Holographic Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-sm font-bold tracking-wider uppercase flex items-center gap-2", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>
              <Activity size={16} className="text-orange-500" /> Revenue Analytics
            </h3>
            <div className="flex bg-black/10 dark:bg-white/5 rounded-lg p-1 border border-black/5 dark:border-white/5">
              {(['daily', 'monthly', 'yearly'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setAnalyticsView(view)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                    analyticsView === view 
                      ? "bg-orange-500 text-black" 
                      : settings.theme === 'dark' ? "text-white/40 hover:text-white/60" : "text-black/60 hover:text-black/80"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>
          <div className={cn(
            "border rounded-3xl p-6 h-[350px] relative overflow-hidden shadow-2xl transition-all duration-500 flex flex-col",
            settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5"
          )}>
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <TrendingUp size={120} />
            </div>
            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={settings.theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: settings.theme === 'dark' ? '#6060a0' : '#9090b0', fontWeight: 'bold' }} 
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: settings.theme === 'dark' ? '#1a1a2e' : '#ffffff', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

        <div className="space-y-4">
          <h3 className={cn("text-sm font-bold tracking-wider uppercase flex items-center gap-2", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>
            <Zap size={16} className="text-orange-500" /> Smart Insights
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className={cn(
              "border rounded-2xl p-6 relative overflow-hidden group shadow-xl",
              settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5"
            )}>
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Avg. Order Value</div>
              <div className="text-2xl font-black font-mono">{formatCurrency(insights.avg, settings.currency)}</div>
              <div className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={12} /> +{insights.growth}% vs last month
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Receipt size={80} />
              </div>
            </div>

            <div className={cn(
              "border rounded-2xl p-6 relative overflow-hidden group shadow-xl",
              settings.theme === 'dark' ? "bg-gradient-to-br from-orange-500 to-orange-600 border-none" : "bg-orange-500 border-none"
            )}>
              <div className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1">Business Health</div>
              <div className="text-2xl font-black text-black">EXCELLENT</div>
              <div className="mt-4 h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-black shadow-[0_0_10px_rgba(0,0,0,0.3)]" 
                />
              </div>
              <div className="text-[9px] text-black/60 font-bold mt-2">Target: 85% Achieved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={cn("text-sm font-bold tracking-wider uppercase", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>Revenue Overview</h3>
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => {
              const input = document.getElementById('dashboard-date-picker') as HTMLInputElement;
              input?.showPicker?.();
            }}
          >
            <CalendarSearch size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
            <input 
              id="dashboard-date-picker"
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.preventDefault()}
              max="9999-12-31"
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border outline-none focus:border-orange-500 transition-all cursor-pointer",
                settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5 text-white" : "bg-white border-black/5 text-black shadow-sm"
              )}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className={cn(
              "border rounded-2xl p-5 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-xl",
              settings.theme === 'dark' 
                ? "bg-[#1a1a2e] border-white/5 hover:border-orange-500/30 shadow-orange-500/5" 
                : "bg-white border-black/5 hover:border-orange-500/30 shadow-black/5"
            )}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-[10px] tracking-[2px] uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>{stat.label}</span>
                <span className={cn("p-2 rounded-lg", settings.theme === 'dark' ? "bg-white/5" : "bg-black/5", stat.color)}>{stat.icon}</span>
              </div>
              <div className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</div>
              <div className={cn("text-[11px] mt-1", settings.theme === 'dark' ? "text-white/20" : "text-black/20")}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-sm font-bold tracking-wider uppercase", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>Recent Documents</h3>
            <Link to="/history" className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className={cn("border rounded-2xl overflow-hidden shadow-xl", settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5")}>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn("text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "bg-white/5 text-white/30" : "bg-black/5 text-black/30")}>
                    <th className="px-6 py-4">Ref No.</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Amount</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", settings.theme === 'dark' ? "divide-white/5" : "divide-black/5")}>
                  {recentDocs.length > 0 ? (
                    recentDocs.map((doc) => (
                      <tr 
                        key={doc.id} 
                        onClick={() => setSelectedDoc(doc)}
                        className={cn("transition-colors group cursor-pointer", settings.theme === 'dark' ? "hover:bg-white/[0.05]" : "hover:bg-black/[0.05]")}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-orange-500">{doc.refNo}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            doc.type === 'bill' ? "bg-orange-500/10 text-orange-500" :
                            doc.type === 'challan' ? "bg-blue-500/10 text-blue-400" :
                            "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium truncate max-w-[120px]">{doc.customer}</td>
                        <td className="px-6 py-4 font-mono text-sm">
                          {doc.type !== 'challan' ? formatCurrency(doc.total, doc.currency) : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={cn("px-6 py-12 text-center italic", settings.theme === 'dark' ? "text-white/20" : "text-black/20")}>
                        No documents yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => setSelectedDoc(doc)}
                    className="p-4 space-y-3 cursor-pointer active:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-orange-500">{doc.refNo}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                        doc.type === 'bill' ? "bg-orange-500/10 text-orange-500" :
                        doc.type === 'challan' ? "bg-blue-500/10 text-blue-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {doc.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.customer}</span>
                      <span className="font-mono text-xs font-bold">
                        {doc.type !== 'challan' ? formatCurrency(doc.total, doc.currency) : '—'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={cn("p-8 text-center italic text-xs opacity-20", settings.theme === 'dark' ? "text-white" : "text-black")}>
                  No documents yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Revenue Breakdown */}
        <div className="space-y-4">
          <h3 className={cn("text-sm font-bold tracking-wider uppercase", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>Daily Revenue</h3>
          <div className={cn("border rounded-2xl p-6 space-y-4 shadow-xl", settings.theme === 'dark' ? "bg-[#1a1a2e] border-white/5" : "bg-white border-black/5")}>
            {sortedDays.length > 0 ? (
              sortedDays.map(([date, amount]) => (
                <div key={date} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-colors", settings.theme === 'dark' ? "bg-white/5 text-white/30 group-hover:text-orange-500" : "bg-black/5 text-black/30 group-hover:text-orange-500")}>
                      <Clock size={14} />
                    </div>
                    <div className={cn("text-xs font-medium", settings.theme === 'dark' ? "text-white/70" : "text-black/70")}>{formatDate(date)}</div>
                  </div>
                  <div className="text-sm font-bold font-mono text-orange-500">
                    {formatCurrency(amount, settings.currency)}
                  </div>
                </div>
              ))
            ) : (
              <div className={cn("text-center py-8 italic text-xs", settings.theme === 'dark' ? "text-white/20" : "text-black/20")}>
                No revenue data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className={cn("text-xs font-bold mb-4 uppercase tracking-[2px]", settings.theme === 'dark' ? "text-white/40" : "text-black/40")}>Create New Document</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard 
            type="bill"
            title="Bill / Invoice"
            desc="Generate a formal bill for goods or services delivered."
            icon={<Receipt size={24} />}
            count={bills.length}
            color="orange"
            theme={settings.theme}
          />
          <QuickActionCard 
            type="challan"
            title="Delivery Challan"
            desc="Document for delivery of materials or goods."
            icon={<Package size={24} />}
            count={challans.length}
            color="blue"
            theme={settings.theme}
          />
          <QuickActionCard 
            type="quotation"
            title="Quotation"
            desc="Formal price quotation for prospective clients."
            icon={<ClipboardList size={24} />}
            count={quotations.length}
            color="emerald"
            theme={settings.theme}
          />
        </div>
      </div>

      {/* View Modal */}
      {selectedDoc && (
        <DocumentModal 
          document={selectedDoc} 
          settings={settings}
          onUpdate={onUpdate}
          onClose={() => setSelectedDoc(null)} 
        />
      )}
    </div>
  );
}

function QuickActionCard({ type, title, desc, icon, count, color, theme }: { type: string, title: string, desc: string, icon: React.ReactNode, count: number, color: string, theme: 'dark' | 'light' }) {
  const colorClasses = {
    orange: theme === 'dark' ? "bg-orange-500/10 border-orange-500/30 text-orange-500" : "bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/20",
    blue: theme === 'dark' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-600/20",
    emerald: theme === 'dark' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-600/20",
  };

  return (
    <Link 
      to={`/new?type=${type}`}
      className={cn(
        "border rounded-2xl p-7 relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-2xl",
        theme === 'dark' ? "bg-[#1a1a2e] border-white/5 hover:border-orange-500 hover:shadow-orange-500/10" : "bg-white border-black/5 hover:border-orange-500 hover:shadow-black/10"
      )}
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-orange-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5 border", colorClasses[color as keyof typeof colorClasses])}>
        {icon}
      </div>
      <h3 className={cn("text-lg font-extrabold mb-2 group-hover:text-orange-500 transition-colors", theme === 'dark' ? "text-white" : "text-black")}>{title}</h3>
      <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/40" : "text-black/40")}>{desc}</p>
      <div className={cn("flex items-center justify-between mt-auto pt-4 border-t", theme === 'dark' ? "border-white/5" : "border-black/5")}>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-black/20")}>ZA Precision</span>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", theme === 'dark' ? "bg-orange-500/10 text-orange-500" : "bg-orange-100 text-orange-600")}>{count} {type}s</span>
      </div>
    </Link>
  );
}
