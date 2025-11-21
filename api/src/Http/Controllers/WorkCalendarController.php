<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\WorkCalendarRepository;
use App\Support\Request;
use Throwable;

final class WorkCalendarController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function index(): array
    {
        $year = isset($_GET['year']) ? (int) $_GET['year'] : 0;
        $month = isset($_GET['month']) ? (int) $_GET['month'] : 0;

        if ($year <= 0 || $month <= 0 || $month > 12) {
            throw HttpException::badRequest('Valid year and month query parameters are required.');
        }

        try {
            $repository = $this->repository();
            $records = $repository->forMonth($year, $month);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to load work calendar.');
        }

        return [
            'days' => array_map(
                static fn (array $row): array => [
                    'date' => (string) ($row['work_date'] ?? ''),
                    'isWorking' => (bool) ($row['is_working'] ?? false),
                    'note' => $row['note'] !== null ? (string) $row['note'] : '',
                ],
                $records
            ),
        ];
    }

    public function sync(): array
    {
        $payload = Request::json();
        $year = isset($payload['year']) ? (int) $payload['year'] : 0;
        $month = isset($payload['month']) ? (int) $payload['month'] : 0;
        $days = $payload['days'] ?? [];

        if ($year <= 0 || $month <= 0 || $month > 12) {
            throw HttpException::badRequest('Valid year and month values are required.');
        }

        if (!is_array($days)) {
            throw HttpException::badRequest('"days" must be an array.');
        }

        try {
            $repository = $this->repository();
            $saved = $repository->replaceMonth($year, $month, $days);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to update work calendar.');
        }

        return [
            'days' => array_map(
                static fn (array $row): array => [
                    'date' => (string) ($row['work_date'] ?? ''),
                    'isWorking' => (bool) ($row['is_working'] ?? false),
                    'note' => $row['note'] !== null ? (string) $row['note'] : '',
                ],
                $saved
            ),
        ];
    }

    private function repository(): WorkCalendarRepository
    {
        $connection = Database::connection($this->config);
        return new WorkCalendarRepository($connection);
    }
}
