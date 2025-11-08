<?php
declare(strict_types=1);

namespace App\Support;

use Dotenv\Dotenv;

final class Env
{
    public static function boot(string $rootPath): void
    {
        $envFile = $rootPath . '/.env';
        $productionEnv = $rootPath . '/.env.production';

        if (is_file($envFile)) {
            Dotenv::createImmutable($rootPath)->safeLoad();
        } elseif (is_file($productionEnv)) {
            Dotenv::createImmutable($rootPath, '.env.production')->safeLoad();
        }

        // Ensure environment variables available via getenv.
        foreach ($_ENV as $key => $value) {
            if (getenv($key) === false) {
                putenv(sprintf('%s=%s', $key, $value));
            }
        }

        date_default_timezone_set('UTC');
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($value === false || $value === null || $value === '') {
            return $default;
        }
        return $value;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::get($key);
        if ($value === null) {
            return $default;
        }

        $normalized = strtolower($value);
        return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
    }
}
