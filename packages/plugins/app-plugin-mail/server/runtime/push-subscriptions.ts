import { createHash, randomUUID } from 'node:crypto';
import { mailLogError, writeMailLog } from '../logging.js';
import type { MailStore } from '../contracts/persistence.js';
import type { MailLogger } from '../logging.js';
import type { MailProviderAdapterResolver } from '../contracts/provider.js';

export class MailPushSubscriptions {
  public constructor(
    private readonly options: {
      readonly store: Pick<
        MailStore,
        | 'claimPushSubscriptionMaintenance'
        | 'getAccount'
        | 'getPushSubscription'
        | 'markPushSubscriptionReplacementNeeded'
        | 'releasePushSubscriptionMaintenance'
        | 'renewPushSubscriptionMaintenance'
        | 'savePushSubscription'
      >;
      readonly logger?: MailLogger;
      readonly adapters: MailProviderAdapterResolver;
      readonly pushWebhookUrl?: string;
      readonly pushWebhookSecret?: string;
    },
  ) {}
  public async maintain(
    account: import('../../shared/mail.js').MailAccount,
  ): Promise<void> {
    const { pushWebhookUrl, pushWebhookSecret } = this.options;
    if (!pushWebhookUrl || !pushWebhookSecret) return;
    const notificationUrl = `${pushWebhookUrl.replace(/\/$/, '')}/${encodeURIComponent(account.provider.type)}/${encodeURIComponent(account.provider.name)}/${encodeURIComponent(pushWebhookSecret)}`;
    const configurationFingerprint = createHash('sha256')
      .update(`${notificationUrl}\0${pushWebhookSecret}`)
      .digest('hex');
    const current = await this.options.store.getPushSubscription(account.id);
    if (
      current &&
      current.configurationFingerprint === configurationFingerprint &&
      Date.parse(current.renewAfter) > Date.now()
    ) {
      return;
    }
    const leaseToken = randomUUID();
    const now = new Date();
    const lease = await this.options.store.claimPushSubscriptionMaintenance(
      account,
      leaseToken,
      now.toISOString(),
      new Date(now.getTime() + 60_000).toISOString(),
    );
    if (!lease) return;
    const existing = lease.subscription;
    if (
      existing &&
      existing.configurationFingerprint === configurationFingerprint &&
      Date.parse(existing.renewAfter) > Date.now()
    ) {
      await this.options.store.releasePushSubscriptionMaintenance(
        account.id,
        leaseToken,
      );
      return;
    }
    let adapter:
      import('../contracts/provider.js').MailProviderAdapter | undefined;
    const renewLease = (): Promise<boolean> =>
      this.options.store.renewPushSubscriptionMaintenance(
        account.id,
        leaseToken,
        new Date(Date.now() + 60_000).toISOString(),
      );
    let renewal: Promise<void> | undefined;
    const leaseHeartbeat = setInterval(() => {
      if (renewal) return;
      renewal = renewLease()
        .then(() => undefined)
        .catch((error: unknown) => {
          writeMailLog(
            this.options.logger,
            'error',
            { accountId: account.id, err: mailLogError(error) },
            'Mail push subscription lease could not be renewed.',
          );
        })
        .finally(() => {
          renewal = undefined;
        });
    }, 20_000);
    leaseHeartbeat.unref();
    try {
      adapter = await this.options.adapters.resolve(account);
      if (
        !adapter.capabilities.pushNotifications ||
        adapter.pushNotificationsConfigured === false ||
        !adapter.upsertPushSubscription
      ) {
        return;
      }
      const configurationChanged =
        existing !== undefined &&
        existing.configurationFingerprint !== configurationFingerprint;
      const deletePushSubscription =
        adapter.deletePushSubscription?.bind(adapter);
      if (configurationChanged) {
        if (!deletePushSubscription) {
          writeMailLog(
            this.options.logger,
            'error',
            { accountId: account.id },
            'The Provider cannot replace a stale Mail push subscription.',
          );
          return;
        }
        const removed = await deletePushSubscription(
          existing.providerSubscriptionId,
        );
        if (!removed.ok) {
          writeMailLog(
            this.options.logger,
            'error',
            {
              accountId: account.id,
              err: mailLogError(removed.error),
              errorCode: removed.error.code,
            },
            'The stale Mail push subscription could not be removed before replacement.',
          );
          return;
        }
        if (
          !(await this.options.store.markPushSubscriptionReplacementNeeded(
            account.id,
            leaseToken,
            new Date().toISOString(),
          ))
        ) {
          return;
        }
      }
      const result = await adapter.upsertPushSubscription({
        notificationUrl,
        clientState: pushWebhookSecret,
        providerSubscriptionId: configurationChanged
          ? undefined
          : existing?.providerSubscriptionId,
      });
      if (!result.ok) {
        writeMailLog(
          this.options.logger,
          'error',
          {
            accountId: account.id,
            err: mailLogError(result.error),
            errorCode: result.error.code,
          },
          'Mail push subscription could not be renewed.',
        );
        return;
      }
      const providerSubscriptionIdChanged =
        existing !== undefined &&
        result.value.providerSubscriptionId !== existing.providerSubscriptionId;
      const createdOrReplacedSubscription =
        !existing || configurationChanged || providerSubscriptionIdChanged;
      const compensateCreatedSubscription = async (): Promise<void> => {
        if (!createdOrReplacedSubscription) return;
        const latestAccount = await this.options.store.getAccount(account.id);
        if (
          !latestAccount ||
          latestAccount.status !== 'active' ||
          providerSubscriptionIdChanged
        ) {
          await adapter?.deletePushSubscription?.(
            result.value.providerSubscriptionId,
          );
        }
      };
      if (!(await renewLease())) {
        await compensateCreatedSubscription();
        return;
      }
      const refreshedAccount = await this.options.store.getAccount(account.id);
      if (!refreshedAccount || refreshedAccount.status !== 'active') {
        await adapter.deletePushSubscription?.(
          result.value.providerSubscriptionId,
        );
        return;
      }
      const persisted = await this.options.store.savePushSubscription(
        {
          accountId: account.id,
          provider: account.provider,
          configurationFingerprint,
          ...result.value,
          updatedAt: new Date().toISOString(),
        },
        leaseToken,
      );
      if (!persisted) {
        await compensateCreatedSubscription();
        return;
      }
      if (
        existing &&
        !configurationChanged &&
        existing.providerSubscriptionId !== result.value.providerSubscriptionId
      ) {
        await adapter.deletePushSubscription?.(existing.providerSubscriptionId);
      }
    } finally {
      clearInterval(leaseHeartbeat);
      await renewal;
      try {
        await this.options.store.releasePushSubscriptionMaintenance(
          account.id,
          leaseToken,
        );
      } finally {
        await adapter?.close?.();
      }
    }
  }
}
