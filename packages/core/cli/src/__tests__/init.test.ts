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
  inspectSkillsStatus: vi.fn(),
  installNocoBaseSkills: vi.fn(),
  updateNocoBaseSkills: vi.fn(),
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
  mocks.inspectSkillsStatus.mockResolvedValue({ installed: false });
  mocks.installNocoBaseSkills.mockResolvedValue({ action: 'installed', status: {} });
  mocks.updateNocoBaseSkills.mockResolvedValue({ action: 'updated', status: {} });
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

vi.mock('../lib/run-npm.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/run-npm.js')>();
  return {
    ...actual,
    run: mocks.runNpm,
  };
});

vi.mock('../lib/skills-manager.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/skills-manager.js')>();
  return {
    ...actual,
    inspectSkillsStatus: (...args: Parameters<typeof actual.inspectSkillsStatus>) => {
      if (mocks.inspectSkillsStatus.mock.calls.length || mocks.inspectSkillsStatus.getMockImplementation()) {
        return mocks.inspectSkillsStatus(...args);
      }
      return actual.inspectSkillsStatus(...args);
    },
    installNocoBaseSkills: (...args: Parameters<typeof actual.installNocoBaseSkills>) => {
      if (mocks.installNocoBaseSkills.mock.calls.length || mocks.installNocoBaseSkills.getMockImplementation()) {
        return mocks.installNocoBaseSkills(...args);
      }
      return actual.installNocoBaseSkills(...args);
    },
    updateNocoBaseSkills: (...args: Parameters<typeof actual.updateNocoBaseSkills>) => {
      if (mocks.updateNocoBaseSkills.mock.calls.length || mocks.updateNocoBaseSkills.getMockImplementation()) {
        return mocks.updateNocoBaseSkills(...args);
      }
      return actual.updateNocoBaseSkills(...args);
    },
  };
});

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
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.inspectSkillsStatus.mockResolvedValue({ installed: false });
  mocks.installNocoBaseSkills.mockResolvedValue({ action: 'installed', status: {} });
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
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.yes).toBe(true);
  expect(mocks.runNpm.mock.calls.length).toBe(0);
  expect(mocks.installNocoBaseSkills).toHaveBeenCalledTimes(1);
  expect(mocks.updateNocoBaseSkills).not.toHaveBeenCalled();
  expect(runCommand.mock.calls).toEqual([
    [
      'env:add',
      [
        'staging',
        '--no-intro',
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
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.inspectSkillsStatus.mockResolvedValue({ installed: false });
  mocks.installNocoBaseSkills.mockResolvedValue({ action: 'installed', status: {} });
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
  expect(mocks.promptInfo).toHaveBeenCalledWith('Browser open error: open failed');
});

test('nb init localizes the browser UI intro title', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalogWebUI.mockResolvedValue({
    appName: 'staging',
    hasNocobase: 'yes',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  mocks.inspectSkillsStatus.mockResolvedValue({ installed: false });
  mocks.installNocoBaseSkills.mockResolvedValue({ action: 'installed', status: {} });
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
  mocks.inspectSkillsStatus.mockResolvedValue({ installed: false });
  mocks.installNocoBaseSkills.mockResolvedValue({ action: 'installed', status: {} });
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
      apiBaseUrl: 'http://127.0.0.1:13080/api',
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
      kind: 'local',
    },
    { scope: 'global' },
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
      throw new Error(`exit: ${code ?? 'unknown'}`);
    },
  });

  await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(/exit: 1/);

  expect(mocks.upsertEnv.mock.calls.length).toBe(1);
  expect(mocks.upsertEnv.mock.invocationCallOrder[0] < runCommand.mock.invocationCallOrder[0]).toBe(true);
  expect(String(mocks.promptOutro.mock.calls.at(-1)?.[0] ?? '')).toContain('install failed');
});

test('nb init install failures include a full resume command', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = [
    'node',
    'nb',
    'init',
    '--yes',
    '--env',
    'app12',
    '--source',
    'git',
    '--git-url',
    'git@example.com:nocobase/nocobase fork.git',
  ];

  try {
    mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
      appName: 'app12',
      hasNocobase: 'no',
      lang: 'en-US',
      appRootPath: './app12/source/',
      appPort: '13080',
      storagePath: './app12/storage/',
      fetchSource: true,
      source: 'git',
      version: 'beta',
      gitUrl: 'git@example.com:nocobase/nocobase fork.git',
      outputDir: './app12/source/',
      builtinDb: true,
      dbDialect: 'postgres',
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'nocobase',
      dbUser: 'nocobase',
      dbPassword: 'secret',
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
      ...(options.values ?? {}),
    }));

    const runCommand = vi.fn(async (commandName: string) => {
      if (commandName === 'install') {
        throw new Error("Couldn't finish preparing the local NocoBase app.");
      }
      return undefined;
    });

    const command = Object.assign(Object.create(Init.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          yes: true,
          ui: false,
          env: 'app12',
          source: 'git',
          'git-url': 'git@example.com:nocobase/nocobase fork.git',
        },
      })),
      config: { runCommand },
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
      exit: (code?: number) => {
        throw new Error(`exit: ${code ?? 'unknown'}`);
      },
    });

    await expect((() => Init.prototype.run.call(command))()).rejects.toThrow(
      /exit: 1/,
    );
    const rendered = String(mocks.promptOutro.mock.calls.at(-1)?.[0] ?? '');
    const resumeCommand =
      "nb init --yes --env app12 --source git --version beta --git-url 'git@example.com:nocobase/nocobase fork.git' --resume --verbose";
    expect(rendered).toContain('Resume this setup with:');
    expect(rendered).toContain(resumeCommand);
    expect(rendered.match(/Resume this setup with:/g)?.length).toBe(1);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init forwards otherVersion as the final --version value to nb install', async () => {
  const { default: Init } = await import('../commands/init.js');

  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'db-host'?: string },
        options?: { nonInteractive?: boolean; resume?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      appName: 'demoapp',
      lang: 'en-US',
      appRootPath: './apps/demoapp',
      storagePath: './storage/demoapp',
      fetchSource: true,
      source: 'git',
      version: 'other',
      otherVersion: 'fix/cli-v2',
      outputDir: './apps/demoapp',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
    },
    {
      yes: true,
      force: false,
      build: true,
      verbose: false,
    },
  );

  expect(argv).toContain('--version');
  expect(argv[argv.indexOf('--version') + 1]).toBe('fix/cli-v2');
});

test('nb init forwards api connection settings to nb install', async () => {
  const { default: Init } = await import('../commands/init.js');

  const buildInstallArgv = (
    Init.prototype as unknown as {
      buildInstallArgv: (
        results: Record<string, string | number | boolean>,
        flags: { yes?: boolean; force?: boolean; build?: boolean; verbose?: boolean; 'db-host'?: string },
        options?: { nonInteractive?: boolean; resume?: boolean },
      ) => string[];
    }
  ).buildInstallArgv;

  const argv = buildInstallArgv.call(
    Object.create(Init.prototype),
    {
      appName: 'demoapp',
      apiBaseUrl: 'http://demo.example.com/api',
      authType: 'token',
      accessToken: 'secret-token',
    },
    {
      yes: true,
      force: false,
      build: true,
      verbose: false,
    },
  );

  expect(argv).toEqual(expect.arrayContaining([
    '--api-base-url',
    'http://demo.example.com/api',
    '--auth-type',
    'token',
    '--access-token',
    'secret-token',
  ]));
});

test('nb init treats arbitrary CLI --version values as otherVersion prompt values', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--env', 'app8', '--source', 'git', '--version', 'fix/oauth-register'];

  try {
    mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
      hasNocobase: 'no',
      lang: 'en-US',
      appRootPath: './app8/source/',
      appPort: '13000',
      storagePath: './app8/storage/',
      fetchSource: true,
      outputDir: './app8/source/',
      gitUrl: 'https://github.com/nocobase/nocobase.git',
      builtinDb: true,
      dbDialect: 'postgres',
      rootUsername: 'admin',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Admin',
      ...(options.values ?? {}),
    }));

    const runCommand = vi.fn(async () => undefined);
    const command = Object.assign(Object.create(Init.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          yes: true,
          ui: false,
          env: 'app8',
          source: 'git',
          version: 'fix/oauth-register',
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

    expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values).toMatchObject({
      appName: 'app8',
      source: 'git',
      version: 'other',
      otherVersion: 'fix/oauth-register',
    });

    const installArgv = runCommand.mock.calls[0]?.[1] as string[];
    expect(installArgv).toContain('--version');
    expect(installArgv[installArgv.indexOf('--version') + 1]).toBe('fix/oauth-register');
  } finally {
    process.argv = originalArgv;
  }
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
  expect(mocks.promptStep.mock.calls).toEqual([
    ['Installing NocoBase agent skills (nb skills install)'],
  ]);
});

test('nb init --resume --yes forwards setup-only defaults to nb install', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--env', 'app8', '--source', 'git', '--version', 'next', '--resume'];

  try {
    const runCommand = vi.fn(async () => undefined);
    const command = Object.assign(Object.create(Init.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          resume: true,
          yes: true,
          ui: false,
          env: 'app8',
          source: 'git',
          version: 'next',
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

    expect(runCommand.mock.calls).toEqual([
      [
        'install',
        [
          '-y',
          '--no-intro',
          '--env',
          'app8',
          '--resume',
          '--lang',
          'en-US',
          '--fetch-source',
          '--source',
          'git',
          '--version',
          'next',
          '--replace',
          '--root-username',
          'nocobase',
          '--root-email',
          'admin@nocobase.com',
          '--root-password',
          'admin123',
          '--root-nickname',
          'Super Admin',
        ],
      ],
    ]);
    expect(mocks.promptStep.mock.calls).toEqual([
      ['Installing NocoBase agent skills (nb skills install)'],
    ]);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init skips skills sync when --skip-skills is provided in flags mode', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    hasNocobase: 'yes',
    appName: 'staging',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'oauth',
    ...(options.values ?? {}),
  }));

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        ui: false,
        'skip-skills': true,
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

  expect(mocks.inspectSkillsStatus).not.toHaveBeenCalled();
  expect(mocks.installNocoBaseSkills).not.toHaveBeenCalled();
  expect(mocks.updateNocoBaseSkills).not.toHaveBeenCalled();
  expect(mocks.promptStep).toHaveBeenCalledWith('Skipped NocoBase agent skills sync.');
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    ['staging', '--no-intro', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
  ]);
});

test('nb init installs skills automatically when they are missing', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    hasNocobase: 'yes',
    appName: 'staging',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'oauth',
    ...(options.values ?? {}),
  }));
  mocks.inspectSkillsStatus.mockResolvedValue({
    installed: false,
  });
  mocks.installNocoBaseSkills.mockResolvedValue({
    action: 'installed',
    status: {
      globalRoot: process.cwd(),
      workspaceRoot: process.cwd(),
      stateFile: '',
      installed: true,
      managedByNb: true,
      sourcePackage: 'nocobase/skills',
      npmPackageName: '@nocobase/skills',
      installedSkillNames: ['nocobase-env-manage'],
      latestVersion: '1.0.5',
      installedVersion: '1.0.5',
      latestRef: '1.0.5',
      installedRef: '1.0.5',
      updateAvailable: false,
    },
  });

  const runCommand = vi.fn(async () => undefined);
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
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  await Init.prototype.run.call(command);

  expect(mocks.inspectSkillsStatus).toHaveBeenCalledTimes(1);
  expect(mocks.installNocoBaseSkills.mock.calls.length).toBe(1);
  expect(mocks.updateNocoBaseSkills).not.toHaveBeenCalled();
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    ['staging', '--no-intro', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
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
      'Env "local3" already exists. Choose another env name.',
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

test('nb init --force allows reconfiguring an existing global env and warns before install', async () => {
  const { default: Init } = await import('../commands/init.js');
  mocks.getEnv.mockResolvedValue({
    name: 'local5',
    config: {
      apiBaseUrl: 'http://localhost:13000/api',
    },
  });

  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--env', 'local5', '--force'];

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    appName: 'local5',
    hasNocobase: 'no',
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

test('nb init keeps absolute appRootPath and storagePath when forwarding to nb install', async () => {
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
        appRootPath: '/tmp/nb-app/source',
        storagePath: '/tmp/nb-app/storage',
      },
      { yes: true },
    );

    expect(argv.slice(argv.indexOf('--app-root-path'), argv.indexOf('--app-root-path') + 2)).toEqual([
      '--app-root-path',
      '/tmp/nb-app/source',
    ]);
    expect(argv.slice(argv.indexOf('--storage-path'), argv.indexOf('--storage-path') + 2)).toEqual([
      '--storage-path',
      '/tmp/nb-app/storage',
    ]);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init forwards --no-builtin-db to nb install', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--no-builtin-db'];

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
        fetchSource: true,
        source: 'npm',
        version: 'alpha',
        builtinDb: false,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
      },
      { yes: true },
    );

    expect(argv).toContain('--no-builtin-db');
    expect(argv).not.toContain('--builtin-db');
    expect(argv.slice(argv.indexOf('--db-host'), argv.indexOf('--db-host') + 2)).toEqual([
      '--db-host',
      '127.0.0.1',
    ]);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init treats explicit --db-host as an external database', async () => {
  const { default: Init } = await import('../commands/init.js');
  const { default: Install } = await import('../commands/install.js');
  const originalArgv = process.argv;
  process.argv = ['node', 'nb', 'init', '--yes', '--db-host', 'db.example.com'];

  const buildDbPromptInitialValues = vi
    .spyOn(Install, 'buildDbPromptInitialValues')
    .mockResolvedValue({});

  try {
    const buildPresetValuesFromFlags = (
      Init.prototype as unknown as {
        buildPresetValuesFromFlags: (flags: Record<string, unknown>) => Record<string, unknown>;
      }
    ).buildPresetValuesFromFlags;
    const buildInstallArgv = (
      Init.prototype as unknown as {
        buildInstallArgv: (
          results: Record<string, string | number | boolean>,
          flags: { yes?: boolean; force?: boolean; build?: boolean },
        ) => string[];
      }
    ).buildInstallArgv;
    const buildDynamicInitialValuesForInstall = (
      Init as unknown as {
        buildDynamicInitialValuesForInstall: (
          flags: { yes?: boolean; 'app-port'?: string; 'db-port'?: string },
          presetValues: Record<string, string | number | boolean>,
        ) => Promise<Record<string, string | number | boolean>>;
      }
    ).buildDynamicInitialValuesForInstall;

    const flags = {
      yes: true,
      env: 'local',
      'db-host': 'db.example.com',
    };
    const preset = buildPresetValuesFromFlags.call(Object.create(Init.prototype), flags);
    expect(preset.dbHost).toBe('db.example.com');
    expect(preset.builtinDb).toBe(false);

    await buildDynamicInitialValuesForInstall(flags, preset);
    expect(buildDbPromptInitialValues.mock.calls[0]?.[0].dbPreset.builtinDb).toBe(false);

    const argv = buildInstallArgv.call(
      Object.create(Init.prototype),
      {
        appName: 'local',
        builtinDb: false,
        dbDialect: 'postgres',
        dbHost: 'db.example.com',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
      },
      { yes: true },
    );

    expect(argv).toContain('--no-builtin-db');
    expect(argv.slice(argv.indexOf('--db-host'), argv.indexOf('--db-host') + 2)).toEqual([
      '--db-host',
      'db.example.com',
    ]);
  } finally {
    buildDbPromptInitialValues.mockRestore();
    process.argv = originalArgv;
  }
});

test('nb init --yes keeps explicit --db-host external after prompt defaults are resolved', async () => {
  const { default: Init } = await import('../commands/init.js');
  const originalArgv = process.argv;
  process.argv = [
    'node',
    'nb',
    'init',
    '--yes',
    '--env',
    'app611',
    '--source',
    'npm',
    '--version',
    'beta',
    '--db-dialect',
    'postgres',
    '--db-host',
    '127.0.0.1',
    '--db-port',
    '10103',
    '--db-database',
    'd900',
    '--db-user',
    'root',
    '--db-password',
    'nocobase',
  ];

  try {
    mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
      appName: 'app611',
      hasNocobase: 'no',
      lang: 'en-US',
      appRootPath: './app611/source/',
      appPort: '13080',
      storagePath: './app611/storage/',
      fetchSource: true,
      outputDir: './app611/source/',
      builtinDb: true,
      rootUsername: 'nocobase',
      rootEmail: 'admin@nocobase.com',
      rootPassword: 'admin123',
      rootNickname: 'Super Admin',
      ...(options.values ?? {}),
    }));

    const runCommand = vi.fn(async () => undefined);
    const command = Object.assign(Object.create(Init.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          yes: true,
          ui: false,
          env: 'app611',
          source: 'npm',
          version: 'beta',
          'db-dialect': 'postgres',
          'db-host': '127.0.0.1',
          'db-port': '10103',
          'db-database': 'd900',
          'db-user': 'root',
          'db-password': 'nocobase',
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

    expect(mocks.upsertEnv.mock.calls[0]?.[1]).toMatchObject({
      builtinDb: false,
      dbHost: '127.0.0.1',
      dbPort: '10103',
      dbDatabase: 'd900',
      dbUser: 'root',
      dbPassword: 'nocobase',
    });

    const installArgv = runCommand.mock.calls.find(([name]) => name === 'install')?.[1] as string[];
    expect(installArgv).toContain('--no-builtin-db');
    expect(installArgv).not.toContain('--builtin-db');
    expect(installArgv.slice(installArgv.indexOf('--db-host'), installArgv.indexOf('--db-host') + 2)).toEqual([
      '--db-host',
      '127.0.0.1',
    ]);
    expect(installArgv.slice(installArgv.indexOf('--db-port'), installArgv.indexOf('--db-port') + 2)).toEqual([
      '--db-port',
      '10103',
    ]);
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

test('nb init updates skills automatically when they are already installed', async () => {
  const { default: Init } = await import('../commands/init.js');

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    hasNocobase: 'yes',
    appName: 'staging',
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'oauth',
    ...(options.values ?? {}),
  }));
  mocks.inspectSkillsStatus.mockResolvedValue({
    installed: true,
  });
  mocks.updateNocoBaseSkills.mockResolvedValue({
    action: 'updated',
    status: {},
  });
  mocks.runNpm.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
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
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  await Init.prototype.run.call(command);

  expect(mocks.inspectSkillsStatus).toHaveBeenCalledTimes(1);
  expect(mocks.installNocoBaseSkills).not.toHaveBeenCalled();
  expect(mocks.updateNocoBaseSkills).toHaveBeenCalledTimes(1);
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    ['staging', '--no-intro', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
  ]);
});

test('nb init exposes env add flags and forwards them for an existing app flow', async () => {
  const { default: Init } = await import('../commands/init.js');

  expect(Init.flags['api-base-url']).toBeDefined();
  expect(Init.flags['auth-type']).toBeDefined();
  expect(Init.flags['access-token']).toBeDefined();
  expect(Init.flags.locale).toBeDefined();
  expect(Init.flags['skip-skills']).toBeDefined();
  expect(Init.flags['skip-skills'].hidden).toBe(true);
  expect(Init.flags['install-skills']).toBeUndefined();

  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => ({
    hasNocobase: 'yes',
    appName: 'staging',
    ...(options.values ?? {}),
  }));
  mocks.runNpm.mockResolvedValue(undefined);
  mocks.getEnv.mockResolvedValue(undefined);

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(Init.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        yes: false,
        ui: false,
        env: 'staging',
        'api-base-url': 'http://demo.example.com/api',
        'auth-type': 'token',
        'access-token': 'secret-token',
      },
    })),
    config: { runCommand },
    log: vi.fn(),
    hasAgentsDirInCwd: () => false,
    error: (message: string) => {
      throw new Error(`unexpected error: ${message}`);
    },
    exit: (code?: number) => {
      throw new Error(`unexpected exit: ${code ?? 'unknown'}`);
    },
  });

  await Init.prototype.run.call(command);

  expect(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values).toEqual(
    expect.objectContaining({
      appName: 'staging',
      hasNocobase: 'yes',
      apiBaseUrl: 'http://demo.example.com/api',
      authType: 'token',
      accessToken: 'secret-token',
    }),
  );
  expect(runCommand.mock.calls[0]).toEqual([
    'env:add',
    [
      'staging',
      '--no-intro',
      '--api-base-url',
      'http://demo.example.com/api',
      '--auth-type',
      'token',
      '--access-token',
      'secret-token',
    ],
  ]);
});
