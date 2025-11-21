import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { TeacherClassHoursDay, TeacherClassHoursPlan } from '../types';

interface LearningPageProps {
  language: 'ka' | 'en';
}

const WEEKDAYS: { key: TeacherClassHoursDay['dayOfWeek']; labels: { ka: string; en: string } }[] = [
  { key: 'monday', labels: { ka: 'ორშაბათი', en: 'Monday' } },
  { key: 'tuesday', labels: { ka: 'სამშაბათი', en: 'Tuesday' } },
  { key: 'wednesday', labels: { ka: 'ოთხშაბათი', en: 'Wednesday' } },
  { key: 'thursday', labels: { ka: 'ხუთშაბათი', en: 'Thursday' } },
  { key: 'friday', labels: { ka: 'პარასკევი', en: 'Friday' } },
  { key: 'saturday', labels: { ka: 'შაბათი', en: 'Saturday' } },
  { key: 'sunday', labels: { ka: 'კვირა', en: 'Sunday' } }
];

const defaultDays = (): TeacherClassHoursDay[] =>
  WEEKDAYS.map((day) => ({
    dayOfWeek: day.key,
    cambridgeHours: 0,
    georgianHours: 0
  }));

const copy = {
  ka: {
    title: 'სასწავლო ნაწილი',
    subtitle: 'დააკავშირე კემბრიჯისა და ქართული საათები მასწავლებლებზე კვირის ჭრილში.',
    selectLabel: 'აირჩიე მასწავლებელი',
    searchPlaceholder: 'ძებნა სახელით ან საგნით',
    subjectLabel: 'საგანი',
    campusHint: 'ჩატვირთულია მხოლოდ შენი კამპუსის მასწავლებლები.',
    tableHead: { day: 'კვირის დღე', cambridge: 'კემბრიჯი', georgian: 'ქართული' },
    save: 'შენახვა',
    saving: 'ინახება...',
    saved: 'განრიგი შენახულია',
    error: 'შენახვა ვერ მოხერხდა',
    emptyUsers: 'ამ კამპუსში მომხმარებელი არაა',
    summaryTitle: 'დამახსოვრებული განრიგები',
    summaryEmpty: 'ჯერ არაფერი შეგინახავთ.',
    updatedAt: 'განახლდა',
    selectUserFirst: 'ჯერ აირჩიეთ მომხმარებელი',
    totals: 'ჯამი'
  },
  en: {
    title: 'Learning workspace',
    subtitle: 'Assign weekly Cambridge/Georgian hours to each teacher by campus.',
    selectLabel: 'Choose a teacher',
    searchPlaceholder: 'Search by name or subject',
    subjectLabel: 'Subject',
    campusHint: 'Only teachers from your campus are shown.',
    tableHead: { day: 'Weekday', cambridge: 'Cambridge', georgian: 'Georgian' },
    save: 'Save',
    saving: 'Saving...',
    saved: 'Schedule saved',
    error: 'Unable to save',
    emptyUsers: 'No users available for this campus',
    summaryTitle: 'Saved schedules',
    summaryEmpty: 'No schedules saved yet.',
    updatedAt: 'Updated',
    selectUserFirst: 'Please select a user first',
    totals: 'Totals'
  }
} as const;

const enrichDays = (plan: TeacherClassHoursPlan | undefined): TeacherClassHoursDay[] => {
  if (!plan) {
    return defaultDays();
  }

  const map = new Map(plan.days.map((item) => [item.dayOfWeek, item]));
  return WEEKDAYS.map((day) => ({
    dayOfWeek: day.key,
    cambridgeHours: map.get(day.key)?.cambridgeHours ?? 0,
    georgianHours: map.get(day.key)?.georgianHours ?? 0
  }));
};

export const LearningPage: React.FC<LearningPageProps> = ({ language }) => {
  const { users, teacherClassHours, refreshTeacherClassHours, saveTeacherClassHours, hasPermission } =
    useAppContext();
  const canManage = hasPermission('manage_learning');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [days, setDays] = useState<TeacherClassHoursDay[]>(defaultDays);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshTeacherClassHours();
  }, [refreshTeacherClassHours]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === '') {
      return users;
    }
    return users.filter((user) => {
      const haystack = `${user.name ?? ''} ${user.subject ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [search, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  useEffect(() => {
    setDays(defaultDays());
    if (!selectedUserId) {
      return;
    }
    const plan = teacherClassHours.find((item) => item.userId === selectedUserId);
    setDays(enrichDays(plan));
  }, [selectedUserId, teacherClassHours]);

  const handleDayChange = (dayKey: TeacherClassHoursDay['dayOfWeek'], field: 'cambridgeHours' | 'georgianHours', value: number) => {
    if (!canManage) return;
    setDays((current) =>
      current.map((day) =>
        day.dayOfWeek === dayKey
          ? {
              ...day,
              [field]: Number.isNaN(value) ? 0 : Math.max(0, value)
            }
          : day
      )
    );
    setStatus('idle');
    setMessage(null);
  };

  const handleSave = async () => {
    if (!canManage) {
      setStatus('error');
      setMessage(copy[language].error);
      return;
    }
    if (!selectedUserId) {
      setStatus('error');
      setMessage(copy[language].selectUserFirst);
      return;
    }

    setStatus('saving');
    setMessage(null);
    const saved = await saveTeacherClassHours(selectedUserId, days);
    if (saved) {
      setStatus('success');
      setMessage(copy[language].saved);
    } else {
      setStatus('error');
      setMessage(copy[language].error);
    }
  };

  const summary = useMemo(() => {
    return teacherClassHours.map((plan) => {
      const user = users.find((item) => item.id === plan.userId);
      const totals = plan.days.reduce(
        (acc, day) => {
          acc.cambridge += Number(day.cambridgeHours ?? 0);
          acc.georgian += Number(day.georgianHours ?? 0);
          return acc;
        },
        { cambridge: 0, georgian: 0 }
      );

      return {
        userName: user?.name ?? `#${plan.userId}`,
        subject: user?.subject ?? '—',
        totals,
        updatedAt: plan.updatedAt ?? null,
        userId: plan.userId
      };
    });
  }, [teacherClassHours, users]);

  const formatUpdatedAt = (value: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{copy[language].title}</h1>
        <p className="text-slate-600 mt-2">{copy[language].error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">{copy[language].title}</h1>
        <p className="text-slate-600">{copy[language].subtitle}</p>
        <p className="text-xs text-slate-500">{copy[language].campusHint}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{copy[language].selectLabel}</h2>
          <p className="text-sm text-slate-500">{copy[language].searchPlaceholder}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy[language].searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedUserId ?? ''}
              onChange={(event) => setSelectedUserId(event.target.value === '' ? null : Number(event.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-72"
            >
              <option value="">{copy[language].selectLabel}</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {!filteredUsers.length && (
            <p className="text-sm text-amber-600">{copy[language].emptyUsers}</p>
          )}

          {selectedUser && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedUser.name}</p>
                <p className="text-xs text-slate-600">
                  {copy[language].subjectLabel}: {selectedUser.subject ?? '—'}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                ID {selectedUser.id}
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">{copy[language].tableHead.day}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">{copy[language].tableHead.cambridge}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">{copy[language].tableHead.georgian}</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">{copy[language].totals}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {days.map((day) => (
                  <tr key={day.dayOfWeek}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {WEEKDAYS.find((d) => d.key === day.dayOfWeek)?.labels[language] ?? day.dayOfWeek}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={day.cambridgeHours}
                        onChange={(event) =>
                          handleDayChange(day.dayOfWeek, 'cambridgeHours', Number(event.target.value))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={day.georgianHours}
                        onChange={(event) =>
                          handleDayChange(day.dayOfWeek, 'georgianHours', Number(event.target.value))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {day.cambridgeHours + day.georgianHours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedUserId || status === 'saving'}
              className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
            >
              {status === 'saving' ? copy[language].saving : copy[language].save}
            </button>
            {message && (
              <p
                className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{copy[language].summaryTitle}</h2>
          <p className="text-sm text-slate-500">{copy[language].campusHint}</p>
        </div>
        <div className="p-6 overflow-x-auto">
          {summary.length === 0 ? (
            <p className="text-sm text-slate-600">{copy[language].summaryEmpty}</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {copy[language].selectLabel}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {copy[language].subjectLabel}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {copy[language].tableHead.cambridge}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {copy[language].tableHead.georgian}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    {copy[language].updatedAt}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map((row) => (
                  <tr key={row.userId}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.userName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.subject}</td>
                    <td className="px-4 py-3 text-slate-700">{row.totals.cambridge}</td>
                    <td className="px-4 py-3 text-slate-700">{row.totals.georgian}</td>
                    <td className="px-4 py-3 text-slate-700">{formatUpdatedAt(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};
