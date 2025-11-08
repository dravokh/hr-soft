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
  CompensationBonus,
  CompensationBonusInput,
  LoginResult,
  Role,
  User
} from '../types';
import { runSlaAutomation } from './app/automation';
import { syncCounters } from './app/counters';
import { createApplicationMutations } from './app/mutations';
import {
  buildApplicationNumber,
  normalizeApplicationBundle,
  normalizeApplicationType,
  normalizeApplicationTypeList,
  normalizeApplications
} from './app/normalizers';
import { ensureAdminPermissions } from './app/permissions';
import {
  apiEnabled,
  fetchBootstrap,
  syncApplications,
  syncApplicationTypes,
  syncRoles,
  syncUsers,
  syncCompensationBonuses
} from '../services/api';

const normalizeBonusTree = (nodes: CompensationBonus[]): CompensationBonus[] =>
  nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId ?? null,
    name: node.name?.trim() ?? '',
    percent:
      node.percent === null || node.percent === undefined || Number.isNaN(Number(node.percent))
        ? null
        : Number(node.percent),
    children: normalizeBonusTree(node.children ?? [])
  }));

const sanitizeBonusInput = (nodes: CompensationBonusInput[]): CompensationBonusInput[] =>
  nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId ?? null,
    name: node.name?.trim() ?? '',
    percent:
      node.percent === null || node.percent === undefined || Number.isNaN(Number(node.percent))
        ? null
        : Number(node.percent),
    children: sanitizeBonusInput(node.children ?? [])
  }));

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [applications, setApplications] = useState<ApplicationBundle[]>([]);
  const [compensationBonuses, setCompensationBonuses] = useState<CompensationBonus[]>([]);
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

  const normalizeUser = useCallback((user: User): User => {
    const rawName = (user.name ?? '').trim();
    const explicitFirst = user.firstName?.trim();
    const explicitLast = user.lastName?.trim();
    const phone = user.phone?.trim() ?? '';
    const personalId = user.personalId?.trim() ?? '';
    const mustResetPassword = Boolean(user.mustResetPassword);
    const baseSalary = Number.isFinite(Number(user.baseSalary)) ? Number(user.baseSalary) : 0;
    const vacationDays = Number.isFinite(Number(user.vacationDays)) ? Number(user.vacationDays) : 0;
    const lateHoursAllowed = Number.isFinite(Number(user.lateHoursAllowed))
      ? Number(user.lateHoursAllowed)
      : 0;
    const penaltyPercent = Number.isFinite(Number(user.penaltyPercent)) ? Number(user.penaltyPercent) : 0;
    const selectedBonusIds = Array.isArray(user.selectedBonusIds)
      ? Array.from(
          new Set(
            user.selectedBonusIds
              .map((bonusId) => Number(bonusId))
              .filter((bonusId) => Number.isFinite(bonusId) && bonusId > 0)
          )
        )
      : [];

    if (explicitFirst || explicitLast) {
      return {
        ...user,
        firstName: explicitFirst ?? '',
        lastName: explicitLast ?? '',
        name: [explicitFirst, explicitLast].filter((part) => part && part.length > 0).join(' ').trim(),
        phone,
        personalId,
        mustResetPassword,
        baseSalary,
        vacationDays,
        lateHoursAllowed,
        penaltyPercent,
        selectedBonusIds
      };
    }

    if (!rawName) {
      return {
        ...user,
        firstName: '',
        lastName: '',
        phone,
        personalId,
        mustResetPassword,
        baseSalary,
        vacationDays,
        lateHoursAllowed,
        penaltyPercent,
        selectedBonusIds
      };
    }

    const segments = rawName.split(' ').filter(Boolean);
    const firstName = segments[0] ?? '';
    const lastName = segments.slice(1).join(' ');

    return {
      ...user,
      firstName,
      lastName,
      phone,
      personalId,
      mustResetPassword,
      baseSalary,
      vacationDays,
      lateHoursAllowed,
      penaltyPercent,
      selectedBonusIds
    };
  }, []);

  const serializeUsers = useCallback(
    (rawUsers: User[]): User[] =>
      rawUsers.map((user) => {
        const firstName = user.firstName?.trim() ?? '';
        const lastName = user.lastName?.trim() ?? '';
        const name = [firstName, lastName].filter(Boolean).join(' ').trim();
        const phone = user.phone?.trim() ?? '';
        const personalId = user.personalId?.trim() ?? '';
        const baseSalary = Number.isFinite(Number(user.baseSalary)) ? Number(user.baseSalary) : 0;
        const vacationDays = Number.isFinite(Number(user.vacationDays)) ? Number(user.vacationDays) : 0;
        const lateHoursAllowed = Number.isFinite(Number(user.lateHoursAllowed))
          ? Number(user.lateHoursAllowed)
          : 0;
        const penaltyPercent = Number.isFinite(Number(user.penaltyPercent)) ? Number(user.penaltyPercent) : 0;
        const selectedBonusIds = Array.isArray(user.selectedBonusIds)
          ? Array.from(
              new Set(
                user.selectedBonusIds
                  .map((bonusId) => Number(bonusId))
                  .filter((bonusId) => Number.isFinite(bonusId) && bonusId > 0)
              )
            )
          : [];

        return {
          ...user,
          name: name || user.name || '',
          firstName,
          lastName,
          phone,
          personalId,
          baseSalary,
          vacationDays,
          lateHoursAllowed,
          penaltyPercent,
          selectedBonusIds
        };
      }),
    []
  );

  const recomputeApplications = useCallback(
    (bundles: ApplicationBundle[], typesSource: ApplicationType[]) => {
      const normalized = normalizeApplications(bundles, typesSource);
      return applyAutomation(normalized, typesSource);
    },
    [applyAutomation]
  );

  const saveApplications = useCallback(
    async (
      nextBundlesOrUpdater:
        | ApplicationBundle[]
        | ((current: ApplicationBundle[]) => ApplicationBundle[])
    ): Promise<ApplicationBundle[]> => {
      const base =
        typeof nextBundlesOrUpdater === 'function'
          ? nextBundlesOrUpdater(applications)
          : nextBundlesOrUpdater;

      const prepared = recomputeApplications(base, applicationTypes);
      const persisted = apiEnabled ? await syncApplications(prepared) : prepared;
      const processed = recomputeApplications(persisted, applicationTypes);

      setApplications(processed);
      syncCounters(processed, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });

      return processed;
    },
    [
      apiEnabled,
      applications,
      applicationTypes,
      recomputeApplications,
      applicationIdRef,
      attachmentIdRef,
      auditIdRef,
      delegateIdRef
    ]
  );

  const saveApplicationTypes = useCallback(
    async (
      nextTypes: ApplicationType[],
      applicationUpdater?: (current: ApplicationBundle[]) => ApplicationBundle[]
    ): Promise<void> => {
      const normalized = normalizeApplicationTypeList(nextTypes);
      const persisted = apiEnabled ? await syncApplicationTypes(normalized) : normalized;

      applicationTypeIdRef.current =
        persisted.reduce((max, type) => Math.max(max, type.id), 0) + 1;
      setApplicationTypes(persisted);

      if (applicationUpdater) {
        await saveApplications((current) => applicationUpdater(current));
        return;
      }

      const processed = recomputeApplications(applications, persisted);
      setApplications(processed);
      syncCounters(processed, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
    },
    [
      apiEnabled,
      applications,
      recomputeApplications,
      saveApplications,
      applicationIdRef,
      attachmentIdRef,
      auditIdRef,
      delegateIdRef
    ]
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
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }

      const boot = await fetchBootstrap();

      const resolvedRoles = ensureAdminPermissions(boot.roles ?? []);
      setRoles(resolvedRoles);

      const resolvedUsers: User[] = (boot.users ?? []).map((user) =>
        normalizeUser({
          ...user,
          phone: user.phone ?? '',
          personalId: user.personalId ?? '',
          mustResetPassword: Boolean(user.mustResetPassword)
        })
      );
      setUsers(resolvedUsers);

      const resolvedTypes = normalizeApplicationTypeList(boot.applicationTypes ?? []);
      applicationTypeIdRef.current =
        resolvedTypes.reduce((max, type) => Math.max(max, type.id), 0) + 1;
      setApplicationTypes(resolvedTypes);

      const normalizedBundles = normalizeApplications(boot.applications ?? [], resolvedTypes);
      const processedBundles = applyAutomation(normalizedBundles, resolvedTypes);
      setApplications(processedBundles);
      const normalizedBonuses = normalizeBonusTree(boot.compensationBonuses ?? []);
      setCompensationBonuses(normalizedBonuses);
      syncCounters(processedBundles, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });

      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Failed to load bootstrap data from API.', error);
      setRoles([]);
      setUsers([]);
      setApplicationTypes([]);
      setApplications([]);
      setCompensationBonuses([]);
      syncCounters([], {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [
    apiEnabled,
    applyAutomation,
    applicationTypeIdRef,
    applicationIdRef,
    attachmentIdRef,
    auditIdRef,
    delegateIdRef,
    normalizeUser
  ]);

  // Prevent double init in React 18 StrictMode (dev)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void loadAllData();
  }, [loadAllData]);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      if (!apiEnabled) {
        return {
          success: false,
          error: 'API base URL is not configured. Set VITE_API_URL and restart the app.'
        };
      }

      if (users.length === 0) {
        return {
          success: false,
          error: 'No users are available. Verify the backend API and database connection.'
        };
      }

      const user = users.find((candidate) => candidate.email === email && candidate.password === password);

      if (!user) {
        return { success: false, error: 'Invalid email or password.' };
      }

      if (user.mustResetPassword) {
        setCurrentUser(user);
        setIsAuthenticated(false);
        return {
          success: true,
          requiresPasswordReset: true,
          userId: user.id
        };
      }

      setCurrentUser(user);
      setIsAuthenticated(true);

      return { success: true };
    },
    [apiEnabled, users]
  );

  const logout = useCallback(async (): Promise<void> => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const saveRoles = useCallback(async (newRoles: Role[]): Promise<void> => {
    const nextRoles = ensureAdminPermissions(newRoles);
    const persisted = apiEnabled ? await syncRoles(nextRoles) : nextRoles;
    setRoles(persisted);
  }, [apiEnabled]);

  const saveUsers = useCallback(
    async (newUsers: User[]): Promise<void> => {
      const payload = serializeUsers(newUsers);
      const persistedRaw = apiEnabled ? await syncUsers(payload) : payload;
      const persisted = persistedRaw.map((user) => normalizeUser(user));

      setUsers(persisted);
      setCurrentUser((previous) => {
        if (!previous) {
          return previous;
        }

        return persisted.find((user) => user.id === previous.id) ?? previous;
      });
    },
    [apiEnabled, normalizeUser, serializeUsers]
  );

  const saveCompensationBonuses = useCallback(
    async (bonuses: CompensationBonusInput[]): Promise<CompensationBonus[]> => {
      const sanitized = sanitizeBonusInput(bonuses);
      const persisted = apiEnabled
        ? await syncCompensationBonuses(sanitized)
        : (() => {
            let sequence = 1;
            const assignIds = (nodes: CompensationBonusInput[], parentId: number | null): CompensationBonus[] =>
              nodes.map((node) => {
                const currentId = node.id && node.id > 0 ? node.id : sequence++;
                return {
                  id: currentId,
                  parentId,
                  name: node.name,
                  percent: node.percent,
                  children: assignIds(node.children ?? [], currentId)
                };
              });
            return assignIds(sanitized, null);
          })();

      const normalized = normalizeBonusTree(persisted);
      setCompensationBonuses(normalized);
      return normalized;
    },
    [apiEnabled]
  );

  const completePasswordReset = useCallback(
    async (userId: number, newPassword: string): Promise<boolean> => {
      const trimmed = newPassword.trim();
      if (trimmed === '') {
        return false;
      }

      const target = users.find((user) => user.id === userId);
      if (!target) {
        return false;
      }

      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, password: trimmed, mustResetPassword: false } : user
      );

      await saveUsers(updatedUsers);
      setIsAuthenticated(true);
      return true;
    },
    [saveUsers, users]
  );

  const resetUserPassword = useCallback(
    async (userId: number): Promise<boolean> => {
      const target = users.find((user) => user.id === userId);
      if (!target) {
        return false;
      }

      const updatedUsers = users.map((user) =>
        user.id === userId
          ? {
              ...user,
              password: '123',
              mustResetPassword: true
            }
          : user
      );

      await saveUsers(updatedUsers);
      return true;
    },
    [saveUsers, users]
  );

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
      compensationBonuses,
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
      saveCompensationBonuses,
      resetUserPassword,
      completePasswordReset,
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
      compensationBonuses,
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
      saveCompensationBonuses,
      resetUserPassword,
      completePasswordReset,
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

