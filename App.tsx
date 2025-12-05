import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, DollarSign, TrendingDown, Info, User, Users } from 'lucide-react';
import { FinancialInputs, ScenarioResult, PayStubData } from './types';
import { InputGroup } from './components/InputGroup';
import { PayStubInput } from './components/PayStubInput';
import { ComparisonChart } from './components/ComparisonChart';
import { AIAdvisor } from './components/AIAdvisor';

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
  // State for user inputs
  const [inputs, setInputs] = useState<FinancialInputs>({
    sCorpOwner: { ...initialPayStub, grossPay: 80000, preTax401k: 5000 },
    spouse: { ...initialPayStub, grossPay: 45000 },
    otherIncome: 5000,
    taxExemptInterest: 0,
    annualPremium: 12000,
    capitalLosses: 0,
    marginalTaxRate: 24,
    estimatedSubsidy: 0
  });

  const handleInputChange = (field: keyof FinancialInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handlePayStubChange = (role: 'sCorpOwner' | 'spouse', data: PayStubData) => {
    setInputs(prev => ({ ...prev, [role]: data }));
  };

  // Calculation Logic
  const results: ScenarioResult = useMemo(() => {
    const { sCorpOwner, spouse, annualPremium, otherIncome, taxExemptInterest, capitalLosses, marginalTaxRate, estimatedSubsidy } = inputs;

    // Calculate Box 1 Wages Base (Gross - PreTax Deductions)
    // Note: Health Insurance is handled separately below for S-Corp
    const sCorpBaseBox1 = Math.max(0, sCorpOwner.grossPay - sCorpOwner.preTax401k - sCorpOwner.hsaNonTaxable);
    const spouseBaseBox1 = Math.max(0, spouse.grossPay - spouse.preTax401k - spouse.hsaNonTaxable);

    // --- Scenario 1: S Corp Deduction ---
    // For S-Corp owner, the premium is added to wages (Box 1) then deducted (SEHI).
    const sCorpW2Scenario1 = sCorpBaseBox1 + annualPremium; 
    
    const initialAGIScenario1 = sCorpW2Scenario1 + spouseBaseBox1 + otherIncome; // Note: taxExemptInterest is NOT in AGI
    
    // SEHI Deduction
    const deductibleSEHI = Math.min(annualPremium, sCorpW2Scenario1); // Simplified limit check
    
    const finalAGIScenario1 = initialAGIScenario1 - deductibleSEHI;
    const taxSavings = deductibleSEHI * (marginalTaxRate / 100);
    const netCostScen1 = annualPremium - taxSavings;

    // --- Scenario 2: ACA Subsidies ---
    // Premium paid personally, so it is NOT added to Box 1 wages. 
    // Assumes S-Corp Salary stays at Gross Pay (Base Box 1).
    const initialAGIScenario2 = sCorpBaseBox1 + spouseBaseBox1 + otherIncome;
    
    // MAGI Calculation for ACA
    // MAGI = AGI + Tax Exempt Interest + Non-Taxable SS (assuming 0 here) + Foreign Income (0)
    // Then apply Capital Losses logic
    const baseMAGI = initialAGIScenario2 + taxExemptInterest;
    
    const finalMAGI = Math.max(0, baseMAGI - capitalLosses);
    
    const subsidy = estimatedSubsidy;
    const netCostScen2 = Math.max(0, annualPremium - subsidy);

    // --- Comparison ---
    const diff = netCostScen1 - netCostScen2;
    let winner: 'Scenario 1' | 'Scenario 2' | 'Equal' = 'Equal';
    if (diff > 0) winner = 'Scenario 2';
    if (diff < 0) winner = 'Scenario 1';

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
        netCost: netCostScen2
      },
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
            Compare the <span className="font-semibold text-blue-600">SEHI Deduction</span> vs. <span className="font-semibold text-purple-600">ACA Subsidy Optimization</span> strategies.
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
                tooltip="Municipal bonds, etc. Adds back to MAGI for ACA."
                value={inputs.taxExemptInterest} 
                onChange={(v) => handleInputChange('taxExemptInterest', v)} 
              />

              <div className="my-6 border-t border-slate-100"></div>

              <InputGroup 
                label="Annual Health Premium" 
                tooltip="Total full cost of the insurance plan before any subsidies or tax savings."
                value={inputs.annualPremium} 
                onChange={(v) => handleInputChange('annualPremium', v)} 
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

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mt-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  ACA Optimization Inputs
                </h3>
                <InputGroup 
                  label="Capital Losses Available" 
                  tooltip="Amount of harvested losses available to reduce MAGI."
                  value={inputs.capitalLosses} 
                  onChange={(v) => handleInputChange('capitalLosses', v)} 
                />
                <InputGroup 
                  label="Estimated ACA Subsidy (PTC)" 
                  tooltip="Use an exchange calculator (e.g. Healthcare.gov) to estimate your subsidy based on your MAGI."
                  value={inputs.estimatedSubsidy} 
                  onChange={(v) => handleInputChange('estimatedSubsidy', v)} 
                />
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
                    <span className="font-semibold text-slate-700">Net Annual Cost</span>
                    <span className="text-2xl font-bold text-slate-900">${results.scenario1.netCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/50 text-xs text-slate-500">
                  <p>Income Tax Deduction: <span className="font-mono">${results.scenario1.deductibleSEHI.toLocaleString()}</span></p>
                  <p>Effect: Lowers Taxable Income</p>
                </div>
              </div>

              {/* Scenario 2 Card */}
              <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${results.winner === 'Scenario 2' ? 'bg-purple-50 border-purple-500 shadow-md transform scale-[1.02]' : 'bg-white border-slate-100 opacity-80'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Scenario 2: ACA Path</h3>
                  {results.winner === 'Scenario 2' && <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold">WINNER</span>}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Premium Cost</span>
                    <span>${inputs.annualPremium.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-purple-600 font-medium">
                    <span>ACA Subsidy (PTC)</span>
                    <span>- ${results.scenario2.subsidy.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Annual Cost</span>
                    <span className="text-2xl font-bold text-slate-900">${results.scenario2.netCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/50 text-xs text-slate-500">
                  <p>Est. MAGI: <span className="font-mono">${results.scenario2.magi.toLocaleString()}</span></p>
                  <p>Strategy: Tax-Loss Harvesting</p>
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
                    Potential annual savings: <span className="text-green-400 font-bold">${results.savings.toLocaleString()}</span>
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
            </div>

            {/* Chart */}
            <ComparisonChart results={results} />

            {/* Detailed Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Calculation Details</h3>
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
                      <td className="px-4 py-2 font-medium text-slate-700">Gross W-2 Wages (Box 1 Base)</td>
                      <td className="px-4 py-2 text-right">${(inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k - inputs.sCorpOwner.hsaNonTaxable + inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">${(inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k - inputs.sCorpOwner.hsaNonTaxable + inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Add: Premium to Wages</td>
                      <td className="px-4 py-2 text-right text-blue-600">+ ${inputs.annualPremium.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-slate-300">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: SEHI / Capital Loss</td>
                      <td className="px-4 py-2 text-right text-red-500">(${results.scenario1.deductibleSEHI.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-red-500">(${inputs.capitalLosses.toLocaleString()})</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="px-4 py-2 font-bold text-slate-800">Final Adjusted Income</td>
                      <td className="px-4 py-2 text-right font-bold">${results.scenario1.finalAGI.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(AGI)</span></td>
                      <td className="px-4 py-2 text-right font-bold">${results.scenario2.magi.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(MAGI)</span></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Tax Savings / Subsidy</td>
                      <td className="px-4 py-2 text-right text-emerald-600">(${results.scenario1.taxSavings.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-purple-600">(${results.scenario2.subsidy.toLocaleString()})</td>
                    </tr>
                    <tr className="bg-slate-100">
                      <td className="px-4 py-3 font-black text-slate-900">Net Annual Cost</td>
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