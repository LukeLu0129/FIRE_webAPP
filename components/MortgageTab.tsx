
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Home, AlertTriangle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { AppState } from '../types';
import { FREQ_MULTIPLIERS, formatCurrency, formatLargeCurrency } from '../constants';
import { generateMortgageSimulation } from '../services/mathService';
import { NumberInput } from './NumberInput';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  surplusAnnual: number;
}

export const MortgageTab: React.FC<Props> = ({ state, setState, surplusAnnual }) => {
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const { principal, offsetBalance, interestRate, loanTermYears, repaymentFreq, propertyValue, growthRate } = state.mortgageParams;

  // Use the extracted service for calculation
  const { data: simData, minRepayment, actualRepayment, payoffActual, payoffStandard } = generateMortgageSimulation(state);
  
  const nPerYear = repaymentFreq === 'week' ? 52 : repaymentFreq === 'fortnight' ? 26 : 12;

  // Calculate Max Capacity (Surplus + current budget allocation)
  const budgetRepaymentAnnual = state.expenses
    .filter(e => e.isMortgageLink)
    .reduce((acc, item) => acc + ((item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue), 0);

  const budgetRepayment = budgetRepaymentAnnual / nPerYear;
  const maxCapacity = (surplusAnnual + budgetRepaymentAnnual) / nPerYear;

  const sliderMin = minRepayment;
  const sliderMax = Math.max(minRepayment * 1.1, maxCapacity); 

  const firstPeriodInterest = (principal - offsetBalance) * (interestRate / 100 / nPerYear);
  const isBelowInterest = actualRepayment < firstPeriodInterest;
  
  const isBudgetBelowMin = budgetRepayment < minRepayment;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden overflow-y-auto md:overflow-y-hidden">
       {/* Details Card */}
       <div className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 flex flex-col h-fit md:h-full md:overflow-hidden">
          {/* Header / Toggle for Mobile */}
          <button 
             onClick={() => setShowMobileDetails(!showMobileDetails)}
             className="p-4 flex items-center justify-between w-full md:cursor-default"
          >
             <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Home className="w-5 h-5"/> Loan Details</h3>
             <div className="md:hidden text-slate-400">
                {showMobileDetails ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
             </div>
          </button>
          
          <div className={`${showMobileDetails ? 'block' : 'hidden'} md:block p-4 md:p-6 pt-0 overflow-y-auto space-y-6 border-t md:border-t-0 border-slate-100 dark:border-slate-800`}>
            <div className="space-y-3">
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Mortgage Balance</label>
                 <NumberInput 
                    value={principal} 
                    onValueChange={(val) => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, principal: val}}))}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                 />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Offset / Redraw Balance</label>
                 <NumberInput 
                    value={offsetBalance} 
                    onValueChange={(val) => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, offsetBalance: val}}))}
                    className="w-full border rounded px-3 py-2 border-blue-200 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold" 
                 />
                 <p className="text-[10px] text-slate-400 mt-1">Reduces interest charged immediately.</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Rate (%)</label>
                   <input type="number" step="0.1" value={interestRate} onChange={e => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, interestRate: Number(e.target.value)}}))} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Term (Yrs)</label>
                   <input type="number" value={loanTermYears} onChange={e => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, loanTermYears: Number(e.target.value)}}))} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Repayment</span>
                  <select 
                     className="text-[10px] border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" 
                     value={repaymentFreq} 
                     onChange={(e) => {
                       const newFreq = e.target.value as 'week' | 'fortnight' | 'month';
                       const oldMultiplier = nPerYear;
                       const newMultiplier = newFreq === 'week' ? 52 : newFreq === 'fortnight' ? 26 : 12;
                       const currentVal = state.mortgageParams.userRepayment;
                       let newVal = null;
                       if (currentVal !== null) {
                           // Convert annual equivalent back to new freq
                           const annual = currentVal * oldMultiplier;
                           newVal = annual / newMultiplier;
                       }
                       setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, repaymentFreq: newFreq, userRepayment: newVal}}));
                     }}
                  >
                     <option value="week">Weekly</option>
                     <option value="fortnight">Fortnightly</option>
                     <option value="month">Monthly</option>
                  </select>
               </div>
               
               <div className="mb-4">
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-100">{formatCurrency(actualRepayment)}</p>
                  <p className="text-xs text-slate-400 mt-1">
                     Minimum: {formatCurrency(minRepayment)}
                  </p>
               </div>

               <input 
                  type="range" 
                  min={sliderMin} 
                  max={sliderMax} 
                  step={10}
                  value={Math.max(sliderMin, actualRepayment)} 
                  onChange={(e) => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, userRepayment: Number(e.target.value)}}))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
               
               <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                  <span>Min</span>
                  <span>Max ({formatCurrency(maxCapacity)})</span>
               </div>

               {isBelowInterest && (
                   <div className="flex items-start gap-2 p-2 mt-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Warning: Below Interest ({formatCurrency(firstPeriodInterest)})</span>
                   </div>
               )}
               
               <div className="mt-3 text-center">
                  <button 
                     onClick={() => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, userRepayment: budgetRepayment}}))}
                     className={`text-xs flex items-center gap-1 justify-center transition-colors ${isBudgetBelowMin ? 'text-red-500 font-semibold' : 'text-blue-600 hover:underline dark:text-blue-400'}`}
                  >
                     <RefreshCcw className="w-3 h-3"/> 
                     {isBudgetBelowMin 
                        ? `Budget amount (${formatCurrency(budgetRepayment)}) < Min!` 
                        : `Reset to Budgeted Amount (${formatCurrency(budgetRepayment)})`
                     }
                  </button>
               </div>
            </div>

            <div className="space-y-3">
               <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Property Value (Current)</label>
                  <NumberInput 
                    value={propertyValue} 
                    onValueChange={(val) => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, propertyValue: val}}))}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                  />
               </div>

               <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Property Growth (%) p.a.</label>
                  <input type="number" value={growthRate} onChange={e => setState((s: AppState) => ({...s, mortgageParams: {...s.mortgageParams, growthRate: Number(e.target.value)}}))} className="w-20 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
               </div>
            </div>
          </div>
       </div>
       
       <main className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 md:p-6 overflow-hidden min-h-[400px]">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
             <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mortgage Trajectory</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Equity & Offset Projection</p>
             </div>
             <div className="flex gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-xs text-slate-400 uppercase font-bold">Mortgage Free In</p>
                   <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{payoffActual} Years</p>
                   {payoffActual < payoffStandard && <p className="text-[10px] text-emerald-500 dark:text-emerald-400">Saved {payoffStandard - payoffActual} years</p>}
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400 uppercase font-bold">Projected Equity (30y)</p>
                   <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatLargeCurrency(simData[simData.length-1].equity)}</p>
                </div>
             </div>
          </div>

          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                   <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.userSettings.darkMode ? '#334155' : '#ccc'} />
                   <XAxis dataKey="year" tick={{fontSize: 12, fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b'}} />
                   <YAxis tickFormatter={formatLargeCurrency} tick={{fontSize: 12, fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b'}} />
                   <RechartsTooltip 
                      formatter={(v: number) => formatCurrency(v)} 
                      contentStyle={{ backgroundColor: state.userSettings.darkMode ? '#1e293b' : '#fff', borderColor: state.userSettings.darkMode ? '#334155' : '#ccc', color: state.userSettings.darkMode ? '#fff' : '#000' }}
                   />
                   <Legend 
                      verticalAlign="bottom" 
                      height={60} 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} 
                   />
                   <Area type="monotone" dataKey="property" name="Property Value" stroke="#10b981" fill="url(#equityGrad)" strokeWidth={2} />
                   <Area type="monotone" dataKey="balanceStandard" name="Min Schedule" stroke="#94a3b8" fill="none" strokeDasharray="5 5" strokeWidth={2} />
                   <Area type="monotone" dataKey="balanceActual" name="Your Trajectory" stroke="#ef4444" fill="none" strokeWidth={3} />
                   <Area type="monotone" dataKey="redraw" name="Accrued Offset" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={0} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </main>
    </div>
  );
};
