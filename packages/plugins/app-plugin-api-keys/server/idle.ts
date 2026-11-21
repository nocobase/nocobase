/**
 * Disabling keys nobody uses, when the rules turn it on (`idleDisableDays`). Run once a day, it works from the data,
 * so a day it does not run is caught up the next:
 *
 * - A key's idle time counts from the latest of its last use, its creation, and when the rule was turned on or
 *   changed: idleness before the rule does not count.
 * - Idle for the rule's days less a week, and not reminded since it was last used, its person is reminded: the owner
 *   of a personal key, the owner of a system key.
 * - Idle for the rule's days and reminded at least a week before, it is disabled. Every key so has a week's notice,
 *   even after the sweep did not run for a while.
 * - Used after a reminder, the reminder no longer counts.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ApiKeysConfig } from './scoped-keys.js';
import { readRules } from './rules.js';
import type { SystemApiKeys } from './system-keys.js';

const DAY = 86_400_000;
/** The notice a key gets before it is disabled for being idle. */
export const IDLE_NOTICE_DAYS = 7;

/** A reminder: the key `keyName` of `userId` (its holder or owner) is disabled on `disableAt` unless used. */
export interface IdleReminder {
  readonly userId: string;
  readonly keyId: string;
  readonly keyName: string | null;
  readonly system: boolean;
  readonly disableAt: Date;
}

export interface IdleSweepResult {
  readonly reminded: number;
  readonly disabled: number;
}

interface KeyRow {
  readonly id: string;
  readonly name: string | null;
  readonly referenceId: string;
  readonly createdAt: unknown;
  readonly lastRequest: unknown;
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

  /** Reminds about and disables idle keys as of `now`. */
  async sweep(now: Date = new Date()): Promise<IdleSweepResult> {
    const db = this.options.connection();
    const rules = await readRules(db, this.options.config());
    const days = rules.idleDisableDays;
    if (days === null) return { reminded: 0, disabled: 0 };
    const since = time(rules.idleSince) ?? now.getTime();
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
          'lastRequest',
          'metadata',
        ])
        .where('configId', '=', 'default')
        .execute()) as unknown as (KeyRow & { enabled: unknown })[]
    ).filter((key) => key.enabled === true || Number(key.enabled) === 1);
    const services = new Set(
      (
        await db.query
          .selectFrom('user')
          .select(['id'])
          .where('kind', '=', 'service')
          .execute()
      ).map((row) => String(row.id)),
    );
    let reminded = 0;
    let disabled = 0;
    for (const key of keys) {
      const systemKey = system.get(key.id);
      // Another service account's key is the application's own, which these rules do not touch.
      if (!systemKey && services.has(key.referenceId)) continue;
      const lastUse = time(key.lastRequest);
      const start = Math.max(lastUse ?? 0, time(key.createdAt) ?? 0, since);
      const idle = (now.getTime() - start) / DAY;
      const metadata = metadataOf(key.metadata);
      const remindedAt = systemKey
        ? systemKey.remindedAt
        : time(metadata.idleRemindedAt);
      // A reminder counts until the key is used again.
      const reminder =
        remindedAt !== null && remindedAt > (lastUse ?? 0) ? remindedAt : null;
      if (idle >= days && reminder !== null) {
        if (now.getTime() - reminder < IDLE_NOTICE_DAYS * DAY) continue;
        if (systemKey)
          await this.options.systemKeys.disable(systemKey.identityId, null, {
            reason: 'idle',
            idleDays: days,
          });
        else
          await db.query
            .updateTable('apikey')
            .set({ enabled: false, updatedAt: now })
            .where('id', '=', key.id)
            .execute();
        disabled += 1;
        continue;
      }
      if (idle < days - IDLE_NOTICE_DAYS || reminder !== null) continue;
      const recipient = systemKey ? systemKey.ownerId : key.referenceId;
      if (recipient)
        await this.options.remind?.({
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
        await db.query
          .updateTable('apikey')
          .set({
            metadata: JSON.stringify({
              ...metadata,
              idleRemindedAt: now.toISOString(),
            }),
          })
          .where('id', '=', key.id)
          .execute();
      reminded += 1;
    }
    return { reminded, disabled };
  }
}
