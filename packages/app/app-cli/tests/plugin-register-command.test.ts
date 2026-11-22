import type { Config } from '@oclif/core';
import { existsSync } from 'node:fs';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { runCommand as runPackageManager } from '../src/lib/run-command.ts';
import { loadTestConfig, runCommand } from './helpers.ts';

const created: string[] = [];
const require = createRequire(import.meta.url);
let config: Config;

function moduleDirectory(packageName: string): string {
  return path.dirname(require.resolve(`${packageName}/package.json`));
}

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

async function createAppWithInstalledPlugin({
  client = true,
  server = true,
  skills = true,
}: {
  client?: boolean;
  server?: boolean;
  skills?: boolean;
} = {}): Promise<string> {
  const appRoot = await mkdtemp(
    path.join(os.tmpdir(), 'nb3-register-command-'),
  );
  created.push(appRoot);

  await writeFile(
    path.join(appRoot, 'package.json'),
    `${JSON.stringify({ name: 'demo-app', private: true }, null, 2)}\n`,
  );
  await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
  for (const dependency of ['typescript', 'prettier']) {
    await symlink(
      moduleDirectory(dependency),
      path.join(appRoot, 'node_modules', dependency),
      'junction',
    );
  }

  const pluginRoot = path.join(
    appRoot,
    'node_modules',
    '@nocobase',
    'app-plugin-audit-log',
  );
  await mkdir(pluginRoot, { recursive: true });
  await writeFile(
    path.join(pluginRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: '@nocobase/app-plugin-audit-log',
        version: '1.0.0',
        exports: {
          ...(client ? { './client': './client/index.js' } : {}),
          ...(server ? { './server': './server/index.js' } : {}),
        },
      },
      null,
      2,
    )}\n`,
  );
  if (skills) {
    const skillRoot = path.join(
      pluginRoot,
      'skills',
      'nocobase-app-plugin-audit-log',
    );
    await mkdir(skillRoot, { recursive: true });
    await writeFile(path.join(skillRoot, 'SKILL.md'), '# Audit log\n');
  }

  return appRoot;
}

describe('app plugin register command', () => {
  it('keeps every registration surface unchanged during a dry run', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const manifestPath = path.join(appRoot, 'package.json');
    const originalManifest = await readFile(manifestPath, 'utf8');
    const clientPath = path.join(appRoot, 'client', 'plugins.ts');
    const serverPath = path.join(appRoot, 'server', 'plugins.ts');
    const synchronizedSkillPath = path.join(
      appRoot,
      '.agents',
      'skills',
      'nocobase-app-plugin-audit-log',
      'SKILL.md',
    );

    const result = await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--dry-run',
    ]);

    expect(result.stdout).toContain(
      'Would register @nocobase/app-plugin-audit-log as enabled',
    );
    expect(await readFile(manifestPath, 'utf8')).toBe(originalManifest);
    expect(existsSync(clientPath)).toBe(false);
    expect(existsSync(serverPath)).toBe(false);
    expect(existsSync(synchronizedSkillPath)).toBe(false);
  });

  it('returns structured register and unregister dry-run plans', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const registered = await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
      '--dry-run',
      '--json',
    ]);
    const registerResponse = JSON.parse(registered.stdout) as {
      status: string;
      result: {
        plan: { clientPluginsChanged: boolean; serverPluginsChanged: boolean };
      };
    };
    expect(registerResponse).toMatchObject({
      ok: true,
      command: 'plugin register',
      status: 'success-noop',
    });
    expect(registerResponse.result.plan).toMatchObject({
      clientPluginsChanged: true,
      serverPluginsChanged: true,
    });

    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const unregistered = await runCommand(config, 'plugin:remove', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
      '--dry-run',
      '--json',
    ]);
    const unregisterResponse = JSON.parse(unregistered.stdout) as {
      result: { skillRemovals: string[]; plan: { removedFrom: string[] } };
    };
    expect(unregisterResponse).toMatchObject({
      ok: true,
      command: 'plugin remove',
      status: 'success-noop',
    });
    expect(unregisterResponse.result.skillRemovals).toEqual([
      'nocobase-app-plugin-audit-log',
    ]);
    expect(unregisterResponse.result.plan.removedFrom).toEqual(
      expect.arrayContaining(['client/plugins.ts', 'server/plugins.ts']),
    );
  });

  it.each([
    ['pnpm', ['add', '--save-prod']],
    ['npm', ['install', '--save-prod']],
    ['yarn', ['add']],
  ] as const)(
    'previews a production dependency installation with %s',
    async (packageManager, installArgs) => {
      const appRoot = await mkdtemp(
        path.join(os.tmpdir(), 'nb3-register-command-'),
      );
      created.push(appRoot);
      await writeFile(
        path.join(appRoot, 'package.json'),
        JSON.stringify({
          name: 'demo-app',
          private: true,
          packageManager: `${packageManager}@1.0.0`,
        }),
      );

      const result = await runCommand(config, 'plugin:register', [
        'audit-log',
        '--dir',
        appRoot,
        '--dry-run',
        '--json',
      ]);

      expect(JSON.parse(result.stdout)).toMatchObject({
        schemaVersion: 1,
        ok: true,
        command: 'plugin register',
        // The preview stops at the install: the plugin's exports decide the rest of the plan.
        status: 'success-noop',
        result: {
          state: 'requires-installation',
          commands: [
            {
              command: packageManager,
              args: [...installArgs, '@nocobase/app-plugin-audit-log'],
            },
          ],
        },
      });
    },
  );

  it('reports idempotent register and unregister operations as JSON no-ops', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const args = ['audit-log', '--dir', appRoot, '--no-install'];
    await runCommand(config, 'plugin:register', args);

    const registered = await runCommand(config, 'plugin:register', [
      ...args,
      '--json',
    ]);
    expect(JSON.parse(registered.stdout)).toMatchObject({
      ok: true,
      command: 'plugin register',
      status: 'success-noop',
    });

    await runCommand(config, 'plugin:remove', args);
    const unregistered = await runCommand(config, 'plugin:remove', [
      ...args,
      '--json',
    ]);
    expect(JSON.parse(unregistered.stdout)).toMatchObject({
      ok: true,
      command: 'plugin remove',
      status: 'success-noop',
    });
  });

  it('removes an orphaned synchronized Skill even when registration is absent', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const skillDirectory = path.join(
      appRoot,
      '.agents',
      'skills',
      'nocobase-app-plugin-audit-log',
    );
    await mkdir(skillDirectory, { recursive: true });
    await writeFile(path.join(skillDirectory, 'SKILL.md'), '# Orphaned\n');

    const result = await runCommand(config, 'plugin:remove', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
      '--json',
    ]);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'plugin remove',
      status: 'success',
      result: {
        removedSkills: ['nocobase-app-plugin-audit-log'],
      },
    });
    expect(existsSync(skillDirectory)).toBe(false);
  });

  it('returns a structured update dry run and update no-op', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const empty = await runCommand(config, 'plugin:update', [
      '--dir',
      appRoot,
      '--dry-run',
      '--json',
    ]);
    expect(JSON.parse(empty.stdout)).toMatchObject({
      ok: true,
      command: 'plugin update',
      status: 'success-noop',
      result: { packageNames: [], commands: [] },
    });

    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const planned = await runCommand(config, 'plugin:update', [
      'audit-log',
      '--dir',
      appRoot,
      '--dry-run',
      '--json',
    ]);
    expect(JSON.parse(planned.stdout)).toMatchObject({
      ok: true,
      command: 'plugin update',
      status: 'success-noop',
      result: {
        mode: 'dry-run',
        packageNames: ['@nocobase/app-plugin-audit-log'],
        commands: [
          {
            command: 'pnpm',
            args: ['update', '@nocobase/app-plugin-audit-log'],
          },
        ],
      },
    });
  });

  it('inspects a consistent registration without writing it', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const manifestBefore = await readFile(
      path.join(appRoot, 'package.json'),
      'utf8',
    );

    const inspected = await runCommand(config, 'plugin:inspect', [
      'audit-log',
      '--dir',
      appRoot,
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: {
        issues: unknown[];
        composition: {
          client: { registered: boolean };
          server: { registered: boolean };
        };
        skills: { contentMatches: boolean };
      };
    };
    expect(response).toMatchObject({
      ok: true,
      command: 'plugin inspect',
      status: 'success',
    });
    expect(response.result.issues).toEqual([]);
    expect(response.result.composition.client.registered).toBe(true);
    expect(response.result.composition.server.registered).toBe(true);
    expect(response.result.skills.contentMatches).toBe(true);
    expect(await readFile(path.join(appRoot, 'package.json'), 'utf8')).toBe(
      manifestBefore,
    );
  });

  it('reports inconsistent runtime composition and stale Skills without writing', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const manifestPath = path.join(appRoot, 'package.json');
    await writeFile(
      path.join(
        appRoot,
        '.agents',
        'skills',
        'nocobase-app-plugin-audit-log',
        'SKILL.md',
      ),
      '# Locally changed\n',
    );
    const before = await readFile(manifestPath, 'utf8');

    const inspected = await runCommand(config, 'plugin:inspect', [
      'audit-log',
      '--dir',
      appRoot,
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: {
        consistent: boolean;
        issues: Array<{ code: string }>;
        suggestions: Array<{ command: string; args: string[] }>;
      };
    };
    expect(response.result.consistent).toBe(false);
    expect(response.result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['SKILLS_OUT_OF_DATE']),
    );
    // The full package name through `--package`, not the compatibility `--plugin` that `skills sync` steers away from.
    expect(response.result.suggestions).toContainEqual({
      command: 'pnpm',
      args: [
        'nocobase',
        'skills',
        'sync',
        '--package',
        '@nocobase/app-plugin-audit-log',
        '--dir',
        appRoot,
      ],
    });
    expect(await readFile(manifestPath, 'utf8')).toBe(before);
  });

  it('reports a plugin registered on only one of its Client and Server sides', async () => {
    const appRoot = await createAppWithInstalledPlugin({ client: false });
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    // The package gains a client entry the application never registered.
    const manifestPath = path.join(
      appRoot,
      'node_modules',
      '@nocobase',
      'app-plugin-audit-log',
      'package.json',
    );
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      exports: Record<string, string>;
    };
    manifest.exports['./client'] = './client/index.js';
    await writeFile(manifestPath, JSON.stringify(manifest));

    const inspected = await runCommand(config, 'plugin:inspect', [
      'audit-log',
      '--dir',
      appRoot,
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: {
        state: string;
        issues: Array<{ code: string; severity: string }>;
        suggestions: Array<{ command: string; args: string[] }>;
      };
    };
    expect(response.result.state).toBe('inconsistent');
    expect(response.result.issues).toContainEqual(
      expect.objectContaining({
        code: 'PARTIALLY_REGISTERED',
        severity: 'error',
      }),
    );
    expect(response.result.suggestions).toContainEqual({
      command: 'pnpm',
      args: [
        'nocobase',
        'plugin',
        'register',
        'audit-log',
        '--no-install',
        '--dir',
        appRoot,
      ],
    });
  });

  it('reports a Skills-only plugin in dependencies as registered', async () => {
    const appRoot = await createAppWithInstalledPlugin({
      client: false,
      server: false,
    });
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);

    const inspected = await runCommand(config, 'plugin:inspect', [
      'audit-log',
      '--dir',
      appRoot,
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: {
        state: string;
        registration: { enabled: boolean; skillsOnly: boolean };
        dependency: { field: string };
      };
    };
    expect(response.result.dependency.field).toBe('dependencies');
    expect(response.result.state).toBe('registered');
    expect(response.result.registration).toEqual({
      enabled: false,
      skillsOnly: true,
    });
  });

  it('suggests commands that target the same workspace application the inspection did', async () => {
    // The form the repository's own Skills use, against a workspace of its own: the real repository's `packages/` holds
    // other tests' temporary applications while they run, and the workspace scan would read them mid-write.
    const repositoryRoot = await mkdtemp(
      path.join(os.tmpdir(), 'nb3-inspect-workspace-'),
    );
    created.push(repositoryRoot);
    const hub = path.join(
      repositoryRoot,
      'packages',
      'templates',
      'app-template-hub',
    );
    await mkdir(hub, { recursive: true });
    await writeFile(
      path.join(hub, 'package.json'),
      `${JSON.stringify({ name: '@nocobase/app-template-hub', private: true })}\n`,
    );
    const inspected = await runCommand(config, 'plugin:inspect', [
      'not-installed',
      '--workspace-root',
      repositoryRoot,
      '--app',
      'app-template-hub',
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: { suggestions: Array<{ command: string; args: string[] }> };
    };
    expect(response.result.suggestions).toEqual([
      {
        command: 'pnpm',
        args: [
          'nocobase',
          'plugin',
          'register',
          'not-installed',
          '--workspace-root',
          repositoryRoot,
          '--app',
          'app-template-hub',
        ],
      },
    ]);
  });

  it('does not report stale Skills when an uninstalled plugin cannot be inspected', async () => {
    const appRoot = await createAppWithInstalledPlugin();

    const inspected = await runCommand(config, 'plugin:inspect', [
      'not-installed',
      '--dir',
      appRoot,
      '--json',
    ]);
    const response = JSON.parse(inspected.stdout) as {
      result: {
        issues: Array<{ code: string }>;
        skills: { checked: boolean; reason?: string };
        suggestions: Array<{ command: string; args: string[] }>;
      };
    };

    expect(response.result.skills).toMatchObject({
      checked: false,
      reason: 'plugin-not-installed',
    });
    expect(response.result.issues.map(({ code }) => code)).toEqual([
      'PLUGIN_NOT_INSTALLED',
      'DEPENDENCY_MISSING',
    ]);
    // A suggestion is a command that exists and targets the same App the inspection did.
    expect(response.result.suggestions).toEqual([
      {
        command: 'pnpm',
        args: [
          'nocobase',
          'plugin',
          'register',
          'not-installed',
          '--dir',
          appRoot,
        ],
      },
    ]);
  });

  it.each([
    ['client-only', { client: true, server: false }, true, false],
    ['server-only', { client: false, server: true }, false, true],
    ['full-stack', { client: true, server: true }, true, true],
  ] as const)(
    'registers a %s plugin only in the composition roots it exports',
    async (_name, plugin, clientExpected, serverExpected) => {
      const appRoot = await createAppWithInstalledPlugin(plugin);

      await runCommand(config, 'plugin:register', [
        'audit-log',
        '--dir',
        appRoot,
        '--no-install',
      ]);

      const manifest = JSON.parse(
        await readFile(path.join(appRoot, 'package.json'), 'utf8'),
      ) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        nocobase?: { plugins?: Record<string, { enabled: boolean }> };
      };
      expect(manifest.dependencies).toEqual({
        '@nocobase/app-plugin-audit-log': '^1.0.0',
      });
      expect(manifest.devDependencies).toBeUndefined();
      expect(manifest.nocobase?.plugins).toBeUndefined();
      expect(existsSync(path.join(appRoot, 'client', 'plugins.ts'))).toBe(
        clientExpected,
      );
      expect(existsSync(path.join(appRoot, 'server', 'plugins.ts'))).toBe(
        serverExpected,
      );
      expect(
        existsSync(
          path.join(
            appRoot,
            '.agents',
            'skills',
            'nocobase-app-plugin-audit-log',
            'SKILL.md',
          ),
        ),
      ).toBe(true);
    },
  );

  it.each([
    ['development only', undefined, '~1.0.0', '~1.0.0'],
    ['matching duplicate', '^1.0.0', '^1.0.0', '^1.0.0'],
    ['stale development duplicate', '^2.0.0', '^1.0.0', '^2.0.0'],
  ] as const)(
    'repairs %s declarations without installing or changing the declared range',
    async (_name, productionRange, developmentRange, expectedRange) => {
      const appRoot = await createAppWithInstalledPlugin();
      const manifestPath = path.join(appRoot, 'package.json');
      const packageName = '@nocobase/app-plugin-audit-log';
      const original = JSON.stringify({
        name: 'demo-app',
        dependencies: {
          ...(productionRange ? { [packageName]: productionRange } : {}),
          'other-runtime': '^1.0.0',
        },
        devDependencies: {
          [packageName]: developmentRange,
          'other-tool': '^1.0.0',
        },
      });
      await writeFile(manifestPath, original);
      const args = ['audit-log', '--dir', appRoot, '--no-install'];

      await runCommand(config, 'plugin:register', [...args, '--dry-run']);
      expect(await readFile(manifestPath, 'utf8')).toBe(original);

      await runCommand(config, 'plugin:register', args);
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
        dependencies: Record<string, string>;
        devDependencies: Record<string, string>;
      };
      expect(manifest.dependencies).toEqual({
        [packageName]: expectedRange,
        'other-runtime': '^1.0.0',
      });
      expect(manifest.devDependencies).toEqual({ 'other-tool': '^1.0.0' });
      const repeated = await runCommand(config, 'plugin:register', args);
      expect(repeated.stdout).toContain('is already registered');
    },
  );

  it.each(['npm', 'pnpm'] as const)(
    'migrates an installed development plugin with %s and synchronizes its lockfile',
    async (packageManager) => {
      const appRoot = await mkdtemp(
        path.join(os.tmpdir(), 'nb3-register-install-'),
      );
      created.push(appRoot);
      const packageName = '@nocobase/app-plugin-audit-log';
      const range = 'file:vendor/audit-log';
      const vendorRoot = path.join(appRoot, 'vendor', 'audit-log');
      await mkdir(vendorRoot, { recursive: true });
      await writeFile(
        path.join(vendorRoot, 'package.json'),
        JSON.stringify({ name: packageName, version: '1.0.0' }),
      );
      await writeFile(
        path.join(appRoot, 'package.json'),
        JSON.stringify({
          name: 'demo-app',
          private: true,
          ...(packageManager === 'npm' ? { packageManager: 'npm@11.0.0' } : {}),
        }),
      );
      await writeFile(
        path.join(appRoot, '.npmrc'),
        'audit=false\nfund=false\nignore-scripts=true\noffline=true\n',
      );
      await runPackageManager(
        packageManager,
        [
          packageManager === 'npm' ? 'install' : 'add',
          '--save-dev',
          `${packageName}@${range}`,
        ],
        { cwd: appRoot },
      );

      const result = await runCommand(config, 'plugin:register', [
        'audit-log',
        '--dir',
        appRoot,
        '--json',
      ]);
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: true });
      const manifest = JSON.parse(
        await readFile(path.join(appRoot, 'package.json'), 'utf8'),
      ) as {
        dependencies: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      expect(manifest.dependencies).toEqual({ [packageName]: range });
      expect(manifest.devDependencies?.[packageName]).toBeUndefined();

      if (packageManager === 'npm') {
        const lockfile = JSON.parse(
          await readFile(path.join(appRoot, 'package-lock.json'), 'utf8'),
        ) as {
          packages: Record<
            string,
            {
              dependencies?: Record<string, string>;
              devDependencies?: Record<string, string>;
            }
          >;
        };
        expect(lockfile.packages['']?.dependencies).toEqual({
          [packageName]: range,
        });
        expect(lockfile.packages['']?.devDependencies).toBeUndefined();
      } else {
        const lockfile = await readFile(
          path.join(appRoot, 'pnpm-lock.yaml'),
          'utf8',
        );
        expect(lockfile).toContain('dependencies:');
        expect(lockfile).not.toContain('devDependencies:');
        expect(lockfile).toContain(`specifier: ${range}`);
        await runPackageManager('pnpm', ['install', '--frozen-lockfile'], {
          cwd: appRoot,
        });
      }

      await runCommand(config, 'plugin:unregister', [
        'audit-log',
        '--dir',
        appRoot,
      ]);
      const retained = JSON.parse(
        await readFile(path.join(appRoot, 'package.json'), 'utf8'),
      );
      expect(retained.devDependencies?.[packageName]).toBe(range);
      expect(retained.dependencies?.[packageName]).toBeUndefined();
      if (packageManager === 'pnpm')
        await runPackageManager('pnpm', ['install', '--frozen-lockfile'], {
          cwd: appRoot,
        });
      else
        expect(
          JSON.parse(
            await readFile(path.join(appRoot, 'package-lock.json'), 'utf8'),
          ).packages[''].devDependencies[packageName],
        ).toBe(range);
    },
    30_000,
  );

  it('installs a disabled plugin without metadata or runtime entries', async () => {
    const appRoot = await createAppWithInstalledPlugin();

    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
      '--disabled',
    ]);

    const manifest = JSON.parse(
      await readFile(path.join(appRoot, 'package.json'), 'utf8'),
    ) as {
      devDependencies?: Record<string, string>;
      nocobase?: { plugins?: Record<string, { enabled: boolean }> };
    };
    expect(manifest.devDependencies).toEqual({
      '@nocobase/app-plugin-audit-log': '^1.0.0',
    });
    expect(manifest.nocobase?.plugins).toBeUndefined();
    expect(existsSync(path.join(appRoot, 'client', 'plugins.ts'))).toBe(false);
    expect(existsSync(path.join(appRoot, 'server', 'plugins.ts'))).toBe(false);
  });

  it('keeps the plugin and its Skills after removing the runtime entries', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const pkg = '@nocobase/app-plugin-audit-log';
    const args = [pkg, '--dir', appRoot, '--no-install'];
    const manifest = async () =>
      JSON.parse(await readFile(path.join(appRoot, 'package.json'), 'utf8'));
    await runCommand(config, 'plugin:register', [...args, '--disabled']);
    expect((await manifest()).devDependencies[pkg]).toBe('^1.0.0');
    await runCommand(config, 'plugin:register', args);
    expect((await manifest()).dependencies[pkg]).toBe('^1.0.0');
    const consumer = path.join(appRoot, 'server', 'consumer.ts');
    await writeFile(consumer, `export {default} from '${pkg}/server';`);
    await expect(runCommand(config, 'plugin:unregister', args)).rejects.toThrow(
      'server/consumer.ts',
    );
    expect((await manifest()).dependencies[pkg]).toBe('^1.0.0');
    await rm(consumer);
    await runCommand(config, 'plugin:unregister', args);
    expect((await manifest()).devDependencies[pkg]).toBe('^1.0.0');
    expect((await manifest()).dependencies[pkg]).toBeUndefined();
    for (const side of ['server', 'client'])
      expect(
        await readFile(path.join(appRoot, side, 'plugins.ts'), 'utf8'),
      ).not.toContain(pkg);
    expect(
      existsSync(
        path.join(
          appRoot,
          '.agents/skills/nocobase-app-plugin-audit-log/SKILL.md',
        ),
      ),
    ).toBe(true);
    await runCommand(config, 'plugin:register', args);
    expect((await manifest()).dependencies[pkg]).toBe('^1.0.0');
  });

  it('skips Skill synchronization when --no-skills is explicit', async () => {
    const appRoot = await createAppWithInstalledPlugin();

    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
      '--no-skills',
    ]);

    expect(existsSync(path.join(appRoot, '.agents', 'skills'))).toBe(false);
  });

  it('is idempotent after registration and unregisters every owned surface', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const args = ['audit-log', '--dir', appRoot, '--no-install'];

    await runCommand(config, 'plugin:register', args);
    const manifestPath = path.join(appRoot, 'package.json');
    const clientPath = path.join(appRoot, 'client', 'plugins.ts');
    const serverPath = path.join(appRoot, 'server', 'plugins.ts');
    const before = await Promise.all(
      [manifestPath, clientPath, serverPath].map((file) =>
        readFile(file, 'utf8'),
      ),
    );

    const repeated = await runCommand(config, 'plugin:register', args);
    expect(repeated.stdout).toContain('is already registered');
    await expect(
      Promise.all(
        [manifestPath, clientPath, serverPath].map((file) =>
          readFile(file, 'utf8'),
        ),
      ),
    ).resolves.toEqual(before);

    await runCommand(config, 'plugin:remove', args);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
      dependencies?: Record<string, string>;
      nocobase?: { plugins?: Record<string, unknown> };
    };
    expect(manifest.dependencies).toEqual({});
    expect(manifest.nocobase?.plugins).toBeUndefined();
    expect(await readFile(clientPath, 'utf8')).not.toContain('audit-log');
    expect(await readFile(serverPath, 'utf8')).not.toContain('audit-log');
    expect(existsSync(path.join(appRoot, '.agents', 'skills'))).toBe(true);
    expect(
      existsSync(
        path.join(
          appRoot,
          '.agents',
          'skills',
          'nocobase-app-plugin-audit-log',
        ),
      ),
    ).toBe(false);
  });

  it('keeps every registered surface unchanged during unregister dry-run', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const args = ['audit-log', '--dir', appRoot, '--no-install'];
    await runCommand(config, 'plugin:register', args);
    const paths = [
      path.join(appRoot, 'package.json'),
      path.join(appRoot, 'client', 'plugins.ts'),
      path.join(appRoot, 'server', 'plugins.ts'),
      path.join(
        appRoot,
        '.agents',
        'skills',
        'nocobase-app-plugin-audit-log',
        'SKILL.md',
      ),
    ];
    const before = await Promise.all(
      paths.map((file) => readFile(file, 'utf8')),
    );

    const result = await runCommand(config, 'plugin:remove', [
      ...args,
      '--dry-run',
    ]);

    expect(result.stdout).toContain('Would remove');
    await expect(
      Promise.all(paths.map((file) => readFile(file, 'utf8'))),
    ).resolves.toEqual(before);
  });

  it('updates plugin-owned Skills explicitly without touching app-owned Skills', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const args = ['audit-log', '--dir', appRoot, '--no-install'];
    await runCommand(config, 'plugin:register', args);

    const installedSkill = path.join(
      appRoot,
      'node_modules',
      '@nocobase',
      'app-plugin-audit-log',
      'skills',
      'nocobase-app-plugin-audit-log',
      'SKILL.md',
    );
    const synchronizedSkill = path.join(
      appRoot,
      '.agents',
      'skills',
      'nocobase-app-plugin-audit-log',
      'SKILL.md',
    );
    const appSkill = path.join(
      appRoot,
      '.agents',
      'skills',
      'my-app-skill',
      'SKILL.md',
    );
    await writeFile(installedSkill, '# Updated upstream\n');
    await mkdir(path.dirname(appSkill), { recursive: true });
    await writeFile(appSkill, '# App owned\n');

    const dryRun = await runCommand(config, 'skills:sync', [
      '--dir',
      appRoot,
      '--plugin',
      'audit-log',
      '--dry-run',
      '--json',
    ]);
    const response = JSON.parse(dryRun.stdout) as {
      schemaVersion: number;
      ok: boolean;
      command: string;
      status: string;
      result: {
        dryRun: boolean;
        copies: Array<{ skillName: string }>;
      };
    };
    expect(response).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'skills sync',
      status: 'success-noop',
    });
    expect(response.result.dryRun).toBe(true);
    expect(response.result.copies).toEqual([
      expect.objectContaining({
        skillName: 'nocobase-app-plugin-audit-log',
      }),
    ]);
    expect(await readFile(synchronizedSkill, 'utf8')).toBe('# Audit log\n');

    await runCommand(config, 'skills:sync', [
      '--dir',
      appRoot,
      '--plugin',
      'audit-log',
    ]);
    expect(await readFile(synchronizedSkill, 'utf8')).toBe(
      '# Updated upstream\n',
    );
    expect(await readFile(appSkill, 'utf8')).toBe('# App owned\n');
  });

  it.each([
    { scope: 'all registered plugins', flags: [] },
    {
      scope: 'one full package name',
      flags: ['--package', '@nocobase/app-plugin-audit-log'],
    },
  ])('synchronizes $scope through the general command', async ({ flags }) => {
    const appRoot = await createAppWithInstalledPlugin();
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);

    const synchronized = await runCommand(config, 'skills:sync', [
      '--dir',
      appRoot,
      ...flags,
      '--dry-run',
      '--json',
    ]);

    expect(JSON.parse(synchronized.stdout)).toMatchObject({
      schemaVersion: 1,
      ok: true,
      command: 'skills sync',
      status: 'success-noop',
      result: {
        dryRun: true,
        copies: [
          {
            packageName: '@nocobase/app-plugin-audit-log',
            skillName: 'nocobase-app-plugin-audit-log',
          },
        ],
      },
    });
  });

  it('prints one JSON error document on stdout when Skills synchronization fails', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const lines: string[] = [];
    const errors: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalExitCode = process.exitCode;
    console.log = (...args: unknown[]): void => {
      lines.push(args.map((argument) => String(argument)).join(' '));
    };
    console.error = (...args: unknown[]): void => {
      errors.push(args.map((argument) => String(argument)).join(' '));
    };

    try {
      await expect(
        config.runCommand('skills:sync', [
          '--dir',
          appRoot,
          '--plugin',
          'missing',
          '--dry-run',
          '--json',
        ]),
      ).resolves.toBeUndefined();
      expect(process.exitCode).toBe(1);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      process.exitCode = originalExitCode;
    }

    expect(errors).toEqual([]);
    expect(lines).toHaveLength(1);
    const response = JSON.parse(lines[0]) as {
      schemaVersion: number;
      ok: boolean;
      command: string;
      status: string;
      error: {
        code: string;
        message: string;
        suggestions: { message: string }[];
      };
    };
    expect(response).toMatchObject({
      schemaVersion: 1,
      ok: false,
      command: 'skills sync',
      status: 'failure',
      error: {
        code: 'PLUGIN_NOT_INSTALLED',
        message: expect.any(String),
        suggestions: [
          {
            message:
              'Run the App package manager install, then retry the sync.',
          },
        ],
      },
    });
  });

  it('reports a --json failure with its code and suggestion, and exits 1', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const previousExitCode = process.exitCode;
    let exitCode: typeof process.exitCode;
    let stdout: string;
    try {
      ({ stdout } = await runCommand(config, 'plugin:register', [
        'not-installed',
        '--dir',
        appRoot,
        '--no-install',
        '--json',
      ]));
      exitCode = process.exitCode;
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(JSON.parse(stdout)).toEqual({
      schemaVersion: 1,
      ok: false,
      command: 'plugin register',
      status: 'failure',
      error: {
        code: 'PLUGIN_NOT_INSTALLED',
        message: `@nocobase/app-plugin-not-installed is not installed in ${appRoot} and --no-install was given.`,
        suggestions: [{ message: 'Install dependencies and retry.' }],
      },
      warnings: [],
    });
    expect(exitCode).toBe(1);
  });

  it('reports invalid usage under --json with exit code 2', async () => {
    const previousExitCode = process.exitCode;
    let exitCode: typeof process.exitCode;
    let stdout: string;
    try {
      ({ stdout } = await runCommand(config, 'skills:sync', [
        '--package',
        '@nocobase/app-skills',
        '--plugin',
        'audit-log',
        '--json',
      ]));
      exitCode = process.exitCode;
    } finally {
      process.exitCode = previousExitCode;
    }

    expect(JSON.parse(stdout)).toMatchObject({
      ok: false,
      command: 'skills sync',
      status: 'failure',
    });
    expect(exitCode).toBe(2);
  });

  it('keeps the package manager exit code when an install fails', async () => {
    const appRoot = await mkdtemp(
      path.join(os.tmpdir(), 'nb3-register-command-'),
    );
    created.push(appRoot);
    await writeFile(
      path.join(appRoot, 'package.json'),
      JSON.stringify({ name: 'demo-app', packageManager: 'pnpm@11.0.0' }),
    );
    const binRoot = path.join(appRoot, 'fake-bin');
    await mkdir(binRoot, { recursive: true });
    await writeFile(path.join(binRoot, 'pnpm'), '#!/bin/sh\nexit 17\n');
    await chmod(path.join(binRoot, 'pnpm'), 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = `${binRoot}${path.delimiter}${previousPath ?? ''}`;
    try {
      await expect(
        runCommand(config, 'plugin:register', ['audit-log', '--dir', appRoot]),
      ).rejects.toMatchObject({
        message: 'pnpm exited with code 17. Nothing was registered.',
        errorCode: 'PLUGIN_COMMAND_FAILED',
        oclif: { exit: 17 },
      });
    } finally {
      process.env.PATH = previousPath;
    }
  });

  it('unregisters as a partial success, with an issue and a warning, when the package manager fails', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    const manifestPath = path.join(appRoot, 'package.json');
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
      string,
      unknown
    >;
    await writeFile(
      manifestPath,
      JSON.stringify({ ...manifest, packageManager: 'pnpm@11.0.0' }),
    );
    const binRoot = path.join(appRoot, 'fake-bin');
    await mkdir(binRoot, { recursive: true });
    await writeFile(path.join(binRoot, 'pnpm'), '#!/bin/sh\nexit 17\n');
    await chmod(path.join(binRoot, 'pnpm'), 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = `${binRoot}${path.delimiter}${previousPath ?? ''}`;
    let stdout: string;
    try {
      ({ stdout } = await runCommand(config, 'plugin:remove', [
        'audit-log',
        '--dir',
        appRoot,
        '--json',
      ]));
    } finally {
      process.env.PATH = previousPath;
    }

    expect(JSON.parse(stdout)).toMatchObject({
      ok: true,
      command: 'plugin remove',
      status: 'partial-success',
      result: {
        mode: 'remove',
        removedSkills: ['nocobase-app-plugin-audit-log'],
        issues: [
          {
            code: 'PACKAGE_MANAGER_FAILED',
            suggestions: [
              {
                message:
                  'Remove the package dependency manually and reinstall dependencies.',
              },
            ],
          },
        ],
      },
      warnings: [
        'pnpm exited with code 17; the package may still be installed. Continuing to unregister it.',
      ],
    });
    expect(
      await readFile(path.join(appRoot, 'client', 'plugins.ts'), 'utf8'),
    ).not.toContain('audit-log');
  });

  it('prints the same summary for the flagless sync every template postinstall runs', async () => {
    const appRoot = await createAppWithInstalledPlugin();
    await runCommand(config, 'plugin:register', [
      'audit-log',
      '--dir',
      appRoot,
      '--no-install',
    ]);
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(appRoot);
    let stdout: string;
    try {
      ({ stdout } = await runCommand(config, 'skills:sync'));
    } finally {
      cwd.mockRestore();
    }

    expect(stdout).toBe(
      [
        'Synchronized NocoBase package skills for demo-app',
        '  copy nocobase-app-plugin-audit-log (@nocobase/app-plugin-audit-log)',
      ].join('\n'),
    );
  });
});
