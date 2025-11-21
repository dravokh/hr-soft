<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\AppConfig;
use App\Database\Database;
use App\Repositories\CompensationBonusRepository;
use App\Repositories\PayrollAuditLogRepository;
use App\Repositories\PayrollBatchRepository;
use App\Repositories\TeacherScheduleAssignmentRepository;
use App\Repositories\TeacherScheduleBonusRateRepository;
use App\Repositories\TeacherScheduleCompensationAdjustmentRepository;
use App\Repositories\UserRepository;
use InvalidArgumentException;

final class PayrollService
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listBatches(): array
    {
        $connection = Database::connection($this->config);
        return (new PayrollBatchRepository($connection))->all();
    }

    public function summary(): array
    {
        $batches = $this->listBatches();
        $totalGross = 0;
        $totalNet = 0;
        $totalTax = 0;
        $totalDeductions = 0;

        foreach ($batches as $batch) {
            $totalGross += (float) ($batch['gross_total'] ?? 0);
            $totalNet += (float) ($batch['net_total'] ?? 0);
            $totalTax += (float) ($batch['tax_total'] ?? 0);
            $totalDeductions += (float) ($batch['deduction_total'] ?? 0);
        }

        return [
            'totalBatches' => count($batches),
            'totalGross' => $totalGross,
            'totalNet' => $totalNet,
            'totalTax' => $totalTax,
            'totalDeductions' => $totalDeductions,
            'recent' => array_slice($batches, 0, 6),
        ];
    }

    public function getBatch(int $batchId): ?array
    {
        $connection = Database::connection($this->config);
        return (new PayrollBatchRepository($connection))->find($batchId);
    }

    /**
     * @throws InvalidArgumentException
     */
    public function createBatch(string $month, ?int $actorId = null): array
    {
        if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
            throw new InvalidArgumentException('Payroll month must be in YYYY-MM format.');
        }

        $connection = Database::connection($this->config);
        $batchRepository = new PayrollBatchRepository($connection);
        $auditRepository = new PayrollAuditLogRepository($connection);

        $existingBatch = $batchRepository->findByMonth($month);
        if ($existingBatch) {
            $batchRepository->delete((int) $existingBatch['id']);
            $auditRepository->log(
                'batch_regenerated',
                $month,
                (int) $existingBatch['id'],
                $actorId,
                [
                    'message' => 'Existing payroll batch removed before regeneration.',
                    'previousStatus' => $existingBatch['status'],
                    'previousTotals' => [
                        'gross' => $existingBatch['grossTotal'],
                        'net' => $existingBatch['netTotal'],
                        'tax' => $existingBatch['taxTotal'],
                        'deduction' => $existingBatch['deductionTotal'],
                    ],
                ]
            );
        }

        $userRepository = new UserRepository($connection);
        $assignmentRepository = new TeacherScheduleAssignmentRepository($connection);
        $bonusRateRepository = new TeacherScheduleBonusRateRepository($connection);
        $bonusRepository = new CompensationBonusRepository($connection);
        $adjustmentRepository = new TeacherScheduleCompensationAdjustmentRepository($connection);

        $users = $userRepository->all();
        $assignments = $assignmentRepository->all();
        $assignmentByUser = [];
        foreach ($assignments as $assignment) {
            $userId = (int) ($assignment['user_id'] ?? 0);
            if ($userId <= 0) {
                continue;
            }
            $assignmentByUser[$userId]['cambridge'] = ($assignmentByUser[$userId]['cambridge'] ?? 0)
                + (int) ($assignment['cambridge_count'] ?? 0);
            $assignmentByUser[$userId]['georgian'] = ($assignmentByUser[$userId]['georgian'] ?? 0)
                + (int) ($assignment['georgian_count'] ?? 0);
        }

        $rates = $bonusRateRepository->all();
        $cambridgeRate = (float) ($rates['cambridge'] ?? 0);
        $georgianRate = (float) ($rates['georgian'] ?? 0);
        $taxRate = (float) ($rates['tax'] ?? 0);

        $adjustments = $adjustmentRepository->all();

        $bonusTree = $bonusRepository->tree();
        $bonusLookup = $this->flattenBonusTree($bonusTree);

        $items = [];
        $grossTotal = 0;
        $taxTotal = 0;
        $deductionTotal = 0;
        $netTotal = 0;

        foreach ($users as $user) {
            $userId = (int) ($user['id'] ?? 0);
            if ($userId <= 0) {
                continue;
            }

            $baseSalary = (float) ($user['baseSalary'] ?? 0);
            $selectedBonusIds = $user['selectedBonusIds'] ?? [];
            $selectedBonusTotal = $this->calculateSelectedBonuses($selectedBonusIds, $bonusLookup, $baseSalary);

            $cambridgeLessons = $assignmentByUser[$userId]['cambridge'] ?? 0;
            $georgianLessons = $assignmentByUser[$userId]['georgian'] ?? 0;
            $lessonBonus = ($cambridgeLessons * $cambridgeRate) + ($georgianLessons * $georgianRate);
            $extraBonus = 0;

            $grossAmount = $baseSalary + $lessonBonus + $selectedBonusTotal + $extraBonus;
            $taxAmount = $grossAmount * ($taxRate / 100);
            $deductionAmount = 0;
            foreach ($adjustments as $adjustment) {
                $mode = ($adjustment['mode'] ?? 'percent') === 'fixed' ? 'fixed' : 'percent';
                $value = (float) ($adjustment['value'] ?? 0);
                if ($mode === 'percent') {
                    $deductionAmount += $grossAmount * ($value / 100);
                } else {
                    $deductionAmount += $value;
                }
            }
            $netAmount = max(0, $grossAmount - $taxAmount - $deductionAmount);

            $items[] = [
                'user_id' => $userId,
                'base_salary' => $baseSalary,
                'lesson_bonus' => $lessonBonus,
                'catalog_bonus' => $selectedBonusTotal,
                'extra_bonus' => $extraBonus,
                'gross_amount' => $grossAmount,
                'tax_amount' => $taxAmount,
                'deduction_amount' => $deductionAmount,
                'net_amount' => $netAmount,
                'cambridge_lessons' => $cambridgeLessons,
                'georgian_lessons' => $georgianLessons,
                'metadata' => [
                    'selectedBonusIds' => $selectedBonusIds,
                    'userName' => $user['name'] ?? '',
                    'role' => $user['role'] ?? '',
                ],
            ];

            $grossTotal += $grossAmount;
            $taxTotal += $taxAmount;
            $deductionTotal += $deductionAmount;
            $netTotal += $netAmount;
        }

        $newBatch = $batchRepository->create(
            [
                'payroll_month' => $month,
                'status' => 'draft',
                'created_by' => $actorId,
                'gross_total' => $grossTotal,
                'tax_total' => $taxTotal,
                'deduction_total' => $deductionTotal,
                'net_total' => $netTotal,
            ],
            $items
        );
        $auditRepository->log(
            $existingBatch ? 'batch_regenerated_created' : 'batch_created',
            $month,
            (int) ($newBatch['id'] ?? 0),
            $actorId,
            [
                'items' => count($items),
                'totals' => [
                    'gross' => $grossTotal,
                    'net' => $netTotal,
                    'tax' => $taxTotal,
                    'deduction' => $deductionTotal,
                ],
            ]
        );

        return $newBatch;
    }

    public function updateStatus(int $batchId, string $status, ?int $actorId = null): ?array
    {
        if (!in_array($status, ['draft', 'review', 'finalized'], true)) {
            throw new InvalidArgumentException('Unsupported payroll status.');
        }

        $connection = Database::connection($this->config);
        $batchRepository = new PayrollBatchRepository($connection);
        $auditRepository = new PayrollAuditLogRepository($connection);

        $previous = $batchRepository->find($batchId);
        $updated = $batchRepository->updateStatus($batchId, $status, $actorId);

        if ($updated) {
            $auditRepository->log(
                'status_changed',
                (string) ($updated['payrollMonth'] ?? ''),
                $batchId,
                $actorId,
                [
                    'from' => $previous['status'] ?? null,
                    'to' => $updated['status'] ?? null,
                ]
            );
        }

        return $updated;
    }

    /**
     * @param array<int, array<string, mixed>> $tree
     * @return array<int, array<string, mixed>>
     */
    private function flattenBonusTree(array $tree): array
    {
        $lookup = [];
        $stack = $tree;
        while ($stack) {
            $node = array_pop($stack);
            $lookup[(int) $node['id']] = $node;
            if (!empty($node['children']) && is_array($node['children'])) {
                foreach ($node['children'] as $child) {
                    $stack[] = $child;
                }
            }
        }

        return $lookup;
    }

    /**
     * @param array<int> $selectedIds
     * @param array<int, array<string, mixed>> $lookup
     */
    private function calculateSelectedBonuses(array $selectedIds, array $lookup, float $baseSalary): float
    {
        $total = 0;
        foreach ($selectedIds as $bonusId) {
            $bonus = $lookup[(int) $bonusId] ?? null;
            if (!$bonus) {
                continue;
            }
            $valueType = $bonus['valueType'] ?? null;
            $percent = $bonus['percent'] ?? null;
            $amount = $bonus['amount'] ?? null;

            if ($valueType === 'percent' && $percent !== null) {
                $total += $baseSalary * ((float) $percent / 100);
            } elseif ($valueType === 'amount' && $amount !== null) {
                $total += (float) $amount;
            }
        }

        return $total;
    }
}
