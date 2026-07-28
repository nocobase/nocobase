/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { buildPortalRegistries } = require('../portal-registry/build');
const { loadPluginPortalRegistry, validateRegistrySet } = require('../portal-registry/config');
const { initializePortalRegistry } = require('../portal-registry/init');
const { getRootRegistryItems } = require('../portal-registry/test');
const {
  copyPortalRegistrySource,
  createPortalEnvironment,
  getNocoBaseDevelopmentEnvironment,
  getPortalPnpmEnvironment,
  getUnmanagedWorkspaceChanges,
  replaceManagedGitExcludeBlock,
  watchPortalRegistrySources,
} = require('../portal-registry/workspace');

async function waitFor(check, timeout = 3000) {
  const startedAt = Date.now();
  while (!(await check())) {
    if (Date.now() - startedAt > timeout) throw new Error('Timed out waiting for file synchronization');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function createRegistryPlugin(root, packageName, options = {}) {
  const pluginRoot = options.pluginRoot || path.resolve(root, 'packages/plugins', ...packageName.split('/'));
  const sourceRoot = path.resolve(pluginRoot, 'portal-registry');
  await fs.ensureDir(sourceRoot);
  await fs.writeJson(path.resolve(pluginRoot, 'package.json'), { name: packageName, version: '2.2.0-test.1' });
  await fs.outputFile(path.resolve(sourceRoot, 'components/button.tsx'), 'export const Button = () => null;');
  await fs.writeJson(path.resolve(sourceRoot, 'registry.config.json'), {
    target: options.target || 'src/extensions/example',
    items: [
      {
        name: options.itemName || 'example',
        type: 'registry:block',
        title: 'Example',
        include: ['components'],
        registryDependencies: options.registryDependencies,
      },
    ],
  });
  return {
    pluginRoot,
    plugin: {
      name: packageName,
      packageName,
      origins: [],
      resolvedPath: pluginRoot,
    },
  };
}

describe('portal Registry', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-portal-registry-test-'));
  });

  afterEach(() => {
    fs.removeSync(root);
  });

  test('initializes editable plugin sources without overwriting existing or installed Registries', async () => {
    const pluginRoot = path.resolve(root, 'packages/plugins/@nocobase/plugin-example');
    await fs.ensureDir(pluginRoot);
    await fs.writeJson(path.resolve(pluginRoot, 'package.json'), {
      name: '@nocobase/plugin-example',
      version: '2.2.0-test.1',
    });
    const plugin = {
      name: 'example',
      packageName: '@nocobase/plugin-example',
      origins: [],
      resolvedPath: pluginRoot,
    };

    const result = await initializePortalRegistry('@nocobase/plugin-example', {
      cwd: root,
      plugins: [plugin],
      editableRoots: [path.resolve(root, 'packages/plugins')],
    });
    const registry = await loadPluginPortalRegistry(plugin);

    expect(result.registryName).toBe('example');
    expect(registry.config.target).toBe('src/extensions/nocobase-example');
    expect(registry.config.items[0].files).toEqual([
      'components/example-card.tsx',
      'demo/index.tsx',
      'extension.tsx',
      'index.ts',
      'README.md',
    ]);
    expect(await fs.readFile(path.resolve(result.registryRoot, 'demo/index.tsx'), 'utf8')).toContain('ExampleDemoPage');
    await expect(
      initializePortalRegistry('@nocobase/plugin-example', {
        cwd: root,
        plugins: [plugin],
        editableRoots: [path.resolve(root, 'packages/plugins')],
      }),
    ).rejects.toThrow('Portal Registry already exists');

    const installedPluginRoot = path.resolve(root, 'node_modules/@nocobase/plugin-installed');
    await fs.ensureDir(installedPluginRoot);
    const installedPlugin = {
      name: 'example',
      packageName: '@nocobase/plugin-installed',
      origins: ['preset-dependency'],
      resolvedPath: installedPluginRoot,
    };

    await expect(
      initializePortalRegistry('@nocobase/plugin-installed', {
        cwd: root,
        plugins: [installedPlugin],
        editableRoots: [path.resolve(root, 'packages/plugins'), path.resolve(root, 'storage/plugins')],
      }),
    ).rejects.toThrow('installed in node_modules');
  });

  test('rejects duplicate item names and unsafe targets', async () => {
    const first = await createRegistryPlugin(root, '@nocobase/plugin-first', { itemName: 'shared' });
    const second = await createRegistryPlugin(root, '@nocobase/plugin-second', {
      itemName: 'shared',
      target: 'src/extensions/second',
    });
    const firstRegistry = await loadPluginPortalRegistry(first.plugin);
    const secondRegistry = await loadPluginPortalRegistry(second.plugin);

    expect(() => validateRegistrySet([firstRegistry, secondRegistry])).toThrow(
      "Duplicate portal Registry item 'shared'",
    );

    await fs.writeJson(path.resolve(first.pluginRoot, 'portal-registry/registry.config.json'), {
      target: '../outside',
      items: [{ name: 'unsafe', type: 'registry:block', include: ['components'] }],
    });
    await expect(loadPluginPortalRegistry(first.plugin)).rejects.toThrow('Unsafe @nocobase/plugin-first target');
  });

  test('builds package-owned output and honors package, path, glob, and core-only selectors', async () => {
    const first = await createRegistryPlugin(root, '@nocobase/plugin-first', {
      itemName: 'first',
      target: 'src/extensions/first',
    });
    const second = await createRegistryPlugin(root, '@nocobase/plugin-second', {
      itemName: 'second',
      target: 'src/extensions/second',
    });
    const registries = [await loadPluginPortalRegistry(first.plugin), await loadPluginPortalRegistry(second.plugin)];
    let buildCalls = 0;
    const runShadcnBuild = async ({ registryPath, outputPath }) => {
      buildCalls += 1;
      const document = await fs.readJson(registryPath);
      await fs.ensureDir(outputPath);
      for (const item of document.items) {
        await fs.writeJson(path.resolve(outputPath, `${item.name}.json`), item);
      }
    };

    const fullBuild = await buildPortalRegistries({
      cwd: root,
      registries,
      runShadcnBuild,
    });

    expect(fullBuild).toEqual({ pluginCount: 2, itemCount: 2 });
    expect(await fs.readJson(path.resolve(first.pluginRoot, 'dist/portal-registry/manifest.json'))).toMatchObject({
      schemaVersion: 1,
      packageName: '@nocobase/plugin-first',
      packageVersion: '2.2.0-test.1',
      items: [{ name: 'first', file: 'first.json', digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/) }],
    });
    expect(await fs.pathExists(path.resolve(second.pluginRoot, 'dist/portal-registry/second.json'))).toBe(true);

    await fs.remove(path.resolve(first.pluginRoot, 'dist'));
    await fs.remove(path.resolve(second.pluginRoot, 'dist'));
    const packageBuild = await buildPortalRegistries({
      cwd: root,
      registries,
      packageSelectors: ['@nocobase/plugin-first'],
      runShadcnBuild,
    });

    expect(packageBuild).toEqual({ pluginCount: 1, itemCount: 1 });
    await expect(fs.pathExists(path.resolve(first.pluginRoot, 'dist/portal-registry/first.json'))).resolves.toBe(true);
    await expect(fs.pathExists(path.resolve(second.pluginRoot, 'dist/portal-registry/second.json'))).resolves.toBe(
      false,
    );

    await fs.remove(path.resolve(first.pluginRoot, 'dist'));
    const pathBuild = await buildPortalRegistries({
      cwd: root,
      registries,
      packageSelectors: ['packages/plugins/@nocobase/plugin-second'],
      runShadcnBuild,
    });
    expect(pathBuild).toEqual({ pluginCount: 1, itemCount: 1 });
    await expect(fs.pathExists(path.resolve(second.pluginRoot, 'dist/portal-registry/second.json'))).resolves.toBe(
      true,
    );

    await fs.remove(path.resolve(second.pluginRoot, 'dist'));
    const globBuild = await buildPortalRegistries({
      cwd: root,
      registries,
      packageSelectors: ['packages/plugins/*'],
      runShadcnBuild,
    });
    expect(globBuild).toEqual({ pluginCount: 2, itemCount: 2 });

    const callsBeforeCoreBuild = buildCalls;
    const coreBuild = await buildPortalRegistries({
      cwd: root,
      registries,
      packageSelectors: ['@nocobase/server'],
      runShadcnBuild,
    });
    expect(coreBuild).toEqual({ pluginCount: 0, itemCount: 0 });
    expect(buildCalls).toBe(callsBeforeCoreBuild);
  });

  test('installs only top-level items in the clean Template test', () => {
    const registries = [
      {
        config: {
          items: [
            { name: 'runtime' },
            { name: 'feature', registryDependencies: ['@nocobase/runtime', 'button'] },
            { name: 'standalone' },
          ],
        },
      },
    ];

    expect(getRootRegistryItems(registries)).toEqual(['feature', 'standalone']);
  });

  test('preserves local Git excludes and still reports user-owned workspace changes', () => {
    const status = ['?? .nocobase/portal-registry-workspace.json', ' M package.json', '?? local-file.ts'].join('\n');
    const original = '# Local excludes\n.idea/\n';
    const once = replaceManagedGitExcludeBlock(original, ['/src/extensions/']);
    const twice = replaceManagedGitExcludeBlock(once, ['/src/extensions/']);

    expect(getUnmanagedWorkspaceChanges(status)).toEqual([' M package.json', '?? local-file.ts']);
    expect(twice).toBe(once);
    expect(once).toContain('# Local excludes\n.idea/');
    expect(once).toContain('/src/extensions/');
  });

  test('mirrors Registry sources into the Template without directory symlinks', async () => {
    const sourceRoot = path.resolve(root, 'plugin/portal-registry');
    const workspacePath = path.resolve(root, 'workspace');
    const targetRoot = path.resolve(workspacePath, 'src/extensions/example');
    await fs.outputFile(path.resolve(sourceRoot, 'component.tsx'), 'export const value = 1;');

    await copyPortalRegistrySource(sourceRoot, targetRoot);
    expect((await fs.lstat(targetRoot)).isSymbolicLink()).toBe(false);
    expect(await fs.readFile(path.resolve(targetRoot, 'component.tsx'), 'utf8')).toContain('value = 1');

    const watcher = watchPortalRegistrySources(
      [{ sourceRoot, config: { target: 'src/extensions/example' } }],
      workspacePath,
    );
    await new Promise((resolve) => watcher.once('ready', resolve));
    try {
      await fs.writeFile(path.resolve(sourceRoot, 'component.tsx'), 'export const value = 2;');
      await waitFor(
        async () =>
          (await fs.readFile(path.resolve(targetRoot, 'component.tsx'), 'utf8')) === 'export const value = 2;',
      );
    } finally {
      await watcher.close();
    }
  });

  test('creates isolated Portal and client-v2 development environments', () => {
    const environment = getPortalPnpmEnvironment({
      NODE_OPTIONS: '--max-old-space-size=4096 --preserve-symlinks',
      NODE_PATH: '/nocobase/node_modules',
      PATH: '/usr/bin',
    });

    expect(environment.COREPACK_ENABLE_STRICT).toBe('0');
    expect(environment.NODE_OPTIONS).toBe('--max-old-space-size=4096');
    expect(environment.NODE_PATH).toBe('');
    expect(environment.PATH).toContain('/usr/bin');

    const portalEnvironment = createPortalEnvironment({ APP_PORT: '14000', DB_PASSWORD: 'secret' });
    expect(portalEnvironment).toContain('NOCOBASE_API_URL="http://127.0.0.1:14000/api"');
    expect(portalEnvironment).toContain('NOCOBASE_PORTAL_BASE="/"');
    expect(portalEnvironment).not.toContain('DB_PASSWORD');
    expect(
      getNocoBaseDevelopmentEnvironment({
        APP_CLIENT_ENTRY_MODE: 'legacy-default',
        APP_PORT: '14000',
      }),
    ).toEqual({
      APP_CLIENT_ENTRY_MODE: 'modern-only',
      APP_PORT: '14000',
    });
  });
});
