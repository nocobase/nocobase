/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { saveAuthConfig } from '../lib/auth-store.js';
import type { ManagedAppRuntime } from '../lib/app-runtime.js';
import { buildDockerAppContainerName, resolveManagedAppRuntime } from '../lib/app-runtime.js';
import { resolveCliHomeRoot } from '../lib/cli-home.js';

const mocks = vi.hoisted(() => ({
  buildRuntimeEnvVars: vi.fn(),
  runNocoBaseCommand: vi.fn(),
}));

vi.mock('../lib/runtime-env-vars.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/runtime-env-vars.js')>();
  return {
    ...actual,
    buildRuntimeEnvVars: mocks.buildRuntimeEnvVars,
  };
});

vi.mock('../lib/run-npm.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/run-npm.js')>();
  return {
    ...actual,
    runNocoBaseCommand: mocks.runNocoBaseCommand,
  };
});

type LocalRuntime = Extract<ManagedAppRuntime, { kind: 'local' }>;

const originalNbCliRoot = process.env.NB_CLI_ROOT;

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-runtime-'));
  const tempWorkspace = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-runtime-cwd-'));
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
    await rm(tempHome, { recursive: true, force: true });
    await rm(tempWorkspace, { recursive: true, force: true });
  }
}

function createLocalRuntime(overrides: Partial<LocalRuntime> = {}): LocalRuntime {
  return {
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/app1/source',
    env: {
      config: {
        appPath: '/tmp/app1',
      },
      envVars: {},
    },
    ...overrides,
  } as LocalRuntime;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.buildRuntimeEnvVars.mockResolvedValue({
    APP_PORT: '13000',
  });
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);
});

afterEach(() => {
  if (originalNbCliRoot === undefined) {
    delete process.env.NB_CLI_ROOT;
  } else {
    process.env.NB_CLI_ROOT = originalNbCliRoot;
  }
});

test('buildDockerAppContainerName keeps workspace-scoped naming consistent', () => {
  expect(buildDockerAppContainerName('Local_01', 'NB Demo Workspace')).toBe('nb-demo-workspace-local_01-app');
});

test('resolveManagedAppRuntime detects local, docker, and http envs', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        name: 'nb-demo',
        settings: {
          docker: {
            network: 'nocobase-team',
            containerPrefix: 'nb-team',
          },
        },
        lastEnv: 'docker-env',
        envs: {
          'docker-env': {
            source: 'docker',
            appPort: 13000,
          },
          'git-env': {
            source: 'git',
            appRootPath: './apps/git-env',
            storagePath: './storage/git-env',
          },
          remote: {
            baseUrl: 'https://demo.example.com/api',
          },
        },
      },
      { scope: 'global' },
    );

    const dockerRuntime = await resolveManagedAppRuntime('docker-env');
    expect(dockerRuntime && { kind: dockerRuntime.kind, source: dockerRuntime.source }).toEqual({
      kind: 'docker',
      source: 'docker',
    });
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.containerName : '').toBe('nb-team-docker-env-app');
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.dockerNetworkName : '').toBe('nocobase-team');
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.workspaceName : '').toBe('nocobase-team');

    const localRuntime = await resolveManagedAppRuntime('git-env');
    expect(localRuntime && { kind: localRuntime.kind, source: localRuntime.source }).toEqual({
      kind: 'local',
      source: 'git',
    });
    expect(localRuntime?.kind === 'local' ? localRuntime.dockerContainerPrefix : '').toBe('nb-team');
    expect(localRuntime?.kind === 'local' ? localRuntime.dockerNetworkName : '').toBe('nocobase-team');
    expect(localRuntime?.kind === 'local' ? localRuntime.projectRoot : '').toBe(
      path.resolve(resolveCliHomeRoot(), './apps/git-env'),
    );

    const remoteRuntime = await resolveManagedAppRuntime('remote');
    expect(remoteRuntime && { kind: remoteRuntime.kind, source: remoteRuntime.source }).toEqual({
      kind: 'http',
      source: undefined,
    });
  });
});

test('resolveManagedAppRuntime falls back to legacy name for docker defaults', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        name: 'nb-legacy',
        lastEnv: 'docker-env',
        envs: {
          'docker-env': {
            source: 'docker',
          },
        },
      },
      { scope: 'global' },
    );

    const dockerRuntime = await resolveManagedAppRuntime('docker-env');
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.dockerNetworkName : '').toBe('nb-legacy');
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.dockerContainerPrefix : '').toBe('nb-legacy');
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.containerName : '').toBe('nb-legacy-docker-env-app');
  });
});

test('resolveManagedAppRuntime exposes saved db schema env vars for local envs', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        lastEnv: 'local-env',
        envs: {
          'local-env': {
            source: 'git',
            appRootPath: './apps/local-env',
            storagePath: './storage/local-env',
            cdnBaseUrl: 'https://cdn.example.com/ui/',
            dbSchema: 'test',
            dbTablePrefix: 'nb_',
            dbUnderscored: true,
          },
        },
      },
      { scope: 'global' },
    );

    const runtime = await resolveManagedAppRuntime('local-env');
    expect(runtime?.kind).toBe('local');
    expect(runtime?.env.envVars.CDN_BASE_URL).toBe('https://cdn.example.com/ui/');
    expect(runtime?.env.envVars.DB_SCHEMA).toBe('test');
    expect(runtime?.env.envVars.DB_TABLE_PREFIX).toBe('nb_');
    expect(runtime?.env.envVars.DB_UNDERSCORED).toBe('true');
  });
});

test('runLocalNocoBaseCommand injects <app-path>/.env for managed local runtimes', async () => {
  const { runLocalNocoBaseCommand } = await import('../lib/app-runtime.js');
  const runtime = createLocalRuntime();

  await runLocalNocoBaseCommand(runtime, ['start'], {
    env: {
      CUSTOM_FLAG: '1',
    },
    stdio: 'pipe',
  });

  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['start'], {
    cwd: '/tmp/app1/source',
    env: {
      APP_PORT: '13000',
      APP_ENV_PATH: '/tmp/app1/.env',
      CUSTOM_FLAG: '1',
    },
    stdio: 'pipe',
    onStdout: undefined,
    onStderr: undefined,
  });
});

test('runLocalNocoBaseCommand falls back to the parent .env when only source/ is known', async () => {
  const { runLocalNocoBaseCommand } = await import('../lib/app-runtime.js');
  const runtime = createLocalRuntime({
    projectRoot: '/tmp/custom/source',
    env: {
      config: {
        appRootPath: '/tmp/custom/source',
      },
      envVars: {},
    },
  });

  await runLocalNocoBaseCommand(runtime, ['dev']);

  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['dev'], {
    cwd: '/tmp/custom/source',
    env: {
      APP_PORT: '13000',
      APP_ENV_PATH: '/tmp/custom/.env',
    },
    stdio: undefined,
    onStdout: undefined,
    onStderr: undefined,
  });
});

test('runLocalNocoBaseCommand prefers an explicit internal env file path when it is saved', async () => {
  const { runLocalNocoBaseCommand } = await import('../lib/app-runtime.js');
  const { resolveManagedLocalEnvFilePath } = await import('../lib/managed-env-file.js');
  process.env.NB_CLI_ROOT = '/tmp/nb-home';
  const runtime = createLocalRuntime({
    env: {
      config: {
        appPath: '/tmp/app1',
        envFile: './configs/app1.env',
      },
      envVars: {},
    },
  });

  await runLocalNocoBaseCommand(runtime, ['pm2', 'logs']);

  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['pm2', 'logs'], {
    cwd: '/tmp/app1/source',
    env: {
      APP_PORT: '13000',
      APP_ENV_PATH: resolveManagedLocalEnvFilePath(runtime),
    },
    stdio: undefined,
    onStdout: undefined,
    onStderr: undefined,
  });
});
