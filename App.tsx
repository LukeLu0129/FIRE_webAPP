import React, { useState, useEffect } from 'react';
import { Activity, Settings, Wallet, CreditCard, Repeat, Home, TrendingUp } from 'lucide-react';
import { AppState, UserProfile } from './types';
import { calculateAnnualAmount, calculateNetIncomeBreakdown } from './services/mathService';

// Import Defaults from TS constant
import { INITIAL_DEFAULT_STATE } from './data/defaults';

// Import Components
import { IncomeTab } from './components/IncomeTab';
import { ExpenseTab } from './components/ExpenseTab';
import { MortgageTab } from './components/MortgageTab';
import { NetWorthTab } from './components/NetWorthTab';
import { CashFlowTab } from './components/CashFlowTab';
import { SettingsModal } from './components/SettingsModal';

// --- Local Storage Hook ---
const useLocalStorageState = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([{ id: 'default', name: 'Default Profile' }]);
  const [currentProfileId, setCurrentProfileId] = useState('default');
  const [state, setState] = useState<AppState>(INITIAL_DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  const resetData = () => {
    if (window.confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
       localStorage.clear();
       window.location.reload();
    }
  };

  // Load Profiles
  useEffect(() => {
    const storedProfiles = localStorage.getItem('fire_planner_profiles');
    if (storedProfiles) {
      try {
        setProfiles(JSON.parse(storedProfiles));
      } catch (e) {
        console.error("Failed to parse profiles", e);
      }
    }
    
    const lastProfile = localStorage.getItem('fire_planner_current_profile_id');
    if (lastProfile) setCurrentProfileId(lastProfile);
  }, []);

  // Load State for Current Profile
  useEffect(() => {
    setLoading(true);
    const key = `fire_planner_data_${currentProfileId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(prev => ({ ...INITIAL_DEFAULT_STATE, ...parsed }));
      } else {
        setState(INITIAL_DEFAULT_STATE);
      }
    } catch (e) { 
      console.error("Failed to load profile data", e); 
      setState(INITIAL_DEFAULT_STATE);
    }
    setLoading(false);
  }, [currentProfileId]);

  // Save State
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(`fire_planner_data_${currentProfileId}`, JSON.stringify(state));
    }
  }, [state, currentProfileId, loading]);

  // Save Profiles
  useEffect(() => {
    localStorage.setItem('fire_planner_profiles', JSON.stringify(profiles));
    localStorage.setItem('fire_planner_current_profile_id', currentProfileId);
  }, [profiles, currentProfileId]);

  return { state, setState, loading, profiles, setProfiles, currentProfileId, setCurrentProfileId, resetData };
};

export default function App() {
  const [activeTab, setActiveTab] = useState('income');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { state, setState, loading, profiles, setProfiles, currentProfileId, setCurrentProfileId, resetData } = useLocalStorageState();

  // Unified calculation for the entire app
  const breakdown = calculateNetIncomeBreakdown(state);
  const netIncomeAnnual = breakdown.netCashPosition; // Includes Packaging Value
  const annualExpense = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
  const surplusAnnual = Math.max(0, netIncomeAnnual - annualExpense);

  const tabs = [
    { id: 'income', label: 'Income', icon: Wallet },
    { id: 'expense', label: 'Expense', icon: CreditCard },
    { id: 'cashflow', label: 'Cash Flow', icon: Repeat },
    { id: 'mortgage', label: 'Mortgage', icon: Home, condition: !state.userSettings.isRenting },
    { id: 'networth', label: 'Net Worth', icon: TrendingUp },
  ];

  useEffect(() => {
     if (activeTab === 'mortgage' && state.userSettings.isRenting) {
        setActiveTab('income');
     }
  }, [state.userSettings.isRenting, activeTab]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 animate-pulse">Loading Your FIRE Plan...</div>;

  return (
    <div className={`${state.userSettings.darkMode ? 'dark' : ''} h-full`}>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
        <SettingsModal 
           isOpen={isSettingsOpen} 
           onClose={() => setIsSettingsOpen(false)} 
           profiles={profiles}
           setProfiles={setProfiles}
           currentProfileId={currentProfileId}
           setCurrentProfileId={setCurrentProfileId}
           state={state}
           setState={setState}
           resetData={resetData}
        />
        
        <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between z-20 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg"><Activity className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">Start your FIRE <span className="text-xs font-normal text-slate-400 ml-1">v2.1</span></h1>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
            {tabs.filter(t => t.condition !== false).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center justify-center px-3 md:px-4 py-2 rounded-md text-sm font-medium capitalize transition-all whitespace-nowrap group ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                title={tab.label}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden md:block ml-2">{tab.label}</span>
              </button>
            ))}
          </div>

          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full ml-2"><Settings className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'income' && <IncomeTab state={state} setState={setState} />}
          {activeTab === 'expense' && <ExpenseTab state={state} setState={setState} netIncomeAnnual={netIncomeAnnual} setActiveTab={setActiveTab} />}
          {activeTab === 'cashflow' && <CashFlowTab state={state} setState={setState} netIncomeAnnual={netIncomeAnnual} />}
          {activeTab === 'mortgage' && !state.userSettings.isRenting && <MortgageTab state={state} setState={setState} surplusAnnual={surplusAnnual} />}
          {activeTab === 'networth' && <NetWorthTab state={state} setState={setState} surplusAnnual={surplusAnnual} />}
          
          {activeTab === 'mortgage' && state.userSettings.isRenting && (
             <div className="absolute inset-0 bg-white dark:bg-slate-950 z-50 flex items-center justify-center">
                <div className="text-center">
                   <p className="text-slate-500 dark:text-slate-400 mb-2">Mortgage tools are disabled in Renting mode.</p>
                   <button onClick={() => setActiveTab('expense')} className="text-blue-600 dark:text-blue-400 underline">Go to Expense Tab</button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}