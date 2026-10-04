import {
  summarizeNotificationDeliveries,
  type NotificationAttemptRecord,
  type NotificationDeliveryRecord,
  type NotificationDeliveryStatus,
  type NotificationErrorRecord,
  type NotificationLogBundle,
  type NotificationLogCursor,
  type NotificationLogRecord,
  type NotificationRetryAuditRecord,
  type NotificationRetryResolutionRecord,
  type NotificationStore,
} from '../../server/store.js';

export class FakeNotificationStore implements NotificationStore {
  private readonly logs = new Map<string, NotificationLogRecord>();
  private readonly deliveries = new Map<string, NotificationDeliveryRecord>();
  private readonly attempts = new Map<string, NotificationAttemptRecord[]>();
  private readonly retryAudits = new Map<
    string,
    NotificationRetryAuditRecord[]
  >();

  async now(): Promise<string> {
    return new Date().toISOString();
  }

  async create(bundle: NotificationLogBundle): Promise<void> {
    this.logs.set(bundle.log.id, bundle.log);
    for (const delivery of bundle.deliveries) {
      this.deliveries.set(delivery.id, delivery);
    }
  }

  async createOrGetByIdempotency(
    bundle: NotificationLogBundle,
  ): Promise<
    | { readonly outcome: 'created'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'existing'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'conflict'; readonly bundle: NotificationLogBundle }
  > {
    const existing = [...this.logs.values()].find(
      (log) => log.idempotencyKey === bundle.log.idempotencyKey,
    );
    if (existing) {
      const existingBundle = {
        log: await this.withSummary(existing),
        deliveries: await this.listDeliveries(existing.id),
      };
      return existing.requestFingerprint === bundle.log.requestFingerprint
        ? { outcome: 'existing', bundle: existingBundle }
        : { outcome: 'conflict', bundle: existingBundle };
    }
    await this.create(bundle);
    return { outcome: 'created', bundle };
  }

  async getLog(id: string): Promise<NotificationLogRecord | undefined> {
    const log = this.logs.get(id);
    return log ? this.withSummary(log) : undefined;
  }

  async getLogByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationLogRecord | undefined> {
    const log = [...this.logs.values()].find(
      (candidate) => candidate.idempotencyKey === idempotencyKey,
    );
    return log ? this.withSummary(log) : undefined;
  }

  async listLogs(
    limit: number = 100,
    before?: NotificationLogCursor,
  ): Promise<readonly NotificationLogRecord[]> {
    const logs = await Promise.all(
      [...this.logs.values()].map((log) => this.withSummary(log)),
    );
    return logs
      .sort(
        (left, right) =>
          right.createdAt.localeCompare(left.createdAt) ||
          right.id.localeCompare(left.id),
      )
      .filter(
        (log) =>
          !before ||
          log.createdAt < before.createdAt ||
          (log.createdAt === before.createdAt && log.id < before.id),
      )
      .slice(0, limit);
  }

  async getDelivery(
    id: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    return this.deliveries.get(id);
  }

  async listDeliveries(
    notificationId: string,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    return [...this.deliveries.values()].filter(
      (delivery) => delivery.notificationId === notificationId,
    );
  }

  async listReady(
    now: string,
    limit: number = 100,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    return [...this.deliveries.values()]
      .filter(
        (delivery) =>
          delivery.status === 'pending' ||
          (delivery.status === 'retrying' &&
            delivery.nextRunAt !== undefined &&
            delivery.nextRunAt <= now),
      )
      .slice(0, limit);
  }

  async listAttempts(
    deliveryId: string,
  ): Promise<readonly NotificationAttemptRecord[]> {
    return this.attempts.get(deliveryId) ?? [];
  }

  async listRetryAudits(
    deliveryId: string,
  ): Promise<readonly NotificationRetryAuditRecord[]> {
    return this.retryAudits.get(deliveryId) ?? [];
  }

  async claimDelivery(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const delivery = this.deliveries.get(id);
    const now = await this.now();
    if (
      !delivery ||
      (delivery.status !== 'pending' &&
        !(
          delivery.status === 'retrying' &&
          delivery.nextRunAt !== undefined &&
          delivery.nextRunAt <= now
        ))
    )
      return undefined;
    const claimed: NotificationDeliveryRecord = {
      ...delivery,
      status: 'preparing',
      nextRunAt: undefined,
      leaseToken,
      leaseExpiresAt,
      updatedAt: await this.now(),
    };
    this.deliveries.set(id, claimed);
    return claimed;
  }

  async startAttempt(
    delivery: NotificationDeliveryRecord,
    attempt: NotificationAttemptRecord,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const current = this.deliveries.get(delivery.id);
    if (
      !current ||
      !['preparing', 'submitting'].includes(current.status) ||
      current.leaseToken !== delivery.leaseToken ||
      current.attemptCount !== delivery.attemptCount
    ) {
      return undefined;
    }
    this.attempts.set(delivery.id, [
      ...(this.attempts.get(delivery.id) ?? []),
      attempt,
    ]);
    const next: NotificationDeliveryRecord = {
      ...current,
      attemptCount: attempt.sequence,
      status: 'submitting',
      leaseExpiresAt,
      retryResolution: delivery.retryResolution,
      providerIdempotency: delivery.providerIdempotency,
      updatedAt: await this.now(),
    };
    this.deliveries.set(next.id, next);
    return next;
  }

  private async finishAttempt(
    attempt: NotificationAttemptRecord,
  ): Promise<void> {
    const attempts = this.attempts.get(attempt.deliveryId) ?? [];
    this.attempts.set(
      attempt.deliveryId,
      attempts.map((current) =>
        current.id === attempt.id ? attempt : current,
      ),
    );
  }

  async finishAttemptAndDelivery(
    attempt: NotificationAttemptRecord,
    delivery: NotificationDeliveryRecord,
    status: Extract<
      NotificationDeliveryStatus,
      'accepted' | 'failed' | 'retrying' | 'unknown'
    >,
    error?: NotificationErrorRecord,
    nextRunAt?: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const current = this.deliveries.get(delivery.id);
    if (
      !current ||
      current.status !== 'submitting' ||
      current.leaseToken !== delivery.leaseToken
    )
      return undefined;
    await this.finishAttempt(attempt);
    const finished: NotificationDeliveryRecord = {
      ...current,
      status,
      lastError: error,
      nextRunAt,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      retryResolution: undefined,
      updatedAt: await this.now(),
    };
    this.deliveries.set(finished.id, finished);
    return finished;
  }

  async renewLease(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    const current = this.deliveries.get(id);
    if (
      !current ||
      !['preparing', 'submitting'].includes(current.status) ||
      current.leaseToken !== leaseToken
    )
      return false;
    this.deliveries.set(id, { ...current, leaseExpiresAt });
    return true;
  }

  async finishDelivery(
    delivery: NotificationDeliveryRecord,
    status: Extract<
      NotificationDeliveryStatus,
      'accepted' | 'failed' | 'unknown'
    >,
    error?: NotificationErrorRecord,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const current = this.deliveries.get(delivery.id);
    if (
      !current ||
      !['preparing', 'submitting'].includes(current.status) ||
      current.leaseToken !== delivery.leaseToken
    ) {
      return undefined;
    }
    const finished: NotificationDeliveryRecord = {
      ...current,
      status,
      lastError: error,
      nextRunAt: undefined,
      leaseToken: undefined,
      leaseExpiresAt: undefined,
      retryResolution: undefined,
      updatedAt: await this.now(),
    };
    this.deliveries.set(finished.id, finished);
    return finished;
  }

  async retryDelivery(
    id: string,
    resolution: NotificationRetryResolutionRecord,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const delivery = this.deliveries.get(id);
    if (
      !delivery ||
      delivery.status !== 'failed' ||
      delivery.nextRunAt !== undefined
    )
      return undefined;
    const retried: NotificationDeliveryRecord = {
      ...delivery,
      status: 'retrying',
      nextRunAt: await this.now(),
      lastError: undefined,
      retryResolution: resolution,
      providerIdempotency: undefined,
      updatedAt: await this.now(),
    };
    this.retryAudits.set(id, [
      ...(this.retryAudits.get(id) ?? []),
      {
        id: `retry-audit-${id}-${(this.retryAudits.get(id)?.length ?? 0) + 1}`,
        deliveryId: id,
        resolution,
        providerIdempotency: delivery.providerIdempotency,
        createdAt: resolution.requestedAt,
      },
    ]);
    this.deliveries.set(id, retried);
    return retried;
  }

  async recoverExpired(
    now: string,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    const recovered: NotificationDeliveryRecord[] = [];
    for (const delivery of this.deliveries.values()) {
      if (
        !['preparing', 'submitting'].includes(delivery.status) ||
        !delivery.leaseExpiresAt ||
        delivery.leaseExpiresAt > now
      ) {
        continue;
      }
      const next: NotificationDeliveryRecord = {
        ...delivery,
        status: delivery.status === 'preparing' ? 'pending' : 'unknown',
        leaseToken: undefined,
        leaseExpiresAt: undefined,
        lastError:
          delivery.status === 'preparing'
            ? undefined
            : {
                code: 'LEASE_EXPIRED',
                message:
                  'Provider result is unknown after worker interruption.',
              },
        updatedAt: now,
      };
      this.deliveries.set(next.id, next);
      recovered.push(next);
    }
    return recovered;
  }

  private async withSummary(
    log: NotificationLogRecord,
  ): Promise<NotificationLogRecord> {
    const deliveries = await this.listDeliveries(log.id);
    return {
      ...log,
      status: summarizeNotificationDeliveries(deliveries),
      updatedAt: deliveries.reduce(
        (latest, delivery) =>
          delivery.updatedAt > latest ? delivery.updatedAt : latest,
        log.updatedAt,
      ),
    };
  }
}
