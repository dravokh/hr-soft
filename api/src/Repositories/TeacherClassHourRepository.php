<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;

final class TeacherClassHourRepository
{
    private const WEEKDAYS = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
    ];

    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @param array<int, int> $userIds
     * @return array<int, array<string, mixed>>
     */
    public function findByUserIds(array $userIds): array
    {
        if ($userIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $statement = $this->connection->prepare(
            sprintf(
                'SELECT user_id, day_of_week, cambridge_hours, georgian_hours, created_at, updated_at
                 FROM teacher_class_hours
                 WHERE user_id IN (%s)
                 ORDER BY user_id, FIELD(day_of_week, ? , ? , ? , ? , ? , ? , ?)',
                $placeholders
            )
        );

        $bindIndex = 1;
        foreach ($userIds as $userId) {
            $statement->bindValue($bindIndex++, (int) $userId, PDO::PARAM_INT);
        }
        foreach (self::WEEKDAYS as $day) {
            $statement->bindValue($bindIndex++, $day);
        }

        $statement->execute();
        return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        $statement = $this->connection->prepare(
            sprintf(
                'SELECT user_id, day_of_week, cambridge_hours, georgian_hours, created_at, updated_at
                 FROM teacher_class_hours
                 ORDER BY user_id, FIELD(day_of_week, ? , ? , ? , ? , ? , ? , ?)'
            )
        );

        foreach (self::WEEKDAYS as $index => $day) {
            $statement->bindValue($index + 1, $day);
        }

        $statement->execute();
        return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
        * @param array<int, array<string, mixed>> $days
        * @return array<int, array<string, mixed>>
        */
    public function saveForUser(int $userId, array $days): array
    {
        $normalized = $this->normalizeDays($days);

        $this->connection->beginTransaction();
        try {
            $delete = $this->connection->prepare('DELETE FROM teacher_class_hours WHERE user_id = :user_id');
            $delete->execute([':user_id' => $userId]);

            $insert = $this->connection->prepare(
                'INSERT INTO teacher_class_hours (user_id, day_of_week, cambridge_hours, georgian_hours, created_at, updated_at)
                 VALUES (:user_id, :day_of_week, :cambridge_hours, :georgian_hours, :created_at, :updated_at)'
            );

            $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
            foreach ($normalized as $day => $values) {
                $insert->execute([
                    ':user_id' => $userId,
                    ':day_of_week' => $day,
                    ':cambridge_hours' => $values['cambridgeHours'],
                    ':georgian_hours' => $values['georgianHours'],
                    ':created_at' => $now,
                    ':updated_at' => $now,
                ]);
            }

            $this->connection->commit();
        } catch (\Throwable $throwable) {
            $this->connection->rollBack();
            throw $throwable;
        }

        return $this->findByUserIds([$userId]);
    }

    /**
     * @param array<int, array<string, mixed>> $days
     * @return array<string, array{cambridgeHours: int, georgianHours: int}>
     */
    private function normalizeDays(array $days): array
    {
        $normalized = [];
        foreach (self::WEEKDAYS as $day) {
            $normalized[$day] = ['cambridgeHours' => 0, 'georgianHours' => 0];
        }

        foreach ($days as $row) {
            $day = is_string($row['dayOfWeek'] ?? null) ? strtolower((string) $row['dayOfWeek']) : '';
            if (!in_array($day, self::WEEKDAYS, true)) {
                continue;
            }

            $cambridge = (int) max(0, (int) ($row['cambridgeHours'] ?? 0));
            $georgian = (int) max(0, (int) ($row['georgianHours'] ?? 0));

            $normalized[$day] = [
                'cambridgeHours' => $cambridge,
                'georgianHours' => $georgian,
            ];
        }

        return $normalized;
    }
}
