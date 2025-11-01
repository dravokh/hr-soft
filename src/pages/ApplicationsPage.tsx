import React, { FormEvent, useEffect, useMemo, useState } from 'react';
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
  Plane,
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
}

const classNames = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

const TYPE_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  CalendarDays,
  Plane,
  ShieldHalf
};

const BUILTIN_FIELD_KEYS = new Set([
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
    tabs: { all: string; pending: string; sent: string };
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
      validation: string;
      success: string;
    };
  }
> = {
  ka: {
    title: 'განაცხადები',
    subtitle: 'დააკვირდით დამტკიცების პროცესს, გააზიარეთ კომენტარები და მართეთ ავტომატური შეტყობინებები.',
    create: '+ ახალი განაცხადი',
    tabs: { all: 'ყველა', pending: 'მოლოდინში', sent: 'ჩემი გაგზავნილები' },
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
      attachmentLabel: 'დანართის დასახელება',
      attachmentHelp: 'მიუთითეთ ბმული ან მოკლე აღწერა. (ფაილის ატვირთვა დემო რეჟიმში სიმულირებულია)',
      validation: 'გთხოვთ შეავსოთ ყველა სავალდებულო ველი.',
      success: 'განაცხადი წარმატებით გაიგზავნა.'
    }
  },
  en: {
    title: 'Applications',
    subtitle: 'Track approval workflows, share comments, and manage automated notifications.',
    create: '+ New application',
    tabs: { all: 'All', pending: 'Pending', sent: 'Sent' },
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
      attachmentLabel: 'Attachment name',
      attachmentHelp: 'Provide a link or short description. (File upload is simulated in this demo)',
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

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'sent'>('all');
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

  const t = COPY[language];

  const typeById = useMemo(
    () => new Map(applicationTypes.map((type) => [type.id, type])),
    [applicationTypes]
  );
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const roleById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const availableTypes = useMemo(() => {
    if (!currentUser) {
      return applicationTypes;
    }
    return applicationTypes.filter(
      (type) => type.allowedRoleIds.length === 0 || type.allowedRoleIds.includes(currentUser.roleId)
    );
  }, [applicationTypes, currentUser]);

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

  const filteredApplications = useMemo(() => {
    const source =
      activeTab === 'pending'
        ? pendingApplications
        : activeTab === 'sent'
        ? sentApplications
        : accessibleApplications;

    return [...source].sort(
      (a, b) => new Date(b.application.updatedAt).getTime() - new Date(a.application.updatedAt).getTime()
    );
  }, [activeTab, accessibleApplications, pendingApplications, sentApplications]);

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
          .map((attachment) => `<li>${escapeHtml(attachment.name)}</li>`)
          .join('')
      : `<li>${language === 'ka' ? 'ფაილი არ არის' : 'No attachments'}</li>`;

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(selected.application.number)}</title>
    <style>
      body { font-family: 'Arial', sans-serif; margin: 0; background: #f1f5f9; }
      .sheet { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 20mm; box-sizing: border-box; }
      h1 { font-size: 22px; margin-bottom: 4mm; }
      h2 { font-size: 16px; margin: 10mm 0 4mm; }
      table { width: 100%; border-collapse: collapse; margin-top: 6mm; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { width: 35%; background: #f8fafc; }
      .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 8mm; }
      .meta div { line-height: 1.6; }
      .status { font-weight: bold; color: #0f172a; }
      ul { padding-left: 18px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1>${escapeHtml(type.name[language])}</h1>
      <div class="meta">
        <div>
          <div>${escapeHtml(selected.application.number)}</div>
          <div>${escapeHtml(statusMeta.label[language])}</div>
        </div>
        <div>
          <div>${escapeHtml(requester?.name ?? '—')}</div>
          <div>${escapeHtml(requester?.email ?? '')}</div>
        </div>
        <div style="text-align:right;">
          <div>${escapeHtml(formatDateTime(selected.application.createdAt, language))}</div>
          ${
            selected.application.dueAt
              ? `<div>${escapeHtml(formatDateTime(selected.application.dueAt, language))}</div><div>${escapeHtml(
                  formatRemainingTime(selected.application.dueAt, language)
                )}</div>`
              : ''
          }
        </div>
      </div>
      <table>
        ${fieldRows
          .map(
            (row) =>
              `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`
          )
          .join('')}
      </table>
      <h2>${language === 'ka' ? 'დანართები' : 'Attachments'}</h2>
      <ul>${attachmentsHtml}</ul>
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

    try {
      const values: ApplicationFieldValue[] = selectedType.fields.map((field) => ({
        applicationId: 0,
        key: field.key,
        value: createValues[field.key] ?? ''
      }));

      const attachmentsPayload = selectedType.capabilities.allowsAttachments
        ? createAttachments
            .filter((attachment) => attachment.name.trim().length > 0)
            .map((attachment) => ({
              name: attachment.name,
              url: attachment.url || '#',
              uploadedBy: currentUser.id
            }))
        : [];

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

        for (const attachment of attachmentsPayload) {
          await addApplicationAttachment(selected.application.id, attachment, currentUser.id);
        }
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
              <span>{attachment.name}</span>
            </div>
            <span className="text-xs text-slate-400">{formatDateTime(attachment.createdAt, language)}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderAuditTrail = (bundle: ApplicationBundle) => {
    return (
      <ol className="space-y-3">
        {bundle.auditTrail
          .slice()
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
          .map((entry) => {
            const actor = entry.actorId ? userById.get(entry.actorId) : null;
            return (
              <li key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-700">
                    {entry.action}
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
      ? type.fields.filter((field) => !BUILTIN_FIELD_KEYS.has(field.key))
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
    if (!createOpen || !selectedType) {
      return null;
    }

    const Icon = TYPE_ICON_MAP[selectedType.icon] ?? FileText;

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
                const ActiveIcon = TYPE_ICON_MAP[type.icon] ?? FileText;
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
                      'flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-sky-500 bg-sky-50 shadow'
                        : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50'
                    )}
                  >
                    <ActiveIcon className={classNames('h-6 w-6', isActive ? 'text-sky-600' : 'text-slate-400')} />
                    <div>
                      <p className="font-semibold text-slate-700">{type.name[language]}</p>
                      <p className="text-sm text-slate-500">{type.description[language]}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <Icon className="h-8 w-8 text-sky-500" />
                <div>
                  <p className="text-lg font-semibold text-slate-800">{selectedType.name[language]}</p>
                  <p className="text-sm text-slate-500">{t.createModal.formTitle}</p>
                </div>
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
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                    <div className="space-y-2">
                      {createAttachments.map((attachment, index) => (
                        <div key={`attachment-${index}`} className="flex items-center gap-3">
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
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCreateAttachments([...createAttachments, { name: '', url: '' }])}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-sky-300 hover:text-sky-600"
                    >
                      <Paperclip className="h-4 w-4" />
                      {t.createModal.attachmentHelp}
                    </button>
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
    const Icon = type ? TYPE_ICON_MAP[type.icon] ?? FileText : FileText;
    const statusMeta = STATUS_META[selected.application.status];

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
        <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-6 w-6 text-sky-600" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{type?.name[language]}</p>
                <h2 className="text-2xl font-bold text-slate-800">{selected.application.number}</h2>
                <p className="text-xs text-slate-500">{formatDateTime(selected.application.createdAt, language)}</p>
              </div>
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-lg font-semibold text-slate-800">{t.modal.history}</h3>
                  {renderAuditTrail(selected)}
                </div>
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
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">{t.createModal.attachmentLabel}</label>
                          {editAttachments.map((attachment, index) => (
                            <div key={`edit-attachment-${index}`} className="flex items-center gap-3">
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
                              <button
                                type="button"
                                onClick={() => setEditAttachments(editAttachments.filter((_, idx) => idx !== index))}
                                className="rounded-lg border border-transparent p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditAttachments([...editAttachments, { name: '', url: '' }])}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 transition hover:border-sky-300 hover:text-sky-600"
                          >
                            <Paperclip className="h-4 w-4" />
                            {t.createModal.attachmentHelp}
                          </button>
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
          {(['all', 'pending', 'sent'] as const).map((tab) => {
            const count =
              tab === 'pending'
                ? pendingApplications.length
                : tab === 'sent'
                ? sentApplications.length
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
                const Icon = type ? TYPE_ICON_MAP[type.icon] ?? FileText : FileText;
                const requester = userById.get(bundle.application.requesterId);
                const statusMeta = STATUS_META[bundle.application.status];
                return (
                  <tr key={bundle.application.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{bundle.application.number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                          <Icon className="h-5 w-5 text-sky-600" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-700">{type?.name[language]}</p>
                          <p className="text-xs text-slate-500">{type?.description[language]}</p>
                        </div>
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
