/** Invitation sender selection and bounded execution, with a lazy legacy Notification adapter. */
import { loggingToken } from '@nocobase/app-server/logging';
import {
  resolveMailSenderFactory,
  type MailersConfig,
} from '@nocobase/app-server/mailers';
import { MailExecutions } from '@nocobase/mailer';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import type { UsersConfig } from '../tokens.js';
import { unconfiguredMailer, type InvitationMailer } from './mail.js';
import { selectInvitationEmailChannel } from './channel.js';

function startShutdownOperation(
  operation: () => void | Promise<void>,
): Promise<void> {
  try {
    return Promise.resolve(operation());
  } catch (error) {
    return Promise.reject(asError(error));
  }
}

function asError(value: unknown): Error {
  return value instanceof Error
    ? value
    : new Error('Invitation mail shutdown operation failed.', {
        cause: value,
      });
}

export function createNotificationMailer(
  app: AppPluginApplication,
): InvitationMailer & { close(): Promise<void> } {
  const config = app.config.get<UsersConfig>('users')?.invitations;
  const factory = resolveMailSenderFactory(
    app.container,
    app.config.get<MailersConfig>('mailers') ?? {},
  );
  const explicit = config?.mailer;
  const selected = selectInvitationEmailChannel(config, factory.defaultMailer);
  const direct = selected.kind === 'mailer';
  // The invitation adapter owns this sender; it allocates no transport until the first invitation.
  const sender = direct
    ? factory.create(
        explicit,
        explicit === undefined ? 'mailers.default' : 'users.invitations.mailer',
      )
    : undefined;
  const name = selected.name;
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
  let closing: Promise<void> | undefined;
  return {
    async send(email) {
      const execution = executions.submit(async (signal) => {
        if (sender) {
          const result = await sender.send(email, { signal });
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
    close() {
      closing ??= closeMailer();
      return closing;
    },
  };

  async function closeMailer(): Promise<void> {
    const failures: unknown[] = [];
    try {
      executions.stop();
    } catch (error) {
      failures.push(error);
    }
    const results = await Promise.allSettled([
      startShutdownOperation(() => sender?.close()),
      startShutdownOperation(() => executions.wait()),
    ]);
    for (const result of results)
      if (result.status === 'rejected') failures.push(result.reason);
    if (failures.length)
      throw new AggregateError(failures, 'Invitation mailer shutdown failed.');
  }
}
