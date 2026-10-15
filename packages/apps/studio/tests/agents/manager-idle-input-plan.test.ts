// @vitest-environment node
// Input semantics run on every dialect; SQLite EXPLAIN verifies the existing input index access path.
import type { Knex } from 'knex';
import { expect, it } from 'vitest';
import { createBridgeHarness } from './bridge-harness.js';
import { idleFixture } from './idle-fixture.js';
import { idleCandidates } from '../../server/agents/manager/idle.js';

it('probes only issue runs for newer inputs despite thousands of unrelated inputs', async () => {
  const h = await createBridgeHarness();
  try {
    await h.addUser('alice');
    await h.createAgent();
    const target = await idleFixture(h);
    const unrelated = await idleFixture(h);
    const conn = h.database.connection();
    const newer = new Date(
      Math.max(target.finishedAt.getTime(), unrelated.finishedAt.getTime()) + 1,
    );
    for (let offset = 0; offset < 5000; offset += 100) {
      await conn.repository('agRunInputs').createMany({
        values: Array.from({ length: 100 }, (_, index) => ({
          id: `unrelated-${offset + index}`,
          runId: unrelated.managerRunId,
          type: 'signal',
          actorKind: 'system',
          actorId: 'system',
          actorName: 'Test',
          text: 'Unrelated activity',
          createdAt: newer,
        })),
      });
    }
    const candidates = () => idleCandidates(conn, new Date());
    const client = await conn.client<Knex>();
    const statements: { sql: string; bindings: Knex.RawBinding[] }[] = [];
    const listener = (query: (typeof statements)[number]) => {
      if (/^select\b/iu.test(query.sql) && query.sql.includes('ag_run_inputs'))
        statements.push(query);
    };
    client.on('query', listener);
    let rows;
    try {
      rows = await candidates().execute();
    } finally {
      client.removeListener('query', listener);
    }
    expect(rows.map((row) => String(row.id))).toContain(target.issue.id);
    expect(rows.map((row) => String(row.id))).not.toContain(unrelated.issue.id);
    if (conn.dialect === 'sqlite') {
      expect(statements).toHaveLength(1);
      const query = statements[0]!;
      const plan = (await client.raw(
        `EXPLAIN QUERY PLAN ${query.sql}`,
        query.bindings,
      )) as { detail: string }[];
      expect(plan.some((row) => /SCAN input\b/iu.test(row.detail))).toBe(false);
      expect(plan.map((row) => row.detail)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /SEARCH input_?run USING .*idx_ag_runs_subject_kind_subject_id.*subject_kind=\? AND subject_id=\?/iu,
          ),
          expect.stringMatching(
            /SEARCH input(?: EXISTS)? USING .*idx_ag_run_inputs_run_id_created_at.*run_id=\? AND created_at>\?/iu,
          ),
        ]),
      );
      process.stdout.write(
        `PM313 input query plan: ${JSON.stringify({ query, plan })}\n`,
      );
    }
    await conn.repository('agRunInputs').updateMany({
      filter: { runId: target.managerRunId },
      values: { createdAt: target.finishedAt },
    });
    expect(
      (await candidates().execute()).map((row) => String(row.id)),
    ).toContain(target.issue.id);
    await conn.repository('agRunInputs').updateMany({
      filter: { runId: target.managerRunId },
      values: { createdAt: newer },
    });
    expect(
      (await candidates().execute()).map((row) => String(row.id)),
    ).not.toContain(target.issue.id);
  } finally {
    await h.close();
  }
}, 120_000);
