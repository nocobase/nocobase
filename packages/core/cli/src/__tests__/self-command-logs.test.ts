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
  confirm: vi.fn(),
  inspectSelfStatus: vi.fn(),
  updateSelf: vi.fn(),
  printInfo: vi.fn(),
  renderTable: vi.fn(() => 'TABLE'),
  setVerboseMode: vi.fn(),
  startTask: vi.fn(),
  stopTask: vi.fn(),
  updateTask: vi.fn(),
  installNocoBaseSkills: vi.fn(),
  removeNocoBaseSkills: vi.fn(),
  updateNocoBaseSkills: vi.fn(),
}));

vi.mock('../lib/self-manager.js', () => ({
  inspectSelfStatus: mocks.inspectSelfStatus,
  updateSelf: mocks.updateSelf,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.confirm,
}));

vi.mock('../lib/skills-manager.js', () => ({
  installNocoBaseSkills: mocks.installNocoBaseSkills,
  removeNocoBaseSkills: mocks.removeNocoBaseSkills,
  updateNocoBaseSkills: mocks.updateNocoBaseSkills,
}));

vi.mock('../lib/ui.js', () => ({
  printInfo: mocks.printInfo,
  renderTable: mocks.renderTable,
  setVerboseMode: mocks.setVerboseMode,
  startTask: mocks.startTask,
  stopTask: mocks.stopTask,
  updateTask: mocks.updateTask,
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

test('self update confirmation defaults to yes', async () => {
  const { default: SelfUpdate } = await import('../commands/self/update.js');

  const command = Object.assign(Object.create(SelfUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        yes: false,
        json: false,
        skills: false,
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
  mocks.confirm.mockResolvedValue(true);
  mocks.updateSelf.mockResolvedValue({
    action: 'updated',
    status: {
      currentVersion: '2.1.0-beta.23',
      channel: 'beta',
    },
    targetVersion: '2.1.0-beta.25',
  });

  await SelfUpdate.prototype.run.call(command);

  expect(mocks.confirm).toHaveBeenCalledWith({
    message: 'Update @nocobase/cli from 2.1.0-beta.23 to 2.1.0-beta.25?',
    default: true,
  });
  expect(mocks.updateSelf).toHaveBeenCalledWith({
    channel: 'auto',
    verbose: false,
  });
});

test('self update optionally refreshes skills and logs both results', async () => {
  const { default: SelfUpdate } = await import('../commands/self/update.js');

  const command = Object.assign(Object.create(SelfUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        yes: true,
        json: false,
        skills: true,
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
  mocks.updateSelf.mockResolvedValue({
    action: 'updated',
    status: {
      currentVersion: '2.1.0-beta.23',
      channel: 'beta',
    },
    targetVersion: '2.1.0-beta.25',
  });
  mocks.updateNocoBaseSkills.mockResolvedValue({
    action: 'updated',
    status: {},
  });

  await SelfUpdate.prototype.run.call(command);

  expect(mocks.updateNocoBaseSkills).toHaveBeenCalledWith({
    verbose: false,
  });
  expect(command.log).toHaveBeenNthCalledWith(1, 'Updated NocoBase CLI: 2.1.0-beta.23 -> 2.1.0-beta.25.');
  expect(command.log).toHaveBeenNthCalledWith(2, 'Updated NocoBase AI coding skills globally.');
});

test('self update --skills extends json output with the skills result', async () => {
  const { default: SelfUpdate } = await import('../commands/self/update.js');

  const command = Object.assign(Object.create(SelfUpdate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        channel: 'auto',
        yes: true,
        json: true,
        skills: true,
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
    currentVersion: '2.1.0-beta.25',
    latestVersion: '2.1.0-beta.25',
    channel: 'beta',
    updateAvailable: false,
    installMethod: 'npm-global',
    updatable: true,
  });
  mocks.updateSelf.mockResolvedValue({
    action: 'noop',
    status: {
      packageName: '@nocobase/cli',
      currentVersion: '2.1.0-beta.25',
      channel: 'beta',
    },
    packageSpec: '@nocobase/cli@beta',
    targetVersion: '2.1.0-beta.25',
  });
  mocks.updateNocoBaseSkills.mockResolvedValue({
    action: 'noop',
    reason: 'up-to-date',
    status: {
      globalRoot: '/Users/chen/.nocobase',
      workspaceRoot: '/Users/chen/.nocobase',
      installedSkillNames: ['nocobase-env-manage'],
      installedVersion: '1.0.5',
      installedRef: '1.0.5',
    },
  });

  await SelfUpdate.prototype.run.call(command);

  expect(command.log).toHaveBeenCalledTimes(1);
  expect(JSON.parse(command.log.mock.calls[0][0])).toEqual({
    ok: true,
    kind: 'self',
    action: 'noop',
    packageName: '@nocobase/cli',
    packageSpec: '@nocobase/cli@beta',
    channel: 'beta',
    fromVersion: '2.1.0-beta.25',
    toVersion: '2.1.0-beta.25',
    skills: {
      action: 'noop',
      reason: 'up-to-date',
      globalRoot: '/Users/chen/.nocobase',
      workspaceRoot: '/Users/chen/.nocobase',
      installedSkillNames: ['nocobase-env-manage'],
      installedVersion: '1.0.5',
      installedRef: '1.0.5',
    },
  });
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

test('skills install, remove, and update use compact logs by default and detailed logs with verbose', async () => {
  const { default: SkillsInstall } = await import('../commands/skills/install.js');
  const { default: SkillsRemove } = await import('../commands/skills/remove.js');
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
    onProgress: mocks.updateTask,
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

  const removeCommand = Object.assign(Object.create(SkillsRemove.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: false,
      },
    })),
    log: vi.fn(),
  });
  mocks.removeNocoBaseSkills.mockResolvedValueOnce({
    action: 'removed',
    status: {},
  });

  await SkillsRemove.prototype.run.call(removeCommand);

  expect(mocks.removeNocoBaseSkills).toHaveBeenCalledWith({
    verbose: false,
  });
  expect(removeCommand.log).toHaveBeenLastCalledWith('Removed NocoBase AI coding skills globally.');

  const removeVerboseCommand = Object.assign(Object.create(SkillsRemove.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        json: false,
        verbose: true,
      },
    })),
    log: vi.fn(),
  });
  mocks.removeNocoBaseSkills.mockResolvedValueOnce({
    action: 'noop',
    status: {},
  });

  await SkillsRemove.prototype.run.call(removeVerboseCommand);

  expect(mocks.removeNocoBaseSkills).toHaveBeenLastCalledWith({
    verbose: true,
  });
  expect(removeVerboseCommand.log).toHaveBeenLastCalledWith('NocoBase AI coding skills are not installed globally.');

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
    reason: 'not-installed',
    status: {},
  });

  await SkillsUpdate.prototype.run.call(updateCommand);

  expect(mocks.updateNocoBaseSkills).toHaveBeenCalledWith({
    verbose: false,
    onProgress: mocks.updateTask,
  });
  expect(updateCommand.log).toHaveBeenLastCalledWith(
    'Skipped skills update because NocoBase AI coding skills are not installed.',
  );

  mocks.updateNocoBaseSkills.mockResolvedValueOnce({
    action: 'noop',
    reason: 'up-to-date',
    status: {},
  });

  await SkillsUpdate.prototype.run.call(updateCommand);

  expect(mocks.updateNocoBaseSkills).toHaveBeenLastCalledWith({
    verbose: false,
    onProgress: mocks.updateTask,
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
  expect(updateVerboseCommand.log).toHaveBeenLastCalledWith('Updated the global NocoBase AI coding skills.');
});
