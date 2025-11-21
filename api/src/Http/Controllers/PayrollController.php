<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Http\Exceptions\HttpException;
use App\Services\PayrollService;
use App\Support\Request;
use InvalidArgumentException;
use Throwable;

final class PayrollController
{
    private PayrollService $service;

    public function __construct(private readonly AppConfig $config)
    {
        $this->service = new PayrollService($config);
    }

    public function index(): array
    {
        return ['batches' => $this->service->listBatches()];
    }

    public function summary(): array
    {
        return ['stats' => $this->service->summary()];
    }

    public function show(): array
    {
        $batchId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($batchId <= 0) {
            throw HttpException::badRequest('batchId is required.');
        }

        $batch = $this->service->getBatch($batchId);
        if (!$batch) {
            throw HttpException::notFound('Payroll batch not found.');
        }

        return ['batch' => $batch];
    }

    public function create(): array
    {
        $payload = Request::json();
        $month = (string) ($payload['month'] ?? '');
        $actorId = isset($payload['actorId']) ? (int) $payload['actorId'] : null;

        try {
            $batch = $this->service->createBatch($month, $actorId);
        } catch (InvalidArgumentException $exception) {
            throw HttpException::badRequest($exception->getMessage());
        } catch (Throwable $throwable) {
            throw HttpException::internal('Unable to generate payroll batch.');
        }

        return ['batch' => $batch];
    }

    public function updateStatus(): array
    {
        $payload = Request::json();
        $batchId = isset($payload['batchId']) ? (int) $payload['batchId'] : 0;
        $status = (string) ($payload['status'] ?? '');
        $actorId = isset($payload['actorId']) ? (int) $payload['actorId'] : null;

        if ($batchId <= 0 || $status === '') {
            throw HttpException::badRequest('batchId and status are required.');
        }

        try {
            $batch = $this->service->updateStatus($batchId, $status, $actorId);
        } catch (InvalidArgumentException $exception) {
            throw HttpException::badRequest($exception->getMessage());
        }

        if (!$batch) {
            throw HttpException::notFound('Payroll batch not found.');
        }

        return ['batch' => $batch];
    }
}
