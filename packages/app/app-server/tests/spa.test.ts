import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { injectSpaRuntimeHtml, registerSpaRoutes } from '../src/spa/index.js';
import type { SpaClientConfigMap } from '../src/spa/types.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('SPA runtime HTML', () => {
  it('injects a safe versioned Client config data block', () => {
    const html = '<script type="module" src="/assets/index.js"></script>';
    const result = injectSpaRuntimeHtml(html, {
      clientConfig: {
        title: '</script><script>alert(1)</script>',
        separators: '\u2028\u2029',
      },
    });

    expect(result).toContain(
      '<script id="nocobase-runtime-config" type="application/json">',
    );
    expect(result).toContain('"version":1');
    expect(result).toContain('\\u003C/script\\u003E');
    expect(result).toContain('\\u2028\\u2029');
    expect(result.indexOf('nocobase-runtime-config')).toBeLessThan(
      result.indexOf('<script type="module"'),
    );
  });

  it('points relative URLs at the mount path', () => {
    const html = [
      '<link rel="icon" href="./assets/favicon.ico" />',
      // A file at the root of `public/`, which a relative base writes as `./favicon.svg`.
      '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />',
      '<link rel="manifest" href="./manifest.webmanifest" />',
      '<meta property="og:image" content="./assets/logo.png" />',
      '<link rel="stylesheet" crossorigin href="./assets/index.css">',
      "<script type='module' src='./assets/index.js'></script>",
      '<a href="./settings">Settings</a>',
      '<a href="../outside">Outside</a>',
      '<img src="https://cdn.example.com/assets/a.png">',
      '<img src="/absolute/assets/b.png">',
    ].join('');

    const mounted = injectSpaRuntimeHtml(html, { publicBasePath: '/crm/' });

    expect(mounted).toContain('href="/crm/assets/favicon.ico"');
    expect(mounted).toContain('href="/crm/favicon.svg"');
    expect(mounted).toContain('href="/crm/manifest.webmanifest"');
    expect(mounted).toContain('content="/crm/assets/logo.png"');
    expect(mounted).toContain('href="/crm/assets/index.css"');
    expect(mounted).toContain("src='/crm/assets/index.js'");
    // The page is served for every route under the mount path, so a relative link in it means the mount path too.
    expect(mounted).toContain('href="/crm/settings"');
    // Only `./` is the build's spelling; anything else is left as written.
    expect(mounted).toContain('href="../outside"');
    expect(mounted).toContain('src="https://cdn.example.com/assets/a.png"');
    expect(mounted).toContain('src="/absolute/assets/b.png"');

    const atRoot = injectSpaRuntimeHtml(html, { publicBasePath: '' });
    expect(atRoot).toContain('href="/assets/favicon.ico"');
    expect(atRoot).toContain('href="/favicon.svg"');
  });

  it('leaves relative URLs alone without a mount path', () => {
    const html = '<script type="module" src="./assets/index.js"></script>';

    expect(injectSpaRuntimeHtml(html)).toContain('src="./assets/index.js"');
  });

  it('uses en-US when the configured HTML language is invalid', () => {
    const withInvalidLocale = injectSpaRuntimeHtml(
      '<html lang="en-US"><body></body></html>',
      {
        clientConfig: {
          i18n: { defaultLocale: 'en-US" onload="alert(1)' },
        },
      },
    );

    expect(withInvalidLocale.match(/<html[^>]*>/)?.[0]).toBe(
      '<html lang="en-US">',
    );
  });
});

describe('SPA routes', () => {
  it('serves assets before the SPA fallback', async () => {
    const root = createSpaFixture();
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main/test',
      indexPath: path.join(root, 'index.html'),
    });

    const response = await router.request(
      'http://localhost/main/test/assets/index.js',
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'text/javascript; charset=utf-8',
    );
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
    await expect(response.text()).resolves.toBe('console.log("asset");');
  });

  it('resolves the built index against the mount path on a deep route', async () => {
    const root = createSpaFixture(
      '<html lang="en-US"><script type="module" src="./assets/index.js"></script></html>',
    );
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/crm',
      publicBasePath: '/crm',
      indexPath: path.join(root, 'index.html'),
    });

    const html = await (
      await router.request('http://localhost/crm/admin/users/42')
    ).text();

    expect(html).toContain('<script type="module" src="/crm/assets/index.js">');
  });

  it('returns the runtime-injected index for SPA routes', async () => {
    const root = createSpaFixture();
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main/test',
      indexPath: path.join(root, 'index.html'),
      clientConfig: {
        app: { title: 'NocoBase' },
        i18n: { defaultLocale: 'zh-CN' },
      },
    });

    const response = await router.request(
      'http://localhost/main/test/settings',
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    // The configuration block is the client's only source of runtime values; nothing is put on `window`.
    expect(html).not.toContain('window.');
    expect(html).toContain('"app":{"title":"NocoBase"}');
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain(
      '<script type="module" src="/main/test/assets/index.js"></script>',
    );
  });

  it('injects the same runtime payload into proxied development HTML only', async () => {
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main/test',
      indexPath: '/unused/index.html',
      clientConfig: {
        feature: { enabled: true },
        i18n: { defaultLocale: 'ja-JP' },
      },
      handler: (request) =>
        new URL(request.url).pathname.endsWith('.js')
          ? new Response('export default true;', {
              headers: { 'content-type': 'text/javascript' },
            })
          : new Response(
              '<html lang="en-US"><script type="module" src="/src/main.tsx"></script></html>',
              {
                headers: { 'content-type': 'text/html; charset=utf-8' },
              },
            ),
    });

    const htmlResponse = await router.request(
      'http://localhost/main/test/settings',
    );
    const assetResponse = await router.request(
      'http://localhost/main/test/src/main.js',
    );

    await expect(htmlResponse.text()).resolves.toContain('<html lang="ja-JP">');
    await expect(assetResponse.text()).resolves.toBe('export default true;');
  });

  it('does not return the SPA index for missing assets', async () => {
    const root = createSpaFixture();
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main/test',
      indexPath: path.join(root, 'index.html'),
    });

    const response = await router.request(
      'http://localhost/main/test/assets/missing.js',
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Not found',
    });
  });
});

describe('proxied SPA cache validators', () => {
  const etag = 'W/"upstream-html"';
  const lastModified = 'Wed, 01 Jan 2025 00:00:00 GMT';
  const conditionalHeaders = {
    'if-none-match': etag,
    'if-modified-since': lastModified,
  };

  it.each([
    { 'if-none-match': etag },
    { 'if-modified-since': lastModified },
    conditionalHeaders,
  ])(
    'refreshes public configuration with old validators %j',
    async (conditions) => {
      let publicConfig: SpaClientConfigMap = {
        app: { version: 'fixture-old', displayName: 'Old application' },
        i18n: { defaultLocale: 'en-US' },
      };
      const handler = vi.fn((request: Request) => {
        if (
          request.headers.has('if-none-match') ||
          request.headers.has('if-modified-since')
        ) {
          return new Response(null, { status: 304 });
        }
        return new Response('<html lang="en-US"><body>page</body></html>', {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'content-length': '53',
            etag,
            'last-modified': lastModified,
          },
        });
      });
      const router = new Hono();
      registerSpaRoutes(router, {
        basePath: '/main',
        indexPath: '/unused',
        handler,
        publicConfig: () => publicConfig,
      });
      const url = 'http://localhost/main/settings';
      const first = await router.request(url);
      expect(await first.text()).toContain('fixture-old');
      publicConfig = {
        app: { version: 'fixture-new', displayName: 'New application' },
        i18n: { defaultLocale: 'zh-CN' },
      };
      const request = new Request(url, {
        headers: { ...conditions, accept: 'text/html', 'x-test': 'preserved' },
      });
      const response = await router.request(request);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-cache');
      for (const header of ['etag', 'last-modified', 'content-length']) {
        expect(response.headers.has(header)).toBe(false);
      }
      const html = await response.text();
      expect(html).toContain('"version":"fixture-new"');
      expect(html).toContain('"displayName":"New application"');
      expect(html).toContain('<html lang="zh-CN">');
      const upstream = handler.mock.calls.at(-1)![0];
      expect(upstream.headers.get('x-test')).toBe('preserved');
      expect(upstream.url).toBe(request.url);
      expect(request.headers.get('if-none-match')).toBe(
        conditions['if-none-match'] ?? null,
      );
    },
  );

  it.each([
    ['/main', undefined],
    ['/main/', '*/*'],
    ['/main/admin/users/42?tab=profile', undefined],
    ['/main/admin/users/42', '*/*'],
    ['/main/index.html?fresh=1', '*/*'],
    ['/main/reports.html', 'text/html,application/xhtml+xml'],
    ['/', undefined],
    ['/admin/users/42', 'text/html'],
  ])(
    'removes validators from page %s accepting %s',
    async (pathname, accept) => {
      const handler = vi.fn<(request: Request) => Response>(
        () =>
          new Response('<html></html>', {
            headers: { 'content-type': 'text/html' },
          }),
      );
      const router = new Hono();
      registerSpaRoutes(router, {
        basePath: pathname.startsWith('/main') ? '/main' : '',
        indexPath: '/unused',
        handler,
      });
      const response = await router.request(`http://localhost${pathname}`, {
        headers: { ...conditionalHeaders, ...(accept ? { accept } : {}) },
      });
      expect(response.status).toBe(200);
      const upstream = handler.mock.calls[0]![0];
      expect(upstream.headers.has('if-none-match')).toBe(false);
      expect(upstream.headers.has('if-modified-since')).toBe(false);
    },
  );

  it('returns HTML HEAD headers without injecting a body', async () => {
    const handler = vi.fn<(request: Request) => Response>(
      () =>
        new Response(null, {
          headers: {
            'content-type': 'text/html',
            etag,
            'last-modified': lastModified,
          },
        }),
    );
    const publicConfig = vi.fn(() => ({ app: { version: 'fixture' } }));
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main',
      indexPath: '/unused',
      handler,
      publicConfig,
    });
    const response = await router.request('http://localhost/main/', {
      method: 'HEAD',
      headers: conditionalHeaders,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.has('etag')).toBe(false);
    expect(response.headers.has('last-modified')).toBe(false);
    await expect(response.text()).resolves.toBe('');
    expect(publicConfig).not.toHaveBeenCalled();
    const upstream = handler.mock.calls[0]![0];
    expect(upstream.method).toBe('HEAD');
    expect(upstream.headers.has('if-none-match')).toBe(false);
    expect(upstream.headers.has('if-modified-since')).toBe(false);
  });

  it.each([
    ['/src/main.js', '*/*', ''],
    ['/src/main.tsx', 'text/html', ''],
    ['/src/style.css', '*/*', ''],
    ['/favicon.svg', '*/*', ''],
    ['/@vite/client', '*/*', ''],
    ['/@react-refresh', undefined, ''],
    ['/@id/virtual:client', '*/*', ''],
    ['/@fs/source/module', '*/*', ''],
    ['/assets/extensionless', '*/*', ''],
    ['/index.html?html-proxy&index=0.js', '*/*', ''],
    ['/index.html?import', '*/*', ''],
    ['/index.html?raw', '*/*', ''],
    ['/module?url', '*/*', ''],
    ['/module?worker', '*/*', ''],
    ['/module?sharedworker', '*/*', ''],
    ['/extensionless', '*/*', 'script'],
    ['/extensionless', '*/*', 'style'],
    ['/extensionless', 'application/json', ''],
  ])(
    'preserves resource caching for %s',
    async (pathname, accept, destination) => {
      const handler = vi.fn(
        (request: Request) =>
          new Response(
            request.headers.has('if-none-match') ? null : 'resource',
            {
              status: request.headers.has('if-none-match') ? 304 : 200,
              headers: {
                etag,
                'last-modified': lastModified,
                'content-length': '8',
              },
            },
          ),
      );
      const router = new Hono();
      registerSpaRoutes(router, {
        basePath: '/main',
        indexPath: '/unused',
        handler,
      });
      const url = `http://localhost/main${pathname}`;
      const initial = await router.request(url);
      expect(initial.headers.get('etag')).toBe(etag);
      expect(initial.headers.get('last-modified')).toBe(lastModified);
      expect(initial.headers.get('content-length')).toBe('8');
      await expect(initial.text()).resolves.toBe('resource');
      const request = new Request(url, {
        headers: {
          ...conditionalHeaders,
          ...(accept ? { accept } : {}),
          ...(destination ? { 'sec-fetch-dest': destination } : {}),
        },
      });
      const response = await router.request(request);
      expect(response.status).toBe(304);
      expect(handler.mock.calls.at(-1)![0]).toBe(request);
      expect(response.headers.get('etag')).toBe(etag);
      expect(response.headers.get('last-modified')).toBe(lastModified);
    },
  );

  it('preserves non-page request bodies and validators', async () => {
    const handler = vi.fn(
      async (request: Request) => new Response(await request.text()),
    );
    const router = new Hono();
    registerSpaRoutes(router, {
      basePath: '/main',
      indexPath: '/unused',
      handler,
    });
    const request = new Request('http://localhost/main/action', {
      method: 'POST',
      headers: conditionalHeaders,
      body: 'payload',
    });
    await expect((await router.request(request)).text()).resolves.toBe(
      'payload',
    );
    expect(handler.mock.calls[0]![0]).toBe(request);
  });
});

function createSpaFixture(
  index = '<html lang="en-US"><script type="module" src="/main/test/assets/index.js"></script></html>',
): string {
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-app-server-spa-'));
  tempDirs.push(root);
  mkdirSync(path.join(root, 'assets'));
  writeFileSync(rootPath(root, 'index.html'), index);
  writeFileSync(rootPath(root, 'assets/index.js'), 'console.log("asset");');
  return root;
}

function rootPath(root: string, pathInsideRoot: string): string {
  return path.join(root, pathInsideRoot);
}
