<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\ApplicationRepository;
use App\Support\Request;
use Throwable;

final class ApplicationController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function sync(): array
    {
        $payload = Request::json();
        $applications = $payload['applications'] ?? null;

        if (!is_array($applications)) {
            throw HttpException::badRequest('Payload must include an "applications" array.');
        }

        try {
            $connection = Database::connection($this->config);
            $repository = new ApplicationRepository($connection);

            return [
                'applications' => $repository->sync($applications),
            ];
        } catch (Throwable $exception) {
            throw HttpException::internal('Failed to sync applications.');
        }
    }
}
