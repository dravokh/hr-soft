<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\CompensationBonusRepository;
use App\Support\Request;
use Throwable;

final class CompensationBonusController
{
    public function __construct(private readonly AppConfig $config)
    {
    }

    public function sync(): array
    {
        $payload = Request::json();
        $bonuses = $payload['bonuses'] ?? [];
        if (!is_array($bonuses)) {
            throw HttpException::badRequest('Payload must include a bonuses array.');
        }

        $repository = new CompensationBonusRepository(Database::connection($this->config));

        try {
            $saved = $repository->sync($bonuses);
        } catch (Throwable $exception) {
            throw HttpException::internal('Unable to save compensation bonuses');
        }

        return ['bonuses' => $saved];
    }
}
