import React from 'react';
import { PencilLine } from 'lucide-react';
import type { ApplicationType } from '../../../types';
import type { Mode } from '../types';
import type { ApplicationTypesCopy } from '../copy';

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
        const active = selectedId === type.id && mode !== 'create';
        const capabilityBadges: string[] = [];
        if (type.capabilities.requiresDateRange) {
          capabilityBadges.push(copy.toggles.requiresDateRange);
        }
        if (type.capabilities.requiresTimeRange) {
          capabilityBadges.push(copy.toggles.requiresTimeRange);
        }
        if (type.capabilities.hasCommentField) {
          capabilityBadges.push(copy.toggles.hasCommentField);
        }
        if (type.capabilities.allowsAttachments) {
          capabilityBadges.push(copy.toggles.allowsAttachments);
        }
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
            <div className="flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-700">{type.name.ka}</h3>
                <PencilLine className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">{type.description.ka}</p>
              {capabilityBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {capabilityBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
