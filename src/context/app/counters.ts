import { MutableRefObject } from 'react';

import { ApplicationBundle } from '../../types';

export interface CounterRefs {
  applicationIdRef: MutableRefObject<number>;
  attachmentIdRef: MutableRefObject<number>;
  auditIdRef: MutableRefObject<number>;
  delegateIdRef: MutableRefObject<number>;
}

export const syncCounters = (
  bundles: ApplicationBundle[],
  { applicationIdRef, attachmentIdRef, auditIdRef, delegateIdRef }: CounterRefs
): void => {
  const nextApplicationId =
    bundles.reduce((max, bundle) => Math.max(max, bundle.application.id), 0) + 1;
  const nextAttachmentId =
    bundles.reduce((outerMax, bundle) => {
      const localMax = bundle.attachments.reduce(
        (innerMax, attachment) => Math.max(innerMax, attachment.id),
        0
      );
      return Math.max(outerMax, localMax);
    }, 0) + 1;
  const nextAuditId =
    bundles.reduce((outerMax, bundle) => {
      const localMax = bundle.auditTrail.reduce(
        (innerMax, entry) => Math.max(innerMax, entry.id),
        0
      );
      return Math.max(outerMax, localMax);
    }, 0) + 1;
  const nextDelegateId =
    bundles.reduce((outerMax, bundle) => {
      const localMax = bundle.delegates.reduce(
        (innerMax, entry) => Math.max(innerMax, entry.id),
        0
      );
      return Math.max(outerMax, localMax);
    }, 0) + 1;

  applicationIdRef.current = nextApplicationId;
  attachmentIdRef.current = nextAttachmentId;
  auditIdRef.current = nextAuditId;
  delegateIdRef.current = nextDelegateId;
};
