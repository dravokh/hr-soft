import React, { FormEvent } from 'react';
import { CalendarDays, Search, X } from 'lucide-react';
import { ApplicationStatus } from '../../../types';
import { ApplicationFilters } from '../types';
import { COPY, FILTERABLE_STATUSES, STATUS_META } from '../constants';

interface ApplicationFiltersComponentProps {
  language: 'ka' | 'en';
  filterDraft: ApplicationFilters;
  onFilterDraftChange: (filters: ApplicationFilters) => void;
  creatorOptions: { id: number; name: string }[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  onLastThirtyDays: () => void;
}

export const ApplicationFiltersComponent: React.FC<ApplicationFiltersComponentProps> = ({
  language,
  filterDraft,
  onFilterDraftChange,
  creatorOptions,
  onSubmit,
  onClear,
  onLastThirtyDays
}) => {
  const t = COPY[language];

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <p className="text-sm font-semibold text-slate-600">{t.filters.heading}</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="applications-creator">
            {t.filters.creatorLabel}
          </label>
          <div className="mt-2">
            <select
              id="applications-creator"
              value={filterDraft.creatorId === 'all' ? 'all' : String(filterDraft.creatorId)}
              onChange={(event) =>
                onFilterDraftChange({
                  ...filterDraft,
                  creatorId: event.target.value === 'all' ? 'all' : Number(event.target.value)
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="all">{t.filters.creatorPlaceholder}</option>
              {creatorOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="applications-status">
            {t.filters.statusLabel}
          </label>
          <div className="mt-2">
            <select
              id="applications-status"
              value={filterDraft.status}
              onChange={(event) =>
                onFilterDraftChange({
                  ...filterDraft,
                  status: event.target.value === 'all' ? 'all' : (event.target.value as ApplicationStatus)
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="all">{t.filters.statusPlaceholder}</option>
              {FILTERABLE_STATUSES.map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {STATUS_META[statusKey].label[language]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="applications-start-date">
            {t.filters.startDateLabel}
          </label>
          <input
            id="applications-start-date"
            type="date"
            value={filterDraft.startDate}
            onChange={(event) => onFilterDraftChange({ ...filterDraft, startDate: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500" htmlFor="applications-end-date">
            {t.filters.endDateLabel}
          </label>
          <input
            id="applications-end-date"
            type="date"
            value={filterDraft.endDate}
            onChange={(event) => onFilterDraftChange({ ...filterDraft, endDate: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLastThirtyDays}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 text-sky-500" />
            {t.filters.lastThirtyDays}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50"
          >
            <X className="h-4 w-4" />
            {t.filters.clear}
          </button>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <Search className="h-4 w-4" />
          {t.filters.apply}
        </button>
      </div>
    </form>
  );
};
