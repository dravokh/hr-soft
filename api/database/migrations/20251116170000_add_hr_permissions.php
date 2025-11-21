<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddHrPermissions extends AbstractMigration
{
    /**
     * @var array<int, array{id: string, name: string, category: string}>
     */
    private array $permissions = [
        ['id' => 'view_hr', 'name' => 'Access HR workspace', 'category' => 'HR'],
        ['id' => 'manage_work_shifts', 'name' => 'Manage work shifts', 'category' => 'HR'],
        ['id' => 'manage_lesson_bonuses', 'name' => 'Manage lesson bonuses', 'category' => 'HR'],
        ['id' => 'view_teacher_schedule', 'name' => 'View teacher schedule', 'category' => 'Teacher Schedule'],
        ['id' => 'analyze_teacher_schedule', 'name' => 'Analyze teacher schedule files', 'category' => 'Teacher Schedule'],
        ['id' => 'assign_teacher_schedule', 'name' => 'Assign teacher schedule records', 'category' => 'Teacher Schedule'],
        ['id' => 'view_payroll', 'name' => 'View payroll workspace', 'category' => 'Payroll'],
        ['id' => 'manage_payroll', 'name' => 'Create and finalize payroll', 'category' => 'Payroll'],
        ['id' => 'manage_learning', 'name' => 'Manage learning workspace', 'category' => 'Learning'],
    ];

    /**
     * @var array<int, string[]>
     */
    private array $rolePermissions = [
        1 => [
            'view_hr',
            'manage_work_shifts',
            'manage_lesson_bonuses',
            'view_teacher_schedule',
            'analyze_teacher_schedule',
            'assign_teacher_schedule',
            'view_payroll',
            'manage_payroll',
            'manage_learning',
        ],
        2 => [
            'view_hr',
            'manage_work_shifts',
            'manage_lesson_bonuses',
            'view_teacher_schedule',
            'analyze_teacher_schedule',
            'assign_teacher_schedule',
            'view_payroll',
            'manage_payroll',
            'manage_learning',
        ],
    ];

    public function up(): void
    {
        $permissionsTable = $this->table('permissions');
        $pendingPermissions = [];

        foreach ($this->permissions as $permission) {
            if (!$this->permissionExists($permission['id'])) {
                $pendingPermissions[] = $permission;
            }
        }

        if (!empty($pendingPermissions)) {
            $permissionsTable->insert($pendingPermissions)->saveData();
        }

        $existingRoles = $this->fetchAll('SELECT id FROM roles');
        $existingRoleIds = array_map(static fn (array $row): int => (int) $row['id'], $existingRoles);
        $existingRoleIds = array_values(array_unique($existingRoleIds));

        $rolePermissionsTable = $this->table('role_permissions');
        $pendingRolePermissions = [];

        foreach ($this->rolePermissions as $roleId => $permissionIds) {
            if (!in_array($roleId, $existingRoleIds, true)) {
                continue;
            }

            foreach ($permissionIds as $permissionId) {
                if (!$this->rolePermissionExists($roleId, $permissionId)) {
                    $pendingRolePermissions[] = [
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ];
                }
            }
        }

        if (!empty($pendingRolePermissions)) {
            $rolePermissionsTable->insert($pendingRolePermissions)->saveData();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('role_permissions')) {
            $ids = array_map(static fn (string $id): string => sprintf("'%s'", addslashes($id)), array_column($this->permissions, 'id'));
            if (!empty($ids)) {
                $this->execute(sprintf(
                    'DELETE FROM role_permissions WHERE permission_id IN (%s)',
                    implode(',', $ids)
                ));
            }
        }

        if ($this->hasTable('permissions')) {
            $ids = array_map(static fn (array $permission): string => $permission['id'], $this->permissions);
            if (!empty($ids)) {
                $quoted = array_map(static fn (string $id): string => sprintf("'%s'", addslashes($id)), $ids);
                $this->execute(sprintf(
                    'DELETE FROM permissions WHERE id IN (%s)',
                    implode(',', $quoted)
                ));
            }
        }
    }

    private function permissionExists(string $permissionId): bool
    {
        $safeId = addslashes($permissionId);
        $row = $this->fetchRow(
            sprintf("SELECT COUNT(*) AS total FROM permissions WHERE id = '%s'", $safeId)
        );

        return (int) ($row['total'] ?? 0) > 0;
    }

    private function rolePermissionExists(int $roleId, string $permissionId): bool
    {
        $safePermissionId = addslashes($permissionId);
        $row = $this->fetchRow(
            sprintf(
                "SELECT COUNT(*) AS total FROM role_permissions WHERE role_id = %d AND permission_id = '%s'",
                $roleId,
                $safePermissionId
            )
        );

        return (int) ($row['total'] ?? 0) > 0;
    }
}
