/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dockerContainerExists: vi.fn(),
  dockerContainerIsRunning: vi.fn(),
  startDockerContainer: vi.fn(),
  stopDockerContainer: vi.fn(),
  loadAuthConfig: vi.fn(),
  getCliConfigValue: vi.fn(),
  resolveDockerContainerPrefix: vi.fn(),
  setCliConfigValue: vi.fn(),
  buildEnvProxyMainConfig: vi.fn(),
  installEnvProxyProvider: vi.fn(),
  mapProxyPathFromCliRoot: vi.fn(),
  reloadEnvProxyProvider: vi.fn(),
  resolveEnvProxyMainOutputPath: vi.fn(),
  syncEnvProxyNginxSnippets: vi.fn(),
  commandOutput: vi.fn(),
  run: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  dockerContainerExists: mocks.dockerContainerExists,
  dockerContainerIsRunning: mocks.dockerContainerIsRunning,
  startDockerContainer: mocks.startDockerContainer,
  stopDockerContainer: mocks.stopDockerContainer,
}));

vi.mock('../lib/auth-store.js', () => ({
  loadAuthConfig: mocks.loadAuthConfig,
}));

vi.mock('../lib/cli-config.js', () => ({
  DEFAULT_NGINX_PROXY_DRIVER: 'local',
  NGINX_PROXY_DRIVER_OPTIONS: ['local', 'docker'],
  getCliConfigValue: mocks.getCliConfigValue,
  normalizeNginxProxyDriver: vi.fn(),
  resolveDockerContainerPrefix: mocks.resolveDockerContainerPrefix,
  setCliConfigValue: mocks.setCliConfigValue,
}));

vi.mock('../lib/env-proxy.js', () => ({
  applyEnvProxyAppEntryOptions: vi.fn(),
  appConfigHasManagedNginxBlock: vi.fn(),
  buildManualEnvProxyNginxBundle: vi.fn(),
  buildEnvProxyMainConfig: mocks.buildEnvProxyMainConfig,
  buildEnvProxyNginxBundle: vi.fn(),
  extractManagedNginxConfigBlock: vi.fn(),
  installEnvProxyProvider: mocks.installEnvProxyProvider,
  mapProxyPathFromCliRoot: mocks.mapProxyPathFromCliRoot,
  reloadEnvProxyProvider: mocks.reloadEnvProxyProvider,
  resolveEnvProxyMainOutputPath: mocks.resolveEnvProxyMainOutputPath,
  replaceManagedNginxConfigBlock: vi.fn(),
  syncEnvProxyNginxSnippets: mocks.syncEnvProxyNginxSnippets,
}));

vi.mock('../lib/run-npm.js', () => ({
  commandOutput: mocks.commandOutput,
  run: mocks.run,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NB_CLI_ROOT = '/tmp/nocobase-cli-proxy-nginx-runtime';
  mocks.dockerContainerExists.mockResolvedValue(false);
  mocks.dockerContainerIsRunning.mockResolvedValue(false);
  mocks.resolveDockerContainerPrefix.mockResolvedValue('nb');
  mocks.resolveEnvProxyMainOutputPath.mockReturnValue(
    '/tmp/nocobase-cli-proxy-nginx-runtime/.nocobase/proxy/nginx/nocobase.conf',
  );
  mocks.buildEnvProxyMainConfig.mockResolvedValue('include /apps/.nocobase/proxy/nginx/*/app.conf;');
  mocks.syncEnvProxyNginxSnippets.mockResolvedValue(undefined);
  mocks.loadAuthConfig.mockResolvedValue({
    lastEnv: 'app1',
    envs: {
      app1: {
        proxy: {
          host: 'a.local.nocobase.com',
          port: 8080,
        },
      },
      app2: {
        proxy: {
          host: 'b.local.nocobase.com',
          port: 80,
        },
      },
      app3: {
        proxy: {
          host: 'c.local.nocobase.com',
          port: 8443,
        },
      },
    },
  });
  mocks.commandOutput.mockResolvedValue('{}');
  mocks.run.mockResolvedValue(undefined);
});

test('startNginxProxy publishes docker ports 80, 443, and saved env proxy ports', async () => {
  const { startNginxProxy } = await import('../lib/proxy-nginx.js');

  await startNginxProxy({
    driver: 'docker',
    runtimeCliRoot: '/apps',
    upstreamHost: 'host.docker.internal',
  });

  expect(mocks.run).toHaveBeenCalledWith(
    'docker',
    [
      'run',
      '-d',
      '--name',
      'nb-nginx-proxy',
      '--add-host',
      'host.docker.internal:host-gateway',
      '-p',
      '80:80',
      '-p',
      '443:443',
      '-p',
      '8080:8080',
      '-p',
      '8443:8443',
      '-v',
      '/tmp/nocobase-cli-proxy-nginx-runtime:/apps',
      '-v',
      '/tmp/nocobase-cli-proxy-nginx-runtime/.nocobase/proxy/nginx/nocobase.conf:/etc/nginx/conf.d/default.conf:ro',
      'nginx:latest',
    ],
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  );
});

test('startNginxProxy recreates the docker container when published ports changed', async () => {
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.commandOutput.mockResolvedValueOnce('{"80/tcp":[{"HostPort":"80"}]}');

  const { startNginxProxy } = await import('../lib/proxy-nginx.js');

  await startNginxProxy({
    driver: 'docker',
    runtimeCliRoot: '/apps',
    upstreamHost: 'host.docker.internal',
  });

  expect(mocks.run).toHaveBeenCalledWith('docker', ['rm', '-f', 'nb-nginx-proxy'], {
    errorName: 'docker rm',
    stdio: 'ignore',
  });
  expect(mocks.run).toHaveBeenCalledWith(
    'docker',
    expect.arrayContaining(['run', '-d', '--name', 'nb-nginx-proxy']),
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  );
});
