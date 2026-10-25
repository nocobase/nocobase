import {
  countOf,
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
} from './types.js';

/** Account states that need someone to act before the mailbox syncs again. */
const ATTENTION_STATES = ['reauthorizationRequired', 'suspended', 'revoked'];

export const mail: CapabilityCollector = {
  key: 'mail',
  packages: ['@nocobase/app-plugin-mail', '@nocobase/mailer'],
  async collect({ probe, report }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('mailAccounts'))
      return { status: 'unused', reason: 'notRegistered' };
    const [accounts, messages, submissions] = await Promise.all([
      probe.groupCount('mailAccounts', 'status').then((accounts) => {
        const connected = countOf(accounts, ['active']);
        const active = (connected ?? 0) > 0;
        report?.({
          status: active ? 'active' : connected === null ? null : 'needsSetup',
          ...(active || connected === null
            ? {}
            : { reason: 'noConnectedMailbox' }),
          facts: active ? [fact('mailboxes', { count: connected! })] : [],
          metrics: [
            metric('connectedMailboxes', connected),
            metric(
              'mailboxesNeedAttention',
              countOf(accounts, ATTENTION_STATES),
            ),
          ],
        });
        return accounts;
      }),
      (probe.has('mailMessages')
        ? probe.count('mailMessages')
        : Promise.resolve(0)
      ).then((messages) => {
        report?.({ status: null, metrics: [metric('messages', messages)] });
        return messages;
      }),
      (probe.has('mailSubmissions')
        ? probe.groupCount('mailSubmissions', 'status')
        : Promise.resolve(new Map<string, number>())
      ).then((submissions) => {
        report?.({
          status: null,
          metrics: [
            metric(
              'submissions',
              submissions === null
                ? null
                : [...submissions.values()].reduce(
                    (sum, count) => sum + count,
                    0,
                  ),
            ),
            metric('failedSubmissions', countOf(submissions, ['failed'])),
          ],
        });
        return submissions;
      }),
    ]);
    const connected = countOf(accounts, ['active']);
    const attention = countOf(accounts, ATTENTION_STATES);
    const active = (connected ?? 0) > 0;
    return {
      status: active ? 'active' : connected === null ? null : 'needsSetup',
      ...(active || connected === null ? {} : { reason: 'noConnectedMailbox' }),
      facts: [
        ...(active ? [fact('mailboxes', { count: connected ?? 0 })] : []),
        ...((attention ?? 0) > 0
          ? [fact('mailboxesNeedAttention', { count: attention ?? 0 })]
          : []),
      ],
      metrics: [
        metric('connectedMailboxes', connected),
        metric('mailboxesNeedAttention', attention),
        metric('messages', messages),
        metric(
          'submissions',
          submissions === null
            ? null
            : [...submissions.values()].reduce((sum, count) => sum + count, 0),
        ),
        metric('failedSubmissions', countOf(submissions, ['failed'])),
      ],
    };
  },
};

const IN_FLIGHT = ['pending', 'preparing', 'submitting', 'retrying'];

export const notifications: CapabilityCollector = {
  key: 'notifications',
  packages: [
    '@nocobase/app-plugin-notification',
    '@nocobase/app-plugin-notification-in-app',
    '@nocobase/app-plugin-notification-providers',
    '@nocobase/app-plugin-notification-web-push',
  ],
  async collect({ probe, config, report }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('notificationDeliveries'))
      return { status: 'unused', reason: 'notRegistered' };
    const channels = Object.entries(
      config.get<{ channels?: Record<string, { provider?: unknown }> }>(
        'notification',
      )?.channels ?? {},
    );
    report?.({
      status: channels.length > 0 ? 'active' : 'needsSetup',
      ...(channels.length > 0 ? {} : { reason: 'noChannel' }),
      metrics: [metric('channels', channels.length)],
    });
    const [dispatches, deliveries, attempts, inApp, inAppRead] =
      await Promise.all([
        probe.has('notificationDispatches')
          ? probe.count('notificationDispatches')
          : Promise.resolve(0),
        probe.groupCount('notificationDeliveries', 'status'),
        probe.has('notificationDeliveryAttempts')
          ? probe.count('notificationDeliveryAttempts')
          : Promise.resolve(0),
        probe.has('notificationInAppItems')
          ? probe.count('notificationInAppItems')
          : Promise.resolve(undefined),
        probe.has('notificationInAppItems')
          ? probe.count('notificationInAppItems', (filter) =>
              filter.date('readAt').notEmpty(),
            )
          : Promise.resolve(undefined),
      ]);
    const active = channels.length > 0;
    return {
      status: active ? 'active' : 'needsSetup',
      ...(active ? {} : { reason: 'noChannel' }),
      facts: active
        ? [
            fact('channels', {
              count: channels.length,
              names: channels.map(
                ([name, channel]) =>
                  `${name} (${typeof channel.provider === 'string' ? channel.provider : '?'})`,
              ),
            }),
          ]
        : [],
      metrics: [
        // Accepted by the provider, which is not the same as read or even received.
        metric('acceptedDeliveries', countOf(deliveries, ['accepted'])),
        metric('notifications', dispatches),
        metric(
          'deliveries',
          deliveries === null
            ? null
            : [...deliveries.values()].reduce((sum, count) => sum + count, 0),
        ),
        metric('failedDeliveries', countOf(deliveries, ['failed'])),
        metric('pendingDeliveries', countOf(deliveries, IN_FLIGHT)),
        metric('deliveryAttempts', attempts),
        ...(inApp === undefined
          ? []
          : [
              metric('inAppMessages', inApp),
              metric('inAppMessagesRead', inAppRead ?? null),
            ]),
        metric('channels', channels.length),
      ],
    };
  },
};
