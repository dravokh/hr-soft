import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Layers3
} from 'lucide-react';
import type { ApplicationFieldDefinition, ApplicationType } from '../../types';
import type { CustomFieldForm, FormState, SlaFormEntry, CustomFieldType } from './types';
import { DEFAULT_COMMENT_PLACEHOLDER, DEFAULT_REASON_PLACEHOLDER } from './copy';

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

export const extractCustomFields = (fields: ApplicationFieldDefinition[]): CustomFieldForm[] => {
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
  allowedRoleIds: [],
  reasonLabelKa: 'განაცხადის მიზანი',
  reasonLabelEn: 'Purpose',
  commentLabelKa: 'დამატებითი კომენტარი',
  commentLabelEn: 'Additional comment',
  customFields: []
});

export const buildFormStateFromType = (type: ApplicationType): FormState => {
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

export const buildFields = (form: FormState): ApplicationFieldDefinition[] => {
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
