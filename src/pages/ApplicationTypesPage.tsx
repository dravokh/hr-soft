import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ApplicationBundle, ApplicationFieldValue } from '../types';

// Import modular components
import {
  ApplicationTabs,
  ApplicationFiltersComponent,
  ApplicationsTable,
  CreateApplicationModal,
  ApplicationDetailModal
} from './ApplicationsPage/components';

// Import custom hooks
import { useApplicationData, useApplicationFilters } from './ApplicationsPage/hooks';

// Import types
import {
  ApplicationsPageProps,
  AttachmentDraft,
  ApplicationFilters,
  createEmptyFilters
} from './ApplicationsPage/types';

// Import constants
import { COPY } from './ApplicationsPage/constants';

// Import utilities
import { readFileAsDataUrl, splitRange } from './ApplicationsPage/utils';
import { validateExtraBonusInput } from '../utils/extraBonus';

const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ language }) => {
  // Context
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

  // State management
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

  // Refs
  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // Translation copy
  const t = COPY[language];

  // Memoized data
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

  // Use custom hooks
  const {
    accessibleApplications,
    pendingApplications,
    sentApplications,
    returnedApplications
  } = useApplicationData({
    applications,
    currentUser,
    typeById
  });

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

  // Determine source based on active tab
  const sourceApplications = useMemo(() => {
    switch (activeTab) {
      case 'pending':
        return pendingApplications;
      case 'sent':
        return sentApplications;
      case 'returned':
        return returnedApplications;
      default:
        return accessibleApplications;
    }
  }, [activeTab, pendingApplications, sentApplications, returnedApplications, accessibleApplications]);

  // Use filter hook
  const { filteredApplications } = useApplicationFilters({
    applications: sourceApplications,
    filters,
    language,
    typeById,
    userById
  });

  const selectedType = selectedTypeId ? typeById.get(selectedTypeId) : undefined;

  // Effects
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

  // Event handlers
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

    if (selectedType.capabilities.usesExtraBonusTracker) {
      const extraValidation = validateExtraBonusInput(selectedType, currentUser ?? undefined, createValues);
      if (extraValidation) {
        setCreateError(t.createModal.extraValidation);
        setIsSubmitting(false);
        return;
      }
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

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/50 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t.title}</h1>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{t.subtitle}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                resetCreateState();
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:from-sky-600 hover:via-sky-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-2"
            >
              <PlusCircle className="h-4 w-4" />
              {t.create}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 space-y-4">
            {/* Tabs */}
            <ApplicationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={{
                all: accessibleApplications.length,
                pending: pendingApplications.length,
                sent: sentApplications.length,
                returned: returnedApplications.length
              }}
              language={language}
            />

            {/* Filters */}
            <ApplicationFiltersComponent
              filterDraft={filterDraft}
              onFilterDraftChange={setFilterDraft}
              onSubmit={handleFiltersSubmit}
              onClear={handleClearFilters}
              onLastThirtyDays={handleLastThirtyDays}
              creatorOptions={creatorOptions}
              language={language}
            />
          </div>

          {/* Table */}
          <ApplicationsTable
            applications={filteredApplications}
            onViewDetails={openDetails}
            typeById={typeById}
            userById={userById}
            language={language}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateApplicationModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateState();
        }}
        selectedTypeId={selectedTypeId}
        onTypeIdChange={setSelectedTypeId}
        availableTypes={availableTypes}
        selectedType={selectedType}
        values={createValues}
        onValuesChange={setCreateValues}
        comment={createComment}
        onCommentChange={setCreateComment}
        attachments={createAttachments}
        onAttachmentsChange={setCreateAttachments}
        fileInputRef={createFileInputRef}
        onFileUpload={handleCreateFileUpload}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        error={createError}
        onErrorChange={setCreateError}
        success={createSuccess}
        onSuccessChange={setCreateSuccess}
        language={language}
        requester={currentUser}
      />

      {selected && (
        <ApplicationDetailModal
          selected={selected}
          onClose={closeDetails}
          isEditing={isEditing}
          onStartEditing={() => setIsEditing(true)}
          onCancelEditing={() => setIsEditing(false)}
          editValues={editValues}
          setEditValues={setEditValues}
          editComment={editComment}
          setEditComment={setEditComment}
          editAttachments={editAttachments}
          setEditAttachments={setEditAttachments}
          editFileInputRef={editFileInputRef}
          onEditFileUpload={handleEditFileUpload}
          rejectComment={rejectComment}
          setRejectComment={setRejectComment}
          actionMessage={actionMessage}
          actionError={actionError}
          onApprove={handleApprove}
          onReject={handleReject}
          onResend={handleResend}
          onCloseRequest={handleCloseRequest}
          onPrint={() => {}}
          typeById={typeById}
          userById={userById}
          roleById={roleById}
          canApproveSelected={canApprove && selected.application.status === 'PENDING'}
          canEditSelected={selected.application.requesterId === currentUser?.id && (selected.application.status === 'REJECTED' || selected.application.currentStepIndex < 0)}
          language={language}
        />
      )}
    </div>
  );
};

export { ApplicationsPage };
