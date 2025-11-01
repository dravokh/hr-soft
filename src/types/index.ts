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

export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string;
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
  tickets: Ticket[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadAllData: () => Promise<void>;
  saveRoles: (roles: Role[]) => Promise<void>;
  saveUsers: (users: User[]) => Promise<void>;
  saveTickets: (tickets: Ticket[]) => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
}
