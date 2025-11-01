import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, UserCog, Shield, Users, Lock, Ticket as TicketIcon, FileText } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { DashboardPage } from '../../pages/DashboardPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { RolesPage } from '../../pages/RolesPage';
import { UsersPage } from '../../pages/UsersPage';
import { PermissionsPage } from '../../pages/PermissionsPage';
import { TicketsPage } from '../../pages/TicketsPage';
import { ApplicationsPage } from '../../pages/ApplicationsPage';
import { MainLayout, MenuItem } from './MainLayout';

const MENU_DEFINITIONS: MenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: { ka: 'მთავარი', en: 'Dashboard' } },
  { id: 'profile', icon: UserCog, label: { ka: 'ჩემი გვერდი', en: 'My Profile' } },
  { id: 'roles', icon: Shield, label: { ka: 'როლები', en: 'Roles' } },
  { id: 'users', icon: Users, label: { ka: 'მომხმარებლები', en: 'Users' } },
  { id: 'tickets', icon: TicketIcon, label: { ka: 'თიკეტები', en: 'Tickets' } },
  { id: 'applications', icon: FileText, label: { ka: 'განაცხადები', en: 'Applications' } },
  { id: 'permissions', icon: Lock, label: { ka: 'უფლებები', en: 'Permissions' } }
];

const MENU_PERMISSIONS: Record<string, string> = {
  dashboard: 'view_dashboard',
  profile: 'view_dashboard',
  roles: 'view_roles',
  users: 'view_users',
  tickets: 'view_tickets',
  applications: 'view_requests',
  permissions: 'manage_permissions'
};

export const DashboardLayout: React.FC = () => {
  const { hasPermission } = useAppContext();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [language, setLanguage] = useState<'ka' | 'en'>('ka');

  const menuItems = useMemo(
    () => MENU_DEFINITIONS.filter((item) => hasPermission(MENU_PERMISSIONS[item.id])),
    [hasPermission]
  );

  useEffect(() => {
    if (!menuItems.find((item) => item.id === currentPage)) {
      setCurrentPage(menuItems[0]?.id ?? 'dashboard');
    }
  }, [currentPage, menuItems]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage language={language} />;
      case 'profile':
        return <ProfilePage language={language} />;
      case 'roles':
        return <RolesPage language={language} />;
      case 'users':
        return <UsersPage language={language} />;
      case 'tickets':
        return <TicketsPage language={language} />;
      case 'applications':
        return <ApplicationsPage language={language} />;
      case 'permissions':
        return <PermissionsPage language={language} />;
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
