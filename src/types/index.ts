export interface Permission {
  id: string;
  name: string;
  category: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: number;
  avatar: string;
}

export interface Session {
  userId: number;
  timestamp: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AppContextValue {
  roles: Role[];
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadAllData: () => Promise<void>;
  saveRoles: (roles: Role[]) => Promise<void>;
  saveUsers: (users: User[]) => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
}
