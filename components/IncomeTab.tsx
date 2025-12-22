
import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AppState, FrequencyUnit, IncomeType, TaxTreatment } from '../types';
import { FREQ_LABELS, FREQ_MULTIPLIERS, formatCurrency } from '../constants';
import { calculateNetIncomeBreakdown } from '../services/mathService';
import { NumberInput } from './NumberInput';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
}

export const IncomeTab: React.FC<Props> = ({ state, setState }) => {
  const [viewPeriod, setViewPeriod] = useState<FrequencyUnit>('year');
  const [showAdvancedIds, setShowAdvancedIds] = useState<Set<string>>(new Set());

  const toggleAdvanced = (id: string) => {
    const newSet = new Set(showAdvancedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setShowAdvancedIds(newSet);
  };

  const breakdown = calculateNetIncomeBreakdown(state);
  const displayFactor = 1 / FREQ_MULTIPLIERS[viewPeriod];

  const getPct = (val: number) => breakdown.taxableIncome > 0 ? ((val / breakdown.taxableIncome) * 100).toFixed(1) : '0.0';

  return (
    <div className="h-full flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-y-auto">
      {/* Input Column */}
      <div className="w-full md:w-1/2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col max-h-[600px]">
           <div className="flex justify-between items-center mb-4 shrink-0">
             <h3 className="font-bold text-slate-700 dark:text-slate-200">Income Streams</h3>
             <button onClick={() => setState((s: AppState) => ({...s, incomes: [...s.incomes, { id: Date.now().toString(), name: 'New Source', type: 'salary', amount: 0, freqValue: 1, freqUnit: 'year', taxTreatment: 'no-tft', salaryPackaging: 0, salarySacrifice: 0, adminFee: 0, superRate: 11.5, paygOverride: null }]}))} className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:bg-blue-50 dark:hover:bg-blue-900 px-2 py-1 rounded transition-colors"><Plus className="w-4 h-4 mr-1"/> Add</button>
           </div>
           
           <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
             {state.incomes.map((inc, idx) => (
               <div key={inc.id} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800 relative group">
                 <button onClick={() => setState((s: AppState) => ({...s, incomes: s.incomes.filter(i => i.id !== inc.id)}))} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 z-10"><Trash2 className="w-4 h-4"/></button>
                 
                 <div className="space-y-3 pr-6 sm:pr-8">
                    <div className="flex flex-col sm:flex-row gap-2">
                       <input value={inc.name} onChange={e => {
                         const newIncs = [...state.incomes]; newIncs[idx].name = e.target.value; setState({...state, incomes: newIncs});
                       }} className="w-full sm:flex-1 font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 focus:border-blue-300 outline-none text-sm py-1 ml-2" placeholder="Income Name" />
                       
                       <select value={inc.type} onChange={e => {
                         const newIncs = [...state.incomes]; 
                         const nextType = e.target.value as IncomeType;
                         newIncs[idx].type = nextType;
                         if(nextType === 'abn') { 
                            newIncs[idx].taxTreatment = 'abn'; 
                            newIncs[idx].superRate = 0; 
                         } else if(nextType === 'salary') { 
                            newIncs[idx].superRate = 11.5; 
                            newIncs[idx].taxTreatment = 'no-tft';
                         } else {
                            newIncs[idx].superRate = 0;
                            newIncs[idx].taxTreatment = 'no-tft';
                         }
                         setState({...state, incomes: newIncs});
                       }} className="w-full sm:w-auto text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1">
                          <option value="salary">Salary (PAYG)</option>
                          <option value="abn">ABN (Contractor)</option>
                          <option value="investment">Investment Income</option>
                          <option value="tax-free">Tax-Free Income</option>
                          <option value="other">Other Income</option>
                       </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                       <div className="relative w-full sm:w-32">
                          <DollarSign className="w-3 h-3 absolute top-2 left-2 text-slate-400"/>
                          <NumberInput 
                            value={inc.amount} 
                            onValueChange={(val) => {
                                const newIncs = [...state.incomes]; 
                                newIncs[idx].amount = val; 
                                setState({...state, incomes: newIncs});
                            }}
                            className="w-full pl-6 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" 
                          />
                       </div>
                       <span className="text-xs text-slate-400 hidden sm:inline">per</span>
                       <div className="flex flex-1 gap-2">
                          <input type="number" className="w-12 py-1 border border-slate-300 dark:border-slate-600 rounded text-center text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={inc.freqValue} onChange={e => {
                              const newIncs = [...state.incomes]; newIncs[idx].freqValue = Number(e.target.value); setState({...state, incomes: newIncs});
                          }} />
                          <select value={inc.freqUnit} onChange={e => {
                              const newIncs = [...state.incomes]; newIncs[idx].freqUnit = e.target.value as FrequencyUnit; setState({...state, incomes: newIncs});
                          }} className="text-sm border border-slate-300 dark:border-slate-600 rounded px-1 py-1 flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 min-w-[80px]">
                            {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-xs items-center pt-1 justify-between">
                        <div className="flex gap-2 items-center">
                            {(inc.type === 'salary' || inc.type === 'abn') && (
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                <span className="text-slate-500 dark:text-slate-300">Super</span>
                                <input type="number" value={inc.superRate} onChange={e => {
                                   const newIncs = [...state.incomes]; newIncs[idx].superRate = Number(e.target.value); setState({...state, incomes: newIncs});
                                }} className="w-10 border-b border-slate-300 dark:border-slate-500 outline-none text-center bg-transparent font-semibold text-slate-900 dark:text-white" />
                                <span className="text-slate-500 dark:text-slate-300">%</span>
                              </div>
                            )}
                            
                            {inc.type !== 'abn' && inc.type !== 'tax-free' && (
                               <button onClick={() => {
                                 if (state.incomes[idx].taxTreatment !== 'tft') {
                                    const tftExclusive = state.incomes.map((item, i) => ({ ...item, taxTreatment: i === idx ? 'tft' : (item.taxTreatment === 'tft' ? 'no-tft' : item.taxTreatment) as TaxTreatment }));
                                    setState({...state, incomes: tftExclusive});
                                 } else {
                                    const newIncs = [...state.incomes]; newIncs[idx].taxTreatment = 'no-tft'; setState({...state, incomes: newIncs});
                                 }
                               }} className={`px-2 py-1 rounded border transition-colors ${inc.taxTreatment === 'tft' ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                                 {inc.taxTreatment === 'tft' ? 'Claims Tax-Free Threshold' : 'No Tax-Free Threshold'}
                               </button>
                            )}
                        </div>
                        {inc.type === 'salary' && (
                            <button onClick={() => toggleAdvanced(inc.id)} className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                                {showAdvancedIds.has(inc.id) ? 'Hide' : 'Show'} Packaging & Sacrifice
                                {showAdvancedIds.has(inc.id) ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                            </button>
                        )}
                    </div>

                    {inc.type === 'salary' && showAdvancedIds.has(inc.id) && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded p-2 text-xs space-y-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Salary Packaging (Tax Free)</label>
                                 <div className="relative">
                                    <DollarSign className="w-3 h-3 absolute top-1.5 left-1 text-slate-400"/>
                                    <NumberInput 
                                        value={inc.salaryPackaging} 
                                        onValueChange={(val) => {
                                            const newIncs = [...state.incomes]; 
                                            newIncs[idx].salaryPackaging = val; 
                                            setState({...state, incomes: newIncs});
                                        }}
                                        className="w-full pl-4 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                                    />
                                 </div>
                                 <p className="text-[9px] text-slate-400 mt-0.5">Rent, Car, Living Exp</p>
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Packaging Admin Fees</label>
                                 <div className="relative">
                                    <DollarSign className="w-3 h-3 absolute top-1.5 left-1 text-slate-400"/>
                                    <NumberInput 
                                        value={inc.adminFee} 
                                        onValueChange={(val) => {
                                            const newIncs = [...state.incomes]; 
                                            newIncs[idx].adminFee = val; 
                                            setState({...state, incomes: newIncs});
                                        }}
                                        className="w-full pl-4 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                                    />
                                 </div>
                                 <p className="text-[9px] text-slate-400 mt-0.5">Salary packaging provider fee</p>
                              </div>
                              <div className="sm:col-span-2">
                                 <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block">Salary Sacrifice (Into Super)</label>
                                 <div className="relative">
                                    <DollarSign className="w-3 h-3 absolute top-1.5 left-1 text-slate-400"/>
                                    <NumberInput 
                                        value={inc.salarySacrifice} 
                                        onValueChange={(val) => {
                                            const newIncs = [...state.incomes]; 
                                            newIncs[idx].salarySacrifice = val; 
                                            setState({...state, incomes: newIncs});
                                        }}
                                        className="w-full pl-4 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                                    />
                                 </div>
                                 <p className="text-[9px] text-slate-400 mt-0.5">Pre-tax Super addition (Concessional)</p>
                              </div>
                           </div>
                        </div>
                    )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Summary Column */}
      <div className="w-full md:w-1/2 flex-none">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200">Net Income Summary</h3>
              <div className="flex items-center gap-2">
                 <span className="text-xs text-slate-500 dark:text-slate-400">View as:</span>
                 <select className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={viewPeriod} onChange={e => setViewPeriod(e.target.value as FrequencyUnit)}>
                    {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                 </select>
              </div>
           </div>
           
           <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
              <button 
                 onClick={() => setState((s: AppState) => ({...s, userSettings: {...s.userSettings, isResident: !s.userSettings.isResident}}))}
                 className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${state.userSettings.isResident ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800' : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
              >
                 <div className={`w-2 h-2 rounded-full shrink-0 ${state.userSettings.isResident ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                 Resident
              </button>
              
              <button 
                 onClick={() => setState((s: AppState) => ({...s, userSettings: {...s.userSettings, hasHecsDebt: !s.userSettings.hasHecsDebt}}))}
                 className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${state.userSettings.hasHecsDebt ? 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-300 shadow-sm border border-orange-100 dark:border-orange-800' : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
              >
                 <div className={`w-2 h-2 rounded-full shrink-0 ${state.userSettings.hasHecsDebt ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                 HECS Debt
              </button>

              <button 
                 onClick={() => setState((s: AppState) => ({...s, userSettings: {...s.userSettings, hasPrivateHealth: !s.userSettings.hasPrivateHealth}}))}
                 className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 px-2 py-2 rounded text-[10px] sm:text-xs font-medium transition-colors ${state.userSettings.hasPrivateHealth ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-100 dark:border-emerald-800' : 'text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}
              >
                 <div className={`w-2 h-2 rounded-full shrink-0 ${state.userSettings.hasPrivateHealth ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                 Pvt Health
              </button>
           </div>

           <div className="space-y-4 flex-1">
             <div className="flex justify-between items-end">
               <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Gross Cash Income</span>
               <span className="text-lg font-semibold dark:text-white">{formatCurrency(breakdown.totalGrossCash * displayFactor)}</span>
             </div>
             
             <div className="space-y-2">
                {(breakdown.totalPackaging > 0 || breakdown.totalSacrifice > 0 || breakdown.totalAdminFees > 0 || breakdown.taxFreeIncome > 0) && (
                   <div className="space-y-1">
                      {breakdown.taxFreeIncome > 0 && (
                         <div className="flex justify-between items-end text-xs text-blue-400 italic">
                           <span>- Tax-Free Income</span>
                           <span>-{formatCurrency(breakdown.taxFreeIncome * displayFactor)}</span>
                         </div>
                      )}
                      {breakdown.totalPackaging > 0 && (
                         <div className="flex justify-between items-end text-xs text-slate-400 italic">
                           <span>- Salary Packaging (Pre-tax)</span>
                           <span>-{formatCurrency(breakdown.totalPackaging * displayFactor)}</span>
                         </div>
                      )}
                      {breakdown.totalSacrifice > 0 && (
                         <div className="flex justify-between items-end text-xs text-purple-400 italic">
                           <span>- Salary Sacrifice (to Super)</span>
                           <span>-{formatCurrency(breakdown.totalSacrifice * displayFactor)}</span>
                         </div>
                      )}
                      {breakdown.totalAdminFees > 0 && (
                         <div className="flex justify-between items-end text-xs text-amber-400 italic">
                           <span>- Packaging Admin Fees</span>
                           <span>-{formatCurrency(breakdown.totalAdminFees * displayFactor)}</span>
                         </div>
                      )}
                   </div>
                )}
             </div>

             <div className="flex justify-between items-end border-y border-slate-100 dark:border-slate-800 py-2 bg-slate-50/50 dark:bg-slate-800/20 px-2 rounded">
               <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">Taxable Income</span>
               <span className="text-blue-700 dark:text-blue-300 font-bold">{formatCurrency(breakdown.taxableIncome * displayFactor)}</span>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-end text-sm text-red-600 dark:text-red-400">
                  <div className="flex flex-col">
                    <span className="font-medium">Income Tax</span>
                    <span className="text-[10px] opacity-70">({getPct(breakdown.baseTax)}% of taxable)</span>
                  </div>
                  <span className="font-medium">-{formatCurrency(breakdown.baseTax * displayFactor)}</span>
                </div>
                
                <div className="flex justify-between items-end text-sm text-red-600 dark:text-red-400">
                  <div className="flex flex-col">
                    <span className="font-medium">Medicare Levy</span>
                    <span className="text-[10px] opacity-70">({getPct(breakdown.medicare)}% of taxable)</span>
                  </div>
                  <span className="font-medium">-{formatCurrency(breakdown.medicare * displayFactor)}</span>
                </div>

                {breakdown.mls > 0 && (
                   <div className="flex justify-between items-end text-sm text-red-600 dark:text-red-400">
                     <div className="flex flex-col">
                        <span className="font-medium">Medicare Levy Surcharge</span>
                        <span className="text-[10px] opacity-70">({getPct(breakdown.mls)}% of taxable)</span>
                     </div>
                     <span className="font-medium">-{formatCurrency(breakdown.mls * displayFactor)}</span>
                   </div>
                )}
                {breakdown.hecs > 0 && (
                   <div className="flex justify-between items-end text-sm text-orange-600 dark:text-orange-400">
                     <div className="flex flex-col">
                        <span className="font-medium">HECS Repayment</span>
                        <span className="text-[10px] opacity-70">({getPct(breakdown.hecs)}% of taxable)</span>
                     </div>
                     <span className="font-medium">-{formatCurrency(breakdown.hecs * displayFactor)}</span>
                   </div>
                )}
             </div>

             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 mt-2">
                <div className="flex justify-between items-center">
                   <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated take-home income</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Net Salary</span>
                   </div>
                   <span className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(breakdown.netSalary * displayFactor)}</span>
                </div>
                {breakdown.taxFreeIncome > 0 && (
                   <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                         <div className="bg-blue-100 dark:bg-blue-900/40 p-1 rounded"><DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400"/></div>
                         <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Tax-Free Income</span>
                      </div>
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatCurrency(breakdown.taxFreeIncome * displayFactor)}</span>
                   </div>
                )}
                {breakdown.totalPackaging > 0 && (
                   <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                         <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1 rounded"><Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400"/></div>
                         <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Salary Packaging Benefit</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(breakdown.totalPackaging * displayFactor)}</span>
                   </div>
                )}
             </div>
             
             <div className="flex justify-between items-end text-xs text-blue-400 dark:text-blue-500/60 pt-2 px-2">
               <span className="italic">Total Super Contributions (Incl. Sacrifice)</span>
               <span className="font-semibold">{formatCurrency(breakdown.totalSuper * displayFactor)}</span>
             </div>
             
             <div className="border-t-2 border-slate-100 dark:border-slate-800 my-4"></div>
             
             <div className="flex justify-between items-start">
               <div>
                  <span className="text-slate-500 dark:text-slate-400 font-bold block text-sm uppercase tracking-tight">Total Net Income</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block max-w-[140px]">Net Salary + Tax Free + Value of Packaged Living Expenses</span>
               </div>
               <div className="text-right">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(breakdown.netCashPosition * displayFactor)}</span>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Available Cash Flow</p>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
