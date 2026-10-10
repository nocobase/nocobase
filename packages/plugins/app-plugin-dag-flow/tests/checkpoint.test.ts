import type { Knex } from 'knex';
import type { DatabaseManager } from '@nocobase/db';
import type { TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import { WorkflowBusyError } from '../server/engine/checkpoint.js';
import WorkflowEngine from '../server/engine/engine.js';
import { resolveIdGenerator } from '../server/engine/ids.js';
import { ResumeRequestService } from '../server/engine/resume-requests.js';
import type {
  WorkflowId,
  WorkflowLogger,
  WorkflowQueueTask,
} from '../server/engine/types.js';
import { asIdFilter } from '../server/engine/utils.js';
import { WaitInstructionApi } from '../server/instructions/wait/api.js';
import { defineTestInstruction } from './fixtures/instructions.js';
import {
  createWorkflowTestDatabase,
  createTestWorkflow,
  listNodeRuns,
  readRun,
  testStore,
} from './helpers.js';

describe('processor checkpoints', () => {
  let database: DatabaseManager;
  let testDatabase: TestDatabase;
  let engine: WorkflowEngine;
  let wait: WaitInstructionApi;
  const logger: WorkflowLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  /** What the instructions below saw in the database while they ran. */
  let observed: number[];
  let onGate: (() => Promise<void>) | undefined;

  const probe = defineTestInstruction('probe', async (instruction) => {
    observed.push(
      (await listNodeRuns(database, instruction.processor.execution.id)).length,
    );
    return { status: NODE_RUN_STATUS.RESOLVED, result: instruction.node.key };
  });
  const gate = defineTestInstruction('gate', async () => {
    await onGate?.();
    return { status: NODE_RUN_STATUS.RESOLVED, result: 'gate' };
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    observed = [];
    onGate = undefined;
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    engine = new WorkflowEngine({ database, timeoutReaper: false, logger });
    engine.registerInstruction(probe);
    engine.registerInstruction(gate);
    await engine.initialize();
    wait = engine.getInstructionApi('wait');
  });

  afterEach(async () => {
    await engine.dispose();
    await testDatabase.destroy();
  });

  function api(
    enqueue: (task: WorkflowQueueTask) => Promise<void>,
  ): WaitInstructionApi {
    return new WaitInstructionApi({
      database,
      enqueue,
      resumeRequests: new ResumeRequestService({
        database,
        idGenerator: resolveIdGenerator(),
        enqueue,
        logger,
      }),
    });
  }

  async function startWaiting(key: string = 'payment') {
    const workflow = await createTestWorkflow(database, {
      key,
      nodes: [
        { key: 'hold', type: 'wait', downstreamKey: 'done' },
        { key: 'done', type: 'terminate', upstreamKey: 'hold' },
      ],
    });
    const run = await engine.trigger(workflow, {});
    if (!run || !('id' in run)) throw new Error('No run');
    return { workflow, runId: run.id };
  }

  async function submit(
    runId: WorkflowId,
    enqueue: (task: WorkflowQueueTask) => Promise<void> = async () => undefined,
    idempotencyKey: string = 'event',
  ) {
    const receipt = await api(enqueue).resume({
      runId,
      nodeKey: 'hold',
      idempotencyKey,
      status: NODE_RUN_STATUS.RESOLVED,
      result: { ok: true },
    });
    if (receipt.status !== 'accepted') throw new Error('Not accepted');
    const nodeRun = await testStore(database).nodeRuns.findOne({
      filter: { workflowRunId: asIdFilter(runId), nodeKey: 'hold' },
    });
    return {
      requestId: receipt.requestId,
      task: {
        executionId: runId,
        nodeRunId: nodeRun?.id as number,
        resumeRequestId: Number(receipt.requestId),
      },
    };
  }

  async function requestState(requestId: string) {
    const row = await testStore(database).resumeRequests.findOne({
      filter: { id: requestId },
    });
    return { state: row?.state, reason: row?.reason };
  }

  it('keeps a segment out of the database until it exits, and writes it in one INSERT', async () => {
    const client = await database.connection().client<Knex>();
    const statements: string[] = [];
    client.on('query', (query: { sql: string }) => statements.push(query.sql));
    const workflow = await createTestWorkflow(database, {
      key: 'chain',
      nodes: [
        { key: 'a', type: 'probe', downstreamKey: 'b' },
        { key: 'b', type: 'probe', upstreamKey: 'a', downstreamKey: 'c' },
        { key: 'c', type: 'probe', upstreamKey: 'b', downstreamKey: 'done' },
        { key: 'done', type: 'terminate', upstreamKey: 'c' },
      ],
    });
    const run = await engine.trigger(workflow, {});
    if (!run || !('id' in run)) throw new Error('No run');

    // Each node ran against the previous checkpoint, which had no node runs.
    expect(observed).toEqual([0, 0, 0]);
    expect(await listNodeRuns(database, run.id)).toHaveLength(4);
    const nodeRunWrites = statements.filter((sql) =>
      /(insert into|update)\s+`?\w*`?\.?`?workflow_node_runs/i.test(sql),
    );
    expect(nodeRunWrites).toHaveLength(1);
    expect(nodeRunWrites[0]).toMatch(/^insert/i);
  });

  it('stores a suspended segment without a finish time and exposes it only afterwards', async () => {
    const workflow = await createTestWorkflow(database, {
      key: 'visible-after-commit',
      nodes: [
        { key: 'hold', type: 'wait', downstreamKey: 'done' },
        { key: 'done', type: 'terminate', upstreamKey: 'hold' },
      ],
    });
    const original = database.transaction.bind(database);
    const seenBeforeCommit: string[] = [];
    let calls = 0;
    vi.spyOn(database, 'transaction').mockImplementation((async (
      ...args: Parameters<typeof original>
    ) => {
      calls += 1;
      // The first transaction creates the run; the second is the checkpoint.
      if (calls === 2) {
        const row = await testStore(database).runs.findOne({
          filter: { workflowKey: 'visible-after-commit' },
        });
        seenBeforeCommit.push(
          (await wait.getPending({ runId: row?.id as number, nodeKey: 'hold' }))
            .status,
        );
      }
      return original(...args);
    }) as typeof original);
    await engine.trigger(workflow, {});
    const row = await testStore(database).runs.findOne({
      filter: { workflowKey: 'visible-after-commit' },
    });
    const id = row?.id as number;

    expect(seenBeforeCommit).toContain('not-ready');
    expect(await wait.getPending({ runId: id, nodeKey: 'hold' })).toEqual({
      status: 'pending',
      correlation: null,
    });
    expect(await readRun(database, id)).toMatchObject({
      status: EXECUTION_STATUS.STARTED,
      finishedAt: null,
    });
  });

  it('allocates node run ids from the configured generator', async () => {
    let next = 7_000_000_000;
    const ids = new WorkflowEngine({
      database,
      timeoutReaper: false,
      idGenerator: {
        generate: () => (next += 1),
        generateString: () => String((next += 1)),
      },
    });
    const workflow = await createTestWorkflow(database, {
      key: 'ids',
      nodes: [{ key: 'a', type: 'terminate' }],
    });
    await ids.initialize();
    const run = await ids.trigger(workflow, {});
    await ids.dispose();
    if (!run || !('id' in run)) throw new Error('No run');
    const rows = await testStore(database).nodeRuns.findMany({
      filter: { workflowRunId: asIdFilter(run.id) },
    });
    // The run takes the first id and its node run the next one.
    expect(Number(run.id)).toBe(7_000_000_001);
    expect(rows.map((row) => Number(row.id))).toEqual([7_000_000_002]);
  });

  describe('run lease', () => {
    it('refuses work on a run another worker holds, and answers a request once it is free', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      const future = new Date(Date.now() + 60_000).toISOString();
      await testStore(database).runs.updateMany({
        filter: { id: asIdFilter(runId) },
        values: { leaseToken: 'other-worker', leaseExpiresAt: future },
      });

      await expect(
        engine.dispatch({ executionId: runId, rerun: {} }),
      ).rejects.toBeInstanceOf(WorkflowBusyError);
      // A request is not dropped for it: it stays queued for whoever is next.
      await engine.dispatch(task);
      expect(await requestState(requestId)).toEqual({
        state: 'queued',
        reason: null,
      });
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.STARTED,
      );

      await testStore(database).runs.updateMany({
        filter: { id: asIdFilter(runId) },
        values: { leaseToken: null, leaseExpiresAt: null },
      });
      expect(
        await engine.dispatcher.recoverResumeRequests({ gracePeriod: 0 }),
      ).toBe(1);
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
    });

    it('refuses a decision made for a wait that an overwriting rerun restarted', async () => {
      const { runId } = await startWaiting();
      const { requestId } = await submit(runId);
      // The rerun restarts `hold` under the same id. The queued decision was
      // made for the execution it replaced, so it must not resolve the new one.
      await engine.dispatch({ executionId: runId, rerun: { overwrite: true } });
      expect(await requestState(requestId)).toEqual({
        state: 'rejected',
        reason: 'stale',
      });
      await expect(wait.getRequest(requestId)).resolves.toEqual({
        status: 'rejected',
        reason: 'stale',
      });
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.STARTED,
      );

      // The slot it held is free, so the restarted wait takes a new decision.
      const fresh = await wait.resume({
        runId,
        nodeKey: 'hold',
        idempotencyKey: 'after-rerun',
        status: NODE_RUN_STATUS.RESOLVED,
        result: { ok: true },
      });
      expect(fresh.status).toBe('accepted');
      if (fresh.status !== 'accepted') return;
      await expect(wait.getRequest(fresh.requestId)).resolves.toEqual({
        status: 'consumed',
        reason: null,
      });
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
    });

    it('takes a run over from a worker whose lease expired, and keeps the old worker from writing', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      // The first worker stalls inside its segment; another one takes over.
      const workflowRow = await testStore(database).runs.findOne({
        filter: { id: asIdFilter(runId) },
      });
      expect(workflowRow?.leaseToken).toBeNull();
      const original = database.transaction.bind(database);
      let stolen = false;
      vi.spyOn(database, 'transaction').mockImplementation((async (
        ...args: Parameters<typeof original>
      ) => {
        if (!stolen) {
          stolen = true;
          await testStore(database).runs.updateMany({
            filter: { id: asIdFilter(runId) },
            values: {
              leaseToken: 'new-owner',
              leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          });
        }
        return original(...args);
      }) as typeof original);

      await engine.dispatch(task);

      expect(await listNodeRuns(database, runId)).toMatchObject([
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING },
      ]);
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.STARTED,
      );
      expect((await requestState(requestId)).state).toBe('queued');
    });

    /**
     * The first worker stalls inside its segment; meanwhile its lease expires,
     * recovery resets its claim and a second worker claims the request under
     * its own lease. `change` is whatever else happens before the first worker
     * reaches its checkpoint.
     */
    function takeOverDuringSegment(
      runId: WorkflowId,
      requestId: string,
      change: () => Promise<void> = async () => undefined,
    ) {
      const original = database.transaction.bind(database);
      const claimedAt = new Date().toISOString();
      let taken = false;
      vi.spyOn(database, 'transaction').mockImplementation((async (
        ...args: Parameters<typeof original>
      ) => {
        if (!taken) {
          taken = true;
          await testStore(database).runs.updateMany({
            filter: { id: asIdFilter(runId) },
            values: {
              leaseToken: 'new-owner',
              leaseExpiresAt: new Date(Date.now() + 60_000).toISOString(),
            },
          });
          await testStore(database).resumeRequests.updateMany({
            filter: { id: requestId },
            values: {
              state: 'processing',
              claimToken: 'new-owner',
              claimedAt,
            },
          });
          await change();
        }
        return original(...args);
      }) as typeof original);
      return { claimedAt };
    }

    async function claimOf(requestId: string) {
      return testStore(database).resumeRequests.findOne({
        filter: { id: requestId },
        select: (select) =>
          select.fields('state', 'claimToken', 'claimedAt', 'attempts'),
      });
    }

    it('leaves a request another worker claimed to that worker when it loses the run', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      const { claimedAt } = takeOverDuringSegment(runId, requestId);

      await engine.dispatch(task);
      vi.restoreAllMocks();

      // The old worker's checkpoint is refused, and its clean-up does not hand
      // the new owner's request back to the queue.
      expect(await claimOf(requestId)).toEqual({
        state: 'processing',
        claimToken: 'new-owner',
        claimedAt,
        attempts: 0,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('another worker has claimed it'),
        expect.anything(),
      );
      expect(await listNodeRuns(database, runId)).toMatchObject([
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING },
      ]);
    });

    it('does not reject a request another worker claimed when the run ended meanwhile', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      const { claimedAt } = takeOverDuringSegment(runId, requestId, () =>
        testStore(database)
          .runs.updateMany({
            filter: { id: asIdFilter(runId) },
            values: { status: EXECUTION_STATUS.ABORTED, reason: 'cancelled' },
          })
          .then(() => undefined),
      );

      await engine.dispatch(task);
      vi.restoreAllMocks();

      expect(await claimOf(requestId)).toMatchObject({
        state: 'processing',
        claimToken: 'new-owner',
        claimedAt,
      });
    });

    it('stops renewing a claim once another worker holds it', async () => {
      const heartbeatEngine = new WorkflowEngine({
        database,
        timeoutReaper: false,
        logger,
        leaseHeartbeatMs: 5,
      });
      await heartbeatEngine.initialize();
      try {
        const { runId } = await startWaiting('heartbeat');
        const { task, requestId } = await submit(runId);
        const original = database.transaction.bind(database);
        const claimedAt = '2026-01-01T00:00:00.000Z';
        let taken = false;
        vi.spyOn(database, 'transaction').mockImplementation((async (
          ...args: Parameters<typeof original>
        ) => {
          if (!taken) {
            taken = true;
            await testStore(database).resumeRequests.updateMany({
              filter: { id: requestId },
              values: { claimToken: 'new-owner', claimedAt },
            });
            // Several heartbeats of the stalled worker fall in here.
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
          return original(...args);
        }) as typeof original);

        await heartbeatEngine.dispatch(task);
        vi.restoreAllMocks();

        expect(await claimOf(requestId)).toMatchObject({
          claimToken: 'new-owner',
          claimedAt,
        });
      } finally {
        await heartbeatEngine.dispose();
      }
    });

    it('does not let a segment overwrite a run that was cancelled while it worked', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      const original = database.transaction.bind(database);
      let cancelled = false;
      vi.spyOn(database, 'transaction').mockImplementation((async (
        ...args: Parameters<typeof original>
      ) => {
        if (!cancelled) {
          cancelled = true;
          await testStore(database).runs.updateMany({
            filter: { id: asIdFilter(runId) },
            values: { status: EXECUTION_STATUS.ABORTED, reason: 'cancelled' },
          });
        }
        return original(...args);
      }) as typeof original);

      await engine.dispatch(task);

      expect(await readRun(database, runId)).toMatchObject({
        status: EXECUTION_STATUS.ABORTED,
        reason: 'cancelled',
      });
      expect(await listNodeRuns(database, runId)).toMatchObject([
        { nodeKey: 'hold', status: NODE_RUN_STATUS.PENDING },
      ]);
      expect(await requestState(requestId)).toEqual({
        state: 'rejected',
        reason: 'run-ended',
      });
    });
  });

  describe('resume requests', () => {
    it('answers a request for a node that already finished', async () => {
      const { runId } = await startWaiting();
      await testStore(database).nodeRuns.updateMany({
        filter: { workflowRunId: asIdFilter(runId), nodeKey: 'hold' },
        values: { status: NODE_RUN_STATUS.RESOLVED },
      });
      expect(
        await wait.resume({
          runId,
          nodeKey: 'hold',
          idempotencyKey: 'late',
          status: NODE_RUN_STATUS.RESOLVED,
        }),
      ).toEqual({ status: 'finished' });
    });

    it('rejects a request whose node finished after it was written', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      await testStore(database).nodeRuns.updateMany({
        filter: { id: task.nodeRunId },
        values: { status: NODE_RUN_STATUS.RESOLVED },
      });
      await engine.dispatch(task);
      expect(await requestState(requestId)).toEqual({
        state: 'rejected',
        reason: 'stale',
      });
      expect(await listNodeRuns(database, runId)).toHaveLength(1);
    });

    it('rejects a request whose run has ended, so none stays queued', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      await testStore(database).runs.updateMany({
        filter: { id: asIdFilter(runId) },
        values: { status: EXECUTION_STATUS.ABORTED },
      });
      await engine.dispatch(task);
      expect(await requestState(requestId)).toEqual({
        state: 'rejected',
        reason: 'run-ended',
      });
      expect(
        await engine.dispatcher.recoverResumeRequests({ gracePeriod: 0 }),
      ).toBe(0);
    });

    it('rejects a request whose node run is gone', async () => {
      const { runId } = await startWaiting();
      const { task, requestId } = await submit(runId);
      await engine.dispatch({ ...task, nodeRunId: 1 });
      expect(await requestState(requestId)).toEqual({
        state: 'rejected',
        reason: 'target-missing',
      });
    });

    it('leaves a recent request to its own delivery and republishes it after the grace period', async () => {
      const { runId } = await startWaiting();
      await submit(runId);
      expect(await engine.dispatcher.recoverResumeRequests()).toBe(0);
      expect(
        await engine.dispatcher.recoverResumeRequests({ gracePeriod: 0 }),
      ).toBe(1);
      expect((await readRun(database, runId)).status).toBe(
        EXECUTION_STATUS.RESOLVED,
      );
    });

    it('logs a request that could not be published and keeps it', async () => {
      const { runId } = await startWaiting();
      const { requestId } = await submit(runId, async () => {
        throw new Error('queue offline');
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Workflow resume request could not be published',
        expect.objectContaining({ executionId: runId }),
      );
      expect(await requestState(requestId)).toMatchObject({ state: 'queued' });
    });

    it('does not scan requests that are consumed or rejected', async () => {
      const { runId } = await startWaiting();
      const { task } = await submit(runId);
      await engine.dispatch(task);
      expect(
        await engine.dispatcher.recoverResumeRequests({ gracePeriod: 0 }),
      ).toBe(0);
    });
  });
});
