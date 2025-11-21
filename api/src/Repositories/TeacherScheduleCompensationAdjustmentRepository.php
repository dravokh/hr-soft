<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;
use Throwable;

final class TeacherScheduleCompensationAdjustmentRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        $statement = $this->connection->query(
            'SELECT id, label, mode, value
             FROM teacher_schedule_compensation_adjustments
             ORDER BY sort_order ASC, id ASC'
        );

        $records = $statement ? $statement->fetchAll(PDO::FETCH_ASSOC) : [];

        return array_map(
            static function (array $row): array {
                $mode = ($row['mode'] ?? 'percent') === 'fixed' ? 'fixed' : 'percent';
                return [
                    'id' => isset($row['id']) ? (int) $row['id'] : 0,
                    'label' => (string) ($row['label'] ?? ''),
                    'mode' => $mode,
                    'value' => (float) ($row['value'] ?? 0),
                ];
            },
            $records
        );
    }

    /**
     * @param array<int, array<string, mixed>> $adjustments
     *
     * @return array<int, array<string, mixed>>
     */
    public function replaceAll(array $adjustments): array
    {
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $this->connection->beginTransaction();

        try {
            $this->connection->exec('DELETE FROM teacher_schedule_compensation_adjustments');

            $statement = $this->connection->prepare(
                'INSERT INTO teacher_schedule_compensation_adjustments (label, mode, value, sort_order, created_at, updated_at)
                 VALUES (:label, :mode, :value, :sort_order, :created_at, :updated_at)'
            );

            foreach ($adjustments as $index => $adjustment) {
                $mode = ($adjustment['mode'] ?? 'percent') === 'fixed' ? 'fixed' : 'percent';
                $statement->execute([
                    ':label' => (string) ($adjustment['label'] ?? ''),
                    ':mode' => $mode,
                    ':value' => (float) ($adjustment['value'] ?? 0),
                    ':sort_order' => $index,
                    ':created_at' => $now,
                    ':updated_at' => $now,
                ]);
            }

            $this->connection->commit();
        } catch (Throwable $throwable) {
            $this->connection->rollBack();
            throw $throwable;
        }

        return $this->all();
    }
}
