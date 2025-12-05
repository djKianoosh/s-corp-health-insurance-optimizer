export interface PayStubData {
  grossPay: number;
  fedWithholding: number;
  socialSecurity: number;
  medicare: number;
  stateWithholding: number;
  preTax401k: number;
  hsaNonTaxable: number;
}

export interface FinancialInputs {
  sCorpOwner: PayStubData;
  spouse: PayStubData;
  otherIncome: number;
  taxExemptInterest: number;
  annualPremium: number;
  capitalLosses: number;
  marginalTaxRate: number; // as a percentage, e.g., 24
  estimatedSubsidy: number; // PTC
  householdSize: number;
  // Plan Design Inputs
  planDeductible: number;
  planOOPMax: number;
  planCoinsurance: number; // User pays % (e.g., 20)
}

export interface UsageScenarioCost {
  label: string;
  billedAmount: number;
  oopCost: number;
  totalCostScen1: number;
  totalCostScen2: number;
}

export interface ScenarioResult {
  scenario1: {
    totalW2: number;
    initialAGI: number;
    deductibleSEHI: number;
    finalAGI: number;
    taxSavings: number;
    netCost: number;
  };
  scenario2: {
    initialAGI: number;
    magi: number;
    subsidy: number;
    netCost: number;
    hitCliff: boolean;
    fplPercentage: number;
  };
  usageScenarios: {
    low: UsageScenarioCost;
    medium: UsageScenarioCost;
    high: UsageScenarioCost;
  };
  winner: 'Scenario 1' | 'Scenario 2' | 'Equal';
  savings: number;
}