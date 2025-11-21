import React, { useCallback, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import type { TeacherScheduleSummary } from '../types';
import {
  analyzeTeacherSchedule,
  apiEnabled,
  saveTeacherScheduleAssignment
} from '../services/api';
import { useAppContext } from '../context/AppContext';

interface TeacherSchedulePageProps {
  language: 'ka' | 'en';
}

const COPY = {
  ka: {
    title: 'მასწავლებლის განრიგი',
    description:
      'ატვირთეთ მასწავლებლის განრიგის PDF ან XLSX ფაილი, რომ ნახოთ რამდენი კემბრიჯისა და ქართული გაკვეთილი აქვს თითო მასწავლებელს.',
    uploadLabel: 'აირჩიეთ ფაილი',
    button: 'განრიგის ანალიზი',
    helper: 'მხოლოდ PDF და XLSX ფაილებია მხარდაჭერილი.',
    apiDisabled: 'API URL არ არის კონფიგურირებული, ამიტომ ატვირთვა გამორთულია.',
    emptyState: 'ატვირთეთ ფაილი ანალიზის სანახავად.',
    totalsLabel: 'ჯამურად',
    permissionDenied: 'ამ გვერდის ნახვის უფლება არ გაქვთ.',
    analyzeDisabled: 'განრიგის ანალიზი ამ როლისთვის გათიშულია.',
    assignDisabled: 'ამ როლს ჩანაწერების ცვლილების უფლება არ აქვს.',
    table: {
      teacher: 'მასწავლებელი',
      cambridge: 'კემბრიჯის გაკვეთილები',
      georgian: 'ქართული გაკვეთილები',
      user: 'მიერთებული მომხმარებელი',
      actions: 'ქმედებები'
    },
    selectUserPlaceholder: 'აირჩიეთ მომხმარებელი',
    saveButtonLabel: 'შენახვა',
    detectedLabel: 'დადგენილი მნიშვნელობა',
    editHint: 'საჭიროების შემთხვევაში შეცვალეთ რაოდენობები და მიუთითეთ შესაბამისი თანამშრომელი.',
    flow: [
      {
        title: 'ფაილის ატვირთვა',
        description: 'აირჩიეთ განრიგის PDF/XLSX ფაილი და ატვირთეთ სისტემაში.'
      },
      {
        title: 'გვერდების დამუშავება',
        description: 'ყოველი გვერდი ან ცალკე ფურცელი წარმოადგენს ერთ მასწავლებელს.'
      },
      {
        title: 'კოდების ამოცნობა',
        description: 'Regex-ით ვპოულობთ კემბრიჯის (\d+C-A) და ქართული (\d+-A) გაკვეთილების კოდებს.'
      },
      {
        title: 'გადამოწმება და მიბმა',
        description: 'შეამოწმეთ შედეგები, საჭიროების შემთხვევაში შეიტანეთ კორექტივები და მიაბით შესაბამის თანამშრომელს.'
      }
    ],
    status: {
      saved: 'შენახულია',
      saving: 'ინახება...',
      error: 'შენახვა ვერ მოხერხდა',
      missingUser: 'გთხოვთ, ჯერ აირჩიოთ მომხმარებელი.',
      noPermission: 'ამ ჩანაწერის რედაქტირების უფლება არ გაქვთ.'
    }
  },
  en: {
    title: 'Teacher schedule',
    description:
      'Upload the teacher schedule PDF or XLSX file to see how many Cambridge and Georgian lessons each teacher has.',
    uploadLabel: 'Choose file',
    button: 'Analyze schedule',
    helper: 'Only PDF and XLSX files are supported.',
    apiDisabled: 'API URL is not configured, so uploads are disabled.',
    emptyState: 'Upload a file to see the analysis.',
    totalsLabel: 'Totals',
    permissionDenied: 'You do not have permission to view this page.',
    analyzeDisabled: 'Schedule analysis is disabled for your role.',
    assignDisabled: 'Assignments are read-only for your role.',
    table: {
      teacher: 'Teacher',
      cambridge: 'Cambridge lessons',
      georgian: 'Georgian lessons',
      user: 'Assigned user',
      actions: 'Actions'
    },
    selectUserPlaceholder: 'Select a user',
    saveButtonLabel: 'Save',
    detectedLabel: 'Detected value',
    editHint: 'Adjust the counts if needed and pick the matching employee.',
    flow: [
      {
        title: 'Upload file',
        description: 'Pick the schedule PDF/XLSX file and send it to the system.'
      },
      {
        title: 'Parse pages',
        description: 'Every page (or sheet) represents a teacher record.'
      },
      {
        title: 'Detect lesson codes',
        description: 'We capture Cambridge (\d+C-A) and Georgian (\d+-A) codes with regex.'
      },
      {
        title: 'Review & assign',
        description: 'Verify results, tweak counts, and assign them to users.'
      }
    ],
    status: {
      saved: 'Saved',
      saving: 'Saving...',
      error: 'Unable to save',
      missingUser: 'Please select a user first.',
      noPermission: 'You do not have permission to edit this record.'
    }
  }
} as const;

const ACCEPTED_EXTENSIONS = ['pdf', 'xlsx'];

type RowDraft = {
  userId: number | '';
  cambridgeCount: number;
  georgianCount: number;
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
};

const formatDateTime = (value: string | null, language: 'ka' | 'en'): string => {
  if (!value) {
    return language === 'ka' ? 'ჯერ არ არის გაანალიზებული' : 'Not analyzed yet';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return language === 'ka' ? '?????? ??????' : 'Unknown date';
  }
  return new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

export const TeacherSchedulePage: React.FC<TeacherSchedulePageProps> = ({ language }) => {
  const { users, refreshTeacherScheduleAssignments, hasPermission } = useAppContext();
  const copy = COPY[language];
  const canView = hasPermission('view_teacher_schedule');
  const canAnalyze = hasPermission('analyze_teacher_schedule');
  const canAssign = hasPermission('assign_teacher_schedule');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<TeacherScheduleSummary[]>([]);
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', language === 'ka' ? 'ka' : 'en')),
    [users, language]
  );

  const buildDrafts = useCallback((teachers: TeacherScheduleSummary[]): Record<string, RowDraft> => {
    const next: Record<string, RowDraft> = {};
    teachers.forEach((teacher) => {
      const assignment = teacher.assignment ?? null;
      next[teacher.teacher] = {
        userId: assignment?.userId ?? '',
        cambridgeCount: assignment?.cambridgeCount ?? teacher.cambridgeCount,
        georgianCount: assignment?.georgianCount ?? teacher.georgianCount,
        status: assignment ? 'saved' : 'idle'
      };
    });
    return next;
  }, []);

  const updateRowDraft = useCallback((teacher: string, updates: Partial<RowDraft>) => {
    setRowDrafts((previous) => ({
      ...previous,
      [teacher]: {
        userId: previous[teacher]?.userId ?? '',
        cambridgeCount: previous[teacher]?.cambridgeCount ?? 0,
        georgianCount: previous[teacher]?.georgianCount ?? 0,
        status: previous[teacher]?.status ?? 'idle',
        ...updates
      }
    }));
  }, []);

  const handleCountChange = useCallback(
    (teacher: string, field: 'cambridgeCount' | 'georgianCount', value: number) => {
      if (!canAssign) {
        return;
      }
      updateRowDraft(teacher, {
        [field]: Number.isNaN(value) ? 0 : value,
        status: 'idle',
        message: undefined
      } as Partial<RowDraft>);
    },
    [canAssign, updateRowDraft]
  );

  const handleUserChange = useCallback(
    (teacher: string, value: string) => {
      if (!canAssign) {
        return;
      }
      updateRowDraft(teacher, {
        userId: value === '' ? '' : Number(value),
        status: 'idle',
        message: undefined
      });
    },
    [canAssign, updateRowDraft]
  );

  const handleSaveAssignment = useCallback(
    async (teacher: string) => {
      const draft = rowDrafts[teacher];
      if (!draft) {
        return;
      }
      if (!canAssign) {
        updateRowDraft(teacher, {
          status: 'error',
          message: copy.status.noPermission
        });
        return;
      }
      if (!draft.userId) {
        updateRowDraft(teacher, {
          status: 'error',
          message: copy.status.missingUser
        });
        return;
      }
      if (!apiEnabled) {
        updateRowDraft(teacher, {
          status: 'error',
          message: copy.apiDisabled
        });
        return;
      }

      updateRowDraft(teacher, { status: 'saving', message: undefined });
      try {
        const response = await saveTeacherScheduleAssignment({
          teacher,
          userId: draft.userId,
          cambridgeCount: draft.cambridgeCount,
          georgianCount: draft.georgianCount
        });
        await refreshTeacherScheduleAssignments();
        updateRowDraft(teacher, {
          status: 'saved',
          message: copy.status.saved,
          cambridgeCount: response.assignment.cambridgeCount,
          georgianCount: response.assignment.georgianCount
        });
      } catch (saveError) {
        updateRowDraft(teacher, {
          status: 'error',
          message: saveError instanceof Error ? saveError.message : copy.status.error
        });
      }
    },
    [apiEnabled, canAssign, copy.apiDisabled, copy.status.error, copy.status.missingUser, copy.status.noPermission, copy.status.saved, refreshTeacherScheduleAssignments, rowDrafts, updateRowDraft]
  );

  const totals = useMemo(
    () =>
      results.reduce(
        (acc, teacher) => {
          acc.cambridge += teacher.cambridgeCount;
          acc.georgian += teacher.georgianCount;
          return acc;
        },
        { cambridge: 0, georgian: 0 }
      ),
    [results]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAnalyze) {
      setError(copy.analyzeDisabled);
      return;
    }
    if (!selectedFile) {
      setError(copy.helper);
      return;
    }
    const extension = selectedFile.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(copy.helper);
      return;
    }
    if (!apiEnabled) {
      setError(copy.apiDisabled);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await analyzeTeacherSchedule(selectedFile);
      const teachers = response.teachers ?? [];
      setResults(teachers);
      setRowDrafts(buildDrafts(teachers));
      setLastRunAt(new Date().toISOString());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to analyze file.');
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="text-slate-600">{copy.description}</p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-600">{copy.permissionDenied}</p>
        </div>
      </div>
    );
  }

  const uploadDisabled = !canAnalyze || !apiEnabled;
  const assignmentLocked = !canAssign;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
        <p className="text-slate-600">{copy.description}</p>
        <p className="text-sm text-slate-500">
          {language === 'ka' ? '???? ???????:' : 'Last analysis:'}{' '}
          <span className="font-medium text-slate-700">{formatDateTime(lastRunAt, language)}</span>
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COPY[language].flow.map((step, index) => (
          <article key={step.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              STEP {String(index + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-2 text-base font-semibold text-slate-900">{step.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{step.description}</p>
          </article>
        ))}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label
            className={`flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-6 text-center transition ${
              uploadDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <Upload className="h-8 w-8 text-blue-500" />
            <span className="font-medium text-slate-900">{copy.uploadLabel}</span>
            <span className="text-sm text-slate-500">
              {selectedFile ? selectedFile.name : copy.helper}
            </span>
            <input
              type="file"
              accept=".pdf,.xlsx"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploadDisabled}
            />
          </label>
          <button
            type="submit"
            disabled={uploadDisabled || loading || !selectedFile}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {language === 'ka' ? 'მუშავდება...' : 'Processing...'}
              </span>
            ) : (
              copy.button
            )}
          </button>
        </div>
        {uploadDisabled && <p className="mt-4 text-sm text-amber-600">{copy.analyzeDisabled}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {!apiEnabled && <p className="mt-4 text-sm text-amber-600">{copy.apiDisabled}</p>}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {language === 'ka' ? '???????? ??????' : 'Analysis result'}
            </h2>
            <p className="text-sm text-slate-500">{copy.editHint}</p>
            {assignmentLocked && <p className="text-xs text-amber-600">{copy.assignDisabled}</p>}
          </div>
          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {copy.totalsLabel}: Cambridge {totals.cambridge} / Georgian {totals.georgian}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">{copy.table.teacher}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">{copy.table.cambridge}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">{copy.table.georgian}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">{copy.table.user}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">{copy.table.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                    {copy.emptyState}
                  </td>
                </tr>
              ) : (
                results.map((teacher) => {
                  const row =
                    rowDrafts[teacher.teacher] ?? {
                      userId: '',
                      cambridgeCount: teacher.cambridgeCount,
                      georgianCount: teacher.georgianCount,
                      status: 'idle'
                    };

                  return (
                    <tr key={`${teacher.teacher}-${teacher.cambridgeCount}-${teacher.georgianCount}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{teacher.teacher}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            min={0}
                            value={row.cambridgeCount}
                            onChange={(event) =>
                              handleCountChange(teacher.teacher, 'cambridgeCount', Number(event.target.value))
                            }
                            disabled={assignmentLocked}
                            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              assignmentLocked ? 'bg-slate-100 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-xs text-slate-500">
                            {copy.detectedLabel}: {teacher.cambridgeCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            min={0}
                            value={row.georgianCount}
                            onChange={(event) =>
                              handleCountChange(teacher.teacher, 'georgianCount', Number(event.target.value))
                            }
                            disabled={assignmentLocked}
                            className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              assignmentLocked ? 'bg-slate-100 cursor-not-allowed' : ''
                            }`}
                          />
                          <span className="text-xs text-slate-500">
                            {copy.detectedLabel}: {teacher.georgianCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={row.userId === '' ? '' : String(row.userId)}
                          onChange={(event) => handleUserChange(teacher.teacher, event.target.value)}
                          disabled={assignmentLocked}
                          className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            assignmentLocked ? 'bg-slate-100 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">{copy.selectUserPlaceholder}</option>
                          {sortedUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveAssignment(teacher.teacher)}
                            disabled={
                              assignmentLocked ||
                              row.status === 'saving' ||
                              !apiEnabled ||
                              !row.userId
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {row.status === 'saving' ? copy.status.saving : copy.saveButtonLabel}
                          </button>
                          {row.message && (
                            <p className={`text-xs ${row.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                              {row.message}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
