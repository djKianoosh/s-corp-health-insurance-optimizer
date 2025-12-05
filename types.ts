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
  taxExemptInterest: number; // Added for accurate MAGI
  annualPremium: number;
  capitalLosses: number;
  marginalTaxRate: number; // as a percentage, e.g., 24
  estimatedSubsidy: number; // PTC
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
  };
  winner: 'Scenario 1' | 'Scenario 2' | 'Equal';
  savings: number;
}