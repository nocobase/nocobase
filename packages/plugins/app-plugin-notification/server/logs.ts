import type {
  NotificationAttemptRecord,
  NotificationDeliveryCount,
  NotificationDeliveryFilter,
  NotificationDeliveryRecord,
  NotificationDeliveryStatus,
  NotificationLogCursor,
  NotificationLogRecord,
  NotificationRetryAuditRecord,
  NotificationStore,
} from './store.js';
import { summarizeNotificationDeliveries } from './store.js';

export interface NotificationLogDetails {
  readonly log: Omit<NotificationLogRecord, 'messageSnapshot'>;
  readonly deliveries: readonly {
    readonly delivery: Omit<
      NotificationDeliveryRecord,
      'recipientSnapshot' | 'messageSnapshot' | 'leaseToken' | 'leaseExpiresAt'
    >;
    readonly attempts: readonly NotificationAttemptRecord[];
    readonly retryAudits: readonly NotificationRetryAuditRecord[];
  }[];
}

/** A delivery as the delivery log lists it: no message, recipient snapshot or lease. */
export type NotificationSafeDelivery =
  NotificationLogDetails['deliveries'][number]['delivery'];

export interface NotificationDeliveryLogEntry {
  readonly delivery: NotificationSafeDelivery;
  readonly kind?: string;
  readonly sourceType: string;
  readonly sourceReferenceId?: string;
  readonly idempotencyKey?: string;
}

export interface NotificationDeliveryLogDetails extends NotificationDeliveryLogEntry {
  readonly attempts: readonly NotificationAttemptRecord[];
  readonly retryAudits: readonly NotificationRetryAuditRecord[];
}

export class NotificationLogs {
  constructor(private readonly store: NotificationStore) {}

  async list(
    limit?: number,
  ): Promise<readonly Omit<NotificationLogRecord, 'messageSnapshot'>[]> {
    return (await this.store.listLogs(limit)).map(redactLog);
  }

  async listDetails(
    limit?: number,
    before?: NotificationLogCursor,
  ): Promise<readonly NotificationLogDetails[]> {
    const records = await this.store.listLogs(limit, before);
    const details = await Promise.all(
      records.map((record) => this.get(record.id)),
    );
    return details.filter(
      (item): item is NotificationLogDetails => item !== undefined,
    );
  }

  /** One page of the delivery log, newest first, starting after `before`. */
  async listDeliveryLog(
    filter: NotificationDeliveryFilter,
    limit: number,
    before?: NotificationLogCursor,
  ): Promise<readonly NotificationDeliveryLogEntry[]> {
    if (!this.store.listDeliveryLog) return [];
    return (await this.store.listDeliveryLog(filter, limit, before)).map(
      ({ delivery, ...rest }) => ({
        ...rest,
        delivery: redactDelivery(delivery),
      }),
    );
  }

  /** How many deliveries match `filter` per status, ignoring its status filter. */
  async countDeliveryStatuses(
    filter: NotificationDeliveryFilter,
  ): Promise<Partial<Record<NotificationDeliveryStatus, number>>> {
    const counts: readonly NotificationDeliveryCount[] =
      (await this.store.countDeliveryStatuses?.(filter)) ?? [];
    return Object.fromEntries(
      counts.map(({ status, count }) => [status, count]),
    );
  }

  /** One delivery with what its send was about, its attempts and retry audits. */
  async getDelivery(
    id: string,
  ): Promise<NotificationDeliveryLogDetails | undefined> {
    const delivery = await this.store.getDelivery(id);
    if (!delivery) return undefined;
    const [log, attempts, retryAudits] = await Promise.all([
      this.store.getLog(delivery.notificationId),
      this.store.listAttempts(id),
      this.store.listRetryAudits(id),
    ]);
    return {
      delivery: redactDelivery(delivery),
      ...(log?.kind ? { kind: log.kind } : {}),
      sourceType: log?.sourceType ?? 'application',
      ...(log?.sourceReferenceId
        ? { sourceReferenceId: log.sourceReferenceId }
        : {}),
      ...(log?.idempotencyKey ? { idempotencyKey: log.idempotencyKey } : {}),
      attempts,
      retryAudits,
    };
  }

  async get(id: string): Promise<NotificationLogDetails | undefined> {
    const log = await this.store.getLog(id);
    if (!log) return undefined;
    const deliveryRecords = await this.store.listDeliveries(id);
    const deliveries = await Promise.all(
      deliveryRecords.map(
        async (
          delivery,
        ): Promise<NotificationLogDetails['deliveries'][number]> => {
          const [attempts, retryAudits] = await Promise.all([
            this.store.listAttempts(delivery.id),
            this.store.listRetryAudits(delivery.id),
          ]);
          return {
            delivery: redactDelivery(delivery),
            attempts,
            retryAudits,
          };
        },
      ),
    );
    const currentLog = {
      ...log,
      status: summarizeNotificationDeliveries(deliveryRecords),
      updatedAt: deliveryRecords.reduce(
        (latest, delivery) =>
          delivery.updatedAt > latest ? delivery.updatedAt : latest,
        log.updatedAt,
      ),
    };
    return { log: redactLog(currentLog), deliveries };
  }
}

function redactLog(
  record: NotificationLogRecord,
): Omit<NotificationLogRecord, 'messageSnapshot'> {
  const { messageSnapshot: _messageSnapshot, ...safe } = record;
  return safe;
}

function redactDelivery(
  record: NotificationDeliveryRecord,
): NotificationLogDetails['deliveries'][number]['delivery'] {
  const {
    recipientSnapshot: _recipientSnapshot,
    messageSnapshot: _messageSnapshot,
    leaseToken: _leaseToken,
    leaseExpiresAt: _leaseExpiresAt,
    ...safe
  } = record;
  return safe;
}
