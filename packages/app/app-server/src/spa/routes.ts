import type { Hono } from 'hono';
import path from 'node:path';

import { joinBasePath, normalizeBasePath } from '../support/paths.js';
import { injectSpaRuntimeHtml } from './runtime-html.js';
import { serveSpaIndex } from './serve-index.js';
import { serveSpaAsset } from './static-assets.js';
import type { RegisterSpaRoutesOptions, SpaClientConfigMap } from './types.js';

export function registerSpaRoutes(
  router: Hono,
  options: RegisterSpaRoutesOptions,
): void {
  const basePath = normalizeBasePath(options.basePath);
  const handler = options.handler;

  if (handler) {
    router.all(basePath || '/', (context) =>
      serveSpaHandler(context.req.raw, options),
    );
    router.all(`${basePath}/*`, (context) =>
      serveSpaHandler(context.req.raw, options),
    );
    return;
  }

  const rootDir = path.dirname(options.indexPath);
  const assetsRoutePath = joinBasePath(
    basePath,
    options.assetsPath ?? '/assets',
  );

  router.all(assetsRoutePath, (context) =>
    serveSpaAsset(context.req.raw, {
      rootDir,
      basePath,
    }),
  );
  router.all(`${assetsRoutePath}/*`, (context) =>
    serveSpaAsset(context.req.raw, {
      rootDir,
      basePath,
    }),
  );
  router.get(basePath || '/', () =>
    serveSpaIndex(options.indexPath, {
      clientConfig: options.clientConfig,
      publicConfig: resolvePublicConfig(options),
      publicBasePath: options.publicBasePath,
    }),
  );
  router.get(`${basePath}/*`, () =>
    serveSpaIndex(options.indexPath, {
      clientConfig: options.clientConfig,
      publicConfig: resolvePublicConfig(options),
      publicBasePath: options.publicBasePath,
    }),
  );
}

async function serveSpaHandler(
  request: Request,
  options: RegisterSpaRoutesOptions,
): Promise<Response> {
  let upstreamRequest = request;
  if (isSpaPageRequest(request, options)) {
    // The upstream validators describe HTML before runtime configuration is injected.
    const headers = new Headers(request.headers);
    headers.delete('if-none-match');
    headers.delete('if-modified-since');
    upstreamRequest = new Request(request, { headers });
  }
  const response = await options.handler?.(upstreamRequest);
  if (!response) {
    throw new Error('SPA handler is not configured.');
  }
  const contentType = response.headers.get('content-type')?.toLowerCase();
  if (!contentType?.includes('text/html')) {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.set('cache-control', 'no-cache');
  return new Response(
    request.method === 'HEAD'
      ? null
      : injectSpaRuntimeHtml(await response.text(), {
          clientConfig: options.clientConfig,
          publicConfig: resolvePublicConfig(options),
          publicBasePath: options.publicBasePath,
        }),
    { headers, status: response.status, statusText: response.statusText },
  );
}

function isSpaPageRequest(
  request: Request,
  options: RegisterSpaRoutesOptions,
): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const destination = request.headers.get('sec-fetch-dest');
  if (
    destination &&
    !['document', 'iframe', 'frame', 'empty'].includes(destination)
  ) {
    return false;
  }
  const url = new URL(request.url);
  // HTML can also be imported as a Vite module; those requests keep resource caching.
  if (
    ['html-proxy', 'import', 'raw', 'url', 'worker', 'sharedworker'].some(
      (name) => url.searchParams.has(name),
    )
  )
    return false;
  const basePath = normalizeBasePath(options.basePath);
  const pathname = url.pathname.slice(basePath.length) || '/';
  if (
    /^\/(?:@vite|@id|@fs)(?:\/|$)|^\/@react-refresh(?:\/|$)/u.test(pathname)
  ) {
    return false;
  }
  const assetsPath = normalizeBasePath(options.assetsPath ?? '/assets');
  if (pathname === assetsPath || pathname.startsWith(`${assetsPath}/`))
    return false;
  const extension = path.posix.extname(pathname).toLowerCase();
  if (extension && extension !== '.html') return false;
  const accept = request.headers.get('accept')?.toLowerCase();
  return !accept || accept.includes('text/html') || accept.includes('*/*');
}

function resolvePublicConfig(
  options: RegisterSpaRoutesOptions,
): SpaClientConfigMap | undefined {
  return typeof options.publicConfig === 'function'
    ? options.publicConfig()
    : options.publicConfig;
}
