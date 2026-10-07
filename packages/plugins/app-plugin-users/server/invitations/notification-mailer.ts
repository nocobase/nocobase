/**
 * Invitation emails through the notification plugin, on the channel `users.invitations.emailChannel` names
 * (`system-email` by default). A missing or disabled channel, or a delivery the plugin reports as failed, is an error,
 * so the inviter gets the link to forward instead.
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
      const result = await app.container
        .resolve(notificationServiceToken)
        .send({
          idempotencyKey: email.idempotencyKey,
          source: { type: 'user-invitation' },
          messages: {
            [name]: {
              to: email.to,
              subject: email.subject,
              text: email.text,
              html: email.html,
            },
          },
        });
      const failed = result.deliveries.find(
        (delivery) => delivery.status === 'failed',
      );
      if (failed)
        throw new Error(
          failed.error?.message ?? 'The email was not delivered.',
        );
    },
  };
}
