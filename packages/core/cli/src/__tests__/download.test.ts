/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';
import type { DownloadResolvedFlags } from '../commands/source/download.js';
import Download from '../commands/source/download.js';

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
const originalNbLocale = process.env.NB_LOCALE;

beforeEach(() => {
  process.env.NB_LOCALE = 'en-US';
});

afterEach(async () => {
  mocks.run.mockReset();
  mocks.printVerbose.mockReset();
  mocks.setVerboseMode.mockReset();
  mocks.startTask.mockReset();
  mocks.updateTask.mockReset();
  mocks.stopTask.mockReset();
  vi.restoreAllMocks();
  vi.useRealTimers();
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
  } else {
    process.env.NB_LOCALE = originalNbLocale;
  }
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

  expect(mocks.run.mock.calls).toEqual([
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

  expect(projectRoot).toBe(path.join(cwd, 'app'));
  expect(mocks.run.mock.calls).toEqual([
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
  expect(runCommand.mock.calls.length).toBe(0);
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

  expect(projectRoot).toBe(path.join(cwd, 'repo'));
  expect(mocks.run.mock.calls).toEqual([
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
  expect(runCommand.mock.calls).toEqual([
    ['source:build', ['--cwd', path.join(cwd, 'repo'), '--no-dts']],
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

  expect(projectRoot).toBe(path.join(cwd, 'repo'));
  expect(mocks.run.mock.calls).toEqual([
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
  expect(runCommand.mock.calls).toEqual([
    ['source:build', ['--cwd', path.join(cwd, 'repo'), '--no-dts', '--verbose']],
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
  expect(mocks.startTask.mock.calls.length).toBe(0);

  await vi.advanceTimersByTimeAsync(1);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Pulling the Docker image. Please wait...'],
  ]);

  resolveRun?.();
  await promise;

  expect(mocks.stopTask.mock.calls.length).toBe(1);
  expect(mocks.updateTask.mock.calls.length).toBe(0);
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
      expect(flags).toEqual(resolved);
      expect(mocks.startTask.mock.calls).toEqual([
        ['Preparing download from npm package'],
      ]);
      expect(mocks.stopTask.mock.calls.length).toBe(0);
      return path.join(process.cwd(), 'app');
    }) as never;

  const result = await command.download();

  expect(result.projectRoot).toBe(path.join(process.cwd(), 'app'));
  expect(mocks.stopTask.mock.calls.length).toBe(1);
});

test('download formats dependency install failures in non-verbose mode', async () => {
  await useTempCwd();
  const { command } = createCommand();
  command.parse = vi.fn(async () => ({
    flags: {
      yes: true,
      verbose: false,
      'no-intro': true,
    },
  })) as never;

  (command as Download & { resolveDownloadFlags: (flags: unknown) => Promise<DownloadResolvedFlags> }).resolveDownloadFlags =
    vi.fn(async () => ({
      source: 'git',
      version: 'alpha',
      replace: false,
      build: true,
      'build-dts': false,
      'output-dir': './repo',
      'git-url': 'https://github.com/nocobase/nocobase.git',
    })) as never;
  (command as Download & { downloadFromGit: (flags: DownloadResolvedFlags) => Promise<string> }).downloadFromGit =
    vi.fn(async () => {
      throw new Error('yarn install exited with code 1');
    }) as never;

  await expect(command.run()).rejects.toThrow(
    [
      "Couldn't finish preparing the local NocoBase app.",
      'The download completed, but dependency installation did not finish successfully.',
      'Run the same command again with `--verbose` to see the full install logs.',
    ].join('\n'),
  );
});

test('download formats build failures in non-verbose mode', async () => {
  await useTempCwd();
  const { command } = createCommand();
  command.parse = vi.fn(async () => ({
    flags: {
      yes: true,
      verbose: false,
      'no-intro': true,
    },
  })) as never;

  (command as Download & { resolveDownloadFlags: (flags: unknown) => Promise<DownloadResolvedFlags> }).resolveDownloadFlags =
    vi.fn(async () => ({
      source: 'npm',
      version: 'alpha',
      replace: false,
      build: true,
      'build-dts': false,
      'output-dir': './app',
    })) as never;
  (command as Download & { downloadFromNpm: (flags: DownloadResolvedFlags) => Promise<string> }).downloadFromNpm =
    vi.fn(async () => {
      throw new Error('nocobase command exited with code 1');
    }) as never;

  await expect(command.run()).rejects.toThrow(
    [
      'The local NocoBase app was downloaded, but the build step failed.',
      'The CLI could not finish building the downloaded source code.',
      'Run the same command again with `--verbose` to see the full build logs.',
    ].join('\n'),
  );
});

test('download formats unexpected subprocess failures in non-verbose mode', async () => {
  await useTempCwd();
  const { command } = createCommand();
  command.parse = vi.fn(async () => ({
    flags: {
      yes: true,
      verbose: false,
      'no-intro': true,
    },
  })) as never;

  (command as Download & { resolveDownloadFlags: (flags: unknown) => Promise<DownloadResolvedFlags> }).resolveDownloadFlags =
    vi.fn(async () => ({
      source: 'docker',
      version: 'alpha',
      replace: false,
      build: true,
      'build-dts': false,
      'docker-registry': 'nocobase/nocobase',
      'docker-save': false,
    })) as never;
  (command as Download & { downloadFromDocker: (flags: DownloadResolvedFlags) => Promise<void> }).downloadFromDocker =
    vi.fn(async () => {
      throw new Error('some command exited with code 1');
    }) as never;

  await expect(command.run()).rejects.toThrow(
    [
      "Couldn't finish downloading NocoBase.",
      'The CLI hit an unexpected command failure while preparing the download.',
      'Run the same command again with `--verbose` to see the full command logs.',
    ].join('\n'),
  );
});

test('download preserves raw failures in verbose mode', async () => {
  await useTempCwd();
  const { command } = createCommand();
  command.parse = vi.fn(async () => ({
    flags: {
      yes: true,
      verbose: true,
      'no-intro': true,
    },
  })) as never;

  (command as Download & { resolveDownloadFlags: (flags: unknown) => Promise<DownloadResolvedFlags> }).resolveDownloadFlags =
    vi.fn(async () => ({
      source: 'git',
      version: 'alpha',
      replace: false,
      build: true,
      'build-dts': false,
      'output-dir': './repo',
      'git-url': 'https://github.com/nocobase/nocobase.git',
    })) as never;
  (command as Download & { downloadFromGit: (flags: DownloadResolvedFlags) => Promise<string> }).downloadFromGit =
    vi.fn(async () => {
      throw new Error('yarn install exited with code 1');
    }) as never;

  await expect(command.run()).rejects.toThrow('yarn install exited with code 1');
});

test('downloadFromDocker uses the locale-aware default registry when docker-registry is not set', async () => {
  await useTempCwd();
  process.env.NB_LOCALE = 'zh-CN';
  mocks.run.mockResolvedValue(undefined);
  const { command } = createCommand();
  const flags: DownloadResolvedFlags = {
    source: 'docker',
    version: 'alpha',
    replace: false,
    build: true,
    'build-dts': false,
    'docker-save': false,
  };

  await command.downloadFromDocker(flags);

  expect(mocks.run.mock.calls[0]?.[1]).toEqual([
    'pull',
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:alpha',
  ]);
});

test('download resolves otherVersion into the final version value', async () => {
  const { command } = createCommand();
  const resolved = (
    command as Download & {
      mapCatalogResultsToResolved: (
        results: Record<string, string | boolean | number>,
        flags: Record<string, unknown>,
      ) => DownloadResolvedFlags;
    }
  ).mapCatalogResultsToResolved(
    {
      source: 'git',
      version: 'other',
      otherVersion: 'fix/cli-v2',
      build: true,
      buildDts: false,
    },
    {
      build: true,
      'build-dts': false,
      replace: false,
      'dev-dependencies': false,
      'docker-save': false,
    },
  );

  expect(resolved.version).toBe('fix/cli-v2');
});

test('download preserves custom --version values through prompt presets', () => {
  const { command } = createCommand();
  const preset = (
    command as Download & {
      buildPresetValuesFromFlags: (flags: Record<string, unknown>) => Record<string, unknown>;
    }
  ).buildPresetValuesFromFlags({
    version: 'fix/cli-v2',
    build: true,
    'build-dts': false,
    replace: false,
    'dev-dependencies': false,
    'docker-save': false,
  });

  expect(preset.version).toBe('other');
  expect(preset.otherVersion).toBe('fix/cli-v2');
});
