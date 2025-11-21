import type {
  ApplicationFieldDefinition,
  ApplicationType,
  ApplicationTypeCapabilities
} from '../../types';
import type { FormState, SlaFormEntry } from './types';
import { DEFAULT_COMMENT_PLACEHOLDER, DEFAULT_REASON_PLACEHOLDER } from './copy';

export const coerceUsageCapabilities = (
  capabilities: ApplicationTypeCapabilities
): ApplicationTypeCapabilities => {
  const next: ApplicationTypeCapabilities = { ...capabilities };
  if (next.usesVacationCalculator) {
    next.requiresDateRange = true;
    next.dateRangeRequired = true;
  }
  if (next.usesGracePeriodTracker || next.usesPenaltyTracker) {
    next.requiresTimeRange = true;
    next.timeRangeRequired = true;
  }
  if (next.usesExtraBonusTracker) {
    next.requiresDateRange = true;
    next.dateRangeRequired = true;
    next.requiresTimeRange = true;
    next.timeRangeRequired = true;
  }
  return next;
};

export const syncSlaWithFlow = (flow: number[], current: SlaFormEntry[]): SlaFormEntry[] => {
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

export const buildDefaultFormState = (): FormState => ({
  nameKa: '',
  descriptionKa: '',
  capabilities: coerceUsageCapabilities({
    requiresDateRange: true,
    dateRangeRequired: true,
    requiresTimeRange: false,
    timeRangeRequired: false,
    hasCommentField: true,
    commentRequired: false,
    allowsAttachments: true,
    attachmentsRequired: false,
    attachmentMaxSizeMb: 50,
    usesVacationCalculator: false,
    usesGracePeriodTracker: false,
    usesPenaltyTracker: false,
    usesExtraBonusTracker: false
  }),
  flow: [],
  sla: [],
  allowedRoleIds: []
});

export const buildFormStateFromType = (type: ApplicationType): FormState => {
  const form: FormState = {
    nameKa: type.name.ka,
    descriptionKa: type.description.ka,
    capabilities: coerceUsageCapabilities({
      requiresDateRange: type.capabilities.requiresDateRange,
      dateRangeRequired: type.capabilities.dateRangeRequired,
      requiresTimeRange: type.capabilities.requiresTimeRange,
      timeRangeRequired: type.capabilities.timeRangeRequired,
      hasCommentField: type.capabilities.hasCommentField,
      commentRequired: type.capabilities.commentRequired,
      allowsAttachments: type.capabilities.allowsAttachments,
      attachmentsRequired: type.capabilities.attachmentsRequired,
      attachmentMaxSizeMb: type.capabilities.attachmentMaxSizeMb,
      usesVacationCalculator: Boolean(type.capabilities.usesVacationCalculator),
      usesGracePeriodTracker: Boolean(type.capabilities.usesGracePeriodTracker),
      usesPenaltyTracker: Boolean(type.capabilities.usesPenaltyTracker),
      usesExtraBonusTracker: Boolean(type.capabilities.usesExtraBonusTracker)
    }),
    flow: [...type.flow],
    sla: type.slaPerStep.map((entry) => ({
      stepIndex: entry.stepIndex,
      hours: Math.max(1, Math.round(entry.seconds / 3600)),
      onExpire: entry.onExpire
    })),
    allowedRoleIds: [...type.allowedRoleIds]
  };
  form.sla = syncSlaWithFlow(form.flow, form.sla);
  return form;
};

const findFieldLabel = (type: ApplicationType | undefined, key: string, fallback: { ka: string; en: string }) => {
  if (!type) {
    return fallback;
  }
  const field = type.fields.find((candidate) => candidate.key === key);
  return field ? field.label : fallback;
};

export const buildFields = (
  form: FormState,
  existing?: ApplicationType
): ApplicationFieldDefinition[] => {
  const fields: ApplicationFieldDefinition[] = [
    {
      key: 'reason',
      label: findFieldLabel(existing, 'reason', { ka: 'განაცხადის მიზანი', en: 'Purpose' }),
      type: 'textarea',
      required: true,
      placeholder: DEFAULT_REASON_PLACEHOLDER
    }
  ];

  if (form.capabilities.requiresDateRange) {
    fields.push({
      key: 'start_date',
      label: findFieldLabel(existing, 'start_date', { ka: 'დაწყების თარიღი', en: 'Start date' }),
      type: 'date',
      required: form.capabilities.dateRangeRequired
    });
    fields.push({
      key: 'end_date',
      label: findFieldLabel(existing, 'end_date', { ka: 'დასრულების თარიღი', en: 'End date' }),
      type: 'date',
      required: form.capabilities.dateRangeRequired
    });
  }

  if (form.capabilities.requiresTimeRange) {
    fields.push({
      key: 'start_time',
      label: { ka: 'დაწყების დრო', en: 'Start time' },
      type: 'time',
      required: form.capabilities.timeRangeRequired
    });
    fields.push({
      key: 'end_time',
      label: { ka: 'დასრულების დრო', en: 'End time' },
      type: 'time',
      required: form.capabilities.timeRangeRequired
    });
  }

  if (form.capabilities.hasCommentField) {
    fields.push({
      key: 'additional_comment',
      label: findFieldLabel(existing, 'additional_comment', {
        ka: 'დამატებითი კომენტარი',
        en: 'Additional comment'
      }),
      type: 'textarea',
      required: form.capabilities.commentRequired,
      placeholder: DEFAULT_COMMENT_PLACEHOLDER
    });
  }

  return fields;
};

export const validateForm = (form: FormState): boolean => {
  if (!form.nameKa.trim()) {
    return false;
  }
  if (!form.descriptionKa.trim()) {
    return false;
  }
  if (!form.flow.length) {
    return false;
  }
  return true;
};
