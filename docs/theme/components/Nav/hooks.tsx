import {
  addLeadingSlash,
  normalizeHrefInRuntime,
  removeBase,
  useLocation,
  usePage,
  useSite,
  useVersion,
} from '@rspress/core/runtime';
import { locales } from '../../locales';

export function useLangsMenu() {
  const { page } = usePage();
  const { pathname } = useLocation();
  const { lang: currentLang } = page;
  const localeLanguages = locales;
  const hasMultiLanguage = localeLanguages.length > 1;

  // In single-language builds, removeBase strips the current base prefix
  // (e.g., /cn/) leaving the page-relative path (e.g., /ai/quick-start).
  // We then prepend the target language's base to build the correct URL.
  const pagePath = removeBase(pathname);

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => {
          const targetBase = item.code === 'en' ? '' : `/${item.code}`;
          return {
            text: item?.label,
            link: `${targetBase}${pagePath}` || '/',
            lang: item.code,
            rel: 'alternate',
          };
        }),
        activeValue: localeLanguages.find(item => currentLang === item.code)
          ?.label,
      }
    : { items: [] };
  return translationMenuData;
}

function replaceVersion(
  rawUrl: string,
  version: {
    current: string;
    target: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = normalizeHrefInRuntime('/');
  }
  let versionPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.target !== version.default) {
    versionPart = version.target;
    if (version.current !== version.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  let restPart = parts.join('/') || '';

  if (versionPart && !restPart) {
    restPart = cleanUrls ? 'index' : 'index.html';
  }

  return addLeadingSlash([versionPart, restPart].filter(Boolean).join('/'));
}

export function useVersionsMenu() {
  const { page } = usePage();
  const { site } = useSite();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const cleanUrls = site.route?.cleanUrls || false;
  const defaultVersion = site.multiVersion.default || '';
  const versions = site.multiVersion.versions || [];
  const versionsMenuData = {
    items: versions.map(version => ({
      text: version,
      link: replaceVersion(
        pathname,
        {
          current: currentVersion,
          target: version,
          default: defaultVersion,
        },
        cleanUrls,
        page.pageType === '404',
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return versionsMenuData;
}
