import { isRTL, getDir, SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/lib/i18n';

describe('i18n', () => {
  it('supports 8 languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
  });

  it('Arabic is RTL', () => {
    expect(isRTL('ar')).toBe(true);
    expect(getDir('ar')).toBe('rtl');
  });

  it('other languages are LTR', () => {
    const ltr = ['en', 'es', 'fr', 'pt', 'de', 'zh', 'hi'];
    ltr.forEach((lang) => {
      expect(isRTL(lang)).toBe(false);
      expect(getDir(lang)).toBe('ltr');
    });
  });

  it('returns ltr for unknown language', () => {
    expect(isRTL('xx')).toBe(false);
    expect(getDir('xx')).toBe('ltr');
  });

  it('has display names for all supported languages', () => {
    SUPPORTED_LANGUAGES.forEach((lang) => {
      expect(LANGUAGE_NAMES[lang]).toBeTruthy();
    });
  });

  it('Arabic display name is in Arabic script', () => {
    expect(LANGUAGE_NAMES['ar']).toContain('ع');
  });

  it('Chinese display name is in Chinese script', () => {
    expect(LANGUAGE_NAMES['zh']).toContain('中');
  });

  it('Hindi display name is in Devanagari', () => {
    expect(LANGUAGE_NAMES['hi']).toContain('ह');
  });
});
