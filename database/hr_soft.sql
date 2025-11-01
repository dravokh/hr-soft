-- ------------------------------------------------------
-- HR Soft demo database
-- Ready for import in phpMyAdmin or MySQL-compatible tools
-- ------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

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
  (1, 'Admin', 'სისტემის ადმინისტრატორი'),
  (2, 'HR', 'HR მენეჯერი'),
  (3, 'Employee', 'თანამშრომელი');

-- Permission catalog
CREATE TABLE `permissions` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`id`, `name`, `category`) VALUES
  ('view_dashboard', 'მთავარი გვერდის ნახვა', 'Dashboard'),
  ('view_users', 'მომხმარებლების ნახვა', 'Users'),
  ('create_users', 'მომხმარებლების შექმნა', 'Users'),
  ('edit_users', 'მომხმარებლების რედაქტირება', 'Users'),
  ('delete_users', 'მომხმარებლების წაშლა', 'Users'),
  ('view_roles', 'როლების ნახვა', 'Roles'),
  ('create_roles', 'როლების შექმნა', 'Roles'),
  ('edit_roles', 'როლების რედაქტირება', 'Roles'),
  ('delete_roles', 'როლების წაშლა', 'Roles'),
  ('view_requests', 'მოთხოვნების ნახვა', 'Requests'),
  ('create_requests', 'მოთხოვნების შექმნა', 'Requests'),
  ('approve_requests', 'მოთხოვნების დამტკიცება', 'Requests'),
  ('view_tickets', 'სერვის თიკეტების ნახვა', 'Tickets'),
  ('create_tickets', 'სერვის თიკეტების შექმნა', 'Tickets'),
  ('update_tickets', 'სერვის თიკეტების განახლება', 'Tickets'),
  ('set_ticket_priority', 'თიკეტების პრიორიტეტების მართვა', 'Tickets'),
  ('manage_permissions', 'უფლებების მართვა', 'System');

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
  (2, 'set_ticket_priority');

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
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `avatar` VARCHAR(5) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`),
  CONSTRAINT `users_role_id_fk`
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role_id`, `avatar`) VALUES
  (1, 'Admin User', 'admin@hr.com', '+995 555 000 001', 'admin123', 1, 'A'),
  (2, 'HR Manager', 'hr@hr.com', '+995 555 000 002', 'hr123', 2, 'H'),
  (3, 'Employee User', 'user@hr.com', '+995 555 000 003', 'user123', 3, 'E');

ALTER TABLE `users`
  AUTO_INCREMENT = 4;

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
  (1, 'შვებულების განაცხადი', 'Leave request', 'დაგეგმილი ან უცაბედი შვებულებების დამტკიცების სამუშაო პრക്രესი.', 'Approval workflow for planned or urgent leave requests.', 'CalendarDays', 'bg-sky-500'),
  (2, 'კომანდირების განაცხადი', 'Business trip request', 'კომანდირებასთან დაკავშირებული ხარჯებისა და დაგეგმვის დამტკიცება.', 'Approval for travel itineraries and budget expectations.', 'Plane', 'bg-indigo-500');

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
  (1, 'reason', 'შვებულების მიზეზი', 'Reason for leave', 'textarea', 1, 'მოკლედ აღწერეთ მიზეზი…', 'Describe the reason…', NULL, NULL),
  (1, 'start_date', 'დაწყების თარიღი', 'Start date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'end_date', 'დასრულების თარიღი', 'End date', 'date', 1, NULL, NULL, NULL, NULL),
  (1, 'contact_phone', 'საკონტაქტო ნომერი', 'Contact phone', 'text', 1, '+995 5XX XXX XXX', '+995 5XX XXX XXX', NULL, NULL),
  (1, 'additional_comment', 'დამატებითი კომენტარი', 'Additional comment', 'textarea', 0, NULL, NULL, 'მიუთითეთ დამატებითი ინფორმაცია საჭიროების შემთხვევაში.', 'Provide extra context if needed.'),
  (2, 'destination', 'დანიშნულების ადგილი', 'Destination', 'text', 1, 'მაგ. ბარსელონა, ესპანეთი', 'e.g. Barcelona, Spain', NULL, NULL),
  (2, 'travel_dates', 'გზის თარიღები', 'Travel dates', 'date_range', 1, NULL, NULL, 'მიუთითეთ გამგზავრების და დაბრუნების დღეები.', 'Include departure and return dates.'),
  (2, 'budget', 'დაგეგმილი ბიუჯეტი', 'Estimated budget', 'number', 1, 'მაგ: 2400', 'e.g. 2400', NULL, NULL),
  (2, 'purpose', 'კომანდირების მიზანი', 'Purpose', 'textarea', 1, NULL, NULL, NULL, NULL);

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
  (1, 'reason', 'სწავლების კურსზე დასწრება'),
  (1, 'start_date', '2024-12-19'),
  (1, 'end_date', '2024-12-26'),
  (1, 'contact_phone', '+995 555 000 003'),
  (1, 'additional_comment', 'საჭიროა შვებულება გამოცდების მზადებისთვის.'),
  (2, 'destination', 'თბილისი → ტალინი'),
  (2, 'travel_dates', '2024-10-05/2024-10-11'),
  (2, 'budget', '3200'),
  (2, 'purpose', 'HR ტექნოლოგიების კონფერენციაში მონაწილეობა.');

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
  (1, 1, 3, 'CREATE', 'შევსებულია განაცხადი და დაერთებულია მოწვევა.', '2024-10-28 08:20:00'),
  (2, 1, 3, 'SUBMIT', 'გთხოვთ დამტკიცებას.', '2024-10-28 08:35:00'),
  (3, 1, 1, 'APPROVE', 'დასვენება დამტკიცებულია, წარმატებები კურსზე.', '2024-10-29 09:05:00'),
  (4, 1, 1, 'RESEND', 'დროებით გადაიგზავნა HR გუნდში.', '2024-10-29 09:06:00'),
  (5, 2, 2, 'CREATE', NULL, '2024-09-12 10:10:00'),
  (6, 2, 2, 'SUBMIT', 'ბიუჯეტი მოიცავს ავიაბილეთებს და სასტუმროს.', '2024-09-12 10:25:00'),
  (7, 2, 2, 'EDIT', 'განახლდა მისამართი და სასტუმროს მონაცემები.', '2024-09-13 09:12:00'),
  (8, 2, 1, 'REJECT', 'გთხოვთ განახლებული ბიუჯეტის დეტალური დეკომპოზიცია.', '2024-09-15 14:32:00');

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
