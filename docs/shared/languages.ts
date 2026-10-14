/** Public URL base; source directories and translation keys keep their existing names. */
export function languageBase(language: string): string {
  if (language === 'en') return '/';
  return `/${language === 'cn' ? 'zh-CN' : language}/`;
}
