
import React, { useState } from 'react';
import { Settings, Trash2, X, BookOpen, Moon, Sun, Calculator, RefreshCw } from 'lucide-react';
import { UserProfile, AppState } from '../types';

const AdvancedVariablesModal = ({ isOpen, onClose }: any) => {
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> Math & Methodologies</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          
          <div className="space-y-4">
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Taxation Logic</h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
               <p><strong>Resident Tax Rates (2024-25):</strong></p>
               <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                  <li>$0 – $18,200: <strong>0%</strong></li>
                  <li>$18,201 – $45,000: <strong>16%</strong></li>
                  <li>$45,001 – $135,000: <strong>30%</strong></li>
                  <li>$135,001 – $190,000: <strong>37%</strong></li>
                  <li>$190,001+: <strong>45%</strong></li>
               </ul>
               <p className="mt-2"><strong>Medicare Levy:</strong> Applied at <strong>2%</strong> if taxable income exceeds ~$26,000.</p>
               <p><strong>Medicare Levy Surcharge (MLS):</strong> Applied if you do not have private health insurance and income exceeds tiers ($97k: 1%, $113k: 1.25%, $151k: 1.5%). Includes Reportable Fringe Benefits in calculation.</p>
               <p><strong>HECS/HELP Debt:</strong> Repayments calculated on Repayment Income (Taxable Income + Net Rental Loss + Total Net Investment Loss + Reportable Fringe Benefits + Reportable Super Contributions).</p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
             <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Mortgage Simulation</h3>
             <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p><strong>Interest Calculation:</strong> Calculated monthly as <code>(Principal - Offset) * (Rate / 12)</code>.</p>
                <p><strong>Minimum Repayment:</strong> Uses the standard amortization formula (PMT) based on the remaining term and current balance.</p>
                <p><strong>Actual Repayment:</strong> Defaults to the minimum required. If you budget more in your Expenses, the surplus is treated as an "Extra Repayment" which reduces the principal directly, shortening the loan term.</p>
             </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
             <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Net Worth & FIRE</h3>
             <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p><strong>Net Worth:</strong> <code>(Property Value + Investment Assets + Cash) - Mortgage Balance</code>.</p>
                <p><strong>Projection:</strong> Assets grow at your specified Compound Annual Growth Rate (CAGR), applied monthly. Surplus cash flow is assumed to be invested into your first asset bucket.</p>
                <p><strong>FIRE Target (Financial Independence, Retire Early):</strong> Calculated using the <strong>4% Rule</strong> (or 25x Rule). </p>
                <p className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 italic">Target = Annual Expenses × 25</p>
                <p>This assumes you can withdraw 4% of your portfolio annually in retirement without running out of money.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: UserProfile[];
    setProfiles: (p: UserProfile[]) => void;
    currentProfileId: string;
    setCurrentProfileId: (id: string) => void;
    state: AppState;
    setState: (s: AppState | ((prev: AppState) => AppState)) => void;
    resetData: () => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({ isOpen, onClose, profiles, setProfiles, currentProfileId, setCurrentProfileId, state, setState, resetData }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  if (!isOpen) return null;
  return (
    <>
      <AdvancedVariablesModal isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300" /></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto">
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-2">
                  {state.userSettings.darkMode ? <Moon className="w-4 h-4 text-purple-400"/> : <Sun className="w-4 h-4 text-orange-400"/>}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
               </div>
               <button 
                 onClick={() => setState((s: AppState) => ({...s, userSettings: {...s.userSettings, darkMode: !s.userSettings.darkMode}}))}
                 className={`relative w-11 h-6 rounded-full transition-colors ${state.userSettings.darkMode ? 'bg-purple-600' : 'bg-slate-300'}`}
               >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${state.userSettings.darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
            </div>

            {/* Profile Manager */}
            <div className="space-y-3">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Profiles</h3>
               <div className="space-y-2">
                  {profiles.map((p: UserProfile) => (
                     <div key={p.id} className={`flex justify-between items-center p-2 rounded border ${p.id === currentProfileId ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <span className={`text-sm ${p.id === currentProfileId ? 'font-bold text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</span>
                        {p.id !== currentProfileId && (
                           <div className="flex gap-2">
                              <button onClick={() => setCurrentProfileId(p.id)} className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800">Switch</button>
                              {p.id !== 'default' && (
                                 <button onClick={() => {
                                    setProfiles(profiles.filter((pr: UserProfile) => pr.id !== p.id));
                                 }} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                              )}
                           </div>
                        )}
                        {p.id === currentProfileId && <span className="text-[10px] text-blue-400 font-medium">Active</span>}
                     </div>
                  ))}
               </div>
               <div className="flex gap-2 mt-2">
                  <input 
                     placeholder="New Profile Name" 
                     className="flex-1 text-sm border rounded px-2 py-1 bg-transparent border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                     value={newProfileName}
                     onChange={(e) => setNewProfileName(e.target.value)}
                  />
                  <button 
                     onClick={() => {
                        if (newProfileName) {
                           const newId = Date.now().toString();
                           setProfiles([...profiles, { id: newId, name: newProfileName }]);
                           setCurrentProfileId(newId);
                           setNewProfileName('');
                        }
                     }}
                     className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 dark:hover:bg-emerald-500"
                  >
                     Create
                  </button>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-2">
                <button onClick={() => setShowAdvanced(true)} className="w-full py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                    View Math & Assumptions
                </button>
                
                <button 
                    onClick={resetData} 
                    className="w-full py-2 flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Reset App Data
                </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
