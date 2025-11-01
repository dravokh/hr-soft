import React, { useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCcw, Save, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PERMISSION_LABELS } from '../constants/permissions';
import { Role } from '../types';

interface PermissionsPageProps {
  language: 'ka' | 'en';
}

const COPY: Record<PermissionsPageProps['language'], {
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
}> = {
  ka: {
    title: 'უფლებების მატრიცა',
    subtitle: 'ნახეთ თითოეული როლი და მათთვის მინიჭებული უფლებები. საჭიროებისამებრ შეცვალეთ.',
    heroTitle: (roleName: string) => `${roleName} როლის უფლებები`,
    heroSubtitle: 'გადაამოწმეთ რომ შესაბამისი მომხმარებლები ფლობენ სწორ უფლებებს და საჭიროების შემთხვევაში ჩართეთ ან გამორთეთ.',
    adminBadge: 'სისტემური როლი',
    customBadge: 'მორგებული როლი',
    memberCount: (count: number) => {
      if (count === 0) return 'მომხმარებლები არ არიან მიბმული';
      if (count === 1) return '1 მომხმარებელი მიბმულია';
      return `${count} მომხმარებელი მიბმულია`;
    },
    permissionCount: (count: number) => {
      if (count === 1) return '1 უფლება აქტიურია';
      return `${count} უფლება აქტიურია`;
    },
    categoryTitle: 'უფლებების კატეგორიები',
    categoryDescription: 'აირჩიეთ ბლოკები რომ როლს მიანიჭოთ ან ჩამოართვათ კონკრეტული შესაძლებლობა.',
    save: 'ცვლილებების შენახვა',
    saving: 'ინახება…',
    reset: 'გაუქმება',
    saved: 'უფლებები წარმატებით განახლდა.',
    noAccess: 'უფლებების შეცვლის უფლება არ გაქვთ, თუმცა შეგიძლიათ ნახოთ არსებული განაწილება.',
    adminLocked: 'ადმინისტრატორის როლი დაცულია და ყოველთვის ფლობს ყველა უფლებას.',
    helper: 'აირჩიეთ როლი ზემოდან და დააწკაპეთ შესაბამის ბლოკზე მის ჩასართავად ან გამოსართავად.',
    idLabel: 'იდენტიფიკატორი'
  },
  en: {
    title: 'Permissions matrix',
    subtitle: 'Inspect the permissions granted to each role and adjust them as needed.',
    heroTitle: (roleName: string) => `Permissions for ${roleName}`,
    heroSubtitle: 'Ensure each team has the right access. Toggle the tiles below to grant or revoke capabilities.',
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
    categoryDescription: 'Toggle the cards to grant or revoke a specific capability for the selected role.',
    save: 'Save changes',
    saving: 'Saving…',
    reset: 'Reset',
    saved: 'Permissions updated successfully.',
    noAccess: 'You do not have permission to modify assignments, but you can review the current mapping.',
    adminLocked: 'The administrator role is protected and always retains every permission.',
    helper: 'Choose a role above, then click any card to enable or disable that permission.',
    idLabel: 'ID'
  }
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

  const handlePermissionToggle = (role: Role, permissionId: string) => {
    if (!canManage || role.id === 1) {
      return;
    }
    setStatusMessage(null);
    updateRolePermissions(role.id, permissionId);
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
          <p className="text-xs text-slate-500 mt-3">{t.helper}</p>
        </div>
        <div className="flex items-center gap-3">
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
            disabled={!canManage || isSaving}
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
          <p>{t.noAccess}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {localRoles.map((role) => {
            const isActive = role.id === selectedRoleId;
            const assignedUsers = users.filter((user) => user.roleId === role.id).length;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRoleId(role.id);
                  setStatusMessage(null);
                }}
                className={`text-left rounded-2xl border p-5 transition shadow-sm ${
                  isActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{role.name}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{role.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {assignedUsers}
                  </span>
                </div>
                <p className="mt-4 text-xs font-medium text-slate-500">
                  {t.permissionCount(role.permissions.length)}
                </p>
              </button>
            );
          })}
        </div>

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
                <p className="text-xs text-slate-500">{t.helper}</p>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, permissionIds]) => {
                  const categoryLabel = PERMISSION_CATEGORY_LABELS[category][language];
                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{categoryLabel}</h4>
                        <span className="text-xs font-medium text-slate-400">
                          {t.permissionCount(
                            permissionIds.filter((permissionId) => selectedRole.permissions.includes(permissionId)).length
                          )}
                        </span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {permissionIds.map((permissionId) => {
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
