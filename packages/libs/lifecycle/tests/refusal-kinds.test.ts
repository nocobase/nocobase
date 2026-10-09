// A guard says whether it refuses because of who asks or because of what the
// record is waiting for, and a route answers the first with 403 and the
// second with 400, so a person who may act is not told they lack permission.
import { describe, expect, it } from 'vitest';

import {
  defineLifecycle,
  LifecycleError,
  lifecycleErrorFields,
  type Lifecycle,
  type LifecycleRecord,
} from '../src/index.js';
import { createLifecycleTestKit } from '../src/testing.js';

interface Job extends LifecycleRecord {
  readonly status: 'open' | 'done';
  readonly assigneeId: string;
  readonly openSubtasks: number;
}

interface JobTypes {
  record: Job;
  state: Job['status'];
  parameters: object;
  services: object;
}

const jobs: Lifecycle<JobTypes> = defineLifecycle<JobTypes>({
  name: 'jobs',
  initial: 'open',
  states: ['open', { name: 'done', final: true }],
  transitions: {
    complete: {
      from: 'open',
      to: 'done',
      guard: ({ record, actor }) =>
        actor.id !== record.assigneeId
          ? { code: 'NOT_ASSIGNEE', message: 'Only the assignee can.' }
          : record.openSubtasks === 0 || {
              code: 'SUBTASKS_OPEN',
              message: 'Close the subtasks first.',
              kind: 'precondition',
            },
    },
  },
});

async function refusal(promise: Promise<unknown>): Promise<LifecycleError> {
  return promise.then(
    () => {
      throw new Error('Expected a refusal.');
    },
    (error: unknown) => error as LifecycleError,
  );
}

describe('the kind of a guard’s refusal', () => {
  it('is a precondition the assignee is told about, not a denied permission', async () => {
    const kit = createLifecycleTestKit(jobs);
    const job = kit.create({ assigneeId: 'lin', openSubtasks: 2 });
    const blocker = {
      source: 'guard',
      kind: 'precondition',
      code: 'SUBTASKS_OPEN',
      message: 'Close the subtasks first.',
    };
    expect((await kit.available(job, 'lin'))[0].blockers).toEqual([blocker]);
    expect((await kit.can(job, 'complete', 'lin')).blockers).toEqual([blocker]);
    const refused = await refusal(
      kit.fire(job, 'complete', {}, { actor: 'lin' }),
    );
    expect(refused.blockers).toEqual([blocker]);
    expect(lifecycleErrorFields(refused)).toMatchObject({
      status: 'FAILED_PRECONDITION',
      reason: 'GUARD_REJECTED',
      metadata: { blockers: [blocker] },
    });
  });

  it('is a permission refusal unless the guard says otherwise', async () => {
    const kit = createLifecycleTestKit(jobs);
    const job = kit.create({ assigneeId: 'lin', openSubtasks: 0 });
    const refused = await refusal(
      kit.fire(job, 'complete', {}, { actor: 'he' }),
    );
    expect(refused.blockers).toEqual([
      {
        source: 'guard',
        kind: 'permission',
        code: 'NOT_ASSIGNEE',
        message: 'Only the assignee can.',
      },
    ]);
    expect(lifecycleErrorFields(refused)?.status).toBe('PERMISSION_DENIED');
  });

  it('applies to a guard added from outside, and one denied permission among the blockers is a 403', async () => {
    const kit = createLifecycleTestKit(jobs);
    const job = kit.create({ assigneeId: 'lin', openSubtasks: 0 });
    const remove = kit.runtime.addGuard<JobTypes>('jobs', 'complete', () => ({
      code: 'BUDGET_FROZEN',
      message: 'The budget is frozen.',
      kind: 'precondition',
    }));
    const frozen = await refusal(
      kit.fire(job, 'complete', {}, { actor: 'lin' }),
    );
    expect(frozen.blockers).toEqual([
      expect.objectContaining({ code: 'BUDGET_FROZEN', kind: 'precondition' }),
    ]);
    expect(lifecycleErrorFields(frozen)?.status).toBe('FAILED_PRECONDITION');
    const both = await refusal(kit.fire(job, 'complete', {}, { actor: 'he' }));
    expect(both.blockers.map((blocker) => blocker.kind)).toEqual([
      'permission',
      'precondition',
    ]);
    expect(lifecycleErrorFields(both)?.status).toBe('PERMISSION_DENIED');
    remove();
  });

  it('is a precondition for a transition the state does not allow', async () => {
    const kit = createLifecycleTestKit(jobs);
    const job = kit.create({ assigneeId: 'lin', openSubtasks: 0 });
    kit.update(job, { status: 'done' });
    expect((await kit.can(job, 'complete', 'lin')).blockers).toEqual([
      expect.objectContaining({ source: 'state', kind: 'precondition' }),
    ]);
  });
});
