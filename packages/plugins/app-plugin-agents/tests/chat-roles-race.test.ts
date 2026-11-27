/**
 * Making an agent the team default and limiting who may chat with it, saved at the same moment by two managers on two
 * connections: exactly one wins, and the team default never ends up limited to roles. Both saves lock the agent's row
 * before reading the other's state (`lockAgentRow`). PostgreSQL's real lock waits are observed, so the test runs there;
 * SQLite serializes every write transaction, and `chat-roles.test.ts` covers the saves one after another.
 */
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import { afterEach, describe, expect, it } from 'vitest';

import { lockAgentRow } from '../server/core/agents/index.js';
import { createHarness, type Harness } from './harness.js';

interface Raw {
  raw(sql: string): Promise<{ rows: Record<string, unknown>[] }>;
}

const POSTGRES = testDatabaseDialect() === 'postgres';

describe('team default and chat roles saved concurrently', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  it.runIf(POSTGRES)(
    'lets exactly one of the two saves through, never leaving a limited team default',
    async () => {
      h = await createHarness();
      const agentId = await h.createAgent({
        name: 'Sales',
        description: 'Answers questions.',
        source: 'runner',
        status: 'enabled',
      });
      const { revision } = await h.services.agents.get(agentId);
      const knex = await h.database.connection().client<Raw>();

      // A third transaction holds the agent's row, so both saves start before either can pass its check.
      let holderPid = 0;
      let release!: () => void;
      const resume = new Promise<void>((resolve) => {
        release = resolve;
      });
      const holding = h.services.tx.run(async ({ conn }) => {
        await lockAgentRow(conn, agentId);
        const client = await conn.client<Raw>();
        const { rows } = await client.raw('select pg_backend_pid() as pid');
        holderPid = Number(rows[0]!.pid);
        await resume;
      });
      await expect.poll(() => holderPid).toBeGreaterThan(0);

      let saves: Promise<PromiseSettledResult<unknown>[]> | undefined;
      try {
        saves = Promise.allSettled([
          h.services.chat.updateSettings('admin', { defaultAgentId: agentId }),
          h.services.agents.update(agentId, 'admin', {
            chatRoles: ['sales'],
            expectedRevision: revision,
          }),
        ]);
        // Both saves wait on the held row before reading anything: the first behind the holder, the second in line
        // behind the first.
        await expect
          .poll(async () => {
            const result = await knex.raw(`select count(*) as waiting
              from pg_stat_activity
              where datname = current_database() and wait_event_type = 'Lock'
              and pid <> ${holderPid} and cardinality(pg_blocking_pids(pid)) > 0
              and query ilike 'update%ag_agents%'`);
            return Number(result.rows[0]!.waiting);
          })
          .toBe(2);
      } finally {
        release();
        await holding;
      }
      const [settings, limit] = await saves!;
      expect(
        [settings, limit].filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const loser = [settings, limit].find(
        (result) => result.status === 'rejected',
      ) as PromiseRejectedResult;
      expect(loser.reason).toMatchObject({
        details: {
          reason:
            settings.status === 'fulfilled'
              ? 'AGENT_TEAM_DEFAULT'
              : 'AGENT_CHAT_LIMITED',
        },
      });
      const teamDefault = (await h.services.chat.settings()).defaultAgentId;
      const { chatRoles } = await h.services.agents.get(agentId);
      expect(teamDefault === agentId && chatRoles !== null).toBe(false);
    },
  );
});
