import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, PencilLine, Trash2, ShieldCheck, Users as UsersIcon, BadgeCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PERMISSION_LABELS } from '../constants/permissions';
import { Role } from '../types';

interface RolesPageProps {
  language: 'ka' | 'en';
}

interface RoleFormState {
  name: string;
  description: string;
  permissions: string[];
}

type Mode = 'view' | 'edit' | 'create';

const COPY: Record<RolesPageProps['language'], {
  title: string;
  subtitle: string;
  newRole: string;
  viewTitle: string;
  editTitle: string;
  createTitle: string;
  nameLabel: string;
  descriptionLabel: string;
  permissionsLabel: string;
  selectAll: string;
  save: string;
  saving: string;
  cancel: string;
  edit: string;
  delete: string;
  confirmCreate: string;
  confirmUpdate: string;
  confirmDelete: string;
  required: string;
  duplicate: string;
  deleteSystem: string;
  deleteAssigned: string;
  created: string;
  updated: string;
  deleted: string;
  noPermissions: string;
  adminNotice: string;
  noAccess: string;
  permissionHint: string;
  membersLabel: (count: number) => string;
  permissionCount: (count: number) => string;
  systemBadge: string;
  customBadge: string;
  selectRoleLabel: string;
  selectRolePlaceholder: string;
  noRoleSelected: string;
}> = {
  ka: {
    title: 'როლების მართვა',
    subtitle: 'დაამატეთ ახალი როლები, განსაზღვრეთ მათი პასუხისმგებლობები და მინიჭებული უფლებები.',
    newRole: 'ახალი როლი',
    viewTitle: 'როლის დეტალები',
    editTitle: 'როლის რედაქტირება',
    createTitle: 'ახალი როლის შექმნა',
    nameLabel: 'დასახელება',
    descriptionLabel: 'აღწერა',
    permissionsLabel: 'როლისთვის მინიჭებული უფლებები',
    selectAll: 'ყველა უფლება',
    save: 'შენახვა',
    saving: 'ინახება…',
    cancel: 'გაუქმება',
    edit: 'რედაქტირება',
    delete: 'როლის წაშლა',
    confirmCreate: 'შექმნა',
    confirmUpdate: 'განახლება',
    confirmDelete: 'წაშლა',
    required: 'გთხოვთ, შეავსოთ ყველა ველი და აირჩიოთ მინიმუმ ერთი უფლება.',
    duplicate: 'ამ სახელით როლი უკვე არსებობს.',
    deleteSystem: 'ადმინისტრატორის როლის წაშლა შეუძლებელია.',
    deleteAssigned: 'წაშლა ვერ ხერხდება, რადგან როლზე მინიჭებულია მომხმარებლები.',
    created: 'ახალი როლი წარმატებით დაემატა.',
    updated: 'როლი წარმატებით განახლდა.',
    deleted: 'როლი წაიშალა.',
    noPermissions: 'ამ როლს ჯერ არ აქვს მინიჭებული უფლებები.',
    adminNotice: 'ადმინისტრატორის როლის უფლებები ავტომატურად სრულად აქტიურია.',
    noAccess: 'თქვენ არ გაქვთ როლების მართვის უფლება.',
    permissionHint: 'აირჩიეთ უფლებები კატეგორიების მიხედვით ან გამოიყენეთ „ყველა უფლება“ სწრაფი მონიშვნისთვის.',
    membersLabel: (count: number) => {
      if (count === 0) return '0 მომხმარებელი';
      if (count === 1) return '1 მომხმარებელი';
      return `${count} მომხმარებელი`;
    },
    permissionCount: (count: number) => {
      if (count === 1) return '1 უფლება';
      return `${count} უფლება`;
    },
    systemBadge: 'სისტემური',
    customBadge: 'მორგებული',
    selectRoleLabel: 'აირჩიეთ როლი',
    selectRolePlaceholder: 'აირჩიეთ როლი სიიდან…',
    noRoleSelected: 'აირჩიეთ როლი ჩამოსაშლელიდან ან შექმენით ახალი.'
  },
  en: {
    title: 'Role management',
    subtitle: 'Create tailored roles, refine their responsibilities, and assign permissions.',
    newRole: 'New role',
    viewTitle: 'Role overview',
    editTitle: 'Edit role',
    createTitle: 'Create a new role',
    nameLabel: 'Role name',
    descriptionLabel: 'Description',
    permissionsLabel: 'Permissions for this role',
    selectAll: 'Select all permissions',
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete role',
    confirmCreate: 'Create role',
    confirmUpdate: 'Update role',
    confirmDelete: 'Delete role',
    required: 'Please fill out every field and choose at least one permission.',
    duplicate: 'A role with this name already exists.',
    deleteSystem: 'The administrator role cannot be deleted.',
    deleteAssigned: 'This role cannot be removed while users are assigned to it.',
    created: 'Role created successfully.',
    updated: 'Role updated successfully.',
    deleted: 'Role deleted.',
    noPermissions: 'No permissions are currently assigned to this role.',
    adminNotice: 'Administrator permissions are always fully enabled.',
    noAccess: 'You do not have permission to manage roles.',
    permissionHint: 'Choose permissions by category or use “Select all permissions” for a quick assignment.',
    membersLabel: (count: number) => {
      if (count === 0) return '0 members';
      if (count === 1) return '1 member';
      return `${count} members`;
    },
    permissionCount: (count: number) => {
      if (count === 1) return '1 permission';
      return `${count} permissions`;
    },
    systemBadge: 'System',
    customBadge: 'Custom',
    selectRoleLabel: 'Choose a role',
    selectRolePlaceholder: 'Select a role…',
    noRoleSelected: 'Pick a role from the dropdown or create a new one.'
  }
};

const getAssignmentLabel = (language: RolesPageProps['language'], count: number) => {
  if (language === 'ka') {
    if (count === 0) return 'მომხმარებელი არ არის მიბმული';
    if (count === 1) return '1 მომხმარებელი მიბმულია';
    return `${count} მომხმარებელი მიბმულია`;
  }

  if (count === 0) return 'No users assigned';
  if (count === 1) return '1 user assigned';
  return `${count} users assigned`;
};

const groupPermissionsByCategory = () => {
  return ALL_PERMISSIONS.reduce<Record<string, string[]>>((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission.id);
    return acc;
  }, {});
};

export const RolesPage: React.FC<RolesPageProps> = ({ language }) => {
  const { roles, users, saveRoles, hasPermission } = useAppContext();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>(roles.length ? 'view' : 'create');
  const [formState, setFormState] = useState<RoleFormState>({ name: '', description: '', permissions: [] });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const t = COPY[language];
  const groupedPermissions = useMemo(groupPermissionsByCategory, []);
  const canCreate = hasPermission('create_roles');
  const canEdit = hasPermission('edit_roles');
  const canDelete = hasPermission('delete_roles');

  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId(null);
      if (mode !== 'create') {
        setMode('create');
      }
      return;
    }

    if (mode === 'create') {
      return;
    }

    if (selectedRoleId === null || !roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
      setMode('view');
    }
  }, [mode, roles, selectedRoleId]);

  const selectedRole = useMemo(() => {
    return roles.find((role) => role.id === selectedRoleId) ?? null;
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (mode === 'create') {
      setFormState({ name: '', description: '', permissions: [] });
      return;
    }

    if (selectedRole && mode !== 'edit') {
      setFormState({
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions
      });
    }
  }, [mode, selectedRole]);

  const startCreate = () => {
    if (!canCreate) {
      setErrorMessage(t.noAccess);
      setStatusMessage(null);
      return;
    }
    setSelectedRoleId(null);
    setFormState({ name: '', description: '', permissions: [] });
    setMode('create');
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const startEdit = (roleOverride?: Role | null) => {
    const target = roleOverride ?? selectedRole;
    if (!target) {
      return;
    }
    if (!canEdit) {
      setErrorMessage(t.noAccess);
      setStatusMessage(null);
      return;
    }
    setSelectedRoleId(target.id);
    setFormState({
      name: target.name,
      description: target.description,
      permissions: target.permissions
    });
    setMode('edit');
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const cancelEditing = () => {
    if (roles.length === 0) {
      setMode('create');
      return;
    }
    setMode('view');
    setErrorMessage(null);
    setStatusMessage(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormState((previous) => {
      const permissions = previous.permissions.includes(permissionId)
        ? previous.permissions.filter((item) => item !== permissionId)
        : [...previous.permissions, permissionId];
      return { ...previous, permissions };
    });
  };

  const toggleAll = () => {
    setFormState((previous) => {
      if (previous.permissions.length === ALL_PERMISSIONS.length) {
        return { ...previous, permissions: [] };
      }
      return { ...previous, permissions: ALL_PERMISSIONS.map((permission) => permission.id) };
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const name = formState.name.trim();
    const description = formState.description.trim();
    const permissions = Array.from(new Set(formState.permissions));

    if (!name || !description || permissions.length === 0) {
      setErrorMessage(t.required);
      return;
    }

    const normalizedName = name.toLowerCase();
    const roleWithSameName = roles.find((role) => role.name.toLowerCase() === normalizedName);

    if (mode === 'create') {
      if (!canCreate) {
        setErrorMessage(t.noAccess);
        return;
      }

      if (roleWithSameName) {
        setErrorMessage(t.duplicate);
        return;
      }

      const nextId = roles.reduce((max, role) => Math.max(max, role.id), 0) + 1;
      const newRole: Role = { id: nextId, name, description, permissions };

      setIsSaving(true);
      try {
        await saveRoles([...roles, newRole]);
        setStatusMessage(t.created);
        setSelectedRoleId(newRole.id);
        setMode('view');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!selectedRole) {
      return;
    }

    if (!canEdit) {
      setErrorMessage(t.noAccess);
      return;
    }

    if (roleWithSameName && roleWithSameName.id !== selectedRole.id) {
      setErrorMessage(t.duplicate);
      return;
    }

    const updatedRole: Role = { ...selectedRole, name, description, permissions };

    setIsSaving(true);
    try {
      await saveRoles(roles.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
      setStatusMessage(t.updated);
      setMode('view');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (roleOverride?: Role | null) => {
    const target = roleOverride ?? selectedRole;
    if (!target) {
      return;
    }
    if (!canDelete) {
      setErrorMessage(t.noAccess);
      setStatusMessage(null);
      return;
    }
    if (target.id === 1) {
      setErrorMessage(t.deleteSystem);
      setStatusMessage(null);
      return;
    }

    const assignedUsers = users.filter((user) => user.roleId === target.id);
    if (assignedUsers.length > 0) {
      setErrorMessage(t.deleteAssigned);
      setStatusMessage(null);
      return;
    }

    setIsSaving(true);
    try {
      await saveRoles(roles.filter((role) => role.id !== target.id));
      setStatusMessage(t.deleted);
      setErrorMessage(null);
      const remaining = roles.filter((role) => role.id !== target.id);
      setSelectedRoleId(remaining[0]?.id ?? null);
      setMode(remaining.length ? 'view' : 'create');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPermissionList = (permissions: string[]) => {
    if (permissions.length === 0) {
      return <p className="text-sm text-slate-500">{t.noPermissions}</p>;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {permissions.map((permissionId) => (
          <span
            key={permissionId}
            className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full"
          >
            {PERMISSION_LABELS[permissionId][language]}
          </span>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    const isCreate = mode === 'create';
    const submitLabel = isCreate ? t.confirmCreate : t.confirmUpdate;
    const disabled = (isCreate && !canCreate) || (!isCreate && !canEdit);
    const editingAdmin = !isCreate && selectedRole?.id === 1;
    const permissionControlsDisabled = disabled || editingAdmin;

    return (
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="name">
              {t.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              disabled={disabled}
              className={`rounded-lg border px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                disabled ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200'
              }`}
              placeholder={language === 'ka' ? 'მაგ: გაყიდვების მენეჯერი' : 'e.g. Sales manager'}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="description">
              {t.descriptionLabel}
            </label>
            <textarea
              id="description"
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              disabled={disabled}
              className={`rounded-lg border px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] ${
                disabled ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200'
              }`}
              placeholder={language === 'ka' ? 'მოკლედ აღწერეთ როლი' : 'Describe the purpose of this role'}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">{t.permissionsLabel}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.permissionHint}</p>
            </div>
            <button
              type="button"
              onClick={toggleAll}
              disabled={permissionControlsDisabled}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400"
            >
              {t.selectAll}
            </button>
          </div>

          {editingAdmin && (
            <div className="p-3 border border-blue-100 rounded-lg bg-blue-50 text-xs text-blue-700">
              <ShieldCheck className="w-4 h-4 inline mr-2" />
              {t.adminNotice}
            </div>
          )}

          <div className="space-y-5 max-h-[340px] overflow-y-auto pr-2">
            {Object.entries(groupedPermissions).map(([category, permissionIds]) => (
              <div key={category} className="border border-slate-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">
                  {PERMISSION_CATEGORY_LABELS[category][language]}
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {permissionIds.map((permissionId) => {
                    const checked = formState.permissions.includes(permissionId);
                    return (
                      <label key={permissionId} className="flex items-start gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(permissionId)}
                          disabled={permissionControlsDisabled}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{PERMISSION_LABELS[permissionId][language]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
        {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={cancelEditing}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={disabled || isSaving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t.saving : submitLabel}
          </button>
        </div>
      </form>
    );
  };

  const renderView = () => {
    if (!selectedRole) {
      return (
        <div className="text-center py-16 text-slate-500">
          {language === 'ka' ? 'აირჩიეთ როლი მარცხენა სიიდან ან შექმენით ახალი.' : 'Select a role from the list or create a new one.'}
        </div>
      );
    }

    const assignments = users.filter((user) => user.roleId === selectedRole.id);

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{selectedRole.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{selectedRole.description}</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              <UsersIcon className="w-4 h-4" />
              {getAssignmentLabel(language, assignments.length)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={() => startEdit(selectedRole)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <PencilLine className="w-4 h-4" />
                {t.edit}
              </button>
            )}
            {canDelete && selectedRole.id !== 1 && (
              <button
                type="button"
                onClick={() => void handleDelete(selectedRole)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-sm font-semibold text-rose-600 hover:bg-rose-100"
              >
                <Trash2 className="w-4 h-4" />
                {t.delete}
              </button>
            )}
          </div>
        </div>

        {selectedRole.id === 1 && (
          <div className="p-4 border border-blue-100 rounded-xl bg-blue-50 text-xs text-blue-700">
            <ShieldCheck className="w-4 h-4 inline mr-2" />
            {t.adminNotice}
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-700">{t.permissionsLabel}</h3>
          {renderPermissionList(selectedRole.permissions)}
        </div>

        {errorMessage && <p className="text-sm text-rose-500">{errorMessage}</p>}
        {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
      </div>
    );
  };

  if (!hasPermission('view_roles')) {
    return (
      <div className="text-center py-20 text-slate-500">
        {t.noAccess}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-slate-600 mt-2">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
        >
          <PlusCircle className="w-4 h-4" />
          {t.newRole}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t.selectRoleLabel}</label>
            <select
              value={selectedRoleId ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setErrorMessage(null);
                setStatusMessage(null);
                if (!value) {
                  setSelectedRoleId(null);
                  if (mode !== 'create') {
                    setMode('view');
                  }
                  return;
                }
                setSelectedRoleId(Number(value));
                setMode('view');
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.selectRolePlaceholder}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {mode !== 'create' && !selectedRole && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              {t.noRoleSelected}
            </div>
          )}
          {selectedRole && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">{selectedRole.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{selectedRole.description}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedRole.id === 1 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {selectedRole.id === 1 ? t.systemBadge : t.customBadge}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div>{t.membersLabel(users.filter((user) => user.roleId === selectedRole.id).length)}</div>
                <div>{t.permissionCount(selectedRole.permissions.length)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {mode === 'view' && renderView()}
          {(mode === 'edit' || mode === 'create') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800">
                    {mode === 'create' ? t.createTitle : t.editTitle}
                  </h2>
                  {mode === 'create' && !canCreate && (
                    <p className="text-xs text-rose-500 mt-2">{t.noAccess}</p>
                  )}
                  {mode === 'edit' && !canEdit && (
                    <p className="text-xs text-rose-500 mt-2">{t.noAccess}</p>
                  )}
                </div>
              </div>

              {renderForm()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
