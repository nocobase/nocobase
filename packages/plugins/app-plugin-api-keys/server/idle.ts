/**
 * Disabling keys nobody uses, by the idle rule (`idleDisableDays`) each key took when it was issued or last rotated:
 * turning the rule on, changing or turning it off acts on keys issued or rotated afterwards only. Run once a day, it
 * works from the data, so a day it does not run is caught up the next:
 *
 * - A key's idle time counts from the later of its last use and when its current value was issued.
 * - Idle for the rule's days less a week, and not reminded since it was last used, its person is reminded: the owner
 *   of a personal key, the owner of a system key.
 * - Idle for the rule's days and reminded at least a week before, it is disabled. Every key so has a week's notice,
 *   even after the sweep did not run for a while.
 * - Used after a reminder, the reminder no longer counts.
 */
import type { DatabaseConnection, UpdateQuery } from '@nocobase/db';

import type { ApiKeysConfig } from './scoped-keys.js';
import type { SystemApiKeys } from './system-keys.js';

const DAY = 86_400_000;
/** The notice a key gets before it is disabled for being idle. */
export const IDLE_NOTICE_DAYS = 7;

/** A reminder: the key `keyName` of `userId` (its holder or owner) is disabled on `disableAt` unless used. */
export interface IdleReminder {
  /** `idle`: disabled on `disableAt` unless used; `expiry`: a system key expires on `disableAt`. */
  readonly kind: 'idle' | 'expiry';
  readonly userId: string;
  readonly keyId: string;
  readonly keyName: string | null;
  readonly system: boolean;
  readonly disableAt: Date;
}

export interface IdleSweepResult {
  readonly reminded: number;
  readonly disabled: number;
  /** System keys whose owner was told they expire within a week. */
  readonly expiring: number;
  /** Notices to managers of managed keys delivered on another try. */
  readonly notices: number;
}

export interface IdleKeySnapshot {
  readonly id: string;
  readonly createdAt: unknown;
  readonly lastRequest: unknown;
}

/** Match the same issued value and last use that the sweep evaluated. */
export function unchangedIdleKey(
  connection: DatabaseConnection,
  key: IdleKeySnapshot,
): UpdateQuery {
  return connection.query
    .updateTable('apikey')
    .where('id', '=', key.id)
    .where('enabled', '=', true)
    .where('createdAt', '=', key.createdAt)
    .where(
      'lastRequest',
      key.lastRequest == null ? 'is' : '=',
      key.lastRequest ?? null,
    );
}

interface KeyRow extends IdleKeySnapshot {
  readonly name: string | null;
  readonly referenceId: string;
  readonly expiresAt: unknown;
  readonly metadata: unknown;
}

const time = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    !(value instanceof Date)
  )
    return null;
  const date =
    value instanceof Date
      ? value
      : new Date(
          typeof value === 'number' || /^\d+$/u.test(value)
            ? Number(value)
            : value,
        );
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

function metadataOf(value: unknown): Record<string, unknown> {
  let parsed = value;
  while (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      return {};
    }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? { ...(parsed as Record<string, unknown>) }
    : {};
}

export class IdleKeys {
  constructor(
    private readonly options: {
      readonly connection: () => DatabaseConnection;
      readonly config: () => ApiKeysConfig | undefined;
      readonly systemKeys: SystemApiKeys;
      /** Delivers a reminder; without one, reminders are only recorded. */
      readonly remind?: (reminder: IdleReminder) => Promise<void>;
    },
  ) {}

  /**
   * Reminds about and disables idle keys as of `now`, tells system key owners about keys expiring within a week, and
   * delivers notices to managers that failed before.
   */
  async sweep(now: Date = new Date()): Promise<IdleSweepResult> {
    const db = this.options.connection();
    const systemRows = await db.query
      .selectFrom('apiKeySystemKeys')
      .select(['identityId', 'keyId', 'ownerId', 'remindedAt'])
      .execute();
    const system = new Map(
      systemRows.map((row) => [
        String(row.keyId),
        {
          identityId: String(row.identityId),
          ownerId: typeof row.ownerId === 'string' ? row.ownerId : null,
          remindedAt: time(row.remindedAt),
        },
      ]),
    );
    const keys = (
      (await db.query
        .selectFrom('apikey')
        .select([
          'id',
          'name',
          'referenceId',
          'enabled',
          'createdAt',
          'expiresAt',
          'lastRequest',
          'metadata',
        ])
        .where('configId', '=', 'default')
        .execute()) as unknown as (KeyRow & { enabled: unknown })[]
    ).filter((key) => key.enabled === true || Number(key.enabled) === 1);
    let reminded = 0;
    let disabled = 0;
    let expiring = 0;
    for (const key of keys) {
      const systemKey = system.get(key.id);
      const metadata = metadataOf(key.metadata);
      if (systemKey && (await this.remindExpiry(key, systemKey, metadata, now)))
        expiring += 1;
      // A key issued before the rule, or while it was off, carries none and is left alone.
      const days =
        typeof metadata.idleDisableDays === 'number' &&
        metadata.idleDisableDays > 0
          ? metadata.idleDisableDays
          : null;
      if (days === null) continue;
      const lastUse = time(key.lastRequest);
      const start = Math.max(lastUse ?? 0, time(key.createdAt) ?? 0);
      const idle = (now.getTime() - start) / DAY;
      const remindedAt = systemKey
        ? systemKey.remindedAt
        : time(metadata.idleRemindedAt);
      // A reminder counts until the key is used again or gets a new value.
      const reminder =
        remindedAt !== null && remindedAt > start ? remindedAt : null;
      if (idle >= days && reminder !== null) {
        if (now.getTime() - reminder < IDLE_NOTICE_DAYS * DAY) continue;
        const changed = systemKey
          ? await this.options.systemKeys.disableIfIdle(
              systemKey.identityId,
              key,
              days,
              now,
            )
          : (
              await unchangedIdleKey(db, key)
                .set({ enabled: false, updatedAt: now })
                .execute()
            ).updatedCount;
        if (changed) disabled += 1;
        continue;
      }
      if (idle < days - IDLE_NOTICE_DAYS || reminder !== null) continue;
      const recipient = systemKey ? systemKey.ownerId : key.referenceId;
      if (recipient)
        await this.options.remind?.({
          kind: 'idle',
          userId: recipient,
          keyId: key.id,
          keyName: key.name,
          system: Boolean(systemKey),
          disableAt: new Date(
            Math.max(
              start + days * DAY,
              now.getTime() + IDLE_NOTICE_DAYS * DAY,
            ),
          ),
        });
      if (systemKey)
        await db.query
          .updateTable('apiKeySystemKeys')
          .set({ remindedAt: now })
          .where('identityId', '=', systemKey.identityId)
          .execute();
      else
        await unchangedIdleKey(db, key)
          .set({
            metadata: JSON.stringify({
              ...metadata,
              idleRemindedAt: now.toISOString(),
            }),
          })
          .execute();
      reminded += 1;
    }
    const notices = await this.options.systemKeys.deliverNotices();
    return { reminded, disabled, expiring, notices };
  }

  /**
   * Tells a system key's owner, once per expiry date, that the key expires within a week; a rotation renews the expiry
   * and so the reminder. Answers whether it told them.
   */
  private async remindExpiry(
    key: KeyRow,
    systemKey: { readonly ownerId: string | null },
    metadata: Record<string, unknown>,
    now: Date,
  ): Promise<boolean> {
    const expires = time(key.expiresAt);
    if (
      expires === null ||
      expires <= now.getTime() ||
      expires - now.getTime() > IDLE_NOTICE_DAYS * DAY ||
      !systemKey.ownerId
    )
      return false;
    const expiresAt = new Date(expires).toISOString();
    if (metadata.expiryRemindedFor === expiresAt) return false;
    // Kept on the caller's copy too, which may write the metadata again.
    metadata.expiryRemindedFor = expiresAt;
    await this.options.remind?.({
      kind: 'expiry',
      userId: systemKey.ownerId,
      keyId: key.id,
      keyName: key.name,
      system: true,
      disableAt: new Date(expires),
    });
    await unchangedIdleKey(this.options.connection(), key)
      .set({
        metadata: JSON.stringify(metadata),
      })
      .execute();
    return true;
  }
}
