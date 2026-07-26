import React from 'react';
import { useRouter } from 'next/router';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/lib/i18n';

export function LanguageSwitcher() {
  const router = useRouter();
  const current = router.locale ?? 'en';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(router.pathname, router.asPath, { locale: e.target.value });
  };

  return (
    <label htmlFor="lang-switcher" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="visually-hidden">Language / Idioma</span>
      <select
        id="lang-switcher"
        value={current}
        onChange={handleChange}
        aria-label="Select language"
        style={{ fontSize: '0.875rem' }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_NAMES[lang]}
          </option>
        ))}
      </select>
    </label>
  );
}
