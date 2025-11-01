import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  PlusCircle,
  Layers3,
  PencilLine,
  Trash2,
  Settings2,
  Clock3,
  CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  ApplicationBundle,
  ApplicationFieldDefinition,
  ApplicationFieldType,
  ApplicationStepSLA,
  ApplicationType,
  Role
} from '../types';

interface ApplicationTypesPageProps {
  language: 'ka' | 'en';
}

type Mode = 'view' | 'edit' | 'create';

interface FieldForm {
  key: string;
  label: { ka: string; en: string };
  type: ApplicationFieldType;
  required: boolean;
  placeholder: { ka: string; en: string };
  helper: { ka: string; en: string };
  optionsText: string;
  editableStepsText: string;
}

interface SlaForm {
  stepIndex: number;
  hours: number;
  onExpire: ApplicationStepSLA['onExpire'];
}

interface ApplicationTypeForm {
  id?: number;
  name: { ka: string; en: string };
  description: { ka: string; en: string };
  icon: string;
  color: string;
  fields: FieldForm[];
  flow: number[];
  sla: SlaForm[];
}

const FIELD_TYPES: { value: ApplicationFieldType; label: { ka: string; en: string } }[] = [
  { value: 'text', label: { ka: 'ტექსტი', en: 'Text' } },
  { value: 'textarea', label: { ka: 'ტექსტური ბლოკი', en: 'Textarea' } },
  { value: 'date', label: { ka: 'თარიღი', en: 'Date' } },
  { value: 'date_range', label: { ka: 'თარიღების დიაპაზონი', en: 'Date range' } },
  { value: 'number', label: { ka: 'რიცხვი', en: 'Number' } },
  { value: 'select', label: { ka: 'არჩევანი', en: 'Select' } }
];

const SLA_ACTION_LABELS: Record<ApplicationStepSLA['onExpire'], { ka: string; en: string }> = {
  AUTO_APPROVE: { ka: 'ავტომატური დამტკიცება', en: 'Auto approve' },
  BOUNCE_BACK: { ka: 'დაბრუნება ავტორზე', en: 'Return to requester' }
};

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 disabled:bg-slate-100 disabled:text-slate-500';

const COPY: Record<
  ApplicationTypesPageProps['language'],
  {
    title: string;
    subtitle: string;
    newType: string;
    viewTitle: string;
    editTitle: string;
    createTitle: string;
    nameLabel: string;
    descriptionLabel: string;
    iconLabel: string;
    colorLabel: string;
    colorHelp: string;
    fieldSection: string;
    addField: string;
    removeField: string;
    fieldKey: string;
    fieldLabelKa: string;
    fieldLabelEn: string;
    fieldType: string;
    fieldRequired: string;
    fieldPlaceholderKa: string;
    fieldPlaceholderEn: string;
    fieldHelperKa: string;
    fieldHelperEn: string;
    fieldOptions: string;
    fieldOptionsHelp: string;
    fieldEditableSteps: string;
    flowSection: string;
    addStep: string;
    removeStep: string;
    stepLabel: (index: number) => string;
    slaSection: string;
    addSla: string;
    removeSla: string;
    slaStep: string;
    slaHours: string;
    slaAction: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    confirmCreate: string;
    confirmUpdate: string;
    confirmDelete: string;
    validation: string;
    fieldValidation: string;
    emptyList: string;
    noPermission: string;
    created: string;
    updated: string;
    deleted: string;
  }
> = {
  ka: {
    title: 'განაცხადების ტიპები',
    subtitle: 'დააკონფიგურირეთ სამუშაო ნაკადები, ველები და SLA წესები თითოეული განაცხადისთვის.',
    newType: 'ახალი ტიპი',
    viewTitle: 'ტიპის დეტალები',
    editTitle: 'ტიპის რედაქტირება',
    createTitle: 'ახალი განაცხადის ტიპი',
    nameLabel: 'დასახელება',
    descriptionLabel: 'აღწერა',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'ფერი (Tailwind class)',
    colorHelp: 'მაგალითად: bg-sky-500, bg-emerald-500',
    fieldSection: 'ველები',
    addField: 'ველის დამატება',
    removeField: 'ველის წაშლა',
    fieldKey: 'Key',
    fieldLabelKa: 'სათაური (ქართ.)',
    fieldLabelEn: 'სათაური (ინგლ.)',
    fieldType: 'ტიპი',
    fieldRequired: 'სავალდებულო',
    fieldPlaceholderKa: 'Placeholder (ქართ.)',
    fieldPlaceholderEn: 'Placeholder (ინგლ.)',
    fieldHelperKa: 'დამხმარე ტექსტი (ქართ.)',
    fieldHelperEn: 'დამხმარე ტექსტი (ინგლ.)',
    fieldOptions: 'არჩევანის ვარიანტები',
    fieldOptionsHelp: 'თითო ხაზზე: value|ქართული ეტიკეტი|English label',
    fieldEditableSteps: 'რედაქტირებადი ნაბიჯები (მაგ. 0,2)',
    flowSection: 'დამტკიცების მიმდევრობა',
    addStep: 'ნაბიჯის დამატება',
    removeStep: 'ამოღება',
    stepLabel: (index: number) => `${index + 1}-ე`,
    slaSection: 'SLA პარამეტრები',
    addSla: 'SLA ჩანაწერის დამატება',
    removeSla: 'წაშლა',
    slaStep: 'ნაბიჯი',
    slaHours: 'ვადა (საათი)',
    slaAction: 'ქმედება ვადის ამოწურვისას',
    save: 'შენახვა',
    saving: 'ინახება…',
    cancel: 'გაუქმება',
    delete: 'წაშლა',
    confirmCreate: 'ტიპის შექმნა',
    confirmUpdate: 'ტიპის განახლება',
    confirmDelete: 'ტიპის წაშლა',
    validation: 'გთხოვთ შეავსოთ სავალდებულო ველები და დაამატოთ მინიმუმ ერთი ნაბიჯი.',
    fieldValidation: 'ყველა ველს ესაჭიროება key და სათაურები.',
    emptyList: 'ჯერ არცერთი განაცხადის ტიპი არ არის შექმნილი.',
    noPermission: 'თქვენ არ გაქვთ განაცხადების ტიპების მართვის უფლება.',
    created: 'ტიპი წარმატებით შეიქმნა.',
    updated: 'ტიპი წარმატებით განახლდა.',
    deleted: 'ტიპი წაიშალა.'
  },
  en: {
    title: 'Application types',
    subtitle: 'Configure workflows, fields, and SLA rules for each request.',
    newType: 'New type',
    viewTitle: 'Type overview',
    editTitle: 'Edit type',
    createTitle: 'Create application type',
    nameLabel: 'Name',
    descriptionLabel: 'Description',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'Color (Tailwind class)',
    colorHelp: 'For example: bg-sky-500, bg-emerald-500',
    fieldSection: 'Fields',
    addField: 'Add field',
    removeField: 'Remove field',
    fieldKey: 'Field key',
    fieldLabelKa: 'Label (Georgian)',
    fieldLabelEn: 'Label (English)',
    fieldType: 'Type',
    fieldRequired: 'Required',
    fieldPlaceholderKa: 'Placeholder (Georgian)',
    fieldPlaceholderEn: 'Placeholder (English)',
    fieldHelperKa: 'Helper (Georgian)',
    fieldHelperEn: 'Helper (English)',
    fieldOptions: 'Select options',
    fieldOptionsHelp: 'One per line: value|Georgian label|English label',
    fieldEditableSteps: 'Editable steps (e.g. 0,2)',
    flowSection: 'Approval flow',
    addStep: 'Add step',
    removeStep: 'Remove',
    stepLabel: (index: number) => `Step ${index + 1}`,
    slaSection: 'SLA settings',
    addSla: 'Add SLA',
    removeSla: 'Remove',
    slaStep: 'Step',
    slaHours: 'Deadline (hours)',
    slaAction: 'Action on expire',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmCreate: 'Create type',
    confirmUpdate: 'Update type',
    confirmDelete: 'Delete type',
    validation: 'Please complete the required fields and add at least one step.',
    fieldValidation: 'Every field needs a key and both labels.',
    emptyList: 'No application types available yet.',
    noPermission: 'You do not have permission to manage application types.',
    created: 'Type created successfully.',
    updated: 'Type updated successfully.',
    deleted: 'Type deleted.'
  }
};

const createEmptyField = (): FieldForm => ({
  key: '',
  label: { ka: '', en: '' },
  type: 'text',
  required: true,
  placeholder: { ka: '', en: '' },
  helper: { ka: '', en: '' },
  optionsText: '',
  editableStepsText: ''
});

const flowToBadge = (flow: number[], roles: Role[], language: 'ka' | 'en') => {
  if (!flow.length) {
    return language === 'ka' ? 'ნაბიჯები არ არის' : 'No steps';
  }
  return flow
    .map((roleId, index) => {
      const role = roles.find((candidate) => candidate.id === roleId);
      return role ? `${index + 1}. ${role.name}` : `${index + 1}. #${roleId}`;
    })
    .join(' → ');
};

const mapFieldToForm = (field: ApplicationFieldDefinition): FieldForm => ({
  key: field.key,
  label: { ...field.label },
  type: field.type,
  required: field.required,
  placeholder: {
    ka: field.placeholder?.ka ?? '',
    en: field.placeholder?.en ?? ''
  },
  helper: {
    ka: field.helper?.ka ?? '',
    en: field.helper?.en ?? ''
  },
  optionsText:
    field.options?.map((option) => `${option.value}|${option.label.ka}|${option.label.en}`).join('\n') ?? '',
  editableStepsText: field.editableSteps?.join(',') ?? ''
});

const mapTypeToForm = (type: ApplicationType): ApplicationTypeForm => ({
  id: type.id,
  name: { ...type.name },
  description: { ...type.description },
  icon: type.icon,
  color: type.color,
  fields: type.fields.map(mapFieldToForm),
  flow: [...type.flow],
  sla: type.slaPerStep.map((entry) => ({
    stepIndex: entry.stepIndex,
    hours: Math.round(entry.seconds / 3600),
    onExpire: entry.onExpire
  }))
});

const parseFieldForm = (field: FieldForm): ApplicationFieldDefinition => {
  const options = field.optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ka, en] = line.split('|').map((part) => part.trim());
      if (!value || !ka || !en) {
        return null;
      }
      return {
        value,
        label: { ka, en }
      };
    })
    .filter((option): option is NonNullable<typeof option> => Boolean(option));

  const editableSteps = field.editableStepsText
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => Number.parseInt(entry, 10))
    .filter((value) => Number.isFinite(value));

  const placeholderExists = field.placeholder.ka.trim() || field.placeholder.en.trim();
  const helperExists = field.helper.ka.trim() || field.helper.en.trim();

  return {
    key: field.key.trim(),
    label: {
      ka: field.label.ka.trim(),
      en: field.label.en.trim()
    },
    type: field.type,
    required: field.required,
    ...(placeholderExists
      ? {
          placeholder: {
            ka: field.placeholder.ka.trim(),
            en: field.placeholder.en.trim()
          }
        }
      : {}),
    ...(options.length ? { options } : {}),
    ...(helperExists
      ? {
          helper: {
            ka: field.helper.ka.trim(),
            en: field.helper.en.trim()
          }
        }
      : {}),
    ...(editableSteps.length ? { editableSteps } : {})
  };
};

const parseFormToType = (form: ApplicationTypeForm): Omit<ApplicationType, 'id'> | ApplicationType => {
  const fields = form.fields.map(parseFieldForm);
  const slaPerStep: ApplicationStepSLA[] = form.sla.map((entry) => ({
    stepIndex: entry.stepIndex,
    seconds: Math.max(1, entry.hours) * 3600,
    onExpire: entry.onExpire
  }));

  const base = {
    name: {
      ka: form.name.ka.trim(),
      en: form.name.en.trim()
    },
    description: {
      ka: form.description.ka.trim(),
      en: form.description.en.trim()
    },
    icon: form.icon.trim() || 'FileText',
    color: form.color.trim() || 'bg-slate-500',
    fields,
    flow: form.flow.filter((id) => Number.isFinite(id)),
    slaPerStep
  };

  if (typeof form.id === 'number') {
    return { id: form.id, ...base };
  }

  return base;
};

const createEmptyForm = (roles: Role[]): ApplicationTypeForm => ({
  name: { ka: '', en: '' },
  description: { ka: '', en: '' },
  icon: 'FileText',
  color: 'bg-slate-500',
  fields: [createEmptyField()],
  flow: roles.length ? [roles[0].id] : [],
  sla: []
});

const totalApplicationsForType = (bundles: ApplicationBundle[], typeId: number) =>
  bundles.filter((bundle) => bundle.application.typeId === typeId).length;

export const ApplicationTypesPage: React.FC<ApplicationTypesPageProps> = ({ language }) => {
  const {
    roles,
    applications,
    applicationTypes,
    hasPermission,
    createApplicationType,
    updateApplicationType,
    deleteApplicationType
  } = useAppContext();

  const t = COPY[language];
  const canManage = hasPermission('manage_request_types');

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(
    applicationTypes[0]?.id ?? null
  );
  const [mode, setMode] = useState<Mode>(applicationTypes.length ? 'view' : 'create');
  const [formState, setFormState] = useState<ApplicationTypeForm>(
    applicationTypes.length ? mapTypeToForm(applicationTypes[0]) : createEmptyForm(roles)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedType = useMemo(
    () => applicationTypes.find((type) => type.id === selectedTypeId) ?? null,
    [applicationTypes, selectedTypeId]
  );

  useEffect(() => {
    if (!applicationTypes.length) {
      setMode('create');
      setSelectedTypeId(null);
      setFormState(createEmptyForm(roles));
      return;
    }

    if (mode === 'create') {
      return;
    }

    if (!selectedType) {
      const fallback = applicationTypes[0];
      setSelectedTypeId(fallback.id);
      setFormState(mapTypeToForm(fallback));
      setMode('view');
      return;
    }

    setFormState(mapTypeToForm(selectedType));
  }, [applicationTypes, mode, roles, selectedType]);

  const resetFeedback = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleSelectType = (type: ApplicationType) => {
    resetFeedback();
    setSelectedTypeId(type.id);
    setMode('view');
    setFormState(mapTypeToForm(type));
  };

  const handleStartCreate = () => {
    resetFeedback();
    setSelectedTypeId(null);
    setMode('create');
    setFormState(createEmptyForm(roles));
  };

  const handleEdit = () => {
    if (!selectedType) {
      return;
    }
    resetFeedback();
    setMode('edit');
  };

  const handleCancel = () => {
    resetFeedback();
    if (mode === 'create') {
      if (applicationTypes.length) {
        const fallback = applicationTypes[0];
        setSelectedTypeId(fallback.id);
        setMode('view');
        setFormState(mapTypeToForm(fallback));
      } else {
        setFormState(createEmptyForm(roles));
      }
      return;
    }

    if (selectedType) {
      setFormState(mapTypeToForm(selectedType));
    }
    setMode('view');
  };

  const updateField = (index: number, updater: (field: FieldForm) => FieldForm) => {
    setFormState((prev) => ({
      ...prev,
      fields: prev.fields.map((field, idx) => (idx === index ? updater(field) : field))
    }));
  };

  const updateSla = (index: number, updater: (entry: SlaForm) => SlaForm) => {
    setFormState((prev) => ({
      ...prev,
      sla: prev.sla.map((entry, idx) => (idx === index ? updater(entry) : entry))
    }));
  };

  const normalizeSlaAfterFlowChange = (flow: number[], currentSla: SlaForm[]): SlaForm[] => {
    const lastIndex = flow.length - 1;
    return currentSla
      .map((entry) => {
        if (entry.stepIndex > lastIndex) {
          return null;
        }
        return entry;
      })
      .filter((entry): entry is SlaForm => Boolean(entry));
  };

  const validateForm = (): boolean => {
    if (!formState.name.ka.trim() || !formState.name.en.trim()) {
      return false;
    }
    if (!formState.description.ka.trim() || !formState.description.en.trim()) {
      return false;
    }
    if (!formState.fields.length) {
      return false;
    }
    if (formState.fields.some((field) => !field.key.trim() || !field.label.ka.trim() || !field.label.en.trim())) {
      return false;
    }
    if (!formState.flow.length) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    resetFeedback();

    if (!validateForm()) {
      setErrorMessage(`${t.validation} ${t.fieldValidation}`);
      return;
    }

    if (!canManage) {
      setErrorMessage(t.noPermission);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const payload = parseFormToType(formState) as Omit<ApplicationType, 'id'>;
        const created = await createApplicationType(payload);
        setSelectedTypeId(created.id);
        setFormState(mapTypeToForm(created));
        setMode('view');
        setStatusMessage(t.created);
      } else if (mode === 'edit' && selectedType) {
        const payload = parseFormToType({ ...formState, id: selectedType.id }) as ApplicationType;
        const updated = await updateApplicationType(payload);
        if (updated) {
          setFormState(mapTypeToForm(updated));
          setStatusMessage(t.updated);
          setMode('view');
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) {
      return;
    }
    resetFeedback();
    if (!canManage) {
      setErrorMessage(t.noPermission);
      return;
    }

    setIsSaving(true);
    try {
      const removed = await deleteApplicationType(selectedType.id);
      if (removed) {
        setStatusMessage(t.deleted);
        const remaining = applicationTypes.filter((type) => type.id !== selectedType.id);
        if (remaining.length) {
          const fallback = remaining[0];
          setSelectedTypeId(fallback.id);
          setFormState(mapTypeToForm(fallback));
          setMode('view');
        } else {
          setSelectedTypeId(null);
          setMode('create');
          setFormState(createEmptyForm(roles));
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Unable to delete type.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white shadow rounded-xl p-10 text-center">
        <Layers3 className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-slate-700 mb-2">{t.title}</p>
        <p className="text-slate-500">{t.noPermission}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-500" />
            {t.title}
          </h1>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-500 transition"
        >
          <PlusCircle className="w-4 h-4" />
          {t.newType}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        <aside className="bg-white rounded-xl shadow border border-slate-100">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Layers3 className="w-5 h-5 text-slate-500" />
              {t.title}
            </h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {applicationTypes.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {applicationTypes.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">{t.emptyList}</div>
            )}
            {applicationTypes.map((type) => {
              const isActive = type.id === selectedTypeId;
              const usageCount = totalApplicationsForType(applications, type.id);
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelectType(type)}
                  className={`w-full text-left px-5 py-4 transition flex flex-col gap-2 ${
                    isActive ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{type.name[language]}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type.color} text-white`}>
                      {type.icon}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{type.description[language]}</p>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Clock3 className="w-3 h-3" />
                      {flowToBadge(type.flow, roles, language)}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {usageCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="bg-white rounded-xl shadow border border-slate-100">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {mode === 'create' ? t.createTitle : mode === 'edit' ? t.editTitle : t.viewTitle}
                </h2>
                {statusMessage && <p className="text-sm text-emerald-600 mt-2">{statusMessage}</p>}
                {errorMessage && <p className="text-sm text-rose-500 mt-2">{errorMessage}</p>}
              </div>
              {mode === 'view' && selectedType && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <PencilLine className="w-4 h-4" />
                    {language === 'ka' ? 'რედაქტირება' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:border-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.delete}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">{t.nameLabel} (KA)</span>
                <input
                  type="text"
                  value={formState.name.ka}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: { ...prev.name, ka: event.target.value }
                    }))
                  }
                  disabled={mode === 'view'}
                  className={INPUT_CLASS}
                  placeholder="შვებულების განაცხადი"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">{t.nameLabel} (EN)</span>
                <input
                  type="text"
                  value={formState.name.en}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: { ...prev.name, en: event.target.value }
                    }))
                  }
                  disabled={mode === 'view'}
                  className={INPUT_CLASS}
                  placeholder="Leave request"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{t.descriptionLabel} (KA)</span>
                <textarea
                  value={formState.description.ka}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: { ...prev.description, ka: event.target.value }
                    }))
                  }
                  disabled={mode === 'view'}
                  className={`${INPUT_CLASS} min-h-[90px]`}
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">{t.descriptionLabel} (EN)</span>
                <textarea
                  value={formState.description.en}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: { ...prev.description, en: event.target.value }
                    }))
                  }
                  disabled={mode === 'view'}
                  className={`${INPUT_CLASS} min-h-[90px]`}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">{t.iconLabel}</span>
                <input
                  type="text"
                  value={formState.icon}
                  onChange={(event) => setFormState((prev) => ({ ...prev, icon: event.target.value }))}
                  disabled={mode === 'view'}
                  className={INPUT_CLASS}
                  placeholder="CalendarDays"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">{t.colorLabel}</span>
                <input
                  type="text"
                  value={formState.color}
                  onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                  disabled={mode === 'view'}
                  className={INPUT_CLASS}
                  placeholder="bg-sky-500"
                />
                <span className="text-xs text-slate-400">{t.colorHelp}</span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{t.fieldSection}</h3>
                {mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, fields: [...prev.fields, createEmptyField()] }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t.addField}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {formState.fields.map((field, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{t.stepLabel(index)}</span>
                      {mode !== 'view' && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              fields: prev.fields.filter((_, idx) => idx !== index)
                            }))
                          }
                          className="text-rose-500 hover:text-rose-600 text-xs"
                        >
                          {t.removeField}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldKey}</span>
                        <input
                          type="text"
                          value={field.key}
                          onChange={(event) =>
                            updateField(index, (current) => ({ ...current, key: event.target.value }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldType}</span>
                        <select
                          value={field.type}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              type: event.target.value as ApplicationFieldType
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        >
                          {FIELD_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label[language]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              required: event.target.checked
                            }))
                          }
                          disabled={mode === 'view'}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-xs font-medium text-slate-600">{t.fieldRequired}</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldLabelKa}</span>
                        <input
                          type="text"
                          value={field.label.ka}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              label: { ...current.label, ka: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldLabelEn}</span>
                        <input
                          type="text"
                          value={field.label.en}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              label: { ...current.label, en: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldPlaceholderKa}</span>
                        <input
                          type="text"
                          value={field.placeholder.ka}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              placeholder: { ...current.placeholder, ka: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldPlaceholderEn}</span>
                        <input
                          type="text"
                          value={field.placeholder.en}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              placeholder: { ...current.placeholder, en: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldHelperKa}</span>
                        <input
                          type="text"
                          value={field.helper.ka}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              helper: { ...current.helper, ka: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldHelperEn}</span>
                        <input
                          type="text"
                          value={field.helper.en}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              helper: { ...current.helper, en: event.target.value }
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                        />
                      </label>
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs font-medium text-slate-600">{t.fieldOptions}</span>
                        <textarea
                          value={field.optionsText}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              optionsText: event.target.value
                            }))
                          }
                          disabled={mode === 'view'}
                          className={`${INPUT_CLASS} min-h-[70px]`}
                          placeholder="value|ქართული|English"
                        />
                        <span className="text-[11px] text-slate-400">{t.fieldOptionsHelp}</span>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-600">{t.fieldEditableSteps}</span>
                        <input
                          type="text"
                          value={field.editableStepsText}
                          onChange={(event) =>
                            updateField(index, (current) => ({
                              ...current,
                              editableStepsText: event.target.value
                            }))
                          }
                          disabled={mode === 'view'}
                          className={INPUT_CLASS}
                          placeholder="0,2"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{t.flowSection}</h3>
                {mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => {
                        const nextFlow = [...prev.flow, roles[0]?.id ?? 0];
                        return {
                          ...prev,
                          flow: nextFlow,
                          sla: normalizeSlaAfterFlowChange(nextFlow, prev.sla)
                        };
                      })
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t.addStep}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formState.flow.map((roleId, index) => (
                  <div key={`${roleId}-${index}`} className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-slate-600 block mb-1">
                        {t.stepLabel(index)}
                      </label>
                      <select
                        value={roleId}
                        onChange={(event) =>
                          setFormState((prev) => {
                            const nextFlow = prev.flow.map((value, idx) =>
                              idx === index ? Number.parseInt(event.target.value, 10) : value
                            );
                            return {
                              ...prev,
                              flow: nextFlow,
                              sla: normalizeSlaAfterFlowChange(nextFlow, prev.sla)
                            };
                          })
                        }
                        disabled={mode === 'view'}
                        className={INPUT_CLASS}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => {
                            const nextFlow = prev.flow.filter((_, idx) => idx !== index);
                            return {
                              ...prev,
                              flow: nextFlow,
                              sla: normalizeSlaAfterFlowChange(nextFlow, prev.sla).map((entry) => {
                                if (entry.stepIndex > index) {
                                  return { ...entry, stepIndex: entry.stepIndex - 1 };
                                }
                                if (entry.stepIndex === index) {
                                  return null;
                                }
                                return entry;
                              }).filter((entry): entry is SlaForm => Boolean(entry))
                            };
                          })
                        }
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        {t.removeStep}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{t.slaSection}</h3>
                {mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => {
                        const defaultStepIndex = prev.flow.length
                          ? Math.max(0, prev.flow.length - 1)
                          : 0;
                        return {
                          ...prev,
                          sla: [
                            ...prev.sla,
                            {
                              stepIndex: defaultStepIndex,
                              hours: 24,
                              onExpire: 'AUTO_APPROVE'
                            }
                          ]
                        };
                      })
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {t.addSla}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formState.sla.map((entry, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 border border-slate-200 rounded-lg p-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-600">{t.slaStep}</span>
                      <select
                        value={entry.stepIndex}
                        onChange={(event) =>
                          updateSla(index, (current) => ({
                            ...current,
                            stepIndex: Number.parseInt(event.target.value, 10)
                          }))
                        }
                        disabled={mode === 'view'}
                        className={INPUT_CLASS}
                      >
                        {formState.flow.map((_, stepIndex) => (
                          <option key={stepIndex} value={stepIndex}>
                            {t.stepLabel(stepIndex)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-600">{t.slaHours}</span>
                      <input
                        type="number"
                        min={1}
                        value={entry.hours}
                        onChange={(event) =>
                          updateSla(index, (current) => ({
                            ...current,
                            hours: Number.parseInt(event.target.value, 10) || 1
                          }))
                        }
                        disabled={mode === 'view'}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-xs font-medium text-slate-600">{t.slaAction}</span>
                      <select
                        value={entry.onExpire}
                        onChange={(event) =>
                          updateSla(index, (current) => ({
                            ...current,
                            onExpire: event.target.value as ApplicationStepSLA['onExpire']
                          }))
                        }
                        disabled={mode === 'view'}
                        className={INPUT_CLASS}
                      >
                        {Object.entries(SLA_ACTION_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label[language]}
                          </option>
                        ))}
                      </select>
                    </label>
                    {mode !== 'view' && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            sla: prev.sla.filter((_, idx) => idx !== index)
                          }))
                        }
                        className="text-xs text-rose-500 hover:text-rose-600"
                      >
                        {t.removeSla}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {mode !== 'view' && (
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-500 disabled:opacity-60"
                >
                  {isSaving ? t.saving : mode === 'create' ? t.confirmCreate : t.confirmUpdate}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default ApplicationTypesPage;
