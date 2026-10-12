/**
 * The project manager's settings, kept in `studioSettings` under `projectManager` (`ProjectManagerSettings`): which
 * agents it runs with, its allocation principles (null for the built-in ones) and the comment run limit. Read
 * leniently: what is missing or unreadable takes its default.
 */
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import {
  COMMENT_RUN_LIMIT_MAX,
  DEFAULT_COMMENT_RUN_LIMIT,
  PRINCIPLES_MAX,
  type ProjectManagerPatch,
  type ProjectManagerSettings,
} from '../../../shared/project-manager.js';

const SETTINGS_TABLE = 'studioSettings';
export const PROJECT_MANAGER_SETTING = 'projectManager';

export const DEFAULT_MANAGER_SETTINGS: ProjectManagerSettings = {
  firstChoiceAgentId: null,
  fallbackAgentId: null,
  principles: null,
  commentRunLimit: DEFAULT_COMMENT_RUN_LIMIT,
};

/** The body of `PATCH /api/projectManager`. */
export const ProjectManagerPatchSchema: z.ZodType<ProjectManagerPatch> = z
  .strictObject({
    firstChoiceAgentId: z.string().min(1).max(64).nullable().meta({
      description:
        'The enabled agent whose tool and model the project manager runs with.',
    }),
    fallbackAgentId: z.string().min(1).max(64).nullable().meta({
      description:
        'The enabled agent it runs with when no runner can take the first choice’s work; null for none.',
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
export function settingsOf(value: unknown): ProjectManagerSettings {
  const raw = parse(value);
  const limit = raw.commentRunLimit;
  return {
    firstChoiceAgentId: text(raw.firstChoiceAgentId),
    fallbackAgentId: text(raw.fallbackAgentId),
    principles: text(raw.principles),
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
): Promise<ProjectManagerSettings> {
  const row = await conn.query
    .selectFrom(SETTINGS_TABLE)
    .select('value')
    .where('key', '=', PROJECT_MANAGER_SETTING)
    .executeTakeFirst();
  return settingsOf(row?.value ?? null);
}

export async function writeManagerSettings(
  conn: DatabaseConnection,
  settings: ProjectManagerSettings,
): Promise<void> {
  const at = new Date();
  const value = JSON.stringify(settings);
  const existing = await conn.query
    .selectFrom(SETTINGS_TABLE)
    .select('key')
    .where('key', '=', PROJECT_MANAGER_SETTING)
    .executeTakeFirst();
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
