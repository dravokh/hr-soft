import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Paperclip,
  Search,
  PlusCircle,
  Printer,
  Send,
  UserRound,
  X,
  ShieldHalf
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  ApplicationBundle,
  ApplicationFieldDefinition,
  ApplicationFieldValue,
  ApplicationStatus,
  AuditLog
} from '../types';

interface ApplicationsPageProps {
  language: 'ka' | 'en';
}

interface AttachmentDraft {
  name: string;
  url: string;
  fromUpload?: boolean;
  sizeBytes?: number;
}

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read file'));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file'));
    };
    reader.readAsDataURL(file);
  });
};

const formatFileSize = (bytes: number, language: 'ka' | 'en'): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return language === 'ka' ? 'უცნობია' : 'Unknown';
  }
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }
  const kilobytes = bytes / 1024;
  return `${kilobytes.toFixed(1)} KB`;
};

const classNames = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

const BUILT_IN_FIELD_KEYS = new Set([
  'reason',
  'start_date',
  'end_date',
  'start_time',
  'end_time',
  'additional_comment'
]);

type ApplicationFilters = {
  query: string;
  creatorId: number | 'all';
  status: ApplicationStatus | 'all';
  startDate: string;
  endDate: string;
};

const createEmptyFilters = (): ApplicationFilters => ({
  query: '',
  creatorId: 'all',
  status: 'all',
  startDate: '',
  endDate: ''
});

const AUDIT_ACTION_LABELS: Record<
  AuditLog['action'],
  { ka: string; en: string }
> = {
  CREATE: {
    ka: 'განაცხადი შეიქმნა',
    en: 'Application created'
  },
  SUBMIT: {
    ka: 'გაგზავნილია დამტკიცებისთვის',
    en: 'Submitted for approval'
  },
  APPROVE: {
    ka: 'დამტკიცდა',
    en: 'Approved'
  },
  REJECT: {
    ka: 'დაუბრუნდა შესწორებისთვის',
    en: 'Returned for changes'
  },
  EDIT: {
    ka: 'ინფორმაცია განახლდა',
    en: 'Details updated'
  },
  RESEND: {
    ka: 'ხელახლა გადაიგზავნა დამტკიცებაზე',
    en: 'Resent to approvers'
  },
  CLOSE: {
    ka: 'განაცხადი დაიხურა',
    en: 'Application closed'
  },
  AUTO_APPROVE: {
    ka: 'ავტომატურად დამტკიცდა',
    en: 'Automatically approved'
  },
  EXPIRE_BOUNCE: {
    ka: 'დაუბრუნდა SLA-ს ვადის გასვლის გამო',
    en: 'Returned after SLA expiration'
  }
};

const PRINT_COPY: Record<
  ApplicationsPageProps['language'],
  {
    summaryTitle: string;
    requester: string;
    contact: string;
    status: string;
    created: string;
    fields: string;
    attachments: string;
    noAttachments: string;
  }
> = {
  ka: {
    summaryTitle: 'განაცხადის შეჯამება',
    requester: 'ავტორი',
    contact: 'კონტაქტი',
    status: 'სტატუსი',
    created: 'შექმნის დრო',
    fields: 'განაცხადის დეტალები',
    attachments: 'დანართები',
    noAttachments: 'დანართები არ არის'
  },
  en: {
    summaryTitle: 'Application summary',
    requester: 'Requester',
    contact: 'Contact',
    status: 'Status',
    created: 'Created at',
    fields: 'Application details',
    attachments: 'Attachments',
    noAttachments: 'No attachments'
  }
};

const STATUS_META: Record<
  ApplicationStatus,
  { label: { ka: string; en: string }; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: { ka: 'დრაფტი', en: 'Draft' },
    color: 'bg-slate-200 text-slate-700',
    icon: <FileText className="w-4 h-4" />
  },
  PENDING: {
    label: { ka: 'მოლოდინში', en: 'Pending' },
    color: 'bg-amber-100 text-amber-700',
    icon: <Clock3 className="w-4 h-4" />
  },
  APPROVED: {
    label: { ka: 'დამტკიცებულია', en: 'Approved' },
    color: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  REJECTED: {
    label: { ka: 'დაბრუნდა', en: 'Returned' },
    color: 'bg-rose-100 text-rose-600',
    icon: <AlertCircle className="w-4 h-4" />
  },
  CLOSED: {
    label: { ka: 'დახურული', en: 'Closed' },
    color: 'bg-slate-100 text-slate-600',
    icon: <X className="w-4 h-4" />
  }
};

const FILTERABLE_STATUSES: ApplicationStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED'];

const COPY: Record<
  ApplicationsPageProps['language'],
  {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filters: {
      heading: string;
      keywordLabel: string;
      creatorLabel: string;
      creatorPlaceholder: string;
      statusLabel: string;
      statusPlaceholder: string;
      startDateLabel: string;
      endDateLabel: string;
      lastThirtyDays: string;
      clear: string;
      apply: string;
    };
    create: string;
    tabs: { all: string; pending: string; sent: string; returned: string };
    table: { number: string; type: string; requester: string; status: string; updated: string; action: string; empty: string };
    modal: {
      details: string;
      requester: string;
      created: string;
      period: string;
      comment: string;
      attachments: string;
      history: string;
      showHistory: string;
      hideHistory: string;
      historyPrompt: string;
      approve: string;
      reject: string;
      resend: string;
      close: string;
      rejectPlaceholder: string;
      editTitle: string;
      update: string;
      cancelEdit: string;
      noPermission: string;
      actionSuccess: string;
      actionError: string;
    };
    createModal: {
      title: string;
      selectType: string;
      selectPlaceholder: string;
      selectPrompt: string;
      submit: string;
      submitting: string;
      cancel: string;
      commentLabel: string;
      attachmentLabel: string;
      attachmentHelp: string;
      uploadFromComputer: string;
      addLink: string;
      fileTooLarge: string;
      uploadError: string;
      validation: string;
      success: string;
    };
  }
> = {
  ka: {
    title: 'განაცხადები',
    subtitle: 'დააკვირდით დამტკიცების პროცესს, გააზიარეთ კომენტარები და მართეთ ავტომატური შეტყობინებები.',
    searchPlaceholder: 'ძიება ნომრის, ავტორის, სტატუსის ან თარიღის მიხედვით…',
    filters: {
      heading: 'ძიება და ფილტრები',
      keywordLabel: 'საკვანძო სიტყვა',
      creatorLabel: 'ავტორი',
      creatorPlaceholder: 'ყველა ავტორი',
      statusLabel: 'სტატუსი',
      statusPlaceholder: 'ყველა სტატუსი',
      startDateLabel: 'საწყისი თარიღი',
      endDateLabel: 'საბოლოო თარიღი',
      lastThirtyDays: 'ბოლო 30 დღე',
      clear: 'ფილტრების გასუფთავება',
      apply: 'ძიება'
    },
    create: '+ ახალი განაცხადი',
    tabs: { all: 'ყველა', pending: 'მოლოდინში', sent: 'ჩემი გაგზავნილები', returned: 'უკან დაბრუნებული' },
    table: {
      number: '#',
      type: 'ტიპი',
      requester: 'ავტორი',
      status: 'სტატუსი',
      updated: 'განახლდა',
      action: 'დეტალები',
      empty: 'ჯერ არცერთი განაცხადი არ გაქვთ.'
    },
    modal: {
      details: 'დეტალები',
      requester: 'ავტორი',
      created: 'შექმნის დრო',
      period: 'პერიოდი',
      comment: 'კომენტარი',
      attachments: 'დანართები',
      history: 'ქმედებები',
      showHistory: 'ქმედებების ნახვა',
      hideHistory: 'ქმედებების დამალვა',
      historyPrompt: 'დააჭირეთ ღილაკს, თუ აქტივობის ნახვა გსურთ.',
      approve: 'დამტკიცება',
      reject: 'დაბრუნება',
      resend: 'რედაქტირება და ხელახლა გაგზავნა',
      close: 'დახურვა',
      rejectPlaceholder: 'დაბრუნების მიზეზი…',
      editTitle: 'განაახლეთ ველები',
      update: 'განახლება',
      cancelEdit: 'გაუქმება',
      noPermission: 'თქვენ არ გაქვთ ამ ქმედების შესრულების უფლება.',
      actionSuccess: 'ქმედება წარმატებით შესრულდა.',
      actionError: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან.'
    },
    createModal: {
      title: 'ახალი განაცხადის შექმნა',
      selectType: 'აირჩიეთ განაცხადის ტიპი',
      selectPlaceholder: 'აირჩიეთ ტიპი…',
      selectPrompt: 'ტიპის არჩევის შემდეგ გამოჩნდება მისთვის კონფიგურირებული ველები.',
      submit: 'გაგზავნა',
      submitting: ' იგზავნება…',
      cancel: 'დახურვა',
      commentLabel: 'დამატებითი კომენტარი',
      attachmentLabel: 'დანართები',
      attachmentHelp: 'დაამატეთ ბმული ან ატვირთეთ ფაილი (50MB-მდე).',
      uploadFromComputer: 'ფაილის ატვირთვა კომპიუტერიდან',
      addLink: 'ბმულის დამატება',
      fileTooLarge: 'ფაილი ძალიან დიდია. მაქსიმალური ზომა {size}MB-ია.',
      uploadError: 'ფაილის ატვირთვა ვერ მოხერხდა. სცადეთ თავიდან.',
      validation: 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი.',
      success: 'განაცხადი წარმატებით გაიგზავნა.'
    }
  },
  en: {
    title: 'Applications',
    subtitle: 'Track approval workflows, share comments, and manage automated notifications.',
    searchPlaceholder: 'Search by number, requester, status, or date…',
    filters: {
      heading: 'Search & filters',
      keywordLabel: 'Keyword',
      creatorLabel: 'Creator',
      creatorPlaceholder: 'All creators',
      statusLabel: 'Status',
      statusPlaceholder: 'All statuses',
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      lastThirtyDays: 'Last 30 days',
      clear: 'Clear filters',
      apply: 'Search'
    },
    create: '+ New application',
    tabs: { all: 'All', pending: 'Pending', sent: 'Sent', returned: 'Returned' },
    table: {
      number: '#',
      type: 'Type',
      requester: 'Requester',
      status: 'Status',
      updated: 'Updated',
      action: 'View',
      empty: 'You have no applications yet.'
    },
    modal: {
      details: 'Details',
      requester: 'Requester',
      created: 'Created at',
      period: 'Period',
      comment: 'Comment',
      attachments: 'Attachments',
      history: 'Activity',
      showHistory: 'Show activity',
      hideHistory: 'Hide activity',
      historyPrompt: 'Use the button when you need to review the activity log.',
      approve: 'Approve',
      reject: 'Return',
      resend: 'Edit & resend',
      close: 'Close',
      rejectPlaceholder: 'Provide rejection reason…',
      editTitle: 'Update fields',
      update: 'Save changes',
      cancelEdit: 'Cancel',
      noPermission: 'You do not have permission for this action.',
      actionSuccess: 'Action completed successfully.',
      actionError: 'Something went wrong. Please try again.'
    },
    createModal: {
      title: 'Create a new application',
      selectType: 'Choose application type',
      selectPlaceholder: 'Select a type…',
      selectPrompt: 'Pick an application type to load the fields you configured for it.',
      submit: 'Submit',
      submitting: 'Submitting…',
      cancel: 'Cancel',
      commentLabel: 'Additional comment',
      attachmentLabel: 'Attachments',
      attachmentHelp: 'Attach a link or upload a file (up to 50MB).',
      uploadFromComputer: 'Upload from computer',
      addLink: 'Add link manually',
      fileTooLarge: 'File is too large. Maximum size is {size}MB.',
      uploadError: 'Unable to upload the file. Please try again.',
      validation: 'Please complete every required field.',
      success: 'Application submitted successfully.'
    }
  }
};

const formatDateTime = (value: string, language: 'ka' | 'en') => {
  const formatter = new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(new Date(value));
};

const formatDate = (value: string, language: 'ka' | 'en') => {
  const formatter = new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(value));
};

const formatRemainingTime = (dueAt: string, language: 'ka' | 'en') => {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) {
    return language === 'ka' ? 'ვადა ამოიწურა' : 'Expired';
  }
  const totalMinutes = Math.round(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) {
    parts.push(language === 'ka' ? `${days} დღე` : `${days}d`);
  }
  if (hours) {
    parts.push(language === 'ka' ? `${hours} სთ` : `${hours}h`);
  }
  if (!days && minutes) {
    parts.push(language === 'ka' ? `${minutes} წთ` : `${minutes}m`);
  }
  if (!parts.length) {
    return language === 'ka' ? '1 წთ-ზე ნაკლები დარჩა' : '<1m remaining';
  }
  return language === 'ka'
    ? `დარჩა ${parts.join(' ')}`
    : `${parts.join(' ')} remaining`;
};

const getFieldValue = (bundle: ApplicationBundle, key: string): string | undefined => {
  return bundle.values.find((value) => value.key === key)?.value;
};

const splitRange = (value?: string) => {
  if (!value) {
    return { start: '', end: '' };
  }
  const [start, end] = value.split('/');
  return { start: start ?? '', end: end ?? '' };
};

const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ language }) => {
  const {
    applications,
    applicationTypes,
    users,
    roles,
    currentUser,
    hasPermission,
    createApplication,
    submitApplication,
    approveApplication,
    rejectApplication,
    resendApplication,
    closeApplication,
    updateApplicationValues,
    addApplicationAttachment
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'sent' | 'returned'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(applicationTypes[0]?.id ?? null);
  const [createValues, setCreateValues] = useState<Record<string, string>>({});
  const [createComment, setCreateComment] = useState('');
  const [createAttachments, setCreateAttachments] = useState<AttachmentDraft[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selected, setSelected] = useState<ApplicationBundle | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [editAttachments, setEditAttachments] = useState<AttachmentDraft[]>([]);
  const [editComment, setEditComment] = useState('');
  const [filters, setFilters] = useState<ApplicationFilters>(() => createEmptyFilters());
  const [filterDraft, setFilterDraft] = useState<ApplicationFilters>(() => createEmptyFilters());
  const [showActivity, setShowActivity] = useState(false);

  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const t = COPY[language];

  const typeById = useMemo(
    () => new Map(applicationTypes.map((type) => [type.id, type])),
    [applicationTypes]
  );
  const canManageTypes = hasPermission('manage_request_types');
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const availableTypes = useMemo(() => {
    if (!currentUser) {
      return applicationTypes;
    }
    if (canManageTypes) {
      return applicationTypes;
    }
    return applicationTypes.filter(
      (type) => type.allowedRoleIds.length === 0 || type.allowedRoleIds.includes(currentUser.roleId)
    );
  }, [applicationTypes, currentUser, canManageTypes]);

  const canCreate = Boolean(currentUser && hasPermission('create_requests') && availableTypes.length);
  const canApprove = Boolean(currentUser && hasPermission('approve_requests'));

  const accessibleApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    const roleId = currentUser.roleId;

    return applications.filter((bundle) => {
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }

      const isRequester = bundle.application.requesterId === currentUser.id;
      const isInFlow = type.flow.includes(roleId);
      const isDelegate = bundle.delegates.some((delegate) => delegate.delegateUserId === currentUser.id);

      return isRequester || isInFlow || isDelegate;
    });
  }, [applications, currentUser, typeById]);

  const pendingApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    const roleId = currentUser.roleId;

    return accessibleApplications.filter((bundle) => {
      if (bundle.application.status !== 'PENDING') {
        return false;
      }
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }
      const currentRole = type.flow[bundle.application.currentStepIndex];
      const isDelegate = bundle.delegates.some(
        (delegate) => delegate.forRoleId === currentRole && delegate.delegateUserId === currentUser.id
      );
      return currentRole === roleId || isDelegate;
    });
  }, [accessibleApplications, currentUser, typeById]);

  const sentApplications = useMemo(() => {
    if (!currentUser) {
      return [] as ApplicationBundle[];
    }

    return accessibleApplications.filter((bundle) => bundle.application.requesterId === currentUser.id);
  }, [accessibleApplications, currentUser]);

  const returnedApplications = useMemo(() => {
    return accessibleApplications.filter((bundle) => {
      if (bundle.application.status === 'REJECTED' || bundle.application.currentStepIndex < 0) {
        return true;
      }
      const lastEntry = bundle.auditTrail[bundle.auditTrail.length - 1];
      return lastEntry?.action === 'REJECT' || lastEntry?.action === 'EXPIRE_BOUNCE';
    });
  }, [accessibleApplications]);

  const creatorOptions = useMemo(() => {
    const seen = new Set<number>();
    const options: { id: number; name: string }[] = [];
    accessibleApplications.forEach((bundle) => {
      const requester = userById.get(bundle.application.requesterId);
      if (!requester || seen.has(requester.id)) {
        return;
      }
      seen.add(requester.id);
      options.push({ id: requester.id, name: requester.name });
    });
    const locale = language === 'ka' ? 'ka' : 'en';
    return options.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
  }, [accessibleApplications, language, userById]);

  const filteredApplications = useMemo(() => {
    const source =
      activeTab === 'pending'
        ? pendingApplications
        : activeTab === 'sent'
        ? sentApplications
        : activeTab === 'returned'
        ? returnedApplications
        : accessibleApplications;

    const sorted = [...source].sort(
      (a, b) => new Date(b.application.updatedAt).getTime() - new Date(a.application.updatedAt).getTime()
    );

    const { query, creatorId, status, startDate, endDate } = filters;
    const normalizedQuery = query.trim().toLowerCase();

    const start = startDate ? new Date(startDate) : null;
    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return sorted.filter((bundle) => {
      if (creatorId !== 'all' && bundle.application.requesterId !== creatorId) {
        return false;
      }

      if (status !== 'all' && bundle.application.status !== status) {
        return false;
      }

      const createdAt = new Date(bundle.application.createdAt);
      if (start && createdAt < start) {
        return false;
      }

      if (end && createdAt > end) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const number = bundle.application.number.toLowerCase();
      if (number.includes(normalizedQuery)) {
        return true;
      }

      const type = typeById.get(bundle.application.typeId);
      const requester = userById.get(bundle.application.requesterId);
      const statusMeta = STATUS_META[bundle.application.status];

      const typeName = type?.name[language]?.toLowerCase() ?? '';
      const typeDescription = type?.description[language]?.toLowerCase() ?? '';
      if (typeName.includes(normalizedQuery) || typeDescription.includes(normalizedQuery)) {
        return true;
      }

      const requesterName = requester?.name?.toLowerCase() ?? '';
      if (requesterName.includes(normalizedQuery)) {
        return true;
      }

      const statusLabel = statusMeta.label[language].toLowerCase();
      if (statusLabel.includes(normalizedQuery) || bundle.application.status.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      const created = formatDateTime(bundle.application.createdAt, language).toLowerCase();
      const updated = formatDateTime(bundle.application.updatedAt, language).toLowerCase();
      if (created.includes(normalizedQuery) || updated.includes(normalizedQuery)) {
        return true;
      }

      return false;
    });
  }, [
    accessibleApplications,
    activeTab,
    filters,
    language,
    pendingApplications,
    returnedApplications,
    sentApplications,
    typeById,
    userById
  ]);

  const selectedType = selectedTypeId ? typeById.get(selectedTypeId) ?? null : null;

  useEffect(() => {
    if (!availableTypes.length) {
      setSelectedTypeId(null);
      return;
    }
    if (selectedTypeId !== null && availableTypes.some((type) => type.id === selectedTypeId)) {
      return;
    }
    if (!createOpen) {
      setSelectedTypeId(availableTypes[0].id);
    }
  }, [availableTypes, selectedTypeId, createOpen]);

  useEffect(() => {
    if (!selected) {
      return;
    }
    const updated = applications.find((bundle) => bundle.application.id === selected.application.id);
    if (updated && updated !== selected) {
      setSelected(updated);
    }
  }, [applications, selected]);

  const resetCreateState = () => {
    setCreateValues({});
    setCreateComment('');
    setCreateAttachments([]);
    setCreateError(null);
    setCreateSuccess(null);
    setSelectedTypeId(null);
  };

  const handleFiltersSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ ...filterDraft });
  };

  const handleClearFilters = () => {
    const empty = createEmptyFilters();
    setFilterDraft(empty);
    setFilters(empty);
  };

  const handleLastThirtyDays = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    const formatForInput = (date: Date) => date.toISOString().slice(0, 10);
    const next = {
      ...filterDraft,
      startDate: formatForInput(start),
      endDate: formatForInput(end)
    };
    setFilterDraft(next);
    setFilters(next);
  };

  const handleCreateFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !selectedType) {
      return;
    }

    const files = Array.from(event.target.files);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    const maxSizeMb = selectedType.capabilities.attachmentMaxSizeMb ?? 50;
    const maxBytes = maxSizeMb * 1024 * 1024;

    const validFiles = files.filter((file) => {
      if (file.size > maxBytes) {
        setCreateError(t.createModal.fileTooLarge.replace('{size}', String(maxSizeMb)));
        setCreateSuccess(null);
        return false;
      }
      return true;
    });

    if (!validFiles.length) {
      return;
    }

    try {
      const uploads = await Promise.all(
        validFiles.map(async (file) => ({
          name: file.name,
          url: await readFileAsDataUrl(file),
          fromUpload: true,
          sizeBytes: file.size
        }))
      );
      setCreateAttachments((previous) => [...previous, ...uploads]);
      setCreateError(null);
      setCreateSuccess(null);
    } catch (error) {
      console.error(error);
      setCreateError(t.createModal.uploadError);
      setCreateSuccess(null);
    }
  };

  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !event.target.files) {
      return;
    }

    const type = typeById.get(selected.application.typeId);
    if (!type) {
      return;
    }

    const files = Array.from(event.target.files);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    const maxSizeMb = type.capabilities.attachmentMaxSizeMb ?? 50;
    const maxBytes = maxSizeMb * 1024 * 1024;

    const validFiles = files.filter((file) => {
      if (file.size > maxBytes) {
        setActionError(t.createModal.fileTooLarge.replace('{size}', String(maxSizeMb)));
        setActionMessage(null);
        return false;
      }
      return true;
    });

    if (!validFiles.length) {
      return;
    }

    try {
      const uploads = await Promise.all(
        validFiles.map(async (file) => ({
          name: file.name,
          url: await readFileAsDataUrl(file),
          fromUpload: true,
          sizeBytes: file.size
        }))
      );
      setEditAttachments((previous) => [...previous, ...uploads]);
      setActionError(null);
      setActionMessage(null);
    } catch (error) {
      console.error(error);
      setActionError(t.createModal.uploadError);
      setActionMessage(null);
    }
  };

  const handlePrint = () => {
    if (!selected) {
      return;
    }
    const type = typeById.get(selected.application.typeId);
    if (!type) {
      return;
    }
    const requester = userById.get(selected.application.requesterId);
    const statusMeta = STATUS_META[selected.application.status];
    const fieldRows = type.fields.map((field) => ({
      label: field.label[language],
      value: getFieldValue(selected, field.key) ?? '—'
    }));
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const printCopy = PRINT_COPY[language];
    const attachmentsHtml = selected.attachments.length
      ? selected.attachments
          .map((attachment) => `<li>${escapeHtml(attachment.name)}</li>`)
          .join('')
      : `<li>${escapeHtml(printCopy.noAttachments)}</li>`;

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(selected.application.number)}</title>
    <style>
      @page { size: A4; margin: 12mm; }
      body { font-family: 'Inter', 'Arial', sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      .sheet { max-width: 190mm; margin: 0 auto; background: #ffffff; padding: 12mm; box-sizing: border-box; display: flex; flex-direction: column; gap: 10mm; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 6mm; }
      .header h1 { font-size: 22px; margin: 0; }
      .header .meta { text-align: right; font-size: 12px; color: #475569; }
      .status { font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #1e293b; }
      .details { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6mm; font-size: 12px; color: #334155; }
      .details div { line-height: 1.5; }
      .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 2mm; }
      .section { font-size: 12px; color: #334155; }
      .section h2 { font-size: 13px; font-weight: 600; margin: 0 0 4mm; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; text-align: left; vertical-align: top; }
      th { width: 35%; background: #f8fafc; font-weight: 600; color: #1e293b; }
      td { color: #334155; }
      ul { padding-left: 18px; margin: 0; color: #334155; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div>
          <h1>${escapeHtml(type.name[language])}</h1>
          <div class="status">${escapeHtml(statusMeta.label[language])}</div>
        </div>
        <div class="meta">
          <div>${escapeHtml(printCopy.created)}:</div>
          <div>${escapeHtml(formatDateTime(selected.application.createdAt, language))}</div>
        </div>
      </div>
      <div class="details">
        <div>
          <div class="label">${escapeHtml(printCopy.summaryTitle)}</div>
          <div>${escapeHtml(selected.application.number)}</div>
        </div>
        <div>
          <div class="label">${escapeHtml(printCopy.requester)}</div>
          <div>${escapeHtml(requester?.name ?? '—')}</div>
        </div>
        <div>
          <div class="label">${escapeHtml(printCopy.contact)}</div>
          <div>${escapeHtml(requester?.email ?? '—')}</div>
        </div>
      </div>
      <div class="section">
        <h2>${escapeHtml(printCopy.fields)}</h2>
        <table>
          ${fieldRows
            .map(
              (row) =>
                `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`
            )
            .join('')}
        </table>
      </div>
      <div class="section">
        <h2>${escapeHtml(printCopy.attachments)}</h2>
        <ul>${attachmentsHtml}</ul>
      </div>
    </div>
  </body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 200);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || !selectedType) {
      return;
    }

    const requiredMissing = selectedType.fields.some((field) => {
      if (!field.required) {
        return false;
      }
      const value = createValues[field.key];
      if (field.type === 'date_range') {
        const range = splitRange(value);
        return !range.start || !range.end;
      }
      return !value;
    });

    if (requiredMissing) {
      setCreateError(t.createModal.validation);
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);
    setCreateSuccess(null);

    const attachmentsPayload = selectedType.capabilities.allowsAttachments
      ? createAttachments
          .filter((attachment) => attachment.name.trim().length > 0)
          .map((attachment) => ({
            name: attachment.name,
            url: attachment.url || '#',
            uploadedBy: currentUser.id
          }))
      : [];

    if (selectedType.capabilities.attachmentsRequired && attachmentsPayload.length === 0) {
      setCreateError(t.createModal.validation);
      setIsSubmitting(false);
      return;
    }

    const submissionComment = createComment.trim() ? createComment.trim() : undefined;

    try {
      const values: ApplicationFieldValue[] = selectedType.fields.map((field) => ({
        applicationId: 0,
        key: field.key,
        value: createValues[field.key] ?? ''
      }));

      const bundle = await createApplication({
        typeId: selectedType.id,
        requesterId: currentUser.id,
        values,
        attachments: attachmentsPayload,
        comment: submissionComment
      });

      await submitApplication(bundle.application.id, currentUser.id, submissionComment);

      setCreateSuccess(t.createModal.success);
      setTimeout(() => {
        setCreateOpen(false);
        resetCreateState();
      }, 1200);
    } catch (error) {
      console.error(error);
      setCreateError(t.modal.actionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetails = (bundle: ApplicationBundle) => {
    setSelected(bundle);
    setActionMessage(null);
    setActionError(null);
    setRejectComment('');
    setIsEditing(false);
    setShowActivity(false);
    setEditValues(
      bundle.values.reduce<Record<string, string>>((accumulator, value) => {
        accumulator[value.key] = value.value;
        return accumulator;
      }, {})
    );
    setEditAttachments([]);
    setEditComment('');
  };

  const closeDetails = () => {
    setSelected(null);
    setRejectComment('');
    setIsEditing(false);
    setActionMessage(null);
    setActionError(null);
    setShowActivity(false);
  };

  const handleApprove = async () => {
    if (!selected || !currentUser) {
      return;
    }
    try {
      await approveApplication(selected.application.id, currentUser.id);
      setActionMessage(t.modal.actionSuccess);
    } catch (error) {
      console.error(error);
      setActionError(t.modal.actionError);
    }
  };

  const handleReject = async () => {
    if (!selected || !currentUser || !rejectComment.trim()) {
      return;
    }

    try {
      await rejectApplication(selected.application.id, currentUser.id, rejectComment.trim());
      setActionMessage(t.modal.actionSuccess);
      setRejectComment('');
    } catch (error) {
      console.error(error);
      setActionError(t.modal.actionError);
    }
  };

  const handleResend = async () => {
    if (!selected || !currentUser) {
      return;
    }

    const type = typeById.get(selected.application.typeId);
    if (!type) {
      return;
    }

    const requiredMissing = type.fields.some((field) => {
      if (!field.required) {
        return false;
      }
      const value = editValues[field.key];
      if (field.type === 'date_range') {
        const range = splitRange(value);
        return !range.start || !range.end;
      }
      return !value;
    });

    if (requiredMissing) {
      setActionError(t.createModal.validation);
      return;
    }

    try {
      const values: ApplicationFieldValue[] = type.fields.map((field) => ({
        applicationId: selected.application.id,
        key: field.key,
        value: editValues[field.key] ?? ''
      }));

      await updateApplicationValues(
        selected.application.id,
        currentUser.id,
        values,
        editComment.trim() ? editComment.trim() : undefined
      );

      if (type.capabilities.allowsAttachments) {
        const attachmentsPayload = editAttachments
          .filter((attachment) => attachment.name.trim().length > 0)
          .map((attachment) => ({
            name: attachment.name,
            url: attachment.url || '#',
            uploadedBy: currentUser.id
          }));

        if (type.capabilities.attachmentsRequired && selected.attachments.length + attachmentsPayload.length === 0) {
          setActionError(t.createModal.validation);
          return;
        }

        for (const attachment of attachmentsPayload) {
          await addApplicationAttachment(selected.application.id, attachment, currentUser.id);
        }
      } else if (type.capabilities.attachmentsRequired && selected.attachments.length === 0) {
        setActionError(t.createModal.validation);
        return;
      }

      await resendApplication(
        selected.application.id,
        currentUser.id,
        editComment.trim() ? editComment.trim() : undefined
      );
      setActionMessage(t.modal.actionSuccess);
      setIsEditing(false);
      setEditComment('');
      setEditAttachments([]);
    } catch (error) {
      console.error(error);
      setActionError(t.modal.actionError);
    }
  };

  const handleCloseRequest = async () => {
    if (!selected || !currentUser) {
      return;
    }

    try {
      await closeApplication(selected.application.id, currentUser.id);
      setActionMessage(t.modal.actionSuccess);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setActionError(t.modal.actionError);
    }
  };

  const renderFieldInput = (field: ApplicationFieldDefinition, values: Record<string, string>, setValues: (updater: Record<string, string>) => void) => {
    const value = values[field.key] ?? '';

    const updateValue = (next: string) => {
      setValues({ ...values, [field.key]: next });
    };

    if (field.type === 'textarea') {
      return (
        <textarea
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          rows={4}
          placeholder={field.placeholder ? field.placeholder[language] : ''}
        />
      );
    }

    if (field.type === 'date_range') {
      const range = splitRange(value);
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="date"
            required={field.required}
            value={range.start}
            onChange={(event) => updateValue(`${event.target.value}/${range.end}`)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            type="date"
            required={field.required}
            value={range.end}
            onChange={(event) => updateValue(`${range.start}/${event.target.value}`)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder={field.placeholder ? field.placeholder[language] : ''}
        />
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          required={field.required}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="" disabled>
            {field.placeholder ? field.placeholder[language] : '---'}
          </option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label[language]}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
        required={field.required}
        value={value}
        onChange={(event) => updateValue(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        placeholder={field.placeholder ? field.placeholder[language] : ''}
      />
    );
  };

  const canEditSelected =
    selected &&
    currentUser &&
    hasPermission('create_requests') &&
    selected.application.requesterId === currentUser.id &&
    selected.application.status === 'REJECTED';
  const canApproveSelected =
    selected &&
    currentUser &&
    canApprove &&
    selected.application.status === 'PENDING' &&
    (() => {
      const type = typeById.get(selected.application.typeId);
      if (!type) {
        return false;
      }
      const currentRoleId = type.flow[selected.application.currentStepIndex];
      if (currentRoleId === currentUser.roleId) {
        return true;
      }
      return selected.delegates.some(
        (delegate) => delegate.forRoleId === currentRoleId && delegate.delegateUserId === currentUser.id
      );
    })();

  const renderStepper = (bundle: ApplicationBundle) => {
    const type = typeById.get(bundle.application.typeId);
    if (!type) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
        {type.flow.map((roleId, index) => {
          const role = roleById.get(roleId);
          const isCompleted = index < bundle.application.currentStepIndex;
          const isCurrent = bundle.application.status === 'PENDING' && index === bundle.application.currentStepIndex;

          return (
            <div key={`${bundle.application.id}-step-${roleId}`} className="flex items-center gap-2">
              <div
                className={classNames(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium',
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : isCurrent
                    ? 'border-amber-500 bg-amber-100 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-500'
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Clock3 className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex flex-col text-sm">
                <span className="font-semibold text-slate-700">{role?.name ?? 'Role'}</span>
                <span className="text-xs text-slate-500">{role?.description ?? ''}</span>
              </div>
              {index < type.flow.length - 1 && <ArrowLeftRight className="h-4 w-4 text-slate-300" />}
            </div>
          );
        })}
      </div>
    );
  };

  const renderAttachments = (bundle: ApplicationBundle) => {
    if (!bundle.attachments.length) {
      return <p className="text-sm text-slate-500">—</p>;
    }
    return (
      <ul className="space-y-2">
        {bundle.attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Paperclip className="h-4 w-4 text-slate-400" />
              {attachment.url && attachment.url !== '#' ? (
                <a
                  href={attachment.url}
                  download={attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  {attachment.name}
                </a>
              ) : (
                <span>{attachment.name}</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{formatDateTime(attachment.createdAt, language)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderAuditTrail = (bundle: ApplicationBundle) => {
    const sortedEntries = bundle.auditTrail
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    if (!sortedEntries.length) {
      return (
        <p className="text-sm text-slate-500">
          {language === 'ka' ? 'ჯერჯერობით აქტივობა არ არის.' : 'No activity yet.'}
        </p>
      );
    }

    return (
      <ol className="space-y-3">
        {sortedEntries.map((entry) => {
          const actor = entry.actorId ? userById.get(entry.actorId) : null;
          const actionLabel = AUDIT_ACTION_LABELS[entry.action]?.[language] ?? entry.action;
          return (
            <li key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-700">
                  {actionLabel}
                  {actor ? ` • ${actor.name}` : ''}
                </div>
                <div className="text-xs text-slate-400">{formatDateTime(entry.at, language)}</div>
              </div>
              {entry.comment && <p className="mt-1 text-slate-600">{entry.comment}</p>}
            </li>
          );
        })}
      </ol>
    );
  };

  const renderSummary = (bundle: ApplicationBundle) => {
    const requester = userById.get(bundle.application.requesterId);
    const type = typeById.get(bundle.application.typeId);
    const startDate = getFieldValue(bundle, 'start_date');
    const endDate = getFieldValue(bundle, 'end_date');
    const startTime = getFieldValue(bundle, 'start_time');
    const endTime = getFieldValue(bundle, 'end_time');
    const reasonValue = getFieldValue(bundle, 'reason');
    const commentValue = getFieldValue(bundle, 'additional_comment');
    const extraFields = type
      ? type.fields.filter((field) => !BUILT_IN_FIELD_KEYS.has(field.key))
      : [];
    const extraFieldEntries = extraFields.map((field) => ({
      key: field.key,
      label: field.label[language],
      value: getFieldValue(bundle, field.key) ?? ''
    }));

    const formatDateSegment = (date?: string, time?: string) => {
      if (!date) {
        return '—';
      }
      const formattedDate = formatDate(date, language);
      if (time) {
        return `${formattedDate} • ${time}`;
      }
      return formattedDate;
    };

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.modal.requester}</p>
              <p className="font-semibold text-slate-700">{requester?.name ?? '—'}</p>
              <p className="text-xs text-slate-500">{requester?.email ?? '—'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.modal.created}</p>
              <p className="font-semibold text-slate-700">{formatDateTime(bundle.application.createdAt, language)}</p>
              {bundle.application.dueAt && (
                <div className="text-xs text-amber-600">
                  <div>SLA • {formatDateTime(bundle.application.dueAt, language)}</div>
                  <div>{formatRemainingTime(bundle.application.dueAt, language)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{t.modal.period}</p>
              {(startDate || endDate) ? (
                <p className="font-semibold text-slate-700">
                  {formatDateSegment(startDate, startTime)} → {formatDateSegment(endDate, endTime)}
                </p>
              ) : (
                <p className="font-semibold text-slate-500">—</p>
              )}
              {type && <p className="text-xs text-slate-500">{type.description[language]}</p>}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 text-rose-500" />
            <div className="space-y-2 text-sm text-slate-600">
              {reasonValue && reasonValue.trim() && (
                <div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{language === 'ka' ? 'მიზანი' : 'Purpose'}</span>
                  <p className="font-medium text-slate-700">{reasonValue}</p>
                </div>
              )}
              {extraFieldEntries.map((entry) => (
                <div key={entry.key}>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{entry.label}</span>
                  <div className="font-medium text-slate-700">
                    {entry.value.trim() ? entry.value : '—'}
                  </div>
                </div>
              ))}
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-400">{t.modal.comment}</span>
                <p className="text-slate-600">{commentValue?.trim() ? commentValue : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!createOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t.createModal.title}</h2>
              <p className="text-sm text-slate-500">
                {selectedType ? selectedType.description[language] : t.createModal.selectPrompt}
              </p>
            </div>
            <button
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => {
                setCreateOpen(false);
                resetCreateState();
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleCreateSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700" htmlFor="create-type">
                  {t.createModal.selectType}
                </label>
                <select
                  id="create-type"
                  value={selectedTypeId ?? ''}
                  onChange={(event) => {
                    const value = event.target.value ? Number(event.target.value) : null;
                    setSelectedTypeId(value);
                    setCreateValues({});
                    setCreateAttachments([]);
                    setCreateComment('');
                    setCreateError(null);
                    setCreateSuccess(null);
                    if (createFileInputRef.current) {
                      createFileInputRef.current.value = '';
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="">{t.createModal.selectPlaceholder}</option>
                  {availableTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name[language]}
                    </option>
                  ))}
                </select>
              </div>

              {selectedType ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <div className="space-y-4">
                    {selectedType.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-slate-700">
                            {field.label[language]}
                          </label>
                          {field.required && <span className="text-xs text-rose-500">*</span>}
                        </div>
                        {renderFieldInput(field, createValues, (next) => setCreateValues(next))}
                        {field.helper && <p className="text-xs text-slate-500">{field.helper[language]}</p>}
                      </div>
                    ))}

                    {selectedType.capabilities.allowsAttachments && (
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                        {createAttachments.map((attachment, index) => (
                          <div
                            key={`attachment-${index}`}
                            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <input
                                type="text"
                                value={attachment.name}
                                placeholder="document.pdf"
                                onChange={(event) => {
                                  const next = [...createAttachments];
                                  next[index] = { ...next[index], name: event.target.value };
                                  setCreateAttachments(next);
                                }}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                              />
                              {attachment.fromUpload ? (
                                <span className="text-xs font-medium text-slate-500">
                                  {formatFileSize(attachment.sizeBytes ?? 0, language)}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={attachment.url}
                                  placeholder="https://…"
                                  onChange={(event) => {
                                    const next = [...createAttachments];
                                    next[index] = { ...next[index], url: event.target.value };
                                    setCreateAttachments(next);
                                  }}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateAttachments(createAttachments.filter((_, idx) => idx !== index));
                                }}
                                className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <input
                            ref={createFileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={handleCreateFileUpload}
                          />
                          <button
                            type="button"
                            onClick={() => createFileInputRef.current?.click()}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            <Paperclip className="h-4 w-4" />
                            {t.createModal.uploadFromComputer}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateAttachments([...createAttachments, { name: '', url: '' }])}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            <PlusCircle className="h-4 w-4" />
                            {t.createModal.addLink}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">{t.createModal.attachmentHelp}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-sm text-slate-500">
                  {t.createModal.selectPrompt}
                </div>
              )}
            </div>

            {createError && <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{createError}</div>}
            {createSuccess && <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{createSuccess}</div>}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setCreateOpen(false);
                  resetCreateState();
                }}
              >
                {t.createModal.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedType}
                className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? t.createModal.submitting : t.createModal.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selected) {
      return null;
    }

    const type = typeById.get(selected.application.typeId);
    const statusMeta = STATUS_META[selected.application.status];

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
        <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{type?.name[language]}</p>
              <h2 className="text-2xl font-bold text-slate-800">{selected.application.number}</h2>
              <p className="text-xs text-slate-500">{formatDateTime(selected.application.createdAt, language)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={classNames('flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold', statusMeta.color)}>
                {statusMeta.icon}
                {statusMeta.label[language]}
              </span>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                onClick={handlePrint}
              >
                <Printer className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                onClick={closeDetails}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
            <div className="space-y-6">
              {renderStepper(selected)}
              {renderSummary(selected)}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-slate-800">{t.modal.attachments}</h3>
                  {renderAttachments(selected)}
                </div>
                {showActivity ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">{t.modal.history}</h3>
                      <button
                        type="button"
                        onClick={() => setShowActivity(false)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      >
                        {t.modal.hideHistory}
                      </button>
                    </div>
                    {renderAuditTrail(selected)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-center shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-700">{t.modal.history}</h3>
                    <p className="mt-2 text-sm text-slate-500">{t.modal.historyPrompt}</p>
                    <button
                      type="button"
                      onClick={() => setShowActivity(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      <Clock3 className="h-4 w-4" />
                      {t.modal.showHistory}
                    </button>
                  </div>
                )}
              </div>

              {actionMessage && <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{actionMessage}</div>}
              {actionError && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{actionError}</div>}

              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                  {canApproveSelected && (
                    <>
                      <button
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                        onClick={handleApprove}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t.modal.approve}
                      </button>
                      <div className="flex items-center gap-2">
                        <input
                          value={rejectComment}
                          onChange={(event) => setRejectComment(event.target.value)}
                          placeholder={t.modal.rejectPlaceholder}
                          className="w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          className="flex items-center gap-2 rounded-lg bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-200"
                          onClick={handleReject}
                          disabled={!rejectComment.trim()}
                        >
                          <AlertCircle className="h-4 w-4" />
                          {t.modal.reject}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {canEditSelected && (
                  <div className="flex gap-3">
                    <button
                      className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
                      onClick={() => setIsEditing(true)}
                    >
                      <ShieldHalf className="h-4 w-4" />
                      {t.modal.resend}
                    </button>
                    <button
                      className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100"
                      onClick={handleCloseRequest}
                    >
                      <X className="h-4 w-4" />
                      {t.modal.close}
                    </button>
                  </div>
                )}
              </div>

              {isEditing && selected && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="mb-4 text-lg font-semibold text-slate-800">{t.modal.editTitle}</h3>
                  {type && (
                    <div className="space-y-4">
                      {type.fields.map((field) => (
                        <div key={`edit-${field.key}`} className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">{field.label[language]}</label>
                          {renderFieldInput(field, editValues, (next) => setEditValues(next))}
                        </div>
                      ))}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">{t.createModal.commentLabel}</label>
                        <textarea
                          value={editComment}
                          onChange={(event) => setEditComment(event.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                          rows={3}
                        />
                      </div>
                      {type.capabilities.allowsAttachments && (
                        <div className="space-y-3">
                          <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                          {editAttachments.map((attachment, index) => (
                            <div
                              key={`edit-attachment-${index}`}
                              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                <input
                                  type="text"
                                  value={attachment.name}
                                  placeholder="document.pdf"
                                  onChange={(event) => {
                                    const next = [...editAttachments];
                                    next[index] = { ...next[index], name: event.target.value };
                                    setEditAttachments(next);
                                  }}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                                {attachment.fromUpload ? (
                                  <span className="text-xs font-medium text-slate-500">
                                    {formatFileSize(attachment.sizeBytes ?? 0, language)}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={attachment.url}
                                    placeholder="https://…"
                                    onChange={(event) => {
                                      const next = [...editAttachments];
                                      next[index] = { ...next[index], url: event.target.value };
                                      setEditAttachments(next);
                                    }}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setEditAttachments(editAttachments.filter((_, idx) => idx !== index))}
                                  className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <input
                              ref={editFileInputRef}
                              type="file"
                              className="hidden"
                              multiple
                              onChange={handleEditFileUpload}
                            />
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                            >
                              <Paperclip className="h-4 w-4" />
                              {t.createModal.uploadFromComputer}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditAttachments([...editAttachments, { name: '', url: '' }])}
                              className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:border-sky-300 hover:text-sky-600"
                            >
                              <PlusCircle className="h-4 w-4" />
                              {t.createModal.addLink}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500">{t.createModal.attachmentHelp}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
                          onClick={handleResend}
                        >
                          <Send className="h-4 w-4" />
                          {t.modal.update}
                        </button>
                        <button
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                          onClick={() => setIsEditing(false)}
                        >
                          {t.modal.cancelEdit}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>
        {canCreate && (
          <button
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 transition hover:bg-sky-700"
            onClick={() => {
              resetCreateState();
              setCreateOpen(true);
            }}
          >
            <PlusCircle className="h-4 w-4" />
            {t.create}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'sent', 'returned'] as const).map((tab) => {
              const count =
                tab === 'pending'
                  ? pendingApplications.length
                  : tab === 'sent'
                  ? sentApplications.length
                  : tab === 'returned'
                  ? returnedApplications.length
                  : accessibleApplications.length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={classNames(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {t.tabs[tab]}
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 shadow">{count}</span>
                </button>
              );
            })}
          </div>

          <form
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-inner"
            onSubmit={handleFiltersSubmit}
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.filters.heading}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="xl:col-span-2">
                  <label className="text-xs font-semibold text-slate-500" htmlFor="applications-keyword">
                    {t.filters.keywordLabel}
                  </label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="applications-keyword"
                      value={filterDraft.query}
                      onChange={(event) =>
                        setFilterDraft((previous) => ({ ...previous, query: event.target.value }))
                      }
                      placeholder={t.searchPlaceholder}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      type="search"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500" htmlFor="applications-creator">
                    {t.filters.creatorLabel}
                  </label>
                  <div className="mt-2">
                    <select
                      id="applications-creator"
                      value={filterDraft.creatorId === 'all' ? 'all' : String(filterDraft.creatorId)}
                      onChange={(event) =>
                        setFilterDraft((previous) => ({
                          ...previous,
                          creatorId: event.target.value === 'all' ? 'all' : Number(event.target.value)
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="all">{t.filters.creatorPlaceholder}</option>
                      {creatorOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500" htmlFor="applications-status">
                    {t.filters.statusLabel}
                  </label>
                  <div className="mt-2">
                    <select
                      id="applications-status"
                      value={filterDraft.status}
                      onChange={(event) =>
                        setFilterDraft((previous) => ({
                          ...previous,
                          status: event.target.value === 'all' ? 'all' : (event.target.value as ApplicationStatus)
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="all">{t.filters.statusPlaceholder}</option>
                      {FILTERABLE_STATUSES.map((statusKey) => (
                        <option key={statusKey} value={statusKey}>
                          {STATUS_META[statusKey].label[language]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500" htmlFor="applications-start-date">
                    {t.filters.startDateLabel}
                  </label>
                  <input
                    id="applications-start-date"
                    type="date"
                    value={filterDraft.startDate}
                    onChange={(event) =>
                      setFilterDraft((previous) => ({ ...previous, startDate: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500" htmlFor="applications-end-date">
                    {t.filters.endDateLabel}
                  </label>
                  <input
                    id="applications-end-date"
                    type="date"
                    value={filterDraft.endDate}
                    onChange={(event) =>
                      setFilterDraft((previous) => ({ ...previous, endDate: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLastThirtyDays}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:text-slate-800 hover:shadow"
                  >
                    <CalendarDays className="h-4 w-4 text-sky-500" />
                    {t.filters.lastThirtyDays}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                    {t.filters.clear}
                  </button>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:via-sky-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1"
                >
                  <Search className="h-4 w-4" />
                  {t.filters.apply}
                </button>
              </div>
            </div>
          </form>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.table.number}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.table.type}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.table.requester}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.table.status}
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t.table.updated}
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    {t.table.empty}
                  </td>
                </tr>
              )}
              {filteredApplications.map((bundle) => {
                const type = typeById.get(bundle.application.typeId);
                const requester = userById.get(bundle.application.requesterId);
                const statusMeta = STATUS_META[bundle.application.status];
                return (
                  <tr key={bundle.application.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{bundle.application.number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-700">{type?.name[language]}</p>
                        <p className="text-xs text-slate-500">{type?.description[language]}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{requester?.name}</td>
                    <td className="px-4 py-3">
                      <span className={classNames('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', statusMeta.color)}>
                        {statusMeta.icon}
                        {statusMeta.label[language]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateTime(bundle.application.updatedAt, language)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
                        onClick={() => openDetails(bundle)}
                      >
                        {t.table.action}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {renderCreateModal()}
      {renderDetailModal()}
    </div>
  );
};

export { ApplicationsPage };
