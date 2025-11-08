<?php
declare(strict_types=1);

namespace App\Config;

use App\Support\Env;

final class AppConfig
{
    public function __construct(
        private readonly string $environment,
        private readonly string $version,
        private readonly string $dbHost,
        private readonly int $dbPort,
        private readonly string $dbName,
        private readonly string $dbUser,
        private readonly string $dbPass,
        private readonly string $dbCharset,
        private readonly string $corsOrigin,
        private readonly bool $allowSeed
    ) {
    }

    public static function fromEnv(): self
    {
        $environment = strtolower(Env::get('APP_ENV', 'local') ?? 'local');
        $version = Env::get('APP_VERSION', '0.1.0') ?? '0.1.0';

        $corsOrigin = Env::get('CORS_ORIGIN', $environment === 'local' ? '*' : 'http://localhost:5173') ?? '*';
        if ($environment === 'production' && $corsOrigin === '*') {
            $corsOrigin = 'https://example.com';
        }

        return new self(
            $environment,
            $version,
            Env::get('DB_HOST', '127.0.0.1') ?? '127.0.0.1',
            (int) (Env::get('DB_PORT', '3306') ?? '3306'),
            Env::get('DB_NAME', 'hr_soft') ?? 'hr_soft',
            Env::get('DB_USER', 'root') ?? 'root',
            Env::get('DB_PASS', '') ?? '',
            Env::get('DB_CHARSET', 'utf8mb4') ?? 'utf8mb4',
            $corsOrigin,
            Env::bool('ALLOW_SEED', false)
        );
    }

    public function environment(): string
    {
        return $this->environment;
    }

    public function version(): string
    {
        return $this->version;
    }

    public function isProduction(): bool
    {
        return $this->environment === 'production';
    }

    public function corsOrigin(): string
    {
        if ($this->environment === 'local' && $this->corsOrigin === '') {
            return '*';
        }

        if ($this->environment === 'local' && $this->corsOrigin === '*') {
            return '*';
        }

        return $this->corsOrigin !== '' ? $this->corsOrigin : 'http://localhost:5173';
    }

    public function allowSeed(): bool
    {
        return $this->allowSeed;
    }

    public function databaseDsn(): string
    {
        return sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $this->dbHost,
            $this->dbPort,
            $this->dbName,
            $this->dbCharset
        );
    }

    public function databaseUser(): string
    {
        return $this->dbUser;
    }

    public function databasePassword(): string
    {
        return $this->dbPass;
    }

    public function databaseCharset(): string
    {
        return $this->dbCharset;
    }
}
