
import React from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Trash2, HelpCircle, Info, ShieldCheck, Zap, RefreshCw, TrendingUp } from 'lucide-react';
import { AppState, LiabilityItem } from '../types';
import { formatCurrency, formatLargeCurrency } from '../constants';
import { generateNetWorthSimulation, calculateAnnualAmount } from '../services/mathService';
import { NumberInput } from './NumberInput';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  surplusAnnual: number;
}

export const NetWorthTab: React.FC<Props> = ({ state, setState, surplusAnnual }) => {
  const { data: simData, fireTarget, velocity } = generateNetWorthSimulation(state, surplusAnnual);
  
  // Calculate when FIRE happens based on the simulation crossing the dynamic target
  const fireYear = simData.find(d => d.netWorth >= d.fireTarget)?.year;

  const totalAssets = state.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilitiesBalance = state.liabilities.reduce((acc, l) => acc + l.balance, 0);
  
  // Per user request: DO NOT factor in PPOR or Mortgage in Net Worth calculation
  // Simple = Investable Assets only
  // Rigorous = Investable Assets - Non-mortgage Liabilities
  const currentNetWorth = state.fireMode === 'simple'
    ? totalAssets
    : totalAssets - totalLiabilitiesBalance;

  const addLiability = () => {
     const newL: LiabilityItem = { id: Date.now().toString(), name: 'New Debt', balance: 0, category: 'Personal' };
     setState(s => ({ ...s, liabilities: [...s.liabilities, newL] }));
  };

  const updateLiability = (id: string, updates: Partial<LiabilityItem>) => {
     setState(s => ({ ...s, liabilities: s.liabilities.map(l => l.id === id ? { ...l, ...updates } : l) }));
  };

  const removeLiability = (id: string) => {
     setState(s => ({ ...s, liabilities: s.liabilities.filter(l => l.id !== id) }));
  };

  const syncRetirementCostFromExpenses = () => {
    const nonMortgageAnnual = state.expenses
      .filter(e => !e.isMortgageLink)
      .reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
    setState(s => ({...s, retirementBaseCost: Math.round(nonMortgageAnnual)}));
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-y-auto">
      <div className="w-full md:w-1/3 space-y-6">
        
        {/* ASSETS CARD */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col max-h-[600px]">
           <div className="flex justify-between items-center mb-4 shrink-0 px-1">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">Investable Assets</h3>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none leading-relaxed">
                  Only include <strong>investable assets</strong> (ETFs, Super, Crypto) that fund your future. Home (PPOR) value is excluded from all net worth calculations.
                </div>
              </div>
           </div>
           
           {/* Scrollable Container (Slider functionality to prevent card growth) */}
           <div className="space-y-3 mb-4 overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-[200px] max-h-[450px]">
              {state.assets.map((item, idx) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 hover:border-blue-300 transition-colors group/item shadow-sm">
                   <div className="flex flex-col gap-2.5">
                      {/* ROW 1: Separate row for Asset Name */}
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <label className="text-[7px] text-slate-400 font-bold uppercase mb-0.5 block ml-1">Asset Name</label>
                          <input 
                             className="w-full font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 outline-none text-[10px] ml-0.5 truncate focus:border-blue-400" 
                             value={item.name} 
                             placeholder="Asset Name (e.g. VGS ETF)"
                             onChange={e => {
                                const newAssets = [...state.assets]; newAssets[idx].name = e.target.value; setState({...state, assets: newAssets});
                             }} 
                          />
                        </div>
                        <button 
                          onClick={() => setState((s: AppState) => ({...s, assets: s.assets.filter(a => a.id !== item.id)}))} 
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Remove Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </div>

                      {/* ROW 2: Asset Type, Balance, and Growth Rate in the same row */}
                      <div className="flex items-center gap-2">
                        {/* Type */}
                        <div className="w-30 shrink-0">
                          <label className="text-[7px] text-slate-400 font-bold uppercase mb-0.5 block ml-1">Asset Type</label>
                          <select 
                            className="w-full border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-[9px] bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium" 
                            value={item.category} 
                            onChange={e => {
                               const newAssets = [...state.assets]; newAssets[idx].category = e.target.value; setState({...state, assets: newAssets});
                            }}
                          >
                            {state.assetCategories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* Balance */}
                        <div className="flex-1 min-w-0">
                          <label className="text-[7px] text-slate-400 font-bold uppercase mb-0.5 block ml-1">Current Balance</label>
                          <div className="relative">
                             <DollarSign className="w-2 h-2 absolute top-1.5 left-1 text-slate-400"/>
                             <NumberInput 
                                value={item.value} 
                                onValueChange={(val) => {
                                    const newAssets = [...state.assets]; 
                                    newAssets[idx].value = val; 
                                    setState({...state, assets: newAssets});
                                }}
                                className="w-full pl-3.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-100 font-bold bg-white dark:bg-slate-900 text-[10px]" 
                             />
                          </div>
                        </div>

                        {/* Growth */}
                        <div className="w-1/6 shrink-0">
                          <label className="text-[7px] text-slate-400 font-bold uppercase mb-0.5 block ml-1 ">CAGR</label>
                          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5">
                             <input 
                               type="number" 
                               step="0.1"
                               className="w-full bg-transparent text-[10px] outline-none text-blue-600 dark:text-blue-400 font-bold text-right"
                               value={item.growthRate} 
                               onChange={e => {
                                  const newAssets = [...state.assets];
                                  newAssets[idx].growthRate = Number(e.target.value);
                                  setState({...state, assets: newAssets});
                               }}
                             />
                             <span className="text-[9px] text-slate-400 ml-0.5 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <button onClick={() => {
              setState((s: AppState) => ({...s, assets: [...s.assets, { id: Date.now().toString(), name: 'New Asset', value: 0, category: 'Shares', growthRate: 7 }]}));
           }} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-xs hover:bg-blue-700 transition-colors shrink-0 shadow-sm active:scale-[0.98]">
             Add Investable Asset
           </button>
        </div>

        {/* LIABILITIES CARD */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 px-1">Liabilities (Non-Mortgage)</h3>
           <div className="space-y-2 mb-4">
              {state.liabilities.map(l => (
                  <div key={l.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 group">
                      <div className="flex justify-between items-center mb-2">
                        <input className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-transparent border-b border-transparent focus:border-blue-400 outline-none w-1/2 ml-2" value={l.name} onChange={e => updateLiability(l.id, { name: e.target.value })} />
                        <button onClick={() => removeLiability(l.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                           <DollarSign className="w-3 h-3 absolute top-2 left-1 text-slate-400"/>
                           <NumberInput 
                              value={l.balance} 
                              onValueChange={(val) => updateLiability(l.id, { balance: val })}
                              className="w-full pl-4 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                           />
                        </div>
                        <select className="text-[10px] border border-slate-200 dark:border-slate-700 rounded px-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value={l.category} onChange={e => updateLiability(l.id, { category: e.target.value as any })}>
                           <option value="Personal">Personal Debt</option>
                           <option value="Business">Business Debt</option>
                           <option value="Investment">Investment Debt</option>
                        </select>
                      </div>
                  </div>
              ))}
           </div>
           <button onClick={addLiability} className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-2 rounded font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Add Sinking Fund (Car, Loans)</button>
           <p className="text-[9px] text-slate-400 mt-2 italic px-1">* Mortgage is tracked separately and excluded from NW basis.</p>
        </div>
        
        {/* Net Worth Summary */}
        <div className="bg-indigo-600 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-20 h-20" /></div>
           <h3 className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
            {state.fireMode === 'simple' ? 'Investable Assets' : 'Rigorous Net Worth'}
           </h3>
           <p className="text-3xl font-bold">{formatCurrency(currentNetWorth)}</p>
           <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-[10px] uppercase font-bold opacity-90">
              <div>
                 <p className="opacity-60 mb-0.5">Liquid Assets</p>
                 <p>{formatCurrency(totalAssets)}</p>
              </div>
              <div>
                 <p className="opacity-60 mb-0.5">Non-Mortgage Debt</p>
                 <p>{formatCurrency(totalLiabilitiesBalance)}</p>
              </div>
           </div>
           <p className="text-[9px] mt-2 opacity-60 italic text-center">PPOR value & Mortgage balance excluded by design</p>
        </div>
      </div>

      <div className="w-full md:w-2/3 flex flex-col gap-6">
         {/* FIRE TARGET CARD */}
         <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <h3 className="font-bold text-slate-800 dark:text-white text-lg">Financial Independence (FIRE)</h3>
                     <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button 
                           onClick={() => setState(s => ({...s, fireMode: 'simple'}))}
                           className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all ${state.fireMode === 'simple' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                        >Simple</button>
                        <button 
                           onClick={() => setState(s => ({...s, fireMode: 'rigorous'}))}
                           className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all ${state.fireMode === 'rigorous' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >Rigorous</button>
                     </div>
                  </div>
                  <p className="text-xs text-slate-400">Projection tracks {state.fireMode === 'simple' ? 'Investable Assets' : 'NW (Assets - Debt)'} vs dynamic target.</p>
               </div>
               
               <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Estimated FIRE Date</p>
                  <p className="text-3xl font-bold text-orange-500">{fireYear ? `In ${fireYear} Years` : '> 30 Years'}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               <div className="space-y-4">
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                           Post-Debt Living Cost ($/yr) 
                           <Info className="w-3 h-3 text-slate-300" />
                        </label>
                        <button onClick={syncRetirementCostFromExpenses} className="text-[9px] text-blue-500 hover:text-blue-700 flex items-center gap-1 uppercase font-bold">
                           <RefreshCw className="w-2.5 h-2.5" /> Sync from Exp.
                        </button>
                     </div>
                     <div className="relative">
                        <DollarSign className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
                        <NumberInput 
                           value={state.retirementBaseCost} 
                           onValueChange={val => setState(s => ({...s, retirementBaseCost: val}))}
                           className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 py-2 text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                     </div>
                     <p className="text-[10px] text-slate-400 mt-1 italic">Groceries, bills, travel, health. Exclude mortgage/debts.</p>
                  </div>

                  <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-2">
                        Safe Withdrawal Rate (%)
                     </label>
                     <div className="flex items-center gap-3">
                        <input 
                           type="range" min="2" max="5.5" step="0.1" 
                           value={state.swr} 
                           onChange={e => setState(s => ({...s, swr: Number(e.target.value)}))}
                           className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400 w-12">{state.swr}%</span>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">FIRE Target (Today)</h4>
                  <div className="space-y-3">
                     <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500">Perpetual Engine ({100/state.swr}x)</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency((state.retirementBaseCost || 0) * (100/state.swr))}</span>
                     </div>
                     {state.fireMode === 'rigorous' && (
                        <>
                           <div className="flex justify-between items-end">
                              <span className="text-xs text-slate-500">Mortgage Bridge</span>
                              <span className="text-sm font-bold text-red-500">{formatCurrency(!state.userSettings.isRenting ? state.mortgageParams.principal : 0)}</span>
                           </div>
                           <div className="flex justify-between items-end pb-2 border-b border-slate-200 dark:border-slate-800">
                              <span className="text-xs text-slate-500">All Debt Bridges</span>
                              <span className="text-sm font-bold text-red-500">{formatCurrency(state.liabilities.reduce((a,b) => a+b.balance, 0))}</span>
                           </div>
                        </>
                     )}
                     <div className="flex justify-between items-end pt-1">
                        <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tighter">Current Target</span>
                        <span className="text-xl font-black text-orange-500">{formatCurrency(fireTarget)}</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="h-[300px] w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={simData} margin={{top: 10, right: 30, left: -20, bottom: 0}}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={state.userSettings.darkMode ? '#334155' : '#ccc'} />
                     <XAxis dataKey="year" tick={{fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b', fontSize: 10}} />
                     <YAxis tickFormatter={formatLargeCurrency} tick={{fill: state.userSettings.darkMode ? '#94a3b8' : '#64748b', fontSize: 10}} />
                     <RechartsTooltip 
                        formatter={(v: number) => formatCurrency(v)} 
                        contentStyle={{ backgroundColor: state.userSettings.darkMode ? '#1e293b' : '#fff', borderColor: state.userSettings.darkMode ? '#334155' : '#ccc', color: state.userSettings.darkMode ? '#fff' : '#000' }}
                     />
                     <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                     <Area type="monotone" dataKey="netWorth" name={state.fireMode === 'rigorous' ? "NW Basis (Assets-Debt)" : "Investable Assets"} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                     <Line type="stepAfter" dataKey="fireTarget" name="FIRE Target (Dynamic)" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
               <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-lg text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500 tracking-wider">Asset Injection Rate</p>
                     <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(velocity)}/yr</p>
                  </div>
               </div>
               <p className="text-[10px] text-emerald-700 dark:text-emerald-400 italic max-w-xs">
                  Your current investable surplus being added to your portfolio. PPOR principal payments are excluded from this specific wealth velocity.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
