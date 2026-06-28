/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test, vi, expect } from 'vitest';
import Install from '../commands/install.js';
import { resolveConfiguredEnvPath } from '../lib/cli-home.js';
import { findAvailableTcpPort } from '../lib/prompt-validators.js';

const originalExtractClientAssets = process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  printInfo: vi.fn(),
  printWarning: vi.fn(),
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
  runNocoBaseCommand: mocks.runNocoBaseCommand,
}));

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    printInfo: mocks.printInfo,
    printWarning: mocks.printWarning,
  };
});

const tempDirs: string[] = [];

afterEach(async () => {
  mocks.run.mockReset();
  mocks.runNocoBaseCommand.mockReset();
  mocks.printInfo.mockReset();
  mocks.printWarning.mockReset();
  if (originalExtractClientAssets === undefined) {
    delete process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
  } else {
    process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS = originalExtractClientAssets;
  }
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
    dockerContainerExists: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
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
    ['docker', ['rm', '-f', plan.containerName], { errorName: 'docker rm', stdio: 'ignore' }],
    ['docker', plan.args, { errorName: 'docker run', stdio: 'ignore' }],
  ]);
});

test('startBuiltinDb reuses an existing db container without rechecking its published port', async () => {
  const storagePath = await useTempStorageDir();
  const server = await new Promise<net.Server>((resolve, reject) => {
    const listener = net.createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected TCP server address info');
  }
  const dbPort = String(address.port);
  const command = Object.assign(Object.create(Install.prototype), {
    ensureDockerNetwork: vi.fn(async () => undefined),
    dockerContainerExists: vi.fn(async () => true),
  });

  try {
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
        source: 'git',
      },
      dbResults: {
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort,
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
      },
    });

    expect(plan.containerName).toContain('demo-postgres');
    expect(mocks.run.mock.calls.length).toBe(0);
    expect(mocks.printInfo.mock.calls).toEqual([['Using built-in postgres database.'], ['Postgres database ready.']]);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('downloadLocalApp delegates npm/git downloads through nb source download and returns project root', async () => {
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
  expect(appResults.appRootPath).toBe('./downloaded-app');
  expect(runCommand.mock.calls).toEqual([
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--compact-log',
        '--verbose',
        '--source',
        'npm',
        '--version',
        'alpha',
        '--output-dir',
        resolveConfiguredEnvPath('./downloaded-app'),
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
      dbSchema: 'test',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
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
          APP_ENV: 'production',
          NODE_ENV: 'production',
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
          DB_SCHEMA: 'test',
          DB_TABLE_PREFIX: 'nb_',
          DB_UNDERSCORED: 'true',
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
      ['postinstall'],
      {
        cwd: projectRoot,
        env: {
          APP_ENV: 'production',
          NODE_ENV: 'production',
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
          DB_SCHEMA: 'test',
          DB_TABLE_PREFIX: 'nb_',
          DB_UNDERSCORED: 'true',
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
      ['client:extract'],
      {
        cwd: projectRoot,
        env: {
          APP_ENV: 'production',
          NODE_ENV: 'production',
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
          DB_SCHEMA: 'test',
          DB_TABLE_PREFIX: 'nb_',
          DB_UNDERSCORED: 'true',
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
          APP_ENV: 'production',
          NODE_ENV: 'production',
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
          DB_SCHEMA: 'test',
          DB_TABLE_PREFIX: 'nb_',
          DB_UNDERSCORED: 'true',
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
  expect(mocks.runNocoBaseCommand.mock.calls[2]?.[1]?.stdio).toBe('inherit');
  expect(mocks.runNocoBaseCommand.mock.calls[3]?.[1]?.stdio).toBe('inherit');
});

test('startLocalApp warns when client extraction fails but still starts the app', async () => {
  const projectRoot = await useTempStorageDir();
  const storagePath = await useTempStorageDir();
  const command = Object.create(Install.prototype);
  mocks.runNocoBaseCommand
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('extract failed'))
    .mockResolvedValueOnce(undefined);

  await (
    Install.prototype as unknown as {
      startLocalApp: (params: {
        envName: string;
        source: 'npm' | 'git';
        projectRoot: string;
        appResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
      }) => Promise<unknown>;
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

  expect(mocks.printWarning.mock.calls).toEqual([
    [
      'Client assets were not extracted for "demo".\n' +
        'NocoBase will keep starting, but versioned client files for CDN or external distribution may be stale or missing.\n' +
        'Details: extract failed',
    ],
  ]);
  expect(mocks.runNocoBaseCommand.mock.calls[0]?.[0]).toEqual(['pm2', 'kill']);
  expect(mocks.runNocoBaseCommand.mock.calls[1]?.[0]).toEqual(['postinstall']);
  expect(mocks.runNocoBaseCommand.mock.calls[2]?.[0]).toEqual(['client:extract']);
  expect(mocks.runNocoBaseCommand.mock.calls[3]?.[0]).toEqual(['start', '--quickstart', '--daemon']);
});

test('startLocalApp forwards APP_PUBLIC_PATH into the local runtime env when configured', async () => {
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
      }) => Promise<unknown>;
    }
  ).startLocalApp.call(command, {
    envName: 'demo',
    source: 'npm',
    projectRoot,
    appResults: {
      appPort: '14000',
      storagePath,
      appPublicPath: '/console/',
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

  expect(mocks.runNocoBaseCommand.mock.calls[0]?.[1]).toMatchObject({
    env: expect.objectContaining({
      APP_PUBLIC_PATH: '/console/',
    }),
  });
  expect(mocks.runNocoBaseCommand.mock.calls[3]?.[1]).toMatchObject({
    env: expect.objectContaining({
      APP_PUBLIC_PATH: '/console/',
    }),
  });
});

test('installDockerApp removes the existing app container before docker run when --force is enabled', async () => {
  const storagePath = await useTempStorageDir();
  const command = Object.assign(Object.create(Install.prototype), {
    ensureDockerNetwork: vi.fn(async () => undefined),
    dockerContainerExists: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
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
    ['docker', ['rm', '-f', plan.containerName], { errorName: 'docker rm', stdio: 'ignore' }],
    ['docker', plan.args, { errorName: 'docker run', stdio: 'ignore' }],
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

  expect(mocks.run.mock.calls).toEqual([['docker', plan.args, { errorName: 'docker run', stdio: 'inherit' }]]);
});

test('downloadManagedSource delegates docker downloads through nb source download', async () => {
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
      'source:download',
      [
        '-y',
        '--no-intro',
        '--compact-log',
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

test('downloadManagedSource resolves otherVersion before delegating to nb source download', async () => {
  const runCommand = vi.fn(async () => ({
    resolved: {
      source: 'git',
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
      source: 'git',
      version: 'other',
      otherVersion: 'next',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
    },
  });

  expect(runCommand.mock.calls[0]?.[1]).toEqual([
    '-y',
    '--no-intro',
    '--compact-log',
    '--source',
    'git',
    '--version',
    'next',
    '--output-dir',
    resolveConfiguredEnvPath('./local/source/'),
    '--git-url',
    'https://github.com/nocobase/nocobase.git',
  ]);
});
