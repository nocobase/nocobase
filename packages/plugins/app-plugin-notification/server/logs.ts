import type {
  NotificationAttemptRecord,
  NotificationDeliveryRecord,
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
