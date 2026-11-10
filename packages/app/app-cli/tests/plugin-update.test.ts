import { createRequire } from 'node:module';
import { symlink, mkdir } from 'node:fs/promises';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Config } from '@oclif/core';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadTestConfig, runCommand } from './helpers.ts';
import {
  normalizePluginPackageNames,
  planPluginUpdate,
} from '../src/lib/plugin-update.ts';

const created: string[] = [];
let config: Config;

beforeAll(async () => {
  config = await loadTestConfig();
});

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

async function createApp(
  plugins: string[] = [],
  extra: Record<string, unknown> = {},
): Promise<string> {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nb3-update-'));
  created.push(appRoot);
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: 'demo-app',
      ...extra,
    }),
  );
  await writeRegisteredPlugins(appRoot, plugins);
  return appRoot;
}

describe('normalizePluginPackageNames', () => {
  it('expands a short name into a plugin package', () => {
    expect(normalizePluginPackageNames(['audit-log'])).toEqual([
      '@nocobase/app-plugin-audit-log',
    ]);
  });

  it.each([
    '@nocobase/app-plugin-audit-log',
    '@nocobase/app-module-audit-log',
    '@acme/app-plugin-audit-log',
    '@acme/app-module-audit-log',
  ])('keeps the scoped identity %s when updating', (packageName) => {
    expect(normalizePluginPackageNames([packageName])).toEqual([packageName]);
  });

  it('rejects a scoped name from another namespace', () => {
    expect(() => normalizePluginPackageNames(['other/thing'])).toThrow(
      'must be a short name',
    );
  });

  it('rejects an empty name', () => {
    expect(() => normalizePluginPackageNames(['  '])).toThrow(
      'cannot be empty',
    );
  });
});

describe('planPluginUpdate', () => {
  it('upgrades every registered plugin when none is named', async () => {
    const appRoot = await createApp([
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-beta',
    ]);

    const plan = await planPluginUpdate({ appRoot });

    expect(plan.packageNames).toEqual([
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-beta',
    ]);
    expect(plan.args[0]).toBe('update');
  });

  it('upgrades only the named plugins', async () => {
    const appRoot = await createApp([
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-beta',
    ]);

    const plan = await planPluginUpdate({ appRoot, plugins: ['alpha'] });

    expect(plan.packageNames).toEqual(['@nocobase/app-plugin-alpha']);
  });

  it('refuses a plugin the application does not register', async () => {
    const appRoot = await createApp(['@nocobase/app-plugin-alpha']);

    await expect(
      planPluginUpdate({ appRoot, plugins: ['missing'] }),
    ).rejects.toThrow('Not registered in this app');
  });

  it('reports no plugins rather than upgrading everything', async () => {
    const appRoot = await createApp();

    const plan = await planPluginUpdate({ appRoot });

    expect(plan.packageNames).toEqual([]);
    expect(plan.args).toEqual([]);
  });

  it('uses the package manager the application declares', async () => {
    const appRoot = await createApp(['@nocobase/app-plugin-alpha'], {
      packageManager: 'yarn@4.0.0',
    });

    const plan = await planPluginUpdate({ appRoot });

    expect(plan.packageManager).toBe('yarn');
    expect(plan.args[0]).toBe('up');
  });
});

describe('plugin update command selection', () => {
  it.each([
    { selectors: [], expected: ['alpha', 'beta'] },
    { selectors: ['@nocobase/app-plugin-alpha'], expected: ['alpha'] },
    { selectors: ['alpha'], expected: ['alpha'] },
  ])('selects $expected with $selectors', async ({ selectors, expected }) => {
    const appRoot = await createApp(
      ['@nocobase/app-plugin-alpha', '@nocobase/app-plugin-beta'],
      { packageManager: 'pnpm@11.0.0' },
    );
    const result = await runCommand(config, 'plugin:update', [
      ...selectors,
      '--dir',
      appRoot,
      '--dry-run',
      '--json',
    ]);
    const packageNames = expected.map((name) => `@nocobase/app-plugin-${name}`);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'plugin update',
      result: {
        mode: 'dry-run',
        packageNames,
        commands: [
          {
            command: 'pnpm',
            args: ['update', ...packageNames],
            cwd: appRoot,
          },
        ],
      },
    });
  });

  it('rejects an unregistered positional name instead of updating all plugins', async () => {
    const appRoot = await createApp(['@nocobase/app-plugin-alpha']);

    await expect(
      runCommand(config, 'plugin:update', [
        '@nocobase/app-plugin-missing',
        '--dir',
        appRoot,
        '--dry-run',
      ]),
    ).rejects.toThrow('Not registered in this app');
  });

  it('accepts an optional name argument and exposes no plugin flag', () => {
    const command = config.findCommand('plugin:update', { must: true });

    expect(command.args.name.required).toBe(false);
    expect(command.flags).not.toHaveProperty('plugin');
  });
});

async function writeRegisteredPlugins(
  appRoot: string,
  packages: string[],
): Promise<void> {
  await mkdir(path.join(appRoot, 'server'), { recursive: true });
  await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
  await symlink(
    path.dirname(
      createRequire(import.meta.url).resolve('typescript/package.json'),
    ),
    path.join(appRoot, 'node_modules/typescript'),
    'junction',
  );
  await writeFile(
    path.join(appRoot, 'server/plugins.ts'),
    packages
      .map((name, index) => `import p${index} from '${name}/server';`)
      .join('\n') +
      `\nexport default defineServerPlugins([${packages.map((_, index) => `p${index}`).join(', ')}]);`,
  );
}
