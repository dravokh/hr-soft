import React from 'react';
import { COPY } from '../constants';
import { classNames } from '../utils';

interface ApplicationTabsProps {
  language: 'ka' | 'en';
  activeTab: 'all' | 'pending' | 'sent' | 'returned';
  onTabChange: (tab: 'all' | 'pending' | 'sent' | 'returned') => void;
  counts: {
    all: number;
    pending: number;
    sent: number;
    returned: number;
  };
}

export const ApplicationTabs: React.FC<ApplicationTabsProps> = ({
  language,
  activeTab,
  onTabChange,
  counts
}) => {
  const t = COPY[language];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['all', 'pending', 'sent', 'returned'] as const).map((tab) => {
        const count = counts[tab];
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={classNames(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
              activeTab === tab
                ? 'bg-sky-100 text-sky-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {t.tabs[tab]}
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 shadow">{count}</span>
          </button>
        );
      })}
    </div>
  );
};
