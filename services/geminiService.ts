import { GoogleGenAI } from "@google/genai";
import { FinancialInputs, ScenarioResult } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

export const getAIAnalysis = async (inputs: FinancialInputs, results: ScenarioResult): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "API Key is missing. Please check your environment configuration.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const sCorpNetTaxable = inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k - inputs.sCorpOwner.hsaNonTaxable;
  const spouseNetTaxable = inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable;

  const prompt = `
    You are an expert tax accountant and financial planner specialized in US tax law for S-Corporation owners.
    
    Analyze the following comparison between two health insurance funding strategies for a 2% S-Corp shareholder:

    **Detailed Financial Inputs:**
    - S-Corp Owner Gross Pay: $${inputs.sCorpOwner.grossPay.toLocaleString()}
      - Pre-tax 401k: $${inputs.sCorpOwner.preTax401k.toLocaleString()}
      - HSA: $${inputs.sCorpOwner.hsaNonTaxable.toLocaleString()}
      - Net Taxable Base (Box 1): $${sCorpNetTaxable.toLocaleString()}
    - Spouse Gross Pay: $${inputs.spouse.grossPay.toLocaleString()}
      - Net Taxable Base (Box 1): $${spouseNetTaxable.toLocaleString()}
    - Other Income: $${inputs.otherIncome.toLocaleString()}
    - Health Insurance Premium: $${inputs.annualPremium.toLocaleString()}
    - Marginal Tax Bracket: ${inputs.marginalTaxRate}%
    - Available Capital Losses (Harvesting): $${inputs.capitalLosses.toLocaleString()}
    - Estimated ACA Subsidy (PTC): $${inputs.estimatedSubsidy.toLocaleString()}

    **Calculated Results:**
    - Scenario 1 (S-Corp Deduction Path) Net Cost: $${results.scenario1.netCost.toLocaleString()}
      - Tax Savings (via SEHI): $${results.scenario1.taxSavings.toLocaleString()}
    
    - Scenario 2 (ACA Subsidies Path) Net Cost: $${results.scenario2.netCost.toLocaleString()}
      - Adjusted MAGI for ACA: $${results.scenario2.magi.toLocaleString()}
      - Subsidy Applied: $${results.scenario2.subsidy.toLocaleString()}

    **Winner:** ${results.winner} saves approximately $${results.savings.toLocaleString()} per year.

    **Task:**
    Provide a concise (max 200 words) strategic analysis. 
    1. Confirm the winning strategy.
    2. Discuss the impact of the pre-tax deductions (401k/HSA) on the MAGI for Scenario 2.
    3. Suggest a recommendation, including any risks like income volatility for ACA subsidies.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while contacting the financial advisor AI.";
  }
};