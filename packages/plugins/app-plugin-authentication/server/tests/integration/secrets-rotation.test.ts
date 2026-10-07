// @vitest-environment node

import { createCaching } from '@nocobase/caching';
import { createSecretsService } from '@nocobase/app-server/secrets';
import { Hono } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';

import { Auth, type AuthEnv } from '../../auth.js';
import { createAuthStorage } from '../../auth-storage.js';
import { BETTER_AUTH_SECRETS_PURPOSE } from '../../config.js';
import { createAuthFixture } from './support.js';

const v1 = { version: 1, key: '1'.repeat(64) };
const v2 = { version: 2, key: '2'.repeat(64) };

const derived = (keys: { version: number; key: string }[]) =>
  createSecretsService({ keys }).keyring(BETTER_AUTH_SECRETS_PURPOSE);

/**
 * What happens to signed-in users when a new key is put in front of the current one. Better Auth signs its session
 * cookie with the current secret only, so the outcome here is what the deployment documentation states.
 */
describe('secrets key rotation', () => {
  const disposers: (() => Promise<void>)[] = [];
  afterEach(async () => {
    for (const dispose of disposers.splice(0)) await dispose();
  });

  it('ends existing sessions when a new key becomes current', async () => {
    const caching = createCaching();
    disposers.push(() => caching.dispose());
    const secondaryStorage = createAuthStorage(caching);
    const fixture = await createAuthFixture({
      secret: undefined,
      secrets: derived([v1]),
      secondaryStorage,
    });
    disposers.push(() => fixture.dispose());
    const { cookie } = await fixture.signUp();
    expect(
      (await fixture.router.request('/private', { headers: { cookie } }))
        .status,
    ).toBe(200);

    const rotated = new Auth({
      connection: fixture.connection,
      baseURL: 'http://localhost/api/auth',
      secrets: derived([v2, v1]),
      advanced: { cookiePrefix: 'nocobase3' },
      secondaryStorage,
      session: { storeSessionInDatabase: true },
    });
    const router = new Hono<AuthEnv>();
    router.get('/private', rotated.required(), (context) =>
      context.json({ ok: true }),
    );
    expect(
      (await router.request('/private', { headers: { cookie } })).status,
    ).toBe(401);

    // Signing in again works under the new key.
    const signIn = await rotated.handler(
      new Request('http://localhost/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'alice@example.com',
          password: 'correct horse battery staple',
        }),
      }),
    );
    expect(signIn.status).toBe(200);
    const renewed = signIn.headers.get('set-cookie') ?? '';
    expect(
      (await router.request('/private', { headers: { cookie: renewed } }))
        .status,
    ).toBe(200);
  });
});
