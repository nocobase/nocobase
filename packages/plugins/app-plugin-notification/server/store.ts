import { randomUUID } from 'node:crypto';

import type { DatabaseManager, Row } from '@nocobase/db';
import {
  isNotificationProviderErrorCategory,
  type NotificationProviderErrorCategory,
} from './types.js';

export type NotificationLogStatus =
  'pending' | 'processing' | 'completed' | 'partial' | 'failed' | 'unknown';
export type NotificationDeliveryStatus =
  | 'pending'
  | 'preparing'
  | 'submitting'
  | 'retrying'
  | 'accepted'
  | 'failed'
  | 'unknown';
export type NotificationAttemptStatus =
  'submitting' | 'accepted' | 'failed' | 'unknown';

export interface NotificationErrorRecord {
  readonly code?: string;
  readonly message: string;
  readonly category?: NotificationProviderErrorCategory;
}

export interface NotificationLogRecord {
  readonly id: string;
  readonly idempotencyKey?: string;
  readonly requestFingerprint?: string;
  readonly sourceType: string;
  readonly sourceReferenceId?: string;
  readonly messageSnapshot: Readonly<Record<string, object>>;
  readonly status: NotificationLogStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationDeliveryRecord {
  readonly id: string;
  readonly notificationId: string;
  readonly channelName: string;
  readonly channelType: string;
  readonly recipientSnapshot: object;
  readonly messageSnapshot: object;
  readonly providerType: string;
  readonly attemptCount: number;
  readonly status: NotificationDeliveryStatus;
  readonly nextRunAt?: string;
  readonly leaseToken?: string;
  readonly leaseExpiresAt?: string;
  readonly lastError?: NotificationErrorRecord;
  readonly retryResolution?: NotificationRetryResolutionRecord;
  readonly providerIdempotency?: NotificationProviderIdempotencyRecord;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NotificationProviderIdempotencyRecord {
  readonly startedAt: string;
  readonly expiresAt?: string;
}

export interface NotificationAttemptRecord {
  readonly id: string;
  readonly deliveryId: string;
  readonly sequence: number;
  readonly providerType: string;
  readonly status: NotificationAttemptStatus;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly providerMessageId?: string;
  readonly error?: NotificationErrorRecord;
  readonly retryResolution?: NotificationRetryResolutionRecord;
}

export interface NotificationRetryResolutionRecord {
  readonly type: 'terminal_failure';
  readonly reason: string;
  readonly requestedAt: string;
}

export interface NotificationRetryAuditRecord {
  readonly id: string;
  readonly deliveryId: string;
  readonly resolution: NotificationRetryResolutionRecord;
  readonly providerIdempotency?: NotificationProviderIdempotencyRecord;
  readonly createdAt: string;
}

export interface NotificationLogBundle {
  readonly log: NotificationLogRecord;
  readonly deliveries: readonly NotificationDeliveryRecord[];
}

/** Position after which a log page continues: the last log of the previous page, newest first. */
export interface NotificationLogCursor {
  readonly createdAt: string;
  readonly id: string;
}

export interface NotificationStore {
  now(): Promise<string>;
  create(bundle: NotificationLogBundle): Promise<void>;
  createOrGetByIdempotency(
    bundle: NotificationLogBundle,
  ): Promise<
    | { readonly outcome: 'created'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'existing'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'conflict'; readonly bundle: NotificationLogBundle }
  >;
  getLog(id: string): Promise<NotificationLogRecord | undefined>;
  getLogByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationLogRecord | undefined>;
  /** Logs newest first, ties broken by id, starting after `before` when given. */
  listLogs(
    limit?: number,
    before?: NotificationLogCursor,
  ): Promise<readonly NotificationLogRecord[]>;
  getDelivery(id: string): Promise<NotificationDeliveryRecord | undefined>;
  listDeliveries(
    notificationId: string,
  ): Promise<readonly NotificationDeliveryRecord[]>;
  listReady(
    now: string,
    limit?: number,
  ): Promise<readonly NotificationDeliveryRecord[]>;
  listAttempts(
    deliveryId: string,
  ): Promise<readonly NotificationAttemptRecord[]>;
  listRetryAudits(
    deliveryId: string,
  ): Promise<readonly NotificationRetryAuditRecord[]>;
  claimDelivery(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined>;
  startAttempt(
    delivery: NotificationDeliveryRecord,
    attempt: NotificationAttemptRecord,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined>;
  renewLease(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean>;
  finishAttemptAndDelivery(
    attempt: NotificationAttemptRecord,
    delivery: NotificationDeliveryRecord,
    status: Extract<
      NotificationDeliveryStatus,
      'accepted' | 'failed' | 'retrying' | 'unknown'
    >,
    error?: NotificationErrorRecord,
    nextRunAt?: string,
  ): Promise<NotificationDeliveryRecord | undefined>;
  finishDelivery(
    delivery: NotificationDeliveryRecord,
    status: Extract<
      NotificationDeliveryStatus,
      'accepted' | 'failed' | 'unknown'
    >,
    error?: NotificationErrorRecord,
  ): Promise<NotificationDeliveryRecord | undefined>;
  retryDelivery(
    id: string,
    resolution: NotificationRetryResolutionRecord,
  ): Promise<NotificationDeliveryRecord | undefined>;
  recoverExpired(now: string): Promise<readonly NotificationDeliveryRecord[]>;
}

interface NotificationRow extends Row {
  id: string;
  idempotencyKey?: string | null;
  requestFingerprint?: string | null;
  sourceType: string;
  sourceReferenceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryRow extends Row {
  id: string;
  notificationId: string;
  channelName: string;
  channelType: string;
  recipientSnapshot: object | string;
  messageSnapshot: object | string;
  providerType: string;
  attemptCount: number;
  status: NotificationDeliveryStatus;
  nextRunAt?: string | null;
  leaseToken?: string | null;
  leaseExpiresAt?: string | null;
  lastError?: NotificationErrorRecord | string | null;
  retryResolution?: NotificationRetryResolutionRecord | string | null;
  providerIdempotency?: NotificationProviderIdempotencyRecord | string | null;
  createdAt: string;
  updatedAt: string;
}

interface AttemptRow extends Row {
  id: string;
  deliveryId: string;
  sequence: number;
  providerType: string;
  status: NotificationAttemptStatus;
  startedAt: string;
  finishedAt?: string;
  providerMessageId?: string;
  errorCategory?: string;
  errorCode?: string;
  errorMessage?: string;
  retryResolution?: NotificationRetryResolutionRecord | string | null;
}

interface RetryAuditRow extends Row {
  id: string;
  deliveryId: string;
  resolution: NotificationRetryResolutionRecord | string;
  providerIdempotency?: NotificationProviderIdempotencyRecord | string | null;
  createdAt: string;
}

export class DatabaseNotificationStore implements NotificationStore {
  constructor(private readonly database: DatabaseManager) {}
  async now(): Promise<string> {
    return new Date().toISOString();
  }

  async create(bundle: NotificationLogBundle): Promise<void> {
    await this.database.transaction(async (connection): Promise<void> => {
      await connection.query
        .insertInto<NotificationRow>('notificationDispatches')
        .values(toLogRow(bundle.log))
        .execute();
      if (bundle.deliveries.length > 0)
        await connection.query
          .insertInto<DeliveryRow>('notificationDeliveries')
          .values(bundle.deliveries.map(toDeliveryRow))
          .execute();
    });
  }

  async createOrGetByIdempotency(
    bundle: NotificationLogBundle,
  ): Promise<
    | { readonly outcome: 'created'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'existing'; readonly bundle: NotificationLogBundle }
    | { readonly outcome: 'conflict'; readonly bundle: NotificationLogBundle }
  > {
    const { idempotencyKey, requestFingerprint } = bundle.log;
    if (!idempotencyKey || !requestFingerprint) {
      throw new Error(
        'An idempotency key and request fingerprint are required to create a notification.',
      );
    }
    try {
      await this.database.transaction(async (connection): Promise<void> => {
        await connection.query
          .insertInto<NotificationRow>('notificationDispatches')
          .values(toLogRow(bundle.log))
          .execute();
        if (bundle.deliveries.length > 0)
          await connection.query
            .insertInto<DeliveryRow>('notificationDeliveries')
            .values(bundle.deliveries.map(toDeliveryRow))
            .execute();
      });
      return { outcome: 'created', bundle };
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
      const existing = await this.getBundleByIdempotencyKey(idempotencyKey);
      if (!existing) throw error;
      return existing.log.requestFingerprint === requestFingerprint
        ? { outcome: 'existing', bundle: existing }
        : { outcome: 'conflict', bundle: existing };
    }
  }

  async getLog(id: string): Promise<NotificationLogRecord | undefined> {
    const row = await this.database
      .query()
      .selectFrom<NotificationRow>('notificationDispatches')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<NotificationRow>();
    return row ? fromLogRow(row, await this.listDeliveries(id)) : undefined;
  }

  async getLogByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationLogRecord | undefined> {
    const row = await this.database
      .query()
      .selectFrom<NotificationRow>('notificationDispatches')
      .selectAll()
      .where('idempotencyKey', '=', idempotencyKey)
      .executeTakeFirst<NotificationRow>();
    return row ? fromLogRow(row, await this.listDeliveries(row.id)) : undefined;
  }

  async listLogs(
    limit: number = 100,
    before?: NotificationLogCursor,
  ): Promise<readonly NotificationLogRecord[]> {
    let query = this.database
      .query()
      .selectFrom<NotificationRow>('notificationDispatches')
      .selectAll()
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(limit);
    if (before)
      query = query.where((builder) =>
        builder.or([
          builder('createdAt', '<', before.createdAt),
          builder.and([
            builder('createdAt', '=', before.createdAt),
            builder('id', '<', before.id),
          ]),
        ]),
      );
    const rows = await query.execute<NotificationRow>();
    return Promise.all(
      rows.map(async (row): Promise<NotificationLogRecord> =>
        fromLogRow(row, await this.listDeliveries(row.id)),
      ),
    );
  }

  async getDelivery(
    id: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const row = await this.database
      .query()
      .selectFrom<DeliveryRow>('notificationDeliveries')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<DeliveryRow>();
    return row ? fromDeliveryRow(row) : undefined;
  }

  async listDeliveries(
    notificationId: string,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<DeliveryRow>('notificationDeliveries')
      .selectAll()
      .where('notificationId', '=', notificationId)
      .execute<DeliveryRow>();
    return rows.map(fromDeliveryRow);
  }

  async listReady(
    now: string,
    limit: number = 100,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<DeliveryRow>('notificationDeliveries')
      .selectAll()
      .where((builder) =>
        builder.or([
          builder.eb('status', '=', 'pending'),
          builder.eb.and([
            builder.eb('status', '=', 'retrying'),
            builder.eb('nextRunAt', '<=', now),
          ]),
        ]),
      )
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .execute<DeliveryRow>();
    return rows.map(fromDeliveryRow);
  }

  async listAttempts(
    deliveryId: string,
  ): Promise<readonly NotificationAttemptRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<AttemptRow>('notificationDeliveryAttempts')
      .selectAll()
      .where('deliveryId', '=', deliveryId)
      .orderBy('sequence', 'asc')
      .execute<AttemptRow>();
    return rows.map(fromAttemptRow);
  }

  async listRetryAudits(
    deliveryId: string,
  ): Promise<readonly NotificationRetryAuditRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<RetryAuditRow>('notificationDeliveryRetryAudits')
      .selectAll()
      .where('deliveryId', '=', deliveryId)
      .orderBy('createdAt', 'asc')
      .orderBy('id', 'asc')
      .execute<RetryAuditRow>();
    return rows.map(fromRetryAuditRow);
  }

  async claimDelivery(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const now = await this.now();
    const result = await this.database
      .query()
      .updateTable<DeliveryRow>('notificationDeliveries')
      .set({
        status: 'preparing',
        nextRunAt: null,
        leaseToken,
        leaseExpiresAt,
        updatedAt: now,
      })
      .where('id', '=', id)
      .where((builder) =>
        builder.or([
          builder.eb('status', '=', 'pending'),
          builder.eb.and([
            builder.eb('status', '=', 'retrying'),
            builder.eb('nextRunAt', '<=', now),
          ]),
        ]),
      )
      .execute();
    if (result.updatedCount !== 1) return undefined;
    return this.getDelivery(id);
  }

  async startAttempt(
    delivery: NotificationDeliveryRecord,
    attempt: NotificationAttemptRecord,
    leaseExpiresAt: string,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const now = await this.now();
    return this.database.transaction(
      async (connection): Promise<NotificationDeliveryRecord | undefined> => {
        const result = await connection.query
          .updateTable<DeliveryRow>('notificationDeliveries')
          .set({
            attemptCount: attempt.sequence,
            status: 'submitting',
            retryResolution: delivery.retryResolution
              ? JSON.stringify(delivery.retryResolution)
              : null,
            providerIdempotency: delivery.providerIdempotency
              ? JSON.stringify(delivery.providerIdempotency)
              : null,
            leaseExpiresAt,
            updatedAt: now,
          })
          .where('id', '=', delivery.id)
          .where('status', 'in', ['preparing', 'submitting'])
          .where('leaseToken', '=', delivery.leaseToken ?? '')
          .where('attemptCount', '=', delivery.attemptCount)
          .execute();
        if (result.updatedCount !== 1) return undefined;
        await connection.query
          .insertInto<AttemptRow>('notificationDeliveryAttempts')
          .values(toAttemptRow(attempt))
          .execute();
        const row = await connection.query
          .selectFrom<DeliveryRow>('notificationDeliveries')
          .selectAll()
          .where('id', '=', delivery.id)
          .executeTakeFirst<DeliveryRow>();
        return row ? fromDeliveryRow(row) : undefined;
      },
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
    const now = await this.now();
    let result: boolean;
    try {
      result = await this.database.transaction(
        async (connection): Promise<boolean> => {
          const attemptResult = await connection.query
            .updateTable<AttemptRow>('notificationDeliveryAttempts')
            .set({
              status: attempt.status,
              finishedAt: attempt.finishedAt,
              providerMessageId: attempt.providerMessageId,
              errorCategory: attempt.error?.category,
              errorCode: attempt.error?.code,
              errorMessage: attempt.error?.message,
            })
            .where('id', '=', attempt.id)
            .where('status', '=', 'submitting')
            .execute();
          if (attemptResult.updatedCount !== 1) return false;
          const deliveryResult = await connection.query
            .updateTable<DeliveryRow>('notificationDeliveries')
            .set({
              status,
              nextRunAt: nextRunAt ?? null,
              lastError: error ? JSON.stringify(error) : null,
              retryResolution: null,
              leaseToken: null,
              leaseExpiresAt: null,
              updatedAt: now,
            })
            .where('id', '=', delivery.id)
            .where('status', '=', 'submitting')
            .where('leaseToken', '=', delivery.leaseToken ?? '')
            .execute();
          if (deliveryResult.updatedCount !== 1)
            throw new StaleNotificationTransitionError();
          return true;
        },
      );
    } catch (error) {
      if (error instanceof StaleNotificationTransitionError) return undefined;
      throw error;
    }
    if (!result) return undefined;
    const next = await this.getDelivery(delivery.id);
    return next;
  }

  async renewLease(
    id: string,
    leaseToken: string,
    leaseExpiresAt: string,
  ): Promise<boolean> {
    const result = await this.database
      .query()
      .updateTable<DeliveryRow>('notificationDeliveries')
      .set({ leaseExpiresAt, updatedAt: await this.now() })
      .where('id', '=', id)
      .where('status', 'in', ['preparing', 'submitting'])
      .where('leaseToken', '=', leaseToken)
      .execute();
    return result.updatedCount === 1;
  }

  async finishDelivery(
    delivery: NotificationDeliveryRecord,
    status: Extract<
      NotificationDeliveryStatus,
      'accepted' | 'failed' | 'unknown'
    >,
    error?: NotificationErrorRecord,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const now = await this.now();
    const result = await this.database
      .query()
      .updateTable<DeliveryRow>('notificationDeliveries')
      .set({
        status,
        nextRunAt: null,
        lastError: error ? JSON.stringify(error) : null,
        retryResolution: null,
        leaseToken: null,
        leaseExpiresAt: null,
        updatedAt: now,
      })
      .where('id', '=', delivery.id)
      .where('status', 'in', ['preparing', 'submitting'])
      .where('leaseToken', '=', delivery.leaseToken ?? '')
      .execute();
    if (result.updatedCount !== 1) return undefined;
    const next = await this.getDelivery(delivery.id);
    return next;
  }

  async retryDelivery(
    id: string,
    resolution: NotificationRetryResolutionRecord,
  ): Promise<NotificationDeliveryRecord | undefined> {
    const now = await this.now();
    const updated = await this.database.transaction(
      async (connection): Promise<boolean> => {
        const current = await connection.query
          .selectFrom<DeliveryRow>('notificationDeliveries')
          .selectAll()
          .where('id', '=', id)
          .where('status', '=', 'failed')
          .where('nextRunAt', 'is', null)
          .executeTakeFirst<DeliveryRow>();
        if (!current) return false;
        const result = await connection.query
          .updateTable<DeliveryRow>('notificationDeliveries')
          .set({
            status: 'retrying',
            nextRunAt: now,
            lastError: null,
            retryResolution: JSON.stringify(resolution),
            providerIdempotency: null,
            leaseToken: null,
            leaseExpiresAt: null,
            updatedAt: now,
          })
          .where('id', '=', id)
          .where('status', '=', 'failed')
          .where('nextRunAt', 'is', null)
          .execute();
        if (result.updatedCount !== 1) return false;
        await connection.query
          .insertInto<RetryAuditRow>('notificationDeliveryRetryAudits')
          .values({
            id: randomUUID(),
            deliveryId: id,
            resolution: JSON.stringify(resolution),
            providerIdempotency:
              typeof current.providerIdempotency === 'string'
                ? current.providerIdempotency
                : current.providerIdempotency
                  ? JSON.stringify(current.providerIdempotency)
                  : null,
            createdAt: resolution.requestedAt,
          })
          .execute();
        return true;
      },
    );
    if (!updated) return undefined;
    return this.getDelivery(id);
  }

  async recoverExpired(
    now: string,
  ): Promise<readonly NotificationDeliveryRecord[]> {
    const rows = await this.database
      .query()
      .selectFrom<DeliveryRow>('notificationDeliveries')
      .selectAll()
      .where('status', 'in', ['preparing', 'submitting'])
      .where('leaseExpiresAt', '<=', now)
      .execute<DeliveryRow>();
    const recoveredDeliveries: NotificationDeliveryRecord[] = [];
    for (const row of rows) {
      if (row.status === 'preparing') {
        const result = await this.database
          .query()
          .updateTable<DeliveryRow>('notificationDeliveries')
          .set({
            status: 'pending',
            leaseToken: null,
            leaseExpiresAt: null,
            updatedAt: now,
          })
          .where('id', '=', row.id)
          .where('status', '=', 'preparing')
          .where('leaseExpiresAt', '<=', now)
          .execute();
        if (result.updatedCount === 1) {
          const delivery = await this.getDelivery(row.id);
          if (delivery) recoveredDeliveries.push(delivery);
        }
      } else {
        const error: NotificationErrorRecord = {
          code: 'LEASE_EXPIRED',
          message: 'Provider result is unknown after worker interruption.',
        };
        const recovered = await this.database.transaction(
          async (connection): Promise<boolean> => {
            const result = await connection.query
              .updateTable<DeliveryRow>('notificationDeliveries')
              .set({
                status: 'unknown',
                nextRunAt: null,
                lastError: JSON.stringify(error),
                leaseToken: null,
                leaseExpiresAt: null,
                updatedAt: now,
              })
              .where('id', '=', row.id)
              .where('status', '=', 'submitting')
              .where('leaseExpiresAt', '<=', now)
              .execute();
            if (result.updatedCount !== 1) return false;
            await connection.query
              .updateTable<AttemptRow>('notificationDeliveryAttempts')
              .set({
                status: 'unknown',
                finishedAt: now,
                errorCode: error.code,
                errorMessage: error.message,
              })
              .where('deliveryId', '=', row.id)
              .where('sequence', '=', row.attemptCount)
              .where('status', '=', 'submitting')
              .execute();
            return true;
          },
        );
        if (recovered) {
          const delivery = await this.getDelivery(row.id);
          if (delivery) recoveredDeliveries.push(delivery);
        }
      }
    }
    return recoveredDeliveries;
  }

  private async getBundleByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<NotificationLogBundle | undefined> {
    const log = await this.getLogByIdempotencyKey(idempotencyKey);
    if (!log) return undefined;
    return { log, deliveries: await this.listDeliveries(log.id) };
  }
}

class StaleNotificationTransitionError extends Error {}

export function createDatabaseNotificationStore(
  database: DatabaseManager,
): NotificationStore {
  return new DatabaseNotificationStore(database);
}

export function summarizeNotificationDeliveries(
  deliveries: readonly NotificationDeliveryRecord[],
): NotificationLogStatus {
  if (deliveries.every((item) => item.status === 'pending')) return 'pending';
  if (
    deliveries.some(
      (item) =>
        item.status === 'pending' ||
        item.status === 'preparing' ||
        item.status === 'submitting' ||
        item.status === 'retrying',
    )
  )
    return 'processing';
  if (deliveries.some((item) => item.status === 'unknown')) return 'unknown';
  if (deliveries.every((item) => item.status === 'accepted'))
    return 'completed';
  if (deliveries.every((item) => item.status === 'failed')) return 'failed';
  return 'partial';
}

function toLogRow(record: NotificationLogRecord): NotificationRow {
  return {
    id: record.id,
    idempotencyKey: record.idempotencyKey,
    requestFingerprint: record.requestFingerprint,
    sourceType: record.sourceType,
    sourceReferenceId: record.sourceReferenceId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function fromLogRow(
  row: NotificationRow,
  deliveries: readonly NotificationDeliveryRecord[],
): NotificationLogRecord {
  const messageSnapshot: Record<string, object> = {};
  for (const delivery of deliveries)
    messageSnapshot[delivery.channelName] = delivery.messageSnapshot;
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey ?? undefined,
    requestFingerprint: row.requestFingerprint ?? undefined,
    sourceType: row.sourceType,
    sourceReferenceId: row.sourceReferenceId,
    messageSnapshot,
    status: summarizeNotificationDeliveries(deliveries),
    createdAt: row.createdAt,
    updatedAt: deliveries.reduce(
      (latest, delivery) =>
        delivery.updatedAt > latest ? delivery.updatedAt : latest,
      row.updatedAt,
    ),
  };
}

function toDeliveryRow(record: NotificationDeliveryRecord): DeliveryRow {
  return {
    id: record.id,
    notificationId: record.notificationId,
    channelName: record.channelName,
    channelType: record.channelType,
    recipientSnapshot: JSON.stringify(record.recipientSnapshot),
    messageSnapshot: JSON.stringify(record.messageSnapshot),
    providerType: record.providerType,
    attemptCount: record.attemptCount,
    status: record.status,
    nextRunAt: record.nextRunAt,
    leaseToken: record.leaseToken,
    leaseExpiresAt: record.leaseExpiresAt,
    lastError: record.lastError,
    retryResolution: record.retryResolution
      ? JSON.stringify(record.retryResolution)
      : undefined,
    providerIdempotency: record.providerIdempotency
      ? JSON.stringify(record.providerIdempotency)
      : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function fromDeliveryRow(row: DeliveryRow): NotificationDeliveryRecord {
  return {
    id: row.id,
    notificationId: row.notificationId,
    channelName: row.channelName,
    channelType: row.channelType,
    recipientSnapshot: parseObject(row.recipientSnapshot, 'recipient'),
    messageSnapshot: parseObject(row.messageSnapshot, 'message'),
    providerType: row.providerType,
    attemptCount: row.attemptCount,
    status: row.status,
    nextRunAt: row.nextRunAt ?? undefined,
    leaseToken: row.leaseToken ?? undefined,
    leaseExpiresAt: row.leaseExpiresAt ?? undefined,
    lastError: parseError(row.lastError),
    retryResolution: parseRetryResolution(row.retryResolution),
    providerIdempotency: parseProviderIdempotency(row.providerIdempotency),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseObject(value: object | string, label: string): object {
  if (typeof value !== 'string') return value;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error(`Stored notification ${label} snapshot is invalid.`);
  return parsed;
}

function parseError(
  value: NotificationErrorRecord | string | null | undefined,
): NotificationErrorRecord | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  const parsed: unknown = JSON.parse(value);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('message' in parsed) ||
    typeof parsed.message !== 'string'
  )
    throw new Error('Stored notification error is invalid.');
  const category =
    'category' in parsed
      ? normalizeStoredErrorCategory(parsed.category)
      : undefined;
  const code =
    'code' in parsed && typeof parsed.code === 'string'
      ? parsed.code
      : undefined;
  return {
    message: parsed.message,
    ...(code ? { code } : {}),
    ...(category ? { category } : {}),
  };
}

function toAttemptRow(record: NotificationAttemptRecord): AttemptRow {
  return {
    id: record.id,
    deliveryId: record.deliveryId,
    sequence: record.sequence,
    providerType: record.providerType,
    status: record.status,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt,
    providerMessageId: record.providerMessageId,
    errorCategory: record.error?.category,
    errorCode: record.error?.code,
    errorMessage: record.error?.message,
    retryResolution: record.retryResolution
      ? JSON.stringify(record.retryResolution)
      : undefined,
  };
}

function fromAttemptRow(row: AttemptRow): NotificationAttemptRecord {
  const category = normalizeStoredErrorCategory(row.errorCategory);
  const error = row.errorMessage
    ? {
        ...(category ? { category } : {}),
        ...(row.errorCode ? { code: row.errorCode } : {}),
        message: row.errorMessage,
      }
    : undefined;
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    sequence: row.sequence,
    providerType: row.providerType,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    providerMessageId: row.providerMessageId,
    error,
    retryResolution: parseRetryResolution(row.retryResolution),
  };
}

function fromRetryAuditRow(row: RetryAuditRow): NotificationRetryAuditRecord {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    resolution: parseRequiredJson<NotificationRetryResolutionRecord>(
      row.resolution,
      'retry resolution',
    ),
    providerIdempotency: parseProviderIdempotency(row.providerIdempotency),
    createdAt: row.createdAt,
  };
}

function parseRetryResolution(
  value: NotificationRetryResolutionRecord | string | null | undefined,
): NotificationRetryResolutionRecord | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  return JSON.parse(value) as NotificationRetryResolutionRecord;
}

function parseProviderIdempotency(
  value: NotificationProviderIdempotencyRecord | string | null | undefined,
): NotificationProviderIdempotencyRecord | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value;
  return JSON.parse(value) as NotificationProviderIdempotencyRecord;
}

function parseRequiredJson<T>(value: T | string, label: string): T {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Stored notification ${label} is invalid.`);
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    const code = record.code;
    const number = record.errno ?? record.number ?? record.errorNum;
    if (
      code === '23505' ||
      code === 'ER_DUP_ENTRY' ||
      code === 'SQLITE_CONSTRAINT' ||
      code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      number === 1 ||
      number === 1062 ||
      number === 2601 ||
      number === 2627
    )
      return true;
    current = record.cause ?? record.originalError;
  }
  return false;
}

function normalizeStoredErrorCategory(
  value: unknown,
): NotificationProviderErrorCategory | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return isNotificationProviderErrorCategory(value) ? value : 'unknown';
}
