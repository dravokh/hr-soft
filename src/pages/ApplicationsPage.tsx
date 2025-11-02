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
  ApplicationStatus
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

const COPY: Record<
  ApplicationsPageProps['language'],
  {
    title: string;
    subtitle: string;
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
      formTitle: string;
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
      formTitle: 'მთავარი ინფორმაცია',
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
      formTitle: 'Primary information',
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

  const filteredApplications = useMemo(() => {
    const source =
      activeTab === 'pending'
        ? pendingApplications
        : activeTab === 'sent'
        ? sentApplications
        : activeTab === 'returned'
        ? returnedApplications
        : accessibleApplications;

    return [...source].sort(
      (a, b) => new Date(b.application.updatedAt).getTime() - new Date(a.application.updatedAt).getTime()
    );
  }, [activeTab, accessibleApplications, pendingApplications, returnedApplications, sentApplications]);

  const selectedType = selectedTypeId ? typeById.get(selectedTypeId) ?? null : null;

  useEffect(() => {
    if (!availableTypes.length) {
      setSelectedTypeId(null);
      return;
    }
    if (!selectedTypeId || !availableTypes.some((type) => type.id === selectedTypeId)) {
      setSelectedTypeId(availableTypes[0].id);
    }
  }, [availableTypes, selectedTypeId]);

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
    setSelectedTypeId(availableTypes[0]?.id ?? null);
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

    const attachmentsHtml = selected.attachments.length
      ? selected.attachments
          .map((attachment, idx) => `
            <div class="attachment-item">
              <span class="attachment-number">${idx + 1}</span>
              <span class="attachment-name">${escapeHtml(attachment.name)}</span>
              <span class="attachment-date">${escapeHtml(formatDateTime(attachment.createdAt, language))}</span>
            </div>
          `)
          .join('')
      : `<div class="no-attachments">${language === 'ka' ? 'დანართები არ არის' : 'No attachments'}</div>`;

    const auditHtml = selected.auditTrail
      .slice()
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .map((entry) => {
        const actor = entry.actorId ? userById.get(entry.actorId) : null;
        return `
          <div class="audit-entry">
            <div class="audit-header">
              <span class="audit-action">${escapeHtml(entry.action)}</span>
              <span class="audit-date">${escapeHtml(formatDateTime(entry.at, language))}</span>
            </div>
            <div class="audit-actor">${actor ? escapeHtml(actor.name) : '—'}</div>
            ${entry.comment ? `<div class="audit-comment">${escapeHtml(entry.comment)}</div>` : ''}
          </div>
        `;
      })
      .join('');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(selected.application.number)}</title>
    <style>
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none; }
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Segoe UI', -apple-system, system-ui, sans-serif;
        background: #f5f7fa;
        padding: 20px;
      }

      .sheet {
        width: 210mm;
        min-height: 297mm;
        background: white;
        margin: 0 auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        position: relative;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 40px 30px 40px;
        color: white;
        position: relative;
        overflow: hidden;
      }

      .header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -10%;
        width: 300px;
        height: 300px;
        background: rgba(255,255,255,0.1);
        border-radius: 50%;
      }

      .header-content { position: relative; z-index: 1; }

      .company-name {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }

      .doc-title {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .doc-number {
        font-size: 16px;
        opacity: 0.95;
        font-weight: 500;
      }

      .status-badge {
        position: absolute;
        top: 40px;
        right: 40px;
        background: rgba(255,255,255,0.25);
        backdrop-filter: blur(10px);
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        border: 2px solid rgba(255,255,255,0.3);
      }

      .content {
        padding: 40px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 25px;
        margin-bottom: 40px;
      }

      .info-card {
        background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
        border: 1px solid #e0e7ff;
        border-radius: 12px;
        padding: 20px;
        position: relative;
      }

      .info-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-bottom: 12px;
      }

      .info-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #6366f1;
        font-weight: 600;
        margin-bottom: 6px;
      }

      .info-value {
        font-size: 15px;
        color: #1e293b;
        font-weight: 600;
        line-height: 1.5;
      }

      .info-sub {
        font-size: 13px;
        color: #64748b;
        margin-top: 4px;
      }

      .section-title {
        font-size: 18px;
        color: #1e293b;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 3px solid #667eea;
        display: inline-block;
      }

      .fields-table {
        width: 100%;
        margin-bottom: 40px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }

      .fields-table tr:nth-child(even) {
        background: #f8fafc;
      }

      .fields-table td {
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
      }

      .fields-table tr:last-child td {
        border-bottom: none;
      }

      .field-label {
        font-weight: 600;
        color: #475569;
        width: 40%;
        font-size: 13px;
      }

      .field-value {
        color: #1e293b;
        font-size: 14px;
      }

      .section {
        margin-bottom: 40px;
      }

      .attachments-list {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e2e8f0;
      }

      .attachment-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        margin-bottom: 10px;
        border: 1px solid #e2e8f0;
      }

      .attachment-item:last-child {
        margin-bottom: 0;
      }

      .attachment-number {
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .attachment-name {
        flex: 1;
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
      }

      .attachment-date {
        font-size: 12px;
        color: #64748b;
      }

      .no-attachments {
        text-align: center;
        padding: 30px;
        color: #94a3b8;
        font-style: italic;
      }

      .audit-trail {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        border: 1px solid #e2e8f0;
      }

      .audit-entry {
        background: white;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 12px;
        border-left: 4px solid #667eea;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #667eea;
      }

      .audit-entry:last-child {
        margin-bottom: 0;
      }

      .audit-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .audit-action {
        font-weight: 700;
        color: #667eea;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .audit-date {
        font-size: 12px;
        color: #64748b;
      }

      .audit-actor {
        font-size: 13px;
        color: #475569;
        margin-bottom: 8px;
      }

      .audit-comment {
        font-size: 13px;
        color: #1e293b;
        background: #f1f5f9;
        padding: 10px;
        border-radius: 6px;
        margin-top: 8px;
      }

      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 2px solid #e2e8f0;
        text-align: center;
        color: #94a3b8;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="header-content">
          <div class="company-name">${language === 'ka' ? 'HR სისტემა' : 'HR SYSTEM'}</div>
          <div class="doc-title">${escapeHtml(type.name[language])}</div>
          <div class="doc-number">#${escapeHtml(selected.application.number)}</div>
        </div>
        <div class="status-badge">${escapeHtml(statusMeta.label[language])}</div>
      </div>

      <div class="content">
        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">👤</div>
            <div class="info-label">${language === 'ka' ? 'ავტორი' : 'REQUESTER'}</div>
            <div class="info-value">${escapeHtml(requester?.name ?? '—')}</div>
            <div class="info-sub">${escapeHtml(requester?.email ?? '')}</div>
          </div>

          <div class="info-card">
            <div class="info-icon">📅</div>
            <div class="info-label">${language === 'ka' ? 'შექმნის თარიღი' : 'CREATED DATE'}</div>
            <div class="info-value">${escapeHtml(formatDateTime(selected.application.createdAt, language))}</div>
            ${
              selected.application.dueAt
                ? `<div class="info-sub">SLA: ${escapeHtml(formatDateTime(selected.application.dueAt, language))}</div>`
                : ''
            }
          </div>
        </div>

        <div class="section">
          <div class="section-title">${language === 'ka' ? 'მონაცემები' : 'DETAILS'}</div>
          <table class="fields-table">
            ${fieldRows
              .map(
                (row) =>
                  `<tr><td class="field-label">${escapeHtml(row.label)}</td><td class="field-value">${escapeHtml(row.value)}</td></tr>`
              )
              .join('')}
          </table>
        </div>

        <div class="section">
          <div class="section-title">${language === 'ka' ? 'დანართები' : 'ATTACHMENTS'}</div>
          <div class="attachments-list">
            ${attachmentsHtml}
          </div>
        </div>

        <div class="section">
          <div class="section-title">${language === 'ka' ? 'აქტივობის ისტორია' : 'ACTIVITY HISTORY'}</div>
          <div class="audit-trail">
            ${auditHtml}
          </div>
        </div>

        <div class="footer">
          ${language === 'ka' ? 'დოკუმენტი ავტომატურად გენერირებულია HR სისტემიდან' : 'Document automatically generated from HR System'}
          • ${escapeHtml(new Date().toLocaleDateString(language === 'ka' ? 'ka-GE' : 'en-US'))}
        </div>
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
        comment: createComment
      });

      await submitApplication(bundle.application.id, currentUser.id, createComment);

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
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-2 border-slate-200 shadow-lg">
        <div className="absolute top-3 right-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {language === 'ka' ? 'პროცესი' : 'WORKFLOW'}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {type.flow.map((roleId, index) => {
            const role = roleById.get(roleId);
            const isCompleted = index < bundle.application.currentStepIndex;
            const isCurrent = bundle.application.status === 'PENDING' && index === bundle.application.currentStepIndex;

            return (
              <div key={`${bundle.application.id}-step-${roleId}`} className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border-2 border-slate-200 shadow-md">
                  <div
                    className={classNames(
                      'flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold shadow-lg transition-all duration-300',
                      isCompleted
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white scale-105'
                        : isCurrent
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-105 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isCurrent ? <Clock3 className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className={classNames('font-bold text-sm', isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-500')}>
                      {role?.name ?? 'Role'}
                    </span>
                    <span className="text-xs text-slate-500">{role?.description ?? ''}</span>
                  </div>
                </div>
                {index < type.flow.length - 1 && (
                  <div className="flex items-center">
                    <ArrowLeftRight className={classNames('h-5 w-5', isCompleted ? 'text-emerald-500' : 'text-slate-300')} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
    const actionColors: Record<string, { bg: string; text: string; icon: string }> = {
      CREATE: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🎯' },
      SUBMIT: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '📤' },
      APPROVE: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '✅' },
      REJECT: { bg: 'bg-rose-100', text: 'text-rose-700', icon: '❌' },
      EDIT: { bg: 'bg-amber-100', text: 'text-amber-700', icon: '✏️' },
      RESEND: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🔄' },
      CLOSE: { bg: 'bg-slate-100', text: 'text-slate-700', icon: '🔒' },
      AUTO_APPROVE: { bg: 'bg-teal-100', text: 'text-teal-700', icon: '⚡' },
      EXPIRE_BOUNCE: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '⏰' }
    };

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {bundle.auditTrail
          .slice()
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .map((entry, index) => {
            const actor = entry.actorId ? userById.get(entry.actorId) : null;
            const colors = actionColors[entry.action] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: '📋' };
            const isRecent = index === 0;

            return (
              <div
                key={entry.id}
                className={classNames(
                  'group relative rounded-xl border-2 p-4 shadow-md hover:shadow-lg transition-all duration-300',
                  isRecent ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : 'border-slate-200 bg-white'
                )}
              >
                {isRecent && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg">
                    {language === 'ka' ? 'ახალი' : 'NEW'}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md flex-shrink-0', colors.bg)}>
                    {colors.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <span className={classNames('font-bold text-sm uppercase tracking-wide', colors.text)}>
                          {entry.action}
                        </span>
                        {actor && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
                              {actor.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{actor.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {formatDateTime(entry.at, language)}
                      </div>
                    </div>
                    {entry.comment && (
                      <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm text-slate-700 leading-relaxed">{entry.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="group relative rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 p-5 shadow-lg border-2 border-sky-100 hover:border-sky-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-sky-200/30 rounded-full blur-2xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <UserRound className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold text-sky-600 mb-1">{t.modal.requester}</p>
              <p className="font-bold text-slate-800 text-lg">{requester?.name ?? '—'}</p>
              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                {requester?.email ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-lg border-2 border-amber-100 hover:border-amber-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-amber-200/30 rounded-full blur-2xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">{t.modal.created}</p>
              <p className="font-bold text-slate-800 text-base">{formatDateTime(bundle.application.createdAt, language)}</p>
              {bundle.application.dueAt && (
                <div className="text-sm text-amber-700 mt-2 bg-amber-100 rounded-lg px-3 py-1.5 inline-block">
                  <div className="font-semibold">SLA: {formatDateTime(bundle.application.dueAt, language)}</div>
                  <div className="text-xs font-medium">{formatRemainingTime(bundle.application.dueAt, language)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 shadow-lg border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-indigo-200/30 rounded-full blur-2xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock3 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-600 mb-1">{t.modal.period}</p>
              {(startDate || endDate) ? (
                <p className="font-bold text-slate-800 text-base leading-relaxed">
                  {formatDateSegment(startDate, startTime)} → {formatDateSegment(endDate, endTime)}
                </p>
              ) : (
                <p className="font-bold text-slate-500 text-base">—</p>
              )}
              {type && <p className="text-xs text-slate-600 mt-2 bg-indigo-100 rounded px-2 py-1 inline-block">{type.description[language]}</p>}
            </div>
          </div>
        </div>

        <div className="group relative rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-5 shadow-lg border-2 border-rose-100 hover:border-rose-300 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-3 right-3 w-20 h-20 bg-rose-200/30 rounded-full blur-2xl"></div>
          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-xs uppercase tracking-wider font-bold text-rose-600">{language === 'ka' ? 'დეტალები' : 'DETAILS'}</p>
              {reasonValue && reasonValue.trim() && (
                <div className="bg-white rounded-lg p-3 border border-rose-100">
                  <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{language === 'ka' ? 'მიზანი' : 'Purpose'}</span>
                  <p className="font-semibold text-slate-800 text-sm">{reasonValue}</p>
                </div>
              )}
              {extraFieldEntries.map((entry) => (
                <div key={entry.key} className="bg-white rounded-lg p-3 border border-rose-100">
                  <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{entry.label}</span>
                  <div className="font-semibold text-slate-800 text-sm">
                    {entry.value.trim() ? entry.value : '—'}
                  </div>
                </div>
              ))}
              {commentValue?.trim() && (
                <div className="bg-white rounded-lg p-3 border border-rose-100">
                  <span className="text-xs uppercase tracking-wider text-rose-500 font-semibold block mb-1">{t.modal.comment}</span>
                  <p className="text-slate-700 text-sm">{commentValue}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!createOpen || !selectedType) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t.createModal.title}</h2>
              <p className="text-sm text-slate-500">{selectedType.description[language]}</p>
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
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {availableTypes.map((type) => {
                const isActive = type.id === selectedType.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedTypeId(type.id);
                      setCreateValues({});
                      setCreateAttachments([]);
                    }}
                    className={classNames(
                      'flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-sky-500 bg-sky-50 shadow'
                        : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50'
                    )}
                  >
                    <p className="font-semibold text-slate-700">{type.name[language]}</p>
                    <p className="text-sm text-slate-500">{type.description[language]}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="mb-4">
                <p className="text-lg font-semibold text-slate-800">{selectedType.name[language]}</p>
                <p className="text-sm text-slate-500">{t.createModal.formTitle}</p>
              </div>
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">{t.createModal.commentLabel}</label>
                  <textarea
                    value={createComment}
                    onChange={(event) => setCreateComment(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    rows={3}
                  />
                </div>

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
                disabled={isSubmitting}
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
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-sm px-4">
        <div className="w-full max-w-6xl rounded-3xl bg-gradient-to-br from-white to-slate-50 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Modern Header with Gradient */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium tracking-wider uppercase">{type?.name[language]}</p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{selected.application.number}</h2>
                  </div>
                </div>
                <p className="text-white/70 text-sm flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  {formatDateTime(selected.application.createdAt, language)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={classNames('flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-white/95 backdrop-blur-md shadow-lg border border-white/50', statusMeta.color)}>
                  {statusMeta.icon}
                  {statusMeta.label[language]}
                </span>
                <button
                  type="button"
                  className="rounded-xl p-2.5 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all border border-white/30 shadow-lg"
                  onClick={handlePrint}
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="rounded-xl p-2.5 bg-white/20 backdrop-blur-md text-white hover:bg-rose-500 hover:bg-opacity-90 transition-all border border-white/30 shadow-lg"
                  onClick={closeDetails}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-8 py-6 bg-gradient-to-br from-slate-50 to-white">
            <div className="space-y-6">
              {/* Enhanced Stepper */}
              <div className="relative">
                {renderStepper(selected)}
              </div>

              {/* Summary Cards with Better Styling */}
              {renderSummary(selected)}

              {/* Attachments and History Grid */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
                  <div className="absolute -top-4 left-6 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      {t.modal.attachments}
                    </h3>
                  </div>
                  <div className="mt-4">
                    {renderAttachments(selected)}
                  </div>
                </div>
                <div className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300">
                  <div className="absolute -top-4 left-6 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      {t.modal.history}
                    </h3>
                  </div>
                  <div className="mt-4">
                    {renderAuditTrail(selected)}
                  </div>
                </div>
              </div>

              {actionMessage && (
                <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 px-5 py-4 text-emerald-700 font-medium shadow-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{actionMessage}</span>
                </div>
              )}
              {actionError && (
                <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border-2 border-rose-200 px-5 py-4 text-rose-700 font-medium shadow-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

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
            onClick={() => setCreateOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            {t.create}
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
