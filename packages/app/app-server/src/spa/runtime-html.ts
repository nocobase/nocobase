import type { SpaClientConfigMap } from './types.js';

const runtimeConfigElementId = 'nocobase-runtime-config';
const defaultHtmlLocale = 'en-US';
const defaultHtmlLocaleMarker = `<html lang="${defaultHtmlLocale}">`;

/**
 * Renders what the browser needs into the page: the `lang` attribute, the page's relative URLs pointed at the mount
 * path, and the client configuration data block, ahead of the entry module so that module-level code can already read it. Nothing
 * is put on `window`: the configuration block is the client's only source of runtime values.
 */
export function injectSpaRuntimeHtml(
  html: string,
  options: {
    readonly clientConfig?: SpaClientConfigMap;
    readonly publicConfig?: SpaClientConfigMap;
    /** The path the application is mounted at, such as `/crm`, or `''` at the origin root. */
    readonly publicBasePath?: string;
  } = {},
): string {
  const withUrls =
    options.publicBasePath === undefined
      ? html
      : resolveRelativeUrls(html, options.publicBasePath);
  // SPA templates provide this stable pre-runtime marker. The client keeps `lang` synchronized after it starts.
  const withLocale = withUrls.replace(
    defaultHtmlLocaleMarker,
    `<html lang="${escapeHtmlAttribute(readHtmlLocale(options.publicConfig ?? options.clientConfig))}">`,
  );
  const cleanHtml = stripExistingRuntimeConfig(withLocale);
  const configHtml = createSpaRuntimeConfigHtml(
    options.clientConfig ?? {},
    options.publicConfig,
  );
  const moduleScriptPattern = /<script\s+[^>]*type=["']module["'][^>]*>/i;
  const moduleScriptMatch = cleanHtml.match(moduleScriptPattern);
  if (moduleScriptMatch?.index === undefined) {
    return `${cleanHtml}\n${configHtml}`;
  }
  return `${cleanHtml.slice(0, moduleScriptMatch.index)}${configHtml}${cleanHtml.slice(moduleScriptMatch.index)}`;
}

/**
 * A build uses a relative base, so `index.html` names everything it references as `./…`: its entry chunk and
 * stylesheet under `./assets/`, and every file from `public/` at the path it has there, such as `./favicon.svg`. The
 * page is served for every route under the mount path, and against a deep route such as `/crm/admin/users` a
 * relative URL resolves to `/crm/admin/…`, so every `./` URL is pointed at the mount path here — `meta` content such
 * as `og:image` included, which Vite writes the same way. JavaScript chunks and CSS resolve against their own URLs and
 * need nothing.
 */
function resolveRelativeUrls(html: string, publicBasePath: string): string {
  const trimmed = publicBasePath.trim().replace(/^\/+|\/+$/g, '');
  const prefix = trimmed ? `/${trimmed}/` : '/';
  return html.replace(
    /(\s(?:src|href|content)\s*=\s*["'])\.\//giu,
    (_match, attribute: string) => `${attribute}${prefix}`,
  );
}

function readHtmlLocale(clientConfig: SpaClientConfigMap | undefined): string {
  const i18nConfig = clientConfig?.i18n;
  if (!isClientConfigMap(i18nConfig)) {
    return defaultHtmlLocale;
  }

  const configuredLocale = i18nConfig.defaultLocale;
  if (typeof configuredLocale !== 'string') {
    return defaultHtmlLocale;
  }

  const locale = configuredLocale.trim();
  if (!locale) {
    return defaultHtmlLocale;
  }

  try {
    Intl.getCanonicalLocales(locale);
    return locale;
  } catch {
    return defaultHtmlLocale;
  }
}

function isClientConfigMap(
  value: SpaClientConfigMap[string] | undefined,
): value is SpaClientConfigMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeScriptJson(value: string): string {
  return value
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function stripExistingRuntimeConfig(html: string): string {
  const pattern = new RegExp(
    `<script\\s+[^>]*id=["']${runtimeConfigElementId}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`,
    'gi',
  );
  return html.replace(pattern, '');
}

function createSpaRuntimeConfigHtml(
  config: SpaClientConfigMap,
  publicConfig: SpaClientConfigMap | undefined,
): string {
  return `<script id="${runtimeConfigElementId}" type="application/json">${escapeScriptJson(
    JSON.stringify(
      publicConfig === undefined
        ? { version: 1, config }
        : { version: 1, config, public: publicConfig },
    ),
  )}</script>\n`;
}
