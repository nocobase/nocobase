/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

type EnvRecord = Record<string, Record<string, unknown>>;

const state = vi.hoisted(() => ({
  currentEnv: 'app1',
  envs: {} as EnvRecord,
  ensureCrossEnvConfirmed: vi.fn(async () => true),
  hasExplicitEnvSelection: vi.fn(() => false),
  announceTargetEnv: vi.fn(),
  renderTable: vi.fn((headers: string[], rows: string[][]) =>
    [headers.join('|'), ...rows.map((row) => row.join('|'))].join('\n'),
  ),
  runCommand: vi.fn(async () => undefined),
}));

function cloneEnvs(envs: EnvRecord): EnvRecord {
  return JSON.parse(JSON.stringify(envs)) as EnvRecord;
}

vi.mock('../lib/auth-store.js', () => ({
  loadExactAuthConfig: vi.fn(async () => ({
    envs: cloneEnvs(state.envs),
    lastEnv: state.currentEnv,
  })),
  saveAuthConfig: vi.fn(async (config: { envs: EnvRecord }) => {
    state.envs = cloneEnvs(config.envs);
  }),
  listEnvs: vi.fn(async () => ({
    envs: cloneEnvs(state.envs),
    lastEnv: state.currentEnv,
  })),
  getCurrentEnvName: vi.fn(async () => state.currentEnv),
  getEnv: vi.fn(async (envName?: string) => {
    const resolvedName = String(envName ?? state.currentEnv).trim();
    const config = state.envs[resolvedName];
    if (!config) {
      return undefined;
    }
    return {
      name: resolvedName,
      config: {
        ...cloneEnvs({ [resolvedName]: config })[resolvedName],
        name: resolvedName,
      },
    };
  }),
}));

vi.mock('../lib/env-guard.js', () => ({
  ensureCrossEnvConfirmed: state.ensureCrossEnvConfirmed,
  hasExplicitEnvSelection: state.hasExplicitEnvSelection,
}));

vi.mock('../lib/app-runtime.js', () => ({
  formatMissingManagedAppEnvMessage: (envName?: string) =>
    envName ? `Env "${envName}" is not configured in this workspace.` : 'No NocoBase env is configured yet.',
  resolveManagedAppRuntime: vi.fn(async (envName?: string) => {
    const name = String(envName ?? '').trim();
    const config = state.envs[name];
    if (!config) {
      return undefined;
    }
    const kind = String(config.kind ?? '').trim();
    if (kind !== 'local' && kind !== 'docker') {
      return undefined;
    }
    return {
      kind,
      envName: name,
      env: { config },
    };
  }),
}));

vi.mock('../lib/ui.js', () => ({
  announceTargetEnv: state.announceTargetEnv,
  renderTable: state.renderTable,
}));

function createCommandHarness(
  parseResult: { args?: Record<string, unknown>; flags?: Record<string, unknown> },
  runCommand = state.runCommand,
) {
  return {
    argv: [],
    parse: vi.fn(async () => ({
      args: parseResult.args ?? {},
      flags: parseResult.flags ?? {},
    })),
    config: {
      runCommand,
    },
    error: (message: string) => {
      throw new Error(message);
    },
    log: vi.fn(),
  };
}

beforeEach(() => {
  state.currentEnv = 'app1';
  state.envs = {
    app1: {
      kind: 'local',
      source: 'npm',
    },
    app2: {
      kind: 'docker',
      source: 'docker',
    },
    remote1: {
      kind: 'http',
    },
  };
  state.ensureCrossEnvConfirmed.mockReset();
  state.ensureCrossEnvConfirmed.mockResolvedValue(true);
  state.hasExplicitEnvSelection.mockReset();
  state.hasExplicitEnvSelection.mockReturnValue(false);
  state.announceTargetEnv.mockReset();
  state.renderTable.mockClear();
  state.runCommand.mockReset();
  state.runCommand.mockResolvedValue(undefined);
});

test('enable stores autostart on the selected env', async () => {
  const { default: Enable } = await import('../commands/app/autostart/enable.js');
  const command = createCommandHarness({
    flags: {},
  });

  await Enable.prototype.run.call(command);

  expect(state.envs.app1?.autostart).toEqual({ enabled: true });
  expect(command.log).toHaveBeenCalledWith('Enabled app autostart for "app1".');
});

test('enable rejects unsupported env types', async () => {
  const { default: Enable } = await import('../commands/app/autostart/enable.js');
  const command = createCommandHarness({
    flags: {
      env: 'remote1',
    },
  });
  command.argv = ['--env', 'remote1'];
  state.hasExplicitEnvSelection.mockReturnValue(true);

  await expect((() => Enable.prototype.run.call(command))()).rejects.toThrow(
    /Env "remote1" cannot be added to app autostart\./,
  );
});

test('disable removes autostart from the selected env', async () => {
  const { default: Disable } = await import('../commands/app/autostart/disable.js');
  state.envs.app1 = {
    ...state.envs.app1,
    autostart: { enabled: true },
  };
  const command = createCommandHarness({
    flags: {},
  });

  await Disable.prototype.run.call(command);

  expect(state.envs.app1?.autostart).toBeUndefined();
  expect(command.log).toHaveBeenCalledWith('Disabled app autostart for "app1".');
});

test('list renders all env autostart statuses', async () => {
  const { default: List } = await import('../commands/app/autostart/list.js');
  state.envs.app2 = {
    ...state.envs.app2,
    autostart: { enabled: true },
  };
  const command = createCommandHarness({
    flags: {},
  });

  await List.prototype.run.call(command);

  expect(command.log).toHaveBeenCalledWith(
    'Current|Env|Kind|Source|Autostart\n*|app1|local|npm|no\n|app2|docker|docker|yes\n|remote1|http|-|no',
  );
});

test('run starts only enabled envs in order', async () => {
  const { default: Run } = await import('../commands/app/autostart/run.js');
  state.envs.app2 = {
    ...state.envs.app2,
    autostart: { enabled: true },
  };
  state.envs.app1 = {
    ...state.envs.app1,
    autostart: { enabled: true },
  };
  const command = createCommandHarness({
    flags: {},
  });

  await Run.prototype.run.call(command);

  expect(state.runCommand.mock.calls).toEqual([
    ['app:start', ['--env', 'app1', '--yes']],
    ['app:start', ['--env', 'app2', '--yes']],
  ]);
  expect(command.log).toHaveBeenCalledWith(
    'Env|Status|Detail\napp1|started|Started local app runtime.\napp2|started|Started docker app runtime.',
  );
});

test('run continues after failures and exits with an error', async () => {
  const { default: Run } = await import('../commands/app/autostart/run.js');
  state.envs.app2 = {
    ...state.envs.app2,
    autostart: { enabled: true },
  };
  state.envs.app1 = {
    ...state.envs.app1,
    autostart: { enabled: true },
  };
  state.runCommand.mockImplementation(async (_id: string, argv: string[]) => {
    if (argv[1] === 'app1') {
      throw new Error('boom');
    }
  });
  const command = createCommandHarness({
    flags: {},
  });

  await expect((() => Run.prototype.run.call(command))()).rejects.toThrow('Some app autostart envs failed to start.');

  expect(state.runCommand.mock.calls).toEqual([
    ['app:start', ['--env', 'app1', '--yes']],
    ['app:start', ['--env', 'app2', '--yes']],
  ]);
  expect(command.log).toHaveBeenCalledWith(
    'Env|Status|Detail\napp1|failed|boom\napp2|started|Started docker app runtime.',
  );
});
