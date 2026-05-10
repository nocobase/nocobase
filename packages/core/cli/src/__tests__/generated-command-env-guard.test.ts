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
  isCancel: vi.fn(),
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

vi.mock('@clack/prompts', () => ({
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
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
  mocks.isCancel.mockReturnValue(false);
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
      initialValue: false,
    });
    expect(mocks.executeApiRequest).toHaveBeenCalledOnce();
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
  mocks.confirm.mockResolvedValue(Symbol.for('cancel'));
  mocks.isCancel.mockReturnValue(true);

  try {
    await TestGeneratedCommand.prototype.run.call(command);
    expect(mocks.executeApiRequest).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Canceled.');
  } finally {
    restoreTerminal();
  }
});

test('generated API commands allow one-off cross-env requests when the user already passed --yes', async () => {
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
