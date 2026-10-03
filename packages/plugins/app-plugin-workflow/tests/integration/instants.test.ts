import type { DatabaseManager } from '@nocobase/db';
import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';

import { workflowStore } from '../../server/collections/store.js';
import {
  EXECUTION_REASON,
  EXECUTION_STATUS,
} from '../../server/engine/constants.js';
import Dispatcher from '../../server/engine/dispatcher.js';
import WorkflowEngine from '../../server/engine/engine.js';
import { createTimeoutReaper } from '../../server/engine/timeout-reaper.js';
import {
  asIdFilter,
  nowInstant,
  serializeJson,
} from '../../server/engine/utils.js';
import { WorkflowRunRepository } from '../../server/repositories/workflow-run-repository.js';
import type { WorkflowServiceApi } from '../../server/service.js';
import { echoInstruction } from '../fixtures/instructions.js';
import { createTestWorkflow, insertTestRun } from '../helpers.js';
import {
  CREATE_MIGRATION,
  integrationDialect,
  legacyTimestamp,
  startIntegrationDatabase,
  type IntegrationDatabase,
} from './helpers.js';

/**
 * A run's timestamps have to survive the database.
 *
 * They did not: `startedAt` and `finishedAt` were written and read through the
 * metadata-unaware query builder, and on PostgreSQL a zone-free column handed
 * back a `Date` rebuilt in the host's zone. Because `startedAt` was written
 * once, read, and written again on completion while `finishedAt` was written
 * fresh, the pair drifted apart by a whole host offset and every finished node
 * reported a duration of about 28800 seconds.
 *
 * Two things fixed it, and this suite covers the second. The columns became
 * `datetimeTz`, which is what they always meant. And the engine moved onto the
 * Repository, which is the layer that knows what `datetimeTz` costs on each
 * database and formats these columns at the SQL boundary rather than letting a
 * driver decode them — so there is no dialect branch in the plugin any more,
 * and no connection option a deployment has to remember.
 *
 * This runs against whichever database `NOCOBASE_TEST_DB_DIALECT` names,
 * defaulting to SQLite, which stores the string verbatim and therefore proves
 * the shape rather than the conversion. PostgreSQL and MySQL are the two that
 * convert; see `helpers.ts` for how to run them.
 */

const ONE_MINUTE = 60_000;
const CANONICAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const dialect = integrationDialect();

describe(`workflow instants [${dialect}]`, () => {
  let fixture: IntegrationDatabase | null = null;

  afterEach(async () => {
    await fixture?.destroy();
    fixture = null;
  });

  async function start(upTo?: string): Promise<DatabaseManager> {
    fixture = await startIntegrationDatabase();
    await fixture.migrate(upTo);
    return fixture.database;
  }

  async function runOneNode(): Promise<{
    database: DatabaseManager;
    runId: string;
  }> {
    const db = await start();
    const workflow = await createTestWorkflow(db, {
      key: 'instant-probe',
      nodes: [{ key: 'only', type: 'echo' }],
    });
    const engine = new WorkflowEngine({ database: db });
    engine.registerInstruction(echoInstruction);
    await engine.initialize();
    try {
      await engine.trigger(workflow, {}, { eventKey: 'instant-probe' });
    } finally {
      await engine.dispose();
    }
    const run = await workflowStore(db).runs.findOne({
      filter: { eventKey: 'instant-probe' },
      select: (select) => select.fields('id'),
    });
    if (!run) throw new Error('The probe run was not persisted');
    return { database: db, runId: String(run.id) };
  }

  it('reports what the clock says, not what the driver assumed', async () => {
    const before = Date.now();
    const { database: db, runId } = await runOneNode();
    const after = Date.now();

    const repository = new WorkflowRunRepository(
      db,
      {} as unknown as WorkflowServiceApi,
    );
    const detail = await repository.get(runId);

    const timestamps = {
      createdAt: detail.createdAt,
      startedAt: detail.startedAt,
      finishedAt: detail.finishedAt,
    };
    expect(timestamps).toEqual({
      createdAt: expect.stringMatching(CANONICAL),
      startedAt: expect.stringMatching(CANONICAL),
      finishedAt: expect.stringMatching(CANONICAL),
    });
    expect(
      Object.entries(timestamps).filter(([, value]) => {
        const at = new Date(value!).getTime();
        return at < before - ONE_MINUTE || at > after + ONE_MINUTE;
      }),
    ).toEqual([]);

    // The regression itself: a node that finished in milliseconds must not
    // look like it took a host offset to do it.
    const [node] = detail.nodeRuns;
    expect(node).toBeDefined();
    const elapsed =
      new Date(node!.finishedAt!).getTime() -
      new Date(node!.startedAt).getTime();
    expect(elapsed).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(ONE_MINUTE);
  });

  it('hands back exactly the instant it was given', async () => {
    const db = await start();
    const workflow = await createTestWorkflow(db, {
      key: 'instant-fidelity',
      nodes: [],
    });
    const instant = nowInstant();
    await workflowStore(db).runs.createOne({
      values: {
        workflowId: Number(workflow.id),
        workflowKey: workflow.key,
        eventKey: 'instant-fidelity',
        input: serializeJson({}),
        parameters: serializeJson({}),
        stack: serializeJson([]),
        output: serializeJson(null),
        dispatched: false,
        manually: false,
        startedAt: instant,
        finishedAt: instant,
        expiresAt: instant,
        createdAt: instant,
      },
    });

    const repository = new WorkflowRunRepository(
      db,
      {} as unknown as WorkflowServiceApi,
    );
    const [item] = (await repository.list({ workflowKey: workflow.key })).data;
    expect(item).toMatchObject({
      createdAt: instant,
      startedAt: instant,
      finishedAt: instant,
    });
  });

  it.runIf(dialect === 'mysql')(
    'reads the same instant whatever the connection time zone says',
    async () => {
      // `DATETIME(3)` records nothing about a zone, so which instant the stored
      // bytes denote used to depend on mysql2's `timezone`: the engine bound a
      // `Date` and the driver picked the wall clock. That is why a deployment
      // had to set `'Z'`, and why one that did not was wrong by the host
      // offset. The Repository writes the wall clock as text and reads it back
      // with `date_format`, so the driver never gets a say — which is what
      // these two connections, disagreeing by eight hours, demonstrate.
      const db = await start();
      const workflow = await createTestWorkflow(db, {
        key: 'instant-zone',
        nodes: [],
      });
      const instant = nowInstant();
      await workflowStore(db).runs.createOne({
        values: {
          workflowId: Number(workflow.id),
          workflowKey: workflow.key,
          eventKey: 'instant-zone',
          input: serializeJson({}),
          parameters: serializeJson({}),
          stack: serializeJson([]),
          output: serializeJson(null),
          dispatched: false,
          manually: false,
          startedAt: instant,
          createdAt: instant,
        },
      });

      for (const timezone of ['+08:00', 'Z', '-05:00']) {
        const other = fixture!.open({ mysqlTimezone: timezone });
        const row = await workflowStore(other).runs.findOne({
          filter: { eventKey: 'instant-zone' },
          select: (select) => select.fields('startedAt'),
        });
        expect(row?.startedAt).toBe(instant);
      }
    },
  );

  /**
   * Reading and writing an instant is only half of it: the reaper and the
   * recovery sweep both *compare* one in SQL, against a bound value. A dialect
   * that converts on the way in gets those comparisons wrong in a way no
   * round-trip test would show — the sweep silently reclaims nothing, or
   * everything — so they are exercised here rather than only on SQLite, where
   * the comparison is over strings that happen to sort correctly.
   */
  it('compares deadlines in the database, not in the host time zone', async () => {
    const db = await start();
    const workflow = await createTestWorkflow(db, {
      key: 'instant-deadline',
      nodes: [],
    });
    const minutes = (count: number): string =>
      new Date(Date.now() + count * 60_000).toISOString();
    const expired = await insertTestRun(db, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'past-deadline',
      status: EXECUTION_STATUS.STARTED,
      dispatched: true,
      startedAt: minutes(-30),
      expiresAt: minutes(-1),
    });
    const live = await insertTestRun(db, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'future-deadline',
      status: EXECUTION_STATUS.STARTED,
      dispatched: true,
      startedAt: minutes(-30),
      expiresAt: minutes(30),
    });

    await expect(createTimeoutReaper({ database: db }).sweep()).resolves.toBe(
      1,
    );

    const runs = workflowStore(db).runs;
    expect(
      await runs.findOne({
        filter: { id: asIdFilter(expired) },
        select: (select) => select.fields('status', 'reason'),
      }),
    ).toEqual({
      status: EXECUTION_STATUS.ABORTED,
      reason: EXECUTION_REASON.TIMEOUT,
    });
    expect(
      await runs.findOne({
        filter: { id: asIdFilter(live) },
        select: (select) => select.fields('status', 'reason'),
      }),
    ).toEqual({ status: EXECUTION_STATUS.STARTED, reason: null });
  });

  it('applies the recovery grace period against the stored createdAt', async () => {
    const db = await start();
    const workflow = await createTestWorkflow(db, {
      key: 'instant-recovery',
      nodes: [{ key: 'only', type: 'echo' }],
    });
    await insertTestRun(db, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'old-enough',
      createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    });
    await insertTestRun(db, {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      eventKey: 'too-recent',
      createdAt: nowInstant(),
    });

    const published: string[] = [];
    const dispatcher = new Dispatcher({
      database: db,
      instructions: new Map(),
      queue: {
        publish: async (task) => {
          published.push(String(task.executionId));
        },
      },
    });

    // Only the hour-old run is past a one-minute grace period. A dialect that
    // stored `createdAt` shifted by the host offset would pick up both, or
    // neither, depending on the sign.
    await expect(dispatcher.recover({ gracePeriod: 60_000 })).resolves.toBe(1);
    expect(published).toHaveLength(1);
  });

  it('converts a row written before the columns carried a zone', async () => {
    // The value the engine used to store: a UTC wall clock with nothing saying
    // so. Bound as raw SQL because these bytes were written by an older build,
    // through a query builder that passed strings to the driver untouched; the
    // temporal encoder of the build under test would resolve the offset against
    // the host and store a wall clock instead, which is a different row from the
    // one the migration has to convert.
    // On PostgreSQL the migration widens the column, and widening reads each
    // value in the session time zone — which is why it pins that to UTC.
    const legacy = '2026-08-24T01:18:19.007Z';
    const db = await start(CREATE_MIGRATION);
    const workflow = await createTestWorkflow(db, {
      key: 'instant-legacy',
      nodes: [],
    });
    const client = await db.connection().client<Knex>();
    const written = client.raw('?', [legacyTimestamp(legacy)]);
    await db
      .query()
      .insertInto('workflowRuns')
      .values({
        workflowId: workflow.id,
        workflowKey: workflow.key,
        eventKey: 'instant-legacy',
        input: JSON.stringify({}),
        parameters: JSON.stringify({}),
        stack: JSON.stringify([]),
        output: JSON.stringify(null),
        dispatched: false,
        manually: false,
        startedAt: written,
        createdAt: written,
      })
      .execute();

    await fixture!.migrate();

    const row = await workflowStore(db).runs.findOne({
      filter: { eventKey: 'instant-legacy' },
      select: (select) => select.fields('createdAt', 'startedAt'),
    });
    expect({ createdAt: row?.createdAt, startedAt: row?.startedAt }).toEqual({
      createdAt: legacy,
      startedAt: legacy,
    });
  });
});
