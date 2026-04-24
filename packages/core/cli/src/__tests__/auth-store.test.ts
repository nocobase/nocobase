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
import {
  ensureWorkspaceName,
  getEnv,
  loadAuthConfig,
  saveAuthConfig,
  setEnvOauthSession,
  updateEnvConnection,
  upsertEnv,
} from '../lib/auth-store.js';

async function withTempCliHome(run: () => Promise<void>) {
  const previous = process.env.NOCOBASE_CTL_HOME;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-test-'));
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

test('upsertEnv clears runtime metadata when base URL or token changes', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api', accessToken: 'new-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.auth?.accessToken).toBe('new-token');
    expect(env?.runtime).toBe(undefined);
  });
});

test('ensureWorkspaceName stores one workspace-level name outside env entries', async () => {
  await withTempCliHome(async () => {
    const first = await ensureWorkspaceName('nb-workspace', { scope: 'global' });
    const second = await ensureWorkspaceName('nb-other', { scope: 'global' });
    const config = await loadAuthConfig({ scope: 'global' });

    expect(first).toBe('nb-workspace');
    expect(second).toBe('nb-workspace');
    expect(config.name).toBe('nb-workspace');
    expect(config.envs).toEqual({});
  });
});

test('loadAuthConfig maps the legacy dockerResourcePrefix field to workspace name', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        dockerResourcePrefix: 'nb-legacy',
        currentEnv: 'default',
        envs: {},
      } as Parameters<typeof saveAuthConfig>[0] & { dockerResourcePrefix: string },
      { scope: 'global' },
    );

    const config = await loadAuthConfig({ scope: 'global' });
    expect(config.name).toBe('nb-legacy');
  });
});

test('upsertEnv preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'same-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api', accessToken: 'same-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('upsertEnv allows saving an env without a token', async () => {
  await withTempCliHome(async () => {
    await upsertEnv('test', { baseUrl: 'http://localhost:13000/api' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
    expect(env?.auth).toBe(undefined);
  });
});

test('upsertEnv clears an OAuth session when the base URL changes', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'oauth-token',
              refreshToken: 'refresh-token',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await upsertEnv('test', { baseUrl: 'http://localhost:14000/api' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:14000/api');
    expect(env?.auth).toBe(undefined);
  });
});

test('updateEnvConnection updates only the token and preserves the current base URL', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'old-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await updateEnvConnection('test', { accessToken: 'new-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.baseUrl).toBe('http://localhost:13000/api');
    expect(env?.auth?.accessToken).toBe('new-token');
    expect(env?.runtime).toBe(undefined);
  });
});

test('updateEnvConnection preserves runtime metadata when connection settings are unchanged', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'token',
              accessToken: 'same-token',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await updateEnvConnection('test', { accessToken: 'same-token' }, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('setEnvOauthSession can preserve runtime metadata during token refresh', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'old-access-token',
              refreshToken: 'refresh-token',
              expiresAt: '2026-04-13T00:00:00.000Z',
              scope: 'openid api offline_access',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
            },
            runtime: {
              version: 'v1',
              schemaHash: 'hash',
              generatedAt: '2026-04-13T00:00:00.000Z',
            },
          },
        },
      },
      { scope: 'global' },
    );

    await setEnvOauthSession(
      'test',
      {
        type: 'oauth',
        accessToken: 'new-access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2026-04-14T00:00:00.000Z',
        scope: 'openid api offline_access',
        issuer: 'http://localhost:13000/api',
        clientId: 'client-1',
        resource: 'http://localhost:13000/api/',
      },
      { scope: 'global', preserveRuntime: true },
    );

    const env = await getEnv('test', { scope: 'global' });
    expect(env?.auth?.type).toBe('oauth');
    expect(env?.auth?.accessToken).toBe('new-access-token');
    expect(env?.runtime).toEqual({
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});
