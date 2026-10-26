/**
 * The languages the site is built in. A source directory under `docs/<key>/` is only built when its key is listed
 * here, and the key stays the source directory name even where the public URL differs: `cn` is served from `/zh-CN/`.
 */
export interface DocsLanguage {
  /** Source directory under `docs/` and translation key. */
  key: string;
  /** Public URL base, always with a leading and a trailing slash. */
  base: string;
  /** `lang` attribute of the HTML document and `hreflang` value of its alternates. */
  htmlLang: string;
  hreflang: string;
  /** Name shown in the language menu, written in the language itself. */
  label: string;
  siteTitle: string;
  siteDescription: string;
}

export const LANGUAGES: readonly DocsLanguage[] = [
  {
    key: 'en',
    base: '/',
    htmlLang: 'en',
    hreflang: 'en-US',
    label: 'English',
    siteTitle: 'NocoBase Documentation',
    siteDescription: 'Learn and master NocoBase quickly',
  },
  {
    key: 'cn',
    base: '/zh-CN/',
    htmlLang: 'zh-CN',
    hreflang: 'zh-CN',
    label: '简体中文',
    siteTitle: 'NocoBase 文档',
    siteDescription: '快速学习和掌握 NocoBase',
  },
  {
    key: 'vi',
    base: '/vi/',
    htmlLang: 'vi',
    hreflang: 'vi-VN',
    label: 'Tiếng Việt',
    siteTitle: 'Tài liệu NocoBase',
    siteDescription: 'Học và làm chủ NocoBase nhanh chóng',
  },
];

/** The language `x-default` points at and the one served from the site root. */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Pick the value for a language from a map keyed by language key, falling back to the default language. Every
 * per-language choice in the site (component copy, UI strings) goes through this instead of comparing keys, so adding a
 * language means adding an entry to each map rather than editing conditions.
 */
export function pickLanguage<T>(
  byLanguage: Readonly<Record<string, T>>,
  language: string,
): T {
  const value = byLanguage[language] ?? byLanguage[DEFAULT_LANGUAGE];
  if (value === undefined)
    throw new Error(`No value for language ${language} or ${DEFAULT_LANGUAGE}`);
  return value;
}

export function getLanguage(key: string): DocsLanguage {
  const language = LANGUAGES.find((candidate) => candidate.key === key);
  if (!language) throw new Error(`Unknown documentation language: ${key}`);
  return language;
}

/** Public URL base; source directories and translation keys keep their existing names. */
export function languageBase(language: string): string {
  const known = LANGUAGES.find((candidate) => candidate.key === language);
  if (known) return known.base;
  return `/${language}/`;
}

/**
 * Prefix a language-neutral route (`/capabilities/file`, `/capabilities/auth/`, `/`) with the language base. The
 * route keeps its trailing slash or lack of one, which is what makes the public URL of every page stable.
 */
export function localizePath(language: string, route: string): string {
  return languageBase(language) + route.replace(/^\//, '');
}

/** The inverse of `localizePath`: the language a public path belongs to and its language-neutral route. */
export function splitLocalizedPath(pathname: string): {
  language: string;
  route: string;
} {
  for (const language of LANGUAGES) {
    if (language.base === '/') continue;
    const prefix = language.base.slice(0, -1);
    if (pathname === prefix || pathname.startsWith(language.base)) {
      return {
        language: language.key,
        route: '/' + pathname.slice(language.base.length),
      };
    }
  }
  return { language: DEFAULT_LANGUAGE, route: pathname || '/' };
}
