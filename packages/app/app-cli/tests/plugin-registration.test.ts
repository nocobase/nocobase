import { existsSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { clientPluginsPath } from '../src/lib/client-plugins.ts';
import { serverPluginsPath } from '../src/lib/server-plugins.ts';
import {
  applyPluginRegistration,
  hasClientPluginEntry,
  hasServerPluginEntry,
  planPluginRegistration,
  planPluginUnregistration,
  pluginPackageName,
  pluginShortName,
  removePluginSkills,
} from '../src/lib/plugin-registration.ts';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

const require = createRequire(import.meta.url);

function moduleDirectory(packageName: string): string {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

/**
 * Builds a throwaway application. Planning a client entry loads TypeScript and Prettier from the application, so both
 * are linked from what this repository already installs; a plan made without them would exercise a different path.
 */
async function createApp(
  manifest: Record<string, unknown> = {},
  { typescript = true }: { typescript?: boolean } = {},
): Promise<string> {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nb3-register-'));
  created.push(appRoot);
  await writeFile(
    path.join(appRoot, 'package.json'),
    `${JSON.stringify({ name: 'demo-app', ...manifest }, null, 2)}\n`,
  );
  await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
  for (const dependency of typescript ? ['typescript', 'prettier'] : []) {
    await symlink(
      moduleDirectory(dependency),
      path.join(appRoot, 'node_modules', dependency),
      'junction',
    );
  }
  return appRoot;
}

/** Writes a plugin package on disk, with or without the `./client` export that decides the client entry. */
async function createPlugin(
  appRoot: string,
  packageName: string,
  { client = true, server = true }: { client?: boolean; server?: boolean } = {},
): Promise<string> {
  const pluginDirectory = path.join(
    appRoot,
    'node_modules',
    ...packageName.split('/'),
  );
  await mkdir(pluginDirectory, { recursive: true });
  await writeFile(
    path.join(pluginDirectory, 'package.json'),
    JSON.stringify({
      name: packageName,
      version: '1.0.0',
      exports: {
        ...(client ? { './client': './client/index.js' } : {}),
        ...(server ? { './server': './server/index.js' } : {}),
      },
    }),
  );
  return pluginDirectory;
}

interface AppManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  name?: string;
  nocobase?: { plugins?: Record<string, { enabled: boolean }> };
}

async function readManifest(appRoot: string): Promise<AppManifest> {
  return JSON.parse(
    await readFile(path.join(appRoot, 'package.json'), 'utf8'),
  ) as AppManifest;
}

/** The manifest a plan would write, so assertions read the planned text rather than the file on disk. */
function plannedManifest(manifestText: string | undefined): AppManifest {
  return JSON.parse(manifestText ?? '') as AppManifest;
}

async function writeAppSkill(
  appRoot: string,
  skillName: string,
): Promise<void> {
  const skillRoot = path.join(appRoot, '.agents', 'skills', skillName);
  await mkdir(skillRoot, { recursive: true });
  await writeFile(path.join(skillRoot, 'SKILL.md'), '# skill');
}

describe('pluginPackageName', () => {
  it('accepts an application-owned plugin scope', () => {
    expect(pluginPackageName('@my-app/app-plugin-audit-log')).toBe(
      '@my-app/app-plugin-audit-log',
    );
    expect(pluginShortName('@my-app/app-plugin-audit-log')).toBe('audit-log');
  });
  it('expands a short name into a plugin package', () => {
    expect(pluginPackageName('audit-log')).toBe(
      '@nocobase/app-plugin-audit-log',
    );
  });

  it('keeps a full package name as given', () => {
    expect(pluginPackageName('@nocobase/app-plugin-audit-log')).toBe(
      '@nocobase/app-plugin-audit-log',
    );
  });

  it('rejects a scoped name from another namespace', () => {
    expect(() => pluginPackageName('other/thing')).toThrow(
      'must be a short name',
    );
  });

  it('rejects an empty name', () => {
    expect(() => pluginPackageName('  ')).toThrow('A plugin name is required.');
  });

  it('rejects a name that is not lower-case kebab-case', () => {
    expect(() => pluginPackageName('Not-Kebab')).toThrow(
      'must be lower-case kebab-case',
    );
  });

  it('rejects a full package name with an invalid short name', () => {
    expect(() => pluginPackageName('@nocobase/app-plugin-Bad')).toThrow(
      'must be lower-case kebab-case',
    );
  });
});

describe('pluginShortName', () => {
  it('drops the plugin prefix', () => {
    expect(pluginShortName('@nocobase/app-plugin-audit-log')).toBe('audit-log');
  });

  it('passes through a name that carries no prefix', () => {
    expect(pluginShortName('audit-log')).toBe('audit-log');
  });
});

describe('hasClientPluginEntry', () => {
  it('is true when the package exports a client entry', async () => {
    const appRoot = await createApp();

    expect(
      await hasClientPluginEntry(
        await createPlugin(appRoot, '@nocobase/app-plugin-audit-log'),
      ),
    ).toBe(true);
  });

  it('is false for a server-only package', async () => {
    const appRoot = await createApp();

    expect(
      await hasClientPluginEntry(
        await createPlugin(appRoot, '@nocobase/app-plugin-cron', {
          client: false,
        }),
      ),
    ).toBe(false);
  });

  it('is false for a plugin that predates the client barrel', async () => {
    // Such a package has the descriptor but no `./client` to import it from, so registering it would write an import
    // the application cannot resolve. Skipping it is the safe read.
    const appRoot = await createApp();
    const pluginDirectory = path.join(appRoot, 'legacy');
    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      path.join(pluginDirectory, 'package.json'),
      JSON.stringify({
        name: '@nocobase/app-plugin-legacy',
        exports: { './client/plugin': './client/plugin.js' },
      }),
    );

    expect(await hasClientPluginEntry(pluginDirectory)).toBe(false);
  });

  it('is false when the manifest is missing', async () => {
    const appRoot = await createApp();

    expect(await hasClientPluginEntry(path.join(appRoot, 'nowhere'))).toBe(
      false,
    );
  });

  it('is false when the manifest cannot be parsed', async () => {
    const appRoot = await createApp();
    const pluginDirectory = path.join(appRoot, 'broken');
    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(path.join(pluginDirectory, 'package.json'), '{ not json');

    expect(await hasClientPluginEntry(pluginDirectory)).toBe(false);
  });

  it('is false when exports is not an object', async () => {
    const appRoot = await createApp();
    const pluginDirectory = path.join(appRoot, 'shorthand');
    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      path.join(pluginDirectory, 'package.json'),
      JSON.stringify({ name: 'x', exports: './index.js' }),
    );

    expect(await hasClientPluginEntry(pluginDirectory)).toBe(false);
  });
});

describe('hasServerPluginEntry', () => {
  it('recognizes the explicit server plugin export', async () => {
    const appRoot = await createApp();

    expect(
      await hasServerPluginEntry(
        await createPlugin(appRoot, '@nocobase/app-plugin-audit-log'),
      ),
    ).toBe(true);
  });

  it('is false for a client-only package', async () => {
    const appRoot = await createApp();

    expect(
      await hasServerPluginEntry(
        await createPlugin(appRoot, '@nocobase/app-plugin-client-only', {
          server: false,
        }),
      ),
    ).toBe(false);
  });
});

describe('planPluginRegistration', () => {
  it('registers and unregisters all entries of an application-scoped plugin', async () => {
    const appRoot = await createApp();
    const packageName = '@my-app/app-plugin-custom';
    const pluginDirectory = await createPlugin(appRoot, packageName);
    const manifestPath = path.join(pluginDirectory, 'package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    manifest.exports['./cli'] = './cli/index.js';
    await writeFile(manifestPath, JSON.stringify(manifest));
    const plan = await planPluginRegistration({
      appRoot,
      packageName,
      pluginDirectory,
      dependencyRange: 'workspace:*',
    });
    expect(plan.clientPluginsText).toContain(`${packageName}/client`);
    expect(plan.serverPluginsText).toContain(`${packageName}/server`);
    expect(plan.cliPluginsText).toContain(`${packageName}/cli`);
    await applyPluginRegistration(appRoot, plan);
    const removal = await planPluginUnregistration({ appRoot, packageName });
    expect(removal.clientPluginsChanged).toBe(true);
    expect(removal.serverPluginsChanged).toBe(true);
    expect(removal.cliPluginsChanged).toBe(true);
  });

  it('records the dependency, the registration, and the client entry', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });

    expect(plan.changed).toBe(true);
    expect(plan.manifestChanged).toBe(true);
    expect(plan.clientPluginsChanged).toBe(true);
    expect(plan.serverPluginsChanged).toBe(true);
    expect(plan.skippedClientEntry).toBeUndefined();
    expect(plan.clientPluginsPath).toBe(clientPluginsPath(appRoot));

    const manifest = plannedManifest(plan.manifestText);
    expect(manifest.dependencies).toEqual({
      '@nocobase/app-plugin-audit-log': '^1.0.0',
    });
    expect(manifest.devDependencies).toBeUndefined();
    expect(manifest.nocobase?.plugins).toBeUndefined();
    expect(plan.clientPluginsText).toContain(
      '@nocobase/app-plugin-audit-log/client',
    );
    expect(plan.serverPluginsText).toContain(
      '@nocobase/app-plugin-audit-log/server',
    );
  });

  it('records workspace dependencies as production dependencies', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: 'workspace:*',
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });

    const manifest = plannedManifest(plan.manifestText);
    expect(manifest.dependencies).toEqual({
      '@nocobase/app-plugin-audit-log': 'workspace:*',
    });
    expect(manifest.devDependencies).toBeUndefined();
  });

  it('writes nothing at plan time', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );

    await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });

    expect(await readManifest(appRoot)).toEqual({ name: 'demo-app' });
    expect(existsSync(clientPluginsPath(appRoot))).toBe(false);
    expect(existsSync(serverPluginsPath(appRoot))).toBe(false);
  });

  it('skips the client entry for a server-only plugin', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-cron',
      { client: false },
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-cron',
      pluginDirectory,
    });

    // Importing a client entry the package does not export would break the application's build, so the plugin is
    // registered on the server side alone.
    expect(plan.skippedClientEntry).toBe('no-client-entry');
    expect(plan.clientPluginsChanged).toBe(false);
    expect(plan.serverPluginsChanged).toBe(true);
    expect(plan.clientPluginsText).toBeUndefined();
    expect(plan.changed).toBe(true);
    expect(plan.manifestChanged).toBe(true);
  });

  it('skips the client entry for a disabled registration', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      enabled: false,
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });

    expect(plan.skippedClientEntry).toBe('disabled');
    expect(plan.enabled).toBe(false);
    expect(plan.clientPluginsChanged).toBe(false);
    expect(plan.serverPluginsChanged).toBe(false);
    expect(plan.skippedServerEntry).toBe('disabled');
    const manifest = plannedManifest(plan.manifestText);
    expect(manifest.nocobase?.plugins).toBeUndefined();
  });

  it('reports no change when the plugin is already registered', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );
    await applyPluginRegistration(
      appRoot,
      await planPluginRegistration({
        appRoot,
        dependencyRange: '^1.0.0',
        packageName: '@nocobase/app-plugin-audit-log',
        pluginDirectory,
      }),
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });

    expect(plan.changed).toBe(false);
    expect(plan.manifestChanged).toBe(false);
    expect(plan.clientPluginsChanged).toBe(false);
    expect(plan.serverPluginsChanged).toBe(false);
    expect(plan.manifestText).toBeUndefined();
    expect(plan.clientPluginsText).toBeUndefined();
  });

  it('uses source registration despite stale legacy metadata', async () => {
    const appRoot = await createApp({
      dependencies: { '@nocobase/app-plugin-cron': '^1.0.0' },
      nocobase: {
        plugins: { '@nocobase/app-plugin-cron': { enabled: false } },
      },
    });
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-cron',
      { client: false },
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-cron',
      pluginDirectory,
    });

    expect(plan.manifestChanged).toBe(false);
    expect(plan.serverPluginsChanged).toBe(true);
  });

  it.each(['dependencies', 'devDependencies'])(
    'refuses to overwrite a dependency pinned at another range in %s',
    async (field) => {
      const appRoot = await createApp({
        [field]: { '@nocobase/app-plugin-audit-log': '^1.0.0' },
      });
      const pluginDirectory = await createPlugin(
        appRoot,
        '@nocobase/app-plugin-audit-log',
      );

      await expect(
        planPluginRegistration({
          appRoot,
          dependencyRange: '^2.0.0',
          packageName: '@nocobase/app-plugin-audit-log',
          pluginDirectory,
        }),
      ).rejects.toThrow('refusing to overwrite it');
    },
  );

  it('inserts both keys in sorted order', async () => {
    const appRoot = await createApp({
      dependencies: {
        '@nocobase/app-plugin-alpha': '^1.0.0',
        '@nocobase/app-plugin-zulu': '^1.0.0',
      },
      nocobase: {
        plugins: {
          '@nocobase/app-plugin-alpha': { enabled: true },
          '@nocobase/app-plugin-zulu': { enabled: true },
        },
      },
    });
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-mike',
      { client: false },
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-mike',
      pluginDirectory,
    });

    const manifest = plannedManifest(plan.manifestText);
    const sorted = [
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-mike',
      '@nocobase/app-plugin-zulu',
    ];
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(sorted);
    expect(Object.keys(manifest.nocobase?.plugins ?? {})).toEqual([
      '@nocobase/app-plugin-alpha',
      '@nocobase/app-plugin-zulu',
    ]);
  });
});

describe('applyPluginRegistration', () => {
  it('writes the manifest and the client plugins file', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: '^1.0.0',
      packageName: '@nocobase/app-plugin-audit-log',
      pluginDirectory,
    });
    await applyPluginRegistration(appRoot, plan);

    const manifest = await readManifest(appRoot);
    expect(manifest.dependencies).toEqual({
      '@nocobase/app-plugin-audit-log': '^1.0.0',
    });
    expect(await readFile(clientPluginsPath(appRoot), 'utf8')).toBe(
      plan.clientPluginsText,
    );
    expect(await readFile(serverPluginsPath(appRoot), 'utf8')).toBe(
      plan.serverPluginsText,
    );
  });

  it('writes nothing when the plan changes nothing', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );
    await applyPluginRegistration(
      appRoot,
      await planPluginRegistration({
        appRoot,
        dependencyRange: '^1.0.0',
        packageName: '@nocobase/app-plugin-audit-log',
        pluginDirectory,
      }),
    );
    const before = await readFile(clientPluginsPath(appRoot), 'utf8');

    await applyPluginRegistration(
      appRoot,
      await planPluginRegistration({
        appRoot,
        dependencyRange: '^1.0.0',
        packageName: '@nocobase/app-plugin-audit-log',
        pluginDirectory,
      }),
    );

    expect(await readFile(clientPluginsPath(appRoot), 'utf8')).toBe(before);
  });

  it('leaves no client plugins file behind for a server-only plugin', async () => {
    const appRoot = await createApp();
    const pluginDirectory = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-cron',
      { client: false },
    );

    await applyPluginRegistration(
      appRoot,
      await planPluginRegistration({
        appRoot,
        dependencyRange: '^1.0.0',
        packageName: '@nocobase/app-plugin-cron',
        pluginDirectory,
      }),
    );

    expect(existsSync(clientPluginsPath(appRoot))).toBe(false);
  });
});

describe('planPluginUnregistration', () => {
  it('removes the dependency, the registration, and the client entry', async () => {
    const appRoot = await createApp();
    const auditLog = await createPlugin(
      appRoot,
      '@nocobase/app-plugin-audit-log',
    );
    const keep = await createPlugin(appRoot, '@nocobase/app-plugin-keep');
    for (const [packageName, pluginDirectory] of [
      ['@nocobase/app-plugin-keep', keep],
      ['@nocobase/app-plugin-audit-log', auditLog],
    ] as const) {
      await applyPluginRegistration(
        appRoot,
        await planPluginRegistration({
          appRoot,
          dependencyRange: '^1.0.0',
          packageName,
          pluginDirectory,
        }),
      );
    }

    const plan = await planPluginUnregistration({
      appRoot,
      packageName: '@nocobase/app-plugin-audit-log',
    });
    await applyPluginRegistration(appRoot, plan);

    expect(plan.changed).toBe(true);
    expect(plan.removedFrom).toEqual([
      'dependencies',
      'client/plugins.ts',
      'server/plugins.ts',
    ]);
    const manifest = await readManifest(appRoot);
    expect(manifest.dependencies).toEqual({
      '@nocobase/app-plugin-keep': '^1.0.0',
    });
    expect(manifest.nocobase?.plugins).toBeUndefined();
    const clientPlugins = await readFile(clientPluginsPath(appRoot), 'utf8');
    expect(clientPlugins).not.toContain('audit-log');
    expect(clientPlugins).toContain('@nocobase/app-plugin-keep/client');
  });

  it('removes a plugin recorded under dependencies too', async () => {
    const appRoot = await createApp({
      dependencies: { '@nocobase/app-plugin-cron': '^1.0.0' },
      nocobase: { plugins: { '@nocobase/app-plugin-cron': { enabled: true } } },
    });

    const plan = await planPluginUnregistration({
      appRoot,
      packageName: '@nocobase/app-plugin-cron',
    });

    expect(plan.removedFrom).toEqual(['dependencies', 'nocobase.plugins']);
    expect(plan.clientPluginsChanged).toBe(false);
    const manifest = plannedManifest(plan.manifestText);
    expect(manifest.dependencies).toEqual({});
    expect(manifest.nocobase?.plugins).toEqual({});
  });

  it('reports no change for a plugin that is not registered', async () => {
    const appRoot = await createApp();

    const plan = await planPluginUnregistration({
      appRoot,
      packageName: '@nocobase/app-plugin-missing',
    });

    expect(plan.changed).toBe(false);
    expect(plan.removedFrom).toEqual([]);
    expect(plan.manifestChanged).toBe(false);
    expect(plan.manifestText).toBeUndefined();
    expect(plan.clientPluginsText).toBeUndefined();
  });

  it('writes nothing at plan time', async () => {
    const appRoot = await createApp({
      devDependencies: { '@nocobase/app-plugin-cron': '^1.0.0' },
      nocobase: { plugins: { '@nocobase/app-plugin-cron': { enabled: true } } },
    });

    await planPluginUnregistration({
      appRoot,
      packageName: '@nocobase/app-plugin-cron',
    });

    const manifest = await readManifest(appRoot);
    expect(manifest.devDependencies).toEqual({
      '@nocobase/app-plugin-cron': '^1.0.0',
    });
  });
});

describe('removePluginSkills', () => {
  it('removes the directories the plugin owns and leaves the rest', async () => {
    const appRoot = await createApp();
    await writeAppSkill(appRoot, 'nocobase-app-plugin-demo');
    await writeAppSkill(appRoot, 'nocobase-app-plugin-demo-extra');
    await writeAppSkill(appRoot, 'nocobase-app-plugin-other');
    await writeAppSkill(appRoot, 'my-own-skill');

    const removed = await removePluginSkills(
      appRoot,
      '@nocobase/app-plugin-demo',
    );

    expect(removed).toEqual([
      'nocobase-app-plugin-demo',
      'nocobase-app-plugin-demo-extra',
    ]);
    expect(
      (await readdir(path.join(appRoot, '.agents', 'skills'))).sort(),
    ).toEqual(['my-own-skill', 'nocobase-app-plugin-other']);
  });

  it('removes nothing when the plugin owns no skills', async () => {
    const appRoot = await createApp();
    await writeAppSkill(appRoot, 'my-own-skill');

    expect(
      await removePluginSkills(appRoot, '@nocobase/app-plugin-demo'),
    ).toEqual([]);
    expect(await readdir(path.join(appRoot, '.agents', 'skills'))).toEqual([
      'my-own-skill',
    ]);
  });

  it('tolerates an application with no skills directory', async () => {
    const appRoot = await createApp();

    expect(
      await removePluginSkills(appRoot, '@nocobase/app-plugin-demo'),
    ).toEqual([]);
  });
});
