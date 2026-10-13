import { useEffect } from 'react';
import { removeBase, useLang, useLocation } from '@rspress/core/runtime';
import { locales } from '../../locales';
import './index.scss';

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Add the same language menu to all three static header layouts. */
export function useLanguageMenu(markup: string) {
  const lang = useLang();
  const { pathname, search, hash } = useLocation();
  // Only offer languages with documentation in this repository.
  const languages = locales.filter(
    ({ code }) => code === 'en' || code === 'cn',
  );
  const pagePath = removeBase(pathname);
  const label = languages.find(({ code }) => code === lang)?.label ?? 'English';
  const items = languages
    .map(({ code, label }) => {
      const href = `${code === 'en' ? '' : `/${code}`}${pagePath || '/'}${search}${hash}`;
      const htmlLang = code === 'cn' ? 'zh-CN' : code;
      return code === lang
        ? `<span lang="${htmlLang}" aria-current="page">${label}</span>`
        : `<a href="${escapeAttribute(href)}" lang="${htmlLang}" hreflang="${htmlLang}" rel="alternate">${label}</a>`;
    })
    .join('');

  useEffect(() => {
    const close = (event: MouseEvent | KeyboardEvent) => {
      document
        .querySelectorAll<HTMLDetailsElement>('.docs-language-menu[open]')
        .forEach((menu) => {
          if (event instanceof KeyboardEvent) {
            if (event.key !== 'Escape') return;
            menu.querySelector('summary')?.focus();
          } else if (
            event.target instanceof Node &&
            menu.contains(event.target)
          ) {
            return;
          }
          menu.open = false;
        });
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, []);

  return markup.replace(
    /<span class="language">[^<]*<\/span>/,
    `<details class="docs-language-menu"><summary aria-label="${lang === 'cn' ? '切换语言' : 'Change language'}">${label}</summary><nav aria-label="${lang === 'cn' ? '语言' : 'Languages'}">${items}</nav></details>`,
  );
}
