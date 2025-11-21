<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Support\Date;
use PDO;
use Throwable;

final class ApplicationRepository
{
    public function __construct(private readonly PDO $connection)
    {
    }

    public function all(): array
    {
        $applications = [];

        $statement = $this->connection->query(
            'SELECT id, number, type_id, requester_id, status, current_step_index,
                    created_at, updated_at, submitted_at, due_at
             FROM applications
             ORDER BY id'
        );

        foreach ($statement as $row) {
            $appId = (int) $row['id'];

            $applications[$appId] = [
                'application' => [
                    'id' => $appId,
                    'number' => (string) $row['number'],
                    'typeId' => (int) $row['type_id'],
                    'requesterId' => (int) $row['requester_id'],
                    'status' => (string) $row['status'],
                    'currentStepIndex' => (int) $row['current_step_index'],
                    'createdAt' => Date::toIsoString($row['created_at']),
                    'updatedAt' => Date::toIsoString($row['updated_at']),
                    'submittedAt' => Date::toIsoString($row['submitted_at']),
                    'dueAt' => Date::toIsoString($row['due_at']),
                ],
                'values' => [],
                'attachments' => [],
                'auditTrail' => [],
                'delegates' => [],
                'extraBonus' => null,
            ];
        }

        if (empty($applications)) {
            return [];
        }

        $values = $this->connection->query(
            'SELECT application_id, field_key, value
             FROM application_field_values
             ORDER BY application_id, field_key'
        );

        foreach ($values as $row) {
            $appId = (int) $row['application_id'];
            if (!isset($applications[$appId])) {
                continue;
            }

            $applications[$appId]['values'][] = [
                'applicationId' => $appId,
                'key' => (string) $row['field_key'],
                'value' => (string) $row['value'],
            ];
        }

        $attachments = $this->connection->query(
            'SELECT id, application_id, name, url, uploaded_by, created_at
             FROM application_attachments
             ORDER BY application_id, id'
        );

        foreach ($attachments as $row) {
            $appId = (int) $row['application_id'];
            if (!isset($applications[$appId])) {
                continue;
            }

            $applications[$appId]['attachments'][] = [
                'id' => (int) $row['id'],
                'applicationId' => $appId,
                'name' => (string) $row['name'],
                'url' => (string) $row['url'],
                'uploadedBy' => (int) $row['uploaded_by'],
                'createdAt' => Date::toIsoString($row['created_at']),
            ];
        }

        $audit = $this->connection->query(
            'SELECT id, application_id, actor_id, action, comment, occurred_at
             FROM application_audit_log
             ORDER BY application_id, occurred_at, id'
        );

        foreach ($audit as $row) {
            $appId = (int) $row['application_id'];
            if (!isset($applications[$appId])) {
                continue;
            }

            $applications[$appId]['auditTrail'][] = [
                'id' => (int) $row['id'],
                'applicationId' => $appId,
                'actorId' => $row['actor_id'] !== null ? (int) $row['actor_id'] : null,
                'action' => (string) $row['action'],
                'comment' => $row['comment'] !== null ? (string) $row['comment'] : null,
                'at' => Date::toIsoString($row['occurred_at']),
            ];
        }

        $delegates = $this->connection->query(
            'SELECT id, application_id, for_role_id, delegate_user_id
             FROM application_delegates
             ORDER BY application_id, id'
        );

        foreach ($delegates as $row) {
            $appId = (int) $row['application_id'];
            if (!isset($applications[$appId])) {
                continue;
            }

            $applications[$appId]['delegates'][] = [
                'id' => (int) $row['id'],
                'applicationId' => $appId,
                'forRoleId' => (int) $row['for_role_id'],
                'delegateUserId' => (int) $row['delegate_user_id'],
            ];
        }

        $bonusStatement = $this->connection->query(
            'SELECT application_id, user_id, work_date, time_minutes, hourly_rate, bonus_percent, bonus_amount, created_at
             FROM application_extra_bonuses'
        );

        foreach ($bonusStatement as $row) {
            $appId = (int) $row['application_id'];
            if (!isset($applications[$appId])) {
                continue;
            }

            $applications[$appId]['extraBonus'] = [
                'applicationId' => $appId,
                'userId' => (int) $row['user_id'],
                'workDate' => (string) $row['work_date'],
                'minutes' => (int) $row['time_minutes'],
                'hourlyRate' => (float) $row['hourly_rate'],
                'bonusPercent' => (float) $row['bonus_percent'],
                'totalAmount' => (float) $row['bonus_amount'],
                'createdAt' => Date::toIsoString($row['created_at']),
            ];
        }

        return array_values($applications);
    }

    /**
     * @param array<int, array<string, mixed>> $bundles
     */
    public function sync(array $bundles): array
    {
        $this->connection->beginTransaction();

        try {
            $this->connection->exec('DELETE FROM application_delegates');
            $this->connection->exec('DELETE FROM application_audit_log');
            $this->connection->exec('DELETE FROM application_attachments');
            $this->connection->exec('DELETE FROM application_extra_bonuses');
            $this->connection->exec('DELETE FROM application_field_values');

            if ($bundles === []) {
                $this->connection->exec('DELETE FROM applications');
                $this->connection->commit();
                return [];
            }

            $incomingIds = [];
            foreach ($bundles as $bundle) {
                $application = $bundle['application'] ?? null;
                if (!is_array($application) || !isset($application['id'])) {
                    continue;
                }
                $incomingIds[] = (int) $application['id'];
            }
            $incomingIds = array_values(array_unique($incomingIds));

            if ($incomingIds === []) {
                $this->connection->exec('DELETE FROM applications');
            } else {
                $placeholders = implode(',', array_fill(0, count($incomingIds), '?'));
                $deleteApplications = $this->connection->prepare(
                    sprintf('DELETE FROM applications WHERE id NOT IN (%s)', $placeholders)
                );
                $deleteApplications->execute($incomingIds);
            }

            $upsertApplication = $this->connection->prepare(
                'INSERT INTO applications (
                    id,
                    number,
                    type_id,
                    requester_id,
                    status,
                    current_step_index,
                    created_at,
                    updated_at,
                    submitted_at,
                    due_at
                ) VALUES (
                    :id,
                    :number,
                    :type_id,
                    :requester_id,
                    :status,
                    :current_step_index,
                    :created_at,
                    :updated_at,
                    :submitted_at,
                    :due_at
                )
                ON DUPLICATE KEY UPDATE
                    number = VALUES(number),
                    type_id = VALUES(type_id),
                    requester_id = VALUES(requester_id),
                    status = VALUES(status),
                    current_step_index = VALUES(current_step_index),
                    created_at = VALUES(created_at),
                    updated_at = VALUES(updated_at),
                    submitted_at = VALUES(submitted_at),
                    due_at = VALUES(due_at)'
            );

            $insertValue = $this->connection->prepare(
                'INSERT INTO application_field_values (application_id, field_key, value)
                 VALUES (:application_id, :field_key, :value)'
            );

            $insertAttachment = $this->connection->prepare(
                'INSERT INTO application_attachments (
                    id,
                    application_id,
                    name,
                    url,
                    uploaded_by,
                    created_at
                ) VALUES (
                    :id,
                    :application_id,
                    :name,
                    :url,
                    :uploaded_by,
                    :created_at
                )'
            );

            $insertAudit = $this->connection->prepare(
                'INSERT INTO application_audit_log (
                    id,
                    application_id,
                    actor_id,
                    action,
                    comment,
                    occurred_at
                ) VALUES (
                    :id,
                    :application_id,
                    :actor_id,
                    :action,
                    :comment,
                    :occurred_at
                )'
            );

            $insertDelegate = $this->connection->prepare(
                'INSERT INTO application_delegates (
                    id,
                    application_id,
                    for_role_id,
                    delegate_user_id
                ) VALUES (
                    :id,
                    :application_id,
                    :for_role_id,
                    :delegate_user_id
                )'
            );

            $insertBonus = $this->connection->prepare(
                'INSERT INTO application_extra_bonuses (
                    application_id,
                    user_id,
                    work_date,
                    time_minutes,
                    hourly_rate,
                    bonus_percent,
                    bonus_amount,
                    created_at
                ) VALUES (
                    :application_id,
                    :user_id,
                    :work_date,
                    :time_minutes,
                    :hourly_rate,
                    :bonus_percent,
                    :bonus_amount,
                    :created_at
                )'
            );

            foreach ($bundles as $bundle) {
                $application = $bundle['application'] ?? null;
                if (!is_array($application)) {
                    continue;
                }

                $applicationId = (int) ($application['id'] ?? 0);

                $upsertApplication->execute([
                    ':id' => $applicationId,
                    ':number' => (string) ($application['number'] ?? ''),
                    ':type_id' => (int) ($application['typeId'] ?? 0),
                    ':requester_id' => (int) ($application['requesterId'] ?? 0),
                    ':status' => (string) ($application['status'] ?? 'DRAFT'),
                    ':current_step_index' => (int) ($application['currentStepIndex'] ?? 0),
                    ':created_at' => Date::fromIsoString($application['createdAt'] ?? null),
                    ':updated_at' => Date::fromIsoString($application['updatedAt'] ?? null),
                    ':submitted_at' => Date::fromIsoString($application['submittedAt'] ?? null),
                    ':due_at' => Date::fromIsoString($application['dueAt'] ?? null),
                ]);

                $values = $bundle['values'] ?? [];
                if (is_array($values)) {
                    foreach ($values as $value) {
                        $insertValue->execute([
                            ':application_id' => $applicationId,
                            ':field_key' => (string) ($value['key'] ?? ''),
                            ':value' => (string) ($value['value'] ?? ''),
                        ]);
                    }
                }

                $attachments = $bundle['attachments'] ?? [];
                if (is_array($attachments)) {
                    foreach ($attachments as $attachment) {
                        $insertAttachment->execute([
                            ':id' => (int) ($attachment['id'] ?? 0),
                            ':application_id' => $applicationId,
                            ':name' => (string) ($attachment['name'] ?? ''),
                            ':url' => (string) ($attachment['url'] ?? ''),
                            ':uploaded_by' => (int) ($attachment['uploadedBy'] ?? 0),
                            ':created_at' => Date::fromIsoString($attachment['createdAt'] ?? null),
                        ]);
                    }
                }

                $auditTrail = $bundle['auditTrail'] ?? [];
                if (is_array($auditTrail)) {
                    foreach ($auditTrail as $entry) {
                        $insertAudit->execute([
                            ':id' => (int) ($entry['id'] ?? 0),
                            ':application_id' => $applicationId,
                            ':actor_id' => isset($entry['actorId']) ? (int) $entry['actorId'] : null,
                            ':action' => (string) ($entry['action'] ?? ''),
                            ':comment' => $entry['comment'] ?? null,
                            ':occurred_at' => Date::fromIsoString($entry['at'] ?? null),
                        ]);
                    }
                }

                $delegates = $bundle['delegates'] ?? [];
                if (is_array($delegates)) {
                    foreach ($delegates as $delegate) {
                        $insertDelegate->execute([
                            ':id' => (int) ($delegate['id'] ?? 0),
                            ':application_id' => $applicationId,
                            ':for_role_id' => (int) ($delegate['forRoleId'] ?? 0),
                            ':delegate_user_id' => (int) ($delegate['delegateUserId'] ?? 0),
                        ]);
                    }
                }

                $extraBonus = $bundle['extraBonus'] ?? null;
                if (is_array($extraBonus)) {
                    $insertBonus->execute([
                        ':application_id' => $applicationId,
                        ':user_id' => (int) ($extraBonus['userId'] ?? 0),
                        ':work_date' => (string) ($extraBonus['workDate'] ?? ''),
                        ':time_minutes' => (int) ($extraBonus['minutes'] ?? 0),
                        ':hourly_rate' => (float) ($extraBonus['hourlyRate'] ?? 0),
                        ':bonus_percent' => (float) ($extraBonus['bonusPercent'] ?? 0),
                        ':bonus_amount' => (float) ($extraBonus['totalAmount'] ?? 0),
                        ':created_at' => Date::fromIsoString($extraBonus['createdAt'] ?? null),
                    ]);
                }
            }

            $this->connection->commit();
        } catch (Throwable $exception) {
            $this->connection->rollBack();
            throw $exception;
        }

        return $this->all();
    }
}
