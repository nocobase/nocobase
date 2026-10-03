import type { DatabaseManager } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { describe, expect, it, vi } from 'vitest';

import { EXECUTION_STATUS } from '../server/engine/constants.js';
import { WorkflowInvocationError } from '../server/engine/invocation.js';
import {
  WorkflowScheduleTarget,
  workflowCompletion,
} from '../server/schedule-target.js';
import type { WorkflowServiceContract } from '../server/tokens.js';

const context = {
  scheduleId: 'schedule-1',
  occurrenceId: 'occurrence-2',
};

describe('WorkflowScheduleTarget', () => {
  it('describes workflows with their route id, not the workflow key', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    try {
      await database.builder().createCollection('workflows', (c) => {
        c.increments('id');
        c.string('key');
        c.string('title');
        c.boolean('enabled');
        c.boolean('current');
      });
      await database
        .query()
        .insertInto('workflows')
        .values({
          key: 'daily',
          title: 'Daily',
          enabled: true,
          current: true,
        })
        .execute();
      const target = createTarget(vi.fn(), database);
      await expect(
        target.describe({ workflowKey: 'daily' }),
      ).resolves.toMatchObject({
        href: '/settings/workflow/workflows/1',
      });
    } finally {
      await testDatabase.destroy();
    }
  });
  it('uses a stable occurrence-scoped event key and returns only a controlled receipt', async () => {
    const trigger = vi.fn(async () => ({
      status: 'accepted' as const,
      eventKey: 'schedule:schedule-1:occurrence-2',
      runId: '42',
    }));
    const target = createTarget(trigger);

    await expect(
      target.start({ workflowKey: 'daily', input: { customer: 1 } }, context),
    ).resolves.toEqual({
      state: 'accepted',
      reference: { type: 'workflow-run', id: '42' },
      receipt: { eventKey: 'schedule:schedule-1:occurrence-2' },
    });
    expect(trigger).toHaveBeenCalledWith(
      'daily',
      { customer: 1 },
      {
        eventKey: 'schedule:schedule-1:occurrence-2',
        sourceType: 'schedule',
        sourceId: 'occurrence-2',
      },
    );
  });

  it('does not trigger a second Workflow Run for the same occurrence', async () => {
    const testDatabase = await createTestDatabase();
    const { database } = testDatabase;
    try {
      await database
        .builder()
        .createCollection('workflowRuns', (collection) => {
          collection.increments('id');
          collection.string('eventKey').notNull().unique({ mode: 'index' });
        });
      const trigger = vi.fn(async (_key, _input, options) => {
        await database
          .query()
          .insertInto('workflow_runs')
          .values({ eventKey: options?.eventKey })
          .execute();
        return {
          status: 'accepted' as const,
          eventKey: options?.eventKey ?? '',
          runId: '1',
        };
      });
      const target = createTarget(trigger, database);
      const config = { workflowKey: 'daily' };
      await target.start(config, context);
      await expect(target.start(config, context)).resolves.toEqual({
        state: 'accepted',
        reference: { type: 'workflow-run', id: '1' },
        receipt: { eventKey: 'schedule:schedule-1:occurrence-2' },
      });
      expect(trigger).toHaveBeenCalledOnce();
      await expect(
        database.query().selectFrom('workflow_runs').selectAll().execute(),
      ).resolves.toHaveLength(1);
    } finally {
      await testDatabase.destroy();
    }
  });

  it.each([
    ['not-found', { state: 'failed', reason: 'target-not-found' }],
    ['disabled', { state: 'skipped', reason: 'target-disabled' }],
  ] as const)('maps a %s receipt', async (reason, expected) => {
    const target = createTarget(async () => ({ status: 'skipped', reason }));
    await expect(
      target.start({ workflowKey: 'daily' }, context),
    ).resolves.toEqual(expected);
  });

  it.each([
    [new WorkflowInvocationError('INVALID_INPUT', 'invalid'), 'invalid-input'],
    [new WorkflowInvocationError('INPUT_TOO_LARGE', 'large'), 'invalid-input'],
    [
      new Error('Workflow Artifact daily/hash is missing'),
      'artifact-unavailable',
    ],
    [new Error('network'), 'dispatch-failed'],
  ])('maps execution failure %s', async (error, reason) => {
    const target = createTarget(async () => {
      throw error;
    });
    await expect(
      target.start({ workflowKey: 'daily' }, context),
    ).resolves.toEqual({
      state: 'failed',
      reason,
    });
  });

  it('validates workflow key and object input without leaking input', () => {
    const target = createTarget(async () => ({
      status: 'skipped',
      reason: 'not-found',
    }));
    expect(target.validate({ workflowKey: '' })).toEqual({
      valid: false,
      reason: 'invalid-config',
    });
    expect(target.validate({ workflowKey: 'daily', input: [] })).toEqual({
      valid: false,
      reason: 'invalid-input',
    });
    expect(target.validate({ workflowKey: 'daily', input: {} })).toEqual({
      valid: true,
    });
  });
});

describe('workflowCompletion', () => {
  it('maps every terminal run status the same way for both report paths', () => {
    const finishedAt = new Date('2026-03-08T00:00:00.000Z');

    expect(
      workflowCompletion(EXECUTION_STATUS.RESOLVED, null, finishedAt),
    ).toEqual({ status: 'succeeded', finishedAt });
    expect(
      workflowCompletion(EXECUTION_STATUS.ABORTED, 'timeout', finishedAt),
    ).toEqual({
      status: 'timed_out',
      reason: 'execution-timeout',
      finishedAt,
    });
    expect(
      workflowCompletion(EXECUTION_STATUS.ABORTED, 'cancelled', finishedAt),
    ).toEqual({
      status: 'cancelled',
      reason: 'execution-cancelled',
      finishedAt,
    });
    expect(
      workflowCompletion(EXECUTION_STATUS.FAILED, null, finishedAt),
    ).toEqual({ status: 'failed', reason: 'execution-failed', finishedAt });
  });

  it('agrees with what inspect() reports for the same run', async () => {
    const finishedAt = new Date('2026-03-08T00:00:00.000Z');
    const database = runDatabase({
      id: 7,
      status: EXECUTION_STATUS.ABORTED,
      reason: 'timeout',
      finishedAt,
    });
    const target = new WorkflowScheduleTarget(database, {
      registerInstruction: () => {},
      trigger: async () => {
        throw new Error('not used');
      },
    });

    await expect(
      target.inspect({ type: 'workflow-run', id: '7' }),
    ).resolves.toEqual({
      state: 'completed',
      completion: workflowCompletion(
        EXECUTION_STATUS.ABORTED,
        'timeout',
        finishedAt,
      ),
    });
  });
});

function runDatabase(run: Record<string, unknown>): DatabaseManager {
  return {
    query: () => ({
      selectFrom: () => ({
        select: () => ({
          where: () => ({ executeTakeFirst: async () => run }),
        }),
      }),
    }),
  } as unknown as DatabaseManager;
}

function createTarget(
  trigger: WorkflowServiceContract['trigger'],
  database: DatabaseManager = emptyDatabase(),
): WorkflowScheduleTarget {
  return new WorkflowScheduleTarget(database, {
    registerInstruction: () => {},
    trigger,
  });
}

function emptyDatabase(): DatabaseManager {
  return {
    query: () => ({
      selectFrom: () => ({
        select: () => ({
          where: () => ({
            where: () => ({ executeTakeFirst: async () => undefined }),
            executeTakeFirst: async () => undefined,
          }),
        }),
      }),
    }),
  } as unknown as DatabaseManager;
}
