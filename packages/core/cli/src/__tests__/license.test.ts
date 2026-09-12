/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { setCliConfigValue } from '../lib/cli-config.js';

function serviceUrl() {
  return 'https://pkg.nocobase.com';
}

function pkgUrl() {
  return 'https://pkg.nocobase.com/';
}

function fetchInputUrl(input: string | URL | Request): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function createMockTarGz(files: Array<{ name: string; content: string }>): Uint8Array {
  const records: Buffer[] = [];

  for (const file of files) {
    const content = Buffer.from(file.content);
    const header = Buffer.alloc(512, 0);
    const name = `package/${file.name}`;
    header.write(name, 0, Math.min(Buffer.byteLength(name), 100), 'utf8');
    header.write('0000777\0', 100, 'ascii');
    header.write('0000000\0', 108, 'ascii');
    header.write('0000000\0', 116, 'ascii');
    header.write(content.length.toString(8).padStart(11, '0') + '\0', 124, 'ascii');
    header.write('00000000000\0', 136, 'ascii');
    header.fill(0x20, 148, 156);
    header[156] = '0'.charCodeAt(0);
    header.write('ustar\0', 257, 'ascii');
    header.write('00', 263, 'ascii');

    let checksum = 0;
    for (const byte of header) {
      checksum += byte;
    }
    header.write(checksum.toString(8).padStart(6, '0'), 148, 'ascii');
    header[154] = 0;
    header[155] = 0x20;

    records.push(header, content);
    const remainder = content.length % 512;
    if (remainder !== 0) {
      records.push(Buffer.alloc(512 - remainder, 0));
    }
  }

  records.push(Buffer.alloc(1024, 0));
  return gzipSync(Buffer.concat(records));
}

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  resolveManagedAppRuntime: vi.fn(),
  getInstanceIdAsync: vi.fn(),
  getEnvAsync: vi.fn(),
  keyDecrypt: vi.fn(),
  checkExternalDbConnection: vi.fn(),
  readExternalDbConnectionConfig: vi.fn(),
  commandOutput: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  announceTargetEnv: vi.fn(),
  activateSelect: vi.fn(),
  activateInput: vi.fn(),
  activatePassword: vi.fn(),
  crossEnvConfirm: vi.fn(),
  fetch: vi.fn(),
  createStoragePluginsSymlink: vi.fn(),
  renderTable: vi.fn(() => 'TABLE'),
}));

vi.mock('../lib/auth-store.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth-store.js')>();
  return {
    ...actual,
    getCurrentEnvName: mocks.getCurrentEnvName,
  };
});

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
    announceTargetEnv: mocks.announceTargetEnv,
    isInteractiveTerminal: mocks.isInteractiveTerminal,
    renderTable: mocks.renderTable,
  };
});

vi.mock('../lib/inquirer.ts', () => ({
  select: mocks.activateSelect,
  input: mocks.activateInput,
  password: mocks.activatePassword,
  confirm: mocks.crossEnvConfirm,
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
  mocks.getCurrentEnvName.mockResolvedValue('dev');
  mocks.isInteractiveTerminal.mockReturnValue(false);
  mocks.activatePassword.mockResolvedValue('bb');
  mocks.crossEnvConfirm.mockResolvedValue(true);
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
  mocks.commandOutput.mockResolvedValue(
    JSON.stringify({
      ok: true,
      instanceId: 'ins_docker_12345',
    }),
  );
  mocks.fetch.mockImplementation(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (String(url).includes('/license-key')) {
      return new Response(
        JSON.stringify({
          data: {
            key: 'license-key-raw',
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }
    if (String(url).includes('/-/verdaccio/sec/login')) {
      return new Response(
        JSON.stringify({
          token: 'pkg-token',
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }
    if (String(url).includes('pro-packages')) {
      return new Response(
        JSON.stringify({
          data: ['@nocobase/plugin-a'],
          meta: {
            commercial_plugins: ['@nocobase/plugin-a', '@nocobase/plugin-b'],
          },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }
    if (String(url).includes('@nocobase/plugin-a')) {
      return new Response(
        JSON.stringify({
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
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      );
    }
    if (String(url).includes('plugin-a.tgz')) {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            createMockTarGz([
              {
                name: 'package.json',
                content: JSON.stringify({
                  name: '@nocobase/plugin-a',
                  version: '2.1.0-beta.24',
                }),
              },
            ]),
          );
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

afterEach(() => {
  vi.unstubAllGlobals();
});

test('license commands expose -y as the cross-env confirmation short flag', async () => {
  const [
    { default: LicenseActivate },
    { default: LicenseId },
    { default: LicenseStatus },
    { default: LicensePluginsList },
    { default: LicensePluginsClean },
    { default: LicensePluginsSync },
  ] = await Promise.all([
    import('../commands/license/activate.js'),
    import('../commands/license/id.js'),
    import('../commands/license/status.js'),
    import('../commands/license/plugins/list.js'),
    import('../commands/license/plugins/clean.js'),
    import('../commands/license/plugins/sync.js'),
  ]);

  for (const command of [
    LicenseActivate,
    LicenseId,
    LicenseStatus,
    LicensePluginsList,
    LicensePluginsClean,
    LicensePluginsSync,
  ]) {
    expect(command.flags.yes.char).toBe('y');
    expect(command.flags.yes.default).toBe(false);
  }
  expect(LicenseActivate.flags.online).toBeUndefined();
  expect(LicenseActivate.flags.account).toBeUndefined();
  expect(LicenseActivate.flags.password).toBeUndefined();
  expect(LicenseActivate.flags.desc).toBeUndefined();
  expect(LicenseActivate.flags.type).toBeUndefined();
});

function setTerminalInteractivity(value: boolean) {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value,
  });

  return () => {
    if (stdinDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
    }
    if (stdoutDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor);
    }
  };
}

test('license id generates and saves the instance id for the selected env', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
    mocks.getInstanceIdAsync.mockImplementation(
      async () => `ins_${process.env.DB_DIALECT}_${process.env.DB_HOST}_${process.env.DB_PORT}`,
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseId.prototype), {
      argv: ['--env', 'app1', '--yes'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
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
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id reuses the saved instance id when force is not set', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
      argv: ['--env', 'app1', '--yes'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
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
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id regenerates and overwrites the saved instance id when force is set', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
      argv: ['--env', 'app1', '--yes', '--force'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
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
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id generates through docker when the selected env uses docker source', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
      argv: ['--env', 'app1', '--yes'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
          force: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseId.prototype.run.call(command);

    await expect(readFile(path.join(storagePath, '.license', 'instance-id'), 'utf8')).resolves.toBe(
      'ins_docker_12345\n',
    );
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
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license id rejects cross-env requests in non-interactive agent sessions without --yes even when --force is set', async () => {
  const { default: LicenseId } = await import('../commands/license/id.js');
  const restoreTerminal = setTerminalInteractivity(false);

  try {
    const command = Object.assign(Object.create(LicenseId.prototype), {
      argv: ['--env', 'prod', '--force'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'prod',
          json: false,
          yes: false,
          force: true,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicenseId.prototype.run.call(command))()).rejects.toThrow(
      /Refusing to run against env "prod" because the current env is "dev"/,
    );
    expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('license activate validates docker envs through docker license env inspection', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    const restoreTerminal = setTerminalInteractivity(true);
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'docker',
      envName: 'app1',
      source: 'docker',
      containerName: 'nb-demo-app1-app',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
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
    mocks.commandOutput.mockResolvedValueOnce(
      JSON.stringify({
        ok: true,
        env: {
          sys: 'linux',
          osVer: '1',
          db: {
            id: 'db-1',
            type: 'postgres',
            name: 'nocobase',
          },
        },
      }),
    );
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        licenseKey: {
          domain: '127.0.0.1:13000',
          licenseStatus: 'active',
        },
        instanceData: {
          sys: 'linux',
          osVer: '1',
          db: {
            id: 'db-1',
            type: 'postgres',
            name: 'nocobase',
          },
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'app1', '--yes', '--key', 'license-key-raw'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
          key: 'license-key-raw',
          'key-file': undefined,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
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
        'env',
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
    expect(log.mock.calls[0]?.[0]).toContain('Activated the license');
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate reports invalid docker license keys before env inspection', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    const restoreTerminal = setTerminalInteractivity(true);
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'docker',
      envName: 'test2',
      source: 'docker',
      containerName: 'nb-demo-test2-app',
      workspaceName: 'nb-demo',
      env: {
        config: {
          appPort: '13000',
        },
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
          DB_DIALECT: 'postgres',
          DB_HOST: 'postgres',
          DB_PORT: '5432',
          DB_DATABASE: 'nocobase',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'secret',
        },
      },
    });
    mocks.keyDecrypt.mockImplementation(() => {
      throw new Error('bad key');
    });
    mocks.commandOutput.mockRejectedValue(
      new Error(
        'docker run exited with code 1: GenericFailure, Get postgres configuration error: error connecting to server: failed to lookup address information: Name or service not known',
      ),
    );

    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'test2', '--yes', '--key', 'bad-license-key'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'test2',
          json: false,
          yes: true,
          key: 'bad-license-key',
          'key-file': undefined,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicenseActivate.prototype.run.call(command))()).rejects.toThrow(/license key is invalid/);
    expect(mocks.commandOutput).not.toHaveBeenCalled();
    expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license generate-id returns an instance id without saving it', async () => {
  const { default: LicenseGenerateId } = await import('../commands/license/generate-id.js');
  const originalHost = process.env.DB_HOST;
  mocks.getInstanceIdAsync.mockImplementation(
    async () => `ins_${process.env.DB_DIALECT}_${process.env.DB_HOST}_${process.env.DB_PORT}`,
  );

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
    const restoreTerminal = setTerminalInteractivity(true);
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
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
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'app1', '--yes', '--key', 'license-key-raw'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
          key: 'license-key-raw',
          'key-file': undefined,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
    const saved = await readFile(path.join(storagePath, '.license', 'license-key'), 'utf8');
    expect(saved).toBe('license-key-raw');
    expect(log.mock.calls[0]?.[0]).toContain('Activated the license');
    expect(log.mock.calls[1]?.[0]).toContain('Saved the license key securely for this env');
    expect(String(log.mock.calls[1]?.[0] ?? '')).not.toContain('license-key');
    expect(String(log.mock.calls[1]?.[0] ?? '')).not.toContain(storagePath);
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate rejects a key that does not match the current domain', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
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
      }),
    );

    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'app1', '--yes', '--key', 'license-key-raw'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
          key: 'license-key-raw',
          'key-file': undefined,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicenseActivate.prototype.run.call(command))()).rejects.toThrow(
      /does not match the current app domain/,
    );
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate supports interactive pasted key input', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const longInstanceId = `ins_${'a'.repeat(140)}`;

  try {
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.activateSelect.mockResolvedValueOnce('key');
    mocks.activatePassword.mockResolvedValueOnce('license-key-raw');
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
    mocks.getInstanceIdAsync.mockResolvedValue(longInstanceId);
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
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
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'app1'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: false,
          key: undefined,
          'key-file': undefined,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    const instanceIdNotice = String(log.mock.calls[0]?.[0] ?? '');
    expect(instanceIdNotice).toContain('❯ Hostname');
    expect(instanceIdNotice).toContain('127.0.0.1:13000');
    expect(instanceIdNotice).toContain('❯ Instance ID');
    expect(instanceIdNotice).toContain(longInstanceId);
    expect(instanceIdNotice).not.toContain(`\n  ${longInstanceId.slice(60, 72)}`);
    expect(instanceIdNotice).toContain(
      'Copy this hostname and instance ID when checking or activating the license key.',
    );
    expect(String(mocks.activateSelect.mock.calls[0]?.[0]?.message)).toBe('License key input method');
    expect(mocks.activateSelect.mock.calls[0]?.[0]?.default).toBe('key');
    expect(String(mocks.activatePassword.mock.calls[0]?.[0]?.message)).toBe('License key');
    expect(mocks.activatePassword.mock.calls[0]?.[0]?.mask).toBe(false);
    expect(typeof mocks.activatePassword.mock.calls[0]?.[0]?.transformer).toBe('function');
    expect(mocks.activatePassword.mock.calls[0]?.[0]?.transformer('license-key-raw')).toBe('Entered 15 chars');
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(log.mock.calls.some((call) => String(call[0]).includes('Activated the license'))).toBe(true);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license activate rejects cross-env requests in non-interactive agent sessions without --yes', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const restoreTerminal = setTerminalInteractivity(false);

  try {
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'prod', '--key', 'license-key-raw'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'prod',
          json: false,
          yes: false,
          key: 'license-key-raw',
          'key-file': undefined,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicenseActivate.prototype.run.call(command))()).rejects.toThrow(
      /Refusing to run against env "prod" because the current env is "dev"/,
    );
    expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  } finally {
    restoreTerminal();
  }
});

test('license plugin helpers normalize package registry urls', async () => {
  const module = await import('../commands/license/shared.js');
  expect(await module.resolveLicensePkgUrl(pkgUrl().replace(/\/$/, ''))).toBe(pkgUrl());
  expect(await module.resolveLicenseServiceUrl(`${serviceUrl()}/`)).toBe(serviceUrl());
});

test('license plugin helpers fall back to configured pkg url', async () => {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-license-config-'));
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await setCliConfigValue('license.pkg-url', 'https://pkg.example.com', { scope: 'global' });
    const module = await import('../commands/license/shared.js');
    expect(await module.resolveLicensePkgUrl()).toBe('https://pkg.example.com/');
    expect(await module.resolveLicenseServiceUrl()).toBe('https://pkg.example.com');
  } finally {
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
});

test('license activate supports interactive key input cancellation', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');

  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.activateSelect.mockRejectedValueOnce(new Error('cancelled'));
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
    argv: ['--env', 'app1'],
    parse: vi.fn(async () => ({
      flags: {
        env: 'app1',
        json: false,
        yes: false,
        key: undefined,
        'key-file': undefined,
      },
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await LicenseActivate.prototype.run.call(command);

  expect(String(mocks.activateSelect.mock.calls[0]?.[0]?.message)).toBe('License key input method');
  expect(log.mock.calls.some((call) => String(call[0]).includes('Activated the license'))).toBe(false);
});

test('license activate prompts with key as the default key input option', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');

  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.activateSelect.mockRejectedValueOnce(new Error('cancelled'));
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot: '/tmp/dev',
    workspaceName: 'nb-demo',
    env: {
      config: {},
      storagePath: '/tmp/storage',
      envVars: {
        STORAGE_PATH: '/tmp/storage',
      },
    },
  });

  const command = Object.assign(Object.create(LicenseActivate.prototype), {
    argv: [],
    parse: vi.fn(async () => ({
      flags: {
        env: undefined,
        json: false,
        yes: false,
        key: undefined,
        'key-file': undefined,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await LicenseActivate.prototype.run.call(command);

  expect(String(mocks.activateSelect.mock.calls[0]?.[0]?.message)).toBe('License key input method');
  expect(mocks.activateSelect.mock.calls[0]?.[0]?.default).toBe('key');
  expect(mocks.activateSelect.mock.calls[0]?.[0]?.choices?.[0]).toEqual({
    value: 'key',
    name: 'Paste the license key',
  });
});

test('license activate uses configured zh-CN locale for interactive prompts and notices', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-locale-'));
  const longInstanceId = `ins_${'b'.repeat(140)}`;
  const previousRoot = process.env.NB_CLI_ROOT;
  const previousNbLocale = process.env.NB_LOCALE;

  process.env.NB_CLI_ROOT = tempHome;
  delete process.env.NB_LOCALE;

  try {
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });
    mocks.getCurrentEnvName.mockResolvedValue('app1');
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.activateSelect.mockResolvedValueOnce('key');
    mocks.activatePassword.mockResolvedValueOnce('license-key-raw');
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
    mocks.getInstanceIdAsync.mockResolvedValue(longInstanceId);
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
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
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'app1'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: false,
          key: undefined,
          'key-file': undefined,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    const instanceIdNotice = String(log.mock.calls[0]?.[0] ?? '');
    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
    expect(instanceIdNotice).toContain('❯ 主机名');
    expect(instanceIdNotice).toContain('127.0.0.1:13000');
    expect(instanceIdNotice).toContain('❯ 实例 ID');
    expect(instanceIdNotice).toContain(longInstanceId);
    expect(instanceIdNotice).toContain('校验或激活 license key 时，请复制这个主机名和实例 ID。');
    expect(String(mocks.activateSelect.mock.calls[0]?.[0]?.message)).toBe('License key 提供方式');
    expect(mocks.activateSelect.mock.calls[0]?.[0]?.choices?.[0]).toEqual({
      value: 'key',
      name: '直接粘贴 license key',
    });
    expect(String(mocks.activatePassword.mock.calls[0]?.[0]?.message)).toBe('License Key');
    expect(mocks.activatePassword.mock.calls[0]?.[0]?.transformer('license-key-raw')).toBe('已输入 15 个字符');
    expect(log.mock.calls.some((call) => String(call[0]).includes('已为 env "app1" 激活 license。'))).toBe(true);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousRoot;
    }

    if (previousNbLocale === undefined) {
      delete process.env.NB_LOCALE;
    } else {
      process.env.NB_LOCALE = previousNbLocale;
    }

    await rm(storagePath, { recursive: true, force: true });
    await rm(tempHome, { recursive: true, force: true });
  }
});

test('license activate uses zh-CN locale for cross-env confirmation prompt', async () => {
  const { default: LicenseActivate } = await import('../commands/license/activate.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-locale-'));
  const previousRoot = process.env.NB_CLI_ROOT;
  const previousNbLocale = process.env.NB_LOCALE;

  process.env.NB_CLI_ROOT = tempHome;
  delete process.env.NB_LOCALE;

  try {
    await setCliConfigValue('locale', 'zh-CN', { scope: 'global' });
    mocks.isInteractiveTerminal.mockReturnValue(true);
    mocks.crossEnvConfirm.mockResolvedValueOnce(true);
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'prod',
      source: 'npm',
      projectRoot: '/tmp/prod',
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
    mocks.getInstanceIdAsync.mockResolvedValue('ins_prod_123');
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
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
      }),
    );

    const command = Object.assign(Object.create(LicenseActivate.prototype), {
      argv: ['--env', 'prod', '--key', 'license-key-raw'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'prod',
          json: false,
          yes: false,
          key: 'license-key-raw',
          'key-file': undefined,
        },
      })),
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseActivate.prototype.run.call(command);

    expect(String(mocks.crossEnvConfirm.mock.calls[0]?.[0]?.message)).toBe(
      '当前 env 是 "dev"，但该命令通过 --env 指向了 "prod"。要在不切换当前 env 的情况下继续吗？',
    );
  } finally {
    if (previousRoot === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previousRoot;
    }

    if (previousNbLocale === undefined) {
      delete process.env.NB_LOCALE;
    } else {
      process.env.NB_LOCALE = previousNbLocale;
    }

    await rm(storagePath, { recursive: true, force: true });
    await rm(tempHome, { recursive: true, force: true });
  }
});

test('license plugins list shows licensed and unlicensed commercial plugins', async () => {
  const { default: LicensePluginsList } = await import('../commands/license/plugins/list.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    const restoreTerminal = setTerminalInteractivity(true);
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsList.prototype), {
      argv: ['--env', 'app1', '--yes'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          yes: true,
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
    restoreTerminal();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license status asks for confirmation before cross-env requests in interactive sessions', async () => {
  const { default: LicenseStatus } = await import('../commands/license/status.js');
  const restoreTerminal = setTerminalInteractivity(true);

  try {
    mocks.crossEnvConfirm.mockResolvedValue(true);
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'prod',
      source: 'npm',
      projectRoot: '/tmp/prod',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath: '/tmp/prod-storage',
        envVars: {
          STORAGE_PATH: '/tmp/prod-storage',
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

    const log = vi.fn();
    const command = Object.assign(Object.create(LicenseStatus.prototype), {
      argv: ['--env', 'prod'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'prod',
          json: false,
          yes: false,
          doctor: false,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicenseStatus.prototype.run.call(command);

    expect(mocks.crossEnvConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Current env is "dev", but this command targets "prod" via --env. Continue without switching the current env?',
        default: false,
      }),
    );
    expect(log.mock.calls[0]?.[0]).toContain('License status for env "prod"');
  } finally {
    restoreTerminal();
  }
});

test('license plugins list lets --yes skip the interactive cross-env confirmation prompt', async () => {
  const { default: LicensePluginsList } = await import('../commands/license/plugins/list.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const restoreTerminal = setTerminalInteractivity(true);

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'prod',
      source: 'npm',
      projectRoot: '/tmp/prod',
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsList.prototype), {
      argv: ['--env', 'prod', '--yes'],
      parse: vi.fn(async () => ({
        flags: {
          env: 'prod',
          json: false,
          yes: true,
        },
      })),
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsList.prototype.run.call(command);

    expect(mocks.crossEnvConfirm).not.toHaveBeenCalled();
    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugins for env "prod"');
  } finally {
    restoreTerminal();
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync can skip cleanly when no saved license key exists', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
        },
      },
    });

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': false,
          version: undefined,
          'skip-if-no-license': true,
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

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
    expect(log).not.toHaveBeenCalled();
    expect(mocks.commandOutput).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('loadSavedLicenseKeyData throws a dedicated error when no saved license key exists', async () => {
  const { MissingSavedLicenseKeyError, loadSavedLicenseKeyData } = await import(
    '../commands/license/plugins/shared.js'
  );
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));

  try {
    await expect(
      loadSavedLicenseKeyData({
        kind: 'local',
        envName: 'app1',
        source: 'npm',
        projectRoot: path.join(storagePath, 'app'),
        workspaceName: 'nb-demo',
        env: {
          config: {},
          storagePath,
          envVars: {
            STORAGE_PATH: storagePath,
          },
        },
      }),
    ).rejects.toBeInstanceOf(MissingSavedLicenseKeyError);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync still throws other license errors when skip-if-no-license is set', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const appPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(appPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(appPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-beta.24.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
      workspaceName: 'nb-demo',
      env: {
        config: {},
        storagePath,
        envVars: {
          STORAGE_PATH: storagePath,
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': false,
          version: undefined,
          'skip-if-no-license': true,
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicensePluginsSync.prototype.run.call(command))()).rejects.toThrow(
      /does not include package registry credentials/i,
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync supports dry-run previews', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const appPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(appPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(appPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-beta.24.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: undefined,
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

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
    expect(log.mock.calls[0]?.[0]).toContain('Commercial plugin sync preview');
    expect(log.mock.calls[1]?.[0]).toContain('App version: 2.1.0-beta.24.20260501164635');
    expect(log.mock.calls[2]?.[0]).toContain('Download version: 2.1.0-beta.24');
    expect(log.mock.calls[3]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[4]?.[0]).toContain('Result:');
    expect(log.mock.calls[4]?.[0]).toContain('1 installed');
    expect(log.mock.calls[4]?.[0]).toContain('1 removed');
    expect(log).toHaveBeenCalledTimes(5);
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync outputs per-plugin details in verbose mode', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const appPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(appPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(appPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-beta.24.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: undefined,
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
    expect(log.mock.calls[1]?.[0]).toContain('App version: 2.1.0-beta.24.20260501164635');
    expect(log.mock.calls[2]?.[0]).toContain('Download version: 2.1.0-beta.24');
    expect(log.mock.calls[3]?.[0]).toContain(path.join(storagePath, 'plugins'));
    expect(log.mock.calls[4]?.[0]).toContain('@nocobase/plugin-b');
    expect(log.mock.calls[5]?.[0]).toContain(path.join(storagePath, 'plugins', '@nocobase/plugin-b'));
    expect(log.mock.calls[6]?.[0]).toContain('@nocobase/plugin-a');
    expect(log.mock.calls[7]?.[0]).toContain(path.join(storagePath, 'plugins', '@nocobase/plugin-a'));
    expect(log.mock.calls[8]?.[0]).toContain('Summary: 1 installed, 0 updated, 1 removed, 0 skipped, 0 warnings');
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://service.example.com/',
        },
      }),
    );
    mocks.fetch.mockImplementation(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (String(url).includes('/-/verdaccio/sec/login')) {
        return new Response(
          JSON.stringify({
            token: 'pkg-token',
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }
      if (String(url).includes('pro-packages')) {
        return new Response(
          JSON.stringify({
            data: ['@nocobase/plugin-a'],
            meta: {
              commercial_plugins: ['@nocobase/plugin-a'],
            },
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
      }
      if (String(url).includes('@nocobase/plugin-a')) {
        return new Response(
          JSON.stringify({
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
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        );
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

test('license plugins sync skips downloading plugins that already match the requested version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
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
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

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

    expect(
      mocks.fetch.mock.calls.some(([input]) => {
        return fetchInputUrl(input as string | URL | Request).includes('plugin-a.tgz');
      }),
    ).toBe(false);
    expect(log.mock.calls.some((call) => String(call[0]).includes('1 skipped'))).toBe(true);
    await expect(readFile(path.join(downloadedPluginDir, 'package.json'), 'utf8')).resolves.toContain('2.1.0-beta.24');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync dry-run skips plugins that already match the requested version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
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
        },
      },
    });
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

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

    const resultLine = String(log.mock.calls.at(-1)?.[0] ?? '');
    expect(resultLine).toContain('1 skipped');
    expect(resultLine).not.toContain('updated');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync reads app version from docker image when version flag is omitted', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');

  try {
    await mkdir(licenseDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
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
          NODE_MODULES_PATH: path.join(storagePath, 'node_modules'),
        },
      },
    });
    mocks.commandOutput.mockResolvedValueOnce('@nocobase/cli/2.1.0-beta.24.20260501164635 darwin-arm64 node-v22.22.2');
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: undefined,
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
        '--version',
      ],
      { errorName: 'docker run' },
    );
    expect(log.mock.calls[1]?.[0]).toContain('App version: 2.1.0-beta.24.20260501164635');
    expect(log.mock.calls[2]?.[0]).toContain('Download version: 2.1.0-beta.24');
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync errors when local app package version is missing', async () => {
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
      projectRoot: path.join(storagePath, 'app'),
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

    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: false,
          'dry-run': true,
          version: undefined,
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-beta.24',
        },
      },
      log: vi.fn(),
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await expect((() => LicensePluginsSync.prototype.run.call(command))()).rejects.toThrow(
      /Missing node_modules\/@nocobase\/app\/package\.json/,
    );
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync keeps the raw version in output and shortens the registry version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const cliPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(cliPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(cliPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-beta.24.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: true,
          'dry-run': true,
          version: undefined,
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

    expect(JSON.parse(String(log.mock.calls[0]?.[0] ?? ''))).toMatchObject({
      version: '2.1.0-beta.24.20260501164635',
      registryVersion: '2.1.0-beta.24',
    });
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync normalizes rc app version to release registry version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const cliPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(cliPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(cliPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-rc.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: true,
          'dry-run': true,
          version: undefined,
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-rc',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(JSON.parse(String(log.mock.calls[0]?.[0] ?? ''))).toMatchObject({
      version: '2.1.0-rc.20260501164635',
      registryVersion: '2.1.0',
    });
  } finally {
    await rm(storagePath, { recursive: true, force: true });
  }
});

test('license plugins sync normalizes alpha app version to alpha registry version', async () => {
  const { default: LicensePluginsSync } = await import('../commands/license/plugins/sync.js');
  const storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-license-'));
  const licenseDir = path.join(storagePath, '.license');
  const cliPackageDir = path.join(storagePath, 'app', 'node_modules', '@nocobase', 'app');

  try {
    await mkdir(licenseDir, { recursive: true });
    await mkdir(cliPackageDir, { recursive: true });
    await writeFile(path.join(licenseDir, 'license-key'), 'license-key-raw');
    await writeFile(
      path.join(cliPackageDir, 'package.json'),
      JSON.stringify({ name: '@nocobase/app', version: '2.1.0-alpha.24.20260501164635' }),
    );
    mocks.resolveManagedAppRuntime.mockResolvedValue({
      kind: 'local',
      envName: 'app1',
      source: 'npm',
      projectRoot: path.join(storagePath, 'app'),
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

    const log = vi.fn();
    const command = Object.assign(Object.create(LicensePluginsSync.prototype), {
      parse: vi.fn(async () => ({
        flags: {
          env: 'app1',
          json: true,
          'dry-run': true,
          version: undefined,
          verbose: false,
        },
      })),
      config: {
        pjson: {
          version: '2.1.0-alpha.24',
        },
      },
      log,
      error: (message: string) => {
        throw new Error(message);
      },
    });

    await LicensePluginsSync.prototype.run.call(command);

    expect(JSON.parse(String(log.mock.calls[0]?.[0] ?? ''))).toMatchObject({
      version: '2.1.0-alpha.24.20260501164635',
      registryVersion: '2.1.0-alpha.24',
    });
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

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

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
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
    mocks.keyDecrypt.mockReturnValue(
      JSON.stringify({
        accessKeyId: 'ak',
        accessKeySecret: 'sk',
        service: {
          domain: 'https://pkg.example.com/',
        },
      }),
    );

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
