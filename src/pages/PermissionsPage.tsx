import React from 'react';

interface PermissionsPageProps {
  language: 'ka' | 'en';
}

export const PermissionsPage: React.FC<PermissionsPageProps> = ({ language }) => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">{language === 'ka' ? 'უფლებები' : 'Permissions'}</h1>
      <p className="text-slate-600 mt-2">
        {language === 'ka' ? 'უფლებების მართვის მოდული მალე დაემატება' : 'Permissions management coming soon.'}
      </p>
    </div>
  );
};
