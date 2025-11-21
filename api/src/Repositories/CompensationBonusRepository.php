<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;
use Throwable;

final class CompensationBonusRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function tree(): array
    {
        $statement = $this->connection->query(
            'SELECT id, parent_id, name, percent, amount
             FROM compensation_bonuses
             ORDER BY parent_id IS NULL DESC, parent_id, id'
        );

        $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) {
            return [];
        }

        $nodes = [];
        foreach ($rows as $row) {
            $nodes[(int) $row['id']] = [
                'id' => (int) $row['id'],
                'parentId' => $row['parent_id'] !== null ? (int) $row['parent_id'] : null,
                'name' => (string) $row['name'],
                'percent' => $row['percent'] !== null ? (float) $row['percent'] : null,
                'amount' => $row['amount'] !== null ? (float) $row['amount'] : null,
                'children' => []
            ];
        }

        $roots = [];
        foreach ($nodes as $id => &$node) {
            if ($node['parentId'] === null) {
                $roots[] = &$node;
                continue;
            }

            if (isset($nodes[$node['parentId']])) {
                $nodes[$node['parentId']]['children'][] = &$node;
                continue;
            }

            $node['parentId'] = null;
            $roots[] = &$node;
        }

        unset($node);

        return array_map($this->formatNode(...), $roots);
    }

    /**
     * @param array<int, array<string, mixed>> $bonuses
     */
    public function sync(array $bonuses): array
    {
        $this->connection->beginTransaction();

        try {
            $existingIds = $this->connection
                ->query('SELECT id FROM compensation_bonuses')
                ->fetchAll(PDO::FETCH_COLUMN);

            $visited = [];

            foreach ($bonuses as $node) {
                $this->persistNode($node, null, $visited);
            }

            $visited = array_values(array_unique($visited));
            $idsToDelete = array_diff(
                array_map('intval', $existingIds ?: []),
                $visited
            );

            if (!empty($idsToDelete)) {
                $placeholders = implode(',', array_fill(0, count($idsToDelete), '?'));
                $deleteStatement = $this->connection->prepare(
                    sprintf('DELETE FROM compensation_bonuses WHERE id IN (%s)', $placeholders)
                );
                $deleteStatement->execute(array_values($idsToDelete));
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->tree();
    }

    /**
     * @param array<string, mixed> $node
     */
    private function persistNode(array $node, ?int $parentId, array &$visited): int
    {
        $name = trim((string) ($node['name'] ?? ''));
        if ($name === '') {
            throw new \InvalidArgumentException('Bonus name is required.');
        }

        $percentValue = $node['percent'] ?? null;
        $percent = $percentValue === '' || $percentValue === null ? null : (float) $percentValue;
        $amountValue = $node['amount'] ?? null;
        $amount = $amountValue === '' || $amountValue === null ? null : (float) $amountValue;

        if ($percent !== null && $amount !== null) {
            throw new \InvalidArgumentException('Bonus cannot define both percent and amount.');
        }

        $id = isset($node['id']) && (int) $node['id'] > 0 ? (int) $node['id'] : null;

        if ($id !== null) {
            $statement = $this->connection->prepare(
                'INSERT INTO compensation_bonuses (id, parent_id, name, percent, amount)
                 VALUES (:id, :parent_id, :name, :percent, :amount)
                 ON DUPLICATE KEY UPDATE
                    parent_id = VALUES(parent_id),
                    name = VALUES(name),
                    percent = VALUES(percent),
                    amount = VALUES(amount)'
            );
            $statement->execute([
                ':id' => $id,
                ':parent_id' => $parentId,
                ':name' => $name,
                ':percent' => $percent,
                ':amount' => $amount
            ]);
        } else {
            $statement = $this->connection->prepare(
                'INSERT INTO compensation_bonuses (parent_id, name, percent, amount)
                 VALUES (:parent_id, :name, :percent, :amount)'
            );
            $statement->execute([
                ':parent_id' => $parentId,
                ':name' => $name,
                ':percent' => $percent,
                ':amount' => $amount
            ]);
            $id = (int) $this->connection->lastInsertId();
        }

        $visited[] = $id;

        $children = $node['children'] ?? [];
        foreach ($children as $child) {
            $this->persistNode($child, $id, $visited);
        }

        return $id;
    }

    /**
     * @param array<string, mixed> $node
     */
    private function formatNode(array $node): array
    {
        $children = $node['children'] ?? [];

        return [
            'id' => (int) $node['id'],
            'parentId' => $node['parentId'],
            'name' => (string) $node['name'],
            'percent' => $node['percent'] !== null ? (float) $node['percent'] : null,
            'amount' => $node['amount'] !== null ? (float) $node['amount'] : null,
            'valueType' => $this->determineValueType(
                $node['percent'] !== null ? (float) $node['percent'] : null,
                $node['amount'] !== null ? (float) $node['amount'] : null
            ),
            'children' => array_map($this->formatNode(...), $children)
        ];
    }

    private function determineValueType(?float $percent, ?float $amount): string
    {
        if ($amount !== null) {
            return 'amount';
        }
        if ($percent !== null) {
            return 'percent';
        }

        return 'none';
    }
}
