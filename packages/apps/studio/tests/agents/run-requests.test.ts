// @vitest-environment node
/**
 * Work on an issue someone other than its owner causes, against a real database: it never runs as the owner on its
 * own. A comment, a status moved into a stage that runs agents, a finished sub-issue or a released dependency becomes
 * a run request the owner confirms (then it runs as them) or rejects, or the person who caused it runs as themselves.
 * Work a run causes goes on as that run's chain. Giving the issue to someone else runs nothing on the new owner's
 * runners until they confirm, and the previous owner can no longer confirm what waited for them.
 */
import {
  HEADERS,
  PROTOCOL_VERSION,
  RUNNER_ROUTES,
} from '@nocobase/agent-protocol';
import type { RegisterRequest } from '@nocobase/agent-protocol';
import type { Actor } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  RUN_REQUEST_EXPIRED_TYPE,
  RUN_REQUEST_TYPE,
  RUN_REQUESTS_SOURCE,
} from '../../shared/run-requests.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

/** Bob may change anybody's issues (an administrator), so his changes reach Alice's. */
function bobManages(): void {
  h.roles.set('bob', 'admin');
}

async function update(
  issue: Issue,
  patch: Record<string, unknown>,
  viewer = alice(),
): Promise<Issue> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  return h.projects.issues.update(viewer, issue.id, {
    revision: current.revision,
    ...patch,
  });
}

const runsOf = (issueId: string) =>
  h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });

const pendingFor = (userId: string) =>
  h.agents.runs.requests.list({
    userId,
    role: 'responsible',
    status: 'pending',
  });

/** Registers a runner of `userId`'s own (trust `ownerOnly`); returns what claims one run with it. */
async function personalRunner(userId: string) {
  const token = await h.agents.runners.createRegistrationToken(userId, {
    trust: 'ownerOnly',
  });
  const registration: RegisterRequest = {
    registrationToken: token.token,
    name: `${userId}-laptop`,
    hostname: 'laptop',
    os: 'darwin',
    arch: 'arm64',
    version: '0.0.1',
    protocolVersion: PROTOCOL_VERSION,
    features: ['input', 'checkout', 'directories', 'skills', 'secrets'],
    tools: [{ kind: 'claude', authenticated: true }],
    slots: 2,
  };
  const registered = await h.request('POST', '/agents/runners/register', {
    body: registration,
  });
  expect(registered.status).toBe(200);
  const key = registered.body.data.runnerKey as string;
  return async (): Promise<{ run: { id: string } } | undefined> => {
    const claimed = await h.request('POST', '/agents/runners/claim', {
      headers: { [HEADERS.runnerKey]: key },
      body: { free: 1 },
    });
    expect(claimed.status).toBe(200);
    return claimed.body.data.runs[0];
  };
}

/** Workflows whose `statusKey` runs the issue's agent on entering it. */
async function runAgentIn(statusKey: string): Promise<void> {
  h.roles.set('alice', 'admin');
  try {
    const created = await h.projects.workflows.create(alice(), {
      name: 'Staged',
      copyFrom: null,
    });
    const workflow = await h.projects.workflows.setDefault(alice(), created.id);
    await h.projects.workflows.update(alice(), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === statusKey
            ? {
                ...state,
                rules: [{ type: 'runAgent', config: { instruction: 'Go.' } }],
              }
            : state,
        ),
        // Agents may move issues there too, as a run does through the API.
        transitions: [
          ...workflow.definition.transitions,
          { from: '*', to: statusKey, actors: ['agent'] },
        ],
      },
    });
  } finally {
    h.roles.delete('alice');
  }
}

const cardsOf = (type: string) =>
  h.port.sent.filter(
    (notice) => notice.source === RUN_REQUESTS_SOURCE && notice.type === type,
  );

describe('a comment by someone other than the owner', () => {
  it('asks the owner, and reaches the owner’s running run only once they confirm it', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Fix login',
      executor: { type: 'agent', id: agentId },
    });
    const claimed = await h.claimOne();
    const started = await h.runner(RUNNER_ROUTES.start, claimed.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    expect(started.status).toBe(200);

    const { triggered } = await h.projects.comments.create(bob(), issue.id, {
      content: 'Please also cover the SSO path.',
    });
    expect(triggered).toEqual([]);
    expect(await runsOf(issue.id)).toHaveLength(1);
    const running = await h.agents.runs.detail(claimed.run.id);
    expect(running.inputs.map((input) => input.text)).not.toContain(
      'Please also cover the SSO path.',
    );

    const [request] = await pendingFor('alice');
    expect(request).toMatchObject({
      agentId,
      subject: { kind: 'issue', id: issue.id },
      responsibleUserId: 'alice',
      requestedByUserId: 'bob',
      requestedByName: 'bob',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'bob' },
        text: 'Please also cover the SSO path.',
        payload: { trigger: 'comment' },
      },
    });
    // The owner's decision card, about the issue, so "Waiting for you" on the issue shows it too.
    await expect.poll(() => cardsOf(RUN_REQUEST_TYPE).length).toBe(1);
    expect(cardsOf(RUN_REQUEST_TYPE)[0]).toMatchObject({
      kind: 'decision',
      userIds: ['alice'],
      decisionKey: request!.id,
      subject: { type: 'issue', id: issue.id, label: issue.identifier },
      path: `/issues/${issue.identifier}`,
      data: {
        requestId: request!.id,
        requestedByName: 'bob',
        excerpt: 'Please also cover the SSO path.',
        trigger: 'comment',
      },
    });

    // Only the owner confirms: not the person who asked.
    await expect(
      h.agents.runs.requests.confirm(request!.id, 'bob'),
    ).rejects.toMatchObject({ status: 403 });
    const confirmed = await h.agents.runs.requests.confirm(
      request!.id,
      'alice',
    );
    expect(confirmed.run).toMatchObject({
      runId: claimed.run.id,
      outcome: 'appended',
    });
    expect(
      (await h.agents.runs.detail(claimed.run.id)).inputs.at(-1),
    ).toMatchObject({
      type: 'comment',
      actor: { kind: 'user', id: 'bob' },
      text: 'Please also cover the SSO path.',
    });
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({ decisionKey: request!.id, outcome: 'confirmed' });
  });

  it('runs as the owner on the owner’s runner once confirmed, and as the person who asked when they run it themselves', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), { title: 'Docs' });
    await h.projects.comments.create(bob(), issue.id, {
      content: `[@Coder](mention://agent/${agentId}) write the docs`,
    });
    const [first] = await pendingFor('alice');
    const aliceClaims = await personalRunner('alice');
    expect(await aliceClaims()).toBeUndefined();
    await h.agents.runs.requests.confirm(first!.id, 'alice');
    const [asAlice] = await runsOf(issue.id);
    expect(asAlice).toMatchObject({
      status: 'queued',
      actorUserId: 'alice',
      requestedByUserId: 'bob',
      confirmedByUserId: 'alice',
    });
    expect((await aliceClaims())?.run.id).toBe(asAlice!.id);

    // "Run as me": on a runner Bob may use (a team runner), as Bob.
    await h.claimOne();
    await h.projects.comments.create(bob(), issue.id, {
      content: `[@Coder](mention://agent/${agentId}) and the changelog`,
    });
    const [second] = await pendingFor('alice');
    const mine = await h.agents.runs.requests.runAsRequester(second!.id, 'bob');
    expect(await h.agents.runs.get(mine.run.runId)).toMatchObject({
      actorUserId: 'bob',
      requestedByUserId: 'bob',
      confirmedByUserId: null,
    });
    expect(await pendingFor('alice')).toEqual([]);
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({ decisionKey: second!.id, outcome: 'withdrawn' });
  });

  it('runs at once when the owner comments', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), { title: 'Mine' });
    await h.projects.comments.create(alice(), issue.id, {
      content: `[@Coder](mention://agent/${agentId}) go`,
    });
    expect(await pendingFor('alice')).toEqual([]);
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({ actorUserId: 'alice', status: 'queued' }),
    ]);
  });
});

describe('rule events someone other than the owner causes', () => {
  it('asks the owner when someone else moves the issue into a stage that runs agents', async () => {
    await runAgentIn('in_progress');
    bobManages();
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Staged',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await update(issue, { statusKey: 'in_progress' }, bob());
    expect(await runsOf(issue.id)).toEqual([]);
    const requests = await pendingFor('alice');
    expect(requests.map((request) => request.input.payload)).toContainEqual(
      expect.objectContaining({ trigger: 'stageEntered', to: 'in_progress' }),
    );
    expect(
      requests.every((request) => request.requestedByUserId === 'bob'),
    ).toBe(true);
  });

  it('asks the owner when someone else finishes the last sub-issue', async () => {
    bobManages();
    const agentId = await h.createAgent();
    const parent = await h.projects.issues.create(alice(), {
      title: 'Parent',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    const child = await h.projects.issues.create(bob(), {
      title: 'Child',
      parentIssueId: parent.id,
    });
    await h.projects.issues.update(bob(), child.id, {
      revision: child.revision,
      statusKey: 'done',
    });
    expect(await runsOf(parent.id)).toEqual([]);
    expect(await pendingFor('alice')).toEqual([
      expect.objectContaining({
        subject: { kind: 'issue', id: parent.id },
        requestedByUserId: 'bob',
        input: expect.objectContaining({
          actor: expect.objectContaining({ kind: 'user', id: 'bob' }),
          payload: expect.objectContaining({ trigger: 'subtasksFinished' }),
        }),
      }),
    ]);
  });

  it('asks the owner when someone else finishes what held the issue', async () => {
    bobManages();
    const agentId = await h.createAgent();
    const blocker = await h.projects.issues.create(bob(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), { title: 'Then' });
    await h.projects.subtasks.addDependency(alice(), issue.id, {
      dependsOnIssueId: blocker.id,
    });
    await update(issue, { executor: { type: 'agent', id: agentId } });
    expect(await runsOf(issue.id)).toEqual([]);
    await h.projects.issues.update(bob(), blocker.id, {
      revision: blocker.revision,
      statusKey: 'done',
    });
    expect(await runsOf(issue.id)).toEqual([]);
    expect(await pendingFor('alice')).toEqual([
      expect.objectContaining({
        requestedByUserId: 'bob',
        input: expect.objectContaining({
          payload: expect.objectContaining({
            trigger: 'unblocked',
            releasedBy: blocker.id,
          }),
        }),
      }),
    ]);
  });

  it('starts at once when the owner causes the same events', async () => {
    const agentId = await h.createAgent();
    const blocker = await h.projects.issues.create(alice(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), { title: 'Then' });
    await h.projects.subtasks.addDependency(alice(), issue.id, {
      dependsOnIssueId: blocker.id,
    });
    await update(issue, { executor: { type: 'agent', id: agentId } });
    await update(blocker, { statusKey: 'done' });
    expect(await pendingFor('alice')).toEqual([]);
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({ status: 'queued', actorUserId: 'alice' }),
    ]);
  });

  it('goes on as the owner’s chain when the owner’s run causes it, and asks when someone else’s run does', async () => {
    await runAgentIn('in_progress');
    const agentId = await h.createAgent();
    // The agent whose stage the moves enter: another one than the agent that moves the issues.
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    const asRun = (runId: string) => ({
      ...alice(),
      actor: {
        type: 'agent',
        id: agentId,
        trace: { agentId, runId },
      } satisfies Actor,
    });
    // Alice's own run: what it causes on her issues runs as her.
    const owned = await h.projects.issues.create(alice(), {
      title: 'Owned',
      executor: { type: 'agent', id: agentId },
    });
    const [aliceRun] = await runsOf(owned.id);
    const next = await h.projects.issues.create(alice(), {
      title: 'Next',
      executor: { type: 'agent', id: reviewer },
      start: false,
    });
    await update(next, { statusKey: 'in_progress' }, asRun(aliceRun!.id));
    expect(await runsOf(next.id)).toEqual([
      expect.objectContaining({
        actorUserId: 'alice',
        requestedByUserId: 'alice',
      }),
    ]);
    expect(await pendingFor('alice')).toEqual([]);

    // Bob's run (Bob started it on his own issue): what it causes on Alice's issue asks her.
    const bobsIssue = await h.projects.issues.create(bob(), { title: 'Bob’s' });
    const bobRun = await h.agents.runs.enqueue({
      agentId,
      subject: { kind: 'issue', id: bobsIssue.id },
      actorUserId: 'bob',
      responsibleUserId: 'bob',
      input: {
        type: 'signal',
        actor: { kind: 'user', id: 'bob', name: 'bob' },
        text: 'Work on it.',
      },
    });
    const other = await h.projects.issues.create(alice(), {
      title: 'Other',
      executor: { type: 'agent', id: reviewer },
      start: false,
    });
    await update(other, { statusKey: 'in_progress' }, asRun(bobRun.runId!));
    expect(await runsOf(other.id)).toEqual([]);
    expect(await pendingFor('alice')).toEqual([
      expect.objectContaining({
        subject: { kind: 'issue', id: other.id },
        requestedByUserId: 'bob',
        input: expect.objectContaining({
          actor: expect.objectContaining({ kind: 'agent', id: agentId }),
        }),
      }),
    ]);
  });
});

describe('a new owner', () => {
  it('runs nothing on the new owner’s runner until they confirm, and then runs as them', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Handed over',
      executor: { type: 'agent', id: agentId },
    });
    const bobClaims = await personalRunner('bob');
    const [queued] = await runsOf(issue.id);

    await update(issue, { ownerUserId: 'bob' });
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({ id: queued!.id, status: 'cancelled' }),
    ]);
    expect(await bobClaims()).toBeUndefined();
    const [request] = await pendingFor('bob');
    expect(request).toMatchObject({
      responsibleUserId: 'bob',
      requestedByUserId: 'alice',
      input: {
        type: 'signal',
        payload: {
          trigger: 'assigned',
          ownerChanged: {
            from: 'alice',
            to: 'bob',
            withdrawnRunId: queued!.id,
          },
        },
      },
    });
    expect(await bobClaims()).toBeUndefined();

    const { run } = await h.agents.runs.requests.confirm(request!.id, 'bob');
    // The record shows Bob confirmed it.
    expect(await h.agents.runs.get(run.runId)).toMatchObject({
      actorUserId: 'bob',
      requestedByUserId: 'alice',
      confirmedByUserId: 'bob',
    });
    expect((await bobClaims())?.run.id).toBe(run.runId);
  });

  it('leaves the confirmed work to team runners as before', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Handed over',
      executor: { type: 'agent', id: agentId },
    });
    await update(issue, { ownerUserId: 'bob' });
    const [request] = await pendingFor('bob');
    const { run } = await h.agents.runs.requests.confirm(request!.id, 'bob');
    expect((await h.claimOne())?.run.id).toBe(run.runId);
  });

  it('lets a run already working go on', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Working',
      executor: { type: 'agent', id: agentId },
    });
    const claimed = await h.claimOne();
    await update(issue, { ownerUserId: 'bob' });
    const run = await h.agents.runs.get(claimed.run.id);
    expect(run.status).toBe('dispatched');
    expect(run.cancelRequestedAt).toBeNull();
    expect(await pendingFor('bob')).toEqual([]);
  });

  it('hands the requests waiting for the previous owner on in the same change, so they can no longer confirm them', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Asked',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await h.projects.comments.create(bob(), issue.id, {
      content: 'Look at this.',
    });
    const [asked] = await pendingFor('alice');
    await update(issue, { ownerUserId: 'carol' });
    await expect(
      h.agents.runs.requests.confirm(asked!.id, 'alice'),
    ).rejects.toMatchObject({ code: 'RUN_REQUEST_SETTLED' });
    expect(await pendingFor('alice')).toEqual([]);
    expect(await pendingFor('carol')).toEqual([
      expect.objectContaining({
        requestedByUserId: 'bob',
        input: expect.objectContaining({ text: 'Look at this.' }),
      }),
    ]);
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({ decisionKey: asked!.id, outcome: 'superseded' });
  });

  it('refuses the previous owner confirming a request nothing handed on', async () => {
    const agentId = await h.createAgent({ name: 'Helper' });
    // No agent executes the issue: the projects plugin tells no agent of the new owner.
    const issue = await h.projects.issues.create(alice(), { title: 'Plain' });
    await h.projects.comments.create(bob(), issue.id, {
      content: `[@Helper](mention://agent/${agentId}) please look`,
    });
    const [asked] = await pendingFor('alice');
    await update(issue, { ownerUserId: 'carol' });
    // The issue's current owner is checked when confirming.
    await expect(
      h.agents.runs.requests.confirm(asked!.id, 'alice'),
    ).rejects.toMatchObject({ status: 403 });
    expect(await runsOf(issue.id)).toEqual([]);
  });
});

describe('a request nobody confirms in time', () => {
  it('tells the person who asked, about the issue, and settles the owner’s card', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Waited',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await h.projects.comments.create(bob(), issue.id, { content: 'Ping.' });
    const [asked] = await pendingFor('alice');
    await h.database
      .connection()
      .repository('agRunRequests')
      .updateMany({
        filter: { id: asked!.id },
        values: { expiresAt: new Date(Date.now() - 1000).toISOString() },
      });
    await h.agents.sweeper.sweep();
    await expect.poll(() => cardsOf(RUN_REQUEST_EXPIRED_TYPE).length).toBe(1);
    expect(cardsOf(RUN_REQUEST_EXPIRED_TYPE)[0]).toMatchObject({
      kind: 'info',
      userIds: ['bob'],
      path: `/issues/${issue.identifier}`,
      subject: { type: 'issue', id: issue.id },
      data: { requestId: asked!.id, reason: 'timeout', excerpt: 'Ping.' },
    });
    await expect
      .poll(() => h.port.settled)
      .toContainEqual({ decisionKey: asked!.id, outcome: 'expired' });
  });
});
