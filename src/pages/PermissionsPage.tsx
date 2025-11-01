import React, { useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCcw, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PERMISSION_LABELS } from '../constants/permissions';
import { Role } from '../types';

interface PermissionsPageProps {
  language: 'ka' | 'en';
}

const COPY: Record<PermissionsPageProps['language'], {
  title: string;
  subtitle: string;
  adminBadge: string;
  save: string;
  saving: string;
  reset: string;
  saved: string;
  noAccess: string;
  adminLocked: string;
  helper: string;
}> = {
  ka: {
    title: 'უფლებების მატრიცა',
    subtitle: 'ნახეთ თითოეული როლი და მათთვის მინიჭებული უფლებები. საჭიროებისამებრ შეცვალეთ.',
    adminBadge: 'სისტემური როლი',
    save: 'ცვლილებების შენახვა',
    saving: 'ინახება…',
    reset: 'გაუქმება',
    saved: 'უფლებები წარმატებით განახლდა.',
    noAccess: 'უფლებების შეცვლის უფლება არ გაქვთ, თუმცა შეგიძლიათ ნახოთ არსებული განაწილება.',
    adminLocked: 'ადმინისტრატორის როლი დაცულია და ყოველთვის ფლობს ყველა უფლებას.',
    helper: 'დააჭირეთ უჯრას უფლებების ჩასართავად ან გამოსართავად კონკრეტული როლისთვის.'
  },
  en: {
    title: 'Permissions matrix',
    subtitle: 'Inspect the permissions granted to each role and adjust them as needed.',
    adminBadge: 'System role',
    save: 'Save changes',
    saving: 'Saving…',
    reset: 'Reset',
    saved: 'Permissions updated successfully.',
    noAccess: 'You do not have permission to modify assignments, but you can review the current mapping.',
    adminLocked: 'The administrator role is protected and always retains every permission.',
    helper: 'Click a cell to grant or revoke a permission for a specific role.'
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
  const { roles, saveRoles, hasPermission } = useAppContext();
  const [localRoles, setLocalRoles] = useState<Role[]>(roles);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const t = COPY[language];
  const canManage = hasPermission('manage_permissions');
  const groupedPermissions = useMemo(groupByCategory, []);

  useEffect(() => {
    setLocalRoles(roles);
  }, [roles]);

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

  const handleCellClick = (role: Role, permissionId: string) => {
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

  const renderCell = (role: Role, permissionId: string) => {
    const active = role.permissions.includes(permissionId);
    const locked = role.id === 1;
    const interactive = canManage && !locked;

    return (
      <button
        key={`${role.id}-${permissionId}`}
        type="button"
        onClick={() => handleCellClick(role, permissionId)}
        className={`w-full h-10 flex items-center justify-center rounded-lg border transition ${
          active ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-white border-slate-200 text-slate-500'
        } ${interactive ? 'hover:border-blue-400 hover:text-blue-600' : 'cursor-not-allowed'} ${locked ? 'bg-slate-100 text-slate-400 border-slate-200' : ''}`}
        disabled={!interactive}
        aria-pressed={active}
      >
        {active ? '✓' : ''}
      </button>
    );
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

      <div className="bg-white rounded-2xl shadow-sm p-6 overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr>
              <th className="w-64 p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {language === 'ka' ? 'უფლება' : 'Permission'}
              </th>
              {localRoles.map((role) => (
                <th key={role.id} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-700 text-sm font-semibold">{role.name}</span>
                    {role.id === 1 && (
                      <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {t.adminBadge}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedPermissions).map(([category, permissionIds]) => (
              <React.Fragment key={category}>
                <tr>
                  <td className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wide" colSpan={localRoles.length + 1}>
                    {PERMISSION_CATEGORY_LABELS[category][language]}
                  </td>
                </tr>
                {permissionIds.map((permissionId) => (
                  <tr key={permissionId} className="border-t border-slate-100">
                    <td className="p-4 text-slate-700">
                      {PERMISSION_LABELS[permissionId][language]}
                    </td>
                    {localRoles.map((role) => (
                      <td key={`${permissionId}-${role.id}`} className="p-2">
                        {renderCell(role, permissionId)}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        {t.adminLocked}
      </p>

      {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}
    </div>
  );
};
