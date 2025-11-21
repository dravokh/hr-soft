<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveBreakFromWorkSchedule extends AbstractMigration
{
    public function up(): void
    {
        if (!$this->hasTable('work_shifts')) {
            return;
        }

        $table = $this->table('work_shifts');
        if ($table->hasColumn('break_minutes')) {
            $table->removeColumn('break_minutes')->update();
        }
    }

    public function down(): void
    {
        if (!$this->hasTable('work_shifts')) {
            return;
        }

        $table = $this->table('work_shifts');
        if (!$table->hasColumn('break_minutes')) {
            $table->addColumn('break_minutes', 'integer', [
                'default' => 0,
                'after' => 'end_time'
            ])->update();
        }
    }
}
