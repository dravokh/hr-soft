import React from 'react';
import { ApplicationStatus } from '../../../types';
import { STATUS_META } from '../constants';
import { classNames } from '../utils';

interface StatusBadgeProps {
  status: ApplicationStatus;
  language: 'ka' | 'en';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, language, className }) => {
  const meta = STATUS_META[status];

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        meta.color,
        className
      )}
    >
      {meta.icon}
      {meta.label[language]}
    </span>
  );
};
