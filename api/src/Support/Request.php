<?php
declare(strict_types=1);

namespace App\Support;

use App\Http\Exceptions\HttpException;
use JsonException;

final class Request
{
    /**
     * @return array<string, mixed>
     */
    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }

        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw HttpException::badRequest('Invalid JSON payload provided.');
        }

        if (!is_array($decoded)) {
            throw HttpException::badRequest('JSON payload must decode to an object.');
        }

        return $decoded;
    }
}
