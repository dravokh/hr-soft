<?php
declare(strict_types=1);

namespace App\Repositories;

use DateTimeImmutable;
use PDO;

final class TeacherScheduleBonusRateRepository
{
    private const DEFAULT_RATES = [
        'cambridge' => 0.0,
        'georgian' => 0.0,
        'cover' => 0.0,
        'tax' => 0.0,
    ];

    public function __construct(private readonly PDO $connection)
    {
    }

    /**
     * @return array<string, float>
     */
    public function all(): array
    {
        $statement = $this->connection->query('SELECT slug, amount FROM teacher_schedule_bonus_rates');
        $records = $statement ? $statement->fetchAll(PDO::FETCH_ASSOC) : [];

        $result = self::DEFAULT_RATES;
        foreach ($records as $record) {
            $slug = is_string($record['slug'] ?? null) ? strtolower((string) $record['slug']) : null;
            if ($slug === null) {
                continue;
            }

            $result[$slug] = (float) ($record['amount'] ?? 0);
        }

        return $result;
    }

    public function saveMany(array $rates): void
    {
        $now = (new DateTimeImmutable())->format('Y-m-d H:i:s');
        $statement = $this->connection->prepare(
            'INSERT INTO teacher_schedule_bonus_rates (slug, amount, created_at, updated_at)
            VALUES (:slug, :amount, :created_at, :updated_at)
            ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = VALUES(updated_at)'
        );

        foreach ($rates as $slug => $amount) {
            $normalizedSlug = strtolower((string) $slug);
            if (!array_key_exists($normalizedSlug, self::DEFAULT_RATES)) {
                continue;
            }

            $statement->execute([
                ':slug' => $normalizedSlug,
                ':amount' => (float) $amount,
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);
        }
    }
}
