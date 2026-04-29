/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  runPromptCatalog: vi.fn(),
  getEnv: vi.fn(),
  validateExternalDbConfig: vi.fn(async () => undefined),
  promptInfo: vi.fn(),
  promptStep: vi.fn(),
  promptWarn: vi.fn(),
  promptIntro: vi.fn(),
  promptOutro: vi.fn(),
  promptCancel: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.validateExternalDbConfig.mockReset();
  mocks.validateExternalDbConfig.mockResolvedValue(undefined);
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
  };
});

vi.mock('@clack/prompts', () => ({
  intro: mocks.promptIntro,
  log: {
    info: mocks.promptInfo,
    step: mocks.promptStep,
    warn: mocks.promptWarn,
  },
  outro: mocks.promptOutro,
  cancel: mocks.promptCancel,
}));

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
      fetchSource: false,
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
  expect(saveInstalledEnv.mock.invocationCallOrder[0]).toBeGreaterThan(collectPromptResults.mock.invocationCallOrder[0]);
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
      fetchSource: false,
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
  const installDockerApp = vi.fn(async () => ({
    containerName: 'nb-chen-app1-app',
    appPort: '13080',
    appKey: 'app-key',
    timeZone: 'Asia/Shanghai',
  }));
  const runCommand = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
      fetchSource: true,
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
    installDockerApp,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(waitForAppHealthCheck).toHaveBeenCalledTimes(1);
  expect(runCommand.mock.calls).toEqual([
    ['env:auth', ['app1']],
    ['env:update', ['app1']],
  ]);
});

test('install syncs token env connection after the app becomes ready without oauth login', async () => {
  const { default: Install } = await import('../commands/install.js');

  const saveInstalledEnv = vi.fn(async () => undefined);
  const waitForAppHealthCheck = vi.fn(async () => undefined);
  const downloadLocalApp = vi.fn(async () => '/tmp/app1/source');
  const startLocalApp = vi.fn(async () => ({
    appPort: '13080',
    appKey: 'app-key',
    timeZone: 'Asia/Shanghai',
  }));
  const runCommand = vi.fn(async () => undefined);
  const collectPromptResults = vi.fn(async () => ({
    envName: 'app1',
    envResults: {},
    appResults: {
      appPort: '13080',
      storagePath: './app1/storage/',
      fetchSource: true,
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
    startLocalApp,
    commandStdio: vi.fn(() => 'ignore'),
    config: { runCommand },
  });

  await Install.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['env:update', ['app1']],
  ]);
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
      fetchSource: false,
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
  ).collectPromptResults.call(command, {
    resume: true,
    env: 'app1',
    yes: false,
    force: false,
    'fetch-source': false,
    'builtin-db': false,
  }, false);

  expect(mocks.getEnv.mock.calls.length).toBe(1);
  expect(mocks.getEnv.mock.calls[0]).toEqual([
    'app1',
    { scope: 'global' },
  ]);
  expect(result.envName).toBe('app1');
  expect(result.appResults.appRootPath).toBe('./app1/source/');
  expect(result.appResults.appPort).toBe('13080');
  expect(result.appResults.storagePath).toBe('./app1/storage/');
  expect(result.appResults.fetchSource).toBe(true);
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
  ).collectPromptResults.call(command, {
    resume: true,
    env: 'app8',
    yes: false,
    force: false,
    'fetch-source': false,
    'builtin-db': false,
  }, false);

  expect(result.downloadResults.source).toBe('git');
  expect(result.downloadResults.version).toBe('other');
  expect(result.downloadResults.otherVersion).toBe('next');
});

test('install --resume fails with a clear message when the env is missing', async () => {
  const { default: Install } = await import('../commands/install.js');

  mocks.getEnv.mockResolvedValue(undefined);

  const command = Object.create(Install.prototype);
  await expect((() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (
            parsed: Record<string, unknown>,
            yes: boolean,
          ) => Promise<unknown>;
        }
      ).collectPromptResults.call(command, {
        resume: true,
        env: 'missing',
        yes: false,
        force: false,
        'fetch-source': false,
        'builtin-db': false,
      }, false))()).rejects.toThrow(/Env "missing" is not configured in this workspace\./);

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
  await expect((() =>
      (
        Install.prototype as unknown as {
          collectPromptResults: (
            parsed: Record<string, unknown>,
            yes: boolean,
          ) => Promise<unknown>;
        }
      ).collectPromptResults.call(command, {
        resume: true,
        env: 'app1',
        yes: true,
        force: false,
        'fetch-source': false,
        'builtin-db': false,
      }, true))()).rejects.toThrow(/These setup-only flags are not saved in the env config: --lang/);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
});

test('install --resume allows reusing the saved docker app port when occupied by the same env container', async () => {
  const { default: Install } = await import('../commands/install.js');

  const commandSucceedsSpy = vi
    .spyOn(Install as unknown as {
      isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
    }, 'isDockerContainerPublishingPort')
    .mockResolvedValue(true);

  const validate = (
    Install.appPrompts.appPort as { validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined> }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    workspaceName: 'nb-chen',
    source: 'docker',
  });

  expect(error).toBe(undefined);
  expect(commandSucceedsSpy).toHaveBeenCalledWith('nb-chen-app25121-app', '53414');
  commandSucceedsSpy.mockRestore();
});

test('install --resume keeps rejecting a port occupied by another resource', async () => {
  const { default: Install } = await import('../commands/install.js');

  const commandSucceedsSpy = vi
    .spyOn(Install as unknown as {
      isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
    }, 'isDockerContainerPublishingPort')
    .mockResolvedValue(false);

  const validate = (
    Install.appPrompts.appPort as { validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined> }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    workspaceName: 'nb-chen',
    source: 'docker',
  });

  expect(error ?? '').toMatch(/already in use/i);
  commandSucceedsSpy.mockRestore();
});

test('install --resume allows reusing the saved built-in db port when occupied by the same env container', async () => {
  const { default: Install } = await import('../commands/install.js');

  const commandSucceedsSpy = vi
    .spyOn(Install as unknown as {
      isDockerContainerPublishingPort: (containerName: string, port: string) => Promise<boolean>;
    }, 'isDockerContainerPublishingPort')
    .mockResolvedValue(true);

  const validate = (
    Install.dbPrompts.dbPort as { validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined> }
  ).validate;

  const error = await validate('53414', {
    resume: true,
    env: 'app25121',
    workspaceName: 'nb-chen',
    source: 'git',
    builtinDb: true,
    dbDialect: 'postgres',
  });

  expect(error).toBe(undefined);
  expect(commandSucceedsSpy).toHaveBeenCalledWith('nb-chen-app25121-postgres', '53414');
  commandSucceedsSpy.mockRestore();
});

test('install --resume allows reusing the saved local app port when occupied by the same pm2 process', async () => {
  const { default: Install } = await import('../commands/install.js');

  const workspaceSpy = vi
    .spyOn(Install as unknown as {
      resolveResumeWorkspaceName: (envName: string) => Promise<string | undefined>;
    }, 'resolveResumeWorkspaceName')
    .mockResolvedValue('nb-chen');
  const localPortSpy = vi
    .spyOn(Install as unknown as {
      isLocalPm2ProcessUsingPort: (appRootPath: string, port: string) => Promise<boolean>;
    }, 'isLocalPm2ProcessUsingPort')
    .mockResolvedValue(true);

  const validate = (
    Install.appPrompts.appPort as { validate: (value: unknown, values: Record<string, unknown>) => Promise<string | undefined> }
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
  workspaceSpy.mockRestore();
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
