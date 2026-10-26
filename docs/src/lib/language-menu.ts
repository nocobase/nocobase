import { getLanguage, LANGUAGES } from '../../shared/languages.ts';
import { uiText } from './ui-text.ts';

export interface LanguageLink {
  language: string;
  /** Public path of the same page in that language, or of that language's home page when it has no translation. */
  href: string;
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The language menu every header carries, as HTML. The headers are static markup shared with the hand-built pages,
 * which mark the menu's place with `<span class="language">…</span>`; `withLanguageMenu` puts the menu there.
 * `src/scripts/language-menu.ts` closes it on an outside click or Escape and keeps the reader's query and fragment
 * when they switch.
 */
export function languageMenu(
  current: string,
  links: readonly LanguageLink[],
): string {
  const { label, key } = getLanguage(current);
  const text = uiText(key);
  const items = LANGUAGES.map((language) => {
    const href =
      links.find((link) => link.language === language.key)?.href ??
      language.base;
    return language.key === current
      ? `<span lang="${language.htmlLang}" aria-current="page">${language.label}</span>`
      : `<a href="${escapeAttribute(href)}" lang="${language.htmlLang}" hreflang="${language.hreflang}" rel="alternate" data-keep-location>${language.label}</a>`;
  }).join('');
  return `<details class="docs-language-menu"><summary aria-label="${text.changeLanguage}">${label}</summary><nav aria-label="${text.languages}">${items}</nav></details>`;
}

export function withLanguageMenu(
  markup: string,
  current: string,
  links: readonly LanguageLink[],
): string {
  return markup.replace(
    /<span class="language">[^<]*<\/span>/,
    languageMenu(current, links),
  );
}
