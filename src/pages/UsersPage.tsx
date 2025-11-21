
import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type {
  BonusValueType,
  Campus,
  CompensationBonus,
  CompensationBonusInput,
  User,
  WorkScheduleDay,
  Weekday
} from '../types';
import { createDefaultWorkSchedule, sanitizeWorkSchedule } from '../utils/workSchedule';

interface UsersPageProps {
  language: 'ka' | 'en';
  mode?: 'full' | 'form' | 'list';
  hidePageHeading?: boolean;
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string;
  subject: string;
  roleId: string;
  salary: string;
  vacationDays: string;
  lateHoursAllowed: string;
  penaltyPercent: string;
  selectedBonusIds: number[];
  workSchedule: WorkScheduleDay[];
  workShiftId: number | null;
  campuses: Campus[];
};

type BonusFormState = {
  name: string;
  percent: string;
  amount: string;
  valueType: BonusValueType;
};

type CopyEntry = {
  title: string;
  subtitle: string;
  formTitle: string;
  editTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string;
  personalIdPlaceholder: string;
  passwordNotice: string;
  role: string;
  salary: string;
  bonuses: string;
  openBonusModal: string;
  manageBonuses: string;
  bonusSummarySelected: string;
  bonusSummaryPercent: string;
  bonusSummaryAmount: string;
  bonusSummaryExtra: string;
  bonusSummaryGross: string;
  bonusSummaryTax: string;
  bonusSummaryDeductions: string;
  bonusSummaryFinal: string;
  vacationDays: string;
  lateHoursAllowed: string;
  penaltyPercent: string;
  compensationNote: string;
  add: string;
  adding: string;
  update: string;
  updating: string;
  success: string;
  updateSuccess: string;
  resetPasswordSuccess: string;
  required: string;
  salaryInvalid: string;
  vacationInvalid: string;
  lateHoursInvalid: string;
  penaltyInvalid: string;
  duplicateEmail: string;
  duplicatePersonalId: string;
  genericError: string;
  noCreatePermission: string;
  noEditPermission: string;
  noViewPermission: string;
  cancelEdit: string;
  editAction: string;
  resetPassword: string;
  resetPasswordConfirm: string;
   deleteUser: string;
   deleteUserConfirm: string;
   deleteUserSuccess: string;
  searchPlaceholder: string;
  listTitle: string;
  emptyState: string;
  columnName: string;
  columnEmail: string;
  columnPhone: string;
  columnPersonalId: string;
  columnSubject: string;
  columnRole: string;
  columnSalary: string;
  columnBonuses: string;
  columnActions: string;
  extraBadge: string;
  unknownRole: string;
  bonusModalTitle: string;
  bonusManageTitle: string;
  bonusSearchPlaceholder: string;
  bonusEmptyState: string;
  bonusSelectHint: string;
  bonusAddRoot: string;
  bonusAddChild: string;
  bonusEdit: string;
  bonusDelete: string;
  bonusDeleteConfirm: string;
  bonusName: string;
  bonusPercent: string;
  bonusAmount: string;
  bonusValueType: string;
  bonusValuePercent: string;
  bonusValueAmount: string;
  bonusValueNone: string;
  bonusValueInvalid: string;
  bonusParent: string;
  bonusCreate: string;
  bonusUpdate: string;
  bonusCancel: string;
  bonusSave: string;
  bonusClose: string;
  bonusSelectedCount: string;
  workScheduleTitle: string;
  workScheduleDescription: string;
  workScheduleButton: string;
  workScheduleModalTitle: string;
  workScheduleWorkingDay: string;
  workScheduleDayOff: string;
  workScheduleStartLabel: string;
  workScheduleEndLabel: string;
  workScheduleBreakLabel: string;
  workScheduleModalSave: string;
  workScheduleModalCancel: string;
  workScheduleSummaryLabel: string;
  workScheduleSelectedDays: string;
  workShiftLabel: string;
  workShiftPlaceholder: string;
  workShiftCustomOption: string;
  workShiftEmpty: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  campusesLabel: string;
  campusHelper: string;
  campusMarneuli: string;
  campusTbilisi: string;
  campusRequired: string;
};

const COPY: Record<UsersPageProps['language'], CopyEntry> = {
  ka: {
    title: 'მომხმარებლები',
    subtitle: 'შექმენით თანამშრომლები, მიანიჭეთ როლები და მართეთ კომპენსაციები ერთ ეკრანზე.',
    formTitle: 'ახალი მომხმარებლის შექმნა',
    editTitle: 'მომხმარებლის რედაქტირება',
    firstName: 'სახელი',
    lastName: 'გვარი',
    email: 'ელ. ფოსტა',
    phone: 'ტელეფონი',
    personalId: 'პირადი ნომერი',
    personalIdPlaceholder: '01001000001',
    passwordNotice: 'ახალი მომხმარებლები მიიღებენ პაროლის დაყენების მოთხოვნას პირველივე ავტორიზაციისას.',
    role: 'როლი',
    salary: 'ხელფასი (₾)',
    bonuses: 'დანამატები',
    openBonusModal: 'დანამატების არჩევა',
    manageBonuses: 'კატალოგის მართვა',
    bonusSummarySelected: 'არჩეული დანამატები',
    bonusSummaryPercent: 'სულ %',
    bonusSummaryAmount: 'ფიქსირებული დანამატები',
    bonusSummaryExtra: 'ზეგანაკვეთური',
    bonusSummaryGross: 'ბრუტო ხელფასი',
    bonusSummaryTax: 'გადასახადი',
    bonusSummaryDeductions: 'გადასახადები და დაქვითვები',
    bonusSummaryFinal: 'საბოლოო ხელფასი',
    vacationDays: 'ანაზღაურებადი შვებულება (დღე)',
    lateHoursAllowed: 'შეღავათის პერიოდი (საათი)',
    penaltyPercent: 'ჯარიმა თითოეულ საათზე (%)',
    compensationNote: 'შეღავათის შემდეგ ყოველი დამატებითი საათი ამცირებს ხელფასს.',
    add: 'მომხმარებლის დამატება',
    adding: 'მომხმარებლის დამატება...',
    update: 'მომხმარებლის განახლება',
    updating: 'განახლება...',
    success: 'მომხმარებელი წარმატებით დაემატა. პირველივე შესვლაზე უნდა შეცვალოს პაროლი.',
    updateSuccess: 'მომხმარებლის მონაცემები განახლდა.',
    resetPasswordSuccess: 'პაროლის განულება დაწყებულია. შემდეგ შესვლაზე აირჩევს ახალს.',
    required: 'ველი სავალდებულოა.',
    salaryInvalid: 'ხელფასი უნდა იყოს დადებითი რიცხვი.',
    vacationInvalid: 'შვებულების დღეები 0-ზე მეტი უნდა იყოს.',
    lateHoursInvalid: 'შეღავათის საათები 0-ზე მეტი უნდა იყოს.',
    penaltyInvalid: 'შეიყვანეთ სწორი მნიშვნელობა (შეიძლება იყოს 0).',
    duplicateEmail: 'ეს ელ. ფოსტა უკვე გამოიყენება.',
    duplicatePersonalId: 'ეს პირადი ნომერი უკვე არსებობს.',
    genericError: 'დაფიქსირდა გაუთვალისწინებელი შეცდომა. სცადეთ ხელახლა.',
    noCreatePermission: 'არ გაქვთ მომხმარებლების დამატების უფლება.',
    noEditPermission: 'არ გაქვთ მომხმარებლების რედაქტირების უფლება.',
    noViewPermission: 'არ გაქვთ მომხმარებლების ნახვის უფლება.',
    cancelEdit: 'რედაქტირების გაუქმება',
    editAction: 'რედაქტირება',
    resetPassword: 'პაროლის განულება',
    resetPasswordConfirm: 'დარწმუნებული ხართ, რომ გსურთ პაროლის განულება და გამოთხოვა?',
    deleteUser: 'მომხარებლის წაშლა',
    deleteUserConfirm: 'დარწმუნებული ხართ, რომ გსურთ ამ მომხმარებლის წაშლა? ეს ქმედება შეუქცევადია.',
    deleteUserSuccess: 'მომხმარებელი წაიშალა.',
    searchPlaceholder: 'მოძებნეთ სახელი, როლი, საგანი, პირადი ნომერი, ტელეფონი ან ელ.ფოსტა...',
    listTitle: 'მომხმარებელთა სია',
    emptyState: 'მონაცემები ვერ მოიძებნა.',
    columnName: 'სახელი',
    columnEmail: 'ელ. ფოსტა',
    columnPhone: 'ტელეფონი',
    columnPersonalId: 'პირადი ნომერი',
    columnSubject: 'საგანი',
    columnRole: 'როლი',
    columnSalary: 'ხელფასი',
    columnBonuses: 'დანამატები',
    columnActions: 'ქმედებები',
    extraBadge: 'OT',
    unknownRole: 'უცნობი როლი',
    bonusModalTitle: 'დანამატების კატალოგი',
    bonusManageTitle: 'კატალოგის მართვა',
    bonusSearchPlaceholder: 'მოძებნეთ კატეგორია ან ქვეკატეგორია...',
    bonusEmptyState: 'დანამატები ვერ მოიძებნა.',
    bonusSelectHint: 'არჩევა შეგიძლიათ მხოლოდ მნიშვნელობის მქონე ჩანაწერებისთვის.',
    bonusAddRoot: 'კატეგორიის დამატება',
    bonusAddChild: 'ქვეკატეგორიის დამატება',
    bonusEdit: 'ჩასწორება',
    bonusDelete: 'წაშლა',
    bonusDeleteConfirm: 'დარწმუნებული ხართ, რომ გსურთ ჩანაწერის წაშლა?',
    bonusName: 'დასახელება',
    bonusPercent: 'პროცენტი (%)',
    bonusAmount: 'თანხა (₾)',
    bonusValueType: 'მნიშვნელობის ტიპი',
    bonusValuePercent: 'პროცენტი (%)',
    bonusValueAmount: 'ფიქსირებული თანხა (₾)',
    bonusValueNone: 'კატეგორია (მნიშვნელობის გარეშე)',
    bonusValueInvalid: 'შეიყვანეთ სწორი მნიშვნელობა.',
    bonusParent: 'მშობლიური კატეგორია',
    bonusCreate: 'დამატება',
    bonusUpdate: 'შენახვა',
    bonusCancel: 'გაუქმება',
    bonusSave: 'კატალოგის შენახვა',
    bonusClose: 'დახურვა',
    bonusSelectedCount: 'არჩეული',
    workScheduleTitle: 'სამუშაო განრიგი',
    workScheduleDescription: 'განსაზღვრეთ სამუშაო დღეები, დროები და შესვენებები.',
    workScheduleButton: 'სამუშაო ცვლა',
    workScheduleModalTitle: 'სამუშაო გრაფიკის რედაქტირება',
    workScheduleWorkingDay: 'სამუშაო დღე',
    workScheduleDayOff: 'დასვენების დღე',
    workScheduleStartLabel: 'დაწყების დრო',
    workScheduleEndLabel: 'დასრულების დრო',
    workScheduleBreakLabel: 'შესვენება (წთ)',
    workScheduleModalSave: 'გრაფიკის შენახვა',
    workScheduleModalCancel: 'დახურვა',
    workScheduleSummaryLabel: 'კვირის დატვირთვა',
    workScheduleSelectedDays: 'სამუშაო დღეები',
    workShiftLabel: 'სამუშაო ცვლა',
    workShiftPlaceholder: 'აირჩიეთ ცვლა...',
    workShiftCustomOption: 'ხელით კონფიგურაცია',
    workShiftEmpty: 'ჯერ არ არის შექმნილი ცვლები. დაამატეთ ისინი HR გვერდზე.',
    subjectLabel: 'Subject',
    subjectPlaceholder: '01001000001',
    campusesLabel: 'Campus access',
    campusHelper: 'Choose which campus this user belongs to.',
    campusMarneuli: 'Marneuli',
    campusTbilisi: 'Tbilisi',
    campusRequired: 'Select at least one campus.'
  },
  en: {
    title: 'Users',
    subtitle: 'Create employees, assign roles, and manage compensation from one screen.',
    formTitle: 'Create a new user',
    editTitle: 'Edit user',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    phone: 'Phone number',
    personalId: 'Personal ID',
    personalIdPlaceholder: '01001000001',
    passwordNotice: 'New users will be prompted to set a password on their first login.',
    role: 'Role',
    salary: 'Salary (₾)',
    bonuses: 'Bonuses',
    openBonusModal: 'Select bonuses',
    manageBonuses: 'Manage catalogue',
    bonusSummarySelected: 'Selected bonuses',
    bonusSummaryPercent: 'Percent bonus',
    bonusSummaryAmount: 'Fixed bonuses',
    bonusSummaryExtra: 'Overtime bonus',
    bonusSummaryGross: 'Gross salary',
    bonusSummaryTax: 'Tax',
    bonusSummaryDeductions: 'Taxes & deductions',
    bonusSummaryFinal: 'Net salary',
    vacationDays: 'Paid vacation days',
    lateHoursAllowed: 'Grace period (hours)',
    penaltyPercent: 'Penalty per extra hour (%)',
    compensationNote: 'After the grace period each extra hour applies this deduction.',
    add: 'Add user',
    adding: 'Adding user...',
    update: 'Update user',
    updating: 'Updating...',
    success: 'User created successfully. They will set a password on first login.',
    updateSuccess: 'User information updated.',
    resetPasswordSuccess: 'Password reset initiated. They will choose a new one on next login.',
    required: 'Please complete the required fields.',
    salaryInvalid: 'Enter a salary amount.',
    vacationInvalid: 'Enter vacation days.',
    lateHoursInvalid: 'Enter allowed late hours.',
    penaltyInvalid: 'Enter the penalty percentage (it may be 0).',
    duplicateEmail: 'This email address already exists.',
    duplicatePersonalId: 'This personal ID is already in use.',
    genericError: 'Something went wrong. Please try again.',
    noCreatePermission: 'You cannot create users.',
    noEditPermission: 'You cannot edit users.',
    noViewPermission: 'You cannot view users.',
    cancelEdit: 'Cancel editing',
    editAction: 'Edit',
    resetPassword: 'Reset password',
    resetPasswordConfirm: "Send this user a password reset prompt?",
    deleteUser: 'Remove user',
    deleteUserConfirm: 'Remove this user permanently? This cannot be undone.',
    deleteUserSuccess: 'User removed permanently.',
    searchPlaceholder: 'Search name, role, subject, personal ID, phone, or email...',
    listTitle: 'Users',
    emptyState: 'No users found.',
    columnName: 'Name',
    columnEmail: 'Email',
    columnPhone: 'Phone',
    columnPersonalId: 'Personal ID',
    columnSubject: 'Subject',
    columnRole: 'Role',
    columnSalary: 'Salary',
    columnBonuses: 'Bonuses',
    columnActions: 'Actions',
    extraBadge: 'OT',
    unknownRole: 'Unknown role',
    bonusModalTitle: 'Bonus catalogue',
    bonusManageTitle: 'Manage catalogue',
    bonusSearchPlaceholder: 'Search category or subcategory...',
    bonusEmptyState: 'No bonuses found.',
    bonusSelectHint: 'Only bonuses with a value can be selected.',
    bonusAddRoot: 'Add category',
    bonusAddChild: 'Add subcategory',
    bonusEdit: 'Edit',
    bonusDelete: 'Delete',
    bonusDeleteConfirm: 'Delete this entry?',
    bonusName: 'Name',
    bonusPercent: 'Percent (%)',
    bonusAmount: 'Amount (₾)',
    bonusValueType: 'Value type',
    bonusValuePercent: 'Percentage (%)',
    bonusValueAmount: 'Fixed amount (₾)',
    bonusValueNone: 'Category (no value)',
    bonusValueInvalid: 'Enter a valid bonus value.',
    bonusParent: 'Parent',
    bonusCreate: 'Add',
    bonusUpdate: 'Save',
    bonusCancel: 'Cancel',
    bonusSave: 'Save catalogue',
    bonusClose: 'Close',
    bonusSelectedCount: 'selected',
    workScheduleTitle: 'Work schedule',
    workScheduleDescription: "Configure this user's working days, hours, and breaks.",
    workScheduleButton: 'Work shift',
    workScheduleModalTitle: 'Work shift configuration',
    workScheduleWorkingDay: 'Working day',
    workScheduleDayOff: 'Day off',
    workScheduleStartLabel: 'Start time',
    workScheduleEndLabel: 'End time',
    workScheduleBreakLabel: 'Break (minutes)',
    workScheduleModalSave: 'Save schedule',
    workScheduleModalCancel: 'Close',
    workScheduleSummaryLabel: 'Weekly workload',
    workScheduleSelectedDays: 'Working days',
    workShiftLabel: 'Work shift',
    workShiftPlaceholder: 'Choose a shift...',
    workShiftCustomOption: 'Manual configuration',
    workShiftEmpty: 'No shifts defined yet. Visit the HR page to add shifts.',
    subjectLabel: 'Subject (optional)',
    subjectPlaceholder: 'e.g. Mathematics',
    campusesLabel: 'Campus access',
    campusHelper: 'Assign which campus(es) this user belongs to.',
    campusMarneuli: 'Marneuli',
    campusTbilisi: 'Tbilisi',
    campusRequired: 'Select at least one campus.'
  }
};const WEEKDAY_LABELS: Record<UsersPageProps['language'], Record<Weekday, string>> = {
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

const ALL_CAMPUSES: Campus[] = ['marneuli', 'tbilisi'];

const TIME_HOURS = Array.from({ length: 24 }, (_, index) => index.toString().padStart(2, '0'));
const TIME_MINUTES = Array.from({ length: 60 }, (_, index) => index.toString().padStart(2, '0'));

const formatGel = (value: number): string =>
  `₾ ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const createBonusFormValues = (): BonusFormState => ({
  name: '',
  percent: '',
  amount: '',
  valueType: 'percent'
});

const parseTimeToMinutes = (value: string | null): number | null => {
  if (!value) {
    return null;
  }
  const [hoursRaw, minutesRaw] = value.split(':');
  if (hoursRaw === undefined || minutesRaw === undefined) {
    return null;
  }
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

const calculateDailyMinutes = (entry: WorkScheduleDay): number => {
  if (!entry.isWorking) {
    return 0;
  }

  const start = parseTimeToMinutes(entry.startTime ?? null);
  const end = parseTimeToMinutes(entry.endTime ?? null);

  if (start === null || end === null || end <= start) {
    return 0;
  }

  const breakMinutes = Number.isFinite(entry.breakMinutes) ? Math.max(0, entry.breakMinutes) : 0;
  return Math.max(0, end - start - breakMinutes);
};

const formatDuration = (minutes: number, language: UsersPageProps['language']): string => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const leftover = safeMinutes % 60;

  return language === 'ka'
    ? `${hours}სთ ${leftover}წთ`
    : `${hours}h ${leftover}m`;
};









const normalizeCampuses = (raw?: Campus[]): Campus[] => {
  if (!raw || raw.length === 0) {
    return [];
  }
  const cleaned = raw.filter((campus) => ALL_CAMPUSES.includes(campus));
  return cleaned.length > 0 ? Array.from(new Set(cleaned)) : [];
};

const generateTempBonusId = (() => {
  let current = -1;
  return () => {
    current -= 1;
    return current;
  };
})();

const cloneBonusTree = (nodes: CompensationBonus[]): CompensationBonus[] =>
  nodes.map((node) => ({
    ...node,
    children: cloneBonusTree(node.children ?? [])
  }));

const convertToInputPayload = (nodes: CompensationBonus[]): CompensationBonusInput[] =>
  nodes.map((node) => ({
    id: node.id > 0 ? node.id : undefined,
    parentId: node.parentId ?? null,
    name: node.name,
    percent: node.percent ?? null,
    amount: node.amount ?? null,
    children: convertToInputPayload(node.children ?? [])
  }));

const addBonusNode = (
  nodes: CompensationBonus[],
  parentId: number | null,
  newNode: CompensationBonus
): CompensationBonus[] => {
  if (parentId === null) {
    return [...nodes, newNode];
  }

  return nodes.map((node) =>
    node.id === parentId
      ? { ...node, children: [...node.children, { ...newNode, parentId }] }
      : { ...node, children: addBonusNode(node.children, parentId, newNode) }
  );
};

const updateBonusNode = (
  nodes: CompensationBonus[],
  targetId: number,
  updater: (node: CompensationBonus) => CompensationBonus
): CompensationBonus[] =>
  nodes.map((node) =>
    node.id === targetId
      ? updater(node)
      : { ...node, children: updateBonusNode(node.children, targetId, updater) }
  );

const deleteBonusNode = (nodes: CompensationBonus[], targetId: number): CompensationBonus[] =>
  nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({ ...node, children: deleteBonusNode(node.children, targetId) }));

const collectBonusIds = (nodes: CompensationBonus[], target = new Set<number>()): Set<number> => {
  nodes.forEach((node) => {
    target.add(node.id);
    collectBonusIds(node.children ?? [], target);
  });
  return target;
};

const filterBonusTree = (nodes: CompensationBonus[], term: string): CompensationBonus[] => {
  const normalized = term.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  const walk = (current: CompensationBonus[]): CompensationBonus[] =>
    current
      .map((node) => {
        const children = walk(node.children ?? []);
        const matches = node.name.toLowerCase().includes(normalized);
        if (matches || children.length > 0) {
          return { ...node, children };
        }
        return null;
      })
      .filter((node): node is CompensationBonus => Boolean(node));

  return walk(nodes);
};

const cloneSchedule = (schedule: WorkScheduleDay[]): WorkScheduleDay[] =>
  schedule.map((entry) => ({ ...entry }));

const schedulesAreEqual = (first: WorkScheduleDay[], second: WorkScheduleDay[]): boolean => {
  if (first.length !== second.length) {
    return false;
  }
  return first.every((entry, index) => {
    const other = second[index];
    return (
      entry.dayOfWeek === other.dayOfWeek &&
      entry.isWorking === other.isWorking &&
      (entry.startTime ?? null) === (other.startTime ?? null) &&
      (entry.endTime ?? null) === (other.endTime ?? null) &&
      entry.breakMinutes === other.breakMinutes
    );
  });
};
export const UsersPage: React.FC<UsersPageProps> = ({
  language,
  mode = 'full',
  hidePageHeading = false
}) => {
  const {
    roles,
    users,
    allUsers,
    compensationBonuses,
    teacherScheduleBonusRates,
    workShifts,
    saveUsers,
    saveCompensationBonuses,
    resetUserPassword,
    deleteUser,
    hasPermission,
    applications
  } = useAppContext();
  const t = COPY[language];
  const showFormSection = mode !== 'list';
  const showListSection = mode !== 'form';
  const useModalForForm = mode === 'list';
  const showPageHeading = !hidePageHeading;

  const defaultRoleId = useMemo(() => (roles[0] ? String(roles[0].id) : ''), [roles]);

  const [formData, setFormData] = useState<FormState>(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personalId: '',
    subject: '',
    roleId: defaultRoleId,
    salary: '',
    vacationDays: '24',
    lateHoursAllowed: '4',
    penaltyPercent: '0',
    selectedBonusIds: [],
    workSchedule: createDefaultWorkSchedule(),
    workShiftId: null,
    campuses: []
  }));
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [bonusSearch, setBonusSearch] = useState('');
  const [manageSearch, setManageSearch] = useState('');
  const [draftBonuses, setDraftBonuses] = useState<CompensationBonus[]>([]);
  const [bonusFormMode, setBonusFormMode] = useState<'create' | 'edit'>('create');
  const [bonusFormParentId, setBonusFormParentId] = useState<number | null>(null);
  const [bonusFormEditingId, setBonusFormEditingId] = useState<number | null>(null);
  const [bonusFormValues, setBonusFormValues] = useState<BonusFormState>(() => createBonusFormValues());
  const [bonusFormError, setBonusFormError] = useState<string | null>(null);
  const [bonusSaving, setBonusSaving] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const extraBonusByUser = useMemo(() => {
    const totals = new Map<number, { amount: number; minutes: number }>();
    applications.forEach((bundle) => {
      if (!bundle.extraBonus || bundle.application.status !== 'APPROVED') {
        return;
      }
      const current = totals.get(bundle.extraBonus.userId) ?? { amount: 0, minutes: 0 };
      current.amount += bundle.extraBonus.totalAmount;
      current.minutes += bundle.extraBonus.minutes;
      totals.set(bundle.extraBonus.userId, current);
    });
    return totals;
  }, [applications]);

  useEffect(() => {
    if (!editingUserId && !formData.roleId && defaultRoleId) {
      setFormData((previous) => ({ ...previous, roleId: defaultRoleId }));
    }
  }, [defaultRoleId, editingUserId, formData.roleId]);

  useEffect(() => {
    if (!manageModalOpen) {
      setDraftBonuses(cloneBonusTree(compensationBonuses));
    }
  }, [compensationBonuses, manageModalOpen]);

  useEffect(() => {
    const validIds = collectBonusIds(compensationBonuses);
    setFormData((previous) => {
      const filtered = previous.selectedBonusIds.filter((id) => validIds.has(id));
      if (filtered.length === previous.selectedBonusIds.length) {
        return previous;
      }
      return { ...previous, selectedBonusIds: filtered };
    });
  }, [compensationBonuses]);

  const updateWorkSchedule = (day: Weekday, changes: Partial<WorkScheduleDay>) => {
    setFormData((previous) => ({
      ...previous,
      workSchedule: previous.workSchedule.map((entry) =>
        entry.dayOfWeek === day ? { ...entry, ...changes } : entry
      ),
      workShiftId: null
    }));
  };

  const handleToggleWorkDay = (day: Weekday, isWorking: boolean) => {
    updateWorkSchedule(day, { isWorking });
  };

  const handleScheduleTimeChange = (day: Weekday, field: 'startTime' | 'endTime', value: string) => {
    updateWorkSchedule(day, { [field]: value } as Partial<WorkScheduleDay>);
  };

  const handleScheduleBreakChange = (day: Weekday, value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    updateWorkSchedule(day, { breakMinutes: Math.max(0, Math.round(safeValue)) });
  };

  const handleScheduleModalSave = () => {
    setFormData((previous) => {
      const sanitized = sanitizeWorkSchedule(previous.workSchedule);
      return {
        ...previous,
        workSchedule: sanitized,
        workShiftId: findMatchingWorkShiftId(sanitized)
      };
    });
    setScheduleModalOpen(false);
  };

  const canView = hasPermission('view_users');
  const canCreate = hasPermission('create_users');
  const canEdit = hasPermission('edit_users');
  const canResetPasswords = hasPermission('reset_passwords');
  const canDelete = hasPermission('delete_users');
  const isEditing = editingUserId !== null;
  const canSubmit = isEditing ? canEdit : canCreate;

  const roleLookup = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles]);

  const bonusLookup = useMemo(() => {
    const map = new Map<number, { name: string; percent: number | null; amount: number | null }>();
    const walk = (nodes: CompensationBonus[]) => {
      nodes.forEach((node) => {
        map.set(node.id, {
          name: node.name,
          percent: node.percent ?? null,
          amount: node.amount ?? null
        });
        walk(node.children ?? []);
      });
    };
    walk(compensationBonuses);
    return map;
  }, [compensationBonuses]);

  const findMatchingWorkShiftId = useCallback(
    (schedule: WorkScheduleDay[]): number | null => {
      const sanitized = sanitizeWorkSchedule(schedule);
      for (const shift of workShifts) {
        if (schedulesAreEqual(shift.schedule, sanitized)) {
          return shift.id;
        }
      }
      return null;
    },
    [workShifts]
  );

  useEffect(() => {
    setFormData((previous) => {
      const matchId = findMatchingWorkShiftId(previous.workSchedule);
      if (matchId === previous.workShiftId) {
        return previous;
      }
      return {
        ...previous,
        workShiftId: matchId
      };
    });
  }, [workShifts, findMatchingWorkShiftId]);

  const totalBonusPercent = useMemo(
    () =>
      formData.selectedBonusIds.reduce(
        (total, id) => total + (bonusLookup.get(id)?.percent ?? 0),
      0
    ),
    [formData.selectedBonusIds, bonusLookup]
  );

  const totalBonusAmount = useMemo(
    () =>
      formData.selectedBonusIds.reduce(
        (total, id) => total + (bonusLookup.get(id)?.amount ?? 0),
        0
      ),
    [formData.selectedBonusIds, bonusLookup]
  );

  const formExtraAmount = editingUserId ? extraBonusByUser.get(editingUserId)?.amount ?? 0 : 0;

  const compensationPreview = useMemo(() => {
    const base = Number.parseFloat(formData.salary || '0');
    const taxRateValue = Math.max(0, Number(teacherScheduleBonusRates.taxRate ?? 0));
    if (Number.isNaN(base)) {
      return { gross: 0, taxAmount: 0, deductions: 0, net: 0, taxRateValue };
    }
    const percentBonusValue = (base * totalBonusPercent) / 100;
    const gross = base + percentBonusValue + totalBonusAmount + formExtraAmount;
    const taxAmount = gross * (taxRateValue / 100);
    const deductionTotal = (teacherScheduleBonusRates.adjustments ?? []).reduce((sum, adjustment) => {
      const mode = adjustment.mode === 'fixed' ? 'fixed' : 'percent';
      const value = Number(adjustment.value ?? 0);
      if (!Number.isFinite(value)) {
        return sum;
      }
      return sum + (mode === 'percent' ? (gross * value) / 100 : value);
    }, 0);
    const net = Math.max(0, gross - taxAmount - deductionTotal);
    return { gross, taxAmount, deductions: deductionTotal, net, taxRateValue };
  }, [
    formData.salary,
    totalBonusAmount,
    totalBonusPercent,
    formExtraAmount,
    teacherScheduleBonusRates.taxRate,
    teacherScheduleBonusRates.adjustments
  ]);
  const grossSalaryPreview = compensationPreview.gross;
  const taxAmountPreview = compensationPreview.taxAmount;
  const deductionTotalPreview = compensationPreview.deductions;
  const previewTaxRate = compensationPreview.taxRateValue;
  const finalSalary = compensationPreview.net;

  const weeklyMinutes = useMemo(
    () => formData.workSchedule.reduce((total, day) => total + calculateDailyMinutes(day), 0),
    [formData.workSchedule]
  );

  const workingDayCount = useMemo(
    () => formData.workSchedule.filter((day) => day.isWorking).length,
    [formData.workSchedule]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return users;
    }

    return users.filter((user) => {
      const first = user.firstName ?? '';
      const last = user.lastName ?? '';
      const fullName = [first, last].filter(Boolean).join(' ') || user.name || '';
      const roleName = roleLookup.get(user.roleId) ?? '';
      const subject = (user.subject ?? '').toLowerCase();
      const email = (user.email ?? '').toLowerCase();
      const personalId = (user.personalId ?? '').toLowerCase();
                      <td className="px-4 py-3 text-sm text-slate-600">{user.subject || '—'}</td>
      const phone = (user.phone ?? '').toLowerCase();
      const nameMatch = fullName.toLowerCase().includes(term);
      return (
        nameMatch ||
        email.includes(term) ||
        personalId.includes(term) ||
        phone.includes(term) ||
        roleName.toLowerCase().includes(term) ||
        subject.includes(term)
      );
    });
  }, [roleLookup, search, users]);

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
        <p className="mt-4 text-slate-600">{t.noViewPermission}</p>
      </div>
    );
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleCampusToggle = (campus: Campus) => {
    setFormData((previous) => {
      const hasCampus = previous.campuses.includes(campus);
      const campuses = hasCampus
        ? previous.campuses.filter((entry) => entry !== campus)
        : [...previous.campuses, campus];
      return { ...previous, campuses };
    });
  };

  const resetForm = (nextRoleId?: string) => {
    const defaultSchedule = createDefaultWorkSchedule();
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      personalId: '',
      subject: '',
      roleId: nextRoleId ?? defaultRoleId,
      salary: '',
      vacationDays: '24',
      lateHoursAllowed: '4',
      penaltyPercent: '0',
      selectedBonusIds: [],
      workSchedule: defaultSchedule,
      workShiftId: findMatchingWorkShiftId(defaultSchedule),
      campuses: []
    });
  };

  const startEditing = (userId: number) => {
    if (!canEdit) {
      return;
    }

    if (editingUserId === userId) {
      return;
    }

    const existing = users.find((user) => user.id === userId);
    if (!existing) {
      return;
    }

    setEditingUserId(existing.id);
    const normalizedSchedule = sanitizeWorkSchedule(existing.workSchedule);
    setFormData({
      firstName: existing.firstName ?? existing.name?.split(' ')[0] ?? '',
      lastName:
        existing.lastName ??
        existing.name
          ?.split(' ')
          .slice(1)
          .join(' ')
          .trim() ??
        '',
      email: existing.email,
      phone: existing.phone,
      personalId: existing.personalId,
      subject: existing.subject ?? '',
      roleId: String(existing.roleId),
      salary: existing.baseSalary !== undefined ? String(existing.baseSalary) : '',
      vacationDays:
        existing.vacationDays !== undefined ? String(existing.vacationDays) : '24',
      lateHoursAllowed:
        existing.lateHoursAllowed !== undefined
          ? String(existing.lateHoursAllowed)
          : '4',
      penaltyPercent:
        existing.penaltyPercent !== undefined ? String(existing.penaltyPercent) : '0',
      selectedBonusIds: (existing.selectedBonusIds ?? []).filter((id) => bonusLookup.has(id)),
      workSchedule: normalizedSchedule,
      workShiftId: findMatchingWorkShiftId(normalizedSchedule),
      campuses: normalizeCampuses(existing.campuses as Campus[] | undefined)
    });
    setError(null);
    setSuccess(null);
    if (useModalForForm) {
      setFormModalOpen(true);
    }
  };

  const cancelEdit = () => {
    const previousRoleId = editingUserId
      ? users.find((user) => user.id === editingUserId)?.roleId
      : undefined;
    setEditingUserId(null);
    resetForm(previousRoleId ? String(previousRoleId) : defaultRoleId);
    setError(null);
    setSuccess(null);
    if (useModalForForm) {
      setFormModalOpen(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError(isEditing ? t.noEditPermission : t.noCreatePermission);
      return;
    }

    const trimmedFirstName = formData.firstName.trim();
    const trimmedLastName = formData.lastName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedPersonalId = formData.personalId.trim();
    const trimmedSubject = formData.subject.trim();
    const roleId = Number.parseInt(formData.roleId, 10);

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedPersonalId ||
      Number.isNaN(roleId)
    ) {
      setError(t.required);
      return;
    }

    const baseSalary = Number.parseFloat(formData.salary);
    if (Number.isNaN(baseSalary) || baseSalary <= 0) {
      setError(t.salaryInvalid);
      return;
    }

    const vacationDays = Number.parseInt(formData.vacationDays, 10);
    if (Number.isNaN(vacationDays) || vacationDays < 0) {
      setError(t.vacationInvalid);
      return;
    }

    const lateHoursAllowed = Number.parseInt(formData.lateHoursAllowed, 10);
    if (Number.isNaN(lateHoursAllowed) || lateHoursAllowed < 0) {
      setError(t.lateHoursInvalid);
      return;
    }

    const penaltyPercent = Number.parseFloat(formData.penaltyPercent);
    if (Number.isNaN(penaltyPercent) || penaltyPercent < 0) {
      setError(t.penaltyInvalid);
      return;
    }

    const campuses = normalizeCampuses(formData.campuses);
    if (campuses.length === 0) {
      setError(t.campusRequired);
      return;
    }

    const emailNormalized = trimmedEmail.toLowerCase();

    const emailAlreadyExists = allUsers.some(
      (user) => user.email.toLowerCase() === emailNormalized && user.id !== editingUserId
    );
    if (emailAlreadyExists) {
      setError(t.duplicateEmail);
      return;
    }

    const personalIdAlreadyExists = allUsers.some(
      (user) => user.personalId === trimmedPersonalId && user.id !== editingUserId
    );
    if (personalIdAlreadyExists) {
      setError(t.duplicatePersonalId);
      return;
    }

    const fullName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(' ');
    const avatar = (trimmedFirstName.charAt(0) || trimmedLastName.charAt(0) || 'U').toUpperCase();
    const normalizedSchedule = sanitizeWorkSchedule(formData.workSchedule);

    setIsSubmitting(true);

    try {
      if (isEditing && editingUserId !== null) {
        const updatedUsers = allUsers.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                name: fullName,
                email: emailNormalized,
                phone: trimmedPhone,
                personalId: trimmedPersonalId,
                subject: trimmedSubject,
                roleId,
                avatar,
                baseSalary,
                vacationDays,
                lateHoursAllowed,
                penaltyPercent,
                selectedBonusIds: [...formData.selectedBonusIds],
                workSchedule: normalizedSchedule,
                campuses
              }
            : user
        );
        await saveUsers(updatedUsers as User[]);
        setSuccess(t.updateSuccess);
        setEditingUserId(null);
        resetForm(String(roleId));
        if (useModalForForm) {
          setFormModalOpen(false);
        }
      } else {
        const nextId = allUsers.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
        await saveUsers([
          ...allUsers,
          {
            id: nextId,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            name: fullName,
            email: emailNormalized,
            phone: trimmedPhone,
            personalId: trimmedPersonalId,
            subject: trimmedSubject,
            roleId,
            avatar,
            mustResetPassword: true,
            baseSalary,
            vacationDays,
            lateHoursAllowed,
            penaltyPercent,
            selectedBonusIds: [...formData.selectedBonusIds],
            vacationDaysUsed: 0,
            graceMinutesUsed: 0,
            penaltyMinutesUsed: 0,
            workSchedule: normalizedSchedule,
            campuses
          }
        ]);
        setSuccess(t.success);
        resetForm(String(roleId));
        if (useModalForForm) {
          setFormModalOpen(false);
        }
      }
    } catch (submitError) {
      console.error('Unable to save user', submitError);
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!canResetPasswords) {
      return;
    }

    const confirmed = window.confirm(t.resetPasswordConfirm);
    if (!confirmed) {
      return;
    }

    try {
      const result = await resetUserPassword(userId);
      if (result) {
        setSuccess(t.resetPasswordSuccess);
        setError(null);
      } else {
        setError(t.genericError);
      }
    } catch (resetError) {
      console.error('Unable to reset password', resetError);
      setError(t.genericError);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(t.deleteUserConfirm);
    if (!confirmed) {
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result) {
        setSuccess(t.deleteUserSuccess);
        setError(null);
        if (editingUserId === userId) {
          setEditingUserId(null);
          resetForm(defaultRoleId);
        }
      } else {
        setError(t.genericError);
      }
    } catch (deleteError) {
      console.error('Unable to delete user', deleteError);
      setError(t.genericError);
    }
  };
  const handleToggleBonus = (bonusId: number) => {
    setFormData((previous) =>
      previous.selectedBonusIds.includes(bonusId)
        ? {
            ...previous,
            selectedBonusIds: previous.selectedBonusIds.filter((id) => id !== bonusId)
          }
        : { ...previous, selectedBonusIds: [...previous.selectedBonusIds, bonusId] }
    );
  };

  const handleWorkShiftSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === '' || value === undefined) {
      setFormData((previous) => ({ ...previous, workShiftId: null }));
      return;
    }
    const shiftId = Number(value);
    const selectedShift = workShifts.find((shift) => shift.id === shiftId);
    if (!selectedShift) {
      setFormData((previous) => ({ ...previous, workShiftId: null }));
      return;
    }
    setFormData((previous) => ({
      ...previous,
      workShiftId: shiftId,
      workSchedule: cloneSchedule(selectedShift.schedule)
    }));
  };

  const handleOpenManageModal = () => {
    setDraftBonuses(cloneBonusTree(compensationBonuses));
    setBonusFormMode('create');
    setBonusFormParentId(null);
    setBonusFormEditingId(null);
    setBonusFormValues(createBonusFormValues());
    setBonusFormError(null);
    setManageSearch('');
    setManageModalOpen(true);
  };

  const handlePrepareNewBonus = (parentId: number | null) => {
    setBonusFormMode('create');
    setBonusFormParentId(parentId);
    setBonusFormEditingId(null);
    setBonusFormValues(createBonusFormValues());
    setBonusFormError(null);
  };

  const handleStartEditBonus = (bonus: CompensationBonus) => {
    setBonusFormMode('edit');
    setBonusFormEditingId(bonus.id);
    setBonusFormParentId(bonus.parentId ?? null);
    const nextValueType: BonusValueType =
      bonus.amount !== null
        ? 'amount'
        : bonus.percent !== null && bonus.percent !== undefined
          ? 'percent'
          : 'none';
    setBonusFormValues({
      name: bonus.name,
      percent: bonus.percent !== null && bonus.percent !== undefined ? String(bonus.percent) : '',
      amount: bonus.amount !== null && bonus.amount !== undefined ? String(bonus.amount) : '',
      valueType: nextValueType
    });
    setBonusFormError(null);
  };

  const handleSubmitBonusForm = () => {
    const name = bonusFormValues.name.trim();
    if (!name) {
      setBonusFormError(t.required);
      return;
    }

    const { valueType } = bonusFormValues;
    let percent: number | null = null;
    let amount: number | null = null;

    if (valueType === 'percent') {
      const percentValue = bonusFormValues.percent.trim();
      const parsedPercent = Number.parseFloat(percentValue);
      if (percentValue === '' || Number.isNaN(parsedPercent) || parsedPercent < 0) {
        setBonusFormError(t.bonusValueInvalid);
        return;
      }
      percent = parsedPercent;
    } else if (valueType === 'amount') {
      const amountValue = bonusFormValues.amount.trim();
      const parsedAmount = Number.parseFloat(amountValue);
      if (amountValue === '' || Number.isNaN(parsedAmount) || parsedAmount < 0) {
        setBonusFormError(t.bonusValueInvalid);
        return;
      }
      amount = parsedAmount;
    }

    if (bonusFormMode === 'edit' && bonusFormEditingId !== null) {
      setDraftBonuses((previous) =>
        updateBonusNode(previous, bonusFormEditingId, (node) => ({
          ...node,
          name,
          percent,
          amount,
          valueType: valueType ?? 'none'
        }))
      );
    } else {
      const newNode: CompensationBonus = {
        id: generateTempBonusId(),
        parentId: bonusFormParentId,
        name,
        percent,
        amount,
        valueType: valueType ?? 'none',
        children: []
      };
      setDraftBonuses((previous) => addBonusNode(previous, bonusFormParentId, newNode));
    }

    handlePrepareNewBonus(null);
  };

  const handleDeleteBonus = (bonusId: number) => {
    const confirmed = window.confirm(t.bonusDeleteConfirm);
    if (!confirmed) {
      return;
    }
    setDraftBonuses((previous) => deleteBonusNode(previous, bonusId));
    setFormData((previous) => ({
      ...previous,
      selectedBonusIds: previous.selectedBonusIds.filter((id) => id !== bonusId)
    }));
  };

  const handleSaveBonusCatalogue = async () => {
    setBonusSaving(true);
    setBonusFormError(null);
    try {
      await saveCompensationBonuses(convertToInputPayload(draftBonuses));
      setManageModalOpen(false);
      setSuccess(t.bonusSave);
    } catch (saveError) {
      console.error('Unable to save bonuses', saveError);
      setBonusFormError(t.genericError);
    } finally {
      setBonusSaving(false);
    }
  };

  const filteredSelectableBonuses = useMemo(
    () => filterBonusTree(compensationBonuses, bonusSearch),
    [bonusSearch, compensationBonuses]
  );

  const filteredDraftList = useMemo(
    () => filterBonusTree(draftBonuses, manageSearch),
    [draftBonuses, manageSearch]
  );

  const renderFormCard = () => (
    <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          {isEditing ? t.editTitle : t.formTitle}
        </h2>
        <p className="text-sm text-slate-500">{t.passwordNotice}</p>
      </div>

      <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.firstName}</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.lastName}</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.email}</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.phone}</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.personalId}</label>
          <input
            type="text"
            name="personalId"
            value={formData.personalId}
            placeholder={t.personalIdPlaceholder}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.subjectLabel}</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            placeholder={t.subjectPlaceholder}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-600">{t.campusesLabel}</label>
          <div className="flex flex-wrap gap-3">
            {ALL_CAMPUSES.map((campus) => {
              const isChecked = formData.campuses.includes(campus);
              const label = campus === 'marneuli' ? t.campusMarneuli : t.campusTbilisi;
              return (
                <label
                  key={campus}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    isChecked
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCampusToggle(campus)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">{t.campusHelper}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.role}</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.salary}</label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              className="w-full flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setBonusModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t.openBonusModal}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.vacationDays}</label>
          <input
            type="number"
            name="vacationDays"
            value={formData.vacationDays}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.lateHoursAllowed}</label>
          <input
            type="number"
            name="lateHoursAllowed"
            value={formData.lateHoursAllowed}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{t.penaltyPercent}</label>
          <input
            type="number"
            name="penaltyPercent"
            value={formData.penaltyPercent}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600">{t.workScheduleTitle}</label>
          <p className="text-xs text-slate-500">{t.workScheduleDescription}</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap gap-4">
                <span>
                  <span className="font-semibold text-slate-900">{t.workScheduleSelectedDays}:</span>{' '}
                  {workingDayCount}/7
                </span>
                <span>
                  <span className="font-semibold text-slate-900">{t.workScheduleSummaryLabel}:</span>{' '}
                  <span className="font-semibold text-emerald-600">
                    {formatDuration(weeklyMinutes, language)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-600">{t.workShiftLabel}</label>
          <select
            name="workShiftId"
            value={formData.workShiftId ?? ''}
            onChange={handleWorkShiftSelect}
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.workShiftCustomOption}</option>
            {workShifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            {workShifts.length === 0 ? t.workShiftEmpty : t.workShiftPlaceholder}
          </p>
        </div>

        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t.compensationNote}
          {formData.salary && (
            <div className="mt-2 text-slate-800">
              <p>
                {t.bonusSummarySelected}: {formData.selectedBonusIds.length}
              </p>
              <p>
                {t.bonusSummaryPercent}: +{totalBonusPercent.toFixed(2)}%
              </p>
              <p>
                {t.bonusSummaryAmount}: +{formatGel(totalBonusAmount)}
              </p>
              {formExtraAmount > 0 && (
                <p>
                  {t.bonusSummaryExtra}: +{formatGel(formExtraAmount)}
                </p>
              )}
              <p>{t.bonusSummaryGross}: {formatGel(grossSalaryPreview)}</p>
              <p>
                {t.bonusSummaryTax} ({previewTaxRate.toFixed(1)}%): -{formatGel(taxAmountPreview)}
              </p>
              {deductionTotalPreview > 0 ? (
                <p>
                  {t.bonusSummaryDeductions}: -{formatGel(deductionTotalPreview)}
                </p>
              ) : null}
              <p className="font-semibold">
                {t.bonusSummaryFinal}: {formatGel(finalSalary)}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:gap-4 min-h-[1.25rem]">
            {error ? <span className="text-red-500">{error}</span> : null}
            {success ? <span className="text-emerald-600">{success}</span> : null}
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.cancelEdit}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit || roles.length === 0}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (isEditing ? t.updating : t.adding) : isEditing ? t.update : t.add}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
  return (
    <div className="space-y-8">
      {showPageHeading ? (
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
          <p className="mt-2 text-slate-600">{t.subtitle}</p>
        </div>
      ) : null}

      {useModalForForm && formModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={cancelEdit}
              className="absolute right-4 top-4 rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 shadow hover:bg-white"
              aria-label="Close user form"
            >
              <X size={16} />
            </button>
            <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-1 sm:p-2">
              {renderFormCard()}
            </div>
          </div>
        </div>
      ) : null}

      {showFormSection && !useModalForForm ? renderFormCard() : null}
      {showListSection ? (
        <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-slate-800">{t.listTitle}</h2>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full md:w-72 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {filteredUsers.length === 0 ? (
          <p className="text-slate-500 text-sm">{t.emptyState}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnName}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnEmail}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnPhone}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnPersonalId}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnSubject}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnRole}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnSalary}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnBonuses}
                  </th>
                  {(canEdit || canResetPasswords) && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t.columnActions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const displayName =
                    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || '�';
                  const userBonusPercent = (user.selectedBonusIds ?? []).reduce(
                    (total, id) => total + (bonusLookup.get(id)?.percent ?? 0),
                    0
                  );
                  const userBonusAmount = (user.selectedBonusIds ?? []).reduce(
                    (total, id) => total + (bonusLookup.get(id)?.amount ?? 0),
                    0
                  );
                  const salary = user.baseSalary ?? 0;
                  const userExtra = extraBonusByUser.get(user.id);
                  const extraAmount = userExtra?.amount ?? 0;
                  const userFinalSalary =
                    salary + (salary * userBonusPercent) / 100 + userBonusAmount + extraAmount;
                  const bonusBadges = [
                    userBonusPercent > 0 ? `+${userBonusPercent.toFixed(2)}%` : null,
                    userBonusAmount > 0 ? `+${formatGel(userBonusAmount)}` : null,
                    extraAmount > 0 ? `${t.extraBadge}: +${formatGel(extraAmount)}` : null
                  ].filter(Boolean);

                  return (
                    <tr key={user.id} className={editingUserId === user.id ? 'bg-blue-50/60' : undefined}>
                      <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                          {user.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span>{displayName}</span>
                          {user.subject ? (
                            <span className="text-xs text-slate-500">
                              {t.subjectLabel}: {user.subject}
                            </span>
                          ) : null}
                          <div className="mt-1 flex flex-wrap gap-1">
                            {normalizeCampuses(user.campuses as Campus[] | undefined).map((campusValue) => (
                              <span
                                key={`${user.id}-${campusValue}`}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                {campusValue === 'marneuli' ? t.campusMarneuli : t.campusTbilisi}
                              </span>
                            ))}
                          </div>
                          {user.mustResetPassword ? (
                            <span className="text-xs text-amber-600">{t.resetPassword}</span>
                          ) : null}
                        </div>
                      </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.phone || '�'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.personalId || '�'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{roleLookup.get(user.roleId) ?? t.unknownRole}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatGel(userFinalSalary)}
                        {bonusBadges.length > 0 ? (
                          <span className="block text-xs text-slate-400">{bonusBadges.join(' · ')}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {(user.selectedBonusIds ?? []).length}
                      </td>
                      {(canEdit || canResetPasswords || canDelete) && (
                        <td className="px-4 py-3 text-sm text-slate-600 space-x-3">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => startEditing(user.id)}
                              disabled={isSubmitting || (isEditing && editingUserId === user.id)}
                              className="text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              {t.editAction}
                            </button>
                          )}
                          {canResetPasswords && (
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user.id)}
                              disabled={isSubmitting}
                              className="text-slate-600 hover:text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              {t.resetPassword}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={isSubmitting}
                              className="text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                              {t.deleteUser}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      ) : null}

      {scheduleModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setScheduleModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-slate-900">{t.workScheduleModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close schedule modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
              {formData.workSchedule.map((entry) => (
                <div key={entry.dayOfWeek} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {WEEKDAY_LABELS[language][entry.dayOfWeek]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.isWorking ? t.workScheduleWorkingDay : t.workScheduleDayOff}
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-emerald-600">
                      {formatDuration(calculateDailyMinutes(entry), language)}
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={entry.isWorking}
                        onChange={(event) =>
                          handleToggleWorkDay(entry.dayOfWeek, event.target.checked)
                        }
                      />
                      {entry.isWorking ? t.workScheduleWorkingDay : t.workScheduleDayOff}
                    </label>
                  </div>
                  {entry.isWorking ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.workScheduleStartLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={(entry.startTime ?? '09:00').split(':')[0]}
                            onChange={(event) => {
                              const [, minutePart = '00'] = (entry.startTime ?? '09:00').split(':');
                              handleScheduleTimeChange(
                                entry.dayOfWeek,
                                'startTime',
                                `${event.target.value}:${minutePart.padStart(2, '0')}`
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {TIME_HOURS.map((hour) => (
                              <option key={`start-hour-${hour}`} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                          <span className="text-slate-400">:</span>
                          <select
                            value={(entry.startTime ?? '09:00').split(':')[1] ?? '00'}
                            onChange={(event) => {
                              const [hourPart = '09'] = (entry.startTime ?? '09:00').split(':');
                              handleScheduleTimeChange(
                                entry.dayOfWeek,
                                'startTime',
                                `${hourPart.padStart(2, '0')}:${event.target.value}`
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {TIME_MINUTES.map((minute) => (
                              <option key={`start-minute-${minute}`} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.workScheduleEndLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <select
                            value={(entry.endTime ?? '18:00').split(':')[0]}
                            onChange={(event) => {
                              const [, minutePart = '00'] = (entry.endTime ?? '18:00').split(':');
                              handleScheduleTimeChange(
                                entry.dayOfWeek,
                                'endTime',
                                `${event.target.value}:${minutePart.padStart(2, '0')}`
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {TIME_HOURS.map((hour) => (
                              <option key={`end-hour-${hour}`} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                          <span className="text-slate-400">:</span>
                          <select
                            value={(entry.endTime ?? '18:00').split(':')[1] ?? '00'}
                            onChange={(event) => {
                              const [hourPart = '18'] = (entry.endTime ?? '18:00').split(':');
                              handleScheduleTimeChange(
                                entry.dayOfWeek,
                                'endTime',
                                `${hourPart.padStart(2, '0')}:${event.target.value}`
                              );
                            }}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {TIME_MINUTES.map((minute) => (
                              <option key={`end-minute-${minute}`} value={minute}>
                                {minute}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.workScheduleBreakLabel}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={entry.breakMinutes}
                          onChange={(event) =>
                            handleScheduleBreakChange(entry.dayOfWeek, Number(event.target.value))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {t.workScheduleSummaryLabel}:{' '}
                <strong className="text-slate-900">
                  {formatDuration(weeklyMinutes, language)}
                </strong>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t.workScheduleModalCancel}
                </button>
                <button
                  type="button"
                  onClick={handleScheduleModalSave}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  {t.workScheduleModalSave}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {bonusModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setBonusModalOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t.bonusModalTitle}</h3>
                <p className="text-sm text-slate-500">{t.bonusSelectHint}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBonusModalOpen(false);
                    handleOpenManageModal();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
                >
                  {t.manageBonuses}
                </button>
                <button
                  type="button"
                  onClick={() => setBonusModalOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close bonuses modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="border-b border-slate-200 px-6 py-3">
              <input
                type="search"
                value={bonusSearch}
                onChange={(event) => setBonusSearch(event.target.value)}
                placeholder={t.bonusSearchPlaceholder}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto px-6 py-4 space-y-3">
              {filteredSelectableBonuses.length === 0 ? (
                <p className="text-sm text-slate-500">{t.bonusEmptyState}</p>
              ) : (
                filteredSelectableBonuses.map((bonus) => (
                  <BonusTreeNode
                    key={bonus.id}
                    node={bonus}
                    depth={0}
                    selected={formData.selectedBonusIds}
                    onToggle={handleToggleBonus}
                  />
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm">
              <span className="text-slate-600">
                {t.bonusSelectedCount}: {formData.selectedBonusIds.length}
              </span>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setBonusModalOpen(false)}
              >
                {t.bonusClose}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manageModalOpen ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setManageModalOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t.bonusManageTitle}</h3>
                <p className="text-sm text-slate-500">{t.bonusSelectHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-4 md:grid-cols-[2fr,1fr]">
              <div className="space-y-4">
                <input
                  type="search"
                  value={manageSearch}
                  onChange={(event) => setManageSearch(event.target.value)}
                  placeholder={t.bonusSearchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {filteredDraftList.length === 0 ? (
                    <p className="text-sm text-slate-500">{t.bonusEmptyState}</p>
                  ) : (
                    filteredDraftList.map((bonus) => (
                      <ManageTreeNode
                        key={bonus.id}
                        node={bonus}
                        onAddChild={(target) => handlePrepareNewBonus(target.id)}
                        onEdit={(target) => handleStartEditBonus(target)}
                        onDelete={(target) => handleDeleteBonus(target.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    {bonusFormMode === 'edit' ? t.bonusEdit : t.bonusAddRoot}
                  </p>
                  <button
                    type="button"
                    onClick={() => handlePrepareNewBonus(null)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + {t.bonusAddRoot}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">{t.bonusName}</label>
                  <input
                    type="text"
                    value={bonusFormValues.name}
                    onChange={(event) =>
                      setBonusFormValues((previous) => ({ ...previous, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">{t.bonusValueType}</label>
                  <select
                    value={bonusFormValues.valueType}
                    onChange={(event) =>
                      setBonusFormValues((previous) => {
                        const nextValueType = event.target.value as BonusValueType;
                        return {
                          ...previous,
                          valueType: nextValueType,
                          percent: nextValueType === 'percent' ? previous.percent : '',
                          amount: nextValueType === 'amount' ? previous.amount : ''
                        };
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percent">{t.bonusValuePercent}</option>
                    <option value="amount">{t.bonusValueAmount}</option>
                    <option value="none">{t.bonusValueNone}</option>
                  </select>
                </div>

                {bonusFormValues.valueType === 'percent' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">{t.bonusPercent}</label>
                    <input
                      type="number"
                      value={bonusFormValues.percent}
                      onChange={(event) =>
                        setBonusFormValues((previous) => ({
                          ...previous,
                          percent: event.target.value
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : null}

                {bonusFormValues.valueType === 'amount' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">{t.bonusAmount}</label>
                    <input
                      type="number"
                      value={bonusFormValues.amount}
                      onChange={(event) =>
                        setBonusFormValues((previous) => ({
                          ...previous,
                          amount: event.target.value
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ) : null}

                {bonusFormError ? <p className="text-sm text-red-500">{bonusFormError}</p> : null}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitBonusForm}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {bonusFormMode === 'edit' ? t.bonusUpdate : t.bonusCreate}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrepareNewBonus(null)}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    {t.bonusCancel}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBonusCatalogue}
                  disabled={bonusSaving}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {bonusSaving ? `${t.bonusSave}...` : t.bonusSave}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
interface BonusTreeNodeProps {
  node: CompensationBonus;
  depth: number;
  selected: number[];
  onToggle: (id: number) => void;
}

const getBonusValueLabel = (node: CompensationBonus): string | null => {
  if (node.valueType === 'amount' && node.amount !== null && node.amount !== undefined) {
    return `+${formatGel(node.amount)}`;
  }
  if (node.valueType === 'percent' && node.percent !== null && node.percent !== undefined) {
    return `+${node.percent}%`;
  }
  return null;
};

const BonusTreeNode: React.FC<BonusTreeNodeProps> = ({ node, depth, selected, onToggle }) => {
  const valueLabel = getBonusValueLabel(node);
  const isSelectable = Boolean(valueLabel);
  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          {isSelectable ? (
            <input
              type="checkbox"
              checked={selected.includes(node.id)}
              onChange={() => onToggle(node.id)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
          ) : (
            <span className="inline-flex h-4 w-4 items-center justify-center text-xs text-slate-400" aria-hidden="true">&bull;</span>
          )}
          <span className="text-sm font-medium text-slate-700">
            {node.name}
            {valueLabel ? <span className="ml-2 text-emerald-600 font-semibold">{valueLabel}</span> : null}
          </span>
        </div>
      </div>
      {node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map((child) => (
            <BonusTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={selected}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ManageTreeNodeProps {
  node: CompensationBonus;
  onAddChild: (node: CompensationBonus) => void;
  onEdit: (node: CompensationBonus) => void;
  onDelete: (node: CompensationBonus) => void;
}

const ManageTreeNode: React.FC<ManageTreeNodeProps> = ({ node, onAddChild, onEdit, onDelete }) => (
  <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {node.name}{' '}
          {getBonusValueLabel(node) ? (
            <span className="text-emerald-600">({getBonusValueLabel(node)})</span>
          ) : null}
        </p>
        {node.children.length > 0 ? (
          <p className="text-xs text-slate-500">{node.children.length}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => onAddChild(node)}
          className="rounded-md border border-slate-200 p-1 text-emerald-600 hover:bg-emerald-50"
          aria-label="Add subcategory"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => onEdit(node)}
          className="rounded-md border border-slate-200 p-1 text-blue-600 hover:bg-blue-50"
          aria-label="Edit bonus"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(node)}
          className="rounded-md border border-slate-200 p-1 text-red-600 hover:bg-red-50"
          aria-label="Delete bonus"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    {node.children.length > 0 && (
      <div className="mt-2 space-y-2 border-l border-slate-200 pl-4">
        {node.children.map((child) => (
          <ManageTreeNode
            key={child.id}
            node={child}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </div>
);










