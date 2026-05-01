/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function serviceUrl() {
  return 'https://pkg.nocobase.com';
}

function pkgUrl() {
  return 'https://pkg.nocobase.com/';
}

const mocks = vi.hoisted(() => ({
  resolveManagedAppRuntime: vi.fn(),
  getInstanceIdAsync: vi.fn(),
  getEnvAsync: vi.fn(),
  keyDecrypt: vi.fn(),
  checkExternalDbConnection: vi.fn(),
  readExternalDbConnectionConfig: vi.fn(),
  commandOutput: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  promptSelect: vi.fn(),
  promptText: vi.fn(),
  promptPassword: vi.fn(),
  promptConfirm: vi.fn(),
  promptCancel: vi.fn(),
  promptIsCancel: vi.fn(),
  fetch: vi.fn(),
  createStoragePluginsSymlink: vi.fn(),
  renderTable: vi.fn(() => 'TABLE'),
}));

vi.mock('../lib/app-runtime.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/app-runtime.js')>();
  return {
    ...actual,
    resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  };
});

vi.mock('@nocobase/license-kit', () => ({
  getInstanceIdAsync: mocks.getInstanceIdAsync,
  getEnvAsync: mocks.getEnvAsync,
  keyDecrypt: mocks.keyDecrypt,
}));

vi.mock('../lib/db-connection-check.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/db-connection-check.ts')>();
  return {
    ...actual,
    checkExternalDbConnection: mocks.checkExternalDbConnection,
    readExternalDbConnectionConfig: mocks.readExternalDbConnectionConfig,
  };
});

vi.mock('../lib/run-npm.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/run-npm.js')>();
  return {
    ...actual,
    commandOutput: mocks.commandOutput,
  };
});

vi.mock('../lib/ui.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/ui.js')>();
  return {
    ...actual,
    isInteractiveTerminal: mocks.isInteractiveTerminal,
    renderTable: mocks.renderTable,
  };
});

vi.mock('@clack/prompts', () => ({
  select: mocks.promptSelect,
  text: mocks.promptText,
  password: mocks.promptPassword,
  confirm: mocks.promptConfirm,
  cancel: mocks.promptCancel,
  isCancel: mocks.promptIsCancel,
}));

vi.mock('../lib/plugin-storage.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/plugin-storage.js')>();
  return {
    ...actual,
    createStoragePluginsSymlink: mocks.createStoragePluginsSymlink,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isInteractiveTerminal.mockReturnValue(false);
  mocks.promptIsCancel.mockReturnValue(false);
  mocks.promptPassword.mockResolvedValue('bb');
  mocks.promptConfirm.mockResolvedValue(true);
  mocks.createStoragePluginsSymlink.mockResolvedValue(undefined);
  mocks.checkExternalDbConnection.mockResolvedValue(undefined);
  mocks.readExternalDbConnectionConfig.mockImplementation((values: Record<string, unknown>) => ({
    dialect: values.dbDialect,
    host: values.dbHost,
    port: Number(values.dbPort),
    database: values.dbDatabase,
    user: values.dbUser,
    password: values.dbPassword,
  }));
  mocks.commandOutput.mockResolvedValue(JSON.stringify({
    ok: true,
    instanceId: 'ins_docker_12345',
  }));
  mocks.fetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (String(url).includes('/license-key')) {
      return new Response(JSON.stringify({
        data: {
          key: 'license-key-raw',
        },
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    if (String(url).includes('/-/verdaccio/sec/login')) {
      return new Response(JSON.stringify({
        token: 'pkg-token',
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    if (String(url).includes('pro-packages')) {
      return new Response(JSON.stringify({
        data: ['@nocobase/plugin-a'],
        meta: {
          commercial_plugins: ['@nocobase/plugin-a', '@nocobase/plugin-b'],
        },
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    if (String(url).includes('@nocobase/plugin-a')) {
      return new Response(JSON.stringify({
        name: '@nocobase/plugin-a',
        'dist-tags': {
          latest: '2.1.0-beta.24',
        },
        versions: {
          '2.1.0-beta.24': {
            dist: {
              tarball: 'https://pkg.example.com/plugin-a.tgz',
            },
          },
        },
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
    if (String(url).includes('plugin-a.tgz')) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
      });
    }
    throw new Error(`Unexpected fetch url: ${url}, method: ${init?.method ?? 'GET'}`);
  });
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.getEnvAsync.mockResolvedValue({
    sys: 'darwin',
    osVer: '24',
    db: {
      id: 'db-1',
      type: 'postgres',
      name: 'nocobase',
    },
  });
});

test('license id generates and saves the instance id for the selected env', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockImplementation(async () =>
      `ins_${process.env.DB_DIALECT}_${process.env.DB_HOST}_${process.env.DB_PORT}`);

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseId.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          force: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseId.prototype.run.call(command);

    const filePath = path.join(storagePath, '.license', 'instance-id');
    await expect(readFile(filePath, 'utf8')).resolves.toBe('ins_postgres_127.0.0.1_5432\n');
    expect(log.mock.calls[0]?.[0]).toContain('ins_postgres_127.0.0.1_5432');
    expect(mocks.checkExternalDbConnection).toHaveBeenCalledWith({
      dialect: 'postgres',
      host: '127.0.0.1',
      port: 5432,
      database: 'nocobase',
      user: 'nocobase',
      password: 'secret',
    });
    expect(mocks.getInstanceIdAsync).toHaveBeenCalledTimes(1);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id reuses the saved instance id when force is not set', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'instance-id'), 'ins_saved\n');

    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
        },
      },
    });

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseId.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          force: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseId.prototype.run.call(command);

    expect(log.mock.calls[0]?.[0]).toContain('ins_saved');
    expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
    expect(mocks.checkExternalDbConnection).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id regenerates and overwrites the saved instance id when force is set', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'instance-id'), 'ins_saved\n');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'git',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_regenerated');

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseId.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          force: true,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseId.prototype.run.call(command);

    await expect(readFile(path.join(licenseDir, 'instance-id'), 'utf8')).resolves.toBe('ins_regenerated\n');
    expect(log.mock.calls[1]?.[0]).toContain('Saved instance ID');
    expect(mocks.checkExternalDbConnection).toHaveBeenCalledTimes(1);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id generates through docker when the selected env uses docker source', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'docker',
      envName: 'app1',
      source: 'docker',
      containerName: 'nb-demo-app1-app',
      workspaceName: 'nb-demo',
      env: {
        config: {
          dockerRegistry: 'registry.cn-beijing.aliyuncs.com/nocobase/nocobase',
          dockerPlatform: 'linux/amd64',
          downloadVersion: 'pr-9313',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: 'db.internal',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseId.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          force: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseId.prototype.run.call(command);

    await expect(readFile(path.join(storagePath, '.license', 'instance-id'), 'utf8')).resolves.toBe('ins_docker_12345\n');
    expect(mocks.commandOutput).toHaveBeenCalledWith(
      'docker',
      [
        'run',
        '--rm',
        '--network',
        'nb-demo',
        '--platform',
        'linux/amd64',
        '--entrypoint',
        'nb',
        'registry.cn-beijing.aliyuncs.com/nocobase/nocobase:pr-9313',
        'license',
        'generate-id',
        '--db-dialect',
        'postgres',
        '--db-host',
        'db.internal',
        '--db-port',
        '5432',
        '--db-database',
        'nocobase',
        '--db-user',
        'nocobase',
        '--db-password',
        'secret',
        '--json',
      ],
      { errorName: 'docker run' },
    );
    expect(mocks.checkExternalDbConnection).not.toHaveBeenCalled();
    expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license generate-id returns an instance id without saving it', async () => {
  const { default: LicenseGenerateId } = await import('../commands/license/generate-id.js');
  const originalHost = process.env.DB_HOST;
  mocks.getInstanceIdAsync.mockImplementation(async () =>
      `ins_${process.env.DB_DIALECT}_${process.env.DB_HOST}_${process.env.DB_PORT}`);

  const log = vi.fn();
  const command = Object.assign(Object.create(LicenseGenerateId.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        'db-dialect': 'postgres',
        'db-host': '127.0.0.1',
        'db-port': '5432',
        'db-database': 'nocobase',
        'db-user': 'nocobase',
        'db-password': 'secret',
        json: false,
      },
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await LicenseGenerateId.prototype.run.call(command);

  expect(log).toHaveBeenCalledWith('ins_postgres_127.0.0.1_5432');
  expect(mocks.checkExternalDbConnection).toHaveBeenCalledWith({
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    database: 'nocobase',
    user: 'nocobase',
    password: 'secret',
  });
  expect(mocks.getInstanceIdAsync).toHaveBeenCalledTimes(1);
  expect(process.env.DB_HOST).toBe(originalHost);
});

test('license generate-id validates required db flags', async () => {
  const { default: LicenseGenerateId } = await import('../commands/license/generate-id.js');
  const command = Object.assign(Object.create(LicenseGenerateId.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        'db-dialect': 'postgres',
        'db-host': '127.0.0.1',
        'db-port': '5432',
        'db-database': undefined,
        'db-user': 'nocobase',
        'db-password': 'secret',
        json: false,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect((() => LicenseGenerateId.prototype.run.call(command))()).rejects.toThrow(
    /Missing database settings for instance ID generation\..*--db-database/s,
  );
  expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
});

test('license generate-id reports database connectivity errors', async () => {
  const { default: LicenseGenerateId } = await import('../commands/license/generate-id.js');
  mocks.checkExternalDbConnection.mockResolvedValue('authentication failed');

  const command = Object.assign(Object.create(LicenseGenerateId.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        'db-dialect': 'postgres',
        'db-host': '127.0.0.1',
        'db-port': '5432',
        'db-database': 'nocobase',
        'db-user': 'nocobase',
        'db-password': 'secret',
        json: false,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect((() => LicenseGenerateId.prototype.run.call(command))()).rejects.toThrow('authentication failed');
  expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
});

test('license generate-id supports json output', async () => {
  const { default: LicenseGenerateId } = await import('../commands/license/generate-id.js');
  mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');

  const log = vi.fn();
  const command = Object.assign(Object.create(LicenseGenerateId.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        'db-dialect': 'postgres',
        'db-host': '127.0.0.1',
        'db-port': '5432',
        'db-database': 'nocobase',
        'db-user': 'nocobase',
        'db-password': 'secret',
        json: true,
      },
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await LicenseGenerateId.prototype.run.call(command);

  expect(JSON.parse(String(log.mock.calls[0]?.[0] ?? ''))).toEqual({
    ok: true,
    instanceId: 'ins_12345',
  });
});

test('license activate validates and saves a matching license key', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      licenseKey: {
        domain: '127.0.0.1:13000',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
          type: 'postgres',
          name: 'nocobase',
        },
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          key: 'license-key-raw',
          'key-file': undefined,
          online: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    const saved = await readFile(path.join(storagePath, '.license', 'license-key'), 'utf8');
    expect(saved).toBe('license-key-raw');
    expect(log.mock.calls[0]?.[0]).toContain('Activated the license');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate rejects a key that does not match the current domain', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      licenseKey: {
        domain: 'example.com',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
        },
      },
    }));

    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          key: 'license-key-raw',
          'key-file': undefined,
          online: false,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicenseActivate.prototype.run.call(command))()).rejects.toThrow(/does not match the current app domain/);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate supports interactive pasted key input', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.promptSelect
      .mockResolvedValueOnce('key')
      .mockResolvedValueOnce('key');
    mocks.promptText.mockResolvedValue('license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      licenseKey: {
        domain: '127.0.0.1:13000',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
        },
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          key: undefined,
          'key-file': undefined,
          online: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    expect(String(mocks.promptSelect.mock.calls[0]?.[0]?.message)).toContain('How do you want to activate the license');
    expect(String(mocks.promptText.mock.calls[0]?.[0]?.message)).toContain('License key');
    expect(log.mock.calls[0]?.[0]).toContain('Activated the license');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate supports online activation with explicit flags', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      licenseKey: {
        domain: '127.0.0.1:13000',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
          type: 'postgres',
          name: 'nocobase',
        },
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          key: undefined,
          'key-file': undefined,
          online: true,
          account: 'aa',
          password: 'bb',
          desc: 'test app',
          'pkg-url': `${serviceUrl()}/`,
          yes: true,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
      exit: vi.fn(),
    });

    await LicenseActivate.prototype.run.call(command);

    const saved = await readFile(path.join(storagePath, '.license', 'license-key'), 'utf8');
    expect(saved).toBe('license-key-raw');
    expect(mocks.fetch).toHaveBeenCalledWith(
      `${serviceUrl()}/license-key`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const body = JSON.parse(String(mocks.fetch.mock.calls.find((call) => String(call[0]).includes('/license-key'))?.[1]?.body ?? '{}'));
    expect(body).toEqual({
      account: 'aa',
      password: 'bb',
      appUrl: 'http://127.0.0.1:13000/',
      appName: 'test app',
      instanceId: 'ins_12345',
      type: 'internal',
    });
    expect(log.mock.calls[0]?.[0]).toContain('Activated the online license');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate supports online activation json output and redacts validation details', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'AK1234567890',
      accessKeySecret: 'SK1234567890',
      service: {
        domain: serviceUrl(),
        headers: {
          Authorization: 'Bearer abcdefghijklmnop',
        },
      },
      licenseKey: {
        domain: '127.0.0.1:13000',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
          type: 'postgres',
          name: 'nocobase',
        },
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: true,
          key: undefined,
          'key-file': undefined,
          online: true,
          account: 'env-account',
          password: 'env-password',
          desc: 'env-desc',
          'pkg-url': `${serviceUrl()}/`,
          yes: true,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
      exit: vi.fn(),
    });

    await LicenseActivate.prototype.run.call(command);

    expect(mocks.fetch).toHaveBeenCalledWith(
      `${serviceUrl()}/license-key`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
    const body = JSON.parse(String(mocks.fetch.mock.calls.find((call) => String(call[0]).includes('/license-key'))?.[1]?.body ?? '{}'));
    expect(body).toEqual({
      account: 'env-account',
      password: 'env-password',
      appUrl: 'http://127.0.0.1:13000/',
      appName: 'env-desc',
      instanceId: 'ins_12345',
      type: 'internal',
    });

    const payload = JSON.parse(String(log.mock.calls[0]?.[0] ?? '{}'));
    expect(payload.ok).toBe(true);
    expect(payload.serviceUrl).toBe(serviceUrl());
    expect(payload.appName).toBe('env-desc');
    expect(payload.validation.keyData.accessKeyId).toBe('AK***90');
    expect(payload.validation.keyData.accessKeySecret).toBe('SK***90');
    expect(payload.validation.keyData.service.headers.Authorization).toBe('Be***op');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate supports interactive online activation', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.promptSelect.mockResolvedValueOnce('online');
    mocks.promptText
      .mockResolvedValueOnce('aa')
      .mockResolvedValueOnce('test app');
    mocks.promptPassword.mockResolvedValueOnce('bb');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {
          apiBaseUrl: 'http://localhost:13000/api',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.getInstanceIdAsync.mockResolvedValue('ins_12345');
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      licenseKey: {
        domain: 'localhost:13000',
        licenseStatus: 'active',
      },
      instanceData: {
        sys: 'darwin',
        osVer: '24',
        db: {
          id: 'db-1',
          type: 'postgres',
          name: 'nocobase',
        },
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          key: undefined,
          'key-file': undefined,
          online: false,
          account: undefined,
          password: undefined,
          desc: undefined,
          'pkg-url': `${serviceUrl()}/`,
          yes: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
      exit: vi.fn(),
    });

    await LicenseActivate.prototype.run.call(command);

    expect(String(mocks.promptSelect.mock.calls[0]?.[0]?.message)).toContain('How do you want to activate the license');
    expect(String(mocks.promptText.mock.calls[0]?.[0]?.message)).toContain('Service account');
    expect(String(mocks.promptPassword.mock.calls[0]?.[0]?.message)).toContain('Service password');
    expect(String(mocks.promptText.mock.calls[1]?.[0]?.message)).toContain('Application name');
    expect(mocks.promptConfirm).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toContain('Activated the online license');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugin helpers normalize package registry urls', async () => {
  const module = await import('../commands/license/shared.js');
  expect(module.resolveLicensePkgUrl(pkgUrl().replace(/\/$/, ''))).toBe(pkgUrl());
  expect(module.resolveLicenseServiceUrl(`${serviceUrl()}/`)).toBe(serviceUrl());
});

test('license activate supports interactive cancellation', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');

  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.promptSelect.mockResolvedValueOnce('cancel');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/app1',
    workspaceName: 'nb-demo',
    env: {
      config: {},
      storagePath: '/tmp/storage',
      envVars: {
        STORAGE_PATH: '/tmp/storage',
      },
    },
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(LicenseActivate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        env: 'app1',
        json: false,
        key: undefined,
        'key-file': undefined,
        online: false,
      },
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await LicenseActivate.prototype.run.call(command);

  expect(log.mock.calls[0]?.[0]).toBe('Cancelled license activation.');
});

test('license plugins list shows licensed and unlicensed commercial plugins', async () => {
  const { default: LicensePluginsList } = await import('../commands/license/plugins/list.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsList.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsList.prototype.run.call(command);

    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugins for env "app1"');
    expect(log.mock.calls[1]?.[0]).toBe('TABLE');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync supports dry-run previews', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          NODE_MODULES_PATH: path.join(storagePath, 'node_modules'),
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: '2.1.0-beta.24',
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugin sync preview');
    expect(log.mock.calls[1]?.[0]).toContain('Version: 2.1.0-beta.24');
    expect(log.mock.calls[2]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[3]?.[0]).toContain('Result:');
    expect(log.mock.calls[3]?.[0]).toContain('1 installed');
    expect(log.mock.calls[3]?.[0]).toContain('1 removed');
    expect(log).toHaveBeenCalledTimes(4);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync outputs per-plugin details in verbose mode', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          NODE_MODULES_PATH: path.join(storagePath, 'node_modules'),
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: '2.1.0-beta.24',
          verbose: true,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugin sync preview');
    expect(log.mock.calls[1]?.[0]).toContain('Version: 2.1.0-beta.24');
    expect(log.mock.calls[2]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[3]?.[0]).toContain('@nocobase/plugin-b');
    expect(log.mock.calls[4]?.[0]).toContain(path.join(storagePath, 'plugins', '@nocobase/plugin-b'));
    expect(log.mock.calls[5]?.[0]).toContain('@nocobase/plugin-a');
    expect(log.mock.calls[6]?.[0]).toContain(path.join(storagePath, 'plugins', '@nocobase/plugin-a'));
    expect(log.mock.calls[7]?.[0]).toContain('Summary: 1 installed, 0 updated, 1 removed, 0 skipped, 0 warnings');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync uses the selected env storage path for plugin symlinks', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const nodeModulesPath = path.join(storagePath, 'node_modules');
  const downloadedPluginDir = path.join(storagePath, 'plugins', '@nocobase', 'plugin-a');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(downloadedPluginDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(downloadedPluginDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/plugin-a', version: '2.1.0-beta.24' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          NODE_MODULES_PATH: nodeModulesPath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': false,
          version: '2.1.0-beta.24',
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(mocks.createStoragePluginsSymlink).toHaveBeenCalledWith(storagePath, nodeModulesPath);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync skips packages without a matching downloadable version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://service.example.com/',
      },
    }));
    mocks.fetch.mockImplementation(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (String(url).includes('/-/verdaccio/sec/login')) {
        return new Response(JSON.stringify({
          token: 'pkg-token',
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
      if (String(url).includes('pro-packages')) {
        return new Response(JSON.stringify({
          data: ['@nocobase/plugin-a'],
          meta: {
            commercial_plugins: ['@nocobase/plugin-a'],
          },
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
      if (String(url).includes('@nocobase/plugin-a')) {
        return new Response(JSON.stringify({
          name: '@nocobase/plugin-a',
          'dist-tags': {
            latest: '2.0.0',
          },
          versions: {
            '2.0.0': {
              dist: {
                tarball: 'https://pkg.example.com/plugin-a.tgz',
              },
            },
          },
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }
      throw new Error(`Unexpected fetch url: ${url}`);
    });

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': false,
          version: '2.1.0-beta.24',
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(log.mock.calls.some((call) => String(call[0]).includes('does not have a downloadable version'))).toBe(true);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins clean previews downloaded commercial plugins', async () => {
  const { default: LicensePluginsClean } = await import('../commands/license/plugins/clean.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const downloadedPluginDir = path.join(storagePath, 'plugins', '@nocobase', 'plugin-a');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(downloadedPluginDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(downloadedPluginDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/plugin-a', version: '2.1.0-beta.24' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          NODE_MODULES_PATH: path.join(storagePath, 'node_modules'),
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsClean.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          verbose: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsClean.prototype.run.call(command);

    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugin clean preview');
    expect(log.mock.calls[1]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[2]?.[0]).toContain('Result:');
    expect(log.mock.calls[2]?.[0]).toContain('1 removed');
    expect(log.mock.calls[2]?.[0]).toContain('1 skipped');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins clean removes downloaded commercial plugins', async () => {
  const { default: LicensePluginsClean } = await import('../commands/license/plugins/clean.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const nodeModulesPath = path.join(storagePath, 'node_modules');
  const downloadedPluginDir = path.join(storagePath, 'plugins', '@nocobase', 'plugin-a');
  const linkedPluginDir = path.join(nodeModulesPath, '@nocobase', 'plugin-a');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(downloadedPluginDir, { recursive: true });
    await mkdir(path.dirname(linkedPluginDir), { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(downloadedPluginDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/plugin-a', version: '2.1.0-beta.24' }),
    );
    await writeFile(linkedPluginDir, 'not-a-symlink');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: '/tmp/app1',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          NODE_MODULES_PATH: nodeModulesPath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(JSON.stringify({
      accessKeyId: 'ak',
      accessKeySecret: 'sk',
      service: {
        domain: 'https://pkg.example.com/',
      },
    }));

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsClean.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': false,
          verbose: true,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsClean.prototype.run.call(command);

    await expect(readFile(path.join(downloadedPluginDir, 'package.json'), 'utf8')).rejects.toThrow();
    expect(log.mock.calls[1]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[2]?.[0]).toContain('@nocobase/plugin-a');
    expect(log.mock.calls[3]?.[0]).toContain(path.join(storagePath, 'plugins', '@nocobase/plugin-a'));
    expect(log.mock.calls[4]?.[0]).toContain('symlink: not found');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});
