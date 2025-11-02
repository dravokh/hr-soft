import { ApplicationStatus } from '../../../types';

export interface ApplicationsPageProps {
  language: 'ka' | 'en';
}

export interface AttachmentDraft {
  name: string;
  url: string;
  fromUpload?: boolean;
  sizeBytes?: number;
}

export type ApplicationFilters = {
  query: string;
  creatorId: number | 'all';
  status: ApplicationStatus | 'all';
  startDate: string;
  endDate: string;
};

export const createEmptyFilters = (): ApplicationFilters => ({
  query: '',
  creatorId: 'all',
  status: 'all',
  startDate: '',
  endDate: ''
});
