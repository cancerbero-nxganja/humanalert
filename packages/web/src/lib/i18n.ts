export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar', 'pt', 'de', 'zh', 'hi'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang as SupportedLanguage);
}

export function getDir(lang: string): 'ltr' | 'rtl' {
  return isRTL(lang) ? 'rtl' : 'ltr';
}

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ar: 'العربية',
  pt: 'Português',
  de: 'Deutsch',
  zh: '中文',
  hi: 'हिन्दी',
};
