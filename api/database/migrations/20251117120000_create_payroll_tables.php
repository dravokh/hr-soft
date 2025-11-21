<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePayrollTables extends AbstractMigration
{
    public function up(): void
    {
        if (!$this->hasTable('payroll_batches')) {
            $this->table('payroll_batches', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['identity' => true])
                ->addColumn('payroll_month', 'string', ['limit' => 7])
                ->addColumn('status', 'string', ['limit' => 20, 'default' => 'draft'])
                ->addColumn('created_by', 'integer', ['null' => true])
                ->addColumn('reviewed_by', 'integer', ['null' => true])
                ->addColumn('finalized_by', 'integer', ['null' => true])
                ->addColumn('gross_total', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('tax_total', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('deduction_total', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('net_total', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('notes', 'text', ['null' => true])
                ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
                ->addIndex(['payroll_month'], ['unique' => true])
                ->create();
        }

        if (!$this->hasTable('payroll_items')) {
            $this->table('payroll_items', [
                'id' => false,
                'primary_key' => ['id'],
                'engine' => 'InnoDB',
                'encoding' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
            ])
                ->addColumn('id', 'integer', ['identity' => true])
                ->addColumn('batch_id', 'integer')
                ->addColumn('user_id', 'integer')
                ->addColumn('base_salary', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('lesson_bonus', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('catalog_bonus', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('extra_bonus', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('gross_amount', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('tax_amount', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('deduction_amount', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('net_amount', 'decimal', ['precision' => 12, 'scale' => 2, 'default' => 0])
                ->addColumn('cambridge_lessons', 'integer', ['default' => 0])
                ->addColumn('georgian_lessons', 'integer', ['default' => 0])
                ->addColumn('metadata', 'text', ['null' => true])
                ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                ->addColumn('updated_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP', 'update' => 'CURRENT_TIMESTAMP'])
                ->addIndex(['batch_id'])
                ->addForeignKey('batch_id', 'payroll_batches', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
                ->create();
        }
    }

    public function down(): void
    {
        if ($this->hasTable('payroll_items')) {
            $this->table('payroll_items')->drop()->save();
        }

        if ($this->hasTable('payroll_batches')) {
            $this->table('payroll_batches')->drop()->save();
        }
    }
}
