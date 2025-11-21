<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;
use Throwable;

final class PayrollBatchRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByMonth(string $payrollMonth): ?array
    {
        $statement = $this->connection->prepare(
            'SELECT * FROM payroll_batches WHERE payroll_month = :month LIMIT 1'
        );
        $statement->execute([':month' => $payrollMonth]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $batch = $this->transformBatchRow($row);
        $batch['items'] = $this->itemsForBatch((int) $row['id']);
        return $batch;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        $statement = $this->connection->query(
            'SELECT * FROM payroll_batches ORDER BY payroll_month DESC'
        );

        if (!$statement) {
            return [];
        }

        $rows = $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];
        return array_map(fn (array $row): array => $this->transformBatchRow($row), $rows);
    }

    public function delete(int $batchId): void
    {
        $this->connection->beginTransaction();
        try {
            $statement = $this->connection->prepare('DELETE FROM payroll_items WHERE batch_id = :batch_id');
            $statement->execute([':batch_id' => $batchId]);

            $statement = $this->connection->prepare('DELETE FROM payroll_batches WHERE id = :id');
            $statement->execute([':id' => $batchId]);

            $this->connection->commit();
        } catch (Throwable $throwable) {
            $this->connection->rollBack();
            throw $throwable;
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(int $batchId): ?array
    {
        $statement = $this->connection->prepare('SELECT * FROM payroll_batches WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $batchId]);
        $row = $statement->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $batch = $this->transformBatchRow($row);
        $batch['items'] = $this->itemsForBatch($batchId);
        return $batch;
    }

    /**
     * @param array<string, mixed> $batchData
     * @param array<int, array<string, mixed>> $items
     */
    public function create(array $batchData, array $items): array
    {
        $this->connection->beginTransaction();
        try {
            $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
            $statement = $this->connection->prepare(
                'INSERT INTO payroll_batches (
                    payroll_month, status, created_by, gross_total, tax_total, deduction_total, net_total, created_at, updated_at
                ) VALUES (
                    :payroll_month, :status, :created_by, :gross_total, :tax_total, :deduction_total, :net_total, :created_at, :updated_at
                )'
            );

            $statement->execute([
                ':payroll_month' => $batchData['payroll_month'],
                ':status' => $batchData['status'] ?? 'draft',
                ':created_by' => $batchData['created_by'] ?? null,
                ':gross_total' => $batchData['gross_total'] ?? 0,
                ':tax_total' => $batchData['tax_total'] ?? 0,
                ':deduction_total' => $batchData['deduction_total'] ?? 0,
                ':net_total' => $batchData['net_total'] ?? 0,
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);

            $batchId = (int) $this->connection->lastInsertId();
            $itemStatement = $this->connection->prepare(
                'INSERT INTO payroll_items (
                    batch_id,
                    user_id,
                    base_salary,
                    lesson_bonus,
                    catalog_bonus,
                    extra_bonus,
                    gross_amount,
                    tax_amount,
                    deduction_amount,
                    net_amount,
                    cambridge_lessons,
                    georgian_lessons,
                    metadata,
                    created_at,
                    updated_at
                ) VALUES (
                    :batch_id,
                    :user_id,
                    :base_salary,
                    :lesson_bonus,
                    :catalog_bonus,
                    :extra_bonus,
                    :gross_amount,
                    :tax_amount,
                    :deduction_amount,
                    :net_amount,
                    :cambridge_lessons,
                    :georgian_lessons,
                    :metadata,
                    :created_at,
                    :updated_at
                )'
            );

            foreach ($items as $item) {
                $itemStatement->execute([
                    ':batch_id' => $batchId,
                    ':user_id' => $item['user_id'],
                    ':base_salary' => $item['base_salary'],
                    ':lesson_bonus' => $item['lesson_bonus'],
                    ':catalog_bonus' => $item['catalog_bonus'],
                    ':extra_bonus' => $item['extra_bonus'],
                    ':gross_amount' => $item['gross_amount'],
                    ':tax_amount' => $item['tax_amount'],
                    ':deduction_amount' => $item['deduction_amount'],
                    ':net_amount' => $item['net_amount'],
                    ':cambridge_lessons' => $item['cambridge_lessons'],
                    ':georgian_lessons' => $item['georgian_lessons'],
                    ':metadata' => json_encode($item['metadata'] ?? [], JSON_THROW_ON_ERROR),
                    ':created_at' => $now,
                    ':updated_at' => $now,
                ]);
            }

            $this->connection->commit();
            return $this->find($batchId) ?? [];
        } catch (Throwable $throwable) {
            $this->connection->rollBack();
            throw $throwable;
        }
    }

    public function updateStatus(int $batchId, string $status, ?int $actorId = null): ?array
    {
        $updates = [
            ':status' => $status,
            ':id' => $batchId,
        ];
        $set = 'status = :status, updated_at = :updated_at';
        $updates[':updated_at'] = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        if ($status === 'review') {
            $set .= ', reviewed_by = :actor';
            $updates[':actor'] = $actorId;
        } elseif ($status === 'finalized') {
            $set .= ', finalized_by = :actor';
            $updates[':actor'] = $actorId;
        }

        $statement = $this->connection->prepare(
            sprintf('UPDATE payroll_batches SET %s WHERE id = :id', $set)
        );
        $statement->execute($updates);

        return $this->find($batchId);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function itemsForBatch(int $batchId): array
    {
        $statement = $this->connection->prepare(
            'SELECT * FROM payroll_items WHERE batch_id = :batch_id ORDER BY user_id ASC'
        );
        $statement->execute([':batch_id' => $batchId]);
        $rows = $statement->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map(fn (array $row): array => $this->transformItemRow($row), $rows);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformBatchRow(array $row): array
    {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'payrollMonth' => (string) ($row['payroll_month'] ?? ''),
            'status' => (string) ($row['status'] ?? 'draft'),
            'grossTotal' => (float) ($row['gross_total'] ?? 0),
            'taxTotal' => (float) ($row['tax_total'] ?? 0),
            'deductionTotal' => (float) ($row['deduction_total'] ?? 0),
            'netTotal' => (float) ($row['net_total'] ?? 0),
            'createdBy' => isset($row['created_by']) ? (int) $row['created_by'] : null,
            'reviewedBy' => isset($row['reviewed_by']) ? (int) $row['reviewed_by'] : null,
            'finalizedBy' => isset($row['finalized_by']) ? (int) $row['finalized_by'] : null,
            'createdAt' => $row['created_at'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function transformItemRow(array $row): array
    {
        return [
            'id' => (int) ($row['id'] ?? 0),
            'userId' => (int) ($row['user_id'] ?? 0),
            'baseSalary' => (float) ($row['base_salary'] ?? 0),
            'lessonBonus' => (float) ($row['lesson_bonus'] ?? 0),
            'catalogBonus' => (float) ($row['catalog_bonus'] ?? 0),
            'extraBonus' => (float) ($row['extra_bonus'] ?? 0),
            'grossAmount' => (float) ($row['gross_amount'] ?? 0),
            'taxAmount' => (float) ($row['tax_amount'] ?? 0),
            'deductionAmount' => (float) ($row['deduction_amount'] ?? 0),
            'netAmount' => (float) ($row['net_amount'] ?? 0),
            'cambridgeLessons' => (int) ($row['cambridge_lessons'] ?? 0),
            'georgianLessons' => (int) ($row['georgian_lessons'] ?? 0),
            'metadata' => $row['metadata']
                ? json_decode((string) $row['metadata'], true, 512, JSON_THROW_ON_ERROR)
                : [],
        ];
    }
}
