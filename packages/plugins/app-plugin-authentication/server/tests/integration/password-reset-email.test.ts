// @vitest-environment node

import { afterEach, expect, it, vi } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { MailExecutions } from '@nocobase/mailer';
import * as mailer from '@nocobase/mailer';
import { Auth } from '../../auth.js';
import { createStandaloneServer } from '../fixtures/reset-app/server/standalone.js';
import { createAuthFixture } from './support.js';
import { mailerToken } from '@nocobase/app-server/mailer';

const email = {
  provider: 'resend',
  apiKey: 'synthetic-key',
  from: 'sender@example.test',
} as const;
const fixtures: Awaited<ReturnType<typeof createAuthFixture>>[] = [];
afterEach(async () => {
  for (const fixture of fixtures.splice(0)) {
    await fixture.auth.close();
    await fixture.dispose();
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(body),
});
const setup = async (options: Parameters<typeof createAuthFixture>[0]) => {
  const fixture = await createAuthFixture(options);
  fixtures.push(fixture);
  return fixture;
};

it.each([undefined, false, true])(
  'custom callback wins over both mail configurations (enabled %s)',
  async (enabled) => {
    const custom = vi.fn();
    const warning = vi.fn();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const fixture = await setup({
      email,
      passwordReset: { enabled, emailChannel: 'legacy' },
      emailAndPassword: { enabled: true, sendResetPassword: custom },
      passwordResetServices: {
        warning,
        legacyChannels: { legacy: { ...email, apiKey: 'legacy-key' } },
      },
    });
    await fixture.signUp();
    const response = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    expect(response.status).toBe(enabled === false ? 400 : 200);
    if (enabled !== false) {
      await vi.waitFor(() => expect(custom).toHaveBeenCalledOnce());
      expect(warning).toHaveBeenCalledTimes(2);
    } else expect(custom).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(warning.mock.calls)).not.toContain('synthetic-key');
  },
);

it.each([undefined, false])(
  'email alone does not enable recovery (enabled %s)',
  async (enabled) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const fixture = await setup({
      email,
      emailAndPassword: { enabled: true },
      passwordReset: { enabled },
    });
    expect(fixture.auth.passwordResetAvailable()).toBe(false);
    expect(
      (
        await fixture.router.request(
          '/api/auth/request-password-reset',
          json({ email: 'absent@example.test' }),
        )
      ).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  },
);

it.each(
  [false, true].flatMap((legacy) =>
    (['accepted', 'failed', 'submission_unknown'] as const).map((result) => ({
      legacy,
      result,
    })),
  ),
)(
  'submits once through the selected Resend configuration: $result (legacy $legacy)',
  async ({ legacy, result }) => {
    const fetch = vi.fn().mockImplementation(async () => {
      if (result === 'submission_unknown')
        throw new Error('synthetic-private-provider-body');
      return new Response(
        JSON.stringify(
          result === 'accepted'
            ? { id: 'synthetic-id' }
            : {
                name: 'internal_server_error',
                message: 'synthetic-private-provider-body',
              },
        ),
        { status: result === 'accepted' ? 200 : 500 },
      );
    });
    vi.stubGlobal('fetch', fetch);
    const report = vi.fn();
    const warning = vi.fn();
    const executions = new MailExecutions();
    const fixture = await setup({
      ...(legacy ? {} : { email }),
      passwordReset: {
        enabled: true,
        emailChannel: 'legacy',
        template: (data) => ({
          to: data.user.email,
          subject: 'Application template',
          text: data.url,
        }),
      },
      emailAndPassword: { enabled: true },
      passwordResetServices: {
        executions,
        report,
        warning,
        legacyChannels: { legacy: { ...email, apiKey: 'legacy-key' } },
      },
    });
    await fixture.signUp();
    const response = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    const missing = await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'absent@example.test' }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(await missing.json());
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(executions.inFlight).toBe(0));
    expect(warning).toHaveBeenCalledWith(
      legacy
        ? expect.stringContaining('deprecated. Migrate to auth.email')
        : 'auth.passwordReset.emailChannel is unused; auth.email takes precedence.',
    );
    expect(
      new Headers(fetch.mock.calls[0]![1].headers as HeadersInit).get(
        'authorization',
      ),
    ).toBe(`Bearer ${legacy ? 'legacy-key' : 'synthetic-key'}`);
    expect(JSON.stringify(report.mock.calls)).not.toMatch(
      /synthetic-key|synthetic-private-provider-body/u,
    );
    const payload = JSON.parse(fetch.mock.calls[0]![1].body as string) as {
      subject: string;
    };
    expect(payload.subject).toBe('Application template');
    expect(report.mock.calls.map((call) => call[0]).sort()).toEqual(
      result === 'accepted'
        ? ['request']
        : result === 'failed'
          ? ['provider', 'request']
          : ['network', 'request'],
    );
  },
);

it.each([false, true])(
  'cancels in-flight Resend on shutdown without a second submission (legacy %s)',
  async (legacy) => {
    let signal: AbortSignal | undefined;
    const fetch = vi.fn().mockImplementation(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = options.signal!;
          signal.addEventListener(
            'abort',
            () => reject(new Error('synthetic cancelled')),
            { once: true },
          );
        }),
    );
    vi.stubGlobal('fetch', fetch);
    const fixture = await setup({
      ...(legacy
        ? {
            passwordResetServices: {
              legacyChannels: { 'system-email': email },
            },
          }
        : { email }),
      passwordReset: { enabled: true },
      emailAndPassword: { enabled: true },
    });
    await fixture.signUp();
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    await fixture.auth.close();
    expect(signal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledOnce();
  },
);

it('announces the legacy sender at startup without exposing channel names', async () => {
  const warning = vi.fn();
  const fixture = await setup({
    passwordReset: { enabled: true, emailChannel: 'synthetic-private-channel' },
    passwordResetServices: {
      warning,
      legacyChannels: { 'synthetic-private-channel': email },
    },
  });
  expect(fixture.auth.passwordResetAvailable()).toBe(true);
  expect(warning).toHaveBeenCalledWith(
    expect.stringContaining('deprecated. Migrate to auth.email'),
  );
  expect(JSON.stringify(warning.mock.calls)).not.toContain(
    'synthetic-private-channel',
  );
});

it.each([false, true])(
  'completes reset and new-password login using Resend without a host mailer or notification/mail plugins (legacy %s)',
  async (legacy) => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 'synthetic-id' })));
    vi.stubGlobal('fetch', fetch);
    const app = await createTestApp({
      createServer: createStandaloneServer,
      config: legacy
        ? {
            notification: {
              channels: { 'system-email': { ...email, type: 'resend' } },
            },
          }
        : { auth: { email } },
    });
    try {
      expect(app.application.container.has(mailerToken)).toBe(false);
      expect((await app.request('/authentication/capabilities')).status).toBe(
        200,
      );
      expect(
        (
          await app.request(
            '/auth/sign-up/email',
            json({
              email: 'synthetic@example.test',
              username: 'synthetic',
              name: 'Synthetic',
              password: 'original-password',
            }),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await app.request(
            '/auth/request-password-reset',
            json({
              email: 'synthetic@example.test',
              redirectTo: 'http://localhost/main/reset-password',
            }),
          )
        ).status,
      ).toBe(200);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
      const payload = JSON.parse(fetch.mock.calls[0]![1].body as string) as {
        text: string;
      };
      const token = payload.text.match(
        /reset-password\/([A-Za-z0-9_-]+)/u,
      )?.[1];
      expect(token).toBeTruthy();
      expect(
        (
          await app.request(
            '/auth/reset-password',
            json({ token, newPassword: 'replacement-password' }),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await app.request(
            '/auth/sign-in/email',
            json({
              email: 'synthetic@example.test',
              password: 'replacement-password',
            }),
          )
        ).status,
      ).toBe(200);
      expect(
        await app.connection.collections.get('notifications'),
      ).toBeUndefined();
    } finally {
      await app.close();
    }
  },
);

it.each([false, true])(
  'reuses one owned transport, strips email from Better Auth, and closes it (legacy %s)',
  async (legacy) => {
    const fetch = vi
      .fn()
      .mockImplementation(
        async () => new Response(JSON.stringify({ id: 'synthetic-id' })),
      );
    vi.stubGlobal('fetch', fetch);
    const create = vi.spyOn(mailer, 'createMailTransport');
    const fixture = await setup({
      ...(legacy
        ? {
            passwordResetServices: {
              legacyChannels: { 'system-email': email },
            },
          }
        : { email }),
      passwordReset: { enabled: true },
      emailAndPassword: { enabled: true },
    });
    expect(create).not.toHaveBeenCalled();
    expect(
      Reflect.get(
        (await fixture.auth.administrationContext()).options,
        'email',
      ),
    ).toBeUndefined();
    await fixture.signUp();
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const close = vi.spyOn(create.mock.results[0]!.value, 'close');
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(create).toHaveBeenCalledOnce();
    await fixture.auth.close();
    expect(close).toHaveBeenCalledOnce();
    await fixture.router.request(
      '/api/auth/request-password-reset',
      json({ email: 'alice@example.com' }),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  },
);

it('rejects explicit invalid email even beside a custom callback or a usable legacy sender', async () => {
  const fixture = await setup({});
  expect(
    () =>
      new Auth({
        connection: fixture.connection,
        secret: 'synthetic-secret-at-least-32-characters',
        email: { provider: 'resend', from: 'sender@example.test' } as never,
        passwordReset: { enabled: true },
        emailAndPassword: { enabled: true, sendResetPassword: vi.fn() },
        passwordResetServices: {
          legacyChannels: { 'system-email': email },
        },
      }),
  ).toThrow('auth.email.apiKey');
});

it.each([false, undefined])(
  'keeps independent recovery closed without its existing prerequisites: %s',
  async (enabled) => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const fixture = await setup({
      email,
      passwordReset: { enabled: true },
      emailAndPassword: { enabled },
      ...(enabled === undefined ? { baseURL: undefined } : {}),
    });
    expect(fixture.auth.passwordResetAvailable()).toBe(false);
    expect(
      (
        await fixture.router.request(
          '/api/auth/request-password-reset',
          json({ email: 'absent@example.test' }),
        )
      ).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  },
);

// Legacy compatibility only: new applications configure auth.email.
it.each([
  { channel: { ...email }, available: true },
  { channel: { ...email, type: 'resend' }, available: true },
  {
    channel: { ...email, provider: undefined, type: 'resend' },
    available: true,
  },
  {
    channel: { provider: 'smtp', host: 'localhost', port: 25 },
    available: true,
  },
  {
    channel: { provider: undefined, type: 'smtp', host: 'localhost', port: 25 },
    available: true,
  },
  { channel: { ...email, enabled: false }, available: false },
  { channel: { ...email, enabled: 'true' }, available: false },
  { channel: { ...email, type: 'smtp' }, available: false },
  { channel: { ...email, apiKey: '' }, available: false },
  {
    channel: { provider: 'smtp', host: 'localhost', port: '25' },
    available: false,
  },
  { channel: { provider: 'custom' }, available: false },
  { channel: undefined, available: false },
  { channel: null, available: false },
])(
  'preserves legacy alias, validation and enablement rules: $channel',
  async ({ channel, available }) => {
    const create = vi.spyOn(mailer, 'createMailTransport');
    const fixture = await setup({
      passwordReset: { enabled: true, emailChannel: 'selected' },
      passwordResetServices: {
        legacyChannels: { selected: channel, 'system-email': email },
      },
    });
    expect(fixture.auth.passwordResetAvailable()).toBe(available);
    expect(create).not.toHaveBeenCalled();
  },
);

it.each([undefined, false])(
  'requires explicit legacy opt-in even with a valid channel: %s',
  async (enabled) => {
    const fixture = await setup({
      passwordReset: { enabled },
      passwordResetServices: { legacyChannels: { 'system-email': email } },
    });
    expect(fixture.auth.passwordResetAvailable()).toBe(false);
  },
);

it.each([false, true])(
  'retains capacity until an owned send actually ends and closes after cancellation (legacy %s)',
  async (legacy) => {
    const executions = new MailExecutions(1);
    const completion = Promise.withResolvers<mailer.MailResult>();
    const send = vi.fn(
      (_message: mailer.EmailMessage, _options?: mailer.MailSendOptions) =>
        completion.promise,
    );
    const close = vi.fn(async () => undefined);
    vi.spyOn(mailer, 'createMailTransport').mockReturnValue({ send, close });
    const report = vi.fn();
    const fixture = await setup({
      ...(legacy ? {} : { email }),
      passwordReset: { enabled: true },
      passwordResetServices: {
        executions,
        report,
        increment: async () => 1,
        legacyChannels: { 'system-email': email },
      },
    });
    await fixture.signUp();
    vi.useFakeTimers();
    try {
      await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'alice@example.com' }),
      );
      await vi.waitFor(() => expect(send).toHaveBeenCalledOnce());
      await vi.advanceTimersByTimeAsync(20_001);
      expect(send.mock.calls[0]![1]?.signal?.aborted).toBe(true);
      expect(executions.inFlight).toBe(1);
      await fixture.router.request(
        '/api/auth/request-password-reset',
        json({ email: 'alice@example.com' }),
      );
      expect(send).toHaveBeenCalledOnce();
      expect(report).toHaveBeenCalledWith('capacity');
      const shutdown = fixture.auth.close();
      expect(close).not.toHaveBeenCalled();
      expect(executions.inFlight).toBe(1);
      completion.resolve({ status: 'accepted' });
      await shutdown;
      expect(executions.inFlight).toBe(0);
      expect(close).toHaveBeenCalledOnce();
    } finally {
      completion.resolve({ status: 'accepted' });
      vi.useRealTimers();
    }
  },
);
