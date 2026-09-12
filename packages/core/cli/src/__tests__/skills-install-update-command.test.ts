/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';
import type SkillsInstall from '../commands/skills/install.js';
import type SkillsUpdate from '../commands/skills/update.js';

const mocks = vi.hoisted(() => ({
  installNocoBaseSkills: vi.fn(),
  setVerboseMode: vi.fn(),
  startTask: vi.fn(),
  stopTask: vi.fn(),
  updateTask: vi.fn(),
  updateNocoBaseSkills: vi.fn(),
}));

vi.mock('../lib/skills-manager.js', () => ({
  installNocoBaseSkills: mocks.installNocoBaseSkills,
  updateNocoBaseSkills: mocks.updateNocoBaseSkills,
}));

vi.mock('../lib/ui.js', () => ({
  setVerboseMode: mocks.setVerboseMode,
  startTask: mocks.startTask,
  stopTask: mocks.stopTask,
  updateTask: mocks.updateTask,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('skills install passes version flag to the skills manager', async () => {
  const { default: SkillsInstallCommand } = await import('../commands/skills/install.js');
  const command = Object.assign(Object.create(SkillsInstallCommand.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        json: false,
        verbose: false,
        version: '1.0.4',
        yes: true,
      },
    })),
    log: vi.fn(),
  }) as SkillsInstall;

  mocks.installNocoBaseSkills.mockResolvedValue({
    action: 'installed',
    status: {
      installedSkillNames: ['nocobase-env-manage'],
      installedVersion: '1.0.4',
    },
  });

  await SkillsInstallCommand.prototype.run.call(command);

  expect(mocks.installNocoBaseSkills).toHaveBeenCalledWith(
    expect.objectContaining({
      targetVersion: '1.0.4',
      verbose: false,
      onProgress: mocks.updateTask,
    }),
  );
  expect(mocks.startTask).toHaveBeenCalledWith('Installing NocoBase AI coding skills 1.0.4...');
  expect(mocks.stopTask).toHaveBeenCalledTimes(1);
});

test('skills update passes version flag to the skills manager', async () => {
  const { default: SkillsUpdateCommand } = await import('../commands/skills/update.js');
  const command = Object.assign(Object.create(SkillsUpdateCommand.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        json: false,
        verbose: false,
        version: '1.0.4',
        yes: true,
      },
    })),
    log: vi.fn(),
  }) as SkillsUpdate;

  mocks.updateNocoBaseSkills.mockResolvedValue({
    action: 'updated',
    status: {
      installedSkillNames: ['nocobase-env-manage'],
      installedVersion: '1.0.4',
    },
  });

  await SkillsUpdateCommand.prototype.run.call(command);

  expect(mocks.updateNocoBaseSkills).toHaveBeenCalledWith(
    expect.objectContaining({
      targetVersion: '1.0.4',
      verbose: false,
      onProgress: mocks.updateTask,
    }),
  );
  expect(mocks.startTask).toHaveBeenCalledWith('Syncing NocoBase AI coding skills to 1.0.4...');
  expect(mocks.stopTask).toHaveBeenCalledTimes(1);
});

test('skills update does not show loading in json mode', async () => {
  const { default: SkillsUpdateCommand } = await import('../commands/skills/update.js');
  const command = Object.assign(Object.create(SkillsUpdateCommand.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        json: true,
        verbose: false,
        version: '1.0.4',
        yes: true,
      },
    })),
    log: vi.fn(),
  }) as SkillsUpdate;

  mocks.updateNocoBaseSkills.mockResolvedValue({
    action: 'updated',
    status: {
      installedSkillNames: ['nocobase-env-manage'],
      installedVersion: '1.0.4',
    },
  });

  await SkillsUpdateCommand.prototype.run.call(command);

  expect(mocks.startTask).not.toHaveBeenCalled();
  expect(mocks.stopTask).not.toHaveBeenCalled();
});
