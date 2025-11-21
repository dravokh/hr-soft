import {
  ApplicationType,
  ApplicationExtraBonus,
  User,
  Weekday,
  WorkScheduleDay
} from '../types';

const EXTRA_BONUS_PERCENT = 10;
const EXTRA_BONUS_MULTIPLIER = 1 + EXTRA_BONUS_PERCENT / 100;
const DEFAULT_WORKING_DAYS = 20;
const DEFAULT_SCHEDULE_MINUTES = 8 * 60;

const WEEKDAY_SEQUENCE: Weekday[] = [
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
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(candidate.getTime())) {
    return null;
  }
  return candidate;
};

const parseTimeToMinutes = (value: string): number | null => {
  if (!value) {
    return null;
  }
  const [hourText, minuteText] = value.split(':');
  const hour = Number.parseInt(hourText ?? '', 10);
  const minute = Number.parseInt(minuteText ?? '', 10);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
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

const findFieldByType = (
  type: ApplicationType | undefined,
  fieldType: ApplicationType['fields'][number]['type']
) => type?.fields.find((field) => field.type === fieldType);

const resolveDateRange = (
  type: ApplicationType | undefined,
  values: Record<string, string>
): { start: Date; end: Date } | null => {
  if (!type) {
    return null;
  }
  let startValue = values.start_date ?? '';
  let endValue = values.end_date ?? '';

  if ((!startValue || !endValue) && findFieldByType(type, 'date_range')) {
    const rangeValue = findFieldByType(type, 'date_range');
    if (rangeValue) {
      const { start, end } = splitRange(values[rangeValue.key] ?? '');
      startValue = startValue || start;
      endValue = endValue || end;
    }
  }

  const start = parseDateOnly(startValue);
  const end = parseDateOnly(endValue);
  if (!start || !end || end.getTime() < start.getTime()) {
    return null;
  }

  return { start, end };
};

const resolveTimeRange = (
  type: ApplicationType | undefined,
  values: Record<string, string>
): { start: string; end: string } | null => {
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

  return null;
};

const getScheduleEntry = (user: User | undefined, weekday: Weekday): WorkScheduleDay | null => {
  if (!user?.workSchedule) {
    return null;
  }
  return user.workSchedule.find((entry) => entry.dayOfWeek === weekday) ?? null;
};

const isWorkingDay = (user: User | undefined, weekday: Weekday): boolean => {
  const entry = getScheduleEntry(user, weekday);
  if (entry) {
    return Boolean(entry.isWorking);
  }
  return weekday !== 'saturday' && weekday !== 'sunday';
};

const enumerateAllDays = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor.getTime()));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const enumerateWorkingDays = (user: User | undefined, start: Date, end: Date): Date[] => {
  return enumerateAllDays(start, end).filter((day) =>
    isWorkingDay(user, WEEKDAY_SEQUENCE[day.getUTCDay()])
  );
};

const countWorkingDaysInMonth = (user: User | undefined, reference: Date): number => {
  const first = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const result: Date[] = [];
  const cursor = new Date(first.getTime());
  while (cursor.getUTCMonth() === first.getUTCMonth()) {
    const weekday = WEEKDAY_SEQUENCE[cursor.getUTCDay()];
    if (isWorkingDay(user, weekday)) {
      result.push(new Date(cursor.getTime()));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result.length;
};

const effectiveScheduleMinutes = (entry: WorkScheduleDay | null): number => {
  if (!entry || !entry.isWorking) {
    return DEFAULT_SCHEDULE_MINUTES;
  }
  const startMinutes = parseTimeToMinutes(entry.startTime ?? '');
  const endMinutes = parseTimeToMinutes(entry.endTime ?? '');
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return DEFAULT_SCHEDULE_MINUTES;
  }
  const raw = endMinutes - startMinutes - (entry.breakMinutes ?? 0);
  return raw > 0 ? raw : DEFAULT_SCHEDULE_MINUTES;
};

export interface ExtraBonusComputation {
  workDate: string;
  minutes: number;
  hourlyRate: number;
  bonusPercent: number;
  totalAmount: number;
}

export const calculateExtraBonus = (
  type: ApplicationType | undefined,
  user: User | undefined,
  values: Record<string, string>
): ExtraBonusComputation | null => {
  if (!type || !type.capabilities?.usesExtraBonusTracker || !user) {
    return null;
  }

  const dateRange = resolveDateRange(type, values);
  const timeRange = resolveTimeRange(type, values);
  if (!dateRange || !timeRange) {
    return null;
  }

  const workingDays = enumerateWorkingDays(user, dateRange.start, dateRange.end);
  if (!workingDays.length) {
    return null;
  }

  const minutesPerDay = differenceInMinutes(timeRange.start, timeRange.end);
  if (minutesPerDay <= 0) {
    return null;
  }

  const actualStart = parseTimeToMinutes(timeRange.start);
  const actualEnd = parseTimeToMinutes(timeRange.end);
  if (actualStart === null || actualEnd === null || actualEnd <= actualStart) {
    return null;
  }

  let totalExtraMinutes = 0;
  for (const day of workingDays) {
    const weekday = WEEKDAY_SEQUENCE[day.getUTCDay()];
    const scheduleEntry = getScheduleEntry(user, weekday);
    const scheduleStart = parseTimeToMinutes(scheduleEntry?.startTime ?? '');
    const scheduleEnd = parseTimeToMinutes(scheduleEntry?.endTime ?? '');
    if (scheduleStart === null || scheduleEnd === null || scheduleEnd <= scheduleStart) {
      continue;
    }
    let dailyExtra = 0;
    if (actualStart < scheduleStart) {
      dailyExtra += scheduleStart - actualStart;
    }
    if (actualEnd > scheduleEnd) {
      dailyExtra += actualEnd - scheduleEnd;
    }
    totalExtraMinutes += Math.max(0, Math.min(dailyExtra, minutesPerDay));
  }

  if (totalExtraMinutes <= 0) {
    return null;
  }

  const baseSalary = Number.isFinite(user.baseSalary) ? Number(user.baseSalary) : 0;
  if (baseSalary <= 0) {
    return null;
  }

  const referenceDay = workingDays[0];
  const monthWorkingDays = countWorkingDaysInMonth(user, referenceDay) || DEFAULT_WORKING_DAYS;
  const scheduleEntry = getScheduleEntry(user, WEEKDAY_SEQUENCE[referenceDay.getUTCDay()]);
  const scheduledMinutes = effectiveScheduleMinutes(scheduleEntry);
  const perDayRate = baseSalary / monthWorkingDays;
  const perMinuteRate = perDayRate / scheduledMinutes;
  const hourlyRate = Number((perMinuteRate * 60).toFixed(2));
  const totalAmount = Number((perMinuteRate * totalExtraMinutes * EXTRA_BONUS_MULTIPLIER).toFixed(2));

  return {
    workDate: referenceDay.toISOString().slice(0, 10),
    minutes: totalExtraMinutes,
    hourlyRate,
    bonusPercent: EXTRA_BONUS_PERCENT,
    totalAmount
  };
};

type ExtraValidationResult = 'missing_range' | 'missing_time' | 'non_working_day' | 'missing_schedule';

export const validateExtraBonusInput = (
  type: ApplicationType | undefined,
  user: User | undefined,
  values: Record<string, string>
): ExtraValidationResult | null => {
  if (!type?.capabilities?.usesExtraBonusTracker || !user) {
    return null;
  }

  const dateRange = resolveDateRange(type, values);
  if (!dateRange) {
    return 'missing_range';
  }
  const timeRange = resolveTimeRange(type, values);
  if (!timeRange) {
    return 'missing_time';
  }
  if (!user.workSchedule || user.workSchedule.length === 0) {
    return 'missing_schedule';
  }

  const allDays = enumerateAllDays(dateRange.start, dateRange.end);
  for (const day of allDays) {
    const weekday = WEEKDAY_SEQUENCE[day.getUTCDay()];
    const scheduleEntry = getScheduleEntry(user, weekday);
    if (!scheduleEntry || !scheduleEntry.isWorking) {
      return 'non_working_day';
    }
    if (!scheduleEntry.startTime || !scheduleEntry.endTime) {
      return 'missing_schedule';
    }
  }

  return null;
};

export const mergeExtraBonusPayload = (
  applicationId: number,
  userId: number,
  computation: ExtraBonusComputation | null,
  existing?: ApplicationExtraBonus | null
): ApplicationExtraBonus | null => {
  if (!computation) {
    return null;
  }

  const createdAt = existing?.createdAt ?? new Date().toISOString();

  return {
    applicationId,
    userId,
    workDate: computation.workDate,
    minutes: computation.minutes,
    hourlyRate: computation.hourlyRate,
    bonusPercent: computation.bonusPercent,
    totalAmount: computation.totalAmount,
    createdAt
  };
};
