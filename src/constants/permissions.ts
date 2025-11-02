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
  { id: 'set_ticket_priority', name: 'თიკეტების პრიორიტეტების მართვა', category: 'Tickets' },
  { id: 'manage_request_types', name: 'განაცხადების ტიპების მართვა', category: 'Requests' },
  { id: 'manage_permissions', name: 'უფლებების მართვა', category: 'System' }
];

export const PERMISSION_LABELS: Record<string, { ka: string; en: string }> = {
  view_dashboard: { ka: 'მთავარი გვერდის ნახვა', en: 'View dashboard' },
  view_users: { ka: 'მომხმარებლების ნახვა', en: 'View users' },
  create_users: { ka: 'მომხმარებლების შექმნა', en: 'Create users' },
  edit_users: { ka: 'მომხმარებლების რედაქტირება', en: 'Edit users' },
  delete_users: { ka: 'მომხმარებლების წაშლა', en: 'Delete users' },
  view_roles: { ka: 'როლების ნახვა', en: 'View roles' },
  create_roles: { ka: 'როლების შექმნა', en: 'Create roles' },
  edit_roles: { ka: 'როლების რედაქტირება', en: 'Edit roles' },
  delete_roles: { ka: 'როლების წაშლა', en: 'Delete roles' },
  view_requests: { ka: 'მოთხოვნების ნახვა', en: 'View requests' },
  create_requests: { ka: 'მოთხოვნების შექმნა', en: 'Create requests' },
  approve_requests: { ka: 'მოთხოვნების დამტკიცება', en: 'Approve requests' },
  view_tickets: { ka: 'სერვის თიკეტების ნახვა', en: 'View tickets' },
  create_tickets: { ka: 'სერვის თიკეტების შექმნა', en: 'Create tickets' },
  update_tickets: { ka: 'სერვის თიკეტების განახლება', en: 'Update tickets' },
  set_ticket_priority: { ka: 'თიკეტების პრიორიტეტების მართვა', en: 'Manage ticket priority' },
  manage_request_types: { ka: 'განაცხადების ტიპების მართვა', en: 'Manage application types' },
  manage_permissions: { ka: 'უფლებების მართვა', en: 'Manage permissions' }
};

export const PERMISSION_CATEGORY_LABELS: Record<string, { ka: string; en: string }> = {
  Dashboard: { ka: 'დეშბორდი', en: 'Dashboard' },
  Users: { ka: 'მომხმარებლები', en: 'Users' },
  Roles: { ka: 'როლები', en: 'Roles' },
  Requests: { ka: 'მოთხოვნები', en: 'Requests' },
  Tickets: { ka: 'თიკეტები', en: 'Tickets' },
  System: { ka: 'სისტემა', en: 'System' }
};
