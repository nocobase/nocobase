// @vitest-environment node
import { RUNNER_ROUTES, type RunInput } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';
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
            (role === 'executor' &&
              ['todo', 'blocked', 'in_progress'].includes(status));
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
