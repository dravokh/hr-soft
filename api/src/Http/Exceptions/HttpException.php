<?php
declare(strict_types=1);

namespace App\Http\Exceptions;

use RuntimeException;

final class HttpException extends RuntimeException
{
    private function __construct(private readonly int $statusCode, string $message)
    {
        parent::__construct($message, $statusCode);
    }

    public static function notFound(string $message = 'Not Found'): self
    {
        return new self(404, $message);
    }

    public static function badRequest(string $message = 'Bad Request'): self
    {
        return new self(400, $message);
    }

    public static function internal(string $message = 'Internal Server Error'): self
    {
        return new self(500, $message);
    }

    public static function serviceUnavailable(string $message = 'Service Unavailable'): self
    {
        return new self(503, $message);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }
}
