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
  publishSourceSnapshot: vi.fn(),
  buildSuggestedInitCommand: vi.fn(() => 'nb init --env snapshotabc12345 --yes --source npm --version 2.1.0-beta.34-snapshot.20260519.abc12345 --npm-registry=http://127.0.0.1:4873'),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
}));

vi.mock('../lib/source-publish.js', () => ({
  publishSourceSnapshot: mocks.publishSourceSnapshot,
  buildSuggestedInitCommand: mocks.buildSuggestedInitCommand,
}));

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.publishSourceSnapshot.mockResolvedValue({
    version: '2.1.0-beta.34-snapshot.20260519.abc12345',
    npmRegistry: 'http://127.0.0.1:4873',
    gitSha: 'abc12345',
    projectRoot: '/repo',
  });
});

test('source publish maps negative build flags to publish options', async () => {
  const { default: SourcePublish } = await import('../commands/source/publish.js');

  const command = Object.assign(Object.create(SourcePublish.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        snapshot: true,
        cwd: '/repo',
        'npm-registry': 'http://127.0.0.1:4873',
        'no-build': true,
        'no-build-dts': true,
        json: false,
        verbose: false,
      },
    })),
    log: vi.fn(),
    logToStderr: vi.fn(),
    exit: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SourcePublish.prototype.run.call(command);

  expect(mocks.publishSourceSnapshot).toHaveBeenCalledWith({
    cwd: '/repo',
    npmRegistry: 'http://127.0.0.1:4873',
    build: false,
    buildDts: false,
    verbose: false,
  });
});

