import React from 'react';
import { useAppContext } from '../context/AppContext';

interface DashboardPageProps {
  language: 'ka' | 'en';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ language }) => {
  const { currentUser } = useAppContext();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{language === 'ka' ? 'მთავარი' : 'Dashboard'}</h1>
        <p className="text-slate-600">
          {language === 'ka' ? 'კეთილი იყოს თქვენი დაბრუნება, ' : 'Welcome back, '}
          <span className="text-blue-500 font-semibold">{currentUser?.name ?? 'User'}!</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'მიმდინარე' : 'Pending'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'დამტკიცებული' : 'Approved'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'უარყოფილი' : 'Rejected'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm text-slate-600 mb-2">{language === 'ka' ? 'დოკუმენტები' : 'Documents'}</h3>
          <div className="text-3xl font-bold text-slate-800">0</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">{language === 'ka' ? 'ბოლო აქტივობა' : 'Recent Activity'}</h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">📊</div>
          <h3 className="text-slate-600 font-medium mb-2">{language === 'ka' ? 'აქტივობა არ არის' : 'No Activity'}</h3>
          <p className="text-slate-400 text-sm">
            {language === 'ka' ? 'საინტერესო სტატისტიკა მალე გამოჩნდება აქ' : 'Interesting statistics will appear here soon'}
          </p>
        </div>
      </div>
    </div>
  );
};
