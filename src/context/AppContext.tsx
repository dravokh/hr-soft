import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  AppContextValue,
  Application,
  ApplicationBundle,
  ApplicationFieldValue,
  ApplicationType,
  Attachment,
  AuditLog,
  LoginResult,
  Role,
  Session,
  User
} from '../types';
import { storage } from '../utils/storage';
import { runSlaAutomation } from './app/automation';
import { syncCounters } from './app/counters';
import {
  DEFAULT_APPLICATIONS,
  DEFAULT_APPLICATION_TYPES,
  DEFAULT_ROLES,
  DEFAULT_USERS,
  StoredUser
} from './app/defaults';
import { createApplicationMutations } from './app/mutations';
import {
  buildApplicationNumber,
  normalizeApplicationBundle,
  normalizeApplicationType,
  normalizeApplicationTypeList,
  normalizeApplications
} from './app/normalizers';
import { ensureAdminPermissions } from './app/permissions';
import { STORAGE_KEYS } from './app/storageKeys';

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [applications, setApplications] = useState<ApplicationBundle[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const applicationTypeIdRef = useRef(1);
  const applicationIdRef = useRef(1);
  const attachmentIdRef = useRef(1);
  const auditIdRef = useRef(1);
  const delegateIdRef = useRef(1);

  const {
    applyApprove,
    applyReject,
    applySubmit,
    applyResend,
    applyClose,
    applyValuesUpdate,
    applyAttachment,
    applyDelegate
  } = useMemo(
    () => createApplicationMutations({ auditIdRef, attachmentIdRef, delegateIdRef }),
    [auditIdRef, attachmentIdRef, delegateIdRef]
  );

  const applyAutomation = useCallback(
    (bundles: ApplicationBundle[], typesSource: ApplicationType[]) =>
      runSlaAutomation(bundles, typesSource, { applyApprove, applyReject }),
    [applyApprove, applyReject]
  );

  const recomputeApplications = useCallback(
    (bundles: ApplicationBundle[], typesSource: ApplicationType[]) => {
      const normalized = normalizeApplications(bundles, typesSource);
      const processed = applyAutomation(normalized, typesSource);
      storage.set(STORAGE_KEYS.APPLICATIONS, processed);
      syncCounters(processed, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
      return processed;
    },
    [applyAutomation, applicationIdRef, attachmentIdRef, auditIdRef, delegateIdRef]
  );

  const saveApplications = useCallback(
    async (
      nextBundlesOrUpdater:
        | ApplicationBundle[]
        | ((current: ApplicationBundle[]) => ApplicationBundle[])
    ): Promise<ApplicationBundle[]> => {
      let processed: ApplicationBundle[] = [];
      setApplications((previous) => {
        const base =
          typeof nextBundlesOrUpdater === 'function'
            ? nextBundlesOrUpdater(previous)
            : nextBundlesOrUpdater;
        processed = recomputeApplications(base, applicationTypes);
        return processed;
      });
      return processed;
    },
    [applicationTypes, recomputeApplications]
  );

  const saveApplicationTypes = useCallback(
    async (
      nextTypes: ApplicationType[],
      applicationUpdater?: (current: ApplicationBundle[]) => ApplicationBundle[]
    ): Promise<void> => {
      const normalized = normalizeApplicationTypeList(nextTypes);
      applicationTypeIdRef.current =
        normalized.reduce((max, type) => Math.max(max, type.id), 0) + 1;
      setApplicationTypes(normalized);
      storage.set(STORAGE_KEYS.APPLICATION_TYPES, normalized);
      setApplications((prev) => {
        const base = applicationUpdater ? applicationUpdater(prev) : prev;
        return recomputeApplications(base, normalized);
      });
    },
    [recomputeApplications]
  );

  const createApplicationType = useCallback(
    async (payload: Omit<ApplicationType, 'id'>): Promise<ApplicationType> => {
      const typeId = applicationTypeIdRef.current++;
      const newType = normalizeApplicationType({ id: typeId, ...payload });
      const nextTypes = [...applicationTypes, newType];
      await saveApplicationTypes(nextTypes);
      return newType;
    },
    [applicationTypes, applicationTypeIdRef, saveApplicationTypes]
  );

  const updateApplicationType = useCallback(
    async (payload: ApplicationType): Promise<ApplicationType | null> => {
      const index = applicationTypes.findIndex((type) => type.id === payload.id);
      if (index === -1) {
        return null;
      }

      const normalized = normalizeApplicationType(payload);
      const nextTypes = applicationTypes.map((type) => (type.id === payload.id ? normalized : type));
      await saveApplicationTypes(nextTypes);
      return normalized;
    },
    [applicationTypes, applicationTypeIdRef, saveApplicationTypes]
  );

  const deleteApplicationType = useCallback(
    async (typeId: number): Promise<boolean> => {
      if (!applicationTypes.some((type) => type.id === typeId)) {
        return false;
      }

      const nextTypes = applicationTypes.filter((type) => type.id !== typeId);
      await saveApplicationTypes(nextTypes, (current) =>
        current.filter((bundle) => bundle.application.typeId !== typeId)
      );
      return true;
    },
    [applicationTypes, applicationTypeIdRef, saveApplicationTypes]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const storedRoles = storage.get<Role[]>(STORAGE_KEYS.ROLES);
      const resolvedRoles = ensureAdminPermissions(storedRoles ?? DEFAULT_ROLES);
      setRoles(resolvedRoles);
      storage.set(STORAGE_KEYS.ROLES, resolvedRoles);

      const storedUsers = storage.get<StoredUser[]>(STORAGE_KEYS.USERS);
      const resolvedUsers: User[] = (storedUsers ?? DEFAULT_USERS).map((user) => ({
        ...user,
        phone: user.phone ?? ''
      }));
      setUsers(resolvedUsers);
      storage.set(STORAGE_KEYS.USERS, resolvedUsers);

      const storedTypes = storage.get<ApplicationType[]>(STORAGE_KEYS.APPLICATION_TYPES);
      const resolvedTypes = normalizeApplicationTypeList(storedTypes ?? DEFAULT_APPLICATION_TYPES);
      applicationTypeIdRef.current =
        resolvedTypes.reduce((max, type) => Math.max(max, type.id), 0) + 1;
      setApplicationTypes(resolvedTypes);
      storage.set(STORAGE_KEYS.APPLICATION_TYPES, resolvedTypes);

      const storedBundles = storage.get<ApplicationBundle[]>(STORAGE_KEYS.APPLICATIONS);
      const normalizedBundles = normalizeApplications(storedBundles ?? DEFAULT_APPLICATIONS, resolvedTypes);
      const processedBundles = applyAutomation(normalizedBundles, resolvedTypes);
      setApplications(processedBundles);
      storage.set(STORAGE_KEYS.APPLICATIONS, processedBundles);
      syncCounters(processedBundles, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });

      const session = storage.get<Session>(STORAGE_KEYS.SESSION);
      if (session) {
        const sessionUser = resolvedUsers.find((user) => user.id === session.userId) ?? null;
        setCurrentUser(sessionUser);
        setIsAuthenticated(Boolean(sessionUser));
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [
    applyAutomation,
    applicationTypeIdRef,
    applicationIdRef,
    attachmentIdRef,
    auditIdRef,
    delegateIdRef
  ]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const user = users.find((candidate) => candidate.email === email && candidate.password === password);

      if (!user) {
        return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
      }

      const session: Session = { userId: user.id, timestamp: Date.now() };
      storage.set(STORAGE_KEYS.SESSION, session);
      setCurrentUser(user);
      setIsAuthenticated(true);

      return { success: true };
    },
    [users]
  );

  const logout = useCallback(async (): Promise<void> => {
    storage.remove(STORAGE_KEYS.SESSION);
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const saveRoles = useCallback(async (newRoles: Role[]): Promise<void> => {
    const nextRoles = ensureAdminPermissions(newRoles);
    setRoles(nextRoles);
    storage.set(STORAGE_KEYS.ROLES, nextRoles);
  }, []);

  const saveUsers = useCallback(async (newUsers: User[]): Promise<void> => {
    setUsers(newUsers);
    storage.set(STORAGE_KEYS.USERS, newUsers);
    setCurrentUser((previous) => {
      if (!previous) {
        return previous;
      }

      return newUsers.find((user) => user.id === previous.id) ?? previous;
    });
  }, []);

  const createApplication = useCallback(
    async (
      payload: Omit<
        Application,
        'id' | 'number' | 'status' | 'currentStepIndex' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'dueAt'
      > & {
        values: ApplicationFieldValue[];
        attachments: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>[];
        comment?: string;
      }
    ): Promise<ApplicationBundle> => {
      const createdAt = new Date().toISOString();
      const applicationId = applicationIdRef.current++;
      const number = buildApplicationNumber(applicationId, createdAt);

      const application: Application = {
        id: applicationId,
        number,
        typeId: payload.typeId,
        requesterId: payload.requesterId,
        status: 'DRAFT',
        currentStepIndex: -1,
        createdAt,
        updatedAt: createdAt,
        submittedAt: null,
        dueAt: null
      };

      const values = payload.values.map((value) => ({
        applicationId,
        key: value.key,
        value: value.value
      }));

      const attachments = payload.attachments.map((attachment) => ({
        id: attachmentIdRef.current++,
        applicationId,
        name: attachment.name,
        url: attachment.url,
        uploadedBy: attachment.uploadedBy,
        createdAt
      }));

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId,
        actorId: payload.requesterId,
        action: 'CREATE' as const,
        comment: payload.comment,
        at: createdAt
      };

      const newBundle: ApplicationBundle = {
        application,
        values,
        attachments,
        auditTrail: [auditEntry],
        delegates: []
      };

      const processed = await saveApplications((current) => [...current, newBundle]);
      return (
        processed.find((bundle) => bundle.application.id === applicationId) ??
        normalizeApplicationBundle(newBundle, applicationTypes)
      );
    },
    [
      applicationTypes,
      applicationIdRef,
      attachmentIdRef,
      auditIdRef,
      saveApplications
    ]
  );

  const submitApplication = useCallback(
    async (
      applicationId: number,
      actorId: number,
      comment?: string,
      delegateUserId?: number
    ): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applySubmit(bundle, actorId, comment, delegateUserId, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applySubmit, applicationTypes, saveApplications]
  );

  const approveApplication = useCallback(
    async (applicationId: number, actorId: number, comment?: string): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyApprove(bundle, actorId, 'APPROVE', comment, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyApprove, applicationTypes, saveApplications]
  );

  const rejectApplication = useCallback(
    async (applicationId: number, actorId: number, comment: string): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyReject(bundle, actorId, 'REJECT', comment, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyReject, applicationTypes, saveApplications]
  );

  const resendApplication = useCallback(
    async (
      applicationId: number,
      actorId: number,
      comment?: string,
      delegateUserId?: number
    ): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyResend(bundle, actorId, comment, delegateUserId, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyResend, applicationTypes, saveApplications]
  );

  const closeApplication = useCallback(
    async (applicationId: number, actorId: number, comment?: string): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyClose(bundle, actorId, comment);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyClose, saveApplications]
  );

  const addApplicationAttachment = useCallback(
    async (
      applicationId: number,
      attachment: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>,
      actorId: number
    ): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyAttachment(bundle, actorId, attachment, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyAttachment, applicationTypes, saveApplications]
  );

  const updateApplicationValues = useCallback(
    async (
      applicationId: number,
      actorId: number,
      values: ApplicationFieldValue[],
      comment?: string
    ): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyValuesUpdate(bundle, actorId, values, comment, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyValuesUpdate, applicationTypes, saveApplications]
  );

  const assignApplicationDelegate = useCallback(
    async (
      applicationId: number,
      forRoleId: number,
      delegateUserId: number | null,
      actorId: number
    ): Promise<ApplicationBundle | null> => {
      let mutated = false;
      const processed = await saveApplications((current) =>
        current.map((bundle) => {
          if (bundle.application.id !== applicationId) {
            return bundle;
          }
          mutated = true;
          return applyDelegate(bundle, actorId, forRoleId, delegateUserId, applicationTypes);
        })
      );

      if (!mutated) {
        return null;
      }

      return processed.find((bundle) => bundle.application.id === applicationId) ?? null;
    },
    [applyDelegate, applicationTypes, saveApplications]
  );

  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (!currentUser) {
        return false;
      }

      const userRole = roles.find((role) => role.id === currentUser.roleId);
      return Boolean(userRole?.permissions.includes(permissionId));
    },
    [currentUser, roles]
  );

  const value: AppContextValue = useMemo(
    () => ({
      roles,
      users,
      currentUser,
      isAuthenticated,
      loading,
      applicationTypes,
      applications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveApplicationTypes,
      saveApplications,
      createApplicationType,
      updateApplicationType,
      deleteApplicationType,
      createApplication,
      submitApplication,
      approveApplication,
      rejectApplication,
      resendApplication,
      closeApplication,
      addApplicationAttachment,
      updateApplicationValues,
      assignApplicationDelegate,
      hasPermission
    }),
    [
      roles,
      users,
      currentUser,
      isAuthenticated,
      loading,
      applicationTypes,
      applications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveApplicationTypes,
      saveApplications,
      createApplicationType,
      updateApplicationType,
      deleteApplicationType,
      createApplication,
      submitApplication,
      approveApplication,
      rejectApplication,
      resendApplication,
      closeApplication,
      addApplicationAttachment,
      updateApplicationValues,
      assignApplicationDelegate,
      hasPermission
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
