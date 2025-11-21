<?php
declare(strict_types=1);

namespace App\Http;

use App\Config\AppConfig;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApplicationTypeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BootstrapController;
use App\Http\Controllers\CompensationBonusController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\LearningController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TeacherScheduleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkCalendarController;
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
        $teacherSchedule = new TeacherScheduleController($this->config);
        $workCalendar = new WorkCalendarController($this->config);
        $payroll = new PayrollController($this->config);
        $learning = new LearningController($this->config);
        $auth = new AuthController($this->config);

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
        $this->router->post('/teacher-schedule/analyze', fn () => $teacherSchedule->analyze());
        $this->router->post('/teacher-schedule/assign', fn () => $teacherSchedule->assign());
        $this->router->get('/teacher-schedule/assignments', fn () => $teacherSchedule->assignments());
        $this->router->get('/teacher-schedule/bonus', fn () => $teacherSchedule->bonusRates());
        $this->router->post('/teacher-schedule/bonus', fn () => $teacherSchedule->saveBonusRates());
        $this->router->get('/work-calendar', fn () => $workCalendar->index());
        $this->router->put('/work-calendar', fn () => $workCalendar->sync());
        $this->router->get('/payroll/batches', fn () => $payroll->index());
        $this->router->get('/payroll/batch', fn () => $payroll->show());
        $this->router->get('/payroll/stats', fn () => $payroll->summary());
        $this->router->post('/payroll/batches/create', fn () => $payroll->create());
        $this->router->post('/payroll/batches/update-status', fn () => $payroll->updateStatus());
        $this->router->get('/learning/class-hours', fn () => $learning->classHours());
        $this->router->post('/learning/class-hours', fn () => $learning->saveClassHours());
        $this->router->post('/auth/login', fn () => $auth->login());
        $this->router->post('/auth/reset/initiate', fn () => $auth->initiatePasswordReset());
        $this->router->post('/auth/reset/complete', fn () => $auth->completePasswordReset());
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
