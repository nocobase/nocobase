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
  executeResourceRequest: vi.fn(),
  confirm: vi.fn(),
  setVerboseMode: vi.fn(),
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
}));

vi.mock('../lib/resource-request.js', () => ({
  executeResourceRequest: mocks.executeResourceRequest,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.confirm,
}));

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    setVerboseMode: mocks.setVerboseMode,
  };
});

import { resourceBaseFlags, runResourceCommand } from '../lib/resource-command.js';

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

function createCommand() {
  return {
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentEnvName.mockResolvedValue('dev');
  mocks.executeResourceRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: { ok: true },
  });
});

test('resource base flags expose the cross-env confirmation flag', () => {
  expect(resourceBaseFlags.yes.char).toBe('y');
  expect(resourceBaseFlags.yes.default).toBe(false);
});

test('resource commands reject cross-env requests in non-interactive agent sessions without --yes', async () => {
  const restoreTerminal = setTerminalInteractivity(false);
  const command = createCommand();

  try {
    await expect(
      runResourceCommand(
        command as any,
        'list',
        {
          env: 'prod',
          yes: false,
          verbose: false,
          'json-output': true,
        },
        {
          resource: 'users',
        },
      ),
    ).rejects.toThrow(/Refusing to run against env "prod" because the current env is "dev"/);
    expect(mocks.executeResourceRequest).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('resource commands ask for confirmation before cross-env requests in interactive sessions', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const command = createCommand();
  mocks.confirm.mockResolvedValue(true);

  try {
    await runResourceCommand(
      command as any,
      'list',
      {
        env: 'prod',
        yes: false,
        verbose: false,
        'json-output': true,
      },
      {
        resource: 'users',
      },
    );

    expect(mocks.confirm).toHaveBeenCalledWith({
      message:
        'Current env is "dev", but this command targets "prod" via --env. Continue without switching the current env?',
      default: false,
    });
    expect(mocks.executeResourceRequest).toHaveBeenCalledOnce();
    expect(command.log).toHaveBeenCalledWith(JSON.stringify({ ok: true }, null, 2));
  } finally {
    restoreTerminal();
  }
});

test('resource commands treat a canceled confirmation as a no-op', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const command = createCommand();
  mocks.confirm.mockRejectedValue(new Error('canceled'));

  try {
    await runResourceCommand(
      command as any,
      'list',
      {
        env: 'prod',
        yes: false,
        verbose: false,
        'json-output': true,
      },
      {
        resource: 'users',
      },
    );

    expect(mocks.executeResourceRequest).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('resource commands let --yes skip the interactive cross-env confirmation prompt', async () => {
  const restoreTerminal = setTerminalInteractivity(true);
  const command = createCommand();

  try {
    await runResourceCommand(
      command as any,
      'list',
      {
        env: 'prod',
        yes: true,
        verbose: false,
        'json-output': true,
      },
      {
        resource: 'users',
      },
    );

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.executeResourceRequest).toHaveBeenCalledOnce();
  } finally {
    restoreTerminal();
  }
});

test('resource commands let --yes skip the non-interactive cross-env refusal', async () => {
  const restoreTerminal = setTerminalInteractivity(false);
  const command = createCommand();

  try {
    await runResourceCommand(
      command as any,
      'list',
      {
        env: 'prod',
        yes: true,
        verbose: false,
        'json-output': true,
      },
      {
        resource: 'users',
      },
    );

    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(mocks.executeResourceRequest).toHaveBeenCalledOnce();
  } finally {
    restoreTerminal();
  }
});
