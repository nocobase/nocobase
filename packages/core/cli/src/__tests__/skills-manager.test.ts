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
import { afterEach, expect, test, vi } from 'vitest';
import {
  getManagedSkillsStateFile,
  installNocoBaseSkills,
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

async function writeManagedState(root: string, state: Record<string, unknown>): Promise<void> {
  await fsp.mkdir(root, { recursive: true });
  await fsp.writeFile(getManagedSkillsStateFile(root), JSON.stringify(state));
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

test('inspectSkillsStatus reports installed nocobase skills from managed state', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-status-'));

  try {
    await writeManagedState(
      dir,
      {
        packageName: '@nocobase/skills',
        sourcePackage: 'nocobase/skills',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedVersion: '1.0.4',
        skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
      },
    );

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
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills installs when nocobase skills are not present', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && options?.cwd) {
      await fsp.mkdir(path.join(options.cwd, 'node_modules', '@nocobase', 'skills'), { recursive: true });
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
    expect(runFn.mock.calls[0]?.[1]).toEqual([
      'install',
      '--no-save',
      '--ignore-scripts',
      '--no-package-lock',
      '@nocobase/skills',
    ]);
    expect(runFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'npm install',
        stdio: 'ignore',
      }),
    );
    expect(runFn.mock.calls[1]?.[0]).toBe('npx');
    expect(runFn.mock.calls[1]?.[1]).toEqual([
      '-y',
      'skills',
      'add',
      expect.stringMatching(/node_modules[\/\\]@nocobase[\/\\]skills$/),
      '-g',
      '-y',
    ]);
    expect(runFn.mock.calls[1]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'skills add',
        stdio: 'ignore',
      }),
    );

    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.installedVersion).toBe('1.0.5');
    expect(state.skillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills is a no-op when nocobase skills are already installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-noop-'));
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list -g --json') {
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'global', path: '/tmp/a' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(
      dir,
      {
        packageName: '@nocobase/skills',
        sourcePackage: 'nocobase/skills',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedVersion: '1.0.5',
        skillNames: ['nocobase-env-manage'],
      },
    );

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

test('updateNocoBaseSkills updates managed skills when they already exist', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && options?.cwd) {
      await fsp.mkdir(path.join(options.cwd, 'node_modules', '@nocobase', 'skills'), { recursive: true });
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
    await writeManagedState(
      dir,
      {
        packageName: '@nocobase/skills',
        sourcePackage: 'nocobase/skills',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedVersion: '1.0.4',
        skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
      },
    );

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn.mock.calls[0]?.[0]).toBe('npm');
    expect(runFn.mock.calls[0]?.[1]).toEqual([
      'install',
      '--no-save',
      '--ignore-scripts',
      '--no-package-lock',
      '@nocobase/skills@1.0.5',
    ]);
    expect(runFn.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({
        errorName: 'npm install',
        stdio: 'ignore',
      }),
    );
    expect(runFn.mock.calls[1]?.[0]).toBe('npx');
    expect(runFn.mock.calls[1]?.[1]).toEqual([
      '-y',
      'skills',
      'add',
      expect.stringMatching(/node_modules[\/\\]@nocobase[\/\\]skills$/),
      '-g',
      '-y',
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

test('skills install and update forward raw output in verbose mode', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-verbose-'));
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { cwd?: string }) => {
    if (_name === 'npm' && options?.cwd) {
      await fsp.mkdir(path.join(options.cwd, 'node_modules', '@nocobase', 'skills'), { recursive: true });
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
      return JSON.stringify([
        { name: 'custom-skill', scope: 'global', path: '/tmp/c' },
      ]);
    }
    if (name === 'npm' && args.join(' ') === `view ${NOCOBASE_SKILLS_PACKAGE_NAME} version --json`) {
      return JSON.stringify('1.0.5');
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await writeManagedState(
      dir,
      {
        packageName: '@nocobase/skills',
        sourcePackage: 'nocobase/skills',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedVersion: '1.0.5',
        skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
      },
    );

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
