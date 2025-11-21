import { ApplicationBundle } from '../../../types';

export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read file'));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file'));
    };
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number, language: 'ka' | 'en'): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return language === 'ka' ? 'უცნობია' : 'Unknown';
  }
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }
  const kilobytes = bytes / 1024;
  return `${kilobytes.toFixed(1)} KB`;
};

export const classNames = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const formatDateTime = (value: string, language: 'ka' | 'en') => {
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

export const formatDate = (value: string, language: 'ka' | 'en') => {
  const formatter = new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(value));
};

export const formatRemainingTime = (dueAt: string, language: 'ka' | 'en') => {
  const diff = new Date(dueAt).getTime() - Date.now();
  if (diff <= 0) {
    return language === 'ka' ? 'ვადა ამოიწურა' : 'Expired';
  }
  const totalMinutes = Math.round(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days) {
    parts.push(language === 'ka' ? `${days} დღე` : `${days}d`);
  }
  if (hours) {
    parts.push(language === 'ka' ? `${hours} სთ` : `${hours}h`);
  }
  if (!days && minutes) {
    parts.push(language === 'ka' ? `${minutes} წთ` : `${minutes}m`);
  }
  if (!parts.length) {
    return language === 'ka' ? '1 წთ-ზე ნაკლები დარჩა' : '<1m remaining';
  }
  return language === 'ka'
    ? `დარჩა ${parts.join(' ')}`
    : `${parts.join(' ')} remaining`;
};

export const getFieldValue = (bundle: ApplicationBundle, key: string): string | undefined => {
  return bundle.values.find((value) => value.key === key)?.value;
};

export const splitRange = (value?: string) => {
  if (!value) {
    return { start: '', end: '' };
  }
  const [start, end] = value.split('/');
  return { start: start ?? '', end: end ?? '' };
};
