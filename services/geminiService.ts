import { GoogleGenAI } from "@google/genai";
import { FinancialInputs, ScenarioResult } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

export const getAIAnalysis = async (inputs: FinancialInputs, results: ScenarioResult): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "API Key is missing. Please check your environment configuration.";
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Calculate Gap to Cliff if hit
  let cliffGapString = "";
  if (results.scenario2.hitCliff && results.scenario2.fplPercentage > 400) {
    const magi = results.scenario2.magi;
    const fplPercent = results.scenario2.fplPercentage;
    const targetMagi = magi * (400 / fplPercent);
    const gap = magi - targetMagi;
    const safeGap = Math.ceil(gap + 100);
    cliffGapString = `$${safeGap.toLocaleString()}`;
  }

  const prompt = `
    You are an expert tax accountant and financial planner specialized in US tax law for S-Corporation owners.
    
    Analyze the following comparison between two health insurance funding strategies for a 2% S-Corp shareholder:

    **Detailed Financial Inputs:**
    - Household Size: ${inputs.householdSize}
    - S-Corp Owner Gross Pay: $${inputs.sCorpOwner.grossPay.toLocaleString()}
    - Spouse Gross Pay: $${inputs.spouse.grossPay.toLocaleString()}
    - Health Insurance Premium: $${inputs.annualPremium.toLocaleString()}
    - Plan Deductible: $${inputs.planDeductible.toLocaleString()} | OOP Max: $${inputs.planOOPMax.toLocaleString()}
    - Marginal Tax Bracket: ${inputs.marginalTaxRate}%
    - Available Capital Losses (Harvesting): $${inputs.capitalLosses.toLocaleString()} (Used max $3k against ordinary income)
    - Tax-Exempt Interest + Non-Taxable SS (Add-backs): $${(inputs.taxExemptInterest + inputs.nonTaxableSocialSecurity).toLocaleString()}
    - Estimated ACA Subsidy (User Input if eligible): $${inputs.estimatedSubsidy.toLocaleString()}

    **Calculated Results:**
    - Scenario 1 (S-Corp Deduction Path) Net Premium Cost: $${results.scenario1.netCost.toLocaleString()}
      - Tax Savings (via SEHI): $${results.scenario1.taxSavings.toLocaleString()}
    
    - Scenario 2 (ACA Subsidies Path) Net Premium Cost: $${results.scenario2.netCost.toLocaleString()}
      - Adjusted MAGI for ACA: $${results.scenario2.magi.toLocaleString()}
      - FPL Percentage: ${results.scenario2.fplPercentage.toFixed(1)}%
      - Hit 400% Cliff: ${results.scenario2.hitCliff ? `YES. (Subsidy lost)` : 'NO'}

    **Total Liability Scenarios (Premium + Est. Medical OOP):**
    - High Usage (Catastrophic): Scen 1 Total = $${results.usageScenarios.high.totalCostScen1.toLocaleString()} vs Scen 2 Total = $${results.usageScenarios.high.totalCostScen2.toLocaleString()}
    
    **Winner:** ${results.winner} saves approximately $${results.savings.toLocaleString()} per year on premiums.

    **Task:**
    Provide a concise (max 200 words) strategic analysis. 
    1. Confirm the winning strategy based on Net Premium Cost.
    2. Discuss risk: Does the premium savings in the winning scenario justify the plan's deductible/OOP exposure?
    3. Discuss the impact of pre-tax deductions (401k/HSA) on the ACA MAGI.
    ${results.scenario2.hitCliff ? `4. **CRITICAL**: The user hit the subsidy cliff by approximately ${cliffGapString}. You MUST explicitly recommend reducing MAGI by at least ${cliffGapString} (e.g., via increased 401k or HSA contributions) to get below 400% FPL and reclaim the $${inputs.estimatedSubsidy.toLocaleString()} subsidy.` : '4. Mention keeping an eye on MAGI limits if close to the 400% FPL cliff.'}
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