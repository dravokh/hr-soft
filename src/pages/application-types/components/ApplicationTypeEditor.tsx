import React from 'react';
import { ChevronDown, Clock3, PlusCircle, Save, ShieldCheck, PencilLine, Trash2 } from 'lucide-react';
import type { Role } from '../../../types';
import type {
  ApplicationType,
  ApplicationTypeCapabilities,
  FormState,
  Mode,
  SlaFormEntry
} from '../types';
import type { ApplicationTypesCopy } from '../copy';
import { coerceUsageCapabilities } from '../helpers';

interface ApplicationTypeEditorProps {
  language: 'ka' | 'en';
  copy: ApplicationTypesCopy;
  formState: FormState;
  onFormChange: React.Dispatch<React.SetStateAction<FormState>>;
  mode: Mode;
  selectedType: ApplicationType | null;
  roles: Role[];
  selectedRoles: Role[];
  allowedRolesOpen: boolean;
  allowedRolesDropdownRef: React.MutableRefObject<HTMLDivElement | null>;
  onToggleAllowedRoles: () => void;
  onClearAllowedRoles: () => void;
  onFlowRoleChange: (index: number, roleId: number) => void;
  onAddFlowStep: () => void;
  onRemoveFlowStep: (index: number) => void;
  onSlaChange: (index: number, updates: Partial<SlaFormEntry>) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  isSaving: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
}

export const ApplicationTypeEditor: React.FC<ApplicationTypeEditorProps> = ({
  language,
  copy,
  formState,
  onFormChange,
  mode,
  selectedType,
  roles,
  selectedRoles,
  allowedRolesOpen,
  allowedRolesDropdownRef,
  onToggleAllowedRoles,
  onClearAllowedRoles,
  onFlowRoleChange,
  onAddFlowStep,
  onRemoveFlowStep,
  onSlaChange,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
  isSaving,
  errorMessage,
  statusMessage
}) => {
  const capabilityRows: Array<{
    key: 'requiresDateRange' | 'requiresTimeRange' | 'hasCommentField' | 'allowsAttachments';
    requiredKey: 'dateRangeRequired' | 'timeRangeRequired' | 'commentRequired' | 'attachmentsRequired';
  }> = [
    { key: 'requiresDateRange', requiredKey: 'dateRangeRequired' },
    { key: 'requiresTimeRange', requiredKey: 'timeRangeRequired' },
    { key: 'hasCommentField', requiredKey: 'commentRequired' },
    { key: 'allowsAttachments', requiredKey: 'attachmentsRequired' }
  ];

  const updateCapabilities = (
    updater: (current: ApplicationTypeCapabilities) => ApplicationTypeCapabilities
  ) => {
    onFormChange((prev) => ({
      ...prev,
      capabilities: coerceUsageCapabilities(updater(prev.capabilities))
    }));
  };

  const lockDateRange =
    formState.capabilities.usesVacationCalculator || formState.capabilities.usesExtraBonusTracker;
  const lockTimeRange =
    formState.capabilities.usesGracePeriodTracker ||
    formState.capabilities.usesPenaltyTracker ||
    formState.capabilities.usesExtraBonusTracker;

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-400">
          {mode === 'create' ? copy.create : mode === 'edit' ? copy.edit : copy.view}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-800">{formState.nameKa || copy.title}</h2>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {copy.basicInformation}
          </h3>
        </div>
        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="nameKa">
              {copy.nameKa}
            </label>
            <input
              id="nameKa"
              value={formState.nameKa}
              onChange={(event) => onFormChange((prev) => ({ ...prev, nameKa: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="descriptionKa">
              {copy.descriptionKa}
            </label>
            <textarea
              id="descriptionKa"
              rows={4}
              value={formState.descriptionKa}
              onChange={(event) => onFormChange((prev) => ({ ...prev, descriptionKa: event.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{copy.usage.title}</p>
            <p className="text-xs text-slate-500">{copy.usage.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.capabilities.usesVacationCalculator}
                onChange={(event) =>
                  updateCapabilities((current) => ({ ...current, usesVacationCalculator: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {copy.usage.vacation}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.capabilities.usesGracePeriodTracker}
                onChange={(event) =>
                  updateCapabilities((current) => ({ ...current, usesGracePeriodTracker: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {copy.usage.grace}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.capabilities.usesPenaltyTracker}
                onChange={(event) =>
                  updateCapabilities((current) => ({ ...current, usesPenaltyTracker: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {copy.usage.penalty}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={formState.capabilities.usesExtraBonusTracker}
                onChange={(event) =>
                  updateCapabilities((current) => ({ ...current, usesExtraBonusTracker: event.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {copy.usage.extra}
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.fieldSettings}</h3>
        <div className="space-y-3">
          {capabilityRows.map((config) => {
            const enabled = formState.capabilities[config.key];
            const required = formState.capabilities[config.requiredKey];
            const lockKey =
              (config.key === 'requiresDateRange' && lockDateRange) ||
              (config.key === 'requiresTimeRange' && lockTimeRange);
            const lockRequired =
              (config.requiredKey === 'dateRangeRequired' && lockDateRange) ||
              (config.requiredKey === 'timeRangeRequired' && lockTimeRange);

            return (
              <div
                key={config.key}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={lockKey}
                    onChange={(event) =>
                      updateCapabilities((current) => ({
                        ...current,
                        [config.key]: event.target.checked,
                        [config.requiredKey]: event.target.checked
                          ? current[config.requiredKey]
                          : false
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {copy.toggles[config.key]}
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <input
                    type="checkbox"
                    checked={required}
                    disabled={!enabled || lockRequired}
                    onChange={(event) =>
                      updateCapabilities((current) => ({
                        ...current,
                        [config.requiredKey]: event.target.checked
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  {copy.requiredLabel}
                </label>
              </div>
            );
          })}
        </div>
        {formState.capabilities.allowsAttachments && (
          <p className="text-xs text-slate-500">
            {language === 'ka'
              ? `ფაილის ზომის ლიმიტი: ${formState.capabilities.attachmentMaxSizeMb}MB`
              : `File size limit: ${formState.capabilities.attachmentMaxSizeMb}MB`}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.allowedRoles}</h3>
        <div
          className="relative max-w-xl"
          ref={(node) => {
            allowedRolesDropdownRef.current = node;
          }}
        >
          <button
            type="button"
            onClick={onToggleAllowedRoles}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <span>{selectedRoles.length ? selectedRoles.map((role) => role.name).join(', ') : copy.selectRole}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {allowedRolesOpen && (
            <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="max-h-60 overflow-y-auto p-2">
                {roles.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-500">
                    {language === 'ka' ? 'როლები ჯერ არ არის შექმნილი.' : 'No roles available.'}
                  </p>
                )}
                {roles.map((role) => {
                  const checked = formState.allowedRoleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) =>
                          onFormChange((prev) => ({
                            ...prev,
                            allowedRoleIds: event.target.checked
                              ? [...prev.allowedRoleIds, role.id]
                              : prev.allowedRoleIds.filter((id) => id !== role.id)
                          }))
                        }
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        <span className="font-semibold text-slate-700">{role.name}</span>
                        <span className="block text-xs text-slate-400">{role.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
                <span>
                  {selectedRoles.length
                    ? language === 'ka'
                      ? `${selectedRoles.length} როლი შერჩეულია`
                      : `${selectedRoles.length} roles selected`
                    : copy.selectRole}
                </span>
                {selectedRoles.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllowedRoles}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                  >
                    {language === 'ka' ? 'გასუფთავება' : 'Clear'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"
              >
                <ShieldCheck className="h-3 w-3" />
                {role.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">{copy.selectRole}</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.flowTitle}</h3>
          <button
            type="button"
            onClick={onAddFlowStep}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            {copy.addStep}
          </button>
        </div>
        <div className="space-y-3">
          {formState.flow.map((roleId, index) => (
            <div key={`${roleId}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <select
                value={roleId}
                onChange={(event) => onFlowRoleChange(index, Number(event.target.value))}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemoveFlowStep(index)}
                className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{copy.slaTitle}</h3>
        <div className="space-y-3">
          {formState.sla.map((entry) => (
            <div key={entry.stepIndex} className="grid gap-3 md:grid-cols-[auto_1fr_1fr]">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Clock3 className="h-4 w-4 text-blue-500" />
                <span>{entry.stepIndex + 1}</span>
              </div>
              <input
                type="number"
                min={1}
                value={entry.hours}
                onChange={(event) => onSlaChange(entry.stepIndex, { hours: Number(event.target.value) })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={copy.hours}
              />
              <select
                value={entry.onExpire}
                onChange={(event) => onSlaChange(entry.stepIndex, { onExpire: event.target.value as SlaFormEntry['onExpire'] })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(copy.expireActions) as Array<SlaFormEntry['onExpire']>).map((option) => (
                  <option key={option} value={option}>
                    {copy.expireActions[option]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {errorMessage && <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">{errorMessage}</p>}
      {statusMessage && <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{statusMessage}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          disabled={isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? copy.actions.saving : copy.actions.save}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {copy.actions.cancel}
        </button>
        {mode !== 'create' && selectedType && (
          <>
            <button
              type="button"
              onClick={onStartEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <PencilLine className="h-4 w-4" />
              {copy.edit}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              {copy.actions.delete}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

