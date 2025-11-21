<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreatePayrollAuditLogsTable extends AbstractMigration
{
    public function up(): void
    {
        if ($this->hasTable('payroll_audit_logs')) {
            return;
        }

        $this->table('payroll_audit_logs', [
            'id' => false,
            'primary_key' => ['id'],
            'engine' => 'InnoDB',
            'encoding' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
        ])
            ->addColumn('id', 'integer', ['identity' => true])
            ->addColumn('batch_id', 'integer', ['null' => true])
            ->addColumn('payroll_month', 'string', ['limit' => 7])
            ->addColumn('action', 'string', ['limit' => 50])
            ->addColumn('user_id', 'integer', ['null' => true])
            ->addColumn('details', 'text', ['null' => true])
            ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
            ->addIndex(['batch_id'])
            ->addIndex(['payroll_month'])
            ->create();
    }

    public function down(): void
    {
        if ($this->hasTable('payroll_audit_logs')) {
            $this->table('payroll_audit_logs')->drop()->save();
        }
    }
}
