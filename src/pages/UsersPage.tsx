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
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  add: string;
  adding: string;
  success: string;
  required: string;
  duplicateEmail: string;
  genericError: string;
  listTitle: string;
  emptyState: string;
  columnName: string;
  columnEmail: string;
  columnPhone: string;
  columnRole: string;
  unknownRole: string;
}> = {
  ka: {
    title: 'მომხმარებლები',
    subtitle: 'დაამატეთ ახალი მომხმარებლები და ნახეთ არსებული გუნდის წევრები.',
    formTitle: 'ახალი მომხმარებლის დამატება',
    name: 'სრული სახელი',
    email: 'ელ. ფოსტა',
    phone: 'ტელეფონის ნომერი',
    password: 'პაროლი',
    role: 'როლი',
    add: 'დამატება',
    adding: 'დამატება…',
    success: 'მომხმარებელი წარმატებით დაემატა.',
    required: 'გთხოვთ, შეავსოთ ყველა ველი.',
    duplicateEmail: 'ამ ელ. ფოსტით მომხმარებელი უკვე არსებობს.',
    genericError: 'დაფიქსირდა შეცდომა, სცადეთ თავიდან.',
    listTitle: 'დარეგისტრირებული მომხმარებლები',
    emptyState: 'მომხმარებლები ჯერ არ არის დამატებული.',
    columnName: 'სახელი',
    columnEmail: 'ელ. ფოსტა',
    columnPhone: 'ტელეფონი',
    columnRole: 'როლი',
    unknownRole: 'უცნობი როლი'
  },
  en: {
    title: 'Users',
    subtitle: 'Add new teammates and review everyone who already has access.',
    formTitle: 'Create a New User',
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone number',
    password: 'Password',
    role: 'Role',
    add: 'Add user',
    adding: 'Adding…',
    success: 'User created successfully.',
    required: 'Please fill in every field.',
    duplicateEmail: 'A user with this email already exists.',
    genericError: 'Something went wrong. Please try again.',
    listTitle: 'Registered Users',
    emptyState: 'No users have been added yet.',
    columnName: 'Name',
    columnEmail: 'Email',
    columnPhone: 'Phone',
    columnRole: 'Role',
    unknownRole: 'Unknown role'
  }
};

export const UsersPage: React.FC<UsersPageProps> = ({ language }) => {
  const { roles, users, saveUsers } = useAppContext();
  const t = COPY[language];

  const [formData, setFormData] = useState<FormState>(() => ({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleId: roles[0] ? String(roles[0].id) : ''
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!formData.roleId && roles.length > 0) {
      setFormData((previous) => ({ ...previous, roleId: String(roles[0].id) }));
    }
  }, [roles, formData.roleId]);

  const roleLookup = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = (nextRoleId: string) => {
    setFormData({ name: '', email: '', phone: '', password: '', roleId: nextRoleId });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const password = formData.password.trim();
    const roleId = Number.parseInt(formData.roleId, 10);

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password || Number.isNaN(roleId)) {
      setError(t.required);
      return;
    }

    const emailAlreadyExists = users.some((user) => user.email.toLowerCase() === trimmedEmail.toLowerCase());
    if (emailAlreadyExists) {
      setError(t.duplicateEmail);
      return;
    }

    const nextId = users.reduce((maxId, user) => Math.max(maxId, user.id), 0) + 1;
    const avatar = trimmedName.charAt(0).toUpperCase() || 'U';

    setIsSubmitting(true);

    try {
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
    } catch (submitError) {
      console.error('Unable to create user', submitError);
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
        <h2 className="text-xl font-semibold text-slate-800 mb-6">{t.formTitle}</h2>
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              autoComplete="new-password"
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <button
              type="submit"
              disabled={isSubmitting || roles.length === 0}
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? t.adding : t.add}
            </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
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
