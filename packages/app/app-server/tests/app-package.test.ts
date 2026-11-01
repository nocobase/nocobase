import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { Application } from '../src/application/index.js';
import {
  AppConfig,
  createAppPaths,
  type AppPaths,
} from '../src/config/index.js';
import { resolveStandaloneAppPaths } from '../src/node/scope.js';
import { apiDocsToken } from '../src/router/index.js';
import { resolveAppScopePaths } from '../src/runtime/scope.js';
import { spaRootRoutes } from '../src/spa/index.js';

const tempDirs: string[] = [];
const applications: Application[] = [];
const manifest = {
  name: '@example/customer-app',
  displayName: 'Customer application',
  version: '1.2.3',
};

afterEach(async () => {
  for (const app of applications.splice(0)) await app.shutdown();
  for (const root of tempDirs.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'nocobase-app-package-'));
  tempDirs.push(root);
  mkdirSync(path.join(root, 'dist'), { recursive: true });
  return root;
}

function writeManifest(directory: string, value: unknown = manifest): void {
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify(value));
}

async function createApp(
  paths: AppPaths,
  mode: 'standalone' | 'embedded' = 'embedded',
): Promise<Application> {
  mkdirSync(paths.clientDir, { recursive: true });
  writeFileSync(paths.client('index.html'), '<html><body>App</body></html>');
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: {
      name: 'main',
      publicBasePath: '/main',
      internalBasePath: '',
      publicApiUrl: '/main/api',
    },
    spa: { indexPath: paths.client('index.html') },
  });
  const app = new Application({ config, paths, mode });
  applications.push(app);
  app.addRoutes(spaRootRoutes);
  await app.start();
  return app;
}

async function identityOf(app: Application) {
  const response = await app.fetch(new Request('http://localhost/settings'));
  expect(response.status).toBe(200);
  const html = await response.text();
  const payload = html.match(
    /<script id="nocobase-runtime-config" type="application\/json">(.*?)<\/script>/s,
  );
  expect(payload).not.toBeNull();
  const runtime = JSON.parse(payload![1]!);
  const document = await app.container.resolve(apiDocsToken).getDocument();
  return { publicApp: runtime.public.app, info: document.info };
}

describe('application package identity', () => {
  it.each(['development', 'standalone', 'embedded'] as const)(
    'publishes the manifest identity in %s paths to the SPA and OpenAPI',
    async (layout) => {
      const root = createRoot();
      const codeRoot =
        layout === 'development' ? root : path.join(root, 'dist');
      writeManifest(codeRoot);
      const embedded = layout === 'embedded';
      const paths = createAppPaths(
        embedded
          ? resolveAppScopePaths({
              id: 'main',
              basePath: '/main',
              rootDir: root,
            })
          : resolveStandaloneAppPaths({
              rootDir: codeRoot,
              deploymentRootDir: layout === 'standalone' ? '..' : '.',
            }),
      );
      const app = await createApp(paths, embedded ? 'embedded' : 'standalone');

      expect(await identityOf(app)).toEqual({
        publicApp: {
          displayName: manifest.displayName,
          version: manifest.version,
        },
        info: { title: manifest.displayName, version: manifest.version },
      });
    },
  );

  it('prefers the root manifest when both locations exist', async () => {
    const root = createRoot();
    writeManifest(root);
    writeManifest(path.join(root, 'dist'), {
      displayName: 'Stale build',
      version: '0.1.0',
    });
    const app = await createApp(createAppPaths({ rootDir: root }));

    expect(await identityOf(app)).toEqual({
      publicApp: {
        displayName: manifest.displayName,
        version: manifest.version,
      },
      info: { title: manifest.displayName, version: manifest.version },
    });
  });

  it('keeps missing-manifest defaults', async () => {
    const app = await createApp(createAppPaths({ rootDir: createRoot() }));

    expect(await identityOf(app)).toEqual({
      publicApp: undefined,
      info: { title: 'main', version: '0.0.0' },
    });
  });

  it('uses the built package name for OpenAPI when no display name is set', async () => {
    const root = createRoot();
    writeManifest(path.join(root, 'dist'), {
      name: manifest.name,
      version: manifest.version,
    });
    const app = await createApp(createAppPaths({ rootDir: root }));

    expect(await identityOf(app)).toEqual({
      publicApp: { version: manifest.version },
      info: { title: manifest.name, version: manifest.version },
    });
  });

  it.each([{}, null, { displayName: 42, version: false }])(
    'does not fall back for an existing root manifest with invalid or absent identity fields: %j',
    async (value) => {
      const root = createRoot();
      writeManifest(root, value);
      writeManifest(path.join(root, 'dist'));
      const app = await createApp(createAppPaths({ rootDir: root }));

      expect(await identityOf(app)).toEqual({
        publicApp: undefined,
        info: { title: 'main', version: '0.0.0' },
      });
    },
  );
});
