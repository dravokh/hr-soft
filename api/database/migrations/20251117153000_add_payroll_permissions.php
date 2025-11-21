<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddPayrollPermissions extends AbstractMigration
{
    /**
     * @var array<int, array{id: string, name: string, category: string}>
     */
    private array $permissions = [
        ['id' => 'view_payroll', 'name' => 'View payroll workspace', 'category' => 'Payroll'],
        ['id' => 'manage_payroll', 'name' => 'Create and finalize payroll', 'category' => 'Payroll'],
    ];

    /**
     * @var array<int, string[]>
     */
    private array $rolePermissions = [
        1 => ['view_payroll', 'manage_payroll'],
        2 => ['view_payroll', 'manage_payroll'],
    ];

    public function up(): void
    {
        if (!$this->hasTable('permissions') || !$this->hasTable('role_permissions')) {
            return;
        }

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
            $ids = array_map(static fn (array $permission): string => sprintf("'%s'", addslashes($permission['id'])), $this->permissions);
            if (!empty($ids)) {
                $this->execute(sprintf(
                    'DELETE FROM role_permissions WHERE permission_id IN (%s)',
                    implode(',', $ids)
                ));
            }
        }

        if ($this->hasTable('permissions')) {
            $ids = array_map(static fn (array $permission): string => sprintf("'%s'", addslashes($permission['id'])), $this->permissions);
            if (!empty($ids)) {
                $this->execute(sprintf(
                    'DELETE FROM permissions WHERE id IN (%s)',
                    implode(',', $ids)
                ));
            }
        }
    }

    private function permissionExists(string $permissionId): bool
    {
        $row = $this->fetchRow(
            sprintf(
                "SELECT COUNT(*) AS total FROM permissions WHERE id = '%s'",
                addslashes($permissionId)
            )
        );

        return (int) ($row['total'] ?? 0) > 0;
    }

    private function rolePermissionExists(int $roleId, string $permissionId): bool
    {
        $row = $this->fetchRow(
            sprintf(
                "SELECT COUNT(*) AS total FROM role_permissions WHERE role_id = %d AND permission_id = '%s'",
                $roleId,
                addslashes($permissionId)
            )
        );

        return (int) ($row['total'] ?? 0) > 0;
    }
}
