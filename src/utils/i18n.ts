import { LANGUAGE_SWITCH_FEATURE_ENABLED } from '../config/features';
import { Language, LocalizedValue } from '../types';

export type LocalizedMap<T> = Record<'ka', T> & Record<'en', T> & Partial<Record<'tr', T>>;

export const DEFAULT_LANGUAGE: Language = 'ka';

export const AVAILABLE_LANGUAGES: Language[] = LANGUAGE_SWITCH_FEATURE_ENABLED
  ? ['ka', 'en', 'tr']
  : ['ka', 'en'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  ka: 'ქართული',
  en: 'English',
  tr: 'Türkçe'
};

export const getLocalizedValue = <T>(value: LocalizedValue<T>, language: Language): T => {
  if (language === 'ka') {
    return value.ka;
  }

  if (language === 'tr' && value.tr !== undefined) {
    return value.tr;
  }

  return value.en;
};

export const getLocalizedEntry = <T>(map: LocalizedMap<T>, language: Language): T => {
  if (language === 'tr' && map.tr) {
    return map.tr;
  }

  const fallbackLanguage: Exclude<Language, 'tr'> = language === 'tr' ? 'en' : language;
  return map[fallbackLanguage];
};

export const resolveLanguageKey = (language: Language): 'ka' | 'en' => {
  return language === 'tr' ? 'en' : language;
};


