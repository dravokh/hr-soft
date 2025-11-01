import React from 'react';

interface ProfilePageProps {
  language: 'ka' | 'en';
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ language }) => {
  return (
    <div className="text-center py-20">
      <h1 className="text-2xl font-bold text-slate-800">{language === 'ka' ? 'ჩემი გვერდი' : 'My Profile'}</h1>
      <p className="text-slate-600 mt-2">{language === 'ka' ? 'პროფილის გვერდი მალე დაემატება' : 'Profile page coming soon.'}</p>
    </div>
  );
};
