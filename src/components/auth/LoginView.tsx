import React, { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const translations = {
  ka: {
    title: 'Maarif HR მართვა',
    subtitle: 'შედით თქვენს ანგარიშში',
    email: 'ელ. ფოსტა',
    password: 'პაროლი',
    loginButton: 'შესვლა',
    loggingIn: 'მიმდინარეობს შესვლა...',
    demoAccounts: 'დემო ანგარიშები:',
    resetTitle: 'ახალი პაროლის შექმნა',
    resetSubtitle: 'შეიყვანეთ ახალი პაროლი თქვენს ანგარიშში.',
    newPassword: 'ახალი პაროლი',
    confirmPassword: 'გაიმეორეთ პაროლი',
    savePassword: 'პაროლის შენახვა',
    savingPassword: 'შენახვა...',
    mismatch: 'პაროლები არ ემთხვევა.',
    success: 'პაროლი წარმატებით შეიცვალა. თქვენ უკვე სისტემაში ხართ.',
    missingCredentials: 'შეიყვანეთ ელ. ფოსტა და პაროლი.',
    loginError: 'ავტორიზაცია ვერ მოხერხდა. შეამოწმეთ მონაცემები და სცადეთ თავიდან.',
    resetFieldsRequired: 'გთხოვთ, მიუთითოთ და გაიმეოროთ ახალი პაროლი.',
    resetFailure: 'პაროლის განახლება ვერ შესრულდა. სცადეთ თავიდან.'
  },
  en: {
    title: 'Maarif HR Management',
    subtitle: 'Login to your account',
    email: 'Email',
    password: 'Password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    demoAccounts: 'Demo Accounts:',
    resetTitle: 'Create a new password',
    resetSubtitle: 'Enter a new password for your account.',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    savePassword: 'Save password',
    savingPassword: 'Saving...',
    mismatch: 'Passwords do not match.',
    success: 'Password updated. You are now signed in.',
    missingCredentials: 'Email and password are required.',
    loginError: 'Unable to sign in. Please check your credentials and try again.',
    resetFieldsRequired: 'Please enter and confirm your new password.',
    resetFailure: 'Unable to update the password. Please try again.'
  }
};

type Language = keyof typeof translations;

const LANGUAGE_LABELS: Record<Language, string> = {
  ka: '\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8',
  en: 'English'
};

export const LoginView: React.FC = () => {
  const { login, completePasswordReset } = useAppContext();
  const [language, setLanguage] = useState<Language>('ka');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingResetUserId, setPendingResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const t = useMemo(() => translations[language], [language]);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError(t.missingCredentials);
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? t.loginError);
      return;
    }

    if (result.requiresPasswordReset && result.userId) {
      setPendingResetUserId(result.userId);
      setNewPassword('');
      setConfirmPassword('');
      setResetError('');
      setResetSuccess('');
      setPassword('');
      return;
    }

    setResetSuccess('');
  };

  const handlePasswordReset = async () => {
    if (pendingResetUserId === null) {
      return;
    }

    setResetError('');
    setResetSuccess('');

    if (!newPassword || !confirmPassword) {
      setResetError(t.resetFieldsRequired);
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError(t.mismatch);
      return;
    }

    setResetLoading(true);
    try {
      const updated = await completePasswordReset(pendingResetUserId, newPassword);

      if (!updated) {
        setResetError(t.resetFailure);
        return;
      }

      setPendingResetUserId(null);
      setNewPassword('');
      setConfirmPassword('');
      setResetSuccess(t.success);
    } catch (resetException) {
      console.error('Password reset failed', resetException);
      setResetError(t.resetFailure);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-end gap-2 mb-6">
              <button
                type="button"
                onClick={() => setLanguage('ka')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  language === 'ka' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {LANGUAGE_LABELS.ka}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  language === 'en' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {LANGUAGE_LABELS.en}
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">HR</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
              <p className="text-slate-600">{t.subtitle}</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
            {resetSuccess && !pendingResetUserId ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6 text-sm">{resetSuccess}</div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
                  disabled={pendingResetUserId !== null}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="example@hr.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.password}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
                    disabled={pendingResetUserId !== null}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="********"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || pendingResetUserId !== null}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.loggingIn : t.loginButton}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-600 text-center mb-3">{t.demoAccounts}</p>
              <div className="space-y-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-semibold text-slate-700">Admin:</p>
                  <p className="text-slate-600">admin@hr.com / admin123</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-semibold text-slate-700">HR:</p>
                  <p className="text-slate-600">hr@hr.com / hr123</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-semibold text-slate-700">Employee:</p>
                  <p className="text-slate-600">user@hr.com / user123</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingResetUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-semibold text-slate-900">{t.resetTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{t.resetSubtitle}</p>

            {resetError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resetError}</div>
            ) : null}

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.newPassword}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.confirmPassword}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {resetLoading ? t.savingPassword : t.savePassword}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
