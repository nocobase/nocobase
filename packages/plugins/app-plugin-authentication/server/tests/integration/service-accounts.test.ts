// @vitest-environment node

import { emailOTP, magicLink } from 'better-auth/plugins';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthOptions } from '../../auth.js';
import { createUserAdministrationService } from '../../user-administration.js';
import { createAuthFixture } from './support.js';

const json = (body: unknown) => ({
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
  },
  body: JSON.stringify(body),
});

describe('service accounts', () => {
  const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
  const setup = async (
    options: Partial<Omit<AuthOptions, 'connection'>> = {},
  ) => {
    const fixture = await createAuthFixture(options);
    fixtures.push(fixture);
    const users = createUserAdministrationService({
      auth: fixture.auth,
      connection: fixture.connection,
    });
    const robot = await users.createServiceAccount({
      name: 'CI deployer',
      description: 'Deploys main from GitHub Actions',
    });
    return { ...fixture, users, robot };
  };
  afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((fixture) => fixture.dispose()));
  });

  it('creates a service account with no password and an unroutable address', async () => {
    const { users, robot, connection } = await setup();
    expect(robot).toMatchObject({
      name: 'CI deployer',
      description: 'Deploys main from GitHub Actions',
      kind: 'service',
      disabledAt: null,
    });
    expect(robot.email).toMatch(/@service\.invalid$/u);
    expect(
      await connection.query
        .selectFrom('account')
        .select('id')
        .where('userId', '=', robot.id)
        .execute(),
    ).toEqual([]);
    await expect(
      users.resetPassword(robot.id, 'long-enough-password'),
    ).rejects.toMatchObject({
      code: 'SERVICE_ACCOUNT_NO_PASSWORD',
    });
    expect(
      await connection.query
        .selectFrom('account')
        .select('id')
        .where('userId', '=', robot.id)
        .execute(),
    ).toEqual([]);
  });

  it('lists people by default and service accounts on request', async () => {
    const { users, robot, signUp } = await setup();
    await signUp();
    const people = await users.list();
    expect(people.items.map((user) => user.kind)).toEqual(['person']);
    const robots = await users.list({ kind: 'service' });
    expect(robots.items.map((user) => user.id)).toEqual([robot.id]);
    expect((await users.list({ kind: 'all' })).total).toBe(2);
    const renamed = await users.updateServiceAccount(robot.id, {
      name: 'Release bot',
      description: null,
    });
    expect(renamed).toMatchObject({ name: 'Release bot', description: null });
    const person = people.items[0]!;
    await expect(
      users.updateServiceAccount(person.id, { name: 'Not a robot' }),
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });

  it('refuses a password sign-in, even with a password written behind its back', async () => {
    const { robot, router, auth, connection } = await setup();
    const context = await auth.administrationContext();
    // Write a credential directly, past the account hook, to prove the session hook alone refuses it.
    await connection.query
      .insertInto('account')
      .values({
        id: 'forged',
        accountId: robot.id,
        providerId: 'credential',
        userId: robot.id,
        password: await context.password.hash('forged-password-123'),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute();
    const response = await router.request(
      '/api/auth/sign-in/email',
      json({ email: robot.email, password: 'forged-password-123' }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: 'SERVICE_ACCOUNT_NO_LOGIN',
    });
    expect(
      await connection.query
        .selectFrom('session')
        .select('id')
        .where('userId', '=', robot.id)
        .execute(),
    ).toEqual([]);
  });

  it('never sends a reset link, and a reset token cannot give it a password', async () => {
    const sendResetPassword = vi.fn();
    const { robot, router, auth, connection } = await setup({
      emailAndPassword: { enabled: true, sendResetPassword },
    });
    const requested = await router.request(
      '/api/auth/request-password-reset',
      json({ email: robot.email }),
    );
    expect(requested.status).toBe(200);
    expect(sendResetPassword).not.toHaveBeenCalled();

    // A token that somehow exists still cannot attach a password.
    const context = await auth.administrationContext();
    await context.internalAdapter.createVerificationValue({
      identifier: 'reset-password:stolen-token',
      value: robot.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const reset = await router.request(
      '/api/auth/reset-password',
      json({ token: 'stolen-token', newPassword: 'chosen-password-123' }),
    );
    expect(reset.status).toBe(403);
    expect(await reset.json()).toMatchObject({
      code: 'SERVICE_ACCOUNT_NO_LOGIN',
    });
    expect(
      await connection.query
        .selectFrom('account')
        .select('id')
        .where('userId', '=', robot.id)
        .execute(),
    ).toEqual([]);
  });

  it('refuses a magic link sign-in', async () => {
    let link: string | undefined;
    const { robot, router } = await setup({
      plugins: [
        magicLink({
          sendMagicLink: ({ token }) => {
            link = token;
            return Promise.resolve();
          },
        }),
      ],
    });
    await router.request(
      '/api/auth/sign-in/magic-link',
      json({ email: robot.email }),
    );
    expect(link).toBeTypeOf('string');
    const response = await router.request(
      `/api/auth/magic-link/verify?token=${link}`,
      { headers: { origin: 'http://localhost' } },
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: 'SERVICE_ACCOUNT_NO_LOGIN',
    });
  });

  it('refuses a one-time code sign-in', async () => {
    let code: string | undefined;
    const { robot, router } = await setup({
      plugins: [
        emailOTP({
          sendVerificationOTP: ({ otp }) => {
            code = otp;
            return Promise.resolve();
          },
        }),
      ],
    });
    await router.request(
      '/api/auth/email-otp/send-verification-otp',
      json({ email: robot.email, type: 'sign-in' }),
    );
    expect(code).toBeTypeOf('string');
    const response = await router.request(
      '/api/auth/sign-in/email-otp',
      json({ email: robot.email, otp: code }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: 'SERVICE_ACCOUNT_NO_LOGIN',
    });
  });

  it('refuses what a social or OIDC callback does: linking a provider and creating a session', async () => {
    const { robot, auth } = await setup();
    const context = await auth.administrationContext();
    await expect(
      context.internalAdapter.linkAccount({
        userId: robot.id,
        providerId: 'github',
        accountId: 'octocat',
      }),
    ).rejects.toMatchObject({ body: { code: 'SERVICE_ACCOUNT_NO_LOGIN' } });
    await expect(
      context.internalAdapter.createSession(robot.id),
    ).rejects.toMatchObject({ body: { code: 'SERVICE_ACCOUNT_NO_LOGIN' } });
  });

  it('refuses a scoped session on routes that do not opt in, and serves routes that do', async () => {
    const { auth, signUp } = await setup();
    const { cookie } = await signUp();
    let scoped = false;
    const remove = auth.addScopedCredentialCheck(() => scoped);
    const router = new Hono();
    router.get('/private', auth.required(), (context) =>
      context.json({ ok: true }),
    );
    router.get('/scoped', auth.required({ scopedKeys: true }), (context) =>
      context.json({ ok: true }),
    );
    const headers = { cookie };

    expect((await router.request('/private', { headers })).status).toBe(200);
    scoped = true;
    const refused = await router.request('/private', { headers });
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({
      error: { reason: 'SCOPED_KEY_FORBIDDEN', domain: 'authentication' },
    });
    expect((await router.request('/scoped', { headers })).status).toBe(200);
    remove();
    expect((await router.request('/private', { headers })).status).toBe(200);
  });
});
