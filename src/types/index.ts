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

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: number;
  avatar: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string;
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

export type ApplicationFieldType = 'text' | 'textarea' | 'date' | 'date_range' | 'select' | 'number';

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

export interface ApplicationType {
  id: number;
  name: { ka: string; en: string };
  description: { ka: string; en: string };
  icon: string;
  color: string;
  fields: ApplicationFieldDefinition[];
  flow: number[];
  slaPerStep: ApplicationStepSLA[];
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
}

export interface Session {
  userId: number;
  timestamp: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface AppContextValue {
  roles: Role[];
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  tickets: Ticket[];
  applicationTypes: ApplicationType[];
  applications: ApplicationBundle[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadAllData: () => Promise<void>;
  saveRoles: (roles: Role[]) => Promise<void>;
  saveUsers: (users: User[]) => Promise<void>;
  saveTickets: (tickets: Ticket[]) => Promise<void>;
  saveApplications: (applications: ApplicationBundle[]) => Promise<void>;
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
  hasPermission: (permissionId: string) => boolean;
}
