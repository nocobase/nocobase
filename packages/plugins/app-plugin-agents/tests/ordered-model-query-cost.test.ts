import { afterEach, expect, it } from 'vitest';
import { createHarness, type Harness } from './harness.js';
import { sessionsRepo } from '../server/core/runs/run.store.js';

let h: Harness;
afterEach(async () => h?.close());

it.each([
  { count: 1, machines: 2, affinity: true },
  { count: 10, machines: 2, affinity: true },
  { count: 50, machines: 2, affinity: true },
  { count: 10, machines: 12, affinity: true },
  { count: 50, machines: 2, affinity: false },
])(
  'bounds ordered-model admission for $count tasks, $machines machines (affinity: $affinity)',
  async ({ count, machines, affinity }) => {
    h = await createHarness();
    const agent = await h.createAgent({
      modelEntries: [
        { tool: 'claude', model: null },
        { tool: 'codex', model: null },
      ],
    });
    h.services.selectionPolicies.register(agent, async () => ({
      fallbackAfterSeconds: 120,
    }));
    const original = await h.registerRunner({
      tools: [{ kind: 'codex', authenticated: true }],
    });
    const claimant = await h.registerRunner();
    for (let i = 2; i < machines; i++) await h.registerRunner();
    const runs: string[] = [];
    for (let i = 0; i < count; i++) {
      const subjectId = `task-${i}`;
      runs.push(await h.enqueue(agent, subjectId));
      if (affinity)
        await sessionsRepo(h.database.connection()).createOne({
          values: {
            id: `prior-${i}`,
            agentId: agent,
            runnerId: original.runnerId,
            subjectKind: 'sample',
            subjectId,
            threadScope: 'root',
            sessionId: 'prior',
            workDir: '/fixed',
            branch: null,
            fingerprint: null,
            poisoned: false,
            updatedAt: h.clock.now().toISOString(),
          },
        });
    }
    const assembled = new Set<string>();
    const context = h.services.subjects.get('sample')!.context;
    const assemble = context.assemble;
    context.assemble = async (conn, input) => {
      assembled.add(input.run.subject.id);
      return assemble(conn, input);
    };
    const runner = await h.services.runners.authenticate(claimant.key, {
      touch: false,
    });
    type Query = { sql: string };
    const knex = await h.database.connection().client<{
      on(event: 'query', listener: (query: Query) => void): void;
      off(event: 'query', listener: (query: Query) => void): void;
      on(
        event: 'query-response',
        listener: (response: unknown, query: Query) => void,
      ): void;
      off(
        event: 'query-response',
        listener: (response: unknown, query: Query) => void,
      ): void;
    }>();
    let selects = 0;
    let rows = 0;
    const writes = { insert: 0, update: 0, delete: 0 };
    let transactions = 0;
    const onQuery = ({ sql }: Query) => {
      if (/^\s*begin\b/iu.test(sql)) transactions++;
      if (!/["`]ag_/u.test(sql)) return;
      for (const kind of ['insert', 'update', 'delete'] as const)
        if (new RegExp(`^\\s*${kind}\\b`, 'iu').test(sql)) writes[kind]++;
    };
    const onResponse = (response: unknown, { sql }: Query) => {
      if (
        /^\s*select\b/iu.test(sql) &&
        /["`]ag_/u.test(sql) &&
        !/information_schema|pg_catalog/u.test(sql)
      ) {
        selects++;
        rows += Array.isArray(response)
          ? response.length
          : response == null
            ? 0
            : 1;
      }
    };
    knex.on('query-response', onResponse);
    knex.on('query', onQuery);
    try {
      const payloads = await h.services.claims.claim(runner, 1);
      expect(payloads.map((p) => p.run.id)).toEqual([runs[0]]);
      expect(payloads[0].tool.kind).toBe('claude');
    } finally {
      knex.off('query-response', onResponse);
      knex.off('query', onQuery);
    }
    process.stdout.write(
      `ordered-model-cost ${JSON.stringify({ count, machines, affinity, selects, rows, assembledTasks: assembled.size, writes, transactions })}\n`,
    );
    expect(selects).toBeLessThanOrEqual(35);
    expect(rows).toBeLessThanOrEqual(3 * count + 3 * machines + 30);
    expect(assembled).toEqual(new Set(['task-0']));
    // This zero-resource fixture has no skill/variable delivery audit inserts.
    expect(writes).toEqual({ insert: 2, update: 5, delete: 1 });
    expect(transactions).toBe(1);
  },
);
