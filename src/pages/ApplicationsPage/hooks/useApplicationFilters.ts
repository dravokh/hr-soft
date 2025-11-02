import { useMemo } from 'react';
import { ApplicationBundle, ApplicationType, User } from '../../../types';
import { ApplicationFilters } from '../types';
import { STATUS_META } from '../constants';
import { formatDateTime } from '../utils';

interface UseApplicationFiltersProps {
  applications: ApplicationBundle[];
  filters: ApplicationFilters;
  language: 'ka' | 'en';
  typeById: Map<number, ApplicationType>;
  userById: Map<number, User>;
}

export const useApplicationFilters = ({
  applications,
  filters,
  language,
  typeById,
  userById
}: UseApplicationFiltersProps) => {
  const filteredApplications = useMemo(() => {
    const sorted = [...applications].sort(
      (a, b) => new Date(b.application.updatedAt).getTime() - new Date(a.application.updatedAt).getTime()
    );

    const { query, creatorId, status, startDate, endDate } = filters;
    const normalizedQuery = query.trim().toLowerCase();

    const start = startDate ? new Date(startDate) : null;
    if (start) {
      start.setHours(0, 0, 0, 0);
    }
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return sorted.filter((bundle) => {
      if (creatorId !== 'all' && bundle.application.requesterId !== creatorId) {
        return false;
      }

      if (status !== 'all' && bundle.application.status !== status) {
        return false;
      }

      const createdAt = new Date(bundle.application.createdAt);
      if (start && createdAt < start) {
        return false;
      }

      if (end && createdAt > end) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const number = bundle.application.number.toLowerCase();
      if (number.includes(normalizedQuery)) {
        return true;
      }

      const type = typeById.get(bundle.application.typeId);
      const requester = userById.get(bundle.application.requesterId);
      const statusMeta = STATUS_META[bundle.application.status];

      const typeName = type?.name[language]?.toLowerCase() ?? '';
      const typeDescription = type?.description[language]?.toLowerCase() ?? '';
      if (typeName.includes(normalizedQuery) || typeDescription.includes(normalizedQuery)) {
        return true;
      }

      const requesterName = requester?.name?.toLowerCase() ?? '';
      if (requesterName.includes(normalizedQuery)) {
        return true;
      }

      const statusLabel = statusMeta.label[language].toLowerCase();
      if (statusLabel.includes(normalizedQuery) || bundle.application.status.toLowerCase().includes(normalizedQuery)) {
        return true;
      }

      const created = formatDateTime(bundle.application.createdAt, language).toLowerCase();
      const updated = formatDateTime(bundle.application.updatedAt, language).toLowerCase();
      if (created.includes(normalizedQuery) || updated.includes(normalizedQuery)) {
        return true;
      }

      return false;
    });
  }, [applications, filters, language, typeById, userById]);

  return { filteredApplications };
};
