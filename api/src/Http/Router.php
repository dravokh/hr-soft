<?php
declare(strict_types=1);

namespace App\Http;

use App\Http\Exceptions\HttpException;

final class Router
{
    /**
     * @var array<string, array<string, callable>>
     */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->addRoute('GET', $path, $handler);
        $this->addRoute('HEAD', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function patch(string $path, callable $handler): void
    {
        $this->addRoute('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, callable $handler): void
    {
        $normalized = rtrim($path, '/') ?: '/';
        $this->routes[$method][$normalized] = $handler;
    }

    public function dispatch(string $method, string $uri): mixed
    {
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';
        $normalized = rtrim($path, '/') ?: '/';

        $handler = $this->routes[$method][$normalized] ?? null;
        if ($handler === null) {
            throw HttpException::notFound(sprintf('Route %s %s not found', $method, $normalized));
        }

        return $handler();
    }
}
