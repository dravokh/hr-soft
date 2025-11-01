import React from 'react';
import { CalendarDays, Clock3, Layers3, Plane } from 'lucide-react';
import type { ApplicationFieldDefinition, ApplicationType } from '../../types';
import type { FormState, SlaFormEntry } from './types';
import { DEFAULT_COMMENT_PLACEHOLDER, DEFAULT_REASON_PLACEHOLDER } from './copy';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarDays,
  Clock3,
  Layers3,
  Plane
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

export const getIconComponent = (iconName: string) => {
  const Component = ICON_MAP[iconName];
  return Component ?? Layers3;
};

export const buildDefaultFormState = (): FormState => ({
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
  allowedRoleIds: []
});

export const buildFormStateFromType = (type: ApplicationType): FormState => {
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
      label: findFieldLabel(existing, 'additional_comment', {
        ka: 'დამატებითი კომენტარი',
        en: 'Additional comment'
      }),
      type: 'textarea',
      required: false,
      placeholder: DEFAULT_COMMENT_PLACEHOLDER
    });
  }

  return fields;
};

export const validateForm = (form: FormState): boolean => {
  if (!form.nameKa.trim() || !form.nameEn.trim()) {
    return false;
  }
  if (!form.descriptionKa.trim() || !form.descriptionEn.trim()) {
    return false;
  }
  if (!form.flow.length) {
    return false;
  }
  return true;
};
