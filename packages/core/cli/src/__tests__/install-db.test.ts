/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import net from 'node:net';
import path from 'node:path';
import { test, expect } from 'vitest';
import Install from '../commands/install.js';
import { validateAvailableTcpPort } from '../lib/prompt-validators.js';

type InstallStatics = {
  buildBuiltinDbPlan: (params: {
    envName: string;
    workspaceName?: string;
    storagePath: string;
    source?: string;
    dbDialect?: string;
    builtinDbImage?: string;
    dbHost?: string;
    dbPort?: string;
    dbDatabase?: string;
    dbUser?: string;
    dbPassword?: string;
  }) => {
    dbDialect: string;
    dbHost: string;
    dbPort: string;
    dbDatabase: string;
    dbUser: string;
    dbPassword: string;
    builtinDbImage?: string;
    networkName: string;
    containerName: string;
    dataDir: string;
    image: string;
    args: string[];
  };
  buildDockerAppPlan: (params: {
    envName: string;
    workspaceName?: string;
    appResults: Record<string, unknown>;
    downloadResults: Record<string, unknown>;
    dbResults: Record<string, unknown>;
    rootResults: Record<string, unknown>;
    networkName: string;
  }) => {
    source: 'docker';
    networkName: string;
    containerName: string;
    imageRef: string;
    appPort: string;
    storagePath: string;
    appKey: string;
    timeZone: string;
    args: string[];
  };
  buildEnvAddArgv: (params: {
    envName: string;
    appResults: Record<string, unknown>;
    downloadResults: Record<string, unknown>;
    dbResults: Record<string, unknown>;
    envAddResults: Record<string, unknown>;
  }) => string[];
  resolveAvailableDefaultPort: (defaultPort: string) => Promise<string>;
  buildAppPromptInitialValues: (params: {
    envName?: string;
    flags: { 'app-port'?: string; 'app-root-path'?: string; 'storage-path'?: string };
  }) => Promise<Record<string, unknown>>;
  buildDbPromptInitialValues: (params: {
    flags: { 'db-port'?: string };
    downloadResults: Record<string, unknown>;
    dbPreset: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
};

test('builtin postgres db plan uses workspace network and env scoped docker containers', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'demo',
    storagePath: './storage/demo',
    source: 'npm',
    dbDialect: 'postgres',
    dbHost: '127.0.0.1',
    dbPort: '5433',
    dbDatabase: 'demo_db',
    dbUser: 'demo_user',
    dbPassword: 'demo_pass',
  });

  const prefix = `nb-${path.basename(process.cwd()).toLowerCase()}`;
  const containerName = `${prefix}-demo-postgres`;
  expect(plan.networkName).toBe(prefix);
  expect(plan.containerName).toBe(containerName);
  expect(plan.dbHost).toBe('127.0.0.1');
  expect(plan.dbPort).toBe('5433');
  expect(plan.image).toBe('postgres:16');
  expect(plan.builtinDbImage).toBe('postgres:16');
  expect(plan.dataDir).toBe(path.resolve('./storage/demo', 'db', 'postgres'));
  expect(plan.args).toEqual([
    'run',
    '-d',
    '--name',
    containerName,
    '--restart',
    'always',
    '--network',
    prefix,
    '-e',
    'POSTGRES_USER=demo_user',
    '-e',
    'POSTGRES_DB=demo_db',
    '-e',
    'POSTGRES_PASSWORD=demo_pass',
    '-v',
    `${path.resolve('./storage/demo', 'db', 'postgres')}:/var/lib/postgresql/data`,
    '-p',
    '5433:5432',
    'postgres:16',
    'postgres',
    '-c',
    'wal_level=logical',
  ]);
});

test('builtin postgres db plan uses a custom built-in database image when provided', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'demo',
    storagePath: './storage/demo',
    source: 'npm',
    dbDialect: 'postgres',
    builtinDbImage: 'registry.example.com/postgres:16',
  });

  expect(plan.image).toBe('registry.example.com/postgres:16');
  expect(plan.builtinDbImage).toBe('registry.example.com/postgres:16');
  expect(plan.args.includes('registry.example.com/postgres:16')).toBe(true);
});

test('builtin postgres db plan can use the workspace name from config', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'demo',
    workspaceName: 'nb-shared-workspace',
    storagePath: './storage/demo',
    source: 'docker',
    dbDialect: 'postgres',
  });

  expect(plan.networkName).toBe('nb-shared-workspace');
  expect(plan.containerName).toBe('nb-shared-workspace-demo-postgres');
});

test('builtin db plan does not publish host port for docker source and uses container host', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'dockerapp',
    storagePath: './storage/dockerapp',
    source: 'docker',
    dbDialect: 'postgres',
    dbHost: '127.0.0.1',
    dbPort: '5432',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'nocobase',
  });

  expect(plan.dbHost).toBe(`nb-${path.basename(process.cwd()).toLowerCase()}-dockerapp-postgres`);
  expect(plan.args.includes('-p')).toBe(false);
});

test('builtin mysql db plan publishes the selected db port', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'mysqlapp',
    storagePath: './storage/mysqlapp',
    source: 'git',
    dbDialect: 'mysql',
    dbHost: '127.0.0.1',
    dbPort: '3307',
    dbDatabase: 'nb_mysql',
    dbUser: 'nb_user',
    dbPassword: 'nb_pass',
  });

  expect(plan.image).toBe('mysql:8');
  expect(plan.args.includes('-p')).toBe(true);
  expect(plan.args.includes('3307:3306')).toBe(true);
  expect(plan.args.includes('MYSQL_USER=nb_user')).toBe(true);
  expect(plan.args.includes('MYSQL_DATABASE=nb_mysql')).toBe(true);
  expect(plan.args.includes('MYSQL_PASSWORD=nb_pass')).toBe(true);
});

test('builtin kingbase db plan uses the default kingbase image and runtime options', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'kingapp',
    storagePath: './storage/kingapp',
    source: 'git',
    dbDialect: 'kingbase',
    dbHost: '127.0.0.1',
    dbPort: '54321',
    dbDatabase: 'kingbase',
    dbUser: 'nocobase',
    dbPassword: 'nocobase',
  });

  expect(plan.image).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86');
  expect(plan.builtinDbImage).toBe(plan.image);
  expect(plan.args.includes('--platform')).toBe(true);
  expect(plan.args.includes('linux/amd64')).toBe(true);
  expect(plan.args.includes('--privileged')).toBe(true);
  expect(plan.args.includes('ENABLE_CI=no')).toBe(true);
  expect(plan.args.includes('DB_MODE=pg')).toBe(true);
  expect(plan.args.includes('NEED_START=yes')).toBe(true);
  expect(plan.args.includes('54321:54321')).toBe(true);
  expect(plan.args.includes(`${path.resolve('./storage/kingapp', 'db', 'kingbase')}:/home/kingbase/userdata`)).toBe(true);
});

test('docker app plan wires app, db, network, port, and image settings', () => {
  const installStatics = Install as unknown as InstallStatics;
  const prefix = `nb-${path.basename(process.cwd()).toLowerCase()}`;
  const plan = installStatics.buildDockerAppPlan({
    envName: 'demo',
    networkName: prefix,
    appResults: {
      appPort: '13000',
      storagePath: './storage/demo',
      lang: 'zh-CN',
    },
    downloadResults: {
      source: 'docker',
      version: 'develop',
      dockerRegistry: 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
    },
    dbResults: {
      dbDialect: 'postgres',
      dbHost: `${prefix}-demo-postgres`,
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

  expect(plan.source).toBe('docker');
  expect(plan.networkName).toBe(prefix);
  expect(plan.containerName).toBe(`${prefix}-demo-app`);
  expect(plan.imageRef).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:develop');
  expect(plan.appPort).toBe('13000');
  expect(plan.storagePath).toBe(path.resolve('./storage/demo'));
  expect(plan.appKey.length).toBe(64);
  expect(typeof plan.timeZone).toBe('string');
  expect(plan.timeZone.length > 0).toBe(true);
  expect(plan.args.includes('--platform')).toBe(false);
  expect(plan.args.includes('--network')).toBe(true);
  expect(plan.args.includes(prefix)).toBe(true);
  expect(plan.args.includes('13000:80')).toBe(true);
  expect(plan.args.includes('--port')).toBe(false);
  expect(plan.args.includes('INIT_APP_LANG=zh-CN')).toBe(true);
  expect(plan.args.includes('INIT_ROOT_USERNAME=nocobase')).toBe(true);
  expect(plan.args.includes('INIT_ROOT_EMAIL=admin@nocobase.com')).toBe(true);
  expect(plan.args.includes('INIT_ROOT_PASSWORD=admin123')).toBe(true);
  expect(plan.args.includes('INIT_ROOT_NICKNAME=Super Admin')).toBe(true);
  expect(plan.args.includes(`APP_KEY=${plan.appKey}`)).toBe(true);
  expect(plan.args.includes(`TZ=${plan.timeZone}`)).toBe(true);
  expect(plan.args.includes('DB_DIALECT=postgres')).toBe(true);
  expect(plan.args.includes(`DB_HOST=${prefix}-demo-postgres`)).toBe(true);
  expect(plan.args.includes('DB_PORT=5432')).toBe(true);
  expect(plan.args.includes('DB_DATABASE=nocobase')).toBe(true);
  expect(plan.args.includes('DB_USER=nocobase')).toBe(true);
  expect(plan.args.includes('DB_PASSWORD=nocobase')).toBe(true);
});

test('install env add argv forwards endpoint, auth, app, storage, and db settings', () => {
  const installStatics = Install as unknown as InstallStatics;
  const argv = installStatics.buildEnvAddArgv({
    envName: 'demo',
    appResults: {
      appRootPath: './apps/demo',
      appPort: '13080',
      appKey: 'app-key-123',
      timeZone: 'Asia/Shanghai',
      storagePath: './storage/demo',
    },
    downloadResults: {
      source: 'git',
      version: 'alpha',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      npmRegistry: 'https://registry.npmmirror.com',
      build: false,
      buildDts: false,
    },
    dbResults: {
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: 'demo-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'token',
      accessToken: 'token-123',
    },
  });

  expect(argv).toEqual([
    'demo',
    '--no-intro',
    '--scope',
    'project',
    '--api-base-url',
    'http://127.0.0.1:13080/api',
    '--auth-type',
    'token',
    '--app-port',
    '13080',
    '--storage-path',
    './storage/demo',
    '--source',
    'git',
    '--download-version',
    'alpha',
    '--git-url',
    'https://github.com/nocobase/nocobase.git',
    '--npm-registry',
    'https://registry.npmmirror.com',
    '--no-build',
    '--no-build-dts',
    '--app-root-path',
    './apps/demo',
    '--app-key',
    'app-key-123',
    '--timezone',
    'Asia/Shanghai',
    '--builtin-db',
    '--db-dialect',
    'postgres',
    '--builtin-db-image',
    'registry.example.com/postgres:16',
    '--db-host',
    'demo-postgres',
    '--db-port',
    '5432',
    '--db-database',
    'nocobase',
    '--db-user',
    'nocobase',
    '--db-password',
    'secret',
    '--access-token',
    'token-123',
  ]);
});

test('install env add argv records when an env uses an external database', () => {
  const installStatics = Install as unknown as InstallStatics;
  const argv = installStatics.buildEnvAddArgv({
    envName: 'external',
    appResults: {
      appPort: '13081',
      storagePath: './storage/external',
    },
    downloadResults: {},
    dbResults: {
      builtinDb: false,
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13081/api',
      authType: 'oauth',
    },
  });

  expect(argv.includes('--no-builtin-db')).toBe(true);
  expect(argv.includes('--no-intro')).toBe(true);
  expect(argv.includes('--builtin-db')).toBe(false);
});

test('install env add argv records docker download settings for later upgrades', () => {
  const installStatics = Install as unknown as InstallStatics;
  const argv = installStatics.buildEnvAddArgv({
    envName: 'docker-demo',
    appResults: {
      appPort: '13082',
      appKey: 'app-key-456',
      timeZone: 'Asia/Shanghai',
      storagePath: './storage/docker-demo',
    },
    downloadResults: {
      source: 'docker',
      version: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/amd64',
    },
    dbResults: {
      builtinDb: true,
      dbDialect: 'postgres',
      dbHost: 'nb-demo-docker-demo-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13082/api',
      authType: 'oauth',
    },
  });

  expect(argv.includes('--source')).toBe(true);
  expect(argv.includes('docker')).toBe(true);
  expect(argv.includes('--download-version')).toBe(true);
  expect(argv.includes('alpha')).toBe(true);
  expect(argv.includes('--docker-registry')).toBe(true);
  expect(argv.includes('nocobase/nocobase')).toBe(true);
  expect(argv.includes('--docker-platform')).toBe(true);
  expect(argv.includes('linux/amd64')).toBe(true);
});

test('install resolves an available app port default when the preferred port is busy', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const server = net.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  expect(address && typeof address === 'object').toBeTruthy();

  const busyPort = String(address.port);

  try {
    const appPort = await installStatics.resolveAvailableDefaultPort(busyPort);
    expect(appPort).not.toBe(busyPort);
    expect(await validateAvailableTcpPort(appPort)).toBe(undefined);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test('install seeds app port initial values unless the user provided --app-port', async () => {
  const installStatics = Install as unknown as InstallStatics;

  const initialValues = await installStatics.buildAppPromptInitialValues({
    envName: 'demo',
    flags: {},
  });
  expect(initialValues.appRootPath).toBe('./demo/source/');
  expect(initialValues.storagePath).toBe('./demo/storage/');
  expect(typeof initialValues.appPort).toBe('string');
  expect(await validateAvailableTcpPort(String(initialValues.appPort))).toBe(undefined);
  expect(await installStatics.buildAppPromptInitialValues({
    envName: 'demo',
    flags: { 'app-port': '14000', 'app-root-path': './custom/source/', 'storage-path': './custom/storage/' },
  })).toEqual({});
});

test('install seeds built-in database host port for npm/git sources when the default port is busy', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const server = net.createServer();
  let serverStarted = false;

  await new Promise<void>((resolve) => {
    server.once('error', () => resolve());
    server.listen(54321, '127.0.0.1', () => {
      serverStarted = true;
      resolve();
    });
  });

  try {
    const initialValues = await installStatics.buildDbPromptInitialValues({
      flags: {},
      downloadResults: {
        source: 'git',
      },
      dbPreset: {
        builtinDb: true,
        dbDialect: 'kingbase',
      },
    });
    expect(initialValues.dbPort).not.toBe('54321');
    expect(await validateAvailableTcpPort(String(initialValues.dbPort))).toBe(undefined);
  } finally {
    if (serverStarted) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  }
});

test('install does not seed built-in database host port for docker source or explicit --db-port', async () => {
  const installStatics = Install as unknown as InstallStatics;

  expect(await installStatics.buildDbPromptInitialValues({
      flags: {},
      downloadResults: {
        source: 'docker',
      },
      dbPreset: {
        builtinDb: true,
        dbDialect: 'postgres',
      },
    })).toEqual({});
  expect(await installStatics.buildDbPromptInitialValues({
      flags: {
        'db-port': '15432',
      },
      downloadResults: {
        source: 'npm',
      },
      dbPreset: {
        builtinDb: true,
        dbDialect: 'postgres',
      },
    })).toEqual({});
});
