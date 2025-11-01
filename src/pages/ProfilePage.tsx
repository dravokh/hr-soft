import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';

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
    required: 'გთხოვთ, შეავსოთ ყველა ველი.'
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
    required: 'Please complete every field.'
  }
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ language }) => {
  const { currentUser, users, saveUsers } = useAppContext();
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{t.heading}</h1>
        <p className="text-slate-600 mt-2">{t.subheading}</p>
      </div>

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
  );
};
