
import { FREQ_MULTIPLIERS } from '../constants';
import { AppState } from '../types';

/**
 * Unifies any amount to a "per week" base.
 */
export const toWeekly = (amount: number, freqVal: number, freqUnit: string): number => {
  const annual = (amount * (FREQ_MULTIPLIERS[freqUnit] || 1)) / freqVal;
  return annual / 52;
};

/**
 * Converts a weekly amount to a target display period.
 */
export const fromWeekly = (weeklyAmount: number, targetUnit: string): number => {
  // We calculate the annual first, then divide by the target multiplier
  const annual = weeklyAmount * 52;
  return annual / (FREQ_MULTIPLIERS[targetUnit] || 1);
};

export const calculateAnnualAmount = (amount: number, freqVal: number, freqUnit: string) => {
  return toWeekly(amount, freqVal, freqUnit) * 52;
};

export const calculateTax = (income: number, resident: boolean, hasTFT: boolean) => {
  if (income <= 0) return 0;
  if (resident) {
    if (hasTFT) {
      if (income > 190000) return 51638 + (income - 190000) * 0.45;
      if (income > 135000) return 31288 + (income - 135000) * 0.37;
      if (income > 45000) return 4288 + (income - 45000) * 0.30;
      if (income > 18200) return (income - 18200) * 0.16;
      return 0;
    }
    return income * 0.30; 
  }
  if (income > 190000) return 60850 + (income - 190000) * 0.45;
  if (income > 135000) return 40500 + (income - 135000) * 0.37;
  return income * 0.30;
};

/**
 * Calculates a comprehensive breakdown of annual net income (cash position).
 * Normalizes all inputs to weekly first.
 */
export const calculateNetIncomeBreakdown = (state: AppState) => {
  const annualIncomes = state.incomes.map(item => {
    const weeklyGross = toWeekly(item.amount, item.freqValue, item.freqUnit);
    const grossAnnual = weeklyGross * 52;
    const sacrificeAnnual = item.salarySacrifice || 0;
    const superAmtAnnual = (grossAnnual * (item.superRate / 100)) + sacrificeAnnual;
    return { ...item, grossAnnual, superAnnual: superAmtAnnual };
  });

  const totalGrossCashAnnual = annualIncomes.reduce((acc, c) => acc + c.grossAnnual, 0);
  const totalPackagingAnnual = annualIncomes.reduce((acc, c) => acc + (c.salaryPackaging || 0), 0);
  const totalSacrificeAnnual = annualIncomes.reduce((acc, c) => acc + (c.salarySacrifice || 0), 0);
  const totalAdminFeesAnnual = annualIncomes.reduce((acc, c) => acc + (c.adminFee || 0), 0);
  
  const totalDeductionsAnnual = state.deductions.reduce((acc, c) => acc + c.amount, 0);
  const totalSuperAnnual = annualIncomes.reduce((acc, c) => acc + c.superAnnual, 0);

  // Taxable Income is Gross minus pre-tax deductions
  const taxableIncome = Math.max(0, totalGrossCashAnnual - totalPackagingAnnual - totalSacrificeAnnual - totalAdminFeesAnnual - totalDeductionsAnnual);
  const baseTax = calculateTax(taxableIncome, state.userSettings.isResident, true);
  
  let medicare = 0;
  if (state.userSettings.isResident && taxableIncome > 26000) medicare = taxableIncome * 0.02;

  // HECS and MLS use "Adjusted Taxable Income" which adds back fringe benefits
  const reportableFringeBenefits = totalPackagingAnnual * 1.8868; 
  const adjTaxableIncome = taxableIncome + reportableFringeBenefits;

  let mls = 0;
  if (!state.userSettings.hasPrivateHealth && state.userSettings.isResident) {
    let mlsRate = 0;
    if (adjTaxableIncome > 151000) mlsRate = 0.015;
    else if (adjTaxableIncome > 113000) mlsRate = 0.0125;
    else if (adjTaxableIncome > 97000) mlsRate = 0.01;
    mls = taxableIncome * mlsRate;
  }
  
  let hecs = 0;
  if (state.userSettings.hasHecsDebt) {
    if (adjTaxableIncome > 151201) hecs = adjTaxableIncome * 0.10;
    else if (adjTaxableIncome > 100000) hecs = adjTaxableIncome * 0.06;
    else if (adjTaxableIncome > 54435) hecs = adjTaxableIncome * 0.01;
  }

  const totalTaxBill = baseTax + medicare + mls + hecs;
  
  // Bank Transfer (Physical Cash) = Gross - Taxes - Admin - Sacrifice - Packaging
  const bankTakeHomeAnnual = totalGrossCashAnnual - totalTaxBill - totalAdminFeesAnnual - totalSacrificeAnnual - totalPackagingAnnual;

  // Net Cash Position (Total Benefit) = Bank Take Home + Packaging Value
  const netCashPositionAnnual = bankTakeHomeAnnual + totalPackagingAnnual;

  return {
    totalGrossCash: totalGrossCashAnnual,
    totalPackaging: totalPackagingAnnual,
    totalSacrifice: totalSacrificeAnnual,
    totalAdminFees: totalAdminFeesAnnual,
    totalTaxBill,
    baseTax,
    medicare,
    mls,
    hecs,
    bankTakeHome: bankTakeHomeAnnual,
    netCashPosition: netCashPositionAnnual,
    totalSuper: totalSuperAnnual,
    taxableIncome
  };
};

export const calculatePMT = (rate: number, nper: number, pv: number) => {
  if (rate === 0) return pv / nper;
  const pvif = Math.pow(1 + rate, nper);
  return (rate * pv * pvif) / (pvif - 1);
};

export const generateMortgageSimulation = (state: AppState) => {
  const { principal, offsetBalance, interestRate, loanTermYears, userRepayment, repaymentFreq, propertyValue, growthRate } = state.mortgageParams;
  
  const nPerYear = repaymentFreq === 'week' ? 52 : repaymentFreq === 'fortnight' ? 26 : 12;
  const minRepayment = calculatePMT(interestRate / 100 / nPerYear, loanTermYears * nPerYear, principal);

  let actualRepayment = userRepayment;
  if (actualRepayment === null) {
      const budgetRepaymentAnnual = state.expenses
      .filter(e => e.isMortgageLink)
      .reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
      actualRepayment = budgetRepaymentAnnual / nPerYear;
  }

  const data = [];
  let balStandard = principal;
  let balActual = principal;
  let propVal = propertyValue;
  
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
     
     if (balStandard > 0) {
        const intStd = balStandard * monthlyRate; 
        balStandard = balStandard + intStd - monthlyRepayMin;
        if (balStandard < 0) balStandard = 0;
     }

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
    const totalAnnualExpense = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
    const defaultFireTarget = totalAnnualExpense * 25;
    const fireTarget = state.fireTargetOverride !== null ? state.fireTargetOverride : defaultFireTarget;

    const data = [];
    let mortgage = state.userSettings.isRenting ? 0 : state.mortgageParams.principal;
    let offset = state.userSettings.isRenting ? 0 : state.mortgageParams.offsetBalance;
    let propVal = state.userSettings.isRenting ? 0 : state.mortgageParams.propertyValue;
    
    let simulatedAssets = state.assets.map(a => ({ ...a }));
    
    const nPerYear = state.mortgageParams.repaymentFreq === 'week' ? 52 : state.mortgageParams.repaymentFreq === 'fortnight' ? 26 : 12;
    const minRepaymentAnnual = calculatePMT(state.mortgageParams.interestRate / 100 / nPerYear, state.mortgageParams.loanTermYears * nPerYear, state.mortgageParams.principal) * nPerYear;
    
    const budgetRepaymentAnnual = state.expenses.filter(e => e.isMortgageLink).reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
    
    let actualAnnualRepayment = minRepaymentAnnual;
    if (state.mortgageParams.useBudgetRepayment) actualAnnualRepayment = budgetRepaymentAnnual;
    if (state.mortgageParams.userRepayment !== null) actualAnnualRepayment = state.mortgageParams.userRepayment * nPerYear;
    if (actualAnnualRepayment < minRepaymentAnnual) actualAnnualRepayment = minRepaymentAnnual;

    const annualExpenseExclMortgage = state.expenses.filter(e => !e.isMortgageLink).reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);

    let realSurplus = surplusAnnual;
    if (!state.userSettings.isRenting) {
       const totalBudgetedExpenses = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
       const totalNetIncome = surplusAnnual + totalBudgetedExpenses;
       realSurplus = Math.max(0, totalNetIncome - annualExpenseExclMortgage - actualAnnualRepayment);
    }

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

      simulatedAssets = simulatedAssets.map(a => ({ ...a, value: a.value * (1 + a.growthRate/100) }));
      let injection = realSurplus;
      if (!state.userSettings.isRenting && mortgage <= 0) injection += actualAnnualRepayment; 
      if (simulatedAssets.length > 0) simulatedAssets[0].value += injection;
    }

    return { data, fireTarget, velocity: initialWealthVelocity };
};
