import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import {
  AppConfig,
  defaultAppConfigs,
  type AppConfigFactory,
} from '../src/config/index.js';
import type { AppRuntimeContext } from '../src/runtime/definition.js';
import { createPublicBasePathAdapter } from '../src/runtime/mount.js';
import {
  createPwaRoutes,
  definePwaConfig,
  pwaManifest,
  registerSpaRoutes,
} from '../src/spa/index.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

async function createConfig(
  overrides: Record<string, unknown>,
  factories: Record<string, AppConfigFactory> = { pwa: definePwaConfig() },
): Promise<AppConfig> {
  const config = new AppConfig().load({
    name: 'test',
    read: async () => ({ kind: 'map', value: overrides }),
  });
  await config.loadAll();
  const defaults = defaultAppConfigs(factories);
  config.mergeDefaults(defaults({} as AppRuntimeContext));
  config.defineSections(defaults.sections!);
  return config;
}

/**
 * The application's root router as the template composes it, the manifest before the built SPA, mounted at the public
 * base path the way the runtime strips it before the application sees a request.
 */
async function createRouter(
  publicBasePath: string,
  overrides: Record<string, unknown> = {},
): Promise<{
  request(url: string, init?: RequestInit): Promise<Response>;
}> {
  const config = await createConfig({
    app: { publicBasePath, internalBasePath: '' },
    ...overrides,
  });
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-pwa-'));
  temporaryDirectories.push(root);
  writeFileSync(path.join(root, 'index.html'), '<main></main>', 'utf8');
  const router = new Hono();
  router.route(
    '/',
    await createPwaRoutes().createRouter({ config, publicBasePath }),
  );
  const spa = new Hono();
  registerSpaRoutes(spa, {
    basePath: '',
    publicBasePath,
    indexPath: path.join(root, 'index.html'),
  });
  router.route('/', spa);
  const site = createPublicBasePathAdapter(router, publicBasePath);
  return {
    request: async (url, init) => site.fetch(new Request(url, init)),
  };
}

describe('pwaManifest', () => {
  it('keeps the installed identity, start page and scope at the application root', () => {
    // The input an application passed to the earlier `pushManifest` and the exact output it relied on.
    expect(
      pwaManifest('/apps/studio', {
        name: 'NocoBase Studio',
        shortName: 'Studio',
        description: 'Studio',
        themeColor: '#002ad1',
        backgroundColor: '#ffffff',
        icons: [
          { src: '/assets/pwa-192.png', sizes: '192x192', type: 'image/png' },
          {
            src: 'assets/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      }),
    ).toEqual({
      id: '/apps/studio/',
      name: 'NocoBase Studio',
      short_name: 'Studio',
      description: 'Studio',
      start_url: '/apps/studio/',
      scope: '/apps/studio/',
      display: 'standalone',
      theme_color: '#002ad1',
      background_color: '#ffffff',
      icons: [
        {
          src: '/apps/studio/assets/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/apps/studio/assets/pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
      ],
    });
  });

  it('serves the origin root as `/` and keeps absolute icon URLs', () => {
    const manifest = pwaManifest('', {
      name: 'App',
      shortName: 'App',
      icons: [
        {
          src: 'https://cdn.example.com/app/pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    });
    expect(manifest).toMatchObject({ id: '/', start_url: '/', scope: '/' });
    expect(manifest.icons[0]?.src).toBe(
      'https://cdn.example.com/app/pwa-192.png',
    );
  });
});

describe('PWA configuration', () => {
  it('publishes only whether installation is on and the home-screen icon', async () => {
    const config = await createConfig({
      pwa: { name: 'Private name', description: 'Internal' },
    });
    expect(config.publicValues()).toEqual({
      pwa: { enabled: true, appleTouchIcon: 'assets/pwa-192.png' },
    });
  });

  it('refuses icons outside the application', async () => {
    const config = await createConfig({
      pwa: {
        icons: [{ src: '../secret.png', sizes: '1x1', type: 'image/png' }],
        appleTouchIcon: 'javascript:alert(1)',
      },
    });
    const issues = await config.validate();
    expect(issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(['pwa.icons.0.src', 'pwa.appleTouchIcon']),
    );
  });
});

describe('manifest route', () => {
  it.each([
    ['', '/'],
    ['/main', '/main/'],
    ['/tenants/acme/crm', '/tenants/acme/crm/'],
  ])(
    'serves the manifest anonymously at base path "%s"',
    async (basePath, scope) => {
      const router = await createRouter(basePath, {
        client: { app: { title: 'Acme CRM' } },
        secrets: { keys: [{ version: 1, key: 'do-not-leak' }] },
      });
      const response = await router.request(
        `http://localhost${scope}manifest.webmanifest`,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe(
        'application/manifest+json; charset=utf-8',
      );
      expect(response.headers.get('cache-control')).toBe('no-cache');
      const text = await response.text();
      expect(text).not.toContain('do-not-leak');
      expect(JSON.parse(text)).toEqual({
        id: scope,
        name: 'Acme CRM',
        short_name: 'Acme CRM',
        start_url: scope,
        scope,
        display: 'standalone',
        icons: [
          {
            src: `${scope}assets/pwa-192.png`,
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: `${scope}assets/pwa-512.png`,
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      });
    },
  );

  it('answers 304 to a revalidation with the same ETag', async () => {
    const router = await createRouter('/main');
    const first = await router.request(
      'http://localhost/main/manifest.webmanifest',
    );
    const etag = first.headers.get('etag');
    expect(etag).toMatch(/^"[\w-]+"$/u);

    const second = await router.request(
      'http://localhost/main/manifest.webmanifest',
      { headers: { 'if-none-match': `W/${etag}` } },
    );
    expect(second.status).toBe(304);
    expect(await second.text()).toBe('');
  });

  it('uses configured branding over the application title', async () => {
    const router = await createRouter('/main', {
      client: { app: { title: 'Acme CRM' } },
      pwa: {
        name: 'Acme Customer Desk',
        shortName: 'Acme',
        themeColor: '#123456',
        backgroundColor: '#ffffff',
        icons: [
          {
            src: 'https://cdn.example.com/acme.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    });
    const manifest = (await (
      await router.request('http://localhost/main/manifest.webmanifest')
    ).json()) as Record<string, unknown>;

    expect(manifest).toMatchObject({
      name: 'Acme Customer Desk',
      short_name: 'Acme',
      theme_color: '#123456',
      background_color: '#ffffff',
      icons: [
        {
          src: 'https://cdn.example.com/acme.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    });
  });

  it('falls back to NocoBase without an application title', async () => {
    const router = await createRouter('');
    const manifest = (await (
      await router.request('http://localhost/manifest.webmanifest')
    ).json()) as Record<string, unknown>;
    expect(manifest).toMatchObject({
      name: 'NocoBase',
      short_name: 'NocoBase',
    });
  });

  it('answers 404 rather than the page when installation is off', async () => {
    const router = await createRouter('/main', { pwa: { enabled: false } });
    const response = await router.request(
      'http://localhost/main/manifest.webmanifest',
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
