import { randomUUID } from 'node:crypto';

import { describeMigration } from '@nocobase/app-testing/server';
import type { DatabaseConnection } from '@nocobase/db';
import { expect } from 'vitest';

import { aiEmployeeMigrations } from './support/migrations.js';

/** The thread a row inserted without one gets, as the plugin's repositories insert it. */
async function defaultThread(connection: DatabaseConnection): Promise<number> {
  const sessionId = randomUUID();
  await connection.query
    .insertInto('aiConversations')
    .values({ sessionId })
    .execute();
  const row = await connection.query
    .selectFrom('aiConversations')
    .select(['thread'])
    .where('sessionId', '=', sessionId)
    .executeTakeFirst<{ thread: number | string }>();
  return Number(row?.thread);
}

describeMigration('202610070002_default_ai_conversation_thread_to_one', {
  sources: aiEmployeeMigrations,
  up: async ({ connection }) => {
    await expect(defaultThread(connection)).resolves.toBe(1);
  },
  down: async ({ connection }) => {
    await expect(defaultThread(connection)).resolves.toBe(0);
  },
});
