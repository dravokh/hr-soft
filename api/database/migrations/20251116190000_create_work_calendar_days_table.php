<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateWorkCalendarDaysTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('work_calendar_days')) {
            return;
        }

        $this->table('work_calendar_days', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('work_date', 'date')
            ->addColumn('is_working', 'boolean', ['default' => false])
            ->addColumn('note', 'string', ['limit' => 255, 'null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', [
                'default' => 'CURRENT_TIMESTAMP',
                'update' => 'CURRENT_TIMESTAMP',
            ])
            ->addIndex(['work_date'], ['unique' => true])
            ->create();
    }

    public function down(): void
    {
        if ($this->hasTable('work_calendar_days')) {
            $this->table('work_calendar_days')->drop()->save();
        }
    }
}
