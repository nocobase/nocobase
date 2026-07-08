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
  setCaddyProxyDriver: vi.fn(),
  getCaddyProxyDriver: vi.fn(),
  resolveCaddyProxyRuntimeContext: vi.fn(),
  writeCaddyProxyBundle: vi.fn(),
  writeManualCaddyProxyBundle: vi.fn(),
  formatCaddyProxyInfoLines: vi.fn(),
  formatCaddyProxyStatusLines: vi.fn(),
  resolveCaddyProxyContainerName: vi.fn(),
  resolveCaddyProxyImage: vi.fn(),
  startCaddyProxy: vi.fn(),
  reloadCaddyProxy: vi.fn(),
  stopCaddyProxy: vi.fn(),
  restartCaddyProxy: vi.fn(),
  getCaddyProxyStatus: vi.fn(),
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

vi.mock('../lib/proxy-caddy.js', () => ({
  setCaddyProxyDriver: mocks.setCaddyProxyDriver,
  getCaddyProxyDriver: mocks.getCaddyProxyDriver,
  resolveCaddyProxyRuntimeContext: mocks.resolveCaddyProxyRuntimeContext,
  writeCaddyProxyBundle: mocks.writeCaddyProxyBundle,
  writeManualCaddyProxyBundle: mocks.writeManualCaddyProxyBundle,
  formatCaddyProxyInfoLines: mocks.formatCaddyProxyInfoLines,
  formatCaddyProxyStatusLines: mocks.formatCaddyProxyStatusLines,
  resolveCaddyProxyContainerName: mocks.resolveCaddyProxyContainerName,
  resolveCaddyProxyImage: mocks.resolveCaddyProxyImage,
  startCaddyProxy: mocks.startCaddyProxy,
  reloadCaddyProxy: mocks.reloadCaddyProxy,
  stopCaddyProxy: mocks.stopCaddyProxy,
  restartCaddyProxy: mocks.restartCaddyProxy,
  getCaddyProxyStatus: mocks.getCaddyProxyStatus,
}));

vi.mock('../lib/proxy-nginx.js', () => ({
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
  resolveEnvProxyMainOutputPath: vi.fn(() => '/host/.nocobase/proxy/caddy/nocobase.caddy'),
  mapProxyPathFromCliRoot: mocks.mapProxyPathFromCliRoot,
}));

vi.mock('../lib/cli-home.js', () => ({
  resolveDefaultConfigScope: vi.fn(() => 'local'),
}));

vi.mock('../lib/cli-config.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/cli-config.js')>('../lib/cli-config.js');
  return {
    ...actual,
    getCliConfigValue: vi.fn(async (key: string) => (key === 'bin.caddy' ? '/usr/bin/caddy' : 'local')),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveEnvProxyEntry.mockReturnValue(undefined);
  mocks.setEnvProxyEntry.mockResolvedValue(undefined);
  mocks.setCaddyProxyDriver.mockResolvedValue('docker');
  mocks.getCaddyProxyDriver.mockResolvedValue('local');
  mocks.resolveCaddyProxyRuntimeContext.mockResolvedValue({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  mocks.resolveCaddyProxyContainerName.mockResolvedValue('nb-caddy-proxy');
  mocks.resolveCaddyProxyImage.mockReturnValue('caddy:latest');
  mocks.writeCaddyProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/caddy/test2',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/caddy/test2/app.caddy',
    },
  });
  mocks.writeManualCaddyProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/caddy/default',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/caddy/default/app.caddy',
    },
  });
  mocks.startCaddyProxy.mockResolvedValue('started');
  mocks.reloadCaddyProxy.mockResolvedValue('reloaded');
  mocks.stopCaddyProxy.mockResolvedValue('stopped');
  mocks.restartCaddyProxy.mockResolvedValue('restarted');
  mocks.getCaddyProxyStatus.mockResolvedValue({
    driver: 'local',
    state: 'running',
    configFile: '/apps/.nocobase/proxy/caddy/nocobase.caddy',
    caddyBinary: '/usr/bin/caddy',
  });
  mocks.mapProxyPathFromCliRoot.mockImplementation(async (targetPath: string) => targetPath.replace('/host', '/apps'));
  mocks.formatCaddyProxyInfoLines.mockReturnValue(['driver:      local', 'caddyBin:    /usr/bin/caddy']);
  mocks.formatCaddyProxyStatusLines.mockReturnValue([
    'driver: local',
    'status: running',
    'config: /apps/.nocobase/proxy/caddy/nocobase.caddy',
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('proxy caddy use saves the selected driver', async () => {
  const { default: ProxyCaddyUse } = await import('../commands/proxy/caddy/use.js');
  const command = Object.assign(Object.create(ProxyCaddyUse.prototype), {
    parse: vi.fn(async () => ({
      args: {
        driver: 'docker',
      },
    })),
    log: vi.fn(),
  });

  await ProxyCaddyUse.prototype.run.call(command);

  expect(mocks.setCaddyProxyDriver).toHaveBeenCalledWith('docker');
  expect(command.log).toHaveBeenCalledWith('docker');
});

test('proxy caddy current prints the selected driver', async () => {
  const { default: ProxyCaddyCurrent } = await import('../commands/proxy/caddy/current.js');
  const command = Object.assign(Object.create(ProxyCaddyCurrent.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyCaddyCurrent.prototype.run.call(command);

  expect(mocks.getCaddyProxyDriver).toHaveBeenCalled();
  expect(command.log).toHaveBeenCalledWith('local');
});

test('proxy caddy generate writes proxy files with the current runtime context', async () => {
  const { default: ProxyCaddyGenerate } = await import('../commands/proxy/caddy/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'test2',
    env: {},
  });

  const command = Object.assign(Object.create(ProxyCaddyGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        env: 'test2',
        host: 'c.local.nocobase.com',
        'cdn-base-url': 'https://cdn.example.com/ui/',
      },
    })),
  });

  await ProxyCaddyGenerate.prototype.run.call(command);

  expect(mocks.resolveCaddyProxyRuntimeContext).toHaveBeenCalled();
  expect(mocks.writeCaddyProxyBundle).toHaveBeenCalledWith(
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
    },
  );
  expect(mocks.setEnvProxyEntry).toHaveBeenCalledWith(
    'test2',
    'caddy',
    {
      host: 'c.local.nocobase.com',
      port: undefined,
    },
    { scope: 'local' },
  );
  expect(mocks.succeedTask).toHaveBeenCalledWith(
    'Saved caddy proxy files for env "test2" under /Users/chen/test4/.nocobase/proxy/caddy/test2, and created app.caddy at /Users/chen/test4/.nocobase/proxy/caddy/test2/app.caddy.',
  );
});

test('proxy caddy generate defaults to the current env when --env is omitted', async () => {
  const { default: ProxyCaddyGenerate } = await import('../commands/proxy/caddy/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'current-env',
    env: {},
  });
  mocks.writeCaddyProxyBundle.mockResolvedValue({
    status: 'created',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/caddy/current-env',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/caddy/current-env/app.caddy',
    },
  });

  const command = Object.assign(Object.create(ProxyCaddyGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        host: 'app1.example.com',
      },
    })),
  });

  await ProxyCaddyGenerate.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime).toHaveBeenCalledWith(undefined);
  expect(mocks.writeCaddyProxyBundle).toHaveBeenCalledWith(
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
      cdnBaseUrl: undefined,
    },
  );
});

test('proxy caddy generate falls back to saved env proxy settings when flags are omitted', async () => {
  const { default: ProxyCaddyGenerate } = await import('../commands/proxy/caddy/generate.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'current-env',
    env: { config: {} },
  });
  mocks.resolveEnvProxyEntry.mockReturnValue({
    host: 'saved.local.nocobase.com',
    port: 8080,
  });
  mocks.writeCaddyProxyBundle.mockResolvedValue({
    status: 'updated',
    bundle: {
      entryDir: '/Users/chen/test4/.nocobase/proxy/caddy/current-env',
      appConfigPath: '/Users/chen/test4/.nocobase/proxy/caddy/current-env/app.caddy',
    },
  });

  const command = Object.assign(Object.create(ProxyCaddyGenerate.prototype), {
    parse: vi.fn(async () => ({
      flags: {},
    })),
  });

  await ProxyCaddyGenerate.prototype.run.call(command);

  expect(mocks.writeCaddyProxyBundle).toHaveBeenCalledWith(
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
      cdnBaseUrl: undefined,
    },
  );
  expect(mocks.setEnvProxyEntry).toHaveBeenCalledWith(
    'current-env',
    'caddy',
    {
      host: 'saved.local.nocobase.com',
      port: 8080,
    },
    { scope: 'local' },
  );
});

test('proxy caddy generate supports manual mode', async () => {
  const { default: ProxyCaddyGenerate } = await import('../commands/proxy/caddy/generate.js');
  const command = Object.assign(Object.create(ProxyCaddyGenerate.prototype), {
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
      },
    })),
  });

  await ProxyCaddyGenerate.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  expect(mocks.writeManualCaddyProxyBundle).toHaveBeenCalledWith(
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
      cdnBaseUrl: 'https://cdn.example.com/ui/',
    },
  );
  expect(mocks.succeedTask).toHaveBeenCalledWith(
    'Saved caddy proxy files for env "default" under /Users/chen/test4/.nocobase/proxy/caddy/default, and created app.caddy at /Users/chen/test4/.nocobase/proxy/caddy/default/app.caddy.',
  );
});

test('proxy caddy generate rejects invalid manual upstream port values', async () => {
  const { default: ProxyCaddyGenerate } = await import('../commands/proxy/caddy/generate.js');
  const command = Object.assign(Object.create(ProxyCaddyGenerate.prototype), {
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

  await expect(ProxyCaddyGenerate.prototype.run.call(command)).rejects.toThrow(
    'Invalid manual upstream port "70000". Use an integer between 1 and 65535.',
  );
  expect(mocks.writeManualCaddyProxyBundle).not.toHaveBeenCalled();
});

test('proxy caddy info prints derived runtime information', async () => {
  const { default: ProxyCaddyInfo } = await import('../commands/proxy/caddy/info.js');
  const command = Object.assign(Object.create(ProxyCaddyInfo.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyCaddyInfo.prototype.run.call(command);

  expect(mocks.mapProxyPathFromCliRoot).toHaveBeenCalledTimes(1);
  expect(mocks.formatCaddyProxyInfoLines).toHaveBeenCalledWith(
    expect.objectContaining({
      driver: 'local',
      configFile: '/apps/.nocobase/proxy/caddy/nocobase.caddy',
      runtimeRoot: '/Users/chen/test4',
      containerName: 'nb-caddy-proxy',
      image: 'caddy:latest',
    }),
  );
  expect(command.log).toHaveBeenCalledWith('driver:      local\ncaddyBin:    /usr/bin/caddy');
});

test('proxy caddy start starts the configured driver', async () => {
  const { default: ProxyCaddyStart } = await import('../commands/proxy/caddy/start.js');
  const command = Object.assign(Object.create(ProxyCaddyStart.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyCaddyStart.prototype.run.call(command);

  expect(mocks.startCaddyProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Caddy proxy started with the local driver.');
});

test('proxy caddy reload reloads the configured driver', async () => {
  const { default: ProxyCaddyReload } = await import('../commands/proxy/caddy/reload.js');
  const command = Object.assign(Object.create(ProxyCaddyReload.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyCaddyReload.prototype.run.call(command);

  expect(mocks.reloadCaddyProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Caddy proxy reloaded with the local driver.');
});

test('proxy caddy reload starts the proxy when it is not running yet', async () => {
  const { default: ProxyCaddyReload } = await import('../commands/proxy/caddy/reload.js');
  mocks.reloadCaddyProxy.mockResolvedValueOnce('started');
  const command = Object.assign(Object.create(ProxyCaddyReload.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyCaddyReload.prototype.run.call(command);

  expect(mocks.succeedTask).toHaveBeenCalledWith('Caddy proxy started with the local driver using the latest config.');
});

test('proxy caddy stop stops the configured driver', async () => {
  const { default: ProxyCaddyStop } = await import('../commands/proxy/caddy/stop.js');
  const command = Object.assign(Object.create(ProxyCaddyStop.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyCaddyStop.prototype.run.call(command);

  expect(mocks.stopCaddyProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Caddy proxy stopped with the local driver.');
});

test('proxy caddy restart restarts the configured driver', async () => {
  const { default: ProxyCaddyRestart } = await import('../commands/proxy/caddy/restart.js');
  const command = Object.assign(Object.create(ProxyCaddyRestart.prototype), {
    parse: vi.fn(async () => ({})),
  });

  await ProxyCaddyRestart.prototype.run.call(command);

  expect(mocks.restartCaddyProxy).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(mocks.succeedTask).toHaveBeenCalledWith('Caddy proxy restarted with the local driver.');
});

test('proxy caddy status prints lifecycle status lines', async () => {
  const { default: ProxyCaddyStatus } = await import('../commands/proxy/caddy/status.js');
  const command = Object.assign(Object.create(ProxyCaddyStatus.prototype), {
    parse: vi.fn(async () => ({})),
    log: vi.fn(),
  });

  await ProxyCaddyStatus.prototype.run.call(command);

  expect(mocks.getCaddyProxyStatus).toHaveBeenCalledWith({
    driver: 'local',
    runtimeCliRoot: '/Users/chen/test4',
    upstreamHost: '127.0.0.1',
  });
  expect(command.log).toHaveBeenCalledWith(
    'driver: local\nstatus: running\nconfig: /apps/.nocobase/proxy/caddy/nocobase.caddy',
  );
});
