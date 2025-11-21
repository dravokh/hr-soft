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
import { formatMinutes } from '../../../utils/usage';

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

const formatCurrency = (value: number, language: 'ka' | 'en'): string => {
  const formatter = new Intl.NumberFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    style: 'currency',
    currency: 'GEL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(Number.isFinite(value) ? value : 0);
};

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
  const [isPrintMode, setIsPrintMode] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const t = COPY[language];
  const printT = PRINT_COPY[language];
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
      <div className="relative rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
        <div className="absolute top-3 right-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'ka' ? 'პროცესი' : 'WORKFLOW'}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {type.flow.map((roleId, index) => {
            const role = roleById.get(roleId);
            const isCompleted = index < bundle.application.currentStepIndex;
            const isCurrent = bundle.application.status === 'PENDING' && index === bundle.application.currentStepIndex;

            return (
              <div key={`${bundle.application.id}-step-${roleId}`} className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                  <div
                    className={classNames(
                      'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold',
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isCurrent ? <Clock3 className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={classNames('font-semibold text-sm', isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-500')}>
                      {role?.name ?? 'Role'}
                    </span>
                    <span className="text-xs text-slate-500">{role?.description ?? ''}</span>
                  </div>
                </div>
                {index < type.flow.length - 1 && (
                  <div className="flex items-center">
                    <ArrowLeftRight className={classNames('h-5 w-5', isCompleted ? 'text-emerald-600' : 'text-slate-300')} />
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
      SUBMIT: { bg: 'bg-slate-100', text: 'text-slate-700' },
      APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      REJECT: { bg: 'bg-rose-100', text: 'text-rose-700' },
      EDIT: { bg: 'bg-amber-100', text: 'text-amber-700' },
      RESEND: { bg: 'bg-slate-100', text: 'text-slate-700' },
      CLOSE: { bg: 'bg-slate-100', text: 'text-slate-600' },
      AUTO_APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
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
                  'rounded-lg border p-4 shadow-sm',
                  isRecent ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'
                )}
              >
                {isRecent && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-slate-700 rounded text-white text-xs font-semibold">
                    {language === 'ka' ? 'ახალი' : 'NEW'}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={classNames('px-3 py-1 rounded font-semibold text-xs uppercase flex-shrink-0', colors.bg, colors.text)}>
                    {entry.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        {actor && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-800">{actor.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(entry.at, language)}
                      </div>
                    </div>
                    {entry.comment && (
                      <div className="mt-2 p-3 rounded bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-700">{entry.comment}</p>
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

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const renderPrintView = (bundle: ApplicationBundle) => {
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

    const formatDateSegment = (date?: string, time?: string) => {
      if (!date) return '—';
      const formattedDate = formatDate(date, language);
      return time ? `${formattedDate} • ${time}` : formattedDate;
    };

    return (
      <div ref={printRef} className="print:block hidden">
        <div className="max-w-4xl mx-auto p-8 bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-300 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{printT.summaryTitle}</h1>
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold text-slate-700">{bundle.application.number}</p>
              <p className="text-sm text-slate-600">{formatDateTime(bundle.application.createdAt, language)}</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{printT.requester}</p>
              <p className="text-sm font-medium text-slate-900">{requester?.name ?? '—'}</p>
              <p className="text-xs text-slate-600">{requester?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{printT.status}</p>
              <p className="text-sm font-medium text-slate-900">{statusMeta.label[language]}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{t.modal.period}</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDateSegment(startDate, startTime)} → {formatDateSegment(endDate, endTime)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{language === 'ka' ? 'ტიპი' : 'Type'}</p>
              <p className="text-sm font-medium text-slate-900">{type?.description[language] ?? '—'}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="mb-6">
            <h2 className="text-sm uppercase font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">{printT.fields}</h2>
            <div className="space-y-3">
              {reasonValue && reasonValue.trim() && (
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{language === 'ka' ? 'მიზანი' : 'Purpose'}</p>
                  <p className="text-sm text-slate-900">{reasonValue}</p>
                </div>
              )}
              {extraFields.map((field) => {
                const value = getFieldValue(bundle, field.key);
                return (
                  <div key={field.key}>
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{field.label[language]}</p>
                    <p className="text-sm text-slate-900">{value && value.trim() ? value : '—'}</p>
                  </div>
                );
              })}
              {commentValue?.trim() && (
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">{t.modal.comment}</p>
                  <p className="text-sm text-slate-900">{commentValue}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          {bundle.attachments.length > 0 && (
            <div>
              <h2 className="text-sm uppercase font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">{printT.attachments}</h2>
              <ul className="space-y-1">
                {bundle.attachments.map((attachment) => (
                  <li key={attachment.id} className="text-sm text-slate-700">
                    • {attachment.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">{t.modal.requester}</p>
          <p className="font-semibold text-slate-900 text-base mb-1">{requester?.name ?? '—'}</p>
          <p className="text-sm text-slate-600">{requester?.email ?? '—'}</p>
        </div>

        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">{t.modal.created}</p>
          <p className="font-semibold text-slate-900 text-base mb-2">{formatDateTime(bundle.application.createdAt, language)}</p>
          {bundle.application.dueAt && (
            <div className="text-sm text-slate-700 mt-2 bg-slate-100 rounded px-3 py-1.5 inline-block">
              <div className="font-medium">SLA: {formatDateTime(bundle.application.dueAt, language)}</div>
              <div className="text-xs">{formatRemainingTime(bundle.application.dueAt, language)}</div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">{t.modal.period}</p>
          {(startDate || endDate) ? (
            <p className="font-semibold text-slate-900 text-base leading-relaxed mb-2">
              {formatDateSegment(startDate, startTime)} → {formatDateSegment(endDate, endTime)}
            </p>
          ) : (
            <p className="font-semibold text-slate-500 text-base mb-2">—</p>
          )}
          {type && <p className="text-xs text-slate-600 bg-slate-100 rounded px-2 py-1 inline-block">{type.description[language]}</p>}
        </div>

        {bundle.extraBonus && (
          <div className="rounded-lg bg-emerald-50 p-5 border border-emerald-200 shadow-sm">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700 mb-2">
              {t.createModal.extraTitle}
            </p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(bundle.extraBonus.totalAmount, language)}
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              {formatDate(bundle.extraBonus.workDate, language)}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t.createModal.extraHours}
                </p>
                <p className="font-semibold text-slate-900">
                  {formatMinutes(bundle.extraBonus.minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  {t.createModal.extraRate}
                </p>
                <p className="font-semibold text-slate-900">
                  {formatCurrency(bundle.extraBonus.hourlyRate, language)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t.createModal.extraMultiplier.replace('{percent}', `{bundle.extraBonus.bonusPercent}%`)}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-white p-5 border border-slate-200 shadow-sm">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">{language === 'ka' ? 'დეტალები' : 'DETAILS'}</p>
            {reasonValue && reasonValue.trim() && (
              <div className="bg-slate-50 rounded p-3 border border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-600 font-medium block mb-1">{language === 'ka' ? 'მიზანი' : 'Purpose'}</span>
                <p className="font-medium text-slate-900 text-sm">{reasonValue}</p>
              </div>
            )}
            {extraFieldEntries.map((entry) => (
              <div key={entry.key} className="bg-slate-50 rounded p-3 border border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-600 font-medium block mb-1">{entry.label}</span>
                <div className="font-medium text-slate-900 text-sm">
                  {entry.value.trim() ? entry.value : '—'}
                </div>
              </div>
            ))}
            {commentValue?.trim() && (
              <div className="bg-slate-50 rounded p-3 border border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-600 font-medium block mb-1">{t.modal.comment}</span>
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
    <>
      {renderPrintView(selected)}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 print:hidden">
        <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Professional Header */}
        <div className="relative bg-slate-700 px-8 py-6">
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-3">
                <p className="text-slate-300 text-sm font-medium uppercase mb-2">{type?.name[language]}</p>
                <h2 className="text-3xl font-bold text-white">{selected.application.number}</h2>
              </div>
              <p className="text-slate-300 text-sm">
                {formatDateTime(selected.application.createdAt, language)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={classNames('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm', statusMeta.color)}>
                {statusMeta.icon}
                {statusMeta.label[language]}
              </span>
              <button
                type="button"
                className="rounded-lg p-2.5 bg-slate-600 text-white hover:bg-slate-500 transition-colors"
                onClick={handlePrint}
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2.5 bg-slate-600 text-white hover:bg-rose-600 transition-colors"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-8 py-6 bg-slate-50">
          <div className="space-y-6">
            {/* Enhanced Stepper */}
            <div className="relative">
              {renderStepper(selected)}
            </div>

            {/* Summary Cards with Better Styling */}
            {renderSummary(selected)}

            {/* Attachments and History Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
                  {t.modal.attachments}
                </h3>
                {renderAttachments(selected)}
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
                  {t.modal.history}
                </h3>
                {renderAuditTrail(selected)}
              </div>
            </div>

            {actionMessage && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700 font-medium">
                {actionMessage}
              </div>
            )}
            {actionError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-rose-700 font-medium">
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
    </>
  );
};
