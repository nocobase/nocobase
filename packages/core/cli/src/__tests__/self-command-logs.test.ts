/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  inspectSelfStatus: vi.fn(),
  updateSelf: vi.fn(),
  confirmAction: vi.fn(),
  printInfo: vi.fn(),
  renderTable: vi.fn(() => 'TABLE'),
  setVerboseMode: vi.fn(),
  installNocoBaseSkills: vi.fn(),
  updateNocoBaseSkills: vi.fn(),
}));

vi.mock('../lib/self-manager.js', () => ({
  inspectSelfStatus: mocks.inspectSelfStatus,
  updateSelf: mocks.updateSelf,
}));

vi.mock('../lib/skills-manager.js', () => ({
  installNocoBaseSkills: mocks.installNocoBaseSkills,
  updateNocoBaseSkills: mocks.updateNocoBaseSkills,
}));

vi.mock('../lib/ui.js', () => ({
  confirmAction: mocks.confirmAction,
  printInfo: mocks.printInfo,
  renderTable: mocks.renderTable,
  setVerboseMode: mocks.setVerboseMode,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('self update logs compact success and noop messages', async () => {
  const { default: SelfUpdate } = await import('../commands/self/update.js');

  const command = Object.assign(Object.create(SelfUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        yes: true,
        json: false,
        verbose: false,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  mocks.inspectSelfStatus.mockResolvedValue({
    packageName: '@nocobase/cli',
    packageRoot: '/usr/local/lib/node_modules/@nocobase/cli',
    currentVersion: '2.1.0-beta.23',
    latestVersion: '2.1.0-beta.25',
    channel: 'beta',
    updateAvailable: true,
    installMethod: 'npm-global',
    updatable: true,
  });
  mocks.updateSelf.mockResolvedValueOnce({
    action: 'updated',
    status: {
      currentVersion: '2.1.0-beta.23',
      channel: 'beta',
    },
    targetVersion: '2.1.0-beta.25',
  });

  await SelfUpdate.prototype.run.call(command);

  expect(command.log).toHaveBeenLastCalledWith('Updated NocoBase CLI: 2.1.0-beta.23 -> 2.1.0-beta.25.');

  mocks.updateSelf.mockResolvedValueOnce({
    action: 'noop',
    status: {
      currentVersion: '2.1.0-beta.25',
      channel: 'beta',
    },
    targetVersion: '2.1.0-beta.25',
  });

  await SelfUpdate.prototype.run.call(command);

  expect(command.log).toHaveBeenLastCalledWith('NocoBase CLI is up to date: 2.1.0-beta.25.');
  expect(mocks.setVerboseMode).toHaveBeenCalledWith(false);
});

test('self update logs detailed messages in verbose mode', async () => {
  const { default: SelfUpdate } = await import('../commands/self/update.js');

  const command = Object.assign(Object.create(SelfUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        yes: true,
        json: false,
        verbose: true,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  mocks.inspectSelfStatus.mockResolvedValue({
    packageName: '@nocobase/cli',
    packageRoot: '/usr/local/lib/node_modules/@nocobase/cli',
    currentVersion: '2.1.0-beta.23',
    latestVersion: '2.1.0-beta.25',
    channel: 'beta',
    updateAvailable: true,
    installMethod: 'npm-global',
    updatable: true,
  });
  mocks.updateSelf.mockResolvedValue({
    action: 'updated',
    status: {
      currentVersion: '2.1.0-beta.23',
      channel: 'beta',
    },
    packageSpec: '@nocobase/cli@beta',
    targetVersion: '2.1.0-beta.25',
  });

  await SelfUpdate.prototype.run.call(command);

  expect(mocks.setVerboseMode).toHaveBeenCalledWith(true);
  expect(mocks.updateSelf).toHaveBeenCalledWith({
    channel: 'auto',
    verbose: true,
  });
  expect(command.log).toHaveBeenLastCalledWith(
    'Updated NocoBase CLI from 2.1.0-beta.23 using @nocobase/cli@beta (latest beta resolves to 2.1.0-beta.25).',
  );
});

test('self check prints the shorter update hint', async () => {
  const { default: SelfCheck } = await import('../commands/self/check.js');

  const command = Object.assign(Object.create(SelfCheck.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        json: false,
      },
    })),
    log: vi.fn(),
  });

  mocks.inspectSelfStatus.mockResolvedValue({
    packageName: '@nocobase/cli',
    packageRoot: '/usr/local/lib/node_modules/@nocobase/cli',
    currentVersion: '2.1.0-beta.23',
    latestVersion: '2.1.0-beta.25',
    channel: 'beta',
    updateAvailable: true,
    installMethod: 'npm-global',
    updatable: true,
    updateBlockedReason: undefined,
    registryError: undefined,
  });

  await SelfCheck.prototype.run.call(command);

  expect(command.log).toHaveBeenCalledWith('TABLE');
  expect(mocks.printInfo).toHaveBeenCalledWith('Run `nb self update`.');
});

test('skills install and update use compact logs by default and detailed logs with verbose', async () => {
  const { default: SkillsInstall } = await import('../commands/skills/install.js');
  const { default: SkillsUpdate } = await import('../commands/skills/update.js');

  const installCommand = Object.assign(Object.create(SkillsInstall.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: false,
      },
    })),
    log: vi.fn(),
  });
  mocks.installNocoBaseSkills.mockResolvedValueOnce({
    action: 'installed',
    status: {},
  });

  await SkillsInstall.prototype.run.call(installCommand);

  expect(mocks.setVerboseMode).toHaveBeenCalledWith(false);
  expect(mocks.installNocoBaseSkills).toHaveBeenCalledWith({
    verbose: false,
  });
  expect(installCommand.log).toHaveBeenLastCalledWith('Installed NocoBase AI coding skills globally.');

  const installVerboseCommand = Object.assign(Object.create(SkillsInstall.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: true,
      },
    })),
    log: vi.fn(),
  });
  mocks.installNocoBaseSkills.mockResolvedValueOnce({
    action: 'noop',
    status: {},
  });

  await SkillsInstall.prototype.run.call(installVerboseCommand);

  expect(mocks.setVerboseMode).toHaveBeenCalledWith(true);
  expect(mocks.installNocoBaseSkills).toHaveBeenLastCalledWith({
    verbose: true,
  });
  expect(installVerboseCommand.log).toHaveBeenLastCalledWith(
    'NocoBase AI coding skills are already installed globally. Run `nb skills update` to refresh them.',
  );

  const updateCommand = Object.assign(Object.create(SkillsUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: false,
      },
    })),
    log: vi.fn(),
  });
  mocks.updateNocoBaseSkills.mockResolvedValueOnce({
    action: 'noop',
    status: {},
  });

  await SkillsUpdate.prototype.run.call(updateCommand);

  expect(mocks.updateNocoBaseSkills).toHaveBeenCalledWith({
    verbose: false,
  });
  expect(updateCommand.log).toHaveBeenLastCalledWith('NocoBase AI coding skills are up to date.');

  const updateVerboseCommand = Object.assign(Object.create(SkillsUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: true,
      },
    })),
    log: vi.fn(),
  });
  mocks.updateNocoBaseSkills.mockResolvedValueOnce({
    action: 'updated',
    status: {},
  });

  await SkillsUpdate.prototype.run.call(updateVerboseCommand);

  expect(mocks.updateNocoBaseSkills).toHaveBeenLastCalledWith({
    verbose: true,
  });
  expect(updateVerboseCommand.log).toHaveBeenLastCalledWith(
    'Updated the global NocoBase AI coding skills.',
  );
});
