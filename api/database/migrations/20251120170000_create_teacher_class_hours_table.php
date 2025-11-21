<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateTeacherClassHoursTable extends AbstractMigration
{
    private const WEEKDAYS = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
    ];

    public function change(): void
    {
        $this->table('teacher_class_hours', ['id' => false, 'primary_key' => ['user_id', 'day_of_week']])
            ->addColumn('user_id', 'integer')
            ->addColumn('day_of_week', 'enum', ['values' => self::WEEKDAYS])
            ->addColumn('cambridge_hours', 'integer', ['default' => 0])
            ->addColumn('georgian_hours', 'integer', ['default' => 0])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->create();
    }
}
