<?php
declare(strict_types=1);

namespace App\Services;

use App\Http\Exceptions\HttpException;
use Shuchkin\SimpleXLSX;
use Smalot\PdfParser\Parser;
use Throwable;

final class TeacherScheduleAnalyzer
{
    private const CAMBRIDGE_PATTERN = '/\b\d+C-A\b/ui';
    private const GEORGIAN_PATTERN = '/\b\d+-A\b/ui';
    private const SCHOOL_NAME_PATTERN = '/\s*GÜRC[İI]STAN\s*\/\s*T[İI]FL[İI]S\s+MAAR[İI]F\s+OKULLARI/iu';
    private const FORBIDDEN_NAME_KEYWORDS = [
        'lesson',
        'department',
        'teacher',
        'science',
        'digital',
        'mathematics',
        'math',
        'sport',
        'extra',
        'class',
        'plan',
        'schedule',
        'created',
        'library',
        'corridor',
        'geo',
        'lan',
        'lit',
        'biology',
        'lab',
        'laboratory',
        'club',
        'time',
        'yos',
        'sat',
        'guidance',
        'activity'
    ];

    /**
     * @return array<int, array{teacher: string, cambridgeCount: int, georgianCount: int}>
     */
    public function analyze(string $filePath, string $extension): array
    {
        $extension = strtolower($extension);

        return match ($extension) {
            'pdf' => $this->analyzePdf($filePath),
            'xlsx' => $this->analyzeSpreadsheet($filePath),
            default => throw HttpException::badRequest('Only PDF or XLSX files can be analyzed.')
        };
    }

    /**
     * @return array<int, array{teacher: string, cambridgeCount: int, georgianCount: int}>
     */
    private function analyzePdf(string $filePath): array
    {
        $parser = new Parser();

        try {
            $document = $parser->parseFile($filePath);
        } catch (Throwable $exception) {
            throw HttpException::badRequest('Unable to read PDF file.');
        }

        $results = [];

        foreach ($document->getPages() as $index => $page) {
            $text = trim($page->getText() ?? '');
            if ($text === '') {
                continue;
            }

            $results[] = $this->buildTeacherPayload($text, sprintf('Page %d', $index + 1));
        }

        return $results;
    }

    /**
     * @return array<int, array{teacher: string, cambridgeCount: int, georgianCount: int}>
     */
    private function analyzeSpreadsheet(string $filePath): array
    {
        $xlsx = SimpleXLSX::parse($filePath);
        if ($xlsx === false) {
            $error = SimpleXLSX::parseError();
            $message = $error !== null && $error !== '' ? $error : 'Unable to read XLSX file.';
            throw HttpException::badRequest($message);
        }

        $results = [];
        $sheetNames = $xlsx->sheetNames();
        if ($sheetNames === []) {
            $sheetNames = [0 => 'Sheet 1'];
        }

        foreach ($sheetNames as $sheetIndex => $sheetName) {
            $lines = [];

            foreach ($xlsx->rows($sheetIndex) as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $line = $this->compileRowText($row);
                if ($line !== '') {
                    $lines[] = $line;
                }
            }

            if ($lines === []) {
                continue;
            }

            $results[] = $this->buildTeacherPayload(
                implode(PHP_EOL, $lines),
                $sheetName !== '' ? $sheetName : null
            );
        }

        return $results;
    }

    /** @param array<int|string, bool|float|int|string|null> $row */
    private function compileRowText(array $row): string
    {
        $cells = [];

        foreach ($row as $cell) {
            if ($cell === null) {
                continue;
            }

            $value = trim((string) $cell);
            if ($value === '') {
                continue;
            }

            $cells[] = $value;
        }

        return trim(implode(' ', $cells));
    }

    /**
     * @return array{teacher: string, cambridgeCount: int, georgianCount: int}
     */
    private function buildTeacherPayload(string $text, ?string $fallbackName = null): array
    {
        $lines = $this->splitLines($text);
        $teacher = $this->extractTeacherName($lines, $fallbackName);

        [$cambridge, $georgian] = $this->countLessonCodes($text);

        return [
            'teacher' => $teacher,
            'cambridgeCount' => $cambridge,
            'georgianCount' => $georgian,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function splitLines(string $text): array
    {
        $rawLines = preg_split('/\R/u', $text) ?: [];
        $normalized = [];

        foreach ($rawLines as $line) {
            $cleanLine = trim((string) preg_replace('/\s+/u', ' ', $line));
            if ($cleanLine !== '') {
                $normalized[] = $cleanLine;
            }
        }

        return $normalized;
    }

    /**
     * @param array<int, string> $lines
     */
    private function extractTeacherName(array $lines, ?string $fallbackName): string
    {
        $headerCandidate = $this->extractTeacherNameFromHeader($lines);
        if ($headerCandidate !== '') {
            return $headerCandidate;
        }

        $uppercaseCandidate = $this->extractTeacherNameFromUppercaseLine($lines);
        if ($uppercaseCandidate !== '') {
            return $uppercaseCandidate;
        }

        foreach ($lines as $line) {
            $candidate = $this->sanitizeTeacherLine($line);
            if ($candidate !== '') {
                return $candidate;
            }
        }

        return $fallbackName !== null && $fallbackName !== '' ? $fallbackName : 'Unknown';
    }

    /**
     * @param array<int, string> $lines
     */
    private function extractTeacherNameFromUppercaseLine(array $lines): string
    {
        foreach ($lines as $line) {
            $candidate = $this->sanitizeTeacherLine($line);
            if ($candidate === '') {
                continue;
            }

            $lettersOnly = preg_replace('/[^\\p{L}\\s\'\\.-]/u', '', $candidate) ?? '';
            if ($lettersOnly === '') {
                continue;
            }

            $hasSpace = str_contains($lettersOnly, ' ');
            if (!$hasSpace) {
                continue;
            }

            if ($candidate === mb_strtoupper($candidate, 'UTF-8')) {
                return $candidate;
            }
        }

        return '';
    }

    /**
     * Attempt to locate the teacher's name immediately above the school title banner.
     *
     * @param array<int, string> $lines
     */
    private function extractTeacherNameFromHeader(array $lines): string
    {
        foreach ($lines as $index => $line) {
            if ($line === '') {
                continue;
            }

            if ($this->containsSchoolBanner($line)) {
                for ($i = $index - 1; $i >= 0; $i--) {
                    $candidate = $this->sanitizeTeacherLine($lines[$i]);
                    if ($candidate !== '') {
                        return $candidate;
                    }
                }

                $maxLookahead = min(count($lines) - 1, $index + 3);
                for ($i = $index + 1; $i <= $maxLookahead; $i++) {
                    $candidate = $this->sanitizeTeacherLine($lines[$i]);
                    if ($candidate !== '') {
                        return $candidate;
                    }
                }

                break;
            }
        }

        return '';
    }

    private function sanitizeTeacherLine(string $line): string
    {
        $normalized = trim((string) preg_replace('/\s+/u', ' ', $line));
        if ($normalized === '') {
            return '';
        }

        $withoutSchool = trim((string) preg_replace(self::SCHOOL_NAME_PATTERN, '', $normalized));
        if ($withoutSchool === '') {
            return '';
        }

        if (preg_match('/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i', $withoutSchool)) {
            return '';
        }

        if (mb_strpos($withoutSchool, ' ') === false) {
            return '';
        }

        if (preg_match('/[:\d]/u', $withoutSchool)) {
            return '';
        }

        $lower = mb_strtolower($withoutSchool);
        if (str_contains($lower, 'ders planı') || str_contains($lower, 'asc k12')) {
            return '';
        }

        foreach (self::FORBIDDEN_NAME_KEYWORDS as $keyword) {
            if (str_contains($lower, $keyword)) {
                return '';
            }
        }

        if ($withoutSchool === mb_strtoupper($withoutSchool, 'UTF-8')) {
            return $withoutSchool;
        }

        $upperRatio = $this->computeUppercaseRatio($withoutSchool);
        if ($upperRatio < 0.7) {
            return '';
        }

        return $withoutSchool;
    }

    private function containsSchoolBanner(string $line): bool
    {
        if (preg_match(self::SCHOOL_NAME_PATTERN, $line)) {
            return true;
        }

        $lower = mb_strtolower($line);
        return str_contains($lower, 'maarif okullari');
    }

    private function computeUppercaseRatio(string $text): float
    {
        $letters = preg_replace('/[^A-Za-zĄĆĘŁŃÓŚŹŻİŞĞÜçöışğü\s]/u', '', $text) ?? '';
        $letters = trim($letters);
        if ($letters === '') {
            return 0.0;
        }

        $count = mb_strlen($letters, 'UTF-8');
        $upper = 0;
        for ($i = 0; $i < $count; $i++) {
            $char = mb_substr($letters, $i, 1, 'UTF-8');
            if ($char === mb_strtoupper($char, 'UTF-8')) {
                $upper++;
            }
        }

        return $count > 0 ? $upper / $count : 0.0;
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function countLessonCodes(string $text): array
    {
        return [
            $this->countNormalizedCodes(self::CAMBRIDGE_PATTERN, $text),
            $this->countNormalizedCodes(self::GEORGIAN_PATTERN, $text)
        ];
    }

    private function countNormalizedCodes(string $pattern, string $text): int
    {
        preg_match_all($pattern, $text, $matches, PREG_OFFSET_CAPTURE);
        if (!isset($matches[0]) || !is_array($matches[0])) {
            return 0;
        }

        $count = 0;
        $lastCode = null;
        $lastOffset = -100;

        foreach ($matches[0] as $match) {
            if (!is_array($match) || count($match) < 2) {
                continue;
            }

            [$code, $offset] = $match;
            $normalized = mb_strtoupper(trim((string) $code), 'UTF-8');

            if ($normalized === '') {
                continue;
            }

        if ($lastCode !== null && is_int($offset) && is_int($lastOffset) && $normalized === $lastCode) {
            $distance = abs($offset - $lastOffset);
            if ($distance <= 25) {
                continue;
            }
        }

        $count++;
        $lastCode = $normalized;
        $lastOffset = is_int($offset) ? $offset : $lastOffset;
        }

        return $count;
    }
}
