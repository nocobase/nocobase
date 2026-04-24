/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { saveAuthConfig } from '../lib/auth-store.js';
import { buildDockerAppContainerName, resolveManagedAppRuntime } from '../lib/app-runtime.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NOCOBASE_CTL_HOME;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-runtime-'));
  process.env.NOCOBASE_CTL_HOME = tempHome;

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.NOCOBASE_CTL_HOME;
    } else {
      process.env.NOCOBASE_CTL_HOME = previous;
    }
    await rm(tempHome, { recursive: true, force: true });
  }
}

test('buildDockerAppContainerName keeps workspace-scoped naming consistent', () => {
  assert.equal(
    buildDockerAppContainerName('Local_01', 'NB Demo Workspace'),
    'nb-demo-workspace-local_01-app',
  );
});

test('resolveManagedAppRuntime detects local, docker, and remote envs', async () => {
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
    assert.deepEqual(dockerRuntime && { kind: dockerRuntime.kind, source: dockerRuntime.source }, {
      kind: 'docker',
      source: 'docker',
    });
    assert.equal(dockerRuntime?.kind === 'docker' ? dockerRuntime.containerName : '', 'nb-demo-docker-env-app');

    const localRuntime = await resolveManagedAppRuntime('git-env');
    assert.deepEqual(localRuntime && { kind: localRuntime.kind, source: localRuntime.source }, {
      kind: 'local',
      source: 'git',
    });
    assert.match(localRuntime?.kind === 'local' ? localRuntime.projectRoot : '', /apps\/git-env$/);

    const remoteRuntime = await resolveManagedAppRuntime('remote');
    assert.deepEqual(remoteRuntime && { kind: remoteRuntime.kind, source: remoteRuntime.source }, {
      kind: 'remote',
      source: undefined,
    });
  });
});
