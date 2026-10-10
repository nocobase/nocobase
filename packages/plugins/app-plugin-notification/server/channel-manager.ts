import { randomUUID } from 'node:crypto';

import type { Logger } from '@nocobase/logging';
import { NOTIFICATION_PROVIDER_ERROR_CATEGORIES } from './types.js';

import type {
  NotificationAttemptRecord,
  NotificationDeliveryRecord,
  NotificationStore,
} from './store.js';
import type {
  NotificationChannel,
  NotificationProvider,
  NotificationProviderErrorCategory,
  NotificationProviderIdentity,
  NotificationProviderSendError,
  ProviderSendResult,
} from './types.js';

export interface ChannelRuntime {
  readonly channel: NotificationChannel;
  readonly provider: NotificationProvider;
}

export interface ChannelManagerOptions {
  readonly logger: Logger;
  readonly store: NotificationStore;
  readonly resolveRuntime?: (type: string) => Promise<void>;
  readonly onDeliveryChanged?: (delivery: NotificationDeliveryRecord) => void;
  readonly leaseMs?: number;
  readonly providerTimeoutMs?: number;
  readonly retry?: {
    readonly maxAttempts?: number;
    readonly intervalMs?: number;
  };
}

const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_PROVIDER_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_RETRY_INTERVAL_MS = 5_000;

export class ChannelManager {
  private readonly runtimes = new Map<string, ChannelRuntime>();

  constructor(private readonly options: ChannelManagerOptions) {}

  register(type: string, runtime: ChannelRuntime): void {
    if (this.runtimes.has(type))
      throw new Error(`Notification Channel "${type}" is already registered.`);
    this.runtimes.set(type, runtime);
  }

  has(type: string): boolean {
    return this.runtimes.has(type);
  }

  type(name: string): string {
    const runtime = this.runtimes.get(name);
    if (!runtime)
      throw new Error(`Notification Channel "${name}" is not enabled.`);
    return runtime.channel.type;
  }

  validateMessage(
    name: string,
    message: unknown,
  ): { readonly message: object; readonly recipients: readonly object[] } {
    const runtime = this.runtimes.get(name);
    if (!runtime)
      throw new Error(`Notification Channel "${name}" is unavailable.`);
    return runtime.channel.validateMessage(message);
  }

  providerIdentities(name: string): readonly NotificationProviderIdentity[] {
    const provider = this.runtimes.get(name)?.provider;
    return provider ? [{ type: provider.type }] : [];
  }

  /** A one-shot path for credentials: deliberately bypasses storage and retries. */
  async sendTransient(
    name: string,
    input: object,
  ): Promise<readonly ProviderSendResult[]> {
    const runtime = this.runtimes.get(name);
    if (!runtime)
      throw new Error(`Notification Channel "${name}" is unavailable.`);
    const { message, recipients } = runtime.channel.validateMessage(input);
    if (!recipients.length)
      throw new Error('At least one notification recipient is required.');
    const notificationId = randomUUID();
    return Promise.all(
      recipients.map(async (recipient): Promise<ProviderSendResult> => {
        const delivery = {
          id: randomUUID(),
          notificationId,
          providerType: runtime.provider.type,
          recipientSnapshot: recipient,
          messageSnapshot: message,
        };
        const prepared = await this.prepare(runtime.channel, delivery);
        if (!prepared.ok)
          return {
            status: 'failed',
            disposition: 'never',
            error: {
              code: 'TRANSIENT_PREPARATION_FAILED',
              category: 'channel',
              message: 'Sensitive notification preparation failed.',
            },
          };
        const result = await this.invoke(
          runtime.provider,
          prepared.value,
          delivery,
          randomUUID(),
          new Date().toISOString(),
        );
        // Providers may echo credentials in diagnostics. Do not expose those errors to callers that persist them.
        if (result.status === 'accepted') return { status: 'accepted' };
        const error = {
          code: 'TRANSIENT_DELIVERY_FAILED',
          category:
            result.error.category &&
            NOTIFICATION_PROVIDER_ERROR_CATEGORIES.includes(
              result.error.category,
            )
              ? result.error.category
              : ('unknown' as const),
          message: 'Sensitive notification was not confirmed by the provider.',
        };
        return result.status === 'failed'
          ? { status: 'failed', disposition: 'never', error }
          : { status: 'submission_unknown', error };
      }),
    );
  }

  async send(
    deliveryId: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const stored = await this.options.store.getDelivery(deliveryId);
    if (!stored || !isRunnable(stored, await this.options.store.now()))
      return stored;
    let runtime: ChannelRuntime | undefined;
    let unavailable: string | undefined;
    try {
      await this.options.resolveRuntime?.(stored.channelName);
      runtime = this.runtimes.get(stored.channelName);
      if (!runtime)
        unavailable = `Notification Channel "${stored.channelName}" is not enabled.`;
      else if (runtime.channel.type !== stored.channelType)
        unavailable = `Notification Channel "${stored.channelName}" type has changed.`;
      else if (runtime.provider.type !== stored.providerType)
        unavailable = 'The original notification Provider is unavailable.';
    } catch (error) {
      unavailable = error instanceof Error ? error.message : String(error);
    }

    const leaseToken = randomUUID();
    const claimed = await this.options.store.claimDelivery(
      stored.id,
      leaseToken,
      await this.leaseExpiry(),
    );
    if (!claimed) return undefined;
    this.changed(claimed);
    if (unavailable || !runtime)
      return this.finishDelivery(claimed, 'failed', {
        code: 'PROVIDER_UNAVAILABLE',
        category: 'configuration',
        message: unavailable ?? 'Notification Channel is unavailable.',
      });

    const stopHeartbeat = this.startHeartbeat(claimed.id, leaseToken);
    try {
      const prepared = await this.prepare(runtime.channel, claimed);
      if (!prepared.ok)
        return this.finishDelivery(claimed, 'failed', prepared.error);
      return await this.submit(runtime, claimed, prepared.value);
    } finally {
      stopHeartbeat();
    }
  }

  async close(): Promise<void> {
    const providers = [...this.runtimes.values()]
      .map((runtime) => runtime.provider)
      .reverse();
    for (const provider of providers) {
      try {
        await provider.close?.();
      } catch (error) {
        this.options.logger.warn(
          {
            event: 'notification.provider.close_failed',
            err: error,
            providerType: provider.type,
          },
          'Failed to close notification Provider.',
        );
      }
    }
    this.runtimes.clear();
  }

  private async prepare(
    channel: NotificationChannel,
    delivery: Pick<
      NotificationDeliveryRecord,
      | 'id'
      | 'notificationId'
      | 'recipientSnapshot'
      | 'messageSnapshot'
      | 'providerType'
    >,
  ): Promise<
    | { readonly ok: true; readonly value: object }
    | { readonly ok: false; readonly error: NotificationProviderSendError }
  > {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new Error('Notification preparation timed out.')),
      this.providerTimeoutMs,
    );
    timeout.unref?.();
    try {
      const value = await Promise.race([
        channel.prepare({
          deliveryId: delivery.id,
          notificationId: delivery.notificationId,
          recipient: delivery.recipientSnapshot,
          message: delivery.messageSnapshot,
          provider: {
            type: delivery.providerType,
          },
          signal: controller.signal,
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener(
            'abort',
            () =>
              reject(
                controller.signal.reason instanceof Error
                  ? controller.signal.reason
                  : new Error('Notification preparation timed out.'),
              ),
            { once: true },
          );
        }),
      ]);
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: normalizeError(error, 'channel') };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async submit(
    runtime: ChannelRuntime,
    claimed: NotificationDeliveryRecord,
    prepared: object,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const provider = runtime.provider;
    if (provider.type !== claimed.providerType)
      return this.finishDelivery(claimed, 'failed', {
        code: 'PROVIDER_UNAVAILABLE',
        message: `Notification Provider "${claimed.providerType}" (${claimed.providerType}) is unavailable.`,
        category: 'configuration',
      });

    const startedAt = await this.options.store.now();
    const retryResolution = claimed.retryResolution;
    const delivery = {
      ...claimed,
      retryResolution,
      providerIdempotency: providerIdempotencyForAttempt(
        provider,
        claimed,
        startedAt,
      ),
    };
    const attempt: NotificationAttemptRecord = {
      id: randomUUID(),
      deliveryId: claimed.id,
      sequence: claimed.attemptCount + 1,
      providerType: provider.type,
      status: 'submitting',
      startedAt,
      retryResolution,
    };
    const started = await this.options.store.startAttempt(
      delivery,
      attempt,
      await this.leaseExpiry(),
    );
    if (!started) return undefined;
    const current = started;

    const submittedAt = await this.options.store.now();
    this.changed(current);

    const result = await this.invoke(
      provider,
      prepared,
      current,
      attempt.id,
      submittedAt,
    );
    const finishedAt = await this.options.store.now();
    if (result.status === 'accepted') {
      const finished = await this.finishAttemptAndDelivery(
        {
          ...attempt,
          status: 'accepted',
          finishedAt,
          providerMessageId: result.providerMessageId,
        },
        current,
        'accepted',
      );
      this.options.logger.debug(
        {
          event: 'notification.delivery.accepted',
          notificationId: current.notificationId,
          deliveryId: current.id,
          channelName: current.channelName,
          channelType: current.channelType,
          providerType: provider.type,
          attemptId: attempt.id,
          attemptCount: attempt.sequence,
          providerMessageId: result.providerMessageId,
        },
        'Notification Delivery accepted by Provider.',
      );
      return finished;
    }
    if (result.status === 'submission_unknown') {
      return this.finishAttemptAndDelivery(
        {
          ...attempt,
          status: 'unknown',
          finishedAt,
          error: result.error,
        },
        current,
        'unknown',
        result.error,
      );
    }

    const failedAttempt: NotificationAttemptRecord = {
      ...attempt,
      status: 'failed',
      finishedAt,
      error: result.error,
    };
    if (result.disposition === 'same_provider') {
      if (current.attemptCount < this.maxAttempts) {
        const retryAt = new Date(
          Date.parse(finishedAt) + this.retryDelay(result.retryAfterMs),
        ).toISOString();
        return this.finishAttemptAndDelivery(
          failedAttempt,
          current,
          'retrying',
          result.error,
          retryAt,
        );
      }
    }
    return this.finishAttemptAndDelivery(
      failedAttempt,
      current,
      'failed',
      result.error,
    );
  }

  private async invoke(
    provider: NotificationProvider,
    message: object,
    delivery: Pick<NotificationDeliveryRecord, 'id' | 'notificationId'>,
    attemptId: string,
    submittedAt: string,
  ): Promise<ProviderSendResult> {
    const controller = new AbortController();
    const deadline = new Date(
      Date.parse(submittedAt) + this.providerTimeoutMs,
    ).toISOString();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const timeoutResult = new Promise<ProviderSendResult>((resolve) => {
      timeout = setTimeout(() => {
        controller.abort(new Error('Notification Provider timed out.'));
        resolve({
          status: 'submission_unknown',
          error: {
            code: 'PROVIDER_TIMEOUT',
            category: 'timeout',
            message: 'Notification Provider result is unknown after timeout.',
          },
        });
      }, this.providerTimeoutMs);
      timeout.unref?.();
    });
    try {
      return await Promise.race([
        provider.send({
          message,
          notificationId: delivery.notificationId,
          deliveryId: delivery.id,
          attemptId,
          deadline,
          signal: controller.signal,
        }),
        timeoutResult,
      ]);
    } catch (error) {
      return {
        status: 'submission_unknown',
        error: normalizeError(error, 'provider'),
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private async finishAttemptAndDelivery(
    attempt: NotificationAttemptRecord,
    delivery: NotificationDeliveryRecord,
    status: 'accepted' | 'failed' | 'retrying' | 'unknown',
    error?: NotificationProviderSendError,
    nextRunAt?: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const result = await this.options.store.finishAttemptAndDelivery(
      attempt,
      delivery,
      status,
      error,
      nextRunAt,
    );
    if (result) this.changed(result);
    return result;
  }

  private async finishDelivery(
    delivery: NotificationDeliveryRecord,
    status: 'accepted' | 'failed' | 'unknown',
    error?: NotificationProviderSendError,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const result = await this.options.store.finishDelivery(
      delivery,
      status,
      error,
    );
    if (result) this.changed(result);
    return result;
  }

  private changed(delivery: NotificationDeliveryRecord): void {
    this.options.onDeliveryChanged?.(delivery);
  }

  private startHeartbeat(deliveryId: string, leaseToken: string): () => void {
    const interval = setInterval(
      (): void => {
        void this.renewHeartbeat(deliveryId, leaseToken).catch(
          (error: unknown) => {
            this.options.logger.warn(
              {
                event: 'notification.delivery.lease_renew_failed',
                err: error,
                deliveryId,
              },
              'Failed to renew notification Delivery lease.',
            );
          },
        );
      },
      Math.max(1, Math.floor(this.leaseMs / 3)),
    );
    interval.unref?.();
    return (): void => clearInterval(interval);
  }

  private retryDelay(retryAfterMs?: number): number {
    if (retryAfterMs !== undefined) return Math.max(0, retryAfterMs);
    return this.options.retry?.intervalMs ?? DEFAULT_RETRY_INTERVAL_MS;
  }

  private async leaseExpiry(): Promise<string> {
    const now = await this.options.store.now();
    return new Date(Date.parse(now) + this.leaseMs).toISOString();
  }

  private async renewHeartbeat(
    deliveryId: string,
    leaseToken: string,
  ): Promise<void> {
    await this.options.store.renewLease(
      deliveryId,
      leaseToken,
      await this.leaseExpiry(),
    );
  }

  private get leaseMs(): number {
    return this.options.leaseMs ?? DEFAULT_LEASE_MS;
  }

  private get providerTimeoutMs(): number {
    return this.options.providerTimeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  }

  private get maxAttempts(): number {
    return this.options.retry?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  }
}

function providerIdempotencyForAttempt(
  provider: NotificationProvider,
  delivery: NotificationDeliveryRecord,
  startedAt: string,
): NotificationDeliveryRecord['providerIdempotency'] {
  if (isProviderIdempotencyActive(delivery.providerIdempotency, startedAt))
    return delivery.providerIdempotency;
  const idempotency = provider.capabilities?.idempotency;
  if (!idempotency?.supported) return undefined;
  return {
    startedAt,
    ...(idempotency.retentionMs === undefined
      ? {}
      : {
          expiresAt: new Date(
            Date.parse(startedAt) + idempotency.retentionMs,
          ).toISOString(),
        }),
  };
}

function isProviderIdempotencyActive(
  record: NotificationDeliveryRecord['providerIdempotency'],
  now: string,
): boolean {
  return (
    record !== undefined &&
    (record.expiresAt === undefined || record.expiresAt > now)
  );
}

function isRunnable(
  delivery: NotificationDeliveryRecord,
  now: string,
): boolean {
  return (
    delivery.status === 'pending' ||
    (delivery.status === 'retrying' &&
      delivery.nextRunAt !== undefined &&
      delivery.nextRunAt <= now)
  );
}

function normalizeError(
  error: unknown,
  category: NotificationProviderErrorCategory,
): NotificationProviderSendError {
  return {
    category,
    message: error instanceof Error ? error.message : String(error),
  };
}
