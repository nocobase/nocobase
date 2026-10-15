import { appendFile } from 'node:fs/promises';
import { afterEach, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { claim, createHarness, type Harness } from './harness.js';
let h: Harness;
afterEach(async () => h?.close());
it('measures the existing lifecycle SQL on a warm migrated database', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runner = await h.registerRunner({
    features: [
      'workspaceKey',
      'input',
      'steer',
      'checkout',
      'directories',
      'attachments',
      'skills',
      'secrets',
    ],
  });
  const runId = await h.enqueue(agentId);
  const client = await h.database.connection().client<Knex>();
  async function measure<T>(name: string, action: () => Promise<T>) {
    const queries: string[] = [];
    const listener = (q: { sql: string }) => queries.push(q.sql);
    client.on('query', listener);
    try {
      return await action();
    } finally {
      client.off('query', listener);
      if (process.env.PM385_SQL_REPORT)
        await appendFile(
          process.env.PM385_SQL_REPORT,
          JSON.stringify({
            dialect: h.database.connection().dialect,
            name,
            statements: queries.length,
            reads: queries.filter((q) => /^\s*select/i.test(q)).length,
            writes: queries.filter((q) => /^\s*(insert|update|delete)/i.test(q))
              .length,
            transactions: queries.filter((q) => /^begin/i.test(q)).length,
            commits: queries.filter((q) => /^commit/i.test(q)).length,
            rollbacks: queries.filter((q) => /^rollback/i.test(q)).length,
            locks: queries.filter((q) => /for update|for share/i.test(q))
              .length,
            metadataReads: queries.filter(
              (q) =>
                /^\s*select/i.test(q) &&
                /sqlite_schema|__nocobase_collection_metadata/i.test(q),
            ).length,
            sql: queries,
          }) + '\n',
        );
    }
  }
  const [payload] = await measure('claim', () => claim(h, runner));
  await measure('start', () =>
    h.services.reports.start({ id: runner.runnerId }, runId, {
      workDir: '/work',
      acceptsInput: true,
    }),
  );
  await h.database
    .connection()
    .query.updateTable('agRunInputs')
    .set({ handledAt: h.clock.now().toISOString() })
    .where('runId', '=', runId)
    .execute();
  await measure('status-empty', () =>
    h.services.reports.status({ id: runner.runnerId }, runId),
  );
  await measure('http-status-empty', () =>
    h.request('GET', `/agents/runners/runs/${runId}/status`, {
      runnerKey: runner.key,
    }),
  );
  const appended = await measure('ordinary-append', () =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Continue',
        payload: { commentId: 'cost-comment' },
      },
    }),
  );
  await measure('events', () =>
    h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 1,
          at: h.clock.now().toISOString(),
          type: 'status',
          content: 'event',
        },
      ],
    }),
  );
  await measure('status', () =>
    h.services.reports.status({ id: runner.runnerId }, runId),
  );
  await measure('status-redelivery', () =>
    h.services.reports.status({ id: runner.runnerId }, runId),
  );
  await measure('lease', () =>
    h.services.reports.lease({ id: runner.runnerId }, runId),
  );
  const result = await measure('complete', () =>
    h.services.reports.complete({ id: runner.runnerId }, runId, {
      summary: 'done',
      handledInputIds: [
        ...payload.inputs.map((i: { id: string }) => i.id),
        appended.inputId!,
      ],
    }),
  );
  expect(result.status).toBe('completed');
});
