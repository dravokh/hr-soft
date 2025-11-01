import React from 'react';
import { PencilLine } from 'lucide-react';
import type { ApplicationType } from '../../../types';
import type { Mode } from '../types';
import type { ApplicationTypesCopy } from '../copy';
import { getIconComponent } from '../helpers';

interface ApplicationTypeListProps {
  items: ApplicationType[];
  selectedId: number | null;
  mode: Mode;
  onSelect: (id: number) => void;
  copy: ApplicationTypesCopy;
}

export const ApplicationTypeList: React.FC<ApplicationTypeListProps> = ({
  items,
  selectedId,
  mode,
  onSelect,
  copy
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
        {copy.empty}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((type) => {
        const Icon = getIconComponent(type.icon);
        const active = selectedId === type.id && mode !== 'create';
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`w-full rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              active
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${type.color}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{type.name.ka}</h3>
                  <PencilLine className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{type.name.en}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{type.description.ka}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
