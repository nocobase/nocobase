import { appendFile } from 'node:fs/promises';
import type { Knex } from 'knex';
import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => h?.close());

it.each([1, 10, 50])(
  'keeps page reads fixed with %s runners and agents, without writes',
  async (n) => {
    const counts = new Map<string, number>([
      ['/agents', 6],
      ['/agents/available', 5],
      ['/agents/runners', 4],
      ['/agents/runners/:id', 5],
      ['/agents/runners/:id/runs', 2],
    ]);
    h = await createHarness();
    const models = Array.from({ length: n }, (_, index) => ({
      id: `quota-model-${index}`,
    }));
    let runnerId = '';
    for (let index = 0; index < n; index++) {
      runnerId = (
        await h.registerRunner({
          ownerUserId: 'alice',
          trust: 'team',
          tools: [{ kind: 'codex', authenticated: true, models }],
        })
      ).runnerId;
    }
    for (const agent of await h.services.agents.list())
      await h.enableAgent(agent.id);
    const client = await h.database.connection().client<Knex>();
    for (const endpoint of [
      '/agents',
      '/agents/available',
      '/agents/runners',
      `/agents/runners/${runnerId}`,
      `/agents/runners/${runnerId}/runs`,
    ]) {
      const request = () =>
        h.request('GET', endpoint, {
          user: 'alice',
          can: ['agents.agents/read', 'agents.runners/read'],
        });
      await request();
      for (
        let sample = 0;
        sample < Number(process.env.PM480_COST_SAMPLES ?? 1);
        sample++
      ) {
        const sql: string[] = [];
        const listen = (query: { sql: string }) => sql.push(query.sql);
        client.on('query', listen);
        const start = performance.now();
        const result = await request();
        const ms = performance.now() - start;
        client.off('query', listen);
        expect(result.status).toBe(200);
        const name = endpoint.replace(runnerId, ':id');
        const reads = sql.filter((query) => /^select/i.test(query)).length;
        const writes = sql.filter((query) =>
          /^(insert|update|delete)/i.test(query),
        ).length;
        expect(writes).toBe(0);
        expect(reads).toBe(counts.get(name));
        if (process.env.PM480_SQL_REPORT)
          await appendFile(
            process.env.PM480_SQL_REPORT,
            `${JSON.stringify({ n, endpoint: name, queries: reads, writes, transactions: sql.filter((query) => /^begin/i.test(query)).length, locks: sql.filter((query) => /for update|for share/i.test(query)).length, ms: Math.round(ms * 100) / 100, bytes: JSON.stringify(result.body).length })}\n`,
          );
      }
    }
  },
);
