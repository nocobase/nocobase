/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  inspectSelfInstall: vi.fn(),
  inspectSelfStatus: vi.fn(),
  inspectSkillsStatus: vi.fn(),
  confirm: vi.fn(),
  printWarning: vi.fn(),
  run: vi.fn(),
  isInteractiveTerminal: vi.fn(),
}));

vi.mock('../lib/self-manager.js', () => ({
  inspectSelfInstall: mocks.inspectSelfInstall,
  inspectSelfStatus: mocks.inspectSelfStatus,
}));

vi.mock('../lib/skills-manager.js', () => ({
  inspectSkillsStatus: mocks.inspectSkillsStatus,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.confirm,
}));

vi.mock('../lib/ui.js', () => ({
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printWarning: mocks.printWarning,
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
}));

function getCliRoot() {
  const cliRoot = process.env.NB_CLI_ROOT;
  if (!cliRoot) {
    throw new Error('NB_CLI_ROOT is not set');
  }

  return cliRoot;
}

describe('startup update prompt', () => {
  const originalHome = process.env.NB_CLI_ROOT;
  const originalSkip = process.env.NB_SKIP_STARTUP_UPDATE;

  beforeEach(async () => {
    vi.clearAllMocks();
    const os = await import('node:os');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'nb-startup-update-'));
    process.env.NB_CLI_ROOT = temp;
    delete process.env.NB_SKIP_STARTUP_UPDATE;
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.inspectSelfInstall.mockResolvedValue({
      installMethod: 'npm-global',
      packageRoot: '/tmp/cli',
    });
  });

  afterEach(async () => {
    const fs = await import('node:fs/promises');
    if (process.env.NB_CLI_ROOT) {
      await fs.rm(process.env.NB_CLI_ROOT, { recursive: true, force: true });
    }

    if (originalHome === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = originalHome;
    }

    if (originalSkip === undefined) {
      delete process.env.NB_SKIP_STARTUP_UPDATE;
    } else {
      process.env.NB_SKIP_STARTUP_UPDATE = originalSkip;
    }
  });

  test('non-global installs skip startup update checks', async () => {
    const { maybeRunStartupUpdate, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.inspectSelfInstall.mockResolvedValue({
      installMethod: 'source',
      packageRoot: '/tmp/cli',
    });

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'skipped' });
    expect(mocks.inspectSelfStatus).not.toHaveBeenCalled();
    expect(mocks.inspectSkillsStatus).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('startup update check still runs in non-interactive sessions', async () => {
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.isInteractiveTerminal.mockReturnValue(false);

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
  });

  test('uses the local calendar date for once-per-day checks', async () => {
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const originalTimezone = process.env.TZ;
    const cliRoot = getCliRoot();

    process.env.TZ = 'Asia/Shanghai';
    await fs.mkdir(path.join(cliRoot, '.nocobase'), { recursive: true });
    await fs.writeFile(
      path.join(cliRoot, '.nocobase', 'startup-update.json'),
      JSON.stringify({ lastCheckedDate: '2026-04-28' }),
    );

    try {
      expect(await shouldRunStartupUpdateCheck(['env', 'list'], new Date('2026-04-28T23:04:49.000Z'))).toBe(true);
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });

  test('updates CLI and skills when user accepts', async () => {
    const { maybeRunStartupUpdate, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: true,
      installedVersion: '1.0.4',
      latestVersion: '1.0.5',
    });
    mocks.confirm.mockResolvedValue(true);
    mocks.run.mockResolvedValue(undefined);

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'updated' });
    expect(mocks.confirm).toHaveBeenCalledWith({
      message: [
        'Updates are available for your NocoBase CLI and AI skills.',
        '- NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21',
        '- NocoBase AI skills: 1.0.4 -> 1.0.5',
        'Update now?',
      ].join('\n'),
      default: true,
    });
    expect(mocks.run.mock.calls).toEqual([
      [
        'nb',
        ['self', 'update', '--yes', '--skills'],
        expect.objectContaining({
          errorName: 'nb self update',
          env: expect.objectContaining({ NB_SKIP_STARTUP_UPDATE: '1' }),
        }),
      ],
    ]);

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('warns when user declines updates', async () => {
    const { maybeRunStartupUpdate } = await import('../lib/startup-update.js');
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: false,
    });
    mocks.confirm.mockResolvedValue(false);

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'declined' });
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.printWarning).toHaveBeenCalledWith(
      'Skipped updates: NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21 Run: nb self update --yes You may run into compatibility issues until you update.',
    );
  });

  test('warns and continues in non-interactive sessions', async () => {
    const { maybeRunStartupUpdate, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.isInteractiveTerminal.mockReturnValue(false);
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: true,
      installedVersion: '1.0.4',
      latestVersion: '1.0.5',
    });

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'warned' });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.printWarning).toHaveBeenCalledWith(
      'Updates available: NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21, NocoBase AI skills: 1.0.4 -> 1.0.5 Non-interactive session, skipped auto-update. Run: nb self update --yes --skills You may run into compatibility issues until you update.',
    );
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('only prompts once per day', async () => {
    const { maybeRunStartupUpdate } = await import('../lib/startup-update.js');
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: false,
    });
    mocks.confirm.mockResolvedValue(false);

    await maybeRunStartupUpdate(['env', 'list']);
    const second = await maybeRunStartupUpdate(['env', 'list']);

    expect(second).toEqual({ kind: 'skipped' });
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });

  test('global installs only check once per day in shouldRunStartupUpdateCheck', async () => {
    const { maybeRunStartupUpdate, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: false,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.20',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: false,
    });

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
    await maybeRunStartupUpdate(['env', 'list']);
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('update.policy=off skips startup update checks', async () => {
    const { setCliConfigValue } = await import('../lib/cli-config.js');
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    await setCliConfigValue('update.policy', 'off', { scope: 'global' });

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
    expect(mocks.inspectSelfInstall).not.toHaveBeenCalled();
  });

  test('update.policy=auto updates without prompting in interactive sessions', async () => {
    const { setCliConfigValue } = await import('../lib/cli-config.js');
    const { maybeRunStartupUpdate, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    await setCliConfigValue('update.policy', 'auto', { scope: 'global' });

    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: true,
      installedVersion: '1.0.4',
      latestVersion: '1.0.5',
    });
    mocks.run.mockResolvedValue(undefined);

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'updated' });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.run.mock.calls).toEqual([
      [
        'nb',
        ['self', 'update', '--yes', '--skills'],
        expect.objectContaining({
          errorName: 'nb self update',
          env: expect.objectContaining({ NB_SKIP_STARTUP_UPDATE: '1' }),
        }),
      ],
    ]);
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('update.policy=auto warns instead of auto-updating in non-interactive sessions', async () => {
    const { setCliConfigValue } = await import('../lib/cli-config.js');
    const { maybeRunStartupUpdate } = await import('../lib/startup-update.js');
    await setCliConfigValue('update.policy', 'auto', { scope: 'global' });

    mocks.isInteractiveTerminal.mockReturnValue(false);
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'npm-global',
      updatable: true,
      updateAvailable: true,
      currentVersion: '2.1.0-beta.20',
      latestVersion: '2.1.0-beta.21',
    });
    mocks.inspectSkillsStatus.mockResolvedValue({
      updateAvailable: true,
      installedVersion: '1.0.4',
      latestVersion: '1.0.5',
    });

    const result = await maybeRunStartupUpdate(['env', 'list']);

    expect(result).toEqual({ kind: 'warned' });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.printWarning).toHaveBeenCalledWith(
      'Updates available: NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21, NocoBase AI skills: 1.0.4 -> 1.0.5 Non-interactive session, skipped auto-update. Run: nb self update --yes --skills You may run into compatibility issues until you update.',
    );
  });

  test('configured prompt overrides a legacy disabled startup-update policy', async () => {
    const { setCliConfigValue } = await import('../lib/cli-config.js');
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const cliRoot = getCliRoot();

    await setCliConfigValue('update.policy', 'prompt', { scope: 'global' });
    await fs.mkdir(path.join(cliRoot, '.nocobase'), { recursive: true });
    await fs.writeFile(
      path.join(cliRoot, '.nocobase', 'startup-update.json'),
      JSON.stringify({
        entries: {
          [path.resolve('packages/core/cli/bin/run.js')]: {
            policy: 'disabled',
          },
        },
      }),
    );

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
  });

  test('nb config delete update.policy clears the legacy disabled startup-update policy', async () => {
    const { default: ConfigDelete } = await import('../commands/config/delete.js');
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const cliRoot = getCliRoot();

    await fs.mkdir(path.join(cliRoot, '.nocobase'), { recursive: true });
    await fs.writeFile(
      path.join(cliRoot, '.nocobase', 'startup-update.json'),
      JSON.stringify({
        entries: {
          [path.resolve('packages/core/cli/bin/run.js')]: {
            policy: 'disabled',
          },
        },
      }),
    );

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);

    const command = Object.assign(Object.create(ConfigDelete.prototype), {
      parse: vi.fn(async () => ({
        args: {
          key: 'update.policy',
        },
      })),
      log: vi.fn(),
    });

    await ConfigDelete.prototype.run.call(command);

    expect(command.log).toHaveBeenCalledWith('Deleted update.policy');
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
  });
});
