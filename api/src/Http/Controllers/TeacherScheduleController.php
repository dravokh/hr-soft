<?php
declare(strict_types=1);

namespace App\Http\Controllers;

use App\Config\AppConfig;
use App\Database\Database;
use App\Http\Exceptions\HttpException;
use App\Repositories\TeacherScheduleAssignmentRepository;
use App\Repositories\TeacherScheduleCompensationAdjustmentRepository;
use App\Repositories\TeacherScheduleBonusRateRepository;
use App\Services\TeacherScheduleAnalyzer;
use App\Support\Request;
use Throwable;

final class TeacherScheduleController
{
    private TeacherScheduleAnalyzer $analyzer;

    public function __construct(private readonly AppConfig $config, ?TeacherScheduleAnalyzer $analyzer = null)
    {
        $this->analyzer = $analyzer ?? new TeacherScheduleAnalyzer();
    }

    public function analyze(): array
    {
        $file = $_FILES['file'] ?? null;
        if (!is_array($file)) {
            throw HttpException::badRequest('Upload payload must include a file.');
        }

        $tmpName = $file['tmp_name'] ?? null;
        $error = isset($file['error']) ? (int) $file['error'] : UPLOAD_ERR_OK;

        if ($error !== UPLOAD_ERR_OK) {
            throw HttpException::badRequest($this->describeUploadError($error));
        }

        if (!is_string($tmpName) || $tmpName === '') {
            throw HttpException::badRequest('Uploaded file is not valid.');
        }

        $isReadable = is_uploaded_file($tmpName) || is_file($tmpName);
        if (!$isReadable) {
            throw HttpException::badRequest('Uploaded file is not accessible.');
        }

        $originalName = $file['name'] ?? 'upload';
        if (is_array($originalName)) {
            throw HttpException::badRequest('Only single file uploads are supported.');
        }

        $extension = strtolower(pathinfo((string) $originalName, PATHINFO_EXTENSION));
        if (!in_array($extension, ['pdf', 'xlsx'], true)) {
            throw HttpException::badRequest('Only PDF or XLSX files are supported.');
        }

        try {
            $teachers = $this->analyzer->analyze($tmpName, $extension);
            $repository = $this->assignmentsRepository();
            $assignments = $repository->findByTeacherNames(array_column($teachers, 'teacher'));
        } catch (HttpException $exception) {
            throw $exception;
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to analyze teacher schedule.');
        }

        $enriched = array_map(function (array $teacher) use ($assignments): array {
            $normalized = TeacherScheduleAssignmentRepository::normalizeName($teacher['teacher'] ?? '');
            $assignment = $assignments[$normalized] ?? null;

            if ($assignment !== null) {
                $teacher['assignment'] = [
                    'teacher' => (string) ($assignment['teacher_name'] ?? ''),
                    'userId' => isset($assignment['user_id']) ? (int) $assignment['user_id'] : null,
                    'cambridgeCount' => isset($assignment['cambridge_count']) ? (int) $assignment['cambridge_count'] : 0,
                    'georgianCount' => isset($assignment['georgian_count']) ? (int) $assignment['georgian_count'] : 0,
                ];
            } else {
                $teacher['assignment'] = null;
            }

            return $teacher;
        }, $teachers);

        return ['teachers' => $enriched];
    }

    public function assign(): array
    {
        $payload = Request::json();
        $teacher = trim((string) ($payload['teacher'] ?? ''));
        $userId = isset($payload['userId']) ? (int) $payload['userId'] : 0;
        $cambridgeCount = isset($payload['cambridgeCount']) ? max(0, (int) $payload['cambridgeCount']) : 0;
        $georgianCount = isset($payload['georgianCount']) ? max(0, (int) $payload['georgianCount']) : 0;

        if ($teacher === '') {
            throw HttpException::badRequest('Teacher name is required.');
        }

        if ($userId <= 0) {
            throw HttpException::badRequest('A valid userId is required.');
        }

        try {
            $repository = $this->assignmentsRepository();
            $saved = $repository->save($teacher, $userId, $cambridgeCount, $georgianCount);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to save teacher assignment.');
        }

        return [
            'assignment' => [
                'teacher' => (string) ($saved['teacher_name'] ?? $teacher),
                'userId' => isset($saved['user_id']) ? (int) $saved['user_id'] : $userId,
                'cambridgeCount' => isset($saved['cambridge_count']) ? (int) $saved['cambridge_count'] : $cambridgeCount,
                'georgianCount' => isset($saved['georgian_count']) ? (int) $saved['georgian_count'] : $georgianCount,
            ],
        ];
    }

    public function assignments(): array
    {
        $userIdParam = $_GET['userId'] ?? null;

        try {
            $repository = $this->assignmentsRepository();
            if ($userIdParam !== null && $userIdParam !== '') {
                $userId = (int) $userIdParam;
                if ($userId <= 0) {
                    throw HttpException::badRequest('Invalid userId provided.');
                }
                $records = $repository->findByUserId($userId);
            } else {
                $records = $repository->all();
            }
        } catch (HttpException $exception) {
            throw $exception;
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to load teacher assignments.');
        }

        return [
            'assignments' => array_map(
                static fn (array $row): array => [
                    'teacher' => (string) ($row['teacher_name'] ?? ''),
                    'userId' => isset($row['user_id']) ? (int) $row['user_id'] : null,
                    'cambridgeCount' => isset($row['cambridge_count']) ? (int) $row['cambridge_count'] : 0,
                    'georgianCount' => isset($row['georgian_count']) ? (int) $row['georgian_count'] : 0,
                ],
                $records
            ),
        ];
    }

    private function assignmentsRepository(): TeacherScheduleAssignmentRepository
    {
        $connection = Database::connection($this->config);

        return new TeacherScheduleAssignmentRepository($connection);
    }

    public function bonusRates(): array
    {
        try {
            $repository = $this->bonusRateRepository();
            $rates = $repository->all();
            $adjustmentsRepository = $this->adjustmentsRepository();
            $adjustments = $adjustmentsRepository->all();
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to load bonus rates.');
        }

        return [
            'rates' => [
                'cambridge' => (float) ($rates['cambridge'] ?? 0),
                'georgian' => (float) ($rates['georgian'] ?? 0),
                'cover' => (float) ($rates['cover'] ?? 0),
                'taxRate' => (float) ($rates['tax'] ?? 0),
                'adjustments' => $adjustments,
            ],
        ];
    }

    public function saveBonusRates(): array
    {
        $payload = Request::json();
        $cambridge = isset($payload['cambridge']) ? (float) $payload['cambridge'] : 0;
        $georgian = isset($payload['georgian']) ? (float) $payload['georgian'] : 0;
        $cover = isset($payload['cover']) ? (float) $payload['cover'] : 0;
        $taxRate = isset($payload['taxRate']) ? (float) $payload['taxRate'] : 0;
        $rawAdjustments = $payload['adjustments'] ?? [];

        if ($cambridge < 0 || $georgian < 0 || $cover < 0) {
            throw HttpException::badRequest('Bonus rates cannot be negative.');
        }
        if ($taxRate < 0 || $taxRate > 100) {
            throw HttpException::badRequest('Tax rate must be between 0 and 100.');
        }

        $adjustments = [];
        if (!is_array($rawAdjustments)) {
            throw HttpException::badRequest('Adjustments payload must be an array.');
        }

        foreach ($rawAdjustments as $adjustment) {
            if (!is_array($adjustment)) {
                continue;
            }
            $label = trim((string) ($adjustment['label'] ?? ''));
            if ($label === '') {
                continue;
            }
            $mode = $adjustment['mode'] === 'fixed' ? 'fixed' : 'percent';
            $value = isset($adjustment['value']) ? (float) $adjustment['value'] : 0;
            $adjustments[] = [
                'label' => $label,
                'mode' => $mode,
                'value' => $value,
            ];
        }

        $savedAdjustments = [];
        try {
            $repository = $this->bonusRateRepository();
            $repository->saveMany([
                'cambridge' => $cambridge,
                'georgian' => $georgian,
                'cover' => $cover,
                'tax' => $taxRate,
            ]);
            $adjustmentsRepository = $this->adjustmentsRepository();
            $savedAdjustments = $adjustmentsRepository->replaceAll($adjustments);
        } catch (Throwable $throwable) {
            throw HttpException::internal('Failed to save bonus rates.');
        }

        return [
            'rates' => [
                'cambridge' => $cambridge,
                'georgian' => $georgian,
                'cover' => $cover,
                'taxRate' => $taxRate,
                'adjustments' => $savedAdjustments,
            ],
        ];
    }

    private function bonusRateRepository(): TeacherScheduleBonusRateRepository
    {
        $connection = Database::connection($this->config);

        return new TeacherScheduleBonusRateRepository($connection);
    }

    private function adjustmentsRepository(): TeacherScheduleCompensationAdjustmentRepository
    {
        $connection = Database::connection($this->config);

        return new TeacherScheduleCompensationAdjustmentRepository($connection);
    }

    private function describeUploadError(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE,
            UPLOAD_ERR_FORM_SIZE => 'Uploaded file is too large.',
            UPLOAD_ERR_PARTIAL => 'Uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on the server.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write the uploaded file to disk.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload.',
            default => 'Unexpected upload error.'
        };
    }
}
