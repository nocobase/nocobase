import { expect, it } from 'vitest';

import { buildInvitationEmail } from '../server/invitations/mail.js';
import locales from '../server/locales/index.js';

it('includes every server language for an invitee without a saved language', async () => {
  const email = await buildInvitationEmail({
    to: 'invitee@example.com',
    appTitle: 'Example',
    inviterName: '<Inviter>',
    summary: ['Team'],
    url: 'https://example.com/invite?token=test&view=accept',
    expiresAt: new Date('2030-01-01T00:00:00Z'),
  });
  expect(Object.keys(locales)).toHaveLength(10);
  for (const load of Object.values(locales)) {
    const { default: resource } = (await load()) as {
      default: { invitationEmail: { action: string } };
    };
    expect(email.html).toContain(
      resource.invitationEmail.action.replaceAll("'", '&#39;'),
    );
  }
  expect(email.html).toContain('&lt;Inviter&gt;');
  expect(email.html).toContain('token=test&amp;view=accept');
  expect(email.text).not.toContain('{{');
});

it('retains invitation capacity for original sends after cancellation and leaves shared shutdown to the application', async () => {
  const { ApplicationMailer, applicationMailerToken } =
    await import('@nocobase/app-server/mailers');
  const { ServiceContainer } = await import('@nocobase/service-provider');
  const { createNotificationMailer } =
    await import('../server/invitations/notification-mailer.js');
  const { vi } = await import('vitest');
  const service = new ApplicationMailer({
    default: 'main',
    main: { provider: 'smtp', host: 'localhost', port: 25 },
  });
  let complete!: () => void;
  const original = new Promise<void>((resolve) => {
    complete = resolve;
  });
  const send = vi.spyOn(service, 'send').mockImplementation(async () => {
    await original;
    return { status: 'accepted' };
  });
  const close = vi.spyOn(service, 'close');
  const container = new ServiceContainer();
  container.instance(applicationMailerToken, service);
  const adapter = createNotificationMailer({
    container,
    config: { get: () => undefined },
  } as never);
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
    expect(send.mock.calls.every((call) => call[1]?.signal?.aborted)).toBe(
      true,
    );
    const shutdown = adapter.close();
    complete();
    await Promise.all(sends);
    await shutdown;
    expect(close).not.toHaveBeenCalled();
  } finally {
    complete();
    vi.useRealTimers();
    vi.restoreAllMocks();
    await service.close();
  }
});

it('preserves explicit invitation channel selection ahead of a new default and explicit mailers ahead of channels', async () => {
  const { vi } = await import('vitest');
  const { ApplicationMailer, applicationMailerToken } =
    await import('@nocobase/app-server/mailers');
  const { ServiceContainer } = await import('@nocobase/service-provider');
  const { notificationServiceToken } =
    await import('@nocobase/app-plugin-notification/server');
  const { createNotificationMailer } =
    await import('../server/invitations/notification-mailer.js');
  const service = new ApplicationMailer({
    default: 'main',
    main: { provider: 'smtp', host: 'localhost', port: 25 },
    other: { provider: 'smtp', host: 'localhost', port: 26 },
  });
  const send = vi
    .spyOn(service, 'send')
    .mockResolvedValue({ status: 'accepted' });
  const legacy = vi.fn(async () => [{ status: 'accepted' as const }]);
  const container = new ServiceContainer();
  container.instance(applicationMailerToken, service);
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
    expect(send).not.toHaveBeenCalled();
    await adapter({ mailer: 'other', emailChannel: 'legacy' }).send(email);
    expect(send).toHaveBeenCalledExactlyOnceWith(
      email,
      expect.objectContaining({ mailer: 'other' }),
    );
    expect(legacy).toHaveBeenCalledOnce();
    expect(() => adapter({ mailer: 'absent' })).toThrow(
      /users.invitations.mailer/u,
    );
    await expect(
      adapter({ emailChannel: 'missing' }).send(email),
    ).rejects.toThrow(/configured/u);
  } finally {
    vi.restoreAllMocks();
    await service.close();
  }
});
