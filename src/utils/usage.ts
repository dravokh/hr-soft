import type {
  ApplicationFieldDefinition,
  ApplicationFieldValue,
  ApplicationType,
  User,
  Weekday,
  WorkScheduleDay
} from '../types';

export interface UsageRequest {
  vacationDays: number;
  timeMinutes: number;
}

export interface UsageAllocation {
  request: UsageRequest;
  vacation: {
    enabled: boolean;
    apply: number;
    total: number;
    usedBefore: number;
    usedAfter: number;
    remainingBefore: number;
    remainingAfter: number;
    overflow: number;
  };
  grace: {
    enabled: boolean;
    apply: number;
    totalMinutes: number;
    usedBefore: number;
    usedAfter: number;
    remainingBefore: number;
    remainingAfter: number;
    overflow: number;
  };
  penalty: {
    enabled: boolean;
    apply: number;
    usedBefore: number;
    usedAfter: number;
    ratePercent: number;
  };
}

export const valuesArrayToMap = (values: ApplicationFieldValue[]): Record<string, string> =>
  values.reduce<Record<string, string>>((accumulator, value) => {
    accumulator[value.key] = value.value;
    return accumulator;
  }, {});

interface TimeRange {
  start: string;
  end: string;
}

const WEEKDAY_NAMES: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

const splitRange = (value: string): { start: string; end: string } => {
  if (!value) {
    return { start: '', end: '' };
  }
  const [start = '', end = ''] = value.split('/');
  return { start: start.trim(), end: end.trim() };
};

const parseDateOnly = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const parts = value.split('-').map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }
  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const calculateInclusiveDays = (start: Date, end: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = end.getTime() - start.getTime();
  if (diff < 0) {
    return 0;
  }
  return Math.floor(diff / msPerDay) + 1;
};

const parseTimeToMinutes = (value: string): number | null => {
  if (!value) {
    return null;
  }
  const [hourText, minuteText] = value.split(':');
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText ?? '0', 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour * 60 + minute;
};

const differenceInMinutes = (start: string, end: string): number => {
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return 0;
  }
  return endMinutes - startMinutes;
};

const findFieldByType = (type: ApplicationType | undefined, fieldType: ApplicationFieldDefinition['type']) =>
  type?.fields.find((field) => field.type === fieldType);

const getWeekdayFromDate = (date: Date): Weekday => {
  const index = date.getUTCDay();
  return WEEKDAY_NAMES[index] ?? 'monday';
};

const extractReferenceDate = (
  type: ApplicationType | undefined,
  values: Record<string, string>
): Date | null => {
  const prioritizedKeys = ['start_date', 'date', 'end_date'];
  for (const key of prioritizedKeys) {
    const parsed = parseDateOnly(values[key] ?? '');
    if (parsed) {
      return parsed;
    }
  }

  for (const field of type?.fields ?? []) {
    if (field.type === 'date') {
      const parsed = parseDateOnly(values[field.key] ?? '');
      if (parsed) {
        return parsed;
      }
    }
    if (field.type === 'date_range') {
      const { start } = splitRange(values[field.key] ?? '');
      const parsed = parseDateOnly(start);
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
};

const determineWeekdayFromValues = (
  type: ApplicationType | undefined,
  user: User | null | undefined,
  values: Record<string, string>
): Weekday => {
  const explicit = extractReferenceDate(type, values);
  if (explicit) {
    return getWeekdayFromDate(explicit);
  }

  const workingEntry = user?.workSchedule?.find((entry) => entry.isWorking);
  if (workingEntry) {
    return workingEntry.dayOfWeek;
  }

  return 'monday';
};

const extractTimeRange = (
  type: ApplicationType | undefined,
  values: Record<string, string>
): TimeRange | null => {
  if (!type) {
    return null;
  }

  const rangeField = findFieldByType(type, 'time_range');
  if (rangeField) {
    const { start, end } = splitRange(values[rangeField.key] ?? '');
    if (start && end) {
      return { start, end };
    }
  }

  const directStart = values.start_time ?? values.startTime ?? '';
  const directEnd = values.end_time ?? values.endTime ?? '';
  if (directStart && directEnd) {
    return { start: directStart, end: directEnd };
  }

  const startField = type.fields.find(
    (field) => field.type === 'time' && field.key.toLowerCase().includes('start')
  );
  const endField = type.fields.find(
    (field) => field.type === 'time' && field.key.toLowerCase().includes('end')
  );
  if (startField && endField) {
    const start = values[startField.key];
    const end = values[endField.key];
    if (start && end) {
      return { start, end };
    }
  }

  const timeFields = type.fields.filter((field) => field.type === 'time');
  if (timeFields.length >= 2) {
    const [first, second] = timeFields;
    const firstValue = values[first.key];
    const secondValue = values[second.key];
    if (firstValue && secondValue) {
      return { start: firstValue, end: secondValue };
    }
  }

  return null;
};

const findScheduleEntry = (user: User | null | undefined, weekday: Weekday): WorkScheduleDay | null => {
  if (!user?.workSchedule || !Array.isArray(user.workSchedule)) {
    return null;
  }
  return user.workSchedule.find((entry) => entry.dayOfWeek === weekday) ?? null;
};

const computeScheduledDeficit = (schedule: WorkScheduleDay, actual: TimeRange): number | null => {
  const scheduleStart = parseTimeToMinutes(schedule.startTime ?? '');
  const scheduleEnd = parseTimeToMinutes(schedule.endTime ?? '');
  const actualStart = parseTimeToMinutes(actual.start);
  const actualEnd = parseTimeToMinutes(actual.end);

  if (
    scheduleStart === null ||
    scheduleEnd === null ||
    actualStart === null ||
    actualEnd === null ||
    scheduleEnd <= scheduleStart
  ) {
    return null;
  }

  if (actualEnd <= actualStart) {
    return 0;
  }

  const scheduledDuration = scheduleEnd - scheduleStart;
  const overlapStart = Math.max(actualStart, scheduleStart);
  const overlapEnd = Math.min(actualEnd, scheduleEnd);
  const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
  const deficit = scheduledDuration - overlapMinutes;

  if (deficit <= 0) {
    return 0;
  }

  return Math.min(deficit, scheduledDuration);
};

const computeScheduleAwareMinutes = (
  type: ApplicationType,
  user: User | null | undefined,
  values: Record<string, string>,
  range: TimeRange
): number | null => {
  const needsSchedule =
    Boolean(type.capabilities?.usesGracePeriodTracker) || Boolean(type.capabilities?.usesPenaltyTracker);
  if (!needsSchedule || !user) {
    return null;
  }

  const weekday = determineWeekdayFromValues(type, user, values);
  const schedule = findScheduleEntry(user, weekday);
  if (!schedule || !schedule.isWorking) {
    return null;
  }

  const deficit = computeScheduledDeficit(schedule, range);
  if (deficit === null) {
    return null;
  }
  return deficit;
};

const computeVacationDays = (
  type: ApplicationType | undefined,
  values: Record<string, string>
): number => {
  if (!type?.capabilities?.usesVacationCalculator) {
    return 0;
  }

  let startDateValue = values.start_date ?? '';
  let endDateValue = values.end_date ?? '';

  if (!startDateValue || !endDateValue) {
    const rangeField = findFieldByType(type, 'date_range');
    if (rangeField) {
      const { start, end } = splitRange(values[rangeField.key] ?? '');
      startDateValue = startDateValue || start;
      endDateValue = endDateValue || end;
    }
  }

  const start = parseDateOnly(startDateValue);
  const end = parseDateOnly(endDateValue);
  if (!start || !end) {
    return 0;
  }
  return calculateInclusiveDays(start, end);
};

const computeTimeMinutes = (
  type: ApplicationType | undefined,
  user: User | null | undefined,
  values: Record<string, string>
): number => {
  if (!type?.capabilities) {
    return 0;
  }

  const timeRange = extractTimeRange(type, values);
  if (timeRange) {
    if (user) {
      const scheduleMinutes = computeScheduleAwareMinutes(type, user, values, timeRange);
      if (scheduleMinutes !== null) {
        return scheduleMinutes;
      }
    }

    const minutes = differenceInMinutes(timeRange.start, timeRange.end);
    if (minutes > 0) {
      return minutes;
    }
  }

  // Fallback for numeric fields (e.g. manual minute/hour inputs)
  for (const field of type.fields) {
    if (field.type !== 'number') {
      continue;
    }
    const key = field.key.toLowerCase();
    if (!/minute|hour|duration|grace|penalty/.test(key)) {
      continue;
    }
    const rawValue = values[field.key];
    if (!rawValue) {
      continue;
    }
    const numeric = Number.parseFloat(rawValue);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      continue;
    }
    if (key.includes('hour')) {
      return Math.round(numeric * 60);
    }
    return Math.round(numeric);
  }

  return 0;
};

export const computeUsageRequest = (
  type: ApplicationType | undefined,
  user: User | null | undefined,
  values: Record<string, string>
): UsageRequest => {
  return {
    vacationDays: computeVacationDays(type, values),
    timeMinutes: computeTimeMinutes(type, user, values)
  };
};

export const allocateUsage = (
  type: ApplicationType | undefined,
  user: User | null | undefined,
  values: Record<string, string>
): UsageAllocation => {
  const request = computeUsageRequest(type, user, values);
  const capabilities = type?.capabilities;
  const usesVacation = Boolean(capabilities?.usesVacationCalculator);
  const usesGrace = Boolean(capabilities?.usesGracePeriodTracker);
  const usesPenalty = Boolean(capabilities?.usesPenaltyTracker);

  const totalVacation = Number.isFinite(user?.vacationDays) ? Number(user?.vacationDays) : 0;
  const usedVacation = Number.isFinite(user?.vacationDaysUsed) ? Number(user?.vacationDaysUsed) : 0;
  const vacationApply = usesVacation ? Math.max(0, request.vacationDays) : 0;
  const vacationUsedAfter = usedVacation + vacationApply;

  const totalGraceMinutes = (Number.isFinite(user?.lateHoursAllowed) ? Number(user?.lateHoursAllowed) : 0) * 60;
  const graceUsedBefore = Number.isFinite(user?.graceMinutesUsed) ? Number(user?.graceMinutesUsed) : 0;
  const graceApply = usesGrace ? Math.max(0, request.timeMinutes) : 0;
  const graceUsedAfter = graceUsedBefore + graceApply;

  const penaltyUsedBefore = Number.isFinite(user?.penaltyMinutesUsed) ? Number(user?.penaltyMinutesUsed) : 0;
  const penaltyApply = usesPenalty ? Math.max(0, request.timeMinutes) : 0;
  const penaltyUsedAfter = penaltyUsedBefore + penaltyApply;

  return {
    request,
    vacation: {
      enabled: usesVacation,
      apply: vacationApply,
      total: totalVacation,
      usedBefore: usedVacation,
      usedAfter: vacationUsedAfter,
      remainingBefore: Math.max(0, totalVacation - usedVacation),
      remainingAfter: Math.max(0, totalVacation - vacationUsedAfter),
      overflow: Math.max(0, vacationUsedAfter - totalVacation)
    },
    grace: {
      enabled: usesGrace,
      apply: graceApply,
      totalMinutes: totalGraceMinutes,
      usedBefore: graceUsedBefore,
      usedAfter: graceUsedAfter,
      remainingBefore: Math.max(0, totalGraceMinutes - graceUsedBefore),
      remainingAfter: Math.max(0, totalGraceMinutes - graceUsedAfter),
      overflow: Math.max(0, graceUsedAfter - totalGraceMinutes)
    },
    penalty: {
      enabled: usesPenalty,
      apply: penaltyApply,
      usedBefore: penaltyUsedBefore,
      usedAfter: penaltyUsedAfter,
      ratePercent: Number.isFinite(user?.penaltyPercent) ? Number(user?.penaltyPercent) : 0
    }
  };
};

export const hasUsageDeltas = (allocation: UsageAllocation): boolean => {
  return (
    allocation.vacation.apply > 0 ||
    allocation.grace.apply > 0 ||
    allocation.penalty.apply > 0
  );
};

export const formatMinutes = (minutes: number): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '0m';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};
