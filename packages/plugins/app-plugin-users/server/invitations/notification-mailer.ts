/**
 * Invitation emails through the notification plugin, on the channel `users.invitations.emailChannel` names
 * (`system-email` by default). A missing or disabled channel, or a delivery the plugin reports as failed, is an error,
 * while domain-authorized inviters can still share the invitation link. New accounts require mailbox verification.
 */
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import type { UsersConfig } from '../tokens.js';
import { unconfiguredMailer, type InvitationMailer } from './mail.js';

const DEFAULT_CHANNEL = 'system-email';

export function createNotificationMailer(
  app: AppPluginApplication,
): InvitationMailer {
  const name =
    app.config.get<UsersConfig>('users')?.invitations?.emailChannel ??
    DEFAULT_CHANNEL;
  const channel =
    app.config.get<NotificationConfig>('notification')?.channels[name];
  if (
    !channel ||
    channel.enabled === false ||
    !app.container.has(notificationServiceToken)
  )
    return unconfiguredMailer;
  return {
    async send(email) {
      const results = await app.container
        .resolve(notificationServiceToken)
        .sendTransient({
          channel: name,
          message: {
            to: email.to,
            subject: email.subject,
            text: email.text,
            html: email.html,
          },
        })
        .catch(() => {
          throw new Error('The invitation email could not be submitted.');
        });
      if (results.some((result) => result.status !== 'accepted'))
        throw new Error(
          'The invitation email was not confirmed by the provider.',
        );
    },
  };
}
