<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;
use Throwable;

final class RoleRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function allWithPermissions(): array
    {
        $roles = [];
        $statement = $this->connection->query(
            'SELECT id, name, description FROM roles ORDER BY id'
        );

        foreach ($statement as $row) {
            $roles[(int) $row['id']] = [
                'id' => (int) $row['id'],
                'name' => (string) $row['name'],
                'description' => (string) $row['description'],
                'permissions' => [],
            ];
        }

        if (empty($roles)) {
            return [];
        }

        $permissions = $this->connection->query(
            'SELECT role_id, permission_id FROM role_permissions ORDER BY role_id, permission_id'
        );

        foreach ($permissions as $row) {
            $roleId = (int) $row['role_id'];
            if (!isset($roles[$roleId])) {
                continue;
            }

            $roles[$roleId]['permissions'][] = (string) $row['permission_id'];
        }

        return array_values($roles);
    }

    /**
     * @param array<int, array<string, mixed>> $roles
     */
    public function sync(array $roles): array
    {
        $this->connection->beginTransaction();

        try {
            $this->connection->exec('DELETE FROM role_permissions');

            if ($roles === []) {
                $this->connection->exec('DELETE FROM roles');
                $this->connection->commit();
                return [];
            }

            $incomingIds = [];
            foreach ($roles as $role) {
                if (!isset($role['id'])) {
                    continue;
                }
                $incomingIds[] = (int) $role['id'];
            }
            $incomingIds = array_values(array_unique($incomingIds));

            if ($incomingIds === []) {
                $this->connection->exec('DELETE FROM roles');
            } else {
                $placeholders = implode(',', array_fill(0, count($incomingIds), '?'));
                $deleteStatement = $this->connection->prepare(
                    sprintf('DELETE FROM roles WHERE id NOT IN (%s)', $placeholders)
                );
                $deleteStatement->execute($incomingIds);
            }

            $upsertRole = $this->connection->prepare(
                'INSERT INTO roles (id, name, description)
                 VALUES (:id, :name, :description)
                 ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)'
            );

            foreach ($roles as $role) {
                $upsertRole->execute([
                    ':id' => (int) ($role['id'] ?? 0),
                    ':name' => (string) ($role['name'] ?? ''),
                    ':description' => (string) ($role['description'] ?? ''),
                ]);
            }

            $insertPermission = $this->connection->prepare(
                'INSERT INTO role_permissions (role_id, permission_id)
                 VALUES (:role_id, :permission_id)'
            );

            foreach ($roles as $role) {
                $roleId = (int) ($role['id'] ?? 0);
                if ($roleId <= 0) {
                    continue;
                }

                $permissions = $role['permissions'] ?? [];
                if (!is_array($permissions)) {
                    continue;
                }

                $uniquePermissions = array_values(array_unique(array_map('strval', $permissions)));
                foreach ($uniquePermissions as $permissionId) {
                    $insertPermission->execute([
                        ':role_id' => $roleId,
                        ':permission_id' => $permissionId,
                    ]);
                }
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->allWithPermissions();
    }
}
