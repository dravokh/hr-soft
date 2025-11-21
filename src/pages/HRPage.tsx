import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ClipboardList, PlusCircle, Settings, UsersRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type {
  CompensationAdjustmentConfig,
  Weekday,
  WorkScheduleDay,
  WorkCalendarDay
} from '../types';
import { createDefaultWorkSchedule, sanitizeWorkSchedule, WEEKDAY_ORDER } from '../utils/workSchedule';
import { UsersPage } from './UsersPage';

interface HRPageProps {
  language: 'ka' | 'en';
}

type ShiftFormState = {
  id: number | null;
  name: string;
  description: string;
  schedule: WorkScheduleDay[];
};

type AdjustmentFormRow = {
  id: string;
  label: string;
  mode: 'percent' | 'fixed';
  value: number;
};

type CompensationFormState = {
  cambridge: number;
  georgian: number;
  cover: number;
  taxRate: number;
  adjustments: AdjustmentFormRow[];
};

type TabId = 'shifts' | 'bonus' | 'createUser' | 'userList' | 'calendar';

const TAB_PERMISSIONS: Partial<Record<TabId, string>> = {
  shifts: 'manage_work_shifts',
  bonus: 'manage_lesson_bonuses',
  createUser: 'create_users',
  userList: 'view_users',
  calendar: 'manage_work_shifts'
};

const sortCalendarDays = (days: WorkCalendarDay[]): WorkCalendarDay[] =>
  [...days].sort((a, b) => a.date.localeCompare(b.date));

const mapAdjustmentsToRows = (items: CompensationAdjustmentConfig[] = []): AdjustmentFormRow[] =>
  items.map((item, index) => ({
    id: item.id ? `server-${item.id}` : `adjustment-${index}`,
    label: item.label,
    mode: item.mode === 'fixed' ? 'fixed' : 'percent',
    value: Number(item.value ?? 0)
  }));

const WEEKDAY_HEADERS: Record<HRPageProps['language'], string[]> = {
  ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};

const CALENDAR_COPY_KA = {
  calendarTitle: 'სამუშაო კალენდარი',
  calendarSubtitle: 'მონიშნეთ არამუშაობის დღეები და განმარტებები კონკრეტული თვეებისთვის.',
  calendarMonthLabel: 'აირჩიეთ თვე',
  calendarDateLabel: 'თარიღი',
  calendarNoteLabel: 'კომენტარი',
  calendarWorkingLabel: 'სამუშაო დღე',
  calendarDayOffLabel: 'არასამუშაო დღე',
  calendarAdd: 'დამატება',
  calendarSave: 'კალენდრის შენახვა',
  calendarSaved: 'კალენდარი განახლდა.',
  calendarEmpty: 'ამ თვეში ჩანაწერები არ არის.',
  calendarHelper: 'თითო ჩანაწერი არის კონკრეტული თარიღი და აღწერა მუშაობს თუ არა იმ დღეს.',
  calendarInstant: 'ცვლილებები დაუყოვნებლივ აისახება ხელფასის გამოთვლებში.',
  calendarLoadError: 'კალენდრის ჩატვირთვა ვერ მოხერხდა.',
  calendarSaveError: 'კალენდრის შენახვა ვერ მოხერხდა.',
  calendarMonthMismatch: 'თარიღი უნდა ეკუთვნოდეს არჩეულ თვეს.',
  calendarSummary: 'მონიშნული დღეები',
  calendarLoadingLabel: 'იტვირთება...'
} as const;

const CALENDAR_COPY_EN = {
  calendarTitle: 'Work calendar',
  calendarSubtitle: 'Mark non-working days for each month and add a short description.',
  calendarMonthLabel: 'Select month',
  calendarDateLabel: 'Date',
  calendarNoteLabel: 'Comment',
  calendarWorkingLabel: 'Working day',
  calendarDayOffLabel: 'Day off',
  calendarAdd: 'Add day',
  calendarSave: 'Save calendar',
  calendarSaved: 'Calendar updated.',
  calendarEmpty: 'No overrides for this month.',
  calendarHelper: 'Each row represents a specific date and whether it counts as a working day.',
  calendarInstant: 'Changes take effect immediately for salary calculations.',
  calendarLoadError: 'Unable to load calendar.',
  calendarSaveError: 'Unable to save calendar.',
  calendarMonthMismatch: 'Please choose a date inside the selected month.',
  calendarSummary: 'marked days',
  calendarLoadingLabel: 'Loading…'
} as const;

const DAY_LABELS: Record<HRPageProps['language'], Record<Weekday, string>> = {
  ka: {
    monday: 'ორშაბათი',
    tuesday: 'სამშაბათი',
    wednesday: 'ოთხშაბათი',
    thursday: 'ხუთშაბათი',
    friday: 'პარასკევი',
    saturday: 'შაბათი',
    sunday: 'კვირა'
  },
  en: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }
};

const COPY: Record<
  HRPageProps['language'],
  {
    title: string;
    subtitle: string;
    accessDeniedTitle: string;
    accessDeniedSubtitle: string;
    noTabsAvailable: string;
    tabs: { id: TabId; label: string; helper: string }[];
    shiftListTitle: string;
    shiftFormTitle: string;
    shiftDescription: string;
    nameLabel: string;
    descriptionLabel: string;
    scheduleHeading: string;
    workingLabel: string;
    startLabel: string;
    endLabel: string;
    saveShift: string;
    updateShift: string;
    cancel: string;
    remove: string;
    emptyShifts: string;
    bonusTitle: string;
    bonusSubtitle: string;
    bonusSave: string;
    bonusSaved: string;
    taxRateLabel: string;
    adjustmentsTitle: string;
    adjustmentsSubtitle: string;
    adjustmentsAdd: string;
    adjustmentsEmpty: string;
    adjustmentsPlaceholder: string;
    adjustmentsValueLabel: string;
    adjustmentsModePercent: string;
    adjustmentsModeFixed: string;
    userCreateTitle: string;
    userCreateSubtitle: string;
    userListTitle: string;
    userListSearch: string;
    userListEmpty: string;
    calendarTitle: string;
    calendarSubtitle: string;
    calendarMonthLabel: string;
    calendarDateLabel: string;
    calendarNoteLabel: string;
    calendarWorkingLabel: string;
    calendarDayOffLabel: string;
    calendarAdd: string;
    calendarSave: string;
    calendarSaved: string;
    calendarEmpty: string;
    calendarHelper: string;
    calendarInstant: string;
    calendarLoadError: string;
    calendarSaveError: string;
    calendarMonthMismatch: string;
    calendarSummary: string;
    calendarLoadingLabel: string;
  }
> = {
  ka: {
    title: 'HR მართვა',
    subtitle: 'მართეთ ცვლები, ბონუსები და მომხმარებლები ერთი გვერდიდან.',
    accessDeniedTitle: 'Permission required',
    accessDeniedSubtitle: 'You do not have rights to open the HR workspace.',
    noTabsAvailable: 'No HR sections are currently available for your role.',
    tabs: [
      { id: 'shifts', label: 'ცვლები', helper: 'სამუშაო განრიგი' },
      { id: 'bonus', label: 'ანაზღაურება', helper: 'ბონუსები და გადასახადები' },
      { id: 'createUser', label: 'მომხმარებლის შექმნა', helper: 'ფორმა' },
      { id: 'userList', label: 'მომხმარებელთა სია', helper: 'ძიება' },
      { id: 'calendar', label: 'კალენდარი', helper: 'არასამუშაო დღეები' },
    ],
    shiftListTitle: 'ცვლების ჩამონათვალი',
    shiftFormTitle: 'ცვლის დამატება',
    shiftDescription: 'შეიყვანეთ ცვლის დასახელება და სამუშაო საათები.',
    nameLabel: 'ცვლის სახელი',
    descriptionLabel: 'აღწერა',
    scheduleHeading: 'კვირის განრიგი',
    workingLabel: 'სამუშაო დღე',
    startLabel: 'დაწყება',
    endLabel: 'დასრულება',
    saveShift: 'დამატება',
    updateShift: 'განახლება',
    cancel: 'გაუქმება',
    remove: 'წაშლა',
    emptyShifts: 'ჯერ არ გაქვთ ცვლები.',
    bonusTitle: 'ანაზღაურების პარამეტრები',
    bonusSubtitle: 'განსაზღვრეთ გაკვეთილის ღირებულება და გადასახადები.',
    bonusSave: 'პარამეტრების შენახვა',
    bonusSaved: 'ანაზღაურების წესები განახლდა',
    taxRateLabel: 'საგადასახადო პროცენტი (%)',
    adjustmentsTitle: 'დაკლებსები და გადასახადები',
    adjustmentsSubtitle: 'დაამატეთ საჭირო სახელით და მნიშვნელობით (პროცენტი ან ფიქსირებული).',
    adjustmentsAdd: 'დაკლების დამატება',
    adjustmentsEmpty: 'დამატებითი დაკლება ამჟამად არ არის.',
    adjustmentsPlaceholder: 'მაგალითად: პენსია',
    adjustmentsValueLabel: 'მნიშვნელობა',
    adjustmentsModePercent: 'პროცენტული',
    adjustmentsModeFixed: 'ფიქსირებული თანხა',
    userCreateTitle: 'მომხმარებლის შექმნა',
    userCreateSubtitle: 'ქვემოთ იხილავთ სრულ ფორმას ახალი ანგარიშის დასამატებლად.',
    userListTitle: 'მომხმარებელთა სია',
    userListSearch: 'სახელი, როლი, საგანი, პირადი ნომერი, ტელეფონი ან ელფოსტა',
    userListEmpty: 'შედეგი არ მოიძებნა.',
    ...CALENDAR_COPY_EN,
    ...CALENDAR_COPY_KA,
  },
  en: {
    title: 'HR workspace',
    subtitle: 'Manage shifts, lesson bonuses, and users from one page.',
    accessDeniedTitle: 'Permission required',
    accessDeniedSubtitle: 'You do not have rights to open the HR workspace.',
    noTabsAvailable: 'No HR sections are currently available for your role.',
    tabs: [
      { id: 'shifts', label: 'Shifts', helper: 'Schedule' },
      { id: 'bonus', label: 'Compensation', helper: 'Bonuses & taxes' },
      { id: 'createUser', label: 'Create user', helper: 'Full form' },
      { id: 'userList', label: 'User list', helper: 'Search' },
      { id: 'calendar', label: 'Calendar', helper: 'Days off' }
    ],
    shiftListTitle: 'Existing shifts',
    shiftFormTitle: 'Add shift',
    shiftDescription: 'Provide a name and working hours for the shift.',
    nameLabel: 'Shift name',
    descriptionLabel: 'Description',
    scheduleHeading: 'Weekly schedule',
    workingLabel: 'Working day',
    startLabel: 'Start',
    endLabel: 'End',
    saveShift: 'Add',
    updateShift: 'Update',
    cancel: 'Cancel',
    remove: 'Remove',
    emptyShifts: 'No shifts defined yet.',
    bonusTitle: 'Compensation settings',
    bonusSubtitle: 'Set per-lesson rates, tax rate, and optional deductions.',
    bonusSave: 'Save compensation',
    bonusSaved: 'Compensation updated',
    taxRateLabel: 'Tax rate (%)',
    adjustmentsTitle: 'Taxes & deductions',
    adjustmentsSubtitle: 'Add optional deductions as percentages or fixed amounts.',
    adjustmentsAdd: 'Add deduction',
    adjustmentsEmpty: 'No extra deductions configured.',
    adjustmentsPlaceholder: 'e.g. Pension fund',
    adjustmentsValueLabel: 'Value',
    adjustmentsModePercent: 'Percent',
    adjustmentsModeFixed: 'Fixed amount',
    userCreateTitle: 'Create new user',
    userCreateSubtitle: 'Use the form below to add a new employee.',
    userListTitle: 'User list',
    userListSearch: 'Search by name, role, subject, personal ID, phone or email',
    userListEmpty: 'No matching users.',
    ...CALENDAR_COPY_EN,
  }
};

const defaultShiftForm = (): ShiftFormState => ({
  id: null,
  name: '',
  description: '',
  schedule: createDefaultWorkSchedule()
});

const formatMonthValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const parseMonthValue = (value: string): { year: number; month: number } => {
  const [yearPart, monthPart] = value.split('-');
  const year = Number.parseInt(yearPart ?? '', 10);
  const month = Number.parseInt(monthPart ?? '', 10);
  const fallback = new Date();
  return {
    year: Number.isFinite(year) ? year : fallback.getFullYear(),
    month: Number.isFinite(month) ? month : fallback.getMonth() + 1
  };
};

const isDateInMonth = (dateValue: string, monthValue: string): boolean =>
  dateValue.startsWith(`${monthValue}-`);

const daysInCalendarMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

const HRPage: React.FC<HRPageProps> = ({ language }) => {
  const {
    workShifts,
    saveWorkShifts,
    teacherScheduleBonusRates,
    saveTeacherScheduleBonusRates,
    fetchWorkCalendarMonth,
    saveWorkCalendarMonth,
    hasPermission
  } = useAppContext();
  const t = COPY[language];

  const canViewHr = hasPermission('view_hr');
  const canManageShifts = hasPermission('manage_work_shifts');
  const canManageBonuses = hasPermission('manage_lesson_bonuses');
  const canCreateUsers = hasPermission('create_users');
  const canViewUsers = hasPermission('view_users');

  const [activeTab, setActiveTab] = useState<TabId>('shifts');
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState<ShiftFormState>(defaultShiftForm);
  const buildCompensationForm = useCallback((): CompensationFormState => {
    return {
      cambridge: Number(teacherScheduleBonusRates.cambridge ?? 0),
      georgian: Number(teacherScheduleBonusRates.georgian ?? 0),
      cover: Number(teacherScheduleBonusRates.cover ?? 0),
      taxRate: Number(teacherScheduleBonusRates.taxRate ?? 0),
      adjustments: mapAdjustmentsToRows(teacherScheduleBonusRates.adjustments ?? [])
    };
  }, [teacherScheduleBonusRates]);
  const [bonusForm, setBonusForm] = useState<CompensationFormState>(buildCompensationForm);
  useEffect(() => {
    setBonusForm(buildCompensationForm());
  }, [buildCompensationForm]);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [bonusSaving, setBonusSaving] = useState(false);
  const defaultMonth = formatMonthValue(new Date());
  const [calendarMonth, setCalendarMonth] = useState(defaultMonth);
  const [calendarDays, setCalendarDays] = useState<WorkCalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarSaving, setCalendarSaving] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarDirty, setCalendarDirty] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const availableTabs = useMemo(
    () =>
      t.tabs.filter((tab) => {
        const required = TAB_PERMISSIONS[tab.id];
        return !required || hasPermission(required);
      }),
    [hasPermission, t]
  );

  const resolvedActiveTab = useMemo<TabId | null>(() => {
    if (availableTabs.some((tab) => tab.id === activeTab)) {
      return activeTab;
    }
    return availableTabs.length > 0 ? availableTabs[0].id : null;
  }, [activeTab, availableTabs]);

  useEffect(() => {
    if (resolvedActiveTab && resolvedActiveTab !== activeTab) {
      setActiveTab(resolvedActiveTab);
    }
  }, [resolvedActiveTab, activeTab]);

  const parsedCalendarMonth = useMemo(() => parseMonthValue(calendarMonth), [calendarMonth]);
  const calendarGrid = useMemo(() => {
    const { year, month } = parsedCalendarMonth;
    const totalDays = daysInCalendarMonth(year, month);
    const entryMap = new Map(calendarDays.map((day) => [day.date, day]));
    const firstDay = new Date(year, month - 1, 1).getDay();
    const mondayStartOffset = (firstDay + 6) % 7;
    const cells: Array<
      null | { date: string; day: number; note: string; isWorking: boolean; hasOverride: boolean }
    > = [];

    for (let i = 0; i < mondayStartOffset; i += 1) {
      cells.push(null);
    }

    const monthString = String(month).padStart(2, '0');
    for (let day = 1; day <= totalDays; day += 1) {
      const date = `${year}-${monthString}-${String(day).padStart(2, '0')}`;
      const entry = entryMap.get(date);
      cells.push({
        date,
        day,
        note: entry?.note ?? '',
        isWorking: entry?.isWorking ?? true,
        hasOverride: Boolean(entry)
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarDays, parsedCalendarMonth]);

  const loadCalendarDays = useCallback(
    async (year: number, month: number) => {
      setCalendarLoading(true);
      setCalendarError(null);
      setCalendarMessage(null);
      try {
        const data = await fetchWorkCalendarMonth(year, month);
        setCalendarDays(sortCalendarDays(data));
        setCalendarDirty(false);
      } catch {
        setCalendarError(t.calendarLoadError);
      } finally {
        setCalendarLoading(false);
      }
    },
    [fetchWorkCalendarMonth, t.calendarLoadError]
  );

  useEffect(() => {
    void loadCalendarDays(parsedCalendarMonth.year, parsedCalendarMonth.month);
  }, [parsedCalendarMonth, loadCalendarDays]);
  useEffect(() => {
    const monthString = `${parsedCalendarMonth.year}-${String(parsedCalendarMonth.month).padStart(2, '0')}`;
    if (selectedCalendarDate && selectedCalendarDate.startsWith(monthString)) {
      return;
    }
    const firstActiveDay = calendarGrid.find((cell) => cell !== null)?.date ?? null;
    setSelectedCalendarDate(firstActiveDay);
  }, [calendarGrid, parsedCalendarMonth, selectedCalendarDate]);

  const shiftCalendarMonth = (delta: number) => {
    const next = new Date(parsedCalendarMonth.year, parsedCalendarMonth.month - 1 + delta, 1);
    setCalendarMonth(formatMonthValue(next));
  };

  const upsertCalendarDay = useCallback(
    (date: string, updates: Partial<WorkCalendarDay>) => {
      setCalendarDays((previous) => {
        const existing = previous.find((day) => day.date === date);
        if (existing) {
          return sortCalendarDays(
            previous.map((day) => (day.date === date ? { ...day, ...updates } : day))
          );
        }
        const nextEntry: WorkCalendarDay = {
          date,
          isWorking: updates.isWorking ?? false,
          note: updates.note ?? ''
        };
        return sortCalendarDays([...previous, nextEntry]);
      });
      setCalendarDirty(true);
      setCalendarMessage(null);
      setCalendarError(null);
    },
    []
  );

  const handleRemoveCalendarDay = (date: string) => {
    setCalendarDays((previous) => previous.filter((day) => day.date !== date));
    setCalendarDirty(true);
    setCalendarMessage(null);
  };

  const handleToggleCalendarDay = (date: string, nextValue: boolean) => {
    upsertCalendarDay(date, { isWorking: nextValue });
  };

  const handleCalendarNoteChange = (date: string, note: string) => {
    const existing = calendarDays.find((day) => day.date === date);
    if (existing) {
      upsertCalendarDay(date, { note });
    } else {
      upsertCalendarDay(date, { note, isWorking: true });
    }
  };

  const handleAddAdjustmentRow = () => {
    setBonusForm((previous) => ({
      ...previous,
      adjustments: [
        ...previous.adjustments,
        { id: `new-${Date.now()}`, label: '', mode: 'percent', value: 0 }
      ]
    }));
  };

  const handleUpdateAdjustmentRow = (id: string, updates: Partial<AdjustmentFormRow>) => {
    setBonusForm((previous) => ({
      ...previous,
      adjustments: previous.adjustments.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      )
    }));
  };

  const handleRemoveAdjustmentRow = (id: string) => {
    setBonusForm((previous) => ({
      ...previous,
      adjustments: previous.adjustments.filter((row) => row.id !== id)
    }));
  };

  const handleSaveCalendar = async () => {
    setCalendarSaving(true);
    setCalendarError(null);
    setCalendarMessage(null);
    try {
      const updated = await saveWorkCalendarMonth(
        parsedCalendarMonth.year,
        parsedCalendarMonth.month,
        calendarDays
      );
      setCalendarDays(sortCalendarDays(updated));
      setCalendarDirty(false);
      setCalendarMessage(t.calendarSaved);
    } catch {
      setCalendarError(t.calendarSaveError);
    } finally {
      setCalendarSaving(false);
    }
  };

  if (!canViewHr) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">{t.title}</h1>
          <p className="text-slate-600">{t.subtitle}</p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t.accessDeniedTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">{t.accessDeniedSubtitle}</p>
        </div>
      </div>
    );
  }

  const handleShiftSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = shiftForm.name.trim();
    if (!name) {
      return;
    }
    const sanitizedSchedule = sanitizeWorkSchedule(
      shiftForm.schedule.map((entry) => ({ ...entry, breakMinutes: 0 }))
    );

    if (shiftForm.id !== null) {
      saveWorkShifts((current) =>
        current.map((shift) =>
          shift.id === shiftForm.id
            ? { ...shift, name, description: shiftForm.description.trim(), schedule: sanitizedSchedule }
            : shift
        )
      );
    } else {
      saveWorkShifts((current) => {
        const nextId = current.reduce((max, shift) => Math.max(max, shift.id), 0) + 1;
        return [
          ...current,
          { id: nextId, name, description: shiftForm.description.trim(), schedule: sanitizedSchedule }
        ];
      });
    }

    setShiftForm(defaultShiftForm());
    setShowShiftForm(false);
  };

  const editShift = (shiftId: number) => {
    const existing = workShifts.find((shift) => shift.id === shiftId);
    if (!existing) {
      return;
    }
    setShiftForm({
      id: existing.id,
      name: existing.name,
      description: existing.description ?? '',
      schedule: sanitizeWorkSchedule(
        (existing.schedule ?? []).map((entry) => ({ ...entry, breakMinutes: 0 }))
      )
    });
    setShowShiftForm(true);
    setActiveTab('shifts');
  };

  const deleteShift = (shiftId: number) => {
    saveWorkShifts((current) => current.filter((shift) => shift.id !== shiftId));
    if (shiftForm.id === shiftId) {
      setShiftForm(defaultShiftForm());
      setShowShiftForm(false);
    }
  };

  const scheduleInputs = (
    <div className="grid gap-4">
      {WEEKDAY_ORDER.map((day) => {
        const entry = shiftForm.schedule.find((item) => item.dayOfWeek === day)!;
        return (
          <div key={day} className="grid gap-3 rounded-2xl border border-slate-200 p-4 shadow-sm sm:grid-cols-4">
            <div className="text-sm font-semibold text-slate-800">{DAY_LABELS[language][day]}</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={entry.isWorking}
                onChange={(event) =>
                  setShiftForm((prev) => ({
                    ...prev,
                    schedule: prev.schedule.map((scheduleEntry) =>
                      scheduleEntry.dayOfWeek === day
                        ? { ...scheduleEntry, isWorking: event.target.checked }
                        : scheduleEntry
                    )
                  }))
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>{t.workingLabel}</span>
            </label>
            <label className="flex flex-col text-sm">
              <span className="text-slate-500">{t.startLabel}</span>
              <input
                type="time"
                value={entry.startTime ?? ''}
                onChange={(event) =>
                  setShiftForm((prev) => ({
                    ...prev,
                    schedule: prev.schedule.map((scheduleEntry) =>
                      scheduleEntry.dayOfWeek === day
                        ? { ...scheduleEntry, startTime: event.target.value }
                        : scheduleEntry
                    )
                  }))
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
              />
            </label>
            <label className="flex flex-col text-sm">
              <span className="text-slate-500">{t.endLabel}</span>
              <input
                type="time"
                value={entry.endTime ?? ''}
                onChange={(event) =>
                  setShiftForm((prev) => ({
                    ...prev,
                    schedule: prev.schedule.map((scheduleEntry) =>
                      scheduleEntry.dayOfWeek === day
                        ? { ...scheduleEntry, endTime: event.target.value }
                        : scheduleEntry
                    )
                  }))
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700"
              />
            </label>
          </div>
        );
      })}
    </div>
  );

  const renderShiftsTab = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.shiftListTitle}</h2>
            <p className="text-sm text-slate-500">{t.shiftDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShiftForm(defaultShiftForm());
              setShowShiftForm((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            <PlusCircle className="h-4 w-4" />
            {t.shiftFormTitle}
          </button>
        </div>
        {showShiftForm && (
          <form onSubmit={handleShiftSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col text-sm">
                <span className="text-slate-500">{t.nameLabel}</span>
                <input
                  value={shiftForm.name}
                  onChange={(event) => setShiftForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
              <label className="flex flex-col text-sm">
                <span className="text-slate-500">{t.descriptionLabel}</span>
                <input
                  value={shiftForm.description}
                  onChange={(event) =>
                    setShiftForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </label>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">{t.scheduleHeading}</p>
              {scheduleInputs}
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                {shiftForm.id ? t.updateShift : t.saveShift}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShiftForm(false);
                  setShiftForm(defaultShiftForm());
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
        <div className="mt-6 space-y-3">
          {workShifts.length === 0 ? (
            <p className="text-sm text-slate-500">{t.emptyShifts}</p>
          ) : (
            workShifts.map((shift) => (
              <div
                key={shift.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{shift.name}</p>
                  <p className="text-xs text-slate-500">{shift.description || '—'}</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => editShift(shift.id)}
                    className="rounded-xl border border-slate-200 px-3 py-1 font-semibold text-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteShift(shift.id)}
                    className="rounded-xl border border-red-200 px-3 py-1 font-semibold text-red-600"
                  >
                    {t.remove}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderBonusTab = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.bonusTitle}</h2>
            <p className="text-sm text-slate-500">{t.bonusSubtitle}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(['cambridge', 'georgian', 'cover'] as Array<'cambridge' | 'georgian' | 'cover'>).map((key) => (
            <label key={key} className="flex flex-col text-sm">
              <span className="text-slate-500 capitalize">{key}</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={bonusForm[key]}
                onChange={(event) =>
                  setBonusForm((prev) => ({
                    ...prev,
                    [key]: Number(event.target.value)
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t.adjustmentsTitle}</h3>
            <p className="text-sm text-slate-500">{t.adjustmentsSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleAddAdjustmentRow}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <PlusCircle className="h-4 w-4" />
            {t.adjustmentsAdd}
          </button>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm">
          <label className="text-sm font-semibold text-amber-700">{t.taxRateLabel}</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={bonusForm.taxRate}
              onChange={(event) =>
                setBonusForm((prev) => ({ ...prev, taxRate: Number(event.target.value) }))
              }
              className="w-32 rounded-xl border border-amber-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            <span className="text-xs text-slate-500">
              {language === 'ka'
                ? 'გადასახადის პროცენტი წინასწარ იჭრება ხელფასიდან.'
                : 'Tax percentage is deducted from gross salary.'}
            </span>
          </div>
        </div>

        {bonusForm.adjustments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t.adjustmentsEmpty}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {bonusForm.adjustments.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-2xl border border-slate-100 p-4 md:grid-cols-12"
              >
                <label className="md:col-span-5">
                  <span className="text-sm font-semibold text-slate-700">{t.adjustmentsPlaceholder}</span>
                  <input
                    value={row.label}
                    onChange={(event) =>
                      handleUpdateAdjustmentRow(row.id, { label: event.target.value })
                    }
                    placeholder={t.adjustmentsPlaceholder}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="md:col-span-3">
                  <span className="text-sm font-semibold text-slate-700">{t.adjustmentsValueLabel}</span>
                  <input
                    type="number"
                    step={row.mode === 'percent' ? 0.1 : 0.5}
                    value={row.value}
                    onChange={(event) =>
                      handleUpdateAdjustmentRow(row.id, { value: Number(event.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="md:col-span-3">
                  <span className="text-sm font-semibold text-slate-700">{t.adjustmentsValueLabel}</span>
                  <select
                    value={row.mode}
                    onChange={(event) =>
                      handleUpdateAdjustmentRow(row.id, {
                        mode: event.target.value === 'fixed' ? 'fixed' : 'percent'
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="percent">{t.adjustmentsModePercent}</option>
                    <option value="fixed">{t.adjustmentsModeFixed}</option>
                  </select>
                </label>
                <div className="md:col-span-1 md:flex md:items-end md:justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveAdjustmentRow(row.id)}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    {t.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {bonusMessage && <p className="text-sm text-emerald-600">{bonusMessage}</p>}
      <button
        type="button"
        disabled={bonusSaving}
        onClick={async () => {
          setBonusSaving(true);
          setBonusMessage(null);
          try {
            await saveTeacherScheduleBonusRates({
              cambridge: bonusForm.cambridge,
              georgian: bonusForm.georgian,
              cover: bonusForm.cover,
              taxRate: bonusForm.taxRate,
              adjustments: bonusForm.adjustments.map((row) => ({
                label: row.label,
                mode: row.mode,
                value: row.value
              }))
            });
            setBonusMessage(t.bonusSaved);
          } catch (error) {
            console.error(error);
            setBonusMessage('Error updating compensation.');
          } finally {
            setBonusSaving(false);
          }
        }}
        className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {bonusSaving ? 'Saving…' : t.bonusSave}
      </button>
    </div>
  );

  const renderWorkCalendarTab = () => {
    const weekdayHeaders = WEEKDAY_HEADERS[language];
    const { year, month } = parsedCalendarMonth;
    const locale = language === 'ka' ? 'ka-GE' : 'en-US';
    const monthDisplay = new Date(year, month - 1, 1).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric'
    });
    const selectedCell =
      selectedCalendarDate !== null
        ? calendarGrid.find((cell) => cell && cell.date === selectedCalendarDate) ?? null
        : null;
    const selectionLabel =
      selectedCell !== null
        ? new Date(selectedCell.date).toLocaleDateString(locale, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })
        : null;

    const summaryValue = calendarLoading
      ? t.calendarLoadingLabel
      : `${calendarDays.length} ${t.calendarSummary}`;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">{t.calendarTitle}</h2>
              <p className="text-sm text-slate-500">{t.calendarSubtitle}</p>
              <p className="text-xs text-slate-500">{t.calendarHelper}</p>
              <p className="text-xs text-emerald-600">{t.calendarInstant}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftCalendarMonth(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="month"
                value={calendarMonth}
                onChange={(event) => setCalendarMonth(event.target.value || defaultMonth)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => shiftCalendarMonth(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{t.calendarMonthLabel}</p>
              <p className="text-lg font-semibold text-slate-900">{monthDisplay}</p>
            </div>
            <div className="text-xs font-semibold tracking-wide text-slate-400">
              {summaryValue}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
            {weekdayHeaders.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarGrid.map((cell, index) =>
              cell ? (
                <button
                  type="button"
                  key={cell.date}
                  onClick={() => setSelectedCalendarDate(cell.date)}
                  className={`h-24 rounded-xl border px-3 py-2 text-left transition ${
                    selectedCalendarDate === cell.date ? 'border-blue-500 shadow-md' : 'border-slate-200'
                  } ${
                    cell.hasOverride
                      ? cell.isWorking
                        ? 'bg-emerald-50'
                        : 'bg-rose-50'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>{cell.day}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        cell.isWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {cell.isWorking ? t.calendarWorkingLabel : t.calendarDayOffLabel}
                    </span>
                  </div>
                  {cell.note ? (
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600">{cell.note}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">{t.calendarNoteLabel}</p>
                  )}
                </button>
              ) : (
                <div
                  key={`empty-${index}`}
                  className="h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50"
                  aria-hidden
                />
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {selectedCell ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t.calendarDateLabel}</p>
                  <p className="text-lg font-semibold text-slate-900">{selectionLabel}</p>
                  <p className="text-sm text-slate-500">{selectedCell.date}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleCalendarDay(selectedCell.date, true)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      selectedCell.isWorking
                        ? 'bg-emerald-500 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.calendarWorkingLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCalendarDay(selectedCell.date, false)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      !selectedCell.isWorking
                        ? 'bg-rose-500 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.calendarDayOffLabel}
                  </button>
                </div>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                {t.calendarNoteLabel}
                <textarea
                  value={selectedCell.note}
                  onChange={(event) => handleCalendarNoteChange(selectedCell.date, event.target.value)}
                  placeholder="e.g. Christmas"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  {calendarError ? (
                    <p className="text-red-600">{calendarError}</p>
                  ) : calendarMessage ? (
                    <p className="text-emerald-600">{calendarMessage}</p>
                  ) : (
                    <p className="text-slate-500">{t.calendarInstant}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedCell.hasOverride ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveCalendarDay(selectedCell.date)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      {t.remove}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSaveCalendar}
                    disabled={!calendarDirty || calendarSaving}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {calendarSaving ? 'Saving...' : t.calendarSave}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t.calendarEmpty}</p>
          )}
        </div>
      </div>
    );
  };

  const renderUserCreation = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t.userCreateTitle}</h2>
        <p className="text-sm text-slate-500">{t.userCreateSubtitle}</p>
      </div>
      <UsersPage language={language} mode="form" hidePageHeading />
    </div>
  );

  const renderUserList = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t.userListTitle}</h2>
        <p className="text-sm text-slate-500">{t.userListSearch}</p>
      </div>
      <UsersPage language={language} mode="list" hidePageHeading />
    </div>
  );

  const renderTabContent = () => {
    if (!resolvedActiveTab) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{t.noTabsAvailable}</p>
        </div>
      );
    }
    switch (resolvedActiveTab) {
      case 'shifts':
        return renderShiftsTab();
      case 'bonus':
        return renderBonusTab();
      case 'createUser':
        return renderUserCreation();
      case 'userList':
        return renderUserList();
      case 'calendar':
        return renderWorkCalendarTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">{t.title}</h1>
        <p className="text-slate-600">{t.subtitle}</p>
      </header>
      {availableTabs.length > 0 ? (
        <div className="flex flex-wrap gap-4 border-b border-slate-200">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-left text-sm font-semibold transition ${
                resolvedActiveTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div>{tab.label}</div>
              <p className="text-xs font-normal text-slate-400">{tab.helper}</p>
            </button>
          ))}
        </div>
      ) : null}
      {renderTabContent()}
    </div>
  );
};

export { HRPage };


