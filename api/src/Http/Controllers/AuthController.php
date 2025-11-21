<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\UserRepository;
use App\Services\BootstrapService;
use App\Support\Request;
use Throwable;

final class AuthController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function login(): array
    {
        $payload = Request::json();
        $personalId = trim((string) ($payload['personalId'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $campus = trim((string) ($payload['campus'] ?? ''));

        if ($personalId === '' || $password === '' || $campus === '') {
            throw HttpException::badRequest('Missing credentials.');
        }

        $connection = Database::connection($this->config);
        $statement = $connection->prepare(
            'SELECT id, personal_id, password, must_reset_password FROM users WHERE personal_id = :personal_id LIMIT 1'
        );
        $statement->execute([':personal_id' => $personalId]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);

        if (!$row || (string) ($row['password'] ?? '') !== $password) {
            return [
                'success' => false,
                'error' => 'Invalid personal ID or password.'
            ];
        }

        $bootstrap = (new BootstrapService($this->config))->fetch();
        $matchedUser = $this->findUserInBootstrap((int) $row['id'], $bootstrap);

        return [
            'success' => true,
            'token' => bin2hex(random_bytes(24)),
            'userId' => (int) $row['id'],
            'requiresPasswordReset' => (bool) ($row['must_reset_password'] ?? false),
            'user' => $matchedUser,
            'bootstrap' => $bootstrap
        ];
    }

    public function initiatePasswordReset(): array
    {
        $payload = Request::json();
        $userId = isset($payload['userId']) ? (int) $payload['userId'] : 0;

        if ($userId <= 0) {
            throw HttpException::badRequest('Valid userId is required.');
        }

        $repository = new UserRepository(Database::connection($this->config));
        $user = $this->findUser($repository, $userId);
        if ($user === null) {
            return [
                'success' => false,
                'error' => 'User not found.'
            ];
        }

        try {
            $repository->setMustResetPassword($userId, true);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to update password reset flag.');
        }

        $updatedUser = $this->findUser($repository, $userId);

        return [
            'success' => true,
            'user' => $updatedUser
        ];
    }

    public function completePasswordReset(): array
    {
        $payload = Request::json();
        $userId = isset($payload['userId']) ? (int) $payload['userId'] : 0;
        $newPassword = trim((string) ($payload['newPassword'] ?? ''));

        if ($userId <= 0 || $newPassword === '') {
            throw HttpException::badRequest('userId and newPassword are required.');
        }

        $repository = new UserRepository(Database::connection($this->config));
        $user = $this->findUser($repository, $userId);
        if ($user === null) {
            return [
                'success' => false,
                'error' => 'User not found.'
            ];
        }

        try {
            $repository->updatePassword($userId, $newPassword, false);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to update user password.');
        }

        $updatedUser = $this->findUser($repository, $userId);

        return [
            'success' => true,
            'user' => $updatedUser
        ];
    }

    private function findUser(UserRepository $repository, int $userId): ?array
    {
        foreach ($repository->all() as $user) {
            if ((int) ($user['id'] ?? 0) === $userId) {
                return $user;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $bootstrap
     */
    private function findUserInBootstrap(int $userId, array $bootstrap): ?array
    {
        $users = $bootstrap['users'] ?? [];
        foreach ($users as $user) {
            if ((int) ($user['id'] ?? 0) === $userId) {
                return $user;
            }
        }

        return null;
    }
}
