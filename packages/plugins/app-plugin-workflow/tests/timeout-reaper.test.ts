import type { DatabaseManager, Row } from '@nocobase/db';
import { type TestDatabase } from '@nocobase/app-testing/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
  NODE_RUN_STATUS,
} from '../server/engine/constants.js';
import { createTimeoutReaper } from '../server/engine/timeout-reaper.js';
import type { WorkflowId } from '../server/engine/types.js';
import { asIdFilter, serializeJson } from '../server/engine/utils.js';
import {
  createWorkflowTestDatabase,
  createTestWorkflow,
  insertTestRun,
  testStore,
} from './helpers.js';

type RunInput = {
  eventKey: string;
  status: number | null;
  expiresAt: string | null;
  sourceType?: string;
  sourceId?: string;
};

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

describe('timeout reaper', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let workflowId: WorkflowId;

  async function insertRun(input: RunInput): Promise<WorkflowId> {
    const anHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    return insertTestRun(database, {
      workflowId,
      workflowKey: 'reaped',
      eventKey: input.eventKey,
      status: input.status,
      dispatched: input.status != null,
      startedAt: input.status == null ? null : anHourAgo,
      expiresAt: input.expiresAt,
      createdAt: anHourAgo,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    });
  }

  async function readRun(id: WorkflowId): Promise<Row> {
    const row = await testStore(database).runs.findOne({
      filter: { id: asIdFilter(id) },
    });
    if (!row) {
      throw new Error(`Run "${String(id)}" was not found`);
    }
    return row;
  }

  beforeEach(async () => {
    testDatabase = await createWorkflowTestDatabase();
    database = testDatabase.database;
    const workflow = await createTestWorkflow(database, {
      key: 'reaped',
      nodes: [{ key: 'only', type: 'echo' }],
    });
    workflowId = workflow.id;
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('aborts a started run whose deadline has passed', async () => {
    const expired = await insertRun({
      eventKey: 'expired',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
    });
    const reaper = createTimeoutReaper({ database });

    await expect(reaper.sweep()).resolves.toBe(1);

    const run = await readRun(expired);
    expect(run.status).toBe(EXECUTION_STATUS.ABORTED);
    expect(run.reason).toBe(EXECUTION_REASON.TIMEOUT);
    expect(run.finishedAt).toBeTruthy();
  });

  it('finalizes an expired run through the shared terminal observer', async () => {
    const expired = await insertRun({
      eventKey: 'scheduled-expired',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
      sourceType: 'schedule',
      sourceId: 'occurrence-1',
    });
    const terminalObserver = vi.fn(async () => undefined);

    await expect(
      createTimeoutReaper({ database, terminalObserver }).sweep(),
    ).resolves.toBe(1);
    expect(terminalObserver).toHaveBeenCalledWith({
      runId: expired,
      status: EXECUTION_STATUS.ABORTED,
      reason: EXECUTION_REASON.TIMEOUT,
      output: null,
      finishedAt: expect.any(String),
      sourceType: 'schedule',
      sourceId: 'occurrence-1',
    });
  });

  it('logs observer failures without losing the authoritative terminal state', async () => {
    const expired = await insertRun({
      eventKey: 'observer-failure',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
      sourceType: 'schedule',
      sourceId: 'occurrence-failed',
    });
    const failure = new Error('observer unavailable');
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const terminalObserver = vi.fn(async () => {
      throw failure;
    });
    const reaper = createTimeoutReaper({ database, logger, terminalObserver });
    await expect(reaper.sweep()).resolves.toBe(1);
    expect((await readRun(expired)).status).toBe(EXECUTION_STATUS.ABORTED);
    expect(logger.error).toHaveBeenCalledWith(
      'Workflow terminal observer failed',
      {
        runId: expired,
        sourceType: 'schedule',
        sourceId: 'occurrence-failed',
        error: failure,
      },
    );
    await expect(reaper.sweep()).resolves.toBe(0);
    expect(terminalObserver).toHaveBeenCalledTimes(1);
  });

  it('leaves runs that are not expired, not started, or have no deadline', async () => {
    const pending = await insertRun({
      eventKey: 'still-running',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(10),
    });
    const endless = await insertRun({
      eventKey: 'no-deadline',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: null,
    });
    const queueing = await insertRun({
      eventKey: 'queueing',
      status: EXECUTION_STATUS.QUEUEING,
      expiresAt: minutesFromNow(-1),
    });
    const resolved = await insertRun({
      eventKey: 'resolved',
      status: EXECUTION_STATUS.RESOLVED,
      expiresAt: minutesFromNow(-1),
    });
    const reaper = createTimeoutReaper({ database });

    await expect(reaper.sweep()).resolves.toBe(0);

    expect((await readRun(pending)).status).toBe(EXECUTION_STATUS.STARTED);
    expect((await readRun(endless)).status).toBe(EXECUTION_STATUS.STARTED);
    expect((await readRun(queueing)).status).toBe(EXECUTION_STATUS.QUEUEING);
    expect((await readRun(resolved)).status).toBe(EXECUTION_STATUS.RESOLVED);
  });

  it('aborts the pending nodeRuns of a reclaimed run', async () => {
    const expired = await insertRun({
      eventKey: 'with-nodeRuns',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
    });
    await testStore(database).nodeRuns.createMany({
      values: [
        {
          workflowRunId: asIdFilter(expired),
          nodeId: 1,
          nodeKey: 'done',
          status: NODE_RUN_STATUS.RESOLVED,
          meta: serializeJson(null),
          result: serializeJson(1),
          startedAt: new Date().toISOString(),
        },
        {
          workflowRunId: asIdFilter(expired),
          nodeId: 2,
          nodeKey: 'waiting',
          status: NODE_RUN_STATUS.PENDING,
          meta: serializeJson(null),
          result: serializeJson(null),
          startedAt: new Date().toISOString(),
        },
      ],
    });

    await expect(createTimeoutReaper({ database }).sweep()).resolves.toBe(1);

    const nodeRuns = await testStore(database).nodeRuns.findMany({
      filter: { workflowRunId: asIdFilter(expired) },
      select: (select) => select.fields('nodeKey', 'status', 'finishedAt'),
      sort: (sort) => sort.field('id').asc(),
    });
    expect(nodeRuns).toEqual([
      { nodeKey: 'done', status: NODE_RUN_STATUS.RESOLVED, finishedAt: null },
      {
        nodeKey: 'waiting',
        status: NODE_RUN_STATUS.ABORTED,
        finishedAt: expect.anything(),
      },
    ]);
  });

  it('honours the batch size and reclaims the rest on the next sweep', async () => {
    for (const index of [1, 2, 3]) {
      await insertRun({
        eventKey: `batch-${index}`,
        status: EXECUTION_STATUS.STARTED,
        expiresAt: minutesFromNow(-index),
      });
    }
    const reaper = createTimeoutReaper({ database, batchSize: 2 });

    await expect(reaper.sweep()).resolves.toBe(2);
    await expect(reaper.sweep()).resolves.toBe(1);
    await expect(reaper.sweep()).resolves.toBe(0);
  });

  it('is idempotent, so a second sweep does not reclaim the same run twice', async () => {
    await insertRun({
      eventKey: 'once',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
    });
    const reaper = createTimeoutReaper({ database });

    await expect(reaper.sweep()).resolves.toBe(1);
    await expect(reaper.sweep()).resolves.toBe(0);
  });

  it('deduplicates concurrent sweeps', async () => {
    await insertRun({
      eventKey: 'concurrent',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
    });
    const reaper = createTimeoutReaper({ database });

    const [first, second] = await Promise.all([reaper.sweep(), reaper.sweep()]);
    expect(first).toBe(1);
    expect(second).toBe(1);
  });

  it('sweeps on its interval and stops cleanly without leaking a timer', async () => {
    await insertRun({
      eventKey: 'scheduled',
      status: EXECUTION_STATUS.STARTED,
      expiresAt: minutesFromNow(-1),
    });
    const reaper = createTimeoutReaper({ database, intervalMs: 5 });

    reaper.start();
    reaper.start(); // idempotent
    const deadline = Date.now() + 2000;
    let status: unknown = EXECUTION_STATUS.STARTED;
    while (Date.now() < deadline && status !== EXECUTION_STATUS.ABORTED) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      status = (
        await testStore(database).runs.findOne({
          filter: { eventKey: 'scheduled' },
          select: (select) => select.fields('status'),
        })
      )?.status;
    }
    expect(status).toBe(EXECUTION_STATUS.ABORTED);

    reaper.stop();
    reaper.stop(); // idempotent
  });
});
