<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;

final class PayrollAuditLogRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @param array<string, mixed> $details
     */
    public function log(string $action, string $payrollMonth, ?int $batchId, ?int $userId, array $details = []): void
    {
        $statement = $this->connection->prepare(
            'INSERT INTO payroll_audit_logs (
                batch_id,
                payroll_month,
                action,
                user_id,
                details,
                created_at
            ) VALUES (
                :batch_id,
                :payroll_month,
                :action,
                :user_id,
                :details,
                :created_at
            )'
        );

        $statement->execute([
            ':batch_id' => $batchId,
            ':payroll_month' => $payrollMonth,
            ':action' => $action,
            ':user_id' => $userId,
            ':details' => json_encode($details, JSON_THROW_ON_ERROR),
            ':created_at' => (new DateTimeImmutable())->format('Y-m-d H:i:s'),
        ]);
    }
}
