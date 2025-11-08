<?php
declare(strict_types=1);

namespace App\Database;

use App\Config\AppConfig;
use PDO;
use PDOException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(AppConfig $config): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        try {
            self::$pdo = new PDO(
                $config->databaseDsn(),
                $config->databaseUser(),
                $config->databasePassword(),
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => sprintf('SET NAMES %s', $config->databaseCharset()),
                ]
            );
        } catch (PDOException $exception) {
            throw $exception;
        }

        return self::$pdo;
    }

    public static function reset(): void
    {
        self::$pdo = null;
    }
}
