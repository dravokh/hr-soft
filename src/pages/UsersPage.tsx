
import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { CompensationBonus, CompensationBonusInput, User, WorkScheduleDay, Weekday } from '../types';
import { createDefaultWorkSchedule, sanitizeWorkSchedule } from '../utils/workSchedule';

interface UsersPageProps {
  language: 'ka' | 'en';
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  personalId: string;
  roleId: string;
  salary: string;
  vacationDays: string;
  lateHoursAllowed: string;
  penaltyPercent: string;
  selectedBonusIds: number[];
  workSchedule: WorkScheduleDay[];
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
  searchPlaceholder: string;
  listTitle: string;
  emptyState: string;
  columnName: string;
  columnEmail: string;
  columnPhone: string;
  columnPersonalId: string;
  columnRole: string;
  columnSalary: string;
  columnBonuses: string;
  columnActions: string;
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
  bonusParent: string;
  bonusCreate: string;
  bonusUpdate: string;
  bonusCancel: string;
  bonusSave: string;
  bonusClose: string;
  bonusSelectedCount: string;
    workScheduleTitle: "სამუშაო გრაფიკი",
    workScheduleDescription: "დააყენეთ თანამშრომლის სამუშაო დღეები, საათები და შესვენებები.",
    workScheduleButton: "სამუშაო ცვლა",
    workScheduleModalTitle: "სამუშაო გრაფიკის კონფიგურაცია",
    workScheduleWorkingDay: "სამუშაო დღე",
    workScheduleDayOff: "დასვენების დღე",
    workScheduleStartLabel: "დაწყების დრო",
    workScheduleEndLabel: "დასრულების დრო",
    workScheduleBreakLabel: "შესვენება (წუთი)",
    workScheduleModalSave: "გრაფიკის შენახვა",
    workScheduleModalCancel: "დახურვა",
    workScheduleSummaryLabel: "კვირის დატვირთვა",
    workScheduleSelectedDays: "სამუშაო დღეების რაოდენობა"
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
};

const COPY: Record<UsersPageProps["language"], CopyEntry> = {
  ka: {
    title: "მომხმარებლები",
    subtitle: "დაამატეთ ახალი თანამშრომლები და გადაამოწმეთ ვისაც უკვე აქვს წვდომა.",
    formTitle: "ახალი მომხმარებლის შექმნა",
    editTitle: "მომხმარებლის რედაქტირება",
    firstName: "სახელი",
    lastName: "გვარი",
    email: "ელ. ფოსტა",
    phone: "ტელეფონის ნომერი",
    personalId: "პირადი ნომერი",
    personalIdPlaceholder: "01001000001",
    passwordNotice: "მომხმარებლები იქმნება დროებითი პაროლით 123 და პირველ შესვლაზე უნდა შეცვალონ იგი.",
    role: "როლი",
    salary: "ხელფასი (₾)",
    bonuses: "დანამატები",
    openBonusModal: "დანამატების არჩევა",
    manageBonuses: "კატალოგის მართვა",
    bonusSummarySelected: "არჩეული დანამატები",
    bonusSummaryPercent: "სულ დანამატი",
    bonusSummaryFinal: "საბოლოო ხელფასი",
    vacationDays: "ანაზღაურებადი შვებულება (დღე)",
    lateHoursAllowed: "საპატიო დაგვიანების საათები",
    penaltyPercent: "დაკლება თითოეულ გადაცდენილ საათზე (%)",
    compensationNote: "მომხმარებლები იქმნება დროებითი პაროლით 123 და პირველ ავტორიზაციისას უნდა შეცვალონ იგი. საპატიო ლიმიტის ამოწურვის შემდეგ თითოეული საათი იწვევს მითითებული პროცენტის დაკლებას.",
    add: "მომხმარებლის დამატება",
    adding: "მომხმარებლის დამატება...",
    update: "მონაცემების განახლება",
    updating: "მონაცემების განახლება...",
    success: "მომხმარებელი წარმატებით დაემატა. შეტყობინება გაიგზავნა მითითებულ ელ. ფოსტაზე.",
    updateSuccess: "მომხმარებლის მონაცემები წარმატებით განახლდა.",
    resetPasswordSuccess: "პაროლი განულდა (123). სთხოვეთ თანამშრომელს შეცვალოს იგი პირველად შესვლისას.",
    required: "ეს ველი სავალდებულოა.",
    salaryInvalid: "ხელფასი უნდა იყოს დადებითი რიცხვი.",
    vacationInvalid: "შვებულების დღეები უნდა იყოს 0-ზე მეტი.",
    lateHoursInvalid: "საპატიო საათები უნდა იყოს არანაკლებ 0-ის.",
    penaltyInvalid: "დაკლება უნდა იყოს 0 ან მეტი.",
    duplicateEmail: "ეს ელ. ფოსტა უკვე გამოყენებულია.",
    duplicatePersonalId: "ეს პირადი ნომერი უკვე რეგისტრირებულია.",
    genericError: "დაფიქსირდა გაუთვალისწინებელი შეცდომა. სცადეთ ხელახლა.",
    noCreatePermission: "თქვენ არ გაქვთ მომხმარებლების შექმნის უფლება.",
    noEditPermission: "თქვენ არ გაქვთ მომხმარებლების რედაქტირების უფლება.",
    noViewPermission: "თქვენ არ გაქვთ მომხმარებლების ნახვის უფლება.",
    cancelEdit: "რედაქტირების გაუქმება",
    editAction: "რედაქტირება",
    resetPassword: "პაროლის განულება",
    resetPasswordConfirm: "დარწმუნებული ხართ, რომ გსურთ ამ თანამშრომლის პაროლის განულება დეფოლტ 123-მდე?",
    searchPlaceholder: "ძებნა სახელით, ელ. ფოსტით ან პირადი ნომრით...",
    listTitle: "დარეგისტრირებული მომხმარებლები",
    emptyState: "მომხმარებლები ჯერ არ არის დამატებული.",
    columnName: "სახელი",
    columnEmail: "ელ. ფოსტა",
    columnPhone: "ტელეფონი",
    columnPersonalId: "პირადი ნომერი",
    columnRole: "როლი",
    columnSalary: "ხელფასი",
    columnBonuses: "დანამატები",
    columnActions: "ქმედებები",
    unknownRole: "უცნობი როლი",
    bonusModalTitle: "დანამატების არჩევა",
    bonusManageTitle: "დანამატების კატალოგი",
    bonusSearchPlaceholder: "ძებნა კატეგორიის ან ქვეკატეგორიის მიხედვით...",
    bonusEmptyState: "დანამატები ჯერ არ არის დამატებული.",
    bonusSelectHint: "მონიშნეთ დანამატები და დაადასტურეთ არჩევანი.",
    bonusAddRoot: "ახალი კატეგორია",
    bonusAddChild: "ქვეკატეგორიის დამატება",
    bonusEdit: "რედაქტირება",
    bonusDelete: "წაშლა",
    bonusDeleteConfirm: "დარწმუნებული ხართ, რომ გსურთ ჩანაწერის წაშლა?",
    bonusName: "დასახელება",
    bonusPercent: "დანამატი (%)",
    bonusParent: "მშობელი",
    bonusCreate: "დამატება",
    bonusUpdate: "განახლება",
    bonusCancel: "გაუქმება",
    bonusSave: "კატალოგის შენახვა",
    bonusClose: "დახურვა",
    bonusSelectedCount: "არჩეული"
  },
  en: {
    title: "Users",
    subtitle: "Create employees, assign roles, and manage compensation from one screen.",
    formTitle: "Create a new user",
    editTitle: "Edit user",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone number",
    personalId: "Personal ID",
    personalIdPlaceholder: "01001000001",
    passwordNotice: "New users start with password 123 and must change it on first login.",
    role: "Role",
    salary: "Salary (₾)",
    bonuses: "Bonuses",
    openBonusModal: "Select bonuses",
    manageBonuses: "Manage catalogue",
    bonusSummarySelected: "Selected bonuses",
    bonusSummaryPercent: "Total bonus",
    bonusSummaryFinal: "Final salary",
    vacationDays: "Paid vacation days",
    lateHoursAllowed: "Grace period (hours)",
    penaltyPercent: "Penalty per extra hour (%)",
    compensationNote: "After the grace period each extra hour applies this deduction.",
    add: "Add user",
    adding: "Adding user...",
    update: "Update user",
    updating: "Updating...",
    success: "User created successfully. They must change their password on first login.",
    updateSuccess: "User information updated.",
    resetPasswordSuccess: "Password reset to 123. They will pick a new one on next login.",
    required: "Please complete the required fields.",
    salaryInvalid: "Enter a salary amount.",
    vacationInvalid: "Enter vacation days.",
    lateHoursInvalid: "Enter allowed late hours.",
    penaltyInvalid: "Enter the penalty percentage (it may be 0).",
    duplicateEmail: "This email address already exists.",
    duplicatePersonalId: "This personal ID is already in use.",
    genericError: "Something went wrong. Please try again.",
    noCreatePermission: "You cannot create users.",
    noEditPermission: "You cannot edit users.",
    noViewPermission: "You cannot view users.",
    cancelEdit: "Cancel edit",
    editAction: "Edit",
    resetPassword: "Reset password",
    resetPasswordConfirm: "Reset this user's password? They will set a new one on next login.",
    searchPlaceholder: "Search by name, email, or role...",
    listTitle: "Registered users",
    emptyState: "No users match your filters.",
    columnName: "Name",
    columnEmail: "Email",
    columnPhone: "Phone",
    columnPersonalId: "Personal ID",
    columnRole: "Role",
    columnSalary: "Salary",
    columnBonuses: "Bonuses",
    columnActions: "Actions",
    unknownRole: "Unknown role",
    bonusModalTitle: "Select bonuses",
    bonusManageTitle: "Bonus catalogue",
    bonusSearchPlaceholder: "Search by category or subcategory...",
    bonusEmptyState: "No bonuses have been added yet.",
    bonusSelectHint: "Only items with a percentage can be selected.",
    bonusAddRoot: "Add category",
    bonusAddChild: "Add subcategory",
    bonusEdit: "Edit",
    bonusDelete: "Delete",
    bonusDeleteConfirm: "Delete this bonus and its children?",
    bonusName: "Name",
    bonusPercent: "Percent (%)",
    bonusParent: "Parent",
    bonusCreate: "Add",
    bonusUpdate: "Save",
    bonusCancel: "Cancel",
    bonusSave: "Save catalogue",
    bonusClose: "Close",
    bonusSelectedCount: "selected",
    workScheduleTitle: "Work schedule",
    workScheduleDescription: "Configure this user's working days, hours, and breaks.",
    workScheduleButton: "Work shift",
    workScheduleModalTitle: "Work shift configuration",
    workScheduleWorkingDay: "Working day",
    workScheduleDayOff: "Day off",
    workScheduleStartLabel: "Start time",
    workScheduleEndLabel: "End time",
    workScheduleBreakLabel: "Break (minutes)",
    workScheduleModalSave: "Save schedule",
    workScheduleModalCancel: "Close",
    workScheduleSummaryLabel: "Weekly workload",
    workScheduleSelectedDays: "Working days"
  }
};

const WEEKDAY_LABELS: Record<UsersPageProps['language'], Record<Weekday, string>> = {
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
export const UsersPage: React.FC<UsersPageProps> = ({ language }) => {
  const {
    roles,
    users,
    compensationBonuses,
    saveUsers,
    saveCompensationBonuses,
    resetUserPassword,
    hasPermission
  } = useAppContext();
  const t = COPY[language];

  const defaultRoleId = useMemo(() => (roles[0] ? String(roles[0].id) : ''), [roles]);

  const [formData, setFormData] = useState<FormState>(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personalId: '',
    roleId: defaultRoleId,
    salary: '',
    vacationDays: '24',
    lateHoursAllowed: '4',
    penaltyPercent: '0',
    selectedBonusIds: [],
    workSchedule: createDefaultWorkSchedule()
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
  const [bonusFormValues, setBonusFormValues] = useState({ name: '', percent: '' });
  const [bonusFormError, setBonusFormError] = useState<string | null>(null);
  const [bonusSaving, setBonusSaving] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

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
      )
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
    setFormData((previous) => ({
      ...previous,
      workSchedule: sanitizeWorkSchedule(previous.workSchedule)
    }));
    setScheduleModalOpen(false);
  };

  const canView = hasPermission('view_users');
  const canCreate = hasPermission('create_users');
  const canEdit = hasPermission('edit_users');
  const canResetPasswords = hasPermission('reset_passwords');
  const isEditing = editingUserId !== null;
  const canSubmit = isEditing ? canEdit : canCreate;

  const roleLookup = useMemo(() => new Map(roles.map((role) => [role.id, role.name])), [roles]);

  const bonusLookup = useMemo(() => {
    const map = new Map<number, { name: string; percent: number | null }>();
    const walk = (nodes: CompensationBonus[]) => {
      nodes.forEach((node) => {
        map.set(node.id, { name: node.name, percent: node.percent ?? null });
        walk(node.children ?? []);
      });
    };
    walk(compensationBonuses);
    return map;
  }, [compensationBonuses]);

  const totalBonusPercent = useMemo(
    () =>
      formData.selectedBonusIds.reduce(
        (total, id) => total + (bonusLookup.get(id)?.percent ?? 0),
        0
      ),
    [formData.selectedBonusIds, bonusLookup]
  );

  const finalSalary = useMemo(() => {
    const base = Number.parseFloat(formData.salary || '0');
    if (Number.isNaN(base)) {
      return 0;
    }
    return base + (base * totalBonusPercent) / 100;
  }, [formData.salary, totalBonusPercent]);

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
      return (
        fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.personalId?.toLowerCase().includes(term) ||
        roleName.toLowerCase().includes(term)
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

  const resetForm = (nextRoleId?: string) => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      personalId: '',
      roleId: nextRoleId ?? defaultRoleId,
      salary: '',
      vacationDays: '24',
      lateHoursAllowed: '4',
      penaltyPercent: '0',
      selectedBonusIds: [],
      workSchedule: createDefaultWorkSchedule()
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
      workSchedule: sanitizeWorkSchedule(existing.workSchedule)
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    const previousRoleId = editingUserId
      ? users.find((user) => user.id === editingUserId)?.roleId
      : undefined;
    setEditingUserId(null);
    resetForm(previousRoleId ? String(previousRoleId) : defaultRoleId);
    setError(null);
    setSuccess(null);
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

    const emailNormalized = trimmedEmail.toLowerCase();

    const emailAlreadyExists = users.some(
      (user) => user.email.toLowerCase() === emailNormalized && user.id !== editingUserId
    );
    if (emailAlreadyExists) {
      setError(t.duplicateEmail);
      return;
    }

    const personalIdAlreadyExists = users.some(
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
        const updatedUsers = users.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                name: fullName,
                email: emailNormalized,
                phone: trimmedPhone,
                personalId: trimmedPersonalId,
                roleId,
                avatar,
                baseSalary,
                vacationDays,
                lateHoursAllowed,
                penaltyPercent,
                selectedBonusIds: [...formData.selectedBonusIds],
                workSchedule: normalizedSchedule
              }
            : user
        );
        await saveUsers(updatedUsers as User[]);
        setSuccess(t.updateSuccess);
        setEditingUserId(null);
        resetForm(String(roleId));
      } else {
        const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
        await saveUsers([
          ...users,
          {
            id: nextId,
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            name: fullName,
            email: emailNormalized,
            phone: trimmedPhone,
            personalId: trimmedPersonalId,
            password: '123',
            roleId,
            avatar,
            mustResetPassword: true,
            baseSalary,
            vacationDays,
            lateHoursAllowed,
            penaltyPercent,
            selectedBonusIds: [...formData.selectedBonusIds],
            workSchedule: normalizedSchedule
          }
        ]);
        setSuccess(t.success);
        resetForm(String(roleId));
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

  const handleOpenManageModal = () => {
    setDraftBonuses(cloneBonusTree(compensationBonuses));
    setBonusFormMode('create');
    setBonusFormParentId(null);
    setBonusFormEditingId(null);
    setBonusFormValues({ name: '', percent: '' });
    setBonusFormError(null);
    setManageSearch('');
    setManageModalOpen(true);
  };

  const handlePrepareNewBonus = (parentId: number | null) => {
    setBonusFormMode('create');
    setBonusFormParentId(parentId);
    setBonusFormEditingId(null);
    setBonusFormValues({ name: '', percent: '' });
    setBonusFormError(null);
  };

  const handleStartEditBonus = (bonus: CompensationBonus) => {
    setBonusFormMode('edit');
    setBonusFormEditingId(bonus.id);
    setBonusFormParentId(bonus.parentId ?? null);
    setBonusFormValues({
      name: bonus.name,
      percent: bonus.percent !== null && bonus.percent !== undefined ? String(bonus.percent) : ''
    });
    setBonusFormError(null);
  };

  const handleSubmitBonusForm = () => {
    const name = bonusFormValues.name.trim();
    if (!name) {
      setBonusFormError(t.required);
      return;
    }

    const percentValue = bonusFormValues.percent.trim();
    const percent = percentValue === '' ? null : Number.parseFloat(percentValue);
    if (percentValue !== '' && (percent === null || Number.isNaN(percent) || percent < 0)) {
      setBonusFormError(t.penaltyInvalid);
      return;
    }

    if (bonusFormMode === 'edit' && bonusFormEditingId !== null) {
      setDraftBonuses((previous) =>
        updateBonusNode(previous, bonusFormEditingId, (node) => ({
          ...node,
          name,
          percent
        }))
      );
    } else {
      const newNode: CompensationBonus = {
        id: generateTempBonusId(),
        parentId: bonusFormParentId,
        name,
        percent,
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
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
        <p className="text-slate-600 mt-2">{t.subtitle}</p>
      </div>

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
                    <span className="font-semibold text-slate-900">
                      {t.workScheduleSelectedDays}:
                    </span>{' '}
                    {workingDayCount}/7
                  </span>
                  <span>
                    <span className="font-semibold text-slate-900">
                      {t.workScheduleSummaryLabel}:
                    </span>{' '}
                    <span className="font-semibold text-emerald-600">
                      {formatDuration(weeklyMinutes, language)}
                    </span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Clock size={16} className="text-blue-600" />
                <span>{t.workScheduleButton}</span>
              </button>
            </div>
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
                <p className="font-semibold">
                  {t.bonusSummaryFinal}: ₾ {finalSalary.toFixed(2)}
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
                  const salary = user.baseSalary ?? 0;
                  const userFinalSalary = salary + (salary * userBonusPercent) / 100;

                  return (
                    <tr key={user.id} className={editingUserId === user.id ? 'bg-blue-50/60' : undefined}>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center">
                          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                            {user.avatar}
                          </div>
                          <div className="flex flex-col">
                            <span>{displayName}</span>
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
                        ₾ {userFinalSalary.toFixed(2)}
                        <span className="block text-xs text-slate-400">(+{userBonusPercent.toFixed(2)}%)</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {(user.selectedBonusIds ?? []).length}
                      </td>
                      {(canEdit || canResetPasswords) && (
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
                        <input
                          type="time"
                          value={entry.startTime ?? '09:00'}
                          onChange={(event) =>
                            handleScheduleTimeChange(entry.dayOfWeek, 'startTime', event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t.workScheduleEndLabel}
                        </label>
                        <input
                          type="time"
                          value={entry.endTime ?? '18:00'}
                          onChange={(event) =>
                            handleScheduleTimeChange(entry.dayOfWeek, 'endTime', event.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
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
          className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/60 p-4"
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-4" onClick={() => setManageModalOpen(false)}>
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
                  <label className="text-sm font-medium text-slate-600">{t.bonusPercent}</label>
                  <input
                    type="number"
                    value={bonusFormValues.percent}
                    onChange={(event) =>
                      setBonusFormValues((previous) => ({ ...previous, percent: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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

const BonusTreeNode: React.FC<BonusTreeNodeProps> = ({ node, depth, selected, onToggle }) => {
  const hasPercent = node.percent !== null && node.percent !== undefined;
  return (
    <div className="space-y-2" style={{ marginLeft: depth * 16 }}>
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-3">
          {hasPercent ? (
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
            {hasPercent ? <span className="ml-2 text-emerald-600 font-semibold">+{node.percent}%</span> : null}
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
          {node.percent !== null && node.percent !== undefined ? (
            <span className="text-emerald-600">(+{node.percent}%)</span>
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








