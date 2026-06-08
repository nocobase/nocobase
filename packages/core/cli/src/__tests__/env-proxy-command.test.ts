/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir as fsMkdir, mkdtemp, readFile, rm, writeFile as fsWriteFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setCliConfigValue } from '../lib/cli-config.js';

const mocks = vi.hoisted(() => ({
  resolveManagedAppRuntime: vi.fn(),
  buildEnvProxyConfig: vi.fn(),
  buildEnvProxyCaddyBundle: vi.fn(),
  buildEnvProxyNginxBundle: vi.fn(),
  installEnvProxyProvider: vi.fn(),
  reloadEnvProxyProvider: vi.fn(),
  announceTargetEnv: vi.fn(),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  formatMissingManagedAppEnvMessage: vi.fn((envName?: string) => `missing:${envName ?? ''}`),
}));

vi.mock('../lib/env-proxy.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/env-proxy.ts')>('../lib/env-proxy.ts');
  return {
    ...actual,
    buildEnvProxyConfig: mocks.buildEnvProxyConfig,
    buildEnvProxyCaddyBundle: mocks.buildEnvProxyCaddyBundle,
    buildEnvProxyNginxBundle: mocks.buildEnvProxyNginxBundle,
    installEnvProxyProvider: mocks.installEnvProxyProvider,
    reloadEnvProxyProvider: mocks.reloadEnvProxyProvider,
  };
});

vi.mock('../lib/ui.js', () => ({
  announceTargetEnv: mocks.announceTargetEnv,
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
}));

let tempRoot = '';

function createMockNginxBundle(root: string) {
  const entryDir = path.join(root, '.nocobase', 'proxy', 'nginx', 'demo');
  const publicDir = path.join(entryDir, 'public');
  const snippetsDir = path.join(root, '.nocobase', 'proxy', 'nginx', 'snippets');
  return {
    envName: 'demo',
    envFilePath: path.join(root, 'app', '.env'),
    entryDir,
    publicDir,
    appConfigPath: path.join(entryDir, 'app.conf'),
    indexV1Path: path.join(publicDir, 'index-v1.html'),
    indexV2Path: path.join(publicDir, 'index-v2.html'),
    mainConfigPath: path.join(root, '.nocobase', 'proxy', 'nginx', 'nocobase.conf'),
    snippetsDir,
    appPublicPath: '/console/',
    apiBasePath: '/console/api/',
    wsPath: '/console/ws',
    v2PublicPath: '/console/admin/',
    modernClientPrefix: 'admin',
    activeVersion: '2.1.0-beta.44',
    cdnBaseUrl: '/console/dist/2.1.0-beta.44/',
    backendUrl: 'http://127.0.0.1:13000',
    appConfigContent: `server {\n    listen 80;\n    server_name _;\n\n    # BEGIN NocoBase managed config\n    location ^~ /console/api/ {\n        proxy_pass http://127.0.0.1:13000;\n    }\n    # END NocoBase managed config\n}\n`,
    mainConfigContent: `include ${snippetsDir}/log-format-http.conf;\ninclude ${snippetsDir}/maps-http.conf;\ninclude ${path.join(
      root,
      '.nocobase',
      'proxy',
      'nginx',
      '*',
      'app.conf',
    )};\n`,
    indexV1Content: '<!doctype html><script src="/console/dist/2.1.0-beta.44/assets/runtime.js"></script>\n',
    indexV2Content: '<!doctype html><script src="/console/dist/2.1.0-beta.44/v/assets/runtime.js"></script>\n',
  };
}

function createMockCaddyBundle(root: string) {
  const entryDir = path.join(root, '.nocobase', 'proxy', 'caddy', 'demo');
  const publicDir = path.join(entryDir, 'public');
  return {
    envName: 'demo',
    envFilePath: path.join(root, 'app', '.env'),
    entryDir,
    publicDir,
    appConfigPath: path.join(entryDir, 'app.caddy'),
    generatedConfigPath: path.join(entryDir, 'generated.caddy'),
    indexV1Path: path.join(publicDir, 'index-v1.html'),
    indexV2Path: path.join(publicDir, 'index-v2.html'),
    mainConfigPath: path.join(root, '.nocobase', 'proxy', 'caddy', 'nocobase.caddy'),
    appPublicPath: '/console/',
    apiBasePath: '/console/api/',
    wsPath: '/console/ws',
    v2PublicPath: '/console/admin/',
    modernClientPrefix: 'admin',
    activeVersion: '2.1.0-beta.44',
    cdnBaseUrl: '/console/dist/2.1.0-beta.44/',
    backendUrl: 'http://127.0.0.1:13000',
    appConfigContent:
      ':80 {\n    # BEGIN NocoBase generated routes\n    # Keep this import so `nb env proxy` can refresh managed routes.\n    import ./generated.caddy\n    # END NocoBase generated routes\n}\n',
    generatedConfigContent: 'route {}\n',
    mainConfigContent: `import ${path.join(root, '.nocobase', 'proxy', 'caddy', '*', 'app.caddy')}\n`,
    indexV1Content: '<!doctype html><script src="/console/dist/2.1.0-beta.44/assets/runtime.js"></script>\n',
    indexV2Content: '<!doctype html><script src="/console/dist/2.1.0-beta.44/v/assets/runtime.js"></script>\n',
  };
}

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-env-proxy-command-'));
  process.env.NB_CLI_ROOT = tempRoot;
  vi.clearAllMocks();
  mocks.installEnvProxyProvider.mockResolvedValue({
    configPath: '/tmp/nginx.conf',
    status: 'installed',
  });
  mocks.reloadEnvProxyProvider.mockResolvedValue(undefined);
});

afterEach(async () => {
  delete process.env.NB_CLI_ROOT;
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('env proxy nginx writes the app bundle to the default proxy paths', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const bundle = createMockNginxBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyNginxBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
      },
    })),
  });

  await EnvProxyNginx.prototype.run.call(command);

  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('# BEGIN NocoBase managed config');
  await expect(readFile(bundle.indexV1Path, 'utf8')).resolves.toBe(bundle.indexV1Content);
  await expect(readFile(bundle.indexV2Path, 'utf8')).resolves.toBe(bundle.indexV2Content);
  await expect(readFile(bundle.mainConfigPath, 'utf8')).resolves.toBe(bundle.mainConfigContent);
  await expect(readFile(path.join(bundle.snippetsDir, 'log-format-http.conf'), 'utf8')).resolves.toContain(
    'log_format apm',
  );
  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('demo');
  expect(mocks.succeedTask).toHaveBeenLastCalledWith(
    `Saved nginx proxy files for env "demo" under ${bundle.entryDir}, and created editable app entry config at ${bundle.appConfigPath}.`,
  );
});

test('env proxy nginx updates an existing app.conf by replacing only the managed block', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const bundle = createMockNginxBundle(tempRoot);
  await fsMkdir(path.dirname(bundle.appConfigPath), { recursive: true });
  await fsWriteFile(
    bundle.appConfigPath,
    `server {\n    listen 8080;\n    server_name demo.local;\n\n    # BEGIN NocoBase managed config\n    old content\n    # END NocoBase managed config\n\n    add_header X-Demo true;\n}\n`,
    'utf8',
  );
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyNginxBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
      },
    })),
  });

  await EnvProxyNginx.prototype.run.call(command);

  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('listen 8080;');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('server_name demo.local;');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('add_header X-Demo true;');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('location ^~ /console/api/ {');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.not.toContain('old content');
  expect(mocks.succeedTask).toHaveBeenLastCalledWith(
    `Saved nginx proxy files for env "demo" under ${bundle.entryDir}, and refreshed editable app entry config at ${bundle.appConfigPath}.`,
  );
});

test('env proxy nginx writes host and port into a new app entry config when requested', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const bundle = createMockNginxBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyNginxBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        host: 'a.local.nocobase.com',
        port: '8080',
      },
    })),
  });

  await EnvProxyNginx.prototype.run.call(command);

  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('listen 8080;');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('server_name a.local.nocobase.com;');
});

test('env proxy nginx prints the rendered app.conf when --print is used', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const bundle = createMockNginxBundle(tempRoot);
  const stdoutWrite = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyNginxBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: true,
        host: 'a.local.nocobase.com',
      },
    })),
  });

  await EnvProxyNginx.prototype.run.call(command);

  expect(stdoutWrite).toHaveBeenCalledWith(expect.stringContaining('server_name a.local.nocobase.com;'));
  await expect(readFile(bundle.appConfigPath, 'utf8')).rejects.toThrow();
  stdoutWrite.mockRestore();
});

test('env proxy nginx rejects --output', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        output: './proxy.conf',
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(EnvProxyNginx.prototype.run.call(command)).rejects.toThrow(
    'The nginx provider does not support `--output`.',
  );
});

test('env proxy nginx installs and reloads the provider when requested', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const bundle = createMockNginxBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyNginxBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        install: true,
        reload: true,
      },
    })),
  });

  await EnvProxyNginx.prototype.run.call(command);

  expect(mocks.installEnvProxyProvider).toHaveBeenCalledWith('nginx', { scope: 'global' });
  expect(mocks.reloadEnvProxyProvider).toHaveBeenCalledWith('nginx', { scope: 'global' });
  expect(mocks.startTask.mock.calls.map(([message]) => message)).toEqual([
    'Generating proxy config for env "demo"...',
    'Installing the shared proxy config into nginx...',
    'Validating and reloading nginx...',
  ]);
});

test('env proxy caddy writes configs under the provider directory', async () => {
  const { default: EnvProxyCaddy } = await import('../commands/env/proxy/caddy.js');
  const bundle = createMockCaddyBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyCaddyBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyCaddy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
      },
    })),
  });

  await EnvProxyCaddy.prototype.run.call(command);

  await expect(readFile(bundle.generatedConfigPath, 'utf8')).resolves.toBe(bundle.generatedConfigContent);
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('# BEGIN NocoBase generated routes');
  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('import ./generated.caddy');
  await expect(readFile(bundle.indexV1Path, 'utf8')).resolves.toBe(bundle.indexV1Content);
  await expect(readFile(bundle.indexV2Path, 'utf8')).resolves.toBe(bundle.indexV2Content);
  await expect(readFile(bundle.mainConfigPath, 'utf8')).resolves.toContain(
    `import ${path.join(tempRoot, '.nocobase', 'proxy', 'caddy', '*', 'app.caddy')}`,
  );
});

test('env proxy caddy writes host and port into a new editable app entry config when requested', async () => {
  const { default: EnvProxyCaddy } = await import('../commands/env/proxy/caddy.js');
  const bundle = createMockCaddyBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyCaddyBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyCaddy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        host: 'a.local.nocobase.com',
        port: '8080',
      },
    })),
  });

  await EnvProxyCaddy.prototype.run.call(command);

  await expect(readFile(bundle.appConfigPath, 'utf8')).resolves.toContain('a.local.nocobase.com:8080 {');
});

test('env proxy nginx rejects --print with --reload', async () => {
  const { default: EnvProxyNginx } = await import('../commands/env/proxy/nginx.js');
  const command = Object.assign(Object.create(EnvProxyNginx.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: true,
        reload: true,
        install: false,
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(EnvProxyNginx.prototype.run.call(command)).rejects.toThrow(
    '`--print` cannot be combined with `--install` or `--reload`.',
  );
});

test('env proxy caddy rejects --output with --install', async () => {
  const { default: EnvProxyCaddy } = await import('../commands/env/proxy/caddy.js');
  const command = Object.assign(Object.create(EnvProxyCaddy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        output: './proxy.conf',
        install: true,
        reload: false,
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(EnvProxyCaddy.prototype.run.call(command)).rejects.toThrow(
    '`--output` cannot be combined with `--install` or `--reload` in the current implementation.',
  );
});

test('env proxy caddy rewrites an existing :80 app entry to host-only when --host is provided without --port', async () => {
  const { default: EnvProxyCaddy } = await import('../commands/env/proxy/caddy.js');
  const appConfigPath = path.join(tempRoot, '.nocobase', 'proxy', 'caddy', 'demo', 'app.caddy');

  await rm(path.dirname(appConfigPath), { recursive: true, force: true });
  await fsMkdir(path.dirname(appConfigPath), { recursive: true });
  await fsWriteFile(
    appConfigPath,
    ':80 {\n    # BEGIN NocoBase generated routes\n    # Keep this import so `nb env proxy` can refresh managed routes.\n    import ./generated.caddy\n    # END NocoBase generated routes\n}\n',
    'utf8',
  );

  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  mocks.buildEnvProxyCaddyBundle.mockResolvedValue(createMockCaddyBundle(tempRoot));

  const command = Object.assign(Object.create(EnvProxyCaddy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
        host: 'a.local.nocobase.com',
      },
    })),
  });

  await EnvProxyCaddy.prototype.run.call(command);

  await expect(readFile(appConfigPath, 'utf8')).resolves.toContain('a.local.nocobase.com {');
  await expect(readFile(appConfigPath, 'utf8')).resolves.not.toContain('a.local.nocobase.com:80 {');
});

test('env proxy caddy renders mapped proxy includes when proxy.nb-cli-root is configured', async () => {
  const { default: EnvProxyCaddy } = await import('../commands/env/proxy/caddy.js');
  await setCliConfigValue('proxy.nb-cli-root', '/workspace', { scope: 'global' });
  const bundle = createMockCaddyBundle(tempRoot);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'demo',
    env: {},
  });
  bundle.mainConfigContent = 'import /workspace/.nocobase/proxy/caddy/*/app.caddy\n';
  bundle.appConfigContent =
    ':80 {\n    # BEGIN NocoBase generated routes\n    # Keep this import so `nb env proxy` can refresh managed routes.\n    import ./generated.caddy\n    # END NocoBase generated routes\n}\n';
  mocks.buildEnvProxyCaddyBundle.mockResolvedValue(bundle);

  const command = Object.assign(Object.create(EnvProxyCaddy.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'demo' },
      flags: {
        print: false,
      },
    })),
  });

  await EnvProxyCaddy.prototype.run.call(command);

  const sharedOutputPath = path.join(tempRoot, '.nocobase', 'proxy', 'caddy', 'nocobase.caddy');
  await expect(readFile(sharedOutputPath, 'utf8')).resolves.toContain(
    'import /workspace/.nocobase/proxy/caddy/*/app.caddy',
  );
});

test('env proxy shows topic help', async () => {
  vi.resetModules();
  const showHelpMock = vi.fn<(argv: string[]) => void>();
  const loadHelpClassMock = vi.fn(async () => {
    return class MockHelp {
      constructor(..._args: unknown[]) {}

      async showHelp(argv: string[]): Promise<void> {
        showHelpMock(argv);
      }
    };
  });

  vi.doMock('@oclif/core', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@oclif/core')>();
    return {
      ...actual,
      loadHelpClass: loadHelpClassMock,
    };
  });

  const { default: EnvProxyTopic } = await import('../commands/env/proxy/index.js');
  const command = Object.assign(Object.create(EnvProxyTopic.prototype), {
    parse: vi.fn(async () => ({ args: {}, flags: {} })),
    config: {
      pjson: {
        oclif: {
          helpOptions: {},
        },
      },
    },
    argv: [],
    id: 'env proxy',
  });

  await EnvProxyTopic.prototype.run.call(command);

  expect(command.parse).toHaveBeenCalled();
  expect(loadHelpClassMock).toHaveBeenCalledWith(command.config);
  expect(showHelpMock).toHaveBeenCalledWith(['env proxy']);
});
