import { expect, it } from 'vitest';

import {
  buildInvitationEmail,
  formatInvitationDate,
  invitationEmailLocales,
} from '../server/invitations/mail.js';
import locales from '../server/locales/index.js';

const input = {
  to: 'invitee@example.com',
  appTitle: 'Example',
  inviterName: '<Inviter>',
  summary: ['Team', 'Docs'],
  url: 'https://example.com/invite?token=test&view=accept',
  expiresAt: new Date('2030-01-02T12:00:00Z'),
};

it('writes the subject, body and one button in the chosen language only', async () => {
  expect(Object.keys(locales)).toHaveLength(12);
  const email = await buildInvitationEmail({ ...input, locale: 'zh-TW' });
  expect(email.subject).toBe('<Inviter> 邀請您加入 Example');
  expect(email.html.match(/<a href=/gu)).toHaveLength(1);
  expect(email.html).not.toContain('<hr>');
  expect(email.text).toContain('Team、Docs');
  expect(email.text).not.toContain('Accept the invitation');
  expect(email.text).not.toContain('2030-01-02T12:00:00.000Z');
  expect(email.text).toContain(formatInvitationDate(input.expiresAt, 'zh-TW'));
  expect(email.html).toContain('&lt;Inviter&gt;');
  expect(email.html).toContain('token=test&amp;view=accept');
  expect(email.text).not.toContain('{{');
});

it('formats the expiry in the language and says it is UTC', () => {
  const date = new Date('2030-01-02T12:00:00Z');
  expect(formatInvitationDate(date, 'en-US')).toBe(
    'January 2, 2030 at 12:00 PM UTC',
  );
  expect(formatInvitationDate(date, 'ja-JP')).toContain('2030年1月2日');
  expect(formatInvitationDate(date, 'ja-JP')).toContain('UTC');
});

it('falls back to at most the default language and English for a language without email text', async () => {
  expect(invitationEmailLocales('it-IT', 'ja-JP')).toEqual(['ja-JP', 'en-US']);
  expect(invitationEmailLocales('it-IT', 'it-IT')).toEqual(['en-US']);
  expect(invitationEmailLocales(undefined, 'en-US')).toEqual(['en-US']);
  expect(invitationEmailLocales('de-DE', 'ja-JP')).toEqual(['de-DE']);
  const email = await buildInvitationEmail({
    ...input,
    locale: 'it-IT',
    defaultLocale: 'ja-JP',
  });
  // The subject follows the first block.
  expect(email.subject).toBe('<Inviter> が Example に招待しました');
  expect(email.html.match(/<a href=/gu)).toHaveLength(2);
  expect(email.html.match(/<hr>/gu)).toHaveLength(1);
  expect(email.text).toContain('<Inviter> invited you to Example.');
});

it('retains invitation capacity for original sends after cancellation and closes its own sender only after they end', async () => {
  const { MailSenderFactory, mailSenderFactoryToken } =
    await import('@nocobase/app-server/mailers');
  const { ServiceContainer } = await import('@nocobase/service-provider');
  const { createNotificationMailer } =
    await import('../server/invitations/notification-mailer.js');
  const { vi } = await import('vitest');
  const factory = new MailSenderFactory({
    default: 'main',
    main: { provider: 'smtp', host: 'localhost', port: 25 },
  });
  let complete!: () => void;
  const original = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const events: string[] = [];
  const send = vi.fn(async () => {
    await original;
    events.push('sent');
    return { status: 'accepted' as const };
  });
  const close = vi.fn(async () => {
    events.push('closed');
  });
  const create = vi
    .spyOn(factory, 'create')
    .mockReturnValue({ send, close } as never);
  const container = new ServiceContainer();
  container.instance(mailSenderFactoryToken, factory);
  const adapter = createNotificationMailer({
    container,
    config: { get: () => undefined },
  } as never);
  expect(create).toHaveBeenCalledOnce();
  const message = {
    to: 'synthetic@example.test',
    subject: 'Notice',
    text: 'Synthetic',
    html: '<p>Synthetic</p>',
  };
  vi.useFakeTimers();
  try {
    const sends = Array.from({ length: 5 }, () => adapter.send(message));
    await vi.advanceTimersByTimeAsync(30_001);
    expect(send).toHaveBeenCalledTimes(5);
    await expect(adapter.send(message)).rejects.toThrow(/capacity/u);
    expect(
      send.mock.calls.every(
        (call) =>
          (call as unknown[])[1] &&
          ((call as unknown[])[1] as { signal: AbortSignal }).signal.aborted,
      ),
    ).toBe(true);
    const shutdown = adapter.close();
    expect(adapter.close()).toBe(shutdown);
    let closed = false;
    const completed = shutdown.then(() => {
      closed = true;
    });
    await Promise.resolve();
    expect(close).toHaveBeenCalledOnce();
    expect(closed).toBe(false);
    complete();
    await Promise.all(sends);
    await completed;
    await shutdown;
    expect(events.indexOf('closed')).toBeLessThan(events.indexOf('sent'));
    expect(events.filter((event) => event === 'sent')).toHaveLength(5);
    expect(close).toHaveBeenCalledOnce();
  } finally {
    complete();
    vi.useRealTimers();
    vi.restoreAllMocks();
  }
});

it('preserves explicit invitation channel selection ahead of a new default and explicit mailers ahead of channels', async () => {
  const { vi } = await import('vitest');
  const { MailSenderFactory, mailSenderFactoryToken } =
    await import('@nocobase/app-server/mailers');
  const { ServiceContainer } = await import('@nocobase/service-provider');
  const { notificationServiceToken } =
    await import('@nocobase/app-plugin-notification/server');
  const { createNotificationMailer } =
    await import('../server/invitations/notification-mailer.js');
  const factory = new MailSenderFactory({
    default: 'main',
    main: { provider: 'smtp', host: 'localhost', port: 25 },
    other: { provider: 'smtp', host: 'localhost', port: 26 },
  });
  const send = vi.fn(async () => ({ status: 'accepted' as const }));
  const create = vi
    .spyOn(factory, 'create')
    .mockImplementation(() => ({ send, close: async () => {} }) as never);
  const legacy = vi.fn(async () => [{ status: 'accepted' as const }]);
  const container = new ServiceContainer();
  container.instance(mailSenderFactoryToken, factory);
  container.instance(notificationServiceToken, {
    sendTransient: legacy,
  } as never);
  const email = {
    to: 'synthetic@example.test',
    subject: 'Notice',
    text: 'Synthetic',
    html: '<p>Synthetic</p>',
  };
  const adapter = (invitations: object) =>
    createNotificationMailer({
      container,
      config: {
        get: (key: string) =>
          key === 'users'
            ? { invitations }
            : { channels: { legacy: { type: 'smtp' } } },
      },
    } as never);
  try {
    await adapter({ emailChannel: 'legacy' }).send(email);
    expect(legacy).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    await adapter({ mailer: 'other', emailChannel: 'legacy' }).send(email);
    expect(create).toHaveBeenCalledExactlyOnceWith(
      'other',
      'users.invitations.mailer',
    );
    expect(send).toHaveBeenCalledExactlyOnceWith(
      email,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(legacy).toHaveBeenCalledOnce();
    create.mockRestore();
    expect(() => adapter({ mailer: 'absent' })).toThrow(
      /users.invitations.mailer/u,
    );
    await expect(
      adapter({ emailChannel: 'missing' }).send(email),
    ).rejects.toThrow(/configured/u);
  } finally {
    vi.restoreAllMocks();
  }
});
