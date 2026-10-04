// @vitest-environment node

import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';
import { Auth, type AuthEnv } from '../../auth.js';
import { createAuthFixture, testSecret } from './support.js';

function rejectingCredential(
  status: 'FORBIDDEN' | 'INTERNAL_SERVER_ERROR',
): BetterAuthPlugin {
  return {
    id: 'rejecting-credential',
    hooks: {
      before: [
        {
          matcher: (context) =>
            Boolean(context.headers?.get('x-test-credential')),
          handler: createAuthMiddleware(() => {
            throw new APIError(status, {
              code: 'REJECTED',
              message: 'The credential was rejected.',
            });
          }),
        },
      ],
    },
  };
}

describe('Auth middleware', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  const setup = async (
    options: Parameters<typeof createAuthFixture>[0] = {},
  ) => {
    const fixture = await createAuthFixture(options);
    fixtures.push(fixture);
    return fixture;
  };
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it('distinguishes anonymous and authenticated requests on required and optional routes', async () => {
    const { router, signUp } = await setup();
    const { cookie } = await signUp();
    expect((await router.request('/private')).status).toBe(401);
    expect(await (await router.request('/optional')).json()).toEqual({
      auth: null,
    });
    expect(
      (await router.request('/private', { headers: { cookie } })).status,
    ).toBe(200);
    expect(
      (await router.request('/optional', { headers: { cookie } })).status,
    ).toBe(200);
  });

  it('preserves rejected credential and server failure responses', async () => {
    const { connection } = await setup();
    for (const status of ['FORBIDDEN', 'INTERNAL_SERVER_ERROR'] as const) {
      const auth = new Auth({
        connection,
        secret: testSecret,
        baseURL: 'http://localhost/api/auth',
        plugins: [rejectingCredential(status)],
      });
      const router = new Hono<AuthEnv>();
      router.get('/required', auth.required(), (context) =>
        context.json({ ok: true }),
      );
      router.get('/optional', auth.optional(), (context) =>
        context.json({ ok: true }),
      );
      for (const path of ['/required', '/optional']) {
        const response = await router.request(path, {
          headers: { 'x-test-credential': 'expired' },
        });
        expect(response.status).toBe(status === 'FORBIDDEN' ? 403 : 500);
        expect(await response.json()).toMatchObject({
          error: { reason: 'REJECTED', domain: 'authentication' },
        });
      }
    }
  });

  it('checks the origin of browser cookie writes, including optional and skipped routes', async () => {
    const { router, signUp } = await setup();
    const { cookie } = await signUp();
    const send = (path: string, headers: Record<string, string>) =>
      router.request(path, { method: 'POST', headers: { cookie, ...headers } });
    for (const headers of [
      { origin: 'http://localhost' },
      { referer: 'http://localhost/app/page' },
      { origin: 'null', 'sec-fetch-site': 'same-origin' },
    ])
      expect((await send('/private', headers)).status).toBe(200);
    for (const headers of [
      {},
      { origin: 'null' },
      { origin: 'https://evil.example' },
      { origin: 'http://localhost.evil.example' },
      { origin: 'https://evil.example', authorization: 'Bearer fake' },
    ]) {
      const response = await send('/private', headers);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        code: 'INVALID_CSRF_ORIGIN',
      });
    }
    expect((await send('/optional', {})).status).toBe(403);
    expect(
      (await send('/skipped', { authorization: 'Bearer fake' })).status,
    ).toBe(403);
    expect((await router.request('/private', { method: 'POST' })).status).toBe(
      401,
    );
    expect(
      (
        await router.request('/skipped', {
          method: 'POST',
          headers: { authorization: 'Bearer fake' },
        })
      ).status,
    ).toBe(200);
  });

  it('uses trusted proxy headers when a browser sends a null origin', async () => {
    const { connection, signUp } = await setup();
    const { cookie } = await signUp();
    const auth = new Auth({
      connection,
      baseURL: 'https://app.example.com/api/auth',
      secret: testSecret,
      advanced: { cookiePrefix: 'nocobase3', trustedProxyHeaders: true },
      session: { storeSessionInDatabase: true },
    });
    const router = new Hono<AuthEnv>();
    router.post('/write', auth.optional(), (context) =>
      context.json({ ok: true }),
    );
    const headers = {
      cookie,
      origin: 'null',
      'sec-fetch-site': 'same-origin',
      'x-forwarded-host': 'app.example.com',
      'x-forwarded-proto': 'https',
    };
    expect(
      (
        await router.request('http://internal.example/write', {
          method: 'POST',
          headers,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await router.request('http://internal.example/write', {
          method: 'POST',
          headers: { ...headers, 'x-forwarded-host': 'evil.example' },
        })
      ).status,
    ).toBe(403);
  });

  it('accepts configured and plugin trusted origins without trusting lookalike hosts', async () => {
    const { connection, signUp } = await setup();
    const { cookie } = await signUp();
    const auth = new Auth({
      connection,
      baseURL: 'http://localhost/api/auth',
      secret: testSecret,
      trustedOrigins: async () => ['https://*.example.com'],
      plugins: [
        {
          id: 'test-trusted-origin',
          init: () => ({
            options: {
              trustedOrigins: async () => ['https://plugin.example.net'],
            },
          }),
        },
      ],
      advanced: { cookiePrefix: 'nocobase3' },
      session: { storeSessionInDatabase: true },
    });
    const router = new Hono<AuthEnv>();
    router.post('/write', auth.required(), (context) =>
      context.json({ ok: true }),
    );
    for (const origin of [
      'https://app.example.com',
      'https://plugin.example.net',
    ]) {
      expect(
        (
          await router.request('/write', {
            method: 'POST',
            headers: { cookie, origin },
          })
        ).status,
      ).toBe(200);
    }
    expect(
      (
        await router.request('/write', {
          method: 'POST',
          headers: { cookie, origin: 'https://example.com.attacker.test' },
        })
      ).status,
    ).toBe(403);
  });
});
