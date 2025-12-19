
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Chart } from "react-google-charts";
import { AppState, FrequencyUnit } from '../types';
import { FREQ_LABELS, FREQ_MULTIPLIERS, formatCurrency, COLORS } from '../constants';
import { Plus, Trash2, HelpCircle, GripVertical, X, AlertCircle, Palette } from 'lucide-react';

interface Props {
  state: AppState;
  setState: (s: AppState | ((prev: AppState) => AppState)) => void;
  netIncomeAnnual: number;
}

// Rainbow Palette (7 Colors)
const RAINBOW_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
];

// Distinct Greys for Incomes (Dark to Light)
const INCOME_GREYS = [
  '#0f172a', // Slate 900
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#64748b', // Slate 500
  '#94a3b8', // Slate 400
  '#cbd5e1', // Slate 300
];

// Helper to adjust color brightness for gradients
const adjustColor = (col: string, amt: number) => {
  let usePound = false;
  if (col[0] === "#") {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00FF) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000FF) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
};

const shortCurrency = (val: number) => {
    if (val >= 1000) return '$' + (val / 1000).toFixed(1).replace('.0','') + 'k';
    return '$' + val.toFixed(0);
};

export const CashFlowTab: React.FC<Props> = ({ state, setState, netIncomeAnnual }) => {
  const [displayPeriod, setDisplayPeriod] = useState<FrequencyUnit>('month');
  const [newAccountName, setNewAccountName] = useState('');
  
  // Track which color picker is open (by Account ID)
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  
  // Drag Preview State
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null); // -1 means "After last item"

  // Click outside to close color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setActiveColorPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayFactor = 1 / FREQ_MULTIPLIERS[displayPeriod];

  // --- 1. PREPARE FINANCIAL DATA ---
  
  const annualIncomes = state.incomes.map(item => {
    const gross = (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
    return { ...item, grossAnnual: gross };
  });
  const totalGrossForRatio = annualIncomes.reduce((acc, i) => acc + i.grossAnnual, 0) || 1;
  
  const getAnnualCost = (item: any) => (item.amount * FREQ_MULTIPLIERS[item.freqUnit]) / item.freqValue;
  
  // Aggregate expenses by category
  const expensesByCategory: Record<string, number> = {};
  state.expenses.forEach(exp => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + getAnnualCost(exp);
  });
  
  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const surplusAnnual = Math.max(0, netIncomeAnnual - totalExpenses);

  // Identify unmapped categories
  const unmappedCategories = state.expenseCategories.filter(cat => !state.categoryMap[cat]);
  // Identify active categories (those with > 0 expense)
  const activeCategories = state.expenseCategories.filter(c => (expensesByCategory[c] || 0) > 0);

  // Calculate Bucket Totals for Display
  const bucketSums = useMemo(() => {
     const sums: Record<string, number> = {};
     state.accounts.forEach(acc => {
         const cats = state.expenseCategories.filter(c => state.categoryMap[c] === acc.id);
         const total = cats.reduce((accVal, cat) => accVal + (expensesByCategory[cat] || 0), 0);
         sums[acc.id] = total;
     });
     return sums;
  }, [state.accounts, state.categoryMap, expensesByCategory]);


  // --- 2. SANKEY DATA GENERATION ---
  
  const { chartData, chartOptions, nodeCount } = useMemo(() => {
    const rows: [string, string, number][] = [];
    const colors: string[] = [];
    const nodeSet = new Set<string>();

    // Helper to ensure colors align with the EXACT order nodes are introduced
    const addNode = (name: string, color: string) => {
        if (!nodeSet.has(name)) {
            nodeSet.add(name);
            colors.push(color);
        }
    };
    
    const poolName = `Net Cash (${shortCurrency(netIncomeAnnual * displayFactor)})`;
    const poolColor = '#3b82f6'; // Blue

    // === 1. LEFT SIDE: INCOMES ===
    annualIncomes.forEach((inc, idx) => {
       const displayAmt = inc.grossAnnual * displayFactor;
       const ratio = inc.grossAnnual / totalGrossForRatio;
       const shareOfNet = netIncomeAnnual * ratio * displayFactor;
       
       if (shareOfNet > 0) {
           const incomeName = `${inc.name} (${shortCurrency(displayAmt)})`;
           const grey = INCOME_GREYS[idx % INCOME_GREYS.length];
           
           addNode(incomeName, grey);
           addNode(poolName, poolColor); // Registers on first pass
           
           rows.push([incomeName, poolName, shareOfNet]);
       }
    });

    // Fallback if no income
    if (annualIncomes.length === 0) {
        addNode(poolName, poolColor);
    }

    // === 2. CALCULATE BUCKET TOTALS ===
    const bucketTotals: Record<string, number> = {};
    state.accounts.forEach(acc => bucketTotals[acc.id] = 0);
    let unmappedTotal = 0;

    activeCategories.forEach(cat => {
        const val = expensesByCategory[cat];
        const accId = state.categoryMap[cat];
        if (accId && bucketTotals[accId] !== undefined) {
            bucketTotals[accId] += val;
        } else {
            unmappedTotal += val;
        }
    });

    // === 3. MIDDLE: POOL -> OUTPUTS ===
    // Critical: The order here dictates vertical stacking because we set iterations: 0

    // A. Surplus Intermediate (Top of Col 2)
    // We add an intermediate node to ensure Surplus flows all the way to the right column,
    // aligning better with the chart structure.
    let surplusMiddle = '';
    let surplusRight = '';

    if (surplusAnnual > 0) {
        surplusMiddle = `Surplus `; // Space to differentiate ID from final node
        surplusRight = `Surplus (${shortCurrency(surplusAnnual * displayFactor)})`;
        
        addNode(surplusMiddle, '#10b981'); // Emerald
        rows.push([poolName, surplusMiddle, surplusAnnual * displayFactor]);
    }

    // B. Buckets (User Defined Order)
    state.accounts.forEach(acc => {
        if (bucketTotals[acc.id] > 0) {
            addNode(acc.name, acc.color);
            rows.push([poolName, acc.name, bucketTotals[acc.id] * displayFactor]);
        }
    });

    // C. Unmapped (Bottom)
    if (unmappedTotal > 0) {
        addNode('Unmapped', '#ef4444'); // Red
        rows.push([poolName, 'Unmapped', unmappedTotal * displayFactor]);
    }

    // === 4. RIGHT: OUTPUTS -> DESTINATIONS ===
    
    // A. Surplus Final (Top of Right Col)
    if (surplusAnnual > 0) {
        addNode(surplusRight, '#10b981');
        rows.push([surplusMiddle, surplusRight, surplusAnnual * displayFactor]);
    }

    // B. From Buckets
    state.accounts.forEach(acc => {
        if (bucketTotals[acc.id] > 0) {
            const catsInBucket = activeCategories.filter(c => state.categoryMap[c] === acc.id);
            // Sort categories by amount descending
            catsInBucket.sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);

            catsInBucket.forEach((cat, idx) => {
                const val = expensesByCategory[cat] * displayFactor;
                const catName = `${cat} (${shortCurrency(val)})`;
                const catColor = adjustColor(acc.color, 30 + (idx * 15));
                
                addNode(catName, catColor);
                rows.push([acc.name, catName, val]);
            });
        }
    });

    // C. From Unmapped
    if (unmappedTotal > 0) {
        const catsUnmapped = activeCategories.filter(c => !state.categoryMap[c]);
        catsUnmapped.sort((a, b) => expensesByCategory[b] - expensesByCategory[a]);
        
        catsUnmapped.forEach((cat, idx) => {
            const val = expensesByCategory[cat] * displayFactor;
            const catName = `${cat} (${shortCurrency(val)})`;
            const catColor = adjustColor('#ef4444', 30 + (idx * 15));
            
            addNode(catName, catColor);
            rows.push(['Unmapped', catName, val]);
        });
    }

    const options = {
        sankey: {
            node: {
                colors: colors,
                label: { 
                    fontName: 'sans-serif',
                    fontSize: 10,
                    color: state.userSettings.darkMode ? '#fff' : '#1e293b',
                    bold: true
                },
                nodePadding: 20, // Increased padding to prevent overlap
                width: 14,
                interactivity: true,
            },
            link: {
                colorMode: 'gradient',
                fillOpacity: 0.35
            },
            iterations: 0, // FORCE INPUT ORDER
        },
        backgroundColor: 'transparent',
        tooltip: { isHtml: true, textStyle: { fontSize: 12 } }
    };

    return { 
        chartData: [["From", "To", "Weight"], ...rows], 
        chartOptions: options,
        nodeCount: nodeSet.size
    };
  }, [state, netIncomeAnnual, expensesByCategory, displayPeriod, surplusAnnual]);


  // --- 3. ACTIONS ---

  const addAccount = () => {
    if(!newAccountName) return;
    const newId = Date.now().toString();
    setState((s: AppState) => ({
      ...s,
      accounts: [...s.accounts, { id: newId, name: newAccountName, color: RAINBOW_COLORS[s.accounts.length % RAINBOW_COLORS.length] }]
    }));
    setNewAccountName('');
  };

  const updateCategoryMap = (category: string, accountId: string | null) => {
     const newMap = { ...state.categoryMap };
     if (accountId === null) {
        delete newMap[category];
     } else {
        newMap[category] = accountId;
     }
     setState((s: AppState) => ({ ...s, categoryMap: newMap }));
  };

  // --- 4. DRAG & DROP HANDLERS ---

  const handleDragStartCategory = (e: React.DragEvent, category: string) => {
     e.dataTransfer.setData('application/fire-category', category);
     e.dataTransfer.effectAllowed = "move";
  };

  const handleDragStartBucket = (e: React.DragEvent, index: number) => {
     e.dataTransfer.setData('application/fire-bucket-index', index.toString());
     e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
     e.preventDefault(); 
     e.dataTransfer.dropEffect = "move";
  };

  // Specific handler to track where we are dragging
  const handleDragOverBucket = (e: React.DragEvent, index: number) => {
     e.preventDefault();
     setDragOverIndex(index);
  };
  
  const handleDragOverEnd = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(-1);
  };

  const handleDropOnBucket = (e: React.DragEvent, targetAccountId: string, targetIndex: number) => {
     e.preventDefault();
     e.stopPropagation();
     setDragOverIndex(null);

     // 1. Check if dropping a Category
     const category = e.dataTransfer.getData('application/fire-category');
     if (category) {
        updateCategoryMap(category, targetAccountId);
        return;
     }

     // 2. Check if dropping a Bucket (Reordering)
     const sourceIndexStr = e.dataTransfer.getData('application/fire-bucket-index');
     if (sourceIndexStr) {
        const sourceIndex = parseInt(sourceIndexStr);
        if (sourceIndex === targetIndex) return;

        const newAccounts = [...state.accounts];
        const [movedAccount] = newAccounts.splice(sourceIndex, 1);
        
        // If dropping 'after last' logic needed, we handle it separately
        newAccounts.splice(targetIndex, 0, movedAccount);
        
        setState((s) => ({ ...s, accounts: newAccounts }));
     }
  };
  
  const handleDropAtEnd = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
      const sourceIndexStr = e.dataTransfer.getData('application/fire-bucket-index');
      if (sourceIndexStr) {
        const sourceIndex = parseInt(sourceIndexStr);
        const newAccounts = [...state.accounts];
        const [movedAccount] = newAccounts.splice(sourceIndex, 1);
        newAccounts.push(movedAccount); // Add to end
        setState((s) => ({ ...s, accounts: newAccounts }));
      }
  };

  const handleDropOnUnassigned = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
      const category = e.dataTransfer.getData('application/fire-category');
      if (category) {
         updateCategoryMap(category, null);
      }
  };

  const calculatedHeight = Math.max(400, nodeCount * 22);

  return (
    <div className="h-full flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-y-auto">
      {/* --- LEFT COLUMN: Configuration --- */}
      <div className="w-full md:w-1/3 space-y-4 flex-none flex flex-col">
         
         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 shrink-0">
             <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-2"><HelpCircle className="w-4 h-4"/> Budget Flow</h3>
             <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
               Drag categories into buckets. <br/>
               Drag buckets to reorder the chart flow.
             </p>
         </div>

         {/* Unassigned Pool */}
         <div 
            onDragOver={handleDragOver}
            onDrop={handleDropOnUnassigned}
            className={`p-3 rounded-xl border-2 border-dashed transition-all ${unmappedCategories.length > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}
         >
            <h3 className={`font-bold text-xs mb-2 flex items-center gap-2 ${unmappedCategories.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}>
                <AlertCircle className="w-3 h-3"/> Unassigned Categories
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[30px]">
                {unmappedCategories.length === 0 && <span className="text-[10px] text-slate-400 italic">All categories assigned!</span>}
                {unmappedCategories.map(cat => (
                    <div 
                        key={cat}
                        draggable
                        onDragStart={(e) => handleDragStartCategory(e, cat)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] px-2 py-1 rounded-md shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-1 hover:border-blue-400 hover:shadow-md transition-all select-none"
                    >
                       <GripVertical className="w-3 h-3 text-slate-400" />
                       {cat}
                    </div>
                ))}
            </div>
         </div>

         {/* Bucket Manager */}
         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-10 pr-1">
            {state.accounts.map((acc, idx) => {
                const assignedCats = Object.keys(state.categoryMap).filter(k => state.categoryMap[k] === acc.id);
                const isDragTarget = dragOverIndex === idx;
                
                // Get Total Sum for this bucket
                const totalAnnual = bucketSums[acc.id] || 0;
                const totalDisplay = totalAnnual * displayFactor;

                return (
                <div 
                    key={acc.id} 
                    draggable
                    onDragStart={(e) => handleDragStartBucket(e, idx)}
                    onDragOver={(e) => handleDragOverBucket(e, idx)}
                    onDrop={(e) => handleDropOnBucket(e, acc.id, idx)}
                    className={`bg-white dark:bg-slate-900 p-3 rounded-xl border shadow-sm group hover:border-blue-200 dark:hover:border-blue-800 transition-colors relative border-slate-200 dark:border-slate-800`}
                >
                    {/* Visual Line Indicator for Drag & Drop */}
                    {isDragTarget && <div className="absolute -top-1.5 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none" />}

                    {/* Bucket Header */}
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            
                            {/* Drag Handle for Reordering */}
                            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                            <GripVertical className="w-4 h-4"/>
                            </div>

                            {/* Color Picker Trigger */}
                            <div className="relative shrink-0">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveColorPicker(activeColorPicker === acc.id ? null : acc.id);
                                    }}
                                    className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm hover:scale-110 transition-transform block" 
                                    style={{ backgroundColor: acc.color }}
                                />
                                
                                {/* Color Picker Popup */}
                                {activeColorPicker === acc.id && (
                                    <div ref={colorPickerRef} className="absolute top-6 left-0 z-50 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-48 animate-in fade-in zoom-in-95 duration-200">
                                        <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Select Color</h4>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {RAINBOW_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        const newAccs = [...state.accounts];
                                                        newAccs[idx].color = c;
                                                        setState({...state, accounts: newAccs});
                                                        setActiveColorPicker(null);
                                                    }}
                                                    className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${acc.color === c ? 'ring-2 ring-offset-1 ring-slate-500' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <div className="relative h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600">
                                            <Palette className="w-3 h-3 text-slate-500" />
                                            <span className="text-[10px] text-slate-600 dark:text-slate-300">Custom</span>
                                            <input 
                                                type="color" 
                                                value={acc.color}
                                                onChange={(e) => {
                                                    const newAccs = [...state.accounts];
                                                    newAccs[idx].color = e.target.value;
                                                    setState({...state, accounts: newAccs});
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                                <input 
                                    className="font-bold text-slate-700 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none text-sm w-full transition-colors truncate"
                                    value={acc.name}
                                    onChange={e => {
                                        const newAccs = [...state.accounts];
                                        newAccs[idx].name = e.target.value;
                                        setState({...state, accounts: newAccs});
                                    }}
                                />
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {totalDisplay > 0 ? formatCurrency(totalDisplay) : '$0'}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setState((s: AppState) => ({...s, accounts: s.accounts.filter(a => a.id !== acc.id)}))}
                            className="text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Drop Zone for Categories */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-100 dark:border-slate-700 min-h-[50px] transition-colors">
                        {assignedCats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-[10px] text-center py-2 border border-dashed border-slate-200 dark:border-slate-700 rounded">
                                <span>Drop categories here</span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {assignedCats.map(cat => (
                                    <div 
                                        key={cat} 
                                        draggable
                                        onDragStart={(e) => {
                                            e.stopPropagation(); // Don't drag the bucket
                                            handleDragStartCategory(e, cat);
                                        }}
                                        className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-200 shadow-sm cursor-grab active:cursor-grabbing select-none group/tag"
                                    >
                                        <span>{cat}</span>
                                        <button 
                                            onClick={() => updateCategoryMap(cat, null)}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )})}
            
            {/* Drop Zone for End of List */}
            {state.accounts.length > 0 && (
                <div 
                    onDragOver={handleDragOverEnd}
                    onDrop={handleDropAtEnd}
                    className={`h-4 rounded-full transition-all ${dragOverIndex === -1 ? 'bg-blue-500 animate-pulse' : 'bg-transparent'}`}
                />
            )}

            {/* Create New Bucket */}
            <div className="flex gap-2 pt-2">
              <input 
                className="flex-1 text-xs border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" 
                placeholder="New Bucket Name..." 
                value={newAccountName} 
                onChange={e => setNewAccountName(e.target.value)} 
              />
              <button onClick={addAccount} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 flex items-center"><Plus className="w-4 h-4" /></button>
            </div>
         </div>
      </div>

      {/* --- RIGHT COLUMN: Sankey Chart --- */}
      <div className="w-full md:w-2/3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cash Flow Map</h3>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-500 dark:text-slate-400">View as:</span>
               <select className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" value={displayPeriod} onChange={e => setDisplayPeriod(e.target.value as FrequencyUnit)}>
                  {Object.entries(FREQ_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
               </select>
            </div>
         </div>
         
         <div className="flex-1 overflow-auto">
             <div style={{ height: calculatedHeight, minWidth: 600 }}>
                <Chart
                  chartType="Sankey"
                  width="100%"
                  height="100%"
                  data={chartData}
                  options={chartOptions}
                />
             </div>
         </div>
         
         {/* Simple Legend */}
         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Income (Grayscale)</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Net Pool</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Surplus (Top)</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400"></div>Buckets</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gradient-to-r from-slate-400 to-white border border-slate-200"></div>Categories</div>
         </div>
      </div>
    </div>
  );
};
