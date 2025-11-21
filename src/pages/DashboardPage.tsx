import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { ApplicationBundle, ApplicationType } from '../types';

interface DashboardPageProps {
  language: 'ka' | 'en';
}

const formatDateTime = (value: string, language: 'ka' | 'en') => {
  if (!value) {
    return language === 'ka' ? 'ნაკვეთი არ არის' : '—';
  }

  const formatter = new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(new Date(value));
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ language }) => {
  const { currentUser, applications, applicationTypes } = useAppContext();

  const typeById = useMemo(
    () => new Map(applicationTypes.map((type) => [type.id, type] as [number, ApplicationType])),
    [applicationTypes]
  );

  const applicationMetrics = useMemo(() => {
    if (!currentUser) {
      return { total: applications.length, awaiting: 0, sent: 0, dueSoon: 0 };
    }

    const awaiting = applications.filter((bundle) => {
      if (bundle.application.status !== 'PENDING') {
        return false;
      }
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }
      const currentRole = type.flow[bundle.application.currentStepIndex];
      const isDelegate = bundle.delegates.some(
        (delegate) => delegate.forRoleId === currentRole && delegate.delegateUserId === currentUser.id
      );
      return currentRole === currentUser.roleId || isDelegate;
    }).length;

    const sent = applications.filter((bundle) => bundle.application.requesterId === currentUser.id).length;

    const dueSoon = applications.filter((bundle) => {
      if (bundle.application.status !== 'PENDING' || !bundle.application.dueAt) {
        return false;
      }
      const dueTime = new Date(bundle.application.dueAt).getTime();
      const now = Date.now();
      return dueTime - now <= 48 * 3600 * 1000 && dueTime >= now;
    }).length;

    return { total: applications.length, awaiting, sent, dueSoon };
  }, [applications, currentUser, typeById]);

  const nextApproval = useMemo(() => {
    if (!currentUser) {
      return null as ApplicationBundle | null;
    }
    const pending = applications.filter((bundle) => {
      if (bundle.application.status !== 'PENDING') {
        return false;
      }
      const type = typeById.get(bundle.application.typeId);
      if (!type) {
        return false;
      }
      const currentRole = type.flow[bundle.application.currentStepIndex];
      const isDelegate = bundle.delegates.some(
        (delegate) => delegate.forRoleId === currentRole && delegate.delegateUserId === currentUser.id
      );
      return (currentRole === currentUser.roleId || isDelegate) && bundle.application.dueAt;
    });

    return pending
      .slice()
      .sort((a, b) => new Date(a.application.dueAt ?? 0).getTime() - new Date(b.application.dueAt ?? 0).getTime())[0] ?? null;
  }, [applications, currentUser, typeById]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{language === 'ka' ? 'მთავარი' : 'Dashboard'}</h1>
        <p className="text-slate-600">
          {language === 'ka' ? 'კეთილი იყოს თქვენი დაბრუნება, ' : 'Welcome back, '}
          <span className="text-blue-500 font-semibold">{currentUser?.name ?? 'User'}!</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'სულ განაცხადები' : 'Total applications'}</h3>
          <div className="text-3xl font-bold text-slate-800">{applicationMetrics.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'საჭიროა ჩემი პასუხი' : 'Awaiting my action'}</h3>
          <div className="text-3xl font-bold text-slate-800">{applicationMetrics.awaiting}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'ჩემი გაგზავნილები' : 'My submissions'}</h3>
          <div className="text-3xl font-bold text-slate-800">{applicationMetrics.sent}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'ახლო ვადაში' : 'Due soon (48h)'}</h3>
          <div className="text-3xl font-bold text-slate-800">{applicationMetrics.dueSoon}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">{language === 'ka' ? 'ბოლო აქტივობა' : 'Recent Activity'}</h2>
        {nextApproval ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm text-slate-500">
                {language === 'ka' ? 'მოლოდინშია თქვენი პასუხი განაცხადზე' : 'Awaiting your decision on'}
              </p>
              <p className="text-xl font-semibold text-slate-800">{nextApproval.application.number}</p>
              <p className="text-sm text-slate-500">
                {formatDateTime(nextApproval.application.dueAt ?? '', language)}
              </p>
            </div>
            <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600">
              {typeById.get(nextApproval.application.typeId)?.name[language] ?? 'Application'}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📊</div>
            <h3 className="text-slate-600 font-medium mb-2">{language === 'ka' ? 'აქტივობა არ არის' : 'No Activity'}</h3>
            <p className="text-slate-400 text-sm">
              {language === 'ka'
                ? 'საინტერესო სტატისტიკა მალე გამოჩნდება აქ'
                : 'Interesting statistics will appear here soon'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
