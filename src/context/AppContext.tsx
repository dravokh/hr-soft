import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { AppContextValue, LoginResult, Role, Session, Ticket, User } from '../types';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { storage } from '../utils/storage';

const STORAGE_KEYS = {
  ROLES: 'hr_soft_roles',
  USERS: 'hr_soft_users',
  TICKETS: 'hr_soft_tickets',
  SESSION: 'hr_soft_session'
};

const DEFAULT_ROLES: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'სისტემის ადმინისტრატორი',
    permissions: ALL_PERMISSIONS.map((permission) => permission.id)
  },
  {
    id: 2,
    name: 'HR',
    description: 'HR მენეჯერი',
    permissions: ['view_dashboard', 'view_users', 'view_requests', 'approve_requests', 'view_tickets', 'update_tickets']
  },
  {
    id: 3,
    name: 'Employee',
    description: 'თანამშრომელი',
    permissions: ['view_dashboard', 'view_requests', 'create_requests', 'view_tickets', 'create_tickets']
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@hr.com',
    phone: '+995 555 000 001',
    password: 'admin123',
    roleId: 1,
    avatar: 'A'
  },
  {
    id: 2,
    name: 'HR Manager',
    email: 'hr@hr.com',
    phone: '+995 555 000 002',
    password: 'hr123',
    roleId: 2,
    avatar: 'H'
  },
  {
    id: 3,
    name: 'Employee User',
    email: 'user@hr.com',
    phone: '+995 555 000 003',
    password: 'user123',
    roleId: 3,
    avatar: 'E'
  }
];

type StoredUser = Omit<User, 'phone'> & { phone?: string };

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 1,
    title: 'Onboarding laptop request',
    description: 'Need a laptop configured for the new marketing hire starting next Monday.',
    status: 'in_progress',
    priority: 'high',
    createdById: 2,
    assignedToId: 1,
    createdAt: '2024-05-01T08:30:00.000Z',
    updatedAt: '2024-05-02T09:15:00.000Z'
  },
  {
    id: 2,
    title: 'Update payroll bank details',
    description: 'Employee User submitted new banking information that must be reflected before the next payroll run.',
    status: 'open',
    priority: 'medium',
    createdById: 3,
    assignedToId: 2,
    createdAt: '2024-05-10T12:00:00.000Z',
    updatedAt: '2024-05-10T12:00:00.000Z'
  },
  {
    id: 3,
    title: 'Broken office badge',
    description: 'My access badge is no longer working after the hardware refresh. Requesting a replacement.',
    status: 'resolved',
    priority: 'low',
    createdById: 3,
    assignedToId: 2,
    createdAt: '2024-04-18T07:20:00.000Z',
    updatedAt: '2024-04-19T10:45:00.000Z'
  }
];

const AppContext = createContext<AppContextValue | undefined>(undefined);

const ensureAdminPermissions = (roles: Role[]): Role[] => {
  return roles.map((role) => {
    if (role.id === 1) {
      return {
        ...role,
        permissions: ALL_PERMISSIONS.map((permission) => permission.id)
      };
    }
    return role;
  });
};

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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

      const storedTickets = storage.get<Ticket[]>(STORAGE_KEYS.TICKETS);
      const resolvedTickets = storedTickets ?? DEFAULT_TICKETS;
      setTickets(resolvedTickets);
      storage.set(STORAGE_KEYS.TICKETS, resolvedTickets);

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
  }, []);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const user = users.find((candidate) => candidate.email === email && candidate.password === password);

    if (!user) {
      return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
    }

    const session: Session = { userId: user.id, timestamp: Date.now() };
    storage.set(STORAGE_KEYS.SESSION, session);
    setCurrentUser(user);
    setIsAuthenticated(true);

    return { success: true };
  }, [users]);

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
  }, []);

  const saveTickets = useCallback(async (newTickets: Ticket[]): Promise<void> => {
    setTickets(newTickets);
    storage.set(STORAGE_KEYS.TICKETS, newTickets);
  }, []);

  const hasPermission = useCallback((permissionId: string): boolean => {
    if (!currentUser) {
      return false;
    }

    const userRole = roles.find((role) => role.id === currentUser.roleId);
    return Boolean(userRole?.permissions.includes(permissionId));
  }, [currentUser, roles]);

  const value: AppContextValue = useMemo(
    () => ({
      roles,
      users,
      tickets,
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveTickets,
      hasPermission
    }),
    [
      roles,
      users,
      tickets,
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveTickets,
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
