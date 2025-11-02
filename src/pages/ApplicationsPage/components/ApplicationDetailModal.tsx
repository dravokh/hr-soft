import React, { useRef } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle2,
  Clock3,
  Paperclip,
  PlusCircle,
  Printer,
  Send,
  ShieldHalf,
  X
} from 'lucide-react';
import {
  ApplicationBundle,
  ApplicationFieldDefinition,
  ApplicationFieldValue,
  ApplicationType,
  Role,
  User
} from '../../../types';
import {
  BUILT_IN_FIELD_KEYS,
  COPY,
  PRINT_COPY,
  STATUS_META
} from '../constants';
import {
  classNames,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRemainingTime,
  getFieldValue,
  readFileAsDataUrl,
  splitRange
} from '../utils';
import { AttachmentDraft } from '../types';

interface ApplicationDetailModalProps {
  selected: ApplicationBundle;
  language: 'ka' | 'en';
  typeById: Map<number, ApplicationType>;
  userById: Map<number, User>;
  roleById: Map<number, Role>;
  canApproveSelected: boolean;
  canEditSelected: boolean;
  isEditing: boolean;
  editValues: Record<string, string>;
  editAttachments: AttachmentDraft[];
  editComment: string;
  rejectComment: string;
  actionMessage: string | null;
  actionError: string | null;
  onClose: () => void;
  onPrint: () => void;
  onApprove: () => void;
  onReject: () => void;
  onResend: () => void;
  onCloseRequest: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  setEditValues: (values: Record<string, string>) => void;
  setEditAttachments: (attachments: AttachmentDraft[]) => void;
  setEditComment: (comment: string) => void;
  setRejectComment: (comment: string) => void;
  onEditFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  selected,
  language,
  typeById,
  userById,
  roleById,
  canApproveSelected,
  canEditSelected,
  isEditing,
  editValues,
  editAttachments,
  editComment,
  rejectComment,
  actionMessage,
  actionError,
  onClose,
  onPrint,
  onApprove,
  onReject,
  onResend,
  onCloseRequest,
  onStartEditing,
  onCancelEditing,
  setEditValues,
  setEditAttachments,
  setEditComment,
  setRejectComment,
  onEditFileUpload,
  editFileInputRef
}) => {
  const t = COPY[language];
  const type = typeById.get(selected.application.typeId);
  const statusMeta = STATUS_META[selected.application.status];

  const renderFieldInput = (
    field: ApplicationFieldDefinition,
    values: Record<string, string>,
    setValues: (updater: Record<string, string>) => void
  ) => {
    const value = values[field.key] ?? '';

    const updateValue = (next: string) => {
      setValues({ ...values, [field.key]: next });
    };

    if (field.type === 'textarea') {
      return (
        <textarea
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          rows={4}
          placeholder={field.placeholder ? field.placeholder[language] : ''}
        />
      );
    }

    if (field.type === 'date_range') {
      const range = splitRange(value);
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="date"
            required={field.required}
            value={range.start}
            onChange={(event) => updateValue(`${event.target.value}/${range.end}`)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="date"
            required={field.required}
            value={range.end}
            onChange={(event) => updateValue(`${range.start}/${event.target.value}`)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder={field.placeholder ? field.placeholder[language] : ''}
        />
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="" disabled>
            {field.placeholder ? field.placeholder[language] : '---'}
          </option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[language]}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
        required={field.required}
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        placeholder={field.placeholder ? field.placeholder[language] : ''}
      />
    );
  };

  const renderStepper = (bundle: ApplicationBundle) => {
    const type = typeById.get(bundle.application.typeId);
    if (!type) {
      return null;
    }

    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-2 border-slate-200 shadow-lg">
        <div className="absolute top-3 right-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {language === 'ka' ? 'პროცესი' : 'WORKFLOW'}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {type.flow.map((roleId, index) => {
            const role = roleById.get(roleId);
            const isCompleted = index < bundle.application.currentStepIndex;
            const isCurrent = bundle.application.status === 'PENDING' && index === bundle.application.currentStepIndex;

            return (
              <div key={`${bundle.application.id}-step-${roleId}`} className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border-2 border-slate-200 shadow-md">
                  <div
                    className={classNames(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-all duration-300',
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white scale-105'
                        : isCurrent
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-105 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isCurrent ? <Clock3 className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={classNames('font-bold text-sm', isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-500')}>
                      {role?.name ?? 'Role'}
                    </span>
                    <span className="text-xs text-slate-500">{role?.description ?? ''}</span>
                  </div>
                </div>
                {index < type.flow.length - 1 && (
                  <div className="flex items-center">
                    <ArrowLeftRight className={classNames('h-5 w-5', isCompleted ? 'text-emerald-500' : 'text-slate-300')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAttachments = (bundle: ApplicationBundle) => {
    if (!bundle.attachments.length) {
      return <p className="text-sm text-slate-500">—</p>;
    }
    return (
      <ul className="space-y-2">
        {bundle.attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Paperclip className="h-4 w-4 text-slate-400" />
              {attachment.url && attachment.url !== '#' ? (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  {attachment.name}
                </a>
              ) : (
                <span>{attachment.name}</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{formatDateTime(attachment.createdAt, language)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderAuditTrail = (bundle: ApplicationBundle) => {
    const actionColors: Record<string, { bg: string; text: string }> = {
      CREATE: { bg: 'bg-blue-100', text: 'text-blue-700' },
      SUBMIT: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
      APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      REJECT: { bg: 'bg-rose-100', text: 'text-rose-700' },
      EDIT: { bg: 'bg-amber-100', text: 'text-amber-700' },
      RESEND: { bg: 'bg-purple-100', text: 'text-purple-700' },
      CLOSE: { bg: 'bg-slate-100', text: 'text-slate-700' },
      AUTO_APPROVE: { bg: 'bg-teal-100', text: 'text-teal-700' },
      EXPIRE_BOUNCE: { bg: 'bg-orange-100', text: 'text-orange-700' }
    };

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {bundle.auditTrail
          .slice()
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .map((entry, index) => {
            const actor = entry.actorId ? userById.get(entry.actorId) : null;
            const colors = actionColors[entry.action] || { bg: 'bg-slate-100', text: 'text-slate-700' };
            const isRecent = index === 0;

            return (
              <div
                key={entry.id}
                className={classNames(
                  'group relative rounded-xl border-2 p-4 shadow-md hover:shadow-lg transition-all duration-300',
                  isRecent ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : 'border-slate-200 bg-white'
                )}
              >
                {isRecent && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg">
                    {language === 'ka' ? 'ახალი' : 'NEW'}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={classNames('px-3 py-1 rounded-lg font-bold text-xs uppercase shadow-md flex-shrink-0', colors.bg, colors.text)}>
                    {entry.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        {actor && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{actor.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        {formatDateTime(entry.at, language)}
                      </div>
                    </div>
                    {entry.comment && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{entry.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    );
  };

  const renderSummary = (bundle: ApplicationBundle) => {
    const requester = userById.get(bundle.application.requesterId);
    const type = typeById.get(bundle.application.typeId);
    const startDate = getFieldValue(bundle, 'start_date');
    const endDate = getFieldValue(bundle, 'end_date');
    const startTime = getFieldValue(bundle, 'start_time');
    const endTime = getFieldValue(bundle, 'end_time');
    const reasonValue = getFieldValue(bundle, 'reason');
    const commentValue = getFieldValue(bundle, 'additional_comment');
    const extraFields = type
      ? type.fields.filter((field) => !BUILT_IN_FIELD_KEYS.has(field.key))
      : [];
    const extraFieldEntries = extraFields.map((field) => ({
      key: field.key,
      label: field.label[language],
      value: getFieldValue(bundle, field.key) ?? ''
    }));

    const formatDateSegment = (date?: string, time?: string) => {
      if (!date) {
        return '—';
      }
      const formattedDate = formatDate(date, language);
      if (time) {
        return `${formattedDate} • ${time}`;
      }
      return formattedDate;
    };

    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="group relative rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-5 shadow-lg border-2 border-sky-100 hover:border-sky-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-sky-200/30 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-bold text-sky-600 mb-2">{t.modal.requester}</p>
            <p className="font-bold text-slate-800 text-lg mb-1">{requester?.name ?? '—'}</p>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              {requester?.email ?? '—'}
            </p>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-amber-200/30 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-2">{t.modal.created}</p>
            <p className="font-bold text-slate-800 text-base mb-2">{formatDateTime(bundle.application.createdAt, language)}</p>
            {bundle.application.dueAt && (
              <div className="text-sm text-amber-700 mt-2 bg-amber-100 rounded-lg px-3 py-1.5 inline-block">
                <div className="font-semibold">SLA: {formatDateTime(bundle.application.dueAt, language)}</div>
                <div className="text-xs font-medium">{formatRemainingTime(bundle.application.dueAt, language)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-indigo-200/30 rounded-full blur-2xl"></div>
          <div className="relative">
            <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-2">{t.modal.period}</p>
            {(startDate || endDate) ? (
              <p className="font-bold text-slate-800 text-base leading-relaxed mb-2">
                {formatDateSegment(startDate, startTime)} → {formatDateSegment(endDate, endTime)}
              </p>
            ) : (
              <p className="font-bold text-slate-500 text-base mb-2">—</p>
            )}
            {type && <p className="text-xs text-slate-600 bg-indigo-100 rounded px-2 py-1 inline-block">{type.description[language]}</p>}
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-5 shadow-lg border-2 border-rose-100 hover:border-rose-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-rose-200/30 rounded-full blur-2xl"></div>
          <div className="relative space-y-3">
            <p className="text-xs uppercase tracking-wider font-bold text-rose-600">{language === 'ka' ? 'დეტალები' : 'DETAILS'}</p>
            {reasonValue && reasonValue.trim() && (
              <div className="bg-white rounded-lg p-3 border border-rose-100">
                <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{language === 'ka' ? 'მიზანი' : 'Purpose'}</span>
                <p className="font-semibold text-slate-800 text-sm">{reasonValue}</p>
              </div>
            )}
            {extraFieldEntries.map((entry) => (
              <div key={entry.key} className="bg-white rounded-lg p-3 border border-rose-100">
                <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{entry.label}</span>
                <div className="font-semibold text-slate-800 text-sm">
                  {entry.value.trim() ? entry.value : '—'}
                </div>
              </div>
            ))}
            {commentValue?.trim() && (
              <div className="bg-white rounded-lg p-3 border border-rose-100">
                <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{t.modal.comment}</span>
                <p className="text-slate-700 text-sm">{commentValue}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!selected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-6xl rounded-3xl bg-gradient-to-br from-white to-slate-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Modern Header with Gradient */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3">
                <p className="text-white/80 text-sm font-medium tracking-wider uppercase mb-2">{type?.name[language]}</p>
                <h2 className="text-4xl font-bold text-white tracking-tight">{selected.application.number}</h2>
              </div>
              <p className="text-white/70 text-sm">
                {formatDateTime(selected.application.createdAt, language)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={classNames('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-white/95 backdrop-blur-md shadow-lg border border-white/50', statusMeta.color)}>
                {statusMeta.icon}
                {statusMeta.label[language]}
              </span>
              <button
                type="button"
                className="rounded-xl p-2.5 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/30 shadow-lg"
                onClick={onPrint}
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-xl p-2.5 bg-white/20 backdrop-blur-md text-white hover:bg-rose-500 hover:bg-opacity-90 transition-all border border-white/30 shadow-lg"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-8 py-6 bg-gradient-to-br from-slate-50 to-white">
          <div className="space-y-6">
            {/* Enhanced Stepper */}
            <div className="relative">
              {renderStepper(selected)}
            </div>

            {/* Summary Cards with Better Styling */}
            {renderSummary(selected)}

            {/* Attachments and History Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
                <div className="absolute -top-4 left-6 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg">
                  <h3 className="text-sm font-bold text-white">
                    {t.modal.attachments}
                  </h3>
                </div>
                <div className="mt-4">
                  {renderAttachments(selected)}
                </div>
              </div>
              <div className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300">
                <div className="absolute -top-4 left-6 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
                  <h3 className="text-sm font-bold text-white">
                    {t.modal.history}
                  </h3>
                </div>
                <div className="mt-4">
                  {renderAuditTrail(selected)}
                </div>
              </div>
            </div>

            {actionMessage && (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 px-5 py-4 text-emerald-700 font-medium shadow-lg">
                {actionMessage}
              </div>
            )}
            {actionError && (
              <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 px-5 py-4 text-rose-700 font-medium shadow-lg">
                {actionError}
              </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                {canApproveSelected && (
                  <>
                    <button
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                      onClick={onApprove}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t.modal.approve}
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        value={rejectComment}
                        onChange={(event) => setRejectComment(event.target.value)}
                        placeholder={t.modal.rejectPlaceholder}
                        className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        className="flex items-center gap-2 rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200"
                        onClick={onReject}
                        disabled={!rejectComment.trim()}
                      >
                        <AlertCircle className="h-4 w-4" />
                        {t.modal.reject}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {canEditSelected && (
                <div className="flex gap-3">
                  <button
                    className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
                    onClick={onStartEditing}
                  >
                    <ShieldHalf className="h-4 w-4" />
                    {t.modal.resend}
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                    onClick={onCloseRequest}
                  >
                    <X className="h-4 w-4" />
                    {t.modal.close}
                  </button>
                </div>
              )}
            </div>

            {isEditing && selected && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">{t.modal.editTitle}</h3>
                {type && (
                  <div className="space-y-4">
                    {type.fields.map((field) => (
                      <div key={`edit-${field.key}`} className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{field.label[language]}</label>
                        {renderFieldInput(field, editValues, (next) => setEditValues(next))}
                      </div>
                    ))}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">{t.createModal.commentLabel}</label>
                      <textarea
                        value={editComment}
                        onChange={(event) => setEditComment(event.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        rows={3}
                      />
                    </div>
                    {type.capabilities.allowsAttachments && (
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                        {editAttachments.map((attachment, index) => (
                          <div
                            key={`edit-attachment-${index}`}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <input
                                type="text"
                                value={attachment.name}
                                placeholder="document.pdf"
                                onChange={(event) => {
                                  const next = [...editAttachments];
                                  next[index] = { ...next[index], name: event.target.value };
                                  setEditAttachments(next);
                                }}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                              {attachment.fromUpload ? (
                                <span className="text-xs font-medium text-slate-500">
                                  {formatFileSize(attachment.sizeBytes ?? 0, language)}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={attachment.url}
                                  placeholder="https://…"
                                  onChange={(event) => {
                                    const next = [...editAttachments];
                                    next[index] = { ...next[index], url: event.target.value };
                                    setEditAttachments(next);
                                  }}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => setEditAttachments(editAttachments.filter((_, idx) => idx !== index))}
                                className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={onEditFileUpload}
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            <Paperclip className="h-4 w-4" />
                            {t.createModal.uploadFromComputer}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditAttachments([...editAttachments, { name: '', url: '' }])}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            <PlusCircle className="h-4 w-4" />
                            {t.createModal.addLink}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">{t.createModal.attachmentHelp}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
                        onClick={onResend}
                      >
                        <Send className="h-4 w-4" />
                        {t.modal.update}
                      </button>
                      <button
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                        onClick={onCancelEditing}
                      >
                        {t.modal.cancelEdit}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
