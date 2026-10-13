/**
 * The project manager's settings, kept in `studioSettings` under `projectManager` (`ProjectManagerSettings`): which
 * agents it runs with, its allocation principles (null for the built-in ones) and the comment run limit. Read
 * leniently: what is missing or unreadable takes its default.
 */
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';
import { defaultIdentity } from './texts.js';

import {
  COMMENT_RUN_LIMIT_MAX,
  DEFAULT_FALLBACK_AFTER_SECONDS,
  DEFAULT_DELEGATION_QUEUE_TIMEOUT_SECONDS,
  DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX,
  FALLBACK_AFTER_SECONDS_MAX,
  DEFAULT_COMMENT_RUN_LIMIT,
  PRINCIPLES_MAX,
  type ProjectManagerPatch,
  type ProjectManagerSettings,
} from '../../../shared/project-manager.js';

const SETTINGS_TABLE = 'studioSettings';
export const PROJECT_MANAGER_SETTING = 'projectManager';

export const DEFAULT_MANAGER_SETTINGS: ProjectManagerSettings = {
  ...defaultIdentity(),
  firstChoiceAgentId: null,
  fallbackAgentId: null,
  principles: null,
  commentRunLimit: DEFAULT_COMMENT_RUN_LIMIT,
  fallbackAfterSeconds: DEFAULT_FALLBACK_AFTER_SECONDS,
  delegationQueueTimeoutSeconds: DEFAULT_DELEGATION_QUEUE_TIMEOUT_SECONDS,
};

/** The body of `PATCH /api/projectManager`. */
export const ProjectManagerPatchSchema: z.ZodType<ProjectManagerPatch> = z
  .strictObject({
    name: z.string().trim().min(1).max(200).meta({
      description:
        'The persisted project manager name, 1–200 characters after trimming; independent of the viewer’s language.',
    }),
    description: z
      .string()
      .max(10_000)
      .nullable()
      .transform((value) =>
        value === null || value.trim() === '' ? null : value,
      )
      .meta({
        description:
          'The persisted description, at most 10,000 characters; null, an empty string or whitespace clears it.',
      }),
    delegationQueueTimeoutSeconds: z
      .number()
      .int()
      .min(1)
      .max(DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX)
      .meta({
        description:
          'Seconds a manager-delegated step may remain queued before withdrawal and an automatic reply (default 600); changes apply on the next sweep.',
      }),
    fallbackAfterSeconds: z
      .number()
      .int()
      .min(1)
      .max(FALLBACK_AFTER_SECONDS_MAX)
      .meta({
        description:
          'Seconds the first choice may wait in the runnable queue before an idle fallback can claim it (default 120).',
      }),
    firstChoiceAgentId: z.string().min(1).max(64).nullable().meta({
      description:
        'The enabled agent whose tool and model the project manager runs with.',
    }),
    fallbackAgentId: z.string().min(1).max(64).nullable().meta({
      description:
        'The enabled agent it runs with after the first choice queue delay, or immediately when no compatible runner can take the first choice; null for none.',
    }),
    principles: z.string().max(PRINCIPLES_MAX).nullable().meta({
      description:
        'The allocation principles; null (or the built-in text) restores the built-in ones.',
    }),
    commentRunLimit: z.number().int().min(1).max(COMMENT_RUN_LIMIT_MAX).meta({
      description:
        'How many runs agents’ comments may start on one issue within 24 hours before its owner is asked to continue.',
    }),
  })
  .partial();

function parse(value: unknown): Record<string, unknown> {
  let raw = value;
  if (typeof raw === 'string')
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      raw = null;
    }
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value : null;

/** The stored settings, the defaults filling what is missing or unreadable. */
export function settingsOf(
  value: unknown,
  locale = 'en-US',
): ProjectManagerSettings {
  const raw = parse(value);
  const defaults = defaultIdentity(locale);
  const limit = raw.commentRunLimit;
  return {
    name:
      typeof raw.name === 'string' &&
      raw.name.trim().length > 0 &&
      raw.name.trim().length <= 200
        ? raw.name.trim()
        : defaults.name,
    description:
      raw.description === null
        ? null
        : typeof raw.description === 'string' &&
            raw.description.length <= 10_000
          ? text(raw.description)
          : defaults.description,
    delegationQueueTimeoutSeconds:
      typeof raw.delegationQueueTimeoutSeconds === 'number' &&
      Number.isInteger(raw.delegationQueueTimeoutSeconds) &&
      raw.delegationQueueTimeoutSeconds >= 1 &&
      raw.delegationQueueTimeoutSeconds <= DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX
        ? raw.delegationQueueTimeoutSeconds
        : DEFAULT_DELEGATION_QUEUE_TIMEOUT_SECONDS,
    firstChoiceAgentId: text(raw.firstChoiceAgentId),
    fallbackAgentId: text(raw.fallbackAgentId),
    principles: text(raw.principles),
    fallbackAfterSeconds:
      typeof raw.fallbackAfterSeconds === 'number' &&
      Number.isInteger(raw.fallbackAfterSeconds) &&
      raw.fallbackAfterSeconds >= 1 &&
      raw.fallbackAfterSeconds <= FALLBACK_AFTER_SECONDS_MAX
        ? raw.fallbackAfterSeconds
        : DEFAULT_FALLBACK_AFTER_SECONDS,
    commentRunLimit:
      typeof limit === 'number' &&
      Number.isInteger(limit) &&
      limit >= 1 &&
      limit <= COMMENT_RUN_LIMIT_MAX
        ? limit
        : DEFAULT_COMMENT_RUN_LIMIT,
  };
}

export async function readManagerSettings(
  conn: DatabaseConnection,
  locale = 'en-US',
): Promise<ProjectManagerSettings> {
  const row = await conn.query
    .selectFrom(SETTINGS_TABLE)
    .select('value')
    .where('key', '=', PROJECT_MANAGER_SETTING)
    .executeTakeFirst();
  return settingsOf(row?.value ?? null, locale);
}

export async function writeManagerSettings(
  conn: DatabaseConnection,
  settings: ProjectManagerSettings,
): Promise<void> {
  const at = new Date();
  const existing = await conn.query
    .selectFrom(SETTINGS_TABLE)
    .select(['key', 'value'])
    .where('key', '=', PROJECT_MANAGER_SETTING)
    .executeTakeFirst();
  const value = JSON.stringify({ ...parse(existing?.value), ...settings });
  if (existing)
    await conn.query
      .updateTable(SETTINGS_TABLE)
      .set({ value, updatedAt: at })
      .where('key', '=', PROJECT_MANAGER_SETTING)
      .execute();
  else
    await conn.query
      .insertInto(SETTINGS_TABLE)
      .values({
        key: PROJECT_MANAGER_SETTING,
        value,
        createdAt: at,
        updatedAt: at,
      })
      .execute();
}
