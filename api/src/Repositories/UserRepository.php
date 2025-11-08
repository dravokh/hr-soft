<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;
use Throwable;

final class UserRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function all(): array
    {
        $statement = $this->connection->query(
            'SELECT
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
             FROM users
             ORDER BY id'
        );

        $users = [];
        foreach ($statement as $row) {
            $users[(int) $row['id']] = [
                'id' => (int) $row['id'],
                'name' => (string) $row['name'],
                'firstName' => $row['first_name'] !== null ? (string) $row['first_name'] : null,
                'lastName' => $row['last_name'] !== null ? (string) $row['last_name'] : null,
                'email' => (string) $row['email'],
                'phone' => (string) ($row['phone'] ?? ''),
                'personalId' => (string) ($row['personal_id'] ?? ''),
                'password' => (string) $row['password'],
                'baseSalary' => (float) $row['base_salary'],
                'vacationDays' => (int) $row['vacation_days'],
                'lateHoursAllowed' => (int) $row['late_hours_allowed'],
                'penaltyPercent' => (float) $row['penalty_percent'],
                'roleId' => (int) $row['role_id'],
                'avatar' => (string) ($row['avatar'] ?? ''),
                'mustResetPassword' => (bool) $row['must_reset_password'],
                'selectedBonusIds' => []
            ];
        }

        if ($users === []) {
            return [];
        }

        $bonusStatement = $this->connection->query(
            'SELECT user_id, bonus_id FROM user_compensation_bonuses ORDER BY user_id, bonus_id'
        );

        foreach ($bonusStatement as $bonusRow) {
            $userId = (int) $bonusRow['user_id'];
            if (!isset($users[$userId])) {
                continue;
            }
            $users[$userId]['selectedBonusIds'][] = (int) $bonusRow['bonus_id'];
        }

        return array_values($users);
    }

    /**
     * @param array<int, array<string, mixed>> $users
     */
    public function sync(array $users): array
    {
        $this->connection->beginTransaction();

        try {
            if ($users === []) {
                $this->connection->exec('DELETE FROM users');
                $this->connection->commit();
                return [];
            }

            $existingIds = $this->connection
                ->query('SELECT id FROM users')
                ->fetchAll(PDO::FETCH_COLUMN);

            $incomingIds = [];
            foreach ($users as $user) {
                if (!isset($user['id'])) {
                    continue;
                }
                $incomingIds[] = (int) $user['id'];
            }
            $incomingIds = array_values(array_unique($incomingIds));

            $idsToDelete = array_diff(
                array_map('intval', $existingIds ?: []),
                $incomingIds
            );

            if (!empty($idsToDelete)) {
                $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));
                $deleteStatement = $this->connection->prepare(
                    sprintf('DELETE FROM users WHERE id IN (%s)', $placeholders)
                );
                $deleteStatement->execute(array_values($idsToDelete));
            }

            $upsertUser = $this->connection->prepare(
                'INSERT INTO users (
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
                 )
                 VALUES (
                    :id,
                    :name,
                    :first_name,
                    :last_name,
                    :email,
                    :phone,
                    :personal_id,
                    :password,
                    :base_salary,
                    :vacation_days,
                    :late_hours_allowed,
                    :penalty_percent,
                    :role_id,
                    :avatar,
                    :must_reset_password
                 )
                 ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    first_name = VALUES(first_name),
                    last_name = VALUES(last_name),
                    email = VALUES(email),
                    phone = VALUES(phone),
                    personal_id = VALUES(personal_id),
                    password = VALUES(password),
                    base_salary = VALUES(base_salary),
                    vacation_days = VALUES(vacation_days),
                    late_hours_allowed = VALUES(late_hours_allowed),
                    penalty_percent = VALUES(penalty_percent),
                    role_id = VALUES(role_id),
                    avatar = VALUES(avatar),
                    must_reset_password = VALUES(must_reset_password)'
            );

            $deleteBonusLinks = $this->connection->prepare(
                'DELETE FROM user_compensation_bonuses WHERE user_id = :user_id'
            );
            $insertBonusLink = $this->connection->prepare(
                'INSERT INTO user_compensation_bonuses (user_id, bonus_id) VALUES (:user_id, :bonus_id)'
            );

            foreach ($users as $user) {
                $userId = (int) ($user['id'] ?? 0);
                $upsertUser->execute([
                    ':id' => $userId,
                    ':name' => (string) ($user['name'] ?? ''),
                    ':first_name' => $user['firstName'] !== null && $user['firstName'] !== ''
                        ? (string) $user['firstName']
                        : null,
                    ':last_name' => $user['lastName'] !== null && $user['lastName'] !== ''
                        ? (string) $user['lastName']
                        : null,
                    ':email' => (string) ($user['email'] ?? ''),
                    ':phone' => $user['phone'] !== null && $user['phone'] !== ''
                        ? (string) $user['phone']
                        : null,
                    ':personal_id' => (string) ($user['personalId'] ?? ''),
                    ':password' => (string) ($user['password'] ?? ''),
                    ':base_salary' => isset($user['baseSalary']) ? (float) $user['baseSalary'] : 0,
                    ':vacation_days' => isset($user['vacationDays']) ? (int) $user['vacationDays'] : 0,
                    ':late_hours_allowed' => isset($user['lateHoursAllowed']) ? (int) $user['lateHoursAllowed'] : 0,
                    ':penalty_percent' => isset($user['penaltyPercent']) ? (float) $user['penaltyPercent'] : 0,
                    ':role_id' => (int) ($user['roleId'] ?? 0),
                    ':avatar' => $user['avatar'] !== null && $user['avatar'] !== ''
                        ? (string) $user['avatar']
                        : null,
                    ':must_reset_password' => isset($user['mustResetPassword']) && $user['mustResetPassword'] ? 1 : 0,
                ]);

                $deleteBonusLinks->execute([':user_id' => $userId]);
                $selectedBonusIds = isset($user['selectedBonusIds']) && is_array($user['selectedBonusIds'])
                    ? array_values(array_unique(array_map('intval', $user['selectedBonusIds'])))
                    : [];

                foreach ($selectedBonusIds as $bonusId) {
                    if ($bonusId <= 0) {
                        continue;
                    }
                    $insertBonusLink->execute([
                        ':user_id' => $userId,
                        ':bonus_id' => $bonusId
                    ]);
                }
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->all();
    }
}
