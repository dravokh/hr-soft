import { useMemo } from 'react';
import { ApplicationBundle, ApplicationType, User } from '../../../types';

interface UseApplicationDataProps {
  applications: ApplicationBundle[];
  currentUser: User | null;
  typeById: Map<number, ApplicationType>;
}

export const useApplicationData = ({
  applications,
  currentUser,
  typeById
}: UseApplicationDataProps) => {
  const accessibleApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    const roleId = currentUser.roleId;

    return applications.filter((bundle) => {
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }

      const isRequester = bundle.application.requesterId === currentUser.id;
      const isInFlow = type.flow.includes(roleId);
      const isDelegate = bundle.delegates.some((delegate) => delegate.delegateUserId === currentUser.id);

      return isRequester || isInFlow || isDelegate;
    });
  }, [applications, currentUser, typeById]);

  const pendingApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    const roleId = currentUser.roleId;

    return accessibleApplications.filter((bundle) => {
      if (bundle.application.status !== 'PENDING') {
        return false;
      }
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }
      const currentRole = type.flow[bundle.application.currentStepIndex];
      const isDelegate = bundle.delegates.some(
        (delegate) => delegate.forRoleId === currentRole && delegate.delegateUserId === currentUser.id
      );
      return currentRole === roleId || isDelegate;
    });
  }, [accessibleApplications, currentUser, typeById]);

  const sentApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    return accessibleApplications.filter((bundle) => bundle.application.requesterId === currentUser.id);
  }, [accessibleApplications, currentUser]);

  const returnedApplications = useMemo(() => {
    return accessibleApplications.filter((bundle) => {
      if (bundle.application.status === 'REJECTED' || bundle.application.currentStepIndex < 0) {
        return true;
      }
      const lastEntry = bundle.auditTrail[bundle.auditTrail.length - 1];
      return lastEntry?.action === 'REJECT' || lastEntry?.action === 'EXPIRE_BOUNCE';
    });
  }, [accessibleApplications]);

  return {
    accessibleApplications,
    pendingApplications,
    sentApplications,
    returnedApplications
  };
};
