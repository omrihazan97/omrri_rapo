import React from 'react';

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  bgGradient: string;
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, amount, icon, colorClass, bgGradient, isCurrency = true }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-white/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white group`}>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${bgGradient}`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2 tracking-wide">{title}</p>
          <h3 className={`text-3xl font-bold tracking-tight ${colorClass}`}>
            {isCurrency ? `₪${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : amount}
            {isCurrency && <span className="text-lg text-slate-400 font-normal">.{(amount % 1).toFixed(2).substring(2)}</span>}
          </h3>
        </div>
        <div className={`p-4 rounded-xl shadow-sm ${bgGradient} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
};