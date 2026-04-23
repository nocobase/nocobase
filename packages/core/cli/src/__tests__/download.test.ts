/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test, vi } from 'vitest';
import type { DownloadResolvedFlags } from '../commands/download.js';
import Download from '../commands/download.js';

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  printVerbose: vi.fn(),
  setVerboseMode: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
}));

vi.mock('../lib/run-npm.ts', () => ({
  run: mocks.run,
}));

vi.mock('../lib/ui.ts', () => ({
  printVerbose: mocks.printVerbose,
  setVerboseMode: mocks.setVerboseMode,
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
}));

const tempDirs: string[] = [];

afterEach(async () => {
  mocks.run.mockReset();
  mocks.printVerbose.mockReset();
  mocks.setVerboseMode.mockReset();
  mocks.startTask.mockReset();
  mocks.updateTask.mockReset();
  mocks.stopTask.mockReset();
  vi.restoreAllMocks();
  vi.useRealTimers();
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

async function useTempCwd(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-download-'));
  tempDirs.push(dir);
  vi.spyOn(process, 'cwd').mockReturnValue(dir);
  return dir;
}

function createCommand() {
  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Download.prototype), {
    config: { runCommand },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  }) as Download & { config: { runCommand: ReturnType<typeof vi.fn> }; log: ReturnType<typeof vi.fn> };

  return { command, runCommand };
}

test('downloadFromDocker pulls image and saves a sanitized tarball path', async () => {
  const cwd = await useTempCwd();
  mocks.run.mockResolvedValue(undefined);
  const { command } = createCommand();
  const flags: DownloadResolvedFlags = {
    source: 'docker',
    version: 'feature/foo',
    replace: false,
    build: true,
    'build-dts': false,
    'docker-registry': 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
    'docker-platform': 'linux/arm64',
    'docker-save': true,
    'output-dir': './docker-images',
  };

  await command.downloadFromDocker(flags);

  const imageRef = 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:feature/foo';
  const tarPath = path.join(
    cwd,
    'docker-images',
    'registry.cn-shanghai.aliyuncs.com-nocobase-nocobase-feature-foo.tar',
  );

  assert.deepEqual(mocks.run.mock.calls, [
    [
      'docker',
      ['pull', '--platform', 'linux/arm64', imageRef],
      { errorName: 'docker pull', loadingMessage: 'Pulling the Docker image', stdio: 'ignore' },
    ],
    [
      'docker',
      ['save', '-o', tarPath, imageRef],
      { errorName: 'docker save', loadingMessage: 'Saving the Docker image tarball', stdio: 'ignore' },
    ],
  ]);
});

test('downloadFromNpm skips build without dev dependencies and forwards npm registry', async () => {
  const cwd = await useTempCwd();
  mocks.run.mockResolvedValue(undefined);
  const { command, runCommand } = createCommand();
  const flags: DownloadResolvedFlags = {
    source: 'npm',
    version: 'latest',
    replace: false,
    build: true,
    'build-dts': true,
    'dev-dependencies': false,
    'output-dir': './app',
    'npm-registry': 'https://registry.npmmirror.com',
  };

  const projectRoot = await command.downloadFromNpm(flags);

  assert.equal(projectRoot, path.join(cwd, 'app'));
  assert.deepEqual(mocks.run.mock.calls, [
    [
      'npx',
      ['-y', 'create-nocobase-app@latest', 'app', '--skip-dev-dependencies'],
      {
        cwd,
        errorName: 'npx create-nocobase-app',
        env: {
          npm_config_registry: 'https://registry.npmmirror.com',
        },
        loadingMessage: 'Creating the app scaffold',
        stdio: 'ignore',
      },
    ],
    [
      'yarn',
      ['install', '--production'],
      {
        cwd: path.join(cwd, 'app'),
        errorName: 'yarn install',
        env: {
          npm_config_registry: 'https://registry.npmmirror.com',
        },
        loadingMessage: 'Installing dependencies',
        stdio: 'ignore',
      },
    ],
  ]);
  assert.equal(runCommand.mock.calls.length, 0);
});

test('downloadFromGit maps alpha to develop and builds with --no-dts by default', async () => {
  const cwd = await useTempCwd();
  mocks.run.mockResolvedValue(undefined);
  const { command, runCommand } = createCommand();
  const flags: DownloadResolvedFlags = {
    source: 'git',
    version: 'alpha',
    replace: false,
    build: true,
    'build-dts': false,
    'output-dir': './repo',
    'git-url': 'https://github.com/nocobase/nocobase.git',
  };

  const projectRoot = await command.downloadFromGit(flags);

  assert.equal(projectRoot, path.join(cwd, 'repo'));
  assert.deepEqual(mocks.run.mock.calls, [
    [
      'git',
      ['clone', '--branch', 'develop', '--depth', '1', 'https://github.com/nocobase/nocobase.git', './repo'],
      { errorName: 'git clone', loadingMessage: 'Cloning the repository', stdio: 'ignore' },
    ],
    [
      'yarn',
      ['install'],
      {
        cwd: path.join(cwd, 'repo'),
        errorName: 'yarn install',
        loadingMessage: 'Installing dependencies',
        stdio: 'ignore',
      },
    ],
  ]);
  assert.deepEqual(runCommand.mock.calls, [
    ['build', ['--cwd', path.join(cwd, 'repo'), '--no-dts']],
  ]);
});

test('download forwards raw command output only in verbose mode', async () => {
  const cwd = await useTempCwd();
  mocks.run.mockResolvedValue(undefined);
  const { command, runCommand } = createCommand();
  (command as Download & { _flags?: { verbose: boolean } })._flags = { verbose: true } as never;
  const flags: DownloadResolvedFlags = {
    source: 'git',
    version: 'alpha',
    replace: false,
    build: true,
    'build-dts': false,
    'output-dir': './repo',
    'git-url': 'https://github.com/nocobase/nocobase.git',
  };

  const projectRoot = await command.downloadFromGit(flags);

  assert.equal(projectRoot, path.join(cwd, 'repo'));
  assert.deepEqual(mocks.run.mock.calls, [
    [
      'git',
      ['clone', '--branch', 'develop', '--depth', '1', 'https://github.com/nocobase/nocobase.git', './repo'],
      { errorName: 'git clone', loadingMessage: 'Cloning the repository', stdio: 'inherit' },
    ],
    [
      'yarn',
      ['install'],
      {
        cwd: path.join(cwd, 'repo'),
        errorName: 'yarn install',
        loadingMessage: 'Installing dependencies',
        stdio: 'inherit',
      },
    ],
  ]);
  assert.deepEqual(runCommand.mock.calls, [
    ['build', ['--cwd', path.join(cwd, 'repo'), '--no-dts', '--verbose']],
  ]);
});

test('download shows a delayed loading indicator for long-running commands in non-verbose mode', async () => {
  await useTempCwd();
  vi.useFakeTimers();

  let resolveRun: (() => void) | undefined;
  mocks.run.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        resolveRun = resolve;
      }),
  );

  const { command } = createCommand();
  const flags: DownloadResolvedFlags = {
    source: 'docker',
    version: 'latest',
    replace: false,
    build: true,
    'build-dts': false,
    'docker-registry': 'nocobase/nocobase',
    'docker-save': false,
  };

  const promise = command.downloadFromDocker(flags);

  await vi.advanceTimersByTimeAsync(7_999);
  assert.equal(mocks.startTask.mock.calls.length, 0);

  await vi.advanceTimersByTimeAsync(1);
  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Pulling the Docker image. Please wait...'],
  ]);

  resolveRun?.();
  await promise;

  assert.equal(mocks.stopTask.mock.calls.length, 1);
  assert.equal(mocks.updateTask.mock.calls.length, 0);
});

test('download shows a preparation loading state before entering the source-specific flow', async () => {
  await useTempCwd();
  const { command } = createCommand();
  command.parse = vi.fn(async () => ({
    flags: {
      yes: false,
      verbose: false,
    },
  })) as never;

  const resolved: DownloadResolvedFlags = {
    source: 'npm',
    version: 'latest',
    replace: false,
    build: true,
    'build-dts': false,
    'output-dir': './app',
  };

  (command as Download & { resolveDownloadFlags: (flags: unknown) => Promise<DownloadResolvedFlags> }).resolveDownloadFlags =
    vi.fn(async () => resolved) as never;
  (command as Download & { downloadFromNpm: (flags: DownloadResolvedFlags) => Promise<string> }).downloadFromNpm =
    vi.fn(async (flags: DownloadResolvedFlags) => {
      assert.deepEqual(flags, resolved);
      assert.deepEqual(mocks.startTask.mock.calls, [
        ['Preparing download from npm package'],
      ]);
      assert.equal(mocks.stopTask.mock.calls.length, 0);
      return path.join(process.cwd(), 'app');
    }) as never;

  const result = await command.download();

  assert.equal(result.projectRoot, path.join(process.cwd(), 'app'));
  assert.equal(mocks.stopTask.mock.calls.length, 1);
});
