import { randomUUID } from 'node:crypto';
import { createRunnerReports } from '../server/core/runs/lifecycle.js';
import { appendFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import type { Knex } from 'knex';
import * as store from '../server/core/runs/run.store.js';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const POSTGRES = testDatabaseDialect() === 'postgres';
const features = [
  'workspaceKey',
  'input',
  'steer',
  'checkout',
  'directories',
  'attachments',
  'skills',
  'secrets',
] as const;
function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

describe('active input revisions', () => {
  let h: Harness;
  afterEach(async () => {
    vi.restoreAllMocks();
    await h?.close();
  });
  async function measure<T>(
    name: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const client = await h.database.connection().client<Knex>();
    const queries: { sql: string; __knexTxId?: string }[] = [];
    const listener = (q: { sql: string; __knexTxId?: string }) =>
      queries.push(q);
    client.on('query', listener);
    const began = performance.now();
    try {
      return await action();
    } finally {
      client.off('query', listener);
      const transaction = queries.find((q) =>
        /^begin/i.test(q.sql),
      )?.__knexTxId;
      const measured = transaction
        ? queries.filter((q) => q.__knexTxId === transaction)
        : queries;
      const guards = measured.filter(
        (q) => /^update/i.test(q.sql) && /where.*revision/i.test(q.sql),
      );
      const sample = {
        dialect: testDatabaseDialect(),
        name,
        statements: measured.length,
        reads: measured.filter((q) => /^\s*select/i.test(q.sql)).length,
        writes: measured.filter((q) =>
          /^\s*(insert|update|delete)/i.test(q.sql),
        ).length,
        transactions: measured.filter((q) => /^begin/i.test(q.sql)).length,
        casAttempts: guards.length,
        elapsedMs: Math.round(performance.now() - began),
        sql: measured.map((q) => q.sql),
      };
      if (process.env.PM385_SQL_REPORT)
        await appendFile(
          process.env.PM385_SQL_REPORT,
          JSON.stringify(sample) + '\n',
        );
    }
  }
  async function setup(tool = 'claude', steer = true, start = true) {
    h = await createHarness();
    const agentId = await h.createAgent({
      modelEntries: [
        { tool: tool as 'claude' | 'codex', model: null, effort: null },
      ],
    });
    const runner = await h.registerRunner({
      features: steer ? features : features.filter((f) => f !== 'steer'),
      tools: [{ kind: tool as 'claude' | 'codex', authenticated: true }],
    });
    const runId = await h.enqueue(agentId);
    const [payload] = await claim(h, runner);
    if (start)
      await h.services.reports.start({ id: runner.runnerId }, runId, {
        workDir: '/work',
        acceptsInput: true,
      });
    const request = {
      summary: 'done',
      handledInputIds: payload.inputs.map((i: { id: string }) => i.id),
    };
    const append = (commentId = 'follow-up') =>
      h.services.runs.enqueue({
        agentId,
        subject: { kind: 'sample', id: '1' },
        actorUserId: 'owner',
        preferActive: true,
        input: {
          type: 'comment',
          actor: { kind: 'agent', id: 'pm', name: 'Manager' },
          text: 'Continue.',
          payload: { commentId },
        },
      });
    return { agentId, runner, runId, request, append };
  }
  const complete = (
    runner: RegisteredRunner,
    runId: string,
    request: { summary: string; handledInputIds: string[] },
  ) => h.services.reports.complete({ id: runner.runnerId }, runId, request);

  it.each(['claude', 'codex'])(
    'appends to %s and replays once, including after completion',
    async (tool) => {
      const { runner, runId, request, append } = await setup(tool);
      const first = await measure('append-' + tool, () => append());
      expect(first).toMatchObject({ runId, outcome: 'appended' });
      expect(await measure('duplicate-' + tool, () => append())).toMatchObject({
        runId,
        inputId: first.inputId,
        duplicate: true,
      });
      const delivered = await h.services.reports.status(
        { id: runner.runnerId },
        runId,
      );
      expect(delivered.inputs.map((i) => i.id)).toContain(first.inputId);
      await measure('complete-' + tool, () =>
        complete(runner, runId, {
          ...request,
          handledInputIds: [...request.handledInputIds, first.inputId!],
        }),
      );
      expect(await append()).toMatchObject({
        runId,
        inputId: first.inputId,
        duplicate: true,
      });
      expect(
        await store.runsRepo(h.database.connection()).findMany(),
      ).toHaveLength(1);
    },
  );

  it.each(['claude', 'codex'])(
    'accepts %s dispatched input before start',
    async (tool) => {
      const { runner, runId, append } = await setup(tool, true, false);
      const input = await append();
      expect(input).toMatchObject({ runId, outcome: 'appended' });
      const response = await h.services.reports.start(
        { id: runner.runnerId },
        runId,
        { workDir: '/work', acceptsInput: true },
      );
      expect(response.inputs.map((i) => i.id)).toContain(input.inputId);
    },
  );

  it('falls back without steer or after completion, with no duplicate new run', async () => {
    const { runner, runId, request, append } = await setup('claude', false);
    const waiting = await measure('unsupported', () => append('unsupported'));
    expect(waiting).toMatchObject({ outcome: 'created' });
    expect(waiting.runId).not.toBe(runId);
    expect(await append('unsupported')).toMatchObject({
      runId: waiting.runId,
      duplicate: true,
    });
    await complete(runner, runId, request);
    const merged = await append('after-complete');
    expect(merged.runId).toBe(waiting.runId);
  });

  it('falls back after completion without repeating the source comment', async () => {
    const { runner, runId, request, append } = await setup();
    await measure('complete-before-append', () =>
      complete(runner, runId, request),
    );
    const added = await measure('ended-fallback', () => append());
    expect(added).toMatchObject({ outcome: 'created' });
    expect(added.runId).not.toBe(runId);
    expect(await append()).toMatchObject({
      runId: added.runId,
      inputId: added.inputId,
      duplicate: true,
    });
  });

  it.runIf(POSTGRES)(
    'deduplicates concurrent replay with the existing enqueue lock',
    async () => {
      const { runId, append } = await setup();
      const [a, b] = await Promise.all([append(), append()]);
      expect(a.runId).toBe(runId);
      expect(b).toMatchObject({ runId, inputId: a.inputId });
      expect([a, b].filter((result) => result.duplicate)).toHaveLength(1);
      expect(await store.runsRepo(h.database.connection()).count()).toBe(1);
      expect(
        await store
          .inputsRepo(h.database.connection())
          .findMany({ filter: { runId } }),
      ).toHaveLength(2);
    },
  );

  it('retries a heartbeat revision conflict before completing', async () => {
    const { runner, runId, request } = await setup();
    const pending = store.pendingInputs;
    let reads = 0;
    vi.spyOn(store, 'pendingInputs').mockImplementation(async (conn, id) => {
      const inputs = await pending(conn, id);
      if (reads++ === 0)
        await store.runsRepo(conn).updateMany({
          filter: { id },
          values: { updatedAt: h.clock.now().toISOString() },
        });
      return inputs;
    });
    expect(
      await measure('complete-conflict-heartbeat', () =>
        complete(runner, runId, request),
      ),
    ).toEqual({ status: 'completed' });
    expect(reads).toBe(2);
  });

  it('handles simultaneous append and complete without dropping or replaying input', async () => {
    const { runner, runId, request, append } = await setup();
    const [ended, added] = await Promise.allSettled([
      complete(runner, runId, request),
      append(),
    ]);
    expect(added.status).toBe('fulfilled');
    if (added.status !== 'fulfilled') throw added.reason;
    if (ended.status === 'fulfilled') expect(added.value.runId).not.toBe(runId);
    else {
      expect(ended.reason).toMatchObject({ code: 'RUN_INPUT_PENDING' });
      expect(added.value.runId).toBe(runId);
    }
    expect(
      (await store.findRunRecord(h.database.connection(), added.value.runId!))!
        .status,
    ).not.toBe('completed');
    expect(await append()).toMatchObject({
      runId: added.value.runId,
      inputId: added.value.inputId,
      duplicate: true,
    });
    expect(await store.runsRepo(h.database.connection()).count()).toBe(
      ended.status === 'fulfilled' ? 2 : 1,
    );
  });

  it.runIf(POSTGRES)(
    'falls back when complete commits after append selected its candidate',
    async () => {
      const { runner, runId, request, append } = await setup();
      const selected = barrier();
      const resume = barrier();
      const runsRepo = store.runsRepo;
      let once = true;
      vi.spyOn(store, 'runsRepo').mockImplementation((conn) => {
        const repo = runsRepo(conn);
        const update = repo.updateMany.bind(repo);
        repo.updateMany = async (options) => {
          // Append's CAS uses a callback; the completion also has one, but starts after the barrier.
          if (once && typeof options.filter === 'function') {
            once = false;
            selected.release();
            await resume.promise;
          }
          return update(options);
        };
        return repo;
      });
      const adding = measure('append-complete-wins', () => append());
      await selected.promise;
      await complete(runner, runId, request);
      resume.release();
      const added = await adding;
      expect(added).toMatchObject({ outcome: 'created' });
      expect(added.runId).not.toBe(runId);
      expect(await append()).toMatchObject({
        runId: added.runId,
        inputId: added.inputId,
        duplicate: true,
      });
      expect(
        await store
          .inputsRepo(h.database.connection())
          .count({ filter: { runId } }),
      ).toBe(1);
    },
  );

  it('rolls back completion after four version conflicts', async () => {
    const { runner, runId, request } = await setup();
    const pending = store.pendingInputs;
    let conflicts = 0;
    vi.spyOn(store, 'pendingInputs').mockImplementation(async (conn, id) => {
      const inputs = await pending(conn, id);
      const run = (await store.findRunRecord(conn, id))!;
      await store.runsRepo(conn).updateMany({
        filter: { id },
        values: {
          lastActivityAt: new Date(
            Date.parse(run.lastActivityAt!) + 1,
          ).toISOString(),
        },
      });
      conflicts += 1;
      return inputs;
    });
    await expect(
      measure('complete-exhausted', () => complete(runner, runId, request)),
    ).rejects.toMatchObject({ code: 'RUN_INPUT_PENDING' });
    expect(conflicts).toBe(4);
    expect(
      (await store.findRunRecord(h.database.connection(), runId))!.status,
    ).toBe('running');
    expect(await pending(h.database.connection(), runId)).toHaveLength(1);
  });

  it.each([
    'identity',
    'subject',
    'agent',
    'tool',
    'cancel',
    'input-disabled',
  ] as const)('falls back on %s isolation', async (reason) => {
    const { agentId, runId, append } = await setup();
    const conn = h.database.connection();
    if (reason === 'tool')
      await store
        .runsRepo(conn)
        .updateMany({ filter: { id: runId }, values: { tool: 'unknown' } });
    if (reason === 'cancel') await h.services.runs.cancel(runId, 'owner');
    if (reason === 'input-disabled')
      await store
        .runsRepo(conn)
        .updateMany({ filter: { id: runId }, values: { acceptsInput: false } });
    const added = ['tool', 'cancel', 'input-disabled'].includes(reason)
      ? await append()
      : await h.services.runs.enqueue({
          agentId:
            reason === 'agent'
              ? await h.createAgent({ name: 'other' })
              : agentId,
          subject: { kind: 'sample', id: reason === 'subject' ? '2' : '1' },
          actorUserId: reason === 'identity' ? 'bob' : 'owner',
          preferActive: true,
          input: {
            type: 'comment',
            actor: { kind: 'agent', id: 'pm', name: 'Manager' },
            text: 'Continue',
            payload: { commentId: 'follow-up' },
          },
        });
    expect(added.outcome).toBe('created');
    expect(added.runId).not.toBe(runId);
    expect(
      await store.inputsRepo(conn).findMany({ filter: { runId } }),
    ).toHaveLength(1);
  });

  it('rejects the events/append/completion ABA interleaving through production services on every dialect', async () => {
    const { agentId, runner, runId, request } = await setup();
    await h.database.transaction(async (conn) => {
      const unit = { conn, emit: () => undefined };
      const reports = createRunnerReports({
        tx: { run: async (fn) => fn(unit), read: () => conn },
        ids: { next: randomUUID },
        clock: h.clock,
        subjects: h.services.subjects,
        cliName: 'acme',
        appName: 'Acme',
      });
      const originalPending = store.pendingInputs;
      const originalEventsRepo = store.eventsRepo;
      let inputId: string | null = null;
      let once = true;
      vi.spyOn(store, 'eventsRepo').mockImplementation((connection) => {
        const repo = originalEventsRepo(connection);
        const create = repo.createOne.bind(repo);
        repo.createOne = async (...args: Parameters<typeof repo.createOne>) => {
          const added = await h.services.runs.enqueue(
            {
              agentId,
              subject: { kind: 'sample', id: '1' },
              actorUserId: 'owner',
              preferActive: true,
              input: {
                type: 'comment',
                actor: { kind: 'agent', id: 'pm', name: 'Manager' },
                text: 'Continue',
                payload: { commentId: 'aba-followup' },
              },
            },
            unit,
          );
          inputId = added.inputId;
          return create(...args);
        };
        return repo;
      });
      vi.spyOn(store, 'pendingInputs').mockImplementation(
        async (connection, id) => {
          const pending = await originalPending(connection, id);
          if (once) {
            once = false;
            await reports.events({ id: runner.runnerId }, runId, {
              events: [
                {
                  seq: 1,
                  at: h.clock.now().toISOString(),
                  type: 'status',
                  content: 'delayed report',
                },
              ],
            });
          }
          return pending;
        },
      );
      await expect(
        reports.complete({ id: runner.runnerId }, runId, request),
      ).rejects.toMatchObject({ code: 'RUN_INPUT_PENDING' });
      expect((await store.findRunRecord(conn, runId))!.status).toBe('running');
      expect(
        (await originalPending(conn, runId)).map((input) => input.id),
      ).toContain(inputId);
    });
  });

  it('strictly advances same-millisecond claim/start/events and cannot regress on delayed events', async () => {
    const { runner, runId, request, append } = await setup();
    const old = (await store.findRunRecord(h.database.connection(), runId))!
      .revision;
    const input = await append();
    const advanced = (await store.findRunRecord(
      h.database.connection(),
      runId,
    ))!.revision;
    expect(advanced).toBeGreaterThan(old);
    await h.services.reports.events({ id: runner.runnerId }, runId, {
      events: [
        {
          seq: 1,
          at: h.clock.now().toISOString(),
          type: 'status',
          content: 'late',
        },
      ],
    });
    const current = (await store.findRunRecord(h.database.connection(), runId))!
      .revision;
    expect(current).toBeGreaterThan(advanced);
    await expect(
      measure('pending', () => complete(runner, runId, request)),
    ).rejects.toMatchObject({
      code: 'RUN_INPUT_PENDING',
    });
    expect(
      (await store.pendingInputs(h.database.connection(), runId)).map(
        (i) => i.id,
      ),
    ).toContain(input.inputId);
  });

  it.runIf(POSTGRES)(
    'closes the pending-check window with delayed events on real concurrent transactions',
    async () => {
      const { runner, runId, request, append } = await setup();
      const checked = barrier();
      const resume = barrier();
      const pending = store.pendingInputs;
      let once = true;
      vi.spyOn(store, 'pendingInputs').mockImplementation(async (conn, id) => {
        const inputs = await pending(conn, id);
        if (once && id === runId) {
          once = false;
          checked.release();
          await resume.promise;
        }
        return inputs;
      });
      const captured = barrier();
      const eventResume = barrier();
      const eventsRepo = store.eventsRepo;
      vi.spyOn(store, 'eventsRepo').mockImplementation((conn) => {
        const repo = eventsRepo(conn);
        const create = repo.createOne.bind(repo);
        repo.createOne = async (...args: Parameters<typeof repo.createOne>) => {
          captured.release();
          await eventResume.promise;
          return create(...args);
        };
        return repo;
      });
      const reporting = h.services.reports.events(
        { id: runner.runnerId },
        runId,
        {
          events: [
            {
              seq: 1,
              at: h.clock.now().toISOString(),
              type: 'status',
              content: 'delayed',
            },
          ],
        },
      );
      await captured.promise;
      const finishing = measure('complete-conflict-pending', () =>
        complete(runner, runId, request),
      );
      await checked.promise;
      const input = await append();
      eventResume.release();
      await reporting;
      resume.release();
      await expect(finishing).rejects.toMatchObject({
        code: 'RUN_INPUT_PENDING',
      });
      expect(
        (await store.findRunRecord(h.database.connection(), runId))!.status,
      ).toBe('running');
      expect(
        (await pending(h.database.connection(), runId)).map((i) => i.id),
      ).toContain(input.inputId);
      expect(
        await store.runsRepo(h.database.connection()).findMany(),
      ).toHaveLength(1);
    },
  );

  it.runIf(POSTGRES)(
    'serializes simultaneous append and completion without an agent lock in complete',
    async () => {
      const { runner, runId, request, append } = await setup();
      const client = await h.database.connection().client<Knex>();
      const queries: { sql: string; __knexTxId?: string }[] = [];
      const listener = (query: { sql: string; __knexTxId?: string }) =>
        queries.push(query);
      client.on('query', listener);
      const lockWaits: string[] = [];
      let sampling = true;
      const schema = String(
        (await client.raw('select current_schema() as name')).rows[0].name,
      );
      const sampler = (async () => {
        while (sampling) {
          const result = await client.raw(
            "select query from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'",
          );
          for (const row of result.rows)
            if (
              String(row.query).includes(`"${schema}".`) ||
              /"ag_runs"|"ag_agents"/.test(String(row.query))
            )
              lockWaits.push(String(row.query));
          await new Promise((resolve) => setTimeout(resolve, 2));
        }
      })();
      const [ended, added] = await Promise.allSettled([
        complete(runner, runId, request),
        append(),
      ]);
      sampling = false;
      await sampler;
      client.off('query', listener);
      expect(added.status).toBe('fulfilled');
      if (added.status !== 'fulfilled') return;
      const target = await store.findRunRecord(
        h.database.connection(),
        added.value.runId!,
      );
      expect(target?.status).not.toBe('completed');
      if (ended.status === 'fulfilled')
        expect(added.value.runId).not.toBe(runId);
      else {
        expect(ended.reason).toMatchObject({ code: 'RUN_INPUT_PENDING' });
        expect(added.value.runId).toBe(runId);
      }
      expect(await append()).toMatchObject({
        runId: added.value.runId,
        inputId: added.value.inputId,
        duplicate: true,
      });
      const completeTx = queries.find(
        (q) => q.sql.includes('"ag_runs"') && q.sql.startsWith('select'),
      )?.__knexTxId;
      expect(
        queries.filter(
          (q) =>
            q.__knexTxId === completeTx && /^update.*ag_agents/.test(q.sql),
        ),
      ).toHaveLength(0);
      expect(lockWaits.filter((q) => /ag_agents/.test(q))).toEqual([]);
      if (process.env.PM385_SQL_REPORT)
        await appendFile(
          process.env.PM385_SQL_REPORT,
          JSON.stringify({
            dialect: 'postgres',
            name: 'simultaneous',
            lockWaitSamples: lockWaits.length,
            agentLockWaitSamples: lockWaits.filter((q) => /ag_agents/.test(q))
              .length,
            sql: queries
              .filter((q) => !/pg_stat_activity|current_schema/.test(q.sql))
              .map((q) => ({ sql: q.sql, tx: q.__knexTxId })),
          }) + '\n',
        );
    },
  );
});
