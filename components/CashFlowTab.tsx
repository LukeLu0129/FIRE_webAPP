
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Chart } from "react-google-charts";
import { AppState, FrequencyUnit } from '../types';
import { FREQ_LABELS, FREQ_MULTIPLIERS, formatCurrency } from '../constants';
import { Plus, Trash2, HelpCircle, GripVertical, X, AlertCircle, Palette, Pencil, Check } from 'lucide-react';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  netIncomeAnnual: number;
}

const RAINBOW_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
  '#d946ef', '#ec4899'
];

const INCOME_GREYS = [
  '#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
];

const adjustColor = (col: string, amt: number) => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255; else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255; else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255; else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

const shortCurrency = (val: number) => {
    if (val >= 1000) return '$' + (val / 1000).toFixed(1).replace('.0','') + 'k';
    return '$' + val.toFixed(0);
};

export const CashFlowTab: React.FC<Props> = ({ state, setState, netIncomeAnnual }) => {
  const [displayPeriod, setDisplayPeriod] = useState<FrequencyUnit>('month');
  const [newAccountName, setNewAccountName] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Robust click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if we clicked inside the picker or on a toggle button
      if (colorPickerRef.current && !colorPickerRef.current.contains(target) && !target.closest('[data-color-toggle]')) {
        setActiveColorPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayFactor = 1 / FREQ_MULTIPLIERS[displayPeriod];

  const annualIncomes = useMemo(() => state.incomes.map(item => {
    const gross = (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
    return { ...item, grossAnnual: gross };
  }), [state.incomes]);

  const totalGrossForRatio = useMemo(() => annualIncomes.reduce((acc, i) => acc + i.grossAnnual, 0) || 1, [annualIncomes]);
  const getAnnualCost = (item: any) => (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
  
  const expensesByCategory = useMemo(() => {
    const sums: Record<string, number> = {};
    state.expenses.forEach(exp => {
      sums[exp.category] = (sums[exp.category] || 0) + getAnnualCost(exp);
    });
    return sums;
  }, [state.expenses]);
  
  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const surplusAnnual = Math.max(0, netIncomeAnnual - totalExpenses);

  const unmappedCategories = useMemo(() => {
    return state.expenseCategories.filter(cat => {
      const amount = expensesByCategory[cat] || 0;
      return amount <= 0 || !state.categoryMap[cat];
    });
  }, [state.expenseCategories, expensesByCategory, state.categoryMap]);

  const activeCategories = useMemo(() => state.expenseCategories.filter(c => (expensesByCategory[c] || 0) > 0), [state.expenseCategories, expensesByCategory]);

  const bucketSums = useMemo(() => {
     const sums: Record<string, number> = {};
     state.accounts.forEach(acc => {
         const cats = state.expenseCategories.filter(c => state.categoryMap[c] === acc.id);
         const total = cats.reduce((accVal, cat) => accVal + (expensesByCategory[cat] || 0), 0);
         sums[acc.id] = total;
     });
     return sums;
  }, [state.accounts, state.categoryMap, expensesByCategory]);

  const { chartData, chartOptions, nodeCount } = useMemo(() => {
    const rows: [string, string, number][] = [];
    const colors: string[] = [];
    const nodeSet = new Set<string>();
    const addNode = (name: string, color: string) => {
        if (!nodeSet.has(name)) { nodeSet.add(name); colors.push(color); }
    };
    const poolName = `Net Cash (${shortCurrency(netIncomeAnnual * displayFactor)})`;
    const poolColor = '#3b82f6';

    annualIncomes.forEach((inc, idx) => {
       const ratio = inc.grossAnnual / totalGrossForRatio;
       const shareOfNet = netIncomeAnnual * ratio * displayFactor;
       if (shareOfNet > 0) {
           const incomeName = `${inc.name} (${shortCurrency(inc.grossAnnual * displayFactor)})`;
           addNode(incomeName, INCOME_GREYS[idx % INCOME_GREYS.length]);
           addNode(poolName, poolColor);
           rows.push([incomeName, poolName, shareOfNet]);
       }
    });

    if (annualIncomes.length === 0) addNode(poolName, poolColor);

    const bucketTotals: Record<string, number> = {};
    state.accounts.forEach(acc => bucketTotals[acc.id] = 0);
    let unmappedTotal = 0;

    activeCategories.forEach(cat => {
        const val = expensesByCategory[cat];
        const accId = state.categoryMap[cat];
        if (accId && bucketTotals[accId] !== undefined) bucketTotals[accId] += val; else unmappedTotal += val;
    });

    if (surplusAnnual > 0) {
        const surplusMiddle = `Surplus `;
        const surplusRight = `Surplus (${shortCurrency(surplusAnnual * displayFactor)})`;
        addNode(surplusMiddle, '#10b981');
        rows.push([poolName, surplusMiddle, surplusAnnual * displayFactor]);
        addNode(surplusRight, '#10b981');
        rows.push([surplusMiddle, surplusRight, surplusAnnual * displayFactor]);
    }

    state.accounts.forEach(acc => {
        if (bucketTotals[acc.id] > 0) {
            addNode(acc.name, acc.color);
            rows.push([poolName, acc.name, bucketTotals[acc.id] * displayFactor]);
            const catsInBucket = activeCategories.filter(c => state.categoryMap[c] === acc.id);
            catsInBucket.sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);
            catsInBucket.forEach((cat, idx) => {
                const val = expensesByCategory[cat] * displayFactor;
                const catName = `${cat} (${shortCurrency(val)})`;
                addNode(catName, adjustColor(acc.color, 30 + (idx * 15)));
                rows.push([acc.name, catName, val]);
            });
        }
    });

    if (unmappedTotal > 0) {
        addNode('Unmapped', '#ef4444');
        rows.push([poolName, 'Unmapped', unmappedTotal * displayFactor]);
        const catsUnmapped = activeCategories.filter(c => !state.categoryMap[c]);
        catsUnmapped.sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);
        catsUnmapped.forEach((cat, idx) => {
            const val = expensesByCategory[cat] * displayFactor;
            const catName = `${cat} (${shortCurrency(val)})`;
            addNode(catName, adjustColor('#ef4444', 30 + (idx * 15)));
            rows.push(['Unmapped', catName, val]);
        });
    }

    return { 
        chartData: [["From", "To", "Weight"], ...rows], 
        chartOptions: {
            sankey: {
                node: { colors, label: { fontName: 'sans-serif', fontSize: 10, color: state.userSettings.darkMode ? '#fff' : '#1e293b', bold: true }, nodePadding: 20, width: 14, interactivity: true },
                link: { colorMode: 'gradient', fillOpacity: 0.35 },
                iterations: 0,
            },
            backgroundColor: 'transparent',
            tooltip: { isHtml: true, textStyle: { fontSize: 12 } }
        },
        nodeCount: nodeSet.size
    };
  }, [state, netIncomeAnnual, expensesByCategory, displayFactor, surplusAnnual, totalGrossForRatio, annualIncomes, activeCategories]);

  const addAccount = () => {
    if(!newAccountName) return;
    const newId = Date.now().toString();
    setState((s) => ({ ...s, accounts: [...s.accounts, { id: newId, name: newAccountName, color: RAINBOW_PRESETS[s.accounts.length % RAINBOW_PRESETS.length] }] }));
    setNewAccountName('');
  };

  const updateAccountColor = (id: string, color: string) => {
    setState(prev => ({ ...prev, accounts: prev.accounts.map(acc => acc.id === id ? { ...acc, color } : acc) }));
  };

  const updateCategoryMap = (category: string, accountId: string | null) => {
     const newMap = { ...state.categoryMap };
     if (accountId === null) delete newMap[category]; else newMap[category] = accountId;
     setState((s) => ({ ...s, categoryMap: newMap }));
  };

  const handleDragStartCategory = (e: React.DragEvent, category: string) => {
     e.dataTransfer.setData('application/fire-category', category);
  };
  const handleDragStartBucket = (e: React.DragEvent, index: number) => {
     e.dataTransfer.setData('application/fire-bucket-index', index.toString());
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragOverBucket = (e: React.DragEvent, index: number) => {
     e.preventDefault(); setDragOverIndex(index);
  };
  const handleDropOnBucket = (e: React.DragEvent, targetAccountId: string, targetIndex: number) => {
     e.preventDefault(); setDragOverIndex(null);
     const category = e.dataTransfer.getData('application/fire-category');
     if (category) { updateCategoryMap(category, targetAccountId); return; }
     const sourceIndexStr = e.dataTransfer.getData('application/fire-bucket-index');
     if (sourceIndexStr) {
        const sourceIndex = parseInt(sourceIndexStr);
        if (sourceIndex === targetIndex) return;
        const newAccounts = [...state.accounts];
        const [movedAccount] = newAccounts.splice(sourceIndex, 1);
        newAccounts.splice(targetIndex, 0, movedAccount);
        setState((s) => ({ ...s, accounts: newAccounts }));
     }
  };

  return (
    <div className="h-full flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-y-auto">
      <div className="w-full md:w-1/3 space-y-4 flex-none flex flex-col">
         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shrink-0 shadow-sm">
             <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2 text-sm"><HelpCircle className="w-4 h-4"/> Budget Flow</h3>
             <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
               Drag categories into buckets. Customize colors by clicking the bucket icon.
             </p>
         </div>

         <div onDragOver={handleDragOver} onDrop={(e) => { e.preventDefault(); updateCategoryMap(e.dataTransfer.getData('application/fire-category'), null); }} className={`p-3 rounded-xl border-2 border-dashed transition-all ${unmappedCategories.length > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
            <h3 className={`font-bold text-xs mb-2 flex items-center gap-2 ${unmappedCategories.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}>
                <AlertCircle className="w-3 h-3"/> Unassigned
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[30px]">
                {unmappedCategories.map(cat => (
                    <div key={cat} draggable onDragStart={(e) => handleDragStartCategory(e, cat)} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] px-2 py-1 rounded shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-1.5 hover:border-blue-400 transition-all select-none">
                        <GripVertical className="w-3 h-3 text-slate-300" />
                        <span className="font-medium">{cat}</span>
                    </div>
                ))}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-10 pr-1">
            {state.accounts.map((acc, idx) => {
                const assignedCats = Object.keys(state.categoryMap).filter(k => state.categoryMap[k] === acc.id && (expensesByCategory[k] || 0) > 0);
                return (
                <div key={acc.id} draggable onDragStart={(e) => handleDragStartBucket(e, idx)} onDragOver={(e) => handleDragOverBucket(e, idx)} onDrop={(e) => handleDropOnBucket(e, acc.id, idx)} className={`bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm transition-all relative ${dragOverIndex === idx ? 'ring-2 ring-blue-500 border-blue-500 scale-[1.02]' : 'border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing text-slate-300 p-1"><GripVertical className="w-4 h-4"/></div>
                            <div className="relative shrink-0">
                                <button data-color-toggle onClick={() => setActiveColorPicker(activeColorPicker === acc.id ? null : acc.id)} className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: acc.color }}>
                                   <Pencil className="w-3 h-3 text-white drop-shadow-md opacity-70" />
                                </button>
                                {activeColorPicker === acc.id && (
                                    <div ref={colorPickerRef} className="absolute top-8 left-0 z-[60] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-64 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Bucket Color</h4>
                                            <button onClick={() => setActiveColorPicker(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-3 h-3 text-slate-400"/></button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1.5 mb-4">
                                            {RAINBOW_PRESETS.map(c => (
                                                <button key={c} onClick={() => { updateAccountColor(acc.id, c); setActiveColorPicker(null); }} className={`w-6 h-6 rounded flex items-center justify-center hover:scale-110 transition-transform ${acc.color === c ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`} style={{ backgroundColor: c }}>
                                                    {acc.color === c && <Check className="w-3 h-3 text-white" />}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="w-6 h-6 rounded border border-slate-300 overflow-hidden relative shadow-inner"><input type="color" value={acc.color} onChange={(e) => updateAccountColor(acc.id, e.target.value)} className="absolute inset-[-8px] cursor-pointer w-[40px] h-[40px]"/></div>
                                            <span className="text-[10px] font-mono text-slate-500 flex-1 uppercase tracking-tighter">{acc.color}</span>
                                            <Palette className="w-3 h-3 text-slate-300" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <input className="font-bold text-slate-700 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm w-full truncate" value={acc.name} onChange={e => { const n = [...state.accounts]; n[idx].name = e.target.value; setState({...state, accounts: n}); }} />
                                <span className="text-[10px] text-slate-400 font-medium">{formatCurrency((bucketSums[acc.id] || 0) * displayFactor)}</span>
                            </div>
                        </div>
                        <button onClick={() => setState((s) => ({...s, accounts: s.accounts.filter(a => a.id !== acc.id)}))} className="text-slate-200 hover:text-red-500 ml-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className={`bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-700/50 transition-all ${assignedCats.length === 0 ? 'min-h-[24px]' : 'p-2 min-h-[44px]'}`}>
                        {assignedCats.length === 0 ? (
                            <div className="h-20 flex items-center justify-center text-slate-400 text-center py-1.5 border border-dashed border-slate-200 dark:border-slate-700 rounded">
                                <span className="text-xs font-bold opacity-60">Drop categories here</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {assignedCats.map(cat => (
                                    <div key={cat} draggable onDragStart={(e) => { e.stopPropagation(); handleDragStartCategory(e, cat); }} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-200 shadow-sm cursor-grab active:cursor-grabbing select-none group/tag">
                                        <span className="font-medium">{cat}</span>
                                        <button onClick={() => updateCategoryMap(cat, null)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )})}
            <div className="flex gap-2 pt-2">
              <input className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="New Bucket Name..." value={newAccountName} onChange={e => setNewAccountName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAccount()}/>
              <button onClick={addAccount} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 flex items-center shadow-sm active:scale-95 transition-transform"><Plus className="w-4 h-4" /></button>
            </div>
         </div>
      </div>

      <div className="w-full md:w-2/3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px] shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cash Flow Map</h3>
            <select className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={displayPeriod} onChange={e => setDisplayPeriod(e.target.value as FrequencyUnit)}>
               {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
         </div>
         <div className="flex-1 overflow-auto"><div style={{ height: Math.max(400, nodeCount * 22), minWidth: 600 }}>
            <Chart chartType="Sankey" width="100%" height="100%" data={chartData} options={chartOptions}/>
         </div></div>
         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Income</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Net</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Surplus</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div>Buckets</div>
         </div>
      </div>
    </div>
  );
};
