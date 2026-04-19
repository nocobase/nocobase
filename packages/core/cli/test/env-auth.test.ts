import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { saveAuthConfig } from '../src/lib/auth-store.js';
import {
  getOauthMetadataUrl,
  getOauthResource,
  isOauthAccessTokenExpired,
  resolveAccessToken,
} from '../src/lib/env-auth.js';

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

test('OAuth helpers derive metadata and resource URLs from base URL', () => {
  assert.equal(
    getOauthMetadataUrl('http://localhost:13000/api/'),
    'http://localhost:13000/api/.well-known/oauth-authorization-server',
  );
  assert.equal(getOauthResource('http://localhost:13000/api/'), 'http://localhost:13000/api/');
  assert.equal(getOauthResource('https://demo.example.com/custom/api'), 'https://demo.example.com/custom/api/');
});

test('isOauthAccessTokenExpired uses a refresh window', () => {
  const now = Date.parse('2026-04-15T00:00:00.000Z');
  assert.equal(
    isOauthAccessTokenExpired(
      {
        type: 'oauth',
        accessToken: 'token',
        expiresAt: '2026-04-15T00:00:30.000Z',
      },
      now,
    ),
    true,
  );
  assert.equal(
    isOauthAccessTokenExpired(
      {
        type: 'oauth',
        accessToken: 'token',
        expiresAt: '2026-04-15T00:05:00.000Z',
      },
      now,
    ),
    false,
  );
});

test('resolveAccessToken refreshes expired OAuth sessions', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'expired-token',
              refreshToken: 'refresh-token',
              expiresAt: '2026-04-14T00:00:00.000Z',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
              scope: 'openid api offline_access',
            },
          },
        },
      },
      { scope: 'global' },
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.endsWith('/.well-known/oauth-authorization-server')) {
        return new Response(
          JSON.stringify({
            issuer: 'http://localhost:13000/api',
            authorization_endpoint: 'http://localhost:13000/api/idpOAuth/authorize',
            token_endpoint: 'http://localhost:13000/api/idpOAuth/token',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }

      assert.equal(url, 'http://localhost:13000/api/idpOAuth/token');
      const body = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ''));
      assert.equal(body.get('grant_type'), 'refresh_token');
      assert.equal(body.get('client_id'), 'client-1');
      assert.equal(body.get('refresh_token'), 'refresh-token');
      assert.equal(body.get('resource'), 'http://localhost:13000/api/');

      return new Response(
        JSON.stringify({
          access_token: 'fresh-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          scope: 'openid api offline_access',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }) as typeof fetch;

    try {
      const token = await resolveAccessToken({
        envName: 'test',
        scope: 'global',
      });
      assert.equal(token, 'fresh-token');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test('resolveAccessToken explains OAuth metadata network failures clearly', async () => {
  await withTempCliHome(async () => {
    await saveAuthConfig(
      {
        currentEnv: 'test',
        envs: {
          test: {
            baseUrl: 'http://localhost:13000/api',
            auth: {
              type: 'oauth',
              accessToken: 'expired-token',
              refreshToken: 'refresh-token',
              expiresAt: '2026-04-14T00:00:00.000Z',
              issuer: 'http://localhost:13000/api',
              clientId: 'client-1',
              resource: 'http://localhost:13000/api/',
              scope: 'openid api offline_access',
            },
          },
        },
      },
      { scope: 'global' },
    );

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;

    try {
      await assert.rejects(
        () =>
          resolveAccessToken({
            envName: 'test',
            scope: 'global',
          }),
        (error: any) => {
          assert.match(error.message, /Failed to load OAuth metadata\./);
          assert.match(error.message, /Env: test/);
          assert.match(error.message, /Base URL: http:\/\/localhost:13000\/api/);
          assert.match(
            error.message,
            /Request URL: http:\/\/localhost:13000\/api\/\.well-known\/oauth-authorization-server/,
          );
          assert.match(error.message, /Network error: fetch failed/);
          assert.match(error.message, /nb env auth -e test/);
          assert.match(error.message, /nb env list/);
          return true;
        },
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
