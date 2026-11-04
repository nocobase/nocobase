import { ServiceContainer } from '@nocobase/service-provider';
import {
  NotificationTemplateRegistry,
  notificationTemplateRegistryToken,
} from '@nocobase/app-plugin-notification/server';
import { expect, it } from 'vitest';
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
