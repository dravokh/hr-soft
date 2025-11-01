import { Permission } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', name: 'მთავარი გვერდის ნახვა', category: 'Dashboard' },
  { id: 'view_users', name: 'მომხმარებლების ნახვა', category: 'Users' },
  { id: 'create_users', name: 'მომხმარებლების შექმნა', category: 'Users' },
  { id: 'edit_users', name: 'მომხმარებლების რედაქტირება', category: 'Users' },
  { id: 'delete_users', name: 'მომხმარებლების წაშლა', category: 'Users' },
  { id: 'view_roles', name: 'როლების ნახვა', category: 'Roles' },
  { id: 'create_roles', name: 'როლების შექმნა', category: 'Roles' },
  { id: 'edit_roles', name: 'როლების რედაქტირება', category: 'Roles' },
  { id: 'delete_roles', name: 'როლების წაშლა', category: 'Roles' },
  { id: 'view_requests', name: 'მოთხოვნების ნახვა', category: 'Requests' },
  { id: 'create_requests', name: 'მოთხოვნების შექმნა', category: 'Requests' },
  { id: 'approve_requests', name: 'მოთხოვნების დამტკიცება', category: 'Requests' },
  { id: 'view_tickets', name: 'სერვის თიკეტების ნახვა', category: 'Tickets' },
  { id: 'create_tickets', name: 'სერვის თიკეტების შექმნა', category: 'Tickets' },
  { id: 'update_tickets', name: 'სერვის თიკეტების განახლება', category: 'Tickets' },
  { id: 'manage_permissions', name: 'უფლებების მართვა', category: 'System' }
];
