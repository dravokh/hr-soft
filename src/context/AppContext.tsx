import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  AppContextValue,
  LoginResult,
  Role,
  Session,
  Ticket,
  User,
  ApplicationBundle,
  ApplicationType,
  ApplicationFieldValue,
  Attachment,
  AuditLog,
  Application
} from '../types';
import { ALL_PERMISSIONS } from '../constants/permissions';
import { storage } from '../utils/storage';

const STORAGE_KEYS = {
  ROLES: 'hr_soft_roles',
  USERS: 'hr_soft_users',
  TICKETS: 'hr_soft_tickets',
  SESSION: 'hr_soft_session',
  APPLICATION_TYPES: 'hr_soft_application_types',
  APPLICATIONS: 'hr_soft_applications'
};

const DEFAULT_ROLES: Role[] = [
  {
    id: 1,
    name: 'Admin',
    description: 'სისტემის ადმინისტრატორი',
    permissions: ALL_PERMISSIONS.map((permission) => permission.id)
  },
  {
    id: 2,
    name: 'HR',
    description: 'HR მენეჯერი',
    permissions: [
      'view_dashboard',
      'view_users',
      'view_requests',
      'approve_requests',
      'view_tickets',
      'update_tickets',
      'set_ticket_priority'
    ]
  },
  {
    id: 3,
    name: 'Employee',
    description: 'თანამშრომელი',
    permissions: ['view_dashboard', 'view_requests', 'create_requests', 'view_tickets', 'create_tickets']
  }
];

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@hr.com',
    phone: '+995 555 000 001',
    password: 'admin123',
    roleId: 1,
    avatar: 'A'
  },
  {
    id: 2,
    name: 'HR Manager',
    email: 'hr@hr.com',
    phone: '+995 555 000 002',
    password: 'hr123',
    roleId: 2,
    avatar: 'H'
  },
  {
    id: 3,
    name: 'Employee User',
    email: 'user@hr.com',
    phone: '+995 555 000 003',
    password: 'user123',
    roleId: 3,
    avatar: 'E'
  }
];

type StoredUser = Omit<User, 'phone'> & { phone?: string };

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: 1,
    title: 'Onboarding laptop request',
    description: 'Need a laptop configured for the new marketing hire starting next Monday.',
    status: 'in_progress',
    priority: 'high',
    createdById: 2,
    assignedToId: 1,
    createdAt: '2024-05-01T08:30:00.000Z',
    updatedAt: '2024-05-02T09:15:00.000Z'
  },
  {
    id: 2,
    title: 'Update payroll bank details',
    description: 'Employee User submitted new banking information that must be reflected before the next payroll run.',
    status: 'open',
    priority: 'medium',
    createdById: 3,
    assignedToId: 2,
    createdAt: '2024-05-10T12:00:00.000Z',
    updatedAt: '2024-05-10T12:00:00.000Z'
  },
  {
    id: 3,
    title: 'Broken office badge',
    description: 'My access badge is no longer working after the hardware refresh. Requesting a replacement.',
    status: 'resolved',
    priority: 'low',
    createdById: 3,
    assignedToId: 2,
    createdAt: '2024-04-18T07:20:00.000Z',
    updatedAt: '2024-04-19T10:45:00.000Z'
  }
];

const DEFAULT_APPLICATION_TYPES: ApplicationType[] = [
  {
    id: 1,
    name: { ka: 'შვებულების განაცხადი', en: 'Leave request' },
    description: {
      ka: 'დაგეგმილი ან უცაბედი შვებულებების დამტკიცების სამუშაო პრക്രესი.',
      en: 'Approval workflow for planned or urgent leave requests.'
    },
    icon: 'CalendarDays',
    color: 'bg-sky-500',
    fields: [
      {
        key: 'reason',
        label: { ka: 'შვებულების მიზეზი', en: 'Reason for leave' },
        type: 'textarea',
        required: true,
        placeholder: { ka: 'მოკლედ აღწერეთ მიზეზი…', en: 'Describe the reason…' }
      },
      {
        key: 'start_date',
        label: { ka: 'დაწყების თარიღი', en: 'Start date' },
        type: 'date',
        required: true
      },
      {
        key: 'end_date',
        label: { ka: 'დასრულების თარიღი', en: 'End date' },
        type: 'date',
        required: true
      },
      {
        key: 'contact_phone',
        label: { ka: 'საკონტაქტო ნომერი', en: 'Contact phone' },
        type: 'text',
        required: true,
        placeholder: { ka: '+995 5XX XXX XXX', en: '+995 5XX XXX XXX' }
      },
      {
        key: 'additional_comment',
        label: { ka: 'დამატებითი კომენტარი', en: 'Additional comment' },
        type: 'textarea',
        required: false,
        helper: {
          ka: 'მიუთითეთ დამატებითი ინფორმაცია საჭიროების შემთხვევაში.',
          en: 'Provide extra context if needed.'
        }
      }
    ],
    flow: [1, 2],
    slaPerStep: [
      { stepIndex: 0, seconds: 48 * 3600, onExpire: 'AUTO_APPROVE' },
      { stepIndex: 1, seconds: 72 * 3600, onExpire: 'BOUNCE_BACK' }
    ]
  },
  {
    id: 2,
    name: { ka: 'კომანდირების განაცხადი', en: 'Business trip request' },
    description: {
      ka: 'კომანდირებასთან დაკავშირებული ხარჯებისა და დაგეგმვის დამტკიცება.',
      en: 'Approval for travel itineraries and budget expectations.'
    },
    icon: 'Plane',
    color: 'bg-indigo-500',
    fields: [
      {
        key: 'destination',
        label: { ka: 'დანიშნულების ადგილი', en: 'Destination' },
        type: 'text',
        required: true,
        placeholder: { ka: 'მაგ. ბარსელონა, ესპანეთი', en: 'e.g. Barcelona, Spain' }
      },
      {
        key: 'travel_dates',
        label: { ka: 'გზის თარიღები', en: 'Travel dates' },
        type: 'date_range',
        required: true,
        helper: {
          ka: 'მიუთითეთ გამგზავრების და დაბრუნების დღეები.',
          en: 'Include departure and return dates.'
        }
      },
      {
        key: 'budget',
        label: { ka: 'დაგეგმილი ბიუჯეტი', en: 'Estimated budget' },
        type: 'number',
        required: true,
        placeholder: { ka: 'მაგ: 2400', en: 'e.g. 2400' }
      },
      {
        key: 'purpose',
        label: { ka: 'კომანდირების მიზანი', en: 'Purpose' },
        type: 'textarea',
        required: true
      }
    ],
    flow: [2, 1],
    slaPerStep: [
      { stepIndex: 0, seconds: 36 * 3600, onExpire: 'BOUNCE_BACK' },
      { stepIndex: 1, seconds: 48 * 3600, onExpire: 'AUTO_APPROVE' }
    ]
  }
];

const DEFAULT_APPLICATIONS: ApplicationBundle[] = [
  {
    application: {
      id: 1,
      number: 'TKT-2024-00021',
      typeId: 1,
      requesterId: 3,
      status: 'PENDING',
      currentStepIndex: 1,
      createdAt: '2024-10-28T08:20:00.000Z',
      updatedAt: '2024-11-01T10:25:27.000Z',
      submittedAt: '2024-10-28T08:35:00.000Z',
      dueAt: '2024-11-04T10:25:27.000Z'
    },
    values: [
      { applicationId: 1, key: 'reason', value: 'სწავლების კურსზე დასწრება' },
      { applicationId: 1, key: 'start_date', value: '2024-12-19' },
      { applicationId: 1, key: 'end_date', value: '2024-12-26' },
      { applicationId: 1, key: 'contact_phone', value: '+995 555 000 003' },
      { applicationId: 1, key: 'additional_comment', value: 'საჭიროა შვებულება გამოცდების მზადებისთვის.' }
    ],
    attachments: [
      {
        id: 1,
        applicationId: 1,
        name: 'training-invitation.pdf',
        url: '#',
        uploadedBy: 3,
        createdAt: '2024-10-28T08:34:00.000Z'
      }
    ],
    auditTrail: [
      {
        id: 1,
        applicationId: 1,
        actorId: 3,
        action: 'CREATE',
        comment: 'შევსებულია განაცხადი და დაერთებულია მოწვევა.',
        at: '2024-10-28T08:20:00.000Z'
      },
      {
        id: 2,
        applicationId: 1,
        actorId: 3,
        action: 'SUBMIT',
        comment: 'გთხოვთ დამტკიცებას.',
        at: '2024-10-28T08:35:00.000Z'
      },
      {
        id: 3,
        applicationId: 1,
        actorId: 1,
        action: 'APPROVE',
        comment: 'დასვენება დამტკიცებულია, წარმატებები კურსზე.',
        at: '2024-10-29T09:05:00.000Z'
      },
      {
        id: 4,
        applicationId: 1,
        actorId: 1,
        action: 'RESEND',
        comment: 'დროებით გადაიგზავნა HR გუნდში.',
        at: '2024-10-29T09:06:00.000Z'
      }
    ],
    delegates: []
  },
  {
    application: {
      id: 2,
      number: 'TKT-2024-00022',
      typeId: 2,
      requesterId: 2,
      status: 'REJECTED',
      currentStepIndex: -1,
      createdAt: '2024-09-12T10:10:00.000Z',
      updatedAt: '2024-09-15T14:32:00.000Z',
      submittedAt: '2024-09-12T10:25:00.000Z',
      dueAt: null
    },
    values: [
      { applicationId: 2, key: 'destination', value: 'თბილისი → ტალინი' },
      { applicationId: 2, key: 'travel_dates', value: '2024-10-05/2024-10-11' },
      { applicationId: 2, key: 'budget', value: '3200' },
      { applicationId: 2, key: 'purpose', value: 'HR ტექნოლოგიების კონფერენციაში მონაწილეობა.' }
    ],
    attachments: [
      {
        id: 2,
        applicationId: 2,
        name: 'conference-agenda.pdf',
        url: '#',
        uploadedBy: 2,
        createdAt: '2024-09-12T10:22:00.000Z'
      }
    ],
    auditTrail: [
      {
        id: 5,
        applicationId: 2,
        actorId: 2,
        action: 'CREATE',
        at: '2024-09-12T10:10:00.000Z'
      },
      {
        id: 6,
        applicationId: 2,
        actorId: 2,
        action: 'SUBMIT',
        comment: 'ბიუჯეტი მოიცავს ავიაბილეთებს და სასტუმროს.',
        at: '2024-09-12T10:25:00.000Z'
      },
      {
        id: 7,
        applicationId: 2,
        actorId: 2,
        action: 'EDIT',
        comment: 'განახლდა მისამართი და სასტუმროს მონაცემები.',
        at: '2024-09-13T09:12:00.000Z'
      },
      {
        id: 8,
        applicationId: 2,
        actorId: 1,
        action: 'REJECT',
        comment: 'გთხოვთ განახლებული ბიუჯეტის დეტალური დეკომპოზიცია.',
        at: '2024-09-15T14:32:00.000Z'
      }
    ],
    delegates: []
  }
];

const buildApplicationNumber = (id: number, createdAt: string): string => {
  const year = new Date(createdAt).getFullYear();
  return `TKT-${year}-${id.toString().padStart(5, '0')}`;
};

const computeDueDate = (
  type: ApplicationType | undefined,
  application: Application,
  baseTime?: string
): string | null => {
  if (!type || application.status !== 'PENDING') {
    return null;
  }

  const sla = type.slaPerStep.find((entry) => entry.stepIndex === application.currentStepIndex);
  if (!sla) {
    return null;
  }

  const base = new Date(baseTime ?? application.updatedAt);
  return new Date(base.getTime() + sla.seconds * 1000).toISOString();
};

const normalizeApplicationBundle = (
  bundle: ApplicationBundle,
  types: ApplicationType[]
): ApplicationBundle => {
  const type = types.find((candidate) => candidate.id === bundle.application.typeId);
  const normalizedApplication: Application = {
    ...bundle.application,
    number: bundle.application.number ?? buildApplicationNumber(bundle.application.id, bundle.application.createdAt),
    submittedAt:
      bundle.application.submittedAt ??
      (bundle.application.status !== 'DRAFT' ? bundle.application.createdAt : null),
    dueAt: null
  };

  if (normalizedApplication.status === 'PENDING') {
    normalizedApplication.dueAt = computeDueDate(type, normalizedApplication);
  }

  const normalizedAttachments = bundle.attachments.map((attachment) => ({
    ...attachment,
    applicationId: bundle.application.id
  }));

  const normalizedValues = bundle.values.map((value) => ({
    ...value,
    applicationId: bundle.application.id
  }));

  return {
    ...bundle,
    application: normalizedApplication,
    attachments: normalizedAttachments,
    values: normalizedValues,
    delegates: bundle.delegates ?? []
  };
};

const normalizeApplications = (bundles: ApplicationBundle[], types: ApplicationType[]): ApplicationBundle[] => {
  return bundles.map((bundle) => normalizeApplicationBundle(bundle, types));
};

const refreshApplicationTiming = (
  application: Application,
  type: ApplicationType | undefined,
  timestamp: string
): Application => {
  const updated: Application = { ...application, updatedAt: timestamp };

  if (updated.status === 'PENDING') {
    updated.dueAt = computeDueDate(type, updated, timestamp);
  } else {
    updated.dueAt = null;
  }

  return updated;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const ensureAdminPermissions = (roles: Role[]): Role[] => {
  return roles.map((role) => {
    let permissions = role.permissions;

    if (role.id === 1) {
      permissions = ALL_PERMISSIONS.map((permission) => permission.id);
    }

    if (role.id === 2 && !permissions.includes('set_ticket_priority')) {
      permissions = [...permissions, 'set_ticket_priority'];
    }

    return {
      ...role,
      permissions: Array.from(new Set(permissions))
    };
  });
};

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [applications, setApplications] = useState<ApplicationBundle[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const applicationIdRef = useRef(1);
  const attachmentIdRef = useRef(1);
  const auditIdRef = useRef(1);
  const delegateIdRef = useRef(1);

  const syncCounters = useCallback((bundles: ApplicationBundle[]) => {
    const nextApplicationId = bundles.reduce((max, bundle) => Math.max(max, bundle.application.id), 0) + 1;
    const nextAttachmentId =
      bundles.reduce((outerMax, bundle) => {
        const localMax = bundle.attachments.reduce((innerMax, attachment) => Math.max(innerMax, attachment.id), 0);
        return Math.max(outerMax, localMax);
      }, 0) + 1;
    const nextAuditId =
      bundles.reduce((outerMax, bundle) => {
        const localMax = bundle.auditTrail.reduce((innerMax, entry) => Math.max(innerMax, entry.id), 0);
        return Math.max(outerMax, localMax);
      }, 0) + 1;
    const nextDelegateId =
      bundles.reduce((outerMax, bundle) => {
        const localMax = bundle.delegates.reduce((innerMax, entry) => Math.max(innerMax, entry.id), 0);
        return Math.max(outerMax, localMax);
      }, 0) + 1;

    applicationIdRef.current = nextApplicationId;
    attachmentIdRef.current = nextAttachmentId;
    auditIdRef.current = nextAuditId;
    delegateIdRef.current = nextDelegateId;
  }, []);

  const applyApprove = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number | null,
      action: 'APPROVE' | 'AUTO_APPROVE',
      comment?: string,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      if (!type) {
        return bundle;
      }

      const now = new Date().toISOString();
      const lastStep = type.flow.length - 1;
      const isFinalStep = bundle.application.currentStepIndex >= lastStep;
      const nextApplication: Application = {
        ...bundle.application,
        status: isFinalStep ? 'APPROVED' : 'PENDING',
        currentStepIndex: isFinalStep
          ? bundle.application.currentStepIndex
          : bundle.application.currentStepIndex + 1,
        submittedAt: bundle.application.submittedAt ?? now,
        dueAt: null,
        updatedAt: now
      };
      nextApplication.dueAt = computeDueDate(type, nextApplication, now);

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: nextApplication.id,
        actorId,
        action,
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    [applicationTypes]
  );

  const applyReject = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number | null,
      action: 'REJECT' | 'EXPIRE_BOUNCE',
      comment: string,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      if (!type) {
        return bundle;
      }

      const now = new Date().toISOString();
      const previousStep = bundle.application.currentStepIndex - 1;
      const bounced = previousStep < 0;
      const nextApplication: Application = {
        ...bundle.application,
        status: bounced ? 'REJECTED' : 'PENDING',
        currentStepIndex: bounced ? -1 : previousStep,
        updatedAt: now,
        dueAt: null
      };
      nextApplication.dueAt = computeDueDate(type, nextApplication, now);

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: nextApplication.id,
        actorId,
        action,
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    [applicationTypes]
  );

  const applySubmit = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number,
      comment?: string,
      delegateUserId?: number,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      if (!type) {
        return bundle;
      }

      const now = new Date().toISOString();
      const nextApplication: Application = {
        ...bundle.application,
        status: 'PENDING',
        currentStepIndex: 0,
        updatedAt: now,
        submittedAt: now,
        dueAt: null
      };
      nextApplication.dueAt = computeDueDate(type, nextApplication, now);

      const firstRoleId = type.flow[0];
      let delegates = bundle.delegates;
      if (delegateUserId) {
        delegates = [
          ...bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId),
          {
            id: delegateIdRef.current++,
            applicationId: bundle.application.id,
            forRoleId: firstRoleId,
            delegateUserId
          }
        ];
      } else if (bundle.delegates.some((delegate) => delegate.forRoleId === firstRoleId)) {
        delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId);
      }

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'SUBMIT',
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        auditTrail: [...bundle.auditTrail, auditEntry],
        delegates
      };
    },
    [applicationTypes]
  );

  const applyResend = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number,
      comment?: string,
      delegateUserId?: number,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      if (!type) {
        return bundle;
      }

      const now = new Date().toISOString();
      const nextApplication: Application = {
        ...bundle.application,
        status: 'PENDING',
        currentStepIndex: 0,
        updatedAt: now,
        submittedAt: bundle.application.submittedAt ?? now,
        dueAt: null
      };
      nextApplication.dueAt = computeDueDate(type, nextApplication, now);

      const firstRoleId = type.flow[0];
      let delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== firstRoleId);
      if (delegateUserId) {
        delegates = [
          ...delegates,
          {
            id: delegateIdRef.current++,
            applicationId: bundle.application.id,
            forRoleId: firstRoleId,
            delegateUserId
          }
        ];
      }

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'RESEND',
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        auditTrail: [...bundle.auditTrail, auditEntry],
        delegates
      };
    },
    [applicationTypes]
  );

  const applyClose = useCallback(
    (bundle: ApplicationBundle, actorId: number, comment?: string): ApplicationBundle => {
      const now = new Date().toISOString();
      const nextApplication: Application = {
        ...bundle.application,
        status: 'CLOSED',
        updatedAt: now,
        dueAt: null
      };

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'CLOSE',
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    []
  );

  const applyValuesUpdate = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number,
      values: ApplicationFieldValue[],
      comment?: string,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      const now = new Date().toISOString();
      const updatedValues = values.map((value) => ({
        applicationId: bundle.application.id,
        key: value.key,
        value: value.value
      }));
      const nextApplication = refreshApplicationTiming(bundle.application, type, now);

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'EDIT',
        comment,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        values: updatedValues,
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    [applicationTypes]
  );

  const applyAttachment = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number,
      attachment: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      const now = new Date().toISOString();
      const nextApplication = refreshApplicationTiming(bundle.application, type, now);

      const newAttachment: Attachment = {
        id: attachmentIdRef.current++,
        applicationId: bundle.application.id,
        name: attachment.name,
        url: attachment.url,
        uploadedBy: attachment.uploadedBy,
        createdAt: now
      };

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'EDIT',
        comment: attachment.name ? `დაემატა ფაილი: ${attachment.name}` : undefined,
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        attachments: [...bundle.attachments, newAttachment],
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    [applicationTypes]
  );

  const applyDelegate = useCallback(
    (
      bundle: ApplicationBundle,
      actorId: number,
      forRoleId: number,
      delegateUserId: number | null,
      typesOverride?: ApplicationType[]
    ): ApplicationBundle => {
      const source = typesOverride ?? applicationTypes;
      const type = source.find((candidate) => candidate.id === bundle.application.typeId);
      const now = new Date().toISOString();
      const nextApplication = refreshApplicationTiming(bundle.application, type, now);

      let delegates = bundle.delegates.filter((delegate) => delegate.forRoleId !== forRoleId);
      if (delegateUserId) {
        delegates = [
          ...delegates,
          {
            id: delegateIdRef.current++,
            applicationId: bundle.application.id,
            forRoleId,
            delegateUserId
          }
        ];
      }

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId: bundle.application.id,
        actorId,
        action: 'EDIT',
        comment: 'განახლდა პასუხისმგებელი ან დელეგატი.',
        at: now
      };

      return {
        ...bundle,
        application: nextApplication,
        delegates,
        auditTrail: [...bundle.auditTrail, auditEntry]
      };
    },
    [applicationTypes]
  );

  const runSlaAutomation = useCallback(
    (bundles: ApplicationBundle[], typesOverride?: ApplicationType[]): ApplicationBundle[] => {
      const typesSource = typesOverride ?? applicationTypes;
      if (!typesSource.length) {
        return bundles;
      }

      const now = Date.now();
      let mutated = false;

      const processed = bundles.map((bundle) => {
        const type = typesSource.find((candidate) => candidate.id === bundle.application.typeId);
        if (!type) {
          if (bundle.application.dueAt) {
            mutated = true;
            return {
              ...bundle,
              application: { ...bundle.application, dueAt: null }
            };
          }
          return bundle;
        }

        if (bundle.application.status !== 'PENDING') {
          if (bundle.application.dueAt) {
            mutated = true;
            return {
              ...bundle,
              application: { ...bundle.application, dueAt: null }
            };
          }
          return bundle;
        }

        const recalculatedDue = computeDueDate(type, bundle.application);
        const sla = type.slaPerStep.find((entry) => entry.stepIndex === bundle.application.currentStepIndex);
        let working = bundle;

        if (recalculatedDue !== bundle.application.dueAt) {
          mutated = true;
          working = {
            ...working,
            application: { ...working.application, dueAt: recalculatedDue }
          };
        }

        if (sla && recalculatedDue && new Date(recalculatedDue).getTime() <= now) {
          mutated = true;
          if (sla.onExpire === 'AUTO_APPROVE') {
            working = applyApprove(
              working,
              null,
              'AUTO_APPROVE',
              'ავტომატურად დამტკიცდა ვადის ამოწურვის გამო.',
              typesSource
            );
          } else {
            working = applyReject(
              working,
              null,
              'EXPIRE_BOUNCE',
              'ვადის ამოწურვის გამო განაცხადი დაბრუნდა ავტორს.',
              typesSource
            );
          }
        }

        return working;
      });

      return mutated ? processed : bundles;
    },
    [applicationTypes, applyApprove, applyReject]
  );

  const saveApplications = useCallback(
    async (nextBundles: ApplicationBundle[]): Promise<void> => {
      const normalized = normalizeApplications(nextBundles, applicationTypes);
      const processed = runSlaAutomation(normalized);
      setApplications(processed);
      storage.set(STORAGE_KEYS.APPLICATIONS, processed);
      syncCounters(processed);
    },
    [applicationTypes, runSlaAutomation, syncCounters]
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const storedRoles = storage.get<Role[]>(STORAGE_KEYS.ROLES);
      const resolvedRoles = ensureAdminPermissions(storedRoles ?? DEFAULT_ROLES);
      setRoles(resolvedRoles);
      storage.set(STORAGE_KEYS.ROLES, resolvedRoles);

      const storedUsers = storage.get<StoredUser[]>(STORAGE_KEYS.USERS);
      const resolvedUsers: User[] = (storedUsers ?? DEFAULT_USERS).map((user) => ({
        ...user,
        phone: user.phone ?? ''
      }));
      setUsers(resolvedUsers);
      storage.set(STORAGE_KEYS.USERS, resolvedUsers);

      const storedTickets = storage.get<Ticket[]>(STORAGE_KEYS.TICKETS);
      const resolvedTickets = storedTickets ?? DEFAULT_TICKETS;
      setTickets(resolvedTickets);
      storage.set(STORAGE_KEYS.TICKETS, resolvedTickets);

      const storedTypes = storage.get<ApplicationType[]>(STORAGE_KEYS.APPLICATION_TYPES);
      const resolvedTypes = storedTypes ?? DEFAULT_APPLICATION_TYPES;
      setApplicationTypes(resolvedTypes);
      storage.set(STORAGE_KEYS.APPLICATION_TYPES, resolvedTypes);

      const storedBundles = storage.get<ApplicationBundle[]>(STORAGE_KEYS.APPLICATIONS);
      const normalizedBundles = normalizeApplications(storedBundles ?? DEFAULT_APPLICATIONS, resolvedTypes);
      const processedBundles = runSlaAutomation(normalizedBundles, resolvedTypes);
      setApplications(processedBundles);
      storage.set(STORAGE_KEYS.APPLICATIONS, processedBundles);
      syncCounters(processedBundles);

      const session = storage.get<Session>(STORAGE_KEYS.SESSION);
      if (session) {
        const sessionUser = resolvedUsers.find((user) => user.id === session.userId) ?? null;
        setCurrentUser(sessionUser);
        setIsAuthenticated(Boolean(sessionUser));
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  }, [runSlaAutomation, syncCounters]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const user = users.find((candidate) => candidate.email === email && candidate.password === password);

    if (!user) {
      return { success: false, error: 'არასწორი ელ. ფოსტა ან პაროლი' };
    }

    const session: Session = { userId: user.id, timestamp: Date.now() };
    storage.set(STORAGE_KEYS.SESSION, session);
    setCurrentUser(user);
    setIsAuthenticated(true);

    return { success: true };
  }, [users]);

  const logout = useCallback(async (): Promise<void> => {
    storage.remove(STORAGE_KEYS.SESSION);
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  const saveRoles = useCallback(async (newRoles: Role[]): Promise<void> => {
    const nextRoles = ensureAdminPermissions(newRoles);
    setRoles(nextRoles);
    storage.set(STORAGE_KEYS.ROLES, nextRoles);
  }, []);

  const saveUsers = useCallback(async (newUsers: User[]): Promise<void> => {
    setUsers(newUsers);
    storage.set(STORAGE_KEYS.USERS, newUsers);
    setCurrentUser((previous) => {
      if (!previous) {
        return previous;
      }

      return newUsers.find((user) => user.id === previous.id) ?? previous;
    });
  }, []);

  const saveTickets = useCallback(async (newTickets: Ticket[]): Promise<void> => {
    setTickets(newTickets);
    storage.set(STORAGE_KEYS.TICKETS, newTickets);
  }, []);

  const createApplication = useCallback(
    async (
      payload: Omit<
        Application,
        'id' | 'number' | 'status' | 'currentStepIndex' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'dueAt'
      > & {
        values: ApplicationFieldValue[];
        attachments: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>[];
        comment?: string;
      }
    ): Promise<ApplicationBundle> => {
      const createdAt = new Date().toISOString();
      const applicationId = applicationIdRef.current++;
      const number = buildApplicationNumber(applicationId, createdAt);

      const application: Application = {
        id: applicationId,
        number,
        typeId: payload.typeId,
        requesterId: payload.requesterId,
        status: 'DRAFT',
        currentStepIndex: -1,
        createdAt,
        updatedAt: createdAt,
        submittedAt: null,
        dueAt: null
      };

      const values = payload.values.map((value) => ({
        applicationId,
        key: value.key,
        value: value.value
      }));

      const attachments = payload.attachments.map((attachment) => ({
        id: attachmentIdRef.current++,
        applicationId,
        name: attachment.name,
        url: attachment.url,
        uploadedBy: attachment.uploadedBy,
        createdAt
      }));

      const auditEntry: AuditLog = {
        id: auditIdRef.current++,
        applicationId,
        actorId: payload.requesterId,
        action: 'CREATE',
        comment: payload.comment,
        at: createdAt
      };

      const newBundle: ApplicationBundle = {
        application,
        values,
        attachments,
        auditTrail: [auditEntry],
        delegates: []
      };

      const nextBundles = [...applications, newBundle];
      await saveApplications(nextBundles);
      return normalizeApplicationBundle(newBundle, applicationTypes);
    },
    [applications, applicationTypes, saveApplications]
  );

  const submitApplication = useCallback(
    async (
      applicationId: number,
      actorId: number,
      comment?: string,
      delegateUserId?: number
    ): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applySubmit(bundle, actorId, comment, delegateUserId);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applySubmit, saveApplications]
  );

  const approveApplication = useCallback(
    async (applicationId: number, actorId: number, comment?: string): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyApprove(bundle, actorId, 'APPROVE', comment);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyApprove, saveApplications]
  );

  const rejectApplication = useCallback(
    async (applicationId: number, actorId: number, comment: string): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyReject(bundle, actorId, 'REJECT', comment);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyReject, saveApplications]
  );

  const resendApplication = useCallback(
    async (
      applicationId: number,
      actorId: number,
      comment?: string,
      delegateUserId?: number
    ): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyResend(bundle, actorId, comment, delegateUserId);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyResend, saveApplications]
  );

  const closeApplication = useCallback(
    async (applicationId: number, actorId: number, comment?: string): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyClose(bundle, actorId, comment);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyClose, saveApplications]
  );

  const addApplicationAttachment = useCallback(
    async (
      applicationId: number,
      attachment: Omit<Attachment, 'id' | 'applicationId' | 'createdAt'>,
      actorId: number
    ): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyAttachment(bundle, actorId, attachment);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyAttachment, saveApplications]
  );

  const updateApplicationValues = useCallback(
    async (
      applicationId: number,
      actorId: number,
      values: ApplicationFieldValue[],
      comment?: string
    ): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyValuesUpdate(bundle, actorId, values, comment);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyValuesUpdate, saveApplications]
  );

  const assignApplicationDelegate = useCallback(
    async (
      applicationId: number,
      forRoleId: number,
      delegateUserId: number | null,
      actorId: number
    ): Promise<ApplicationBundle | null> => {
      let updatedBundle: ApplicationBundle | null = null;
      const nextBundles = applications.map((bundle) => {
        if (bundle.application.id !== applicationId) {
          return bundle;
        }

        const updated = applyDelegate(bundle, actorId, forRoleId, delegateUserId);
        updatedBundle = updated;
        return updated;
      });

      if (!updatedBundle) {
        return null;
      }

      await saveApplications(nextBundles);
      return updatedBundle;
    },
    [applications, applyDelegate, saveApplications]
  );

  const hasPermission = useCallback(
    (permissionId: string): boolean => {
      if (!currentUser) {
        return false;
      }

      const userRole = roles.find((role) => role.id === currentUser.roleId);
      return Boolean(userRole?.permissions.includes(permissionId));
    },
    [currentUser, roles]
  );

  const value: AppContextValue = useMemo(
    () => ({
      roles,
      users,
      tickets,
      currentUser,
      isAuthenticated,
      loading,
      applicationTypes,
      applications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveTickets,
      saveApplications,
      createApplication,
      submitApplication,
      approveApplication,
      rejectApplication,
      resendApplication,
      closeApplication,
      addApplicationAttachment,
      updateApplicationValues,
      assignApplicationDelegate,
      hasPermission
    }),
    [
      roles,
      users,
      tickets,
      currentUser,
      isAuthenticated,
      loading,
      applicationTypes,
      applications,
      login,
      logout,
      loadAllData,
      saveRoles,
      saveUsers,
      saveTickets,
      saveApplications,
      createApplication,
      submitApplication,
      approveApplication,
      rejectApplication,
      resendApplication,
      closeApplication,
      addApplicationAttachment,
      updateApplicationValues,
      assignApplicationDelegate,
      hasPermission
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
