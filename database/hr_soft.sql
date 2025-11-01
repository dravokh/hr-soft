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
DROP TABLE IF EXISTS `sessions`;
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
  (2, 'approve_requests');

-- Employee role permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
  (3, 'view_dashboard'),
  (3, 'view_requests'),
  (3, 'create_requests');

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
