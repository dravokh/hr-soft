import type {
  ApplicationStepSLA,
  ApplicationType,
  ApplicationTypeCapabilities,
  ApplicationFieldDefinition
} from '../../types';

export type Mode = 'view' | 'edit' | 'create';

export type CustomFieldType = 'text' | 'number' | 'textarea';

export interface CustomFieldForm {
  key: string;
  labelKa: string;
  labelEn: string;
  type: CustomFieldType;
  required: boolean;
}

export interface SlaFormEntry {
  stepIndex: number;
  hours: number;
  onExpire: ApplicationStepSLA['onExpire'];
}

export interface FormState {
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

export type {
  ApplicationType,
  ApplicationFieldDefinition,
  ApplicationTypeCapabilities,
  ApplicationStepSLA
};
