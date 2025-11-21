import type {
  ApplicationBundle,
  ApplicationType,
  CompensationBonus,
  CompensationBonusInput,
  LoginResult,
  PayrollBatch,
  PayrollStats,
  Role,
  TeacherClassHoursDay,
  TeacherClassHoursPlan,
  TeacherScheduleAssignment,
  TeacherScheduleBonusRates,
  TeacherScheduleSummary,
  User,
  WorkCalendarDay,
  Campus
} from '../types';

const RAW_ENV = ((import.meta as unknown) as { env?: Record<string, unknown> }).env ?? {};
const API_BASE = typeof RAW_ENV.VITE_API_URL === 'string' ? (RAW_ENV.VITE_API_URL as string) : undefined;
const API_TOKEN =
  typeof RAW_ENV.VITE_API_TOKEN === 'string' && RAW_ENV.VITE_API_TOKEN.trim().length
    ? (RAW_ENV.VITE_API_TOKEN as string).trim()
    : null;

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token && token.trim().length ? token.trim() : null;
};

export const apiEnabled = Boolean(API_BASE && API_BASE.trim().length);

export interface BootstrapResponse {
  roles: Role[];
  users: User[];
  applicationTypes: ApplicationType[];
  applications: ApplicationBundle[];
  compensationBonuses: CompensationBonus[];
}

export interface LoginPayload {
  personalId: string;
  password: string;
  campus: Campus;
}

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  if (!API_BASE) {
    throw new Error('API base URL not configured');
  }

  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = {
    method,
    headers,
    credentials: 'include'
  };

  const bearer = authToken ?? API_TOKEN;
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`${method} ${path} failed: ${res.status} ${message}`);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
};

const get = async <T>(path: string): Promise<T> => request<T>('GET', path);

const put = async <T>(path: string, body: unknown): Promise<T> => request<T>('PUT', path, body);

export const fetchBootstrap = async (): Promise<BootstrapResponse> => {
  return await get<BootstrapResponse>('bootstrap');
};

export const login = async (payload: LoginPayload): Promise<LoginResult> => {
  return await request<LoginResult>('POST', 'auth/login', payload);
};

export interface PasswordResetPayload {
  userId: number;
}

export interface CompletePasswordResetPayload extends PasswordResetPayload {
  newPassword: string;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const initiatePasswordReset = async (
  payload: PasswordResetPayload
): Promise<PasswordResetResult> => {
  return await request<PasswordResetResult>('POST', 'auth/reset/initiate', payload);
};

export const completePasswordReset = async (
  payload: CompletePasswordResetPayload
): Promise<PasswordResetResult> => {
  return await request<PasswordResetResult>('POST', 'auth/reset/complete', payload);
};

export const syncRoles = async (roles: Role[]): Promise<Role[]> => {
  const response = await put<{ roles: Role[] }>('roles', { roles });
  return response.roles ?? [];
};

export const syncUsers = async (users: User[]): Promise<User[]> => {
  const response = await put<{ users: User[] }>('users', { users });
  return response.users ?? [];
};

export const syncApplicationTypes = async (
  applicationTypes: ApplicationType[]
): Promise<ApplicationType[]> => {
  const response = await put<{ applicationTypes: ApplicationType[] }>('application-types', {
    applicationTypes
  });
  return response.applicationTypes ?? [];
};

export const syncApplications = async (
  applications: ApplicationBundle[]
): Promise<ApplicationBundle[]> => {
  const response = await put<{ applications: ApplicationBundle[] }>('applications', { applications });
  return response.applications ?? [];
};

export const syncCompensationBonuses = async (
  bonuses: CompensationBonusInput[]
): Promise<CompensationBonus[]> => {
  const response = await put<{ bonuses: CompensationBonus[] }>('compensation-bonuses', { bonuses });
  return response.bonuses ?? [];
};

export interface TeacherScheduleResponse {
  teachers: TeacherScheduleSummary[];
}

export const analyzeTeacherSchedule = async (
  file: File
): Promise<TeacherScheduleResponse> => {
  if (!API_BASE) {
    throw new Error('API base URL not configured');
  }

  const url = `${API_BASE.replace(/\/$/, '')}/teacher-schedule/analyze`;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' },
    credentials: 'omit'
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Failed to analyze teacher schedule: ${res.status} ${message}`);
  }

  return (await res.json()) as TeacherScheduleResponse;
};

export interface SaveTeacherScheduleAssignmentPayload {
  teacher: string;
  userId: number;
  cambridgeCount: number;
  georgianCount: number;
}

export interface SaveTeacherScheduleAssignmentResponse {
  assignment: TeacherScheduleAssignment;
}

export const saveTeacherScheduleAssignment = async (
  payload: SaveTeacherScheduleAssignmentPayload
): Promise<SaveTeacherScheduleAssignmentResponse> => {
  if (!API_BASE) {
    throw new Error('API base URL not configured');
  }

  return await request<SaveTeacherScheduleAssignmentResponse>(
    'POST',
    'teacher-schedule/assign',
    payload
  );
};

export interface TeacherScheduleAssignmentsResponse {
  assignments: TeacherScheduleAssignment[];
}

export const fetchTeacherScheduleAssignments = async (
  userId?: number
): Promise<TeacherScheduleAssignmentsResponse> => {
  const query = typeof userId === 'number' && userId > 0 ? `?userId=${userId}` : '';
  return await get<TeacherScheduleAssignmentsResponse>(`teacher-schedule/assignments${query}`);
};

export interface TeacherScheduleBonusRatesResponse {
  rates: TeacherScheduleBonusRates;
}

export const fetchTeacherScheduleBonusRates = async (): Promise<TeacherScheduleBonusRatesResponse> => {
  return await get<TeacherScheduleBonusRatesResponse>('teacher-schedule/bonus');
};

export const saveTeacherScheduleBonusRates = async (
  rates: TeacherScheduleBonusRates
): Promise<TeacherScheduleBonusRatesResponse> => {
  return await request<TeacherScheduleBonusRatesResponse>('POST', 'teacher-schedule/bonus', rates);
};

export interface TeacherClassHoursResponse {
  plans: TeacherClassHoursPlan[];
}

export const fetchTeacherClassHours = async (
  userId?: number
): Promise<TeacherClassHoursResponse> => {
  const query = typeof userId === 'number' && userId > 0 ? `?userId=${userId}` : '';
  return await get<TeacherClassHoursResponse>(`learning/class-hours${query}`);
};

export interface SaveTeacherClassHoursPayload {
  userId: number;
  days: TeacherClassHoursDay[];
}

export interface SaveTeacherClassHoursResponse {
  plan: TeacherClassHoursPlan;
}

export const saveTeacherClassHours = async (
  payload: SaveTeacherClassHoursPayload
): Promise<SaveTeacherClassHoursResponse> => {
  return await request<SaveTeacherClassHoursResponse>('POST', 'learning/class-hours', payload);
};

export interface PayrollBatchesResponse {
  batches: PayrollBatch[];
}

export interface PayrollBatchResponse {
  batch: PayrollBatch;
}

export interface PayrollStatsResponse {
  stats: PayrollStats;
}

export interface CreatePayrollBatchPayload {
  month: string;
  actorId?: number | null;
}

export interface UpdatePayrollStatusPayload {
  batchId: number;
  status: string;
  actorId?: number | null;
}

export const fetchPayrollBatches = async (): Promise<PayrollBatchesResponse> => {
  return await get<PayrollBatchesResponse>('payroll/batches');
};

export const fetchPayrollBatch = async (batchId: number): Promise<PayrollBatchResponse> => {
  return await get<PayrollBatchResponse>(`payroll/batch?id=${batchId}`);
};

export const fetchPayrollStats = async (): Promise<PayrollStatsResponse> => {
  return await get<PayrollStatsResponse>('payroll/stats');
};

export const createPayrollBatch = async (
  payload: CreatePayrollBatchPayload
): Promise<PayrollBatchResponse> => {
  return await request<PayrollBatchResponse>('POST', 'payroll/batches/create', payload);
};

export const updatePayrollBatchStatus = async (
  payload: UpdatePayrollStatusPayload
): Promise<PayrollBatchResponse> => {
  return await request<PayrollBatchResponse>('POST', 'payroll/batches/update-status', payload);
};

export interface WorkCalendarResponse {
  days: WorkCalendarDay[];
}

export const fetchWorkCalendarDays = async (
  year: number,
  month: number
): Promise<WorkCalendarResponse> => {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  return await get<WorkCalendarResponse>(`work-calendar?${params.toString()}`);
};

export const saveWorkCalendarMonth = async (
  year: number,
  month: number,
  days: WorkCalendarDay[]
): Promise<WorkCalendarResponse> => {
  return await request<WorkCalendarResponse>('PUT', 'work-calendar', {
    year,
    month,
    days,
  });
};
