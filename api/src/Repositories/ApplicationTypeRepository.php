<?php
declare(strict_types=1);

namespace App\Repositories;

use PDO;
use Throwable;

final class ApplicationTypeRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function all(): array
    {
        $types = [];

        $typeStatement = $this->connection->query(
            'SELECT id, name_ka, name_en, description_ka, description_en, icon, color,
                    uses_vacation_calculator,
                    uses_grace_period_tracker,
                    uses_penalty_tracker,
                    uses_extra_bonus_tracker
             FROM application_types
             ORDER BY id'
        );

        foreach ($typeStatement as $row) {
            $typeId = (int) $row['id'];
            $types[$typeId] = [
                'id' => $typeId,
                'name' => [
                    'ka' => (string) $row['name_ka'],
                    'en' => (string) $row['name_en'],
                ],
                'description' => [
                    'ka' => (string) $row['description_ka'],
                    'en' => (string) $row['description_en'],
                ],
                'icon' => (string) $row['icon'],
                'color' => (string) $row['color'],
                'fields' => [],
                'flow' => [],
                'slaPerStep' => [],
                'capabilities' => [],
                'allowedRoleIds' => [],
                'capabilityOverrides' => [
                    'usesVacationCalculator' => (bool) $row['uses_vacation_calculator'],
                    'usesGracePeriodTracker' => (bool) $row['uses_grace_period_tracker'],
                    'usesPenaltyTracker' => (bool) $row['uses_penalty_tracker'],
                    'usesExtraBonusTracker' => (bool) $row['uses_extra_bonus_tracker'],
                ],
            ];
        }

        if (empty($types)) {
            return [];
        }

        $fieldStatement = $this->connection->query(
            'SELECT type_id, field_key, label_ka, label_en, field_type, is_required,
                    placeholder_ka, placeholder_en, helper_ka, helper_en
             FROM application_type_fields
             ORDER BY type_id, id'
        );

        foreach ($fieldStatement as $row) {
            $typeId = (int) $row['type_id'];
            if (!isset($types[$typeId])) {
                continue;
            }

            $placeholder = $this->normalizeMultilingualField(
                $row['placeholder_ka'] ?? null,
                $row['placeholder_en'] ?? null
            );
            $helper = $this->normalizeMultilingualField(
                $row['helper_ka'] ?? null,
                $row['helper_en'] ?? null
            );

            $types[$typeId]['fields'][] = [
                'key' => (string) $row['field_key'],
                'label' => [
                    'ka' => (string) $row['label_ka'],
                    'en' => (string) $row['label_en'],
                ],
                'type' => (string) $row['field_type'],
                'required' => (bool) $row['is_required'],
                'placeholder' => $placeholder,
                'options' => [],
                'helper' => $helper,
            ];
        }

        $flowStatement = $this->connection->query(
            'SELECT type_id, step_index, role_id
             FROM application_type_flow
             ORDER BY type_id, step_index'
        );

        foreach ($flowStatement as $row) {
            $typeId = (int) $row['type_id'];
            if (!isset($types[$typeId])) {
                continue;
            }
            $stepIdx = (int) $row['step_index'];
            $types[$typeId]['flow'][$stepIdx] = (int) $row['role_id'];
        }

        $slaStatement = $this->connection->query(
            'SELECT type_id, step_index, seconds, expire_action
             FROM application_type_sla
             ORDER BY type_id, step_index'
        );

        foreach ($slaStatement as $row) {
            $typeId = (int) $row['type_id'];
            if (!isset($types[$typeId])) {
                continue;
            }

            $types[$typeId]['slaPerStep'][] = [
                'stepIndex' => (int) $row['step_index'],
                'seconds' => (int) $row['seconds'],
                'onExpire' => (string) $row['expire_action'],
            ];
        }

        foreach ($types as $typeId => &$type) {
            ksort($type['flow']);
            $type['flow'] = array_values($type['flow']);
            $type['allowedRoleIds'] = array_values(array_unique($type['flow']));
            $overrides = $type['capabilityOverrides'] ?? [];
            $type['capabilities'] = $this->inferCapabilities($type['fields'], $typeId, $overrides);
            unset($type['capabilityOverrides']);

            foreach ($type['fields'] as &$field) {
                if ($field['placeholder'] === null) {
                    unset($field['placeholder']);
                }
                if ($field['helper'] === null) {
                    unset($field['helper']);
                }
            }
            unset($field);
        }
        unset($type);

        return array_values($types);
    }

    /**
     * @param array<int, array<string, mixed>> $types
     */
    public function sync(array $types): array
    {
        $this->connection->beginTransaction();

        try {
            $this->connection->exec('DELETE FROM application_type_sla');
            $this->connection->exec('DELETE FROM application_type_flow');
            $this->connection->exec('DELETE FROM application_type_fields');

            if ($types === []) {
                $this->connection->exec('DELETE FROM application_types');
                $this->connection->commit();
                return [];
            }

            $incomingIds = [];
            foreach ($types as $type) {
                if (!isset($type['id'])) {
                    continue;
                }
                $incomingIds[] = (int) $type['id'];
            }
            $incomingIds = array_values(array_unique($incomingIds));

            if ($incomingIds === []) {
                $this->connection->exec('DELETE FROM application_types');
            } else {
                $placeholders = implode(',', array_fill(0, count($incomingIds), '?'));
                $deleteTypes = $this->connection->prepare(
                    sprintf('DELETE FROM application_types WHERE id NOT IN (%s)', $placeholders)
                );
                $deleteTypes->execute($incomingIds);
            }

            $upsertType = $this->connection->prepare(
                'INSERT INTO application_types (
                    id,
                    name_ka,
                    name_en,
                    description_ka,
                    description_en,
                    icon,
                    color,
                    uses_vacation_calculator,
                    uses_grace_period_tracker,
                    uses_penalty_tracker,
                    uses_extra_bonus_tracker
                 )
                 VALUES (
                    :id,
                    :name_ka,
                    :name_en,
                    :description_ka,
                    :description_en,
                    :icon,
                    :color,
                    :uses_vacation_calculator,
                    :uses_grace_period_tracker,
                    :uses_penalty_tracker,
                    :uses_extra_bonus_tracker
                 )
                 ON DUPLICATE KEY UPDATE
                    name_ka = VALUES(name_ka),
                    name_en = VALUES(name_en),
                    description_ka = VALUES(description_ka),
                    description_en = VALUES(description_en),
                    icon = VALUES(icon),
                    color = VALUES(color),
                    uses_vacation_calculator = VALUES(uses_vacation_calculator),
                    uses_grace_period_tracker = VALUES(uses_grace_period_tracker),
                    uses_penalty_tracker = VALUES(uses_penalty_tracker),
                    uses_extra_bonus_tracker = VALUES(uses_extra_bonus_tracker)'
            );

            $insertField = $this->connection->prepare(
                'INSERT INTO application_type_fields (
                    type_id,
                    field_key,
                    label_ka,
                    label_en,
                    field_type,
                    is_required,
                    placeholder_ka,
                    placeholder_en,
                    helper_ka,
                    helper_en
                ) VALUES (
                    :type_id,
                    :field_key,
                    :label_ka,
                    :label_en,
                    :field_type,
                    :is_required,
                    :placeholder_ka,
                    :placeholder_en,
                    :helper_ka,
                    :helper_en
                )'
            );

            $insertFlow = $this->connection->prepare(
                'INSERT INTO application_type_flow (type_id, step_index, role_id)
                 VALUES (:type_id, :step_index, :role_id)'
            );

            $insertSla = $this->connection->prepare(
                'INSERT INTO application_type_sla (type_id, step_index, seconds, expire_action)
                 VALUES (:type_id, :step_index, :seconds, :expire_action)'
            );

            foreach ($types as $type) {
                $typeId = (int) ($type['id'] ?? 0);
                $name = $type['name'] ?? ['ka' => '', 'en' => ''];
                $description = $type['description'] ?? ['ka' => '', 'en' => ''];

                $capabilities = $type['capabilities'] ?? [];

                $upsertType->execute([
                    ':id' => $typeId,
                    ':name_ka' => (string) ($name['ka'] ?? ''),
                    ':name_en' => (string) ($name['en'] ?? ''),
                    ':description_ka' => (string) ($description['ka'] ?? ''),
                    ':description_en' => (string) ($description['en'] ?? ''),
                    ':icon' => (string) ($type['icon'] ?? ''),
                    ':color' => (string) ($type['color'] ?? ''),
                    ':uses_vacation_calculator' => !empty($capabilities['usesVacationCalculator']) ? 1 : 0,
                    ':uses_grace_period_tracker' => !empty($capabilities['usesGracePeriodTracker']) ? 1 : 0,
                    ':uses_penalty_tracker' => !empty($capabilities['usesPenaltyTracker']) ? 1 : 0,
                    ':uses_extra_bonus_tracker' => !empty($capabilities['usesExtraBonusTracker']) ? 1 : 0,
                ]);

                $fields = $type['fields'] ?? [];
                if (is_array($fields)) {
                    foreach ($fields as $field) {
                        $label = $field['label'] ?? ['ka' => '', 'en' => ''];
                        $placeholder = $field['placeholder'] ?? null;
                        $helper = $field['helper'] ?? null;

                        $insertField->execute([
                            ':type_id' => $typeId,
                            ':field_key' => (string) ($field['key'] ?? ''),
                            ':label_ka' => (string) ($label['ka'] ?? ''),
                            ':label_en' => (string) ($label['en'] ?? ''),
                            ':field_type' => (string) ($field['type'] ?? 'text'),
                            ':is_required' => (int) ($field['required'] ?? false),
                            ':placeholder_ka' => is_array($placeholder) ? ($placeholder['ka'] ?? null) : null,
                            ':placeholder_en' => is_array($placeholder) ? ($placeholder['en'] ?? null) : null,
                            ':helper_ka' => is_array($helper) ? ($helper['ka'] ?? null) : null,
                            ':helper_en' => is_array($helper) ? ($helper['en'] ?? null) : null,
                        ]);
                    }
                }

                $flow = $type['flow'] ?? [];
                if (is_array($flow)) {
                    foreach (array_values($flow) as $index => $roleId) {
                        $insertFlow->execute([
                            ':type_id' => $typeId,
                            ':step_index' => $index,
                            ':role_id' => (int) $roleId,
                        ]);
                    }
                }

                $slaPerStep = $type['slaPerStep'] ?? [];
                if (is_array($slaPerStep)) {
                    foreach ($slaPerStep as $sla) {
                        $insertSla->execute([
                            ':type_id' => $typeId,
                            ':step_index' => (int) ($sla['stepIndex'] ?? 0),
                            ':seconds' => (int) ($sla['seconds'] ?? 0),
                            ':expire_action' => (string) ($sla['onExpire'] ?? 'AUTO_APPROVE'),
                        ]);
                    }
                }
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->all();
    }

    private function normalizeMultilingualField(?string $ka, ?string $en): ?array
    {
        $data = array_filter([
            'ka' => $ka,
            'en' => $en,
        ], static fn ($value) => $value !== null && $value !== '');

        return empty($data) ? null : $data;
    }

    private function inferCapabilities(array $fields, int $typeId, array $overrides = []): array
    {
        $hasStartDate = false;
        $hasEndDate = false;
        $dateRangeRequired = false;
        $hasDateRangeField = false;

        $hasStartTime = false;
        $hasEndTime = false;
        $timeRangeRequired = false;

        $hasCommentField = false;
        $commentRequired = false;

        foreach ($fields as $field) {
            $key = (string) $field['key'];
            $type = (string) $field['type'];
            $required = (bool) $field['required'];

            if ($key === 'start_date') {
                $hasStartDate = true;
                if ($required) {
                    $dateRangeRequired = true;
                }
            }

            if ($key === 'end_date') {
                $hasEndDate = true;
                if ($required) {
                    $dateRangeRequired = true;
                }
            }

            if ($type === 'date_range') {
                $hasDateRangeField = true;
                if ($required) {
                    $dateRangeRequired = true;
                }
            }

            if ($key === 'start_time') {
                $hasStartTime = true;
                if ($required) {
                    $timeRangeRequired = true;
                }
            }

            if ($key === 'end_time') {
                $hasEndTime = true;
                if ($required) {
                    $timeRangeRequired = true;
                }
            }

            if ($type === 'time_range') {
                $hasStartTime = true;
                $hasEndTime = true;
                if ($required) {
                    $timeRangeRequired = true;
                }
            }

            if ($key === 'additional_comment' || str_contains($key, 'comment')) {
                $hasCommentField = true;
                if ($required) {
                    $commentRequired = true;
                }
            }
        }

        $requiresDateRange = $hasDateRangeField || ($hasStartDate && $hasEndDate);
        $requiresTimeRange = $hasStartTime && $hasEndTime;

        return [
            'requiresDateRange' => $requiresDateRange,
            'dateRangeRequired' => $requiresDateRange ? $dateRangeRequired : false,
            'requiresTimeRange' => $requiresTimeRange,
            'timeRangeRequired' => $requiresTimeRange ? $timeRangeRequired : false,
            'hasCommentField' => $hasCommentField,
            'commentRequired' => $hasCommentField ? $commentRequired : false,
            'allowsAttachments' => true,
            'attachmentsRequired' => $typeId === 2,
            'attachmentMaxSizeMb' => 50,
            'usesVacationCalculator' => (bool) ($overrides['usesVacationCalculator'] ?? false),
            'usesGracePeriodTracker' => (bool) ($overrides['usesGracePeriodTracker'] ?? false),
            'usesPenaltyTracker' => (bool) ($overrides['usesPenaltyTracker'] ?? false),
            'usesExtraBonusTracker' => (bool) ($overrides['usesExtraBonusTracker'] ?? false),
        ];
    }
}
