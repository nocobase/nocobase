/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import net from 'node:net';
import path from 'node:path';
import { test } from 'vitest';
import Install from '../commands/install.js';
import { validateAvailableTcpPort } from '../lib/prompt-validators.js';

type InstallStatics = {
  buildBuiltinDbPlan: (params: {
    envName: string;
    workspaceName?: string;
    storagePath: string;
    source?: string;
    dbDialect?: string;
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
  assert.equal(plan.networkName, prefix);
  assert.equal(plan.containerName, containerName);
  assert.equal(plan.dbHost, '127.0.0.1');
  assert.equal(plan.dbPort, '5433');
  assert.equal(plan.image, 'postgres:16');
  assert.equal(
    plan.dataDir,
    path.resolve('./storage/demo', 'db', 'postgres'),
  );
  assert.deepEqual(plan.args, [
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

test('builtin postgres db plan can use the workspace name from config', () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = installStatics.buildBuiltinDbPlan({
    envName: 'demo',
    workspaceName: 'nb-shared-workspace',
    storagePath: './storage/demo',
    source: 'docker',
    dbDialect: 'postgres',
  });

  assert.equal(plan.networkName, 'nb-shared-workspace');
  assert.equal(plan.containerName, 'nb-shared-workspace-demo-postgres');
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

  assert.equal(
    plan.dbHost,
    `nb-${path.basename(process.cwd()).toLowerCase()}-dockerapp-postgres`,
  );
  assert.equal(plan.args.includes('-p'), false);
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

  assert.equal(plan.image, 'mysql:8');
  assert.equal(plan.args.includes('-p'), true);
  assert.equal(plan.args.includes('3307:3306'), true);
  assert.equal(plan.args.includes('MYSQL_USER=nb_user'), true);
  assert.equal(plan.args.includes('MYSQL_DATABASE=nb_mysql'), true);
  assert.equal(plan.args.includes('MYSQL_PASSWORD=nb_pass'), true);
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
      rootEmail: 'admin@example.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
  });

  assert.equal(plan.source, 'docker');
  assert.equal(plan.networkName, prefix);
  assert.equal(plan.containerName, `${prefix}-demo-app`);
  assert.equal(plan.imageRef, 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:develop');
  assert.equal(plan.appPort, '13000');
  assert.equal(plan.storagePath, path.resolve('./storage/demo'));
  assert.equal(plan.appKey.length, 64);
  assert.equal(typeof plan.timeZone, 'string');
  assert.equal(plan.timeZone.length > 0, true);
  assert.equal(plan.args.includes('--platform'), false);
  assert.equal(plan.args.includes('--network'), true);
  assert.equal(plan.args.includes(prefix), true);
  assert.equal(plan.args.includes('13000:80'), true);
  assert.equal(plan.args.includes('--port'), false);
  assert.equal(plan.args.includes('INIT_APP_LANG=zh-CN'), true);
  assert.equal(plan.args.includes('INIT_ROOT_USERNAME=nocobase'), true);
  assert.equal(plan.args.includes('INIT_ROOT_EMAIL=admin@example.com'), true);
  assert.equal(plan.args.includes('INIT_ROOT_PASSWORD=admin123'), true);
  assert.equal(plan.args.includes('INIT_ROOT_NICKNAME=Super Admin'), true);
  assert.equal(plan.args.includes(`APP_KEY=${plan.appKey}`), true);
  assert.equal(plan.args.includes(`TZ=${plan.timeZone}`), true);
  assert.equal(plan.args.includes('DB_DIALECT=postgres'), true);
  assert.equal(plan.args.includes(`DB_HOST=${prefix}-demo-postgres`), true);
  assert.equal(plan.args.includes('DB_PORT=5432'), true);
  assert.equal(plan.args.includes('DB_DATABASE=nocobase'), true);
  assert.equal(plan.args.includes('DB_USER=nocobase'), true);
  assert.equal(plan.args.includes('DB_PASSWORD=nocobase'), true);
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

  assert.deepEqual(argv, [
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

  assert.equal(argv.includes('--no-builtin-db'), true);
  assert.equal(argv.includes('--no-intro'), true);
  assert.equal(argv.includes('--builtin-db'), false);
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

  assert.equal(argv.includes('--source'), true);
  assert.equal(argv.includes('docker'), true);
  assert.equal(argv.includes('--download-version'), true);
  assert.equal(argv.includes('alpha'), true);
  assert.equal(argv.includes('--docker-registry'), true);
  assert.equal(argv.includes('nocobase/nocobase'), true);
  assert.equal(argv.includes('--docker-platform'), true);
  assert.equal(argv.includes('linux/amd64'), true);
});

test('install resolves an available app port default when the preferred port is busy', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const server = net.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const busyPort = String(address.port);

  try {
    const appPort = await installStatics.resolveAvailableDefaultPort(busyPort);
    assert.notEqual(appPort, busyPort);
    assert.equal(await validateAvailableTcpPort(appPort), undefined);
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
  assert.equal(initialValues.appRootPath, './demo/source/');
  assert.equal(initialValues.storagePath, './demo/storage/');
  assert.equal(typeof initialValues.appPort, 'string');
  assert.equal(await validateAvailableTcpPort(String(initialValues.appPort)), undefined);
  assert.deepEqual(await installStatics.buildAppPromptInitialValues({
    envName: 'demo',
    flags: { 'app-port': '14000', 'app-root-path': './custom/source/', 'storage-path': './custom/storage/' },
  }), {});
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
    assert.notEqual(initialValues.dbPort, '54321');
    assert.equal(await validateAvailableTcpPort(String(initialValues.dbPort)), undefined);
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

  assert.deepEqual(
    await installStatics.buildDbPromptInitialValues({
      flags: {},
      downloadResults: {
        source: 'docker',
      },
      dbPreset: {
        builtinDb: true,
        dbDialect: 'postgres',
      },
    }),
    {},
  );
  assert.deepEqual(
    await installStatics.buildDbPromptInitialValues({
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
    }),
    {},
  );
});
