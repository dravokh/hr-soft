<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeacherScheduleCompensationAdjustmentsTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('teacher_schedule_compensation_adjustments')) {
            return;
        }

        $this->table('teacher_schedule_compensation_adjustments', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('label', 'string', ['limit' => 150])
            ->addColumn('mode', 'string', ['limit' => 20])
            ->addColumn('value', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => 0])
            ->addColumn('sort_order', 'integer', ['default' => 0])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->create();
    }

    public function down(): void
    {
        if ($this->hasTable('teacher_schedule_compensation_adjustments')) {
            $this->table('teacher_schedule_compensation_adjustments')->drop()->save();
        }
    }
}
