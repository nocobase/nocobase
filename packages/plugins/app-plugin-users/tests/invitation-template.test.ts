import { ServiceContainer } from '@nocobase/service-provider';
import {
  NotificationTemplateRegistry,
  notificationTemplateRegistryToken,
} from '@nocobase/app-plugin-notification/server';
import { expect, it, vi } from 'vitest';
import {
  MailSenderFactory,
  mailSenderFactoryToken,
} from '@nocobase/app-server/mailers';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';
import { createNotificationMailer } from '../server/invitations/notification-mailer.js';
import { registerInvitationTemplate } from '../server/invitations/template.js';
import { buildInvitationEmail } from '../server/invitations/mail.js';

it('previews exactly the real invitation builder in all languages without selecting a recipient or sender', async () => {
  const container = new ServiceContainer();
  const registry = new NotificationTemplateRegistry();
  container.instance(notificationTemplateRegistryToken, registry);
  const release = await registerInvitationTemplate({
    container,
    config: { get: () => undefined },
  } as never);
  const expected = await buildInvitationEmail({
    to: 'unused@example.invalid',
    appTitle: 'Sample workspace',
    inviterName: 'Sample administrator',
    summary: ['Sample member role'],
    expiresAt: new Date('2030-01-02T12:00:00.000Z'),
    url: 'https://example.invalid/invitation/synthetic',
  });
  for (const locale of registry.get('users.invitation')!.locales) {
    const result = await registry.preview('users.invitation', locale);
    expect(result?.content).toEqual({
      title: expected.subject,
      body: expected.text,
      html: expected.html,
    });
    expect(result?.definition.body).toContain('{{date}}');
    expect(JSON.stringify(result)).not.toContain('unused@example.invalid');
  }
  expect(registry.get('users.invitation')?.channels).toEqual([
    { name: 'system-email', type: 'email', configured: false, enabled: null },
  ]);
  release?.();
  expect(registry.list()).toEqual([]);
});

it.each([
  {
    label: 'explicit mailer before both default and legacy',
    invitations: { mailer: 'other', emailChannel: 'legacy' },
    selected: 'other',
    enabled: true,
    direct: true,
    explicit: 'other',
  },
  {
    label: 'default mailer',
    invitations: {},
    selected: 'main',
    enabled: true,
    direct: true,
    explicit: undefined,
  },
  {
    label: 'explicit legacy before default mailer',
    invitations: { emailChannel: 'legacy' },
    selected: 'legacy',
    enabled: true,
    direct: false,
    explicit: undefined,
  },
  {
    label: 'disabled legacy before default mailer',
    invitations: { emailChannel: 'legacy' },
    selected: 'legacy',
    enabled: false,
    direct: false,
    explicit: undefined,
  },
])(
  'projects the same selection as sending: $label',
  async ({ invitations, selected, enabled, direct, explicit }) => {
    const container = new ServiceContainer();
    const registry = new NotificationTemplateRegistry();
    container.instance(notificationTemplateRegistryToken, registry);
    const mailers = {
      default: 'main',
      main: { provider: 'smtp' as const, host: 'localhost', port: 25 },
      other: { provider: 'smtp' as const, host: 'localhost', port: 26 },
    };
    const factory = new MailSenderFactory(mailers);
    const send = vi.fn(async () => ({ status: 'accepted' as const }));
    const create = vi
      .spyOn(factory, 'create')
      .mockImplementation(() => ({ send, close: async () => {} }) as never);
    const legacy = vi.fn(async () => [{ status: 'accepted' as const }]);
    container.instance(mailSenderFactoryToken, factory);
    container.instance(notificationServiceToken, {
      sendTransient: legacy,
    } as never);
    const config: Record<string, unknown> = {
      users: { invitations },
      mailers,
      notification: {
        channels: {
          legacy: { type: 'smtp', enabled, auth: { pass: 'synthetic-secret' } },
        },
      },
    };
    const app = {
      container,
      config: { get: (key: string) => config[key] },
    } as never;
    const release = await registerInvitationTemplate(app);
    const channels = registry.get('users.invitation')?.channels;
    expect(channels).toEqual([
      { name: selected, type: 'email', configured: true, enabled },
    ]);
    expect(JSON.stringify(registry.list())).not.toContain('synthetic-secret');
    expect(create).not.toHaveBeenCalled();
    const adapter = createNotificationMailer(app);
    try {
      const message = {
        to: 'synthetic@example.invalid',
        subject: 'Synthetic',
        text: 'Preview fixture',
        html: '<p>Preview fixture</p>',
      };
      if (!enabled) {
        await expect(adapter.send(message)).rejects.toThrow(/configured/u);
        expect(create).not.toHaveBeenCalled();
        expect(legacy).not.toHaveBeenCalled();
      } else {
        await adapter.send(message);
        if (direct) {
          expect(create).toHaveBeenCalledExactlyOnceWith(
            explicit,
            explicit ? 'users.invitations.mailer' : 'mailers.default',
          );
          expect(send).toHaveBeenCalledOnce();
          expect(legacy).not.toHaveBeenCalled();
        } else {
          expect(create).not.toHaveBeenCalled();
          expect(legacy).toHaveBeenCalledExactlyOnceWith({
            channel: selected,
            message,
          });
        }
      }
    } finally {
      await adapter.close();
      release?.();
      create.mockRestore();
    }
  },
);
