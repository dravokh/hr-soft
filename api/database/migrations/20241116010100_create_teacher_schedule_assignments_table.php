<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeacherScheduleAssignmentsTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('teacher_schedule_assignments')) {
            return;
        }

        $this->table('teacher_schedule_assignments', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('teacher_name', 'string', ['limit' => 255])
            ->addColumn('normalized_teacher', 'string', ['limit' => 255])
            ->addColumn('user_id', 'integer')
            ->addColumn('cambridge_count', 'integer', ['default' => 0])
            ->addColumn('georgian_count', 'integer', ['default' => 0])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['normalized_teacher'], ['unique' => true])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }

    public function down(): void
    {
        if ($this->hasTable('teacher_schedule_assignments')) {
            $this->table('teacher_schedule_assignments')->drop()->save();
        }
    }
}
