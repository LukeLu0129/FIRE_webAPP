
export type FrequencyUnit = 'week' | 'fortnight' | 'month' | 'quarter' | 'year';
export type TaxTreatment = 'tft' | 'no-tft' | 'abn';
export type IncomeType = 'salary' | 'abn' | 'other';

export interface UserProfile {
  id: string;
  name: string;
}

export interface IncomeStream {
  id: string;
  name: string;
  type: IncomeType;
  amount: number; 
  freqValue: number;
  freqUnit: FrequencyUnit;
  taxTreatment: TaxTreatment;
  salaryPackaging: number; // Existing: Pre-tax deduction used for expenses (included in net cash conceptually)
  salarySacrifice: number; // New: Pre-tax deduction into Super (excluded from net cash)
  adminFee: number;
  superRate: number; 
  paygOverride: number | null;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  freqValue: number;
  freqUnit: FrequencyUnit;
  category: string;
  isMortgageLink: boolean;
}

export interface AssetItem {
  id: string;
  name: string;
  value: number;
  category: string;
  growthRate: number;
}

export interface AccountBucket {
  id: string;
  name: string;
  color: string;
}

export interface AppState {
  userSettings: {
    name: string;
    isResident: boolean;
    hasPrivateHealth: boolean;
    hasHecsDebt: boolean;
    isRenting: boolean;
    darkMode: boolean; // New
  };
  incomes: IncomeStream[];
  deductions: {
    id: string;
    name: string;
    amount: number;
    category: string;
  }[];
  expenses: ExpenseItem[];
  expenseCategories: string[];
  // New: Cash Flow Account Mapping
  accounts: AccountBucket[];
  categoryMap: Record<string, string>; // Maps Category Name -> Account ID
  
  assets: AssetItem[];
  assetCategories: string[];
  mortgageParams: {
    principal: number;
    offsetBalance: number;
    interestRate: number;
    loanTermYears: number;
    userRepayment: number | null; 
    repaymentFreq: 'week' | 'fortnight' | 'month'; 
    propertyValue: number;
    growthRate: number;
    useBudgetRepayment: boolean;
    useSurplus: boolean;
  };
  fireTargetOverride: number | null;
}
