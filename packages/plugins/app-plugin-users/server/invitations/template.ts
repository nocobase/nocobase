import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { MailersConfig } from '@nocobase/app-server/mailers';
import type { UsersConfig } from '../tokens.js';
import locales from '../locales/index.js';
import { formatInvitationDate, renderInvitationEmail } from './mail.js';
import { describeInvitationEmailChannel } from './channel.js';

/** Administrator-facing text, translated in the browser from this plugin's client locales. */
function text(
  key: string,
  defaultValue: string,
): { ns: string; key: string; defaultValue: string } {
  return {
    ns: '@nocobase/app-plugin-users',
    key: `notificationTemplates.invitation.${key}`,
    defaultValue,
  };
}

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
      contributorLabel: text('contributor', 'Users'),
      category: text('category', 'Accounts'),
      name: text('name', 'User invitation'),
      trigger: text(
        'trigger',
        'An administrator invites someone, or resends an invitation, with email selected.',
      ),
      recipients: text(
        'recipients',
        'The person being invited, at the email address entered for them.',
      ),
      businessRule: text(
        'businessRule',
        'Sent every time an invitation is created or resent with email selected. There is no separate switch to turn it off.',
      ),
      locales: Object.keys(locales),
      languagePolicy: text(
        'languagePolicy',
        "Written in one language, chosen when inviting: the inviter's interface language unless another is picked. Resending keeps it. If that language has no email text, the email shows the application's default language and English.",
      ),
      variables: [
        { name: 'app', description: text('variables.app', 'Application name') },
        {
          name: 'inviter',
          description: text(
            'variables.inviter',
            'Name of the person who sent the invitation',
          ),
        },
        {
          name: 'items',
          description: text(
            'variables.items',
            'Roles or access the invitation grants',
          ),
        },
        {
          name: 'date',
          description: text(
            'variables.date',
            "When the invitation expires, in the email's language and in UTC",
          ),
        },
        {
          name: 'url',
          description: text(
            'variables.url',
            'Link for accepting the invitation; the preview uses a fake link',
          ),
        },
      ],
      channels: () => [
        {
          ...describeInvitationEmailChannel({
            invitations: app.config.get<UsersConfig>('users')?.invitations,
            mailers: app.config.get<MailersConfig>('mailers'),
            channels: app.config.get<{
              channels?: Readonly<Record<string, { enabled?: boolean }>>;
            }>('notification')?.channels,
          }),
          label: text('channel', 'Invitation email sender'),
          typeLabel: {
            ns: '@nocobase/app-plugin-notification',
            key: 'templates.channelTypes.email',
            defaultValue: 'Email',
          },
        },
      ],
      render: async (locale, example) => {
        const raw = example === 'definition';
        const mail = await renderInvitationEmail({
          to: 'sample@example.invalid',
          appTitle: raw ? '{{app}}' : 'Sample workspace',
          inviterName: raw ? '{{inviter}}' : 'Sample administrator',
          summary: [raw ? '{{items}}' : 'Sample member role'],
          expiresAt: raw
            ? () => '{{date}}'
            : (language) =>
                formatInvitationDate(
                  new Date('2030-01-02T12:00:00.000Z'),
                  language,
                ),
          url: raw ? '{{url}}' : 'https://example.invalid/invitation/synthetic',
          locale,
        });
        return { title: mail.subject, body: mail.text, html: mail.html };
      },
    });
}
