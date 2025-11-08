<?php
declare(strict_types=1);

namespace App\Services;

use App\Config\AppConfig;
use App\Database\Database;
use App\Repositories\ApplicationRepository;
use App\Repositories\ApplicationTypeRepository;
use App\Repositories\CompensationBonusRepository;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;

final class BootstrapService
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function fetch(): array
    {
        $connection = Database::connection($this->config);

        $roles = (new RoleRepository($connection))->allWithPermissions();
        $users = (new UserRepository($connection))->all();
        $applicationTypes = (new ApplicationTypeRepository($connection))->all();
        $applications = (new ApplicationRepository($connection))->all();
        $compensationBonuses = (new CompensationBonusRepository($connection))->tree();

        return [
            'roles' => $roles,
            'users' => $users,
            'applicationTypes' => $applicationTypes,
            'applications' => $applications,
            'compensationBonuses' => $compensationBonuses,
        ];
    }
}
