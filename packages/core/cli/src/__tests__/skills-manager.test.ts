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
  resolveSkillsWorkspaceRoot,
  updateNocoBaseSkills,
} from '../lib/skills-manager.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('resolveSkillsWorkspaceRoot finds the nearest .nocobase directory', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-root-'));
  const workspaceRoot = path.join(dir, 'workspace');
  const nested = path.join(workspaceRoot, 'packages', 'core', 'cli');

  try {
    await fsp.mkdir(path.join(workspaceRoot, '.nocobase'), { recursive: true });
    await fsp.mkdir(nested, { recursive: true });

    expect(resolveSkillsWorkspaceRoot(nested)).toBe(workspaceRoot);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('inspectSkillsStatus reports installed nocobase skills from managed state', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-status-'));

  try {
    await fsp.mkdir(path.join(dir, '.nocobase'), { recursive: true });
    await fsp.writeFile(
      getManagedSkillsStateFile(dir),
      JSON.stringify({
        packageName: 'nocobase/skills',
        repoUrl: 'https://github.com/nocobase/skills.git',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedRef: 'abc123',
        skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
      }),
    );

    const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
      if (name === 'npx' && args.join(' ') === '-y skills list --json') {
        return JSON.stringify([
          { name: 'nocobase-env-manage', scope: 'project', path: '/tmp/a' },
          { name: 'nocobase-ui-builder', scope: 'project', path: '/tmp/b' },
        ]);
      }
      if (name === 'git' && args.join(' ') === 'ls-remote https://github.com/nocobase/skills.git HEAD') {
        return 'def456\tHEAD';
      }
      throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
    });

    const status = await inspectSkillsStatus({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
    });

    expect(status.installed).toBe(true);
    expect(status.managedByNb).toBe(true);
    expect(status.installedRef).toBe('abc123');
    expect(status.latestRef).toBe('def456');
    expect(status.updateAvailable).toBe(true);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills installs when nocobase skills are not present', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-'));
  const runFn = vi.fn(async () => undefined);
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list --json') {
      listCalls += 1;
      if (listCalls === 1) {
        return '[]';
      }
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'project', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'project', path: '/tmp/b' },
      ]);
    }
    if (name === 'git' && args.join(' ') === 'ls-remote https://github.com/nocobase/skills.git HEAD') {
      return 'def456\tHEAD';
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
    expect(runFn).toHaveBeenCalledWith(
      'npx',
      ['-y', 'skills', 'add', 'nocobase/skills', '-y'],
      expect.objectContaining({
        cwd: dir,
        errorName: 'skills add',
        stdio: 'inherit',
      }),
    );

    const state = JSON.parse(await fsp.readFile(getManagedSkillsStateFile(dir), 'utf8'));
    expect(state.installedRef).toBe('def456');
    expect(state.skillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('installNocoBaseSkills is a no-op when nocobase skills are already installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-install-noop-'));
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list --json') {
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'project', path: '/tmp/a' },
      ]);
    }
    if (name === 'git' && args.join(' ') === 'ls-remote https://github.com/nocobase/skills.git HEAD') {
      return 'oldref\tHEAD';
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await fsp.mkdir(path.join(dir, '.nocobase'), { recursive: true });
    await fsp.writeFile(
      getManagedSkillsStateFile(dir),
      JSON.stringify({
        packageName: 'nocobase/skills',
        repoUrl: 'https://github.com/nocobase/skills.git',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedRef: 'oldref',
        skillNames: ['nocobase-env-manage'],
      }),
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
  const runFn = vi.fn(async () => undefined);
  let listCalls = 0;
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list --json') {
      listCalls += 1;
      return JSON.stringify([
        { name: 'nocobase-env-manage', scope: 'project', path: '/tmp/a' },
        { name: 'nocobase-ui-builder', scope: 'project', path: '/tmp/b' },
      ]);
    }
    if (name === 'git' && args.join(' ') === 'ls-remote https://github.com/nocobase/skills.git HEAD') {
      return listCalls < 2 ? 'newref\tHEAD' : 'newref\tHEAD';
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await fsp.mkdir(path.join(dir, '.nocobase'), { recursive: true });
    await fsp.writeFile(
      getManagedSkillsStateFile(dir),
      JSON.stringify({
        packageName: 'nocobase/skills',
        repoUrl: 'https://github.com/nocobase/skills.git',
        installedAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
        installedRef: 'oldref',
        skillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
      }),
    );

    const result = await updateNocoBaseSkills({
      workspaceRoot: dir,
      commandOutputFn: commandOutputFn as any,
      runFn: runFn as any,
    });

    expect(result.action).toBe('updated');
    expect(runFn).toHaveBeenCalledWith(
      'npx',
      ['-y', 'skills', 'update', '-p', '-y', 'nocobase-env-manage', 'nocobase-ui-builder'],
      expect.objectContaining({
        cwd: dir,
        errorName: 'skills update',
        stdio: 'inherit',
      }),
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateNocoBaseSkills fails when nocobase skills are not installed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-skills-update-missing-'));
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npx' && args.join(' ') === '-y skills list --json') {
      return '[]';
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  try {
    await expect(
      updateNocoBaseSkills({
        workspaceRoot: dir,
        commandOutputFn: commandOutputFn as any,
      }),
    ).rejects.toThrow('Run `nb skills install` first.');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});
