import React from 'react';

interface RolesPageProps {
  language: 'ka' | 'en';
}

export const RolesPage: React.FC<RolesPageProps> = ({ language }) => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">{language === 'ka' ? 'როლები' : 'Roles'}</h1>
      <p className="text-slate-600 mt-2">{language === 'ka' ? 'როლების მოდული ხელმისაწვდომი იქნება მალე' : 'Roles module coming soon.'}</p>
    </div>
  );
};
