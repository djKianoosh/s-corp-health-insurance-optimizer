import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, DollarSign, TrendingDown, Info, AlertTriangle, Shield } from 'lucide-react';
import { FinancialInputs, ScenarioResult, PayStubData, UsageScenarioCost } from './types';
import { InputGroup } from './components/InputGroup';
import { PayStubInput } from './components/PayStubInput';
import { ComparisonChart } from './components/ComparisonChart';
import { AIAdvisor } from './components/AIAdvisor';
import { UsageScenarioTable } from './components/UsageScenarioTable';

const initialPayStub: PayStubData = {
  grossPay: 0,
  fedWithholding: 0,
  socialSecurity: 0,
  medicare: 0,
  stateWithholding: 0,
  preTax401k: 0,
  hsaNonTaxable: 0
};

const App: React.FC = () => {
  const [inputs, setInputs] = useState<FinancialInputs>({
    sCorpOwner: { 
      ...initialPayStub, 
      grossPay: 80000, 
      fedWithholding: 8500,
      socialSecurity: 4960,
      medicare: 1160,
      stateWithholding: 4200,
      preTax401k: 5000, 
      hsaNonTaxable: 3000 
    },
    spouse: { 
      ...initialPayStub, 
      grossPay: 45000,
      fedWithholding: 3200,
      socialSecurity: 2790,
      medicare: 653,
      stateWithholding: 2100,
      preTax401k: 2500,
      hsaNonTaxable: 1000
    },
    otherIncome: 5000,
    taxExemptInterest: 0,
    nonTaxableSocialSecurity: 0,
    annualPremium: 15000,
    capitalLosses: 0,
    marginalTaxRate: 24,
    estimatedSubsidy: 8000,
    householdSize: 3,
    planDeductible: 14200,
    planOOPMax: 14200,
    planCoinsurance: 0
  });

  const handleInputChange = (field: keyof FinancialInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handlePayStubChange = (role: 'sCorpOwner' | 'spouse', data: PayStubData) => {
    setInputs(prev => ({ ...prev, [role]: data }));
  };

  const results: ScenarioResult = useMemo(() => {
    const { 
      sCorpOwner, 
      spouse, 
      annualPremium, 
      otherIncome, 
      taxExemptInterest, 
      nonTaxableSocialSecurity,
      capitalLosses, 
      marginalTaxRate, 
      estimatedSubsidy,
      householdSize,
      planDeductible,
      planOOPMax,
      planCoinsurance
    } = inputs;

    // --- Core Financial Calcs ---
    
    // S-Corp Owner: 2% Shareholders cannot take pre-tax HSA via payroll (Section 125). 
    // It's taxable wages, then deducted on 1040. 
    // Box 1 = Gross - 401k (HSA is NOT removed here for Owner).
    const sCorpBox1Wages = Math.max(0, sCorpOwner.grossPay - sCorpOwner.preTax401k);
    
    // Spouse: Assumed non-owner employee. Can take Section 125 pre-tax HSA.
    // Box 1 = Gross - 401k - HSA.
    const spouseBox1Wages = Math.max(0, spouse.grossPay - spouse.preTax401k - spouse.hsaNonTaxable);

    // Common Deductions/Adjustments
    const sCorpHsaDeduction = sCorpOwner.hsaNonTaxable; // Above-the-line deduction for owner
    const capitalLossDeduction = Math.min(capitalLosses, 3000); // IRS Limit: Max $3k net loss against ordinary income

    // --- Scenario 1: S Corp Deduction Path ---
    // Premium added to W-2 (Box 1), then deducted (SEHI)
    const sCorpW2Scenario1 = sCorpBox1Wages + annualPremium; 
    
    // AGI Calculation Scen 1
    const initialAGIScenario1 = 
      sCorpW2Scenario1 + 
      spouseBox1Wages + 
      otherIncome - 
      sCorpHsaDeduction - 
      capitalLossDeduction;

    // SEHI Limitation: Cannot exceed Medicare wages from S-Corp
    const deductibleSEHI = Math.min(annualPremium, sCorpW2Scenario1); 
    
    const finalAGIScenario1 = initialAGIScenario1 - deductibleSEHI;
    const taxSavings = deductibleSEHI * (marginalTaxRate / 100);
    const netCostScen1 = annualPremium - taxSavings;

    // --- Scenario 2: ACA Subsidies Path ---
    // Premium paid personally (after-tax). Not in W-2. Not Deducted.
    
    // AGI Calculation Scen 2
    const initialAGIScenario2 = 
      sCorpBox1Wages + 
      spouseBox1Wages + 
      otherIncome - 
      sCorpHsaDeduction - 
      capitalLossDeduction;

    // MAGI Calculation (ACA Specifics Form 8962)
    // MAGI = AGI + Tax-Exempt Interest + Non-Taxable Social Security + Foreign Earned Income (ignored here)
    const baseMAGI = initialAGIScenario2 + taxExemptInterest + nonTaxableSocialSecurity;
    
    // Note: capitalLossDeduction was already applied to AGI above, correctly reducing MAGI.
    // We floor at 0.
    const finalMAGI = Math.max(0, baseMAGI);
    
    // Cliff Logic (2026) - 400% FPL
    const FPL_BASE = 15060;
    const FPL_PER_PERSON = 5380;
    const povertyLevel = FPL_BASE + (FPL_PER_PERSON * Math.max(0, householdSize - 1));
    const fplPercentage = povertyLevel > 0 ? (finalMAGI / povertyLevel) * 100 : 0;
    
    const hitCliff = fplPercentage > 400;
    const subsidy = hitCliff ? 0 : estimatedSubsidy;
    const netCostScen2 = Math.max(0, annualPremium - subsidy);

    // Winner Logic
    const diff = netCostScen1 - netCostScen2;
    let winner: 'Scenario 1' | 'Scenario 2' | 'Equal' = 'Equal';
    if (diff > 0) winner = 'Scenario 2';
    if (diff < 0) winner = 'Scenario 1';

    // --- Medical Usage Logic (Total Cost of Ownership) ---
    const calculateOOP = (billedAmount: number) => {
      if (billedAmount <= planDeductible) return billedAmount;
      const remaining = billedAmount - planDeductible;
      const coinsuranceAmt = remaining * (planCoinsurance / 100);
      return Math.min(planOOPMax, planDeductible + coinsuranceAmt);
    };

    const createUsageScenario = (label: string, billed: number): UsageScenarioCost => {
      const oop = calculateOOP(billed);
      return {
        label,
        billedAmount: billed,
        oopCost: oop,
        totalCostScen1: netCostScen1 + oop,
        totalCostScen2: netCostScen2 + oop
      };
    };

    const low = createUsageScenario('Low', 1000);
    const medium = createUsageScenario('Medium', 10000);
    const high = createUsageScenario('High', 75000);

    return {
      scenario1: {
        totalW2: sCorpW2Scenario1,
        initialAGI: initialAGIScenario1,
        deductibleSEHI,
        finalAGI: finalAGIScenario1,
        taxSavings,
        netCost: netCostScen1
      },
      scenario2: {
        initialAGI: initialAGIScenario2,
        magi: finalMAGI,
        subsidy,
        netCost: netCostScen2,
        hitCliff,
        fplPercentage
      },
      usageScenarios: { low, medium, high },
      winner,
      savings: Math.abs(diff)
    };
  }, [inputs]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full shadow-lg mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            S-Corp Health Insurance Optimizer
          </h1>
          <p className="mt-2 text-lg text-slate-600 max-w-2xl mx-auto">
            Compare the <span className="font-semibold text-blue-600">SEHI Deduction</span> vs. <span className="font-semibold text-purple-600">ACA Subsidy (2026 Rules)</span> including Plan Deductibles.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: User Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl font-semibold text-slate-800">Financial Inputs</h2>
              </div>
              
              <div className="space-y-6">
                <PayStubInput 
                  title="S-Corp Owner Pay" 
                  data={inputs.sCorpOwner} 
                  onChange={(d) => handlePayStubChange('sCorpOwner', d)}
                  colorClass="text-blue-600"
                  isOwner={true}
                />

                <PayStubInput 
                  title="Spouse Pay" 
                  data={inputs.spouse} 
                  onChange={(d) => handlePayStubChange('spouse', d)}
                  colorClass="text-slate-600"
                />
              </div>
              
              <div className="my-6 border-t border-slate-100"></div>

              <InputGroup 
                label="Other Taxable Income" 
                tooltip="Interest, dividends, rental income, etc."
                value={inputs.otherIncome} 
                onChange={(v) => handleInputChange('otherIncome', v)} 
              />

              <InputGroup 
                label="Tax-Exempt Interest" 
                tooltip="Municipal bonds, etc. Adds back to MAGI."
                value={inputs.taxExemptInterest} 
                onChange={(v) => handleInputChange('taxExemptInterest', v)} 
              />

              <InputGroup 
                label="Non-Taxable Social Security" 
                tooltip="Non-taxable portion of SS benefits. Adds back to MAGI."
                value={inputs.nonTaxableSocialSecurity} 
                onChange={(v) => handleInputChange('nonTaxableSocialSecurity', v)} 
              />
              
              <InputGroup 
                label="Marginal Tax Rate" 
                prefix="" 
                suffix="%" 
                step={1}
                tooltip="The highest federal tax bracket you fall into (e.g., 22%, 24%, 32%)."
                value={inputs.marginalTaxRate} 
                onChange={(v) => handleInputChange('marginalTaxRate', v)} 
              />

              <div className="my-6 border-t border-slate-100"></div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mt-6">
                 <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Health Plan Details
                </h3>
                <InputGroup 
                  label="Annual Health Premium" 
                  tooltip="Total full cost of the insurance plan before any subsidies."
                  value={inputs.annualPremium} 
                  onChange={(v) => handleInputChange('annualPremium', v)} 
                />
                <div className="grid grid-cols-2 gap-4">
                   <InputGroup 
                    label="Plan Deductible" 
                    tooltip="Amount you pay before coinsurance kicks in."
                    value={inputs.planDeductible} 
                    onChange={(v) => handleInputChange('planDeductible', v)} 
                  />
                  <InputGroup 
                    label="OOP Max" 
                    tooltip="Maximum out-of-pocket expenses per year."
                    value={inputs.planOOPMax} 
                    onChange={(v) => handleInputChange('planOOPMax', v)} 
                  />
                </div>
                <InputGroup 
                    label="Coinsurance (Your Share)" 
                    tooltip="Percentage you pay after deductible (e.g. 20%)"
                    value={inputs.planCoinsurance} 
                    onChange={(v) => handleInputChange('planCoinsurance', v)} 
                    prefix=""
                    suffix="%"
                    step={5}
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  ACA Optimization Inputs
                </h3>
                
                <div className="mb-4">
                  <InputGroup 
                    label="Household Size" 
                    tooltip="Number of people on the tax return. Used to calculate FPL %."
                    value={inputs.householdSize} 
                    onChange={(v) => handleInputChange('householdSize', v)} 
                    prefix=""
                    step={1}
                  />
                </div>

                <InputGroup 
                  label="Capital Losses Available" 
                  tooltip="Max $3,000 reduction against ordinary income."
                  value={inputs.capitalLosses} 
                  onChange={(v) => handleInputChange('capitalLosses', v)} 
                />
                
                <div className="relative">
                  <InputGroup 
                    label="Estimated ACA Subsidy (PTC)" 
                    tooltip="Est. annual subsidy if eligible. Will be set to $0 if MAGI > 400% FPL."
                    value={inputs.estimatedSubsidy} 
                    onChange={(v) => handleInputChange('estimatedSubsidy', v)} 
                  />
                  {results.scenario2.hitCliff && (
                    <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Subsidy removed (MAGI &gt; 400% FPL)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Results & Analysis */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Cards: The Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Scenario 1 Card */}
              <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${results.winner === 'Scenario 1' ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]' : 'bg-white border-slate-100 opacity-80'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Scenario 1: S-Corp Path</h3>
                  {results.winner === 'Scenario 1' && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">WINNER</span>}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Premium Cost</span>
                    <span>${inputs.annualPremium.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>SEHI Tax Savings</span>
                    <span>- ${results.scenario1.taxSavings.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Premium Cost</span>
                    <span className="text-2xl font-bold text-slate-900">${results.scenario1.netCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              {/* Scenario 2 Card */}
              <div className={`rounded-xl p-6 border-2 transition-all duration-300 relative overflow-hidden ${results.winner === 'Scenario 2' ? 'bg-purple-50 border-purple-500 shadow-md transform scale-[1.02]' : 'bg-white border-slate-100 opacity-80'}`}>
                
                {results.scenario2.hitCliff && (
                   <div className="absolute -right-8 top-6 bg-red-500 text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm z-10">
                     CLIFF HIT
                   </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Scenario 2: ACA Path</h3>
                  {results.winner === 'Scenario 2' && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">WINNER</span>}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Premium Cost</span>
                    <span>${inputs.annualPremium.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between font-medium ${results.scenario2.hitCliff ? 'text-slate-400 line-through' : 'text-purple-600'}`}>
                    <span>ACA Subsidy (PTC)</span>
                    <span>- ${inputs.estimatedSubsidy.toLocaleString()}</span>
                  </div>
                  
                  {results.scenario2.hitCliff && (
                    <div className="flex justify-between text-red-600 font-medium text-xs bg-red-50 p-1 rounded">
                      <span>Subsidy (Cliff &gt; 400% FPL)</span>
                      <span>$0</span>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Premium Cost</span>
                    <span className="text-2xl font-bold text-slate-900">${results.scenario2.netCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Banner */}
            <div className="bg-slate-900 rounded-lg p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="font-bold text-lg">
                    {results.winner === 'Equal' 
                      ? "Both options cost the same" 
                      : `${results.winner} is the better option`
                    }
                  </h4>
                  <p className="text-slate-300 text-sm">
                    Potential premium savings: <span className="text-green-400 font-bold">${results.savings.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
            </div>

            {/* Chart */}
            <ComparisonChart results={results} />
            
            {/* New Usage Scenario Table */}
            <UsageScenarioTable results={results} />

            {/* Detailed Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Tax Calculation Details</h3>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">Line Item</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-600 uppercase tracking-wider">Scenario 1 (S-Corp)</th>
                      <th className="px-4 py-3 text-right font-medium text-purple-600 uppercase tracking-wider">Scenario 2 (ACA)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">S-Corp Wages (Box 1)</td>
                      <td className="px-4 py-2 text-right">${(Math.max(0, inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k)).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">${(Math.max(0, inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k)).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Spouse Wages (Box 1)</td>
                      <td className="px-4 py-2 text-right">${(Math.max(0, inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable)).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">${(Math.max(0, inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable)).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Add: Premium to Wages</td>
                      <td className="px-4 py-2 text-right text-blue-600">+ ${inputs.annualPremium.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-slate-300">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: SEHI</td>
                      <td className="px-4 py-2 text-right text-red-500">(${results.scenario1.deductibleSEHI.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-slate-300">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: Owner HSA (Form 8889)</td>
                      <td className="px-4 py-2 text-right text-red-500">(${inputs.sCorpOwner.hsaNonTaxable.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-red-500">(${inputs.sCorpOwner.hsaNonTaxable.toLocaleString()})</td>
                    </tr>
                     <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: Capital Loss (Max $3k)</td>
                      <td className="px-4 py-2 text-right text-red-500">(${Math.min(inputs.capitalLosses, 3000).toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-red-500">(${Math.min(inputs.capitalLosses, 3000).toLocaleString()})</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-4 py-2 font-bold text-slate-800">Final Adjusted Income</td>
                      <td className="px-4 py-2 text-right font-bold">${results.scenario1.finalAGI.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(AGI)</span></td>
                      <td className="px-4 py-2 text-right font-bold">${results.scenario2.magi.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(MAGI)</span></td>
                    </tr>
                    <tr className="bg-slate-100">
                      <td className="px-4 py-3 font-black text-slate-900">Net Annual Premium Cost</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">${results.scenario1.netCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">${results.scenario2.netCost.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Advisor Section */}
            <AIAdvisor inputs={inputs} results={results} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;