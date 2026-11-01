/** Invitation sender selection and bounded execution, with a lazy legacy Notification adapter. */
import { loggingToken } from '@nocobase/app-server/logging';
import { applicationMailerToken } from '@nocobase/app-server/mailers';
import { MailExecutions } from '@nocobase/mailer';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import type { UsersConfig } from '../tokens.js';
import { unconfiguredMailer, type InvitationMailer } from './mail.js';

const DEFAULT_CHANNEL = 'system-email';

export function createNotificationMailer(
  app: AppPluginApplication,
): InvitationMailer & { close(): Promise<void> } {
  const config = app.config.get<UsersConfig>('users')?.invitations;
  const mailer = app.container.resolve(applicationMailerToken);
  const explicit = config?.mailer;
  if (explicit !== undefined)
    mailer.assertReference(explicit, 'users.invitations.mailer');
  const direct =
    explicit !== undefined ||
    (config?.emailChannel === undefined && mailer.defaultMailer !== undefined);
  const name = config?.emailChannel ?? DEFAULT_CHANNEL;
  const channel = app.config.get<{
    channels?: Readonly<Record<string, { enabled?: boolean }>>;
  }>('notification')?.channels?.[name];
  if (!direct && (!channel || channel.enabled === false)) {
    return { ...unconfiguredMailer, close: () => Promise.resolve() };
  }
  const logger = app.container.has(loggingToken)
    ? app.container.resolve(loggingToken).getLogger('users')
    : undefined;
  if (explicit !== undefined && config?.emailChannel !== undefined)
    logger?.warn(
      {},
      'users.invitations.emailChannel is unused; users.invitations.mailer takes precedence. Migrate legacy selections to mailers.',
    );
  else if (!direct)
    logger?.warn(
      {},
      'Legacy invitation email channels remain supported. Migrate users.invitations.emailChannel to mailers.',
    );
  const executions = new MailExecutions(5, 30_000);
  return {
    async send(email) {
      const execution = executions.submit(async (signal) => {
        if (direct) {
          const result = await mailer.send(email, { mailer: explicit, signal });
          if (result.status !== 'accepted')
            throw new Error(
              `Invitation email ${result.status} (${result.error.category}).`,
            );
          return;
        }
        // Load Notification only for the legacy adapter. New applications need no Notification installation.
        const { notificationServiceToken } =
          await import('@nocobase/app-plugin-notification/server');
        if (!app.container.has(notificationServiceToken))
          throw new Error('The invitation email channel is unavailable.');
        const results = await app.container
          .resolve(notificationServiceToken)
          .sendTransient({ channel: name, message: { ...email } })
          .catch(() => {
            throw new Error('The invitation email could not be submitted.');
          });
        const failure = results.find((result) => result.status !== 'accepted');
        if (failure)
          throw new Error(
            `Invitation email ${failure.status} (${failure.error.category ?? 'unknown'}).`,
          );
      });
      if (!execution)
        throw new Error('Invitation email submission capacity unavailable.');
      await execution.completion;
    },
    close: () => executions.close(),
  };
}
