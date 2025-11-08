<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\ApplicationTypeRepository;
use App\Support\Request;
use Throwable;

final class ApplicationTypeController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function sync(): array
    {
        $payload = Request::json();
        $types = $payload['applicationTypes'] ?? null;

        if (!is_array($types)) {
            throw HttpException::badRequest('Payload must include an "applicationTypes" array.');
        }

        try {
            $connection = Database::connection($this->config);
            $repository = new ApplicationTypeRepository($connection);

            return [
                'applicationTypes' => $repository->sync($types),
            ];
        } catch (Throwable $exception) {
            throw HttpException::internal('Failed to sync application types.');
        }
    }
}
