import { MutableRefObject } from 'react';

import {
  Application,
  ApplicationBundle,
  ApplicationFieldValue,
  ApplicationType,
  Attachment,
  AuditLog
} from '../../types';
import { computeDueDate, refreshApplicationTiming } from './normalizers';

export interface MutationRefs {
  auditIdRef: MutableRefObject<number>;
  attachmentIdRef: MutableRefObject<number>;
  delegateIdRef: MutableRefObject<number>;
}

export const createApplicationMutations = ({
  auditIdRef,
  attachmentIdRef,
  delegateIdRef
}: MutationRefs) => {
  const applyApprove = (
    bundle: ApplicationBundle,
    actorId: number | null,
    action: 'APPROVE' | 'AUTO_APPROVE',
    comment?: string,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    if (!typesSource) {
      return bundle;
    }
    const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
    if (!type) {
      return bundle;
    }

    const now = new Date().toISOString();
    const lastStep = type.flow.length - 1;
    const isFinalStep = bundle.application.currentStepIndex >= lastStep;
    const nextApplication: Application = {
      ...bundle.application,
      status: isFinalStep ? 'APPROVED' : 'PENDING',
      currentStepIndex: isFinalStep
        ? bundle.application.currentStepIndex
        : bundle.application.currentStepIndex + 1,
      submittedAt: bundle.application.submittedAt ?? now,
      dueAt: null,
      updatedAt: now
    };
    nextApplication.dueAt = computeDueDate(type, nextApplication, now);

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: nextApplication.id,
      actorId,
      action,
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  const applyReject = (
    bundle: ApplicationBundle,
    actorId: number | null,
    action: 'REJECT' | 'EXPIRE_BOUNCE',
    comment: string,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    if (!typesSource) {
      return bundle;
    }
    const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
    if (!type) {
      return bundle;
    }

    const now = new Date().toISOString();
    const previousStep = bundle.application.currentStepIndex - 1;
    const bounced = previousStep < 0;
    const nextApplication: Application = {
      ...bundle.application,
      status: bounced ? 'REJECTED' : 'PENDING',
      currentStepIndex: bounced ? -1 : previousStep,
      updatedAt: now,
      dueAt: null
    };
    nextApplication.dueAt = computeDueDate(type, nextApplication, now);

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: nextApplication.id,
      actorId,
      action,
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  const applySubmit = (
    bundle: ApplicationBundle,
    actorId: number,
    comment?: string,
    delegateUserId?: number,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    if (!typesSource) {
      return bundle;
    }
    const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
    if (!type) {
      return bundle;
    }

    const now = new Date().toISOString();
    const nextApplication: Application = {
      ...bundle.application,
      status: 'PENDING',
      currentStepIndex: 0,
      updatedAt: now,
      submittedAt: now,
      dueAt: null
    };
    nextApplication.dueAt = computeDueDate(type, nextApplication, now);

    const firstRoleId = type.flow[0];
    let delegates = bundle.delegates;
    if (delegateUserId) {
      delegates = [
        ...bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId),
        {
          id: delegateIdRef.current++,
          applicationId: bundle.application.id,
          forRoleId: firstRoleId,
          delegateUserId
        }
      ];
    } else if (bundle.delegates.some((delegate) => delegate.forRoleId === firstRoleId)) {
      delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId);
    }

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'SUBMIT',
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      auditTrail: [...bundle.auditTrail, auditEntry],
      delegates
    };
  };

  const applyResend = (
    bundle: ApplicationBundle,
    actorId: number,
    comment?: string,
    delegateUserId?: number,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    if (!typesSource) {
      return bundle;
    }
    const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
    if (!type) {
      return bundle;
    }

    const now = new Date().toISOString();
    const nextApplication: Application = {
      ...bundle.application,
      status: 'PENDING',
      currentStepIndex: 0,
      updatedAt: now,
      submittedAt: bundle.application.submittedAt ?? now,
      dueAt: null
    };
    nextApplication.dueAt = computeDueDate(type, nextApplication, now);

    const firstRoleId = type.flow[0];
    let delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId);
    if (delegateUserId) {
      delegates = [
        ...delegates,
        {
          id: delegateIdRef.current++,
          applicationId: bundle.application.id,
          forRoleId: firstRoleId,
          delegateUserId
        }
      ];
    }

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'RESEND',
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      auditTrail: [...bundle.auditTrail, auditEntry],
      delegates
    };
  };

  const applyClose = (
    bundle: ApplicationBundle,
    actorId: number,
    comment?: string
  ): ApplicationBundle => {
    const now = new Date().toISOString();
    const nextApplication: Application = {
      ...bundle.application,
      status: 'CLOSED',
      updatedAt: now,
      dueAt: null
    };

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'CLOSE',
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  const applyValuesUpdate = (
    bundle: ApplicationBundle,
    actorId: number,
    values: ApplicationFieldValue[],
    comment?: string,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    const type = typesSource?.find((candidate) => candidate.id === bundle.application.typeId);
    const now = new Date().toISOString();
    const updatedValues = values.map((value) => ({
      applicationId: bundle.application.id,
      key: value.key,
      value: value.value
    }));
    const nextApplication = refreshApplicationTiming(bundle.application, type, now);

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'EDIT',
      comment,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      values: updatedValues,
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  const applyAttachment = (
    bundle: ApplicationBundle,
    actorId: number,
    attachment: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    const type = typesSource?.find((candidate) => candidate.id === bundle.application.typeId);
    const now = new Date().toISOString();
    const nextApplication = refreshApplicationTiming(bundle.application, type, now);

    const newAttachment: Attachment = {
      id: attachmentIdRef.current++,
      applicationId: bundle.application.id,
      name: attachment.name,
      url: attachment.url,
      uploadedBy: attachment.uploadedBy,
      createdAt: now
    };

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'EDIT',
      comment: attachment.name ? `დაემატა ფაილი: ${attachment.name}` : undefined,
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      attachments: [...bundle.attachments, newAttachment],
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  const applyDelegate = (
    bundle: ApplicationBundle,
    actorId: number,
    forRoleId: number,
    delegateUserId: number | null,
    typesSource?: ApplicationType[]
  ): ApplicationBundle => {
    const type = typesSource?.find((candidate) => candidate.id === bundle.application.typeId);
    const now = new Date().toISOString();
    const nextApplication = refreshApplicationTiming(bundle.application, type, now);

    let delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== forRoleId);
    if (delegateUserId) {
      delegates = [
        ...delegates,
        {
          id: delegateIdRef.current++,
          applicationId: bundle.application.id,
          forRoleId,
          delegateUserId
        }
      ];
    }

    const auditEntry: AuditLog = {
      id: auditIdRef.current++,
      applicationId: bundle.application.id,
      actorId,
      action: 'EDIT',
      comment: 'განახლდა პასუხისმგებელი ან დელეგატი.',
      at: now
    };

    return {
      ...bundle,
      application: nextApplication,
      delegates,
      auditTrail: [...bundle.auditTrail, auditEntry]
    };
  };

  return {
    applyApprove,
    applyReject,
    applySubmit,
    applyResend,
    applyClose,
    applyValuesUpdate,
    applyAttachment,
    applyDelegate
  };
};
