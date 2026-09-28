import type { DatabaseManager } from '@nocobase/db';
import type { ScheduleExecutionContext as FiringContext } from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createScheduleDispatchJob,
  type ScheduleJobSpec,
} from '../server/dispatch.js';
import { ScheduleOccurrenceStore } from '../server/occurrences.js';
import { ScheduleOccurrenceError } from '../server/occurrences.js';
import {
  ScheduleTargetRegistry,
  type ScheduleTargetType,
} from '../server/schedules/registry.js';
import { DefaultSchedulerService } from '../server/services/scheduler.js';
import type { ScheduleStore } from '../server/store.js';
import { createSchedulerDatabase } from './support/scheduler.js';

const SPEC: Omit<ScheduleJobSpec, 'target'> = {
  id: 'schedule-1',
  cron: '0 * * * *',
  timezone: 'UTC',
  definitionHash: 'hash',
};

function firing(jobId: string): FiringContext {
  return {
    jobId,
    scheduledAt: new Date('2026-09-24T01:00:00.000Z'),
    runAt: new Date('2026-09-24T01:00:01.000Z'),
    signal: new AbortController().signal,
  };
}

describe('@nocobase/app-plugin-scheduler', () => {
  let database: DatabaseManager;

  beforeEach(async () => {
    database = await createSchedulerDatabase();
    await database
      .query()
      .insertInto('schedule_definitions')
      .values({
        id: 'schedule-1',
        app_name: 'test',
        key: 'key',
        source_type: 'code',
        title: 'Schedule',
        definition_hash: 'hash',
        cron: '* * * * *',
        timezone: 'UTC',
        enabled: true,
        target_type: 'test',
        target_config: {},
        lifecycle_state: 'active',
        sync_status: 'synced',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();
  });

  function dispatcher(
    target: ScheduleTargetType,
    registry: ScheduleTargetRegistry = new ScheduleTargetRegistry(),
  ) {
    registry.register(target);
    const occurrences = new ScheduleOccurrenceStore(database);
    return createScheduleDispatchJob(
      { ...SPEC, target: { type: target.type, config: {} } },
      undefined,
      { targets: registry, occurrences },
    );
  }

  function occurrence(id: string) {
    return database
      .query()
      .selectFrom('schedule_occurrences')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  }

  afterEach(async () => database.destroy());

  it.each(['pending', 'running', 'unknown'] as const)(
    'keeps observing %s targets beyond a legacy deadline and accepts later success',
    async (state) => {
      const occurrences = new ScheduleOccurrenceStore(database);
      const registry = new ScheduleTargetRegistry();
      const inspect = vi.fn(async () => ({
        state,
        reason: 'temporarily-unavailable',
      }));
      registry.register({
        type: 'test',
        title: 'Test',
        validate: () => ({ valid: true }),
        start: async () => ({ state: 'completed', outcome: 'succeeded' }),
        inspect,
      });
      const reference = { type: 'workflow-run', id: 'run-1' };
      await occurrences.start(
        { scheduleId: 'schedule-1', occurrenceId: 'long-run' },
        'hash',
        'test',
      );
      await occurrences.wait('long-run', reference);
      await database
        .query()
        .updateTable('schedule_occurrences')
        .set({
          observationDeadlineAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        })
        .where('id', '=', 'long-run')
        .execute();
      expect(await occurrences.reconcile(registry)).toBe(0);
      await expect(
        database
          .query()
          .selectFrom('schedule_occurrences')
          .selectAll()
          .where('id', '=', 'long-run')
          .executeTakeFirst(),
      ).resolves.toMatchObject({
        status: 'waiting',
        finishedAt: null,
      });
      await occurrences.complete('long-run', reference, {
        status: 'succeeded',
      });
      await expect(
        database
          .query()
          .selectFrom('schedule_occurrences')
          .selectAll()
          .where('id', '=', 'long-run')
          .executeTakeFirst(),
      ).resolves.toMatchObject({
        status: 'succeeded',
      });
    },
  );

  it('builds the executor job from the schedule', () => {
    const job = createScheduleDispatchJob(
      {
        ...SPEC,
        from: new Date('2026-10-01T00:00:00.000Z'),
        to: new Date('2026-12-31T00:00:00.000Z'),
        target: { type: 'report', config: { reportKey: 'weekly' } },
      },
      3,
      {
        targets: new ScheduleTargetRegistry(),
        occurrences: new ScheduleOccurrenceStore(database),
      },
    );

    expect(job).toMatchObject({
      name: 'schedule-1',
      options: {
        cron: '0 * * * *',
        tz: 'UTC',
        // `from` is inclusive; the executor starts strictly after its date.
        startDate: new Date('2026-09-30T23:59:59.999Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        limit: 3,
      },
      payload: {
        target: { type: 'report', config: { reportKey: 'weekly' } },
        definitionHash: 'hash',
      },
    });
  });

  it('records one occurrence per firing and starts its target once', async () => {
    const start = vi.fn(async () => ({
      state: 'accepted' as const,
      reference: { type: 'queue-job', id: 'job-2' },
    }));
    const job = dispatcher({
      type: 'test',
      title: 'Test',
      validate: () => ({ valid: true }),
      describe: async () => ({ targetLabel: 'Test' }),
      start,
    });

    await job.execute(firing('occurrence-1'));
    await job.execute(firing('occurrence-1'));

    const rows = await database
      .query()
      .selectFrom('schedule_occurrences')
      .selectAll()
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: 'occurrence-1',
      scheduleId: 'schedule-1',
      status: 'waiting',
      executionCount: 1,
      targetReferenceType: 'queue-job',
      targetReferenceId: 'job-2',
    });
    expect(new Date(rows[0]!.scheduledAt as string).toISOString()).toBe(
      '2026-09-24T01:00:00.000Z',
    );
    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith(
      {},
      { scheduleId: 'schedule-1', occurrenceId: 'occurrence-1' },
    );
  });

  it('starts a firing delivered twice at once only once', async () => {
    const occurrences = new ScheduleOccurrenceStore(database);
    const context = { scheduleId: 'schedule-1', occurrenceId: 'racing' };

    const actions = await Promise.all([
      occurrences.start(context, 'hash', 'test'),
      occurrences.start(context, 'hash', 'test'),
    ]);

    expect(actions.sort()).toEqual(['noop', 'start']);
  });

  it.each([
    ['disabled', 'target-disabled'],
    ['missing', 'target-missing'],
    ['invalid', 'target-invalid'],
  ] as const)(
    'records a skipped occurrence when the target is %s',
    async (state, reason) => {
      const start = vi.fn();
      const job = dispatcher({
        type: 'test',
        title: 'Test',
        validate: () => ({ valid: true }),
        describe: async () => ({ targetLabel: 'Test', state }),
        start,
      });

      await job.execute(firing('occurrence-skipped'));
      await job.execute(firing('occurrence-skipped'));

      await expect(occurrence('occurrence-skipped')).resolves.toMatchObject({
        scheduleId: 'schedule-1',
        status: 'skipped',
        reason,
        executionCount: 0,
        finishedAt: expect.anything(),
      });
      expect(start).not.toHaveBeenCalled();
    },
  );

  it.each([
    [
      { state: 'completed', outcome: 'succeeded', result: { ok: true } },
      { status: 'succeeded', resultSummary: JSON.stringify({ ok: true }) },
    ],
    [
      { state: 'skipped', reason: 'nothing-to-do' },
      { status: 'skipped', reason: 'nothing-to-do' },
    ],
    [
      { state: 'failed', reason: 'rejected' },
      { status: 'failed', reason: 'rejected' },
    ],
  ] as const)('records the target result %o', async (result, expected) => {
    const job = dispatcher({
      type: 'test',
      title: 'Test',
      validate: () => ({ valid: true }),
      start: async () => result,
    });

    await job.execute(firing('occurrence-result'));

    await expect(occurrence('occurrence-result')).resolves.toMatchObject({
      ...expected,
      executionCount: 1,
    });
  });

  it('scopes a target handle to occurrences its own target started', async () => {
    const occurrences = new ScheduleOccurrenceStore(database);
    const scheduler = new DefaultSchedulerService(
      // Reporting a completion never reads the schedule store.
      {} as ScheduleStore,
      occurrences,
      new ScheduleTargetRegistry(),
    );
    const workflow = scheduler.registerTarget({
      type: 'workflow',
      title: 'Workflow',
      validate: () => ({ valid: true }),
      start: async () => ({ state: 'accepted', reference }),
    });
    const report = scheduler.registerTarget({
      type: 'report',
      title: 'Report',
      validate: () => ({ valid: true }),
      start: async () => ({ state: 'completed', outcome: 'succeeded' }),
    });
    const reference = { type: 'workflow-run', id: '7' };
    await occurrences.start(
      { scheduleId: 'schedule-1', occurrenceId: 'occurrence-scoped' },
      'hash',
      'workflow',
    );
    await occurrences.wait('occurrence-scoped', reference);

    // Registering any target must not grant the power to complete another
    // target's runs, even with a reference that otherwise matches the row.
    await expect(
      report.reportCompletion('occurrence-scoped', reference, {
        status: 'succeeded',
      }),
    ).rejects.toMatchObject<Partial<ScheduleOccurrenceError>>({
      code: 'REFERENCE_MISMATCH',
    });
    await expect(
      workflow.reportCompletion('occurrence-scoped', reference, {
        status: 'succeeded',
      }),
    ).resolves.toBeUndefined();
    await expect(
      database
        .query()
        .selectFrom('schedule_occurrences')
        .selectAll()
        .where('id', '=', 'occurrence-scoped')
        .executeTakeFirst(),
    ).resolves.toMatchObject({ status: 'succeeded' });
  });

  it('reports asynchronous completion idempotently and rejects reference or terminal conflicts', async () => {
    const store = new ScheduleOccurrenceStore(database);
    await store.start(
      {
        scheduleId: 'schedule-1',
        occurrenceId: 'occurrence-report',
      },
      'hash',
      'test',
    );
    const reference = { type: 'workflow-run', id: '42' };
    await store.wait('occurrence-report', reference, { eventKey: 'event-42' });
    await store.complete('occurrence-report', reference, {
      status: 'succeeded',
      result: { count: 2 },
    });
    await expect(
      store.complete('occurrence-report', reference, { status: 'succeeded' }),
    ).resolves.toBeUndefined();
    await expect(
      store.complete(
        'occurrence-report',
        { type: 'workflow-run', id: 'different' },
        { status: 'succeeded' },
      ),
    ).rejects.toMatchObject<Partial<ScheduleOccurrenceError>>({
      code: 'REFERENCE_MISMATCH',
    });
    await expect(
      store.complete('occurrence-report', reference, { status: 'failed' }),
    ).rejects.toMatchObject<Partial<ScheduleOccurrenceError>>({
      code: 'COMPLETION_CONFLICT',
    });
    await expect(
      database
        .query()
        .selectFrom('schedule_occurrences')
        .selectAll()
        .where('id', '=', 'occurrence-report')
        .executeTakeFirst(),
    ).resolves.toMatchObject({
      status: 'succeeded',
      targetReferenceType: 'workflow-run',
      targetReferenceId: '42',
      resultSummary: JSON.stringify({ count: 2 }),
    });
  });

  it('defers terminal notifications received before the target reference is persisted', async () => {
    const store = new ScheduleOccurrenceStore(database);
    await store.start(
      {
        scheduleId: 'schedule-1',
        occurrenceId: 'occurrence-race',
      },
      'hash',
      'workflow',
    );

    // The workflow terminal observer can win this race with dispatch.wait().
    await expect(
      store.complete(
        'occurrence-race',
        { type: 'workflow-run', id: '137' },
        {
          status: 'succeeded',
        },
      ),
    ).resolves.toBeUndefined();

    await store.wait('occurrence-race', {
      type: 'workflow-run',
      id: '137',
    });
    await store.complete(
      'occurrence-race',
      { type: 'workflow-run', id: '137' },
      {
        status: 'succeeded',
      },
    );
    await expect(
      database
        .query()
        .selectFrom('schedule_occurrences')
        .select('status')
        .where('id', '=', 'occurrence-race')
        .executeTakeFirst(),
    ).resolves.toMatchObject({ status: 'succeeded' });
  });

  it('records dispatch exceptions instead of leaving an occurrence running', async () => {
    const job = dispatcher({
      type: 'throws',
      title: 'Throws',
      validate: () => ({ valid: true }),
      describe: async () => ({ targetLabel: 'Throws' }),
      start: async () => {
        throw new Error('boom');
      },
    });

    await expect(job.execute(firing('occurrence-error'))).rejects.toThrow(
      'boom',
    );
    await expect(occurrence('occurrence-error')).resolves.toMatchObject({
      status: 'failed',
      reason: 'dispatch-failed',
    });
  });

  it('completes an accepted run the target already finished', async () => {
    const job = dispatcher({
      type: 'accepted',
      title: 'Accepted',
      validate: () => ({ valid: true }),
      start: async () => ({
        state: 'accepted',
        reference: { type: 'x', id: '1' },
      }),
      inspect: async () => ({
        state: 'completed',
        completion: { status: 'succeeded', result: { rows: 3 } },
      }),
    });

    await job.execute(firing('occurrence-inspected'));

    await expect(occurrence('occurrence-inspected')).resolves.toMatchObject({
      status: 'succeeded',
      targetReferenceId: '1',
    });
  });

  it('preserves the original error when inspection fails after wait', async () => {
    const job = dispatcher({
      type: 'accepted',
      title: 'Accepted',
      validate: () => ({ valid: true }),
      describe: async () => ({ targetLabel: 'Accepted' }),
      start: async () => ({
        state: 'accepted',
        reference: { type: 'x', id: '1' },
      }),
      inspect: async () => {
        throw new Error('inspect-boom');
      },
    });

    await expect(
      job.execute(firing('occurrence-inspect-error')),
    ).rejects.toThrow('inspect-boom');
  });

  it('reconciles a missed asynchronous completion from the target observer', async () => {
    const store = new ScheduleOccurrenceStore(database);
    const registry = new ScheduleTargetRegistry();
    registry.register({
      type: 'observed',
      title: 'Observed',
      validate: () => ({ valid: true }),
      describe: async () => ({ targetLabel: 'Observed' }),
      start: async () => ({
        state: 'accepted',
        reference: { type: 'remote-run', id: 'run-1' },
      }),
      inspect: async () => ({
        state: 'completed',
        completion: { status: 'failed', reason: 'execution-failed' },
      }),
    });
    await store.start(
      {
        scheduleId: 'schedule-1',
        occurrenceId: 'occurrence-reconcile',
      },
      'hash',
      'observed',
    );
    await store.wait('occurrence-reconcile', {
      type: 'remote-run',
      id: 'run-1',
    });

    await expect(store.reconcile(registry)).resolves.toBe(1);
    await expect(
      database
        .query()
        .selectFrom('schedule_occurrences')
        .selectAll()
        .where('id', '=', 'occurrence-reconcile')
        .executeTakeFirst(),
    ).resolves.toMatchObject({
      status: 'failed',
      reason: 'execution-failed',
      lastObservedAt: expect.anything(),
    });
  });
});
