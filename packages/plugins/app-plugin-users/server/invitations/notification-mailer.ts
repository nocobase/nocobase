/** Compatibility name for the invitation mailer, now independent of notification. */
import { sendingServiceToken } from '@nocobase/app-server/sending';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import type { UsersConfig } from '../tokens.js';
import type { InvitationMailer } from './mail.js';
export function createNotificationMailer(
  app: AppPluginApplication,
): InvitationMailer {
  return {
    async send(email, options) {
      const channel =
        app.config.get<UsersConfig>('users')?.invitations?.emailChannel ??
        'system-email';
      if (!app.container.has(sendingServiceToken)) return 'failed';
      const sending = app.container.resolve(sendingServiceToken);
      if (!sending.available(channel, 'email')) return 'failed';
      try {
        const results = await sending.send({
          channel,
          message: email,
          deadline: options?.deadline,
          deliveryId: options?.deliveryId,
        });
        if (results.some((result) => result.status === 'submission_unknown'))
          return 'unknown';
        return results.length &&
          results.every((result) => result.status === 'accepted')
          ? 'sent'
          : 'failed';
      } catch {
        return 'failed';
      }
    },
  };
}
