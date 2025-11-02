import type {
  ApplicationStepSLA,
  ApplicationType,
  ApplicationTypeCapabilities,
  ApplicationFieldDefinition
} from '../../types';

export type Mode = 'view' | 'edit' | 'create';
export interface SlaFormEntry {
  stepIndex: number;
  hours: number;
  onExpire: ApplicationStepSLA['onExpire'];
}

export interface FormState {
  nameKa: string;
  descriptionKa: string;
  capabilities: ApplicationTypeCapabilities;
  flow: number[];
  sla: SlaFormEntry[];
  allowedRoleIds: number[];
}

export type {
  ApplicationType,
  ApplicationFieldDefinition,
  ApplicationTypeCapabilities,
  ApplicationStepSLA
};
