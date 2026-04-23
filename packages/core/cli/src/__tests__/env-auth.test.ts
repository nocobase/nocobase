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
import {
  buildOauthCompletionHtml,
  buildOauthErrorHtml,
  buildOauthRedirectHtml,
  getOauthMetadataUrl,
  getOauthResource,
  isOauthAccessTokenExpired,
  resolveAccessToken,
} from '../lib/env-auth.js';

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

async function withOauthRetryDelay(delayMs: string, run: () => Promise<void>) {
  const previous = process.env.NOCOBASE_CLI_OAUTH_RETRY_DELAY_MS;
  process.env.NOCOBASE_CLI_OAUTH_RETRY_DELAY_MS = delayMs;

  try {
    await run();
  } finally {
    if (previous === undefined) {
      delete process.env.NOCOBASE_CLI_OAUTH_RETRY_DELAY_MS;
    } else {
      process.env.NOCOBASE_CLI_OAUTH_RETRY_DELAY_MS = previous;
    }
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

test('buildOauthRedirectHtml escapes OAuth URLs for HTML and script contexts', () => {
  const url = 'https://example.com/oauth?scope=openid api&state="abc"&next=<script>alert(1)</script>';
  const html = buildOauthRedirectHtml(url);

  assert.match(html, /<title>NocoBase OAuth Login<\/title>/);
  assert.match(html, /Redirecting to sign-in/);
  assert.match(html, /Continue to sign-in/);
  assert.match(html, /Open manually/);
  assert.match(html, /scope=openid api&amp;state=&quot;abc&quot;&amp;next=&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(
    html,
    /window\.location\.replace\("https:\/\/example\.com\/oauth\?scope=openid api&state=\\"abc\\"&next=\\u003cscript>alert\(1\)\\u003c\/script>"/,
  );
  assert.doesNotMatch(html, /href="[^"]*&state="/);
});

test('buildOauthCompletionHtml renders a styled completion page with auto-close guidance', () => {
  const html = buildOauthCompletionHtml();

  assert.match(html, /<title>Authentication complete<\/title>/);
  assert.match(html, /NocoBase CLI/);
  assert.match(html, /Authentication complete/);
  assert.match(html, /This page will try to close automatically in a moment\./);
  assert.match(html, /window\.close\(\)/);
  assert.match(html, /If this tab stays open, you can close it manually\./);
});

test('buildOauthErrorHtml renders a styled error page and escapes detail content', () => {
  const html = buildOauthErrorHtml('Invalid state: <script>alert("xss")</script>');

  assert.match(html, /<title>Authentication failed<\/title>/);
  assert.match(html, /The OAuth sign-in flow could not be completed in this browser tab\./);
  assert.match(html, /Invalid state: &lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\("xss"\)<\/script>/);
  assert.match(html, /Return to the terminal to review the error details and try again if needed\./);
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

test('resolveAccessToken retries transient OAuth metadata network failures', async () => {
  await withOauthRetryDelay('0', async () => {
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
      let metadataAttempts = 0;
      globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (url.endsWith('/.well-known/oauth-authorization-server')) {
          metadataAttempts += 1;
          if (metadataAttempts < 3) {
            throw new TypeError('fetch failed');
          }

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
        assert.equal(init?.method, 'POST');
        return new Response(
          JSON.stringify({
            access_token: 'fresh-token-after-retry',
            refresh_token: 'refresh-token',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }) as typeof fetch;

      try {
        const token = await resolveAccessToken({
          envName: 'test',
          scope: 'global',
        });
        assert.equal(token, 'fresh-token-after-retry');
        assert.equal(metadataAttempts, 3);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

test('resolveAccessToken explains OAuth metadata network failures clearly', async () => {
  await withOauthRetryDelay('0', async () => {
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
            assert.match(error.message, /nb env auth test/);
            assert.match(error.message, /nb env list/);
            return true;
          },
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
