import type {
  ApplicationBundle,
  ApplicationType,
  CompensationBonus,
  CompensationBonusInput,
  Role,
  User
} from '../types';

const RAW_ENV = ((import.meta as unknown) as { env?: Record<string, unknown> }).env ?? {};
const API_BASE = typeof RAW_ENV.VITE_API_URL === 'string' ? (RAW_ENV.VITE_API_URL as string) : undefined;

export const apiEnabled = Boolean(API_BASE && API_BASE.trim().length);

export interface BootstrapResponse {
  roles: Role[];
  users: User[];
  applicationTypes: ApplicationType[];
  applications: ApplicationBundle[];
  compensationBonuses: CompensationBonus[];
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
    credentials: 'omit'
  };

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


console.log('VITE_API_URL =', RAW_ENV.VITE_API_URL);
// (optional) expose to window for quick console access:
(window as any).__API__ = RAW_ENV.VITE_API_URL;
