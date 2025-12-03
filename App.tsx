import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingDown, 
  PiggyBank, 
  Plus,
  PieChart as PieIcon,
  FileText,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { ExpenseItem, CategoryType } from './types';
import { CHART_COLORS } from './constants';
import { StatCard } from './components/StatCard';
import { ExpensesTable } from './components/ExpensesTable';

// --- Toast Component ---
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 duration-300 ${
      type === 'success' ? 'bg-slate-800 text-white' : 'bg-rose-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-white" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // Initialize state from Local Storage
  const [items, setItems] = useState<ExpenseItem[]>(() => {
    try {
      const savedItems = localStorage.getItem('budget_items');
      return savedItems ? JSON.parse(savedItems) : [];
    } catch (error) {
      console.error('Failed to load items', error);
      return [];
    }
  });

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('budget_items', JSON.stringify(items));
  }, [items]);

  const [activeTab, setActiveTab] = useState<CategoryType | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Delete Confirmation State
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Month State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<CategoryType>(CategoryType.FIXED);
  const [formIsIncome, setFormIsIncome] = useState(false);
  const [formDate, setFormDate] = useState('');

  // Helpers
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const formatMonthTitle = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 18) return 'צהריים טובים';
    return 'ערב טוב';
  };

  const isSameMonth = (d1: Date, d2Str: string) => {
    const d2 = new Date(d2Str);
    return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  };

  // Derived Data
  const monthlyItems = useMemo(() => {
    return items.filter(item => isSameMonth(currentDate, item.date));
  }, [items, currentDate]);

  const stats = useMemo(() => {
    const totalIncome = monthlyItems
      .filter(i => i.isIncome)
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = monthlyItems
      .filter(i => !i.isIncome)
      .reduce((sum, item) => sum + item.amount, 0);

    const taxTotal = monthlyItems
      .filter(i => i.category === CategoryType.TAX)
      .reduce((sum, item) => sum + item.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      taxTotal,
      savingsRate
    };
  }, [monthlyItems]);

  // Pie Chart Data
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    monthlyItems.filter(i => !i.isIncome).forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });
    
    return Object.keys(categoryTotals).map(key => ({
      name: key,
      value: categoryTotals[key]
    })).sort((a, b) => b.value - a.value);
  }, [monthlyItems]);

  // History / Trend Data (Last 6 Months)
  const historyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthItems = items.filter(item => isSameMonth(d, item.date));
      
      const income = monthItems.filter(item => item.isIncome).reduce((sum, item) => sum + item.amount, 0);
      const expense = monthItems.filter(item => !item.isIncome).reduce((sum, item) => sum + item.amount, 0);
      
      data.push({
        name: new Intl.DateTimeFormat('he-IL', { month: 'short' }).format(d),
        income,
        expense
      });
    }
    return data;
  }, [items, currentDate]);

  // Actions
  const resetForm = () => {
    setFormName('');
    setFormAmount('');
    setFormCategory(CategoryType.FIXED);
    setFormIsIncome(false);
    const now = new Date();
    if (currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()) {
      setFormDate(now.toISOString().split('T')[0]);
    } else {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 12);
      setFormDate(d.toISOString().split('T')[0]);
    }
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormCategory(item.category);
    setFormIsIncome(!!item.isIncome);
    setFormDate(item.date);
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAmount || !formDate) return;

    const newItem: ExpenseItem = {
      id: editingId || Date.now().toString(),
      name: formName,
      amount: parseFloat(formAmount),
      category: formCategory,
      isIncome: formIsIncome,
      date: formDate
    };

    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? newItem : item));
      showToast('הפעולה עודכנה בהצלחה');
    } else {
      setItems(prev => [...prev, newItem]);
      showToast('נוספה פעולה חדשה');
    }
    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setDeleteConfirmationId(id);
  };

  const executeDelete = () => {
    if (deleteConfirmationId) {
      setItems(prev => prev.filter(item => item.id !== deleteConfirmationId));
      setDeleteConfirmationId(null);
      showToast('הפעולה נמחקה', 'success');
    }
  };

  const handleCategoryChange = (cat: CategoryType) => {
    setFormCategory(cat);
    if (cat === CategoryType.INCOME) setFormIsIncome(true);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (monthlyItems.length === 0) {
      showToast('אין נתונים לייצוא', 'error');
      return;
    }

    const headers = ['תאריך', 'שם', 'קטגוריה', 'סוג', 'סכום'];
    const csvContent = [
      headers.join(','),
      ...monthlyItems.map(item => [
        item.date,
        `"${item.name.replace(/"/g, '""')}"`,
        item.category,
        item.isIncome ? 'הכנסה' : 'הוצאה',
        item.amount
      ].join(','))
    ].join('\n');

    // Add BOM for Excel Hebrew support
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `budget_${currentDate.getMonth()+1}_${currentDate.getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('הקובץ ירד בהצלחה');
  };

  return (
    <div className="min-h-screen pb-20 font-sans text-slate-800">
      
      {/* --- Glass Header --- */}
      <header className="glass-header sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-primary to-pink-400 p-2.5 rounded-xl text-white shadow-lg shadow-pink-200">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 hidden sm:block">
                SmartBudget
              </h1>
              <span className="text-xs text-slate-500 font-medium tracking-wider hidden sm:block">ניהול פיננסי מתקדם</span>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100/80 backdrop-blur rounded-xl p-1.5 shadow-inner">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-primary">
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="px-6 font-bold text-slate-700 min-w-[140px] text-center">
              {formatMonthTitle(currentDate)}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-500 hover:text-primary">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors hidden md:block"
              title="ייצא לאקסל"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={openAddModal}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">פעולה חדשה</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* --- Welcome Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-5 duration-500">
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-1">{getGreeting()}!</h2>
            <p className="text-slate-500">
              {stats.balance >= 0 
                ? "המצב הפיננסי שלך החודש נראה יציב ומאוזן." 
                : "שים לב, ההוצאות החודש עולות על ההכנסות."}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-white/50 shadow-sm">
            <div className={`w-3 h-3 rounded-full ${stats.balance >= 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`}></div>
            <span className="text-sm font-bold text-slate-600">סטטוס: {stats.balance >= 0 ? 'חיובי' : 'חריגה'}</span>
          </div>
        </div>

        {/* --- Stats Cards Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="הכנסות" 
            amount={stats.totalIncome} 
            icon={<Wallet className="w-6 h-6" />} 
            colorClass="text-emerald-600"
            bgGradient="bg-gradient-to-br from-emerald-400 to-emerald-600" 
          />
          <StatCard 
            title="הוצאות" 
            amount={stats.totalExpenses} 
            icon={<TrendingDown className="w-6 h-6" />} 
            colorClass="text-rose-600"
            bgGradient="bg-gradient-to-br from-rose-400 to-rose-600" 
          />
          <StatCard 
            title="יתרה זמינה" 
            amount={stats.balance} 
            icon={<PiggyBank className="w-6 h-6" />} 
            colorClass={stats.balance >= 0 ? "text-blue-600" : "text-rose-600"}
            bgGradient={stats.balance >= 0 ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-rose-400 to-rose-600"} 
          />
           <StatCard 
            title="הפרשות מיסים" 
            amount={stats.taxTotal} 
            icon={<FileText className="w-6 h-6" />} 
            colorClass="text-amber-600"
            bgGradient="bg-gradient-to-br from-amber-400 to-amber-600" 
          />
        </div>

        {/* --- Main Dashboard Area --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Table and Graphs */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* History Chart */}
            <div className="glass-panel p-6 rounded-3xl shadow-sm border border-white/60">
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  מגמות חצי-שנתיות
                </h3>
               </div>
               <div className="h-64 w-full" style={{ direction: 'ltr' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₪${val/1000}k`} />
                     <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                        cursor={{fill: '#f1f5f9'}}
                     />
                     <Legend iconType="circle" />
                     <Bar dataKey="income" name="הכנסות" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                     <Bar dataKey="expense" name="הוצאות" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Transactions Table */}
            <div className="flex flex-col gap-4">
              <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit self-start overflow-hidden">
                <button 
                  onClick={() => setActiveTab('ALL')}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  הכל
                </button>
                {Object.values(CategoryType).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === cat ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <ExpensesTable 
                expenses={monthlyItems} 
                onDelete={handleDeleteItem}
                onEdit={openEditModal}
                filter={activeTab}
              />
            </div>
          </div>

          {/* Right Column: Breakdown & Tips */}
          <div className="space-y-6">
            
            {/* Pie Chart & Categories */}
            <div className="glass-panel p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6 relative z-10">
                <PieIcon className="w-5 h-5 text-primary" />
                פילוח הוצאות
              </h3>
              
              <div className="h-60 w-full relative z-10 mb-6" style={{ direction: 'ltr' }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', direction: 'rtl' }}
                        formatter={(value: number) => `₪${value.toLocaleString()}`} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                       <PieIcon className="w-8 h-8 opacity-20" />
                     </div>
                    אין מספיק נתונים
                  </div>
                )}
              </div>

              {/* Category Progress Bars */}
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700">{item.name}</span>
                      <span className="text-slate-500">{Math.round((item.value / stats.totalExpenses) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${(item.value / stats.totalExpenses) * 100}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length] 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2 transition-transform group-hover:scale-110"></div>
               
               <h4 className="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                 תובנה חודשית
                 {stats.balance >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-300"/> : <ArrowDownRight className="w-5 h-5 text-rose-300"/>}
               </h4>
               <p className="text-indigo-100 text-sm relative z-10 leading-relaxed">
                 {stats.balance < 0 
                   ? "נראה שיש חריגה בתקציב החודש. נסה לבדוק את קטגוריית 'קבועים' ולראות אם ניתן לצמצם הוראות קבע מיותרות."
                   : `כל הכבוד! נכון לעכשיו חסכת ${Math.round(stats.savingsRate)}% מההכנסות שלך. זה זמן מצוין להשקיע את היתרה.`}
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- Modals & Overlays --- */}
      
      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">
                {editingId ? 'עריכת פעולה' : 'פעולה חדשה'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">תיאור הפעולה</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border-slate-200 border bg-slate-50 p-3 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium"
                  placeholder="לדוגמה: קניות בסופר"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סכום (₪)</label>
                  <input 
                    type="number" 
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    step="0.01"
                    className="w-full rounded-xl border-slate-200 border bg-slate-50 p-3 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">תאריך</label>
                  <input 
                    type="date" 
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border-slate-200 border bg-slate-50 p-3 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">קטגוריה</label>
                  <div className="relative">
                    <select 
                      value={formCategory}
                      onChange={(e) => handleCategoryChange(e.target.value as CategoryType)}
                      className="w-full rounded-xl border-slate-200 border bg-slate-50 p-3 focus:bg-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none font-medium appearance-none"
                    >
                      {Object.values(CategoryType).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">סוג</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormIsIncome(false)}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!formIsIncome ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      הוצאה
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsIncome(true)}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formIsIncome ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                    >
                      הכנסה
                    </button>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-300 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingId ? 'שמור שינויים' : 'הוסף פעולה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">מחיקת פעולה</h3>
                <p className="text-slate-500 mt-2 text-sm">האם אתה בטוח שברצונך למחוק את הפעולה הזו? <br/>לא ניתן יהיה לשחזר אותה לאחר מכן.</p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <button 
                  onClick={() => setDeleteConfirmationId(null)}
                  className="flex-1 px-4 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  ביטול
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 px-4 py-3 bg-rose-500 text-white font-bold hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-200 transition-colors"
                >
                  כן, מחק
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;