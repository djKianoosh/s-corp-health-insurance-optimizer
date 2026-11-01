import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  DollarSign, 
  TrendingDown, 
  Info, 
  AlertTriangle, 
  Shield, 
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Layers
} from 'lucide-react';
import { 
  FinancialInputs, 
  ScenarioResult, 
  PayStubData, 
  UsageScenarioCost, 
  SubsidyScenarioMode,
  FPL_2027_BASE,
  FPL_2027_PER_PERSON,
  HSA_2027_SELF_LIMIT,
  HSA_2027_FAMILY_LIMIT,
  HDHP_2027_SELF_OOP_MAX,
  HDHP_2027_FAMILY_OOP_MAX,
  HDHP_2027_SELF_MIN_DEDUCTIBLE,
  HDHP_2027_FAMILY_MIN_DEDUCTIBLE
} from './types';
import { InputGroup } from './components/InputGroup';
import { PayStubInput } from './components/PayStubInput';
import { ComparisonChart } from './components/ComparisonChart';
import { AIAdvisor } from './components/AIAdvisor';
import { UsageScenarioTable } from './components/UsageScenarioTable';
import { AboutPanel } from './components/AboutPanel';

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [inputs, setInputs] = useState<FinancialInputs>({
    sCorpOwner: { 
      ...initialPayStub, 
      grossPay: 85000, 
      fedWithholding: 9200,
      socialSecurity: 5270,
      medicare: 1233,
      stateWithholding: 4500,
      preTax401k: 6000, 
      hsaNonTaxable: 3500 
    },
    spouse: { 
      ...initialPayStub, 
      grossPay: 48000,
      fedWithholding: 3500,
      socialSecurity: 2976,
      medicare: 696,
      stateWithholding: 2200,
      preTax401k: 3000,
      hsaNonTaxable: 1500
    },
    otherIncome: 5000,
    taxExemptInterest: 0,
    nonTaxableSocialSecurity: 0,
    annualPremium: 16500,
    capitalLosses: 0,
    marginalTaxRate: 24,
    estimatedSubsidy: 8400,
    householdSize: 3,
    planDeductible: 3500,
    planOOPMax: 17400,
    planCoinsurance: 20,
    subsidyScenario: 'strict_cliff'
  });

  const handleInputChange = (field: keyof FinancialInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handlePayStubChange = (role: 'sCorpOwner' | 'spouse', data: PayStubData) => {
    setInputs(prev => ({ ...prev, [role]: data }));
  };

  const applyPlanPreset = (type: 'individual' | 'family') => {
    if (type === 'individual') {
      setInputs(prev => ({
        ...prev,
        planDeductible: HDHP_2027_SELF_MIN_DEDUCTIBLE,
        planOOPMax: HDHP_2027_SELF_OOP_MAX,
        annualPremium: 8200
      }));
    } else {
      setInputs(prev => ({
        ...prev,
        planDeductible: HDHP_2027_FAMILY_MIN_DEDUCTIBLE,
        planOOPMax: HDHP_2027_FAMILY_OOP_MAX,
        annualPremium: 16500
      }));
    }
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
      planCoinsurance,
      subsidyScenario
    } = inputs;

    // --- Core Financial Calcs for 2027 ---
    
    // S-Corp Owner: 2% Shareholders cannot take pre-tax HSA via payroll (Section 125). 
    // It is reported in Box 1 wages, then deducted above-the-line on 1040 Schedule 1 (Form 8889). 
    // Box 1 = Gross - 401k (HSA is NOT removed here for Owner).
    const sCorpBox1Wages = Math.max(0, sCorpOwner.grossPay - sCorpOwner.preTax401k);
    
    // Spouse: Assumed non-owner employee. Can take Section 125 pre-tax HSA.
    // Box 1 = Gross - 401k - HSA.
    const spouseBox1Wages = Math.max(0, spouse.grossPay - spouse.preTax401k - spouse.hsaNonTaxable);

    // Common Deductions/Adjustments
    const sCorpHsaDeduction = sCorpOwner.hsaNonTaxable; // Above-the-line deduction on Form 1040
    const capitalLossDeduction = Math.min(capitalLosses, 3000); // IRS Limit: Max $3k net loss against ordinary income

    // --- Scenario 1: S Corp Deduction Path (2027) ---
    // Premium added to W-2 (Box 1), then deducted (SEHI)
    const sCorpW2Scenario1 = sCorpBox1Wages + annualPremium; 
    
    // AGI Calculation Scen 1
    const initialAGIScenario1 = 
      sCorpW2Scenario1 + 
      spouseBox1Wages + 
      otherIncome - 
      sCorpHsaDeduction - 
      capitalLossDeduction;

    // SEHI Limitation: Cannot exceed Medicare wages from S-Corp (Notice 2008-1)
    const deductibleSEHI = Math.min(annualPremium, sCorpW2Scenario1); 
    
    const finalAGIScenario1 = initialAGIScenario1 - deductibleSEHI;
    const taxSavings = deductibleSEHI * (marginalTaxRate / 100);
    const netCostScen1 = annualPremium - taxSavings;

    // --- Scenario 2: ACA Subsidies Path (2027 Rules) ---
    // Premium paid personally (after-tax). Not in W-2. Not Deducted on Schedule 1.
    
    // AGI Calculation Scen 2
    const initialAGIScenario2 = 
      sCorpBox1Wages + 
      spouseBox1Wages + 
      otherIncome - 
      sCorpHsaDeduction - 
      capitalLossDeduction;

    // MAGI Calculation (ACA Specifics Form 8962)
    // MAGI = AGI + Tax-Exempt Interest + Non-Taxable Social Security + Foreign Earned Income (floored at 0)
    const baseMAGI = initialAGIScenario2 + taxExemptInterest + nonTaxableSocialSecurity;
    const finalMAGI = Math.max(0, baseMAGI);
    
    // 2027 Federal Poverty Level Calculation (HHS Guidelines for 2027 ACA coverage year)
    // $15,960 base for 1 person + $5,680 per additional household member
    const povertyLevel = FPL_2027_BASE + (FPL_2027_PER_PERSON * Math.max(0, householdSize - 1));
    const fplPercentage = povertyLevel > 0 ? (finalMAGI / povertyLevel) * 100 : 0;
    
    let hitCliff = false;
    let subsidy = estimatedSubsidy;
    let cliffGap = 0;

    if (subsidyScenario === 'strict_cliff') {
      // Standard 2027 rule: Strict 400% FPL cliff
      hitCliff = fplPercentage > 400;
      subsidy = hitCliff ? 0 : estimatedSubsidy;
      if (hitCliff) {
        const targetMagi = 4.0 * povertyLevel;
        cliffGap = Math.max(0, Math.ceil(finalMAGI - targetMagi));
      }
    } else {
      // Enhanced Subsidy Extension Scenario (IRA rules continued):
      // No 400% cliff; subsidy continues with benchmark contributions capped
      hitCliff = false;
      subsidy = estimatedSubsidy;
      cliffGap = 0;
    }

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
        cliffGap,
        povertyLevel,
        fplPercentage,
        subsidyScenario
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
        <header className="mb-8 text-center relative">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="absolute right-0 top-0 p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
            title="About 2027 rules"
          >
            <HelpCircle className="w-6 h-6" />
          </button>

          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full shadow-lg mb-3">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              2027 Open Enrollment
            </span>
            <span className="text-xs text-slate-500">
              Tax Year 2027 Guidelines
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            S-Corp Health Insurance Optimizer
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
            Compare the <span className="font-semibold text-blue-600">SEHI Deduction</span> vs. <span className="font-semibold text-purple-600">ACA Subsidy Optimization</span> under 2027 rules with 400% FPL cliff policy modeling.
          </p>
        </header>

        <AboutPanel isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: User Inputs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h2 className="text-xl font-semibold text-slate-800">Financial Inputs</h2>
                </div>
                <span className="text-xs font-medium text-slate-500">2027 Standards</span>
              </div>
              
              <div className="space-y-6">
                <PayStubInput 
                  title="S-Corp Owner Pay (2027)" 
                  data={inputs.sCorpOwner} 
                  onChange={(d) => handlePayStubChange('sCorpOwner', d)}
                  colorClass="text-blue-600"
                  isOwner={true}
                />

                <PayStubInput 
                  title="Spouse Pay (2027)" 
                  data={inputs.spouse} 
                  onChange={(d) => handlePayStubChange('spouse', d)}
                  colorClass="text-slate-600"
                />
              </div>
              
              <div className="my-6 border-t border-slate-100"></div>

              <InputGroup 
                label="Other Taxable Income" 
                tooltip="Interest, ordinary dividends, rental profits, K-1 non-wage distributions, etc."
                value={inputs.otherIncome} 
                onChange={(v) => handleInputChange('otherIncome', v)} 
              />

              <InputGroup 
                label="Tax-Exempt Interest" 
                tooltip="Municipal bonds, etc. Required statutory add-back to MAGI for ACA subsidies (Form 8962)."
                value={inputs.taxExemptInterest} 
                onChange={(v) => handleInputChange('taxExemptInterest', v)} 
              />

              <InputGroup 
                label="Non-Taxable Social Security" 
                tooltip="Non-taxable portion of SS benefits. Statutory add-back to MAGI under IRC Section 36B."
                value={inputs.nonTaxableSocialSecurity} 
                onChange={(v) => handleInputChange('nonTaxableSocialSecurity', v)} 
              />
              
              <InputGroup 
                label="Marginal Tax Rate" 
                prefix="" 
                suffix="%" 
                step={1}
                tooltip="Your marginal federal tax bracket for 2027 (e.g., 22%, 24%, 32%, 35%)."
                value={inputs.marginalTaxRate} 
                onChange={(v) => handleInputChange('marginalTaxRate', v)} 
              />

              <div className="my-6 border-t border-slate-100"></div>

              {/* Health Plan Details Card */}
              <div className="bg-indigo-50/60 p-4 rounded-lg border border-indigo-100 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    2027 Health Plan Details
                  </h3>
                </div>

                {/* 2027 Presets Buttons */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>2027 Statutory HDHP Presets</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPlanPreset('individual')}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 bg-white hover:bg-indigo-100/60 text-indigo-800 transition-colors text-left"
                    >
                      <div className="font-semibold">Individual HDHP</div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">$1,750 ded · $8,700 max</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPlanPreset('family')}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 bg-white hover:bg-indigo-100/60 text-indigo-800 transition-colors text-left"
                    >
                      <div className="font-semibold">Family HDHP</div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">$3,500 ded · $17,400 max</div>
                    </button>
                  </div>
                </div>

                <InputGroup 
                  label="Annual Health Premium" 
                  tooltip="Total unsubsidized annual premium for the selected policy."
                  value={inputs.annualPremium} 
                  onChange={(v) => handleInputChange('annualPremium', v)} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup 
                    label="Plan Deductible" 
                    tooltip="2027 statutory minimum HDHP deductible is $1,750 (self-only) or $3,500 (family)."
                    value={inputs.planDeductible} 
                    onChange={(v) => handleInputChange('planDeductible', v)} 
                  />
                  <InputGroup 
                    label="OOP Max" 
                    tooltip="2027 statutory maximum out-of-pocket is $8,700 (self-only) or $17,400 (family)."
                    value={inputs.planOOPMax} 
                    onChange={(v) => handleInputChange('planOOPMax', v)} 
                  />
                </div>
                
                <InputGroup 
                  label="Coinsurance (Your Share)" 
                  tooltip="Percentage you pay after deductible until OOP Max (e.g. 20%)."
                  value={inputs.planCoinsurance} 
                  onChange={(v) => handleInputChange('planCoinsurance', v)} 
                  prefix=""
                  suffix="%"
                  step={5}
                />
              </div>

              {/* ACA Optimization Card */}
              <div className="bg-purple-50/60 p-4 rounded-lg border border-purple-100 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-purple-600" />
                    2027 ACA Optimization Inputs
                  </h3>
                </div>

                {/* 2027 Subsidy Policy Scenario Toggle */}
                <div className="mb-4 bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-purple-900 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-purple-600" />
                      2027 Subsidy Policy Rule
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                      FPL: {results.scenario2.fplPercentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 p-1 bg-purple-100/60 rounded-md">
                    <button
                      type="button"
                      onClick={() => handleInputChange('subsidyScenario', 'strict_cliff')}
                      className={`px-2 py-1.5 text-xs font-medium rounded transition-all ${
                        inputs.subsidyScenario === 'strict_cliff'
                          ? 'bg-white text-purple-900 shadow-sm font-semibold'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      Strict 400% Cliff
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('subsidyScenario', 'enhanced_extension')}
                      className={`px-2 py-1.5 text-xs font-medium rounded transition-all ${
                        inputs.subsidyScenario === 'enhanced_extension'
                          ? 'bg-white text-purple-900 shadow-sm font-semibold'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      Extended Subsidies
                    </button>
                  </div>
                  
                  <p className="text-[11px] text-slate-600 mt-2 leading-tight">
                    {inputs.subsidyScenario === 'strict_cliff'
                      ? 'Standard 2027 baseline: Taxpayers above 400% FPL receive $0 subsidy (Form 8962 strict cliff).'
                      : 'Legislative extension scenario: Subsidies remain uncapped above 400% FPL with max 8.5% income contribution.'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <InputGroup 
                    label="Household Size" 
                    tooltip="Used to determine 2027 HHS Poverty Level ($15,960 + $5,680 per additional member)."
                    value={inputs.householdSize} 
                    onChange={(v) => handleInputChange('householdSize', v)} 
                    prefix=""
                    step={1}
                  />
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                    2027 FPL Benchmark (100%): ${results.scenario2.povertyLevel.toLocaleString()} · 400% Cliff: ${(results.scenario2.povertyLevel * 4).toLocaleString()}
                  </div>
                </div>

                <InputGroup 
                  label="Capital Losses Available" 
                  tooltip="Tax-loss harvesting deduction: Max $3,000 statutory net loss against ordinary income (IRC Section 1211(b)). Reduces AGI and ACA MAGI dollar-for-dollar."
                  value={inputs.capitalLosses} 
                  onChange={(v) => handleInputChange('capitalLosses', v)} 
                />
                
                <div className="relative">
                  <InputGroup 
                    label="Estimated ACA Subsidy (PTC)" 
                    tooltip="Expected annual subsidy based on benchmark silver plan. Automatically zeroed if MAGI > 400% FPL under strict cliff."
                    value={inputs.estimatedSubsidy} 
                    onChange={(v) => handleInputChange('estimatedSubsidy', v)} 
                  />
                  
                  {results.scenario2.hitCliff && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>400% FPL Cliff Hit (${results.scenario2.fplPercentage.toFixed(1)}% of FPL)</span>
                      </div>
                      <p className="text-[11px] text-red-600">
                        Household MAGI (<span className="font-mono tabular-nums font-semibold">${results.scenario2.magi.toLocaleString()}</span>) exceeds the 400% FPL limit (<span className="font-mono tabular-nums font-semibold">${(results.scenario2.povertyLevel * 4).toLocaleString()}</span>) by <span className="font-mono tabular-nums font-bold">${results.scenario2.cliffGap.toLocaleString()}</span>. Under 2027 standard rules, the entire ${inputs.estimatedSubsidy.toLocaleString()} subsidy is clawed back to $0.
                      </p>
                      <div className="pt-1 text-[11px] text-red-800 font-medium">
                        💡 Tip: Reduce MAGI by at least <span className="font-mono tabular-nums font-bold">${results.scenario2.cliffGap.toLocaleString()}</span> via 401(k) contributions, HSA contributions, or capital loss harvesting to regain full eligibility.
                      </div>
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
              <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${
                results.winner === 'Scenario 1' 
                  ? 'bg-blue-50/70 border-blue-500 shadow-md' 
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Scenario 1: S-Corp Path</h3>
                    <p className="text-xs text-slate-500">1040 Schedule 1 SEHI Deduction</p>
                  </div>
                  {results.winner === 'Scenario 1' && (
                    <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                      WINNER
                    </span>
                  )}
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Unsubsidized Premium</span>
                    <span className="font-mono tabular-nums">${inputs.annualPremium.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>SEHI Tax Savings ({inputs.marginalTaxRate}%)</span>
                    <span className="font-mono tabular-nums">- ${results.scenario1.taxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Deductible SEHI Limit</span>
                    <span className="font-mono tabular-nums">${results.scenario1.deductibleSEHI.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Premium Cost</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      ${results.scenario1.netCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 2 Card */}
              <div className={`rounded-xl p-6 border-2 transition-all duration-300 relative overflow-hidden ${
                results.winner === 'Scenario 2' 
                  ? 'bg-purple-50/70 border-purple-500 shadow-md' 
                  : 'bg-white border-slate-200'
              }`}>
                {results.scenario2.hitCliff && (
                   <div className="absolute -right-8 top-6 bg-red-600 text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm z-10 uppercase tracking-wider">
                     CLIFF HIT
                   </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Scenario 2: ACA Path</h3>
                    <p className="text-xs text-slate-500">Premium Tax Credit (Form 8962)</p>
                  </div>
                  {results.winner === 'Scenario 2' && (
                    <span className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-sm">
                      WINNER
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Unsubsidized Premium</span>
                    <span className="font-mono tabular-nums">${inputs.annualPremium.toLocaleString()}</span>
                  </div>
                  
                  <div className={`flex justify-between font-medium ${
                    results.scenario2.hitCliff ? 'text-slate-400 line-through' : 'text-purple-600'
                  }`}>
                    <span>ACA Subsidy (PTC)</span>
                    <span className="font-mono tabular-nums">- ${inputs.estimatedSubsidy.toLocaleString()}</span>
                  </div>
                  
                  {results.scenario2.hitCliff && (
                    <div className="flex justify-between text-red-600 font-medium text-xs bg-red-50 p-1.5 rounded">
                      <span>Subsidy Clawback (&gt;400% FPL)</span>
                      <span className="font-mono tabular-nums">$0 allowed</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>2027 FPL Standing</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {results.scenario2.fplPercentage.toFixed(1)}% of FPL
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Net Premium Cost</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      ${results.scenario2.netCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Banner */}
            <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">
                    {results.winner === 'Equal' 
                      ? "Both options result in equal net premium cost" 
                      : `${results.winner} saves more on 2027 net premiums`
                    }
                  </h4>
                  <p className="text-slate-300 text-sm">
                    Estimated annual difference: <span className="text-emerald-400 font-bold font-mono tabular-nums">${results.savings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {results.scenario2.hitCliff && results.winner === 'Scenario 1' && (
                      <span className="text-amber-300 ml-1 text-xs">(Driven by 400% FPL subsidy cliff expiration)</span>
                    )}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400 hidden sm:block" />
            </div>

            {/* Chart */}
            <ComparisonChart results={results} />
            
            {/* Total Healthcare Liability Table */}
            <UsageScenarioTable results={results} />

            {/* Detailed Tax & AGI Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">2027 Tax Calculation & MAGI Line Items</h3>
                </div>
                <span className="text-xs text-slate-500">IRS Notice 2008-1 vs. Form 8962</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Line Item Description</th>
                      <th className="px-4 py-3 text-right text-blue-600">Scenario 1 (S-Corp)</th>
                      <th className="px-4 py-3 text-right text-purple-600">Scenario 2 (ACA)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">S-Corp Owner Wages (W-2 Box 1)</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">${(Math.max(0, inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k)).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">${(Math.max(0, inputs.sCorpOwner.grossPay - inputs.sCorpOwner.preTax401k)).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Spouse Wages (W-2 Box 1)</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">${(Math.max(0, inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable)).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-mono tabular-nums">${(Math.max(0, inputs.spouse.grossPay - inputs.spouse.preTax401k - inputs.spouse.hsaNonTaxable)).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Add: Premium Included in Owner W-2</td>
                      <td className="px-4 py-2 text-right text-blue-600 font-mono tabular-nums">+ ${inputs.annualPremium.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono tabular-nums">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: SEHI Deduction (Schedule 1)</td>
                      <td className="px-4 py-2 text-right text-red-500 font-mono tabular-nums">(${results.scenario1.deductibleSEHI.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono tabular-nums">$0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: Owner HSA (Form 8889 Above-Line)</td>
                      <td className="px-4 py-2 text-right text-red-500 font-mono tabular-nums">(${inputs.sCorpOwner.hsaNonTaxable.toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-red-500 font-mono tabular-nums">(${inputs.sCorpOwner.hsaNonTaxable.toLocaleString()})</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Deduct: Capital Loss (Statutory $3k Max)</td>
                      <td className="px-4 py-2 text-right text-red-500 font-mono tabular-nums">(${Math.min(inputs.capitalLosses, 3000).toLocaleString()})</td>
                      <td className="px-4 py-2 text-right text-red-500 font-mono tabular-nums">(${Math.min(inputs.capitalLosses, 3000).toLocaleString()})</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-700">Add: Tax-Exempt Interest + Non-Taxable SS</td>
                      <td className="px-4 py-2 text-right text-slate-400 font-mono tabular-nums">$0 (Excluded from AGI)</td>
                      <td className="px-4 py-2 text-right text-purple-700 font-mono tabular-nums">+ ${(inputs.taxExemptInterest + inputs.nonTaxableSocialSecurity).toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-4 py-2 text-slate-800">Final Adjusted Income Comparison</td>
                      <td className="px-4 py-2 text-right text-blue-900 font-mono tabular-nums">
                        ${results.scenario1.finalAGI.toLocaleString()} <span className="text-xs text-slate-500 font-normal">(AGI)</span>
                      </td>
                      <td className="px-4 py-2 text-right text-purple-900 font-mono tabular-nums">
                        ${results.scenario2.magi.toLocaleString()} <span className="text-xs text-slate-500 font-normal">(MAGI)</span>
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="px-4 py-3 text-slate-900">2027 Net Annual Premium Cost</td>
                      <td className="px-4 py-3 text-right text-blue-900 font-mono tabular-nums text-base">
                        ${results.scenario1.netCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-900 font-mono tabular-nums text-base">
                        ${results.scenario2.netCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
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
