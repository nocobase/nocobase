/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  runPromptCatalogWebUI: vi.fn(),
  runPromptCatalog: vi.fn(),
  runNpm: vi.fn(),
  getEnv: vi.fn(),
  upsertEnv: vi.fn(),
  promptInfo: vi.fn(),
  promptWarn: vi.fn(),
  promptStep: vi.fn(),
  promptError: vi.fn(),
  promptIntro: vi.fn(),
  promptOutro: vi.fn(),
  promptCancel: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NB_LOCALE = 'en-US';
  mocks.upsertEnv.mockResolvedValue(undefined);
});

const originalNbLocale = process.env.NB_LOCALE;

afterEach(() => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
    return;
  }
  process.env.NB_LOCALE = originalNbLocale;
});

vi.mock('../lib/prompt-web-ui.ts', () => ({
  runPromptCatalogWebUI: mocks.runPromptCatalogWebUI,
}));

vi.mock('../lib/auth-store.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth-store.js')>();
  return {
    ...actual,
    getEnv: (...args: Parameters<typeof actual.getEnv>) => {
      const impl = mocks.getEnv.getMockImplementation();
      if (impl) {
        return impl(...args);
      }
      return actual.getEnv(...args);
    },
    upsertEnv: (...args: Parameters<typeof actual.upsertEnv>) => {
      if (mocks.upsertEnv.mock.calls.length || mocks.upsertEnv.getMockImplementation()) {
        return mocks.upsertEnv(...args);
      }
      return actual.upsertEnv(...args);
    },
  };
});

vi.mock('../lib/prompt-catalog.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-catalog.js')>();
  return {
    ...actual,
    runPromptCatalog: mocks.runPromptCatalog,
  };
});

vi.mock('../lib/run-npm.ts', () => ({
  run: mocks.runNpm,
}));

vi.mock('@clack/prompts', () => ({
  intro: mocks.promptIntro,
  log: {
    info: mocks.promptInfo,
    warn: mocks.promptWarn,
    step: mocks.promptStep,
    error: mocks.promptError,
  },
  outro: mocks.promptOutro,
  cancel: mocks.promptCancel,
}));

test('nb init continues from the browser UI result and runs env:add for an existing app', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalogWebUI.mockResolvedValue({
    appName: 'staging',
    hasNocobase: 'yes',
    installSkills: false,
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => options.values ?? {});
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const parse = vi.fn(async () => ({
    flags: {
      ui: true,
      yes: false,
      'ui-host': '127.0.0.1',
      'ui-port': 0,
    },
  }));
  const log = vi.fn();
  const error = vi.fn((message: string) => {
    throw new Error(`unexpected error: ${message}`);
  });
  const exit = vi.fn((code?: number) => {
    throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
  });

  const command = Object.assign(Object.create(Init.prototype), {
    parse,
    config: { runCommand },
    log,
    error,
    exit,
  });

  await Init.prototype.run.call(command);

  expect(mocks.promptIntro).toHaveBeenCalledWith('Set Up Your NocoBase AI Workspace');
  expect(mocks.runPromptCatalogWebUI.mock.calls.length).toBe(1);
  expect(mocks.promptInfo).toHaveBeenCalledWith(
    'A local setup form will open in your browser. That form needs a person to fill it in. If you are using an AI agent, do not stop this process while the CLI waits for the submission.',
  );
  const webUiOptions = mocks.runPromptCatalogWebUI.mock.calls[0]?.[0];
  expect(typeof webUiOptions?.onServerStart).toBe('function');
  webUiOptions?.onServerStart?.({
    host: '127.0.0.1',
    port: 60128,
    url: 'http://127.0.0.1:60128/',
  });
  expect(mocks.promptStep).toHaveBeenCalledWith('Local setup form is ready.');
  expect(mocks.promptInfo).toHaveBeenCalledWith(
    'If your browser does not open automatically, copy the URL below into your browser to continue. Keep this terminal session running while the CLI waits for the submission.',
  );
  expect(log).toHaveBeenCalledWith('URL: http://127.0.0.1:60128/');
  expect(mocks.runPromptCatalog.mock.calls.length).toBe(1);
  expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values).toEqual({
    appName: 'staging',
    hasNocobase: 'yes',
    installSkills: false,
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.yes).toBe(true);
  expect(mocks.runNpm.mock.calls.length).toBe(0);
  expect(runCommand.mock.calls).toEqual([
    [
      'env:add',
      [
        'staging',
        '--no-intro',
        '--scope',
        'project',
        '--api-base-url',
        'http://localhost:13000/api',
        '--auth-type',
        'token',
        '--access-token',
        'secret-token',
      ],
    ],
  ]);
});

test('nb init shows a concise fallback message when the setup browser cannot be opened automatically', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalogWebUI.mockResolvedValue({
    appName: 'staging',
    hasNocobase: 'yes',
    installSkills: false,
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => options.values ?? {});

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        ui: true,
        yes: false,
        'ui-host': '127.0.0.1',
        'ui-port': 0,
      },
    })),
    config: { runCommand: vi.fn(async () => undefined) },
    log: vi.fn(),
    error: vi.fn((message: string) => {
      throw new Error(`unexpected error: ${message}`);
    }),
    exit: vi.fn((code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    }),
  });

  await Init.prototype.run.call(command);

  const webUiOptions = mocks.runPromptCatalogWebUI.mock.calls[0]?.[0];
  expect(typeof webUiOptions?.onOpenBrowserError).toBe('function');
  webUiOptions?.onOpenBrowserError?.('http://127.0.0.1:60128/', new Error('open failed'));
  expect(mocks.promptWarn).toHaveBeenCalledWith(
    'We could not open your browser automatically. Copy the URL above into your browser to continue setup, and keep this terminal session running. If you are using an AI agent, do not stop the current process.',
  );
});

test('nb init localizes the browser UI intro title', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalogWebUI.mockResolvedValue({
    appName: 'staging',
    hasNocobase: 'yes',
    installSkills: false,
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => options.values ?? {});

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        ui: true,
        yes: false,
        locale: 'zh-CN',
        'ui-host': '127.0.0.1',
        'ui-port': 0,
      },
    })),
    config: { runCommand: vi.fn(async () => undefined) },
    log: vi.fn(),
    error: vi.fn((message: string) => {
      throw new Error(`unexpected error: ${message}`);
    }),
    exit: vi.fn((code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    }),
  });

  await Init.prototype.run.call(command);

  expect(mocks.promptIntro).toHaveBeenCalledWith('初始化你的 NocoBase AI 工作区');
});

test('nb init forwards download options to nb install for a new app flow', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalogWebUI.mockResolvedValue({
    appName: 'demoapp',
    hasNocobase: 'no',
    installSkills: false,
    lang: 'en-US',
    appRootPath: './apps/demoapp',
    appPort: '13080',
    storagePath: './storage/demoapp',
    fetchSource: true,
    source: 'git',
    version: 'beta',
    gitUrl: 'https://github.com/nocobase/nocobase.git',
    outputDir: './apps/demoapp',
    replace: true,
    npmRegistry: 'https://registry.npmmirror.com',
    builtinDb: true,
    dbDialect: 'postgres',
    builtinDbImage: 'registry.example.com/postgres:16',
    dbHost: '127.0.0.1',
    dbPort: '5432',
    dbDatabase: 'demoapp',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    rootUsername: 'admin',
    rootEmail: 'admin@nocobase.com',
    rootPassword: 'admin123',
    rootNickname: 'Admin',
  });
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => options.values ?? {});
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const parse = vi.fn(async () => ({
    flags: {
      ui: true,
      yes: false,
      'ui-host': '127.0.0.1',
      'ui-port': 0,
    },
  }));
  const log = vi.fn();
  const error = vi.fn((message: string) => {
    throw new Error(`unexpected error: ${message}`);
  });
  const exit = vi.fn((code?: number) => {
    throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
  });

  const command = Object.assign(Object.create(Init.prototype), {
    parse,
    config: { runCommand },
    log,
    error,
    exit,
  });

  await Init.prototype.run.call(command);

  expect(mocks.runNpm.mock.calls.length).toBe(0);
  expect(mocks.upsertEnv.mock.calls).toEqual([[
    'demoapp',
    {
      baseUrl: 'http://127.0.0.1:13080/api',
      source: 'git',
      downloadVersion: 'beta',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      npmRegistry: 'https://registry.npmmirror.com',
      appRootPath: './apps/demoapp',
      storagePath: './storage/demoapp',
      appPort: '13080',
      builtinDb: true,
      dbDialect: 'postgres',
      builtinDbImage: 'registry.example.com/postgres:16',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'demoapp',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    { scope: 'project' },
  ]]);
  expect(runCommand.mock.calls).toEqual([
    [
      'install',
      [
        '-y',
        '--no-intro',
        '--env',
        'demoapp',
        '--lang',
        'en-US',
        '--app-root-path',
        './apps/demoapp',
        '--app-port',
        '13080',
        '--storage-path',
        './storage/demoapp',
        '--fetch-source',
        '--source',
        'git',
        '--version',
        'beta',
        '--output-dir',
        './apps/demoapp',
        '--git-url',
        'https://github.com/nocobase/nocobase.git',
        '--npm-registry',
        'https://registry.npmmirror.com',
        '--replace',
        '--builtin-db',
        '--db-dialect',
        'postgres',
        '--builtin-db-image',
        'registry.example.com/postgres:16',
        '--db-host',
        '127.0.0.1',
        '--db-port',
        '5432',
        '--db-database',
        'demoapp',
        '--db-user',
        'nocobase',
        '--db-password',
        'secret',
        '--root-username',
        'admin',
        '--root-email',
        'admin@nocobase.com',
        '--root-password',
        'admin123',
        '--root-nickname',
        'Admin',
      ],
    ],
  ]);
});

test('nb init saves env config before install starts so failures still leave the env configured', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    appName: 'demoapp',
    hasNocobase: 'no',
    installSkills: false,
    lang: 'en-US',
    appRootPath: './apps/demoapp',
    appPort: '13080',
    storagePath: './storage/demoapp',
    fetchSource: true,
    source: 'docker',
    version: 'alpha',
    dockerRegistry: 'nocobase/nocobase',
    dockerPlatform: 'linux/arm64',
    builtinDb: true,
    dbDialect: 'postgres',
    dbHost: 'demoapp-postgres',
    dbPort: '5432',
    dbDatabase: 'demoapp',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    rootUsername: 'admin',
    rootEmail: 'admin@nocobase.com',
    rootPassword: 'admin123',
    rootNickname: 'Admin',
    ...(options.values ?? {}),
  }));
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async (commandName: string) => {
    if (commandName === 'install') {
      throw new Error('install failed');
    }
    return undefined;
  });

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        ui: false,
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(/install failed/);

  expect(mocks.upsertEnv.mock.calls.length).toBe(1);
  expect(mocks.upsertEnv.mock.invocationCallOrder[0] < runCommand.mock.invocationCallOrder[0]).toBe(true);
});

test('nb init --resume delegates to nb install --resume for the selected env', async () => {
  const { default: Init } = await import('../commands/init.js');

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        resume: true,
        yes: false,
        ui: false,
        'install-skills': false,
        env: 'app1',
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  await Init.prototype.run.call(command);

  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
  expect(runCommand.mock.calls).toEqual([
    [
      'install',
      ['--no-intro', '--env', 'app1', '--resume'],
    ],
  ]);
});

test('nb init installs skills when --install-skills is provided', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--install-skills'];

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    installSkills: true,
    hasNocobase: 'yes',
    appName: 'staging',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'oauth',
    ...(options.values ?? {}),
  }));
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        ui: false,
        'install-skills': true,
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  try {
    await Init.prototype.run.call(command);
  } finally {
    process.argv = originalArgv;
  }

  expect(mocks.runNpm.mock.calls).toEqual([
    ['npx', ['-y', 'skills', 'add', 'nocobase/skills', '-y']],
  ]);
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    ['staging', '--no-intro', '--scope', 'project', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
  ]);
});

test('nb init does not forward the default app port in --yes mode unless it was explicitly provided', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes'];

  try {
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'local',
        lang: 'en-US',
        appRootPath: './nocobase',
        appPort: '13000',
        storagePath: './storage/local',
        fetchSource: false,
      },
      { yes: true },
    );

    expect(argv.includes('--app-port')).toBe(false);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init logs duplicate env validation errors with Clack in --yes mode', async () => {
  const { default: Init } = await import('../commands/init.js');
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => {
    options.hooks?.onMissingNonInteractive?.(
      'Env "local3" already exists in this workspace. Choose another env name.',
    );
    return {};
  });

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        ui: false,
        env: 'local3',
        'app-port': '13000',
      },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    exit: (code?: number) => {
      throw new Error(`exit: ${code ?? 'unknown'}`);
    },
  });

  await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(/exit: 1/);
  expect(mocks.promptError.mock.calls.length).toBe(1);
  expect(String(mocks.promptError.mock.calls[0]?.[0] ?? '')).toMatch(/local3/);
});

test('nb init explains that --env is required when --yes skips prompts', async () => {
  const { default: Init } = await import('../commands/init.js');
  const runCommand = vi.fn(async () => undefined);

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        ui: false,
      },
    })),
    config: {
      runCommand,
    },
    log: vi.fn(),
    exit: (code?: number) => {
      throw new Error(`exit: ${code ?? 'unknown'}`);
    },
  });

  await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(/exit: 1/);
  expect(mocks.runPromptCatalog.mock.calls.length).toBe(0);
  expect(mocks.promptInfo.mock.calls.length).toBe(0);
  expect(mocks.promptWarn.mock.calls.length).toBe(0);
  expect(runCommand.mock.calls.length).toBe(0);
  expect(mocks.promptError.mock.calls.length).toBe(1);
  expect(String(mocks.promptError.mock.calls[0]?.[0] ?? '')).toMatch(/Env name is required when prompts are skipped\..*nb init --yes --env <envName>/s);
});

test('nb init --locale overrides the environment locale for prompt-side messages', async () => {
  const { default: Init } = await import('../commands/init.js');
  const runCommand = vi.fn(async () => undefined);
  process.env.NB_LOCALE = 'zh-CN';

  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        ui: false,
        locale: 'en-US',
      },
    })),
    config: {
      runCommand,
    },
    log: vi.fn(),
    exit: (code?: number) => {
      throw new Error(`exit: ${code ?? 'unknown'}`);
    },
  });

  await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(/exit: 1/);
  expect(mocks.promptError.mock.calls.length).toBe(1);
  expect(String(mocks.promptError.mock.calls[0]?.[0] ?? '')).toMatch(
    /Env name is required when prompts are skipped\..*nb init --yes --env <envName>/s,
  );
});

test('nb init --force allows reconfiguring an existing workspace env and warns before install', async () => {
  const { default: Init } = await import('../commands/init.js');
  mocks.getEnv.mockResolvedValue({
    name: 'local5',
    config: {
      baseUrl: 'http://localhost:13000/api',
    },
  });

  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--env', 'local5', '--force'];

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    appName: 'local5',
    hasNocobase: 'no',
    installSkills: false,
    lang: 'en-US',
    appRootPath: './nocobase',
    appPort: '13000',
    storagePath: './storage/local5',
    fetchSource: false,
    ...(options.values ?? {}),
  }));

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: true,
        ui: false,
        env: 'local5',
        force: true,
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  try {
    await Init.prototype.run.call(command);
  } finally {
    process.argv = originalArgv;
  }

  expect(runCommand.mock.calls[0]).toEqual([
    'install',
    ['-y', '--no-intro', '--env', 'local5', '--lang', 'en-US', '--app-root-path', './nocobase', '--storage-path', './storage/local5', '--force'],
  ]);
  expect(mocks.promptWarn.mock.calls.some((call) => String(call[0]).includes('Reconfiguring existing env'))).toBe(true);
  expect(mocks.promptWarn.mock.calls.some((call) => String(call[0]).includes('local5'))).toBe(true);
});

test('nb init forwards dynamically selected ports in --yes mode', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes'];

  try {
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'local',
        appPort: '54180',
        dbPort: '54181',
        fetchSource: true,
        source: 'npm',
        version: 'alpha',
        builtinDb: true,
        dbDialect: 'postgres',
      },
      { yes: true },
    );

    expect(argv.slice(argv.indexOf('--app-port'), argv.indexOf('--app-port') + 2)).toEqual(['--app-port', '54180']);
    expect(argv.slice(argv.indexOf('--db-port'), argv.indexOf('--db-port') + 2)).toEqual(['--db-port', '54181']);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init does not forward a hidden Docker built-in database port in --yes mode', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes'];

  try {
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'local',
        dbPort: '54181',
        fetchSource: true,
        source: 'docker',
        version: 'alpha',
        builtinDb: true,
        dbDialect: 'postgres',
      },
      { yes: true },
    );

    expect(argv.includes('--db-port')).toBe(false);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init treats the --yes download source as docker when resolving dynamic defaults', async () => {
  const { default: Init } = await import('../commands/init.js');
  const { default: Install } = await import('../commands/install.js');
  const buildDbPromptInitialValues = vi
    .spyOn(Install, 'buildDbPromptInitialValues')
    .mockResolvedValue({});

  try {
    const buildDynamicInitialValuesForInstall = (
      Init as unknown as {
        buildDynamicInitialValuesForInstall: (
          flags: { yes?: boolean; 'app-port'?: string; 'db-port'?: string },
          presetValues: Record<string, string | number | boolean>,
        ) => Promise<Record<string, string | number | boolean>>;
      }
    ).buildDynamicInitialValuesForInstall;

    const initialValues = await buildDynamicInitialValuesForInstall({ yes: true }, { appPort: '13000' });

    expect(Object.prototype.hasOwnProperty.call(initialValues, 'appRootPath')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(initialValues, 'storagePath')).toBe(false);

    expect(buildDbPromptInitialValues.mock.calls[0]?.[0].downloadResults.source).toBe('docker');
  } finally {
    buildDbPromptInitialValues.mockRestore();
  }
});

test('nb init resolves dynamic port defaults without showing fallback warnings', async () => {
  const { default: Init } = await import('../commands/init.js');
  const { default: Install } = await import('../commands/install.js');
  const buildAppPromptInitialValues = vi
    .spyOn(Install, 'buildAppPromptInitialValues')
    .mockResolvedValue({ appPort: '61522' });
  const buildDbPromptInitialValues = vi
    .spyOn(Install, 'buildDbPromptInitialValues')
    .mockResolvedValue({ dbPort: '61523' });

  try {
    const buildDynamicInitialValuesForInstall = (
      Init as unknown as {
        buildDynamicInitialValuesForInstall: (
          flags: { yes?: boolean; 'app-port'?: string; 'db-port'?: string },
          presetValues: Record<string, string | number | boolean>,
        ) => Promise<Record<string, string | number | boolean>>;
      }
    ).buildDynamicInitialValuesForInstall;

    const initialValues = await buildDynamicInitialValuesForInstall(
      { yes: false },
      {
        appName: 'app1',
        fetchSource: true,
        source: 'npm',
        builtinDb: true,
        dbDialect: 'postgres',
      },
    );

    expect(initialValues.appPort).toBe('61522');
    expect(initialValues.dbPort).toBe('61523');
    expect(buildAppPromptInitialValues.mock.calls[0]?.[0].warnOnPortFallback).toBe(false);
    expect(buildDbPromptInitialValues.mock.calls[0]?.[0].warnOnPortFallback).toBe(false);
  } finally {
    buildAppPromptInitialValues.mockRestore();
    buildDbPromptInitialValues.mockRestore();
  }
});

test('nb init preserves argument values that contain spaces when building install argv', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init'];

  try {
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'aaaaaaa',
        lang: 'en-US',
        appRootPath: './nocobase',
        appPort: '13352',
        storagePath: './storage/local',
        fetchSource: true,
        source: 'docker',
        version: 'alpha',
        dockerRegistry: 'nocobase/nocobase',
        dockerPlatform: 'linux/arm64',
        builtinDb: true,
        dbDialect: 'postgres',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        rootUsername: 'nocobase',
        rootEmail: 'admin@nocobase.com',
        rootPassword: 'admin123',
        rootNickname: 'Super Admin',
      },
      { yes: false },
    );

    const nicknameIndex = argv.indexOf('--root-nickname');
    expect(nicknameIndex).not.toBe(-1);
    expect(argv[nicknameIndex + 1]).toBe('Super Admin');
    expect(argv.slice(argv.indexOf('--docker-platform'), argv.indexOf('--docker-platform') + 2)).toEqual(['--docker-platform', 'linux/arm64']);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init forwards --verbose to nb install', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--verbose'];

  try {
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'app1',
        lang: 'en-US',
        appRootPath: './app1/source/',
        appPort: '13000',
        storagePath: './app1/storage/',
        fetchSource: true,
        source: 'git',
        version: 'alpha',
        outputDir: './app1/source/',
        gitUrl: 'https://github.com/nocobase/nocobase.git',
        builtinDb: true,
        dbDialect: 'postgres',
      },
      {
        yes: true,
        verbose: true,
      },
    );

    expect(argv).toContain('--verbose');
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init disables skills install by default when the current workspace has a .agents directory', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    installSkills: false,
    hasNocobase: 'yes',
    appName: 'staging',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'oauth',
    ...(options.values ?? {}),
  }));
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        ui: false,
        'install-skills': false,
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    hasAgentsDirInCwd: () => true,
    error: (message: string) => {
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  try {
    await Init.prototype.run.call(command);
  } finally {
  }

  expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values?.installSkills).toBe(false);
  expect(mocks.runNpm.mock.calls.length).toBe(0);
  expect(mocks.promptInfo.mock.calls.some((call) => String(call[0]).includes('Skipped NocoBase agent skills install.'))).toBe(true);
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    ['staging', '--no-intro', '--scope', 'project', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
  ]);
});
