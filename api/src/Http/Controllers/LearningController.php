<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\TeacherClassHourRepository;
use App\Support\Request;
use Throwable;

final class LearningController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function classHours(): array
    {
        $userId = isset($_GET['userId']) ? (int) $_GET['userId'] : null;

        try {
            $repository = $this->repository();
            $rows = $userId ? $repository->findByUserIds([$userId]) : $repository->all();

            return ['plans' => $this->groupByUser($rows)];
        } catch (HttpException $exception) {
            throw $exception;
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to load learning plans.');
        }
    }

    public function saveClassHours(): array
    {
        $payload = Request::json();
        $userId = isset($payload['userId']) ? (int) $payload['userId'] : 0;
        if ($userId <= 0) {
            throw HttpException::badRequest('A valid userId is required.');
        }

        $days = $payload['days'] ?? [];
        if (!is_array($days)) {
            throw HttpException::badRequest('Days payload must be an array.');
        }

        try {
            $rows = $this->repository()->saveForUser($userId, $days);
            $plans = $this->groupByUser($rows);
            return ['plan' => $plans[0] ?? ['userId' => $userId, 'days' => []]];
        } catch (HttpException $exception) {
            throw $exception;
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to save learning plan.');
        }
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array<string, mixed>>
     */
    private function groupByUser(array $rows): array
    {
        $plans = [];
        foreach ($rows as $row) {
            $userId = isset($row['user_id']) ? (int) $row['user_id'] : 0;
            if ($userId <= 0) {
                continue;
            }

            $plan = $plans[$userId] ?? [
                'userId' => $userId,
                'updatedAt' => null,
                'days' => [],
            ];

            $plan['days'][] = [
                'dayOfWeek' => (string) ($row['day_of_week'] ?? ''),
                'cambridgeHours' => isset($row['cambridge_hours']) ? (int) $row['cambridge_hours'] : 0,
                'georgianHours' => isset($row['georgian_hours']) ? (int) $row['georgian_hours'] : 0,
            ];

            $plan['updatedAt'] = $this->latestDate($plan['updatedAt'], $row['updated_at'] ?? null);
            $plans[$userId] = $plan;
        }

        return array_values($plans);
    }

    private function latestDate(?string $current, ?string $candidate): ?string
    {
        if ($candidate === null || $candidate === '') {
            return $current;
        }
        if ($current === null || $current === '') {
            return $candidate;
        }

        return $candidate > $current ? $candidate : $current;
    }

    private function repository(): TeacherClassHourRepository
    {
        return new TeacherClassHourRepository(Database::connection($this->config));
    }
}
