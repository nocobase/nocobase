import { beforeEach, expect, it, vi } from 'vitest';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  createMailer,
  mailerToken,
  legacyMailerName,
} from '@nocobase/app-server/mailer';
import {
  EmailChannel,
  SmtpChannel,
  ResendChannel,
} from '../server/email/index.js';

const transports = vi.hoisted(
  () =>
    [] as { send: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }[],
);
vi.mock('@nocobase/mailer', async (original) => ({
  ...(await original<typeof import('@nocobase/mailer')>()),
  createMailTransport: () => {
    const transport = {
      send: vi.fn(async () => ({ status: 'accepted' })),
      close: vi.fn(async () => {}),
    };
    transports.push(transport);
    return transport;
  },
}));
beforeEach(() => {
  transports.length = 0;
});

it('shares a default sender across direct auth mail and concurrent notification channels, closing only at host shutdown', async () => {
  const mailer = createMailer(
    { channels: {} },
    { default: { provider: 'smtp', host: 'localhost', port: 2525 } },
  );
  const container = new ServiceContainer();
  container.instance(mailerToken, mailer);
  const email = new EmailChannel(
    { channelName: 'email', container },
    { type: 'email' },
  );
  const other = new EmailChannel(
    { channelName: 'other', container },
    { type: 'email', mailer: 'default' },
  );
  expect(transports).toHaveLength(0);
  expect(email.capabilities).toBeUndefined();
  const identity = {
    notificationId: 'notification',
    deliveryId: 'delivery',
    attemptId: 'attempt',
    signal: new AbortController().signal,
    deadline: new Date().toISOString(),
  };
  const validated = email.validateMessage({
    to: 'synthetic@example.test',
    subject: 'Test',
    text: 'Synthetic',
  });
  const prepared = await email.prepare({
    ...identity,
    message: validated.message,
    recipient: validated.recipients[0]!,
  });
  const outcomes = await Promise.all([
    mailer.send('default', {
      to: 'synthetic@example.test',
      subject: 'Reset',
      text: 'Synthetic',
    }),
    email.send({ ...identity, message: prepared }),
    other.send({ ...identity, message: prepared }),
  ]);
  expect(outcomes).toEqual(
    Array.from({ length: 3 }, () => ({ status: 'accepted' })),
  );
  expect(transports).toHaveLength(1);
  expect(transports[0]!.send).toHaveBeenCalledWith(prepared.content, {
    idempotencyKey: 'delivery',
    signal: identity.signal,
  });
  expect(transports[0]!.close).not.toHaveBeenCalled();
  await mailer.close();
  await mailer.close();
  expect(transports[0]!.close).toHaveBeenCalledOnce();
});

it('preserves Resend idempotency for named mailers and rejects missing or disabled targets', () => {
  const container = new ServiceContainer();
  container.instance(
    mailerToken,
    createMailer(
      { channels: {} },
      {
        marketing: {
          provider: 'resend',
          apiKey: 'synthetic-key',
          from: 'sender@example.test',
        },
        disabled: {
          provider: 'smtp',
          host: 'localhost',
          port: 2525,
          enabled: false,
        },
      },
    ),
  );
  const channel = new EmailChannel(
    { channelName: 'newsletter', container },
    { type: 'email', mailer: 'marketing' },
  );
  expect(channel.capabilities).toMatchObject({
    idempotency: { supported: true, retentionMs: 86400000 },
  });
  for (const mailer of [undefined, 'missing', 'disabled'])
    expect(
      () =>
        new EmailChannel(
          { channelName: 'email', container },
          { type: 'email', mailer },
        ),
    ).toThrow('Configure mail.<name>');
});

it.each(['smtp', 'resend'] as const)(
  'legacy %s channels share the exact host identity with old password recovery',
  async (provider) => {
    const config =
      provider === 'smtp'
        ? { provider, host: 'localhost', port: 2525 }
        : { provider, apiKey: 'synthetic-key', from: 'sender@example.test' };
    const mailer = createMailer({ channels: { 'system-email': config } }, {});
    const container = new ServiceContainer();
    container.instance(mailerToken, mailer);
    const context = { channelName: 'system-email', container };
    const channel =
      provider === 'smtp'
        ? new SmtpChannel(context, {
            type: 'smtp',
            host: 'localhost',
            port: 2525,
          })
        : new ResendChannel(context, {
            type: 'resend',
            apiKey: 'synthetic-key',
            from: 'sender@example.test',
          });
    const message = {
      to: 'synthetic@example.test',
      subject: 'Test',
      text: 'Synthetic',
    };
    const identity = {
      notificationId: 'notification',
      deliveryId: 'delivery',
      attemptId: 'attempt',
      signal: new AbortController().signal,
      deadline: new Date().toISOString(),
    };
    await Promise.all([
      mailer.send(legacyMailerName('system-email'), message),
      channel.send({
        ...identity,
        message: { to: message.to, content: message },
      }),
    ]);
    expect(transports).toHaveLength(1);
    await channel.close();
    expect(transports[0]!.close).not.toHaveBeenCalled();
    await mailer.close();
    expect(transports[0]!.close).toHaveBeenCalledOnce();
  },
);
