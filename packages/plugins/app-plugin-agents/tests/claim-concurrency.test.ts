/**
 * Several runners polling one queue at once must not serialize on comment run chains. The queue is what a busy
 * project manager agent leaves behind: comment chains on many issues, some waiting for the owner's consent and some
 * not, an agent at its concurrency limit with dozens of runs queued, and a coding agent with work any runner may take.
 *
 * Every dialect checks the outcome and the cost: each claimable run is handed out once, the burst finishes in bounded
 * time, and the transactions that wrote are counted from the statements the application sent. A poll over work it
 * cannot take writes nothing, so the writes are bounded by the polls, not by the queue. On PostgreSQL the test also
 * samples lock waits.
 */
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import { afterEach, describe, expect, it } from 'vitest';

import type { Runner } from '../shared/runners.js';
import { createHarness, type Harness } from './harness.js';

interface QueryEvents {
  raw(sql: string): Promise<{ rows: Record<string, unknown>[] }>;
  on(event: 'query', listener: (query: QueryEvent) => void): void;
  off(event: 'query', listener: (query: QueryEvent) => void): void;
}
interface QueryEvent {
  readonly sql: string;
  readonly __knexTxId?: string;
}

const POSTGRES = testDatabaseDialect() === 'postgres';
const ISSUES = 8;
/** Runs per comment chain: the comment's own run and follow-ups of other threads it caused. */
const CHAIN_LENGTH = 5;
const CODER_RUNS = 6;
const ROUNDS = 4;

describe('concurrent claims over comment run chains', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  it('lets several runners poll at once without chain locks or writes per candidate', async () => {
    h = await createHarness();
    const sample = h.services.subjects.get('sample')!;
    h.services.subjects.register({
      ...sample,
      kind: 'commentIssue',
      actsAs: async () => ({ actorUserId: 'alice' }),
      responsibleUserId: async () => 'alice',
      commentOwnerKey: async () => 'assignment-1',
    });
    const pm = await h.createAgent({ name: 'pm', maxConcurrentRuns: 1 });
    const coder = await h.createAgent({
      name: 'coder',
      maxConcurrentRuns: CODER_RUNS,
    });
    const comment = (issue: number, threadScope?: string, rootRunId?: string) =>
      h.services.runs.enqueue({
        agentId: pm,
        subject: { kind: 'commentIssue', id: String(issue) },
        ...(threadScope ? { threadScope } : {}),
        actorUserId: rootRunId ? 'alice' : 'bob',
        ownerUserId: 'alice',
        ...(rootRunId
          ? { causedByRunId: rootRunId }
          : { comment: { ownerKey: 'assignment-1' } }),
        input: {
          type: 'comment',
          actor: rootRunId
            ? { kind: 'agent', id: pm, name: 'pm' }
            : { kind: 'user', id: 'bob', name: 'Bob' },
          text: 'Please continue this work.',
          payload: { commentId: `c-${issue}-${threadScope ?? 'main'}` },
        },
      });
    const alice = await h.registerRunner({
      name: 'alice',
      trust: 'ownerOnly',
      slots: 3,
      ownerUserId: 'alice',
    });
    // Before any team runner exists, half the chains ask the owner for her personal runner.
    const roots: string[] = [];
    for (let issue = 1; issue <= ISSUES; issue += 1) {
      if (issue === ISSUES / 2 + 1)
        await h.registerRunner({ name: 'team-0', trust: 'team', slots: 3 });
      roots.push((await comment(issue)).runId!);
    }
    for (const [index, root] of roots.entries())
      for (let thread = 1; thread < CHAIN_LENGTH; thread += 1)
        await comment(index + 1, `follow-up-${thread}`, root);
    const keys = [
      alice.key,
      (await h.registerRunner({ name: 'team-1', trust: 'team', slots: 3 })).key,
      (await h.registerRunner({ name: 'team-2', trust: 'team', slots: 3 })).key,
      (
        await h.registerRunner({
          name: 'carol',
          trust: 'ownerOnly',
          slots: 3,
          ownerUserId: 'carol',
        })
      ).key,
      (
        await h.registerRunner({
          name: 'dave',
          trust: 'ownerOnly',
          slots: 3,
          ownerUserId: 'dave',
        })
      ).key,
      (
        await h.registerRunner({
          name: 'erin',
          trust: 'ownerOnly',
          slots: 3,
          ownerUserId: 'erin',
        })
      ).key,
    ];
    const runnerOf = (key: string): Promise<Runner> =>
      h.services.runners.authenticate(key, { touch: false });
    // The project manager is at its limit: everything else it has queued waits.
    const [busy] = await h.services.claims.claim(
      await runnerOf(keys[1]),
      1,
      undefined,
    );
    expect(busy.agent?.id).toBe(pm);
    // The team claim withdrew the request of the chain it took; the other early chains still wait for the owner.
    const pendingRequests = await h.services.runs.requests.list({
      userId: 'alice',
      status: 'pending',
    });
    expect(pendingRequests.length).toBe(ISSUES / 2 - 1);
    const claimable = new Set<string>();
    for (let index = 0; index < CODER_RUNS; index += 1)
      claimable.add(
        (await h.enqueue(coder, `coder-${index}`, { actorUserId: 'carol' }))!,
      );

    // Every statement the application sends passes through the connection's query builder, on every dialect; a
    // statement inside a transaction carries that transaction's id.
    const knex = await h.database.connection().client<QueryEvents>();
    const writers = new Set<string>();
    let statements = 0;
    const onQuery = (query: QueryEvent) => {
      if (query.sql.includes('pg_stat_activity')) return;
      statements += 1;
      if (/^\s*(?:insert|update|delete)\b/iu.test(query.sql))
        writers.add(query.__knexTxId ?? `statement-${statements}`);
    };
    const schema = POSTGRES
      ? String(
          (await knex.raw('select current_schema() as name')).rows[0]!.name,
        )
      : '';
    const lockWaits: string[] = [];
    let sampling = POSTGRES;
    // Lock waits of this test's schema only: other test files share the server.
    const sampler = (async () => {
      while (sampling) {
        const { rows } = await knex.raw(
          "select query from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'",
        );
        for (const row of rows)
          if (String(row.query).includes(`"${schema}".`))
            lockWaits.push(String(row.query));
        await new Promise((resolve) => setTimeout(resolve, 2));
      }
    })();
    knex.on('query', onQuery);
    const started = performance.now();
    const claimed: string[] = [];
    // Every runner polls at once, round after round, as long polls do when new work wakes them together; the sweeper
    // and an owner's decision run alongside.
    await Promise.all([
      ...keys.map(async (key) => {
        for (let round = 0; round < ROUNDS; round += 1) {
          const payloads = await h.services.claims.claim(
            await runnerOf(key),
            1,
            undefined,
          );
          claimed.push(...payloads.map((payload) => payload.run.id));
        }
      }),
      h.services.claims.reconcileCommentQueue(),
      h.services.runs.requests.reject(pendingRequests[0]!.id, 'alice'),
    ]);
    const elapsed = performance.now() - started;
    knex.off('query', onQuery);
    sampling = false;
    await sampler;
    const polls = keys.length * ROUNDS;

    expect(new Set(claimed).size).toBe(claimed.length);
    expect(new Set(claimed)).toEqual(claimable);
    console.info(
      `${polls} polls, ${claimed.length} claims: ${statements} statements, ${writers.size} writing transactions, ${lockWaits.length} lock-wait samples, ${Math.round(elapsed)} ms`,
    );
    // Only a poll that reaches a final claim transaction writes: once when it wins the run, once more for each race
    // it loses to another runner; the rejection writes too. A poll over work it cannot take writes nothing, so this
    // does not grow with the queue: when every candidate locked its comment chain, these polls wrote over 750 times.
    expect(writers.size).toBeLessThanOrEqual(polls * 2);
    // Generous on purpose: a slow or busy machine passes, a burst that serializes on chain locks does not.
    expect(elapsed).toBeLessThan(15_000);
    if (!POSTGRES) return;
    // Claims of the same agent may wait for its row; nothing waits on a run of another claim's comment chain.
    expect(lockWaits.filter((query) => /"ag_runs"/u.test(query))).toEqual([]);
  }, 120_000);
});
