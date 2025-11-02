import React from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export interface MenuItem {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: {
    ka: string;
    en: string;
  };
}

interface MainLayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  language: 'ka' | 'en';
  setLanguage: (language: 'ka' | 'en') => void;
  menuItems: MenuItem[];
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  language,
  setLanguage,
  menuItems,
  children
}) => {
  const { currentUser, logout, roles } = useAppContext();
  const userRole = roles.find((role) => role.id === currentUser?.roleId);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gradient-to-b from-slate-800 to-slate-900 text-white fixed h-full overflow-y-auto z-20`}
      >
        {sidebarOpen && (
          <div className="p-5">
            <div className="flex items-center pb-6 border-b border-slate-700 mb-5">
              <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center mr-3 text-2xl">📊</div>
              <div>
                <h2 className="text-lg font-semibold">HR მართვა</h2>
                <p className="text-xs text-slate-400">{userRole?.name ?? 'User'}</p>
              </div>
            </div>

            <div className="space-y-1 mb-32">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                      currentPage === item.id ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="text-sm">{item.label[language]}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute bottom-5 left-5 right-5 pt-5 border-t border-slate-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">{currentUser?.avatar ?? 'U'}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{currentUser?.name ?? 'User'}</h4>
                  <p className="text-xs text-slate-400">{currentUser?.email ?? 'user@hr.com'}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setLanguage('ka')}
                  className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                    language === 'ka' ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  ქართული
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                    language === 'en' ? 'bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 hover:bg-red-500/30 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                {language === 'ka' ? 'გასვლა' : 'Logout'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-30 lg:hidden bg-slate-800 text-white p-2 rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};
