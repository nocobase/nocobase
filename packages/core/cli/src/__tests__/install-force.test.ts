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
import { afterEach, test, vi, expect } from 'vitest';
import Install from '../commands/install.js';
import { findAvailableTcpPort } from '../lib/prompt-validators.js';

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  promptInfo: vi.fn(),
  promptStep: vi.fn(),
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
  runNocoBaseCommand: mocks.runNocoBaseCommand,
}));

vi.mock('@clack/prompts', () => ({
  log: {
    info: mocks.promptInfo,
    step: mocks.promptStep,
    warn: vi.fn(),
  },
  outro: vi.fn(),
  cancel: vi.fn(),
}));

const tempDirs: string[] = [];

afterEach(async () => {
  mocks.run.mockReset();
  mocks.runNocoBaseCommand.mockReset();
  mocks.promptInfo.mockReset();
  mocks.promptStep.mockReset();
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

async function useTempStorageDir(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-install-force-'));
  tempDirs.push(dir);
  return dir;
}

test('startBuiltinDb removes the existing db container before docker run when --force is enabled', async () => {
  const storagePath = await useTempStorageDir();
  const dbPort = await findAvailableTcpPort();
  const command = Object.assign(Object.create(Install.prototype), {
    ensureDockerNetwork: vi.fn(async () => undefined),
    dockerContainerExists: vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false),
  });

  const plan = await (
    Install.prototype as unknown as {
      startBuiltinDb: (params: {
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        force?: boolean;
      }) => Promise<{ containerName: string; args: string[] }>;
    }
  ).startBuiltinDb.call(command, {
    envName: 'demo',
    appResults: {
      storagePath,
    },
    downloadResults: {
      source: 'npm',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort,
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
    },
    force: true,
  });

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['rm', '-f', plan.containerName],
      { errorName: 'docker rm', stdio: 'ignore' },
    ],
    [
      'docker',
      plan.args,
      { errorName: 'docker run', stdio: 'ignore' },
    ],
  ]);
});

test('downloadLocalApp delegates npm/git downloads through nb download and returns project root', async () => {
  const projectRoot = await useTempStorageDir();
  const runCommand = vi.fn(async () => ({
    projectRoot,
    resolved: {
      source: 'npm',
    },
  }));
  const command = Object.assign(Object.create(Install.prototype), {
    config: {
      runCommand,
    },
  });
  const appResults: Record<string, unknown> = {
    appRootPath: './fallback-app',
  };

  const resolvedProjectRoot = await (
    Install.prototype as unknown as {
      downloadLocalApp: (params: {
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        verbose?: boolean;
      }) => Promise<string>;
    }
  ).downloadLocalApp.call(command, {
    appResults,
    downloadResults: {
      source: 'npm',
      version: 'alpha',
      outputDir: './downloaded-app',
      npmRegistry: 'https://registry.npmmirror.com',
      replace: true,
      devDependencies: true,
      build: false,
    },
    verbose: true,
  });

  expect(resolvedProjectRoot).toBe(projectRoot);
  expect(appResults.appRootPath).toBe(projectRoot);
  expect(runCommand.mock.calls).toEqual([
    [
      'download',
      [
        '-y',
        '--no-intro',
        '--verbose',
        '--source',
        'npm',
        '--version',
        'alpha',
        '--output-dir',
        './downloaded-app',
        '--npm-registry',
        'https://registry.npmmirror.com',
        '--replace',
        '--dev-dependencies',
        '--no-build',
      ],
    ],
  ]);
});

test('startLocalApp starts npm/git apps with quickstart daemon mode and install env vars', async () => {
  const projectRoot = await useTempStorageDir();
  const storagePath = await useTempStorageDir();
  const command = Object.create(Install.prototype);
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);

  const plan = await (
    Install.prototype as unknown as {
      startLocalApp: (params: {
        envName: string;
        source: 'npm' | 'git';
        projectRoot: string;
        appResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
      }) => Promise<{
        source: 'npm' | 'git';
        projectRoot: string;
        appPort: string;
        storagePath: string;
        appKey: string;
        timeZone: string;
        env: Record<string, string>;
        args: string[];
      }>;
    }
  ).startLocalApp.call(command, {
    envName: 'demo',
    source: 'npm',
    projectRoot,
    appResults: {
      appPort: '14000',
      storagePath,
      lang: 'en-US',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
    },
    rootResults: {
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
  });

  expect(mocks.runNocoBaseCommand.mock.calls).toEqual([
    [
      ['pm2', 'kill'],
      {
        cwd: projectRoot,
        env: {
          STORAGE_PATH: storagePath,
          APP_PORT: '14000',
          APP_KEY: plan.appKey,
          TZ: plan.timeZone,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'nocobase',
          INIT_APP_LANG: 'en-US',
          INIT_ROOT_USERNAME: 'nocobase',
          INIT_ROOT_EMAIL: 'admin@nocobase.com',
          INIT_ROOT_PASSWORD: 'admin123',
          INIT_ROOT_NICKNAME: 'Super Admin',
        },
        stdio: 'ignore',
      },
    ],
    [
      ['start', '--quickstart', '--daemon'],
      {
        cwd: projectRoot,
        env: {
          STORAGE_PATH: storagePath,
          APP_PORT: '14000',
          APP_KEY: plan.appKey,
          TZ: plan.timeZone,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'nocobase',
          INIT_APP_LANG: 'en-US',
          INIT_ROOT_USERNAME: 'nocobase',
          INIT_ROOT_EMAIL: 'admin@nocobase.com',
          INIT_ROOT_PASSWORD: 'admin123',
          INIT_ROOT_NICKNAME: 'Super Admin',
        },
        stdio: 'ignore',
      },
    ],
  ]);
  expect(plan.source).toBe('npm');
  expect(plan.projectRoot).toBe(projectRoot);
  expect(plan.appPort).toBe('14000');
  expect(plan.storagePath).toBe(storagePath);
  expect(plan.appKey.length).toBe(64);
  expect(plan.timeZone.length > 0).toBe(true);
  expect(plan.args).toEqual(['start', '--quickstart', '--daemon']);
});

test('startLocalApp forwards stdio inherit in verbose mode', async () => {
  const projectRoot = await useTempStorageDir();
  const storagePath = await useTempStorageDir();
  const command = Object.create(Install.prototype);
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);

  await (
    Install.prototype as unknown as {
      startLocalApp: (params: {
        envName: string;
        source: 'npm' | 'git';
        projectRoot: string;
        appResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
        commandStdio?: 'inherit' | 'ignore';
      }) => Promise<unknown>;
    }
  ).startLocalApp.call(command, {
    envName: 'demo',
    source: 'git',
    projectRoot,
    appResults: {
      appPort: '14000',
      storagePath,
      lang: 'en-US',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
    },
    rootResults: {
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
    commandStdio: 'inherit',
  });

  expect(mocks.runNocoBaseCommand.mock.calls[0]?.[1]?.stdio).toBe('inherit');
  expect(mocks.runNocoBaseCommand.mock.calls[1]?.[1]?.stdio).toBe('inherit');
});

test('installDockerApp removes the existing app container before docker run when --force is enabled', async () => {
  const storagePath = await useTempStorageDir();
  const command = Object.assign(Object.create(Install.prototype), {
    ensureDockerNetwork: vi.fn(async () => undefined),
    dockerContainerExists: vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false),
  });

  const plan = await (
    Install.prototype as unknown as {
      installDockerApp: (params: {
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
        builtinDbPlan?: { networkName: string };
        force?: boolean;
      }) => Promise<{ containerName: string; args: string[] }>;
    }
  ).installDockerApp.call(command, {
    envName: 'demo',
    appResults: {
      appPort: '13000',
      storagePath,
      lang: 'en-US',
    },
    downloadResults: {
      source: 'docker',
      version: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: 'demo-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
    },
    rootResults: {
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
    force: true,
  });

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['rm', '-f', plan.containerName],
      { errorName: 'docker rm', stdio: 'ignore' },
    ],
    [
      'docker',
      plan.args,
      { errorName: 'docker run', stdio: 'ignore' },
    ],
  ]);
});

test('startBuiltinDb forwards command stdio to docker run', async () => {
  const storagePath = await useTempStorageDir();
  const dbPort = await findAvailableTcpPort();
  const command = Object.assign(Object.create(Install.prototype), {
    ensureDockerNetwork: vi.fn(async () => undefined),
    dockerContainerExists: vi.fn().mockResolvedValue(false),
  });

  const plan = await (
    Install.prototype as unknown as {
      startBuiltinDb: (params: {
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        force?: boolean;
        commandStdio?: 'inherit' | 'ignore';
      }) => Promise<{ containerName: string; args: string[] }>;
    }
  ).startBuiltinDb.call(command, {
    envName: 'demo',
    appResults: {
      storagePath,
    },
    downloadResults: {
      source: 'npm',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort,
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
    },
    commandStdio: 'inherit',
  });

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      plan.args,
      { errorName: 'docker run', stdio: 'inherit' },
    ],
  ]);
});

test('downloadManagedSource delegates docker downloads through nb download', async () => {
  const runCommand = vi.fn(async () => ({
    resolved: {
      source: 'docker',
    },
  }));
  const command = Object.assign(Object.create(Install.prototype), {
    config: {
      runCommand,
    },
  });

  await (
    Install.prototype as unknown as {
      downloadManagedSource: (params: {
        downloadResults: Record<string, unknown>;
        verbose?: boolean;
      }) => Promise<unknown>;
    }
  ).downloadManagedSource.call(command, {
    downloadResults: {
      source: 'docker',
      version: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/arm64',
      replace: true,
    },
    verbose: true,
  });

  expect(runCommand.mock.calls).toEqual([
    [
      'download',
      [
        '-y',
        '--no-intro',
        '--verbose',
        '--source',
        'docker',
        '--version',
        'alpha',
        '--docker-registry',
        'nocobase/nocobase',
        '--docker-platform',
        'linux/arm64',
        '--replace',
      ],
    ],
  ]);
});
