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

it('registers administrator text as keys that exist in the client locales', async () => {
  const { default: enUS } = await import('../client/locales/en-US.js');
  const registry = new NotificationTemplateRegistry();
  const container = new ServiceContainer();
  container.instance(notificationTemplateRegistryToken, registry);
  await registerInvitationTemplate({
    container,
    config: { get: () => undefined },
  } as never);
  const view = registry.get('users.invitation')!;
  const texts = [
    view.contributorLabel,
    view.category,
    view.name,
    view.trigger,
    view.recipients,
    view.businessRule,
    view.languagePolicy,
    view.channels[0]?.label,
    ...view.variables.map((variable) => variable.description),
  ];
  for (const text of texts) {
    if (typeof text !== 'object' || text.ns !== '@nocobase/app-plugin-users')
      throw new Error('Expected a Users translation key.');
    const translated = text.key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        enUS,
      );
    expect(translated).toBe(text.defaultValue);
  }
});

it('previews the real invitation builder in the selected language without selecting a recipient or sender', async () => {
  const container = new ServiceContainer();
  const registry = new NotificationTemplateRegistry();
  container.instance(notificationTemplateRegistryToken, registry);
  const release = await registerInvitationTemplate({
    container,
    config: { get: () => undefined },
  } as never);
  const titles = new Set<string>();
  for (const locale of registry.get('users.invitation')!.locales) {
    const expected = await buildInvitationEmail({
      to: 'unused@example.invalid',
      appTitle: 'Sample workspace',
      inviterName: 'Sample administrator',
      summary: ['Sample member role'],
      expiresAt: new Date('2030-01-02T12:00:00.000Z'),
      url: 'https://example.invalid/invitation/synthetic',
      locale,
    });
    const result = await registry.preview('users.invitation', locale);
    expect(result?.content).toEqual({
      title: expected.subject,
      body: expected.text,
      html: expected.html,
    });
    expect(result?.definition.body).toContain('{{date}}');
    expect(result?.content.html).not.toContain('<hr>');
    expect(JSON.stringify(result)).not.toContain('unused@example.invalid');
    titles.add(expected.subject);
  }
  // Switching the preview language changes the content.
  expect(titles.size).toBe(12);
  expect(registry.get('users.invitation')).toMatchObject({
    localeMode: 'separate',
    name: {
      ns: '@nocobase/app-plugin-users',
      key: 'notificationTemplates.invitation.name',
      defaultValue: 'User invitation',
    },
    channels: [
      {
        name: 'system-email',
        type: 'email',
        typeLabel: { key: 'templates.channelTypes.email' },
        configured: false,
        enabled: null,
      },
    ],
  });
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
    expect(channels).toMatchObject([
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
