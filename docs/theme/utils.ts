import { useLang, useSite } from "@rspress/runtime";

export function transformHref(href: string, lang?: string) {
  if (!lang) {
    return href;
  }
  if (lang === 'en' && !href.startsWith(`/${lang}/`)) {
    return href;
  }
  if (href.startsWith('/') && !href.startsWith(`/${lang}/`)) {
    return `/${lang}${href}`;
  }
  return href;
}

export const useLangPrefix = () => {
  const { site } = useSite();
  const lang = useLang();
  return lang === site.lang ? '' : lang;
}
