/**
 * A replacement (`replacesRunId`) and a retry of the same preserved quota run, interleaved deterministically on a real
 * server database: the retry holds the original agent's lock while the replacement's transaction has already read
 * (as Studio's Change Agent does before enqueueing). Under MySQL's REPEATABLE READ that transaction keeps its older
 * snapshot after the lock, so only a write conditional on the original's revision can tell it the retry won.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import * as store from '../server/core/runs/run.store.js';
import { claim, createHarness, type Harness } from './harness.js';

const SERVER = ['postgres', 'mysql'].includes(testDatabaseDialect());

function barrier() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

describe('replacing preserved quota work', () => {
  let h: Harness;
  afterEach(async () => {
    vi.restoreAllMocks();
    await h?.close();
  });

  async function waiting() {
    h = await createHarness();
    const binding = h.services.subjects.get('sample')!;
    h.services.subjects.register({
      ...binding,
      kind: 'quota',
      quotaWait: true,
    });
    const agentId = await h.createAgent({ maxAttempts: 1 });
    const other = await h.createAgent({ maxAttempts: 1 });
    const runner = await h.registerRunner({
      features: [
        'strictSession',
        'input',
        'checkout',
        'directories',
        'skills',
        'secrets',
      ],
    });
    await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'quota', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'signal',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Continue the step',
      },
    });
    const [payload] = await claim(h, runner);
    const machine = await h.services.runners.get(runner.runnerId);
    await h.runners.reports.start(machine, payload.run.id, {
      workDir: '/work/original',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    // An unknown reset time: the run fails and waits for Continue or Change Agent.
    await h.runners.reports.fail(machine, payload.run.id, {
      reason: 'toolQuota',
      sessionId: 'kept',
    });
    return { runId: payload.run.id as string, other, runner };
  }

  it.runIf(SERVER)(
    'refuses a replacement that waited for the lock of a Continue that won',
    async () => {
      const { runId, other, runner } = await waiting();
      // Pause Continue right after it took the original agent's lock: its first relationship check comes after it.
      const locked = barrier();
      const go = barrier();
      const repo = store.runsRepo;
      let paused = false;
      vi.spyOn(store, 'runsRepo').mockImplementation((conn) => {
        const runs = repo(conn);
        const findOne = runs.findOne.bind(runs);
        runs.findOne = (async (...args: Parameters<typeof findOne>) => {
          const filter = args[0]?.filter as Record<string, unknown> | undefined;
          if (!paused && filter && 'retryOfRunId' in filter) {
            paused = true;
            locked.release();
            await go.promise;
          }
          return findOne(...args);
        }) as typeof findOne;
        return runs;
      });
      const continuing = h.services.runs.retry(runId, 'owner');
      await locked.promise;
      const snapshot = barrier();
      const replacing = h.services.tx.run(async (tx) => {
        // The consistent read that fixes a REPEATABLE READ snapshot before the retry commits.
        expect((await store.findRunRecord(tx.conn, runId))?.status).toBe(
          'failed',
        );
        snapshot.release();
        return h.services.runs.enqueue(
          {
            agentId: other,
            subject: { kind: 'quota', id: '1' },
            actorUserId: 'owner',
            runnerId: runner.runnerId,
            freshSession: true,
            replacesRunId: runId,
            input: {
              type: 'signal',
              actor: { kind: 'user', id: 'owner', name: 'Owner' },
              text: 'Take over the step',
            },
          },
          tx,
        );
      });
      await snapshot.promise;
      go.release();
      const retried = await continuing;
      await expect(replacing).rejects.toMatchObject({
        code: expect.stringMatching(/^(CONFLICT|RUN_ALREADY_RETRIED)$/u),
      });
      const conn = h.database.connection();
      expect(await store.findRunRecord(conn, runId)).toMatchObject({
        status: 'failed',
      });
      const open = (await store.runsRepo(conn).findMany()).filter((run) =>
        ['queued', 'dispatched'].includes(run.status),
      );
      expect(open.map((run) => run.id)).toEqual([retried.id]);
    },
  );

  it('refuses a retry after a replacement took the original over', async () => {
    const { runId, other, runner } = await waiting();
    await h.services.runs.enqueue({
      agentId: other,
      subject: { kind: 'quota', id: '1' },
      actorUserId: 'owner',
      runnerId: runner.runnerId,
      freshSession: true,
      replacesRunId: runId,
      input: {
        type: 'signal',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Take over the step',
      },
    });
    await expect(h.services.runs.retry(runId, 'owner')).rejects.toMatchObject({
      code: 'RUN_ALREADY_RETRIED',
    });
  });
});
