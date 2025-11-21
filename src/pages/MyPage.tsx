import React, { FormEvent, useMemo, useState } from 'react';



import { CalendarDays, Clock3, Info, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';



import type { CompensationBonus, Weekday, WorkScheduleDay } from '../types';



import { useAppContext } from '../context/AppContext';



import { sanitizeWorkSchedule, WEEKDAY_ORDER } from '../utils/workSchedule';







interface MyPageProps {



  language: 'ka' | 'en';



}







const DAY_LABELS: Record<MyPageProps['language'], Record<Weekday, string>> = {



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



  MyPageProps['language'],



  {



    title: string;



    subtitle: string;



    profileHeading: string;



    roleLabel: string;



    contactHeading: string;



    email: string;



    phone: string;



    personalId: string;



    tabs: { id: TabId; label: string }[];



    personalDetails: string;



    workDetails: string;



    security: string;



    permissions: string;



    contactInfo: string;



    fullNameLabel: string;



    jobTitleLabel: string;



    personalIdLabel: string;



    save: string;



    cancel: string;



    readOnlyHint: string;



    statsHeading: string;

    vacationLeft: string;

    graceLeft: string;

    totalSalaryLabel: string;

    salaryLabel: string;

    bonusLabel: string;

    hoursUnit: string;

    salaryBreakdownHeading: string;

    grossSalaryLabel: string;

    taxLabel: string;

    deductionsLabel: string;

    deductionsEmpty: string;

    netSalaryLabel: string;

    cambridgeBreakdown: string;

    georgianBreakdown: string;

    perLessonSuffix: string;

    selectedBonusesLabel: string;
    extraBonusLabel: string;
    extraBonusHoursLabel: string;

    selectedBonusesEmpty: string;

    scheduleHeading: string;

    workingHoursLabel: string;

    dayOff: string;

    securityDescription: string;

    currentPassword: string;

    newPassword: string;

    confirmPassword: string;

    updatePassword: string;

    permissionsHint: string;

    permissionsEmpty: string;

    missingUser: string;



  }



> = {



  ka: {



    title: 'ჩემი პროფილი',



    subtitle: 'გადახედეთ პირად პროფილს, განრიგსა და ხელმისაწვდომ ბალანსებს.',



    profileHeading: 'პირადი ინფორმაცია',



    roleLabel: 'როლი',



    contactHeading: 'კონტაქტის დეტალები',



    email: 'ელ-ფოსტა',



    phone: 'ტელეფონი',



    personalId: 'პირადი ნომერი',



    tabs: [



      { id: 'personal', label: 'პირადი მონაცემები' },



      { id: 'work', label: 'სამუშაო დეტალები' },



      { id: 'security', label: 'უსაფრთხოება' },



      { id: 'permissions', label: 'ნებართვები' }



    ],



    personalDetails: 'პირადი მონაცემები',



    workDetails: 'სამუშაო დეტალები',



    security: 'უსაფრთხოება',



    permissions: 'ნებართვები',



    contactInfo: 'საკონტაქტო ინფორმაცია',



    fullNameLabel: 'სრული სახელი',



    jobTitleLabel: 'თანამდებობა',



    personalIdLabel: 'პირადი ნომერი',



    save: 'ცვლილებების შენახვა',



    cancel: 'გაუქმება',



    readOnlyHint: 'ინფორმაციის შეცვლა შესაძლებელი იქნება მომდევნო განახლებაში.',



    statsHeading: 'მოკლე მიმოხილვა',



    vacationLeft: 'დარჩენილი შვებულება',



    graceLeft: 'გრეისის საათები',



    totalSalaryLabel: 'ჯამური ხელფასი',



    salaryLabel: 'საბაზო',



    bonusLabel: 'ბონუსი',



    hoursUnit: 'საათები',



    salaryBreakdownHeading: 'ხელფასის დეტალები',



    grossSalaryLabel: 'მთლიანი ხელფასი',



    taxLabel: 'გადასახადი',



    deductionsLabel: 'Taxes & deductions',



    deductionsEmpty: 'დაკლა არ არის',



    netSalaryLabel: 'სუფთა ხელფასი',



    cambridgeBreakdown: 'კემბრიჯის ბონუსი',



    georgianBreakdown: 'ქართული ბონუსი',



    perLessonSuffix: 'ლარი / გაკვეთილი',



    selectedBonusesLabel: 'დამატებითი ბონუსები',
    extraBonusLabel: 'ზეგანაკვეთური ბონუსი',
    extraBonusHoursLabel: 'დამტკიცებული ზეგანაკვეთური საათები',
    selectedBonusesEmpty: 'ბონუსი არჩეული არ არის',



    scheduleHeading: 'სამუშაო განრიგი',



    workingHoursLabel: 'სამუშაო საათები',



    dayOff: 'დასვენების დღე',



    securityDescription: 'უსაფრთხოების მიზნით რეგულარულად შეცვალეთ პაროლი და არ გააზიაროთ იგი.',



    currentPassword: 'მიმდინარე პაროლი',



    newPassword: 'ახალი პაროლი',



    confirmPassword: 'პაროლის დადასტურება',



    updatePassword: 'პაროლის განახლება',



    permissionsHint: 'თქვენ გაქვთ შემდეგი ნებართვები მითითებული როლის მიხედვით.',



    permissionsEmpty: 'ამ როლისთვის ნებართვები არ არის განსაზღვრული.',



    missingUser: 'მომხმარებლის მონაცემები მიუწვდომელია.',



  },



  en: {



    title: 'My Profile',



    subtitle: 'Review your profile, schedule, and available balances.',



    profileHeading: 'Personal information',



    roleLabel: 'Role',



    contactHeading: 'Contact details',



    email: 'Email',



    phone: 'Phone',



    personalId: 'Personal ID',



    tabs: [



      { id: 'personal', label: 'Personal details' },



      { id: 'work', label: 'Work details' },



      { id: 'security', label: 'Security' },



      { id: 'permissions', label: 'My permissions' }



    ],



    personalDetails: 'Personal details',



    workDetails: 'Work details',



    security: 'Security',



    permissions: 'My permissions',



    contactInfo: 'Contact information',



    fullNameLabel: 'Full name',



    jobTitleLabel: 'Job title',



    personalIdLabel: 'Personal ID',



    save: 'Save changes',



    cancel: 'Cancel',



    readOnlyHint: 'Editing from this view is coming soon.',



    statsHeading: 'At a glance',



    vacationLeft: 'Vacation days left',



    graceLeft: 'Grace hours remaining',



    totalSalaryLabel: 'Total salary',



    salaryLabel: 'Base',



    bonusLabel: 'Bonus',



    hoursUnit: 'hours',



    salaryBreakdownHeading: 'Salary breakdown',



    grossSalaryLabel: 'Gross salary',



    taxLabel: 'Tax',



    deductionsLabel: 'Taxes & deductions',



    deductionsEmpty: 'No deductions applied.',



    netSalaryLabel: 'Net salary',



    cambridgeBreakdown: 'Cambridge bonus',



    georgianBreakdown: 'Georgian bonus',



    perLessonSuffix: 'per lesson',



    selectedBonusesLabel: 'Selected bonuses',
    extraBonusLabel: 'Extra hours bonus',
    extraBonusHoursLabel: 'Approved extra hours',



    selectedBonusesEmpty: 'No optional bonuses selected.',



    scheduleHeading: 'Work schedule',



    workingHoursLabel: 'Working hours',



    dayOff: 'Day off',



    securityDescription: 'For best security, update your password regularly and never share it.',



    currentPassword: 'Current password',



    newPassword: 'New password',



    confirmPassword: 'Confirm password',



    updatePassword: 'Update password',



    permissionsHint: 'You currently have the following permissions assigned to your role.',



    permissionsEmpty: 'No permissions are configured for this role.',



    missingUser: 'User data is unavailable.',



  }



};







type TabId = 'personal' | 'work' | 'security' | 'permissions';







const formatTimeRange = (entry: WorkScheduleDay): string =>



  `${entry.startTime ?? '--:--'} - ${entry.endTime ?? '--:--'}`;







const formatCurrency = (value: number, language: 'ka' | 'en'): string =>



  new Intl.NumberFormat(language === 'ka' ? 'ka-GE' : 'en-US', {



    style: 'currency',



    currency: 'GEL',



    minimumFractionDigits: 2,



    maximumFractionDigits: 2



  }).format(value);







const capitalize = (value: string): string =>



  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');







const groupPermissions = (permissionIds: string[]) => {



  const groups = new Map<string, string[]>();



  permissionIds.forEach((permission) => {



    const [category, action] = permission.split('_');



    const key = category ?? 'general';



    const formatted = action ? `${capitalize(action)}` : capitalize(permission);



    groups.set(key, [...(groups.get(key) ?? []), formatted]);



  });



  return Array.from(groups.entries()).map(([category, actions]) => ({



    category,



    actions



  }));



};







const PersonalDetailsTab: React.FC<{



  language: MyPageProps['language'];



  copy: (typeof COPY)['en'];



  currentUserName: string;



  jobTitle: string;



  email: string;



  phone: string;



  personalId: string;



}> = ({ language, copy, currentUserName, jobTitle, email, phone, personalId }) => {



  const [pendingValues, setPendingValues] = useState({



    name: currentUserName,



    jobTitle,



    email,



    phone,



    personalId



  });







  const handleChange = (field: keyof typeof pendingValues) => (event: React.ChangeEvent<HTMLInputElement>) =>



    setPendingValues((prev) => ({ ...prev, [field]: event.target.value }));







  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



  };







  return (



    <form onSubmit={handleSubmit} className="space-y-6">



      <div className="grid gap-6 md:grid-cols-2">



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.fullNameLabel}</span>



          <input



            value={pendingValues.name}



            onChange={handleChange('name')}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



            readOnly



          />



        </label>



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.jobTitleLabel}</span>



          <input



            value={pendingValues.jobTitle}



            onChange={handleChange('jobTitle')}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



            readOnly



          />



        </label>



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.email}</span>



          <input



            type="email"



            value={pendingValues.email}



            onChange={handleChange('email')}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



            readOnly



          />



        </label>



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.phone}</span>



          <input



            value={pendingValues.phone}



            onChange={handleChange('phone')}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



            readOnly



          />



        </label>



        <label className="flex flex-col gap-2 text-sm md:col-span-2">



          <span className="font-medium text-slate-700">{copy.personalIdLabel}</span>



          <input



            value={pendingValues.personalId}



            onChange={handleChange('personalId')}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



            readOnly



          />



        </label>



      </div>



      <p className="text-sm text-slate-500">{copy.readOnlyHint}</p>



      <div className="flex gap-3">



        <button



          type="button"



          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"



          disabled



        >



          {copy.cancel}



        </button>



        <button



          type="submit"



          disabled



          className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:bg-slate-300"



        >



          {copy.save}



        </button>



      </div>



    </form>



  );



};







type SalaryDeductionRow = {



  id: string;



  label: string;



  amount: number;



  mode: 'percent' | 'fixed';



  configuredValue: number;



};







type SelectedBonusBreakdownRow = {



  id: number;



  name: string;



  percent: number | null;



  amount: number | null;



  value: number;



};







const WorkDetailsTab: React.FC<{



  language: MyPageProps['language'];



  copy: (typeof COPY)['en'];



  vacationRemaining: number;



  vacationUsed: number;



  vacationTotal: number;



  graceRemaining: number;



  totalSalary: number;



  baseSalary: number;



  lessonBonus: number;

  extraBonusTotal: number;

  extraBonusHours: number;



  grossSalary: number;



  taxRate: number;



  taxAmount: number;



  cambridgeBonus: number;



  georgianBonus: number;



  cambridgeCount: number;



  georgianCount: number;



  cambridgeRate: number;



  georgianRate: number;



  deductions: SalaryDeductionRow[];



  selectedBonuses: SelectedBonusBreakdownRow[];



  selectedBonusTotal: number;



  schedule: WorkScheduleDay[];



}> = ({



  language,



  copy,



  vacationRemaining,



  vacationUsed,



  vacationTotal,



  graceRemaining,



  totalSalary,



  baseSalary,



  lessonBonus,
  extraBonusTotal,

  extraBonusHours,



  grossSalary,



  taxRate,



  taxAmount,



  cambridgeBonus,



  georgianBonus,



  cambridgeCount,



  georgianCount,



  cambridgeRate,



  georgianRate,



  deductions,



  selectedBonuses,



  selectedBonusTotal,



  schedule



}) => {



  const additionalDeductionTotal = deductions.reduce((sum, entry) => sum + entry.amount, 0);



  const hasDeductions = deductions.length > 0;



  const hasSelectedBonuses = selectedBonuses.length > 0;







  return (



    <div className="space-y-6">



      <section className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm">



        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">



          <Info className="h-4 w-4 text-blue-500" />



          {copy.statsHeading}



        </h3>



        <div className="grid gap-4 md:grid-cols-3">



          <div className="rounded-xl bg-white p-4 shadow-sm">



            <p className="text-xs uppercase tracking-wide text-slate-500">{copy.vacationLeft}</p>



            <p className="text-2xl font-semibold text-slate-900">{vacationRemaining}</p>



            <p className="text-xs text-slate-500">



              {vacationUsed}/{vacationTotal}



            </p>



          </div>



          <div className="rounded-xl bg-white p-4 shadow-sm">



            <p className="text-xs uppercase tracking-wide text-slate-500">{copy.graceLeft}</p>



            <p className="text-2xl font-semibold text-slate-900">{graceRemaining.toFixed(1)}</p>



            <p className="text-xs text-slate-500">{copy.hoursUnit}</p>



          </div>



          <div className="rounded-xl bg-white p-4 shadow-sm">



            <p className="text-xs uppercase tracking-wide text-slate-500">{copy.totalSalaryLabel}</p>



            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalSalary, language)}</p>



            <div className="mt-2 space-y-1 text-xs text-slate-500">



              <p>



                {copy.grossSalaryLabel}: {formatCurrency(grossSalary, language)}



              </p>



              <p>
                {copy.salaryLabel}: {formatCurrency(baseSalary, language)} ? {copy.bonusLabel}:{' '}
                {formatCurrency(lessonBonus, language)}
              </p>
              {extraBonusTotal > 0 ? (
                <p>
                  {copy.extraBonusLabel}: {formatCurrency(extraBonusTotal, language)}
                  {extraBonusHours > 0 ? ` (${copy.extraBonusHoursLabel}: ${extraBonusHours.toFixed(1)})` : ''}
                </p>
              ) : null}



              {hasSelectedBonuses ? (



                <p>



                  {copy.selectedBonusesLabel}: {formatCurrency(selectedBonusTotal, language)}



                </p>



              ) : null}



              <p>



                {copy.taxLabel} ({taxRate.toFixed(1)}%): -{formatCurrency(taxAmount, language)}



              </p>



              {hasDeductions ? (



                deductions.map((entry) => (



                  <p key={entry.id}>



                    {entry.label}{' '}



                    {entry.mode === 'percent' ? `(${entry.configuredValue.toFixed(1)}%)` : ''}: -



                    {formatCurrency(entry.amount, language)}



                  </p>



                ))



              ) : (



                <p>{copy.deductionsEmpty}</p>



              )}



            </div>



          </div>



        </div>



      </section>







      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">



        <div className="mb-4 flex items-center gap-2">



          <CalendarDays className="h-5 w-5 text-amber-500" />



          <h3 className="text-lg font-semibold text-slate-900">{copy.salaryBreakdownHeading}</h3>



        </div>



        <div className="divide-y divide-slate-100 text-sm text-slate-700">



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">{copy.salaryLabel}</span>



            <span className="font-semibold text-slate-900">{formatCurrency(baseSalary, language)}</span>



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">



              {copy.cambridgeBreakdown} ({cambridgeCount} × {formatCurrency(cambridgeRate, language)})



            </span>



            <span className="font-semibold text-slate-900">{formatCurrency(cambridgeBonus, language)}</span>



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">



              {copy.georgianBreakdown} ({georgianCount} × {formatCurrency(georgianRate, language)})



            </span>



            <span className="font-semibold text-slate-900">{formatCurrency(georgianBonus, language)}</span>



          </div>



          <div className="py-3">



            <div className="flex items-center justify-between">



              <span className="text-slate-500">{copy.selectedBonusesLabel}</span>



              <span className={`font-semibold ${hasSelectedBonuses ? 'text-emerald-600' : 'text-slate-600'}`}>



                {hasSelectedBonuses



                  ? `+${formatCurrency(selectedBonusTotal, language)}`



                  : copy.selectedBonusesEmpty}



              </span>



            </div>



            {hasSelectedBonuses ? (



              <ul className="mt-2 space-y-1 text-xs text-slate-500">



                {selectedBonuses.map((bonus) => (



                  <li key={bonus.id} className="flex items-center justify-between">



                    <span>



                      {bonus.name}



                      {bonus.percent !== null ? ` (${bonus.percent}%)` : ''}



                      {bonus.percent !== null && bonus.amount !== null && bonus.amount !== 0 ? ' + ' : ''}



                      {bonus.amount !== null && bonus.amount !== 0 ? formatCurrency(bonus.amount, language) : ''}



                    </span>



                    <span className="font-semibold text-slate-900">



                      {formatCurrency(bonus.value, language)}



                    </span>



                  </li>



                ))}



              </ul>



            ) : null}



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">{copy.grossSalaryLabel}</span>



            <span className="font-semibold text-slate-900">{formatCurrency(grossSalary, language)}</span>



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">{copy.taxLabel}</span>



            <span className="font-semibold text-slate-900">-{formatCurrency(taxAmount, language)}</span>



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">{copy.deductionsLabel}</span>



            <span className="font-semibold text-slate-900">



              {hasDeductions ? `-${formatCurrency(additionalDeductionTotal, language)}` : copy.deductionsEmpty}



            </span>



          </div>



          <div className="flex items-center justify-between py-3">



            <span className="text-slate-500">{copy.netSalaryLabel}</span>



            <span className="text-lg font-semibold text-slate-900">



              {formatCurrency(totalSalary, language)}



            </span>



          </div>



        </div>



      </section>







      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">



        <div className="flex items-center gap-2">



          <CalendarDays className="h-5 w-5 text-blue-500" />



          <h3 className="text-lg font-semibold text-slate-900">{copy.scheduleHeading}</h3>



        </div>



        <div className="mt-4 overflow-x-auto">



          <table className="w-full text-sm text-slate-600">



            <thead>



              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">



                <th className="py-2 text-left">{language === 'ka' ? 'დღე' : 'Day'}</th>



                <th className="py-2 text-left">{copy.workingHoursLabel}</th>



              </tr>



            </thead>



            <tbody>



              {WEEKDAY_ORDER.map((day) => {



                const entry =



                  schedule.find((item) => item.dayOfWeek === day) ??



                  ({



                    dayOfWeek: day,



                    isWorking: false,



                    startTime: null,



                    endTime: null,



                    breakMinutes: 0



                  } as WorkScheduleDay);



                const isWorking = entry.isWorking;



                return (



                  <tr key={day} className="border-b border-slate-100 last:border-0">



                    <td className="py-2 font-medium text-slate-800">{DAY_LABELS[language][day]}</td>



                    <td className="py-2">



                      {isWorking ? (



                        <span className="inline-flex items-center gap-2">



                          <Clock3 className="h-4 w-4 text-emerald-500" />



                          {formatTimeRange(entry)}



                        </span>



                      ) : (



                        <span className="text-slate-400">{copy.dayOff}</span>



                      )}



                    </td>



                  </tr>



                );



              })}



            </tbody>



          </table>



        </div>



      </section>



    </div>



  );



};



const SecurityTab: React.FC<{ copy: (typeof COPY)['en'] }> = ({ copy }) => {



  const [form, setForm] = useState({



    current: '',



    next: '',



    confirm: ''



  });



  const [message, setMessage] = useState<string | null>(null);







  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {



    event.preventDefault();



    setMessage('Password updates will be available soon.');



  };







  return (



    <form onSubmit={handleSubmit} className="space-y-6">



      <p className="text-sm text-slate-500">{copy.securityDescription}</p>



      <div className="grid gap-6 md:grid-cols-2">



        <label className="flex flex-col gap-2 text-sm md:col-span-2">



          <span className="font-medium text-slate-700">{copy.currentPassword}</span>



          <input



            type="password"



            value={form.current}



            onChange={(event) => setForm((prev) => ({ ...prev, current: event.target.value }))}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



          />



        </label>



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.newPassword}</span>



          <input



            type="password"



            value={form.next}



            onChange={(event) => setForm((prev) => ({ ...prev, next: event.target.value }))}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



          />



        </label>



        <label className="flex flex-col gap-2 text-sm">



          <span className="font-medium text-slate-700">{copy.confirmPassword}</span>



          <input



            type="password"



            value={form.confirm}



            onChange={(event) => setForm((prev) => ({ ...prev, confirm: event.target.value }))}



            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"



          />



        </label>



      </div>



      {message && <p className="text-sm text-slate-500">{message}</p>}



      <button



        type="submit"



        className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow"



      >



        {copy.updatePassword}



      </button>



    </form>



  );



};







const PermissionsTab: React.FC<{



  copy: (typeof COPY)['en'];



  permissionIds: string[];



}> = ({ copy, permissionIds }) => {



  if (permissionIds.length === 0) {



    return <p className="text-sm text-slate-500">{copy.permissionsEmpty}</p>;



  }







  const groups = groupPermissions(permissionIds);







  return (



    <div className="space-y-4 text-sm text-slate-700">



      <p className="text-slate-500">{copy.permissionsHint}</p>



      {groups.map((group) => (



        <div key={group.category} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">



          <h4 className="text-sm font-semibold text-slate-800">{capitalize(group.category)}</h4>



          <ul className="mt-2 space-y-2 text-slate-600">



            {group.actions.map((action, index) => (



              <li key={`${group.category}-${action}-${index}`} className="flex items-center gap-2">



                <ShieldCheck className="h-4 w-4 text-emerald-500" />



                {action}



              </li>



            ))}



          </ul>



        </div>



      ))}



    </div>



  );



};







const MyPage: React.FC<MyPageProps> = ({ language }) => {



  const {



    currentUser,



    roles,



    teacherScheduleAssignments,



    teacherScheduleBonusRates,



    compensationBonuses,
    applications




  } = useAppContext();



  const copy = COPY[language];



  const [activeTab, setActiveTab] = useState<TabId>('personal');







  if (!currentUser) {



    return <div className="rounded-2xl bg-white p-8 text-center text-slate-600">{copy.missingUser}</div>;



  }







  const role = roles.find((item) => item.id === currentUser.roleId);



  const schedule = useMemo(



    () => sanitizeWorkSchedule(currentUser.workSchedule ?? []),



    [currentUser.workSchedule]



  );







  const vacationTotal = currentUser.vacationDays ?? 0;



  const vacationUsed = currentUser.vacationDaysUsed ?? 0;



  const vacationRemaining = Math.max(0, vacationTotal - vacationUsed);







  const graceAllowedHours = currentUser.lateHoursAllowed ?? 0;



  const graceUsedHours = (currentUser.graceMinutesUsed ?? 0) / 60;



  const graceRemaining = Math.max(0, graceAllowedHours - graceUsedHours);







  const teacherAssignment =



    teacherScheduleAssignments.find((assignment) => assignment.userId === currentUser.id) ?? null;







  const cambridgeCount = teacherAssignment?.cambridgeCount ?? 0;



  const georgianCount = teacherAssignment?.georgianCount ?? 0;



  const baseSalary = Number(currentUser.baseSalary ?? 0);



  const cambridgeRate = Number(teacherScheduleBonusRates.cambridge ?? 0);



  const georgianRate = Number(teacherScheduleBonusRates.georgian ?? 0);



  const cambridgeBonus = cambridgeCount * cambridgeRate;



  const georgianBonus = georgianCount * georgianRate;



  const lessonBonus = cambridgeBonus + georgianBonus;

  const extraBonusApplications = useMemo(() =>
    applications.filter(
      (bundle) =>
        bundle.application.status === 'APPROVED' &&
        bundle.extraBonus &&
        bundle.extraBonus.userId === currentUser.id
    ),
    [applications, currentUser.id]
  );

  const extraBonusTotal = extraBonusApplications.reduce((sum, bundle) => sum + (bundle.extraBonus?.totalAmount ?? 0), 0);

  const extraBonusHours = extraBonusApplications.reduce((sum, bundle) => sum + ((bundle.extraBonus?.minutes ?? 0) / 60), 0);




  const bonusLookup = useMemo(() => {



    const map = new Map<



      number,



      { name: string; percent: number | null; amount: number | null }



    >();



    const walk = (nodes: CompensationBonus[]) => {



      nodes.forEach((node) => {



        map.set(node.id, {



          name: node.name,



          percent: node.percent ?? null,



          amount: node.amount ?? null



        });



        if (node.children?.length) {



          walk(node.children);



        }



      });



    };



    walk(compensationBonuses ?? []);



    return map;



  }, [compensationBonuses]);



  const selectedBonusIds = currentUser.selectedBonusIds ?? [];



  const selectedBonusBreakdown = useMemo<SelectedBonusBreakdownRow[]>(() => {



    if (!selectedBonusIds.length) {



      return [];



    }



    return selectedBonusIds



      .map((bonusId) => {



        const bonus = bonusLookup.get(bonusId);



        if (!bonus) {



          return null;



        }



        const percentValue = bonus.percent ? (baseSalary * bonus.percent) / 100 : 0;



        const amountValue = bonus.amount ?? 0;



        return {



          id: bonusId,



          name: bonus.name,



          percent: bonus.percent ?? null,



          amount: bonus.amount ?? null,



          value: percentValue + amountValue



        };



      })



      .filter((row): row is SelectedBonusBreakdownRow => row !== null);



  }, [selectedBonusIds, bonusLookup, baseSalary]);



  const selectedBonusTotal = selectedBonusBreakdown.reduce(



    (sum, row) => sum + row.value,



    0



  );



  const taxRate = Number(teacherScheduleBonusRates.taxRate ?? 0);



  const grossSalary = baseSalary + lessonBonus + selectedBonusTotal + extraBonusTotal;



  const taxAmount = grossSalary * (taxRate / 100);



  const deductionBreakdown: SalaryDeductionRow[] = (teacherScheduleBonusRates.adjustments ?? []).map(



    (item, index) => {



      const mode = item.mode === 'fixed' ? 'fixed' : 'percent';



      const configuredValue = Number(item.value ?? 0);



      const amount = mode === 'percent' ? (grossSalary * configuredValue) / 100 : configuredValue;



      return {



        id: `deduction-${item.id ?? index}`,



        label: item.label,



        amount,



        mode,



        configuredValue



      };



    }



  );



  const additionalDeductionsTotal = deductionBreakdown.reduce((sum, entry) => sum + entry.amount, 0);



  const totalDeductions = taxAmount + additionalDeductionsTotal;



  const netSalary = Math.max(0, grossSalary - totalDeductions);



  const totalSalary = netSalary;







  const renderTabContent = () => {



    switch (activeTab) {



      case 'personal':



        return (



          <PersonalDetailsTab



            language={language}



            copy={copy}



            currentUserName={currentUser.name}



            jobTitle={currentUser.subject ?? copy.roleLabel}



            email={currentUser.email}



            phone={currentUser.phone}



            personalId={currentUser.personalId}



          />



        );



      case 'work':



        return (



          <WorkDetailsTab

            language={language}

            copy={copy}

            vacationRemaining={vacationRemaining}

            vacationUsed={vacationUsed}

            vacationTotal={vacationTotal}

            graceRemaining={graceRemaining}

            totalSalary={totalSalary}

            baseSalary={baseSalary}

            lessonBonus={lessonBonus}
            extraBonusTotal={extraBonusTotal}
            extraBonusHours={extraBonusHours}

            grossSalary={grossSalary}

            taxRate={taxRate}

            taxAmount={taxAmount}

            cambridgeBonus={cambridgeBonus}

            georgianBonus={georgianBonus}

            cambridgeCount={cambridgeCount}

            georgianCount={georgianCount}

            cambridgeRate={cambridgeRate}

            georgianRate={georgianRate}

            deductions={deductionBreakdown}

            selectedBonuses={selectedBonusBreakdown}

            selectedBonusTotal={selectedBonusTotal}

            schedule={schedule}

          />

        );



      case 'security':



        return <SecurityTab copy={copy} />;



      case 'permissions':



        return <PermissionsTab copy={copy} permissionIds={role?.permissions ?? []} />;



      default:



        return null;



    }



  };







  const avatarLetter = currentUser.name?.charAt(0).toUpperCase() ?? 'U';







  return (



    <div className="space-y-6">



      <div>



        <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>



        <p className="text-slate-600">{copy.subtitle}</p>



      </div>







      <section className="rounded-2xl bg-white p-6 shadow-sm">



        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">



          <div className="flex items-center gap-4">



            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-semibold text-white">



              {avatarLetter}



            </div>



            <div>



              <p className="text-xl font-semibold text-slate-900">{currentUser.name}</p>



              <p className="text-sm text-slate-500">



                {copy.roleLabel}: {role?.name ?? copy.roleLabel}



              </p>



            </div>



          </div>



          <div className="grid gap-1 text-sm text-slate-600 md:grid-cols-3">



            <p>



              <span className="text-xs uppercase tracking-wide text-slate-400">{copy.email}</span>



              <br />



              {currentUser.email}



            </p>



            <p>



              <span className="text-xs uppercase tracking-wide text-slate-400">{copy.phone}</span>



              <br />



              {currentUser.phone}



            </p>



            <p>



              <span className="text-xs uppercase tracking-wide text-slate-400">{copy.personalId}</span>



              <br />



              {currentUser.personalId}



            </p>



          </div>



        </div>



        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200">



          {copy.tabs.map((tab) => (



            <button



              key={tab.id}



              type="button"



              onClick={() => setActiveTab(tab.id)}



              className={`border-b-2 px-4 py-3 text-base font-semibold transition ${



                activeTab === tab.id



                  ? 'border-blue-500 text-blue-600'



                  : 'border-transparent text-slate-500 hover:text-slate-700'



              }`}



            >



              {tab.label}



            </button>



          ))}



        </div>



        <div className="mt-6">{renderTabContent()}</div>



      </section>



    </div>



  );



};







export { MyPage };








