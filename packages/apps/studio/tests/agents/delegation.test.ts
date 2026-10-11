// @vitest-environment node
/**
 * Delegate and report back: a plan the person executes from a conversation hands an issue to an agent, the
 * conversation follows it, and the issue's milestones come back to it as event cards that wake its agent, once each,
 * within a limit, never for what the person did themselves, and not once they stop following.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WAKE_LIMIT } from '../../server/agents/conversation/delegation.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
  // Carol may move anyone's issue.
  h.roles.set('carol', 'admin');
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

const PM_ACTIONS = [
  'pm.projects/view',
  'pm.issues/view',
  'pm.issues/create',
  'pm.issues/edit',
  'pm.issues/comment',
];

async function startRun(runId: string) {
  const started = await h.runner(RUNNER_ROUTES.start, runId, {
    workDir: '/tmp/w',
    adapter: { kind: 'claude' },
    acceptsInput: true,
  });
  expect(started.status).toBe(200);
}

async function completeRun(runId: string, summary: string) {
  const detail = await h.agents.runs.detail(runId);
  const done = await h.runner(RUNNER_ROUTES.complete, runId, {
    summary,
    handledInputIds: detail.inputs.map((input) => input.id),
  });
  expect(done.status).toBe(200);
}

/** Claims queued runs until it gets one on `kind`; the claimed payload. */
async function claimOn(kind: string): Promise<any> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const payload = await h.claimOne();
    if (!payload) break;
    const run = await h.agents.runs.get(payload.run.id as string);
    if (run.subject.kind === kind) return payload;
  }
  throw new Error(`No run on ${kind} was claimed.`);
}

interface Delegated {
  readonly conversationId: string;
  readonly coderId: string;
  readonly issueId: string;
  readonly identifier: string;
}

/**
 * Alice's PM agent proposes a plan that creates an issue for the Coder agent; its turn ends, and Alice executes the
 * plan, which queues the Coder's run.
 */
async function delegate(): Promise<Delegated> {
  const pmId = await h.createAgent({ name: 'PM', actions: PM_ACTIONS });
  const coderId = await h.createAgent({ name: 'Coder' });
  const conversation = await h.agents.conversations.create('alice', {
    agentId: pmId,
  });
  await h.agents.conversations.send('alice', conversation.id, {
    content: 'Get the login fixed.',
  });
  const payload = await h.claimOne();
  const runId = payload.run.id as string;
  const token = payload.cli.credential.content.token as string;
  await startRun(runId);
  const proposed = await h.request('POST', '/projects/plans', {
    runToken: token,
    body: {
      title: 'Hand the login to Coder',
      rows: [
        {
          op: 'issue.create',
          params: {
            title: 'Fix login',
            executor: { type: 'agent', id: coderId },
          },
        },
      ],
    },
  });
  expect(proposed.status).toBe(201);
  await completeRun(runId, 'Proposed a plan.');
  const plan = await h.projects.plans.get(alice(), proposed.body.data.id);
  const executed = await h.projects.plans.execute(alice(), plan.id, {
    revision: plan.revision,
  });
  expect(executed.status).toBe('executed');
  const created = executed.rows[0]?.result?.created;
  return {
    conversationId: conversation.id,
    coderId,
    issueId: created?.id as string,
    identifier: created?.identifier as string,
  };
}

/** The conversation's delegation cards, oldest first. */
async function cards(conversationId: string) {
  await h.delegations.settled();
  const page = await h.agents.conversations.messages(
    'alice',
    conversationId,
    {},
  );
  return page.items
    .map((message) => message.metadata.notice)
    .filter(
      (notice) => notice?.code === 'news' && notice.type === 'delegation',
    );
}

/** The inputs that woke the conversation's agent with a milestone. */
async function wakes(conversationId: string) {
  await h.delegations.settled();
  const runs = await h.agents.runs.list({
    subjectKind: 'conversation',
    subjectId: conversationId,
  });
  const inputs = [];
  for (const run of runs) {
    const detail = await h.agents.runs.detail(run.id);
    inputs.push(
      ...detail.inputs.filter(
        (input) =>
          (input.payload as { trigger?: string } | null)?.trigger ===
          'delegationReport',
      ),
    );
  }
  return inputs;
}

async function moveIssue(userId: string, issueId: string, statusKey: string) {
  const current = await h.projects.issueQueries.detail(
    h.viewer(userId),
    issueId,
  );
  await h.projects.issues.update(h.viewer(userId), issueId, {
    revision: current.revision,
    statusKey,
  });
}

describe('delegate and report back', () => {
  it('follows the issue a conversation’s executed plan handed to an agent', async () => {
    const delegated = await delegate();
    expect(await h.delegations.list('alice', delegated.conversationId)).toEqual(
      [
        expect.objectContaining({
          conversationId: delegated.conversationId,
          issueId: delegated.issueId,
          agentId: delegated.coderId,
          userId: 'alice',
          followed: true,
        }),
      ],
    );
    // Only the conversation's owner sees it.
    expect(await h.delegations.list('bob', delegated.conversationId)).toEqual(
      [],
    );
    const listed = await h.request(
      'GET',
      `/delegations?conversationId=${delegated.conversationId}`,
      { user: 'alice' },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.meta).toEqual({ total: 1 });
  });

  it('posts a card and wakes the conversation once when the agent’s run ends', async () => {
    const delegated = await delegate();
    const payload = await claimOn('issue');
    const runId = payload.run.id as string;
    await startRun(runId);
    await completeRun(runId, 'Fixed the login form and added a test.');

    const [card, ...more] = await cards(delegated.conversationId);
    expect(more).toEqual([]);
    expect(card).toMatchObject({
      code: 'news',
      type: 'delegation',
      params: {
        event: 'finished',
        issueId: delegated.issueId,
        identifier: delegated.identifier,
        agentName: 'Coder',
        excerpt: 'Fixed the login form and added a test.',
      },
    });
    expect(card?.code === 'news' && card.title).toBe(
      `${delegated.identifier} · Coder finished its work: Fixed the login form and added a test.`,
    );
    const woke = await wakes(delegated.conversationId);
    expect(woke).toHaveLength(1);
    expect(woke[0]).toMatchObject({
      type: 'signal',
      actor: { kind: 'agent', id: delegated.coderId, name: 'Coder' },
    });
    expect(woke[0]?.text).toContain('Coder finished its run on it.');
    // The same end heard again is not told twice.
    h.agents.events.emit({
      type: 'run.changed',
      runId,
      status: 'completed',
    });
    expect(await cards(delegated.conversationId)).toHaveLength(1);
  });

  it('reports a run that fails for good', async () => {
    const delegated = await delegate();
    const payload = await claimOn('issue');
    const runId = payload.run.id as string;
    await h.runner(RUNNER_ROUTES.fail, runId, {
      reason: 'toolAuth',
      detail: 'Not signed in.',
    });
    const [card] = await cards(delegated.conversationId);
    expect(card).toMatchObject({
      params: { event: 'failed', excerpt: 'toolAuth: Not signed in.' },
    });
  });

  it('ignores what the person did themselves, and reports anyone else closing the issue', async () => {
    const delegated = await delegate();
    // Alice finishing it, by hand or through her conversation's plan, is not news to her.
    await moveIssue('alice', delegated.issueId, 'done');
    expect(await cards(delegated.conversationId)).toEqual([]);
    await moveIssue('alice', delegated.issueId, 'todo');
    await moveIssue('carol', delegated.issueId, 'done');
    const [card, ...more] = await cards(delegated.conversationId);
    expect(more).toEqual([]);
    expect(card).toMatchObject({
      params: { event: 'issueClosed', status: 'Done' },
    });
  });

  it('stops the cards once the person stops following the issue', async () => {
    const delegated = await delegate();
    const [link] = await h.delegations.list('alice', delegated.conversationId);
    // Someone else's delegation is not found.
    const foreign = await h.request('PATCH', `/delegations/${link?.id}`, {
      user: 'bob',
      body: { followed: false },
    });
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.reason).toBe('DELEGATION_NOT_FOUND');
    const stopped = await h.request('PATCH', `/delegations/${link?.id}`, {
      user: 'alice',
      body: { followed: false },
    });
    expect(stopped.status).toBe(200);
    expect(stopped.body.data).toMatchObject({ followed: false });

    await moveIssue('carol', delegated.issueId, 'done');
    expect(await cards(delegated.conversationId)).toEqual([]);
    expect(await wakes(delegated.conversationId)).toEqual([]);
  });

  it('limits how often milestones wake the conversation, and still posts their cards', async () => {
    const delegated = await delegate();
    for (let round = 0; round <= WAKE_LIMIT; round += 1) {
      await moveIssue('carol', delegated.issueId, 'done');
      await moveIssue('carol', delegated.issueId, 'todo');
    }
    expect(await cards(delegated.conversationId)).toHaveLength(WAKE_LIMIT + 1);
    expect(await wakes(delegated.conversationId)).toHaveLength(WAKE_LIMIT);
  });
});
