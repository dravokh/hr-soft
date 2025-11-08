<?php
declare(strict_types=1);

namespace App\Http;

use App\Config\AppConfig;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApplicationTypeController;
use App\Http\Controllers\BootstrapController;
use App\Http\Controllers\CompensationBonusController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Exceptions\HttpException;
use Throwable;

final class Kernel
{
    private Router $router;

    public function __construct(private readonly AppConfig $config)
    {
        $this->router = new Router();
        $this->registerRoutes();
    }

    public function handle(array $server): void
    {
        $method = strtoupper($server['REQUEST_METHOD'] ?? 'GET');
        $uri = $server['REQUEST_URI'] ?? '/';

        $this->applyCors($server);

        if ($method === 'OPTIONS') {
            $this->handlePreflight();
            return;
        }

        try {
            $response = $this->router->dispatch($method, $uri);
            if (is_array($response)) {
                JsonResponse::send($response);
                return;
            }

            // If controller already produced output we respect it.
        } catch (HttpException $exception) {
            JsonResponse::send(
                [
                    'status' => 'error',
                    'message' => $exception->getMessage(),
                ],
                $exception->statusCode()
            );
        } catch (Throwable $throwable) {
            JsonResponse::send(
                [
                    'status' => 'error',
                    'message' => 'Unexpected error occurred.',
                ],
                500
            );
        }
    }

    private function registerRoutes(): void
    {
        $health = new HealthController($this->config);
        $bootstrap = new BootstrapController($this->config);
        $roles = new RoleController($this->config);
        $users = new UserController($this->config);
        $applicationTypes = new ApplicationTypeController($this->config);
        $applications = new ApplicationController($this->config);
        $compensationBonuses = new CompensationBonusController($this->config);

        $this->router->get('/health', fn () => $health->check());
        $this->router->get('/bootstrap.php', fn () => $bootstrap->index());
        $this->router->get('/bootstrap', fn () => $bootstrap->index());
        $this->router->post('/roles', fn () => $roles->sync());
        $this->router->put('/roles', fn () => $roles->sync());
        $this->router->post('/users', fn () => $users->sync());
        $this->router->put('/users', fn () => $users->sync());
        $this->router->post('/compensation-bonuses', fn () => $compensationBonuses->sync());
        $this->router->put('/compensation-bonuses', fn () => $compensationBonuses->sync());
        $this->router->post('/application-types', fn () => $applicationTypes->sync());
        $this->router->put('/application-types', fn () => $applicationTypes->sync());
        $this->router->post('/applications', fn () => $applications->sync());
        $this->router->put('/applications', fn () => $applications->sync());
    }

    private function applyCors(array $server): void
    {
        $origin = $server['HTTP_ORIGIN'] ?? null;
        $allowedOrigin = $this->config->corsOrigin();

        if ($allowedOrigin === '*' && $this->config->environment() === 'production') {
            $allowedOrigin = $origin ?? '';
        }

        $originHeader = $allowedOrigin === '*' ? ($origin ?? '*') : $allowedOrigin;

        header('Access-Control-Allow-Origin: ' . $originHeader);
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    private function handlePreflight(): void
    {
        http_response_code(204);
        header('Content-Length: 0');
    }
}
