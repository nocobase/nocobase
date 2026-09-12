/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, test, vi, expect } from 'vitest';
import { deleteCliConfigValue, setCliConfigValue } from '../lib/cli-config.js';

const mocks = vi.hoisted(() => ({
  runPromptCatalog: vi.fn(),
  getEnv: vi.fn(),
  upsertEnv: vi.fn(),
  setCurrentEnv: vi.fn(),
  clearEnvRootSetup: vi.fn(),
  validateExternalDbConfig: vi.fn(async () => undefined),
  validateMysqlLowerCaseTableNamesCompatibility: vi.fn(async () => undefined),
  printInfo: vi.fn(),
  printWarning: vi.fn(),
}));

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.getEnv.mockReset();
  mocks.getEnv.mockResolvedValue(undefined);
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.setCurrentEnv.mockResolvedValue(undefined);
  mocks.clearEnvRootSetup.mockResolvedValue(true);
  mocks.validateExternalDbConfig.mockReset();
  mocks.validateExternalDbConfig.mockResolvedValue(undefined);
  mocks.validateMysqlLowerCaseTableNamesCompatibility.mockReset();
  mocks.validateMysqlLowerCaseTableNamesCompatibility.mockResolvedValue(undefined);
  await deleteCliConfigValue('default-api-host');
});

vi.mock('../lib/prompt-catalog.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-catalog.js')>();
  return {
    ...actual,
    runPromptCatalog: mocks.runPromptCatalog,
  };
});

vi.mock('../lib/auth-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth-store.js')>();
  return {
    ...actual,
    getEnv: (...args: Parameters<typeof actual.getEnv>) => {
      const impl = mocks.getEnv.getMockImplementation();
      if (impl) {
        return mocks.getEnv(...args);
      }
      return actual.getEnv(...args);
    },
    upsertEnv: (...args: Parameters<typeof actual.upsertEnv>) => {
      if (mocks.upsertEnv.mock.calls.length || mocks.upsertEnv.getMockImplementation()) {
        return mocks.upsertEnv(...args);
      }
      return actual.upsertEnv(...args);
    },
    setCurrentEnv: (...args: Parameters<typeof actual.setCurrentEnv>) => {
      if (mocks.setCurrentEnv.mock.calls.length || mocks.setCurrentEnv.getMockImplementation()) {
        return mocks.setCurrentEnv(...args);
      }
      return actual.setCurrentEnv(...args);
    },
    clearEnvRootSetup: (...args: Parameters<typeof actual.clearEnvRootSetup>) => {
      if (mocks.clearEnvRootSetup.mock.calls.length || mocks.clearEnvRootSetup.getMockImplementation()) {
        return mocks.clearEnvRootSetup(...args);
      }
      return actual.clearEnvRootSetup(...args);
    },
  };
});

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    printInfo: mocks.printInfo,
    printWarning: mocks.printWarning,
  };
});

vi.mock('../lib/prompt-validators.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-validators.js')>();
  return {
    ...actual,
    validateAvailableTcpPort: vi.fn(async (value) => {
      return String(value ?? '').trim() === '53414'
        ? 'Port 53414 is already in use.'
        : await actual.validateAvailableTcpPort(value);
    }),
  };
});

vi.mock('../lib/db-connection-check.ts', () => ({
  validateExternalDbConfig: mocks.validateExternalDbConfig,
  validateMysqlLowerCaseTableNamesCompatibility: mocks.validateMysqlLowerCaseTableNamesCompatibility,
}));

test('install saves env config immediately after collecting prompt results for fresh installs', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand: vi.fn(async () => undefined) },
  });

  await Install.prototype.run.call(command);

  expect(collectPromptResults).toHaveBeenCalledTimes(1);
  expect(saveInstalledEnv).toHaveBeenCalledTimes(1);
  expect(saveInstalledEnv.mock.invocationCallOrder[0]).toBeGreaterThan(
    collectPromptResults.mock.invocationCallOrder[0],
  );
  expect(saveInstalledEnv.mock.calls[0]?.[0].appResults).toMatchObject({
    timeZone: expect.any(String),
  });
  expect(String(saveInstalledEnv.mock.calls[0]?.[0].appResults.appKey ?? '')).toMatch(/^[a-f0-9]{64}$/);
  expect(waitForAppHealthCheck).not.toHaveBeenCalled();
});

test('install --resume does not save env config immediately after collecting prompt results', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: true,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand: vi.fn(async () => undefined) },
  });

  await Install.prototype.run.call(command);

  expect(collectPromptResults).toHaveBeenCalledTimes(1);
  expect(saveInstalledEnv).not.toHaveBeenCalled();
  expect(waitForAppHealthCheck).not.toHaveBeenCalled();
});

test('install syncs oauth env connection after the app becomes ready', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadManagedSource = vi.fn(async () => undefined);
  const runCommand = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {
      source: 'docker',
    },
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    downloadManagedSource,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(waitForAppHealthCheck).not.toHaveBeenCalled();
  expect(runCommand.mock.calls).toEqual([
    ['app:start', ['--env', 'app1', '--yes', '--no-sync-licensed-plugins', '--hook-command', 'init']],
    ['env:auth', ['app1']],
    ['env:update', ['app1']],
  ]);
});

test('install saves the resolved app url before delegating startup', async () => {
  const { default: Install } = await import('../commands/install.js');

  await setCliConfigValue('default-api-host', '192.168.1.10');

  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadManagedSource = vi.fn(async () => undefined);
  const runCommand = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {
      source: 'docker',
    },
    dbResults: {},
    rootResults: {},
    envAddResults: {
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    waitForAppHealthCheck,
    downloadManagedSource,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(mocks.upsertEnv.mock.calls.at(-1)?.[1]).toMatchObject({
    apiBaseUrl: 'http://192.168.1.10:13080/api',
    appPort: '13080',
  });
  expect(runCommand.mock.calls[0]).toEqual([
    'app:start',
    ['--env', 'app1', '--yes', '--no-sync-licensed-plugins', '--hook-command', 'init'],
  ]);
});

test('install syncs token env connection after the app becomes ready without oauth login', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadLocalApp = vi.fn(async () => '/tmp/app1/source');
  const runCommand = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {
      source: 'git',
    },
    dbResults: {},
    rootResults: {},
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'token',
      accessToken: 'token-123',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    downloadLocalApp,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:start', ['--env', 'app1', '--yes', '--no-sync-licensed-plugins', '--hook-command', 'init']],
    ['env:update', ['app1']],
  ]);
  expect(mocks.clearEnvRootSetup).toHaveBeenCalledWith('app1', { scope: 'global' });
});

test('install run validates external db config before saving env config', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
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
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand: vi.fn(async () => undefined) },
  });

  await Install.prototype.run.call(command);

  expect(mocks.validateExternalDbConfig).toHaveBeenCalledTimes(1);
  expect(saveInstalledEnv).toHaveBeenCalledTimes(1);
  expect(mocks.validateExternalDbConfig.mock.invocationCallOrder[0]).toBeLessThan(
    saveInstalledEnv.mock.invocationCallOrder[0],
  );
});

test('install --prepare-only defers local app download without starting the app or clearing root setup data', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadLocalApp = vi.fn(async () => '/tmp/app1');
  const startLocalApp = vi.fn(async () => ({
    source: 'npm',
    projectRoot: '/tmp/app1',
    appPort: '13080',
    storagePath: './app1/storage/',
    appKey: 'app-key',
    timeZone: 'UTC',
    env: {},
    args: ['start'],
  }));
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      lang: 'en-US',
      appPort: '13080',
      storagePath: './app1/storage/',
    },
    downloadResults: {
      source: 'npm',
    },
    dbResults: {},
    rootResults: {
      rootUsername: 'admin',
      rootPassword: 'admin123',
    },
    envAddResults: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'oauth',
    },
  }));

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: false,
        force: false,
        verbose: false,
        'no-intro': true,
        'prepare-only': true,
      },
    })),
    collectPromptResults,
    saveInstalledEnv,
    waitForAppHealthCheck,
    downloadLocalApp,
    startLocalApp,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand: vi.fn(async () => undefined) },
  });

  await Install.prototype.run.call(command);

  expect(downloadLocalApp).not.toHaveBeenCalled();
  expect(startLocalApp).not.toHaveBeenCalled();
  expect(waitForAppHealthCheck).not.toHaveBeenCalled();
  expect(mocks.clearEnvRootSetup).not.toHaveBeenCalled();
  expect(saveInstalledEnv).toHaveBeenCalled();
  expect(saveInstalledEnv.mock.calls.at(-1)?.[0].appResults).toMatchObject({
    setupState: 'prepared',
  });
});

test('install seeds basic auth credentials as prompt defaults instead of fixed values', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.runPromptCatalog
    .mockResolvedValueOnce({ env: 'app1' })
    .mockResolvedValueOnce({
      appPort: '13080',
      storagePath: './app1/storage/',
    })
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce({
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
    })
    .mockImplementationOnce(async (_catalog, options) => {
      expect(options.initialValues).toMatchObject({
        apiBaseUrl: 'http://127.0.0.1:13080/api',
        username: 'nocobase',
        password: 'admin123',
      });
      expect(options.values).toMatchObject({
        name: 'app1',
        authType: 'basic',
      });
      expect(options.values).not.toHaveProperty('username');
      expect(options.values).not.toHaveProperty('password');

      return {
        apiBaseUrl: 'http://127.0.0.1:13080/api',
        authType: 'basic',
        username: 'prompted-admin',
        password: 'prompted-password',
      };
    });

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        envAddResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(
    command,
    {
      env: 'app1',
      resume: false,
      yes: false,
      force: false,
      'skip-download': false,
      'builtin-db': false,
      'auth-type': 'basic',
    },
    false,
  );

  expect(result.envAddResults).toMatchObject({
    apiBaseUrl: 'http://127.0.0.1:13080/api',
    authType: 'basic',
    username: 'prompted-admin',
    password: 'prompted-password',
  });
});

test('install --resume reuses the saved workspace env config for prompt values', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      auth: {
        type: 'token',
        accessToken: 'resume-token',
      },
      source: 'docker',
      downloadVersion: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/arm64',
      appRootPath: './app1/source/',
      appPort: '13080',
      storagePath: './app1/storage/',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: 'app1-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
      build: false,
      buildDts: true,
    },
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    ...(options.initialValues ?? {}),
    ...(options.values ?? {}),
  }));

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
        envAddResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(
    command,
    {
      resume: true,
      env: 'app1',
      yes: false,
      force: false,
      'skip-download': false,
      'builtin-db': false,
    },
    false,
  );

  expect(mocks.getEnv.mock.calls.length).toBe(1);
  expect(mocks.getEnv.mock.calls[0]).toEqual(['app1', { scope: 'global' }]);
  expect(result.envName).toBe('app1');
  expect(result.appResults.appRootPath).toBe('./app1/source/');
  expect(result.appResults.appPort).toBe('13080');
  expect(result.appResults.storagePath).toBe('./app1/storage/');
  expect(result.downloadResults.source).toBe('docker');
  expect(result.downloadResults.version).toBe('alpha');
  expect(result.downloadResults.dockerRegistry).toBe('nocobase/nocobase');
  expect(result.downloadResults.dockerPlatform).toBe('linux/arm64');
  expect(result.downloadResults.build).toBe(false);
  expect(result.downloadResults.buildDts).toBe(true);
  expect(result.dbResults.builtinDb).toBe(true);
  expect(result.dbResults.dbDialect).toBe('postgres');
  expect(result.dbResults.builtinDbImage).toBe('registry.example.com/postgres:16');
  expect(result.dbResults.dbHost).toBe('app1-postgres');
  expect(result.dbResults.dbPort).toBe('5432');
  expect(result.dbResults.dbDatabase).toBe('nocobase');
  expect(result.dbResults.dbUser).toBe('nocobase');
  expect(result.dbResults.dbPassword).toBe('secret');
  expect(result.rootResults.rootUsername).toBe('admin');
  expect(result.rootResults.rootEmail).toBe('admin@nocobase.com');
  expect(result.rootResults.rootPassword).toBe('admin123');
  expect(result.rootResults.rootNickname).toBe('Admin');
  expect(result.envAddResults.authType).toBe('token');
  expect(result.envAddResults.accessToken).toBe('resume-token');
  expect(result.envAddResults.apiBaseUrl).toBe('http://127.0.0.1:13080/api');
});

test('install reuses saved appKey and timezone before resuming docker startup', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      appKey: 'saved-app-key',
      timezone: 'Asia/Shanghai',
    },
  });

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadManagedSource = vi.fn(async () => undefined);
  const runCommand = vi.fn(async () => undefined);

  const command = Object.assign(Object.create(Install.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        resume: true,
        force: false,
        verbose: false,
        'no-intro': true,
      },
    })),
    collectPromptResults: vi.fn(async () => ({
      envName: 'app1',
      envResults: {},
      appResults: {
        appPort: '13080',
        storagePath: './app1/storage/',
      },
      downloadResults: {
        source: 'docker',
      },
      dbResults: {},
      rootResults: {},
      envAddResults: {
        apiBaseUrl: 'http://127.0.0.1:13080/api',
        authType: 'oauth',
      },
    })),
    saveInstalledEnv,
    waitForAppHealthCheck,
    downloadManagedSource,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(saveInstalledEnv.mock.calls.at(-1)?.[0].appResults).toMatchObject({
    appKey: 'saved-app-key',
    timeZone: 'Asia/Shanghai',
  });
  expect(runCommand.mock.calls[0]).toEqual([
    'app:start',
    ['--env', 'app1', '--yes', '--no-sync-licensed-plugins', '--hook-command', 'init'],
  ]);
});

test('install --resume keeps saved basic auth credentials editable in prompts', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      apiBaseUrl: 'http://127.0.0.1:13080/api',
      authType: 'basic',
      authUsername: 'saved-admin',
      source: 'docker',
      downloadVersion: 'alpha',
      dockerRegistry: 'nocobase/nocobase',
      dockerPlatform: 'linux/arm64',
      appRootPath: './app1/source/',
      appPort: '13080',
      storagePath: './app1/storage/',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: 'app1-postgres',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
      build: false,
      buildDts: true,
    },
  });

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => {
    if (
      options.initialValues &&
      Object.prototype.hasOwnProperty.call(options.initialValues, 'apiBaseUrl') &&
      options.values?.name === 'app1'
    ) {
      expect(options.initialValues).toMatchObject({
        apiBaseUrl: 'http://127.0.0.1:13080/api',
        authType: 'basic',
        username: 'saved-admin',
        password: 'admin123',
      });
      expect(options.values).toMatchObject({
        name: 'app1',
      });
      expect(options.values).not.toHaveProperty('username');
      expect(options.values).not.toHaveProperty('password');

      return {
        ...(options.initialValues ?? {}),
        ...(options.values ?? {}),
        username: 'updated-admin',
        password: 'updated-password',
      };
    }

    return {
      ...(options.initialValues ?? {}),
      ...(options.values ?? {}),
    };
  });

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        envAddResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(
    command,
    {
      resume: true,
      env: 'app1',
      yes: false,
      force: false,
      'skip-download': false,
      'builtin-db': false,
    },
    false,
  );

  expect(result.envAddResults).toMatchObject({
    authType: 'basic',
    username: 'updated-admin',
    password: 'updated-password',
  });
});

test('install --resume maps arbitrary saved download versions to otherVersion prompt values', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app8',
    config: {
      source: 'git',
      downloadVersion: 'next',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      appRootPath: './app8/source/',
      appPort: '13080',
      storagePath: './app8/storage/',
    },
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    ...(options.initialValues ?? {}),
    ...(options.values ?? {}),
  }));

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        downloadResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(
    command,
    {
      resume: true,
      env: 'app8',
      yes: false,
      force: false,
      'skip-download': false,
      'builtin-db': false,
    },
    false,
  );

  expect(result.downloadResults.source).toBe('git');
  expect(result.downloadResults.version).toBe('other');
  expect(result.downloadResults.otherVersion).toBe('next');
});

test('install --resume --yes keeps saved download source and version from env config', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'missingp006102423',
    config: {
      source: 'npm',
      downloadVersion: 'not-a-real-version',
      appPath: './missingp006102423/',
      appPort: '52976',
      appPublicPath: '/',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'postgres:16',
      dbPort: '52977',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'nocobase',
      dbUnderscored: false,
      setupState: 'prepared',
      lang: 'en-US',
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
      apiBaseUrl: 'http://127.0.0.1:52976/api',
    },
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    ...(options.initialValues ?? {}),
    ...(options.values ?? {}),
  }));

  const command = Object.create(Install.prototype);
  const result = await (
    Install.prototype as unknown as {
      collectPromptResults: (
        parsed: Record<string, unknown>,
        yes: boolean,
      ) => Promise<{
        downloadResults: Record<string, unknown>;
      }>;
    }
  ).collectPromptResults.call(
    command,
    {
      resume: true,
      env: 'missingp006102423',
      yes: true,
      force: false,
      'skip-download': false,
      'builtin-db': true,
    },
    true,
  );

  expect(result.downloadResults.source).toBe('npm');
  expect(result.downloadResults.version).toBe('other');
  expect(result.downloadResults.otherVersion).toBe('not-a-real-version');
});

test('install --resume fails with a clear message when the env is missing', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue(undefined);

  const command = Object.create(Install.prototype);
  await expect(
    (() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (parsed: Record<string, unknown>, yes: boolean) => Promise<unknown>;
        }
      ).collectPromptResults.call(
        command,
        {
          resume: true,
          env: 'missing',
          yes: false,
          force: false,
          'skip-download': false,
          'builtin-db': false,
        },
        false,
      ))(),
  ).rejects.toThrow(/Env "missing" is not configured in this workspace\./);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
});

test('install --resume --yes requires only setup-only flags that are not saved in env config', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue({
    name: 'app1',
    config: {
      source: 'docker',
      appRootPath: './app1/source/',
      appPort: '13080',
      storagePath: './app1/storage/',
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
    },
  });

  const command = Object.create(Install.prototype);
  await expect(
    (() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (parsed: Record<string, unknown>, yes: boolean) => Promise<unknown>;
        }
      ).collectPromptResults.call(
        command,
        {
          resume: true,
          env: 'app1',
          yes: true,
          force: false,
          'skip-download': false,
          'builtin-db': false,
        },
        true,
      ))(),
  ).rejects.toThrow(/These setup-only flags are not saved in the env config: --lang/);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
});

test('install --resume allows reusing the saved docker app port when occupied by the same env container', async () => {
  const { default: Install } = await import('../commands/install.js');

  const prefixSpy = vi
    .spyOn(
      Install as unknown as {
        resolveResumeDockerContainerPrefix: () => Promise<string | undefined>;
      },
      'resolveResumeDockerContainerPrefix',
    )
    .mockResolvedValue('nb-chen');
  const commandSucceedsSpy = vi
    .spyOn(
      Install as unknown as {
        isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
      },
      'isDockerContainerPublishingPort',
    )
    .mockResolvedValue(true);

  const validate = (
    Install.appPrompts.appPort as {
      validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined>;
    }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    source: 'docker',
  });

  expect(error).toBe(undefined);
  expect(commandSucceedsSpy).toHaveBeenCalledWith('nb-chen-app25121-app', '53414');
  commandSucceedsSpy.mockRestore();
  prefixSpy.mockRestore();
});

test('install --resume keeps rejecting a port occupied by another resource', async () => {
  const { default: Install } = await import('../commands/install.js');

  const prefixSpy = vi
    .spyOn(
      Install as unknown as {
        resolveResumeDockerContainerPrefix: () => Promise<string | undefined>;
      },
      'resolveResumeDockerContainerPrefix',
    )
    .mockResolvedValue('nb-chen');
  const commandSucceedsSpy = vi
    .spyOn(
      Install as unknown as {
        isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
      },
      'isDockerContainerPublishingPort',
    )
    .mockResolvedValue(false);

  const validate = (
    Install.appPrompts.appPort as {
      validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined>;
    }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    source: 'docker',
  });

  expect(error ?? '').toMatch(/already in use/i);
  commandSucceedsSpy.mockRestore();
  prefixSpy.mockRestore();
});

test('install --resume allows reusing the saved built-in db port when occupied by the same env container', async () => {
  const { default: Install } = await import('../commands/install.js');

  const prefixSpy = vi
    .spyOn(
      Install as unknown as {
        resolveResumeDockerContainerPrefix: () => Promise<string | undefined>;
      },
      'resolveResumeDockerContainerPrefix',
    )
    .mockResolvedValue('nb-chen');
  const commandSucceedsSpy = vi
    .spyOn(
      Install as unknown as {
        isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
      },
      'isDockerContainerPublishingPort',
    )
    .mockResolvedValue(true);

  const validate = (
    Install.dbPrompts.dbPort as {
      validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined>;
    }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    source: 'git',
    builtinDb: true,
    dbDialect: 'postgres',
  });

  expect(error).toBe(undefined);
  expect(commandSucceedsSpy).toHaveBeenCalledWith('nb-chen-app25121-postgres', '53414');
  commandSucceedsSpy.mockRestore();
  prefixSpy.mockRestore();
});

test('install --resume allows reusing the saved local app port when occupied by the same pm2 process', async () => {
  const { default: Install } = await import('../commands/install.js');

  const localPortSpy = vi
    .spyOn(
      Install as unknown as {
        isLocalPm2ProcessUsingPort: (appRootPath: string, port: string) => Promise<boolean>;
      },
      'isLocalPm2ProcessUsingPort',
    )
    .mockResolvedValue(true);

  const validate = (
    Install.appPrompts.appPort as {
      validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined>;
    }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    source: 'git',
    appRootPath: './app25121/source/',
  });

  expect(error).toBe(undefined);
  expect(localPortSpy).toHaveBeenCalledWith('./app25121/source/', '53414');
  localPortSpy.mockRestore();
});

test('install app prompt catalog seeds resume=true when resuming', async () => {
  const { default: Install } = await import('../commands/install.js');

  const catalog = (
    Install as unknown as {
      buildAppPromptsCatalog: (seedEnv: string, options?: { resume?: boolean }) => Record<string, unknown>;
    }
  ).buildAppPromptsCatalog('app25121', { resume: true });

  const values: Record<string, string | boolean> = {};
  await (catalog.seedResume as { run: (values: Record<string, string | boolean>) => Promise<void> | void }).run(values);

  expect(values.resume).toBe(true);
});

test('saveInstalledEnv switches current env after persisting the final env config', async () => {
  const { default: Install } = await import('../commands/install.js');

  const command = Object.create(Install.prototype) as InstanceType<typeof Install>;

  await (
    Install.prototype as unknown as {
      saveInstalledEnv: (params: {
        envName: string;
        appResults: Record<string, unknown>;
        downloadResults: Record<string, unknown>;
        dbResults: Record<string, unknown>;
        rootResults: Record<string, unknown>;
        envAddResults: Record<string, unknown>;
      }) => Promise<void>;
    }
  ).saveInstalledEnv.call(command, {
    envName: 'app1',
    appResults: {},
    downloadResults: {},
    dbResults: {},
    rootResults: {},
    envAddResults: {},
  });

  expect(mocks.upsertEnv).toHaveBeenCalledTimes(1);
  expect(mocks.setCurrentEnv).toHaveBeenCalledWith('app1', { scope: 'global' });
  expect(mocks.upsertEnv.mock.invocationCallOrder[0]).toBeLessThan(mocks.setCurrentEnv.mock.invocationCallOrder[0]);
});
