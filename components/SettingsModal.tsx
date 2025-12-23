
import React, { useState } from 'react';
import { Settings, Trash2, X, BookOpen, Moon, Sun, Calculator, RefreshCw, User, Briefcase, Globe, Users, Heart, Info } from 'lucide-react';
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
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Taxation Logic */}
          <div className="space-y-4">
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Taxation Framework</h3>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  <p className="text-blue-500 dark:text-blue-400 mb-1"># Net Taxable Income</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">I_taxable = Σ(Gross_Taxable) - Σ(Packaging) - Σ(Sacrifice) - Σ(Fees)</p>
                  
                  <p className="text-blue-500 dark:text-blue-400 mt-3 mb-1"># Repayment Income (HECS/MLS Basis)</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">I_repay = I_taxable + (Packaging × 1.8868) + Sacrifice</p>
               </div>
               
               <p><strong>Medicare Levy:</strong> Applied as <code>2% × I_taxable</code> (if income > ~$26k).</p>
               <p><strong>MLS Tiering:</strong> If no Private Health, surcharge is applied to <code>I_taxable</code> based on <code>I_repay</code> thresholds ($97k/1%, $113k/1.25%, $151k/1.5%).</p>
            </div>
          </div>

          {/* Mortgage Logic */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
             <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Mortgage Simulation</h3>
             <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  <p className="text-emerald-600 dark:text-emerald-500 mb-1"># Amortization Formula (Standard PMT)</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">M = P [ r(1+r)^n / ((1+r)^n - 1) ]</p>
                  <p className="text-slate-400 mt-1 italic">Where r = rate/12, n = months remaining, P = (Principal - Offset)</p>

                  <p className="text-emerald-600 dark:text-emerald-500 mt-3 mb-1"># Periodic Interest Charge</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">Interest = Max(0, Principal - Offset) × (Rate / Freq)</p>
                </div>
                <p><strong>Offset Impact:</strong> Interest is calculated daily/monthly on the net balance. Any repayment above the calculated <code>Interest</code> reduces the <code>Principal</code> directly, accelerating the payoff date.</p>
             </div>
          </div>

          {/* Net Worth & FIRE Modes */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
             <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2 text-sm uppercase tracking-wider"><Calculator className="w-4 h-4"/> Net Worth & FIRE Methodologies</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl space-y-2">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 text-[11px] uppercase">Simple Mode</h4>
                   </div>
                   <div className="font-mono text-[9px] text-slate-600 dark:text-slate-400">
                      <p className="font-bold text-slate-800 dark:text-slate-200">NW = Σ(Investable_Assets)</p>
                      <p className="mt-2 font-bold text-slate-800 dark:text-slate-200">Target = Total_Expenses × (100 / SWR)</p>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-tight">Focuses purely on liquid investments. Ignores debt and assumes your current lifestyle expenses must be 100% replaced by your portfolio.</p>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl space-y-2">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <h4 className="font-bold text-indigo-700 dark:text-indigo-300 text-[11px] uppercase">Rigorous Mode</h4>
                   </div>
                   <div className="font-mono text-[9px] text-slate-600 dark:text-slate-400">
                      <p className="font-bold text-slate-800 dark:text-slate-200">NW = Σ(Assets) - Σ(Non_Mortgage_Debt)</p>
                      <p className="mt-2 font-bold text-slate-800 dark:text-slate-200">Target = (Core_Cost × 25) + Mortgage + Debts</p>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-tight">Accounts for debt repayment. Your target is a "Debt-Free" perpetual engine. Once net assets cross the engine cost + debt payoff, you are FIRE.</p>
                </div>
             </div>

             <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg">
                <p className="flex items-center gap-2 font-bold mb-1"><Info className="w-3 h-3 text-blue-500"/> The PPOR Exclusion</p>
                <p className="text-[10px]">To ensure mathematical integrity for FIRE, the value of your <strong>Primary Residence (PPOR)</strong> and your <strong>Mortgage</strong> are excluded from the core Net Worth basis. This prevents "paper wealth" (home equity) from creating a false sense of liquid financial independence.</p>
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
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  const updateProfileDetail = (id: string, updates: Partial<UserProfile>) => {
     setProfiles(profiles.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  if (!isOpen) return null;
  return (
    <>
      <AdvancedVariablesModal isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} />
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5" /> Settings</h2>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300" /></button>
          </div>
          <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
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
               <div className="space-y-3">
                  {profiles.map((p: UserProfile) => (
                     <div key={p.id} className={`rounded border overflow-hidden transition-all ${p.id === currentProfileId ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex justify-between items-center p-3">
                           <div className="flex flex-col">
                              <span className={`text-sm ${p.id === currentProfileId ? 'font-bold text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</span>
                              {p.id === currentProfileId && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Active</span>}
                           </div>
                           <div className="flex gap-2">
                              <button onClick={() => setExpandedProfileId(expandedProfileId === p.id ? null : p.id)} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
                                 {expandedProfileId === p.id ? 'Close Details' : 'Edit Details'}
                              </button>
                              {p.id !== currentProfileId && (
                                 <button onClick={() => setCurrentProfileId(p.id)} className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800">Switch</button>
                              )}
                              {p.id !== 'default' && (
                                 <button onClick={() => setProfiles(profiles.filter((pr: UserProfile) => pr.id !== p.id))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                              )}
                           </div>
                        </div>

                        {expandedProfileId === p.id && (
                           <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><User className="w-3 h-3"/> Full Name</label>
                                    <input className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.name} onChange={e => updateProfileDetail(p.id, { name: e.target.value })} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Age</label>
                                    <input type="number" className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.age || ''} onChange={e => updateProfileDetail(p.id, { age: Number(e.target.value) })} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Sex</label>
                                    <select className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.sex || ''} onChange={e => updateProfileDetail(p.id, { sex: e.target.value })}>
                                       <option value="">Select...</option>
                                       <option value="Male">Male</option>
                                       <option value="Female">Female</option>
                                       <option value="Other">Other</option>
                                    </select>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Briefcase className="w-3 h-3"/> Occupation</label>
                                    <input className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.occupation || ''} onChange={e => updateProfileDetail(p.id, { occupation: e.target.value })} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Globe className="w-3 h-3"/> Status</label>
                                    <input placeholder="Citizen, PR, 482..." className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.status || ''} onChange={e => updateProfileDetail(p.id, { status: e.target.value })} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Dependents</label>
                                    <input type="number" className="w-full text-xs border rounded p-1.5 bg-transparent border-slate-200 dark:border-slate-700 dark:text-white" value={p.dependents || 0} onChange={e => updateProfileDetail(p.id, { dependents: Number(e.target.value) })} />
                                 </div>
                                 <div className="col-span-2 flex items-center gap-2 pt-1">
                                    <button 
                                       onClick={() => updateProfileDetail(p.id, { hasSpouse: !p.hasSpouse })}
                                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${p.hasSpouse ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
                                    >
                                       <Heart className={`w-3.5 h-3.5 ${p.hasSpouse ? 'fill-current' : ''}`} />
                                       {p.hasSpouse ? 'Spouse/Partner Included' : 'No Spouse/Partner'}
                                    </button>
                                 </div>
                              </div>
                           </div>
                        )}
                     </div>
                  ))}
               </div>
               <div className="flex gap-2 mt-4">
                  <input 
                     placeholder="New Profile Name" 
                     className="flex-1 text-sm border rounded px-3 py-2 bg-transparent border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
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
                     className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-emerald-700 dark:hover:bg-emerald-500 transition-colors"
                  >
                     Create
                  </button>
               </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-2 pb-6">
                <button onClick={() => setShowAdvanced(true)} className="w-full py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" /> View Math & Assumptions
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
