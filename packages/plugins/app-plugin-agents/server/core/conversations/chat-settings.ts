/**
 * Who new conversations go to: the team's system default chat agent (`agSettings`, key `chat`) and each person's own
 * default (`agChatPreferences`).
 */
import type { DatabaseConnection } from '@nocobase/db';
import { z } from 'zod';

import type {
  ChatPreferences,
  ChatPreferencesPatch,
  ChatSettings,
  ChatSettingsPatch,
} from '../../../shared/conversations.js';
import type { Clock } from '../../kernel/clock.js';
import { conflict, forbidden, invalid } from '../../kernel/errors.js';
import type { TxRunner } from '../../kernel/tx.js';
import { asJson, jsonObject } from '../../kernel/values.js';
import type { AgentService } from '../agents/index.js';
import { findAgent } from '../agents/index.js';
import { isAvailableToEveryone } from '../agents/agent.store.js';
import { preferencesRepo, settingsRepo } from './conversation.store.js';

const CHAT_SETTINGS_KEY = 'chat';

export const ChatPreferencesPatchSchema: z.ZodType<ChatPreferencesPatch> = z
  .strictObject({
    defaultAgentId: z.string().min(1).max(64).nullable(),
  })
  .partial();

export const ChatSettingsPatchSchema: z.ZodType<ChatSettingsPatch> = z
  .strictObject({
    defaultAgentId: z.string().min(1).max(64).nullable(),
  })
  .partial();

export interface ChatSettingsService {
  settings(conn?: DatabaseConnection): Promise<ChatSettings>;
  /** Who may change it is the route's concern (`agents.agents` manage). */
  updateSettings(
    byUserId: string,
    patch: ChatSettingsPatch,
  ): Promise<ChatSettings>;
  preferences(
    userId: string,
    conn?: DatabaseConnection,
  ): Promise<ChatPreferences>;
  /** The default agent must be one the person may wake. */
  updatePreferences(
    userId: string,
    patch: ChatPreferencesPatch,
  ): Promise<ChatPreferences>;
}

export function createChatSettingsService(deps: {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly agents: Pick<AgentService, 'mayInvoke'>;
}): ChatSettingsService {
  const { tx, clock } = deps;

  async function readSettings(conn: DatabaseConnection): Promise<ChatSettings> {
    const row = await settingsRepo(conn).findOne({
      filter: { key: CHAT_SETTINGS_KEY },
    });
    const value = jsonObject(row?.value);
    return {
      defaultAgentId:
        typeof value.defaultAgentId === 'string' ? value.defaultAgentId : null,
    };
  }

  async function readPreferences(
    conn: DatabaseConnection,
    userId: string,
  ): Promise<ChatPreferences> {
    const row = await preferencesRepo(conn).findOne({ filter: { userId } });
    return {
      defaultAgentId: row?.defaultAgentId ?? null,
    };
  }

  async function lockDefaults(conn: DatabaseConnection): Promise<void> {
    // Write before reading: row locks serialize settings writers without changing an agent's revision.
    const result = await settingsRepo(conn).updateMany({
      filter: { key: CHAT_SETTINGS_KEY },
      values: { key: CHAT_SETTINGS_KEY },
    });
    if (result.updatedCount === 0) {
      try {
        await settingsRepo(conn).createOne({
          values: {
            key: CHAT_SETTINGS_KEY,
            value: asJson({}),
            updatedById: null,
            updatedAt: clock.now().toISOString(),
          },
        });
      } catch (error) {
        // Two first writers may both see no row; the unique key lets one win.
        const code =
          error && typeof error === 'object' && 'code' in error
            ? error.code
            : null;
        if (
          code === '23505' ||
          code === 'ER_DUP_ENTRY' ||
          code === 'SQLITE_CONSTRAINT_UNIQUE' ||
          code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
        )
          throw conflict(
            'Chat defaults changed concurrently. Reload and try again.',
          );
        throw error;
      }
    }
  }

  return {
    settings: (conn) => readSettings(conn ?? tx.read()),

    updateSettings: (byUserId, patch) =>
      tx.run(async ({ conn }) => {
        await lockDefaults(conn);
        const current = await readSettings(conn);
        const next: ChatSettings = { ...current, ...patch };
        if (next.defaultAgentId !== null) {
          const agent = await findAgent(conn, next.defaultAgentId);
          if (!agent || agent.status !== 'enabled')
            throw invalid('defaultAgentId names no enabled agent.', {
              field: 'defaultAgentId',
            });
          if (!(await isAvailableToEveryone(conn, agent.id)))
            throw invalid(
              'Only agents available to everyone can be the system default.',
              {
                field: 'defaultAgentId',
                reason: 'SYSTEM_DEFAULT_REQUIRES_EVERYONE',
              },
            );
        }
        const now = clock.now().toISOString();
        const values = {
          value: asJson(next),
          updatedById: byUserId,
          updatedAt: now,
        };
        const existing = await settingsRepo(conn).findOne({
          filter: { key: CHAT_SETTINGS_KEY },
        });
        if (existing)
          await settingsRepo(conn).updateMany({
            filter: { key: CHAT_SETTINGS_KEY },
            values,
          });
        else
          await settingsRepo(conn).createOne({
            values: { key: CHAT_SETTINGS_KEY, ...values },
          });
        return next;
      }),

    preferences: (userId, conn) => readPreferences(conn ?? tx.read(), userId),

    updatePreferences: (userId, patch) =>
      tx.run(async ({ conn }) => {
        const current = await readPreferences(conn, userId);
        const next: ChatPreferences = { ...current, ...patch };
        if (
          patch.defaultAgentId !== undefined &&
          next.defaultAgentId !== null
        ) {
          const agent = await findAgent(conn, next.defaultAgentId);
          if (!agent)
            throw invalid('defaultAgentId names no agent.', {
              field: 'defaultAgentId',
            });
          if (!deps.agents.mayInvoke(agent, userId))
            throw forbidden('You may not chat with this agent.');
        }
        const values = {
          defaultAgentId: next.defaultAgentId,
          updatedAt: clock.now().toISOString(),
        };
        const existing = await preferencesRepo(conn).findOne({
          filter: { userId },
        });
        if (existing)
          await preferencesRepo(conn).updateMany({
            filter: { userId },
            values,
          });
        else
          await preferencesRepo(conn).createOne({
            values: { userId, ...values },
          });
        return next;
      }),
  };
}
