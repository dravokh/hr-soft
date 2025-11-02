import {
  ApplicationBundle,
  ApplicationFieldValue,
  ApplicationType,
  Attachment,
  AuditLog,
  Role,
  User
} from '../../types';
import { ALL_PERMISSIONS } from '../../constants/permissions';
import { normalizeApplicationType } from './normalizers';

export const DEFAULT_ROLES: Role[] = [
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
      'manage_request_types'
    ]
  },
  {
    id: 3,
    name: 'Employee',
    description: 'თანამშრომელი',
    permissions: ['view_dashboard', 'view_requests', 'create_requests']
  }
];

export const DEFAULT_USERS: User[] = [
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

export const DEFAULT_APPLICATION_TYPES: ApplicationType[] = [
  normalizeApplicationType({
    id: 1,
    name: { ka: 'შვებულების განაცხადი', en: 'Leave request' },
    description: {
      ka: 'დაგეგმილი ან უცაბედი შვებულებების დამტკიცების სამუშაო პროცესი.',
      en: 'Approval workflow for planned or urgent leave requests.'
    },
    icon: 'CalendarDays',
    color: 'bg-sky-500',
    fields: [
      {
        key: 'reason',
        label: { ka: 'შვებულების მიზეზი', en: 'Leave reason' },
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
    ],
    capabilities: {
      requiresDateRange: true,
      dateRangeRequired: true,
      requiresTimeRange: false,
      timeRangeRequired: false,
      hasCommentField: true,
      commentRequired: false,
      allowsAttachments: true,
      attachmentsRequired: false,
      attachmentMaxSizeMb: 50
    },
    allowedRoleIds: [3]
  }),
  normalizeApplicationType({
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
        key: 'reason',
        label: { ka: 'კომანდირების მიზანი', en: 'Trip purpose' },
        type: 'textarea',
        required: true,
        placeholder: {
          ka: 'მოკლედ აღწერეთ რას მოიცავს ვიზიტი…',
          en: 'Summarize the goal of the visit…'
        }
      },
      {
        key: 'start_date',
        label: { ka: 'გამგზავრების თარიღი', en: 'Departure date' },
        type: 'date',
        required: true
      },
      {
        key: 'end_date',
        label: { ka: 'დაბრუნების თარიღი', en: 'Return date' },
        type: 'date',
        required: true
      },
      {
        key: 'start_time',
        label: { ka: 'გამგზავრების დრო', en: 'Departure time' },
        type: 'time',
        required: false
      },
      {
        key: 'end_time',
        label: { ka: 'დაბრუნების დრო', en: 'Arrival time' },
        type: 'time',
        required: false
      },
      {
        key: 'destination',
        label: { ka: 'დანიშნულების ადგილი', en: 'Destination' },
        type: 'text',
        required: true,
        placeholder: { ka: 'მაგ. ბარსელონა, ესპანეთი', en: 'e.g. Barcelona, Spain' }
      },
      {
        key: 'budget',
        label: { ka: 'ბიუჯეტის შეფასება', en: 'Budget estimate' },
        type: 'number',
        required: false,
        placeholder: { ka: 'მაგ: 2400', en: 'e.g. 2400' }
      },
      {
        key: 'additional_comment',
        label: { ka: 'დამატებითი მითითება', en: 'Additional note' },
        type: 'textarea',
        required: false
      }
    ],
    flow: [2, 1],
    slaPerStep: [
      { stepIndex: 0, seconds: 36 * 3600, onExpire: 'BOUNCE_BACK' },
      { stepIndex: 1, seconds: 48 * 3600, onExpire: 'AUTO_APPROVE' }
    ],
    capabilities: {
      requiresDateRange: true,
      dateRangeRequired: true,
      requiresTimeRange: true,
      timeRangeRequired: false,
      hasCommentField: true,
      commentRequired: false,
      allowsAttachments: true,
      attachmentsRequired: true,
      attachmentMaxSizeMb: 50
    },
    allowedRoleIds: [2, 3]
  })
];

export const DEFAULT_APPLICATIONS: ApplicationBundle[] = [
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
      {
        applicationId: 1,
        key: 'additional_comment',
        value: 'საჭიროა შვებულება გამოცდების მზადებისთვის.'
      }
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
        actorId: 2,
        action: 'APPROVE',
        comment: 'განაცხადი დასაშვებად ჩაითვალა.',
        at: '2024-10-30T09:12:00.000Z'
      },
      {
        id: 4,
        applicationId: 1,
        actorId: 1,
        action: 'APPROVE',
        comment: 'შვებულება დადასტურდა.',
        at: '2024-10-31T16:45:00.000Z'
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
      createdAt: '2024-09-10T07:45:00.000Z',
      updatedAt: '2024-09-15T14:32:00.000Z',
      submittedAt: '2024-09-10T07:50:00.000Z',
      dueAt: null
    },
    values: [
      { applicationId: 2, key: 'reason', value: 'კლიენტთან შეხვედრები და ტრენინგები' },
      { applicationId: 2, key: 'start_date', value: '2024-09-20' },
      { applicationId: 2, key: 'end_date', value: '2024-09-25' },
      { applicationId: 2, key: 'start_time', value: '09:00' },
      { applicationId: 2, key: 'end_time', value: '20:30' },
      { applicationId: 2, key: 'destination', value: 'ბერლინი, გერმანია' },
      { applicationId: 2, key: 'budget', value: '5400' },
      {
        applicationId: 2,
        key: 'additional_comment',
        value: 'საჭიროა შეხვედრების დეტალური გეგმის თანდართვა.'
      }
    ],
    attachments: [
      {
        id: 2,
        applicationId: 2,
        name: 'agenda.pdf',
        url: '#',
        uploadedBy: 2,
        createdAt: '2024-09-10T08:02:00.000Z'
      },
      {
        id: 3,
        applicationId: 2,
        name: 'budget.xlsx',
        url: '#',
        uploadedBy: 2,
        createdAt: '2024-09-10T08:05:00.000Z'
      }
    ],
    auditTrail: [
      {
        id: 5,
        applicationId: 2,
        actorId: 2,
        action: 'CREATE',
        comment: 'დაგეგმილია ვიზიტი ბერლინში.',
        at: '2024-09-10T07:45:00.000Z'
      },
      {
        id: 6,
        applicationId: 2,
        actorId: 2,
        action: 'SUBMIT',
        comment: 'გთხოვ დამტკიცებას.',
        at: '2024-09-10T07:50:00.000Z'
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

export type StoredUser = Omit<User, 'phone'> & { phone?: string };
