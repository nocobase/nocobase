// db-test-portability: dialect-specific — loads the driver package each configured dialect names; opens no database
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
} from '../src/config/index.js';
import { defineServerPlugins } from '../src/plugins/index.js';
import {
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
  it('loads configured drivers after deployment overrides and before providers, preserving them on reload', async () => {
    const runtime = await resolveAppRuntime(
      {
        ...createDefinition(),
        createAppConfig: () =>
          new AppConfig().load({
            name: 'deployment',
            read: async () => ({
              kind: 'map',
              value: {
                database: {
                  connections: {
                    main: { dialect: 'sqlite', filename: ':memory:' },
                  },
                },
              },
            }),
          }),
        defaultConfigs: () => ({
          database: { connections: { main: { dialect: 'mysql' } } },
        }),
      },
      createScope(createAppRoot()),
    );
    expect(runtime.config.get('database.drivers.sqlite')).toBeTypeOf(
      'function',
    );
    expect(runtime.config.get('database.drivers.mysql')).toBeUndefined();
    await runtime.config.reload();
    expect(runtime.config.get('database.drivers.sqlite')).toBeTypeOf(
      'function',
    );
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
