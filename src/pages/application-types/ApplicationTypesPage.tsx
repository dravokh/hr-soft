import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { COPY } from './copy';
import {
  buildDefaultFormState,
  buildFields,
  buildFormStateFromType,
  coerceUsageCapabilities,
  syncSlaWithFlow,
  validateForm
} from './helpers';
import type { ApplicationType, FormState, Mode, SlaFormEntry } from './types';
import { ApplicationTypeEditor } from './components/ApplicationTypeEditor';
import { ApplicationTypeList } from './components/ApplicationTypeList';
import { NoPermissionCallout } from './components/NoPermissionCallout';

interface ApplicationTypesPageProps {
  language: 'ka' | 'en';
}

export const ApplicationTypesPage: React.FC<ApplicationTypesPageProps> = ({ language }) => {
  const {
    applicationTypes,
    roles,
    hasPermission,
    createApplicationType,
    updateApplicationType,
    deleteApplicationType
  } = useAppContext();

  const t = COPY[language];
  const canManage = hasPermission('manage_request_types');

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(applicationTypes[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>(applicationTypes.length ? 'view' : 'create');
  const [pendingSelectedId, setPendingSelectedId] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>(() =>
    applicationTypes[0] ? buildFormStateFromType(applicationTypes[0]) : buildDefaultFormState()
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allowedRolesOpen, setAllowedRolesOpen] = useState(false);
  const allowedRolesDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedRoles = useMemo(
    () => roles.filter((role) => formState.allowedRoleIds.includes(role.id)),
    [roles, formState.allowedRoleIds]
  );

  const selectedType = useMemo(() => {
    if (mode === 'create') {
      return null;
    }
    return applicationTypes.find((type) => type.id === selectedTypeId) ?? null;
  }, [applicationTypes, mode, selectedTypeId]);

  useEffect(() => {
    if (!applicationTypes.length) {
      setSelectedTypeId(null);
      setMode('create');
      setFormState(buildDefaultFormState());
      setPendingSelectedId(null);
      return;
    }

    if (mode === 'create') {
      return;
    }

    if (pendingSelectedId !== null) {
      const pendingType = applicationTypes.find((type) => type.id === pendingSelectedId);
      if (pendingType) {
        setSelectedTypeId(pendingType.id);
        setFormState(buildFormStateFromType(pendingType));
        setMode('view');
        setPendingSelectedId(null);
      }
      return;
    }

    if (selectedTypeId === null) {
      const first = applicationTypes[0];
      setSelectedTypeId(first.id);
      setMode('view');
      setFormState(buildFormStateFromType(first));
      return;
    }

    if (!applicationTypes.some((type) => type.id === selectedTypeId)) {
      const first = applicationTypes[0];
      setSelectedTypeId(first.id);
      setMode('view');
      setFormState(buildFormStateFromType(first));
    }
  }, [applicationTypes, mode, pendingSelectedId, selectedTypeId]);

  useEffect(() => {
    if (selectedType && mode === 'view') {
      setFormState(buildFormStateFromType(selectedType));
    }
  }, [selectedType, mode]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!allowedRolesOpen) {
        return;
      }
      if (
        allowedRolesDropdownRef.current &&
        event.target instanceof Node &&
        !allowedRolesDropdownRef.current.contains(event.target)
      ) {
        setAllowedRolesOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAllowedRolesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [allowedRolesOpen]);

  const startCreate = () => {
    setMode('create');
    setSelectedTypeId(null);
    setFormState(buildDefaultFormState());
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
    setPendingSelectedId(null);
  };

  const startEdit = () => {
    if (!selectedType) {
      return;
    }
    setMode('edit');
    setFormState(buildFormStateFromType(selectedType));
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
    setPendingSelectedId(null);
  };

  const cancelEditing = () => {
    if (!applicationTypes.length) {
      setMode('create');
      setFormState(buildDefaultFormState());
      setSelectedTypeId(null);
      setAllowedRolesOpen(false);
      setPendingSelectedId(null);
      return;
    }
    if (selectedType) {
      setFormState(buildFormStateFromType(selectedType));
    }
    setMode('view');
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
    setPendingSelectedId(null);
  };

  const handleSelectType = (id: number) => {
    const next = applicationTypes.find((type) => type.id === id);
    setSelectedTypeId(id);
    setMode('view');
    setStatusMessage(null);
    setErrorMessage(null);
    setAllowedRolesOpen(false);
    setPendingSelectedId(null);
    if (next) {
      setFormState(buildFormStateFromType(next));
    }
  };

  const handleFlowRoleChange = (index: number, roleId: number) => {
    setFormState((previous) => {
      const nextFlow = previous.flow.map((current, idx) => (idx === index ? roleId : current));
      return {
        ...previous,
        flow: nextFlow,
        sla: syncSlaWithFlow(nextFlow, previous.sla)
      };
    });
  };

  const handleAddFlowStep = () => {
    if (!roles.length) {
      return;
    }
    setFormState((previous) => {
      const nextFlow = [...previous.flow, roles[0].id];
      return {
        ...previous,
        flow: nextFlow,
        sla: syncSlaWithFlow(nextFlow, previous.sla)
      };
    });
  };

  const handleRemoveFlowStep = (index: number) => {
    setFormState((previous) => {
      const nextFlow = previous.flow.filter((_, idx) => idx !== index);
      const nextSla = syncSlaWithFlow(nextFlow, previous.sla).map((entry, idx) => ({ ...entry, stepIndex: idx }));
      return {
        ...previous,
        flow: nextFlow,
        sla: nextSla
      };
    });
  };

  const handleSlaChange = (index: number, updates: Partial<SlaFormEntry>) => {
    setFormState((previous) => {
      const nextSla = previous.sla.map((entry) =>
        entry.stepIndex === index ? { ...entry, ...updates } : entry
      );
      return {
        ...previous,
        sla: nextSla
      };
    });
  };

  const buildPayload = (existing?: ApplicationType): Omit<ApplicationType, 'id'> => {
    const nameKa = formState.nameKa.trim();
    const descriptionKa = formState.descriptionKa.trim();
    const fallbackIcon = existing?.icon ?? 'FileText';
    const fallbackColor = existing?.color ?? 'bg-slate-500';
    const capabilitySnapshot: ApplicationType['capabilities'] = coerceUsageCapabilities({
      ...formState.capabilities,
      attachmentMaxSizeMb: Math.max(
        1,
        formState.capabilities.attachmentMaxSizeMb || existing?.capabilities.attachmentMaxSizeMb || 50
      )
    });

    return {
      name: {
        ka: nameKa,
        en: existing?.name.en?.trim().length ? existing.name.en : nameKa
      },
      description: {
        ka: descriptionKa,
        en: existing?.description.en?.trim().length ? existing.description.en : descriptionKa
      },
      icon: fallbackIcon,
      color: fallbackColor,
      fields: buildFields(formState, existing),
      flow: formState.flow.filter((roleId, index, array) => roleId && array.indexOf(roleId) === index),
      slaPerStep: formState.sla.map((entry) => ({
        stepIndex: entry.stepIndex,
        seconds: Math.max(1, entry.hours) * 3600,
        onExpire: entry.onExpire
      })),
      capabilities: capabilitySnapshot,
      allowedRoleIds: Array.from(new Set(formState.allowedRoleIds.filter(Boolean)))
    };
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    if (!validateForm(formState)) {
      setErrorMessage(t.validationError);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'create') {
        const created = await createApplicationType(buildPayload());
        setStatusMessage(t.successCreated);
        setMode('view');
        setPendingSelectedId(created.id);
        setSelectedTypeId(created.id);
        setAllowedRolesOpen(false);
        setFormState(buildFormStateFromType(created));
      } else if (selectedType) {
        const updated = await updateApplicationType({ id: selectedType.id, ...buildPayload(selectedType) });
        if (updated) {
          setFormState(buildFormStateFromType(updated));
        }
        setStatusMessage(t.successUpdated);
        setMode('view');
        setAllowedRolesOpen(false);
        setPendingSelectedId(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('ქმედება ვერ შესრულდა, სცადეთ ხელახლა.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) {
      return;
    }
    const confirmMessage = language === 'ka' ? 'დარწმუნებული ხართ, რომ გსურთ ტიპის წაშლა?' : 'Are you sure you want to delete this type?';
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const deleted = await deleteApplicationType(selectedType.id);
      if (deleted) {
        setStatusMessage(t.successDeleted);
        setMode(applicationTypes.length > 1 ? 'view' : 'create');
        const nextSelected = applicationTypes.find((type) => type.id !== selectedType.id);
        setSelectedTypeId(nextSelected?.id ?? null);
        setFormState(nextSelected ? buildFormStateFromType(nextSelected) : buildDefaultFormState());
        setAllowedRolesOpen(false);
        setPendingSelectedId(null);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('ტიპის წაშლა ვერ მოხერხდა.');
    }
  };

  if (!canManage) {
    return <NoPermissionCallout copy={t} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
          <p className="mt-2 text-slate-600">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          {t.create}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <ApplicationTypeList
          items={applicationTypes}
          selectedId={selectedTypeId}
          mode={mode}
          onSelect={handleSelectType}
          copy={t}
        />
        <ApplicationTypeEditor
          language={language}
          copy={t}
          formState={formState}
          onFormChange={setFormState}
          mode={mode}
          selectedType={selectedType}
          roles={roles}
          selectedRoles={selectedRoles}
          allowedRolesOpen={allowedRolesOpen}
          allowedRolesDropdownRef={allowedRolesDropdownRef}
          onToggleAllowedRoles={() => setAllowedRolesOpen((previous) => !previous)}
          onClearAllowedRoles={() => setFormState((prev) => ({ ...prev, allowedRoleIds: [] }))}
          onFlowRoleChange={handleFlowRoleChange}
          onAddFlowStep={handleAddFlowStep}
          onRemoveFlowStep={handleRemoveFlowStep}
          onSlaChange={handleSlaChange}
          onSave={handleSave}
          onCancel={cancelEditing}
          onStartEdit={startEdit}
          onDelete={handleDelete}
          isSaving={isSaving}
          errorMessage={errorMessage}
          statusMessage={statusMessage}
        />
      </div>
    </div>
  );
};
