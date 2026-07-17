/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';
import Download, { defaultDockerRegistryForLang } from '../commands/source/download.js';
import Init from '../commands/init.js';
import EnvAdd from '../commands/env/add.js';
import Install from '../commands/install.js';
import { setCliConfigValue } from '../lib/cli-config.js';
import { saveAuthConfig } from '../lib/auth-store.js';
import { resolveLocalizedText } from '../lib/cli-locale.js';
import { runPromptCatalog } from '../lib/prompt-catalog.js';
import {
  findAvailableTcpPort,
  validateAppPublicPath,
  validateApiBaseUrl,
  validateAvailableTcpPort,
  validateTcpPort,
  validateEnvKey,
} from '../lib/prompt-validators.js';
import { clearExternalDbValidationCache } from '../lib/db-connection-check.js';

const mockPgConnect = vi.fn();
const mockPgQuery = vi.fn();
const mockPgEnd = vi.fn();
const mockMysqlCreateConnection = vi.fn();

vi.mock('pg', () => ({
  default: {
    Client: vi.fn(() => ({
      connect: mockPgConnect,
      query: mockPgQuery,
      end: mockPgEnd,
    })),
  },
}));

vi.mock('mysql2/promise', () => ({
  default: {
    createConnection: mockMysqlCreateConnection,
  },
}));

async function withTempProjectCwd(run: () => Promise<void>) {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-project-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempRoot);

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    await rm(tempRoot, { recursive: true, force: true });
  }
}

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-config-'));

  try {
    process.env.NB_CLI_ROOT = tempHome;
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

const originalNbLocale = process.env.NB_LOCALE;

beforeEach(() => {
  process.env.NB_LOCALE = 'en-US';
  vi.restoreAllMocks();
});

afterEach(() => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
  } else {
    process.env.NB_LOCALE = originalNbLocale;
  }
  clearExternalDbValidationCache();
  mockPgConnect.mockReset();
  mockPgQuery.mockReset();
  mockPgEnd.mockReset();
  mockMysqlCreateConnection.mockReset();
});

test('validateApiBaseUrl accepts URLs whose health check returns HTTP 200', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    status: 200,
    json: vi.fn(),
  } as any);

  await expect(validateApiBaseUrl('http://localhost:13000/api')).resolves.toBe(undefined);
  await expect(validateApiBaseUrl('https://demo.example.com/api')).resolves.toBe(undefined);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:13000/api/__health_check',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('validateApiBaseUrl rejects malformed URLs and unsupported schemes', async () => {
  await expect(validateApiBaseUrl('not a url')).resolves.toMatch(/Enter a valid URL/);
  await expect(validateApiBaseUrl('ftp://example.com/api')).resolves.toMatch(
    /URL must start with http:\/\/ or https:\/\//,
  );
});

test('validateApiBaseUrl rejects URLs that do not include the api prefix', async () => {
  await expect(validateApiBaseUrl('http://localhost:13000')).resolves.toMatch(/must include the \/api prefix/i);
  await expect(validateApiBaseUrl('https://demo.example.com/nocobase')).resolves.toMatch(
    /must include the \/api prefix/i,
  );
});

test('validateApiBaseUrl accepts supported api base url shapes with optional public path prefixes', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    status: 200,
    json: vi.fn(),
  } as any);

  await expect(validateApiBaseUrl('https://demo.example.com/nocobase/api')).resolves.toBe(undefined);
  await expect(validateApiBaseUrl('https://demo.example.com/nocobase/api/__app/mobile')).resolves.toBe(undefined);

  expect(fetchMock).toHaveBeenCalledWith(
    'https://demo.example.com/nocobase/api/__health_check',
    expect.objectContaining({ method: 'GET' }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    'https://demo.example.com/nocobase/api/__app/mobile/__health_check',
    expect.objectContaining({ method: 'GET' }),
  );
});

test('validateApiBaseUrl rejects unsupported paths that only contain api as a middle segment', async () => {
  await expect(validateApiBaseUrl('https://demo.example.com/foo/api/bar')).resolves.toMatch(
    /must include the \/api prefix/i,
  );
  await expect(validateApiBaseUrl('https://demo.example.com/api/foo')).resolves.toMatch(
    /must include the \/api prefix/i,
  );
});

test('validateApiBaseUrl rejects URLs that already include the health check path', async () => {
  await expect(validateApiBaseUrl('http://localhost:13000/api/__health_check')).resolves.toMatch(
    /Do not include \/__health_check/i,
  );
});

test('validateApiBaseUrl rejects maintaining health check responses', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    status: 503,
    json: vi.fn(async () => ({
      error: {
        status: 503,
        maintaining: true,
        message: 'plugins loaded',
        command: { name: 'start' },
        code: 'APP_COMMANDING',
      },
    })),
  } as any);

  await expect(validateApiBaseUrl('http://localhost:13000/api')).resolves.toMatch(
    /still starting or in maintenance mode/i,
  );
});

test('validateApiBaseUrl rejects unexpected health check statuses', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    status: 404,
    json: vi.fn(async () => ({ error: { message: 'not found' } })),
  } as any);

  await expect(validateApiBaseUrl('http://localhost:13000/api')).resolves.toMatch(
    /did not pass the health check \(HTTP 404\)/i,
  );
});

test('validateApiBaseUrl reports connectivity failures', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:13000'));

  await expect(validateApiBaseUrl('http://localhost:13000/api')).resolves.toMatch(
    /Unable to connect to the API base URL/i,
  );
});

test('validateEnvKey allows letters, numbers, hyphens, and underscores', () => {
  expect(validateEnvKey('local01')).toBe(undefined);
  expect(validateEnvKey('local-dev')).toBe(undefined);
  expect(validateEnvKey('local_dev')).toBe(undefined);
  expect(validateEnvKey('local.dev') ?? '').toMatch(/letters, numbers, hyphens, and underscores only/i);
});

test('validateAppPublicPath accepts root and slash-separated slug paths', () => {
  expect(validateAppPublicPath('/')).toBe(undefined);
  expect(validateAppPublicPath('/nocobase/')).toBe(undefined);
  expect(validateAppPublicPath('/admin_console/')).toBe(undefined);
  expect(validateAppPublicPath('/foo-bar/baz_2/')).toBe(undefined);
  expect(validateAppPublicPath('/foo-bar/baz_2')).toBe(undefined);
});

test('validateAppPublicPath rejects invalid path formats', () => {
  expect(validateAppPublicPath('nocobase') ?? '').toMatch(/slash-separated path/i);
  expect(validateAppPublicPath('/中文/') ?? '').toMatch(/slash-separated path/i);
  expect(validateAppPublicPath('/foo bar/') ?? '').toMatch(/slash-separated path/i);
  expect(validateAppPublicPath('/foo.bar/') ?? '').toMatch(/slash-separated path/i);
  expect(validateAppPublicPath('/foo//bar/') ?? '').toMatch(/slash-separated path/i);
});

test('validateAvailableTcpPort rejects invalid and occupied ports across local bind hosts', async () => {
  expect((await validateAvailableTcpPort('abc')) ?? '').toMatch(/valid TCP port/i);

  for (const host of ['127.0.0.1', '0.0.0.0'] as const) {
    const server = net.createServer();
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, host, () => resolve());
    });

    const address = server.address();
    expect(address && typeof address === 'object').toBeTruthy();
    expect((await validateAvailableTcpPort(String(address.port))) ?? '').toMatch(/already in use/i);

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

  const ipv6Server = net.createServer();
  try {
    await new Promise<void>((resolve, reject) => {
      ipv6Server.once('error', reject);
      ipv6Server.listen(0, '::1', () => resolve());
    });

    const address = ipv6Server.address();
    expect(address && typeof address === 'object').toBeTruthy();
    expect((await validateAvailableTcpPort(String(address.port))) ?? '').toMatch(/already in use/i);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
    if (code !== 'EAFNOSUPPORT' && code !== 'EADDRNOTAVAIL') {
      throw error;
    }
  } finally {
    if (ipv6Server.listening) {
      await new Promise<void>((resolve, reject) => {
        ipv6Server.close((error) => {
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

test('findAvailableTcpPort returns a free TCP port', async () => {
  let reservedPort: string | undefined;
  let reservedServer: net.Server | undefined;

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const port = await findAvailableTcpPort();
      expect(typeof port).toBe('string');
      expect(port).toMatch(/^\d+$/);

      const server = net.createServer();
      const bound = await new Promise<boolean>((resolve) => {
        server.once('error', () => resolve(false));
        server.listen(Number(port), '127.0.0.1', () => resolve(true));
      });

      if (!bound) {
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
        continue;
      }

      reservedPort = port;
      reservedServer = server;
      break;
    }

    expect(reservedPort).toBeTruthy();
    expect(reservedServer?.listening).toBe(true);
  } finally {
    const server = reservedServer;
    if (server) {
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

test('validateTcpPort rejects invalid ports and accepts valid ones', () => {
  expect(validateTcpPort('abc') ?? '').toMatch(/valid TCP port/i);
  expect(validateTcpPort('70000') ?? '').toMatch(/valid TCP port/i);
  expect(validateTcpPort('5432')).toBe(undefined);
});

test('init and env add prompts validate apiBaseUrl', async () => {
  const appNamePrompt = Init.prompts.appName;
  const initPrompt = Init.prompts.apiBaseUrl;
  const envAddPrompt = EnvAdd.prompts.apiBaseUrl;

  expect(appNamePrompt.type).toBe('text');
  expect(appNamePrompt.initialValue).toBe(undefined);
  expect(appNamePrompt.yesInitialValue).toBe(undefined);
  expect(typeof appNamePrompt.validate).toBe('function');
  expect(await appNamePrompt.validate?.('local-dev', {})).toBe(undefined);
  expect(initPrompt.type).toBe('text');
  expect(envAddPrompt.type).toBe('text');
  expect(typeof initPrompt.validate).toBe('function');
  expect(typeof envAddPrompt.validate).toBe('function');
  expect((await initPrompt.validate?.('not-a-url', {})) ?? '').toMatch(/Enter a valid URL/);
  expect((await envAddPrompt.validate?.('ftp://example.com/api', {})) ?? '').toMatch(/http:\/\/ or https:\/\//);
});

test('init appName validates global env name uniqueness', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    const appNamePrompt = Init.prompts.appName;
    expect(appNamePrompt.type).toBe('text');
    expect((await appNamePrompt.validate?.('local', {})) ?? '').toMatch(/already exists/i);
    expect(await appNamePrompt.validate?.('newapp', {})).toBe(undefined);
  });
});

test('init appName allows reusing a global env name when --force is set', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    const appNamePrompt = Init.prompts.appName;
    expect(appNamePrompt.type).toBe('text');
    const originalArgv = process.argv;
    process.argv = ['node', 'nb', 'init', '--force'];
    try {
      expect(await appNamePrompt.validate?.('local', {})).toBe(undefined);
    } finally {
      process.argv = originalArgv;
    }
  });
});

test('init --yes --env validates global env name uniqueness through preset values', async () => {
  await withTempProjectCwd(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'local',
        envs: {
          local: {
            baseUrl: 'http://localhost:13000/api',
          },
        },
      },
      { scope: 'global' },
    );

    await expect(
      (() =>
        runPromptCatalog(
          {
            appName: Init.prompts.appName,
          },
          {
            yes: true,
            values: {
              appName: 'local',
            },
            hooks: {
              onMissingNonInteractive: (message: string) => {
                throw new Error(message);
              },
            },
          },
        ))(),
    ).rejects.toThrow(/already exists/i);
  });
});

test('install prompts expose the expected defaults and validators', () => {
  const envPrompt = Install.envPrompts.env;
  const langPrompt = Install.appPrompts.lang;
  const appPathPrompt = Install.appPrompts.appPath;
  const appPortPrompt = Install.appPrompts.appPort;
  const builtinDbPrompt = Install.dbPrompts.builtinDb;
  const dbDialectPrompt = Install.dbPrompts.dbDialect;
  const builtinDbImagePrompt = Install.dbPrompts.builtinDbImage;
  const dbHostPrompt = Install.dbPrompts.dbHost;
  const dbPortPrompt = Install.dbPrompts.dbPort;
  const dbDatabasePrompt = Install.dbPrompts.dbDatabase;
  const dbUserPrompt = Install.dbPrompts.dbUser;
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;
  const dbSchemaPrompt = Install.dbPrompts.dbSchema;
  const dbTablePrefixPrompt = Install.dbPrompts.dbTablePrefix;
  const dbUnderscoredPrompt = Install.dbPrompts.dbUnderscored;
  const rootUsernamePrompt = Install.rootUserPrompts.rootUsername;
  const rootEmailPrompt = Install.rootUserPrompts.rootEmail;
  const rootPasswordPrompt = Install.rootUserPrompts.rootPassword;
  const rootNicknamePrompt = Install.rootUserPrompts.rootNickname;

  expect(envPrompt.type).toBe('text');
  expect(envPrompt.initialValue).toBe(undefined);
  expect(envPrompt.yesInitialValue).toBe(undefined);
  expect(typeof envPrompt.validate).toBe('function');
  expect(envPrompt.validate?.('local-dev', {})).toBe(undefined);

  expect(langPrompt.type).toBe('select');
  expect(resolveLocalizedText(langPrompt.message, { locale: 'en-US' })).toBe('App language');

  expect(appPathPrompt.type).toBe('text');
  expect(resolveLocalizedText(appPathPrompt.message, { locale: 'en-US' })).toContain(
    process.env.NB_CLI_ROOT ?? os.homedir(),
  );

  expect(appPortPrompt.type).toBe('text');
  expect(appPortPrompt.initialValue).toBe(undefined);
  expect(appPortPrompt.yesInitialValue).toBe(undefined);
  expect(typeof appPortPrompt.validate).toBe('function');

  expect(builtinDbPrompt.type).toBe('boolean');
  expect(builtinDbPrompt.initialValue).toBe(true);
  expect(builtinDbPrompt.yesInitialValue).toBe(true);
  expect(builtinDbPrompt.validate?.(true, { dbDialect: 'kingbase' })).toBe(undefined);

  expect(dbDialectPrompt.type).toBe('select');
  expect(dbDialectPrompt.initialValue).toBe('postgres');
  expect(dbDialectPrompt.yesInitialValue).toBe('postgres');

  expect(dbHostPrompt.type).toBe('text');
  expect(typeof dbHostPrompt.initialValue).toBe('function');
  expect(dbHostPrompt.initialValue({ builtinDb: false })).toBe('127.0.0.1');
  expect(dbHostPrompt.initialValue({ builtinDb: true })).toBe('postgres');
  expect(dbHostPrompt.yesInitialValue).toBe('postgres');
  expect(typeof dbHostPrompt.hidden).toBe('function');
  expect(dbHostPrompt.hidden?.({ builtinDb: true })).toBe(true);
  expect(dbHostPrompt.hidden?.({ builtinDb: false })).toBe(false);

  expect(builtinDbImagePrompt.type).toBe('text');
  expect(typeof builtinDbImagePrompt.initialValue).toBe('function');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'postgres' })).toBe('postgres:16');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'mysql' })).toBe('mysql:8');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'mariadb' })).toBe('mariadb:11');
  expect(builtinDbImagePrompt.initialValue({ dbDialect: 'kingbase' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
  );
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: false, dbDialect: 'postgres' })).toBe(true);
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: true, dbDialect: 'postgres' })).toBe(false);
  expect(builtinDbImagePrompt.hidden?.({ builtinDb: true, dbDialect: 'kingbase' })).toBe(false);

  expect(dbPortPrompt.type).toBe('text');
  expect(typeof dbPortPrompt.initialValue).toBe('function');
  expect(typeof dbPortPrompt.validate).toBe('function');
  expect(dbPortPrompt.initialValue({ dbDialect: 'postgres' })).toBe('5432');
  expect(dbPortPrompt.initialValue({ dbDialect: 'mysql' })).toBe('3306');
  expect(dbPortPrompt.initialValue({ dbDialect: 'mariadb' })).toBe('3306');
  expect(dbPortPrompt.initialValue({ dbDialect: 'kingbase' })).toBe('54321');
  expect(dbPortPrompt.yesInitialValue).toBe(undefined);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'docker' })).toBe(true);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'npm' })).toBe(false);
  expect(dbPortPrompt.hidden?.({ builtinDb: true, source: 'git' })).toBe(false);
  expect(dbPortPrompt.hidden?.({ builtinDb: false })).toBe(false);

  expect(dbDatabasePrompt.type).toBe('text');
  expect(typeof dbDatabasePrompt.initialValue).toBe('function');
  expect(dbDatabasePrompt.initialValue({ dbDialect: 'postgres' })).toBe('nocobase');
  expect(dbDatabasePrompt.initialValue({ dbDialect: 'kingbase' })).toBe('kingbase');
  expect(dbDatabasePrompt.yesInitialValue).toBe(undefined);

  expect(dbUserPrompt.type).toBe('text');
  expect(dbUserPrompt.initialValue).toBe('nocobase');
  expect(dbUserPrompt.yesInitialValue).toBe('nocobase');

  expect(dbPasswordPrompt.type).toBe('password');
  expect(dbPasswordPrompt.initialValue).toBe('nocobase');
  expect(dbPasswordPrompt.yesInitialValue).toBe('nocobase');

  expect(dbSchemaPrompt.type).toBe('text');
  expect(resolveLocalizedText(dbSchemaPrompt.message, { locale: 'en-US' })).toBe(
    'Database schema (PostgreSQL/KingbaseES only, optional)',
  );
  expect(dbSchemaPrompt.initialValue).toBe(undefined);
  expect(dbSchemaPrompt.yesInitialValue).toBe(undefined);
  expect(typeof dbSchemaPrompt.hidden).toBe('function');
  expect(dbSchemaPrompt.hidden?.({ dbDialect: 'postgres' })).toBe(false);
  expect(dbSchemaPrompt.hidden?.({ dbDialect: 'kingbase' })).toBe(false);
  expect(dbSchemaPrompt.hidden?.({ dbDialect: 'mysql' })).toBe(true);
  expect(dbSchemaPrompt.hidden?.({ dbDialect: 'mariadb' })).toBe(true);

  expect(dbTablePrefixPrompt.type).toBe('text');
  expect(dbTablePrefixPrompt.initialValue).toBe(undefined);
  expect(dbTablePrefixPrompt.yesInitialValue).toBe(undefined);

  expect(dbUnderscoredPrompt.type).toBe('boolean');
  expect(dbUnderscoredPrompt.initialValue).toBe(false);
  expect(dbUnderscoredPrompt.yesInitialValue).toBe(false);

  expect(rootUsernamePrompt.type).toBe('text');
  expect(rootUsernamePrompt.initialValue).toBe(undefined);
  expect(rootUsernamePrompt.yesInitialValue).toBe('nocobase');
  expect(rootUsernamePrompt.required).toBe(true);

  expect(rootEmailPrompt.type).toBe('text');
  expect(rootEmailPrompt.initialValue).toBe(undefined);
  expect(rootEmailPrompt.yesInitialValue).toBe('admin@nocobase.com');
  expect(rootEmailPrompt.required).toBe(true);

  expect(rootPasswordPrompt.type).toBe('password');
  expect(resolveLocalizedText(rootPasswordPrompt.message, { locale: 'en-US' })).toBe(
    'Initial admin password',
  );
  expect(rootPasswordPrompt.initialValue).toBe(undefined);
  expect(rootPasswordPrompt.yesInitialValue).toBe('admin123');
  expect(rootPasswordPrompt.required).toBe(true);

  expect(rootNicknamePrompt.type).toBe('text');
  expect(rootNicknamePrompt.initialValue).toBe(undefined);
  expect(rootNicknamePrompt.yesInitialValue).toBe('Super Admin');
  expect(rootNicknamePrompt.required).toBe(true);
});

test('install external db validators skip connection checks until config is complete', async () => {
  const dbHostPrompt = Install.dbPrompts.dbHost;

  expect(
    await dbHostPrompt.validate?.('db.example.com', {
      builtinDb: false,
      dbDialect: 'postgres',
      dbHost: 'db.example.com',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: '',
    }),
  ).toBe(undefined);

  expect(mockPgConnect).not.toHaveBeenCalled();
});

test('install external db validators do not run for built-in database config', async () => {
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;

  expect(
    await dbPasswordPrompt.validate?.('secret', {
      builtinDb: true,
      dbDialect: 'postgres',
      dbHost: 'postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    }),
  ).toBe(undefined);

  expect(mockPgConnect).not.toHaveBeenCalled();
});

test('install external db validators check connectivity once config is complete', async () => {
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;
  mockPgConnect.mockResolvedValue(undefined);
  mockPgQuery.mockResolvedValue([{ '?column?': 1 }]);
  mockPgEnd.mockResolvedValue(undefined);

  const result = await dbPasswordPrompt.validate?.('secret', {
    builtinDb: false,
    dbDialect: 'postgres',
    dbHost: 'db.example.com',
    dbPort: '5432',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'secret',
  });

  expect(result).toBe(undefined);
  expect(mockPgConnect).toHaveBeenCalledTimes(1);
  expect(mockPgQuery).toHaveBeenCalledWith('SELECT 1');
  expect(mockPgEnd).toHaveBeenCalledTimes(1);
});

test('install external db validators surface readable auth errors', async () => {
  const dbPasswordPrompt = Install.dbPrompts.dbPassword;
  mockPgConnect.mockRejectedValue(Object.assign(new Error('password authentication failed'), { code: '28P01' }));
  mockPgEnd.mockResolvedValue(undefined);

  const result = await dbPasswordPrompt.validate?.('bad-secret', {
    builtinDb: false,
    dbDialect: 'postgres',
    dbHost: 'db.example.com',
    dbPort: '5432',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'bad-secret',
  });

  expect(result ?? '').toMatch(/username and password/i);
});

test('install mysql dbUnderscored validator requires underscored when lower_case_table_names=1', async () => {
  const dbUnderscoredPrompt = Install.dbPrompts.dbUnderscored;
  const mysqlQuery = vi
    .fn()
    .mockResolvedValueOnce([[{ '?column?': 1 }], []])
    .mockResolvedValueOnce([[{ Variable_name: 'lower_case_table_names', Value: '1' }], []]);
  const mysqlEnd = vi.fn().mockResolvedValue(undefined);
  mockMysqlCreateConnection.mockResolvedValue({
    query: mysqlQuery,
    end: mysqlEnd,
  });

  const result = await dbUnderscoredPrompt.validate?.(false, {
    builtinDb: false,
    dbDialect: 'mysql',
    dbHost: 'db.example.com',
    dbPort: '3306',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    dbUnderscored: false,
  });

  expect(result ?? '').toMatch(/DB_UNDERSCORED=true/i);
  expect(mysqlQuery.mock.calls.map((call) => call[0])).toEqual([
    'SELECT 1',
    `SHOW VARIABLES LIKE 'lower_case_table_names'`,
  ]);
  expect(mysqlEnd).toHaveBeenCalledTimes(2);
});

test('install mysql dbUnderscored validator accepts lower_case_table_names=1 when underscored is enabled', async () => {
  const dbUnderscoredPrompt = Install.dbPrompts.dbUnderscored;
  const mysqlQuery = vi
    .fn()
    .mockResolvedValueOnce([[{ '?column?': 1 }], []])
    .mockResolvedValueOnce([[{ Variable_name: 'lower_case_table_names', Value: '1' }], []]);
  const mysqlEnd = vi.fn().mockResolvedValue(undefined);
  mockMysqlCreateConnection.mockResolvedValue({
    query: mysqlQuery,
    end: mysqlEnd,
  });

  const result = await dbUnderscoredPrompt.validate?.(true, {
    builtinDb: false,
    dbDialect: 'mysql',
    dbHost: 'db.example.com',
    dbPort: '3306',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    dbUnderscored: true,
  });

  expect(result).toBe(undefined);
  expect(mysqlQuery.mock.calls.map((call) => call[0])).toEqual([
    'SELECT 1',
    `SHOW VARIABLES LIKE 'lower_case_table_names'`,
  ]);
  expect(mysqlEnd).toHaveBeenCalledTimes(2);
});

test('docker registry defaults follow CLI locale', () => {
  const dockerRegistryPrompt = Download.prompts.dockerRegistry;
  const dockerPlatformPrompt = Download.prompts.dockerPlatform;

  expect(defaultDockerRegistryForLang('zh-CN')).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(defaultDockerRegistryForLang('en-US')).toBe('nocobase/nocobase');

  expect(dockerRegistryPrompt.type).toBe('text');
  process.env.NB_LOCALE = 'zh-CN';
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'en-US' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'zh-CN' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
  expect(dockerRegistryPrompt.initialValue?.({})).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  process.env.NB_LOCALE = 'en-US';
  expect(dockerRegistryPrompt.initialValue?.({ lang: 'zh-CN' })).toBe('nocobase/nocobase');

  expect(dockerPlatformPrompt.type).toBe('select');
  expect(dockerPlatformPrompt.initialValue).toBe('auto');
  expect(dockerPlatformPrompt.yesInitialValue).toBe('auto');
  expect(dockerPlatformPrompt.hidden?.({ source: 'docker' })).toBe(false);
  expect(dockerPlatformPrompt.hidden?.({ source: 'npm' })).toBe(true);
});

test('docker registry placeholder follows locale copy', () => {
  const dockerRegistryPrompt = Download.prompts.dockerRegistry;

  expect(resolveLocalizedText(dockerRegistryPrompt.placeholder, { locale: 'en-US' })).toBe('nocobase/nocobase');
  expect(resolveLocalizedText(dockerRegistryPrompt.placeholder, { locale: 'zh-CN' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
});

test('version prompt uses presets and reveals otherVersion when needed', () => {
  const versionPrompt = Download.prompts.version;
  const otherVersionPrompt = Download.prompts.otherVersion;

  expect(versionPrompt.type).toBe('select');
  expect(versionPrompt.variant).toBe('radio');
  expect(versionPrompt.initialValue).toBe('latest');
  expect(versionPrompt.yesInitialValue).toBe('latest');
  expect(
    versionPrompt.options[0] && typeof versionPrompt.options[0] !== 'string'
      ? versionPrompt.options[0].disabled
      : undefined,
  ).toBeUndefined();
  expect(
    resolveLocalizedText(
      versionPrompt.options?.[0] && typeof versionPrompt.options[0] !== 'string'
        ? versionPrompt.options[0].hint
        : undefined,
      { locale: 'zh-CN' },
    ),
  ).toContain('稳定版');
  expect(
    resolveLocalizedText(
      versionPrompt.options?.[1] && typeof versionPrompt.options[1] !== 'string'
        ? versionPrompt.options[1].hint
        : undefined,
      { locale: 'zh-CN' },
    ),
  ).toContain('测试版');
  expect(
    resolveLocalizedText(
      versionPrompt.options?.[2] && typeof versionPrompt.options[2] !== 'string'
        ? versionPrompt.options[2].hint
        : undefined,
      { locale: 'zh-CN' },
    ),
  ).toContain('开发版');
  expect(otherVersionPrompt.type).toBe('text');
  expect(otherVersionPrompt.hidden?.({ version: 'alpha' })).toBe(true);
  expect(otherVersionPrompt.hidden?.({ version: 'other' })).toBe(false);
});

test('builtin database image prompt defaults use dockerhub-compatible images by default', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { default: InstallWithZhLocale } = await import('../commands/install.js');
  const builtinDbImagePrompt = InstallWithZhLocale.dbPrompts.builtinDbImage;

  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'postgres' })).toBe('postgres:16');
  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'mysql' })).toBe('mysql:8');
  expect(builtinDbImagePrompt.initialValue?.({ dbDialect: 'mariadb' })).toBe('mariadb:11');
});

test('install download prompt options follow nb image registry config for docker registry defaults', async () => {
  const installStatics = Install as unknown as {
    buildDownloadPromptOptionsForInstall: (
      appResults: Record<string, unknown>,
      envName: string,
    ) => Promise<{
      initialValues: Record<string, unknown>;
      values: Record<string, unknown>;
    }>;
    buildDownloadPresetValuesForInstall: (
      flags: Record<string, unknown>,
      appResults: Record<string, unknown>,
      envName: string,
      yes: boolean,
    ) => Record<string, unknown>;
    buildPresetValuesFromFlags: (flags: Record<string, unknown>) => Record<string, unknown>;
  };

  await withTempCliHome(async () => {
    await setCliConfigValue('nb-image-registry', 'aliyun', { scope: 'global' });
    const aliyunOptions = await installStatics.buildDownloadPromptOptionsForInstall(
      {
        lang: 'en-US',
        appRootPath: './apps/aliyun-demo',
      },
      'aliyun-demo',
    );
    expect(aliyunOptions.initialValues.lang).toBe('en-US');
    expect(aliyunOptions.initialValues.dockerRegistry).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
    expect(aliyunOptions.initialValues.outputDir).toBe('./apps/aliyun-demo');
    expect(aliyunOptions.values.lang).toBe('en-US');

    await setCliConfigValue('nb-image-registry', 'dockerhub', { scope: 'global' });
    const dockerhubOptions = await installStatics.buildDownloadPromptOptionsForInstall(
      {
        lang: 'zh-CN',
        appRootPath: './apps/dockerhub-demo',
      },
      'dockerhub-demo',
    );
    expect(dockerhubOptions.initialValues.lang).toBe('zh-CN');
    expect(dockerhubOptions.initialValues.dockerRegistry).toBe('nocobase/nocobase');
    expect(dockerhubOptions.values.lang).toBe('zh-CN');
  });

  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'install', '--yes'];
  try {
    const preset = installStatics.buildDownloadPresetValuesForInstall(
      {
        yes: true,
        verbose: false,
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      true,
    );

    expect(preset.lang).toBe('en-US');
    expect(preset.source).toBe('docker');
    expect(preset.version).toBe('alpha');
    expect(preset.outputDir).toBe('./apps/en-demo');

    const refPreset = installStatics.buildDownloadPresetValuesForInstall(
      {
        version: 'next',
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      false,
    );
    expect(refPreset.version).toBe('other');
    expect(refPreset.otherVersion).toBe('next');

    const resumePreset = installStatics.buildDownloadPresetValuesForInstall(
      {
        resume: true,
        replace: false,
        'dev-dependencies': false,
        build: true,
        'build-dts': false,
        'docker-save': false,
      },
      {
        lang: 'en-US',
        appRootPath: './apps/en-demo',
      },
      'en-demo',
      false,
    );
    expect(resumePreset.replace).toBe(true);
  } finally {
    process.argv = originalArgv;
  }

  process.argv = ['node', 'nb', 'install', '--no-builtin-db'];
  try {
    const preset = installStatics.buildPresetValuesFromFlags({
      'builtin-db': false,
    });
    expect(preset.builtinDb).toBe(false);
  } finally {
    process.argv = originalArgv;
  }

  process.argv = ['node', 'nb', 'install', '--db-host', 'db.example.com'];
  try {
    const preset = installStatics.buildPresetValuesFromFlags({
      'builtin-db': true,
      'db-host': 'db.example.com',
    });
    expect(preset.dbHost).toBe('db.example.com');
    expect(preset.builtinDb).toBe(false);
  } finally {
    process.argv = originalArgv;
  }
});
