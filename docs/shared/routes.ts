/**
 * How a source file under `docs/<lang>/` becomes a public URL. These rules are what keep every URL the Rspress site
 * published unchanged:
 *
 * - `x/index.md` is served at `/x/`, with a trailing slash;
 * - `x.md` is served at `/x`, without one;
 * - the home page `index.md` is served at `/`.
 *
 * Both shapes are emitted as `x/index.html`, which is what the CDN's back-to-origin rules expect.
 */

const MARKDOWN_EXTENSION = /\.mdx?$/;

/** `capabilities/auth/index.mdx` -> `/capabilities/auth/`, `capabilities/file.md` -> `/capabilities/file`. */
export function sourceToRoute(relativePath: string): string {
  const withoutExtension = relativePath
    .replace(/\\/g, '/')
    .replace(MARKDOWN_EXTENSION, '');
  if (withoutExtension === 'index') return '/';
  if (withoutExtension.endsWith('/index'))
    return `/${withoutExtension.slice(0, -'index'.length)}`;
  return `/${withoutExtension}`;
}

/**
 * The path of the page's Markdown copy, which the Rspress llms plugin published next to every page and which
 * `llms.txt` links to: `/capabilities/auth/` -> `/capabilities/auth/index.md`, `/capabilities/file` ->
 * `/capabilities/file.md`, `/` -> `/index.md`.
 */
export function routeToMarkdownPath(route: string): string {
  return route.endsWith('/') ? `${route}index.md` : `${route}.md`;
}

/** Strip the trailing slash so that `/x` and `/x/` compare equal; `/` stays `/`. */
export function routeKey(route: string): string {
  return route === '/' ? '/' : route.replace(/\/+$/, '');
}

export function isMarkdownFile(file: string): boolean {
  return MARKDOWN_EXTENSION.test(file);
}
