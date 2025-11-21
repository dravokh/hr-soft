import React, { useEffect, useMemo, useState } from 'react';

import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Shield,
  Lock,
  FileText,
  Settings2,
  BookOpenCheck,
  Banknote
} from 'lucide-react';

import { useAppContext } from '../../context/AppContext';

import { DashboardPage } from '../../pages/DashboardPage';

import { RolesPage } from '../../pages/RolesPage';

import { PermissionsPage } from '../../pages/PermissionsPage';

import { ApplicationsPage } from '../../pages/ApplicationsPage';

import { ApplicationTypesPage } from '../../pages/application-types';

import { MyPage } from '../../pages/MyPage';

import { HRPage } from '../../pages/HRPage';

import { TeacherSchedulePage } from '../../pages/TeacherSchedulePage';
import { PayrollPage } from '../../pages/PayrollPage';
import { LearningPage } from '../../pages/LearningPage';

import { MainLayout, MenuItem } from './MainLayout';



const MENU_DEFINITIONS: MenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: { ka: 'დაფა', en: 'Dashboard' } },
  { id: 'mypage', icon: CalendarClock, label: { ka: 'ჩემი გვერდი', en: 'My Page' } },
  { id: 'hr', icon: ClipboardList, label: { ka: 'HR სექცია', en: 'HR' } },
  { id: 'roles', icon: Shield, label: { ka: 'როლები', en: 'Roles' } },
  { id: 'applications', icon: FileText, label: { ka: 'განაცხადები', en: 'Applications' } },
  { id: 'applicationTypes', icon: Settings2, label: { ka: 'განაცხადების ტიპები', en: 'Application types' } },
  { id: 'permissions', icon: Lock, label: { ka: 'უფლებები', en: 'Permissions' } },
  { id: 'teacherSchedule', icon: BookOpenCheck, label: { ka: 'მასწავლებლის განრიგი', en: 'Teacher schedule' } },
  { id: 'learning', icon: BookOpenCheck, label: { ka: 'სასწავლო ნაწილი', en: 'Learning' } },
  { id: 'payroll', icon: Banknote, label: { ka: 'ხელფასები', en: 'Payroll' } }
];



const MENU_PERMISSIONS: Record<string, string> = {
  dashboard: 'view_dashboard',
  mypage: 'view_dashboard',
  hr: 'view_hr',
  roles: 'view_roles',
  applications: 'view_requests',
  applicationTypes: 'manage_request_types',
  permissions: 'manage_permissions',
  teacherSchedule: 'view_teacher_schedule',
  learning: 'manage_learning',
  payroll: 'view_payroll'
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

      case 'hr':

        return <HRPage language={language} />;

      case 'mypage':

        return <MyPage language={language} />;

      case 'roles':

        return <RolesPage language={language} />;

      case 'applications':

        return <ApplicationsPage language={language} />;

      case 'applicationTypes':

        return <ApplicationTypesPage language={language} />;

      case 'permissions':

        return <PermissionsPage language={language} />;

      case 'teacherSchedule':

        return <TeacherSchedulePage language={language} />;

      case 'learning':

        return <LearningPage language={language} />;

      case 'payroll':

        return <PayrollPage language={language} />;

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










