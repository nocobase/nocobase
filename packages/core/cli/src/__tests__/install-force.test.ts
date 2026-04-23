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

  assert.deepEqual(mocks.run.mock.calls, [
    [
      'docker',
      ['rm', '-f', plan.containerName],
      { errorName: 'docker rm' },
    ],
    [
      'docker',
      plan.args,
      { errorName: 'docker run' },
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
  });

  assert.equal(resolvedProjectRoot, projectRoot);
  assert.equal(appResults.appRootPath, projectRoot);
  assert.deepEqual(runCommand.mock.calls, [
    [
      'download',
      [
        '-y',
        '--no-intro',
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
      rootEmail: 'admin@example.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
  });

  assert.deepEqual(mocks.runNocoBaseCommand.mock.calls, [
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
          INIT_ROOT_EMAIL: 'admin@example.com',
          INIT_ROOT_PASSWORD: 'admin123',
          INIT_ROOT_NICKNAME: 'Super Admin',
        },
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
          INIT_ROOT_EMAIL: 'admin@example.com',
          INIT_ROOT_PASSWORD: 'admin123',
          INIT_ROOT_NICKNAME: 'Super Admin',
        },
      },
    ],
  ]);
  assert.equal(plan.source, 'npm');
  assert.equal(plan.projectRoot, projectRoot);
  assert.equal(plan.appPort, '14000');
  assert.equal(plan.storagePath, storagePath);
  assert.equal(plan.appKey.length, 64);
  assert.equal(plan.timeZone.length > 0, true);
  assert.deepEqual(plan.args, ['start', '--quickstart', '--daemon']);
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
      rootEmail: 'admin@example.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
    force: true,
  });

  assert.deepEqual(mocks.run.mock.calls, [
    [
      'docker',
      ['rm', '-f', plan.containerName],
      { errorName: 'docker rm' },
    ],
    [
      'docker',
      plan.args,
      { errorName: 'docker run' },
    ],
  ]);
});
