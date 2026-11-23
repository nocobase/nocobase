/**
 * The rules for API keys an administrator sets in System settings › API keys › Rules, kept in one row of
 * `apiKeyRules`. Until someone saves them, the application's configuration (`apiKeys` in its config) applies. They
 * act on keys made or rotated afterwards; idle disabling acts on every key, counting idle time only from when it was
 * turned on or changed.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { ApiKeyRequestError, type ApiKeysConfig } from './scoped-keys.js';

/** The expiry a new key with permissions starts with, when no rule says otherwise. */
export const DEFAULT_EXPIRY_DAYS = 90;
const ROW = 'default';
const MAX_DAYS = 365;

/** The rules as they apply now. */
export interface ApiKeyRules {
  /** Whether a person may create a key that acts as them in full ("same as me"). */
  readonly allowSameAsMe: boolean;
  /** The longest a personal key with permissions may live, in days; null allows "never expires". */
  readonly personalMaxDays: number | null;
  /** The expiry a new personal key starts with, in days. */
  readonly personalDefaultDays: number;
  /** After how many days unused a key is disabled; null when keys are never disabled for being idle. */
  readonly idleDisableDays: number | null;
  /** When idle disabling was turned on or last changed: idle time before it does not count. */
  readonly idleSince: string | null;
  /** Whether an administrator saved these rules; otherwise they come from the configuration. */
  readonly saved: boolean;
}

/** What `PUT /api/apiKeys/rules` takes. */
export interface ApiKeyRulesInput {
  readonly allowSameAsMe: boolean;
  readonly personalMaxDays: number | null;
  readonly personalDefaultDays: number;
  readonly idleDisableDays: number | null;
}

interface RulesRow {
  readonly allowSameAsMe: unknown;
  readonly personalMaxDays: unknown;
  readonly personalDefaultDays: unknown;
  readonly idleDisableDays: unknown;
  readonly idleSince: unknown;
}

const days = (value: unknown): number | null =>
  value === null || value === undefined ? null : Number(value);

const iso = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

function fromConfig(config: ApiKeysConfig | undefined): ApiKeyRules {
  const max =
    typeof config?.maxScopedKeyDays === 'number' &&
    Number.isInteger(config.maxScopedKeyDays) &&
    config.maxScopedKeyDays > 0
      ? config.maxScopedKeyDays
      : null;
  return {
    allowSameAsMe: config?.allowSameAsMe === true,
    personalMaxDays: max,
    personalDefaultDays: Math.min(
      DEFAULT_EXPIRY_DAYS,
      max ?? DEFAULT_EXPIRY_DAYS,
    ),
    idleDisableDays: null,
    idleSince: null,
    saved: false,
  };
}

/** The rules now: the saved row, or the configuration when none was saved. */
export async function readRules(
  connection: DatabaseConnection,
  config: ApiKeysConfig | undefined,
): Promise<ApiKeyRules> {
  const row = await connection.query
    .selectFrom('apiKeyRules')
    .select([
      'allowSameAsMe',
      'personalMaxDays',
      'personalDefaultDays',
      'idleDisableDays',
      'idleSince',
    ])
    .where('id', '=', ROW)
    .executeTakeFirst<RulesRow>();
  if (!row) return fromConfig(config);
  const max = days(row.personalMaxDays);
  return {
    allowSameAsMe:
      row.allowSameAsMe === true || Number(row.allowSameAsMe) === 1,
    personalMaxDays: max,
    personalDefaultDays:
      days(row.personalDefaultDays) ??
      Math.min(DEFAULT_EXPIRY_DAYS, max ?? DEFAULT_EXPIRY_DAYS),
    idleDisableDays: days(row.idleDisableDays),
    idleSince: iso(row.idleSince),
    saved: true,
  };
}

function wholeDays(value: unknown, name: string, nullable: boolean) {
  if (value === null && nullable) return null;
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > MAX_DAYS
  )
    throw new ApiKeyRequestError(
      400,
      'INVALID_RULES',
      `${name} must be a whole number of days from 1 to ${MAX_DAYS}${nullable ? ', or null' : ''}.`,
    );
  return value;
}

/**
 * Saves the rules. Idle disabling counts from now when it is turned on or changed, so idle time before does not count.
 */
export async function writeRules(
  connection: DatabaseConnection,
  config: ApiKeysConfig | undefined,
  input: ApiKeyRulesInput,
  actorId: string,
  now: Date = new Date(),
): Promise<ApiKeyRules> {
  const personalMaxDays = wholeDays(
    input.personalMaxDays,
    'personalMaxDays',
    true,
  );
  const personalDefaultDays = wholeDays(
    input.personalDefaultDays,
    'personalDefaultDays',
    false,
  )!;
  const idleDisableDays = wholeDays(
    input.idleDisableDays,
    'idleDisableDays',
    true,
  );
  if (idleDisableDays !== null && idleDisableDays <= 7)
    throw new ApiKeyRequestError(
      400,
      'INVALID_RULES',
      'idleDisableDays must leave a week for the reminder: more than 7 days.',
    );
  if (personalMaxDays !== null && personalDefaultDays > personalMaxDays)
    throw new ApiKeyRequestError(
      400,
      'INVALID_RULES',
      'personalDefaultDays cannot be longer than personalMaxDays.',
    );
  const current = await readRules(connection, config);
  const idleSince =
    idleDisableDays === null
      ? null
      : idleDisableDays === current.idleDisableDays && current.idleSince
        ? new Date(current.idleSince)
        : now;
  const values = {
    allowSameAsMe: input.allowSameAsMe === true,
    personalMaxDays,
    personalDefaultDays,
    idleDisableDays,
    idleSince,
    updatedById: actorId,
    updatedAt: now,
  };
  const updated = await connection.query
    .updateTable('apiKeyRules')
    .set(values)
    .where('id', '=', ROW)
    .execute();
  if (!updated.updatedCount)
    await connection.query
      .insertInto('apiKeyRules')
      .values({ id: ROW, ...values })
      .execute();
  return readRules(connection, config);
}
