import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ScenarioResult } from '../types';

interface ComparisonChartProps {
  results: ScenarioResult;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ results }) => {
  const data = [
    {
      name: 'Scenario 1 (S-Corp)',
      netCost: results.scenario1.netCost,
      taxSavings: results.scenario1.taxSavings,
      subsidy: 0,
    },
    {
      name: 'Scenario 2 (ACA)',
      netCost: results.scenario2.netCost,
      taxSavings: 0,
      subsidy: results.scenario2.subsidy,
    },
  ];

  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Net Premium Cost Comparison</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `$${value}`} />
          <Tooltip 
            formatter={(value: number) => `$${value.toLocaleString()}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="netCost" name="Net Premium Cost" stackId="a" fill="#3b82f6">
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.netCost === Math.min(results.scenario1.netCost, results.scenario2.netCost) ? '#22c55e' : '#3b82f6'} />
              ))}
          </Bar>
          <Bar dataKey="taxSavings" name="Tax Savings (Deduction)" stackId="a" fill="#94a3b8" />
          <Bar dataKey="subsidy" name="ACA Subsidy" stackId="a" fill="#c084fc" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-slate-500 mt-2">
        *Green bar indicates the lower net premium cost option.
      </p>
    </div>
  );
};