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
  getCurrentEnvName: vi.fn(),
  executeApiRequest: vi.fn(),
  applyPostProcessor: vi.fn(),
  registerPostProcessors: vi.fn(),
  confirm: vi.fn(),
  readInstalledManagedSkillsVersion: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
}));

vi.mock('../lib/api-client.js', () => ({
  executeApiRequest: mocks.executeApiRequest,
}));

vi.mock('../lib/post-processors.js', () => ({
  applyPostProcessor: mocks.applyPostProcessor,
}));

vi.mock('../post-processors/index.js', () => ({
  registerPostProcessors: mocks.registerPostProcessors,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.confirm,
}));

vi.mock('../lib/skills-manager.js', () => ({
  readInstalledManagedSkillsVersion: mocks.readInstalledManagedSkillsVersion,
}));

import { GeneratedApiCommand, createGeneratedFlags, type GeneratedOperation } from '../lib/generated-command.js';

const testOperation: GeneratedOperation = {
  commandId: 'test guard',
  method: 'get',
  pathTemplate: '/test:guard',
  parameters: [],
  examples: [],
};

class TestGeneratedCommand extends GeneratedApiCommand {
  static override operation = testOperation;
  static override flags = createGeneratedFlags(testOperation);
}

function setTerminalInteractivity(value: boolean) {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value,
  });

  return () => {
    if (stdinDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
    }
    if (stdoutDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor);
    }
  };
}

function createCommand(flags: Record<string, unknown>) {
  const log = vi.fn();
  return {
    command: Object.assign(Object.create(TestGeneratedCommand.prototype), {
      config: {
        pjson: {
          version: '2.1.0-beta.41',
        },
      },
      parse: vi.fn(async () => ({ flags })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    }),
    log,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentEnvName.mockResolvedValue('dev');
  mocks.executeApiRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: { ok: true },
  });
  mocks.applyPostProcessor.mockResolvedValue({ ok: true });
  mocks.readInstalledManagedSkillsVersion.mockResolvedValue(undefined);
});

test('generated API commands reject cross-env requests in non-interactive agent sessions without --yes', async () => {
  const restoreTerminal = setTerminalInteractivity(false);
  const { command } = createCommand({
    env: 'prod',
    yes: false,
    verbose: false,
    'json-output': true,
  });

  try {
    await expect(TestGeneratedCommand.prototype.run.call(command)).rejects.toThrow(
      /Refusing to run against env "prod" because the current env is "dev"/,
    );
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('generated API commands ask for confirmation before cross-env requests in interactive sessions', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command, log } = createCommand({
    env: 'prod',
    yes: false,
    verbose: false,
    'json-output': true,
  });
  mocks.confirm.mockResolvedValue(true);

  try {
    await TestGeneratedCommand.prototype.run.call(command);
    expect(mocks.confirm).toHaveBeenCalledWith({
      message:
        'Current env is "dev", but this command targets "prod" via --env. Continue without switching the current env?',
      default: false,
    });
    expect(mocks.executeApiRequest).toHaveBeenCalledOnce();
    expect(mocks.executeApiRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        cliVersion: '2.1.0-beta.41',
        skillsVersion: undefined,
      }),
    );
    expect(log).toHaveBeenCalledWith(JSON.stringify({ ok: true }, null, 2));
  } finally {
    restoreTerminal();
  }
});

test('generated API commands treat a canceled confirmation as a no-op', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command, log } = createCommand({
    env: 'prod',
    yes: false,
    verbose: false,
    'json-output': true,
  });
  mocks.confirm.mockRejectedValue(new Error('canceled'));

  try {
    await TestGeneratedCommand.prototype.run.call(command);
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('generated API commands let --yes skip the interactive cross-env confirmation prompt', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command } = createCommand({
    env: 'prod',
    yes: true,
    verbose: false,
    'json-output': true,
  });

  try {
    await TestGeneratedCommand.prototype.run.call(command);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.executeApiRequest).toHaveBeenCalledOnce();
  } finally {
    restoreTerminal();
  }
});

test('generated API commands let --yes skip the non-interactive cross-env refusal', async () => {
  const restoreTerminal = setTerminalInteractivity(false);
  const { command } = createCommand({
    env: 'prod',
    yes: true,
    verbose: false,
    'json-output': true,
  });

  try {
    await TestGeneratedCommand.prototype.run.call(command);
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.executeApiRequest).toHaveBeenCalledOnce();
  } finally {
    restoreTerminal();
  }
});

test('generated API commands reject incompatible CLI and app version combinations before sending the request', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command } = createCommand({
    yes: true,
    verbose: false,
    'json-output': true,
  });

  TestGeneratedCommand.runtimeVersion = '2.1.0-beta.18';
  command.config = {
    pjson: {
      version: '2.1.0-beta.41',
      nocobase: {
        apiCommandCompat: {
          rules: [
            {
              code: 'TEST_APP_TOO_OLD',
              target: {
                command: 'test guard',
              },
              when: {
                cli: {
                  gte: '2.1.0-beta.40',
                },
                app: {
                  lt: '2.1.0-beta.20',
                },
              },
            },
          ],
        },
      },
    },
  };

  try {
    await expect(TestGeneratedCommand.prototype.run.call(command)).rejects.toThrow(
      /Refusing to run `nb api test guard` because the current CLI version is 2\.1\.0-beta\.41 while the target app version is 2\.1\.0-beta\.18\.[\s\S]*upgrade the app to >= 2\.1\.0-beta\.20[\s\S]*use a CLI version < 2\.1\.0-beta\.40/,
    );
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
  } finally {
    TestGeneratedCommand.runtimeVersion = undefined;
    restoreTerminal();
  }
});

test('generated API commands reject incompatible skills version combinations before sending the request', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command } = createCommand({
    yes: true,
    verbose: false,
    'json-output': true,
  });

  TestGeneratedCommand.runtimeVersion = '2.1.0-beta.18';
  mocks.readInstalledManagedSkillsVersion.mockResolvedValue('1.0.4');
  command.config = {
    pjson: {
      version: '2.1.0-beta.41',
      nocobase: {
        apiCommandCompat: {
          rules: [
            {
              code: 'TEST_SKILLS_TOO_OLD',
              target: {
                command: 'test guard',
              },
              when: {
                cli: {
                  gte: '2.1.0-beta.40',
                },
                app: {
                  lt: '2.1.0-beta.20',
                },
                skills: {
                  lt: '1.0.5',
                },
              },
            },
          ],
        },
      },
    },
  };

  try {
    await expect(TestGeneratedCommand.prototype.run.call(command)).rejects.toThrow(
      /Current versions: CLI 2\.1\.0-beta\.41, app 2\.1\.0-beta\.18, and NocoBase AI skills 1\.0\.4\.[\s\S]*NocoBase AI skills version < 1\.0\.5[\s\S]*update the NocoBase AI coding skills to >= 1\.0\.5/,
    );
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
  } finally {
    TestGeneratedCommand.runtimeVersion = undefined;
    restoreTerminal();
  }
});

test('generated API commands reject when a skills version rule applies but the managed skills version is unavailable', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const { command } = createCommand({
    yes: true,
    verbose: false,
    'json-output': true,
  });

  TestGeneratedCommand.runtimeVersion = '2.1.0-beta.18';
  mocks.readInstalledManagedSkillsVersion.mockResolvedValue(undefined);
  command.config = {
    pjson: {
      version: '2.1.0-beta.41',
      nocobase: {
        apiCommandCompat: {
          rules: [
            {
              code: 'TEST_SKILLS_REQUIRED',
              target: {
                command: 'test guard',
              },
              when: {
                cli: {
                  gte: '2.1.0-beta.40',
                },
                app: {
                  lt: '2.1.0-beta.20',
                },
                skills: {
                  lt: '1.0.5',
                },
              },
            },
          ],
        },
      },
    },
  };

  try {
    await expect(TestGeneratedCommand.prototype.run.call(command)).rejects.toThrow(
      /installed NocoBase AI skills version is unavailable[\s\S]*run `nb skills install --yes` or `nb skills update --yes`/,
    );
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
  } finally {
    TestGeneratedCommand.runtimeVersion = undefined;
    restoreTerminal();
  }
});
