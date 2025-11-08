<?php
declare(strict_types=1);

use App\Config\AppConfig;
use App\Support\Env;

require __DIR__ . '/vendor/autoload.php';

Env::boot(__DIR__);
$config = AppConfig::fromEnv();

$databaseSettings = [
    'adapter' => 'mysql',
    'host' => Env::get('DB_HOST', '127.0.0.1'),
    'name' => Env::get('DB_NAME', 'hr_soft'),
    'user' => Env::get('DB_USER', 'root'),
    'pass' => Env::get('DB_PASS', ''),
    'port' => (int) (Env::get('DB_PORT', '3306') ?? '3306'),
    'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
    'collation' => 'utf8mb4_unicode_ci',
];

return [
    'paths' => [
        'migrations' => 'api/database/migrations',
        'seeds' => 'api/database/seeds',
    ],
    'environments' => [
        'default_migration_table' => 'phinxlog',
        'default_environment' => $config->environment(),
        'local' => $databaseSettings,
        'production' => $databaseSettings,
    ],
    'version_order' => 'creation',
];
