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
import { test, expect } from 'vitest';
import { saveAuthConfig } from '../lib/auth-store.js';
import { buildDockerAppContainerName, resolveManagedAppRuntime } from '../lib/app-runtime.js';
import { resolveCliHomeRoot } from '../lib/cli-home.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-runtime-'));
  process.env.NB_CLI_ROOT = tempHome;

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.NB_CLI_ROOT;
    } else {
      process.env.NB_CLI_ROOT = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

test('buildDockerAppContainerName keeps workspace-scoped naming consistent', () => {
  expect(buildDockerAppContainerName('Local_01', 'NB Demo Workspace')).toBe('nb-demo-workspace-local_01-app');
});

test('resolveManagedAppRuntime detects local, docker, and http envs', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        name: 'nb-demo',
        currentEnv: 'docker-env',
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
    expect(dockerRuntime?.kind === 'docker' ? dockerRuntime.containerName : '').toBe('nb-demo-docker-env-app');

    const localRuntime = await resolveManagedAppRuntime('git-env');
    expect(localRuntime && { kind: localRuntime.kind, source: localRuntime.source }).toEqual({
      kind: 'local',
      source: 'git',
    });
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
