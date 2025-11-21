-- Seed data for HR Soft
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM user_compensation_bonuses;
DELETE FROM user_work_schedules;
DELETE FROM compensation_bonuses;
DELETE FROM application_delegates;
DELETE FROM application_audit_log;
DELETE FROM application_attachments;
DELETE FROM application_extra_bonuses;
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
DELETE FROM work_calendar_days;
DELETE FROM teacher_class_hours;

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
ALTER TABLE work_calendar_days AUTO_INCREMENT = 1;

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
  ('view_hr', 'Access HR workspace', 'HR'),
  ('manage_work_shifts', 'Manage work shifts', 'HR'),
  ('manage_lesson_bonuses', 'Manage lesson bonuses', 'HR'),
  ('view_teacher_schedule', 'View teacher schedule', 'Teacher Schedule'),
  ('analyze_teacher_schedule', 'Analyze teacher schedule files', 'Teacher Schedule'),
  ('assign_teacher_schedule', 'Assign teacher schedule records', 'Teacher Schedule'),
  ('manage_learning', 'Manage learning workspace', 'Learning'),
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
  (1, 'view_hr'),
  (1, 'manage_work_shifts'),
  (1, 'manage_lesson_bonuses'),
  (1, 'view_teacher_schedule'),
  (1, 'analyze_teacher_schedule'),
  (1, 'assign_teacher_schedule'),
  (1, 'manage_learning'),
  (1, 'print_requests'),
  (1, 'reset_passwords'),
  (1, 'manage_permissions'),
  (2, 'view_dashboard'),
  (2, 'view_users'),
  (2, 'view_requests'),
  (2, 'approve_requests'),
  (2, 'manage_request_types'),
  (2, 'view_hr'),
  (2, 'manage_work_shifts'),
  (2, 'manage_lesson_bonuses'),
  (2, 'view_teacher_schedule'),
  (2, 'analyze_teacher_schedule'),
  (2, 'assign_teacher_schedule'),
  (2, 'manage_learning'),
  (2, 'print_requests'),
  (2, 'reset_passwords'),
  (3, 'view_dashboard'),
  (3, 'view_requests'),
  (3, 'create_requests');

INSERT INTO work_calendar_days (work_date, is_working, note) VALUES
  ('2025-01-01', 0, 'New Year Holiday'),
  ('2025-01-07', 0, 'Orthodox Christmas');

INSERT INTO users (
  id,
  name,
  first_name,
  last_name,
  email,
  phone,
  personal_id,
  subject,
  password,
  base_salary,
  vacation_days,
  late_hours_allowed,
  penalty_percent,
  vacation_days_used,
  grace_minutes_used,
  penalty_minutes_used,
  role_id,
  avatar,
  must_reset_password
) VALUES
  (1, 'Admin User', 'Admin', 'User', 'admin@hr.com', '+995 555 000 001', '01001000001', 'Mathematics', 'admin123', 4500.00, 24, 4, 2.00, 0, 0, 0, 1, 'A', 0),
  (2, 'HR Manager', 'HR', 'Manager', 'hr@hr.com', '+995 555 000 002', '01001000002', 'Human Resources', 'hr123', 3200.00, 24, 4, 1.00, 0, 0, 0, 2, 'H', 0),
  (3, 'Employee User', 'Employee', 'User', 'user@hr.com', '+995 555 000 003', '01001000003', 'Science', 'user123', 2200.00, 24, 4, 0.00, 0, 0, 0, 3, 'E', 0);

INSERT INTO compensation_bonuses (id, parent_id, name, percent, amount) VALUES
  (1, NULL, '?????????', NULL, NULL),
  (2, 1, '?????????', 5.00, NULL),
  (3, 1, '????????', 10.00, NULL),
  (4, 1, '???????', 15.00, NULL),
  (5, NULL, '???????????', NULL, NULL),
  (6, 5, '1-3 ????', 5.00, NULL),
  (7, 5, '3-5 ????', 10.00, NULL),
  (8, 5, '5+ ????', 15.00, NULL);

INSERT INTO user_compensation_bonuses (user_id, bonus_id) VALUES
  (1, 4),
  (1, 7),
  (2, 3),
  (2, 6),
  (3, 2);

INSERT INTO user_work_schedules (
  user_id,
  day_of_week,
  is_working,
  start_time,
  end_time,
  break_minutes
) VALUES
  (1, 'monday', 1, '09:00:00', '18:00:00', 60),
  (1, 'tuesday', 1, '09:00:00', '18:00:00', 60),
  (1, 'wednesday', 1, '09:00:00', '18:00:00', 60),
  (1, 'thursday', 1, '09:00:00', '18:00:00', 60),
  (1, 'friday', 1, '09:00:00', '18:00:00', 60),
  (1, 'saturday', 0, NULL, NULL, 0),
  (1, 'sunday', 0, NULL, NULL, 0),
  (2, 'monday', 1, '09:00:00', '18:00:00', 60),
  (2, 'tuesday', 1, '09:00:00', '18:00:00', 60),
  (2, 'wednesday', 1, '09:00:00', '18:00:00', 60),
  (2, 'thursday', 1, '09:00:00', '18:00:00', 60),
  (2, 'friday', 1, '09:00:00', '18:00:00', 60),
  (2, 'saturday', 0, NULL, NULL, 0),
  (2, 'sunday', 0, NULL, NULL, 0),
  (3, 'monday', 1, '10:00:00', '19:00:00', 45),
  (3, 'tuesday', 1, '10:00:00', '19:00:00', 45),
  (3, 'wednesday', 1, '10:00:00', '19:00:00', 45),
  (3, 'thursday', 1, '10:00:00', '19:00:00', 45),
  (3, 'friday', 1, '10:00:00', '19:00:00', 45),
  (3, 'saturday', 0, NULL, NULL, 0),
  (3, 'sunday', 0, NULL, NULL, 0);

INSERT INTO teacher_class_hours (
  user_id,
  day_of_week,
  cambridge_hours,
  georgian_hours,
  created_at,
  updated_at
) VALUES
  (1, 'monday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'tuesday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'wednesday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'thursday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'friday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'saturday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (1, 'sunday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'monday', 2, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'tuesday', 2, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'wednesday', 2, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'thursday', 2, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'friday', 1, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'saturday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (2, 'sunday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'monday', 1, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'tuesday', 1, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'wednesday', 1, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'thursday', 1, 1, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'friday', 1, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'saturday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00'),
  (3, 'sunday', 0, 0, '2024-01-01 09:00:00', '2024-01-01 09:00:00');

INSERT INTO application_types (
  id,
  name_ka,
  name_en,
  description_ka,
  description_en,
  icon,
  color,
  uses_vacation_calculator,
  uses_grace_period_tracker,
  uses_penalty_tracker,
  uses_extra_bonus_tracker
) VALUES
  (
    1,
    'Leave request',
    'Leave request',
    'Approval workflow for planned or urgent leave requests.',
    'Approval workflow for planned or urgent leave requests.',
    'CalendarDays',
    'bg-sky-500',
    1,
    0,
    0,
    0
  ),
  (
    2,
    'Business trip request',
    'Business trip request',
    'Approval for travel itineraries and budget expectations.',
    'Approval for travel itineraries and budget expectations.',
    'Plane',
    'bg-indigo-500',
    0,
    0,
    0,
    0
  ),
  (
    3,
    'Extra hours bonus',
    'Extra hours bonus',
    'Request overtime bonus payout for approved extra hours.',
    'Request overtime bonus payout for approved extra hours.',
    'TimerReset',
    'bg-emerald-500',
    0,
    0,
    0,
    1
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
  (1, 'additional_comment', 'Additional comment', 'Additional comment', 'textarea', 0, NULL, NULL, 'Extra details for approvers.', 'Extra details for approvers.'),
  (2, 'destination', 'Destination', 'Destination', 'text', 1, 'e.g. Barcelona, Spain', 'e.g. Barcelona, Spain', NULL, NULL),
  (2, 'travel_dates', 'Travel dates', 'Travel dates', 'date_range', 1, NULL, NULL, 'Include departure and return days.', 'Include departure and return days.'),
  (2, 'budget', 'Budget', 'Budget', 'number', 1, 'e.g. 2400', 'e.g. 2400', NULL, NULL),
  (2, 'purpose', 'Purpose', 'Purpose', 'textarea', 1, NULL, NULL, NULL, NULL),
  (3, 'reason', 'Extra hours reason', 'Extra hours reason', 'textarea', 1, NULL, NULL, 'Explain why the overtime is needed.', 'Explain why the overtime is needed.'),
  (3, 'start_date', 'Work date', 'Work date', 'date', 1, NULL, NULL, NULL, NULL),
  (3, 'end_date', 'End date', 'End date', 'date', 1, NULL, NULL, NULL, NULL),
  (3, 'start_time', 'Start time', 'Start time', 'time', 1, NULL, NULL, 'Provide only the overtime window.', 'Provide only the overtime window.'),
  (3, 'end_time', 'End time', 'End time', 'time', 1, NULL, NULL, NULL, NULL),
  (3, 'additional_comment', 'Additional comment', 'Additional comment', 'textarea', 0, NULL, NULL, NULL, NULL);

INSERT INTO application_type_flow (type_id, step_index, role_id) VALUES
  (1, 0, 2),
  (1, 1, 1),
  (2, 0, 2),
  (2, 1, 1),
  (3, 0, 2),
  (3, 1, 1);

INSERT INTO application_type_sla (type_id, step_index, seconds, expire_action) VALUES
  (1, 0, 172800, 'AUTO_APPROVE'),
  (1, 1, 259200, 'BOUNCE_BACK'),
  (2, 0, 129600, 'AUTO_APPROVE'),
  (2, 1, 172800, 'AUTO_APPROVE'),
  (3, 0, 86400, 'AUTO_APPROVE'),
  (3, 1, 172800, 'AUTO_APPROVE');

