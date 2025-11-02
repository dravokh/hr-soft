import { ApplicationFieldDefinition, ApplicationTypeCapabilities } from '../../types';

export const FIELD_TEMPLATES: Record<
  'reason' | 'start_date' | 'end_date' | 'start_time' | 'end_time' | 'additional_comment',
  ApplicationFieldDefinition
> = {
  reason: {
    key: 'reason',
    label: { ka: 'მიზანი', en: 'Purpose' },
    type: 'textarea',
    required: true,
    placeholder: {
      ka: 'მოკლედ აღწერეთ განაცხადის მიზეზი…',
      en: 'Describe why you are submitting this request…'
    }
  },
  start_date: {
    key: 'start_date',
    label: { ka: 'დაწყების თარიღი', en: 'Start date' },
    type: 'date',
    required: true
  },
  end_date: {
    key: 'end_date',
    label: { ka: 'დასრულების თარიღი', en: 'End date' },
    type: 'date',
    required: true
  },
  start_time: {
    key: 'start_time',
    label: { ka: 'დაწყების დრო', en: 'Start time' },
    type: 'time',
    required: false
  },
  end_time: {
    key: 'end_time',
    label: { ka: 'დასრულების დრო', en: 'End time' },
    type: 'time',
    required: false
  },
  additional_comment: {
    key: 'additional_comment',
    label: { ka: 'დამატებითი კომენტარი', en: 'Additional comment' },
    type: 'textarea',
    required: false,
    placeholder: {
      ka: 'მიუთითეთ დამატებითი ინფორმაცია…',
      en: 'Provide any extra context…'
    }
  }
};

export const FIELD_KEYS = new Set(Object.keys(FIELD_TEMPLATES));

export const ensureCapabilities = (
  capabilities?: Partial<ApplicationTypeCapabilities>
): ApplicationTypeCapabilities => ({
  requiresDateRange: capabilities?.requiresDateRange ?? false,
  dateRangeRequired: capabilities?.dateRangeRequired ?? false,
  requiresTimeRange: capabilities?.requiresTimeRange ?? false,
  timeRangeRequired: capabilities?.timeRangeRequired ?? false,
  hasCommentField: capabilities?.hasCommentField ?? false,
  commentRequired: capabilities?.commentRequired ?? false,
  allowsAttachments: capabilities?.allowsAttachments ?? false,
  attachmentsRequired: capabilities?.attachmentsRequired ?? false,
  attachmentMaxSizeMb: capabilities?.attachmentMaxSizeMb ?? 50
});

export const buildFieldsForCapabilities = (
  existing: ApplicationFieldDefinition[] | undefined,
  capabilities: ApplicationTypeCapabilities
): ApplicationFieldDefinition[] => {
  const base = existing ?? [];
  const byKey = new Map(base.map((field) => [field.key, field] as const));

  const ensureField = (
    key: keyof typeof FIELD_TEMPLATES,
    overrides?: Partial<ApplicationFieldDefinition>
  ): ApplicationFieldDefinition => {
    const template = FIELD_TEMPLATES[key];
    const current = byKey.get(key);
    return {
      ...template,
      ...(current ?? {}),
      ...(overrides ?? {}),
      key,
      type: template.type,
      required: overrides?.required ?? current?.required ?? template.required
    };
  };

  const fields: ApplicationFieldDefinition[] = [ensureField('reason')];

  if (capabilities.requiresDateRange) {
    fields.push(ensureField('start_date', { required: capabilities.dateRangeRequired ?? true }));
    fields.push(ensureField('end_date', { required: capabilities.dateRangeRequired ?? true }));
  }

  if (capabilities.requiresTimeRange) {
    fields.push(ensureField('start_time', { required: capabilities.timeRangeRequired ?? false }));
    fields.push(ensureField('end_time', { required: capabilities.timeRangeRequired ?? false }));
  }

  if (capabilities.hasCommentField) {
    fields.push(
      ensureField('additional_comment', { required: capabilities.commentRequired ?? false })
    );
  }

  const customFields = base.filter((field) => !FIELD_KEYS.has(field.key));
  const seen = new Set(fields.map((field) => field.key));
  for (const field of customFields) {
    if (seen.has(field.key)) {
      continue;
    }
    fields.push(field);
    seen.add(field.key);
  }

  return fields;
};
