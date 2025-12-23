
import { AppState } from '../types';

export const INITIAL_DEFAULT_STATE: AppState = {
  "userSettings": {
    "name": "",
    "isResident": true,
    "hasPrivateHealth": true,
    "hasHecsDebt": false,
    "isRenting": false,
    "darkMode": false
  },
  "incomes": [
    {
      "id": "1",
      "name": "Corporate Salary",
      "type": "salary",
      "amount": 2580.04,
      "freqValue": 1,
      "freqUnit": "fortnight",
      "taxTreatment": "tft",
      "salaryPackaging": 485.84,
      "salarySacrifice": 0,
      "adminFee": 8.13,
      "superRate": 11.5,
      "paygOverride": null
    },
    {
      "id": "2",
      "name": "Side Hustle",
      "type": "tax-free",
      "amount": 800,
      "freqValue": 1,
      "freqUnit": "week",
      "taxTreatment": "abn",
      "salaryPackaging": 0,
      "salarySacrifice": 0,
      "adminFee": 0,
      "superRate": 0,
      "paygOverride": null
    }
  ],
  "deductions": [],
  "expenses": [
    {
      "id": "e1",
      "name": "Mortgage",
      "amount": 1200.00,
      "freqValue": 1,
      "freqUnit": "fortnight",
      "category": "Residential Property",
      "isMortgageLink": true
    },
    {
      "id": "e2",
      "name": "Grocery",
      "amount": 300.00,
      "freqValue": 1,
      "freqUnit": "week",
      "category": "Daily",
      "isMortgageLink": false
    },
    {
      "id": "e3",
      "name": "Private Health Insurance",
      "amount": 37.35,
      "freqValue": 1,
      "freqUnit": "fortnight",
      "category": "Health",
      "isMortgageLink": false
    },
    {
      "id": "e4",
      "name": "Electricity bill",
      "amount": 120.00,
      "freqValue": 1,
      "freqUnit": "month",
      "category": "Utility",
      "isMortgageLink": false
    },
    {
      "id": "e5",
      "name": "Water bill- fixed",
      "amount": 175.00,
      "freqValue": 1,
      "freqUnit": "quarter",
      "category": "Utility",
      "isMortgageLink": false
    },
    {
      "id": "e6",
      "name": "Water bill",
      "amount": 115.00,
      "freqValue": 1,
      "freqUnit": "quarter",
      "category": "Utility",
      "isMortgageLink": false
    },
    {
      "id": "e7",
      "name": "Gas bill",
      "amount": 80.70,
      "freqValue": 2,
      "freqUnit": "month",
      "category": "Utility",
      "isMortgageLink": false
    },
    {
      "id": "e8",
      "name": "Internet",
      "amount": 65.00,
      "freqValue": 1,
      "freqUnit": "month",
      "category": "Utility",
      "isMortgageLink": false
    },
    {
      "id": "e9",
      "name": "Council rate",
      "amount": 530.00,
      "freqValue": 1,
      "freqUnit": "quarter",
      "category": "Property",
      "isMortgageLink": false
    },
    {
      "id": "e10",
      "name": "Body Corp",
      "amount": 700.00,
      "freqValue": 1,
      "freqUnit": "quarter",
      "category": "Property",
      "isMortgageLink": false
    },
    {
      "id": "e11",
      "name": "Car Insurance",
      "amount": 510.00,
      "freqValue": 1,
      "freqUnit": "year",
      "category": "Vehicle",
      "isMortgageLink": false
    },
    {
      "id": "e12",
      "name": "Home content insurance",
      "amount": 370.00,
      "freqValue": 1,
      "freqUnit": "year",
      "category": "Property",
      "isMortgageLink": false
    },
    {
      "id": "e13",
      "name": "Rego",
      "amount": 235.38,
      "freqValue": 3,
      "freqUnit": "month",
      "category": "Vehicle",
      "isMortgageLink": false
    },
    {
      "id": "e14",
      "name": "Commute",
      "amount": 60.00,
      "freqValue": 1,
      "freqUnit": "week",
      "category": "Commute",
      "isMortgageLink": false
    },
    {
      "id": "e15",
      "name": "Logbook Service",
      "amount": 350.00,
      "freqValue": 1,
      "freqUnit": "year",
      "category": "Vehicle",
      "isMortgageLink": false
    },
    {
      "id": "e16",
      "name": "Soundcloud",
      "amount": 6.99,
      "freqValue": 1,
      "freqUnit": "month",
      "category": "Membership",
      "isMortgageLink": false
    },
    {
      "id": "e17",
      "name": "Apple music",
      "amount": 6.99,
      "freqValue": 1,
      "freqUnit": "month",
      "category": "Membership",
      "isMortgageLink": false
    },
    {
      "id": "e18",
      "name": "Travel fund",
      "amount": 2500.00,
      "freqValue": 1,
      "freqUnit": "year",
      "category": "Travel",
      "isMortgageLink": false
    },
    {
      "id": "e19",
      "name": "Driver license",
      "amount": 85.96,
      "freqValue": 3,
      "freqUnit": "year",
      "category": "Vehicle",
      "isMortgageLink": false
    },
    {
      "id": "e20",
      "name": "Fuel",
      "amount": 0,
      "freqValue": 1,
      "freqUnit": "fortnight",
      "category": "Vehicle",
      "isMortgageLink": false
    },
    {
      "id": "e21",
      "name": "Buffer",
      "amount": 50.00,
      "freqValue": 1,
      "freqUnit": "week",
      "category": "Savings",
      "isMortgageLink": false
    }
  ],
  "expenseCategories": [
    "Residential Property",
    "Non-deductible debt",
    "Health",
    "Vehicle",
    "Travel",
    "Commute",
    "Debt",
    "Membership",
    "Utility",
    "Property",
    "Daily",
    "Savings",
    "Other"
  ],
  "accounts": [
    { "id": "1", "name": "BOQ saving", "color": "#ec4899" },
    { "id": "2", "name": "HSBC cash", "color": "#a855f7" },
    { "id": "3", "name": "UP Bank", "color": "#f59e0b" },
    { "id": "surplus", "name": "Surplus", "color": "#10b981" }
  ],
  "categoryMap": {
    "Health": "3",
    "Vehicle": "3",
    "Travel": "3",
    "Commute": "1",
    "Debt": "3",
    "Membership": "3",
    "Utility": "3",
    "Property": "3",
    "Daily": "2",
    "Savings": "3",
    "Other": "2",
    "Surplus": "surplus"
  },
  "assets": [
    {
      "id": "a1",
      "name": "A200",
      "value": 7218,
      "category": "Shares",
      "growthRate": 13.14
    },
    {
      "id": "a2",
      "name": "DHHF",
      "value": 8734,
      "category": "Shares",
      "growthRate": 12.07
    },
    {
      "id": "a3",
      "name": "NDQ",
      "value": 15152,
      "category": "Shares",
      "growthRate": 21.92
    },
    {
      "id": "a4",
      "name": "VDHG",
      "value": 8833,
      "category": "Shares",
      "growthRate": 11.22
    },
    {
      "id": "a5",
      "name": "Emergency Fund",
      "value": 11724,
      "category": "Cash",
      "growthRate": 1.25
    },
    {
      "id": "a6",
      "name": "Bank saving",
      "value": 5731,
      "category": "Cash",
      "growthRate": 4
    }
  ],
  "assetCategories": [
    "Cash",
    "Shares",
    "Super",
    "Crypto",
    "Business Equity",
    "Property Equity"
  ],
  "liabilities": [
    {
      "id": "l1",
      "name": "Car Loan",
      "balance": 18500,
      "category": "Personal"
    }
  ],
  "mortgageParams": {
    "principal": 464618.06,
    "offsetBalance": 104351.02,
    "interestRate": 5.39,
    "loanTermYears": 30,
    "userRepayment": null,
    "repaymentFreq": "fortnight",
    "propertyValue": 645000,
    "growthRate": 3.8,
    "useBudgetRepayment": true,
    "useSurplus": false
  },
  "fireMode": 'rigorous',
  "retirementBaseCost": 35500,
  "swr": 4.0,
  "fireTargetOverride": null
};
