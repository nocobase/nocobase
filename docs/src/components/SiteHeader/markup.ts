import { pickLanguage } from '../../../shared/languages.ts';
import {
  type LanguageLink,
  withLanguageMenu,
} from '../../lib/language-menu.ts';
import cn from './header.cn.json';
import en from './header.en.json';
import vi from './header.vi.json';

/**
 * The header markup with its language menu. The capability overviews were designed with this markup inside their own
 * container and style it themselves, so they place it there instead of using the `SiteHeader` component.
 */
export function headerMarkup(
  language: string,
  languageLinks: readonly LanguageLink[],
): string {
  return withLanguageMenu(
    pickLanguage({ cn, en, vi }, language),
    language,
    languageLinks,
  );
}
