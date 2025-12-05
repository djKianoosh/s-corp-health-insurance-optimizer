import React from 'react';
import { Activity, Stethoscope, Ambulance, ShieldCheck } from 'lucide-react';
import { ScenarioResult } from '../types';

interface UsageScenarioTableProps {
  results: ScenarioResult;
}

export const UsageScenarioTable: React.FC<UsageScenarioTableProps> = ({ results }) => {
  const { low, medium, high } = results.usageScenarios;

  const Row = ({ 
    icon: Icon, 
    title, 
    desc, 
    data 
  }: { 
    icon: any, 
    title: string, 
    desc: string, 
    data: typeof low 
  }) => (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{title}</div>
            <div className="text-xs text-slate-500">{desc}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="text-xs text-slate-400 mb-1">Total est. annual cost</div>
        <div className="text-sm font-bold text-blue-900">${data.totalCostScen1.toLocaleString()}</div>
        <div className="text-[10px] text-slate-500">
          (${results.scenario1.netCost.toLocaleString()} Premium + ${data.oopCost.toLocaleString()} OOP)
        </div>
      </td>
      <td className="px-6 py-4 text-right bg-slate-50/50">
        <div className="text-xs text-slate-400 mb-1">Total est. annual cost</div>
        <div className="text-sm font-bold text-purple-900">${data.totalCostScen2.toLocaleString()}</div>
        <div className="text-[10px] text-slate-500">
          (${results.scenario2.netCost.toLocaleString()} Premium + ${data.oopCost.toLocaleString()} OOP)
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-slate-500" />
        <div>
          <h3 className="font-semibold text-slate-800">Total Estimated Healthcare Liability</h3>
          <p className="text-xs text-slate-500">Combined Net Premium + Estimated Out-of-Pocket Medical Costs</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Usage Scenario
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-600 uppercase tracking-wider">
                Scenario 1 (S-Corp)
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-purple-600 uppercase tracking-wider">
                Scenario 2 (ACA)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            <Row 
              icon={Activity} 
              title="Low Usage" 
              desc="Routine checkups, minimal Rx (Est. $1k billed)" 
              data={low} 
            />
            <Row 
              icon={Stethoscope} 
              title="Medium Usage" 
              desc="Minor surgery or chronic mgmt (Est. $10k billed)" 
              data={medium} 
            />
            <Row 
              icon={Ambulance} 
              title="High Usage" 
              desc="Major event / Childbirth (Hits OOP Max)" 
              data={high} 
            />
          </tbody>
        </table>
      </div>
    </div>
  );
};