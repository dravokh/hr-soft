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
  { id: 'view_hr', name: 'Access HR workspace', category: 'HR' },
  { id: 'manage_work_shifts', name: 'Manage work shifts', category: 'HR' },
  { id: 'manage_lesson_bonuses', name: 'Manage lesson bonuses', category: 'HR' },
  { id: 'view_payroll', name: 'View payroll workspace', category: 'Payroll' },
  { id: 'manage_payroll', name: 'Create and finalize payroll', category: 'Payroll' },
  { id: 'view_teacher_schedule', name: 'View teacher schedule', category: 'Teacher Schedule' },
  { id: 'analyze_teacher_schedule', name: 'Analyze teacher schedule files', category: 'Teacher Schedule' },
  { id: 'assign_teacher_schedule', name: 'Assign teacher schedule records', category: 'Teacher Schedule' },
  { id: 'manage_learning', name: 'Manage learning workspace', category: 'Learning' },
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
  view_hr: label('Access HR workspace'),
  manage_work_shifts: label('Manage work shifts'),
  manage_lesson_bonuses: label('Manage lesson bonuses'),
  view_payroll: label('View payroll workspace'),
  manage_payroll: label('Create and finalize payroll'),
  view_teacher_schedule: label('View teacher schedule'),
  analyze_teacher_schedule: label('Analyze teacher schedule files'),
  assign_teacher_schedule: label('Assign teacher schedule records'),
  manage_learning: label('Manage learning workspace'),
  reset_passwords: label('Reset passwords'),
  manage_permissions: label('Manage permissions')
};

export const PERMISSION_CATEGORY_LABELS: Record<string, { ka: string; en: string }> = {
  Dashboard: label('Dashboard'),
  Users: label('Users'),
  Roles: label('Roles'),
  Requests: label('Requests'),
  HR: label('HR'),
  Payroll: label('Payroll'),
  'Teacher Schedule': label('Teacher schedule'),
  Learning: label('Learning'),
  System: label('System')
};
