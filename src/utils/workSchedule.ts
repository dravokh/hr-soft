import type { Weekday, WorkScheduleDay } from '../types';

export const WEEKDAY_ORDER: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

type WorkScheduleDefaults = Pick<WorkScheduleDay, 'isWorking' | 'startTime' | 'endTime' | 'breakMinutes'>;

const DEFAULT_DAY_CONFIG: Record<Weekday, WorkScheduleDefaults> = {
  monday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  thursday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  friday: { isWorking: true, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  saturday: { isWorking: false, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
  sunday: { isWorking: false, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
};

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

const normalizeTimeValue = (value: string | null | undefined, fallback: string | null): string => {
  if (typeof value !== 'string') {
    return fallback ?? '09:00';
  }

  const trimmed = value.trim();
  const match = TIME_PATTERN.exec(trimmed);
  if (!match) {
    return fallback ?? '09:00';
  }

  const hours = Math.min(23, Math.max(0, Number(match[1])));
  const minutes = Math.min(59, Math.max(0, Number(match[2])));

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const normalizeBreakMinutes = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.round(parsed));
};

export const sanitizeWorkSchedule = (entries?: WorkScheduleDay[] | null): WorkScheduleDay[] => {
  const lookup = new Map<Weekday, WorkScheduleDay>();
  (entries ?? []).forEach((entry) => {
    if (!entry) {
      return;
    }

    const day = entry.dayOfWeek;
    if (!WEEKDAY_ORDER.includes(day)) {
      return;
    }
    const defaults = DEFAULT_DAY_CONFIG[day];
    lookup.set(day, {
      dayOfWeek: day,
      isWorking: Boolean(entry.isWorking),
      startTime: normalizeTimeValue(
        (entry.startTime ?? defaults.startTime) as string,
        defaults.startTime
      ),
      endTime: normalizeTimeValue((entry.endTime ?? defaults.endTime) as string, defaults.endTime),
      breakMinutes: normalizeBreakMinutes(entry.breakMinutes, defaults.breakMinutes)
    });
  });

  return WEEKDAY_ORDER.map((day) => {
    if (lookup.has(day)) {
      return lookup.get(day)!;
    }
    const defaults = DEFAULT_DAY_CONFIG[day];
    return {
      dayOfWeek: day,
      isWorking: defaults.isWorking,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      breakMinutes: defaults.breakMinutes
    };
  });
};

export const createDefaultWorkSchedule = (): WorkScheduleDay[] =>
  WEEKDAY_ORDER.map((day) => {
    const defaults = DEFAULT_DAY_CONFIG[day];
    return {
      dayOfWeek: day,
      isWorking: defaults.isWorking,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
      breakMinutes: defaults.breakMinutes
    };
  });
