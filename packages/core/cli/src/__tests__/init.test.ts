/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { beforeEach, test, vi } from 'vitest';

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
  mocks.upsertEnv.mockResolvedValue(undefined);
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

  assert.equal(mocks.runPromptCatalogWebUI.mock.calls.length, 1);
  assert.equal(mocks.runPromptCatalog.mock.calls.length, 1);
  assert.deepEqual(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values, {
    appName: 'staging',
    hasNocobase: 'yes',
    installSkills: false,
    apiBaseUrl: 'http://localhost:13000/api',
    authType: 'token',
    accessToken: 'secret-token',
  });
  assert.equal(mocks.runPromptCatalog.mock.calls[0]?.[1]?.yes, true);
  assert.equal(mocks.runNpm.mock.calls.length, 0);
  assert.deepEqual(runCommand.mock.calls, [
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
    dbHost: '127.0.0.1',
    dbPort: '5432',
    dbDatabase: 'demoapp',
    dbUser: 'nocobase',
    dbPassword: 'secret',
    rootUsername: 'admin',
    rootEmail: 'admin@example.com',
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

  assert.equal(mocks.runNpm.mock.calls.length, 0);
  assert.deepEqual(mocks.upsertEnv.mock.calls, [[
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
      dbHost: '127.0.0.1',
      dbPort: '5432',
      dbDatabase: 'demoapp',
      dbUser: 'nocobase',
      dbPassword: 'secret',
    },
    { scope: 'project' },
  ]]);
  assert.deepEqual(runCommand.mock.calls, [
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
        'admin@example.com',
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
    rootEmail: 'admin@example.com',
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

  await assert.rejects(
    () => Init.prototype.run.call(command),
    /install failed/,
  );

  assert.equal(mocks.upsertEnv.mock.calls.length, 1);
  assert.equal(mocks.upsertEnv.mock.invocationCallOrder[0] < runCommand.mock.invocationCallOrder[0], true);
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

  assert.equal(mocks.runPromptCatalog.mock.calls.length, 0);
  assert.deepEqual(runCommand.mock.calls, [
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

  assert.deepEqual(mocks.runNpm.mock.calls, [
    ['npx', ['-y', 'skills', 'add', 'nocobase/skills', '-y']],
  ]);
  assert.deepEqual(runCommand.mock.calls[0], [
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

    assert.equal(argv.includes('--app-port'), false);
  } finally {
    process.argv = originalArgv;
  }
});

test('nb init logs duplicate env validation errors with Clack in --yes mode', async () => {
  const { default: Init } = await import('../commands/init.js');
  mocks.runPromptCatalog.mockImplementation(async (_catalog, options) => {
    options.hooks?.onMissingNonInteractive?.(
      'Env "local3" already exists in this workspace. Choose another app name.',
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

  await assert.rejects(
    () => Init.prototype.run.call(command),
    /exit: 1/,
  );
  assert.equal(mocks.promptError.mock.calls.length, 1);
  assert.match(String(mocks.promptError.mock.calls[0]?.[0] ?? ''), /local3/);
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

  await assert.rejects(
    () => Init.prototype.run.call(command),
    /exit: 1/,
  );
  assert.equal(mocks.runPromptCatalog.mock.calls.length, 0);
  assert.equal(mocks.promptInfo.mock.calls.length, 0);
  assert.equal(mocks.promptWarn.mock.calls.length, 0);
  assert.equal(runCommand.mock.calls.length, 0);
  assert.equal(mocks.promptError.mock.calls.length, 1);
  assert.match(
    String(mocks.promptError.mock.calls[0]?.[0] ?? ''),
    /App name is required when prompts are skipped\..*nb init --yes --env <envName>/s,
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

  assert.deepEqual(runCommand.mock.calls[0], [
    'install',
    ['-y', '--no-intro', '--env', 'local5', '--lang', 'en-US', '--app-root-path', './nocobase', '--storage-path', './storage/local5', '--force'],
  ]);
  assert.equal(
    mocks.promptWarn.mock.calls.some((call) => String(call[0]).includes('Reconfiguring existing env')),
    true,
  );
  assert.equal(
    mocks.promptWarn.mock.calls.some((call) => String(call[0]).includes('local5')),
    true,
  );
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

    assert.deepEqual(
      argv.slice(argv.indexOf('--app-port'), argv.indexOf('--app-port') + 2),
      ['--app-port', '54180'],
    );
    assert.deepEqual(
      argv.slice(argv.indexOf('--db-port'), argv.indexOf('--db-port') + 2),
      ['--db-port', '54181'],
    );
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

    assert.equal(argv.includes('--db-port'), false);
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

    assert.equal(Object.prototype.hasOwnProperty.call(initialValues, 'appRootPath'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(initialValues, 'storagePath'), false);

    assert.equal(
      buildDbPromptInitialValues.mock.calls[0]?.[0].downloadResults.source,
      'docker',
    );
  } finally {
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
        rootEmail: 'admin@example.com',
        rootPassword: 'admin123',
        rootNickname: 'Super Admin',
      },
      { yes: false },
    );

    const nicknameIndex = argv.indexOf('--root-nickname');
    assert.notEqual(nicknameIndex, -1);
    assert.equal(argv[nicknameIndex + 1], 'Super Admin');
    assert.deepEqual(
      argv.slice(argv.indexOf('--docker-platform'), argv.indexOf('--docker-platform') + 2),
      ['--docker-platform', 'linux/arm64'],
    );
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

  assert.equal(mocks.runPromptCatalog.mock.calls[0]?.[1]?.values?.installSkills, false);
  assert.equal(mocks.runNpm.mock.calls.length, 0);
  assert.equal(
    mocks.promptInfo.mock.calls.some((call) => String(call[0]).includes('Skipped NocoBase agent skills install.')),
    true,
  );
  assert.deepEqual(runCommand.mock.calls[0], [
    'env:add',
    ['staging', '--no-intro', '--scope', 'project', '--api-base-url', 'http://localhost:13000/api', '--auth-type', 'oauth'],
  ]);
});
