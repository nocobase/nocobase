// @vitest-environment node
import { RUNNER_ROUTES, type RunInput } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  issueClaimRejection,
  sampleIssue,
} from '../../server/agents/issue-subject.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

const coder = { id: 'developer', actions: ['studio.git/open-pr'] };
const triggers = [
  'comment',
  'mention',
  'statusChange',
  'prChecksFailed',
  'prConflict',
  'subtasksFinished',
  'unblocked',
  'retry',
];
const statuses = [
  'todo',
  'blocked',
  'in_progress',
  'analysis',
  'proposal_review',
  'in_review',
];
const roles = ['executor', 'current-stage', 'old-stage'] as const;
function input(
  trigger: string,
  payload: Record<string, unknown> = {},
): RunInput {
  return {
    id: 'input',
    type: trigger === 'comment' ? 'comment' : 'signal',
    actor: { kind: 'system', id: 'system', name: 'Studio' },
    text: 'New input',
    at: new Date().toISOString(),
    payload: { trigger, ...payload },
  };
}

describe('issue claim admission', () => {
  for (const status of statuses)
    for (const role of roles)
      for (const trigger of triggers) {
        it(`${status}: ${role} receives ${trigger}`, () => {
          const context = {
            ...sampleIssue('issue'),
            executor: { type: 'agent', id: coder.id, name: 'Developer' },
            status: {
              key: status,
              name: status,
              category:
                status === 'todo'
                  ? ('unstarted' as const)
                  : ('started' as const),
            },
          };
          const agent = role === 'executor' ? coder : { ...coder, id: role };
          const rules = [
            {
              type: 'runAgent',
              config: { agentId: 'current-stage', assign: false },
            },
          ];
          const inputs = [
            input(trigger),
            ...(role === 'old-stage'
              ? [input('stageEntered', { to: 'previous' })]
              : []),
          ];
          const permitted =
            role === 'current-stage' ||
            (role === 'executor'
              ? ['todo', 'blocked', 'in_progress'].includes(status)
              : trigger === 'mention');
          expect(issueClaimRejection(context, agent, inputs, rules)).toEqual(
            permitted
              ? null
              : expect.objectContaining({ reason: 'stageMismatch' }),
          );
        });
      }
  it('rejects a non-developer executor in development', () => {
    const context = {
      ...sampleIssue('issue'),
      executor: { type: 'agent', id: coder.id, name: 'Designer' },
    };
    expect(
      issueClaimRejection(
        context,
        { ...coder, actions: [] },
        [input('mention')],
        [{ type: 'runAgent' }],
      ),
    ).toMatchObject({ reason: 'executorCannotImplement' });
  });
  it('cancels old stage work even when it includes a human comment', () => {
    const context = {
      ...sampleIssue('issue'),
      executor: { type: 'agent', id: coder.id, name: 'Developer' },
      status: {
        key: 'in_review',
        name: 'Review',
        category: 'started' as const,
      },
    };
    expect(
      issueClaimRejection(
        context,
        coder,
        [input('stageEntered', { to: 'in_progress' }), input('comment')],
        [],
      ),
    ).toMatchObject({ reason: 'stageMismatch' });
  });
  it('leaves an earlier stage entry out of executor work in its own statuses rather than cancelling it', () => {
    for (const status of ['todo', 'blocked', 'in_progress']) {
      const context = {
        ...sampleIssue('issue'),
        executor: { type: 'agent', id: coder.id, name: 'Developer' },
        status: { key: status, name: status, category: 'started' as const },
      };
      expect(
        issueClaimRejection(
          context,
          coder,
          [input('stageEntered', { to: 'in_progress' }), input('comment')],
          [],
        ),
      ).toBeNull();
    }
  });
  it('cancels work holding nothing but an earlier stage entry', () => {
    const context = {
      ...sampleIssue('issue'),
      executor: { type: 'agent', id: coder.id, name: 'Developer' },
      status: { key: 'todo', name: 'Todo', category: 'unstarted' as const },
    };
    expect(
      issueClaimRejection(
        context,
        coder,
        [input('stageEntered', { to: 'in_progress' })],
        [],
      ),
    ).toMatchObject({ reason: 'stageMismatch' });
  });
  it('runs an agent mentioned by name in any stage, but keeps the executor to its statuses', () => {
    for (const status of ['analysis', 'proposal_review', 'in_review']) {
      const context = {
        ...sampleIssue('issue'),
        executor: { type: 'agent', id: coder.id, name: 'Developer' },
        status: { key: status, name: status, category: 'started' as const },
      };
      expect(
        issueClaimRejection(
          context,
          { id: 'consultant', actions: [] },
          [input('mention')],
          [],
        ),
      ).toBeNull();
      expect(
        issueClaimRejection(context, coder, [input('mention')], []),
      ).toMatchObject({ reason: 'stageMismatch' });
    }
  });
  it('uses current stage work even when an obsolete entry merges before or after it', () => {
    const context = {
      ...sampleIssue('issue'),
      executor: { type: 'agent', id: coder.id, name: 'Developer' },
    };
    const old = input('stageEntered', { to: 'analysis' });
    const current = input('stageEntered', { to: 'in_progress' });
    for (const inputs of [
      [old, current],
      [current, old],
    ]) {
      expect(
        issueClaimRejection(context, coder, inputs, [{ type: 'runAgent' }]),
      ).toBeNull();
    }
  });
});

let h: BridgeHarness;
afterEach(async () => {
  await h?.close();
});
describe('claiming queued issue work', () => {
  it('cancels a mixed executor queue after moving to review, without relocating comments or retrying', async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    const agent = await h.createAgent();
    h.roles.set('alice', 'admin');
    const workflow = await h.projects.workflows.create(h.viewer('alice'), {
      name: 'Development',
      copyFrom: null,
    });
    await h.projects.workflows.update(h.viewer('alice'), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'in_progress'
            ? { ...state, rules: [{ type: 'runAgent', config: {} }] }
            : state,
        ),
      },
    });
    await h.projects.workflows.setDefault(h.viewer('alice'), workflow.id);
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Queued development',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agent },
    });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'Keep this requirement in the issue context.',
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    const before = await h.agents.runs.openOn(h.projects.tx.read(), {
      kind: 'issue',
      id: issue.id,
    });
    expect(before.length).toBeGreaterThan(0);
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      statusKey: 'in_review',
    });
    expect(await h.claimOne()).toBeUndefined();
    for (const run of before)
      expect(await h.agents.runs.get(run.id)).toMatchObject({
        status: 'cancelled',
        attempt: 1,
        failureDetail: expect.stringContaining('stageMismatch'),
      });
    const review = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: review.revision,
      statusKey: 'in_progress',
      start: true,
    });
    const payload = await h.claimOne();
    expect(payload.prompt.system).toContain(
      'Keep this requirement in the issue context.',
    );
    expect(payload.run.attempt).toBe(1);
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/work',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    const working = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: working.revision,
      statusKey: 'in_review',
    });
    expect((await h.agents.runs.get(payload.run.id)).status).toBe('running');
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'REVIEW_STAGE_COMMENT',
    });
    const held = await h.agents.runs.detail(payload.run.id);
    expect(JSON.stringify(held.inputs)).not.toContain('REVIEW_STAGE_COMMENT');
    const lease = await h.runner(RUNNER_ROUTES.lease, payload.run.id, {});
    expect(JSON.stringify(lease.body.inputs)).not.toContain(
      'REVIEW_STAGE_COMMENT',
    );
    const waiting = (
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id })
    ).filter((run) => run.status === 'queued');
    expect(waiting).toHaveLength(1);
    expect(
      JSON.stringify((await h.agents.runs.detail(waiting[0]!.id)).inputs),
    ).toContain('REVIEW_STAGE_COMMENT');
  });

  it('does not deliver input a working executor received before its issue left development', async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    const agent = await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Undelivered development input',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agent },
    });
    const payload = await h.claimOne();
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/work',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'DEVELOPMENT_COMMENT',
    });
    const appended = await h.agents.runs.detail(payload.run.id);
    const comment = appended.inputs.find((item) =>
      item.text.includes('DEVELOPMENT_COMMENT'),
    );
    expect(comment).toMatchObject({ deliveredAt: null, handledAt: null });
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      statusKey: 'in_review',
    });
    const lease = await h.runner(RUNNER_ROUTES.lease, payload.run.id, {});
    expect(lease.body.inputs.map((item: RunInput) => item.id)).toEqual(
      payload.inputs.map((item: RunInput) => item.id),
    );
    const after = await h.agents.runs.detail(payload.run.id);
    expect(after.inputs.find((item) => item.id === comment!.id)).toMatchObject({
      deliveredAt: null,
      handledAt: expect.any(String),
    });
    const done = await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
      summary: 'Stopped at the stage change.',
      handledInputIds: payload.inputs.map((item: RunInput) => item.id),
    });
    expect(done.status).toBe(200);
  });

  it('keeps a comment that joined queued development work after the issue went back to todo', async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    const agent = await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Back to todo',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agent },
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      statusKey: 'todo',
    });
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'TODO_STAGE_COMMENT',
    });
    const payload = await h.claimOne();
    expect(payload).toBeDefined();
    expect(payload.prompt.turn).toContain('TODO_STAGE_COMMENT');
    expect(
      payload.inputs.some(
        (item: RunInput) =>
          (item.payload as { trigger?: string }).trigger === 'stageEntered',
      ),
    ).toBe(false);
  });
});

it('reads a stage change committed after candidate selection and before the claim transaction', async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  const agent = await h.createAgent();
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Switch before admission',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: agent },
  });
  let release!: () => void;
  let selected!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    selected = resolve;
  });
  const stop = h.agents.briefs.sections.register({
    key: 'hold-claim',
    prepare: async (run) => {
      if (run.subject.id === issue.id) {
        selected();
        await barrier;
      }
    },
    section: async () => null,
  });
  const claiming = h.claimOne();
  await ready;
  try {
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: current.revision,
      statusKey: 'in_review',
    });
  } finally {
    release();
  }
  expect(await claiming).toBeUndefined();
  stop();
  expect(
    (
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id })
    ).every((run) => run.status === 'cancelled'),
  ).toBe(true);
});

for (const order of [
  ['analysis', 'in_progress'],
  ['in_progress', 'analysis'],
]) {
  it(`delivers only current stage inputs when merged in order ${order.join(', ')}`, async () => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    const agent = await h.createAgent();
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Late stage input',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: agent },
      start: false,
    });
    for (const to of order) {
      const instruction =
        to === 'analysis' ? 'OBSOLETE_DESIGN_ONLY' : 'IMPLEMENT_NOW';
      await h.agents.runs.enqueue({
        agentId: agent,
        actorUserId: 'alice',
        subject: { kind: 'issue', id: issue.id },
        input: {
          type: 'signal',
          actor: { kind: 'system', id: 'system', name: 'Studio' },
          text: `Workflow stage instruction: ${instruction}`,
          payload: { trigger: 'stageEntered', to, instruction },
        },
      });
    }
    await h.projects.comments.create(h.viewer('alice'), issue.id, {
      content: 'Keep the human requirement.',
    });
    const payload = await h.claimOne();
    expect(payload.prompt.system).not.toContain('OBSOLETE_DESIGN_ONLY');
    expect(payload.prompt.turn).not.toContain('OBSOLETE_DESIGN_ONLY');
    expect(JSON.stringify(payload.inputs)).not.toContain(
      'OBSOLETE_DESIGN_ONLY',
    );
    expect(payload.prompt.turn).toContain('IMPLEMENT_NOW');
    expect(payload.prompt.turn).toContain('Keep the human requirement.');
    expect(
      payload.inputs.some((item: RunInput) => item.type === 'comment'),
    ).toBe(true);
    await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/work',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    const done = await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
      summary: 'Implemented current requirements.',
      handledInputIds: payload.inputs.map((item: RunInput) => item.id),
    });
    expect(done.status).toBe(200);
    expect((await h.agents.runs.get(payload.run.id)).status).toBe('completed');
  });
}

it('records a permission rejection and tells the owner once, then starts after reassignment', async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  const agent = await h.createAgent({ actions: ['pm.issues/view'] });
  const notices: {
    type: string;
    userIds: readonly string[];
    params: Record<string, string>;
  }[] = [];
  h.projects.events.on('notice.planned', (event) => {
    notices.push(event.notice);
  });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Missing pull request capability',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: agent },
  });
  expect(await h.claimOne()).toBeUndefined();
  const [run] = await h.agents.runs.list({
    subjectKind: 'issue',
    subjectId: issue.id,
  });
  expect(run).toMatchObject({
    status: 'cancelled',
    failureDetail: expect.stringContaining('studio.git/open-pr'),
  });
  const activity = h.projects.tx
    .read()
    .repository<{ details: Record<string, unknown> }>('pmActivities');
  expect(
    (await activity.findMany({ filter: { issueId: issue.id } })).filter(
      (row) => row.details?.reason === 'executorCannotImplement',
    ),
  ).toHaveLength(1);
  await vi.waitFor(() =>
    expect(
      notices.filter(
        (notice) => notice.params.reason === 'executorCannotImplement',
      ),
    ).toHaveLength(1),
  );
  expect(
    notices.find(
      (notice) => notice.params.reason === 'executorCannotImplement',
    ),
  ).toMatchObject({
    userIds: ['alice'],
    params: {
      body: expect.stringContaining('studio.git/open-pr'),
      agentId: agent,
    },
  });
  const planning = vi.spyOn(h.projects.tx, 'run');
  for (let delivery = 0; delivery < 3; delivery++)
    h.agents.events.emit({
      type: 'run.changed',
      runId: run.id,
      status: 'cancelled',
    });
  await vi.waitFor(() =>
    expect(planning.mock.calls.length).toBeGreaterThanOrEqual(3),
  );
  await Promise.all(planning.mock.results.map((result) => result.value));
  planning.mockRestore();
  expect(await h.claimOne()).toBeUndefined();
  expect(
    notices.filter(
      (notice) => notice.params.reason === 'executorCannotImplement',
    ),
  ).toHaveLength(1);
  const developer = await h.createAgent();
  const current = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    issue.id,
  );
  await h.projects.issues.update(h.viewer('alice'), issue.id, {
    revision: current.revision,
    executor: { type: 'agent', id: developer },
    start: true,
  });
  expect((await h.claimOne()).run.id).not.toBe(run.id);
});

it('does not notify the owner for a normal stage mismatch', async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  const agent = await h.createAgent();
  const notices: unknown[] = [];
  h.projects.events.on('notice.planned', (event) => {
    notices.push(event.notice);
  });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Old executor work',
    statusKey: 'in_review',
    executor: { type: 'agent', id: agent },
    start: true,
  });
  notices.length = 0;
  expect(await h.claimOne()).toBeUndefined();
  const activities = await h.projects.tx
    .read()
    .repository('pmActivities')
    .findMany({ filter: { issueId: issue.id } });
  expect(
    activities.some((row) => row.details?.reason === 'executorCannotImplement'),
  ).toBe(false);
  expect(notices).toEqual([]);
});

it('rolls back the cancellation and its activity when the claim transaction fails', async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  const agent = await h.createAgent({ actions: ['pm.issues/view'] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Atomic rejection',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: agent },
  });
  const sink = h.agents.subjects.get('issue')!.sink!;
  const finish = sink.onRunFinished!;
  const spy = vi
    .spyOn(sink, 'onRunFinished')
    .mockImplementationOnce(async (tx, run) => {
      await finish(tx, run);
      throw new Error('Abort cancellation transaction');
    });
  try {
    await h.claimOne();
  } catch {
    /* The claim endpoint may return the transaction failure. */
  }
  expect(
    (await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id }))[0]
      .status,
  ).toBe('queued');
  const activities = await h.projects.tx
    .read()
    .repository('pmActivities')
    .findMany({ filter: { issueId: issue.id } });
  expect(
    activities.some((row) => row.details?.reason === 'executorCannotImplement'),
  ).toBe(false);
  spy.mockRestore();
  expect(await h.claimOne()).toBeUndefined();
  const recorded = await h.projects.tx
    .read()
    .repository('pmActivities')
    .findMany({ filter: { issueId: issue.id } });
  expect(
    recorded.filter((row) => row.details?.reason === 'executorCannotImplement'),
  ).toHaveLength(1);
});
