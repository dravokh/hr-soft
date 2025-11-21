<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;

final class TeacherScheduleAssignmentRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public static function normalizeName(string $teacher): string
    {
        $collapsed = preg_replace('/\s+/u', ' ', trim($teacher));
        return mb_strtoupper($collapsed ?? '', 'UTF-8');
    }

    /**
     * @param array<int, string> $teacherNames
     * @return array<string, array<string, mixed>>
     */
    public function findByTeacherNames(array $teacherNames): array
    {
        if ($teacherNames === []) {
            return [];
        }

        $normalized = array_values(array_unique(array_map(self::class . '::normalizeName', $teacherNames)));
        if ($normalized === []) {
            return [];
        }

        $placeholders = implode(', ', array_fill(0, count($normalized), '?'));
        $statement = $this->connection->prepare(
            sprintf(
                'SELECT teacher_name, normalized_teacher, user_id, cambridge_count, georgian_count FROM teacher_schedule_assignments WHERE normalized_teacher IN (%s)',
                $placeholders
            )
        );

        foreach ($normalized as $index => $value) {
            $statement->bindValue($index + 1, $value);
        }

        $statement->execute();

        $results = [];
        while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['normalized_teacher'];
            if (!is_string($key)) {
                continue;
            }

            $results[$key] = $row;
        }

        return $results;
    }

    /**
     * @return array<string, mixed>
     */
    public function save(string $teacherName, int $userId, int $cambridgeCount, int $georgianCount): array
    {
        $normalized = self::normalizeName($teacherName);
        if ($normalized === '') {
            throw new \InvalidArgumentException('Teacher name cannot be empty.');
        }

        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $statement = $this->connection->prepare(
            'INSERT INTO teacher_schedule_assignments (teacher_name, normalized_teacher, user_id, cambridge_count, georgian_count, created_at, updated_at)
            VALUES (:teacher_name, :normalized_teacher, :user_id, :cambridge_count, :georgian_count, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE teacher_name = VALUES(teacher_name), user_id = VALUES(user_id), cambridge_count = VALUES(cambridge_count), georgian_count = VALUES(georgian_count), updated_at = VALUES(updated_at)'
        );

        $statement->execute([
            ':teacher_name' => $teacherName,
            ':normalized_teacher' => $normalized,
            ':user_id' => $userId,
            ':cambridge_count' => $cambridgeCount,
            ':georgian_count' => $georgianCount,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        return $this->findOneByNormalizedName($normalized);
    }

    /**
     * @return array<string, mixed>
     */
    private function findOneByNormalizedName(string $normalized): array
    {
        $statement = $this->connection->prepare(
            'SELECT teacher_name, normalized_teacher, user_id, cambridge_count, georgian_count FROM teacher_schedule_assignments WHERE normalized_teacher = :normalized LIMIT 1'
        );
        $statement->execute([':normalized' => $normalized]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $row : [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function findByUserId(int $userId): array
    {
        $statement = $this->connection->prepare(
            'SELECT teacher_name, normalized_teacher, user_id, cambridge_count, georgian_count FROM teacher_schedule_assignments WHERE user_id = :user_id'
        );
        $statement->execute([':user_id' => $userId]);

        return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        $statement = $this->connection->query(
            'SELECT teacher_name, normalized_teacher, user_id, cambridge_count, georgian_count FROM teacher_schedule_assignments ORDER BY teacher_name ASC'
        );

        if ($statement === false) {
            return [];
        }

        return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }
}
