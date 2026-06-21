/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import net from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test, expect, vi } from 'vitest';
import Install from '../commands/install.js';
import EnvAdd from '../commands/env/add.js';
import { deleteCliConfigValue } from '../lib/cli-config.js';
import { resolveCliHomeRoot, resolveEnvRelativePath } from '../lib/cli-home.js';
import { ENV_CONFIG_SCHEMA_VERSION } from '../lib/env-config.js';

const originalNbLocale = process.env.NB_LOCALE;
const originalExtractClientAssets = process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;

beforeEach(async () => {
  process.env.NB_LOCALE = 'en-US';
  delete process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
  await deleteCliConfigValue('default-api-host');
});

afterEach(async () => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
  } else {
    process.env.NB_LOCALE = originalNbLocale;
  }
  if (originalExtractClientAssets === undefined) {
    delete process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
  } else {
    process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS = originalExtractClientAssets;
  }
  await deleteCliConfigValue('default-api-host');
});

type InstallStatics = {
  buildDockerAppPlan: (params: {
    envName: string;
    workspaceName?: string;
    appResults: Record<string, unknown>;
    downloadResults: Record<string, unknown>;
    dbResults: Record<string, unknown>;
    rootResults: Record<string, unknown>;
    networkName: string;
  }) => Promise<{
    source: 'docker';
    networkName: string;
    containerName: string;
    imageRef: string;
    appPort: string;
    storagePath: string;
    envFile?: string;
    appKey: string;
    timeZone: string;
    args: string[];
  }>;
  buildSavedEnvConfig: (
    params: {
      envName: string;
      appResults: Record<string, unknown>;
      downloadResults: Record<string, unknown>;
      dbResults: Record<string, unknown>;
      rootResults: Record<string, unknown>;
      envAddResults: Record<string, unknown>;
    },
    options?: { defaultApiHost?: string },
  ) => Record<string, unknown>;
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
  const plan = Install.buildBuiltinDbPlan({
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

  const networkName = 'nocobase';
  const containerPrefix = 'nb';
  const containerName = `${containerPrefix}-demo-postgres`;
  expect(plan.networkName).toBe(networkName);
  expect(plan.containerName).toBe(containerName);
  expect(plan.dbHost).toBe('127.0.0.1');
  expect(plan.dbPort).toBe('5433');
  expect(plan.image).toBe('postgres:16');
  expect(plan.builtinDbImage).toBe('postgres:16');
  expect(plan.dataDir).toBe(path.resolve(resolveCliHomeRoot(), './storage/demo', 'db', 'postgres'));
  expect(plan.args).toEqual([
    'run',
    '-d',
    '--name',
    containerName,
    '--restart',
    'always',
    '--network',
    networkName,
    '-e',
    'POSTGRES_USER=demo_user',
    '-e',
    'POSTGRES_DB=demo_db',
    '-e',
    'POSTGRES_PASSWORD=demo_pass',
    '-v',
    `${path.resolve(resolveCliHomeRoot(), './storage/demo', 'db', 'postgres')}:/var/lib/postgresql/data`,
    '-p',
    '5433:5432',
    'postgres:16',
    'postgres',
    '-c',
    'wal_level=logical',
  ]);
});

test('install reuses env add prompts without online apiBaseUrl validation', async () => {
  const command = Object.create(Install.prototype) as Install & {
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };

  vi.spyOn(command as any, 'resolveResumePresetValues').mockResolvedValue(undefined);

  const runPromptCatalogMock = vi
    .fn()
    .mockResolvedValueOnce({ env: 'app7593' })
    .mockResolvedValueOnce({
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      dbDialect: 'postgres',
      builtinDb: true,
    })
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'nocobase',
      rootNickname: 'NocoBase',
    })
    .mockResolvedValueOnce({
      name: 'app7593',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
    });

  const promptCatalogModule = await import('../lib/prompt-catalog.js');
  const runPromptCatalogSpy = vi
    .spyOn(promptCatalogModule, 'runPromptCatalog')
    .mockImplementation(runPromptCatalogMock as any);

  const parsed = {
    resume: false,
  } as any;

  try {
    await (Install.prototype as any).collectPromptResults.call(command, parsed, true);
  } finally {
    runPromptCatalogSpy.mockRestore();
  }

  const envAddCatalog = runPromptCatalogMock.mock.calls[5]?.[0];
  expect(envAddCatalog.apiBaseUrl).toBeDefined();
  expect(envAddCatalog.apiBaseUrl).not.toBe(EnvAdd.prompts.apiBaseUrl);
  expect(envAddCatalog.apiBaseUrl.validate).toBe(undefined);
});

test('install uses configured default-api-host for the connection step apiBaseUrl default', async () => {
  const command = Object.create(Install.prototype) as Install & {
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };
  const previousCliRoot = process.env.NB_CLI_ROOT;
  const tempCliRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-install-db-config-'));

  vi.spyOn(command as any, 'resolveResumePresetValues').mockResolvedValue(undefined);

  try {
    process.env.NB_CLI_ROOT = tempCliRoot;

    const { setCliConfigValue } = await import('../lib/cli-config.js');
    await setCliConfigValue('default-api-host', '192.168.1.10');

    const runPromptCatalogMock = vi
      .fn()
      .mockResolvedValueOnce({ env: 'app7593' })
      .mockResolvedValueOnce({
        appRootPath: './app7593/source/',
        appPort: '13000',
        storagePath: './app7593/storage/',
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        dbDialect: 'postgres',
        builtinDb: true,
      })
      .mockResolvedValueOnce({
        rootUsername: 'nocobase',
        rootEmail: 'admin@nocobase.com',
        rootPassword: 'nocobase',
        rootNickname: 'NocoBase',
      })
      .mockResolvedValueOnce({
        name: 'app7593',
        apiBaseUrl: 'http://192.168.1.10:13000/api',
        authType: 'oauth',
      });

    const promptCatalogModule = await import('../lib/prompt-catalog.js');
    const runPromptCatalogSpy = vi
      .spyOn(promptCatalogModule, 'runPromptCatalog')
      .mockImplementation(runPromptCatalogMock as any);

    try {
      await (Install.prototype as any).collectPromptResults.call(command, { resume: false }, true);
    } finally {
      runPromptCatalogSpy.mockRestore();
      await deleteCliConfigValue('default-api-host');
    }

    const envAddOptions = runPromptCatalogMock.mock.calls[5]?.[1];
    expect(envAddOptions.initialValues.apiBaseUrl).toBe('http://192.168.1.10:13000/api');
  } finally {
    if (previousCliRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousCliRoot;
    }
    await rm(tempCliRoot, { recursive: true, force: true });
  }
});

test('install hides the deferred accessToken prompt when --skip-auth is used with token auth', async () => {
  const command = Object.create(Install.prototype) as Install & {
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };

  vi.spyOn(command as any, 'resolveResumePresetValues').mockResolvedValue(undefined);

  const runPromptCatalogMock = vi
    .fn()
    .mockResolvedValueOnce({ env: 'app7593' })
    .mockResolvedValueOnce({
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      dbDialect: 'postgres',
      builtinDb: true,
    })
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'nocobase',
      rootNickname: 'NocoBase',
    })
    .mockResolvedValueOnce({
      name: 'app7593',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'token',
    });

  const promptCatalogModule = await import('../lib/prompt-catalog.js');
  const runPromptCatalogSpy = vi
    .spyOn(promptCatalogModule, 'runPromptCatalog')
    .mockImplementation(runPromptCatalogMock as any);

  const parsed = {
    resume: false,
    'skip-auth': true,
    'auth-type': 'token',
  } as any;

  try {
    await (Install.prototype as any).collectPromptResults.call(command, parsed, true);
  } finally {
    runPromptCatalogSpy.mockRestore();
  }

  const envAddCatalog = runPromptCatalogMock.mock.calls[5]?.[0];
  expect(envAddCatalog.accessToken).toBeDefined();
  expect(envAddCatalog.accessToken.hidden?.({ authType: 'token' })).toBe(true);
});

test('install keeps optional database prompt results for schema, table prefix, and underscored mode', async () => {
  const command = Object.create(Install.prototype) as Install & {
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };

  vi.spyOn(
    command as { resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues },
    'resolveResumePresetValues',
  ).mockResolvedValue(undefined);

  const runPromptCatalogMock = vi
    .fn()
    .mockResolvedValueOnce({ env: 'app7593' })
    .mockResolvedValueOnce({
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      dbDialect: 'postgres',
      builtinDb: false,
      dbHost: 'db.example.com',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      dbSchema: 'custom',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    })
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'nocobase',
      rootNickname: 'NocoBase',
    })
    .mockResolvedValueOnce({
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
    });

  const promptCatalogModule = await import('../lib/prompt-catalog.js');
  const runPromptCatalogSpy = vi
    .spyOn(promptCatalogModule, 'runPromptCatalog')
    .mockImplementation(runPromptCatalogMock as never);

  try {
    const result = await (
      Install.prototype as unknown as {
        collectPromptResults: (
          parsed: Record<string, unknown>,
          yes: boolean,
        ) => Promise<{
          dbResults: Record<string, unknown>;
        }>;
      }
    ).collectPromptResults.call(
      command,
      {
        resume: false,
      },
      false,
    );

    expect(result.dbResults).toMatchObject({
      dbSchema: 'custom',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    });
  } finally {
    runPromptCatalogSpy.mockRestore();
  }
});

test('install lets prompted optional database values override saved resume presets', async () => {
  const command = Object.create(Install.prototype) as Install & {
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };

  vi.spyOn(
    command as { resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues },
    'resolveResumePresetValues',
  ).mockResolvedValue({
    dbPreset: {
      dbSchema: 'saved_schema',
      dbTablePrefix: 'saved_',
      dbUnderscored: false,
    },
  });

  const runPromptCatalogMock = vi
    .fn()
    .mockResolvedValueOnce({ env: 'app7593' })
    .mockResolvedValueOnce({
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      dbDialect: 'postgres',
      builtinDb: false,
      dbHost: 'db.example.com',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      dbSchema: 'custom',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    })
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'nocobase',
      rootNickname: 'NocoBase',
    })
    .mockResolvedValueOnce({
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
    });

  const promptCatalogModule = await import('../lib/prompt-catalog.js');
  const runPromptCatalogSpy = vi
    .spyOn(promptCatalogModule, 'runPromptCatalog')
    .mockImplementation(runPromptCatalogMock as never);

  try {
    const result = await (
      Install.prototype as unknown as {
        collectPromptResults: (
          parsed: Record<string, unknown>,
          yes: boolean,
        ) => Promise<{
          dbResults: Record<string, unknown>;
        }>;
      }
    ).collectPromptResults.call(
      command,
      {
        resume: true,
      },
      false,
    );

    expect(result.dbResults).toMatchObject({
      dbSchema: 'custom',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    });
  } finally {
    runPromptCatalogSpy.mockRestore();
  }
});

test('install preserves forwarded dbUnderscored flags when invoked through nb init in the same process', async () => {
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--ui'];

  const command = Object.assign(Object.create(Install.prototype), {
    argv: ['-y', '--env', 'app7593', '--no-builtin-db', '--db-underscored'],
  }) as Install & {
    argv: string[];
    resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues;
  };

  vi.spyOn(
    command as { resolveResumePresetValues: typeof Install.prototype.resolveResumePresetValues },
    'resolveResumePresetValues',
  ).mockResolvedValue(undefined);

  const runPromptCatalogMock = vi
    .fn()
    .mockResolvedValueOnce({ env: 'app7593' })
    .mockResolvedValueOnce({
      appRootPath: './app7593/source/',
      appPort: '13000',
      storagePath: './app7593/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      dbDialect: 'postgres',
      builtinDb: false,
      dbHost: 'db.example.com',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    })
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'nocobase',
      rootNickname: 'NocoBase',
    })
    .mockResolvedValueOnce({
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      authType: 'oauth',
    });

  const promptCatalogModule = await import('../lib/prompt-catalog.js');
  const runPromptCatalogSpy = vi
    .spyOn(promptCatalogModule, 'runPromptCatalog')
    .mockImplementation(runPromptCatalogMock as never);

  try {
    const result = await (
      Install.prototype as unknown as {
        collectPromptResults: (
          parsed: Record<string, unknown>,
          yes: boolean,
        ) => Promise<{
          dbResults: Record<string, unknown>;
        }>;
      }
    ).collectPromptResults.call(
      command,
      {
        env: 'app7593',
        'builtin-db': false,
        'db-underscored': true,
      },
      true,
    );

    expect(result.dbResults).toMatchObject({
      dbUnderscored: true,
    });
  } finally {
    process.argv = originalArgv;
    runPromptCatalogSpy.mockRestore();
  }
});

test('builtin postgres db plan uses a custom built-in database image when provided', () => {
  const plan = Install.buildBuiltinDbPlan({
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
  const plan = Install.buildBuiltinDbPlan({
    envName: 'demo',
    workspaceName: 'nb-shared-workspace',
    storagePath: './storage/demo',
    source: 'docker',
    dbDialect: 'postgres',
  });

  expect(plan.networkName).toBe('nb-shared-workspace');
  expect(plan.containerName).toBe('nb-shared-workspace-demo-postgres');
});

test('builtin db plan uses locale-aware default images when NB_LOCALE is zh-CN', () => {
  process.env.NB_LOCALE = 'zh-CN';

  const postgresPlan = Install.buildBuiltinDbPlan({
    envName: 'demo',
    storagePath: './storage/demo',
    source: 'npm',
    dbDialect: 'postgres',
  });
  expect(postgresPlan.image).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16');

  const mysqlPlan = Install.buildBuiltinDbPlan({
    envName: 'demo',
    storagePath: './storage/demo',
    source: 'npm',
    dbDialect: 'mysql',
  });
  expect(mysqlPlan.image).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/mysql:8');

  const mariadbPlan = Install.buildBuiltinDbPlan({
    envName: 'demo',
    storagePath: './storage/demo',
    source: 'npm',
    dbDialect: 'mariadb',
  });
  expect(mariadbPlan.image).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/mariadb:11');
});

test('builtin db plan does not publish host port for docker source and uses container host', () => {
  const plan = Install.buildBuiltinDbPlan({
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

  expect(plan.dbHost).toBe('nb-dockerapp-postgres');
  expect(plan.args.includes('-p')).toBe(false);
});

test('builtin mysql db plan publishes the selected db port', () => {
  const plan = Install.buildBuiltinDbPlan({
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
  const plan = Install.buildBuiltinDbPlan({
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
  expect(
    plan.args.includes(
      `${path.resolve(resolveCliHomeRoot(), './storage/kingapp', 'db', 'kingbase')}:/home/kingbase/userdata`,
    ),
  ).toBe(true);
});

test('docker app plan wires app, db, network, port, and image settings', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const networkName = 'nocobase';
  const containerPrefix = 'nb';
  const plan = await installStatics.buildDockerAppPlan({
    envName: 'demo',
    networkName,
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
      dbHost: `${containerPrefix}-demo-postgres`,
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

  expect(plan.source).toBe('docker');
  expect(plan.networkName).toBe(networkName);
  expect(plan.containerName).toBe(`${containerPrefix}-demo-app`);
  expect(plan.imageRef).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:develop-full');
  expect(plan.appPort).toBe('13000');
  expect(plan.storagePath).toBe(resolveEnvRelativePath('./storage/demo'));
  expect(plan.envFile).toBe(undefined);
  expect(plan.appKey.length).toBe(64);
  expect(typeof plan.timeZone).toBe('string');
  expect(plan.timeZone.length > 0).toBe(true);
  expect(plan.args.includes('--platform')).toBe(false);
  expect(plan.args.includes('--network')).toBe(true);
  expect(plan.args.includes(networkName)).toBe(true);
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
  expect(plan.args.includes(`DB_HOST=${containerPrefix}-demo-postgres`)).toBe(true);
  expect(plan.args.includes('DB_PORT=5432')).toBe(true);
  expect(plan.args.includes('DB_DATABASE=nocobase')).toBe(true);
  expect(plan.args.includes('DB_USER=nocobase')).toBe(true);
  expect(plan.args.includes('DB_PASSWORD=nocobase')).toBe(true);
  expect(plan.args.includes('DB_SCHEMA=test')).toBe(true);
  expect(plan.args.includes('DB_TABLE_PREFIX=nb_')).toBe(true);
  expect(plan.args.includes('DB_UNDERSCORED=true')).toBe(true);
});

test('docker app plan enables NOCOBASE_EXTRACT_CLIENT_ASSETS by default', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const plan = await installStatics.buildDockerAppPlan({
    envName: 'demo',
    workspaceName: 'nb-demo',
    networkName: 'nb-demo',
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
      dbHost: 'nb-demo-demo-postgres',
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

  expect(plan.args.includes('NOCOBASE_EXTRACT_CLIENT_ASSETS=true')).toBe(true);
});

test('docker app plan forwards NOCOBASE_EXTRACT_CLIENT_ASSETS when explicitly disabled', async () => {
  process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS = 'false';
  const installStatics = Install as unknown as InstallStatics;
  const plan = await installStatics.buildDockerAppPlan({
    envName: 'demo',
    workspaceName: 'nb-demo',
    networkName: 'nb-demo',
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
      dbHost: 'nb-demo-demo-postgres',
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

  expect(plan.args.includes('NOCOBASE_EXTRACT_CLIENT_ASSETS=false')).toBe(true);
});

test('install saved env config forwards endpoint, auth, app, storage, and db settings', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
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
      dbSchema: 'test',
      dbTablePrefix: 'nb_',
      dbUnderscored: true,
    },
    rootResults: {
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'token',
      accessToken: 'token-123',
    },
  });

  expect(envConfig).toEqual({
    schemaVersion: ENV_CONFIG_SCHEMA_VERSION,
    kind: 'local',
    apiBaseUrl: 'http://127.0.0.1:13080/api',
    authType: 'token',
    source: 'git',
    downloadVersion: 'alpha',
    gitUrl: 'https://github.com/nocobase/nocobase.git',
    npmRegistry: 'https://registry.npmmirror.com',
    build: false,
    buildDts: false,
    appRootPath: './apps/demo',
    appPort: '13080',
    storagePath: './storage/demo',
    appKey: 'app-key-123',
    timezone: 'Asia/Shanghai',
    builtinDb: true,
    dbDialect: 'postgres',
    builtinDbImage: 'registry.example.com/postgres:16',
    dbPort: '5432',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    dbSchema: 'test',
    dbTablePrefix: 'nb_',
    dbUnderscored: true,
    rootUsername: 'admin',
    rootEmail: 'admin@nocobase.com',
    rootPassword: 'admin123',
    rootNickname: 'Admin',
    accessToken: 'token-123',
  });
});

test('install saved env config omits dbHost for builtin local databases and keeps dbPort', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
    envName: 'demo',
    appResults: {
      appPort: '13080',
      appKey: 'app-key-123',
      timeZone: 'Asia/Shanghai',
      storagePath: './storage/demo',
    },
    downloadResults: {
      source: 'git',
      version: 'alpha',
    },
    dbResults: {
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.dbHost).toBe(undefined);
  expect(envConfig.dbPort).toBe('5432');
});

test('install saved env config records when an env uses an external database', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
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
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13081/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.builtinDb).toBe(false);
  expect(envConfig.builtinDbImage).toBe(undefined);
  expect(envConfig.apiBaseUrl).toBe('http://127.0.0.1:13081/api');
});

test('install saved env config falls back to configured default api host when apiBaseUrl is empty', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig(
    {
      envName: 'external',
      appResults: {
        appPort: '13081',
        storagePath: './storage/external',
      },
      downloadResults: {},
      dbResults: {},
      rootResults: {},
      envAddResults: {
        authType: 'oauth',
      },
    },
    {
      defaultApiHost: '192.168.1.10',
    },
  );

  expect(envConfig.apiBaseUrl).toBe('http://192.168.1.10:13081/api');
});

test('install saved env config normalizes equivalent absolute legacy paths to appPath', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
    envName: 'absolute',
    appResults: {
      appRootPath: '/tmp/absolute/source',
      appPort: '13081',
      storagePath: '/tmp/absolute/storage',
    },
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13081/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.appPath).toBe('/tmp/absolute/');
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'appRootPath')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'storagePath')).toBe(false);
});

test('install saved env config prefers appPath and omits derived legacy paths', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
    envName: 'derived',
    appResults: {
      appPath: './derived/',
      appRootPath: './derived/source/',
      appPort: '13081',
      storagePath: './derived/storage/',
    },
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13081/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.appPath).toBe('./derived/');
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'appRootPath')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'storagePath')).toBe(false);
});

test('install saved env config omits equivalent legacy paths with different separators', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
    envName: 'derived-normalized',
    appResults: {
      appPath: './derived/',
      appRootPath: '.\\derived\\source',
      appPort: '13081',
      storagePath: './derived/storage',
    },
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13081/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.appPath).toBe('./derived/');
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'appRootPath')).toBe(false);
  expect(Object.prototype.hasOwnProperty.call(envConfig, 'storagePath')).toBe(false);
});

test('install saved env config records docker download settings for later upgrades', () => {
  const installStatics = Install as unknown as InstallStatics;
  const envConfig = installStatics.buildSavedEnvConfig({
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
    rootResults: {
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13082/api',
      authType: 'oauth',
    },
  });

  expect(envConfig.kind).toBe('docker');
  expect(envConfig.source).toBe('docker');
  expect(envConfig.downloadVersion).toBe('alpha');
  expect(envConfig.dockerRegistry).toBe('nocobase/nocobase');
  expect(envConfig.dockerPlatform).toBe('linux/amd64');
  expect(envConfig.envFile).toBe(undefined);
  expect(envConfig.dbHost).toBe(undefined);
  expect(envConfig.dbPort).toBe(undefined);
});

test('install resolves an available app port default when the preferred port is busy on 0.0.0.0', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const server = net.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '0.0.0.0', () => resolve());
  });

  const address = server.address();
  expect(address && typeof address === 'object').toBeTruthy();

  const busyPort = String(address.port);

  try {
    const appPort = await installStatics.resolveAvailableDefaultPort(busyPort);
    expect(appPort).not.toBe(busyPort);
    expect(Number(appPort)).toBeGreaterThan(0);
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

test('install resolves an available built-in database host port default when the preferred port is busy on 0.0.0.0', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const server = net.createServer();
  let occupiedByTest = false;

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(54321, '0.0.0.0', () => {
        occupiedByTest = true;
        resolve();
      });
    });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
    if (code !== 'EADDRINUSE') {
      throw error;
    }
  }

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

    expect(initialValues.dbPort).toBeTruthy();
    expect(initialValues.dbPort).not.toBe('54321');
    expect(Number(initialValues.dbPort)).toBeGreaterThan(0);
  } finally {
    if (occupiedByTest && server.listening) {
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

test('install seeds app port initial values unless the user provided --app-port', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const resolveAvailableDefaultPort = vi
    .spyOn(
      Install as unknown as {
        resolveAvailableDefaultPort: (
          defaultPort: string,
          options?: { label?: string; warn?: boolean },
        ) => Promise<string>;
      },
      'resolveAvailableDefaultPort',
    )
    .mockResolvedValueOnce('61522');

  try {
    const initialValues = await installStatics.buildAppPromptInitialValues({
      envName: 'demo',
      flags: {},
    });
    expect(initialValues.appRootPath).toBe('./demo/source/');
    expect(initialValues.storagePath).toBe('./demo/storage/');
    expect(initialValues.appPort).toBe('61522');
    expect(resolveAvailableDefaultPort).toHaveBeenCalledWith('13000', {
      label: 'Default app port',
      warn: true,
    });
    expect(
      await installStatics.buildAppPromptInitialValues({
        envName: 'demo',
        flags: { 'app-port': '14000', 'app-root-path': './custom/source/', 'storage-path': './custom/storage/' },
      }),
    ).toEqual({});
  } finally {
    resolveAvailableDefaultPort.mockRestore();
  }
});

test('install seeds built-in database host port for npm/git sources when the default port is busy', async () => {
  const installStatics = Install as unknown as InstallStatics;
  const resolveAvailableDefaultPort = vi
    .spyOn(
      Install as unknown as {
        resolveAvailableDefaultPort: (
          defaultPort: string,
          options?: { label?: string; warn?: boolean },
        ) => Promise<string>;
      },
      'resolveAvailableDefaultPort',
    )
    .mockResolvedValueOnce('61523');

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
    expect(initialValues.dbPort).toBe('61523');
    expect(resolveAvailableDefaultPort).toHaveBeenCalledWith('54321', {
      label: 'Default kingbase port',
      warn: true,
    });
  } finally {
    resolveAvailableDefaultPort.mockRestore();
  }
});

test('install does not seed built-in database host port for docker source or explicit --db-port', async () => {
  const installStatics = Install as unknown as InstallStatics;

  expect(
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
  ).toEqual({});
  expect(
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
  ).toEqual({});
});

test('install does not seed a built-in database host port for external db host presets', async () => {
  const installStatics = Install as unknown as InstallStatics;

  await expect(
    installStatics.buildDbPromptInitialValues({
      flags: {},
      downloadResults: {
        source: 'npm',
      },
      dbPreset: {
        builtinDb: false,
        dbDialect: 'postgres',
        dbHost: 'db.example.com',
      },
    }),
  ).resolves.toEqual({});
});
