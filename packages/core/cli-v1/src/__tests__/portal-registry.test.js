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
const { loadPluginPortalRegistry } = require('../portal-registry/config');
const { initializePortalRegistry } = require('../portal-registry/init');
const {
  copyPortalRegistrySource,
  createPortalEnvironment,
  ensurePortalTemplate,
  getNocoBaseDevelopmentEnvironment,
  getPortalPnpmEnvironment,
  watchPortalRegistrySources,
} = require('../portal-registry/workspace');

async function waitFor(check, timeout = 3000) {
  const startedAt = Date.now();
  while (!(await check())) {
    if (Date.now() - startedAt > timeout) throw new Error('Timed out waiting for file synchronization');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function createRegistryPlugin(root, packageName) {
  const pluginRoot = path.resolve(root, 'packages/plugins', ...packageName.split('/'));
  const sourceRoot = path.resolve(pluginRoot, 'portal-registry');
  await fs.ensureDir(sourceRoot);
  await fs.writeJson(path.resolve(pluginRoot, 'package.json'), { name: packageName, version: '2.2.0-test.1' });
  await fs.outputFile(path.resolve(sourceRoot, 'components/button.tsx'), 'export const Button = () => null;');
  await fs.writeJson(path.resolve(sourceRoot, 'registry.config.json'), {
    target: 'src/extensions/example',
    items: [
      {
        name: 'example',
        type: 'registry:block',
        title: 'Example',
        include: ['components'],
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

  test('builds independently targeted items owned by one plugin', async () => {
    const entry = await createRegistryPlugin(root, '@nocobase/plugin-split');
    const registryRoot = path.resolve(entry.pluginRoot, 'portal-registry');
    await fs.outputFile(path.resolve(registryRoot, 'route-surfaces/extension.tsx'), 'export default {};');
    await fs.outputFile(path.resolve(registryRoot, 'users-example/extension.tsx'), 'export default {};');
    await fs.writeJson(path.resolve(registryRoot, 'registry.config.json'), {
      items: [
        {
          name: 'route-surfaces',
          type: 'registry:lib',
          source: 'route-surfaces',
          target: 'src/extensions/nocobase-route-surfaces',
          include: ['.'],
        },
        {
          name: 'users-example',
          type: 'registry:block',
          source: 'users-example',
          target: 'src/extensions/nocobase-users-example',
          include: ['.'],
          registryDependencies: ['@nocobase/route-surfaces'],
        },
      ],
    });

    const registry = await loadPluginPortalRegistry(entry.plugin);
    const result = await buildPortalRegistries({
      cwd: root,
      registries: [registry],
      runShadcnBuild: async ({ registryPath, outputPath }) => {
        const document = await fs.readJson(registryPath);
        await fs.ensureDir(outputPath);
        for (const item of document.items) {
          await fs.writeJson(path.resolve(outputPath, `${item.name}.json`), item);
        }
      },
    });
    const builtItems = await Promise.all(
      ['route-surfaces', 'users-example'].map((name) =>
        fs.readJson(path.resolve(entry.pluginRoot, 'dist/portal-registry', `${name}.json`)),
      ),
    );
    const manifest = await fs.readJson(path.resolve(entry.pluginRoot, 'dist/portal-registry/manifest.json'));

    expect(result).toEqual({ pluginCount: 1, itemCount: 2 });
    expect(builtItems.flatMap((item) => item.files.map((file) => file.target))).toEqual([
      'src/extensions/nocobase-route-surfaces/extension.tsx',
      'src/extensions/nocobase-users-example/extension.tsx',
    ]);
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      packageName: '@nocobase/plugin-split',
      packageVersion: '2.2.0-test.1',
      items: [
        {
          name: 'route-surfaces',
          file: 'route-surfaces.json',
          digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        },
        {
          name: 'users-example',
          file: 'users-example.json',
          digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
        },
      ],
    });
  });

  test('recreates the development workspace from a local Portal Template working tree', async () => {
    const templatePath = path.resolve(root, 'portal-template');
    const workspacePath = path.resolve(root, 'storage/portal-registry');
    await fs.ensureDir(templatePath);
    await fs.writeJson(path.resolve(templatePath, 'package.json'), { name: '@nocobase/portal-template-default' });
    await fs.writeJson(path.resolve(templatePath, 'components.json'), {});
    await fs.outputFile(path.resolve(templatePath, 'src/App.tsx'), 'export const localChange = true;');
    await fs.outputFile(path.resolve(templatePath, '.git/config'), 'must not be copied');
    await fs.outputFile(path.resolve(templatePath, 'node_modules/example/index.js'), 'must not be copied');
    await fs.outputFile(path.resolve(templatePath, 'dist/index.html'), 'must not be copied');
    await fs.outputFile(path.resolve(workspacePath, 'stale.txt'), 'remove me');

    await ensurePortalTemplate({ cwd: root, workspacePath, templatePath });

    await expect(fs.readFile(path.resolve(workspacePath, 'src/App.tsx'), 'utf8')).resolves.toBe(
      'export const localChange = true;',
    );
    await expect(fs.pathExists(path.resolve(workspacePath, 'stale.txt'))).resolves.toBe(false);
    await expect(fs.pathExists(path.resolve(workspacePath, '.git'))).resolves.toBe(false);
    await expect(fs.pathExists(path.resolve(workspacePath, 'node_modules'))).resolves.toBe(false);
    await expect(fs.pathExists(path.resolve(workspacePath, 'dist'))).resolves.toBe(false);
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
      [
        {
          sourceRoot,
          config: { items: [{ source: '.', target: 'src/extensions/example' }] },
        },
      ],
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
