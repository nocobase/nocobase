/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: mocks.spawn,
  };
});

const originalNbLocale = process.env.NB_LOCALE;

beforeEach(() => {
  process.env.NB_LOCALE = 'en-US';
});

afterEach(() => {
  mocks.spawn.mockReset();
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
    return;
  }
  process.env.NB_LOCALE = originalNbLocale;
});

function mockDockerPs(output: string, code = 0) {
  mocks.spawn.mockImplementation(() => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };

    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    queueMicrotask(() => {
      if (output) {
        child.stdout.emit('data', Buffer.from(output));
      }
      child.emit('close', code);
    });

    return child;
  });
}

test('validateAvailableTcpPort treats Docker-published host ports as occupied', async () => {
  mockDockerPs('0.0.0.0:13000->80/tcp, [::]:13000->80/tcp\n');

  const { validateAvailableTcpPort } = await import('../lib/prompt-validators.js');
  const error = await validateAvailableTcpPort('13000');

  expect(error ?? '').toMatch(/already in use by a docker container/i);
});
