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
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { loadTestConfig, runCommand } from './helpers.ts';

const created: string[] = [];
const require = createRequire(import.meta.url);
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

async function createApp(manifest: Record<string, unknown>): Promise<string> {
  const appRoot = await mkdtemp(path.join(os.tmpdir(), 'nb3-package-remove-'));
  created.push(appRoot);
  await writeFile(
    path.join(appRoot, 'package.json'),
    `${JSON.stringify({ name: 'demo-app', private: true, ...manifest }, null, 2)}\n`,
  );
  return appRoot;
}

async function addOwnedSkill(
  appRoot: string,
  packageName = '@nocobase/app-skills',
  skillName = 'nocobase-app-development',
): Promise<string> {
  const skillRoot = path.join(appRoot, '.agents', 'skills', skillName);
  await mkdir(skillRoot, { recursive: true });
  await writeFile(path.join(skillRoot, 'SKILL.md'), '# synchronized\n');
  await writeFile(
    path.join(appRoot, '.agents', '.skills-sync.json'),
    `${JSON.stringify({ [skillName]: packageName }, null, 2)}\n`,
  );
  return skillRoot;
}

async function addFakePackageManager(
  appRoot: string,
  exitCode: number,
): Promise<{ binRoot: string; marker: string }> {
  const binRoot = path.join(appRoot, 'fake-bin');
  const marker = path.join(appRoot, 'package-manager-ran');
  const executable = path.join(binRoot, 'pnpm');
  await mkdir(binRoot, { recursive: true });
  await writeFile(
    executable,
    `#!/bin/sh\ntouch '${marker}'\nexit ${exitCode}\n`,
  );
  await chmod(executable, 0o755);
  return { binRoot, marker };
}

describe('package remove command', () => {
  it('previews all direct dependency sections without running the package manager or writing files', async () => {
    const packageName = '@nocobase/app-skills';
    const appRoot = await createApp({
      packageManager: 'pnpm@11.0.0',
      dependencies: { [packageName]: '1' },
      devDependencies: { [packageName]: '1' },
      optionalDependencies: { [packageName]: '1' },
      peerDependencies: { [packageName]: '1' },
    });
    const skillRoot = await addOwnedSkill(appRoot);
    const manifestBefore = await readFile(
      path.join(appRoot, 'package.json'),
      'utf8',
    );
    const ownershipBefore = await readFile(
      path.join(appRoot, '.agents', '.skills-sync.json'),
      'utf8',
    );
    const { binRoot, marker } = await addFakePackageManager(appRoot, 1);
    const previousPath = process.env.PATH;
    process.env.PATH = `${binRoot}${path.delimiter}${previousPath ?? ''}`;
    try {
      const result = await runCommand(config, 'package:remove', [
        packageName,
        '--dir',
        appRoot,
        '--dry-run',
        '--json',
      ]);

      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: true,
        command: 'package remove',
        status: 'success-noop',
        result: {
          mode: 'dry-run',
          packageName,
          dependencySections: [
            'dependencies',
            'devDependencies',
            'optionalDependencies',
            'peerDependencies',
          ],
          skillRemovals: ['nocobase-app-development'],
          commands: [
            {
              command: 'pnpm',
              args: ['remove', packageName],
              cwd: appRoot,
            },
          ],
        },
      });
    } finally {
      process.env.PATH = previousPath;
    }
    expect(existsSync(marker)).toBe(false);
    expect(existsSync(skillRoot)).toBe(true);
    expect(await readFile(path.join(appRoot, 'package.json'), 'utf8')).toBe(
      manifestBefore,
    );
    expect(
      await readFile(
        path.join(appRoot, '.agents', '.skills-sync.json'),
        'utf8',
      ),
    ).toBe(ownershipBefore);
  });

  it('uses npm to remove a declared package before deleting its synchronized skills', async () => {
    const packageName = '@nocobase/app-skills';
    const appRoot = await createApp({
      packageManager: 'npm@11.0.0',
      devDependencies: { [packageName]: 'file:vendor/app-skills' },
    });
    const vendorRoot = path.join(appRoot, 'vendor', 'app-skills');
    await mkdir(path.join(appRoot, 'node_modules', '@nocobase'), {
      recursive: true,
    });
    await mkdir(vendorRoot, { recursive: true });
    await writeFile(
      path.join(vendorRoot, 'package.json'),
      `${JSON.stringify({ name: packageName, version: '1.0.0' }, null, 2)}\n`,
    );
    await symlink(
      vendorRoot,
      path.join(appRoot, 'node_modules', '@nocobase', 'app-skills'),
      'junction',
    );
    await writeFile(
      path.join(appRoot, 'package-lock.json'),
      `${JSON.stringify(
        {
          name: 'demo-app',
          lockfileVersion: 3,
          requires: true,
          packages: {
            '': {
              name: 'demo-app',
              devDependencies: {
                [packageName]: 'file:vendor/app-skills',
              },
            },
            'node_modules/@nocobase/app-skills': {
              resolved: 'vendor/app-skills',
              link: true,
            },
            'vendor/app-skills': {
              name: packageName,
              version: '1.0.0',
              dev: true,
            },
          },
        },
        null,
        2,
      )}\n`,
    );
    await writeFile(
      path.join(appRoot, '.npmrc'),
      'audit=false\nfund=false\nignore-scripts=true\noffline=true\n',
    );
    const skillRoot = await addOwnedSkill(appRoot);

    const result = await runCommand(config, 'package:remove', [
      packageName,
      '--dir',
      appRoot,
      '--json',
    ]);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'package remove',
      status: 'success',
      result: {
        mode: 'remove',
        removedFrom: ['devDependencies'],
        removedSkills: ['nocobase-app-development'],
      },
    });
    const manifest = JSON.parse(
      await readFile(path.join(appRoot, 'package.json'), 'utf8'),
    ) as { devDependencies?: Record<string, string> };
    const lockfile = JSON.parse(
      await readFile(path.join(appRoot, 'package-lock.json'), 'utf8'),
    ) as {
      packages?: Record<string, { devDependencies?: Record<string, string> }>;
    };
    expect(manifest.devDependencies?.[packageName]).toBeUndefined();
    expect(
      lockfile.packages?.['']?.devDependencies?.[packageName],
    ).toBeUndefined();
    expect(existsSync(skillRoot)).toBe(false);
  });

  it('keeps skills and ownership when the package manager fails', async () => {
    const packageName = '@nocobase/app-skills';
    const appRoot = await createApp({
      packageManager: 'pnpm@11.0.0',
      dependencies: { [packageName]: '1' },
    });
    const skillRoot = await addOwnedSkill(appRoot);
    const ownershipBefore = await readFile(
      path.join(appRoot, '.agents', '.skills-sync.json'),
      'utf8',
    );
    const { binRoot, marker } = await addFakePackageManager(appRoot, 17);
    const previousPath = process.env.PATH;
    process.env.PATH = `${binRoot}${path.delimiter}${previousPath ?? ''}`;
    try {
      await expect(
        runCommand(config, 'package:remove', [packageName, '--dir', appRoot]),
      ).rejects.toThrow(`pnpm could not remove ${packageName}`);
    } finally {
      process.env.PATH = previousPath;
    }
    expect(existsSync(marker)).toBe(true);
    expect(existsSync(skillRoot)).toBe(true);
    expect(
      await readFile(
        path.join(appRoot, '.agents', '.skills-sync.json'),
        'utf8',
      ),
    ).toBe(ownershipBefore);
  });

  it('cleans tracked skills for an absent package without removing a transitive installation', async () => {
    const packageName = '@nocobase/app-skills';
    const appRoot = await createApp({ packageManager: 'pnpm@11.0.0' });
    const installedRoot = path.join(appRoot, 'node_modules', packageName);
    await mkdir(installedRoot, { recursive: true });
    await writeFile(
      path.join(installedRoot, 'package.json'),
      `${JSON.stringify({ name: packageName, version: '1.0.0' }, null, 2)}\n`,
    );
    const skillRoot = await addOwnedSkill(appRoot);

    const result = await runCommand(config, 'package:remove', [
      packageName,
      '--dir',
      appRoot,
      '--json',
    ]);

    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'package remove',
      status: 'success',
      result: {
        removedFrom: [],
        removedSkills: ['nocobase-app-development'],
        commands: [],
      },
    });
    expect(existsSync(installedRoot)).toBe(true);
    expect(existsSync(skillRoot)).toBe(false);
    expect(
      JSON.parse(
        await readFile(
          path.join(appRoot, '.agents', '.skills-sync.json'),
          'utf8',
        ),
      ),
    ).toEqual({});
  });

  it('is a no-op without creating .agents when neither a declaration nor ownership exists', async () => {
    const appRoot = await createApp({});
    const result = await runCommand(config, 'package:remove', [
      '@nocobase/app-skills',
      '--dir',
      appRoot,
      '--json',
    ]);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'package remove',
      status: 'success-noop',
    });
    expect(existsSync(path.join(appRoot, '.agents'))).toBe(false);
  });

  it.each([
    '@nocobase/app-plugin-audit-log',
    '@nocobase/app-module-audit-log',
    '@acme/app-plugin-audit-log',
    '@acme/app-module-audit-log',
  ])(
    'unregisters contributions and Skills when removing %s',
    async (packageName) => {
      const skillName = packageName.slice(1).replace('/', '-');
      const appRoot = await createApp({});
      await mkdir(path.join(appRoot, 'node_modules'), { recursive: true });
      for (const dependency of ['typescript', 'prettier']) {
        await symlink(
          path.dirname(require.resolve(`${dependency}/package.json`)),
          path.join(appRoot, 'node_modules', dependency),
          'junction',
        );
      }
      const pluginRoot = path.join(appRoot, 'node_modules', packageName);
      await mkdir(path.join(pluginRoot, 'skills', skillName), {
        recursive: true,
      });
      await writeFile(
        path.join(pluginRoot, 'package.json'),
        `${JSON.stringify(
          {
            name: packageName,
            version: '1.0.0',
            exports: {
              './client': './client/index.js',
              './server': './server/index.js',
              './cli': './cli/index.js',
            },
          },
          null,
          2,
        )}\n`,
      );
      await writeFile(
        path.join(pluginRoot, 'skills', skillName, 'SKILL.md'),
        '# Audit log\n',
      );
      await runCommand(config, 'plugin:register', [
        packageName,
        '--dir',
        appRoot,
        '--no-install',
      ]);
      const dryRun = await runCommand(config, 'package:remove', [
        packageName,
        '--dir',
        appRoot,
        '--dry-run',
      ]);
      expect(dryRun.stdout).toContain(`pnpm remove ${packageName}`);
      expect(dryRun.stdout).toContain(`would remove skill ${skillName}`);
      const manifestPath = path.join(appRoot, 'package.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
        dependencies?: Record<string, string>;
      };
      delete manifest.dependencies?.[packageName];
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

      const result = await runCommand(config, 'package:remove', [
        packageName,
        '--dir',
        appRoot,
        '--json',
      ]);

      const response = JSON.parse(result.stdout) as {
        command: string;
        result: { removedFrom: string[]; removedSkills: string[] };
      };
      expect(response.command).toBe('package remove');
      expect(response.result.removedFrom).toEqual(
        expect.arrayContaining([
          'client/plugins.ts',
          'server/plugins.ts',
          'cli/plugins.ts',
        ]),
      );
      expect(response.result.removedSkills).toEqual([skillName]);
      for (const relativePath of [
        'client/plugins.ts',
        'server/plugins.ts',
        'cli/plugins.ts',
      ]) {
        expect(
          await readFile(path.join(appRoot, relativePath), 'utf8'),
        ).not.toContain(packageName);
      }
      expect(existsSync(pluginRoot)).toBe(true);
    },
  );

  it('rejects short names and unrelated custom-scope packages', async () => {
    const appRoot = await createApp({});
    await expect(
      runCommand(config, 'package:remove', ['app-skills', '--dir', appRoot]),
    ).rejects.toThrow('must be a full @nocobase/* package name');
    await expect(
      runCommand(config, 'package:remove', ['lodash', '--dir', appRoot]),
    ).rejects.toThrow('must be a full @nocobase/* package name');
  });

  it.each([
    '@acme/core',
    '@acme/app-module-',
    '@acme/app-plugin-demo/../other',
  ])(
    'rejects an unsupported package identity %s before changing the app',
    async (packageName) => {
      const appRoot = await createApp({});
      await expect(
        runCommand(config, 'package:remove', [packageName, '--dir', appRoot]),
      ).rejects.toThrow('must be a full @nocobase/* package name');
      expect(existsSync(path.join(appRoot, '.agents'))).toBe(false);
    },
  );

  it('prints a --json failure on stdout, like a success, and exits non-zero', async () => {
    const appRoot = await createApp({});
    const previousExitCode = process.exitCode;
    try {
      const result = await runCommand(config, 'package:remove', [
        'app-skills',
        '--dir',
        appRoot,
        '--json',
      ]);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: false,
        command: 'package remove',
      });
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = previousExitCode;
    }
  });
});
