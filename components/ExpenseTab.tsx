
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Trash2, Link as LinkIcon, X, Pencil, RefreshCw } from 'lucide-react';
import { AppState, FrequencyUnit, ExpenseItem } from '../types';
import { FREQ_LABELS, FREQ_MULTIPLIERS, COLORS, formatCurrency } from '../constants';
import { NumberInput } from './NumberInput';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  netIncomeAnnual: number;
  setActiveTab: (tab: string) => void;
}

export const ExpenseTab: React.FC<Props> = ({ state, setState, netIncomeAnnual }) => {
  const [displayPeriod, setDisplayPeriod] = useState<FrequencyUnit>('month');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExp, setNewExp] = useState({ name: '', amount: 0, freqVal: 1, freqUnit: 'month' as FrequencyUnit, cat: 'Mortgage/Rent', isMortgageLink: false });
  
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const getAnnualCost = (item: any) => (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
  const totalExpenseAnnual = state.expenses.reduce((acc, item) => acc + getAnnualCost(item), 0);
  const surplusAnnual = netIncomeAnnual - totalExpenseAnnual;

  const getDisplayedCost = (annualCost: number) => annualCost / FREQ_MULTIPLIERS[displayPeriod];
  const displayedSurplus = getDisplayedCost(surplusAnnual);

  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof state.expenses> = {};
    state.expenses.forEach(e => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [state.expenses]);

  const pieData = useMemo(() => {
     const map: any = {};
     state.expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + getAnnualCost(e); });
     return Object.entries(map).map(([name, val]) => ({ name, value: val as number }));
  }, [state.expenses]);

  const loadForEditing = (item: ExpenseItem) => {
     setEditingId(item.id);
     setNewExp({
        name: item.name,
        amount: item.amount,
        freqVal: item.freqValue,
        freqUnit: item.freqUnit,
        cat: item.category,
        isMortgageLink: item.isMortgageLink
     });
  };

  const cancelEdit = () => {
     setEditingId(null);
     setNewExp({ name: '', amount: 0, freqVal: 1, freqUnit: 'month', cat: state.expenseCategories[0], isMortgageLink: false });
  };

  const saveExpense = () => {
     if(!newExp.name || newExp.amount === 0) return;
     
     if (editingId) {
        // Update existing
        setState((s: AppState) => ({
           ...s,
           expenses: s.expenses.map(e => e.id === editingId ? {
              ...e,
              name: newExp.name,
              amount: newExp.amount,
              freqValue: newExp.freqVal,
              freqUnit: newExp.freqUnit,
              category: newExp.cat,
              isMortgageLink: e.isMortgageLink 
           } : e)
        }));
     } else {
        // Create new
        setState((s: AppState) => ({...s, expenses: [...s.expenses, {
          id: Date.now().toString(), 
          name: newExp.name, 
          amount: newExp.amount, 
          freqValue: newExp.freqVal, 
          freqUnit: newExp.freqUnit, 
          category: newExp.cat, 
          isMortgageLink: newExp.cat === 'Mortgage/Rent'
        }]}));
     }
     cancelEdit();
  };

  return (
    <div className="h-full flex flex-col md:flex-row p-6 gap-6 overflow-y-auto relative">
      <div className="w-full md:w-1/3 space-y-4">
         
         {/* Edit/Add Form - Conditional Modal Style on Mobile */}
         <div className={`p-4 rounded-xl border transition-all duration-300 ${
             editingId 
             ? 'fixed inset-0 z-50 bg-white/95 dark:bg-slate-900/95 flex flex-col justify-center p-6 md:p-4 md:static md:bg-amber-50 md:dark:bg-amber-900/20 md:border-amber-200 md:dark:border-amber-700 shadow-2xl md:shadow-none' 
             : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
         }`}>
           <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-lg md:text-base ${editingId ? 'text-amber-700 dark:text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>{editingId ? 'Edit Expense' : 'Add Expense'}</h3>
              {!editingId && (
                 <button 
                  onClick={() => setState((s: AppState) => ({...s, userSettings: {...s.userSettings, isRenting: !s.userSettings.isRenting}}))}
                  className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors ${state.userSettings.isRenting ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'}`}
                 >
                  {state.userSettings.isRenting ? 'I am renting' : 'I live in PPOR'}
                 </button>
              )}
              {editingId && <button onClick={cancelEdit} className="md:hidden p-2 text-slate-500"><X className="w-6 h-6"/></button>}
           </div>
           
           <div className="space-y-4 md:space-y-3">
             <input placeholder="Description" className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-3 md:py-2 text-base md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={newExp.name} onChange={e => setNewExp({...newExp, name: e.target.value})} />
             <div className="flex gap-2 items-center">
                <div className="relative w-full md:w-24">
                   <DollarSign className="w-3 h-3 absolute top-3.5 md:top-3 left-2 text-slate-400"/>
                   <NumberInput 
                        value={newExp.amount} 
                        onValueChange={(val) => setNewExp({...newExp, amount: val})}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded pl-6 pr-2 py-3 md:py-2 text-base md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                   />
                </div>
                <span className="text-xs text-slate-400 shrink-0">per</span>
                <input type="number" className="w-16 md:w-12 border border-slate-300 dark:border-slate-600 rounded px-1 py-3 md:py-2 text-center text-base md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={newExp.freqVal} onChange={e => setNewExp({...newExp, freqVal: Number(e.target.value)})} />
                <select className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-1 py-3 md:py-2 text-base md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={newExp.freqUnit} onChange={e => setNewExp({...newExp, freqUnit: e.target.value as FrequencyUnit})}>
                   {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
                   <button onClick={() => setShowCatManager(!showCatManager)} className="text-[10px] text-blue-500 hover:underline">{showCatManager ? 'Done' : 'Manage'}</button>
                </div>
                {showCatManager ? (
                   <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 mb-2">
                      <div className="flex gap-2 mb-2">
                         <input placeholder="New Category" className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                         <button onClick={() => {
                            if(newCatName && !state.expenseCategories.includes(newCatName)) {
                               setState((s: AppState) => ({...s, expenseCategories: [...s.expenseCategories, newCatName]}));
                               setNewCatName('');
                            }
                         }} className="bg-blue-600 text-white px-2 rounded text-xs">Add</button>
                      </div>
                      <div className="max-h-20 overflow-y-auto space-y-1">
                         {state.expenseCategories.map(c => (
                            <div key={c} className="flex justify-between text-xs px-1 text-slate-700 dark:text-slate-300">
                               <span>{c}</span>
                               {!['Mortgage/Rent','Food'].includes(c) && <button onClick={() => setState((s: AppState) => ({...s, expenseCategories: s.expenseCategories.filter(cat => cat !== c)}))}><X className="w-3 h-3 text-red-400"/></button>}
                            </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <select className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-3 md:py-2 text-base md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={newExp.cat} onChange={e => setNewExp({...newExp, cat: e.target.value})}>
                      {state.expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                )}
             </div>

             <div className="flex gap-2 pt-2 md:pt-0">
               {editingId && (
                  <button onClick={cancelEdit} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 md:py-2 rounded font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancel</button>
               )}
               <button onClick={saveExpense} className={`flex-1 py-3 md:py-2 rounded font-medium text-white transition-colors ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {editingId ? 'Update' : 'Add Expense'}
               </button>
             </div>
           </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-[350px]">
            <h4 className="text-xs font-bold text-slate-400 uppercase text-center mb-2">Category Split</h4>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={2} 
                  dataKey="value"
                  label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip 
                  formatter={(val: number) => formatCurrency(val)} 
                  contentStyle={{ backgroundColor: state.userSettings.darkMode ? '#1e293b' : '#fff', borderColor: state.userSettings.darkMode ? '#334155' : '#ccc', color: state.userSettings.darkMode ? '#fff' : '#000' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="w-full md:w-2/3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-700 dark:text-slate-200">Expense List</h3>
           <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">View as:</span>
              <select className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={displayPeriod} onChange={e => setDisplayPeriod(e.target.value as FrequencyUnit)}>
                 {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
           </div>
         </div>
         
         {!state.userSettings.isRenting && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-3 rounded mb-4 flex gap-3">
               <LinkIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
               <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Mortgage Repayment Link</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Expenses with this icon are automatically summed as your <strong>Actual Repayment</strong> in the Mortgage Tab (if "Link from Expenses" is selected).</p>
               </div>
            </div>
         )}

         <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {Object.entries(groupedExpenses).map(([category, items]) => {
               const catTotalAnnual = items.reduce((acc, i) => acc + getAnnualCost(i), 0);
               const catPercentIncome = netIncomeAnnual > 0 ? (catTotalAnnual / netIncomeAnnual) * 100 : 0;
               
               return (
                  <div key={category}>
                     <div className="flex justify-between items-center mb-2 px-2 bg-slate-50 dark:bg-slate-800 py-1 rounded">
                        <div className="flex items-center gap-2">
                           <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded font-bold">{catPercentIncome.toFixed(1)}% of Net</span>
                           <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{category}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(getDisplayedCost(catTotalAnnual))} total</span>
                     </div>
                     <div className="space-y-1 pl-2">
                        {items.map(item => {
                           const annualItemCost = getAnnualCost(item);
                           const itemPercent = netIncomeAnnual > 0 ? (annualItemCost / netIncomeAnnual) * 100 : 0;
                           
                           return (
                           <div key={item.id} className={`flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-800 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800 ${editingId === item.id ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">{item.name}</p>
                                    {!state.userSettings.isRenting && item.isMortgageLink && (
                                       <span title="Linked to Mortgage Projector">
                                          <LinkIcon className="w-3 h-3 text-emerald-500" />
                                       </span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-blue-400 font-medium">{itemPercent.toFixed(2)}% of Net</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">• ${item.amount} / {item.freqValue > 1 ? item.freqValue + ' ' : ''}{item.freqUnit}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <p className="font-semibold text-slate-600 dark:text-slate-400 text-xs">{formatCurrency(getDisplayedCost(annualItemCost))}</p>
                                 {!state.userSettings.isRenting && (
                                    <button onClick={() => {
                                       const newExps = state.expenses.map(e => e.id === item.id ? { ...e, isMortgageLink: !e.isMortgageLink } : e);
                                       setState({...state, expenses: newExps});
                                    }} className={`p-1 rounded transition-colors ${item.isMortgageLink ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400' : 'text-slate-300 hover:text-emerald-500'}`} title="Toggle Mortgage Link">
                                       <LinkIcon className="w-3 h-3" />
                                    </button>
                                 )}
                                 <button onClick={() => loadForEditing(item)} className="text-slate-300 hover:text-blue-500" title="Edit">
                                    <Pencil className="w-3 h-3" />
                                 </button>
                                 <button onClick={() => setState((s: AppState) => ({...s, expenses: s.expenses.filter(e => e.id !== item.id)}))} className="text-slate-300 hover:text-red-500" title="Delete">
                                    <Trash2 className="w-3 h-3" />
                                 </button>
                              </div>
                           </div>
                        )})}
                     </div>
                  </div>
               )
            })}
         </div>
         <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded">
               <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold">Total Expenses ({FREQ_LABELS[displayPeriod]})</p>
               <p className="text-xl font-bold text-red-800 dark:text-red-200">{formatCurrency(getDisplayedCost(totalExpenseAnnual))}</p>
            </div>
            <div className={`p-3 rounded ${surplusAnnual > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
               <p className={`text-xs uppercase font-bold ${surplusAnnual > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>Surplus ({FREQ_LABELS[displayPeriod]})</p>
               <p className={`text-xl font-bold ${surplusAnnual > 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-orange-800 dark:text-orange-200'}`}>{formatCurrency(displayedSurplus)}</p>
            </div>
         </div>
      </div>
    </div>
  );
};
