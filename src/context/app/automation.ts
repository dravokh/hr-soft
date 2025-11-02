import { ApplicationBundle, ApplicationType } from '../../types';
import { computeDueDate } from './normalizers';

interface AutomationActions {
  applyApprove: (
    bundle: ApplicationBundle,
    actorId: number | null,
    action: 'APPROVE' | 'AUTO_APPROVE',
    comment?: string,
    typesSource?: ApplicationType[]
  ) => ApplicationBundle;
  applyReject: (
    bundle: ApplicationBundle,
    actorId: number | null,
    action: 'REJECT' | 'EXPIRE_BOUNCE',
    comment: string,
    typesSource?: ApplicationType[]
  ) => ApplicationBundle;
}

export const runSlaAutomation = (
  bundles: ApplicationBundle[],
  typesSource: ApplicationType[],
  { applyApprove, applyReject }: AutomationActions
): ApplicationBundle[] => {
  if (!typesSource.length) {
    return bundles;
  }

  const now = Date.now();
  let mutated = false;

  const processed = bundles.map((bundle) => {
    const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
    if (!type) {
      if (bundle.application.dueAt) {
        mutated = true;
        return {
          ...bundle,
          application: { ...bundle.application, dueAt: null }
        };
      }
      return bundle;
    }

    if (bundle.application.status !== 'PENDING') {
      if (bundle.application.dueAt) {
        mutated = true;
        return {
          ...bundle,
          application: { ...bundle.application, dueAt: null }
        };
      }
      return bundle;
    }

    const recalculatedDue = computeDueDate(type, bundle.application);
    const sla = type.slaPerStep.find((entry) => entry.stepIndex === bundle.application.currentStepIndex);
    let working = bundle;

    if (recalculatedDue !== bundle.application.dueAt) {
      mutated = true;
      working = {
        ...working,
        application: { ...working.application, dueAt: recalculatedDue }
      };
    }

    if (!recalculatedDue) {
      return working;
    }

    if (sla && new Date(recalculatedDue).getTime() <= now) {
      mutated = true;
      if (sla.onExpire === 'AUTO_APPROVE') {
        working = applyApprove(
          working,
          null,
          'AUTO_APPROVE',
          'ავტომატურად დამტკიცდა ვადის ამოწურვის გამო.',
          typesSource
        );
      } else {
        working = applyReject(
          working,
          null,
          'EXPIRE_BOUNCE',
          'ვადის ამოწურვის გამო განაცხადი დაბრუნდა ავტორს.',
          typesSource
        );
      }
    }

    return working;
  });

  return mutated ? processed : bundles;
};
