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
  inspectSelfStatus: vi.fn(),
  inspectSkillsStatus: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn((value: unknown) => value === Symbol.for('cancel')),
  printWarning: vi.fn(),
  run: vi.fn(),
  isInteractiveTerminal: vi.fn(),
}));

vi.mock('../lib/self-manager.js', () => ({
  inspectSelfStatus: mocks.inspectSelfStatus,
}));

vi.mock('../lib/skills-manager.js', () => ({
  inspectSkillsStatus: mocks.inspectSkillsStatus,
}));

vi.mock('@clack/prompts', () => ({
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
}));

vi.mock('../lib/ui.js', () => ({
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printWarning: mocks.printWarning,
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
}));

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

  test('skips prompt for non-global installs', async () => {
    const { maybeRunStartupUpdatePrompt, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.inspectSelfStatus.mockResolvedValue({
      installMethod: 'source',
      updatable: false,
      updateAvailable: true,
    });

    const result = await maybeRunStartupUpdatePrompt(['env', 'list']);

    expect(result).toEqual({ kind: 'skipped' });
    expect(mocks.inspectSkillsStatus).not.toHaveBeenCalled();
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
  });

  test('startup update check still runs in non-interactive sessions', async () => {
    const { shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
    mocks.isInteractiveTerminal.mockReturnValue(false);

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(true);
  });

  test('updates CLI and skills when user accepts', async () => {
    const { maybeRunStartupUpdatePrompt, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
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

    const result = await maybeRunStartupUpdatePrompt(['env', 'list']);

    expect(result).toEqual({ kind: 'updated' });
    expect(mocks.confirm).toHaveBeenCalledWith({
      message: [
        'Updates are available for your NocoBase CLI and AI skills.',
        '- NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21',
        '- NocoBase AI skills: 1.0.4 -> 1.0.5',
        'Update now?',
      ].join('\n'),
      active: 'Yes',
      inactive: 'No',
      initialValue: true,
    });
    expect(mocks.run.mock.calls).toEqual([
      [
        'nb',
        ['self', 'update', '--yes'],
        expect.objectContaining({
          errorName: 'nb self update',
          env: expect.objectContaining({ NB_SKIP_STARTUP_UPDATE: '1' }),
        }),
      ],
      [
        'nb',
        ['skills', 'update', '--yes'],
        expect.objectContaining({
          errorName: 'nb skills update',
          env: expect.objectContaining({ NB_SKIP_STARTUP_UPDATE: '1' }),
        }),
      ],
    ]);

    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('warns when user declines updates', async () => {
    const { maybeRunStartupUpdatePrompt } = await import('../lib/startup-update.js');
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

    const result = await maybeRunStartupUpdatePrompt(['env', 'list']);

    expect(result).toEqual({ kind: 'declined' });
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.printWarning).toHaveBeenCalledWith(
      'Skipped updates: NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21 Run: nb self update --yes You may run into compatibility issues until you update.',
    );
  });

  test('warns and continues in non-interactive sessions', async () => {
    const { maybeRunStartupUpdatePrompt, shouldRunStartupUpdateCheck } = await import('../lib/startup-update.js');
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

    const result = await maybeRunStartupUpdatePrompt(['env', 'list']);

    expect(result).toEqual({ kind: 'warned' });
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(mocks.printWarning).toHaveBeenCalledWith(
      'Updates available: NocoBase CLI: 2.1.0-beta.20 -> 2.1.0-beta.21, NocoBase AI skills: 1.0.4 -> 1.0.5 Non-interactive session, skipped auto-update. Run: nb self update --yes && nb skills update --yes You may run into compatibility issues until you update.',
    );
    expect(await shouldRunStartupUpdateCheck(['env', 'list'])).toBe(false);
  });

  test('only prompts once per day', async () => {
    const { maybeRunStartupUpdatePrompt } = await import('../lib/startup-update.js');
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

    await maybeRunStartupUpdatePrompt(['env', 'list']);
    const second = await maybeRunStartupUpdatePrompt(['env', 'list']);

    expect(second).toEqual({ kind: 'skipped' });
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });
});
