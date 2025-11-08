import { Permission } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', name: 'View dashboard', category: 'Dashboard' },
  { id: 'view_users', name: 'View users', category: 'Users' },
  { id: 'create_users', name: 'Create users', category: 'Users' },
  { id: 'edit_users', name: 'Edit users', category: 'Users' },
  { id: 'delete_users', name: 'Delete users', category: 'Users' },
  { id: 'view_roles', name: 'View roles', category: 'Roles' },
  { id: 'create_roles', name: 'Create roles', category: 'Roles' },
  { id: 'edit_roles', name: 'Edit roles', category: 'Roles' },
  { id: 'delete_roles', name: 'Delete roles', category: 'Roles' },
  { id: 'view_requests', name: 'View requests', category: 'Requests' },
  { id: 'create_requests', name: 'Create requests', category: 'Requests' },
  { id: 'approve_requests', name: 'Approve requests', category: 'Requests' },
  { id: 'manage_request_types', name: 'Manage request types', category: 'Requests' },
  { id: 'print_requests', name: 'Print requests', category: 'Requests' },
  { id: 'reset_passwords', name: 'Reset passwords', category: 'System' },
  { id: 'manage_permissions', name: 'Manage permissions', category: 'System' }
];

const label = (value: string) => ({ ka: value, en: value });

export const PERMISSION_LABELS: Record<string, { ka: string; en: string }> = {
  view_dashboard: label('View dashboard'),
  view_users: label('View users'),
  create_users: label('Create users'),
  edit_users: label('Edit users'),
  delete_users: label('Delete users'),
  view_roles: label('View roles'),
  create_roles: label('Create roles'),
  edit_roles: label('Edit roles'),
  delete_roles: label('Delete roles'),
  view_requests: label('View requests'),
  create_requests: label('Create requests'),
  approve_requests: label('Approve requests'),
  manage_request_types: label('Manage request types'),
  print_requests: label('Print requests'),
  reset_passwords: label('Reset passwords'),
  manage_permissions: label('Manage permissions')
};

export const PERMISSION_CATEGORY_LABELS: Record<string, { ka: string; en: string }> = {
  Dashboard: label('Dashboard'),
  Users: label('Users'),
  Roles: label('Roles'),
  Requests: label('Requests'),
  System: label('System')
};
