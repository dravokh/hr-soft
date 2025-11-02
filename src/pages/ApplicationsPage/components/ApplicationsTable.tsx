import React from 'react';
import { ApplicationBundle, ApplicationType, User } from '../../../types';
import { COPY } from '../constants';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../utils';

interface ApplicationsTableProps {
  language: 'ka' | 'en';
  applications: ApplicationBundle[];
  typeById: Map<number, ApplicationType>;
  userById: Map<number, User>;
  onViewDetails: (bundle: ApplicationBundle) => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  language,
  applications,
  typeById,
  userById,
  onViewDetails
}) => {
  const t = COPY[language];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.table.number}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.table.type}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.table.requester}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.table.status}
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t.table.updated}
            </th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {applications.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                {t.table.empty}
              </td>
            </tr>
          )}
          {applications.map((bundle) => {
            const type = typeById.get(bundle.application.typeId);
            const requester = userById.get(bundle.application.requesterId);
            return (
              <tr key={bundle.application.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{bundle.application.number}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-700">{type?.name[language]}</p>
                    <p className="text-xs text-slate-500">{type?.description[language]}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{requester?.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={bundle.application.status} language={language} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(bundle.application.updatedAt, language)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
                    onClick={() => onViewDetails(bundle)}
                  >
                    {t.table.action}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
