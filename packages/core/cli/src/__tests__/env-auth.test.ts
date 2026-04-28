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
  const previous = process.env.NB_CLI_ROOT;
  const tempHome = await mkdtemp(path.join(os.tmpdir(), 'nocobase-ctl-test-'));
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
  expect(getOauthMetadataUrl('http://localhost:13000/api/')).toBe('http://localhost:13000/api/.well-known/oauth-authorization-server');
  expect(getOauthResource('http://localhost:13000/api/')).toBe('http://localhost:13000/api/');
  expect(getOauthResource('https://demo.example.com/custom/api')).toBe('https://demo.example.com/custom/api/');
});

test('buildOauthRedirectHtml escapes OAuth URLs for HTML and script contexts', () => {
  const url = 'https://example.com/oauth?scope=openid api&state="abc"&next=<script>alert(1)</script>';
  const html = buildOauthRedirectHtml(url);

  expect(html).toMatch(/<title>NocoBase OAuth Login<\/title>/);
  expect(html).toMatch(/Redirecting to sign-in/);
  expect(html).toMatch(/Continue to sign-in/);
  expect(html).toMatch(/Open manually/);
  expect(html).toMatch(/scope=openid api&amp;state=&quot;abc&quot;&amp;next=&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  expect(html).toMatch(/window\.location\.replace\("https:\/\/example\.com\/oauth\?scope=openid api&state=\\"abc\\"&next=\\u003cscript>alert\(1\)\\u003c\/script>"/);
  expect(html).not.toMatch(/href="[^"]*&state="/);
});

test('buildOauthCompletionHtml renders a styled completion page with auto-close guidance', () => {
  const html = buildOauthCompletionHtml();

  expect(html).toMatch(/<title>Authentication complete<\/title>/);
  expect(html).toMatch(/NocoBase CLI/);
  expect(html).toMatch(/Authentication complete/);
  expect(html).toMatch(/This page will close automatically in 10 seconds\./);
  expect(html).toMatch(/window\.close\(\)/);
  expect(html).toMatch(/}, 10000\);/);
  expect(html).toMatch(/If this tab stays open, you can close it manually\./);
});

test('buildOauthErrorHtml renders a styled error page and escapes detail content', () => {
  const html = buildOauthErrorHtml('Invalid state: <script>alert("xss")</script>');

  expect(html).toMatch(/<title>Authentication failed<\/title>/);
  expect(html).toMatch(/The OAuth sign-in flow could not be completed in this browser tab\./);
  expect(html).toMatch(/Invalid state: &lt;script&gt;alert\(&quot;xss&quot;\)&lt;\/script&gt;/);
  expect(html).not.toMatch(/<script>alert\("xss"\)<\/script>/);
  expect(html).toMatch(/Return to the terminal to review the error details and try again if needed\./);
});

test('isOauthAccessTokenExpired uses a refresh window', () => {
  const now = Date.parse('2026-04-15T00:00:00.000Z');
  expect(isOauthAccessTokenExpired(
      {
        type: 'oauth',
        accessToken: 'token',
        expiresAt: '2026-04-15T00:00:30.000Z',
      },
      now,
    )).toBe(true);
  expect(isOauthAccessTokenExpired(
      {
        type: 'oauth',
        accessToken: 'token',
        expiresAt: '2026-04-15T00:05:00.000Z',
      },
      now,
    )).toBe(false);
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

      expect(url).toBe('http://localhost:13000/api/idpOAuth/token');
      const body = init?.body instanceof URLSearchParams ? init.body : new URLSearchParams(String(init?.body ?? ''));
      expect(body.get('grant_type')).toBe('refresh_token');
      expect(body.get('client_id')).toBe('client-1');
      expect(body.get('refresh_token')).toBe('refresh-token');
      expect(body.get('resource')).toBe('http://localhost:13000/api/');

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
      expect(token).toBe('fresh-token');
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

        expect(url).toBe('http://localhost:13000/api/idpOAuth/token');
        expect(init?.method).toBe('POST');
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
        expect(token).toBe('fresh-token-after-retry');
        expect(metadataAttempts).toBe(3);
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
        try {
          await resolveAccessToken({
            envName: 'test',
            scope: 'global',
          });
        } catch (error: any) {
          expect(error.message).toMatch(/Failed to load OAuth metadata\./);
          expect(error.message).toMatch(/Env: test/);
          expect(error.message).toMatch(/Base URL: http:\/\/localhost:13000\/api/);
          expect(error.message).toMatch(
            /Request URL: http:\/\/localhost:13000\/api\/\.well-known\/oauth-authorization-server/,
          );
          expect(error.message).toMatch(/Network error: fetch failed/);
          expect(error.message).toMatch(/nb env auth test/);
          expect(error.message).toMatch(/nb env list/);
          return;
        }

        throw new Error('Expected resolveAccessToken to reject');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
