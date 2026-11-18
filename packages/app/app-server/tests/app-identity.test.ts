import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { resolveStandaloneAppPaths } from '../src/node/scope.js';
import { apiDocsToken } from '../src/router/index.js';
import { resolveAppScopePaths } from '../src/runtime/scope.js';
import { spaRootRoutes } from '../src/spa/index.js';

const directories: string[] = [];
const applications: Application[] = [];
const identity = {
  name: '@example/customer-app',
  displayName: 'Customer application',
  version: '1.2.3',
};

afterEach(async () => {
  for (const app of applications.splice(0)) await app.shutdown();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

type Layout = 'development' | 'standalone' | 'embedded';

function createRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-app-identity-'));
  directories.push(root);
  mkdirSync(path.join(root, 'dist/client'), { recursive: true });
  writeFileSync(path.join(root, 'dist/client/index.html'), '<main></main>');
  return root;
}

function writeManifest(
  root: string,
  relativePath: string,
  value: unknown,
): void {
  writeFileSync(path.join(root, relativePath), JSON.stringify(value));
}

async function createApp(root: string, layout: Layout): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'main',
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
    },
    spa: { indexPath: path.join(root, 'dist/client/index.html') },
  });
  const paths = createAppPaths(
    layout === 'embedded'
      ? resolveAppScopePaths({
          id: 'main',
          basePath: '/main',
          rootDir: root,
          registerDisposer: () => {},
        })
      : resolveStandaloneAppPaths({
          rootDir: layout === 'standalone' ? path.join(root, 'dist') : root,
          ...(layout === 'standalone' ? { deploymentRootDir: '..' } : {}),
        }),
  );
  const app = new Application({
    config,
    paths,
    mode: layout === 'embedded' ? 'embedded' : 'standalone',
  });
  applications.push(app);
  app.addRoutes(spaRootRoutes);
  app.registerProviders();
  await app.start();
  return app;
}

async function readIdentity(app: Application) {
  const response = await app.fetch(new Request('http://localhost/main/'));
  expect(response.status).toBe(200);
  const html = await response.text();
  const payload = JSON.parse(
    html.match(
      /<script id="nocobase-runtime-config"[^>]*>(.*?)<\/script>/s,
    )![1]!,
  );
  const document = await app.container.resolve(apiDocsToken).getDocument();
  return { publicApp: payload.public.app, apiInfo: document.info };
}

describe('application manifest identity', () => {
  it.each<Layout>(['development', 'standalone', 'embedded'])(
    'publishes the manifest identity in SPA and OpenAPI for %s',
    async (layout) => {
      const root = createRoot();
      writeManifest(
        root,
        layout === 'development' ? 'package.json' : 'dist/package.json',
        identity,
      );
      const app = await createApp(root, layout);

      expect(await readIdentity(app)).toEqual({
        publicApp: {
          displayName: identity.displayName,
          version: identity.version,
        },
        apiInfo: { title: identity.displayName, version: identity.version },
      });
    },
  );

  it.each<Layout>(['development', 'embedded'])(
    'prefers the root manifest over an old dist manifest for %s',
    async (layout) => {
      const root = createRoot();
      writeManifest(root, 'package.json', identity);
      writeManifest(root, 'dist/package.json', {
        displayName: 'Old build',
        version: '0.1.0',
      });

      expect(await readIdentity(await createApp(root, layout))).toEqual({
        publicApp: {
          displayName: identity.displayName,
          version: identity.version,
        },
        apiInfo: { title: identity.displayName, version: identity.version },
      });
    },
  );

  it('keeps the defaults when neither manifest exists', async () => {
    expect(
      await readIdentity(await createApp(createRoot(), 'embedded')),
    ).toEqual({
      publicApp: undefined,
      apiInfo: { title: 'main', version: '0.0.0' },
    });
  });

  it('uses the embedded package name for OpenAPI without exposing it as a display name', async () => {
    const root = createRoot();
    writeManifest(root, 'dist/package.json', {
      name: identity.name,
      version: identity.version,
    });

    expect(await readIdentity(await createApp(root, 'embedded'))).toEqual({
      publicApp: { version: identity.version },
      apiInfo: { title: identity.name, version: identity.version },
    });
  });

  it('does not borrow missing identity fields from an old build', async () => {
    const root = createRoot();
    writeManifest(root, 'package.json', { name: identity.name });
    writeManifest(root, 'dist/package.json', identity);

    expect(await readIdentity(await createApp(root, 'development'))).toEqual({
      publicApp: undefined,
      apiInfo: { title: identity.name, version: '0.0.0' },
    });
  });

  it.each([null, { displayName: 42, version: false }])(
    'keeps the defaults for an existing root manifest with invalid identity: %j',
    async (value) => {
      const root = createRoot();
      writeManifest(root, 'package.json', value);
      writeManifest(root, 'dist/package.json', identity);

      expect(await readIdentity(await createApp(root, 'embedded'))).toEqual({
        publicApp: undefined,
        apiInfo: { title: 'main', version: '0.0.0' },
      });
    },
  );
});
