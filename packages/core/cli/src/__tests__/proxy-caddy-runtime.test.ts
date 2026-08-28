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
  mapProxyPathFromCliRoot: vi.fn(),
  resolveEnvProxyMainOutputPath: vi.fn(),
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
  CADDY_PROXY_DRIVER_OPTIONS: ['local', 'docker'],
  DEFAULT_CADDY_PROXY_DRIVER: 'local',
  getCliConfigValue: mocks.getCliConfigValue,
  normalizeCaddyProxyDriver: vi.fn(),
  resolveDockerContainerPrefix: mocks.resolveDockerContainerPrefix,
  setCliConfigValue: mocks.setCliConfigValue,
}));

vi.mock('../lib/env-proxy.js', () => ({
  applyEnvProxyAppEntryOptions: vi.fn(),
  buildManualEnvProxyCaddyBundle: vi.fn(),
  buildEnvProxyCaddyBundle: vi.fn(),
  buildEnvProxyMainConfig: mocks.buildEnvProxyMainConfig,
  mapProxyPathFromCliRoot: mocks.mapProxyPathFromCliRoot,
  resolveEnvProxyMainOutputPath: mocks.resolveEnvProxyMainOutputPath,
}));

vi.mock('../lib/run-npm.js', () => ({
  commandOutput: mocks.commandOutput,
  run: mocks.run,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NB_CLI_ROOT = '/tmp/nocobase-cli-proxy-caddy-runtime';
  mocks.dockerContainerExists.mockResolvedValue(false);
  mocks.dockerContainerIsRunning.mockResolvedValue(false);
  mocks.resolveDockerContainerPrefix.mockResolvedValue('nb');
  mocks.resolveEnvProxyMainOutputPath.mockReturnValue(
    '/tmp/nocobase-cli-proxy-caddy-runtime/.nocobase/proxy/caddy/nocobase.caddy',
  );
  mocks.buildEnvProxyMainConfig.mockResolvedValue('import /apps/.nocobase/proxy/caddy/*/app.caddy');
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

test('startCaddyProxy publishes docker ports 80, 443, and saved env proxy ports', async () => {
  const { startCaddyProxy } = await import('../lib/proxy-caddy.js');

  await startCaddyProxy({
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
      'nb-caddy-proxy',
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
      '/tmp/nocobase-cli-proxy-caddy-runtime:/apps',
      '-v',
      '/tmp/nocobase-cli-proxy-caddy-runtime/.nocobase/proxy/caddy/nocobase.caddy:/etc/caddy/Caddyfile:ro',
      'caddy:latest',
    ],
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  );
});

test('startCaddyProxy recreates the docker container when published ports changed', async () => {
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.commandOutput.mockResolvedValueOnce('{"80/tcp":[{"HostPort":"80"}]}');

  const { startCaddyProxy } = await import('../lib/proxy-caddy.js');

  await startCaddyProxy({
    driver: 'docker',
    runtimeCliRoot: '/apps',
    upstreamHost: 'host.docker.internal',
  });

  expect(mocks.run).toHaveBeenCalledWith('docker', ['rm', '-f', 'nb-caddy-proxy'], {
    errorName: 'docker rm',
    stdio: 'ignore',
  });
  expect(mocks.run).toHaveBeenCalledWith(
    'docker',
    expect.arrayContaining(['run', '-d', '--name', 'nb-caddy-proxy']),
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  );
});
