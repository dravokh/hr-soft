/**
 * Formatting utilities for dates, times, file sizes, and CSS classes
 * Centralized to avoid duplication across components
 */

/**
 * Formats a date-time value for display
 */
export const formatDateTime = (value: string, language: 'ka' | 'en'): string => {
  if (!value) {
    return language === 'ka' ? '—' : '—';
  }

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

/**
 * Formats a date value (without time)
 */
export const formatDate = (value: string, language: 'ka' | 'en'): string => {
  if (!value) {
    return language === 'ka' ? '—' : '—';
  }

  const formatter = new Intl.DateTimeFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date(value));
};

/**
 * Formats file size in bytes to human-readable format (KB/MB)
 */
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

/**
 * Calculates and formats remaining time until a due date
 */
export const formatRemainingTime = (dueAt: string, language: 'ka' | 'en'): string => {
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
