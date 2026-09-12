/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, expect, test, vi } from 'vitest';
import {
  getManagedSkillsStateFile,
  installNocoBaseSkills,
  isNpmRegistryUnavailable,
  inspectSkillsStatus,
  NOCOBASE_SKILLS_PACKAGE_NAME,
  removeNocoBaseSkills,
  resolveGlobalSkillsRoot,
  resolveSkillsWorkspaceRoot,
  updateNocoBaseSkills,
} from '../lib/skills-manager.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

function encodeOctal(value: number, length: number): Buffer {
  const text = value.toString(8).padStart(length - 1, '0');
  return Buffer.from(`${text}\0`, 'ascii');
}

function writeTarHeader(buffer: Buffer, name: string, size: number, typeflag = '0'): void {
  buffer.fill(0);
  Buffer.from(name, 'utf8').copy(buffer, 0, 0, Math.min(Buffer.byteLength(name), 100));
  encodeOctal(0o644, 8).copy(buffer, 100);
  encodeOctal(0, 8).copy(buffer, 108);
  encodeOctal(0, 8).copy(buffer, 116);
  encodeOctal(size, 12).copy(buffer, 124);
  encodeOctal(Math.floor(Date.now() / 1000), 12).copy(buffer, 136);
  buffer.fill(0x20, 148, 156);
  buffer.write(typeflag, 156, 1, 'ascii');
  Buffer.from('ustar\0', 'ascii').copy(buffer, 257);
  Buffer.from('00', 'ascii').copy(buffer, 263);

  let checksum = 0;
  for (const byte of buffer) {
    checksum += byte;
  }
  Buffer.from(checksum.toString(8).padStart(6, '0')).copy(buffer, 148);
  buffer[154] = 0;
  buffer[155] = 0x20;
}

function buildTarGz(files: Record<string, string>): Buffer {
  const chunks: Buffer[] = [];

  for (const [name, content] of Object.entries(files)) {
    const body = Buffer.from(content, 'utf8');
    const header = Buffer.alloc(512);
    writeTarHeader(header, name, body.length);
    chunks.push(header, body);
    const remainder = body.length % 512;
    if (remainder !== 0) {
      chunks.push(Buffer.alloc(512 - remainder));
    }
  }

  chunks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(chunks));
}

async function writeManagedState(root: string, state: Record<string, unknown>): Promise<void> {
  await fsp.mkdir(root, { recursive: true });
  await fsp.writeFile(getManagedSkillsStateFile(root), JSON.stringify(state));
}

async function writePackedSkillsTarball(
  root: string,
  version: string,
  extraFiles: Record<string, string> = {},
): Promise<string> {
  const tarballPath = path.join(root, `nocobase-skills-${version}.tgz`);
  const pkg = {
    name: '@nocobase/skills',
    version,
    description: 'test skills package',
  };
  const archive = buildTarGz({
    'package/package.json': JSON.stringify(pkg, null, 2),
    'package/skills/nocobase-env-manage/SKILL.md': '# env manage\n',
    'package/skills/nocobase-ui-builder/SKILL.md': '# ui builder\n',
    ...extraFiles,
  });
  await fsp.writeFile(tarballPath, archive);
  return tarballPath;
}

async function writeCachedPackageSkill(root: string, skillName: string): Promise<void> {
  const skillDir = path.join(root, 'cache', 'skills', 'node_modules', '@nocobase', 'skills', 'skills', skillName);
  await fsp.mkdir(skillDir, { recursive: true });
  await fsp.writeFile(path.join(skillDir, 'SKILL.md'), `# ${skillName}\n`);
}

test('resolveSkillsWorkspaceRoot defaults to the global CLI home', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-root-'));

  try {
    vi.stubEnv('NB_CLI_ROOT', dir);

    expect(resolveSkillsWorkspaceRoot(path.join(dir, 'workspace', 'packages', 'core', 'cli'))).toBe(
      path.join(dir, '.nocobase'),
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('resolveGlobalSkillsRoot defaults to the global CLI home', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-global-skills-root-'));

  try {
    vi.stubEnv('NB_CLI_ROOT', dir);

    expect(resolveGlobalSkillsRoot()).toBe(path.join(dir, '.nocobase'));
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('isNpmRegistryUnavailable returns true for npm registry network failures', () => {
  expect(
    isNpmRegistryUnavailable(
      new Error(
        'npm pack exited with code 1: request to https://registry.npmjs.org failed, reason: getaddrinfo ENOTFOUND registry.npmjs.org',
      ),
    ),
  ).toBe(true);
  expect(
    isNpmRegistryUnavailable(
      new Error('skills add exited with code 1: fetch failed while downloading package metadata'),
    ),
  ).toBe(true);
  expect(isNpmRegistryUnavailable(new Error('skills list timed out after 15000ms'))).toBe(true);
});

test('isNpmRegistryUnavailable returns false for local package validation failures', () => {
  expect(
    isNpmRegistryUnavailable(
      new Error(
        'failed to extract @nocobase/skills tarball: packed tarball resolved to @nocobase/not-skills instead of @nocobase/skills.',
      ),
    ),
  ).toBe(false);
});

test('inspectSkillsStatus reports installed nocobase skills from managed state', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-status-'));

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.4',
      skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
    });

    const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
      if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
        return JSON.stringify([
          { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
          { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
        ]);
      }
      if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
        return JSON.stringify('1.0.5');
      }
      throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
    });

    const status = await inspectSkillsStatus({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
    });

    expect(status.installed).toBe(true);
    expect(status.globalRoot).toBe(dir);
    expect(status.workspaceRoot).toBe(dir);
    expect(status.managedByNb).toBe(true);
    expect(status.installedVersion).toBe('1.0.4');
    expect(status.latestVersion).toBe('1.0.5');
    expect(status.updateAvailable).toBe(true);
    expect(commandOutputFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'skills list',
        timeoutMs: 15000,
      }),
    );
    expect(commandOutputFn.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'npm view',
        timeoutMs: 3000,
      }),
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('inspectSkillsStatus reports package skills from the cached @nocobase/skills package', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-package-status-'));

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.4',
      skillNames: ['nocobase-env-manage'],
    });
    await writeCachedPackageSkill(dir, 'nocobase-env-manage');
    await writeCachedPackageSkill(dir, 'nocobase-ui-builder');

    const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
      if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
        return JSON.stringify([{ name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' }]);
      }
      if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
        return JSON.stringify('1.0.5');
      }
      throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
    });

    const status = await inspectSkillsStatus({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
    });

    expect(status.packageSkillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
    expect(status.installedSkillNames).toEqual(['nocobase-env-manage']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills installs when nocobase skills are not present', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5');
    }
  });
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return '[]';
      }
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    const result = await installNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('installed');
    expect(runFn.mock.calls[0]?.[0]).toBe('npm');
    expect(runFn.mock.calls[0]?.[1]).toEqual(['pack', '--silent', '@nocobase/skills']);
    expect(runFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'npm pack',
        stdio: 'ignore',
        timeoutMs: 120000,
      }),
    );
    expect(runFn.mock.calls[1]?.[0]).toBe('npx');
    expect(runFn.mock.calls[1]?.[1]).toEqual([
      '-y',
      'skills',
      'add',
      expect.stringMatching(/node_modules[/\\]@nocobase[/\\]skills$/),
      '-g',
      '-y',
      '--skill',
      '*',
    ]);
    expect(runFn.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'skills add',
        stdio: 'ignore',
        timeoutMs: 120000,
      }),
    );

    const extractedPackage = JSON.parse(
      await fsp.readFile(
        path.join(dir, 'cache', 'skills', 'node_modules', '@nocobase', 'skills', 'package.json'),
        'utf8',
      ),
    );
    expect(extractedPackage.version).toBe('1.0.5');

    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.installedVersion).toBe('1.0.5');
    expect(state.skillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills reports progress while installing managed skills', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-progress-'));
  const progressMessages: string[] = [];
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5');
    }
  });
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return '[]';
      }
      return JSON.stringify([{ name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' }]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await installNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
      onProgress: (message) => progressMessages.push(message),
    });

    expect(progressMessages).toEqual([
      'Checking installed NocoBase AI coding skills...',
      'Downloading @nocobase/skills...',
      'Extracting @nocobase/skills...',
      'Installing NocoBase AI coding skills globally...',
      'Verifying installed NocoBase AI coding skills...',
    ]);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills is a no-op when nocobase skills are already installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-noop-'));
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([{ name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' }]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage'],
    });

    const result = await installNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('noop');
    expect(runFn).not.toHaveBeenCalled();
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills reinstalls when a different target version is requested', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-target-version-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.4');
    }
  });
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        ...(listCalls > 1 ? [{ name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' }] : []),
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage'],
    });

    const result = await installNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
      targetVersion: '1.0.4',
    });

    expect(result.action).toBe('installed');
    expect(runFn.mock.calls[0]?.[1]).toEqual(['pack', '--silent', '@nocobase/skills@1.0.4']);
    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.installedVersion).toBe('1.0.4');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills updates managed skills when they already exist', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5');
    }
  });
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.4',
      skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
    });

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls[0]?.[0]).toBe('npm');
    expect(runFn.mock.calls[0]?.[1]).toEqual(['pack', '--silent', '@nocobase/skills@1.0.5']);
    expect(runFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'npm pack',
        stdio: 'ignore',
      }),
    );
    expect(runFn.mock.calls[1]?.[0]).toBe('npx');
    expect(runFn.mock.calls[1]?.[1]).toEqual([
      '-y',
      'skills',
      'add',
      expect.stringMatching(/node_modules[/\\]@nocobase[/\\]skills$/),
      '-g',
      '-y',
      '--skill',
      '*',
    ]);
    expect(runFn.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'skills add',
        stdio: 'ignore',
      }),
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills syncs to an older target version', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-target-version-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.4');
    }
  });
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
    });

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
      targetVersion: '1.0.4',
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls[0]?.[1]).toEqual(['pack', '--silent', '@nocobase/skills@1.0.4']);
    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.installedVersion).toBe('1.0.4');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills removes managed skills that are no longer in the package', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-remove-obsolete-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5');
    }
  });
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return JSON.stringify([
          { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
          { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
          { name: 'nocobase-legacy-skill', scope: 'global', path: '/tmp/c' },
        ]);
      }
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.4',
      skillNames: ['nocobase-env-manage', 'nocobase-ui-builder', 'nocobase-legacy-skill'],
    });

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls.map((call) => call[1])).toEqual([
      ['pack', '--silent', '@nocobase/skills@1.0.5'],
      [
        '-y',
        'skills',
        'add',
        expect.stringMatching(/node_modules[/\\]@nocobase[/\\]skills$/),
        '-g',
        '-y',
        '--skill',
        '*',
      ],
      ['-y', 'skills', 'remove', 'nocobase-legacy-skill', '-g', '-y'],
    ]);

    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.skillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('skills install and update forward raw output in verbose mode', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-verbose-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5');
    }
  });
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return '[]';
      }
      return JSON.stringify([{ name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' }]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await installNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
      verbose: true,
    });

    expect(runFn.mock.calls[0]?.[1]).toEqual(['pack', '@nocobase/skills']);
    expect(runFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        stdio: 'inherit',
      }),
    );
    expect(runFn.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({
        stdio: 'inherit',
      }),
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills adds every skill from the cached package skills directory', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-all-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      await writePackedSkillsTarball(options.cwd, '1.0.5', {
        'package/skills/nocobase-data-analysis/SKILL.md': '# data analysis\n',
      });
    }
  });
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
        { name: 'nocobase-data-analysis', scope: 'global', path: '/tmp/c' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.4',
      skillNames: ['nocobase-env-manage'],
    });

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls[1]?.[1]).toEqual([
      '-y',
      'skills',
      'add',
      expect.stringMatching(/node_modules[/\\]@nocobase[/\\]skills$/),
      '-g',
      '-y',
      '--skill',
      '*',
    ]);

    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.skillNames).toEqual(['nocobase-data-analysis', 'nocobase-env-manage', 'nocobase-ui-builder']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills reinstalls when cached package skills are missing even if version is current', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-missing-cached-'));
  const cachePackageDir = path.join(dir, 'cache', 'skills', 'node_modules', '@nocobase', 'skills');
  const runFn = vi.fn(async () => undefined);
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return JSON.stringify([{ name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' }]);
      }
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage'],
    });
    await fsp.mkdir(path.join(cachePackageDir, 'skills', 'nocobase-env-manage'), { recursive: true });
    await fsp.mkdir(path.join(cachePackageDir, 'skills', 'nocobase-ui-builder'), { recursive: true });
    await fsp.writeFile(path.join(cachePackageDir, 'package.json'), JSON.stringify({ version: '1.0.5' }));
    await fsp.writeFile(path.join(cachePackageDir, 'skills', 'nocobase-env-manage', 'SKILL.md'), '# env manage\n');
    await fsp.writeFile(path.join(cachePackageDir, 'skills', 'nocobase-ui-builder', 'SKILL.md'), '# ui builder\n');

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls[0]?.[1]).toEqual(['-y', 'skills', 'add', cachePackageDir, '-g', '-y', '--skill', '*']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills fails when packed tarball metadata does not match the expected package name', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-pack-mismatch-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && _args[0] === 'pack' && options?.cwd) {
      const tarballPath = path.join(options.cwd, 'nocobase-skills-1.0.5.tgz');
      const archive = buildTarGz({
        'package/package.json': JSON.stringify(
          {
            name: '@nocobase/not-skills',
            version: '1.0.5',
          },
          null,
          2,
        ),
      });
      await fsp.writeFile(tarballPath, archive);
    }
  });
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return '[]';
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await expect(
      installNocoBaseSkills({
        workspaceRoot: dir,
        commandOutputFn: commandOutputFn as any,
        runFn: runFn as any,
      }),
    ).rejects.toThrow('packed tarball resolved to @nocobase/not-skills instead of @nocobase/skills');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills is a no-op when nocobase skills are not installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-missing-'));
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return '[]';
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('noop');
    expect(result.reason).toBe('not-installed');
    expect(runFn).not.toHaveBeenCalled();
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('removeNocoBaseSkills removes all managed nocobase skills and clears managed state', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-remove-'));
  const runFn = vi.fn(async () => undefined);
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return JSON.stringify([
          { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
          { name: 'nocobase-ui-builder', scope: 'global', path: '/tmp/b' },
          { name: 'custom-skill', scope: 'global', path: '/tmp/c' },
        ]);
      }
      return JSON.stringify([{ name: 'custom-skill', scope: 'global', path: '/tmp/c' }]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
    });

    const result = await removeNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('removed');
    expect(runFn.mock.calls).toEqual([
      [
        'npx',
        ['-y', 'skills', 'remove', 'nocobase-env-manage', '-g', '-y'],
        expect.objectContaining({
          errorName: 'skills remove',
          stdio: 'ignore',
        }),
      ],
      [
        'npx',
        ['-y', 'skills', 'remove', 'nocobase-ui-builder', '-g', '-y'],
        expect.objectContaining({
          errorName: 'skills remove',
          stdio: 'ignore',
        }),
      ],
    ]);
    await expect(fsp.readFile(getManagedSkillsStateFile(dir), 'utf8')).rejects.toThrow();
    expect(result.status.installed).toBe(false);
    expect(result.status.installedSkillNames).toEqual([]);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('removeNocoBaseSkills removes managed skills that are no longer in the cached package', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-remove-stale-managed-'));
  const runFn = vi.fn(async () => undefined);
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return JSON.stringify([
          { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
          { name: 'nocobase-legacy-skill', scope: 'global', path: '/tmp/b' },
        ]);
      }
      return '[]';
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(dir, {
      packageName: '@nocobase/skills',
      sourcePackage: 'nocobase/skills',
      installedAt: '2026-04-26T00:00:00.000Z',
      updatedAt: '2026-04-26T00:00:00.000Z',
      installedVersion: '1.0.5',
      skillNames: ['nocobase-env-manage', 'nocobase-legacy-skill'],
    });
    await writeCachedPackageSkill(dir, 'nocobase-env-manage');

    const result = await removeNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('removed');
    expect(runFn.mock.calls.map((call) => call[1])).toEqual([
      ['-y', 'skills', 'remove', 'nocobase-env-manage', '-g', '-y'],
      ['-y', 'skills', 'remove', 'nocobase-legacy-skill', '-g', '-y'],
    ]);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('removeNocoBaseSkills is a no-op when nocobase skills are not installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-remove-noop-'));
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([]);
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    const result = await removeNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('noop');
    expect(runFn).not.toHaveBeenCalled();
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});
