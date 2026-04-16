import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getEnv, saveAuthConfig, setEnvOauthSession, updateEnvConnection, upsertEnv } from '../src/lib/auth-store.js';

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

    await upsertEnv('test', 'http://localhost:13000/api', 'new-token', { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    assert.equal(env?.auth?.accessToken, 'new-token');
    assert.equal(env?.runtime, undefined);
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

    await upsertEnv('test', 'http://localhost:13000/api', 'same-token', { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    assert.deepEqual(env?.runtime, {
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});

test('upsertEnv allows saving an env without a token', async () => {
  await withTempCliHome(async () => {
    await upsertEnv('test', 'http://localhost:13000/api', undefined, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    assert.equal(env?.baseUrl, 'http://localhost:13000/api');
    assert.equal(env?.auth, undefined);
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

    await upsertEnv('test', 'http://localhost:14000/api', undefined, { scope: 'global' });

    const env = await getEnv('test', { scope: 'global' });
    assert.equal(env?.baseUrl, 'http://localhost:14000/api');
    assert.equal(env?.auth, undefined);
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
    assert.equal(env?.baseUrl, 'http://localhost:13000/api');
    assert.equal(env?.auth?.accessToken, 'new-token');
    assert.equal(env?.runtime, undefined);
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
    assert.deepEqual(env?.runtime, {
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
    assert.equal(env?.auth?.type, 'oauth');
    assert.equal(env?.auth?.accessToken, 'new-access-token');
    assert.deepEqual(env?.runtime, {
      version: 'v1',
      schemaHash: 'hash',
      generatedAt: '2026-04-13T00:00:00.000Z',
    });
  });
});
