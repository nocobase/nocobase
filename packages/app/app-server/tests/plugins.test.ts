// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import {
  defineServerPlugin,
  defineServerPlugins,
  resolveAppServerPlugins,
} from '../src/plugins/index.js';
import { defineApiRoutes, defineRootRoutes } from '../src/router/index.js';
import { Hono } from 'hono';

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('server plugin definitions', () => {
  it('normalizes optional contributions and freezes the result', () => {
    const plugin = defineServerPlugin({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-example',
    });

    expect(plugin).toEqual({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-example',
      serviceProviders: [],
      routes: [],
      database: undefined,
      queue: undefined,
    });
    expect(Object.isFrozen(plugin)).toBe(true);
    expect(Object.isFrozen(plugin.serviceProviders)).toBe(true);
  });

  it('preserves order and rejects duplicate packages', () => {
    const first = defineServerPlugin({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-first',
    });
    const second = defineServerPlugin({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-second',
    });

    const plugins = defineServerPlugins([first, second]);
    expect(plugins.plugins).toEqual([first, second]);
    expect(Object.isFrozen(plugins.plugins)).toBe(true);
    expect(() => defineServerPlugins([first, first])).toThrow(
      'Server plugin "@nocobase/app-plugin-first" is registered more than once.',
    );
  });

  it('keeps API and root route definitions distinct', () => {
    const apiRoutes = defineApiRoutes(() => {
      return new Hono();
    });
    const rootRoutes = defineRootRoutes(() => {
      return new Hono();
    });

    expect(apiRoutes.scope).toBe('api');
    expect(rootRoutes.scope).toBe('root');
    expect(apiRoutes.createRouter).toBeTypeOf('function');
    expect(rootRoutes.createRouter).toBeTypeOf('function');
    expect(Object.isFrozen(apiRoutes)).toBe(true);
    expect(Object.isFrozen(rootRoutes)).toBe(true);
  });

  it('copies and freezes the unified routes array', () => {
    const route = defineApiRoutes(() => new Hono());
    const routes = [route];
    const plugin = defineServerPlugin({
      baseDir: import.meta.dirname,
      packageName: '@nocobase/app-plugin-example',
      routes,
    });

    routes.length = 0;

    expect(plugin.routes).toEqual([route]);
    expect(Object.isFrozen(plugin.routes)).toBe(true);
  });

  // Resolved from `app-template-examples`, which is where the example plugins are installed. They used to live in
  // `app-template-default` and were moved out; a test naming the wrong template fails with "could not be resolved",
  // which reads like a defect in resolution rather than a stale path.
  it('ignores configured contribution paths that do not exist', () => {
    const plugin = defineServerPlugin({
      baseDir: path.resolve(
        import.meta.dirname,
        '../../../examples/app-plugin-service-provider-example',
      ),
      packageName: '@nocobase/app-plugin-service-provider-example',
      database: {
        migrations: './missing/migrations',
        seeds: './missing/seeds',
      },
      queue: {
        jobs: ['./missing/jobs'],
      },
    });

    const resolved = resolveAppServerPlugins(
      path.resolve(process.cwd(), '../../templates/app-template-examples'),
      defineServerPlugins([plugin]),
    ).plugins[0]?.metadata;

    expect(resolved?.migrationsDirectory).toBeUndefined();
    expect(resolved?.seedsDirectory).toBeUndefined();
    expect(resolved?.jobLocations).toEqual([]);
  });

  it.each(['../outside', './a/../outside', './/outside', './a\\outside'])(
    'rejects unsafe optional contribution path %s',
    (configuredPath) => {
      const plugin = defineServerPlugin({
        baseDir: path.resolve(
          import.meta.dirname,
          '../../../examples/app-plugin-service-provider-example',
        ),
        packageName: '@nocobase/app-plugin-service-provider-example',
        database: {
          migrations: configuredPath,
        },
      });

      expect(() =>
        resolveAppServerPlugins(
          path.resolve(process.cwd(), '../../templates/app-template-examples'),
          defineServerPlugins([plugin]),
        ),
      ).toThrow(
        `Server plugin path "${configuredPath}" must be a safe baseDir-relative path beginning with "./".`,
      );
    },
  );

  it.each([false, true])(
    'resolves resources and metadata from the declared copy (compiled=%s)',
    (compiled) => {
      const rootDir = mkdtempSync(
        path.join(tmpdir(), 'nocobase-plugin-resolution-'),
      );
      tempDirs.push(rootDir);
      const packageName = '@example/runtime-plugin';
      writePackage(rootDir, packageName, 'source');
      writePackage(path.join(rootDir, 'dist'), packageName, 'compiled');
      const packageRoot = path.join(
        rootDir,
        compiled ? 'dist/node_modules' : 'node_modules',
        packageName,
      );
      const baseDir = compiled ? path.join(packageRoot, 'dist') : packageRoot;
      for (const directory of [
        'database/migrations',
        'database/seeds',
        'server/jobs',
      ]) {
        mkdirSync(path.join(packageRoot, directory), { recursive: true });
        mkdirSync(path.join(packageRoot, 'dist', directory), {
          recursive: true,
        });
      }
      const plugin = defineServerPlugin({
        packageName,
        baseDir,
        database: {
          migrations: './database/migrations',
          seeds: './database/seeds',
        },
        queue: { jobs: ['./server/jobs'] },
      });
      const resolved = resolveAppServerPlugins(
        rootDir,
        defineServerPlugins([plugin]),
      ).plugins[0]?.metadata;
      expect(resolved).toMatchObject({
        version: compiled ? 'compiled' : 'source',
        rootDir: packageRoot,
        baseDir,
        migrationsDirectory: path.join(baseDir, 'database/migrations'),
        seedsDirectory: path.join(baseDir, 'database/seeds'),
        // A deprecated queue.jobs declaration no longer resolves anything.
        jobLocations: [],
      });
      rmSync(path.join(baseDir, 'database/migrations'), { recursive: true });
      expect(
        resolveAppServerPlugins(rootDir, defineServerPlugins([plugin]))
          .plugins[0]?.metadata.migrationsDirectory,
      ).toBeUndefined();
    },
  );

  it('requires an absolute baseDir even for plugins without filesystem contributions', () => {
    expect(() =>
      defineServerPlugin({ packageName: '@example/plugin', baseDir: '.' }),
    ).toThrow('requires an absolute baseDir');
    expect(() =>
      Reflect.apply(defineServerPlugin, undefined, [
        { packageName: '@example/plugin' },
      ]),
    ).toThrow('requires an absolute baseDir');
  });

  it('does not use another installed copy when baseDir has no matching package manifest', () => {
    const rootDir = mkdtempSync(
      path.join(tmpdir(), 'nocobase-plugin-resolution-'),
    );
    tempDirs.push(rootDir);
    writePackage(rootDir, '@example/plugin', 'fixture');
    expect(() =>
      resolveAppServerPlugins(
        rootDir,
        defineServerPlugins([
          defineServerPlugin({
            packageName: '@example/plugin',
            baseDir: rootDir,
          }),
        ]),
      ),
    ).toThrow('no matching package.json');
  });
});

function writePackage(rootDir: string, packageName: string, version: string) {
  const packageDir = path.join(
    rootDir,
    'node_modules',
    ...packageName.split('/'),
  );
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(
    path.join(packageDir, 'package.json'),
    JSON.stringify({
      name: packageName,
      version,
      exports: {
        './package.json': './package.json',
      },
    }),
  );
}
