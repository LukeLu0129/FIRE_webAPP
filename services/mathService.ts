import { FREQ_MULTIPLIERS } from '../constants';
import { AppState, FrequencyUnit } from '../types';

// ============================================================================
// NOTE FOR DEVELOPER:
// This file contains all the math logic. If you migrate to Python,
// you would replace these functions with API calls to your Python backend.
// ============================================================================

export const calculateAnnualAmount = (amount: number, freqVal: number, freqUnit: string) => {
  return (amount * (FREQ_MULTIPLIERS[freqUnit] || 1)) / freqVal;
};

export const calculateTax = (income: number, resident: boolean, hasTFT: boolean) => {
  // Australian Tax Brackets 2024-25 Logic
  if (income <= 0) return 0;
  if (resident) {
    if (hasTFT) {
      if (income > 190000) return 51638 + (income - 190000) * 0.45;
      if (income > 135000) return 31288 + (income - 135000) * 0.37;
      if (income > 45000) return 4288 + (income - 45000) * 0.30;
      if (income > 18200) return (income - 18200) * 0.16;
      return 0;
    }
    // No TFT logic (simplified for Resident)
    return income * 0.30; // Approximation for No-TFT
  }
  // Non-Resident
  if (income > 190000) return 60850 + (income - 190000) * 0.45;
  if (income > 135000) return 40500 + (income - 135000) * 0.37;
  return income * 0.30;
};

export const calculatePMT = (rate: number, nper: number, pv: number) => {
  if (rate === 0) return pv / nper;
  const pvif = Math.pow(1 + rate, nper);
  return (rate * pv * pvif) / (pvif - 1);
};

export const generateMortgageSimulation = (state: AppState) => {
  const { principal, offsetBalance, interestRate, loanTermYears, userRepayment, repaymentFreq, propertyValue, growthRate } = state.mortgageParams;
  
  const nPerYear = repaymentFreq === 'week' ? 52 : repaymentFreq === 'fortnight' ? 26 : 12;

  // 1. Calculate Min Repayment
  const minRepayment = calculatePMT(interestRate / 100 / nPerYear, loanTermYears * nPerYear, principal);

  // 2. Determine Actual Repayment
  let actualRepayment = userRepayment;
  
  // If user hasn't set a specific repayment, calculate from expenses
  if (actualRepayment === null) {
      const budgetRepaymentAnnual = state.expenses
      .filter(e => e.isMortgageLink)
      .reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
      actualRepayment = budgetRepaymentAnnual / nPerYear;
  }

  // 3. Run Simulation Loop
  const data = [];
  let balStandard = principal;
  let balActual = principal;
  let propVal = propertyValue;
  
  // Multiplier to convert chosen freq amount to MONTHLY equivalent for the chart loop
  const freqToMonthly = nPerYear / 12;
  const monthlyRepayActual = actualRepayment * freqToMonthly;
  const monthlyRepayMin = minRepayment * freqToMonthly;

  for (let m = 0; m <= (loanTermYears * 12); m++) {
     if (m % 12 === 0) {
        data.push({
           year: m / 12,
           balanceStandard: Math.round(balStandard),
           balanceActual: Math.round(balActual),
           property: Math.round(propVal),
           equity: Math.round(propVal - balActual),
           redraw: Math.max(0, Math.round(balStandard - balActual))
        });
     }
     
     const monthlyRate = interestRate / 100 / 12;
     
     // Standard Path
     if (balStandard > 0) {
        const intStd = balStandard * monthlyRate; 
        balStandard = balStandard + intStd - monthlyRepayMin;
        if (balStandard < 0) balStandard = 0;
     }

     // Actual Path
     if (balActual > 0) {
        const effectivePrincipal = Math.max(0, balActual - offsetBalance);
        const intAct = effectivePrincipal * monthlyRate;
        balActual = balActual + intAct - monthlyRepayActual;
        if (balActual < 0) balActual = 0;
     }

     propVal = propVal * Math.pow(1 + (growthRate / 100), 1/12);
  }

  return { 
    data, 
    minRepayment, 
    actualRepayment, 
    payoffActual: data.find(d => d.balanceActual === 0)?.year || loanTermYears,
    payoffStandard: data.find(d => d.balanceStandard === 0)?.year || loanTermYears 
  };
};

export const generateNetWorthSimulation = (state: AppState, surplusAnnual: number) => {
    // 1. Calculate FIRE Target
    const totalAnnualExpense = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
    const defaultFireTarget = totalAnnualExpense * 25;
    const fireTarget = state.fireTargetOverride !== null ? state.fireTargetOverride : defaultFireTarget;

    // 2. Run Simulation Loop
    const data = [];
    let mortgage = state.userSettings.isRenting ? 0 : state.mortgageParams.principal;
    let offset = state.userSettings.isRenting ? 0 : state.mortgageParams.offsetBalance;
    let propVal = state.userSettings.isRenting ? 0 : state.mortgageParams.propertyValue;
    
    let simulatedAssets = state.assets.map(a => ({ ...a }));
    
    // Convert mortgage params to annual figures
    const nPerYear = state.mortgageParams.repaymentFreq === 'week' ? 52 : state.mortgageParams.repaymentFreq === 'fortnight' ? 26 : 12;
    const minRepaymentAnnual = calculatePMT(state.mortgageParams.interestRate / 100 / nPerYear, state.mortgageParams.loanTermYears * nPerYear, state.mortgageParams.principal) * nPerYear;
    
    const budgetRepaymentAnnual = state.expenses.filter(e => e.isMortgageLink).reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
    
    // Actual Annual Repayment logic
    let actualAnnualRepayment = minRepaymentAnnual;
    if (state.mortgageParams.useBudgetRepayment) actualAnnualRepayment = budgetRepaymentAnnual;
    if (state.mortgageParams.userRepayment !== null) actualAnnualRepayment = state.mortgageParams.userRepayment * nPerYear;
    if (actualAnnualRepayment < minRepaymentAnnual) actualAnnualRepayment = minRepaymentAnnual;

    const annualExpenseExclMortgage = state.expenses.filter(e => !e.isMortgageLink).reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);

    // Calculate Available Surplus for Investment
    let realSurplus = surplusAnnual;
    
    if (!state.userSettings.isRenting) {
       const totalBudgetedExpenses = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
       const totalNetIncome = surplusAnnual + totalBudgetedExpenses;
       realSurplus = Math.max(0, totalNetIncome - annualExpenseExclMortgage - actualAnnualRepayment);
    }

    // Velocity Calc
    const initialInterest = mortgage * (state.mortgageParams.interestRate / 100);
    const initialPrincipalPaid = Math.max(0, actualAnnualRepayment - initialInterest);
    const initialWealthVelocity = realSurplus + (state.userSettings.isRenting ? 0 : initialPrincipalPaid);

    const monthlyRate = state.mortgageParams.interestRate / 100 / 12;
    const monthlyPayment = actualAnnualRepayment / 12;

    for (let year = 0; year <= 30; year++) {
      const totalAssets = simulatedAssets.reduce((sum, a) => sum + a.value, 0);
      
      data.push({
        year,
        netWorth: Math.round((propVal + totalAssets) - mortgage),
        debt: Math.round(mortgage),
        fireTarget: Math.round(fireTarget),
        velocity: initialWealthVelocity 
      });

      // Monthly Loop for Mortgage & Property
      for(let m=0; m<12; m++) {
        if (!state.userSettings.isRenting) {
           propVal = propVal * Math.pow(1 + (state.mortgageParams.growthRate / 100), 1/12);
           if(mortgage > 0) {
             const effectivePrincipal = Math.max(0, mortgage - offset);
             const interest = effectivePrincipal * monthlyRate;
             mortgage = mortgage + interest - monthlyPayment;
             if(mortgage < 0) mortgage = 0;
           }
        }
      }

      // Asset Growth & Surplus Injection
      simulatedAssets = simulatedAssets.map(a => ({ ...a, value: a.value * (1 + a.growthRate/100) }));
      
      let injection = realSurplus;
      if (!state.userSettings.isRenting && mortgage <= 0) injection += actualAnnualRepayment; 
      
      if (simulatedAssets.length > 0) simulatedAssets[0].value += injection;
    }

    return { data, fireTarget, velocity: initialWealthVelocity };
};