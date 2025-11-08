<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateHrSoftSchema extends AbstractMigration
{
    public function up(): void
    {
        $this->createRolesTable();
        $this->createPermissionsTable();
        $this->createRolePermissionsTable();
        $this->createUsersTable();
        $this->createApplicationTypesTable();
        $this->createApplicationTypeFieldsTable();
        $this->createApplicationTypeFlowTable();
        $this->createApplicationTypeSlaTable();
        $this->createApplicationsTable();
        $this->createApplicationFieldValuesTable();
        $this->createApplicationAttachmentsTable();
        $this->createApplicationAuditLogTable();
        $this->createApplicationDelegatesTable();
        $this->createTicketsTable();
        $this->createSessionsTable();
    }

    public function down(): void
    {
        $tables = [
            'sessions',
            'tickets',
            'application_delegates',
            'application_audit_log',
            'application_attachments',
            'application_field_values',
            'applications',
            'application_type_sla',
            'application_type_flow',
            'application_type_fields',
            'application_types',
            'users',
            'role_permissions',
            'permissions',
            'roles',
        ];

        foreach ($tables as $table) {
            if ($this->hasTable($table)) {
                $this->table($table)->drop()->save();
            }
        }
    }

    private function createRolesTable(): void
    {
        if ($this->hasTable('roles')) {
            return;
        }

        $this->table('roles', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('name', 'string', ['limit' => 100])
            ->addColumn('description', 'string', ['limit' => 255])
            ->create();
    }

    private function createPermissionsTable(): void
    {
        if ($this->hasTable('permissions')) {
            return;
        }

        $this->table('permissions', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'string', ['limit' => 50])
            ->addColumn('name', 'string', ['limit' => 150])
            ->addColumn('category', 'string', ['limit' => 50])
            ->create();
    }

    private function createRolePermissionsTable(): void
    {
        if ($this->hasTable('role_permissions')) {
            return;
        }

        $this->table('role_permissions', [
            'id' => false,
            'primary_key' => ['role_id', 'permission_id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('role_id', 'integer')
            ->addColumn('permission_id', 'string', ['limit' => 50])
            ->addForeignKey('role_id', 'roles', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('permission_id', 'permissions', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createUsersTable(): void
    {
        if ($this->hasTable('users')) {
            return;
        }

        $this->table('users', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('name', 'string', ['limit' => 150])
            ->addColumn('email', 'string', ['limit' => 150])
            ->addColumn('phone', 'string', ['limit' => 30, 'null' => true])
            ->addColumn('personal_id', 'string', ['limit' => 20])
            ->addColumn('password', 'string', ['limit' => 150])
            ->addColumn('role_id', 'integer')
            ->addColumn('avatar', 'string', ['limit' => 5, 'null' => true])
            ->addColumn('must_reset_password', 'boolean', ['default' => 0])
            ->addIndex(['email'], ['unique' => true])
            ->addForeignKey('role_id', 'roles', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationTypesTable(): void
    {
        if ($this->hasTable('application_types')) {
            return;
        }

        $this->table('application_types', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('name_ka', 'string', ['limit' => 150])
            ->addColumn('name_en', 'string', ['limit' => 150])
            ->addColumn('description_ka', 'string', ['limit' => 255])
            ->addColumn('description_en', 'string', ['limit' => 255])
            ->addColumn('icon', 'string', ['limit' => 50])
            ->addColumn('color', 'string', ['limit' => 30])
            ->create();
    }

    private function createApplicationTypeFieldsTable(): void
    {
        if ($this->hasTable('application_type_fields')) {
            return;
        }

        $this->table('application_type_fields', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('type_id', 'integer')
            ->addColumn('field_key', 'string', ['limit' => 100])
            ->addColumn('label_ka', 'string', ['limit' => 150])
            ->addColumn('label_en', 'string', ['limit' => 150])
            ->addColumn('field_type', 'string', ['limit' => 20])
            ->addColumn('is_required', 'boolean', ['default' => 0])
            ->addColumn('placeholder_ka', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('placeholder_en', 'string', ['limit' => 150, 'null' => true])
            ->addColumn('helper_ka', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('helper_en', 'string', ['limit' => 255, 'null' => true])
            ->addForeignKey('type_id', 'application_types', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationTypeFlowTable(): void
    {
        if ($this->hasTable('application_type_flow')) {
            return;
        }

        $this->table('application_type_flow', [
            'id' => false,
            'primary_key' => ['type_id', 'step_index'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('type_id', 'integer')
            ->addColumn('step_index', 'integer')
            ->addColumn('role_id', 'integer')
            ->addForeignKey('type_id', 'application_types', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('role_id', 'roles', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationTypeSlaTable(): void
    {
        if ($this->hasTable('application_type_sla')) {
            return;
        }

        $this->table('application_type_sla', [
            'id' => false,
            'primary_key' => ['type_id', 'step_index'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('type_id', 'integer')
            ->addColumn('step_index', 'integer')
            ->addColumn('seconds', 'integer')
            ->addColumn('expire_action', 'string', ['limit' => 20])
            ->addForeignKey('type_id', 'application_types', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationsTable(): void
    {
        if ($this->hasTable('applications')) {
            return;
        }

        $this->table('applications', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('number', 'string', ['limit' => 20])
            ->addColumn('type_id', 'integer')
            ->addColumn('requester_id', 'integer')
            ->addColumn('status', 'string', ['limit' => 20])
            ->addColumn('current_step_index', 'integer')
            ->addColumn('created_at', 'datetime')
            ->addColumn('updated_at', 'datetime')
            ->addColumn('submitted_at', 'datetime', ['null' => true])
            ->addColumn('due_at', 'datetime', ['null' => true])
            ->addIndex(['number'], ['unique' => true])
            ->addForeignKey('type_id', 'application_types', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addForeignKey('requester_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationFieldValuesTable(): void
    {
        if ($this->hasTable('application_field_values')) {
            return;
        }

        $this->table('application_field_values', [
            'id' => false,
            'primary_key' => ['application_id', 'field_key'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('application_id', 'integer')
            ->addColumn('field_key', 'string', ['limit' => 100])
            ->addColumn('value', 'text')
            ->addForeignKey('application_id', 'applications', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationAttachmentsTable(): void
    {
        if ($this->hasTable('application_attachments')) {
            return;
        }

        $this->table('application_attachments', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('application_id', 'integer')
            ->addColumn('name', 'string', ['limit' => 200])
            ->addColumn('url', 'string', ['limit' => 255])
            ->addColumn('uploaded_by', 'integer')
            ->addColumn('created_at', 'datetime')
            ->addForeignKey('application_id', 'applications', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('uploaded_by', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationAuditLogTable(): void
    {
        if ($this->hasTable('application_audit_log')) {
            return;
        }

        $this->table('application_audit_log', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('application_id', 'integer')
            ->addColumn('actor_id', 'integer', ['null' => true])
            ->addColumn('action', 'string', ['limit' => 20])
            ->addColumn('comment', 'text', ['null' => true])
            ->addColumn('occurred_at', 'datetime')
            ->addForeignKey('application_id', 'applications', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('actor_id', 'users', 'id', ['delete' => 'SET_NULL', 'update' => 'CASCADE'])
            ->create();
    }

    private function createApplicationDelegatesTable(): void
    {
        if ($this->hasTable('application_delegates')) {
            return;
        }

        $this->table('application_delegates', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('application_id', 'integer')
            ->addColumn('for_role_id', 'integer')
            ->addColumn('delegate_user_id', 'integer')
            ->addForeignKey('application_id', 'applications', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('for_role_id', 'roles', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addForeignKey('delegate_user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    private function createTicketsTable(): void
    {
        if ($this->hasTable('tickets')) {
            return;
        }

        $this->table('tickets', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('title', 'string', ['limit' => 200])
            ->addColumn('description', 'text')
            ->addColumn('status', 'enum', ['values' => ['open', 'in_progress', 'resolved'], 'default' => 'open'])
            ->addColumn('priority', 'enum', ['values' => ['low', 'medium', 'high'], 'default' => 'medium'])
            ->addColumn('created_by', 'integer')
            ->addColumn('assigned_to', 'integer', ['null' => true])
            ->addColumn('created_at', 'datetime')
            ->addColumn('updated_at', 'datetime')
            ->addForeignKey('created_by', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('assigned_to', 'users', 'id', ['delete' => 'SET_NULL', 'update' => 'CASCADE'])
            ->create();
    }

    private function createSessionsTable(): void
    {
        if ($this->hasTable('sessions')) {
            return;
        }

        $this->table('sessions', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('user_id', 'integer')
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
