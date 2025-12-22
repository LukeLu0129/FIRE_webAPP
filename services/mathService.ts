
import { FREQ_MULTIPLIERS } from '../constants';
import { AppState } from '../types';

export const toWeekly = (amount: number, freqVal: number, freqUnit: string): number => {
  const annual = (amount * (FREQ_MULTIPLIERS[freqUnit] || 1)) / freqVal;
  return annual / 52;
};

export const fromWeekly = (weeklyAmount: number, targetUnit: string): number => {
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

export const calculateNetIncomeBreakdown = (state: AppState) => {
  const annualIncomes = state.incomes.map(item => {
    const weeklyGross = toWeekly(item.amount, item.freqValue, item.freqUnit);
    const grossAnnual = weeklyGross * 52;
    
    const packagingAnnual = toWeekly(item.salaryPackaging || 0, item.freqValue, item.freqUnit) * 52;
    const sacrificeAnnual = toWeekly(item.salarySacrifice || 0, item.freqValue, item.freqUnit) * 52;
    const adminFeeAnnual = toWeekly(item.adminFee || 0, item.freqValue, item.freqUnit) * 52;
    
    const superAmtAnnual = (grossAnnual * (item.superRate / 100)) + sacrificeAnnual;
    
    return { 
      ...item, 
      grossAnnual, 
      superAnnual: superAmtAnnual,
      packagingAnnual,
      sacrificeAnnual,
      adminFeeAnnual
    };
  });

  const taxableGrossAnnual = annualIncomes
    .filter(i => i.type !== 'tax-free')
    .reduce((acc, c) => acc + c.grossAnnual, 0);
    
  const taxFreeGrossAnnual = annualIncomes
    .filter(i => i.type === 'tax-free')
    .reduce((acc, c) => acc + c.grossAnnual, 0);

  const totalPackagingAnnual = annualIncomes.reduce((acc, c) => acc + c.packagingAnnual, 0);
  const totalSacrificeAnnual = annualIncomes.reduce((acc, c) => acc + c.sacrificeAnnual, 0);
  const totalAdminFeesAnnual = annualIncomes.reduce((acc, c) => acc + c.adminFeeAnnual, 0);
  
  const totalDeductionsAnnual = state.deductions.reduce((acc, c) => acc + c.amount, 0);
  const totalSuperAnnual = annualIncomes.reduce((acc, c) => acc + c.superAnnual, 0);

  const taxableIncome = Math.max(0, taxableGrossAnnual - totalPackagingAnnual - totalSacrificeAnnual - totalAdminFeesAnnual - totalDeductionsAnnual);
  const baseTax = calculateTax(taxableIncome, state.userSettings.isResident, true);
  
  let medicare = 0;
  if (state.userSettings.isResident && taxableIncome > 26000) medicare = taxableIncome * 0.02;

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
  
  // Net Salary is the taxable portion after taxes and deductions
  const netSalaryAnnual = taxableGrossAnnual - totalTaxBill - totalAdminFeesAnnual - totalSacrificeAnnual - totalPackagingAnnual;
  
  // Bank Take Home is the actual cash flow including tax-free income
  const bankTakeHomeAnnual = netSalaryAnnual + taxFreeGrossAnnual;
  
  // Net Cash Position includes the value of packaged expenses
  const netCashPositionAnnual = bankTakeHomeAnnual + totalPackagingAnnual;

  return {
    totalGrossCash: taxableGrossAnnual + taxFreeGrossAnnual,
    totalPackaging: totalPackagingAnnual,
    totalSacrifice: totalSacrificeAnnual,
    totalAdminFees: totalAdminFeesAnnual,
    totalTaxBill,
    baseTax,
    medicare,
    mls,
    hecs,
    netSalary: netSalaryAnnual,
    taxFreeIncome: taxFreeGrossAnnual,
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
  
  // Australian Standard: Monthly repayment is the base calculation
  // Per user request, the principal used for minimum calculation now considers the offset/redraw balance
  const effectivePrincipalForMin = Math.max(0, principal - offsetBalance);
  const monthlyMin = calculatePMT(interestRate / 100 / 12, loanTermYears * 12, effectivePrincipalForMin);
  
  // Minimum required payment for the selected frequency
  let minRepayment: number;
  if (repaymentFreq === 'week') {
    minRepayment = monthlyMin / 4;
  } else if (repaymentFreq === 'fortnight') {
    minRepayment = monthlyMin / 2;
  } else {
    minRepayment = monthlyMin;
  }

  const nPerYear = repaymentFreq === 'week' ? 52 : repaymentFreq === 'fortnight' ? 26 : 12;

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
     
     // The "Standard" trajectory: Interest is charged on the FULL original principal (net offset at start)
     // and repayments are based on that net principal.
     if (balStandard > 0) {
        // Standard projection assumes the offset is treated as part of the initial reduction
        const intStd = Math.max(0, balStandard - offsetBalance) * monthlyRate; 
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
    const swrFactor = 100 / (state.swr || 4);
    const engineTarget = (state.retirementBaseCost || 0) * swrFactor;
    const totalLiabilitiesBalance = state.liabilities.reduce((acc, l) => acc + l.balance, 0);

    const data = [];
    let mortgage = state.userSettings.isRenting ? 0 : state.mortgageParams.principal;
    let offset = state.userSettings.isRenting ? 0 : state.mortgageParams.offsetBalance;
    let propVal = state.userSettings.isRenting ? 0 : state.mortgageParams.propertyValue;
    let simulatedAssets = state.assets.map(a => ({ ...a }));
    
    // Use the simulation's own standard for repayments
    const { actualRepayment } = generateMortgageSimulation(state);
    const nPerYear = state.mortgageParams.repaymentFreq === 'week' ? 52 : state.mortgageParams.repaymentFreq === 'fortnight' ? 26 : 12;
    
    let initialAnnualRepayment = actualRepayment * nPerYear;
    
    const monthlyRate = state.mortgageParams.interestRate / 100 / 12;

    for (let year = 0; year <= 30; year++) {
      const totalAssetsValue = simulatedAssets.reduce((sum, a) => sum + a.value, 0);
      const investableNW = totalAssetsValue; 
      
      let currentYearTarget = 0;
      if (state.fireTargetOverride !== null) {
          currentYearTarget = state.fireTargetOverride;
      } else if (state.fireMode === 'rigorous') {
          // In Rigorous mode, the target includes the "bridge" debts that are not subtracted from NW (like Mortgage)
          // Since totalLiabilitiesBalance is subtracted from NW, it shouldn't be in the target.
          currentYearTarget = engineTarget + mortgage;
      } else {
          const totalAnnualExpense = state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0);
          currentYearTarget = totalAnnualExpense * swrFactor;
      }

      // Per user request: DO NOT factor in PPOR or Mortgage in Net Worth calculation
      // Simple = Investable Assets only
      // Rigorous = Investable Assets - Non-mortgage Liabilities
      const nwBasis = state.fireMode === 'simple' 
        ? totalAssetsValue
        : totalAssetsValue - totalLiabilitiesBalance;

      data.push({
        year,
        netWorth: Math.round(nwBasis),
        investableNW: Math.round(investableNW),
        fireTarget: Math.round(currentYearTarget)
      });

      for(let m=0; m<12; m++) {
        if (!state.userSettings.isRenting && mortgage > 0) {
           const effectivePrincipal = Math.max(0, mortgage - offset);
           const interest = effectivePrincipal * monthlyRate;
           const monthlyRepayment = initialAnnualRepayment / 12;
           mortgage = mortgage + interest - monthlyRepayment;
           if(mortgage < 0) mortgage = 0;
        }
        
        simulatedAssets = simulatedAssets.map(a => ({ 
          ...a, 
          value: a.value * Math.pow(1 + a.growthRate/100, 1/12) 
        }));
        
        let monthlyInjection = surplusAnnual / 12;
        if (!state.userSettings.isRenting && mortgage <= 0) {
            monthlyInjection += initialAnnualRepayment / 12;
        }
        if (simulatedAssets.length > 0) simulatedAssets[0].value += monthlyInjection;
      }
      
      propVal = propVal * (1 + (state.mortgageParams.growthRate / 100));
    }

    const todayTarget = state.fireMode === 'rigorous' 
        ? engineTarget + (state.userSettings.isRenting ? 0 : state.mortgageParams.principal)
        : state.expenses.reduce((acc, item) => acc + calculateAnnualAmount(item.amount, item.freqValue, item.freqUnit), 0) * swrFactor;

    // Velocity tracks growth of the Net Worth basis (Investable Surplus)
    const initialWealthVelocity = surplusAnnual;

    return { data, fireTarget: todayTarget, velocity: initialWealthVelocity };
};
