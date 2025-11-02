import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  UserCog,
  Shield,
  Users,
  Lock,
  FileText,
  Settings2
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { RolesPage } from '../../pages/RolesPage';
import { UsersPage } from '../../pages/UsersPage';
import { PermissionsPage } from '../../pages/PermissionsPage';
import { ApplicationsPage } from '../../pages/ApplicationsPage';
import { ApplicationTypesPage } from '../../pages/application-types';
import { MainLayout, MenuItem } from './MainLayout';
import { Language } from '../../types';
import { DEFAULT_LANGUAGE, resolveLanguageKey } from '../../utils/i18n';

const MENU_DEFINITIONS: MenuItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: { ka: 'მთავარი', en: 'Dashboard', tr: 'Kontrol paneli' }
  },
  {
    id: 'profile',
    icon: UserCog,
    label: { ka: 'ჩემი გვერდი', en: 'My Profile', tr: 'Profilim' }
  },
  { id: 'roles', icon: Shield, label: { ka: 'როლები', en: 'Roles', tr: 'Roller' } },
  { id: 'users', icon: Users, label: { ka: 'მომხმარებლები', en: 'Users', tr: 'Kullanıcılar' } },
  { id: 'applications', icon: FileText, label: { ka: 'განაცხადები', en: 'Applications', tr: 'Başvurular' } },
  {
    id: 'applicationTypes',
    icon: Settings2,
    label: { ka: 'განაცხადების ტიპები', en: 'Application types', tr: 'Başvuru türleri' }
  },
  { id: 'permissions', icon: Lock, label: { ka: 'უფლებები', en: 'Permissions', tr: 'Yetkiler' } }
];

const MENU_PERMISSIONS: Record<string, string> = {
  dashboard: 'view_dashboard',
  profile: 'view_dashboard',
  roles: 'view_roles',
  users: 'view_users',
  applications: 'view_requests',
  applicationTypes: 'manage_request_types',
  permissions: 'manage_permissions'
};

export const DashboardLayout: React.FC = () => {
  const { hasPermission } = useAppContext();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  const menuItems = useMemo(
    () => MENU_DEFINITIONS.filter((item) => hasPermission(MENU_PERMISSIONS[item.id])),
    [hasPermission]
  );

  useEffect(() => {
    if (!menuItems.find((item) => item.id === currentPage)) {
      setCurrentPage(menuItems[0]?.id ?? 'dashboard');
    }
  }, [currentPage, menuItems]);

  const resolvedLanguage = resolveLanguageKey(language);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage language={resolvedLanguage} />;
      case 'profile':
        return <ProfilePage language={resolvedLanguage} />;
      case 'roles':
        return <RolesPage language={resolvedLanguage} />;
      case 'users':
        return <UsersPage language={resolvedLanguage} />;
      case 'applications':
        return <ApplicationsPage language={resolvedLanguage} />;
      case 'applicationTypes':
        return <ApplicationTypesPage language={resolvedLanguage} />;
      case 'permissions':
        return <PermissionsPage language={resolvedLanguage} />;
      default:
        return <div className="text-center py-20 text-slate-600">Access Denied</div>;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      language={language}
      setLanguage={setLanguage}
      menuItems={menuItems}
    >
      {renderPage()}
    </MainLayout>
  );
};
