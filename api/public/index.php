<?php
declare(strict_types=1);

use App\Config\AppConfig;
use App\Http\Kernel;
use App\Support\Env;

require dirname(__DIR__, 1) . '/../vendor/autoload.php';

// Bootstrap environment variables and configuration.
Env::boot(dirname(__DIR__, 2));

$config = AppConfig::fromEnv();
$kernel = new Kernel($config);
$kernel->handle($_SERVER);
