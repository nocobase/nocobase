import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { MailersConfig } from '@nocobase/app-server/mailers';
import type { UsersConfig } from '../tokens.js';
import locales from '../locales/index.js';
import { renderInvitationEmail } from './mail.js';
import { describeInvitationEmailChannel } from './channel.js';

/** Notification remains optional for standalone Users hosts. No sender is created for this directory. */
export async function registerInvitationTemplate(
  app: AppPluginApplication,
): Promise<(() => void) | undefined> {
  const notification =
    await import('@nocobase/app-plugin-notification/server').catch(
      (error: unknown) => {
        if (
          error instanceof Error &&
          'code' in error &&
          error.code === 'ERR_MODULE_NOT_FOUND'
        )
          return undefined;
        throw error;
      },
    );
  if (
    !notification ||
    !app.container.has(notification.notificationTemplateRegistryToken)
  )
    return undefined;
  return app.container
    .resolve(notification.notificationTemplateRegistryToken)
    .register({
      id: 'users.invitation',
      contributor: '@nocobase/app-plugin-users',
      category: 'Accounts',
      name: 'User invitation',
      trigger:
        'An authorized administrator creates or resends an invitation with email delivery selected.',
      recipients: 'The email address of the invited person.',
      businessRule:
        'Sent on invitation actions unless email delivery is explicitly omitted; there is no global notification switch.',
      locales: Object.keys(locales),
      languagePolicy:
        'Every supported language is included in the body, in registration order. The subject uses the first language (en-US). The preview language does not change the message.',
      variables: [
        { name: 'app', description: 'Application title' },
        { name: 'inviter', description: 'Inviter display name' },
        {
          name: 'items',
          description:
            'Granted roles or scope summary, joined using each language separator',
        },
        { name: 'date', description: 'Invitation expiry in ISO format' },
        {
          name: 'url',
          description:
            'One-time invitation link; preview uses example.invalid only',
        },
      ],
      channels: () => [
        describeInvitationEmailChannel({
          invitations: app.config.get<UsersConfig>('users')?.invitations,
          mailers: app.config.get<MailersConfig>('mailers'),
          channels: app.config.get<{
            channels?: Readonly<Record<string, { enabled?: boolean }>>;
          }>('notification')?.channels,
        }),
      ],
      render: async (_locale, example) => {
        const raw = example === 'definition';
        const mail = await renderInvitationEmail({
          to: 'sample@example.invalid',
          appTitle: raw ? '{{app}}' : 'Sample workspace',
          inviterName: raw ? '{{inviter}}' : 'Sample administrator',
          summary: [raw ? '{{items}}' : 'Sample member role'],
          expiresAt: raw ? '{{date}}' : '2030-01-02T12:00:00.000Z',
          url: raw ? '{{url}}' : 'https://example.invalid/invitation/synthetic',
        });
        return { title: mail.subject, body: mail.text, html: mail.html };
      },
    });
}
