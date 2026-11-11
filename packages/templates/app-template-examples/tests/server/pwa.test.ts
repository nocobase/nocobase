import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  AppConfig,
  defaultAppConfigs,
  type AppRuntimeContext,
} from '@nocobase/app-server/config';
import { createPublicBasePathAdapter } from '@nocobase/app-server/runtime';
import { registerSpaRoutes } from '@nocobase/app-server/spa';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import pwa from '../../server/config/pwa.js';
import routes from '../../server/routes/index.js';

const appRoot = path.resolve(import.meta.dirname, '../..');
const directories: string[] = [];

afterEach(async () => {
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

/**
 * The template's manifest route and its built client, mounted at the public base path the way the runtime strips it.
 * No session, push key or database is configured: installation needs none of them.
 */
async function createSite(
  publicBasePath: string,
  overrides: Record<string, unknown> = {},
): Promise<{ request(url: string): Promise<Response> }> {
  const config = new AppConfig().load({
    name: 'test',
    read: async () => ({
      kind: 'map',
      value: {
        app: { publicBasePath, internalBasePath: '' },
        client: { app: { title: 'Acme Desk' } },
        ...overrides,
      },
    }),
  });
  await config.loadAll();
  const defaults = defaultAppConfigs({ pwa });
  config.mergeDefaults(defaults({} as AppRuntimeContext));
  config.defineSections(defaults.sections!);

  const client = await mkdtemp(path.join(tmpdir(), 'template-pwa-'));
  directories.push(client);
  await mkdir(path.join(client, 'assets'));
  await writeFile(path.join(client, 'index.html'), '<main></main>');
  for (const icon of ['pwa-192.png', 'pwa-512.png'])
    await copyFile(
      path.join(appRoot, 'public/assets', icon),
      path.join(client, 'assets', icon),
    );

  const app = new Hono();
  // The manifest is the template's first route, ahead of anything that could catch its path.
  app.route(
    '/',
    await routes[0]!.createRouter({ config, publicBasePath } as never),
  );
  const spa = new Hono();
  registerSpaRoutes(spa, {
    basePath: '',
    publicBasePath,
    indexPath: path.join(client, 'index.html'),
  });
  app.route('/', spa);
  const site = createPublicBasePathAdapter(app, publicBasePath);
  return { request: async (url) => site.fetch(new Request(url)) };
}

describe('installation as an app', () => {
  it.each([
    ['', '/'],
    ['/tenants/acme/desk', '/tenants/acme/desk/'],
  ])(
    'serves the manifest and its icons anonymously at "%s"',
    async (basePath, scope) => {
      const site = await createSite(basePath);
      const response = await site.request(
        `http://localhost${scope}manifest.webmanifest`,
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/manifest+json',
      );
      const manifest = (await response.json()) as {
        name: string;
        start_url: string;
        scope: string;
        icons: { src: string; sizes: string }[];
      };
      expect(manifest).toMatchObject({
        name: 'Acme Desk',
        start_url: scope,
        scope,
      });
      expect(manifest.icons.map((icon) => icon.sizes)).toEqual([
        '192x192',
        '512x512',
      ]);
      for (const icon of manifest.icons) {
        const image = await site.request(`http://localhost${icon.src}`);
        expect(image.status).toBe(200);
        expect(image.headers.get('content-type')).toBe('image/png');
      }
    },
  );

  it('answers 404 instead of the page when installation is turned off', async () => {
    const site = await createSite('/main', { pwa: { enabled: false } });
    const response = await site.request(
      'http://localhost/main/manifest.webmanifest',
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).not.toContain('text/html');
  });
});
