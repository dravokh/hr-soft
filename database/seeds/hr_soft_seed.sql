-- Seed data for HR Soft
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM user_compensation_bonuses;
DELETE FROM compensation_bonuses;
DELETE FROM application_delegates;
DELETE FROM application_audit_log;
DELETE FROM application_attachments;
DELETE FROM application_field_values;
DELETE FROM applications;
DELETE FROM application_type_sla;
DELETE FROM application_type_flow;
DELETE FROM application_type_fields;
DELETE FROM application_types;
DELETE FROM role_permissions;
DELETE FROM users;
DELETE FROM permissions;
DELETE FROM roles;
DELETE FROM tickets;
DELETE FROM sessions;

ALTER TABLE applications AUTO_INCREMENT = 1;
ALTER TABLE application_type_fields AUTO_INCREMENT = 1;
ALTER TABLE application_attachments AUTO_INCREMENT = 1;
ALTER TABLE application_audit_log AUTO_INCREMENT = 1;
ALTER TABLE application_delegates AUTO_INCREMENT = 1;
ALTER TABLE application_types AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE roles AUTO_INCREMENT = 1;
ALTER TABLE compensation_bonuses AUTO_INCREMENT = 1;
ALTER TABLE tickets AUTO_INCREMENT = 1;
ALTER TABLE sessions AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO permissions (id, name, category) VALUES
  ('view_dashboard', 'View dashboard', 'Dashboard'),
  ('view_users', 'View users', 'Users'),
  ('create_users', 'Create users', 'Users'),
  ('edit_users', 'Edit users', 'Users'),
  ('delete_users', 'Delete users', 'Users'),
  ('view_roles', 'View roles', 'Roles'),
  ('create_roles', 'Create roles', 'Roles'),
  ('edit_roles', 'Edit roles', 'Roles'),
  ('delete_roles', 'Delete roles', 'Roles'),
  ('view_requests', 'View requests', 'Requests'),
  ('create_requests', 'Create requests', 'Requests'),
  ('approve_requests', 'Approve requests', 'Requests'),
  ('manage_request_types', 'Manage request types', 'Requests'),
  ('print_requests', 'Print requests', 'Requests'),
  ('reset_passwords', 'Reset passwords', 'System'),
  ('manage_permissions', 'Manage permissions', 'System');

INSERT INTO roles (id, name, description) VALUES
  (1, 'Admin', 'Full system access and configuration'),
  (2, 'HR', 'Manages users and approvals'),
  (3, 'Employee', 'Submits personal requests');

INSERT INTO role_permissions (role_id, permission_id) VALUES
  (1, 'view_dashboard'),
  (1, 'view_users'),
  (1, 'create_users'),
  (1, 'edit_users'),
  (1, 'delete_users'),
  (1, 'view_roles'),
  (1, 'create_roles'),
  (1, 'edit_roles'),
  (1, 'delete_roles'),
  (1, 'view_requests'),
  (1, 'create_requests'),
  (1, 'approve_requests'),
  (1, 'manage_request_types'),
  (1, 'print_requests'),
  (1, 'reset_passwords'),
  (1, 'manage_permissions'),
  (2, 'view_dashboard'),
  (2, 'view_users'),
  (2, 'view_requests'),
  (2, 'approve_requests'),
  (2, 'manage_request_types'),
  (2, 'print_requests'),
  (2, 'reset_passwords'),
  (3, 'view_dashboard'),
  (3, 'view_requests'),
  (3, 'create_requests');

INSERT INTO users (
  id,
  name,
  first_name,
  last_name,
  email,
  phone,
  personal_id,
  password,
  base_salary,
  vacation_days,
  late_hours_allowed,
  penalty_percent,
  role_id,
  avatar,
  must_reset_password
) VALUES
  (1, 'Admin User', 'Admin', 'User', 'admin@hr.com', '+995 555 000 001', '01001000001', 'admin123', 4500.00, 24, 4, 2.00, 1, 'A', 0),
  (2, 'HR Manager', 'HR', 'Manager', 'hr@hr.com', '+995 555 000 002', '01001000002', 'hr123', 3200.00, 24, 4, 1.00, 2, 'H', 0),
  (3, 'Employee User', 'Employee', 'User', 'user@hr.com', '+995 555 000 003', '01001000003', 'user123', 2200.00, 24, 4, 0.00, 3, 'E', 0);

INSERT INTO compensation_bonuses (id, parent_id, name, percent) VALUES
  (1, NULL, 'განათლება', NULL),
  (2, 1, 'ბაკალავრი', 5.00),
  (3, 1, 'მაგისტრი', 10.00),
  (4, 1, 'დოქტორი', 15.00),
  (5, NULL, 'გამოცდილება', NULL),
  (6, 5, '1-3 წელი', 5.00),
  (7, 5, '3-5 წელი', 10.00),
  (8, 5, '5+ წელი', 15.00);

INSERT INTO user_compensation_bonuses (user_id, bonus_id) VALUES
  (1, 4),
  (1, 7),
  (2, 3),
  (2, 6),
  (3, 2);

INSERT INTO application_types (
  id,
  name_ka,
  name_en,
  description_ka,
  description_en,
  icon,
  color
) VALUES (
  1,
  'Leave request',
  'Leave request',
  'Approval workflow for planned or urgent leave requests.',
  'Approval workflow for planned or urgent leave requests.',
  'CalendarDays',
  'bg-sky-500'
);

INSERT INTO application_type_fields (
  type_id,
  field_key,
  label_ka,
  label_en,
  field_type,
  is_required,
  placeholder_ka,
  placeholder_en,
  helper_ka,
  helper_en
) VALUES
  (1, 'reason', 'Leave reason', 'Leave reason', 'textarea', 1, NULL, NULL, 'Provide context for the leave request.', 'Provide context for the leave request.'),
  (1, 'start_date', 'Start date', 'Start date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'end_date', 'End date', 'End date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'contact_phone', 'Contact phone', 'Contact phone', 'text', 1, '+995 5XX XXX XXX', '+995 5XX XXX XXX', NULL, NULL),
  (1, 'additional_comment', 'Additional comment', 'Additional comment', 'textarea', 0, NULL, NULL, 'Extra details for approvers.', 'Extra details for approvers.');

INSERT INTO application_type_flow (type_id, step_index, role_id) VALUES
  (1, 0, 2),
  (1, 1, 1);

INSERT INTO application_type_sla (type_id, step_index, seconds, expire_action) VALUES
  (1, 0, 172800, 'AUTO_APPROVE'),
  (1, 1, 259200, 'BOUNCE_BACK');

