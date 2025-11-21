export interface Permission {
  id: string;
  name: string;
  category: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export type Campus = 'marneuli' | 'tbilisi';

export type BonusValueType = 'none' | 'percent' | 'amount';

export interface CompensationBonus {
  id: number;
  parentId: number | null;
  name: string;
  percent: number | null;
  amount: number | null;
  valueType: BonusValueType;
  children: CompensationBonus[];
}

export interface CompensationBonusInput {
  id?: number;
  parentId: number | null;
  name: string;
  percent: number | null;
  amount: number | null;
  children: CompensationBonusInput[];
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface WorkScheduleDay {
  dayOfWeek: Weekday;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
}

export interface WorkShift {
  id: number;
  name: string;
  description?: string;
  schedule: WorkScheduleDay[];
}

export interface User {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  personalId: string;
  subject?: string;
  roleId: number;
  avatar: string;
  mustResetPassword: boolean;
  baseSalary?: number;
  vacationDays?: number;
  lateHoursAllowed?: number;
  penaltyPercent?: number;
  selectedBonusIds?: number[];
  workSchedule?: WorkScheduleDay[];
  vacationDaysUsed?: number;
  graceMinutesUsed?: number;
  penaltyMinutesUsed?: number;
  campuses?: Campus[];
}

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED';
export type ApplicationAction =
  | 'CREATE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'EDIT'
  | 'RESEND'
  | 'CLOSE'
  | 'AUTO_APPROVE'
  | 'EXPIRE_BOUNCE';

export type ApplicationFieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'date_range'
  | 'select'
  | 'number'
  | 'time'
  | 'time_range';

export interface ApplicationFieldDefinition {
  key: string;
  label: { ka: string; en: string };
  type: ApplicationFieldType;
  required: boolean;
  placeholder?: { ka: string; en: string };
  options?: { value: string; label: { ka: string; en: string } }[];
  helper?: { ka: string; en: string };
  editableSteps?: number[];
}

export interface ApplicationStepSLA {
  stepIndex: number;
  seconds: number;
  onExpire: 'AUTO_APPROVE' | 'BOUNCE_BACK';
}

export interface ApplicationTypeCapabilities {
  requiresDateRange: boolean;
  dateRangeRequired: boolean;
  requiresTimeRange: boolean;
  timeRangeRequired: boolean;
  hasCommentField: boolean;
  commentRequired: boolean;
  allowsAttachments: boolean;
  attachmentsRequired: boolean;
  attachmentMaxSizeMb: number;
  usesVacationCalculator: boolean;
  usesGracePeriodTracker: boolean;
  usesPenaltyTracker: boolean;
  usesExtraBonusTracker: boolean;
}

export interface ApplicationType {
  id: number;
  name: { ka: string; en: string };
  description: { ka: string; en: string };
  icon: string;
  color: string;
  fields: ApplicationFieldDefinition[];
  flow: number[];
  slaPerStep: ApplicationStepSLA[];
  capabilities: ApplicationTypeCapabilities;
  allowedRoleIds: number[];
}

export interface Application {
  id: number;
  number: string;
  typeId: number;
  requesterId: number;
  status: ApplicationStatus;
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  dueAt: string | null;
}

export interface ApplicationFieldValue {
  applicationId: number;
  key: string;
  value: string;
}

export interface Attachment {
  id: number;
  applicationId: number;
  name: string;
  url: string;
  uploadedBy: number;
  createdAt: string;
}

export interface ApplicationExtraBonus {
  applicationId: number;
  userId: number;
  workDate: string;
  minutes: number;
  hourlyRate: number;
  bonusPercent: number;
  totalAmount: number;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  applicationId: number;
  actorId: number | null;
  action: ApplicationAction;
  comment?: string;
  at: string;
}

export interface Delegate {
  id: number;
  applicationId: number;
  forRoleId: number;
  delegateUserId: number;
}

export interface ApplicationBundle {
  application: Application;
  values: ApplicationFieldValue[];
  attachments: Attachment[];
  auditTrail: AuditLog[];
  delegates: Delegate[];
  extraBonus?: ApplicationExtraBonus | null;
}

export interface TeacherScheduleSummary {
  teacher: string;
  cambridgeCount: number;
  georgianCount: number;
  assignment?: TeacherScheduleAssignment | null;
}

export interface TeacherScheduleAssignment {
  teacher: string;
  userId: number;
  cambridgeCount: number;
  georgianCount: number;
}

export interface TeacherClassHoursDay {
  dayOfWeek: Weekday;
  cambridgeHours: number;
  georgianHours: number;
}

export interface TeacherClassHoursPlan {
  userId: number;
  days: TeacherClassHoursDay[];
  updatedAt?: string | null;
}

export type CompensationAdjustmentMode = 'percent' | 'fixed';

export interface CompensationAdjustmentConfig {
  id?: number;
  label: string;
  mode: CompensationAdjustmentMode;
  value: number;
}

export interface TeacherScheduleBonusRates {
  cambridge: number;
  georgian: number;
  cover: number;
  taxRate: number;
  adjustments: CompensationAdjustmentConfig[];
}

export type PayrollStatus = 'draft' | 'review' | 'finalized';

export interface PayrollItem {
  id: number;
  userId: number;
  baseSalary: number;
  lessonBonus: number;
  catalogBonus: number;
  extraBonus: number;
  grossAmount: number;
  taxAmount: number;
  deductionAmount: number;
  netAmount: number;
  cambridgeLessons: number;
  georgianLessons: number;
  metadata: Record<string, unknown>;
}

export interface PayrollBatch {
  id: number;
  payrollMonth: string;
  status: PayrollStatus;
  grossTotal: number;
  taxTotal: number;
  deductionTotal: number;
  netTotal: number;
  createdBy: number | null;
  reviewedBy: number | null;
  finalizedBy: number | null;
  createdAt?: string;
  updatedAt?: string;
  items?: PayrollItem[];
}

export interface PayrollStats {
  totalBatches: number;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalDeductions: number;
  recent: PayrollBatch[];
}

export interface WorkCalendarDay {
  date: string;
  isWorking: boolean;
  note: string;
}

export interface Session {
  userId: number;
  timestamp: number;
}

export interface BootstrapData {
  roles: Role[];
  users: User[];
  applicationTypes: ApplicationType[];
  applications: ApplicationBundle[];
  compensationBonuses: CompensationBonus[];
}

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresPasswordReset?: boolean;
  userId?: number;
  token?: string;
  user?: User;
  bootstrap?: BootstrapData;
}

export interface AppContextValue {
  roles: Role[];
  users: User[];
  allUsers: User[];
  compensationBonuses: CompensationBonus[];
  teacherScheduleAssignments: TeacherScheduleAssignment[];
  teacherClassHours: TeacherClassHoursPlan[];
  teacherScheduleBonusRates: TeacherScheduleBonusRates;
  payrollBatches: PayrollBatch[];
  payrollStats: PayrollStats | null;
  workShifts: WorkShift[];
  currentUser: User | null;
  isAuthenticated: boolean;
  activeCampus: Campus | null;
  loading: boolean;
  applicationTypes: ApplicationType[];
  applications: ApplicationBundle[];
  login: (personalId: string, password: string, campus: Campus) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadAllData: () => Promise<void>;
  saveRoles: (roles: Role[]) => Promise<void>;
  saveUsers: (users: User[]) => Promise<void>;
  saveCompensationBonuses: (bonuses: CompensationBonusInput[]) => Promise<CompensationBonus[]>;
  refreshTeacherScheduleAssignments: () => Promise<void>;
  refreshTeacherClassHours: () => Promise<void>;
  saveTeacherClassHours: (
    userId: number,
    days: TeacherClassHoursDay[]
  ) => Promise<TeacherClassHoursPlan | null>;
  refreshTeacherScheduleBonusRates: () => Promise<void>;
  saveTeacherScheduleBonusRates: (rates: TeacherScheduleBonusRates) => Promise<TeacherScheduleBonusRates>;
  refreshPayrollBatches: () => Promise<void>;
  refreshPayrollStats: () => Promise<void>;
  createPayrollBatch: (month: string) => Promise<PayrollBatch>;
  updatePayrollStatus: (batchId: number, status: PayrollStatus) => Promise<PayrollBatch | null>;
  fetchWorkCalendarMonth: (year: number, month: number) => Promise<WorkCalendarDay[]>;
  saveWorkCalendarMonth: (year: number, month: number, days: WorkCalendarDay[]) => Promise<WorkCalendarDay[]>;
  resetUserPassword: (userId: number) => Promise<boolean>;
  deleteUser: (userId: number) => Promise<boolean>;
  completePasswordReset: (userId: number, newPassword: string) => Promise<boolean>;
  saveApplications: (
    applications: ApplicationBundle[] | ((current: ApplicationBundle[]) => ApplicationBundle[])
  ) => Promise<ApplicationBundle[]>;
  saveApplicationTypes: (
    types: ApplicationType[],
    applicationUpdater?: (current: ApplicationBundle[]) => ApplicationBundle[]
  ) => Promise<void>;
  createApplicationType: (payload: Omit<ApplicationType, 'id'>) => Promise<ApplicationType>;
  updateApplicationType: (payload: ApplicationType) => Promise<ApplicationType | null>;
  deleteApplicationType: (typeId: number) => Promise<boolean>;
  createApplication: (
    payload: Omit<Application, 'id' | 'number' | 'status' | 'currentStepIndex' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'dueAt'> & {
      values: ApplicationFieldValue[];
      attachments: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>[];
      comment?: string;
    }
  ) => Promise<ApplicationBundle>;
  submitApplication: (applicationId: number, actorId: number, comment?: string, delegateUserId?: number) => Promise<ApplicationBundle | null>;
  approveApplication: (applicationId: number, actorId: number, comment?: string) => Promise<ApplicationBundle | null>;
  rejectApplication: (applicationId: number, actorId: number, comment: string) => Promise<ApplicationBundle | null>;
  resendApplication: (applicationId: number, actorId: number, comment?: string) => Promise<ApplicationBundle | null>;
  closeApplication: (applicationId: number, actorId: number, comment?: string) => Promise<ApplicationBundle | null>;
  addApplicationAttachment: (
    applicationId: number,
    attachment: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>,
    actorId: number
  ) => Promise<ApplicationBundle | null>;
  updateApplicationValues: (
    applicationId: number,
    actorId: number,
    values: ApplicationFieldValue[],
    comment?: string
  ) => Promise<ApplicationBundle | null>;
  assignApplicationDelegate: (
    applicationId: number,
    forRoleId: number,
    delegateUserId: number | null,
    actorId: number
  ) => Promise<ApplicationBundle | null>;
  saveWorkShifts: (
    shifts: WorkShift[] | ((current: WorkShift[]) => WorkShift[])
  ) => WorkShift[];
  hasPermission: (permissionId: string) => boolean;
}
