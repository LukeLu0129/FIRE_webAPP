
import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { AppState, FrequencyUnit, IncomeType, TaxTreatment } from '../types';
import { FREQ_LABELS, FREQ_MULTIPLIERS, formatCurrency } from '../constants';
import { calculateTax } from '../services/mathService';
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

  // Logic to prepare totals
  const annualIncomes = state.incomes.map(item => {
    const gross = (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
    const sacrifice = item.salarySacrifice || 0;
    // Super calculation: (Gross * Rate) + Sacrifice
    const superAmt = (gross * (item.superRate / 100)) + sacrifice;
    return { ...item, grossAnnual: gross, superAnnual: superAmt };
  });

  const totalGrossCash = annualIncomes.reduce((acc, c) => acc + c.grossAnnual, 0);
  const totalPackaging = annualIncomes.reduce((acc, c) => acc + (c.salaryPackaging || 0), 0);
  const totalSacrifice = annualIncomes.reduce((acc, c) => acc + (c.salarySacrifice || 0), 0);
  const totalAdminFees = annualIncomes.reduce((acc, c) => acc + (c.adminFee || 0), 0);
  const totalDeductions = state.deductions.reduce((acc, c) => acc + c.amount, 0);
  const totalSuper = annualIncomes.reduce((acc, c) => acc + c.superAnnual, 0);

  // Taxable Income reduces by Packaging AND Sacrifice
  const taxableIncome = Math.max(0, totalGrossCash - totalPackaging - totalSacrifice - totalAdminFees - totalDeductions);
  const baseTax = calculateTax(taxableIncome, state.userSettings.isResident, true);
  
  let medicare = 0;
  if (state.userSettings.isResident && taxableIncome > 26000) medicare = taxableIncome * 0.02;

  const reportableFringeBenefits = totalPackaging * 1.8868; 
  const adjTaxableIncome = taxableIncome + reportableFringeBenefits;

  let mlsRate = 0;
  if (!state.userSettings.hasPrivateHealth && state.userSettings.isResident) {
    if (adjTaxableIncome > 151000) mlsRate = 0.015;
    else if (adjTaxableIncome > 113000) mlsRate = 0.0125;
    else if (adjTaxableIncome > 97000) mlsRate = 0.01;
  }
  const mls = taxableIncome * mlsRate; 
  
  let hecs = 0;
  if (state.userSettings.hasHecsDebt) {
    if (adjTaxableIncome > 151201) hecs = adjTaxableIncome * 0.10;
    else if (adjTaxableIncome > 100000) hecs = adjTaxableIncome * 0.06;
    else if (adjTaxableIncome > 54435) hecs = adjTaxableIncome * 0.01;
  }

  const totalTax = baseTax + medicare + mls + hecs;
  
  // Net Income = Gross - Tax - Admin - Sacrifice (Sacrifice is gone to super, Packaging is kept as 'benefit')
  const netIncome = totalGrossCash - totalTax - totalAdminFees - totalSacrifice;
  const displayFactor = 1 / FREQ_MULTIPLIERS[viewPeriod];

  return (
    <div className="h-full flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-y-auto">
      {/* Input Column */}
      <div className="w-full md:w-1/2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col max-h-[600px]">
           <div className="flex justify-between items-center mb-4 shrink-0">
             <h3 className="font-bold text-slate-700 dark:text-slate-200">Income Streams</h3>
             <button onClick={() => setState((s: AppState) => ({...s, incomes: [...s.incomes, { id: Date.now().toString(), name: 'New Source', type: 'salary', amount: 0, freqValue: 1, freqUnit: 'year', taxTreatment: 'no-tft', salaryPackaging: 0, salarySacrifice: 0, adminFee: 0, superRate: 11.5, paygOverride: null }]}))} className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:bg-blue-50 dark:hover:bg-blue-900 px-2 py-1 rounded transition-colors"><Plus className="w-4 h-4 mr-1"/> Add</button>
           </div>
           
           {/* Scrollable List Area */}
           <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0 custom-scrollbar">
             {state.incomes.map((inc, idx) => (
               <div key={inc.id} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-800 relative group">
                 <button onClick={() => setState((s: AppState) => ({...s, incomes: s.incomes.filter(i => i.id !== inc.id)}))} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 z-10"><Trash2 className="w-4 h-4"/></button>
                 
                 <div className="space-y-3 pr-6 sm:pr-8">
                    {/* Top Row: Name and Type */}
                    <div className="flex flex-col sm:flex-row gap-2">
                       <input value={inc.name} onChange={e => {
                         const newIncs = [...state.incomes]; newIncs[idx].name = e.target.value; setState({...state, incomes: newIncs});
                       }} className="w-full sm:flex-1 font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 focus:border-blue-300 outline-none text-sm py-1" placeholder="Income Name" />
                       
                       <select value={inc.type} onChange={e => {
                         const newIncs = [...state.incomes]; 
                         newIncs[idx].type = e.target.value as IncomeType;
                         if(e.target.value === 'abn') { newIncs[idx].taxTreatment = 'abn'; newIncs[idx].superRate = 0; }
                         if(e.target.value === 'salary') { newIncs[idx].superRate = 11.5; }
                         setState({...state, incomes: newIncs});
                       }} className="w-full sm:w-auto text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-2 py-1">
                          <option value="salary">Salary (PAYG)</option>
                          <option value="abn">ABN (Contractor)</option>
                          <option value="other">Other (Invest)</option>
                       </select>
                    </div>

                    {/* Second Row: Amount and Frequency */}
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
                    
                    {/* Basic Toggles */}
                    <div className="flex flex-wrap gap-2 text-xs items-center pt-1 justify-between">
                        <div className="flex gap-2 items-center">
                            {inc.type !== 'other' && (
                              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                <span className="text-slate-500 dark:text-slate-300">Super</span>
                                <input type="number" value={inc.superRate} onChange={e => {
                                   const newIncs = [...state.incomes]; newIncs[idx].superRate = Number(e.target.value); setState({...state, incomes: newIncs});
                                }} className="w-10 border-b border-slate-300 dark:border-slate-500 outline-none text-center bg-transparent font-semibold text-slate-900 dark:text-white" />
                                <span className="text-slate-500 dark:text-slate-300">%</span>
                              </div>
                            )}
                            
                            {inc.type !== 'abn' && inc.type !== 'other' && (
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

                    {/* Salary Packaging Section (Toggleable) */}
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
                                 <p className="text-[9px] text-slate-400 mt-0.5">Pre-tax Super addition</p>
                              </div>
                              <div className="sm:col-span-2">
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
               <span className="text-slate-500 dark:text-slate-400 text-sm">Gross Cash Income</span>
               <span className="text-lg font-semibold dark:text-white">{formatCurrency(totalGrossCash * displayFactor)}</span>
             </div>
             {totalPackaging > 0 && (
                <div className="flex justify-between items-end text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">+ Salary Packaging <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-400">Tax Free</span></span>
                  <span>{formatCurrency(totalPackaging * displayFactor)}</span>
                </div>
             )}
             {totalSacrifice > 0 && (
                <div className="flex justify-between items-end text-sm text-purple-600 dark:text-purple-400">
                  <span>- Salary Sacrifice (to Super)</span>
                  <span>-{formatCurrency(totalSacrifice * displayFactor)}</span>
                </div>
             )}
             
             <div className="flex justify-between items-end text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
               <span>Total Super Contributions</span>
               <span className="font-bold">{formatCurrency(totalSuper * displayFactor)}</span>
             </div>
             
             <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>

             <div className="space-y-2 text-sm text-red-600 dark:text-red-400">
                <div className="flex justify-between"><span>Income Tax</span><span>-{formatCurrency(baseTax * displayFactor)}</span></div>
                {totalAdminFees > 0 && <div className="flex justify-between"><span>Packaging Fees</span><span>-{formatCurrency(totalAdminFees * displayFactor)}</span></div>}
                <div className="flex justify-between"><span>Medicare Levy</span><span>-{formatCurrency(medicare * displayFactor)}</span></div>
                {mls > 0 && <div className="flex justify-between"><span>Medicare Levy Surcharge</span><span>-{formatCurrency(mls * displayFactor)}</span></div>}
                {hecs > 0 && <div className="flex justify-between text-orange-600 dark:text-orange-400"><span>HECS Repayment</span><span>-{formatCurrency(hecs * displayFactor)}</span></div>}
             </div>
             <div className="border-t-2 border-slate-100 dark:border-slate-800 my-4"></div>
             <div className="flex justify-between items-end">
               <div><span className="text-slate-500 dark:text-slate-400 font-bold block">Net Income</span><span className="text-xs text-slate-400 dark:text-slate-500">Cash in Hand</span></div>
               <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(netIncome * displayFactor)}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
