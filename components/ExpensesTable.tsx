import React, { useState } from 'react';
import { ExpenseItem, CategoryType } from '../types';
import { Trash2, TrendingDown, TrendingUp, Pencil, Calendar, Search, Filter } from 'lucide-react';

interface ExpensesTableProps {
  expenses: ExpenseItem[];
  onDelete: (id: string) => void;
  onEdit: (item: ExpenseItem) => void;
  filter: CategoryType | 'ALL';
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onDelete, onEdit, filter }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredByCategory = filter === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.category === filter);

  const filteredExpenses = filteredByCategory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.amount.toString().includes(searchQuery)
  );

  // Sort by date descending
  const sortedExpenses = [...filteredExpenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-glass border border-white/60 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Table Header / Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          פירוט תנועות
          <span className="bg-slate-100 text-slate-500 text-xs py-0.5 px-2 rounded-full">
            {sortedExpenses.length}
          </span>
        </h3>
        
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="חפש לפי שם או סכום..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl border-none bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary/20 text-sm transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50/80 text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4 rounded-tr-xl">תאריך</th>
              <th className="px-6 py-4">תיאור</th>
              <th className="px-6 py-4">קטגוריה</th>
              <th className="px-6 py-4">סכום</th>
              <th className="px-6 py-4 text-center rounded-tl-xl">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedExpenses.map((item, index) => (
              <tr 
                key={item.id} 
                className="hover:bg-blue-50/50 transition-colors group animate-in slide-in-from-bottom-2 fade-in duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 text-slate-500">
                  <div className="flex items-center gap-2 bg-slate-50 w-fit px-2 py-1 rounded-md text-xs font-mono">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                       {item.isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                    ${item.category === CategoryType.FIXED ? 'bg-pink-50 text-pink-700 border-pink-100' : 
                      item.category === CategoryType.BUSINESS ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      item.category === CategoryType.TAX ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      item.category === CategoryType.INCOME ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-slate-50 text-slate-700 border-slate-200'}`}>
                    {item.category}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold text-base ${item.isIncome ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {item.isIncome ? '+' : '-'} ₪{item.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      title="ערוך"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <Search className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium">לא נמצאו נתונים</p>
                    <p className="text-sm opacity-70">נסה לשנות את הסינון או להוסיף תנועה חדשה</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};