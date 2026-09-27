import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import { injectSpaRuntimeHtml, registerSpaRoutes } from '../src/spa/index.js';

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
