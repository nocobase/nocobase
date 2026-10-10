/**
 * Who new conversations go to: the team's system default chat agent and online fallback agent (`agSettings`, key
 * `chat`) and each person's own default (`agChatPreferences`).
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
import { forbidden, invalid } from '../../kernel/errors.js';
import type { TxRunner } from '../../kernel/tx.js';
import { asJson, jsonObject } from '../../kernel/values.js';
import type { AgentService } from '../agents/index.js';
import { findAgent } from '../agents/index.js';
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
    onlineFallbackAgentId: z.string().min(1).max(64).nullable(),
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
      onlineFallbackAgentId:
        typeof value.onlineFallbackAgentId === 'string'
          ? value.onlineFallbackAgentId
          : null,
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

  return {
    settings: (conn) => readSettings(conn ?? tx.read()),

    updateSettings: (byUserId, patch) =>
      tx.run(async ({ conn }) => {
        const current = await readSettings(conn);
        const next: ChatSettings = { ...current, ...patch };
        if (next.defaultAgentId !== null) {
          const agent = await findAgent(conn, next.defaultAgentId);
          if (!agent || agent.archivedAt)
            throw invalid('defaultAgentId names no agent.', {
              field: 'defaultAgentId',
            });
        }
        if (
          patch.onlineFallbackAgentId !== undefined &&
          next.onlineFallbackAgentId !== null
        ) {
          const agent = await findAgent(conn, next.onlineFallbackAgentId);
          if (!agent || agent.archivedAt)
            throw invalid('onlineFallbackAgentId names no agent.', {
              field: 'onlineFallbackAgentId',
            });
          if (agent.type !== 'online')
            throw invalid('onlineFallbackAgentId must name an online agent.', {
              field: 'onlineFallbackAgentId',
            });
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
