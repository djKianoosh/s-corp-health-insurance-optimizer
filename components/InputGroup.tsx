import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  step?: number;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  value,
  onChange,
  prefix = '$',
  suffix,
  tooltip,
  step = 100
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-1">
        <label className="block text-sm font-medium text-slate-700 mr-2">
          {label}
        </label>
        {tooltip && (
          <div className="group relative">
            <HelpCircle className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative rounded-md shadow-sm">
        {prefix && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type="number"
          step={step}
          min="0"
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`block w-full rounded-md border-slate-300 py-2 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'} text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6`}
          placeholder="0"
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-slate-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};