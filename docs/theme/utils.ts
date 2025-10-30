export function transformHref(href: string, lang: string) {
  if (href.startsWith('/') && !href.startsWith(`/${lang}/`)) {
    return `/${lang}${href}`;
  }
  return href;
}
