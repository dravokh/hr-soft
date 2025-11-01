import React, { useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const translations = {
  ka: {
    title: 'HR მართვა',
    subtitle: 'შედით თქვენს ანგარიშში',
    email: 'ელ. ფოსტა',
    password: 'პაროლი',
    loginButton: 'შესვლა',
    loggingIn: 'შესვლა...',
    demoAccounts: 'დემო ანგარიშები:'
  },
  en: {
    title: 'HR Management',
    subtitle: 'Login to your account',
    email: 'Email',
    password: 'Password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    demoAccounts: 'Demo Accounts:'
  }
};

type Language = keyof typeof translations;

export const LoginView: React.FC = () => {
  const { login } = useAppContext();
  const [language, setLanguage] = useState<Language>('ka');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = useMemo(() => translations[language], [language]);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError(language === 'ka' ? 'შეავსეთ ყველა ველი' : 'Please fill all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'გაუთვალისწინებელი შეცდომა მოხდა');
    }
  };

  return (
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
              ქართული
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                language === 'en' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              English
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📊</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.title}</h1>
            <p className="text-slate-600">{t.subtitle}</p>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
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
              disabled={loading}
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
  );
};
