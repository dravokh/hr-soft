<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeacherScheduleBonusRatesTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('teacher_schedule_bonus_rates')) {
            return;
        }

        $this->table('teacher_schedule_bonus_rates', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('slug', 'string', ['limit' => 50])
            ->addColumn('amount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['slug'], ['unique' => true])
            ->create();
    }

    public function down(): void
    {
        if ($this->hasTable('teacher_schedule_bonus_rates')) {
            $this->table('teacher_schedule_bonus_rates')->drop()->save();
        }
    }
}
