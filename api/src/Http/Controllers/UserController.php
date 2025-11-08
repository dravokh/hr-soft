<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\UserRepository;
use App\Support\Request;
use Throwable;

final class UserController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function sync(): array
    {
        $payload = Request::json();
        $users = $payload['users'] ?? null;

        if (!is_array($users)) {
            throw HttpException::badRequest('Payload must include a "users" array.');
        }

        try {
            $connection = Database::connection($this->config);
            $repository = new UserRepository($connection);

            return [
                'users' => $repository->sync($users),
            ];
        } catch (Throwable $exception) {
            throw HttpException::internal('Failed to sync users.');
        }
    }
}
