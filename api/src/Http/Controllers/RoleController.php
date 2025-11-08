<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\RoleRepository;
use App\Support\Request;
use Throwable;

final class RoleController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function sync(): array
    {
        $payload = Request::json();
        $roles = $payload['roles'] ?? null;

        if (!is_array($roles)) {
            throw HttpException::badRequest('Payload must include a "roles" array.');
        }

        try {
            $connection = Database::connection($this->config);
            $repository = new RoleRepository($connection);

            return [
                'roles' => $repository->sync($roles),
            ];
        } catch (Throwable $exception) {
            throw HttpException::internal('Failed to sync roles.');
        }
    }
}
