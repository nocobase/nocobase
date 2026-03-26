import { NavMenuItemWithChildren } from "@rspress/core/dist/theme/components/Nav/NavMenu.js";
import { addLeadingSlash, normalizeHrefInRuntime, removeBase, useLocation, usePage, useSite, useVersion } from "@rspress/core/runtime";
import { locales } from "../locales";

function replaceLang(
  rawUrl: string,
  lang: {
    current: string;
    target: string;
    default: string;
  },
  version: {
    current: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = '/';
  }

  url = normalizeHrefInRuntime(url);

  let versionPart = '';
  let langPart = '';
  let purePathPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.current && version.current !== version.default) {
    versionPart = parts.shift() || '';
  }

  // Should we remove the lang part?
  // The answer is as follows:
  if (lang.target !== lang.default) {
    langPart = lang.target;
    if (lang.current !== lang.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  purePathPart = parts.join('/') || '';

  if ((versionPart || langPart) && !purePathPart) {
    purePathPart = cleanUrls ? 'index' : 'index.html';
  }

  return addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
  );
}

export function useLangsMenu() {
  const { page } = usePage();
  const { site } = useSite();
  const currentVersion = useVersion();
  const { pathname, search } = useLocation();
  const defaultLang = site.lang || '';
  const defaultVersion = site.multiVersion.default || '';
  const localeLanguages = locales;
  const cleanUrls = site.route?.cleanUrls || false;
  const hasMultiLanguage = localeLanguages.length > 1;
  const { lang: currentLang, pageType } = page;
  console.log(hasMultiLanguage, localeLanguages, currentLang, pageType);

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => {
          return {
            text: item?.label,
            link: replaceLang(
              pathname + search,
              {
                current: currentLang,
                target: item.code,
                default: defaultLang,
              },
              {
                current: currentVersion,
                default: defaultVersion,
              },
              cleanUrls,
              pageType === '404',
            ),
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

export function NavLangs() {
  const { items, activeValue } = useLangsMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ text: activeValue, items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}