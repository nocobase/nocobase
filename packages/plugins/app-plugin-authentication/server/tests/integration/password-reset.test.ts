// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthFixture } from './support.js';
import { MailExecutions } from '@nocobase/mailer';
import type { betterAuth } from 'better-auth';
import * as mailer from '@nocobase/mailer';
import { defaultPasswordResetEmail } from '../../password-reset.js';
import { createAuthMiddleware } from 'better-auth/api';

type Fixture = Awaited<ReturnType<typeof createAuthFixture>>;
const fixtures: Fixture[] = [];
afterEach(async () => {
  await Promise.all(
    fixtures.splice(0).map(async (fixture) => {
      await fixture.auth.close();
      await fixture.dispose();
    }),
  );
  vi.restoreAllMocks();
});
const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(body),
});
const setup = async (options: Parameters<typeof createAuthFixture>[0] = {}) => {
  const fixture = await createAuthFixture(options);
  fixtures.push(fixture);
  return fixture;
};

describe('password reset policy', () => {
  it('does not install automatic recovery from an inferred Host header', async () => {
    const send = vi.fn();
    const fixture = await setup({
      baseURL: undefined,
      passwordReset: { enabled: true },
      passwordResetServices: {
        legacyChannels: {
          'system-email': { provider: 'smtp', host: 'localhost', port: 25 },
        },
      },
    });
    expect(fixture.auth.passwordResetAvailable()).toBe(false);
    expect(
      (await fixture.auth.administrationContext()).options.emailAndPassword
        ?.sendResetPassword,
    ).toBeUndefined();
    const request = new Request(
      'https://untrusted.example.test/api/auth/request-password-reset',
      json({ email: 'synthetic@example.test' }),
    );
    expect((await fixture.auth.handler(request)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it('enforces disablement before an application hook can short-circuit the endpoint', async () => {
    const before = vi.fn();
    const fixture = await setup({
      passwordReset: { enabled: false },
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
      hooks: {
        before: createAuthMiddleware((ctx) => {
          before();
          return ctx.json({ status: true });
        }),
      },
    });
    expect(
      (
        await fixture.router.request(
          '/api/auth/request-password-reset',
          json({ email: 'absent@example.test' }),
        )
      ).status,
    ).toBe(400);
    const direct = Reflect.get(fixture.auth, 'auth') as ReturnType<
      typeof betterAuth
    >;
    await expect(
      direct.api.requestPasswordReset({
        body: { email: 'absent@example.test' },
      }),
    ).rejects.toMatchObject({ body: { code: 'RESET_PASSWORD_DISABLED' } });
    expect(before).not.toHaveBeenCalled();
  });

  it('counts requests before a configured hook returns its own response', async () => {
    const before = vi.fn();
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
      hooks: {
        before: createAuthMiddleware((ctx) => {
          before();
          return ctx.json({ status: true });
        }),
      },
    });
    for (let i = 0; i < 4; i++)
      expect(
        (
          await fixture.router.request(
            '/api/auth/request-password-reset',
            json({ email: 'absent@example.test' }),
          )
        ).status,
      ).toBe(i < 3 ? 200 : 429);
    expect(before).toHaveBeenCalledTimes(3);
  });

  it('rechecks eligibility after token creation before starting the sender', async () => {
    const sender = vi.fn();
    const executions = new MailExecutions();
    const fixture: Fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
      passwordResetServices: { executions },
      databaseHooks: {
        verification: {
          create: {
            after: async (verification) => {
              if (verification.identifier.startsWith('reset-password:'))
                await fixture.connection.query
                  .updateTable('user')
                  .set({ disabledAt: new Date() })
                  .where('id', '=', verification.value)
                  .execute();
            },
          },
        },
      },
    });
    await fixture.signUp();
    const response = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    expect(response.status).toBe(200);
    await vi.waitFor(() => expect(executions.inFlight).toBe(0));
    expect(sender).not.toHaveBeenCalled();
  });

  it('does not trust changing forwarded headers when the peer is untrusted', async () => {
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
      advanced: { ipAddress: { trustedProxies: ['127.0.0.1'] } },
    });
    for (let i = 0; i < 4; i++) {
      const request = new Request(
        'http://localhost/api/auth/request-password-reset',
        {
          ...json({ email: 'absent@example.test' }),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `203.0.113.${i + 1}`,
          },
        },
      );
      expect(
        (await fixture.auth.handler(request, { clientAddress: '198.51.100.1' }))
          .status,
      ).toBe(i < 3 ? 200 : 429);
    }
  });

  it('does not trust headers without connection metadata', async () => {
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
    });
    for (let i = 0; i < 4; i++) {
      const request = new Request(
        'http://localhost/api/auth/request-password-reset',
        {
          ...json({ email: 'absent@example.test' }),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `203.0.113.${i + 1}`,
          },
        },
      );
      expect((await fixture.auth.handler(request)).status).toBe(
        i < 3 ? 200 : 429,
      );
    }
  });

  it('separates real peers and resolves only explicitly trusted proxy chains', async () => {
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
      advanced: { ipAddress: { trustedProxies: ['127.0.0.1'] } },
    });
    for (let i = 0; i < 4; i++) {
      const request = new Request(
        'http://localhost/api/auth/request-password-reset',
        {
          ...json({ email: 'absent@example.test' }),
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': `192.0.2.${i + 1},203.0.113.9`,
          },
        },
      );
      expect(
        (await fixture.auth.handler(request, { clientAddress: '127.0.0.1' }))
          .status,
      ).toBe(i < 3 ? 200 : 429);
    }
    const other = new Request(
      'http://localhost/api/auth/request-password-reset',
      json({ email: 'absent@example.test' }),
    );
    expect(
      (await fixture.auth.handler(other, { clientAddress: '198.51.100.2' }))
        .status,
    ).toBe(200);
  });

  it('preserves existing endpoint and database hooks while rechecking the actual password-write user', async () => {
    const sender = vi.fn();
    const after = vi.fn();
    const databaseBefore = vi.fn(async () => undefined);
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
      hooks: {
        before: createAuthMiddleware((ctx) =>
          ctx.path === '/reset-password'
            ? { context: { context: { applicationFlag: true } } }
            : undefined,
        ),
        after: createAuthMiddleware((ctx) => {
          if (ctx.path === '/reset-password') after();
        }),
      },
      databaseHooks: { account: { update: { before: databaseBefore } } },
    });
    await fixture.signUp();
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
    const response = await fixture.router.request(
      '/api/auth/reset-password',
      json({
        token: sender.mock.calls[0]![0].token,
        newPassword: 'replacement-password',
      }),
    );
    expect(response.status).toBe(200);
    expect(databaseBefore).toHaveBeenCalledOnce();
    expect(after).toHaveBeenCalledOnce();
  });

  it.each([{}, { enabled: false }, { enabled: true }])(
    'does not install an automatic callback without an enabled valid legacy channel: %j',
    async (passwordReset) => {
      const fixture = await setup({
        passwordReset,
        passwordResetServices: {
          legacyChannels: {
            'system-email': {
              provider: 'smtp',
              enabled: false,
              host: 'localhost',
              port: 25,
            },
          },
        },
      });
      expect(fixture.auth.passwordResetAvailable()).toBe(false);
      expect(
        (await fixture.auth.administrationContext()).options.emailAndPassword
          ?.sendResetPassword,
      ).toBeUndefined();
    },
  );

  it('keeps SMTP failure private and preserves explicit session settings for automatic sending', async () => {
    const send = vi.fn().mockResolvedValue({
      status: 'failed',
      disposition: 'never',
      error: {
        category: 'authentication',
        message: 'Synthetic SMTP failure.',
      },
    });
    vi.spyOn(mailer, 'createMailTransport').mockReturnValue({
      send,
      close: async () => undefined,
    });
    const fixture = await setup({
      passwordReset: { enabled: true },
      emailAndPassword: { enabled: true, revokeSessionsOnPasswordReset: false },
      passwordResetServices: {
        legacyChannels: {
          'system-email': { provider: 'smtp', host: 'localhost', port: 25 },
        },
      },
    });
    await fixture.signUp();
    const existing = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    const missing = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'absent@example.test' }),
    );
    expect(existing.status).toBe(200);
    expect(await existing.json()).toEqual(await missing.json());
    await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
    expect(
      (await fixture.auth.administrationContext()).options.emailAndPassword
        ?.revokeSessionsOnPasswordReset,
    ).toBe(false);
  });

  it.each([true, false])(
    'refuses expired tokens and atomically consumes parallel reset requests with database storage %s',
    async (storeInDatabase) => {
      const sender = vi.fn();
      const fixture = await setup({
        emailAndPassword: { enabled: true, sendResetPassword: sender },
        verification: { storeInDatabase },
      });
      const { response } = await fixture.signUp();
      const user = (await response.json()).user as { id: string };
      const context = await fixture.auth.administrationContext();
      await context.internalAdapter.createVerificationValue({
        identifier: 'reset-password:expired',
        value: user.id,
        expiresAt: new Date(Date.now() - 1_000),
      });
      expect(
        (
          await fixture.router.request(
            '/api/auth/reset-password',
            json({ token: 'expired', newPassword: 'replacement-password' }),
          )
        ).status,
      ).toBe(400);
      await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'alice@example.com' }),
      );
      await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
      const token = sender.mock.calls[0]![0].token as string;
      const results = await Promise.all([
        fixture.router.request(
          '/api/auth/reset-password',
          json({ token, newPassword: 'replacement-password' }),
        ),
        fixture.router.request(
          `/api/auth/reset-password?token=${token}`,
          json({ token: '', newPassword: 'replacement-password' }),
        ),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([200, 400]);
    },
  );

  it('escapes dynamic HTML while keeping the public non-root reset URL and bilingual text', () => {
    const message = defaultPasswordResetEmail(
      {
        user: {
          id: 'synthetic',
          name: '<script>',
          email: 'synthetic@example.test',
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: 'synthetic',
        url: 'https://public.example.test/main/api/auth/reset-password/synthetic?callbackURL=%2Fmain%2Freset-password&x="test"',
      },
      '<img src=x onerror=alert(1)>',
    );
    expect(message.html).not.toContain('<img');
    expect(message.html).toContain('&lt;img');
    expect(message.html).toContain('&amp;x=&quot;test&quot;');
    expect(message.text).toContain('重置密码');
    expect(message.text).toContain('https://public.example.test/main/');
  });

  it('does not exceed four custom callbacks when they ignore cancellation', async () => {
    const releases: Array<() => void> = [];
    const sender = vi.fn(
      () => new Promise<void>((resolve) => releases.push(resolve)),
    );
    const executions = new MailExecutions();
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
      passwordResetServices: { executions, increment: async () => 1 },
    });
    await fixture.signUp();
    vi.useFakeTimers();
    try {
      for (let i = 0; i < 4; i++)
        await fixture.router.request(
          '/api/auth/request-password-reset',
          json({ email: 'alice@example.com' }),
        );
      await vi.waitFor(() => expect(sender).toHaveBeenCalledTimes(4));
      for (let window = 0; window < 3; window++) {
        await vi.advanceTimersByTimeAsync(20_001);
        for (let i = 0; i < 4; i++)
          expect(
            (
              await fixture.router.request(
                '/api/auth/request-password-reset',
                json({ email: 'alice@example.com' }),
              )
            ).status,
          ).toBe(200);
        expect(sender).toHaveBeenCalledTimes(4);
        expect(executions.inFlight).toBe(4);
        for (const call of sender.mock.calls) {
          const request = call[1] as Request;
          expect(request).toBeInstanceOf(Request);
          expect(request.method).toBe('POST');
          expect(request.signal.aborted).toBe(true);
          expect(request.headers.get('content-type')).toBe('application/json');
        }
      }
    } finally {
      releases.forEach((release) => release());
      await vi.advanceTimersByTimeAsync(0);
      vi.useRealTimers();
    }
    expect(executions.inFlight).toBe(0);
  });

  it.each(['disabled', 'deleted', 'missing', 'oauth', 'service'])(
    'returns the same anonymous body for %s accounts and nonexistent accounts',
    async (kind) => {
      const sender = vi.fn();
      const fixture = await setup({
        emailAndPassword: { enabled: true, sendResetPassword: sender },
      });
      const { response } = await fixture.signUp();
      const user = (await response.json()).user as { id: string };
      if (kind === 'disabled' || kind === 'deleted' || kind === 'service') {
        const update =
          kind === 'disabled'
            ? { disabledAt: new Date() }
            : kind === 'deleted'
              ? { deletedAt: new Date() }
              : { kind: 'service' };
        await fixture.connection.query
          .updateTable('user')
          .set(update)
          .where('id', '=', user.id)
          .execute();
      } else if (kind === 'missing')
        await fixture.connection.query
          .deleteFrom('user')
          .where('id', '=', user.id)
          .execute();
      else
        await fixture.connection.query
          .deleteFrom('account')
          .where('userId', '=', user.id)
          .execute();
      const account = await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'alice@example.com' }),
      );
      const absent = await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'absent@example.test' }),
      );
      expect(account.status).toBe(200);
      expect(await account.json()).toEqual(await absent.json());
      expect(sender).not.toHaveBeenCalled();
    },
  );

  it('always rate limits reset requests independently of account existence', async () => {
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
      rateLimit: { enabled: false },
    });
    for (let i = 0; i < 3; i++)
      expect(
        (
          await fixture.router.request(
            '/api/auth/request-password-reset',
            json({ email: `absent${i}@example.test` }),
          )
        ).status,
      ).toBe(200);
    expect(
      (
        await fixture.router.request(
          '/api/auth/request-password-reset',
          json({ email: 'alice@example.com' }),
        )
      ).status,
    ).toBe(429);
  });

  it('rejects a token when the user is disabled during asynchronous password hashing', async () => {
    const sender = vi.fn();
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
    });
    const { response } = await fixture.signUp();
    const user = (await response.json()).user as { id: string };
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
    const context = await fixture.auth.administrationContext();
    const originalHash = context.password.hash;
    context.password.hash = async (password) => {
      const hash = await originalHash(password);
      await fixture.connection.query
        .updateTable('user')
        .set({ disabledAt: new Date() })
        .where('id', '=', user.id)
        .execute();
      return hash;
    };
    const reset = await fixture.router.request(
      '/api/auth/reset-password',
      json({
        token: sender.mock.calls[0]![0].token,
        newPassword: 'replacement-password',
      }),
    );
    expect(reset.status).toBe(400);
    expect(await reset.json()).toMatchObject({ code: 'INVALID_TOKEN' });
  });

  it('preserves a custom sender without opt-in and consumes a token only once', async () => {
    const sender = vi.fn();
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
    });
    const { response, cookie } = await fixture.signUp();
    expect(response.status).toBe(200);
    expect(fixture.auth.passwordResetAvailable()).toBe(true);
    const request = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    expect(request.status).toBe(200);
    await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
    const token = sender.mock.calls[0]![0].token as string;
    const reset = await fixture.router.request(
      '/api/auth/reset-password',
      json({ token, newPassword: 'replacement-password' }),
    );
    expect(await reset.json()).toEqual({ status: true });
    expect(reset.status).toBe(200);
    const duplicate = await fixture.router.request(
      '/api/auth/reset-password',
      json({ token, newPassword: 'another-password' }),
    );
    expect(duplicate.status).toBe(400);
    expect(
      await fixture.auth.getSession(new Headers({ cookie })),
    ).not.toBeNull();
  });

  it.each([
    { passwordReset: { enabled: false } },
    { emailAndPassword: { enabled: false } },
  ])(
    'enforces disablement in HTTP and server API calls: %j',
    async (config) => {
      const sender = vi.fn();
      const fixture = await setup({
        emailAndPassword: {
          enabled: true,
          sendResetPassword: sender,
          ...config.emailAndPassword,
        },
        passwordReset: config.passwordReset,
      });
      expect(fixture.auth.passwordResetAvailable()).toBe(false);
      const response = await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'alice@example.com' }),
      );
      expect(response.status).toBe(400);
      expect(sender).not.toHaveBeenCalled();
      const direct = Reflect.get(fixture.auth, 'auth') as ReturnType<
        typeof betterAuth
      >;
      await expect(
        direct.api.requestPasswordReset({
          body: { email: 'alice@example.com' },
        }),
      ).rejects.toMatchObject({ body: { code: 'RESET_PASSWORD_DISABLED' } });
      await expect(
        direct.api.resetPassword({
          body: { token: 'synthetic', newPassword: 'replacement-password' },
        }),
      ).rejects.toMatchObject({ body: { code: 'RESET_PASSWORD_DISABLED' } });
    },
  );

  it('rechecks account status after sending and accepts query tokens safely', async () => {
    const sender = vi.fn();
    const fixture = await setup({
      emailAndPassword: { enabled: true, sendResetPassword: sender },
    });
    const { response } = await fixture.signUp();
    const user = (await response.json()).user as { id: string };
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(sender).toHaveBeenCalledOnce());
    const token = sender.mock.calls[0]![0].token as string;
    await fixture.connection.query
      .updateTable('user')
      .set({ disabledAt: new Date() })
      .where('id', '=', user.id)
      .execute();
    const link = await fixture.router.request(
      `/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent('http://localhost/reset-password')}`,
    );
    expect(link.status).toBe(302);
    expect(link.headers.get('location')).toBe(
      'http://localhost/reset-password?error=INVALID_TOKEN',
    );
    const reset = await fixture.router.request(
      `/api/auth/reset-password?token=${token}`,
      json({ newPassword: 'replacement-password' }),
    );
    expect(reset.status).toBe(400);
    expect(await reset.json()).toMatchObject({ code: 'INVALID_TOKEN' });
    const empty = await fixture.router.request(
      `/api/auth/reset-password?token=${token}`,
      json({}),
    );
    expect(empty.status).toBe(400);
  });
});
