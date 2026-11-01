import * as transports from '@nocobase/mailer';
import { createServer } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { createTestApp } from '@nocobase/app-testing/server';
import { applicationMailerToken } from '@nocobase/app-server/mailers';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { AuthenticationProvider } from '@nocobase/app-plugin-authentication/server';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { UsersProvider } from '../server/providers/users.js';
import { userManagementServiceToken } from '../server/tokens.js';
import { createNotificationServer } from './fixtures/mail-app/server/notification-standalone.js';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('drains real Auth, invitation bookkeeping and Notification Jobs before database and shared mailer shutdown', async () => {
  const events: string[] = [];
  const gates = {
    auth: Promise.withResolvers<void>(),
    users: Promise.withResolvers<void>(),
    notification: Promise.withResolvers<void>(),
  };
  const createTransport = transports.createMailTransport;
  vi.spyOn(transports, 'createMailTransport').mockImplementation((config) => {
    const transport = createTransport(config);
    return {
      async send(message, options) {
        const role =
          message.subject === 'Shutdown notification'
            ? 'notification'
            : message.subject.includes('Reset your password')
              ? 'auth'
              : 'users';
        const result = await transport.send(message, options);
        events.push(`submitted:${role}`);
        await gates[role].promise;
        events.push(`completed:${role}`);
        return result;
      },
      async close() {
        events.push('transport:close');
        await transport.close();
      },
    };
  });
  for (const [role, Provider] of [
    ['users', UsersProvider],
    ['auth', AuthenticationProvider],
    ['database', DatabaseProvider],
  ] as const) {
    const close = Provider.prototype.shutdown;
    vi.spyOn(Provider.prototype, 'shutdown').mockImplementation(
      async function () {
        events.push(`${role}:stopping`);
        await close.call(this);
        events.push(`${role}:stopped`);
      },
    );
  }
  const receiver = createServer(async (request, response) => {
    for await (const _chunk of request) {
      /* consume the real submission */
    }
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ id: 'synthetic-id' }));
  });
  await new Promise<void>((resolve) =>
    receiver.listen(0, '127.0.0.1', resolve),
  );
  const address = receiver.address();
  if (!address || typeof address === 'string')
    throw new Error('No fixture port.');
  const nativeFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (url: string, options: RequestInit) => {
    expect(url).toBe('https://api.resend.com/emails');
    return nativeFetch(`http://127.0.0.1:${address.port}/emails`, options);
  });
  const app = await createTestApp({
    createServer: createNotificationServer,
    config: {
      mailers: {
        default: 'main',
        main: {
          provider: 'resend',
          apiKey: 'synthetic-key',
          from: 'sender@example.test',
        },
      },
      notification: { channels: { 'system-email': { type: 'email' } } },
      logging: {
        level: 'silent',
        file: { enabled: false },
        console: { enabled: false },
      },
      jobs: { default: 'memory', memory: { adapter: 'memory' } },
    },
  });
  const json = (body: object) => ({
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify(body),
  });
  let shutdown: Promise<void> | undefined;
  try {
    const signedUp = await app.request(
      '/auth/sign-up/email',
      json({
        name: 'Inviter',
        email: 'inviter@example.test',
        password: 'synthetic-password',
      }),
    );
    expect(signedUp.status).toBe(200);
    const { user } = (await signedUp.json()) as { user: { id: string } };
    const users = app.application.container.resolve(userManagementServiceToken);
    const invite = users
      .invite({ emails: ['invitee@example.test'], invitedBy: user.id })
      .then((result) => {
        events.push('invitation:recorded');
        return result;
      });
    expect(
      (
        await app.request(
          '/auth/request-password-reset',
          json({
            email: 'inviter@example.test',
            redirectTo: 'http://localhost/main/reset-password',
          }),
        )
      ).status,
    ).toBe(200);
    const notifications = app.application.container.resolve(
      notificationServiceToken,
    );
    await notifications.send({
      idempotencyKey: 'shutdown',
      messages: {
        'system-email': {
          to: 'recipient@example.test',
          subject: 'Shutdown notification',
          text: 'Synthetic',
        },
      },
    });
    await vi.waitFor(() =>
      expect(
        events.filter((event) => event.startsWith('submitted:')),
      ).toHaveLength(3),
    );
    const mailer = app.application.container.resolve(applicationMailerToken);
    const close = mailer.close.bind(mailer);
    const sharedClose = vi.spyOn(mailer, 'close').mockImplementation(() => {
      events.push('shared:close');
      return close();
    });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    shutdown = app.application.shutdown();
    gates.notification.resolve();
    await vi.waitFor(() => expect(events).toContain('users:stopping'));
    expect(
      (await notifications.getByIdempotencyKey('shutdown'))?.summary.accepted,
    ).toBe(1);
    await vi.advanceTimersByTimeAsync(5001);
    expect(events).not.toContain('users:stopped');
    expect(events).not.toContain('database:stopping');
    expect(sharedClose).not.toHaveBeenCalled();
    await expect(
      users.invite({ emails: ['late@example.test'], invitedBy: user.id }),
    ).rejects.toThrow(/stopping/u);
    gates.users.resolve();
    const [invitation] = await invite;
    expect(invitation.emailSent).toBe(true);
    await vi.waitFor(() => expect(events).toContain('auth:stopping'));
    await vi.advanceTimersByTimeAsync(5001);
    expect(events).not.toContain('auth:stopped');
    expect(sharedClose).not.toHaveBeenCalled();
    gates.auth.resolve();
    await shutdown;
    expect(events.indexOf('invitation:recorded')).toBeLessThan(
      events.indexOf('database:stopping'),
    );
    expect(events.indexOf('completed:auth')).toBeLessThan(
      events.indexOf('database:stopping'),
    );
    expect(events.indexOf('completed:notification')).toBeLessThan(
      events.indexOf('database:stopping'),
    );
    expect(events.indexOf('database:stopped')).toBeLessThan(
      events.indexOf('shared:close'),
    );
    expect(sharedClose).toHaveBeenCalledOnce();
    expect(
      await mailer.send({
        to: 'late@example.test',
        subject: 'Late',
        text: 'Synthetic',
      }),
    ).toMatchObject({ status: 'failed' });
  } finally {
    for (const gate of Object.values(gates)) gate.resolve();
    vi.useRealTimers();
    await shutdown;
    await app.close();
    receiver.closeAllConnections();
    await new Promise<void>((resolve) => receiver.close(() => resolve()));
  }
});
