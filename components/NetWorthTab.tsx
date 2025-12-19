
import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Trash2, HelpCircle, Info } from 'lucide-react';
import { AppState } from '../types';
import { formatCurrency, formatLargeCurrency } from '../constants';
import { generateNetWorthSimulation } from '../services/mathService';
import { NumberInput } from './NumberInput';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  surplusAnnual: number;
}

export const NetWorthTab: React.FC<Props> = ({ state, setState, surplusAnnual }) => {
  const { data: simData, fireTarget, velocity } = generateNetWorthSimulation(state, surplusAnnual);
  const fireYear = simData.find(d => d.netWorth >= d.fireTarget)?.year;

  // Calculation for current net worth
  const totalAssets = state.assets.reduce((sum, a) => sum + a.value, 0);
  const propertyValue = !state.userSettings.isRenting ? state.mortgageParams.propertyValue : 0;
  const mortgageBalance = !state.userSettings.isRenting ? state.mortgageParams.principal : 0;
  
  // Future proofing: Total Liabilities is mortgage for now
  const totalLiabilities = mortgageBalance;

  const currentNetWorth = (totalAssets + propertyValue) - totalLiabilities;

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-6 overflow-y-auto">
      <div className="w-full md:w-1/3 space-y-6">
        
        {/* ASSETS CARD */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Assets</h3>
           <div className="space-y-2 mb-4">
              {state.assets.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                   <div className="flex justify-between items-center mb-2">
                     <input className="font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border-b border-transparent focus:border-blue-300 outline-none text-sm w-1/2" value={item.name} onChange={e => {
                        const newAssets = [...state.assets]; newAssets[idx].name = e.target.value; setState({...state, assets: newAssets});
                     }} />
                     <button onClick={() => setState((s: AppState) => ({...s, assets: s.assets.filter(a => a.id !== item.id)}))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                   </div>
                   <div className="flex justify-between items-center text-sm gap-2">
                      <div className="relative flex-1">
                         <DollarSign className="w-3 h-3 absolute top-2 left-1 text-slate-400"/>
                         <NumberInput 
                            value={item.value} 
                            onValueChange={(val) => {
                                const newAssets = [...state.assets]; 
                                newAssets[idx].value = val; 
                                setState({...state, assets: newAssets});
                            }}
                            className="w-full pl-4 py-1 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-100 font-bold bg-white dark:bg-slate-900" 
                         />
                      </div>
                      <select className="border border-slate-200 dark:border-slate-700 rounded px-1 py-1 text-xs w-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={item.category} onChange={e => {
                         const newAssets = [...state.assets]; newAssets[idx].category = e.target.value; setState({...state, assets: newAssets});
                      }}>
                         {state.assetCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-24">
                         <input type="number" step="0.1" className="w-full text-right outline-none font-semibold text-blue-600 dark:text-blue-400 bg-transparent" value={item.growthRate} onChange={(e) => {
                              const newAssets = [...state.assets]; newAssets[idx].growthRate = Number(e.target.value); setState({...state, assets: newAssets});
                           }} />
                         <span className="text-xs text-slate-500 dark:text-slate-400">%</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
             <button onClick={() => {
                setState((s: AppState) => ({...s, assets: [...s.assets, { id: Date.now().toString(), name: 'New Asset', value: 0, category: 'Shares', growthRate: 7 }]}));
             }} className="w-full bg-blue-600 text-white py-2 rounded font-medium text-sm">Add Asset</button>
           </div>
        </div>

        {/* LIABILITIES CARD */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Liabilities</h3>
           <div className="space-y-2 mb-4">
              {!state.userSettings.isRenting && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Primary Mortgage</span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Linked</span>
                     </div>
                     <div className="relative">
                        <DollarSign className="w-3 h-3 absolute top-2 left-1 text-slate-400"/>
                        <NumberInput 
                           value={state.mortgageParams.principal} 
                           onValueChange={(val) => setState(s => ({...s, mortgageParams: {...s.mortgageParams, principal: val}}))}
                           className="w-full pl-4 py-1 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 font-bold bg-white dark:bg-slate-900" 
                        />
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1">Updates Mortgage Tab automatically.</p>
                  </div>
              )}
              {state.userSettings.isRenting && (
                  <div className="text-center py-4 text-slate-400 text-xs italic">
                     No mortgage liabilities found (Renting mode).
                  </div>
              )}
           </div>
        </div>
        
        {/* Net Worth Calculation Details */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
           <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">Calculation Details <span className="text-[10px] text-slate-400 font-normal">(Current)</span></h3>
           <div className="space-y-2 text-sm">
             <div className="flex justify-between text-slate-600 dark:text-slate-400">
               <span>Liquid Assets</span>
               <span>{formatCurrency(totalAssets)}</span>
             </div>
             {propertyValue > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Property Value</span>
                  <span>+ {formatCurrency(propertyValue)}</span>
                </div>
             )}
             <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
             <div className="flex justify-between font-bold text-slate-800 dark:text-slate-100">
               <span>Total Assets</span>
               <span>{formatCurrency(totalAssets + propertyValue)}</span>
             </div>
             
             <div className="mt-4"></div>
             {totalLiabilities > 0 && (
               <div className="flex justify-between text-red-600 dark:text-red-400">
                 <span>Total Liabilities</span>
                 <span>- {formatCurrency(totalLiabilities)}</span>
               </div>
             )}
             
             <div className="border-t-2 border-slate-100 dark:border-slate-800 my-2 pt-1"></div>
             <div className="flex justify-between text-lg font-bold text-blue-600 dark:text-blue-400">
               <span>Net Worth</span>
               <span>{formatCurrency(currentNetWorth)}</span>
             </div>
           </div>
        </div>
      </div>

      <div className="w-full md:w-2/3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
         <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">FIRE & Net Worth</h3>
                  <div className="flex items-center gap-2">
                     <p className="text-sm text-slate-500 dark:text-slate-400">Target:</p>
                     <div className="relative w-32">
                        <DollarSign className="w-3 h-3 absolute top-1.5 left-1 text-slate-400"/>
                        <NumberInput 
                           value={Math.round(fireTarget)} 
                           onValueChange={(val) => setState((s: AppState) => ({...s, fireTargetOverride: val}))}
                           className="w-full pl-4 py-0.5 border rounded text-sm font-bold text-orange-500 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800"
                        />
                     </div>
                     <div className="group relative z-50">
                        <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                        <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                           <p className="font-bold mb-1">The 4% Rule</p>
                           <p className="mb-2">Standard FIRE assumes you can withdraw 4% of your portfolio annually. This requires a net worth of <strong>25x your annual expenses</strong>.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="text-right">
               <p className="text-xs text-slate-400 uppercase font-bold">Time to FIRE</p>
               <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{fireYear ? `${fireYear} Years` : '> 30 Years'}</p>
            </div>
         </div>
         <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={simData} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.userSettings.darkMode ? '#334155' : '#ccc'} />
                  <XAxis dataKey="year" tick={{fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b'}} />
                  <YAxis tickFormatter={formatLargeCurrency} tick={{fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b'}} />
                  <RechartsTooltip 
                     formatter={(v: number) => formatCurrency(v)} 
                     contentStyle={{ backgroundColor: state.userSettings.darkMode ? '#1e293b' : '#fff', borderColor: state.userSettings.darkMode ? '#334155' : '#ccc', color: state.userSettings.darkMode ? '#fff' : '#000' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="netWorth" name="Net Worth (Assets + Prop - Debt)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                  <Line type="monotone" dataKey="fireTarget" name="FIRE Target" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
               </ComposedChart>
            </ResponsiveContainer>
         </div>
         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs">
               Net Worth = (Property + Liquid Assets) - Liabilities
            </span>
            {!state.userSettings.isRenting && (
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Wealth Velocity:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(velocity)}/yr</span>
                  <div className="group relative">
                     <Info className="w-3 h-3 text-slate-400 cursor-help" />
                     <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                        Your total annual wealth creation (Cash Surplus + Principal Paydown).
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
