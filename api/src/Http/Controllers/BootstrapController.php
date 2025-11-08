<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Http\Exceptions\HttpException;
use App\Services\BootstrapService;
use Throwable;

final class BootstrapController
{
    private BootstrapService $service;

    public function __construct(private readonly AppConfig $config)
    {
        $this->service = new BootstrapService($config);
    }

    public function index(): array
    {
        try {
            return $this->service->fetch();
        } catch (Throwable $exception) {
            throw HttpException::internal('Unable to fetch bootstrap data');
        }
    }
}
