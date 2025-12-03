export enum CategoryType {
  FIXED = 'קבועים',
  BUSINESS = 'עסקי',
  PERSONAL = 'פרטי',
  TAX = 'מיסים',
  INCOME = 'הכנסות'
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  category: CategoryType;
  isIncome?: boolean; // false for expense, true for income
  details?: string;
  date: string; // ISO Date string YYYY-MM-DD
}

export interface SummaryStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  taxEstimate: number;
}