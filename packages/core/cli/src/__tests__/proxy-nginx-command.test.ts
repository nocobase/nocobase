/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resolveManagedAppRuntime: vi.fn(),
  resolveEnvProxyEntry: vi.fn(),
  setEnvProxyEntry: vi.fn(),
  setNginxProxyDriver: vi.fn(),
  getNginxProxyDriver: vi.fn(),
  resolveNginxProxyRuntimeContext: vi.fn(),
  writeNginxProxyBundle: vi.fn(),
  writeManualNginxProxyBundle: vi.fn(),
  formatNginxProxyInfoLines: vi.fn(),
  formatNginxProxyStatusLines: vi.fn(),
  resolveNginxProxyContainerName: vi.fn(),
  resolveNginxProxyImage: vi.fn(),
  startNginxProxy: vi.fn(),
  reloadNginxProxy: vi.fn(),
  stopNginxProxy: vi.fn(),
  restartNginxProxy: vi.fn(),
  getNginxProxyStatus: vi.fn(),
  announceTargetEnv: vi.fn(),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  mapProxyPathFromCliRoot: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  formatMissingManagedAppEnvMessage: vi.fn((envName?: string) => `missing:${envName ?? ''}`),
}));

vi.mock('../lib/auth-store.js', () => ({
  resolveEnvProxyEntry: mocks.resolveEnvProxyEntry,
  setEnvProxyEntry: mocks.setEnvProxyEntry,
}));

vi.mock('../lib/proxy-nginx.js', () => ({
  setNginxProxyDriver: mocks.setNginxProxyDriver,
  getNginxProxyDriver: mocks.getNginxProxyDriver,
  resolveNginxProxyRuntimeContext: mocks.resolveNginxProxyRuntimeContext,
  writeNginxProxyBundle: mocks.writeNginxProxyBundle,
  writeManualNginxProxyBundle: mocks.writeManualNginxProxyBundle,
  formatNginxProxyInfoLines: mocks.formatNginxProxyInfoLines,
  formatNginxProxyStatusLines: mocks.formatNginxProxyStatusLines,
  resolveNginxProxyContainerName: mocks.resolveNginxProxyContainerName,
  resolveNginxProxyImage: mocks.resolveNginxProxyImage,
  startNginxProxy: mocks.startNginxProxy,
  reloadNginxProxy: mocks.reloadNginxProxy,
  stopNginxProxy: mocks.stopNginxProxy,
  restartNginxProxy: mocks.restartNginxProxy,
  getNginxProxyStatus: mocks.getNginxProxyStatus,
  normalizeProxyListenPort: (value?: string) => {
    const normalized = value?.trim() || undefined;
    if (!normalized || !/^\d+$/.test(normalized)) {
      return undefined;
    }
    const port = Number(normalized);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? normalized : undefined;
  },
}));

vi.mock('../lib/ui.js', () => ({
  announceTargetEnv: mocks.announceTargetEnv,
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
}));

vi.mock('../lib/env-proxy.js', () => ({
  resolveEnvProxyMainOutputPath: vi.fn(() => '/host/.nocobase/proxy/nginx/nocobase.conf'),
  resolveEnvProxyNginxSnippetsOutputDir: vi.fn(() => '/host/.nocobase/proxy/nginx/snippets'),
  mapProxyPathFromCliRoot: mocks.mapProxyPathFromCliRoot,
}));

vi.mock('../lib/cli-home.js', () => ({
  resolveDefaultConfigScope: vi.fn(() => 'local'),
}));

vi.mock('../lib/cli-config.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/cli-config.js')>('../lib/cli-config.js');
  return {
    ...actual,
    getCliConfigValue: vi.fn(async (key: string) => (key === 'bin.nginx' ? '/usr/sbin/nginx' : 'local')),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveEnvProxyEntry.mockReturnValue(undefined);
  mocks.setEnvProxyEntry.mockResolvedValue(undefined);
  mocks.setNginxProxyDriver.mockResolvedValue('docker');
  mocks.getNginxProxyDriver.mockResolvedValue('local');
  mocks.resolveNginxProxyRuntimeContext.mockResolvedValue({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  mocks.resolveNginxProxyContainerName.mockResolvedValue('nb-nginx-proxy');
  mocks.resolveNginxProxyImage.mockReturnValue('nginx:latest');
  mocks.writeManualNginxProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/nginx/default',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/nginx/default/app.conf',
    },
  });
  mocks.startNginxProxy.mockResolvedValue('started');
  mocks.reloadNginxProxy.mockResolvedValue('reloaded');
  mocks.stopNginxProxy.mockResolvedValue('stopped');
  mocks.restartNginxProxy.mockResolvedValue('restarted');
  mocks.getNginxProxyStatus.mockResolvedValue({
    driver: 'local',
    state: 'running',
    configFile: '/apps/.nocobase/proxy/nginx/nocobase.conf',
    nginxBinary: '/usr/sbin/nginx',
  });
  mocks.mapProxyPathFromCliRoot.mockImplementation(async (targetPath: string) => targetPath.replace('/host', '/apps'));
  mocks.formatNginxProxyInfoLines.mockReturnValue(['driver:      local', 'nginxBin:    /usr/sbin/nginx']);
  mocks.formatNginxProxyStatusLines.mockReturnValue([
    'driver: local',
    'status: running',
    'config: /apps/.nocobase/proxy/nginx/nocobase.conf',
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('proxy nginx use saves the selected driver', async () => {
  const { default: ProxyNginxUse } = await import('../commands/proxy/nginx/use.js');
  const command = Object.assign(Object.create(ProxyNginxUse.prototype), {
    parse: vi.fn(async () => ({
      args: {
        driver: 'docker',
      },
    })),
    log: vi.fn(),
  });

  await ProxyNginxUse.prototype.run.call(command);

  expect(mocks.setNginxProxyDriver).toHaveBeenCalledWith('docker');
  expect(command.log).toHaveBeenCalledWith('docker');
});

test('proxy nginx current prints the selected driver', async () => {
  const { default: ProxyNginxCurrent } = await import('../commands/proxy/nginx/current.js');
  const command = Object.assign(Object.create(ProxyNginxCurrent.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyNginxCurrent.prototype.run.call(command);

  expect(mocks.getNginxProxyDriver).toHaveBeenCalled();
  expect(command.log).toHaveBeenCalledWith('local');
});

test('proxy nginx generate writes proxy files with the current runtime context', async () => {
  const { default: ProxyNginxGenerate } = await import('../commands/proxy/nginx/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'test2',
    env: {},
  });
  mocks.writeNginxProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/nginx/test2',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/nginx/test2/app.conf',
    },
  });

  const command = Object.assign(Object.create(ProxyNginxGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        env: 'test2',
        host: 'c.local.nocobase.com',
        'cdn-base-url': 'https://cdn.example.com/ui/',
        force: false,
      },
    })),
  });

  await ProxyNginxGenerate.prototype.run.call(command);

  expect(mocks.getNginxProxyDriver).toHaveBeenCalled();
  expect(mocks.resolveNginxProxyRuntimeContext).toHaveBeenCalled();
  expect(mocks.writeNginxProxyBundle).toHaveBeenCalledWith(
    expect.objectContaining({ envName: 'test2' }),
    {
      host: 'c.local.nocobase.com',
      port: undefined,
    },
    {
      driver: 'local',
      runtimeCliRoot: '/Users/chen/test4',
      upstreamHost: '127.0.0.1',
    },
    {
      cdnBaseUrl: 'https://cdn.example.com/ui/',
      force: false,
    },
  );
  expect(mocks.setEnvProxyEntry).toHaveBeenCalledWith(
    'test2',
    'nginx',
    {
      host: 'c.local.nocobase.com',
      port: undefined,
    },
    { scope: 'local' },
  );
  expect(mocks.succeedTask).toHaveBeenCalledWith(
    'Saved nginx proxy files for env "test2" under /Users/chen/test4/.nocobase/proxy/nginx/test2, and created editable app entry config at /Users/chen/test4/.nocobase/proxy/nginx/test2/app.conf.',
  );
});

test('proxy nginx generate defaults to the current env when --env is omitted', async () => {
  const { default: ProxyNginxGenerate } = await import('../commands/proxy/nginx/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'current-env',
    env: {},
  });
  mocks.writeNginxProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/nginx/current-env',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/nginx/current-env/app.conf',
    },
  });

  const command = Object.assign(Object.create(ProxyNginxGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        host: 'app1.example.com',
        force: false,
      },
    })),
  });

  await ProxyNginxGenerate.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime).toHaveBeenCalledWith(undefined);
  expect(mocks.writeNginxProxyBundle).toHaveBeenCalledWith(
    expect.objectContaining({ envName: 'current-env' }),
    {
      host: 'app1.example.com',
      port: undefined,
    },
    {
      driver: 'local',
      runtimeCliRoot: '/Users/chen/test4',
      upstreamHost: '127.0.0.1',
    },
    {
      force: false,
    },
  );
});

test('proxy nginx generate falls back to saved env proxy settings when flags are omitted', async () => {
  const { default: ProxyNginxGenerate } = await import('../commands/proxy/nginx/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'current-env',
    env: { config: {} },
  });
  mocks.resolveEnvProxyEntry.mockReturnValue({
    host: 'saved.local.nocobase.com',
    port: 8080,
  });
  mocks.writeNginxProxyBundle.mockResolvedValue({
    status: 'updated',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/nginx/current-env',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/nginx/current-env/app.conf',
    },
  });

  const command = Object.assign(Object.create(ProxyNginxGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        force: false,
      },
    })),
  });

  await ProxyNginxGenerate.prototype.run.call(command);

  expect(mocks.writeNginxProxyBundle).toHaveBeenCalledWith(
    expect.objectContaining({ envName: 'current-env' }),
    {
      host: 'saved.local.nocobase.com',
      port: '8080',
    },
    {
      driver: 'local',
      runtimeCliRoot: '/Users/chen/test4',
      upstreamHost: '127.0.0.1',
    },
    {
      force: false,
    },
  );
  expect(mocks.setEnvProxyEntry).toHaveBeenCalledWith(
    'current-env',
    'nginx',
    {
      host: 'saved.local.nocobase.com',
      port: 8080,
    },
    { scope: 'local' },
  );
});

test('proxy nginx generate supports manual mode', async () => {
  const { default: ProxyNginxGenerate } = await import('../commands/proxy/nginx/generate.js');
  const command = Object.assign(Object.create(ProxyNginxGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        manual: true,
        name: 'default',
        'storage-path': '/path/to/storage',
        'dist-root-path': '/path/to/dist-client',
        'runtime-version': '2.1.0',
        'app-public-path': '/console/',
        'upstream-host': 'host.docker.internal',
        'upstream-port': '14000',
        'cdn-base-url': 'https://cdn.example.com/ui/',
        port: '8080',
        force: true,
      },
    })),
  });

  await ProxyNginxGenerate.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  expect(mocks.writeManualNginxProxyBundle).toHaveBeenCalledWith(
    {
      name: 'default',
      storagePath: '/path/to/storage',
      distRootPath: '/path/to/dist-client',
      runtimeVersion: '2.1.0',
      appPublicPath: '/console/',
      upstreamHost: 'host.docker.internal',
      upstreamPort: '14000',
      cdnBaseUrl: 'https://cdn.example.com/ui/',
    },
    {
      host: undefined,
      port: '8080',
    },
    {
      driver: 'local',
      runtimeCliRoot: '/Users/chen/test4',
      upstreamHost: '127.0.0.1',
    },
    {
      force: true,
    },
  );
  expect(mocks.succeedTask).toHaveBeenCalledWith(
    'Saved nginx proxy files for env "default" under /Users/chen/test4/.nocobase/proxy/nginx/default, and created editable app entry config at /Users/chen/test4/.nocobase/proxy/nginx/default/app.conf.',
  );
});

test('proxy nginx generate rejects invalid manual upstream port values', async () => {
  const { default: ProxyNginxGenerate } = await import('../commands/proxy/nginx/generate.js');
  const command = Object.assign(Object.create(ProxyNginxGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        manual: true,
        name: 'default',
        'storage-path': '/path/to/storage',
        'dist-root-path': '/path/to/dist-client',
        'runtime-version': '2.1.0',
        'upstream-port': '70000',
      },
    })),
    error: vi.fn((message: string) => {
      throw new Error(message);
    }),
  });

  await expect(ProxyNginxGenerate.prototype.run.call(command)).rejects.toThrow(
    'Invalid manual upstream port "70000". Use an integer between 1 and 65535.',
  );
  expect(mocks.writeManualNginxProxyBundle).not.toHaveBeenCalled();
});

test('proxy nginx info prints derived runtime information', async () => {
  const { default: ProxyNginxInfo } = await import('../commands/proxy/nginx/info.js');
  const command = Object.assign(Object.create(ProxyNginxInfo.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyNginxInfo.prototype.run.call(command);

  expect(mocks.mapProxyPathFromCliRoot).toHaveBeenCalledTimes(2);
  expect(mocks.formatNginxProxyInfoLines).toHaveBeenCalledWith(
    expect.objectContaining({
      driver: 'local',
      configFile: '/apps/.nocobase/proxy/nginx/nocobase.conf',
      snippetsDir: '/apps/.nocobase/proxy/nginx/snippets',
      runtimeRoot: '/Users/chen/test4',
      containerName: 'nb-nginx-proxy',
      image: 'nginx:latest',
    }),
  );
  expect(command.log).toHaveBeenCalledWith('driver:      local\nnginxBin:    /usr/sbin/nginx');
});

test('proxy nginx start starts the configured driver', async () => {
  const { default: ProxyNginxStart } = await import('../commands/proxy/nginx/start.js');
  const command = Object.assign(Object.create(ProxyNginxStart.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyNginxStart.prototype.run.call(command);

  expect(mocks.startNginxProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Nginx proxy started with the local driver.');
});

test('proxy nginx reload reloads the configured driver', async () => {
  const { default: ProxyNginxReload } = await import('../commands/proxy/nginx/reload.js');
  const command = Object.assign(Object.create(ProxyNginxReload.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyNginxReload.prototype.run.call(command);

  expect(mocks.reloadNginxProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Nginx proxy reloaded with the local driver.');
});

test('proxy nginx reload starts the proxy when it is not running yet', async () => {
  const { default: ProxyNginxReload } = await import('../commands/proxy/nginx/reload.js');
  mocks.reloadNginxProxy.mockResolvedValueOnce('started');
  const command = Object.assign(Object.create(ProxyNginxReload.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyNginxReload.prototype.run.call(command);

  expect(mocks.succeedTask).toHaveBeenCalledWith('Nginx proxy started with the local driver using the latest config.');
});

test('proxy nginx stop stops the configured driver', async () => {
  const { default: ProxyNginxStop } = await import('../commands/proxy/nginx/stop.js');
  const command = Object.assign(Object.create(ProxyNginxStop.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyNginxStop.prototype.run.call(command);

  expect(mocks.stopNginxProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Nginx proxy stopped with the local driver.');
});

test('proxy nginx restart restarts the configured driver', async () => {
  const { default: ProxyNginxRestart } = await import('../commands/proxy/nginx/restart.js');
  const command = Object.assign(Object.create(ProxyNginxRestart.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyNginxRestart.prototype.run.call(command);

  expect(mocks.restartNginxProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Nginx proxy restarted with the local driver.');
});

test('proxy nginx status prints lifecycle status lines', async () => {
  const { default: ProxyNginxStatus } = await import('../commands/proxy/nginx/status.js');
  const command = Object.assign(Object.create(ProxyNginxStatus.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyNginxStatus.prototype.run.call(command);

  expect(mocks.getNginxProxyStatus).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.formatNginxProxyStatusLines).toHaveBeenCalledWith({
    driver: 'local',
    state: 'running',
    configFile: '/apps/.nocobase/proxy/nginx/nocobase.conf',
    nginxBinary: '/usr/sbin/nginx',
  });
  expect(command.log).toHaveBeenCalledWith(
    'driver: local\nstatus: running\nconfig: /apps/.nocobase/proxy/nginx/nocobase.conf',
  );
});
