import React, { FormEvent } from 'react';
import { X, Paperclip, PlusCircle, Send } from 'lucide-react';
import { ApplicationType, ApplicationFieldDefinition } from '../../../types';
import { AttachmentDraft } from '../types';
import { COPY } from '../constants';
import { formatFileSize, splitRange } from '../utils';

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ka' | 'en';
  selectedTypeId: number | null;
  onTypeIdChange: (id: number | null) => void;
  selectedType: ApplicationType | undefined;
  availableTypes: ApplicationType[];
  values: Record<string, string>;
  onValuesChange: (values: Record<string, string>) => void;
  comment?: string;
  onCommentChange?: (comment: string) => void;
  attachments: AttachmentDraft[];
  onAttachmentsChange: (attachments: AttachmentDraft[]) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
  success: string | null;
  onSuccessChange: (success: string | null) => void;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CreateApplicationModal: React.FC<CreateApplicationModalProps> = ({
  isOpen,
  onClose,
  language,
  selectedTypeId,
  onTypeIdChange,
  selectedType,
  availableTypes,
  values,
  onValuesChange,
  comment,
  onCommentChange,
  attachments,
  onAttachmentsChange,
  error,
  onErrorChange,
  success,
  onSuccessChange,
  isSubmitting,
  onSubmit,
  fileInputRef,
  onFileUpload,
}) => {
  const t = COPY[language];

  const renderFieldInput = (
    field: ApplicationFieldDefinition,
    fieldValues: Record<string, string>,
    setFieldValues: (updater: Record<string, string>) => void
  ) => {
    const value = fieldValues[field.key] ?? '';

    const updateValue = (next: string) => {
      setFieldValues({ ...fieldValues, [field.key]: next });
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

  const handleTypeChange = (typeId: number | null) => {
    onTypeIdChange(typeId);
    onValuesChange({});
    onAttachmentsChange([]);
    onErrorChange(null);
    onSuccessChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t.createModal.title}</h2>
            <p className="text-sm text-slate-500">
              {selectedType ? selectedType.description[language] : t.createModal.selectPrompt}
            </p>
          </div>
          <button
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="create-type">
                {t.createModal.selectType}
              </label>
              <select
                id="create-type"
                value={selectedTypeId ?? ''}
                onChange={(event) => {
                  const value = event.target.value ? Number(event.target.value) : null;
                  handleTypeChange(value);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="">{t.createModal.selectPlaceholder}</option>
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name[language]}
                  </option>
                ))}
              </select>
            </div>

            {selectedType ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="space-y-4">
                  {selectedType.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-700">
                          {field.label[language]}
                        </label>
                        {field.required && <span className="text-xs text-rose-500">*</span>}
                      </div>
                      {renderFieldInput(field, values, (next) => onValuesChange(next))}
                      {field.helper && <p className="text-xs text-slate-500">{field.helper[language]}</p>}
                    </div>
                  ))}

                  {selectedType.capabilities.allowsAttachments && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                      {attachments.map((attachment, index) => (
                        <div
                          key={`attachment-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <input
                              type="text"
                              value={attachment.name}
                              placeholder="document.pdf"
                              onChange={(event) => {
                                const next = [...attachments];
                                next[index] = { ...next[index], name: event.target.value };
                                onAttachmentsChange(next);
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
                                  const next = [...attachments];
                                  next[index] = { ...next[index], url: event.target.value };
                                  onAttachmentsChange(next);
                                }}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onAttachmentsChange(attachments.filter((_, idx) => idx !== index));
                              }}
                              className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          multiple
                          onChange={onFileUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                        >
                          <Paperclip className="h-4 w-4" />
                          {t.createModal.uploadFromComputer}
                        </button>
                        <button
                          type="button"
                          onClick={() => onAttachmentsChange([...attachments, { name: '', url: '' }])}
                          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                        >
                          <PlusCircle className="h-4 w-4" />
                          {t.createModal.addLink}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">{t.createModal.attachmentHelp}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-sm text-slate-500">
                {t.createModal.selectPrompt}
              </div>
            )}
          </div>

          {error && <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}
          {success && <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={handleClose}
            >
              {t.createModal.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedType}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? t.createModal.submitting : t.createModal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
