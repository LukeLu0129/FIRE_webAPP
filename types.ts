
export type FrequencyUnit = 'week' | 'fortnight' | 'month' | 'quarter' | 'year';
export type TaxTreatment = 'tft' | 'no-tft' | 'abn';
export type IncomeType = 'salary' | 'abn' | 'investment' | 'other' | 'tax-free';

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  sex?: string;
  occupation?: string;
  status?: string; // Citizenship or Visa status
  dependents?: number;
  hasSpouse?: boolean;
}

export interface IncomeStream {
  id: string;
  name: string;
  type: IncomeType;
  amount: number; 
  freqValue: number;
  freqUnit: FrequencyUnit;
  taxTreatment: TaxTreatment;
  salaryPackaging: number;
  salarySacrifice: number;
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
  payoffYears?: number; // Estimated years for paid-off
}

export interface AssetItem {
  id: string;
  name: string;
  value: number;
  category: string;
  growthRate: number;
}

export interface LiabilityItem {
  id: string;
  name: string;
  balance: number;
  category: 'Personal' | 'Business' | 'Investment';
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
    darkMode: boolean;
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
  accounts: AccountBucket[];
  categoryMap: Record<string, string>;
  
  assets: AssetItem[];
  assetCategories: string[];
  liabilities: LiabilityItem[];

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

  // FIRE Logic
  fireMode: 'simple' | 'rigorous';
  retirementBaseCost: number | null; // Annual
  swr: number; // e.g. 4
  fireTargetOverride: number | null;
}
