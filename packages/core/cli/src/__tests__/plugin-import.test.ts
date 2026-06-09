/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, expect, test, vi } from 'vitest';
import { saveAuthConfig } from '../lib/auth-store.js';
import { importPluginArchive, importPluginSource } from '../lib/plugin-import.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-home-'));
  const tempWorkspace = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-cwd-'));
  const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempWorkspace);
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await run();
  } finally {
    cwdSpy.mockRestore();
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await fsp.rm(tempHome, { recursive: true, force: true });
    await fsp.rm(tempWorkspace, { recursive: true, force: true });
  }
}

function encodeOctal(value: number, length: number): Buffer {
  const text = value.toString(8).padStart(length - 1, '0');
  return Buffer.from(`${text}\0`, 'ascii');
}

function writeTarHeader(buffer: Buffer, name: string, size: number, typeflag = '0'): void {
  buffer.fill(0);
  Buffer.from(name, 'utf8').copy(buffer, 0, 0, Math.min(Buffer.byteLength(name), 100));
  encodeOctal(0o644, 8).copy(buffer, 100);
  encodeOctal(0, 8).copy(buffer, 108);
  encodeOctal(0, 8).copy(buffer, 116);
  encodeOctal(size, 12).copy(buffer, 124);
  encodeOctal(Math.floor(Date.now() / 1000), 12).copy(buffer, 136);
  buffer.fill(0x20, 148, 156);
  buffer.write(typeflag, 156, 1, 'ascii');
  Buffer.from('ustar\0', 'ascii').copy(buffer, 257);
  Buffer.from('00', 'ascii').copy(buffer, 263);

  let checksum = 0;
  for (const byte of buffer) {
    checksum += byte;
  }
  Buffer.from(checksum.toString(8).padStart(6, '0')).copy(buffer, 148);
  buffer[154] = 0;
  buffer[155] = 0x20;
}

function buildTarGz(files: Record<string, string>): Buffer {
  const chunks: Buffer[] = [];

  for (const [name, content] of Object.entries(files)) {
    const body = Buffer.from(content, 'utf8');
    const header = Buffer.alloc(512);
    writeTarHeader(header, name, body.length);
    chunks.push(header, body);
    const remainder = body.length % 512;
    if (remainder !== 0) {
      chunks.push(Buffer.alloc(512 - remainder));
    }
  }

  chunks.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(chunks));
}

async function writePluginTarball(
  root: string,
  packageName: string,
  version = '1.0.0',
  extraFiles: Record<string, string> = {},
): Promise<string> {
  const tarballPath = path.join(root, `${packageName.split('/').pop()}-${version}.tgz`);
  const archive = buildTarGz({
    'package/package.json': JSON.stringify(
      {
        name: packageName,
        version,
      },
      null,
      2,
    ),
    'package/server.js': 'module.exports = {};\n',
    'package/client.js': 'module.exports = {};\n',
    ...extraFiles,
  });
  await fsp.writeFile(tarballPath, archive);
  return tarballPath;
}

test('importPluginArchive extracts a local plugin archive into storage/plugins', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-local-'));
  const storagePath = path.join(dir, 'storage');

  try {
    const tarballPath = await writePluginTarball(dir, '@nocobase/plugin-demo', '1.2.3');
    const result = await importPluginArchive(tarballPath, storagePath);

    expect(result.action).toBe('installed');
    expect(result.packageName).toBe('@nocobase/plugin-demo');
    expect(result.packageVersion).toBe('1.2.3');
    expect(result.outputDir).toBe(path.join(storagePath, 'plugins', '@nocobase', 'plugin-demo'));
    expect(JSON.parse(await fsp.readFile(path.join(result.outputDir, 'package.json'), 'utf8'))).toMatchObject({
      name: '@nocobase/plugin-demo',
      version: '1.2.3',
    });
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginArchive downloads and extracts a remote plugin archive', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-remote-'));
  const storagePath = path.join(dir, 'storage');
  const archive = buildTarGz({
    'package/package.json': JSON.stringify({ name: '@nocobase/plugin-remote', version: '2.0.0' }, null, 2),
    'package/server.js': 'module.exports = {};\n',
  });
  const fetchMock = vi.fn(async () => new Response(archive, { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  try {
    const result = await importPluginArchive('https://pkg.example.com/plugin-remote-2.0.0.tgz', storagePath);

    expect(fetchMock).toHaveBeenCalledWith('https://pkg.example.com/plugin-remote-2.0.0.tgz', {
      redirect: 'manual',
    });
    expect(result.sourceType).toBe('url');
    expect(result.outputDir).toBe(path.join(storagePath, 'plugins', '@nocobase', 'plugin-remote'));
    expect(await fsp.readFile(path.join(result.outputDir, 'server.js'), 'utf8')).toContain('module.exports');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginSource packs an npm package tarball from the configured registry', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-npm-'));
  const storagePath = path.join(dir, 'storage');
  const runFn = vi.fn(async (_name: string, args: string[], options?: { cwd?: string }) => {
    expect(args).toEqual(['pack', '--silent', '--registry=https://registry.example.com', '@nocobase/plugin-acl@beta']);
    expect(options?.cwd).toBeTruthy();
    await writePluginTarball(String(options?.cwd), '@nocobase/plugin-acl', '2.1.0-beta.3');
  });

  try {
    const result = await importPluginSource('@nocobase/plugin-acl@beta', {
      storagePath,
      npmRegistry: 'https://registry.example.com/',
      runFn: runFn as never,
    });

    expect(runFn).toHaveBeenCalledTimes(1);
    expect(result.sourceType).toBe('npm');
    expect(result.source).toBe('@nocobase/plugin-acl@beta');
    expect(result.packageVersion).toBe('2.1.0-beta.3');
    expect(result.outputDir).toBe(path.join(storagePath, 'plugins', '@nocobase', 'plugin-acl'));
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginSource uses npm default registry behavior when no registry override is passed', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-npm-public-'));
  const storagePath = path.join(dir, 'storage');
  const runFn = vi.fn(async (_name: string, args: string[], options?: { cwd?: string }) => {
    expect(args).toEqual(['pack', '--silent', '@nocobase/plugin-public']);
    await writePluginTarball(String(options?.cwd), '@nocobase/plugin-public', '1.0.0');
  });

  try {
    const result = await importPluginSource('@nocobase/plugin-public', {
      storagePath,
      runFn: runFn as never,
    });

    expect(runFn).toHaveBeenCalledTimes(1);
    expect(result.packageName).toBe('@nocobase/plugin-public');
    expect(result.packageVersion).toBe('1.0.0');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginSource suggests npm login when npm pack fails with an auth error', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-auth-error-'));
  const storagePath = path.join(dir, 'storage');
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { onStderr?: (chunk: string) => void }) => {
    options?.onStderr?.(
      'npm error code E401\nnpm error Unable to authenticate, your authentication token seems to be invalid.\n',
    );
    throw new Error('npm pack exited with code 1');
  });

  try {
    await expect(
      importPluginSource('@my-scope/plugin-private@beta', {
        storagePath,
        npmRegistry: 'https://registry.example.com/',
        runFn: runFn as never,
      }),
    ).rejects.toThrow(
      'Hint: If this is a private registry, run `npm login --registry=https://registry.example.com` first and retry.',
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginSource suggests checking the package spec when npm pack cannot find the package or tag', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-not-found-'));
  const storagePath = path.join(dir, 'storage');
  const runFn = vi.fn(async (_name: string, _args: string[], options?: { onStderr?: (chunk: string) => void }) => {
    options?.onStderr?.(
      'npm error code ETARGET\nnpm error notarget No matching version found for @nocobase/plugin-acl@beta.\n',
    );
    throw new Error('npm pack exited with code 1');
  });

  try {
    await expect(
      importPluginSource('@nocobase/plugin-acl@beta', {
        storagePath,
        runFn: runFn as never,
      }),
    ).rejects.toThrow(
      'Hint: Check that "@nocobase/plugin-acl@beta" exists and that the package name or tag is correct.',
    );
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('importPluginArchive replaces an existing plugin directory cleanly', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-update-'));
  const storagePath = path.join(dir, 'storage');
  const pluginDir = path.join(storagePath, 'plugins', '@nocobase', 'plugin-update');

  try {
    await fsp.mkdir(pluginDir, { recursive: true });
    await fsp.writeFile(path.join(pluginDir, 'package.json'), JSON.stringify({ name: '@nocobase/plugin-update' }));
    await fsp.writeFile(path.join(pluginDir, 'stale.txt'), 'old file');

    const tarballPath = await writePluginTarball(dir, '@nocobase/plugin-update', '3.1.0');
    const result = await importPluginArchive(tarballPath, storagePath);

    expect(result.action).toBe('updated');
    await expect(fsp.access(path.join(pluginDir, 'stale.txt'))).rejects.toThrow();
    expect(JSON.parse(await fsp.readFile(path.join(pluginDir, 'package.json'), 'utf8')).version).toBe('3.1.0');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('nb plugin import writes into the selected docker env storage path', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');

    const { default: PluginImport } = await import('../commands/plugin/import.js');
    const storagePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-docker-${Date.now()}`);
    const tarballRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-plugin-import-tarball-'));

    try {
      await saveAuthConfig(
        {
          lastEnv: 'docker-env',
          envs: {
            'docker-env': {
              source: 'docker',
              storagePath,
            },
          },
        },
        { scope: 'global' },
      );

      const tarballPath = await writePluginTarball(tarballRoot, '@nocobase/plugin-docker', '4.0.0');
      const command = Object.assign(Object.create(PluginImport.prototype), {
        parse: vi.fn(async () => ({
          args: {
            archive: tarballPath,
          },
          flags: {},
        })),
        log: vi.fn(),
        error: vi.fn((message: string) => {
          throw new Error(message);
        }),
        argv: [],
      });

      await PluginImport.prototype.run.call(command);

      expect(command.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Imported @nocobase/plugin-docker@4.0.0 into ${path.join(
            storagePath,
            'plugins',
            '@nocobase',
            'plugin-docker',
          )}`,
        ),
      );
      expect(
        JSON.parse(
          await fsp.readFile(path.join(storagePath, 'plugins', '@nocobase', 'plugin-docker', 'package.json'), 'utf8'),
        ).name,
      ).toBe('@nocobase/plugin-docker');
    } finally {
      await fsp.rm(storagePath, { recursive: true, force: true });
      await fsp.rm(tarballRoot, { recursive: true, force: true });
    }
  });
});

test('nb plugin import uses --npm-registry when importing an npm package spec', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');
    vi.resetModules();

    const storagePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-registry-${Date.now()}`);
    const importPluginSourceMock = vi.fn(
      async (_source: string, _options: { storagePath?: string; npmRegistry?: string }) => {
        return {
          action: 'installed' as const,
          packageName: '@nocobase/plugin-acl',
          packageVersion: '2.1.0-beta.3',
          outputDir: path.join(storagePath, 'plugins', '@nocobase', 'plugin-acl'),
          source: '@nocobase/plugin-acl@beta',
          sourceType: 'npm' as const,
          storagePluginsPath: path.join(storagePath, 'plugins'),
        };
      },
    );
    vi.doMock('../lib/plugin-import.js', async () => {
      const actual = await vi.importActual<typeof import('../lib/plugin-import.js')>('../lib/plugin-import.js');
      return {
        ...actual,
        importPluginSource: importPluginSourceMock,
      };
    });

    try {
      const { default: PluginImport } = await import('../commands/plugin/import.js');
      await saveAuthConfig(
        {
          lastEnv: 'local-env',
          envs: {
            'local-env': {
              source: 'git',
              appRootPath: './apps/local-env',
              storagePath,
            },
          },
        },
        { scope: 'global' },
      );

      const command = Object.assign(Object.create(PluginImport.prototype), {
        parse: vi.fn(async () => ({
          args: {
            archive: '@nocobase/plugin-acl@beta',
          },
          flags: {
            'npm-registry': 'https://registry.example.com/',
          },
        })),
        log: vi.fn(),
        error: vi.fn((message: string) => {
          throw new Error(message);
        }),
        argv: [],
      });

      await PluginImport.prototype.run.call(command);

      expect(importPluginSourceMock).toHaveBeenCalledWith('@nocobase/plugin-acl@beta', {
        storagePath,
        npmRegistry: 'https://registry.example.com/',
      });
      expect(command.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Imported @nocobase/plugin-acl@2.1.0-beta.3 into ${path.join(
            storagePath,
            'plugins',
            '@nocobase',
            'plugin-acl',
          )}`,
        ),
      );
      expect(command.log).toHaveBeenCalledWith(
        'Restart the app before enabling or using the plugin: `nb app restart --env local-env`.',
      );
    } finally {
      vi.unmock('../lib/plugin-import.js');
      vi.resetModules();
      await fsp.rm(storagePath, { recursive: true, force: true });
    }
  });
});

test('nb plugin import uses --storage-path to override the selected env storage path', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');
    vi.resetModules();

    const envStoragePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-env-storage-${Date.now()}`);
    const customStoragePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-custom-storage-${Date.now()}`);
    const importPluginSourceMock = vi.fn(
      async (_source: string, _options: { storagePath?: string; npmRegistry?: string }) => {
        return {
          action: 'installed' as const,
          packageName: '@nocobase/plugin-acl',
          packageVersion: '2.1.0-beta.3',
          outputDir: path.join(customStoragePath, 'plugins', '@nocobase', 'plugin-acl'),
          source: '@nocobase/plugin-acl@beta',
          sourceType: 'npm' as const,
          storagePluginsPath: path.join(customStoragePath, 'plugins'),
        };
      },
    );
    vi.doMock('../lib/plugin-import.js', async () => {
      const actual = await vi.importActual<typeof import('../lib/plugin-import.js')>('../lib/plugin-import.js');
      return {
        ...actual,
        importPluginSource: importPluginSourceMock,
      };
    });

    try {
      const { default: PluginImport } = await import('../commands/plugin/import.js');
      await saveAuthConfig(
        {
          lastEnv: 'local-env',
          envs: {
            'local-env': {
              source: 'git',
              appRootPath: './apps/local-env',
              storagePath: envStoragePath,
            },
          },
        },
        { scope: 'global' },
      );

      const command = Object.assign(Object.create(PluginImport.prototype), {
        parse: vi.fn(async () => ({
          args: {
            archive: '@nocobase/plugin-acl@beta',
          },
          flags: {
            'storage-path': ` ${customStoragePath} `,
          },
        })),
        log: vi.fn(),
        error: vi.fn((message: string) => {
          throw new Error(message);
        }),
        argv: [],
      });

      await PluginImport.prototype.run.call(command);

      expect(importPluginSourceMock).toHaveBeenCalledWith('@nocobase/plugin-acl@beta', {
        storagePath: customStoragePath,
        npmRegistry: undefined,
      });
      expect(command.log).toHaveBeenCalledWith(`Plugin storage path: ${path.join(customStoragePath, 'plugins')}`);
    } finally {
      vi.unmock('../lib/plugin-import.js');
      vi.resetModules();
      await fsp.rm(envStoragePath, { recursive: true, force: true });
      await fsp.rm(customStoragePath, { recursive: true, force: true });
    }
  });
});

test('nb plugin import allows --storage-path without selecting a local env', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');
    vi.resetModules();

    const customStoragePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-storage-only-${Date.now()}`);
    const importPluginSourceMock = vi.fn(
      async (_source: string, _options: { storagePath?: string; npmRegistry?: string }) => {
        return {
          action: 'installed' as const,
          packageName: '@nocobase/plugin-acl',
          packageVersion: '2.1.0-beta.3',
          outputDir: path.join(customStoragePath, 'plugins', '@nocobase', 'plugin-acl'),
          source: '@nocobase/plugin-acl@beta',
          sourceType: 'npm' as const,
          storagePluginsPath: path.join(customStoragePath, 'plugins'),
        };
      },
    );
    vi.doMock('../lib/plugin-import.js', async () => {
      const actual = await vi.importActual<typeof import('../lib/plugin-import.js')>('../lib/plugin-import.js');
      return {
        ...actual,
        importPluginSource: importPluginSourceMock,
      };
    });

    try {
      const { default: PluginImport } = await import('../commands/plugin/import.js');
      await saveAuthConfig(
        {
          lastEnv: 'remote-env',
          envs: {
            'remote-env': {
              baseUrl: 'https://demo.example.com/api',
            },
          },
        },
        { scope: 'global' },
      );

      const command = Object.assign(Object.create(PluginImport.prototype), {
        parse: vi.fn(async () => ({
          args: {
            archive: '@nocobase/plugin-acl@beta',
          },
          flags: {
            'storage-path': customStoragePath,
          },
        })),
        log: vi.fn(),
        error: vi.fn((message: string) => {
          throw new Error(message);
        }),
        argv: [],
      });

      await PluginImport.prototype.run.call(command);

      expect(importPluginSourceMock).toHaveBeenCalledWith('@nocobase/plugin-acl@beta', {
        storagePath: customStoragePath,
        npmRegistry: undefined,
      });
      expect(command.log).toHaveBeenCalledWith(
        'Restart the app that uses this plugin storage path before enabling or using the plugin.',
      );
    } finally {
      vi.unmock('../lib/plugin-import.js');
      vi.resetModules();
      await fsp.rm(customStoragePath, { recursive: true, force: true });
    }
  });
});

test('nb plugin import tells the user to restart after updating an existing plugin', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');
    vi.resetModules();

    const storagePath = path.join(os.tmpdir(), `nocobase-cli-plugin-import-restart-${Date.now()}`);
    const importPluginSourceMock = vi.fn(
      async (_source: string, _options: { storagePath?: string; npmRegistry?: string }) => {
        return {
          action: 'updated' as const,
          packageName: '@nocobase/plugin-acl',
          packageVersion: '2.1.0-beta.4',
          outputDir: path.join(storagePath, 'plugins', '@nocobase', 'plugin-acl'),
          source: '@nocobase/plugin-acl@beta',
          sourceType: 'npm' as const,
          storagePluginsPath: path.join(storagePath, 'plugins'),
        };
      },
    );
    vi.doMock('../lib/plugin-import.js', async () => {
      const actual = await vi.importActual<typeof import('../lib/plugin-import.js')>('../lib/plugin-import.js');
      return {
        ...actual,
        importPluginSource: importPluginSourceMock,
      };
    });

    try {
      const { default: PluginImport } = await import('../commands/plugin/import.js');
      await saveAuthConfig(
        {
          lastEnv: 'local-env',
          envs: {
            'local-env': {
              source: 'git',
              appRootPath: './apps/local-env',
              storagePath,
            },
          },
        },
        { scope: 'global' },
      );

      const command = Object.assign(Object.create(PluginImport.prototype), {
        parse: vi.fn(async () => ({
          args: {
            archive: '@nocobase/plugin-acl@beta',
          },
          flags: {},
        })),
        log: vi.fn(),
        error: vi.fn((message: string) => {
          throw new Error(message);
        }),
        argv: [],
      });

      await PluginImport.prototype.run.call(command);

      expect(command.log).toHaveBeenCalledWith(
        'Restart the app before enabling or using the plugin: `nb app restart --env local-env`.',
      );
    } finally {
      vi.unmock('../lib/plugin-import.js');
      vi.resetModules();
      await fsp.rm(storagePath, { recursive: true, force: true });
    }
  });
});

test('nb plugin import rejects http envs because storage/plugins is not locally writable', async () => {
  await withTempCliHome(async () => {
    vi.stubEnv('NB_SKIP_TARGET_ENV_LOG', '1');

    const { default: PluginImport } = await import('../commands/plugin/import.js');
    await saveAuthConfig(
      {
        lastEnv: 'remote-env',
        envs: {
          'remote-env': {
            baseUrl: 'https://demo.example.com/api',
          },
        },
      },
      { scope: 'global' },
    );

    const command = Object.assign(Object.create(PluginImport.prototype), {
      parse: vi.fn(async () => ({
        args: {
          archive: '/tmp/plugin-demo.tgz',
        },
        flags: {},
      })),
      log: vi.fn(),
      error: vi.fn((message: string) => {
        throw new Error(message);
      }),
      argv: [],
    });

    await expect(PluginImport.prototype.run.call(command)).rejects.toThrow(
      'HTTP envs do not expose a writable storage/plugins path to the CLI.',
    );
  });
});
