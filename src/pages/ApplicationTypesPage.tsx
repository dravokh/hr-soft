import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Layers3,
  PencilLine,
  PlusCircle,
  Save,
  Settings2,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  ApplicationFieldDefinition,
  ApplicationStepSLA,
  ApplicationType,
  ApplicationTypeCapabilities
} from '../types';

interface ApplicationTypesPageProps {
  language: 'ka' | 'en';
}

type Mode = 'view' | 'edit' | 'create';

type CustomFieldType = 'text' | 'number' | 'textarea';

interface CustomFieldForm {
  key: string;
  labelKa: string;
  labelEn: string;
  type: CustomFieldType;
  required: boolean;
}

interface SlaFormEntry {
  stepIndex: number;
  hours: number;
  onExpire: ApplicationStepSLA['onExpire'];
}

interface FormState {
  nameKa: string;
  nameEn: string;
  descriptionKa: string;
  descriptionEn: string;
  icon: string;
  color: string;
  capabilities: ApplicationTypeCapabilities;
  flow: number[];
  sla: SlaFormEntry[];
  allowedRoleIds: number[];
  reasonLabelKa: string;
  reasonLabelEn: string;
  commentLabelKa: string;
  commentLabelEn: string;
  customFields: CustomFieldForm[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarDays,
  Clock3,
  ClipboardList,
  Layers3,
  CheckCircle2
};

const KNOWN_FIELD_KEYS = new Set([
  'reason',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'additional_comment'
]);

const DEFAULT_REASON_PLACEHOLDER = {
  ka: 'მოკლედ აღწერეთ განაცხადის მიზეზი…',
  en: 'Describe why you are submitting this request…'
};

const DEFAULT_COMMENT_PLACEHOLDER = {
  ka: 'შეიტანეთ დამატებითი ინფორმაცია საჭიროების შემთხვევაში…',
  en: 'Add context for reviewers if needed…'
};

const COPY: Record<
  ApplicationTypesPageProps['language'],
  {
    title: string;
    subtitle: string;
    create: string;
    edit: string;
    view: string;
    empty: string;
    basicInformation: string;
    nameKa: string;
    nameEn: string;
    descriptionKa: string;
    descriptionEn: string;
    iconLabel: string;
    colorLabel: string;
    colorHint: string;
    fieldSettings: string;
    reasonLabel: string;
    commentLabel: string;
    toggles: {
      requiresDateRange: string;
      requiresTimeRange: string;
      hasCommentField: string;
      allowsAttachments: string;
    };
    allowedRoles: string;
    customFieldTitle: string;
    addCustomField: string;
    fieldKey: string;
    fieldLabelKa: string;
    fieldLabelEn: string;
    fieldType: string;
    fieldRequired: string;
    flowTitle: string;
    addStep: string;
    slaTitle: string;
    hours: string;
    expiryAction: string;
    actions: { save: string; saving: string; cancel: string; delete: string };
    successCreated: string;
    successUpdated: string;
    successDeleted: string;
    noPermission: string;
    validationError: string;
    selectRole: string;
    customFieldTypes: Record<CustomFieldType, string>;
    expireActions: Record<ApplicationStepSLA['onExpire'], string>;
  }
> = {
  ka: {
    title: 'განაცხადების ტიპები',
    subtitle: 'მართეთ დამტკიცების ნაკადები, სტანდარტული ველები და SLA წესები თითოეული განაცხადისთვის.',
    create: 'ახალი ტიპის შექმნა',
    edit: 'ტიპის რედაქტირება',
    view: 'ტიპის დეტალები',
    empty: 'ჯერ არცერთი განაცხადის ტიპი არ არის შექმნილი.',
    basicInformation: 'ძირითადი ინფორმაცია',
    nameKa: 'დასახელება (ქართ.)',
    nameEn: 'დასახელება (ინგლ.)',
    descriptionKa: 'აღწერა (ქართ.)',
    descriptionEn: 'აღწერა (ინგლ.)',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'ფერი (Tailwind კლასი)',
    colorHint: 'მაგ: bg-sky-500, bg-emerald-500',
    fieldSettings: 'ველების კონფიგურაცია',
    reasonLabel: 'მიზნის ველის სათაური',
    commentLabel: 'კომენტარის ველის სათაური',
    toggles: {
      requiresDateRange: 'საჭიროა კალენდრის დიაპაზონი',
      requiresTimeRange: 'საჭიროა დროის დიაპაზონი',
      hasCommentField: 'დამატებითი კომენტარი',
      allowsAttachments: 'ფაილების ატვირთვა დაშვებულია'
    },
    allowedRoles: 'ვინ შეუძლია განაცხადის შექმნა',
    customFieldTitle: 'დამატებითი ველები',
    addCustomField: 'ველი',
    fieldKey: 'Key',
    fieldLabelKa: 'სათაური (ქართ.)',
    fieldLabelEn: 'სათაური (ინგლ.)',
    fieldType: 'ტიპი',
    fieldRequired: 'სავალდებულო',
    flowTitle: 'დამტკიცების მიმდევრობა',
    addStep: 'ნაბიჯის დამატება',
    slaTitle: 'SLA თითო ნაბიჯზე',
    hours: 'საათი',
    expiryAction: 'ვადის ამოწურვისას',
    actions: {
      save: 'შენახვა',
      saving: 'ინახება…',
      cancel: 'გაუქმება',
      delete: 'ტიპის წაშლა'
    },
    successCreated: 'ტიპი წარმატებით შეიქმნა.',
    successUpdated: 'ცვლილებები შენახულია.',
    successDeleted: 'ტიპი წაიშალა.',
    noPermission: 'თქვენ არ გაქვთ განაცხადების ტიპების მართვის უფლება.',
    validationError: 'გთხოვთ შეავსოთ სავალდებულო ველები და მიუთითოთ მინიმუმ ერთი ნაბიჯი.',
    selectRole: 'აირჩიეთ როლი…',
    customFieldTypes: {
      text: 'ტექსტი',
      number: 'რიცხვი',
      textarea: 'ტექსტური ბლოკი'
    },
    expireActions: {
      AUTO_APPROVE: 'ავტომატური დამტკიცება',
      BOUNCE_BACK: 'დაბრუნება ავტორზე'
    }
  },
  en: {
    title: 'Application types',
    subtitle: 'Configure approval flows, standard fields, and SLA rules for each request.',
    create: 'Create type',
    edit: 'Edit type',
    view: 'Type overview',
    empty: 'No application types have been created yet.',
    basicInformation: 'Basic information',
    nameKa: 'Name (Georgian)',
    nameEn: 'Name (English)',
    descriptionKa: 'Description (Georgian)',
    descriptionEn: 'Description (English)',
    iconLabel: 'Icon (Lucide)',
    colorLabel: 'Color (Tailwind class)',
    colorHint: 'e.g. bg-sky-500, bg-emerald-500',
    fieldSettings: 'Field configuration',
    reasonLabel: 'Purpose field label',
    commentLabel: 'Comment field label',
    toggles: {
      requiresDateRange: 'Require calendar range',
      requiresTimeRange: 'Require time range',
      hasCommentField: 'Include comment box',
      allowsAttachments: 'Allow attachments'
    },
    allowedRoles: 'Who can submit this request',
    customFieldTitle: 'Additional fields',
    addCustomField: 'Add field',
    fieldKey: 'Field key',
    fieldLabelKa: 'Label (Georgian)',
    fieldLabelEn: 'Label (English)',
    fieldType: 'Type',
    fieldRequired: 'Required',
    flowTitle: 'Approval flow',
    addStep: 'Add step',
    slaTitle: 'SLA per step',
    hours: 'Hours',
    expiryAction: 'When overdue',
    actions: {
      save: 'Save changes',
      saving: 'Saving…',
      cancel: 'Cancel',
      delete: 'Delete type'
    },
    successCreated: 'Type created successfully.',
    successUpdated: 'Changes saved successfully.',
    successDeleted: 'Type removed successfully.',
    noPermission: 'You do not have permission to manage request types.',
    validationError: 'Please fill in required fields and configure at least one approval step.',
    selectRole: 'Select role…',
    customFieldTypes: {
      text: 'Text',
      number: 'Number',
      textarea: 'Textarea'
    },
    expireActions: {
      AUTO_APPROVE: 'Auto approve',
      BOUNCE_BACK: 'Return to requester'
    }
  }
};

const syncSlaWithFlow = (flow: number[], current: SlaFormEntry[]): SlaFormEntry[] => {
  const existing = new Map(current.map((entry) => [entry.stepIndex, entry] as const));
  return flow.map((_, index) => {
    const match = existing.get(index);
    return (
      match ?? {
        stepIndex: index,
        hours: 24,
        onExpire: 'AUTO_APPROVE'
      }
    );
  });
};

const getIconComponent = (iconName: string) => {
  const Component = ICON_MAP[iconName];
  return Component ?? Layers3;
};

const extractCustomFields = (fields: ApplicationFieldDefinition[]): CustomFieldForm[] => {
  return fields
    .filter((field) => !KNOWN_FIELD_KEYS.has(field.key))
    .map((field) => ({
      key: field.key,
      labelKa: field.label.ka,
      labelEn: field.label.en,
      type: (field.type as CustomFieldType) ?? 'text',
      required: Boolean(field.required)
    }));
};

const buildDefaultFormState = (): FormState => ({
  nameKa: '',
  nameEn: '',
  descriptionKa: '',
  descriptionEn: '',
  icon: 'Layers3',
  color: 'bg-slate-500',
  capabilities: {
    requiresDateRange: true,
    requiresTimeRange: false,
    hasCommentField: true,
    allowsAttachments: true
  },
  flow: [],
  sla: [],
  allowedRoleIds: [],
  reasonLabelKa: 'განაცხადის მიზანი',
  reasonLabelEn: 'Purpose',
  commentLabelKa: 'დამატებითი კომენტარი',
  commentLabelEn: 'Additional comment',
  customFields: []
});

const buildFormStateFromType = (type: ApplicationType): FormState => {
  const reasonField = type.fields.find((field) => field.key === 'reason');
  const commentField = type.fields.find((field) => field.key === 'additional_comment');
  const form: FormState = {
    nameKa: type.name.ka,
    nameEn: type.name.en,
    descriptionKa: type.description.ka,
    descriptionEn: type.description.en,
    icon: type.icon,
    color: type.color,
    capabilities: { ...type.capabilities },
    flow: [...type.flow],
    sla: type.slaPerStep.map((entry) => ({
      stepIndex: entry.stepIndex,
      hours: Math.max(1, Math.round(entry.seconds / 3600)),
      onExpire: entry.onExpire
    })),
    allowedRoleIds: [...type.allowedRoleIds],
    reasonLabelKa: reasonField?.label.ka ?? 'განაცხადის მიზანი',
    reasonLabelEn: reasonField?.label.en ?? 'Purpose',
    commentLabelKa: commentField?.label.ka ?? 'დამატებითი კომენტარი',
    commentLabelEn: commentField?.label.en ?? 'Additional comment',
    customFields: extractCustomFields(type.fields)
  };
  form.sla = syncSlaWithFlow(form.flow, form.sla);
  return form;
};

const buildFields = (form: FormState): ApplicationFieldDefinition[] => {
  const fields: ApplicationFieldDefinition[] = [
    {
      key: 'reason',
      label: { ka: form.reasonLabelKa || 'განაცხადის მიზანი', en: form.reasonLabelEn || 'Purpose' },
      type: 'textarea',
      required: true,
      placeholder: DEFAULT_REASON_PLACEHOLDER
    }
  ];

  if (form.capabilities.requiresDateRange) {
    fields.push({
      key: 'start_date',
      label: { ka: 'დაწყების თარიღი', en: 'Start date' },
      type: 'date',
      required: true
    });
    fields.push({
      key: 'end_date',
      label: { ka: 'დასრულების თარიღი', en: 'End date' },
      type: 'date',
      required: true
    });
  }

  if (form.capabilities.requiresTimeRange) {
    fields.push({
      key: 'start_time',
      label: { ka: 'დაწყების დრო', en: 'Start time' },
      type: 'time',
      required: false
    });
    fields.push({
      key: 'end_time',
      label: { ka: 'დასრულების დრო', en: 'End time' },
      type: 'time',
      required: false
    });
  }

  if (form.capabilities.hasCommentField) {
    fields.push({
      key: 'additional_comment',
      label: { ka: form.commentLabelKa || 'დამატებითი კომენტარი', en: form.commentLabelEn || 'Additional comment' },
      type: 'textarea',
      required: false,
      placeholder: DEFAULT_COMMENT_PLACEHOLDER
    });
  }

  form.customFields.forEach((field) => {
    fields.push({
      key: field.key,
      label: { ka: field.labelKa, en: field.labelEn },
      type: field.type,
      required: field.required
    } as ApplicationFieldDefinition);
  });

  return fields;
};

const validateForm = (form: FormState): boolean => {
  if (!form.nameKa.trim() || !form.nameEn.trim()) {
    return false;
  }
  if (!form.descriptionKa.trim() || !form.descriptionEn.trim()) {
    return false;
  }
  if (!form.flow.length) {
    return false;
  }
  if (form.customFields.some((field) => !field.key.trim() || !field.labelKa.trim() || !field.labelEn.trim())) {
    return false;
  }
  const builtInKeys: string[] = ['reason'];
  if (form.capabilities.requiresDateRange) {
    builtInKeys.push('start_date', 'end_date');
  }
  if (form.capabilities.requiresTimeRange) {
    builtInKeys.push('start_time', 'end_time');
  }
  if (form.capabilities.hasCommentField) {
    builtInKeys.push('additional_comment');
  }

  const customKeys = form.customFields.map((field) => field.key.trim());
  const allKeys = [...builtInKeys, ...customKeys].filter(Boolean);
  const uniqueKeys = new Set(allKeys);
  if (uniqueKeys.size !== allKeys.length) {
    return false;
  }
  return true;
};

export const ApplicationTypesPage: React.FC<ApplicationTypesPageProps> = ({ language }) => {
  const {
    applicationTypes,
    roles,
    hasPermission,
    createApplicationType,
    updateApplicationType,
    deleteApplicationType
  } = useAppContext();

  const t = COPY[language];
  const canManage = hasPermission('manage_request_types');

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(applicationTypes[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>(applicationTypes.length ? 'view' : 'create');
  const [formState, setFormState] = useState<FormState>(() =>
    applicationTypes[0] ? buildFormStateFromType(applicationTypes[0]) : buildDefaultFormState()
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allowedRolesOpen, setAllowedRolesOpen] = useState(false);
  const allowedRolesDropdownRef = useRef<HTMLDivElement | null>(null);
  const selectedRoles = useMemo(
    () => roles.filter((role) => formState.allowedRoleIds.includes(role.id)),
    [roles, formState.allowedRoleIds]
  );

  const selectedType = useMemo(() => {
    if (mode === 'create') {
      return null;
    }
    return applicationTypes.find((type) => type.id === selectedTypeId) ?? null;
  }, [applicationTypes, mode, selectedTypeId]);

  useEffect(() => {
    if (!applicationTypes.length) {
      setSelectedTypeId(null);
      setMode('create');
      setFormState(buildDefaultFormState());
      return;
    }

    if (selectedTypeId === null || !applicationTypes.some((type) => type.id === selectedTypeId)) {
      setSelectedTypeId(applicationTypes[0].id);
      setMode('view');
      setFormState(buildFormStateFromType(applicationTypes[0]));
    }
  }, [applicationTypes, selectedTypeId]);

  useEffect(() => {
    if (selectedType && mode === 'view') {
      setFormState(buildFormStateFromType(selectedType));
    }
  }, [selectedType, mode]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!allowedRolesOpen) {
        return;
      }
      if (
        allowedRolesDropdownRef.current &&
        event.target instanceof Node &&
        !allowedRolesDropdownRef.current.contains(event.target)
      ) {
        setAllowedRolesOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAllowedRolesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [allowedRolesOpen]);

  const startCreate = () => {
    setMode('create');
    setSelectedTypeId(null);
    setFormState(buildDefaultFormState());
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
  };

  const startEdit = () => {
    if (!selectedType) {
      return;
    }
    setMode('edit');
    setFormState(buildFormStateFromType(selectedType));
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
  };

  const cancelEditing = () => {
    if (!applicationTypes.length) {
      setMode('create');
      setFormState(buildDefaultFormState());
      setSelectedTypeId(null);
      setAllowedRolesOpen(false);
      return;
    }
    if (selectedType) {
      setFormState(buildFormStateFromType(selectedType));
    }
    setMode('view');
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
  };

  const handleFlowRoleChange = (index: number, roleId: number) => {
    setFormState((previous) => {
      const nextFlow = previous.flow.map((current, idx) => (idx === index ? roleId : current));
      return {
        ...previous,
        flow: nextFlow,
        sla: syncSlaWithFlow(nextFlow, previous.sla)
      };
    });
  };

  const handleAddFlowStep = () => {
    if (!roles.length) {
      return;
    }
    setFormState((previous) => {
      const nextFlow = [...previous.flow, roles[0].id];
      return {
        ...previous,
        flow: nextFlow,
        sla: syncSlaWithFlow(nextFlow, previous.sla)
      };
    });
  };

  const handleRemoveFlowStep = (index: number) => {
    setFormState((previous) => {
      const nextFlow = previous.flow.filter((_, idx) => idx !== index);
      const nextSla = syncSlaWithFlow(nextFlow, previous.sla)
        .map((entry, idx) => ({ ...entry, stepIndex: idx }));
      return {
        ...previous,
        flow: nextFlow,
        sla: nextSla
      };
    });
  };

  const handleSlaChange = (index: number, updates: Partial<SlaFormEntry>) => {
    setFormState((previous) => {
      const nextSla = previous.sla.map((entry) =>
        entry.stepIndex === index ? { ...entry, ...updates } : entry
      );
      return {
        ...previous,
        sla: nextSla
      };
    });
  };

  const handleCustomFieldChange = (index: number, updates: Partial<CustomFieldForm>) => {
    setFormState((previous) => {
      const next = previous.customFields.map((field, idx) =>
        idx === index ? { ...field, ...updates } : field
      );
      return { ...previous, customFields: next };
    });
  };

  const addCustomField = () => {
    setFormState((previous) => ({
      ...previous,
      customFields: [
        ...previous.customFields,
        {
          key: `field_${previous.customFields.length + 1}`,
          labelKa: '',
          labelEn: '',
          type: 'text',
          required: false
        }
      ]
    }));
  };

  const removeCustomField = (index: number) => {
    setFormState((previous) => ({
      ...previous,
      customFields: previous.customFields.filter((_, idx) => idx !== index)
    }));
  };

  const buildPayload = (): Omit<ApplicationType, 'id'> => ({
    name: { ka: formState.nameKa.trim(), en: formState.nameEn.trim() },
    description: { ka: formState.descriptionKa.trim(), en: formState.descriptionEn.trim() },
    icon: formState.icon.trim() || 'Layers3',
    color: formState.color.trim() || 'bg-slate-500',
    fields: buildFields(formState),
    flow: formState.flow.filter((roleId, index, array) => roleId && array.indexOf(roleId) === index),
    slaPerStep: formState.sla.map((entry) => ({
      stepIndex: entry.stepIndex,
      seconds: Math.max(1, entry.hours) * 3600,
      onExpire: entry.onExpire
    })),
    capabilities: formState.capabilities,
    allowedRoleIds: Array.from(new Set(formState.allowedRoleIds.filter(Boolean)))
  });

  const handleSave = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!validateForm(formState)) {
      setErrorMessage(t.validationError);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const created = await createApplicationType(buildPayload());
        setStatusMessage(t.successCreated);
        setMode('view');
        setSelectedTypeId(created.id);
        setAllowedRolesOpen(false);
      } else if (selectedType) {
        await updateApplicationType({ id: selectedType.id, ...buildPayload() });
        setStatusMessage(t.successUpdated);
        setMode('view');
        setAllowedRolesOpen(false);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('ქმედება ვერ შესრულდა, სცადეთ ხელახლა.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) {
      return;
    }
    const confirmMessage =
      language === 'ka'
        ? 'დარწმუნებული ხართ, რომ გსურთ ტიპის წაშლა?'
        : 'Are you sure you want to delete this type?';
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const deleted = await deleteApplicationType(selectedType.id);
      if (deleted) {
        setStatusMessage(t.successDeleted);
        setMode(applicationTypes.length > 1 ? 'view' : 'create');
        const nextSelected = applicationTypes.find((type) => type.id !== selectedType.id);
        setSelectedTypeId(nextSelected?.id ?? null);
        setFormState(nextSelected ? buildFormStateFromType(nextSelected) : buildDefaultFormState());
        setAllowedRolesOpen(false);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('ტიპის წაშლა ვერ მოხერხდა.');
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 h-5 w-5" />
          <div>
            <h2 className="text-lg font-semibold">{t.title}</h2>
            <p className="mt-1 text-sm">{t.noPermission}</p>
          </div>
        </div>
      </div>
    );
  }

  const IconPreview = getIconComponent(formState.icon);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
          <p className="mt-2 text-slate-600">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          {t.create}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-3">
          {applicationTypes.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
              {t.empty}
            </div>
          )}

          {applicationTypes.map((type) => {
            const Icon = getIconComponent(type.icon);
            const active = selectedTypeId === type.id && mode !== 'create';
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setSelectedTypeId(type.id);
                  setMode('view');
                  setFormState(buildFormStateFromType(type));
                  setStatusMessage(null);
                  setErrorMessage(null);
                }}
                className={`w-full rounded-2xl border px-5 py-4 text-left shadow-sm transition ${
                  active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${type.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{type.name[language]}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{type.description[language]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">
                {mode === 'create' ? t.create : mode === 'edit' ? t.edit : t.view}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === 'create' ? t.subtitle : selectedType?.description[language] ?? t.subtitle}
              </p>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${formState.color}`}>
              <IconPreview className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t.basicInformation}
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="nameKa">
                    {t.nameKa}
                  </label>
                  <input
                    id="nameKa"
                    value={formState.nameKa}
                    onChange={(event) => setFormState((prev) => ({ ...prev, nameKa: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="nameEn">
                    {t.nameEn}
                  </label>
                  <input
                    id="nameEn"
                    value={formState.nameEn}
                    onChange={(event) => setFormState((prev) => ({ ...prev, nameEn: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="descriptionKa">
                    {t.descriptionKa}
                  </label>
                  <textarea
                    id="descriptionKa"
                    rows={3}
                    value={formState.descriptionKa}
                    onChange={(event) => setFormState((prev) => ({ ...prev, descriptionKa: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="descriptionEn">
                    {t.descriptionEn}
                  </label>
                  <textarea
                    id="descriptionEn"
                    rows={3}
                    value={formState.descriptionEn}
                    onChange={(event) => setFormState((prev) => ({ ...prev, descriptionEn: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="icon">
                    {t.iconLabel}
                  </label>
                  <input
                    id="icon"
                    value={formState.icon}
                    onChange={(event) => setFormState((prev) => ({ ...prev, icon: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="color">
                    {t.colorLabel}
                  </label>
                  <input
                    id="color"
                    value={formState.color}
                    onChange={(event) => setFormState((prev) => ({ ...prev, color: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400">{t.colorHint}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {t.fieldSettings}
                </h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">{t.reasonLabel}</label>
                  <input
                    value={formState.reasonLabelKa}
                    onChange={(event) => setFormState((prev) => ({ ...prev, reasonLabelKa: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ქართული"
                  />
                  <input
                    value={formState.reasonLabelEn}
                    onChange={(event) => setFormState((prev) => ({ ...prev, reasonLabelEn: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="English"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">{t.commentLabel}</label>
                  <input
                    value={formState.commentLabelKa}
                    onChange={(event) => setFormState((prev) => ({ ...prev, commentLabelKa: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ქართული"
                  />
                  <input
                    value={formState.commentLabelEn}
                    onChange={(event) => setFormState((prev) => ({ ...prev, commentLabelEn: event.target.value }))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="English"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(formState.capabilities).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          capabilities: {
                            ...prev.capabilities,
                            [key]: event.target.checked
                          }
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t.toggles[key as keyof ApplicationTypeCapabilities]}
                  </label>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t.allowedRoles}
              </h3>
              <div className="relative max-w-xl" ref={allowedRolesDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAllowedRolesOpen((previous) => !previous)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                >
                  <span>
                    {selectedRoles.length
                      ? selectedRoles.map((role) => role.name).join(', ')
                      : t.selectRole}
                  </span>
                  <Layers3 className="h-4 w-4 text-slate-400" />
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
                                setFormState((prev) => ({
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
                          : t.selectRole}
                      </span>
                      {selectedRoles.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, allowedRoleIds: [] }))}
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
                <p className="text-xs text-slate-500">{t.selectRole}</p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {t.customFieldTitle}
                </h3>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {t.addCustomField}
                </button>
              </div>
              <div className="space-y-4">
                {formState.customFields.map((field, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="grid flex-1 gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold uppercase text-slate-500">{t.fieldKey}</label>
                          <input
                            value={field.key}
                            onChange={(event) => handleCustomFieldChange(index, { key: event.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold uppercase text-slate-500">{t.fieldType}</label>
                          <select
                            value={field.type}
                            onChange={(event) => handleCustomFieldChange(index, { type: event.target.value as CustomFieldType })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {(Object.keys(t.customFieldTypes) as CustomFieldType[]).map((option) => (
                              <option key={option} value={option}>
                                {t.customFieldTypes[option]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold uppercase text-slate-500">{t.fieldLabelKa}</label>
                          <input
                            value={field.labelKa}
                            onChange={(event) => handleCustomFieldChange(index, { labelKa: event.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold uppercase text-slate-500">{t.fieldLabelEn}</label>
                          <input
                            value={field.labelEn}
                            onChange={(event) => handleCustomFieldChange(index, { labelEn: event.target.value })}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 md:mt-0 md:flex-col md:items-end md:justify-center">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(event) => handleCustomFieldChange(index, { required: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          {t.fieldRequired}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {language === 'ka' ? 'წაშლა' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {t.flowTitle}
                </h3>
                <button
                  type="button"
                  onClick={handleAddFlowStep}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {t.addStep}
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
                      onChange={(event) => handleFlowRoleChange(index, Number(event.target.value))}
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
                      onClick={() => handleRemoveFlowStep(index)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {t.slaTitle}
              </h3>
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
                      onChange={(event) => handleSlaChange(entry.stepIndex, { hours: Number(event.target.value) })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t.hours}
                    />
                    <select
                      value={entry.onExpire}
                      onChange={(event) => handleSlaChange(entry.stepIndex, { onExpire: event.target.value as ApplicationStepSLA['onExpire'] })}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.keys(t.expireActions) as ApplicationStepSLA['onExpire'][]).map((option) => (
                        <option key={option} value={option}>
                          {t.expireActions[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {errorMessage && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-600">{errorMessage}</p>}
          {statusMessage && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{statusMessage}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? t.actions.saving : t.actions.save}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {t.actions.cancel}
            </button>
            {mode !== 'create' && selectedType && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <PencilLine className="h-4 w-4" />
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.actions.delete}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
