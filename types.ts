// 2027 Statutory Constants
export const FPL_2027_BASE = 15960;
export const FPL_2027_PER_PERSON = 5680;
export const HSA_2027_SELF_LIMIT = 4500;
export const HSA_2027_FAMILY_LIMIT = 9000;
export const HDHP_2027_SELF_OOP_MAX = 8700;
export const HDHP_2027_FAMILY_OOP_MAX = 17400;
export const HDHP_2027_SELF_MIN_DEDUCTIBLE = 1750;
export const HDHP_2027_FAMILY_MIN_DEDUCTIBLE = 3500;

export type SubsidyScenarioMode = 'strict_cliff' | 'enhanced_extension';

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
  nonTaxableSocialSecurity: number; // Added for accurate MAGI
  annualPremium: number;
  capitalLosses: number;
  marginalTaxRate: number; // as a percentage, e.g., 24
  estimatedSubsidy: number; // PTC
  householdSize: number;
  // Plan Design Inputs
  planDeductible: number;
  planOOPMax: number;
  planCoinsurance: number; // User pays % (e.g., 20)
  subsidyScenario: SubsidyScenarioMode; // 2027 Strict Cliff vs. Enhanced Extension
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
    cliffGap: number;
    povertyLevel: number;
    fplPercentage: number;
    subsidyScenario: SubsidyScenarioMode;
  };
  usageScenarios: {
    low: UsageScenarioCost;
    medium: UsageScenarioCost;
    high: UsageScenarioCost;
  };
  winner: 'Scenario 1' | 'Scenario 2' | 'Equal';
  savings: number;
}

export interface AIAnalysisResult {
  analysis: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
}
