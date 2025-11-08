-- ------------------------------------------------------
-- HR Soft demo database
-- Ready for import in phpMyAdmin or MySQL-compatible tools
-- ------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

START TRANSACTION;

CREATE DATABASE IF NOT EXISTS `hr_soft` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hr_soft`;

-- Drop tables if they already exist so the script can be re-imported safely
DROP TABLE IF EXISTS `application_delegates`;
DROP TABLE IF EXISTS `application_audit_log`;
DROP TABLE IF EXISTS `application_attachments`;
DROP TABLE IF EXISTS `application_field_values`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `application_type_sla`;
DROP TABLE IF EXISTS `application_type_flow`;
DROP TABLE IF EXISTS `application_type_fields`;
DROP TABLE IF EXISTS `application_types`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `user_compensation_bonuses`;
DROP TABLE IF EXISTS `compensation_bonuses`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;

-- Role definitions
CREATE TABLE `roles` (
  `id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
  (1, 'Admin', 'ßâíßâÿßâíßâóßâößâ¢ßâÿßâí ßâÉßâôßâ¢ßâÿßâ£ßâÿßâíßâóßâáßâÉßâóßâ¥ßâáßâÿ'),
  (2, 'HR', 'HR ßâ¢ßâößâ£ßâößâ»ßâößâáßâÿ'),
  (3, 'Employee', 'ßâùßâÉßâ£ßâÉßâ¢ßâ¿ßâáßâ¥ßâ¢ßâößâÜßâÿ');

-- Permission catalog
CREATE TABLE `permissions` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`id`, `name`, `category`) VALUES
  ('view_dashboard', 'ßâ¢ßâùßâÉßâòßâÉßâáßâÿ ßâÆßâòßâößâáßâôßâÿßâí ßâ£ßâÉßâ«ßâòßâÉ', 'Dashboard'),
  ('view_users', 'ßâ¢ßâ¥ßâ¢ßâ«ßâ¢ßâÉßâáßâößâæßâÜßâößâæßâÿßâí ßâ£ßâÉßâ«ßâòßâÉ', 'Users'),
  ('create_users', 'ßâ¢ßâ¥ßâ¢ßâ«ßâ¢ßâÉßâáßâößâæßâÜßâößâæßâÿßâí ßâ¿ßâößâÑßâ¢ßâ£ßâÉ', 'Users'),
  ('edit_users', 'ßâ¢ßâ¥ßâ¢ßâ«ßâ¢ßâÉßâáßâößâæßâÜßâößâæßâÿßâí ßâáßâößâôßâÉßâÑßâóßâÿßâáßâößâæßâÉ', 'Users'),
  ('delete_users', 'ßâ¢ßâ¥ßâ¢ßâ«ßâ¢ßâÉßâáßâößâæßâÜßâößâæßâÿßâí ßâ¼ßâÉßâ¿ßâÜßâÉ', 'Users'),
  ('view_roles', 'ßâáßâ¥ßâÜßâößâæßâÿßâí ßâ£ßâÉßâ«ßâòßâÉ', 'Roles'),
  ('create_roles', 'ßâáßâ¥ßâÜßâößâæßâÿßâí ßâ¿ßâößâÑßâ¢ßâ£ßâÉ', 'Roles'),
  ('edit_roles', 'ßâáßâ¥ßâÜßâößâæßâÿßâí ßâáßâößâôßâÉßâÑßâóßâÿßâáßâößâæßâÉ', 'Roles'),
  ('delete_roles', 'ßâáßâ¥ßâÜßâößâæßâÿßâí ßâ¼ßâÉßâ¿ßâÜßâÉ', 'Roles'),
  ('view_requests', 'ßâ¢ßâ¥ßâùßâ«ßâ¥ßâòßâ£ßâößâæßâÿßâí ßâ£ßâÉßâ«ßâòßâÉ', 'Requests'),
  ('create_requests', 'ßâ¢ßâ¥ßâùßâ«ßâ¥ßâòßâ£ßâößâæßâÿßâí ßâ¿ßâößâÑßâ¢ßâ£ßâÉ', 'Requests'),
  ('approve_requests', 'ßâ¢ßâ¥ßâùßâ«ßâ¥ßâòßâ£ßâößâæßâÿßâí ßâôßâÉßâ¢ßâóßâÖßâÿßâ¬ßâößâæßâÉ', 'Requests'),
  ('view_tickets', 'ßâíßâößâáßâòßâÿßâí ßâùßâÿßâÖßâößâóßâößâæßâÿßâí ßâ£ßâÉßâ«ßâòßâÉ', 'Tickets'),
  ('create_tickets', 'ßâíßâößâáßâòßâÿßâí ßâùßâÿßâÖßâößâóßâößâæßâÿßâí ßâ¿ßâößâÑßâ¢ßâ£ßâÉ', 'Tickets'),
  ('update_tickets', 'ßâíßâößâáßâòßâÿßâí ßâùßâÿßâÖßâößâóßâößâæßâÿßâí ßâÆßâÉßâ£ßâÉßâ«ßâÜßâößâæßâÉ', 'Tickets'),
  ('set_ticket_priority', 'ßâùßâÿßâÖßâößâóßâößâæßâÿßâí ßâ₧ßâáßâÿßâ¥ßâáßâÿßâóßâößâóßâößâæßâÿßâí ßâ¢ßâÉßâáßâùßâòßâÉ', 'Tickets'),
  ('manage_request_types', 'ßâÆßâÉßâ£ßâÉßâ¬ßâ«ßâÉßâôßâößâæßâÿßâí ßâóßâÿßâ₧ßâößâæßâÿßâí ßâ¢ßâÉßâáßâùßâòßâÉ', 'Requests'),
  ('manage_permissions', 'ßâúßâñßâÜßâößâæßâößâæßâÿßâí ßâ¢ßâÉßâáßâùßâòßâÉ', 'System');

-- Junction table linking roles to their permissions
CREATE TABLE `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `role_permissions_role_id_fk`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_permission_id_fk`
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grant every permission to the admin role
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1 AS role_id, `id` AS permission_id FROM `permissions`;

-- HR role permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (2, 'view_dashboard'),
  (2, 'view_users'),
  (2, 'view_requests'),
  (2, 'approve_requests'),
  (2, 'view_tickets'),
  (2, 'update_tickets'),
  (2, 'set_ticket_priority'),
  (2, 'manage_request_types');

-- Employee role permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (3, 'view_dashboard'),
  (3, 'view_requests'),
  (3, 'create_requests'),
  (3, 'view_tickets'),
  (3, 'create_tickets');

-- User accounts
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `personal_id` VARCHAR(20) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `base_salary` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `vacation_days` INT NOT NULL DEFAULT 24,
  `late_hours_allowed` INT NOT NULL DEFAULT 4,
  `penalty_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `role_id` INT NOT NULL,
  `avatar` VARCHAR(5) NOT NULL,
  `must_reset_password` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  CONSTRAINT `users_role_id_fk`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `compensation_bonuses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `parent_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `percent` DECIMAL(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `compensation_bonuses_parent_fk`
    FOREIGN KEY (`parent_id`) REFERENCES `compensation_bonuses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_compensation_bonuses` (
  `user_id` INT NOT NULL,
  `bonus_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `bonus_id`),
  CONSTRAINT `ucb_user_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ucb_bonus_fk`
    FOREIGN KEY (`bonus_id`) REFERENCES `compensation_bonuses` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (
  `id`,
  `name`,
  `first_name`,
  `last_name`,
  `email`,
  `phone`,
  `personal_id`,
  `password`,
  `base_salary`,
  `vacation_days`,
  `late_hours_allowed`,
  `penalty_percent`,
  `role_id`,
  `avatar`,
  `must_reset_password`
) VALUES
  (1, 'Admin User', 'Admin', 'User', 'admin@hr.com', '+995 555 000 001', '01001000001', 'admin123', 4500.00, 24, 4, 2.00, 1, 'A', 0),
  (2, 'HR Manager', 'HR', 'Manager', 'hr@hr.com', '+995 555 000 002', '01001000002', 'hr123', 3200.00, 24, 4, 1.00, 2, 'H', 0),
  (3, 'Employee User', 'Employee', 'User', 'user@hr.com', '+995 555 000 003', '01001000003', 'user123', 2200.00, 24, 4, 0.00, 3, 'E', 0);

ALTER TABLE `users`
  AUTO_INCREMENT = 4;

INSERT INTO `compensation_bonuses` (`id`, `parent_id`, `name`, `percent`) VALUES
  (1, NULL, 'განათლება', NULL),
  (2, 1, 'ბაკალავრი', 5.00),
  (3, 1, 'მაგისტრი', 10.00),
  (4, 1, 'დოქტორი', 15.00),
  (5, NULL, 'გამოცდილება', NULL),
  (6, 5, '1-3 წელი', 5.00),
  (7, 5, '3-5 წელი', 10.00),
  (8, 5, '5+ წელი', 15.00);

INSERT INTO `user_compensation_bonuses` (`user_id`, `bonus_id`) VALUES
  (1, 4),
  (1, 7),
  (2, 3),
  (2, 6),
  (3, 2);

-- Application catalog and records
CREATE TABLE `application_types` (
  `id` INT NOT NULL,
  `name_ka` VARCHAR(150) NOT NULL,
  `name_en` VARCHAR(150) NOT NULL,
  `description_ka` VARCHAR(255) NOT NULL,
  `description_en` VARCHAR(255) NOT NULL,
  `icon` VARCHAR(50) NOT NULL,
  `color` VARCHAR(30) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_types` (`id`, `name_ka`, `name_en`, `description_ka`, `description_en`, `icon`, `color`) VALUES
  (1, 'ßâ¿ßâòßâößâæßâúßâÜßâößâæßâÿßâí ßâÆßâÉßâ£ßâÉßâ¬ßâ«ßâÉßâôßâÿ', 'Leave request', 'ßâôßâÉßâÆßâößâÆßâ¢ßâÿßâÜßâÿ ßâÉßâ£ ßâúßâ¬ßâÉßâæßâößâôßâÿ ßâ¿ßâòßâößâæßâúßâÜßâößâæßâößâæßâÿßâí ßâôßâÉßâ¢ßâóßâÖßâÿßâ¬ßâößâæßâÿßâí ßâíßâÉßâ¢ßâúßâ¿ßâÉßâ¥ ßâ₧ßâáα┤òα╡ìα┤░ßâößâíßâÿ.', 'Approval workflow for planned or urgent leave requests.', 'CalendarDays', 'bg-sky-500'),
  (2, 'ßâÖßâ¥ßâ¢ßâÉßâ£ßâôßâÿßâáßâößâæßâÿßâí ßâÆßâÉßâ£ßâÉßâ¬ßâ«ßâÉßâôßâÿ', 'Business trip request', 'ßâÖßâ¥ßâ¢ßâÉßâ£ßâôßâÿßâáßâößâæßâÉßâíßâùßâÉßâ£ ßâôßâÉßâÖßâÉßâòßâ¿ßâÿßâáßâößâæßâúßâÜßâÿ ßâ«ßâÉßâáßâ»ßâößâæßâÿßâíßâÉ ßâôßâÉ ßâôßâÉßâÆßâößâÆßâ¢ßâòßâÿßâí ßâôßâÉßâ¢ßâóßâÖßâÿßâ¬ßâößâæßâÉ.', 'Approval for travel itineraries and budget expectations.', 'Plane', 'bg-indigo-500');

CREATE TABLE `application_type_fields` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_id` INT NOT NULL,
  `field_key` VARCHAR(100) NOT NULL,
  `label_ka` VARCHAR(150) NOT NULL,
  `label_en` VARCHAR(150) NOT NULL,
  `field_type` VARCHAR(20) NOT NULL,
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `placeholder_ka` VARCHAR(150) DEFAULT NULL,
  `placeholder_en` VARCHAR(150) DEFAULT NULL,
  `helper_ka` VARCHAR(255) DEFAULT NULL,
  `helper_en` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `application_type_fields_type_id_idx` (`type_id`),
  CONSTRAINT `application_type_fields_type_fk`
    FOREIGN KEY (`type_id`) REFERENCES `application_types` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_type_fields`
  (`type_id`, `field_key`, `label_ka`, `label_en`, `field_type`, `is_required`, `placeholder_ka`, `placeholder_en`, `helper_ka`, `helper_en`)
VALUES
  (1, 'reason', 'ßâ¿ßâòßâößâæßâúßâÜßâößâæßâÿßâí ßâ¢ßâÿßâûßâößâûßâÿ', 'Reason for leave', 'textarea', 1, 'ßâ¢ßâ¥ßâÖßâÜßâößâô ßâÉßâªßâ¼ßâößâáßâößâù ßâ¢ßâÿßâûßâößâûßâÿΓÇª', 'Describe the reasonΓÇª', NULL, NULL),
  (1, 'start_date', 'ßâôßâÉßâ¼ßâºßâößâæßâÿßâí ßâùßâÉßâáßâÿßâªßâÿ', 'Start date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'end_date', 'ßâôßâÉßâíßâáßâúßâÜßâößâæßâÿßâí ßâùßâÉßâáßâÿßâªßâÿ', 'End date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'contact_phone', 'ßâíßâÉßâÖßâ¥ßâ£ßâóßâÉßâÑßâóßâ¥ ßâ£ßâ¥ßâ¢ßâößâáßâÿ', 'Contact phone', 'text', 1, '+995 5XX XXX XXX', '+995 5XX XXX XXX', NULL, NULL),
  (1, 'additional_comment', 'ßâôßâÉßâ¢ßâÉßâóßâößâæßâÿßâùßâÿ ßâÖßâ¥ßâ¢ßâößâ£ßâóßâÉßâáßâÿ', 'Additional comment', 'textarea', 0, NULL, NULL, 'ßâ¢ßâÿßâúßâùßâÿßâùßâößâù ßâôßâÉßâ¢ßâÉßâóßâößâæßâÿßâùßâÿ ßâÿßâ£ßâñßâ¥ßâáßâ¢ßâÉßâ¬ßâÿßâÉ ßâíßâÉßâ¡ßâÿßâáßâ¥ßâößâæßâÿßâí ßâ¿ßâößâ¢ßâùßâ«ßâòßâößâòßâÉßâ¿ßâÿ.', 'Provide extra context if needed.'),
  (2, 'destination', 'ßâôßâÉßâ£ßâÿßâ¿ßâ£ßâúßâÜßâößâæßâÿßâí ßâÉßâôßâÆßâÿßâÜßâÿ', 'Destination', 'text', 1, 'ßâ¢ßâÉßâÆ. ßâæßâÉßâáßâíßâößâÜßâ¥ßâ£ßâÉ, ßâößâíßâ₧ßâÉßâ£ßâößâùßâÿ', 'e.g. Barcelona, Spain', NULL, NULL),
  (2, 'travel_dates', 'ßâÆßâûßâÿßâí ßâùßâÉßâáßâÿßâªßâößâæßâÿ', 'Travel dates', 'date_range', 1, NULL, NULL, 'ßâ¢ßâÿßâúßâùßâÿßâùßâößâù ßâÆßâÉßâ¢ßâÆßâûßâÉßâòßâáßâößâæßâÿßâí ßâôßâÉ ßâôßâÉßâæßâáßâúßâ£ßâößâæßâÿßâí ßâôßâªßâößâößâæßâÿ.', 'Include departure and return dates.'),
  (2, 'budget', 'ßâôßâÉßâÆßâößâÆßâ¢ßâÿßâÜßâÿ ßâæßâÿßâúßâ»ßâößâóßâÿ', 'Estimated budget', 'number', 1, 'ßâ¢ßâÉßâÆ: 2400', 'e.g. 2400', NULL, NULL),
  (2, 'purpose', 'ßâÖßâ¥ßâ¢ßâÉßâ£ßâôßâÿßâáßâößâæßâÿßâí ßâ¢ßâÿßâûßâÉßâ£ßâÿ', 'Purpose', 'textarea', 1, NULL, NULL, NULL, NULL);

CREATE TABLE `application_type_flow` (
  `type_id` INT NOT NULL,
  `step_index` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`type_id`, `step_index`),
  KEY `application_type_flow_role_idx` (`role_id`),
  CONSTRAINT `application_type_flow_type_fk`
    FOREIGN KEY (`type_id`) REFERENCES `application_types` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_type_flow_role_fk`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_type_flow` (`type_id`, `step_index`, `role_id`) VALUES
  (1, 0, 1),
  (1, 1, 2),
  (2, 0, 2),
  (2, 1, 1);

CREATE TABLE `application_type_sla` (
  `type_id` INT NOT NULL,
  `step_index` INT NOT NULL,
  `seconds` INT NOT NULL,
  `expire_action` ENUM('AUTO_APPROVE','BOUNCE_BACK') NOT NULL,
  PRIMARY KEY (`type_id`, `step_index`),
  CONSTRAINT `application_type_sla_type_fk`
    FOREIGN KEY (`type_id`) REFERENCES `application_types` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_type_sla` (`type_id`, `step_index`, `seconds`, `expire_action`) VALUES
  (1, 0, 48 * 3600, 'AUTO_APPROVE'),
  (1, 1, 72 * 3600, 'BOUNCE_BACK'),
  (2, 0, 36 * 3600, 'BOUNCE_BACK'),
  (2, 1, 48 * 3600, 'AUTO_APPROVE');

CREATE TABLE `applications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `number` VARCHAR(20) NOT NULL,
  `type_id` INT NOT NULL,
  `requester_id` INT NOT NULL,
  `status` ENUM('DRAFT','PENDING','APPROVED','REJECTED','CLOSED') NOT NULL,
  `current_step_index` INT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `submitted_at` DATETIME DEFAULT NULL,
  `due_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applications_number_unique` (`number`),
  KEY `applications_type_idx` (`type_id`),
  KEY `applications_requester_idx` (`requester_id`),
  CONSTRAINT `applications_type_fk`
    FOREIGN KEY (`type_id`) REFERENCES `application_types` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `applications_requester_fk`
    FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `applications` (`id`, `number`, `type_id`, `requester_id`, `status`, `current_step_index`, `created_at`, `updated_at`, `submitted_at`, `due_at`) VALUES
  (1, 'TKT-2024-00021', 1, 3, 'PENDING', 1, '2024-10-28 08:20:00', '2024-11-01 10:25:27', '2024-10-28 08:35:00', '2024-11-04 10:25:27'),
  (2, 'TKT-2024-00022', 2, 2, 'REJECTED', -1, '2024-09-12 10:10:00', '2024-09-15 14:32:00', '2024-09-12 10:25:00', NULL);

ALTER TABLE `applications`
  AUTO_INCREMENT = 3;

CREATE TABLE `application_field_values` (
  `application_id` INT NOT NULL,
  `field_key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  PRIMARY KEY (`application_id`, `field_key`),
  CONSTRAINT `application_field_values_application_fk`
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_field_values` (`application_id`, `field_key`, `value`) VALUES
  (1, 'reason', 'ßâíßâ¼ßâÉßâòßâÜßâößâæßâÿßâí ßâÖßâúßâáßâíßâûßâö ßâôßâÉßâíßâ¼ßâáßâößâæßâÉ'),
  (1, 'start_date', '2024-12-19'),
  (1, 'end_date', '2024-12-26'),
  (1, 'contact_phone', '+995 555 000 003'),
  (1, 'additional_comment', 'ßâíßâÉßâ¡ßâÿßâáßâ¥ßâÉ ßâ¿ßâòßâößâæßâúßâÜßâößâæßâÉ ßâÆßâÉßâ¢ßâ¥ßâ¬ßâôßâößâæßâÿßâí ßâ¢ßâûßâÉßâôßâößâæßâÿßâíßâùßâòßâÿßâí.'),
  (2, 'destination', 'ßâùßâæßâÿßâÜßâÿßâíßâÿ ΓåÆ ßâóßâÉßâÜßâÿßâ£ßâÿ'),
  (2, 'travel_dates', '2024-10-05/2024-10-11'),
  (2, 'budget', '3200'),
  (2, 'purpose', 'HR ßâóßâößâÑßâ£ßâ¥ßâÜßâ¥ßâÆßâÿßâößâæßâÿßâí ßâÖßâ¥ßâ£ßâñßâößâáßâößâ£ßâ¬ßâÿßâÉßâ¿ßâÿ ßâ¢ßâ¥ßâ£ßâÉßâ¼ßâÿßâÜßâößâ¥ßâæßâÉ.');

CREATE TABLE `application_attachments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `url` VARCHAR(255) NOT NULL,
  `uploaded_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `application_attachments_application_idx` (`application_id`),
  KEY `application_attachments_uploader_idx` (`uploaded_by`),
  CONSTRAINT `application_attachments_application_fk`
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_attachments_uploaded_by_fk`
    FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_attachments` (`id`, `application_id`, `name`, `url`, `uploaded_by`, `created_at`) VALUES
  (1, 1, 'training-invitation.pdf', '#', 3, '2024-10-28 08:34:00'),
  (2, 2, 'conference-agenda.pdf', '#', 2, '2024-09-12 10:22:00');

ALTER TABLE `application_attachments`
  AUTO_INCREMENT = 3;

CREATE TABLE `application_audit_log` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `actor_id` INT DEFAULT NULL,
  `action` ENUM('CREATE','SUBMIT','APPROVE','REJECT','EDIT','RESEND','CLOSE','AUTO_APPROVE','EXPIRE_BOUNCE') NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `occurred_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `application_audit_log_application_idx` (`application_id`),
  KEY `application_audit_log_actor_idx` (`actor_id`),
  CONSTRAINT `application_audit_log_application_fk`
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_audit_log_actor_fk`
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `application_audit_log` (`id`, `application_id`, `actor_id`, `action`, `comment`, `occurred_at`) VALUES
  (1, 1, 3, 'CREATE', 'ßâ¿ßâößâòßâíßâößâæßâúßâÜßâÿßâÉ ßâÆßâÉßâ£ßâÉßâ¬ßâ«ßâÉßâôßâÿ ßâôßâÉ ßâôßâÉßâößâáßâùßâößâæßâúßâÜßâÿßâÉ ßâ¢ßâ¥ßâ¼ßâòßâößâòßâÉ.', '2024-10-28 08:20:00'),
  (2, 1, 3, 'SUBMIT', 'ßâÆßâùßâ«ßâ¥ßâòßâù ßâôßâÉßâ¢ßâóßâÖßâÿßâ¬ßâößâæßâÉßâí.', '2024-10-28 08:35:00'),
  (3, 1, 1, 'APPROVE', 'ßâôßâÉßâíßâòßâößâ£ßâößâæßâÉ ßâôßâÉßâ¢ßâóßâÖßâÿßâ¬ßâößâæßâúßâÜßâÿßâÉ, ßâ¼ßâÉßâáßâ¢ßâÉßâóßâößâæßâößâæßâÿ ßâÖßâúßâáßâíßâûßâö.', '2024-10-29 09:05:00'),
  (4, 1, 1, 'RESEND', 'ßâôßâáßâ¥ßâößâæßâÿßâù ßâÆßâÉßâôßâÉßâÿßâÆßâûßâÉßâòßâ£ßâÉ HR ßâÆßâúßâ£ßâôßâ¿ßâÿ.', '2024-10-29 09:06:00'),
  (5, 2, 2, 'CREATE', NULL, '2024-09-12 10:10:00'),
  (6, 2, 2, 'SUBMIT', 'ßâæßâÿßâúßâ»ßâößâóßâÿ ßâ¢ßâ¥ßâÿßâ¬ßâÉßâòßâí ßâÉßâòßâÿßâÉßâæßâÿßâÜßâößâùßâößâæßâí ßâôßâÉ ßâíßâÉßâíßâóßâúßâ¢ßâáßâ¥ßâí.', '2024-09-12 10:25:00'),
  (7, 2, 2, 'EDIT', 'ßâÆßâÉßâ£ßâÉßâ«ßâÜßâôßâÉ ßâ¢ßâÿßâíßâÉßâ¢ßâÉßâáßâùßâÿ ßâôßâÉ ßâíßâÉßâíßâóßâúßâ¢ßâáßâ¥ßâí ßâ¢ßâ¥ßâ£ßâÉßâ¬ßâößâ¢ßâößâæßâÿ.', '2024-09-13 09:12:00'),
  (8, 2, 1, 'REJECT', 'ßâÆßâùßâ«ßâ¥ßâòßâù ßâÆßâÉßâ£ßâÉßâ«ßâÜßâößâæßâúßâÜßâÿ ßâæßâÿßâúßâ»ßâößâóßâÿßâí ßâôßâößâóßâÉßâÜßâúßâáßâÿ ßâôßâößâÖßâ¥ßâ¢ßâ₧ßâ¥ßâûßâÿßâ¬ßâÿßâÉ.', '2024-09-15 14:32:00');

ALTER TABLE `application_audit_log`
  AUTO_INCREMENT = 9;

CREATE TABLE `application_delegates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `application_id` INT NOT NULL,
  `for_role_id` INT NOT NULL,
  `delegate_user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `application_delegates_application_idx` (`application_id`),
  KEY `application_delegates_role_idx` (`for_role_id`),
  KEY `application_delegates_user_idx` (`delegate_user_id`),
  CONSTRAINT `application_delegates_application_fk`
    FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `application_delegates_role_fk`
    FOREIGN KEY (`for_role_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `application_delegates_user_fk`
    FOREIGN KEY (`delegate_user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service tickets raised by employees and handled by HR
CREATE TABLE `tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('open','in_progress','resolved') NOT NULL DEFAULT 'open',
  `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  `created_by` INT NOT NULL,
  `assigned_to` INT DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tickets_created_by_idx` (`created_by`),
  KEY `tickets_assigned_to_idx` (`assigned_to`),
  CONSTRAINT `tickets_created_by_fk`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `tickets_assigned_to_fk`
    FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tickets` (`id`, `title`, `description`, `status`, `priority`, `created_by`, `assigned_to`, `created_at`, `updated_at`)
VALUES
  (1, 'Onboarding laptop request', 'Need a laptop configured for the new marketing hire starting next Monday.', 'in_progress', 'high', 2, 1, '2024-05-01 08:30:00', '2024-05-02 09:15:00'),
  (2, 'Update payroll bank details', 'Employee User submitted new banking information that must be reflected before the next payroll run.', 'open', 'medium', 3, 2, '2024-05-10 12:00:00', '2024-05-10 12:00:00'),
  (3, 'Broken office badge', 'My access badge is no longer working after the hardware refresh. Requesting a replacement.', 'resolved', 'low', 3, 2, '2024-04-18 07:20:00', '2024-04-19 10:45:00');

ALTER TABLE `tickets`
  AUTO_INCREMENT = 4;

-- Session history (empty by default but ready for use)
CREATE TABLE `sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_user_id_fk`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
