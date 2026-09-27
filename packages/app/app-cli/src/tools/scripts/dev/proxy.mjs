import { TLSSocket } from 'node:tls';

/**
 * PROXY_TARGET_URL names the remote application's public base, not its /api endpoint.
 * Validate it before dev hooks run so an invalid target cannot start a local backend.
 * @param {string | undefined} value
 * @returns {URL | undefined}
 */
export function parseProxyTarget(value) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  let target;
  try {
    target = new URL(normalized);
  } catch {
    throw new Error(
      'PROXY_TARGET_URL must be an absolute HTTP(S) application URL.',
    );
  }
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.search ||
    target.hash
  ) {
    throw new Error(
      'PROXY_TARGET_URL must be an HTTP(S) application URL without credentials, query, or fragment.',
    );
  }
  return target;
}

/**
 * Keep browser requests on the local Vite origin while mapping API and realtime
 * paths to the remote application, whose public base may differ from ours.
 * @param {string} appBase
 * @param {string | undefined} value
 * @returns {Record<string, import('vite').ProxyOptions> | undefined}
 */
export function createDevProxy(appBase, value) {
  const target = parseProxyTarget(value);
  if (!target) return undefined;
  const localPrefix = localPrefixOf(appBase);
  const remotePrefix = target.pathname.replace(/\/+$/, '');
  const escapedPrefix = localPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /**
   * Adapt browser requests from this local origin without making unrelated
   * origins trusted. Use the actual transport and Host, not forwarded headers.
   * @param {import('node:http').ClientRequest} proxyRequest
   * @param {import('node:http').IncomingMessage} request
   */
  const rewriteBrowserOrigin = (proxyRequest, request) => {
    const host = request.headers.host;
    if (!host) return;
    const protocol =
      request.socket instanceof TLSSocket && request.socket.encrypted
        ? 'https:'
        : 'http:';
    let localOrigin;
    try {
      localOrigin = new URL(`${protocol}//${host}`).origin;
    } catch {
      return;
    }
    const origin = request.headers.origin;
    if (origin !== undefined && origin !== localOrigin) return;
    if (origin !== undefined) proxyRequest.setHeader('origin', target.origin);

    // Better Auth can fall back to Referer when Origin is absent. Keep that
    // fallback on the same remote app without adding an Origin to the request.
    const referer = request.headers.referer;
    if (!referer) return;
    let refererUrl;
    try {
      refererUrl = new URL(referer);
    } catch {
      return;
    }
    if (refererUrl.origin !== localOrigin) return;
    if (
      refererUrl.pathname !== localPrefix &&
      !refererUrl.pathname.startsWith(localPrefix + '/')
    )
      return;
    proxyRequest.setHeader(
      'referer',
      target.origin +
        remotePrefix +
        refererUrl.pathname.slice(localPrefix.length) +
        refererUrl.search,
    );
  };
  /** @type {import('vite').ProxyOptions} */
  const options = {
    target: target.origin,
    changeOrigin: true,
    rewrite: (/** @type {string} */ requestPath) =>
      remotePrefix + requestPath.slice(localPrefix.length),
    // Remote cookie scopes must point at the browser's local application.
    cookieDomainRewrite: '',
    cookiePathRewrite: localPrefix + '/',
    configure(proxy) {
      proxy.on('proxyReq', rewriteBrowserOrigin);
      proxy.on('proxyReqWs', rewriteBrowserOrigin);
    },
  };
  return {
    [`^${escapedPrefix}/api(?=/|\\?|$)`]: { ...options },
    [`^${escapedPrefix}/ws(?=/|\\?|$)`]: { ...options, ws: true },
  };
}

/**
 * The same escaping `escapeScriptJson` in `@nocobase/app-server/spa` applies to the block it renders. It is repeated
 * here rather than imported: Vite loads this file under plain Node while resolving an application's `vite.config.ts`,
 * and in a source checkout `@nocobase/app-server` resolves to TypeScript that Node cannot load. `dev/index.mjs` can
 * import from it because `nocobase dev` runs under a loader that can.
 * @param {string} value
 * @returns {string}
 */
function escapeScriptJson(value) {
  return value
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * The local mount path as a URL prefix: `/crm` stays, and the origin root is `''`.
 * @param {string} appBase
 * @returns {string}
 */
function localPrefixOf(appBase) {
  const localBase = '/' + appBase.trim().replace(/^\/+|\/+$/g, '');
  return localBase === '/' ? '' : localBase;
}

const RUNTIME_CONFIG_PATTERN =
  /<script id="nocobase-runtime-config" type="application\/json">([\s\S]*?)<\/script>/u;

/**
 * In proxy mode no local application server renders the page, so the client configuration it would have rendered is
 * taken from the remote application's page instead. Only the mount path and the API URL are replaced, with the local
 * ones the proxy above serves; everything else — the public values included — is the remote server's.
 * @param {string} appBase
 * @param {string | undefined} value
 * @returns {import('vite').Plugin | undefined}
 */
export function createDevClientConfigPlugin(appBase, value) {
  const target = parseProxyTarget(value);
  if (!target) return undefined;
  const localPrefix = localPrefixOf(appBase);
  return {
    name: 'nocobase:dev-client-config',
    apply: 'serve',
    async transformIndexHtml() {
      const response = await fetch(target.href, {
        headers: { accept: 'text/html' },
      });
      // A redirect within the application, such as to its sign-in page, still lands on a page that carries the
      // configuration. One to another origin — an identity provider, a gateway's sign-in — does not, and the
      // developer needs to know where the request ended up rather than that the URL is wrong.
      const landed = new URL(response.url || target.href);
      if (landed.origin !== target.origin) {
        throw new Error(
          `${target.href} redirected to ${landed.href}, which is not the application. PROXY_TARGET_URL must name a NocoBase application's public URL that serves its page directly.`,
        );
      }
      if (!response.ok) {
        throw new Error(
          `${target.href} answered ${response.status}${response.statusText ? ` ${response.statusText}` : ''} instead of the application's page. Check that the application is running at PROXY_TARGET_URL.`,
        );
      }
      const match = RUNTIME_CONFIG_PATTERN.exec(await response.text());
      if (!match) {
        throw new Error(
          `${target.href} served no client configuration. PROXY_TARGET_URL must name a NocoBase application's public URL.`,
        );
      }
      const payload = JSON.parse(match[1]);
      const config = isRecord(payload.config) ? payload.config : {};
      payload.config = {
        ...config,
        app: {
          ...(isRecord(config.app) ? config.app : {}),
          basePath: localPrefix,
        },
        api: {
          ...(isRecord(config.api) ? config.api : {}),
          baseURL: `${localPrefix}/api`,
        },
      };
      return [
        {
          tag: 'script',
          attrs: { id: 'nocobase-runtime-config', type: 'application/json' },
          children: escapeScriptJson(JSON.stringify(payload)),
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
