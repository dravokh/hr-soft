import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { ApplicationTypesCopy } from '../copy';

interface NoPermissionCalloutProps {
  copy: ApplicationTypesCopy;
}

export const NoPermissionCallout: React.FC<NoPermissionCalloutProps> = ({ copy }) => {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 h-5 w-5" />
        <div>
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className="mt-1 text-sm">{copy.noPermission}</p>
        </div>
      </div>
    </div>
  );
};
