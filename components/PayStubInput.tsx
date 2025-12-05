import React from 'react';
import { PayStubData } from '../types';
import { HelpCircle, DollarSign } from 'lucide-react';

interface PayStubInputProps {
  title: string;
  data: PayStubData;
  onChange: (data: PayStubData) => void;
  colorClass?: string;
}

export const PayStubInput: React.FC<PayStubInputProps> = ({ 
  title, 
  data, 
  onChange,
  colorClass = "text-slate-800"
}) => {
  const handleChange = (field: keyof PayStubData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const netPay = data.grossPay - (
    data.fedWithholding + 
    data.socialSecurity + 
    data.medicare + 
    data.stateWithholding + 
    data.preTax401k + 
    data.hsaNonTaxable
  );

  const InputField = ({ 
    label, 
    field, 
    tooltip 
  }: { 
    label: string, 
    field: keyof PayStubData, 
    tooltip?: string 
  }) => (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
          {label}
          {tooltip && (
            <div className="group relative">
              <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-32 p-1.5 bg-slate-800 text-white text-[10px] rounded shadow-lg z-10">
                {tooltip}
              </div>
            </div>
          )}
        </label>
      </div>
      <div className="relative rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
          <span className="text-slate-400 text-xs">$</span>
        </div>
        <input
          type="number"
          min="0"
          value={data[field] || ''}
          onChange={(e) => handleChange(field, parseFloat(e.target.value) || 0)}
          className="block w-full rounded border-slate-300 py-1 pl-5 pr-2 text-slate-900 text-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
          placeholder="0"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-white rounded border border-slate-200 shadow-sm">
          <DollarSign className={`w-4 h-4 ${colorClass}`} />
        </div>
        <h3 className={`font-semibold ${colorClass}`}>{title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="col-span-2">
          <InputField label="Gross Pay" field="grossPay" tooltip="Annual base salary excluding employer-paid benefits" />
        </div>
        
        <InputField label="Fed W/H" field="fedWithholding" />
        <InputField label="State W/H" field="stateWithholding" />
        <InputField label="Soc Sec" field="socialSecurity" />
        <InputField label="Medicare" field="medicare" />
        
        <div className="col-span-2 pt-2 border-t border-slate-200 mt-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Pre-Tax Deductions (MAGI Impact)</p>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="401(k)" field="preTax401k" tooltip="Traditional Pre-tax 401k contributions" />
            <InputField label="HSA (Non-Taxable)" field="hsaNonTaxable" tooltip="Payroll deducted HSA contributions" />
          </div>
        </div>

        <div className="col-span-2 mt-2 bg-white rounded p-2 border border-slate-200 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500">Est. Net Pay</span>
          <span className="text-sm font-bold text-slate-800">${netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>
    </div>
  );
};