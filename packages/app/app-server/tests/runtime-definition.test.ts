import type { AppRuntimeContext } from '../src/runtime/definition.js';
import { defaultAppConfigs } from '../src/config/index.js';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppConfig, defineAppConfig } from '../src/config/index.js';
import { resolveStandaloneAppRuntime } from '../src/node/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
  type AppRuntimeDefinition,
  type AppScope,
} from '../src/runtime/index.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('application runtime definition', () => {
  it.each(['true', 'false', undefined])(
    'maps strict startup from the runtime environment: %s',
    async (value) => {
      const runtime = await resolveAppRuntime(createDefinition(), {
        ...createScope(createAppRoot()),
        env: { NOCOBASE_STRICT_STARTUP: value },
      });
      expect(createAppFromRuntime(runtime).strictStartup).toBe(
        value === 'true',
      );
    },
  );

  it('assembles configuration before application creation and preserves it on reload', async () => {
    let deploymentLabel: string | undefined = 'deployment';
    const callback = vi.fn();
    const configure = vi.fn((context: AppRuntimeContext) => ({
      label: 'code',
      callback: () => callback(context.app),
    }));
    const definition = createDefinition();
    const runtime = await resolveAppRuntime(
      {
        ...definition,
        createAppConfig: (context) => {
          const config = definition.createAppConfig(context);
          config.load({
            name: 'environment',
            read: async () => ({
              kind: 'map',
              value: deploymentLabel
                ? { feature: { label: deploymentLabel } }
                : {},
            }),
          });
          return config;
        },
        defaultConfigs: defaultAppConfigs({
          feature: defineAppConfig(configure),
        }),
      },
      createScope(createAppRoot()),
    );
    expect(runtime.app).toBeUndefined();
    const app = createAppFromRuntime(runtime);
    expect(app.paths).toBe(runtime.paths);
    expect(app.config).toBe(runtime.config);
    expect(runtime.config.get('feature.label')).toBe('deployment');
    const action = runtime.config.get<() => void>('feature.callback')!;
    action();
    expect(callback).toHaveBeenCalledWith(runtime.app);
    deploymentLabel = undefined;
    await runtime.config.reload();
    expect(runtime.config.get('feature.label')).toBe('code');
    expect(runtime.config.get('feature.callback')).toBe(action);
    expect(configure).toHaveBeenCalledOnce();
  });

  it('resolves scope, paths, plugins, and typed config definitions', async () => {
    const rootDir = createAppRoot();
    const runtime = await resolveAppRuntime(
      createDefinition(),
      createScope(rootDir),
    );

    expect(runtime.config.get('feature')).toEqual({ label: 'default' });
    expect(runtime.paths.root()).toBe(rootDir);
    expect(runtime.plugins.appPackageName).toBe('@example/customer-app');
  });

  it('shares final paths across config factories, runtime and Application', async () => {
    const rootDir = createAppRoot();
    const definition = createDefinition();
    const observed: unknown[] = [];
    const runtime = await resolveAppRuntime(
      {
        ...definition,
        resolvePaths: ({ paths }) => ({ ...paths, storageDir: 'persistent' }),
        createAppConfig: (context) => {
          observed.push(context.paths);
          return new AppConfig();
        },
        defaultConfigs: ({ paths }) => {
          observed.push(paths);
          return { file: paths.storage('files') };
        },
      },
      createScope(rootDir),
    );
    const app = createAppFromRuntime(runtime);
    expect(observed).toEqual([runtime.paths, runtime.paths]);
    expect(observed[0]).toBe(app.paths);
    expect(runtime.app).toBe(app);
    expect(runtime.config.get('file')).toBe(
      path.join(rootDir, 'persistent/files'),
    );
    expect(runtime.paths.storage()).toBe(runtime.paths.storageDir);
    expect(runtime.paths.client()).toBe(runtime.paths.clientDir);
  });

  it('creates standalone scopes from core defaults', async () => {
    const runtime = await resolveStandaloneAppRuntime(createDefinition(), {
      rootDir: createAppRoot(),
    });

    expect(runtime.mode).toBe('standalone');
    expect(runtime.routing).toMatchObject({
      name: 'main',
      publicBasePath: '/main',
    });
    expect(runtime.config.get<{ label: string }>('feature')!.label).toBe(
      'default',
    );
  });

  it('keeps standalone storage under APP_STORAGE_DIR, resolved from the deployment root', async () => {
    const rootDir = createAppRoot();
    const codeRoot = path.join(rootDir, 'releases/1.0.0/app/dist');
    const storage = async (
      value: string | undefined,
      definition: AppRuntimeDefinition = createDefinition(),
    ): Promise<string> =>
      (
        await resolveStandaloneAppRuntime(definition, {
          rootDir: codeRoot,
          deploymentRootDir: '..',
          env: { APP_STORAGE_DIR: value },
        })
      ).paths.storage();

    expect(await storage(undefined)).toBe(
      path.join(rootDir, 'releases/1.0.0/app/storage'),
    );
    expect(await storage(path.join(rootDir, 'storage'))).toBe(
      path.join(rootDir, 'storage'),
    );
    expect(await storage('data')).toBe(
      path.join(rootDir, 'releases/1.0.0/app/data'),
    );
    // An application's own path policy still has the last word.
    expect(
      await storage('/ignored', {
        ...createDefinition(),
        resolvePaths: ({ paths }) => ({ ...paths, storageDir: 'owned' }),
      }),
    ).toBe(path.join(rootDir, 'releases/1.0.0/app/owned'));
  });

  it('ignores APP_STORAGE_DIR for an embedded application', async () => {
    const rootDir = createAppRoot();
    const runtime = await resolveAppRuntime(createDefinition(), {
      ...createScope(rootDir),
      mode: 'embedded',
      env: { APP_STORAGE_DIR: '/elsewhere' },
    });

    expect(runtime.paths.storage()).toBe(path.join(rootDir, 'storage'));
  });
});

function createDefinition(): AppRuntimeDefinition {
  return defineAppRuntime({
    createAppConfig: () => new AppConfig(),
    defaultConfigs: defaultAppConfigs({
      feature: defineAppConfig(() => ({ label: 'default' })),
    }),
    plugins: defineServerPlugins([]),
    serviceProviders: [],
    routes: [],
  });
}

function createScope(rootDir: string): AppScope {
  return {
    id: 'customer',
    appName: 'customer',
    basePath: '/customers',
    paths: { rootDir, serverDir: path.join(rootDir, 'server') },
    registerDisposer(): void {},
  };
}

function createAppRoot(): string {
  const rootDir = mkdtempSync(path.join(tmpdir(), 'nocobase-app-runtime-'));
  tempDirs.push(rootDir);
  writeFileSync(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: '@example/customer-app' }),
  );

  return rootDir;
}
