// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Auth } from '../../auth.js';
import { createAuthFixture } from './support.js';

describe('Auth', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  const setup = async () => {
    const fixture = await createAuthFixture();
    fixtures.push(fixture);
    return fixture;
  };
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it('requires a secret', async () => {
    const { connection } = await setup();
    expect(() => new Auth({ connection })).toThrow(
      'Authentication secret is required',
    );
  });

  it('reports password reset only when password authentication and its sender are configured', async () => {
    const disabled = await createAuthFixture({
      emailAndPassword: { enabled: false, sendResetPassword: vi.fn() },
    });
    const missingSender = await createAuthFixture({
      emailAndPassword: { enabled: true },
    });
    const configured = await createAuthFixture({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
    });
    fixtures.push(disabled, missingSender, configured);
    expect(disabled.auth.passwordResetAvailable()).toBe(false);
    expect(missingSender.auth.passwordResetAvailable()).toBe(false);
    expect(configured.auth.passwordResetAvailable()).toBe(true);
  });

  it('signs up and exposes its session to a protected route', async () => {
    const { router, signUp, connection } = await setup();
    const { response, cookie } = await signUp();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      user: { email: 'alice@example.com', username: 'alice.admin' },
    });
    expect(cookie).toContain('session_token');
    const account = await connection.query
      .selectFrom('account')
      .select(['providerId', 'accountId', 'userId'])
      .executeTakeFirst();
    expect(account).toMatchObject({
      providerId: 'credential',
      accountId: account?.userId,
    });
    const protectedResponse = await router.request('/private', {
      headers: { cookie },
    });
    expect(protectedResponse.status).toBe(200);
    expect(await protectedResponse.json()).toMatchObject({
      auth: {
        user: { email: 'alice@example.com' },
        session: { userId: account?.userId },
      },
    });
  });

  it('normalizes username and email for login and rejects a wrong password', async () => {
    const { router, signUp } = await setup();
    await signUp();
    for (const [path, credentials] of [
      [
        '/api/auth/sign-in/username',
        { username: 'ALICE.ADMIN', password: 'correct horse battery staple' },
      ],
      [
        '/api/auth/sign-in/email',
        {
          email: 'ALICE@EXAMPLE.COM',
          password: 'correct horse battery staple',
        },
      ],
    ] as const) {
      const response = await router.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      expect(response.status).toBe(200);
    }
    const invalid = await router.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'wrong-password',
      }),
    });
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toMatchObject({
      code: 'INVALID_EMAIL_OR_PASSWORD',
    });
  });

  it('rejects disabled accounts and stops resolving their existing sessions', async () => {
    const { router, signUp, connection, auth } = await setup();
    const { cookie } = await signUp();
    await connection.query
      .updateTable('user')
      .set({ disabledAt: new Date() })
      .where('email', '=', 'alice@example.com')
      .execute();
    await expect(auth.getSession(new Headers({ cookie }))).resolves.toBeNull();
    const response = await router.request('/api/auth/sign-in/username', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'alice.admin',
        password: 'correct horse battery staple',
      }),
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_DISABLED' });
  });

  it('runs configured session creation hooks alongside the disabled-account check', async () => {
    const before = vi.fn(async () => undefined);
    const after = vi.fn(async () => undefined);
    const fixture = await createAuthFixture({
      databaseHooks: { session: { create: { before, after } } },
    });
    fixtures.push(fixture);
    const { response } = await fixture.signUp();
    expect(response.status).toBe(200);
    expect(before).toHaveBeenCalledOnce();
    expect(after).toHaveBeenCalledOnce();
  });
});
