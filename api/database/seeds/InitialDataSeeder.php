<?php
declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class InitialDataSeeder extends AbstractSeed
{
    public function run(): void
    {
        $this->seedRoles();
        $this->seedPermissions();
        $this->seedRolePermissions();
        $this->seedUsers();
        $this->seedTeacherClassHours();
        $this->seedApplicationTypes();
        $this->seedApplicationTypeFields();
        $this->seedApplicationTypeFlow();
        $this->seedApplicationTypeSla();
        $this->seedApplications();
        $this->seedApplicationFieldValues();
        $this->seedApplicationAttachments();
        $this->seedApplicationAuditLog();
        $this->seedTickets();
        $this->seedWorkCalendarDays();
    }

    private function seedRoles(): void
    {
        $roles = [
            ['id' => 1, 'name' => 'Admin', 'description' => 'Global administrator'],
            ['id' => 2, 'name' => 'HR', 'description' => 'HR manager'],
            ['id' => 3, 'name' => 'Employee', 'description' => 'Employee user'],
        ];

        $this->insertMissing('roles', $roles, 'id');
    }

    private function seedPermissions(): void
    {
        $permissions = [
            ['id' => 'view_dashboard', 'name' => 'View dashboard', 'category' => 'Dashboard'],
            ['id' => 'view_users', 'name' => 'View users', 'category' => 'Users'],
            ['id' => 'create_users', 'name' => 'Create users', 'category' => 'Users'],
            ['id' => 'edit_users', 'name' => 'Edit users', 'category' => 'Users'],
            ['id' => 'delete_users', 'name' => 'Delete users', 'category' => 'Users'],
            ['id' => 'view_roles', 'name' => 'View roles', 'category' => 'Roles'],
            ['id' => 'create_roles', 'name' => 'Create roles', 'category' => 'Roles'],
            ['id' => 'edit_roles', 'name' => 'Edit roles', 'category' => 'Roles'],
            ['id' => 'delete_roles', 'name' => 'Delete roles', 'category' => 'Roles'],
            ['id' => 'view_requests', 'name' => 'View requests', 'category' => 'Requests'],
            ['id' => 'create_requests', 'name' => 'Create requests', 'category' => 'Requests'],
            ['id' => 'approve_requests', 'name' => 'Approve requests', 'category' => 'Requests'],
            ['id' => 'view_tickets', 'name' => 'View tickets', 'category' => 'Tickets'],
            ['id' => 'create_tickets', 'name' => 'Create tickets', 'category' => 'Tickets'],
            ['id' => 'update_tickets', 'name' => 'Update tickets', 'category' => 'Tickets'],
            ['id' => 'set_ticket_priority', 'name' => 'Set ticket priority', 'category' => 'Tickets'],
            ['id' => 'manage_request_types', 'name' => 'Manage request types', 'category' => 'Requests'],
            ['id' => 'view_hr', 'name' => 'Access HR workspace', 'category' => 'HR'],
            ['id' => 'manage_work_shifts', 'name' => 'Manage work shifts', 'category' => 'HR'],
            ['id' => 'manage_lesson_bonuses', 'name' => 'Manage lesson bonuses', 'category' => 'HR'],
            ['id' => 'view_teacher_schedule', 'name' => 'View teacher schedule', 'category' => 'Teacher Schedule'],
            ['id' => 'analyze_teacher_schedule', 'name' => 'Analyze teacher schedule files', 'category' => 'Teacher Schedule'],
            ['id' => 'assign_teacher_schedule', 'name' => 'Assign teacher schedule records', 'category' => 'Teacher Schedule'],
            ['id' => 'manage_learning', 'name' => 'Manage learning workspace', 'category' => 'Learning'],
            ['id' => 'manage_permissions', 'name' => 'Manage permissions', 'category' => 'System'],
        ];

        $this->insertMissing('permissions', $permissions, 'id');
    }

    private function seedRolePermissions(): void
    {
        $adminPermissions = array_map(
            static fn ($permissionId) => ['role_id' => 1, 'permission_id' => $permissionId],
            array_column($this->getAll('permissions'), 'id')
        );

        $hrPermissions = [
            'view_dashboard',
            'view_users',
            'view_requests',
            'approve_requests',
            'view_tickets',
            'update_tickets',
            'set_ticket_priority',
            'manage_request_types',
            'view_hr',
            'manage_work_shifts',
            'manage_lesson_bonuses',
            'view_teacher_schedule',
            'analyze_teacher_schedule',
            'assign_teacher_schedule',
            'manage_learning',
        ];

        $employeePermissions = [
            'view_dashboard',
            'view_requests',
            'create_requests',
        ];

        $rows = array_merge(
            $adminPermissions,
            array_map(static fn ($permissionId) => ['role_id' => 2, 'permission_id' => $permissionId], $hrPermissions),
            array_map(static fn ($permissionId) => ['role_id' => 3, 'permission_id' => $permissionId], $employeePermissions),
        );

        $this->insertMissing('role_permissions', $rows, ['role_id', 'permission_id']);
    }

    private function seedUsers(): void
    {
        $users = [
            [
                'id' => 1,
                'name' => 'Admin User',
                'email' => 'admin@hr.com',
                'phone' => '+995 555 000 001',
                'password' => 'admin123',
                'role_id' => 1,
                'avatar' => 'A',
            ],
            [
                'id' => 2,
                'name' => 'HR Manager',
                'email' => 'hr@hr.com',
                'phone' => '+995 555 000 002',
                'password' => 'hr123',
                'role_id' => 2,
                'avatar' => 'H',
            ],
            [
                'id' => 3,
                'name' => 'Employee User',
                'email' => 'user@hr.com',
                'phone' => '+995 555 000 003',
                'password' => 'user123',
                'role_id' => 3,
                'avatar' => 'E',
            ],
        ];

        $this->insertMissing('users', $users, 'id');
    }

    private function seedTeacherClassHours(): void
    {
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $now = date('Y-m-d H:i:s');

        $rows = [];

        foreach ($days as $day) {
            $rows[] = [
                'user_id' => 1,
                'day_of_week' => $day,
                'cambridge_hours' => 0,
                'georgian_hours' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($days as $day) {
            $rows[] = [
                'user_id' => 2,
                'day_of_week' => $day,
                'cambridge_hours' => in_array($day, ['saturday', 'sunday'], true) ? 0 : 2,
                'georgian_hours' => in_array($day, ['saturday', 'sunday'], true) ? 0 : 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($days as $day) {
            $rows[] = [
                'user_id' => 3,
                'day_of_week' => $day,
                'cambridge_hours' => in_array($day, ['saturday', 'sunday'], true) ? 0 : 1,
                'georgian_hours' => in_array($day, ['saturday', 'sunday'], true) ? 0 : 1,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        $this->insertMissing('teacher_class_hours', $rows, ['user_id', 'day_of_week']);
    }

    private function seedApplicationTypes(): void
    {
        $types = [
            [
                'id' => 1,
                'name_ka' => 'Leave request',
                'name_en' => 'Leave request',
                'description_ka' => 'Approval workflow for planned or urgent leave requests.',
                'description_en' => 'Approval workflow for planned or urgent leave requests.',
                'icon' => 'CalendarDays',
                'color' => 'bg-sky-500',
            ],
            [
                'id' => 2,
                'name_ka' => 'Business trip request',
                'name_en' => 'Business trip request',
                'description_ka' => 'Approval for travel itineraries and budget expectations.',
                'description_en' => 'Approval for travel itineraries and budget expectations.',
                'icon' => 'Plane',
                'color' => 'bg-indigo-500',
            ],
        ];

        $this->insertMissing('application_types', $types, 'id');
    }

    private function seedApplicationTypeFields(): void
    {
        $fields = [
            [
                'id' => 1,
                'type_id' => 1,
                'field_key' => 'reason',
                'label_ka' => 'Leave reason',
                'label_en' => 'Leave reason',
                'field_type' => 'textarea',
                'is_required' => 1,
                'placeholder_ka' => 'Describe the reason',
                'placeholder_en' => 'Describe the reason',
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 2,
                'type_id' => 1,
                'field_key' => 'start_date',
                'label_ka' => 'Start date',
                'label_en' => 'Start date',
                'field_type' => 'date',
                'is_required' => 1,
                'placeholder_ka' => null,
                'placeholder_en' => null,
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 3,
                'type_id' => 1,
                'field_key' => 'end_date',
                'label_ka' => 'End date',
                'label_en' => 'End date',
                'field_type' => 'date',
                'is_required' => 1,
                'placeholder_ka' => null,
                'placeholder_en' => null,
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 4,
                'type_id' => 1,
                'field_key' => 'contact_phone',
                'label_ka' => 'Contact phone',
                'label_en' => 'Contact phone',
                'field_type' => 'text',
                'is_required' => 1,
                'placeholder_ka' => '+995 5XX XXX XXX',
                'placeholder_en' => '+995 5XX XXX XXX',
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 5,
                'type_id' => 1,
                'field_key' => 'additional_comment',
                'label_ka' => 'Additional comment',
                'label_en' => 'Additional comment',
                'field_type' => 'textarea',
                'is_required' => 0,
                'placeholder_ka' => null,
                'placeholder_en' => null,
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 6,
                'type_id' => 2,
                'field_key' => 'destination',
                'label_ka' => 'Destination',
                'label_en' => 'Destination',
                'field_type' => 'text',
                'is_required' => 1,
                'placeholder_ka' => 'e.g. Barcelona, Spain',
                'placeholder_en' => 'e.g. Barcelona, Spain',
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 7,
                'type_id' => 2,
                'field_key' => 'travel_dates',
                'label_ka' => 'Travel dates',
                'label_en' => 'Travel dates',
                'field_type' => 'date_range',
                'is_required' => 1,
                'placeholder_ka' => null,
                'placeholder_en' => null,
                'helper_ka' => 'Include departure and return dates.',
                'helper_en' => 'Include departure and return dates.',
            ],
            [
                'id' => 8,
                'type_id' => 2,
                'field_key' => 'budget',
                'label_ka' => 'Estimated budget',
                'label_en' => 'Estimated budget',
                'field_type' => 'number',
                'is_required' => 1,
                'placeholder_ka' => 'e.g. 2400',
                'placeholder_en' => 'e.g. 2400',
                'helper_ka' => null,
                'helper_en' => null,
            ],
            [
                'id' => 9,
                'type_id' => 2,
                'field_key' => 'purpose',
                'label_ka' => 'Purpose',
                'label_en' => 'Purpose',
                'field_type' => 'textarea',
                'is_required' => 1,
                'placeholder_ka' => null,
                'placeholder_en' => null,
                'helper_ka' => null,
                'helper_en' => null,
            ],
        ];

        $this->insertMissing('application_type_fields', $fields, 'id');
    }

    private function seedApplicationTypeFlow(): void
    {
        $flow = [
            ['type_id' => 1, 'step_index' => 0, 'role_id' => 1],
            ['type_id' => 1, 'step_index' => 1, 'role_id' => 2],
            ['type_id' => 2, 'step_index' => 0, 'role_id' => 2],
            ['type_id' => 2, 'step_index' => 1, 'role_id' => 1],
        ];

        $this->insertMissing('application_type_flow', $flow, ['type_id', 'step_index']);
    }

    private function seedApplicationTypeSla(): void
    {
        $sla = [
            ['type_id' => 1, 'step_index' => 0, 'seconds' => 172800, 'expire_action' => 'AUTO_APPROVE'],
            ['type_id' => 1, 'step_index' => 1, 'seconds' => 259200, 'expire_action' => 'BOUNCE_BACK'],
            ['type_id' => 2, 'step_index' => 0, 'seconds' => 129600, 'expire_action' => 'BOUNCE_BACK'],
            ['type_id' => 2, 'step_index' => 1, 'seconds' => 172800, 'expire_action' => 'AUTO_APPROVE'],
        ];

        $this->insertMissing('application_type_sla', $sla, ['type_id', 'step_index']);
    }

    private function seedApplications(): void
    {
        $applications = [
            [
                'id' => 1,
                'number' => 'TKT-2024-00021',
                'type_id' => 1,
                'requester_id' => 3,
                'status' => 'PENDING',
                'current_step_index' => 1,
                'created_at' => '2024-10-28 08:20:00',
                'updated_at' => '2024-11-01 10:25:27',
                'submitted_at' => '2024-10-28 08:35:00',
                'due_at' => '2024-11-04 10:25:27',
            ],
            [
                'id' => 2,
                'number' => 'TKT-2024-00022',
                'type_id' => 2,
                'requester_id' => 2,
                'status' => 'REJECTED',
                'current_step_index' => -1,
                'created_at' => '2024-09-12 10:10:00',
                'updated_at' => '2024-09-15 14:32:00',
                'submitted_at' => '2024-09-12 10:25:00',
                'due_at' => null,
            ],
        ];

        $this->insertMissing('applications', $applications, 'id');
    }

    private function seedApplicationFieldValues(): void
    {
        $values = [
            ['application_id' => 1, 'field_key' => 'reason', 'value' => 'Attending leadership training'],
            ['application_id' => 1, 'field_key' => 'start_date', 'value' => '2024-12-19'],
            ['application_id' => 1, 'field_key' => 'end_date', 'value' => '2024-12-26'],
            ['application_id' => 1, 'field_key' => 'contact_phone', 'value' => '+995 555 000 003'],
            ['application_id' => 1, 'field_key' => 'additional_comment', 'value' => 'Cover handled by marketing team'],
            ['application_id' => 2, 'field_key' => 'destination', 'value' => 'Barcelona, Spain'],
            ['application_id' => 2, 'field_key' => 'travel_dates', 'value' => '2024-10-05/2024-10-11'],
            ['application_id' => 2, 'field_key' => 'budget', 'value' => '3200'],
            ['application_id' => 2, 'field_key' => 'purpose', 'value' => 'Attend European HR summit'],
        ];

        $this->insertMissing('application_field_values', $values, ['application_id', 'field_key']);
    }

    private function seedApplicationAttachments(): void
    {
        $attachments = [
            [
                'id' => 1,
                'application_id' => 1,
                'name' => 'training-invitation.pdf',
                'url' => '#',
                'uploaded_by' => 3,
                'created_at' => '2024-10-28 08:34:00',
            ],
            [
                'id' => 2,
                'application_id' => 2,
                'name' => 'conference-agenda.pdf',
                'url' => '#',
                'uploaded_by' => 2,
                'created_at' => '2024-09-12 10:22:00',
            ],
        ];

        $this->insertMissing('application_attachments', $attachments, 'id');
    }

    private function seedApplicationAuditLog(): void
    {
        $logs = [
            [
                'id' => 1,
                'application_id' => 1,
                'actor_id' => 3,
                'action' => 'CREATE',
                'comment' => 'Created leave request for leadership training.',
                'occurred_at' => '2024-10-28 08:20:00',
            ],
            [
                'id' => 2,
                'application_id' => 1,
                'actor_id' => 3,
                'action' => 'SUBMIT',
                'comment' => 'Submitted for approval.',
                'occurred_at' => '2024-10-28 08:35:00',
            ],
            [
                'id' => 3,
                'application_id' => 1,
                'actor_id' => 1,
                'action' => 'APPROVE',
                'comment' => 'Approved on behalf of department head.',
                'occurred_at' => '2024-10-29 09:05:00',
            ],
            [
                'id' => 4,
                'application_id' => 1,
                'actor_id' => 1,
                'action' => 'RESEND',
                'comment' => 'Reassigned to HR for secondary approval.',
                'occurred_at' => '2024-10-29 09:06:00',
            ],
            [
                'id' => 5,
                'application_id' => 2,
                'actor_id' => 2,
                'action' => 'CREATE',
                'comment' => null,
                'occurred_at' => '2024-09-12 10:10:00',
            ],
            [
                'id' => 6,
                'application_id' => 2,
                'actor_id' => 2,
                'action' => 'SUBMIT',
                'comment' => 'Submitted travel request.',
                'occurred_at' => '2024-09-12 10:25:00',
            ],
            [
                'id' => 7,
                'application_id' => 2,
                'actor_id' => 2,
                'action' => 'EDIT',
                'comment' => 'Updated budget based on supplier quote.',
                'occurred_at' => '2024-09-13 09:12:00',
            ],
            [
                'id' => 8,
                'application_id' => 2,
                'actor_id' => 1,
                'action' => 'REJECT',
                'comment' => 'Rejected due to overlapping company event.',
                'occurred_at' => '2024-09-15 14:32:00',
            ],
        ];

        $this->insertMissing('application_audit_log', $logs, 'id');
    }

    private function seedTickets(): void
    {
        $tickets = [
            [
                'id' => 1,
                'title' => 'Onboarding laptop request',
                'description' => 'Need a laptop configured for the new marketing hire starting next Monday.',
                'status' => 'in_progress',
                'priority' => 'high',
                'created_by' => 2,
                'assigned_to' => 1,
                'created_at' => '2024-05-01 08:30:00',
                'updated_at' => '2024-05-02 09:15:00',
            ],
            [
                'id' => 2,
                'title' => 'Update payroll bank details',
                'description' => 'Employee User submitted new banking information that must be reflected before the next payroll run.',
                'status' => 'open',
                'priority' => 'medium',
                'created_by' => 3,
                'assigned_to' => 2,
                'created_at' => '2024-05-10 12:00:00',
                'updated_at' => '2024-05-10 12:00:00',
            ],
            [
                'id' => 3,
                'title' => 'Broken office badge',
                'description' => 'Access badge stopped working after the hardware refresh. Requesting a replacement.',
                'status' => 'resolved',
                'priority' => 'low',
                'created_by' => 3,
                'assigned_to' => 2,
                'created_at' => '2024-04-18 07:20:00',
                'updated_at' => '2024-04-19 10:45:00',
            ],
        ];

        $this->insertMissing('tickets', $tickets, 'id');
    }

    private function seedWorkCalendarDays(): void
    {
        $days = [
            [
                'work_date' => '2025-01-01',
                'is_working' => 0,
                'note' => 'New Year Holiday',
            ],
            [
                'work_date' => '2025-01-07',
                'is_working' => 0,
                'note' => 'Orthodox Christmas',
            ],
        ];

        $this->insertMissing('work_calendar_days', $days, 'work_date');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function getAll(string $table): array
    {
        return $this->getAdapter()->fetchAll(sprintf('SELECT * FROM `%s`', $table));
    }

    /**
     * @param array<int|string, mixed> $rows
     * @param array<int, string>|string $uniqueKeys
     */
    private function insertMissing(string $table, array $rows, array|string $uniqueKeys): void
    {
        $uniqueKeys = (array) $uniqueKeys;
        $pending = [];

        foreach ($rows as $row) {
            $conditions = [];
            foreach ($uniqueKeys as $key) {
                $conditions[$key] = $row[$key] ?? null;
            }

            if ($this->recordExists($table, $conditions)) {
                continue;
            }

            $pending[] = $row;
        }

        if (!empty($pending)) {
            $this->table($table)->insert($pending)->saveData();
        }
    }

    /**
     * @param array<string, mixed> $conditions
     */
    private function recordExists(string $table, array $conditions): bool
    {
        if (empty($conditions)) {
            return false;
        }

        $clauses = [];
        $params = [];

        foreach ($conditions as $column => $value) {
            if ($value === null) {
                $clauses[] = sprintf('`%s` IS NULL', $column);
            } else {
                $clauses[] = sprintf('`%s` = ?', $column);
                $params[] = $value;
            }
        }

        $sql = sprintf('SELECT COUNT(*) AS count FROM `%s` WHERE %s', $table, implode(' AND ', $clauses));
        $result = $this->getAdapter()->fetchRow($sql, $params);

        return (int) ($result['count'] ?? 0) > 0;
    }
}
