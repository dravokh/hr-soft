import { Language } from '../types';

/**
 * Formatting utilities for dates, times, file sizes, and CSS classes
 * Centralized to avoid duplication across components
 */

const getLocale = (language: Language): string => {
  if (language === 'ka') {
    return 'ka-GE';
  }

  if (language === 'tr') {
    return 'tr-TR';
  }

  return 'en-US';
};

const getUnknownLabel = (language: Language): string => {
  if (language === 'ka') {
    return 'უცნობია';
  }

  if (language === 'tr') {
    return 'Bilinmiyor';
  }

  return 'Unknown';
};

/**
 * Formats a date-time value for display
 */
export const formatDateTime = (value: string, language: Language): string => {
  if (!value) {
    return '—';
  }

  const formatter = new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  return formatter.format(new Date(value));
};

/**
 * Formats a date value (without time)
 */
export const formatDate = (value: string, language: Language): string => {
  if (!value) {
    return '—';
  }

  const formatter = new Intl.DateTimeFormat(getLocale(language), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(value));
};

/**
 * Formats file size in bytes to human-readable format (KB/MB)
 */
export const formatFileSize = (bytes: number, language: Language): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return getUnknownLabel(language);
  }

  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }
  
  const kilobytes = bytes / 1024;
  return `${kilobytes.toFixed(1)} KB`;
};

/**
 * Calculates and formats remaining time until a due date
 */
export const formatRemainingTime = (dueAt: string, language: Language): string => {
  const diff = new Date(dueAt).getTime() - Date.now();

  if (diff <= 0) {
    if (language === 'ka') {
      return 'ვადა ამოიწურა';
    }
    if (language === 'tr') {
      return 'Süresi doldu';
    }
    return 'Expired';
  }

  const totalMinutes = Math.round(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];

  if (days) {
    if (language === 'ka') {
      parts.push(`${days} დღე`);
    } else if (language === 'tr') {
      parts.push(`${days} gün`);
    } else {
      parts.push(`${days}d`);
    }
  }
  if (hours) {
    if (language === 'ka') {
      parts.push(`${hours} სთ`);
    } else if (language === 'tr') {
      parts.push(`${hours} sa`);
    } else {
      parts.push(`${hours}h`);
    }
  }
  if (!days && minutes) {
    if (language === 'ka') {
      parts.push(`${minutes} წთ`);
    } else if (language === 'tr') {
      parts.push(`${minutes} dk`);
    } else {
      parts.push(`${minutes}m`);
    }
  }

  if (!parts.length) {
    if (language === 'ka') {
      return '1 წთ-ზე ნაკლები დარჩა';
    }
    if (language === 'tr') {
      return '1 dk’dan az kaldı';
    }
    return '<1m remaining';
  }

  if (language === 'ka') {
    return `დარჩა ${parts.join(' ')}`;
  }
  if (language === 'tr') {
    return `${parts.join(' ')} kaldı`;
  }
  return `${parts.join(' ')} remaining`;
};

/**
 * Utility for combining CSS class names conditionally
 * Filters out falsy values and joins valid class names
 */
export const classNames = (...classes: (string | false | null | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Splits a date range string (format: "start/end") into start and end parts
 */
export const splitRange = (value?: string): { start: string; end: string } => {
  if (!value) {
    return { start: '', end: '' };
  }
  const [start, end] = value.split('/');
  return { start: start ?? '', end: end ?? '' };
};
