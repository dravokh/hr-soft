<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use PDO;
use Throwable;

final class HealthController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function check(): array
    {
        try {
            $pdo = Database::connection($this->config);
            $this->ping($pdo);
        } catch (Throwable $exception) {
            throw HttpException::serviceUnavailable('Database connection failed');
        }

        return [
            'status' => 'ok',
            'env' => $this->config->environment(),
            'db' => 'connected',
            'version' => $this->config->version(),
        ];
    }

    private function ping(PDO $pdo): void
    {
        $pdo->query('SELECT 1');
    }
}
