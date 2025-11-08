<?php
declare(strict_types=1);

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\JsonResponse;
use App\Support\Env;

require dirname(__DIR__, 1) . '/../vendor/autoload.php';

Env::boot(dirname(__DIR__, 2));
$config = AppConfig::fromEnv();

// CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? null;
$allowedOrigin = $config->corsOrigin();
if ($allowedOrigin === '*' && $config->isProduction()) {
    $allowedOrigin = $origin ?? '';
}
$originHeader = $allowedOrigin === '*' ? ($origin ?? '*') : $allowedOrigin;
header('Access-Control-Allow-Origin: ' . $originHeader);
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Vary: Origin');

// OPTIONS preflight
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    header('Content-Length: 0');
    exit;
}

try {
    $pdo = Database::connection($config);
    $tables = $pdo->query('SHOW TABLES')?->fetchAll(\PDO::FETCH_COLUMN) ?? [];

    JsonResponse::send([
        'status' => 'ok',
        'db' => 'connected',
        'tables' => $tables,
    ]);
} catch (\Throwable $exception) {
    JsonResponse::send(
        ['status' => 'error', 'message' => $exception->getMessage()],
        500
    );
}
