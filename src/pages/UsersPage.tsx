import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

interface UsersPageProps {
  language: 'ka' | 'en';
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
};

const COPY: Record<UsersPageProps['language'], {
  title: string;
  subtitle: string;
  formTitle: string;
  editTitle: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  add: string;
  adding: string;
  update: string;
  updating: string;
  success: string;
  updateSuccess: string;
  required: string;
  duplicateEmail: string;
  genericError: string;
  noCreatePermission: string;
  noEditPermission: string;
  noViewPermission: string;
  cancelEdit: string;
  editAction: string;
  listTitle: string;
  emptyState: string;
  columnName: string;
  columnEmail: string;
  columnPhone: string;
  columnRole: string;
  columnActions: string;
  unknownRole: string;
}> = {
  ka: {
    title: 'მომხმარებლები',
    subtitle: 'დაამატეთ ახალი მომხმარებლები და ნახეთ არსებული გუნდის წევრები.',
    formTitle: 'ახალი მომხმარებლის დამატება',
    editTitle: 'მომხმარებლის რედაქტირება',
    name: 'სრული სახელი',
    email: 'ელ. ფოსტა',
    phone: 'ტელეფონის ნომერი',
    password: 'პაროლი',
    role: 'როლი',
    add: 'დამატება',
    adding: 'დამატება…',
    update: 'განახლება',
    updating: 'განახლება…',
    success: 'მომხმარებელი წარმატებით დაემატა.',
    updateSuccess: 'მომხმარებლის ინფორმაცია განახლდა.',
    required: 'გთხოვთ, შეავსოთ ყველა ველი.',
    duplicateEmail: 'ამ ელ. ფოსტით მომხმარებელი უკვე არსებობს.',
    genericError: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან.',
    noCreatePermission: 'თქვენ არ გაქვთ ახალი მომხმარებლის დამატების უფლება.',
    noEditPermission: 'თქვენ არ გაქვთ მომხმარებლის რედაქტირების უფლება.',
    noViewPermission: 'თქვენ არ გაქვთ მომხმარებლების გვერდზე წვდომა.',
    cancelEdit: 'გაუქმება',
    editAction: 'რედაქტირება',
    listTitle: 'დარეგისტრირებული მომხმარებლები',
    emptyState: 'მომხმარებლები ჯერ არ არის დამატებული.',
    columnName: 'სახელი',
    columnEmail: 'ელ. ფოსტა',
    columnPhone: 'ტელეფონი',
    columnRole: 'როლი',
    columnActions: 'ქმედებები',
    unknownRole: 'უცნობი როლი'
  },
  en: {
    title: 'Users',
    subtitle: 'Add new teammates and review everyone who already has access.',
    formTitle: 'Create a New User',
    editTitle: 'Edit user',
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    password: 'Password',
    role: 'Role',
    add: 'Add user',
    adding: 'Adding…',
    update: 'Update user',
    updating: 'Updating…',
    success: 'User created successfully.',
    updateSuccess: 'User details updated.',
    required: 'Please fill in every field.',
    duplicateEmail: 'A user with this email already exists.',
    genericError: 'Something went wrong. Please try again.',
    noCreatePermission: 'You do not have permission to add users.',
    noEditPermission: 'You do not have permission to edit users.',
    noViewPermission: 'You do not have access to the users directory.',
    cancelEdit: 'Cancel',
    editAction: 'Edit',
    listTitle: 'Registered Users',
    emptyState: 'No users have been added yet.',
    columnName: 'Name',
    columnEmail: 'Email',
    columnPhone: 'Phone',
    columnRole: 'Role',
    columnActions: 'Actions',
    unknownRole: 'Unknown role'
  }
};

export const UsersPage: React.FC<UsersPageProps> = ({ language }) => {
  const { roles, users, saveUsers, hasPermission } = useAppContext();
  const t = COPY[language];

  const defaultRoleId = useMemo(() => (roles[0] ? String(roles[0].id) : ''), [roles]);

  const [formData, setFormData] = useState<FormState>(() => ({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleId: defaultRoleId
  }));
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!editingUserId && !formData.roleId && defaultRoleId) {
      setFormData((previous) => ({ ...previous, roleId: defaultRoleId }));
    }
  }, [defaultRoleId, editingUserId, formData.roleId]);

  const canView = hasPermission('view_users');
  const canCreate = hasPermission('create_users');
  const canEdit = hasPermission('edit_users');
  const isEditing = editingUserId !== null;
  const canSubmit = isEditing ? canEdit : canCreate;
  const submitLabel = isSubmitting ? (isEditing ? t.updating : t.adding) : isEditing ? t.update : t.add;
  const showCreateWarning = !isEditing && !canCreate;

  if (!canView) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
        <p className="mt-4 text-slate-600">{t.noViewPermission}</p>
      </div>
    );
  }

  const roleLookup = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const editingUser = useMemo(() => {
    if (editingUserId === null) {
      return null;
    }
    return users.find((user) => user.id === editingUserId) ?? null;
  }, [editingUserId, users]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = (nextRoleId?: string) => {
    setFormData({ name: '', email: '', phone: '', password: '', roleId: nextRoleId ?? defaultRoleId });
  };

  const startEditing = (userId: number) => {
    if (!canEdit) {
      return;
    }

    if (editingUserId === userId) {
      return;
    }

    const existing = users.find((user) => user.id === userId);
    if (!existing) {
      return;
    }

    setEditingUserId(existing.id);
    setFormData({
      name: existing.name,
      email: existing.email,
      phone: existing.phone,
      password: existing.password,
      roleId: String(existing.roleId)
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    const previousRoleId = editingUser?.roleId;
    setEditingUserId(null);
    resetForm(previousRoleId ? String(previousRoleId) : defaultRoleId);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError(isEditing ? t.noEditPermission : t.noCreatePermission);
      return;
    }

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const password = formData.password.trim();
    const roleId = Number.parseInt(formData.roleId, 10);

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password || Number.isNaN(roleId)) {
      setError(t.required);
      return;
    }

    const emailAlreadyExists = users.some(
      (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase() && user.id !== editingUserId
    );
    if (emailAlreadyExists) {
      setError(t.duplicateEmail);
      return;
    }

    const avatar = trimmedName.charAt(0).toUpperCase() || 'U';

    setIsSubmitting(true);

    try {
      if (isEditing && editingUserId !== null) {
        const updatedUsers = users.map((user) =>
          user.id === editingUserId
            ? { ...user, name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password, roleId, avatar }
            : user
        );
        await saveUsers(updatedUsers);
        setSuccess(t.updateSuccess);
        setEditingUserId(null);
        resetForm(String(roleId));
      } else {
        const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
        await saveUsers([
          ...users,
          {
            id: nextId,
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password,
            roleId,
            avatar
          }
        ]);
        setSuccess(t.success);
        resetForm(String(roleId));
      }
    } catch (submitError) {
      console.error('Unable to save user', submitError);
      setError(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t.title}</h1>
        <p className="text-slate-600 mt-2">{t.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="mb-6 space-y-3">
          <h2 className="text-xl font-semibold text-slate-800">{isEditing ? t.editTitle : t.formTitle}</h2>
          {isEditing && editingUser ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {language === 'ka'
                ? `${editingUser.name} — მიმდინარე რედაქტირება.`
                : `Editing details for ${editingUser.name}.`}
            </div>
          ) : null}
          {!isEditing && showCreateWarning ? (
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {t.noCreatePermission}
            </div>
          ) : null}
        </div>
        <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="name">
              {t.name}
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder={t.name}
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="email">
              {t.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="phone">
              {t.phone}
            </label>
            <input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="+995 555 123 456"
              autoComplete="tel"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="password">
              {t.password}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={!canSubmit || isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="••••••••"
              autoComplete={isEditing ? 'current-password' : 'new-password'}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="roleId">
              {t.role}
            </label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              disabled={!canSubmit || roles.length === 0 || isSubmitting}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:gap-4 min-h-[1.25rem]">
              {error ? <span className="text-red-500">{error}</span> : null}
              {success ? <span className="text-emerald-600">{success}</span> : null}
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t.cancelEdit}
                </button>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit || roles.length === 0}
                className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">{t.listTitle}</h2>
        {users.length === 0 ? (
          <p className="text-slate-500 text-sm">{t.emptyState}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnName}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnEmail}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnPhone}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.columnRole}
                  </th>
                  {canEdit ? (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t.columnActions}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50 ${editingUserId === user.id ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center">
                        <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                          {user.avatar}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{roleLookup.get(user.roleId) ?? t.unknownRole}</td>
                    {canEdit ? (
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <button
                          type="button"
                          onClick={() => startEditing(user.id)}
                          disabled={isSubmitting || (isEditing && editingUserId === user.id)}
                          className="text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {t.editAction}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
