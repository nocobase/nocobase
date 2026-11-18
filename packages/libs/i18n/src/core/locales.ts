import type { Locale, LocaleDefinition, LocaleDirection } from './types.js';

const RTL_LANGUAGE_PATTERN = /^(ar|fa|he|ku|ur|yi)(-|$)/i;

export function getLocaleDirection(locale: Locale): LocaleDirection {
  return RTL_LANGUAGE_PATTERN.test(locale) ? 'rtl' : 'ltr';
}

/**
 * The locale's name in its own language, so a switcher reads "简体中文" rather than "Chinese" to someone looking for it.
 */
/**
 * The locale's name in its own language, as short as stays unambiguous.
 *
 * A language picker reads better as "中文" than "中文（中国）", so the region is dropped — unless another enabled locale
 * shares the same language, where "中文" would name both and the region is what tells them apart.
 */
export function getLocaleLabel(
  locale: Locale,
  siblings: readonly Locale[] = [],
): string {
  const language = locale.split('-')[0];
  const sharesLanguage = siblings.some(
    (candidate) => candidate !== locale && candidate.split('-')[0] === language,
  );

  try {
    const names = new Intl.DisplayNames([locale], { type: 'language' });
    if (!sharesLanguage) {
      const short = names.of(language);
      if (short && short !== language) return short;
    }
    return names.of(locale) ?? locale;
  } catch {
    return locale;
  }
}

export function describeLocale(
  locale: Locale,
  label?: string,
  siblings: readonly Locale[] = [],
): LocaleDefinition {
  return Object.freeze({
    locale,
    label: label ?? getLocaleLabel(locale, siblings),
    direction: getLocaleDirection(locale),
  });
}

/**
 * Resolves a requested locale against the ones an application enables.
 *
 * An exact match wins, then a match on the language subtag alone, so a browser asking for `zh` or `zh-Hans-CN` still
 * lands on a configured `zh-CN` instead of falling back to English. Returns `undefined` when nothing matches, leaving
 * the decision of what to do about it to the caller.
 */
export function resolveSupportedLocale(
  requested: Locale | undefined,
  supported: readonly Locale[],
): Locale | undefined {
  if (!requested) return undefined;

  const normalized = requested.toLowerCase();
  const exact = supported.find(
    (candidate) => candidate.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const language = normalized.split('-')[0];
  const sameLanguage = supported.filter(
    (candidate) => candidate.toLowerCase().split('-')[0] === language,
  );
  // Chinese is written in two scripts, so the language alone is not enough: a browser asking for zh-HK or
  // zh-Hant-TW reads Traditional characters and should land on a Traditional locale such as zh-TW, not zh-CN.
  if (language === 'zh' && sameLanguage.length > 1) {
    const traditional = isTraditionalChinese(normalized);
    const sameScript = sameLanguage.find(
      (candidate) =>
        isTraditionalChinese(candidate.toLowerCase()) === traditional,
    );
    if (sameScript) return sameScript;
  }
  return sameLanguage[0];
}

/** Whether a lower-case Chinese tag names Traditional script, explicitly (Hant) or by a region that uses it. */
function isTraditionalChinese(tag: string): boolean {
  const subtags = tag.split('-').slice(1);
  if (subtags.includes('hant')) return true;
  if (subtags.includes('hans')) return false;
  return subtags.some((subtag) => TRADITIONAL_CHINESE_REGIONS.has(subtag));
}

const TRADITIONAL_CHINESE_REGIONS = new Set(['tw', 'hk', 'mo']);

/**
 * Parses an `Accept-Language` header into the locales it lists, most preferred first.
 *
 * Entries with `q=0` are explicitly refused by the client and are dropped rather than ranked last.
 */
export function parseAcceptLanguage(header: string | undefined): Locale[] {
  if (!header) return [];

  return header
    .split(',')
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(';');
      const quality = parameters
        .map((parameter) => /^\s*q=([\d.]+)\s*$/.exec(parameter))
        .find((match) => match !== null);
      return {
        tag: tag.trim(),
        quality: quality ? Number(quality[1]) : 1,
      };
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.quality > 0)
    .sort((left, right) => right.quality - left.quality)
    .map((entry) => entry.tag);
}
