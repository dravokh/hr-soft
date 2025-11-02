import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ALL_PERMISSIONS, PERMISSION_CATEGORY_LABELS, PERMISSION_LABELS } from '../constants/permissions';

interface ProfilePageProps {
  language: 'ka' | 'en';
}

const COPY: Record<ProfilePageProps['language'], {
  heading: string;
  subheading: string;
  personalTitle: string;
  contactInfo: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  saveChanges: string;
  saving: string;
  saved: string;
  securityTitle: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  updatePassword: string;
  passwordUpdated: string;
  passwordMismatch: string;
  passwordWrong: string;
  required: string;
  overviewTitle: string;
  overviewSubtitle: string;
  roleHeading: string;
  permissionsHeading: string;
  permissionsHelper: string;
  permissionsEmpty: string;
  membersLabel: (count: number) => string;
  systemBadge: string;
  customBadge: string;
}> = {
  ka: {
    heading: 'ჩემი პროფილი',
    subheading: 'განაახლეთ პირადი ინფორმაცია და შეცვალეთ პაროლი ნებისმიერი მოწყობილობიდან.',
    personalTitle: 'პირადი ინფორმაცია',
    contactInfo: 'საკონტაქტო მონაცემები',
    nameLabel: 'სრული სახელი',
    emailLabel: 'ელ. ფოსტა',
    phoneLabel: 'ტელეფონი',
    saveChanges: 'ინფორმაციის განახლება',
    saving: 'ინახება…',
    saved: 'პროფილი წარმატებით განახლდა.',
    securityTitle: 'უსაფრთხოება',
    currentPassword: 'მოქმედი პაროლი',
    newPassword: 'ახალი პაროლი',
    confirmPassword: 'გაიმეორეთ პაროლი',
    updatePassword: 'პაროლის განახლება',
    passwordUpdated: 'პაროლი წარმატებით შეიცვალა.',
    passwordMismatch: 'ახალი პაროლი და განმეორება არ ემთხვევა.',
    passwordWrong: 'მოქმედი პაროლი არასწორია.',
    required: 'გთხოვთ, შეავსოთ ყველა ველი.',
    overviewTitle: 'ჩემი დეტალები',
    overviewSubtitle: 'დაადასტურეთ რომ საკონტაქტო ინფორმაცია და როლის აღწერა არის განახლებული.',
    roleHeading: 'ჩემი როლი',
    permissionsHeading: 'ჩემი უფლებები',
    permissionsHelper: 'უფლება აქტიურია თუ ის მოცემულია ქვემოთ მწვანე ბეჯით. ცვლილებები ძალაში შედის მაშინვე.',
    permissionsEmpty: 'ამ როლს ჯერ არ აქვს მინიჭებული უფლებები.',
    membersLabel: (count: number) => {
      if (count === 0) return '0 მომხმარებელი';
      if (count === 1) return '1 მომხმარებელი';
      return `${count} მომხმარებელი`;
    },
    systemBadge: 'სისტემური როლი',
    customBadge: 'მორგებული როლი'
  },
  en: {
    heading: 'My profile',
    subheading: 'Update your personal information and manage security from any device.',
    personalTitle: 'Personal details',
    contactInfo: 'Contact information',
    nameLabel: 'Full name',
    emailLabel: 'Email address',
    phoneLabel: 'Phone number',
    saveChanges: 'Save changes',
    saving: 'Saving…',
    saved: 'Profile updated successfully.',
    securityTitle: 'Security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    updatePassword: 'Update password',
    passwordUpdated: 'Password updated successfully.',
    passwordMismatch: 'New password and confirmation do not match.',
    passwordWrong: 'The current password is incorrect.',
    required: 'Please complete every field.',
    overviewTitle: 'My details',
    overviewSubtitle: 'Ensure your contact information and role description are always up to date.',
    roleHeading: 'My role',
    permissionsHeading: 'My permissions',
    permissionsHelper: 'Active permissions are highlighted below. Updates apply instantly to your session.',
    permissionsEmpty: 'No permissions have been granted to this role yet.',
    membersLabel: (count: number) => {
      if (count === 0) return '0 members';
      if (count === 1) return '1 member';
      return `${count} members`;
    },
    systemBadge: 'System role',
    customBadge: 'Custom role'
  }
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ language }) => {
  const { currentUser, users, roles, saveUsers } = useAppContext();
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const t = COPY[language];

  useEffect(() => {
    if (currentUser) {
      setProfileForm({ name: currentUser.name, email: currentUser.email, phone: currentUser.phone });
    }
  }, [currentUser]);

  const activeRole = useMemo(() => {
    if (!currentUser) {
      return null;
    }
    return roles.find((role) => role.id === currentUser.roleId) ?? null;
  }, [currentUser, roles]);

  const roleMembers = useMemo(() => {
    if (!activeRole) {
      return 0;
    }
    return users.filter((user) => user.roleId === activeRole.id).length;
  }, [activeRole, users]);

  const permissionCountLabel = useMemo(() => {
    if (!activeRole) {
      return language === 'ka' ? '0 უფლება' : '0 permissions';
    }
    const count = activeRole.permissions.length;
    if (language === 'ka') {
      return count === 1 ? '1 უფლება' : `${count} უფლება`;
    }
    return count === 1 ? '1 permission' : `${count} permissions`;
  }, [activeRole, language]);

  const avatarInitials = useMemo(() => {
    if (!currentUser?.name) {
      return '';
    }
    return currentUser.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }, [currentUser]);

  const groupedPermissions = useMemo(() => {
    if (!activeRole) {
      return [] as { category: string; permissions: string[] }[];
    }

    const groups = new Map<string, string[]>();

    ALL_PERMISSIONS.forEach(({ id, category }) => {
      if (!activeRole.permissions.includes(id)) {
        return;
      }
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(id);
    });

    return Array.from(groups.entries()).map(([category, permissions]) => ({
      category,
      permissions
    }));
  }, [activeRole]);

  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const currentUserIndex = useMemo(() => {
    if (!currentUser) {
      return -1;
    }
    return users.findIndex((user) => user.id === currentUser.id);
  }, [currentUser, users]);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (!currentUser || currentUserIndex === -1) {
      return;
    }

    const name = profileForm.name.trim();
    const phone = profileForm.phone.trim();

    if (!name || !phone) {
      setProfileError(t.required);
      return;
    }

    setProfileSaving(true);

    try {
      const updatedUser = { ...currentUser, name, phone };
      const updatedUsers = [...users];
      updatedUsers[currentUserIndex] = updatedUser;
      await saveUsers(updatedUsers);
      setProfileMessage(t.saved);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentUser || currentUserIndex === -1) {
      return;
    }

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordError(t.required);
      return;
    }

    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError(t.passwordMismatch);
      return;
    }

    if (passwordForm.current !== currentUser.password) {
      setPasswordError(t.passwordWrong);
      return;
    }

    setPasswordSaving(true);

    try {
      const updatedUser = { ...currentUser, password: passwordForm.next };
      const updatedUsers = [...users];
      updatedUsers[currentUserIndex] = updatedUser;
      await saveUsers(updatedUsers);
      setPasswordMessage(t.passwordUpdated);
      setPasswordForm({ current: '', next: '', confirm: '' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-800">
          {language === 'ka' ? 'ავტორიზაცია საჭიროა' : 'Authentication required'}
        </h1>
      </div>
    );
  }

  const avatarDisplay = avatarInitials || currentUser.name.charAt(0).toUpperCase();
  const roleBadge = activeRole ? (activeRole.id === 1 ? t.systemBadge : t.customBadge) : null;
  const roleName = activeRole ? activeRole.name : t.roleHeading;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t.heading}</h1>
        <p className="text-slate-600 mt-2">{t.subheading}</p>
      </div>

      <div className="space-y-10">
        <section className="bg-white rounded-3xl shadow-sm p-8 space-y-8">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-xl font-semibold">
                {avatarDisplay}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.overviewTitle}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-800">{currentUser.name}</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-xl">{t.overviewSubtitle}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700">
                    {roleName}
                  </span>
                  {roleBadge && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-blue-600 border border-blue-100">
                      {roleBadge}
                    </span>
                  )}
                  {activeRole && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
                      <ShieldCheck className="w-4 h-4" />
                      {permissionCountLabel}
                    </span>
                  )}
                  {activeRole && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-600">
                      <UsersIcon className="w-4 h-4" />
                      {t.membersLabel(roleMembers)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <dl className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <dt className="text-xs uppercase font-semibold text-slate-500">{t.nameLabel}</dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">{currentUser.name}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <dt className="text-xs uppercase font-semibold text-slate-500">{t.emailLabel}</dt>
              <dd className="mt-2 text-sm font-medium text-slate-800 break-words">{currentUser.email}</dd>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <dt className="text-xs uppercase font-semibold text-slate-500">{t.phoneLabel}</dt>
              <dd className="mt-2 text-sm font-medium text-slate-800">{currentUser.phone}</dd>
            </div>
          </dl>

          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t.permissionsHeading}</h3>
                <p className="text-sm text-slate-500">{t.permissionsHelper}</p>
              </div>
            </div>

            {groupedPermissions.length === 0 ? (
              <p className="text-sm text-slate-500">{t.permissionsEmpty}</p>
            ) : (
              <div className="space-y-4">
                {groupedPermissions.map(({ category, permissions }) => {
                  const categoryLabel = PERMISSION_CATEGORY_LABELS[category]?.[language] ?? category;
                  return (
                    <div key={category} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <h4 className="text-sm font-semibold text-emerald-700">{categoryLabel}</h4>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {permissions.map((permissionId) => (
                          <span
                            key={permissionId}
                            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {PERMISSION_LABELS[permissionId][language]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm p-8 lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{t.personalTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.contactInfo}</p>
            </div>

            <form className="space-y-6" onSubmit={handleProfileSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="name">
                    {t.nameLabel}
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.nameLabel}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="email">
                    {t.emailLabel}
                  </label>
                  <input
                    id="email"
                    name="email"
                    value={profileForm.email}
                    disabled
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-400 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="phone">
                  {t.phoneLabel}
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+995 555 000 000"
                />
              </div>

              {profileError && <p className="text-sm text-rose-500">{profileError}</p>}
              {profileMessage && <p className="text-sm text-emerald-600">{profileMessage}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {profileSaving ? t.saving : t.saveChanges}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-800">{t.securityTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'ka'
                  ? 'უსაფრთხოებისთვის რეგულარულად შეცვალეთ პაროლი და არ გააზიარო სხვა პირებთან.'
                  : 'For best security, update your password regularly and never share it.'}
              </p>
            </div>

            <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="current">
                  {t.currentPassword}
                </label>
                <input
                  id="current"
                  name="current"
                  type="password"
                  value={passwordForm.current}
                  onChange={handlePasswordChange}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="current-password"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="next">
                  {t.newPassword}
                </label>
                <input
                  id="next"
                  name="next"
                  type="password"
                  value={passwordForm.next}
                  onChange={handlePasswordChange}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-slate-700 mb-2" htmlFor="confirm">
                  {t.confirmPassword}
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={handlePasswordChange}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="new-password"
                />
              </div>

              {passwordError && <p className="text-sm text-rose-500">{passwordError}</p>}
              {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2.5 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {passwordSaving ? t.saving : t.updatePassword}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
