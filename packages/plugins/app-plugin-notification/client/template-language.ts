/**
 * The interface language when the template has it, otherwise a locale with the same base language, otherwise the
 * template's first locale.
 */
export function pickPreviewLocale(
  locales: readonly string[],
  interfaceLocale: string,
): string {
  const wanted = interfaceLocale.toLowerCase();
  const base = wanted.split('-')[0];
  return (
    locales.find((locale) => locale.toLowerCase() === wanted) ??
    locales.find((locale) => locale.toLowerCase().split('-')[0] === base) ??
    locales[0] ??
    'en-US'
  );
}

/** A locale code's name in the interface language, such as "Chinese (China)"; the code itself when unknown. */
export function languageName(code: string, displayLocale: string): string {
  try {
    return (
      new Intl.DisplayNames([displayLocale || 'en-US'], {
        type: 'language',
      }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

/** Language names joined the way the interface language lists things, such as "A, B and C" or "A、B和C". */
export function listLanguages(
  names: readonly string[],
  displayLocale: string,
): string {
  try {
    return new Intl.ListFormat([displayLocale || 'en-US'], {
      type: 'conjunction',
    }).format(names);
  } catch {
    return names.join(', ');
  }
}
