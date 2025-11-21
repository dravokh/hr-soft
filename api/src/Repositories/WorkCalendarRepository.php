<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;
use Throwable;

final class WorkCalendarRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forMonth(int $year, int $month): array
    {
        [$start, $end] = $this->monthBounds($year, $month);

        $statement = $this->connection->prepare(
            'SELECT work_date, is_working, note
             FROM work_calendar_days
             WHERE work_date BETWEEN :start AND :end
             ORDER BY work_date'
        );
        $statement->execute([
            ':start' => $start,
            ':end' => $end,
        ]);

        return $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /**
     * @param array<int, array<string, mixed>> $days
     * @return array<int, array<string, mixed>>
     */
    public function replaceMonth(int $year, int $month, array $days): array
    {
        [$start, $end] = $this->monthBounds($year, $month);

        $this->connection->beginTransaction();

        try {
            $delete = $this->connection->prepare(
                'DELETE FROM work_calendar_days WHERE work_date BETWEEN :start AND :end'
            );
            $delete->execute([
                ':start' => $start,
                ':end' => $end,
            ]);

            if (!empty($days)) {
                $insert = $this->connection->prepare(
                    'INSERT INTO work_calendar_days (work_date, is_working, note)
                     VALUES (:work_date, :is_working, :note)'
                );

                foreach ($days as $day) {
                    $date = $this->normalizeDate((string) ($day['date'] ?? ''));
                    if ($date === null) {
                        continue;
                    }

                    if ($date < $start || $date > $end) {
                        continue;
                    }

                    $isWorking = isset($day['isWorking']) ? (bool) $day['isWorking'] : false;
                    $note = $day['note'] ?? null;
                    $note = $note !== null ? trim((string) $note) : null;

                    $insert->execute([
                        ':work_date' => $date,
                        ':is_working' => $isWorking ? 1 : 0,
                        ':note' => $note,
                    ]);
                }
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->forMonth($year, $month);
    }

    private function monthBounds(int $year, int $month): array
    {
        $normalizedMonth = max(1, min(12, $month));
        $normalizedYear = $year > 1970 ? $year : (int) date('Y');

        $start = new DateTimeImmutable(sprintf('%04d-%02d-01', $normalizedYear, $normalizedMonth));
        $end = $start->modify('last day of this month');

        return [$start->format('Y-m-d'), $end->format('Y-m-d')];
    }

    private function normalizeDate(string $value): ?string
    {
        if ($value === '') {
            return null;
        }
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $value);
        if (!$date) {
            return null;
        }
        return $date->format('Y-m-d');
    }
}
