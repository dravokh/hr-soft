import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Filter, Lock, RefreshCcw, Save, ShieldCheck, Slash, Users as UsersIcon } from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import { ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PERMISSION_LABELS } from '../constants/permissions';
import type { Role } from '../types';

interface PermissionsPageProps {
  language: 'ka' | 'en';
}

type LangCopy = {
  title: string;
  subtitle: string;
  heroTitle: (roleName: string) => string;
  heroSubtitle: string;
  adminBadge: string;
  customBadge: string;
  memberCount: (count: number) => string;
  permissionCount: (count: number) => string;
  categoryTitle: string;
  categoryDescription: string;
  save: string;
  saving: string;
  reset: string;
  saved: string;
  noAccess: string;
  adminLocked: string;
  helper: string;
  idLabel: string;
  selectRoleLabel: string;
  selectRolePlaceholder: string;
  noRoleSelected: string;
  selectAll: string;
  clearAll: string;
  selectCategory: string;
  clearCategory: string;
  searchLabel: string;
  searchPlaceholder: string;
  noMatches: string;
  unsaved: (count: number) => string;
  readOnly: string;
};

const englishCopy: LangCopy = {
  title: 'Permissions matrix',
  subtitle: 'Review and adjust which capabilities each role owns.',
  heroTitle: (roleName: string) => `Permissions for ${roleName}`,
  heroSubtitle: 'Toggle capabilities for the selected role and apply changes when ready.',
  adminBadge: 'System role',
  customBadge: 'Custom role',
  memberCount: (count: number) => {
    if (count === 0) return 'No members assigned';
    if (count === 1) return '1 member assigned';
    return `${count} members assigned`;
  },
  permissionCount: (count: number) => {
    if (count === 1) return '1 permission enabled';
    return `${count} permissions enabled`;
  },
  categoryTitle: 'Permission categories',
  categoryDescription: 'Select or clear individual permissions, or use the quick actions per category.',
  save: 'Save changes',
  saving: 'Saving...',
  reset: 'Reset',
  saved: 'Permissions updated successfully.',
  noAccess: 'You can review permissions but cannot make changes.',
  adminLocked: 'The administrator role is protected and always retains every permission.',
  helper: 'Pick a role, then enable or disable permissions below.',
  idLabel: 'ID',
  selectRoleLabel: 'Choose a role',
  selectRolePlaceholder: 'Select a role...',
  noRoleSelected: 'Pick a role from the dropdown to review or edit its permissions.',
  selectAll: 'Select all',
  clearAll: 'Clear all',
  selectCategory: 'Select category',
  clearCategory: 'Clear category',
  searchLabel: 'Filter permissions',
  searchPlaceholder: 'Search by name or id...',
  noMatches: 'No permissions match your filter.',
  unsaved: (count: number) => (count ? `${count} change${count === 1 ? '' : 's'} not saved` : 'No changes'),
  readOnly: 'Read-only mode'
};

const COPY: Record<PermissionsPageProps['language'], LangCopy> = {
  en: englishCopy,
  ka: englishCopy // Using English copy for now to avoid broken characters.
};

const groupByCategory = () => {
  return ALL_PERMISSIONS.reduce<Record<string, string[]>>((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission.id);
    return acc;
  }, {});
};

export const PermissionsPage: React.FC<PermissionsPageProps> = ({ language }) => {
  const { roles, users, saveRoles, hasPermission } = useAppContext();
  const [localRoles, setLocalRoles] = useState<Role[]>(roles);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roles[0]?.id ?? null);
  const [filter, setFilter] = useState('');

  const t = COPY[language];
  const canManage = hasPermission('manage_permissions');
  const groupedPermissions = useMemo(groupByCategory, []);

  useEffect(() => {
    setLocalRoles(roles);
    if (!roles.length) {
      setSelectedRoleId(null);
      return;
    }
    if (selectedRoleId === null || !roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const selectedRole = useMemo(() => {
    if (selectedRoleId === null) {
      return null;
    }
    return localRoles.find((role) => role.id === selectedRoleId) ?? null;
  }, [localRoles, selectedRoleId]);

  const originalRolesById = useMemo(() => new Map(roles.map((role) => [role.id, role])), [roles]);

  const dirtyCount = useMemo(() => {
    return localRoles.reduce((acc, role) => {
      const original = originalRolesById.get(role.id);
      if (!original) return acc + 1;
      const next = new Set(role.permissions);
      const prev = new Set(original.permissions);
      if (next.size !== prev.size) return acc + 1;
      for (const id of next) {
        if (!prev.has(id)) return acc + 1;
      }
      return acc;
    }, 0);
  }, [localRoles, originalRolesById]);

  const updateRolePermissions = (roleId: number, permissionId: string) => {
    setLocalRoles((previous) =>
      previous.map((role) => {
        if (role.id !== roleId) {
          return role;
        }
        const hasPermissionAlready = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermissionAlready
            ? role.permissions.filter((candidate) => candidate !== permissionId)
            : [...role.permissions, permissionId]
        };
      })
    );
  };

  const setRolePermissions = (roleId: number, permissionIds: string[]) => {
    const unique = Array.from(new Set(permissionIds));
    setLocalRoles((previous) =>
      previous.map((role) => (role.id === roleId ? { ...role, permissions: unique } : role))
    );
  };

  const handlePermissionToggle = (role: Role, permissionId: string) => {
    if (!canManage || role.id === 1) {
      return;
    }
    setStatusMessage(null);
    updateRolePermissions(role.id, permissionId);
  };

  const handleCategoryBulk = (role: Role, category: string, mode: 'select' | 'clear') => {
    if (!canManage || role.id === 1) return;
    const categoryIds = groupedPermissions[category] ?? [];
    const current = new Set(role.permissions);
    if (mode === 'select') {
      categoryIds.forEach((id) => current.add(id));
    } else {
      categoryIds.forEach((id) => current.delete(id));
    }
    setRolePermissions(role.id, Array.from(current));
  };

  const handleAllBulk = (role: Role, mode: 'select' | 'clear') => {
    if (!canManage || role.id === 1) return;
    if (mode === 'select') {
      setRolePermissions(
        role.id,
        ALL_PERMISSIONS.map((permission) => permission.id)
      );
      return;
    }
    setRolePermissions(role.id, []);
  };

  const handleReset = () => {
    setLocalRoles(roles);
    setStatusMessage(null);
  };

  const handleSave = async () => {
    if (!canManage) {
      return;
    }
    setIsSaving(true);
    try {
      await saveRoles(localRoles);
      setStatusMessage(t.saved);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
          <p className="text-slate-600 mt-2">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-100 rounded-lg">
            {t.unsaved(dirtyCount)}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCcw className="w-4 h-4" />
            {t.reset}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canManage || isSaving || !selectedRole}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t.saving : t.save}
          </button>
        </div>
      </div>

      {!canManage && (
        <div className="border border-amber-200 bg-amber-50 text-amber-700 text-sm rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">{t.readOnly}</p>
            <p className="mt-1">{t.noAccess}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:w-72">
            <label className="text-sm font-semibold text-slate-700">{t.selectRoleLabel}</label>
            <select
              value={selectedRoleId ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                setStatusMessage(null);
                if (!value) {
                  setSelectedRoleId(null);
                  return;
                }
                setSelectedRoleId(Number(value));
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.selectRolePlaceholder}</option>
              {localRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">{t.helper}</p>
          </div>
          {selectedRole && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!canManage || selectedRole.id === 1}
                onClick={() => handleAllBulk(selectedRole, 'select')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4" />
                {t.selectAll}
              </button>
              <button
                type="button"
                disabled={!canManage || selectedRole.id === 1}
                onClick={() => handleAllBulk(selectedRole, 'clear')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <Slash className="w-4 h-4" />
                {t.clearAll}
              </button>
            </div>
          )}
        </div>

        {!selectedRole && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            {t.noRoleSelected}
          </div>
        )}

        {selectedRole && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 text-white p-7 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                    {t.heroSubtitle}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">{t.heroTitle(selectedRole.name)}</h2>
                  <p className="mt-2 text-sm text-white/80 max-w-2xl">{selectedRole.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                    <UsersIcon className="w-4 h-4" />
                    {t.memberCount(users.filter((user) => user.roleId === selectedRole.id).length)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    {t.permissionCount(selectedRole.permissions.length)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-600">
                    {selectedRole.id === 1 ? t.adminBadge : t.customBadge}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{t.categoryTitle}</h3>
                  <p className="text-sm text-slate-500">{t.categoryDescription}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-slate-600">{t.searchLabel}</label>
                    <input
                      type="text"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissionIds]) => {
                  const categoryLabel = PERMISSION_CATEGORY_LABELS[category][language];
                  const filteredIds = permissionIds.filter((permissionId) => {
                    if (!filter.trim()) return true;
                    const needle = filter.trim().toLowerCase();
                    return (
                      PERMISSION_LABELS[permissionId][language].toLowerCase().includes(needle) ||
                      permissionId.toLowerCase().includes(needle)
                    );
                  });
                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                            {categoryLabel}
                          </h4>
                          <span className="text-xs font-medium text-slate-400">
                            {t.permissionCount(
                              permissionIds.filter((permissionId) =>
                                selectedRole.permissions.includes(permissionId)
                              ).length
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!canManage || selectedRole.id === 1}
                            onClick={() => handleCategoryBulk(selectedRole, category, 'select')}
                            className="text-[11px] font-semibold text-blue-600 disabled:text-slate-400"
                          >
                            {t.selectCategory}
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            type="button"
                            disabled={!canManage || selectedRole.id === 1}
                            onClick={() => handleCategoryBulk(selectedRole, category, 'clear')}
                            className="text-[11px] font-semibold text-slate-500 disabled:text-slate-400"
                          >
                            {t.clearCategory}
                          </button>
                        </div>
                      </div>
                      {filteredIds.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                          {t.noMatches}
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {filteredIds.map((permissionId) => {
                            const active = selectedRole.permissions.includes(permissionId);
                            const locked = selectedRole.id === 1;
                            const interactive = canManage && !locked;
                            return (
                              <button
                                key={permissionId}
                                type="button"
                                onClick={() => handlePermissionToggle(selectedRole, permissionId)}
                                disabled={!interactive}
                                className={`rounded-2xl border p-4 text-left transition shadow-sm ${
                                  active
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                                } ${
                                  !interactive ? 'cursor-not-allowed opacity-60' : 'hover:shadow-md'
                                } ${locked ? 'bg-slate-100 text-slate-500 border-slate-200' : ''}`}
                              >
                                <p className="text-sm font-semibold">
                                  {PERMISSION_LABELS[permissionId][language]}
                                </p>
                                <p className="mt-2 text-[11px] uppercase tracking-wide text-blue-700/70">
                                  {t.idLabel}: {permissionId}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">{t.adminLocked}</p>

      {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
    </div>
  );
};
