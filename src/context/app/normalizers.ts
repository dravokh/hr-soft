import {
  Application,
  ApplicationBundle,
  ApplicationStepSLA,
  ApplicationType
} from '../../types';
import { buildFieldsForCapabilities, ensureCapabilities } from './fields';

export const buildApplicationNumber = (id: number, createdAt: string): string => {
  const year = new Date(createdAt).getFullYear();
  return `TKT-${year}-${id.toString().padStart(5, '0')}`;
};

export const normalizeApplicationType = (type: ApplicationType): ApplicationType => {
  const capabilities = ensureCapabilities(type.capabilities);
  const allowedRoleIds = Array.from(new Set(type.allowedRoleIds ?? [])).filter((id) =>
    Number.isFinite(id)
  );
  const fields = buildFieldsForCapabilities(type.fields, capabilities);

  const flow = type.flow.filter((roleId, index, array) => roleId && array.indexOf(roleId) === index);
  const slaPerStep: ApplicationStepSLA[] = (Array.isArray(type.slaPerStep) ? type.slaPerStep : []).reduce<
    ApplicationStepSLA[]
  >((accumulator, entry) => {
    const normalized: ApplicationStepSLA = {
      stepIndex: Math.max(0, Math.min(entry.stepIndex, flow.length ? flow.length - 1 : 0)),
      seconds: entry.seconds > 0 ? entry.seconds : 0,
      onExpire: entry.onExpire === 'BOUNCE_BACK' ? 'BOUNCE_BACK' : 'AUTO_APPROVE'
    };

    if (flow[normalized.stepIndex] !== undefined) {
      accumulator.push(normalized);
    }

    return accumulator;
  }, []);

  return {
    ...type,
    capabilities,
    allowedRoleIds,
    fields,
    flow,
    slaPerStep
  };
};

export const normalizeApplicationTypeList = (types: ApplicationType[]): ApplicationType[] =>
  types.map((type) => normalizeApplicationType(type));

export const computeDueDate = (
  type: ApplicationType | undefined,
  application: Application,
  baseTime?: string
): string | null => {
  if (!type || application.status !== 'PENDING') {
    return null;
  }

  const sla = type.slaPerStep.find((entry) => entry.stepIndex === application.currentStepIndex);
  if (!sla) {
    return null;
  }

  const base = new Date(baseTime ?? application.updatedAt);
  return new Date(base.getTime() + sla.seconds * 1000).toISOString();
};

export const normalizeApplicationBundle = (
  bundle: ApplicationBundle,
  types: ApplicationType[]
): ApplicationBundle => {
  const type = types.find((candidate) => candidate.id === bundle.application.typeId);
  const normalizedApplication: Application = {
    ...bundle.application,
    number: bundle.application.number ?? buildApplicationNumber(bundle.application.id, bundle.application.createdAt),
    submittedAt:
      bundle.application.submittedAt ??
      (bundle.application.status !== 'DRAFT' ? bundle.application.createdAt : null),
    dueAt: null
  };

  if (normalizedApplication.status === 'PENDING') {
    normalizedApplication.dueAt = computeDueDate(type, normalizedApplication);
  }

  const normalizedAttachments = bundle.attachments.map((attachment) => ({
    ...attachment,
    applicationId: bundle.application.id
  }));

  const normalizedValues = bundle.values.map((value) => ({
    ...value,
    applicationId: bundle.application.id
  }));

  const normalizedExtraBonus = bundle.extraBonus
    ? {
        ...bundle.extraBonus,
        applicationId: bundle.application.id
      }
    : null;

  return {
    ...bundle,
    application: normalizedApplication,
    attachments: normalizedAttachments,
    values: normalizedValues,
    delegates: bundle.delegates ?? [],
    extraBonus: normalizedExtraBonus
  };
};

export const normalizeApplications = (
  bundles: ApplicationBundle[],
  types: ApplicationType[]
): ApplicationBundle[] => bundles.map((bundle) => normalizeApplicationBundle(bundle, types));

export const refreshApplicationTiming = (
  application: Application,
  type: ApplicationType | undefined,
  timestamp: string
): Application => {
  const updated: Application = { ...application, updatedAt: timestamp };

  if (updated.status === 'PENDING') {
    updated.dueAt = computeDueDate(type, updated, timestamp);
  } else {
    updated.dueAt = null;
  }

  return updated;
};
