/** Resolve known Studio record links without requiring generated Markdown to know the deployment base path. */
export function chatLinkTo(
  href: string | undefined,
  basePath: string,
  origin: string,
): string | null {
  // Leave document-relative links, fragments and non-HTTP schemes to the Markdown renderer.
  if (!href || !/^(?:\/|https?:\/\/)/iu.test(href) || href.includes('\\'))
    return null;
  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  if (url.origin !== origin || url.username || url.password) return null;
  const base = basePath.replace(/\/+$/u, '');
  const pathname =
    base && url.pathname.startsWith(`${base}/`)
      ? url.pathname.slice(base.length)
      : url.pathname;
  // Do not reinterpret other applications, API endpoints or arbitrary same-origin documents as Studio pages.
  if (!/^\/(?:issues|projects)(?:\/|$)/u.test(pathname)) return null;
  return `${pathname}${url.search}${url.hash}`;
}
