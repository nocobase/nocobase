import { resolveAppBase } from './client.js';

export interface InstallLinksOptions {
  /** The application's public base path; defaults to the one the server rendered into the page. */
  readonly basePath?: string;
  /**
   * The icon iOS and iPadOS put on the home screen: a path inside the application, such as `assets/pwa-192.png`, or
   * an absolute URL. Omit it to link only the manifest.
   */
  readonly appleTouchIcon?: string;
}

const ownerAttribute = 'data-nocobase-install';

/**
 * Link the manifest the server publishes at `<basePath>/manifest.webmanifest`, and the home-screen icon, into the
 * page's head so browsers offer installation. A page that already links its own manifest or icon keeps it. Calling it
 * again while its links are in place adds nothing; the returned function removes only the links this call added.
 */
export function mountInstallLinks(
  options: InstallLinksOptions = {},
): () => void {
  if (typeof document === 'undefined') return () => undefined;
  const base = normalizeBase(options.basePath ?? resolveAppBase());
  const added: HTMLLinkElement[] = [];
  const link = (rel: string, href: string): void => {
    if (document.head.querySelector(`link[rel="${rel}"]`)) return;
    const element = document.createElement('link');
    element.rel = rel;
    element.href = href;
    element.setAttribute(ownerAttribute, '');
    document.head.append(element);
    added.push(element);
  };
  link('manifest', `${base}manifest.webmanifest`);
  if (options.appleTouchIcon)
    link('apple-touch-icon', resolveInstallPath(base, options.appleTouchIcon));
  return () => {
    for (const element of added.splice(0)) element.remove();
  };
}

function normalizeBase(basePath: string): string {
  const trimmed = basePath.replace(/^\/+|\/+$/gu, '');
  return trimmed ? `/${trimmed}/` : '/';
}

function resolveInstallPath(base: string, path: string): string {
  return /^https?:\/\//iu.test(path)
    ? path
    : `${base}${path.replace(/^\/+/u, '')}`;
}
