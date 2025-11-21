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
  BonusValueType,
  Campus,
  CompensationAdjustmentConfig,
  CompensationAdjustmentMode,
  CompensationBonus,
  CompensationBonusInput,
  LoginResult,
  PayrollBatch,
  PayrollStatus,
  PayrollStats,
  Role,
  TeacherClassHoursDay,
  TeacherClassHoursPlan,
  TeacherScheduleAssignment,
  TeacherScheduleBonusRates,
  User,
  WorkShift,
  WorkCalendarDay
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
  fetchTeacherScheduleAssignments,
  fetchTeacherScheduleBonusRates,
  fetchTeacherClassHours,
  fetchPayrollBatches,
  fetchPayrollStats,
  saveTeacherClassHours,
  saveTeacherScheduleBonusRates,
  createPayrollBatch as generatePayrollBatch,
  updatePayrollBatchStatus,
  fetchWorkCalendarDays,
  saveWorkCalendarMonth as persistWorkCalendarMonth,
  syncApplications,
  syncApplicationTypes,
  syncRoles,
  syncUsers,
  syncCompensationBonuses,
  login as requestLogin,
  setAuthToken,
  initiatePasswordReset,
  completePasswordReset as apiCompletePasswordReset
} from '../services/api';
import { createDefaultWorkSchedule, sanitizeWorkSchedule } from '../utils/workSchedule';
import { allocateUsage, hasUsageDeltas, valuesArrayToMap } from '../utils/usage';
import { calculateExtraBonus, mergeExtraBonusPayload } from '../utils/extraBonus';

const EMPTY_COMPENSATION_RATES: TeacherScheduleBonusRates = {
  cambridge: 0,
  georgian: 0,
  cover: 0,
  taxRate: 0,
  adjustments: []
};

const cloneEmptyCompensationRates = (): TeacherScheduleBonusRates => ({
  ...EMPTY_COMPENSATION_RATES,
  adjustments: []
});

const resolveValueType = (
  percent: number | null,
  amount: number | null,
  incoming?: BonusValueType
): BonusValueType => {
  if (amount !== null && Number.isFinite(amount)) {
    return 'amount';
  }
  if (percent !== null && Number.isFinite(percent)) {
    return 'percent';
  }
  if (incoming === 'amount' || incoming === 'percent') {
    return incoming;
  }
  return 'none';
};

const normalizeBonusTree = (nodes: CompensationBonus[]): CompensationBonus[] =>
  nodes.map((node) => {
    const percent =
      node.percent === null || node.percent === undefined || Number.isNaN(Number(node.percent))
        ? null
        : Number(node.percent);
    const amount =
      node.amount === null || node.amount === undefined || Number.isNaN(Number(node.amount))
        ? null
        : Number(node.amount);

    return {
      id: node.id,
      parentId: node.parentId ?? null,
      name: node.name?.trim() ?? '',
      percent,
      amount,
      valueType: resolveValueType(percent, amount, node.valueType),
      children: normalizeBonusTree(node.children ?? [])
    };
  });

const sanitizeBonusInput = (nodes: CompensationBonusInput[]): CompensationBonusInput[] =>
  nodes.map((node) => {
    const percent =
      node.percent === null || node.percent === undefined || Number.isNaN(Number(node.percent))
        ? null
        : Number(node.percent);
    const amount =
      node.amount === null || node.amount === undefined || Number.isNaN(Number(node.amount))
        ? null
        : Number(node.amount);

    return {
      id: node.id,
      parentId: node.parentId ?? null,
      name: node.name?.trim() ?? '',
      percent,
      amount,
      children: sanitizeBonusInput(node.children ?? [])
    };
  });

const WORK_SHIFT_STORAGE_KEY = 'hr_work_shifts_v1';

const normalizeWorkShifts = (shifts: WorkShift[]): WorkShift[] => {
  let nextId = 1;
  return shifts.map((shift) => {
    const numericId = Number(shift.id);
    const id = Number.isFinite(numericId) && numericId > 0 ? numericId : nextId++;
    if (id >= nextId) {
      nextId = id + 1;
    }
    const name = shift.name?.trim() ?? '';
    const description = shift.description?.trim() ?? '';

    return {
      id,
      name: name !== '' ? name : `Shift ${id}`,
      description,
      schedule: sanitizeWorkSchedule(shift.schedule)
    };
  });
};

const buildDefaultWorkShifts = (): WorkShift[] =>
  normalizeWorkShifts([
    {
      id: 1,
      name: 'Standard 09:00-18:00',
      description: 'Mon-Fri with 1h break',
      schedule: createDefaultWorkSchedule()
    }
  ]);

const loadStoredWorkShifts = (): WorkShift[] => {
  if (typeof window === 'undefined') {
    return buildDefaultWorkShifts();
  }
  try {
    const raw = window.localStorage.getItem(WORK_SHIFT_STORAGE_KEY);
    if (!raw) {
      return buildDefaultWorkShifts();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return buildDefaultWorkShifts();
    }
    return normalizeWorkShifts(parsed as WorkShift[]);
  } catch {
    return buildDefaultWorkShifts();
  }
};

const SESSION_USER_KEY = 'hr_active_user_id';
const SESSION_TOKEN_KEY = 'hr_auth_token';
const SESSION_CAMPUS_KEY = 'hr_active_campus';
const ALL_CAMPUSES: Campus[] = ['marneuli', 'tbilisi'];
const USER_CAMPUSES_STORAGE_KEY = 'hr_user_campuses_v1';

const normalizeCampuses = (raw?: unknown): Campus[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  const cleaned = raw
    .map((value) => (value === 'marneuli' || value === 'tbilisi' ? value : null))
    .filter((value): value is Campus => Boolean(value));
  return Array.from(new Set(cleaned));
};

const userHasCampus = (user: User, campus: Campus | null): boolean => {
  if (!campus) {
    return false;
  }
  return normalizeCampuses(user.campuses).includes(campus);
};

const userHasAllCampuses = (user: User | null): boolean => {
  if (!user) {
    return false;
  }
  return normalizeCampuses(user.campuses).length === ALL_CAMPUSES.length;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [applications, setApplications] = useState<ApplicationBundle[]>([]);
  const applicationsRef = useRef<ApplicationBundle[]>([]);
  const [compensationBonuses, setCompensationBonuses] = useState<CompensationBonus[]>([]);
  const [teacherScheduleAssignments, setTeacherScheduleAssignments] = useState<TeacherScheduleAssignment[]>([]);
  const [teacherClassHours, setTeacherClassHours] = useState<TeacherClassHoursPlan[]>([]);
  const [teacherScheduleBonusRates, setTeacherScheduleBonusRates] = useState<TeacherScheduleBonusRates>(
    cloneEmptyCompensationRates()
  );
  const [payrollBatches, setPayrollBatches] = useState<PayrollBatch[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollStats | null>(null);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>(() => loadStoredWorkShifts());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const applicationTypeIdRef = useRef(1);
  const applicationIdRef = useRef(1);
  const attachmentIdRef = useRef(1);
  const auditIdRef = useRef(1);
  const delegateIdRef = useRef(1);

  const persistSessionToken = useCallback((token: string | null) => {
    setAuthToken(token);
    if (typeof window === 'undefined') {
      return;
    }
    if (token) {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }, []);

  const persistSessionUser = useCallback((user: User | null, campus?: Campus | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (user) {
      window.sessionStorage.setItem(SESSION_USER_KEY, String(user.id));
      if (campus) {
        window.sessionStorage.setItem(SESSION_CAMPUS_KEY, campus);
      }
    } else {
      window.sessionStorage.removeItem(SESSION_USER_KEY);
      window.sessionStorage.removeItem(SESSION_CAMPUS_KEY);
    }
  }, []);

  const persistUserCampuses = useCallback((usersToPersist: User[]) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const payload: Record<number, Campus[]> = {};
      usersToPersist.forEach((user) => {
        payload[user.id] = normalizeCampuses(user.campuses);
      });
      window.localStorage.setItem(USER_CAMPUSES_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, []);

  const loadStoredUserCampuses = useCallback((): Map<number, Campus[]> => {
    if (typeof window === 'undefined') {
      return new Map<number, Campus[]>();
    }
    try {
      const raw = window.localStorage.getItem(USER_CAMPUSES_STORAGE_KEY);
      if (!raw) {
        return new Map<number, Campus[]>();
      }
      const parsed = JSON.parse(raw) as Record<string, Campus[]>;
      const map = new Map<number, Campus[]>();
      Object.entries(parsed).forEach(([key, value]) => {
        const id = Number.parseInt(key, 10);
        if (Number.isFinite(id)) {
          map.set(id, normalizeCampuses(value));
        }
      });
      return map;
    } catch {
      return new Map<number, Campus[]>();
    }
  }, []);

  const restoreSessionUser = useCallback(
    (usersList: User[]) => {
      if (typeof window === 'undefined') {
        return;
      }
      const storedToken = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
      setAuthToken(storedToken);
      const storedUserId = window.sessionStorage.getItem(SESSION_USER_KEY);
      if (!storedUserId) {
        setCurrentUser(null);
        setActiveCampus(null);
        setIsAuthenticated(false);
        if (!storedToken) {
          persistSessionToken(null);
        }
        return;
      }
      const parsed = Number.parseInt(storedUserId, 10);
      if (!Number.isFinite(parsed)) {
        window.sessionStorage.removeItem(SESSION_USER_KEY);
        window.sessionStorage.removeItem(SESSION_CAMPUS_KEY);
        setCurrentUser(null);
        setActiveCampus(null);
        setIsAuthenticated(false);
        return;
      }
      const found = usersList.find((user) => user.id === parsed);
      if (found) {
        const storedCampus = window.sessionStorage.getItem(SESSION_CAMPUS_KEY) as Campus | null;
        const normalized = normalizeCampuses(found.campuses);
        const nextCampus =
          storedCampus && normalized.includes(storedCampus) ? storedCampus : normalized[0] ?? null;
        setCurrentUser(found);
        setActiveCampus(nextCampus ?? null);
        setIsAuthenticated(true);
        if (nextCampus) {
          persistSessionUser(found, nextCampus);
        }
      } else {
        window.sessionStorage.removeItem(SESSION_USER_KEY);
        window.sessionStorage.removeItem(SESSION_CAMPUS_KEY);
        persistSessionToken(null);
        setCurrentUser(null);
        setActiveCampus(null);
        setIsAuthenticated(false);
      }
    },
    [persistSessionToken, persistSessionUser]
  );

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
    const { password: _password, ...safeUser } = (user as User & { password?: string }) ?? {};
    const rawName = (safeUser.name ?? '').trim();
    const explicitFirst = safeUser.firstName?.trim();
    const explicitLast = safeUser.lastName?.trim();
    const phone = safeUser.phone?.trim() ?? '';
    const personalId = safeUser.personalId?.trim() ?? '';
    const subject = safeUser.subject?.trim() ?? '';
    const mustResetPassword = Boolean(safeUser.mustResetPassword);
    const baseSalary = Number.isFinite(Number(safeUser.baseSalary)) ? Number(safeUser.baseSalary) : 0;
    const vacationDays = Number.isFinite(Number(safeUser.vacationDays)) ? Number(safeUser.vacationDays) : 0;
    const lateHoursAllowed = Number.isFinite(Number(safeUser.lateHoursAllowed))
      ? Number(safeUser.lateHoursAllowed)
      : 0;
    const penaltyPercent = Number.isFinite(Number(safeUser.penaltyPercent))
      ? Number(safeUser.penaltyPercent)
      : 0;
    const vacationDaysUsed = Number.isFinite(Number(safeUser.vacationDaysUsed))
      ? Number(safeUser.vacationDaysUsed)
      : 0;
    const graceMinutesUsed = Number.isFinite(Number(safeUser.graceMinutesUsed))
      ? Number(safeUser.graceMinutesUsed)
      : 0;
    const penaltyMinutesUsed = Number.isFinite(Number(safeUser.penaltyMinutesUsed))
      ? Number(safeUser.penaltyMinutesUsed)
      : 0;
    const selectedBonusIds = Array.isArray(safeUser.selectedBonusIds)
      ? Array.from(
          new Set(
            safeUser.selectedBonusIds
              .map((bonusId) => Number(bonusId))
              .filter((bonusId) => Number.isFinite(bonusId) && bonusId > 0)
          )
        )
      : [];
    const workSchedule = sanitizeWorkSchedule(safeUser.workSchedule);
    const campuses = normalizeCampuses(safeUser.campuses);

    if (explicitFirst || explicitLast) {
        return {
          ...safeUser,
          firstName: explicitFirst ?? '',
          lastName: explicitLast ?? '',
          name: [explicitFirst, explicitLast].filter((part) => part && part.length > 0).join(' ').trim(),
          phone,
          personalId,
          subject,
          mustResetPassword,
        baseSalary,
        vacationDays,
        lateHoursAllowed,
        penaltyPercent,
        selectedBonusIds,
        vacationDaysUsed,
        graceMinutesUsed,
        penaltyMinutesUsed,
        workSchedule,
        campuses
      };
    }

    if (!rawName) {
      return {
        ...safeUser,
        firstName: '',
        lastName: '',
        phone,
        personalId,
        mustResetPassword,
        baseSalary,
        vacationDays,
        lateHoursAllowed,
        penaltyPercent,
        selectedBonusIds,
        vacationDaysUsed,
        graceMinutesUsed,
        penaltyMinutesUsed,
        workSchedule,
        campuses
      };
    }

    const segments = rawName.split(' ').filter(Boolean);
    const firstName = segments[0] ?? '';
    const lastName = segments.slice(1).join(' ');

    return {
      ...safeUser,
      firstName,
      lastName,
      phone,
      personalId,
      subject,
      mustResetPassword,
      baseSalary,
      vacationDays,
      lateHoursAllowed,
      penaltyPercent,
      selectedBonusIds,
      vacationDaysUsed,
      graceMinutesUsed,
      penaltyMinutesUsed,
      workSchedule,
      campuses
    };
  }, []);

  const serializeUsers = useCallback(
    (rawUsers: User[]): User[] =>
      rawUsers.map((user) => {
        const { password: _password, ...safeUser } = (user as User & { password?: string }) ?? {};
        const firstName = user.firstName?.trim() ?? '';
        const lastName = user.lastName?.trim() ?? '';
        const name = [firstName, lastName].filter(Boolean).join(' ').trim();
        const phone = user.phone?.trim() ?? '';
        const personalId = user.personalId?.trim() ?? '';
        const subject = user.subject?.trim() ?? '';
        const baseSalary = Number.isFinite(Number(user.baseSalary)) ? Number(user.baseSalary) : 0;
        const vacationDays = Number.isFinite(Number(user.vacationDays)) ? Number(user.vacationDays) : 0;
        const lateHoursAllowed = Number.isFinite(Number(user.lateHoursAllowed))
          ? Number(user.lateHoursAllowed)
          : 0;
        const penaltyPercent = Number.isFinite(Number(user.penaltyPercent)) ? Number(user.penaltyPercent) : 0;
        const vacationDaysUsed = Number.isFinite(Number(user.vacationDaysUsed))
          ? Number(user.vacationDaysUsed)
          : 0;
        const graceMinutesUsed = Number.isFinite(Number(user.graceMinutesUsed))
          ? Number(user.graceMinutesUsed)
          : 0;
        const penaltyMinutesUsed = Number.isFinite(Number(user.penaltyMinutesUsed))
          ? Number(user.penaltyMinutesUsed)
          : 0;
        const selectedBonusIds = Array.isArray(user.selectedBonusIds)
          ? Array.from(
              new Set(
                user.selectedBonusIds
                  .map((bonusId) => Number(bonusId))
              .filter((bonusId) => Number.isFinite(bonusId) && bonusId > 0)
            )
          )
          : [];
        const workSchedule = sanitizeWorkSchedule(user.workSchedule);
        const campuses = normalizeCampuses(user.campuses);

        return {
          ...safeUser,
          name: name || safeUser.name || '',
          firstName,
          lastName,
          phone,
          personalId,
          subject,
          baseSalary,
          vacationDays,
          lateHoursAllowed,
          penaltyPercent,
          vacationDaysUsed,
          graceMinutesUsed,
          penaltyMinutesUsed,
          selectedBonusIds,
          workSchedule,
          campuses
        };
      }),
    []
  );

  const recomputeApplications = useCallback(
    (bundles: ApplicationBundle[], typesSource: ApplicationType[], usersSource: User[]) => {
      const normalized = normalizeApplications(bundles, typesSource);
      const automated = applyAutomation(normalized, typesSource);
      const userById = new Map(usersSource.map((user) => [user.id, user]));

      return automated.map((bundle) => {
        const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
        if (
          !type ||
          bundle.application.status !== 'APPROVED' ||
          !type.capabilities?.usesExtraBonusTracker
        ) {
          return { ...bundle, extraBonus: null };
        }

        const requester = userById.get(bundle.application.requesterId);
        if (!requester) {
          return { ...bundle, extraBonus: null };
        }

        const computation = calculateExtraBonus(type, requester, valuesArrayToMap(bundle.values));
        const extraBonus = mergeExtraBonusPayload(
          bundle.application.id,
          requester.id,
          computation,
          bundle.extraBonus
        );

        return {
          ...bundle,
          extraBonus
        };
      });
    },
    [applyAutomation]
  );

  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  const saveApplications = useCallback(
    async (
      nextBundlesOrUpdater:
        | ApplicationBundle[]
        | ((current: ApplicationBundle[]) => ApplicationBundle[])
    ): Promise<ApplicationBundle[]> => {
      const snapshot = applicationsRef.current;
      const base =
        typeof nextBundlesOrUpdater === 'function'
          ? nextBundlesOrUpdater(snapshot)
          : nextBundlesOrUpdater;

      const prepared = recomputeApplications(base, applicationTypes, users);
      const persisted = apiEnabled ? await syncApplications(prepared) : prepared;
      const processed = recomputeApplications(persisted, applicationTypes, users);

      setApplications(processed);
      applicationsRef.current = processed;
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
      applicationTypes,
      recomputeApplications,
      users,
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

      const processed = recomputeApplications(applicationsRef.current, persisted, users);
      setApplications(processed);
      applicationsRef.current = processed;
      syncCounters(processed, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
    },
    [
      apiEnabled,
      recomputeApplications,
      users,
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

  const refreshTeacherScheduleAssignments = useCallback(async (): Promise<void> => {
    if (!apiEnabled) {
      setTeacherScheduleAssignments([]);
      return;
    }

    try {
      const response = await fetchTeacherScheduleAssignments();
      setTeacherScheduleAssignments(response.assignments ?? []);
    } catch (error) {
      console.error('Failed to load teacher schedule assignments.', error);
      setTeacherScheduleAssignments([]);
    }
  }, [apiEnabled]);

  const refreshTeacherClassHours = useCallback(async (): Promise<void> => {
    if (!apiEnabled) {
      setTeacherClassHours([]);
      return;
    }

    try {
      const response = await fetchTeacherClassHours();
      setTeacherClassHours(response.plans ?? []);
    } catch (error) {
      console.error('Failed to load teacher class hours.', error);
      setTeacherClassHours([]);
    }
  }, [apiEnabled]);

  const refreshTeacherScheduleBonusRates = useCallback(async (): Promise<void> => {
    if (!apiEnabled) {
      setTeacherScheduleBonusRates(cloneEmptyCompensationRates());
      return;
    }

    try {
      const response = await fetchTeacherScheduleBonusRates();
      setTeacherScheduleBonusRates(response.rates ?? cloneEmptyCompensationRates());
    } catch (error) {
      console.error('Failed to load teacher schedule bonus rates.', error);
      setTeacherScheduleBonusRates(cloneEmptyCompensationRates());
    }
  }, [apiEnabled]);

  const saveTeacherClassHoursHandler = useCallback(
    async (userId: number, days: TeacherClassHoursDay[]): Promise<TeacherClassHoursPlan | null> => {
      if (!apiEnabled) {
        console.error('API base URL not configured.');
        return null;
      }

      try {
        const response = await saveTeacherClassHours({ userId, days });
        const plan = response.plan;
        setTeacherClassHours((current) => [...current.filter((item) => item.userId !== plan.userId), plan]);
        return plan;
      } catch (error) {
        console.error('Failed to save teacher class hours.', error);
        return null;
      }
    },
    [apiEnabled]
  );

  const refreshPayrollBatches = useCallback(async (): Promise<void> => {
    if (!apiEnabled) {
      setPayrollBatches([]);
      return;
    }
    try {
      const response = await fetchPayrollBatches();
      setPayrollBatches(response.batches ?? []);
    } catch (error) {
      console.error('Failed to load payroll batches.', error);
      setPayrollBatches([]);
    }
  }, [apiEnabled]);

  const refreshPayrollStats = useCallback(async (): Promise<void> => {
    if (!apiEnabled) {
      setPayrollStats(null);
      return;
    }
    try {
      const response = await fetchPayrollStats();
      setPayrollStats(response.stats ?? null);
    } catch (error) {
      console.error('Failed to load payroll stats.', error);
      setPayrollStats(null);
    }
  }, [apiEnabled]);

  const createPayrollBatch = useCallback(
    async (month: string): Promise<PayrollBatch> => {
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }
      const payload = await generatePayrollBatch({
        month,
        actorId: currentUser?.id ?? null
      });
      await refreshPayrollBatches();
      await refreshPayrollStats();
      return payload.batch;
    },
    [apiEnabled, currentUser, refreshPayrollBatches, refreshPayrollStats]
  );

  const updatePayrollStatus = useCallback(
    async (batchId: number, status: PayrollStatus): Promise<PayrollBatch | null> => {
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }
      const response = await updatePayrollBatchStatus({
        batchId,
        status,
        actorId: currentUser?.id ?? null
      });
      await refreshPayrollBatches();
      await refreshPayrollStats();
      return response.batch ?? null;
    },
    [apiEnabled, currentUser, refreshPayrollBatches, refreshPayrollStats]
  );

  const saveTeacherScheduleBonusRatesHandler = useCallback(
    async (rates: TeacherScheduleBonusRates): Promise<TeacherScheduleBonusRates> => {
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }

      const sanitized: TeacherScheduleBonusRates = {
        cambridge: Number.isFinite(rates.cambridge) ? Number(rates.cambridge) : 0,
        georgian: Number.isFinite(rates.georgian) ? Number(rates.georgian) : 0,
        cover: Number.isFinite(rates.cover) ? Number(rates.cover) : 0,
        taxRate: Math.min(100, Math.max(0, Number.isFinite(rates.taxRate) ? Number(rates.taxRate) : 0)),
        adjustments: Array.isArray(rates.adjustments)
          ? rates.adjustments
              .map((item) => ({
                id: item.id,
                label: (item.label ?? '').toString().trim(),
                mode: ((): CompensationAdjustmentMode =>
                  item.mode === 'fixed' ? 'fixed' : 'percent')(),
                value: Number.isFinite(item.value) ? Number(item.value) : 0
              }))
              .filter((item) => item.label !== '')
          : []
      };

      const response = await saveTeacherScheduleBonusRates(sanitized);
      setTeacherScheduleBonusRates(response.rates);
      return response.rates;
    },
    [apiEnabled]
  );

  const fetchWorkCalendarMonth = useCallback(
    async (year: number, month: number): Promise<WorkCalendarDay[]> => {
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }
      const response = await fetchWorkCalendarDays(year, month);
      return response.days ?? [];
    },
    [apiEnabled]
  );

  const saveWorkCalendarMonth = useCallback(
    async (year: number, month: number, days: WorkCalendarDay[]): Promise<WorkCalendarDay[]> => {
      if (!apiEnabled) {
        throw new Error('API base URL is not configured');
      }
      const response = await persistWorkCalendarMonth(year, month, days);
      return response.days ?? [];
    },
    [apiEnabled]
  );

  type BootstrapState = {
    roles: Role[];
    users: User[];
    applicationTypes: ApplicationType[];
    applications: ApplicationBundle[];
    compensationBonuses: CompensationBonus[];
  };

  const fetchBootstrapState = useCallback(async (): Promise<BootstrapState> => {
    if (!apiEnabled) {
      throw new Error('API base URL is not configured');
    }
    const cachedCampuses = loadStoredUserCampuses();
    const boot = await fetchBootstrap();
    const resolvedRoles = ensureAdminPermissions(boot.roles ?? []);
    const resolvedUsers: User[] = (boot.users ?? []).map((user) => {
      const campuses = cachedCampuses.get(user.id) ?? user.campuses;
      return normalizeUser({
        ...user,
        campuses,
        phone: user.phone ?? '',
        personalId: user.personalId ?? '',
        mustResetPassword: Boolean(user.mustResetPassword)
      });
    });
    const resolvedTypes = normalizeApplicationTypeList(boot.applicationTypes ?? []);
    const processedBundles = recomputeApplications(
      boot.applications ?? [],
      resolvedTypes,
      resolvedUsers
    );
    const normalizedBonuses = normalizeBonusTree(boot.compensationBonuses ?? []);

    return {
      roles: resolvedRoles,
      users: resolvedUsers,
      applicationTypes: resolvedTypes,
      applications: processedBundles,
      compensationBonuses: normalizedBonuses
    };
  }, [apiEnabled, normalizeUser, recomputeApplications]);

  const applyBootstrapState = useCallback(
    (state: BootstrapState) => {
      setRoles(state.roles);
      setUsers(state.users);
      persistUserCampuses(state.users);
      applicationTypeIdRef.current =
        state.applicationTypes.reduce((max, type) => Math.max(max, type.id), 0) + 1;
      setApplicationTypes(state.applicationTypes);
      setApplications(state.applications);
      applicationsRef.current = state.applications;
      setCompensationBonuses(state.compensationBonuses);
    },
    [applicationTypeIdRef, applicationsRef, persistUserCampuses]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      const state = await fetchBootstrapState();
      applyBootstrapState(state);
      restoreSessionUser(state.users);
      await Promise.all([
        refreshTeacherScheduleAssignments(),
        refreshTeacherClassHours(),
        refreshTeacherScheduleBonusRates(),
        refreshPayrollBatches(),
        refreshPayrollStats()
      ]);
      syncCounters(state.applications, {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
    } catch (error) {
      console.error('Failed to load bootstrap data from API.', error);
      setRoles([]);
      setUsers([]);
      setApplicationTypes([]);
      setApplications([]);
      setCompensationBonuses([]);
      setTeacherScheduleAssignments([]);
      setTeacherClassHours([]);
      setTeacherScheduleBonusRates(cloneEmptyCompensationRates());
      setPayrollBatches([]);
      setPayrollStats(null);
      setActiveCampus(null);
      syncCounters([], {
        applicationIdRef,
        attachmentIdRef,
        auditIdRef,
        delegateIdRef
      });
      persistSessionUser(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [
    applyBootstrapState,
    fetchBootstrapState,
    restoreSessionUser,
    refreshTeacherScheduleAssignments,
    refreshTeacherClassHours,
    refreshTeacherScheduleBonusRates,
    refreshPayrollBatches,
    refreshPayrollStats,
    applicationIdRef,
    attachmentIdRef,
    auditIdRef,
    delegateIdRef,
    persistSessionUser
  ]);

  // Prevent double init in React 18 StrictMode (dev)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(WORK_SHIFT_STORAGE_KEY, JSON.stringify(workShifts));
    } catch {
      // ignore storage errors
    }
  }, [workShifts]);

  const login = useCallback(
    async (personalId: string, password: string, campus: Campus): Promise<LoginResult> => {
      const normalizedPersonalId = personalId.trim();
      const legacyFallbackEnabled =
        ((import.meta as unknown) as { env?: Record<string, unknown> }).env?.VITE_ALLOW_LEGACY_LOGIN !==
        'false';

      if (!apiEnabled && !legacyFallbackEnabled) {
        return { success: false, error: 'API base URL is not configured.' };
      }

      try {
        if (apiEnabled) {
          const response = await requestLogin({ personalId: normalizedPersonalId, password, campus });
          if (response.success && response.token && response.userId) {
            persistSessionToken(response.token);

            const boot = response.bootstrap ?? (await fetchBootstrapState());
            const sanitizedUsers = (boot.users ?? []).map((user) => normalizeUser({ ...(user as User) }));
            const matchedUser =
              sanitizedUsers.find((candidate) => candidate.id === response.userId) ??
              sanitizedUsers.find((candidate) => candidate.personalId === normalizedPersonalId);

            if (!matchedUser) {
              return { success: false, error: 'User record missing from bootstrap payload.' };
            }

            const userCampuses = normalizeCampuses(matchedUser.campuses);
            if (!userCampuses.includes(campus)) {
              return { success: false, error: 'You are not allowed to sign in to this campus.' };
            }

            applyBootstrapState({ ...boot, users: sanitizedUsers });

            if (matchedUser.mustResetPassword) {
              setCurrentUser(matchedUser);
              setActiveCampus(campus);
              setIsAuthenticated(false);
              persistSessionUser(matchedUser, campus);
              return {
                success: true,
                requiresPasswordReset: true,
                userId: matchedUser.id,
                token: response.token
              };
            }

            setCurrentUser(matchedUser);
            setActiveCampus(campus);
            setIsAuthenticated(true);
            persistSessionUser(matchedUser, campus);

            return { success: true, token: response.token };
          }

          // if API responded but without success, fall through to legacy if enabled
          if (!legacyFallbackEnabled) {
            return {
              success: false,
              error: response.error ?? 'Invalid personal ID or password.'
            };
          }
        }
      } catch (error) {
        console.error('Login via API failed, attempting legacy fallback.', error);
        if (!legacyFallbackEnabled) {
          return {
            success: false,
            error: 'Unable to reach the server. Please check the API configuration.'
          };
        }
      }

      // Legacy fallback: use bootstrap data that may contain credentials (dev-only).
      try {
        const boot = await fetchBootstrapState();
        const rawUsers = boot.users ?? [];
        const matchedRaw = rawUsers.find(
          (candidate) =>
            candidate.personalId === normalizedPersonalId &&
            (candidate as unknown as { password?: string })?.password === password
        );
        const sanitizedUsers = rawUsers.map((user) => normalizeUser({ ...(user as User) }));
        const matchedUser =
          sanitizedUsers.find((candidate) => candidate.id === matchedRaw?.id) ??
          sanitizedUsers.find((candidate) => candidate.personalId === normalizedPersonalId);

        if (!matchedUser) {
          return { success: false, error: 'Invalid personal ID or password.' };
        }

        const userCampuses = normalizeCampuses(matchedUser.campuses);
        if (!userCampuses.includes(campus)) {
          return { success: false, error: 'You are not allowed to sign in to this campus.' };
        }

        setAuthToken(null);
        persistSessionToken(null);
        applyBootstrapState({ ...boot, users: sanitizedUsers });

        if (matchedUser.mustResetPassword) {
          setCurrentUser(matchedUser);
          setActiveCampus(campus);
          setIsAuthenticated(false);
          persistSessionUser(matchedUser, campus);
          return {
            success: true,
            requiresPasswordReset: true,
            userId: matchedUser.id
          };
        }

        setCurrentUser(matchedUser);
        setActiveCampus(campus);
        setIsAuthenticated(true);
        persistSessionUser(matchedUser, campus);

        return { success: true };
      } catch (legacyError) {
        console.error('Legacy login failed.', legacyError);
        return {
          success: false,
          error: 'Unable to sign in. Please verify API availability or enable legacy login.'
        };
      }
    },
    [
      apiEnabled,
      applyBootstrapState,
      fetchBootstrapState,
      normalizeUser,
      persistSessionToken,
      persistSessionUser
    ]
  );

  const logout = useCallback(async (): Promise<void> => {
    persistSessionUser(null);
    persistSessionToken(null);
    setCurrentUser(null);
    setActiveCampus(null);
    setIsAuthenticated(false);
  }, [persistSessionToken, persistSessionUser]);

  const saveRoles = useCallback(async (newRoles: Role[]): Promise<void> => {
    const nextRoles = ensureAdminPermissions(newRoles);
    const persisted = apiEnabled ? await syncRoles(nextRoles) : nextRoles;
    setRoles(persisted);
  }, [apiEnabled]);

  const saveUsers = useCallback(
    async (newUsers: User[]): Promise<void> => {
      const campusFallback = new Map<number, Campus[]>(
        newUsers.map((user) => [user.id, normalizeCampuses(user.campuses)])
      );
      const payload = serializeUsers(newUsers);
      const persistedRaw = apiEnabled ? await syncUsers(payload) : payload;
      const persisted = persistedRaw.map((user) => {
        const preferredCampuses = user.campuses ?? campusFallback.get(user.id);
        return normalizeUser({
          ...user,
          campuses: preferredCampuses
        });
      });

      setUsers(persisted);
      persistUserCampuses(persisted);
      setCurrentUser((previous) => {
        if (!previous) {
          return previous;
        }

        return persisted.find((user) => user.id === previous.id) ?? previous;
      });

      const processed = recomputeApplications(applicationsRef.current, applicationTypes, persisted);
      setApplications(processed);
      applicationsRef.current = processed;
    },
    [apiEnabled, normalizeUser, serializeUsers, recomputeApplications, applicationTypes, persistUserCampuses]
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
                const percent = node.percent ?? null;
                const amount = node.amount ?? null;
                return {
                  id: currentId,
                  parentId,
                  name: node.name,
                  percent,
                  amount,
                  valueType: resolveValueType(percent, amount),
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

  const saveWorkShifts = useCallback(
    (next: WorkShift[] | ((current: WorkShift[]) => WorkShift[])): WorkShift[] => {
      let computed: WorkShift[] = [];
      setWorkShifts((current) => {
        const candidate = typeof next === 'function' ? (next as (current: WorkShift[]) => WorkShift[])(current) : next;
        computed = normalizeWorkShifts(candidate);
        return computed;
      });
      return computed;
    },
    []
  );

  const completePasswordReset = useCallback(
    async (userId: number, newPassword: string): Promise<boolean> => {
      if (newPassword.trim() === '') {
        return false;
      }

      const target = users.find((user) => user.id === userId);
      if (!target) {
        return false;
      }

      try {
        if (apiEnabled) {
          await apiCompletePasswordReset({ userId, newPassword: newPassword.trim() });
        }

        const updatedUsers = users.map((user) =>
          user.id === userId ? { ...user, mustResetPassword: false } : user
        );

        await saveUsers(updatedUsers);
        setIsAuthenticated(true);
        return true;
      } catch (resetError) {
        console.error('Unable to complete password reset', resetError);
        return false;
      }
    },
    [apiEnabled, saveUsers, users]
  );

  const resetUserPassword = useCallback(
    async (userId: number): Promise<boolean> => {
      const target = users.find((user) => user.id === userId);
      if (!target) {
        return false;
      }

      try {
        if (apiEnabled) {
          await initiatePasswordReset({ userId });
        }

        const updatedUsers = users.map((user) =>
          user.id === userId
            ? {
                ...user,
                mustResetPassword: true
              }
            : user
        );

        await saveUsers(updatedUsers);
        return true;
      } catch (resetError) {
        console.error('Unable to initiate password reset', resetError);
        return false;
      }
    },
    [apiEnabled, saveUsers, users]
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<boolean> => {
      const exists = users.some((user) => user.id === userId);
      if (!exists) {
        return false;
      }

      const remaining = users.filter((user) => user.id !== userId);
      await saveUsers(remaining);

      setCurrentUser((previous) => (previous && previous.id === userId ? null : previous));
      if (currentUser?.id === userId) {
        setIsAuthenticated(false);
        persistSessionUser(null);
        setActiveCampus(null);
      }

      return true;
    },
    [currentUser?.id, persistSessionUser, saveUsers, users]
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

      const submitted = processed.find((bundle) => bundle.application.id === applicationId) ?? null;
      if (!submitted) {
        return null;
      }

      const type = applicationTypes.find((candidate) => candidate.id === submitted.application.typeId);
      const requester = users.find((candidate) => candidate.id === submitted.application.requesterId);
      if (type && requester) {
        const allocation = allocateUsage(type, requester, valuesArrayToMap(submitted.values));
        if (hasUsageDeltas(allocation)) {
          const updatedUsers = users.map((user) => {
            if (user.id !== requester.id) {
              return user;
            }
            return {
              ...user,
              vacationDaysUsed: (user.vacationDaysUsed ?? 0) + allocation.vacation.apply,
              graceMinutesUsed: (user.graceMinutesUsed ?? 0) + allocation.grace.apply,
              penaltyMinutesUsed: (user.penaltyMinutesUsed ?? 0) + allocation.penalty.apply
            };
          });
          await saveUsers(updatedUsers);
        }
      }

      return submitted;
    },
    [applicationTypes, applySubmit, saveApplications, saveUsers, users]
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

  const scopedUsers = useMemo(() => {
    if (!currentUser) {
      return [] as User[];
    }
    const currentUserCampuses = normalizeCampuses(currentUser.campuses);
    // If user has all campuses or none are assigned (legacy admin), show everyone.
    if (userHasAllCampuses(currentUser) || currentUserCampuses.length === 0) {
      return users;
    }
    if (!activeCampus) {
      return [];
    }
    return users.filter((user) => userHasCampus(user, activeCampus));
  }, [activeCampus, currentUser, users]);

  const allowedUserIds = useMemo(() => new Set(scopedUsers.map((user) => user.id)), [scopedUsers]);

  const scopedApplications = useMemo(() => {
    if (userHasAllCampuses(currentUser)) {
      return applications;
    }
    if (!activeCampus) {
      return [] as ApplicationBundle[];
    }
    return applications.filter((bundle) => allowedUserIds.has(bundle.application.requesterId));
  }, [activeCampus, applications, allowedUserIds, currentUser]);

  const scopedTeacherSchedules = useMemo(() => {
    if (userHasAllCampuses(currentUser)) {
      return teacherScheduleAssignments;
    }
    if (!activeCampus) {
      return [] as TeacherScheduleAssignment[];
    }
    return teacherScheduleAssignments.filter((assignment) => allowedUserIds.has(assignment.userId));
  }, [activeCampus, allowedUserIds, currentUser, teacherScheduleAssignments]);

  const scopedTeacherClassHours = useMemo(() => {
    if (userHasAllCampuses(currentUser)) {
      return teacherClassHours;
    }
    if (!activeCampus) {
      return [] as TeacherClassHoursPlan[];
    }
    return teacherClassHours.filter((plan) => allowedUserIds.has(plan.userId));
  }, [activeCampus, allowedUserIds, currentUser, teacherClassHours]);

  const scopedPayrollBatches = useMemo(() => {
    if (userHasAllCampuses(currentUser)) {
      return payrollBatches;
    }
    if (!activeCampus) {
      return [] as PayrollBatch[];
    }

    return payrollBatches
      .map((batch) => {
        const items = (batch.items ?? []).filter((item) => allowedUserIds.has(item.userId));
        if (!items || items.length === 0) {
          return { ...batch, items: [] };
        }

        const totals = items.reduce(
          (acc, item) => {
            acc.grossTotal += item.grossAmount;
            acc.taxTotal += item.taxAmount;
            acc.deductionTotal += item.deductionAmount;
            acc.netTotal += item.netAmount;
            return acc;
          },
          { grossTotal: 0, taxTotal: 0, deductionTotal: 0, netTotal: 0 }
        );

        return {
          ...batch,
          items,
          grossTotal: totals.grossTotal,
          taxTotal: totals.taxTotal,
          deductionTotal: totals.deductionTotal,
          netTotal: totals.netTotal
        };
      })
      .filter((batch) => (batch.items ?? []).length > 0);
  }, [activeCampus, allowedUserIds, currentUser, payrollBatches]);

  const scopedPayrollStats = useMemo(() => {
    if (userHasAllCampuses(currentUser)) {
      return payrollStats;
    }
    if (!payrollStats) {
      return null;
    }

    const totals = scopedPayrollBatches.reduce(
      (acc, batch) => {
        acc.totalBatches += 1;
        acc.gross += batch.grossTotal ?? 0;
        acc.net += batch.netTotal ?? 0;
        acc.tax += batch.taxTotal ?? 0;
        acc.deductions += batch.deductionTotal ?? 0;
        return acc;
      },
      { totalBatches: 0, gross: 0, net: 0, tax: 0, deductions: 0 }
    );

    return {
      totalBatches: totals.totalBatches,
      totalGross: totals.gross,
      totalNet: totals.net,
      totalTax: totals.tax,
      totalDeductions: totals.deductions,
      recent: scopedPayrollBatches.slice(0, Math.max(0, Math.min(5, scopedPayrollBatches.length)))
    };
  }, [currentUser, payrollStats, scopedPayrollBatches]);

  const value: AppContextValue = useMemo(
    () => ({
      roles,
      users: scopedUsers,
      allUsers: users,
      compensationBonuses,
      teacherScheduleAssignments: scopedTeacherSchedules,
      teacherClassHours: scopedTeacherClassHours,
      teacherScheduleBonusRates,
      payrollBatches: scopedPayrollBatches,
      payrollStats: scopedPayrollStats,
      workShifts,
      currentUser,
      activeCampus,
      isAuthenticated,
      loading,
      applicationTypes,
      applications: scopedApplications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveCompensationBonuses,
      refreshTeacherScheduleAssignments,
      refreshTeacherClassHours,
      saveTeacherClassHours: saveTeacherClassHoursHandler,
      refreshTeacherScheduleBonusRates,
      saveTeacherScheduleBonusRates: saveTeacherScheduleBonusRatesHandler,
      refreshPayrollBatches,
      refreshPayrollStats,
      createPayrollBatch,
      updatePayrollStatus,
      fetchWorkCalendarMonth,
      saveWorkCalendarMonth,
      resetUserPassword,
      deleteUser,
      completePasswordReset,
      saveApplications,
      saveApplicationTypes,
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
      saveWorkShifts,
      hasPermission
    }),
    [
      roles,
      users,
      scopedUsers,
      scopedTeacherSchedules,
      scopedTeacherClassHours,
      teacherScheduleBonusRates,
      scopedPayrollBatches,
      scopedPayrollStats,
      workShifts,
      currentUser,
      activeCampus,
      isAuthenticated,
      loading,
      applicationTypes,
      scopedApplications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveCompensationBonuses,
      refreshTeacherScheduleAssignments,
      refreshTeacherClassHours,
      saveTeacherClassHoursHandler,
      refreshTeacherScheduleBonusRates,
      saveTeacherScheduleBonusRatesHandler,
      refreshPayrollBatches,
      refreshPayrollStats,
      createPayrollBatch,
      updatePayrollStatus,
      fetchWorkCalendarMonth,
      saveWorkCalendarMonth,
      resetUserPassword,
      deleteUser,
      completePasswordReset,
      saveApplications,
      saveApplicationTypes,
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
      saveWorkShifts,
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

