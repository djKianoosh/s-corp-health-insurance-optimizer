import React from 'react';
import { X, ExternalLink, BookOpen, Scale, FileText, Github } from 'lucide-react';

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutPanel: React.FC<AboutPanelProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">About This Tool</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Purpose */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-blue-600">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Goal</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              For S-Corp owners (2% shareholders), health insurance offers two distinct tax optimization paths. This tool models the net after-tax cost of both to help you decide which is more beneficial for your specific financial situation.
            </p>
          </section>

          {/* Section 2: Scenarios */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-3 text-slate-800">
              <Scale className="w-5 h-5" />
              <h3 className="font-semibold text-lg">The Two Scenarios</h3>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm mb-2">Scenario 1: S-Corp Deduction (SEHI)</h4>
              <p className="text-xs text-blue-800 mb-2">
                The S-Corp pays the premium (or reimburses you). It is reported as wages on your W-2 (Box 1) but is exempt from FICA taxes. You then take a "Self-Employed Health Insurance" (SEHI) deduction on your Form 1040.
              </p>
              <div className="text-[10px] font-medium text-blue-600 uppercase tracking-wide">Benefit</div>
              <p className="text-xs text-slate-600">Effectively pays premiums with income-tax-free dollars.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-bold text-purple-900 text-sm mb-2">Scenario 2: ACA Subsidies (PTC)</h4>
              <p className="text-xs text-purple-800 mb-2">
                You pay the premium personally using after-tax dollars. You do NOT take the SEHI deduction. Instead, you qualify for the Premium Tax Credit (PTC) based on your household Modified Adjusted Gross Income (MAGI).
              </p>
              <div className="text-[10px] font-medium text-purple-600 uppercase tracking-wide">Benefit</div>
              <p className="text-xs text-slate-600">Subsidies can cap premiums at a % of income, potentially reducing cost to near zero.</p>
            </div>
          </section>

          {/* Section 3: Official Sources */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-slate-800">
              <FileText className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Official Sources</h3>
            </div>
            <ul className="space-y-3">
              <li>
                <a href="https://www.irs.gov/businesses/small-businesses-self-employed/s-corporation-compensation-and-medical-insurance-issues" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 hover:bg-slate-50 p-2 rounded transition-colors">
                  <ExternalLink className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">IRS: S-Corp Compensation</div>
                    <div className="text-xs text-slate-500">Rules for 2% Shareholder Medical Insurance</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="https://www.healthcare.gov/glossary/modified-adjusted-gross-income-magi/" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 hover:bg-slate-50 p-2 rounded transition-colors">
                  <ExternalLink className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">Healthcare.gov: MAGI</div>
                    <div className="text-xs text-slate-500">How income is calculated for subsidies</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="https://www.irs.gov/instructions/i8962" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 hover:bg-slate-50 p-2 rounded transition-colors">
                  <ExternalLink className="w-4 h-4 text-slate-400 mt-0.5 group-hover:text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600">IRS Form 8962 Instructions</div>
                    <div className="text-xs text-slate-500">Premium Tax Credit details</div>
                  </div>
                </a>
              </li>
            </ul>
          </section>

          {/* Section 4: Open Source */}
          <section>
             <div className="flex items-center gap-2 mb-3 text-slate-800">
              <Github className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Open Source</h3>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              This project is open source. If you have feedback, feature requests, or found a bug, please submit an issue on GitHub.
            </p>
            <a 
              href="https://github.com/djKianoosh/s-corp-health-insurance-optimizer" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-center">
          <p>Version 1.2 • Updated for 2026 Projections</p>
        </div>
      </div>
    </>
  );
};