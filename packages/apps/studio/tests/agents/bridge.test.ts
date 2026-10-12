// @vitest-environment node
/**
 * The bridge to the projects plugin: issue changes and comments queue runs in the same transaction, permissions bound
 * a run's commands and its calls to the API, and those go through the projects plugin's rules.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { composeSkillMarkdown } from '@nocobase/app-plugin-agents/shared/skills';
import { collectRunAttempts } from '@nocobase/app-plugin-projects/server/tokens';
import type { Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type {
  CreateIssueRequest,
  Issue,
} from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  COMMENT_RUNS_LIMITED,
  continueCommentRun,
  pendingCommentRun,
} from '../../server/agents/comment-run-limit.js';
import { decideFailedRun } from '../../server/agents/failed-runs.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

const PM = PROJECT_MANAGER_ID;

/** An open issue nobody executes yet, created by `viewer`. */
function openIssue(viewer: Viewer, input: Partial<CreateIssueRequest> = {}) {
  return h.projects.issues.create(viewer, {
    title: 'A',
    statusKey: 'in_progress',
    executor: null,
    ...input,
  });
}

/** Gives the issue to the project manager. */
async function assign(issue: Issue, viewer = alice()) {
  const current = await h.projects.issueQueries.detail(viewer, issue.id);
  return h.projects.issues.update(viewer, issue.id, {
    revision: current.revision,
    executor: { type: 'agent', id: PM },
  });
}

async function runsOf(issueId: string) {
  return h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });
}

/** Takes an agent out of work, as an administrator disabling it. */
async function disable(agentId: string): Promise<void> {
  await h.database
    .connection()
    .query.updateTable('agAgents')
    .set({ status: 'disabled' })
    .where('id', '=', agentId)
    .execute();
}

const mention = (agentId: string, name = 'Coder') =>
  `[@${name}](mention://agent/${agentId})`;

describe('issues start work for the project manager', () => {
  it('queues its run when it is given an open issue, as the person who gave it', async () => {
    await h.createAgent();
    const issue = await openIssue(alice(), { title: 'Fix login' });
    const { attempts } = await collectRunAttempts(() => assign(issue));
    expect(attempts).toEqual([
      expect.objectContaining({
        kind: 'agent',
        principalId: PM,
        subjectId: issue.id,
        triggerType: 'assigned',
        started: true,
      }),
    ]);
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({
      id: attempts[0]!.runId,
      status: 'queued',
      agentId: PM,
      actorUserId: 'alice',
      ownerUserId: 'alice',
    });
    const detail = await h.agents.runs.detail(run!.id);
    expect(detail.inputs).toEqual([
      expect.objectContaining({
        type: 'signal',
        actor: { kind: 'user', id: 'alice', name: 'alice' },
        payload: { trigger: 'assigned' },
      }),
    ]);
  });

  it('gives a new issue to the project manager unless its creator names another executor', async () => {
    await h.createAgent();
    const issue = await h.projects.issues.create(alice(), { title: 'Later' });
    expect(issue).toMatchObject({
      statusKey: 'backlog',
      executor: { type: 'agent', id: PM },
    });
    const mine = await h.projects.issues.create(alice(), {
      title: 'Mine',
      executor: { type: 'user', id: 'alice' },
    });
    expect(mine.executor).toEqual({ type: 'user', id: 'alice' });
  });

  it('does not start work when the person asks not to start now', async () => {
    await h.createAgent();
    const { value: issue, attempts } = await collectRunAttempts(() =>
      openIssue(alice(), {
        title: 'Later',
        executor: { type: 'agent', id: PM },
        start: false,
      }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ started: false, skipped: 'deferred' }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('refuses any other agent as executor, leaving the issue unchanged', async () => {
    const agentId = await h.createAgent();
    const issue = await openIssue(bob(), { title: 'Mine' });
    const current = await h.projects.issueQueries.detail(bob(), issue.id);
    await expect(
      h.projects.issues.update(bob(), issue.id, {
        revision: current.revision,
        executor: { type: 'agent', id: agentId },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
    const detail = await h.projects.issueQueries.detail(bob(), issue.id);
    expect(detail.executor).toBeNull();
    expect(detail.revision).toBe(issue.revision);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('rolls the run back with the change that queued it', async () => {
    await h.createAgent();
    const issue = await openIssue(alice());
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await expect(
      h.projects.issues.update(alice(), issue.id, {
        revision: current.revision,
        executor: { type: 'agent', id: PM },
        labelIds: ['missing-label'],
      }),
    ).rejects.toBeDefined();
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('withdraws queued work when the project manager is taken off the issue', async () => {
    await h.createAgent();
    const issue = await openIssue(alice());
    const assigned = await assign(issue);
    await h.projects.issues.update(alice(), issue.id, {
      revision: assigned.revision,
      executor: null,
    });
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({
      status: 'cancelled',
      failureReason: 'cancelled',
    });
  });

  it("withdraws the previous owner's queued work and queues it again for the new owner", async () => {
    await h.createAgent();
    const issue = await openIssue(alice());
    const assigned = await assign(issue);
    const { attempts } = await collectRunAttempts(() =>
      h.projects.issues.update(alice(), issue.id, {
        revision: assigned.revision,
        ownerUserId: 'bob',
      }),
    );
    const runs = await runsOf(issue.id);
    expect(runs.map((run) => [run.status, run.actorUserId]).sort()).toEqual([
      ['cancelled', 'alice'],
      ['queued', 'bob'],
    ]);
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'ownerChanged', started: true }),
    ]);
  });
});

describe('comments reach agents', () => {
  it('delivers the same person’s comment to their run working on the issue as input', async () => {
    await h.createAgent();
    const agentId = PM;
    const issue = await openIssue(alice());
    await assign(issue);
    const payload = await h.claimOne();
    const started = await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    expect(started.status).toBe(200);
    const { value, attempts } = await collectRunAttempts(() =>
      h.projects.comments.create(alice(), issue.id, {
        content: 'Use the v2 API.',
      }),
    );
    expect(value.triggered).toEqual([{ kind: 'agent', id: agentId }]);
    expect(attempts[0]).toMatchObject({ runId: payload.run.id, started: true });
    const detail = await h.agents.runs.detail(payload.run.id);
    expect(detail.status).toBe('running');
    expect(detail.inputs.at(-1)).toMatchObject({
      type: 'comment',
      text: 'Use the v2 API.',
      actor: { kind: 'user', id: 'alice', name: 'alice' },
    });
  });

  it('queues another person’s comment separately behind the active work', async () => {
    await h.createAgent();
    const issue = await openIssue(alice());
    await assign(issue);
    const payload = await h.claimOne();
    await h.projects.comments.create(bob(), issue.id, {
      content: 'Use the v2 API.',
    });
    const work = await runsOf(issue.id);
    expect(work).toHaveLength(2);
    const next = work.find((run) => run.id !== payload.run.id)!;
    expect(next).toMatchObject({ status: 'queued', actorUserId: 'bob' });
    expect(
      (await h.agents.runs.detail(payload.run.id)).inputs.some(
        (input) => input.text === 'Use the v2 API.',
      ),
    ).toBe(false);
    expect((await h.agents.runs.detail(next.id)).inputs.at(-1)).toMatchObject({
      type: 'comment',
      text: 'Use the v2 API.',
      actor: { id: 'bob' },
    });
    const workload = await h.agents.runs.workload({ subjectKind: 'issue' });
    expect(workload.runs.find((run) => run.id === next.id)?.wait?.reason).toBe(
      'sameWorkActive',
    );
  });

  it('wakes a mentioned agent, and refuses mentioning one that takes no work', async () => {
    const helper = await h.createAgent({ name: 'Helper' });
    const disabled = await h.createAgent({ name: 'Disabled' });
    await disable(disabled);
    const issue = await openIssue(bob());
    const { value } = await h.projects.comments
      .create(bob(), issue.id, {
        content: `[@Helper](mention://agent/${helper}) please look`,
      })
      .then((value) => ({ value }));
    expect(value.triggered).toEqual([{ kind: 'agent', id: helper }]);
    expect((await runsOf(issue.id)).map((run) => run.agentId)).toEqual([
      helper,
    ]);
    await expect(
      h.projects.comments.create(bob(), issue.id, {
        content: mention(disabled, 'Disabled'),
      }),
    ).rejects.toMatchObject({ code: 'MENTION_FORBIDDEN' });
  });
});

describe("an agent's comment", () => {
  /** A comment an agent writes in a run that acts for `userId`. */
  const asAgent = (agentId: string, userId = 'alice') => ({
    ...h.viewer(userId),
    actor: { type: 'agent', id: agentId },
  });
  async function activities(issueId: string) {
    h.roles.set('alice', 'admin');
    try {
      return (await h.projects.issueQueries.activities(alice(), issueId, {}))
        .data;
    } finally {
      h.roles.delete('alice');
    }
  }

  /** Sets the project manager's limit on the runs agents' comments start. */
  async function limitCommentRuns(commentRunLimit: number): Promise<void> {
    await h.manager.update('alice', { commentRunLimit });
  }

  /** Claims the one queued run and starts it, so it counts. */
  async function startRun(): Promise<string> {
    const payload = await h.claimOne();
    const started = await h.runner(RUNNER_ROUTES.start, payload.run.id, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
    expect(started.status).toBe(200);
    return payload.run.id as string;
  }

  it('wakes the agent it mentions, as the person its run acts for', async () => {
    const coordinator = PM;
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await openIssue(alice(), { title: 'Split' });
    const { triggered } = await h.projects.comments.create(
      asAgent(coordinator, 'bob'),
      issue.id,
      { content: `${mention(worker, 'Worker')} take the API part` },
    );
    expect(triggered).toEqual([{ kind: 'agent', id: worker }]);
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({ agentId: worker, actorUserId: 'bob' });
    expect((await h.agents.runs.detail(run!.id)).inputs.at(-1)).toMatchObject({
      type: 'comment',
      actor: { kind: 'agent', id: coordinator, name: 'Project manager' },
      payload: { trigger: 'mention', byAgent: true },
    });
  });

  it('wakes nobody by answering an agent, unless it mentions one', async () => {
    const reviewer = await h.createAgent({ name: 'Reviewer' });
    const developer = await h.createAgent({ name: 'Developer' });
    const issue = await openIssue(alice(), { title: 'Review' });
    const { comment: review } = await h.projects.comments.create(
      asAgent(reviewer),
      issue.id,
      { content: `${mention(developer, 'Developer')} rename the helper` },
    );
    const before = (await runsOf(issue.id)).length;
    const reply = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(developer), issue.id, {
        content: 'Renamed.',
        parentId: review.id,
      }),
    );
    expect(reply.attempts).toEqual([]);
    expect(await runsOf(issue.id)).toHaveLength(before);
    const { triggered } = await h.projects.comments.create(
      asAgent(developer),
      issue.id,
      {
        content: `${mention(reviewer, 'Reviewer')} renamed, look again`,
        parentId: review.id,
      },
    );
    expect(triggered).toEqual([{ kind: 'agent', id: reviewer }]);
  });

  it('wakes the executing agent when it mentions nobody, but not the executor itself, nor past a person', async () => {
    const coordinator = PM;
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await openIssue(alice(), {
      title: 'Split',
      executor: { type: 'agent', id: coordinator },
      start: false,
    });
    const { triggered } = await h.projects.comments.create(
      asAgent(worker),
      issue.id,
      { content: 'Done: see branch agent/api.' },
    );
    expect(triggered).toEqual([{ kind: 'agent', id: coordinator }]);
    const woken = (await runsOf(issue.id)).filter(
      (run) => run.agentId === coordinator,
    );
    expect(woken).toHaveLength(1);
    expect(
      (await h.agents.runs.detail(woken[0]!.id)).inputs.at(-1)?.payload,
    ).toMatchObject({ trigger: 'comment', byAgent: true });
    const before = (await runsOf(issue.id)).length;
    const own = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(coordinator), issue.id, {
        content: 'Merging the parts.',
      }),
    );
    expect(own.attempts).toEqual([]);
    const toPerson = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(worker), issue.id, {
        content: '[@bob](mention://user/bob) which API version?',
      }),
    );
    expect(toPerson.attempts).toEqual([]);
    expect(await runsOf(issue.id)).toHaveLength(before);
  });

  it('never wakes its own agent', async () => {
    const coordinator = await h.createAgent({ name: 'Coordinator' });
    const issue = await openIssue(alice(), { title: 'Self' });
    const { comment } = await h.projects.comments.create(
      asAgent(coordinator),
      issue.id,
      { content: `Note to ${mention(coordinator, 'Coordinator')}` },
    );
    const { attempts } = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(coordinator), issue.id, {
        content: 'And a follow-up.',
        parentId: comment.id,
      }),
    );
    expect(attempts).toEqual([]);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('acts for the person its run acts for, and for the owner when no run wrote it', async () => {
    const { issue, token, agentId } = await claimedRun();
    const helper = await h.createAgent({ name: 'Helper' });
    const posted = await h.request(
      'POST',
      `/projects/issues/${issue.identifier}/comments`,
      {
        runToken: token,
        body: { content: `${mention(helper, 'Helper')} check the tests` },
      },
    );
    expect(posted.status).toBe(201);
    expect(
      (await runsOf(issue.id)).find((run) => run.agentId === helper),
    ).toMatchObject({ actorUserId: 'alice' });
    // Written through the comment writer, which names no person: the run acts for the owner.
    const owned = await openIssue(bob(), { title: 'Bob’s' });
    const { attempts } = await collectRunAttempts(() =>
      h.projects.comments.post({ type: 'agent', id: helper }, owned.id, {
        content: mention(agentId),
      }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ principalId: agentId, started: true }),
    ]);
    expect(await h.agents.runs.get(attempts[0]!.runId!)).toMatchObject({
      actorUserId: 'bob',
    });
  });

  it("starts nothing past the project manager's limit, tells the owner, and a person's comment restarts the count", async () => {
    const planned: any[] = [];
    h.projects.events.on('notice.planned', (event) => {
      planned.push(event.notice);
    });
    await limitCommentRuns(1);
    const coordinator = PM;
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await openIssue(alice(), { title: 'Loop' });
    await h.projects.comments.create(asAgent(coordinator), issue.id, {
      content: `${mention(worker, 'Worker')} first`,
    });
    await startRun();
    const { value, attempts } = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(coordinator), issue.id, {
        content: `${mention(worker, 'Worker')} again`,
      }),
    );
    expect(value.triggered).toEqual([]);
    expect(attempts).toEqual([
      expect.objectContaining({ principalId: worker, skipped: 'limited' }),
    ]);
    expect(await runsOf(issue.id)).toHaveLength(1);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_skipped',
      ),
    ).toMatchObject({
      actorId: worker,
      details: { reason: 'limited', trigger: 'mention' },
    });
    const pending = await pendingCommentRun(h.projects, alice(), issue.id);
    expect(pending).toMatchObject({ maxRuns: 1, windowHours: 24 });
    expect(planned.at(-1)).toMatchObject({
      type: COMMENT_RUNS_LIMITED,
      userIds: ['alice'],
      params: { limit: '1', continueToken: pending!.token },
    });
    await h.projects.comments.create(bob(), issue.id, {
      content: `${mention(worker, 'Worker')} keep going`,
    });
    expect(await pendingCommentRun(h.projects, alice(), issue.id)).toBeNull();
    const after = await collectRunAttempts(() =>
      h.projects.comments.create(asAgent(coordinator), issue.id, {
        content: `${mention(worker, 'Worker')} once more`,
      }),
    );
    expect(after.value.triggered).toEqual([{ kind: 'agent', id: worker }]);
  });

  it('lets a person who may edit the issue continue the held comment once', async () => {
    await limitCommentRuns(1);
    const coordinator = PM;
    const worker = await h.createAgent({ name: 'Worker' });
    const issue = await openIssue(alice(), { title: 'Loop' });
    await h.projects.comments.create(asAgent(coordinator), issue.id, {
      content: `${mention(worker, 'Worker')} first`,
    });
    const first = await startRun();
    await h.runner(RUNNER_ROUTES.complete, first, {
      summary: 'Done.',
      handledInputIds: (await h.agents.runs.detail(first)).inputs.map(
        (input) => input.id,
      ),
    });
    await h.projects.comments.create(asAgent(coordinator), issue.id, {
      content: `${mention(worker, 'Worker')} again`,
    });
    const pending = (await pendingCommentRun(h.projects, alice(), issue.id))!;
    const attempts = await Promise.all(
      [0, 1].map(() =>
        h.request('POST', `/issueCommentRuns/${issue.id}/continue`, {
          user: 'alice',
          body: { token: pending.token },
        }),
      ),
    );
    expect(attempts.map((attempt) => attempt.status).sort()).toEqual([
      200, 400,
    ]);
    const [runId] = attempts.find((attempt) => attempt.status === 200)!.body
      .data.runIds;
    expect(await h.agents.runs.get(runId)).toMatchObject({
      agentId: worker,
      actorUserId: 'alice',
    });
    expect(
      (await h.agents.runs.detail(runId)).inputs.at(-1)?.payload,
    ).toMatchObject({ trigger: 'mention', continuedFrom: pending.token });
    expect(await pendingCommentRun(h.projects, alice(), issue.id)).toBeNull();
    await expect(
      continueCommentRun(
        h.projects,
        h.agents,
        alice(),
        issue.id,
        pending.token,
      ),
    ).rejects.toMatchObject({ reason: 'COMMENT_CONTINUE_STALE' });
  });
});

/**
 * A step of an open issue nobody executes, handed to a fresh agent by alice mentioning it, claimed by a runner: the
 * run's token and id.
 */
async function claimedRun(
  agentInput: Parameters<BridgeHarness['createAgent']>[0] = {},
  issueInput: Partial<CreateIssueRequest> = {},
): Promise<{ issue: Issue; agentId: string; token: string; runId: string }> {
  const agentId = await h.createAgent(agentInput);
  const issue = await openIssue(alice(), { title: 'Fix login', ...issueInput });
  await h.projects.comments.create(alice(), issue.id, {
    content: `${mention(agentId, agentInput.name ?? 'Coder')} please fix it`,
  });
  const payload = await h.claimOne();
  return {
    issue,
    agentId,
    token: payload.cli.credential.content.token as string,
    runId: payload.run.id as string,
  };
}

/** `claimedRun` with the claim's payload. */
async function stepRun(
  agentInput: Parameters<BridgeHarness['createAgent']>[0] = {},
  issueInput: Partial<CreateIssueRequest> = {},
): Promise<{ issue: Issue; agentId: string; payload: any }> {
  const agentId = await h.createAgent(agentInput);
  const issue = await openIssue(alice(), { title: 'Fix login', ...issueInput });
  await h.projects.comments.create(alice(), issue.id, {
    content: `${mention(agentId, agentInput.name ?? 'Coder')} please fix it`,
  });
  return { issue, agentId, payload: await h.claimOne() };
}

/** An open issue given to the project manager, its run claimed by a runner. */
async function managerRun(
  issueInput: Partial<CreateIssueRequest> = {},
): Promise<{ issue: Issue; token: string; runId: string; payload: any }> {
  await h.createAgent();
  const issue = await openIssue(alice(), {
    title: 'Fix login',
    executor: { type: 'agent', id: PM },
    ...issueInput,
  });
  const payload = await h.claimOne();
  return {
    issue,
    token: payload.cli.credential.content.token as string,
    runId: payload.run.id as string,
    payload,
  };
}

describe('the CLI manifest', () => {
  it("offers a run what its agent may do within the waking person's permissions", async () => {
    const { token, runId } = await claimedRun({
      actions: ['pm.issues/view', 'pm.issues/comment', 'pm.issues/edit'],
    });
    const manifest = await h.manifest({ runToken: token });
    expect(manifest.identity).toMatchObject({
      kind: 'run',
      runId,
      userId: 'alice',
      displayName: 'Coder',
    });
    expect(manifest.identity.actions).toContain('agents.runs/self');
    expect(manifest.withheld).toContainEqual(
      expect.objectContaining({
        id: 'pr:open',
        reason: 'action',
        action: 'studio.git/open-pr',
      }),
    );
    // Opening pull requests and deleting files are actions of their own, which this agent is not given.
    expect(manifest.commands.map((command) => command.id)).toEqual([
      'agent:list',
      'conversation:title:set',
      'inbox:list',
      'issue:attachment:download',
      'issue:attachment:list',
      'issue:comment:add',
      'issue:comment:list',
      'issue:dependency:add',
      'issue:dependency:remove',
      'issue:get',
      'issue:runs',
      'issue:search',
      'issue:update',
      'plan:create',
      'plan:get',
      'plan:list',
      'pr:list',
      'run:context',
      'run:events',
      'run:get',
      'run:self',
    ]);
    const add = manifest.commands.find(
      (command) => command.id === 'issue:comment:add',
    );
    expect(add).toMatchObject({
      action: 'pm.issues/comment',
      method: 'POST',
      path: '/api/projects/issues/{issueId}/comments',
      body: { media: 'application/json' },
    });
    expect(add?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'issue',
          field: 'issueId',
          position: 0,
        }),
        expect.objectContaining({
          name: 'content',
          contentFile: true,
          required: true,
        }),
        expect.objectContaining({
          name: 'attach',
          in: 'file',
          upload: expect.objectContaining({
            path: '/api/projects/attachments',
            field: 'attachmentIds',
          }),
        }),
      ]),
    );
    const again = await h.request('GET', '/cli/manifest', {
      runToken: token,
      headers: { 'if-none-match': `"${manifest.etag}"` },
    });
    expect(again.status).toBe(304);
  });

  it("narrows an agent's actions to the waking person's and to what agents may be given", async () => {
    const { token } = await claimedRun({
      actions: ['pm.issues/view', 'pm.issues/close', 'pm.projects/delete'],
    });
    const viewOnly = await h.manifest({ runToken: token });
    expect(viewOnly.commands.map((command) => command.id)).toEqual([
      'agent:list',
      'conversation:title:set',
      'inbox:list',
      'issue:attachment:download',
      'issue:attachment:list',
      'issue:comment:list',
      'issue:get',
      'issue:runs',
      'issue:search',
      'plan:create',
      'plan:get',
      'plan:list',
      'pr:list',
      'run:context',
      'run:events',
      'run:get',
      'run:self',
    ]);
    h.roles.set('alice', 'none');
    const manifest = await h.manifest({ runToken: token });
    expect(manifest.commands.map((command) => command.id)).toEqual([
      'agent:list',
      'conversation:title:set',
      'inbox:list',
      'plan:create',
      'plan:get',
      'plan:list',
      'run:context',
      'run:self',
    ]);
  });

  it('offers a person their own commands, not a run’s', async () => {
    const manifest = await h.manifest({ user: 'bob' });
    const ids = manifest.commands.map((command) => command.id);
    expect(ids).toContain('project:get');
    expect(ids).toContain('project:list');
    expect(ids).toContain('issue:create');
    expect(ids).toContain('issue:comment:add');
    expect(ids).not.toContain('run:context');
    expect(ids).not.toContain('conversation:title:set');
    h.roles.set('bob', 'none');
    const none = await h.manifest({ user: 'bob' });
    // Of the business actions, only what every caller holds is left; what those commands read is still bounded by
    // the person's rights.
    expect(
      [
        ...new Set(
          none.commands.flatMap((command) =>
            command.action ? [command.action] : [],
          ),
        ),
      ].sort(),
    ).toEqual(['agents.agents/view', 'pm.plans/use', 'studio.inbox/read']);
    expect(none.commands.map((command) => command.id)).toEqual(
      expect.arrayContaining(['agent:list', 'inbox:list', 'plan:list']),
    );
    expect(none.etag).not.toBe(manifest.etag);
    expect((await h.request('GET', '/cli/manifest')).status).toBe(401);
  });
});

describe('the API as a run', () => {
  it('comments as the agent, without waking it again', async () => {
    const { issue, agentId, token, runId } = await claimedRun();
    const posted = await h.request(
      'POST',
      `/projects/issues/${issue.identifier}/comments`,
      { runToken: token, body: { content: 'Done: see branch agent/X.' } },
    );
    expect(posted.status).toBe(201);
    expect(posted.body.data.comment).toMatchObject({
      authorType: 'agent',
      authorId: agentId,
      authorName: 'Coder',
      content: 'Done: see branch agent/X.',
    });
    const detail = await h.agents.runs.detail(runId);
    expect(detail.inputs).toHaveLength(1);
    const listed = await h.request(
      'GET',
      `/projects/issues/${issue.id}/comments`,
      { runToken: token },
    );
    expect(
      listed.body.data.map((thread: any) => thread.root.content),
    ).toContain('Done: see branch agent/X.');
  });

  it('refuses what the run may not do, routes that do not take it, and unknown commands', async () => {
    const { issue, token } = await claimedRun();
    const project = await h.projects.projects.create(alice(), {
      name: 'Web',
    });
    // The agent holds no `pm.projects/view`: it is refused reading a project.
    const read = await h.request('GET', `/projects/${project.id}`, {
      runToken: token,
    });
    expect(read.status).toBe(403);
    expect(read.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
    expect(
      (await h.request('GET', `/projects/${project.id}`, { user: 'alice' }))
        .status,
    ).toBe(200);
    // Deleting an issue is an action of its own, which this agent is not given.
    const removed = await h.request(
      'DELETE',
      `/projects/issues/${issue.identifier}`,
      { runToken: token },
    );
    expect(removed.status).toBe(403);
    expect(removed.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
    // Labels are no route of a run's.
    const labelled = await h.request('POST', '/projects/labels', {
      runToken: token,
      body: { name: 'bug' },
    });
    expect(labelled.status).toBe(403);
    expect(labelled.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
    // Plans are proposed in a conversation, never from a run on an issue.
    const plans = await h.request('POST', '/projects/plans', {
      runToken: token,
      body: { title: 'Plan', rows: [{ op: 'issue.create', params: {} }] },
    });
    expect(plans.status).toBe(403);
    const asPerson = await h.request('GET', '/agents/runs/current/context', {
      user: 'bob',
    });
    expect(asPerson.status).toBe(401);
    const badToken = await h.request('GET', '/cli/manifest', {
      runToken: 'nope',
    });
    expect(badToken.status).toBe(401);
  });

  it('checks the input against the route', async () => {
    const { issue, token } = await claimedRun();
    const missing = await h.request(
      'POST',
      `/projects/issues/${issue.id}/comments`,
      { runToken: token, body: {} },
    );
    expect(missing.status).toBe(400);
    expect(missing.body.error.reason).toBe('INVALID_INPUT');
    const extra = await h.request(
      'POST',
      `/projects/issues/${issue.id}/comments`,
      { runToken: token, body: { content: 'x', bogus: true } },
    );
    expect(extra.status).toBe(400);
  });

  it('attaches files to a comment as the agent, when its agent may upload', async () => {
    const { issue, agentId, token } = await claimedRun({
      actions: ['pm.issues/view', 'pm.issues/comment', 'pm.attachments/upload'],
    });
    const upload = async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const uploaded = await h.request('POST', '/projects/attachments', {
        runToken: token,
        raw: form,
      });
      expect(uploaded.status).toBe(201);
      return uploaded.body.data.id as string;
    };
    const ids = [
      await upload(
        new File([new Uint8Array([137, 80])], 'shot.png', {
          type: 'image/png',
        }),
      ),
      await upload(new File(['log line'], 'run.log', { type: 'text/plain' })),
    ];
    const posted = await h.request(
      'POST',
      `/projects/issues/${issue.identifier}/comments`,
      {
        runToken: token,
        body: {
          content: 'See the screenshot and the log.',
          attachmentIds: ids,
        },
      },
    );
    expect(posted.status).toBe(201);
    expect(
      posted.body.data.comment.attachments.map((file: any) => [
        file.filename,
        file.mimeType,
        file.previewable,
        file.uploader.type,
        file.uploader.id,
      ]),
    ).toEqual([
      ['shot.png', 'image/png', true, 'agent', agentId],
      ['run.log', 'text/plain', false, 'agent', agentId],
    ]);

    const listed = await h.request(
      'GET',
      `/projects/issues/${issue.identifier}/attachments?comments=true`,
      { runToken: token },
    );
    expect(
      listed.body.data.map((row: any) => [row.filename, row.commentId]),
    ).toEqual([
      ['shot.png', posted.body.data.comment.id],
      ['run.log', posted.body.data.comment.id],
    ]);
    const downloaded = await h.request(
      'GET',
      `/projects/attachments/${ids[1]}/content?download=true`,
      { runToken: token },
    );
    expect(downloaded.status).toBe(200);
    expect(downloaded.body).toBe('log line');
    expect(downloaded.headers.get('content-disposition')).toMatch(
      /^attachment;.*run\.log/u,
    );

    const got = await h.request('GET', `/projects/issues/${issue.identifier}`, {
      runToken: token,
    });
    expect(got.body.data.attachments).toEqual([]);
    expect(
      got.body.data.threads.find(
        (thread: any) => thread.root.id === posted.body.data.comment.id,
      ).root.attachments,
    ).toHaveLength(2);
  });

  it('refuses uploads without the upload action, keeping no file', async () => {
    const { token } = await claimedRun();
    const form = new FormData();
    form.append(
      'file',
      new File(['log line'], 'run.log', { type: 'text/plain' }),
    );
    const response = await h.request('POST', '/projects/attachments', {
      runToken: token,
      raw: form,
    });
    expect(response.status).toBe(403);
    expect(h.stored.size).toBe(0);
  });

  it('discards an upload the refused comment would have carried', async () => {
    const { issue, token } = await claimedRun({
      actions: ['pm.issues/view', 'pm.issues/comment', 'pm.attachments/upload'],
    });
    const form = new FormData();
    form.append('file', new File(['x'], 'a.txt', { type: 'text/plain' }));
    const uploaded = await h.request('POST', '/projects/attachments', {
      runToken: token,
      raw: form,
    });
    const refused = await h.request(
      'POST',
      `/projects/issues/${issue.id}/comments`,
      {
        runToken: token,
        body: {
          content: 'A reply to nothing.',
          parentId: 'no-such-comment',
          attachmentIds: [uploaded.body.data.id],
        },
      },
    );
    expect(refused.status).toBe(400);
    // What the CLI does then.
    const discarded = await h.request(
      'DELETE',
      `/projects/attachments/${uploaded.body.data.id}`,
      { runToken: token },
    );
    expect(discarded.status).toBe(204);
    expect(h.stored.size).toBe(0);
  });

  it('refuses moving the status to an agent doing a step', async () => {
    const { issue, token } = await claimedRun();
    const refused = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      { runToken: token, body: { statusKey: 'in_review' } },
    );
    expect(refused.status).toBe(400);
    expect(refused.body.error.reason).toBe('TRANSITION_NOT_ALLOWED');
    const detail = await h.projects.issueQueries.detail(alice(), issue.id);
    expect(detail.statusKey).toBe('in_progress');
  });

  it('lets the project manager move the status between the open statuses, never finishing the issue', async () => {
    const { issue, token, runId } = await managerRun();
    const moved = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      { runToken: token, body: { statusKey: 'in_review' } },
    );
    expect(moved.status).toBe(200);
    expect(moved.body.data.issue.statusKey).toBe('in_review');
    // Its own move is no news to its run.
    expect((await h.agents.runs.detail(runId)).inputs).toHaveLength(1);
    const blocked = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      { runToken: token, body: { statusKey: 'blocked' } },
    );
    expect(blocked.status).toBe(200);
    for (const statusKey of ['done', 'cancelled', 'backlog']) {
      const refused = await h.request(
        'PATCH',
        `/projects/issues/${issue.identifier}`,
        { runToken: token, body: { statusKey } },
      );
      expect(refused.status).toBeGreaterThanOrEqual(400);
    }
    const detail = await h.projects.issueQueries.detail(alice(), issue.id);
    expect(detail.statusKey).toBe('blocked');
  });

  it('updates an issue, but not its owner', async () => {
    const { issue, token } = await claimedRun();
    const response = await h.request('PATCH', `/projects/issues/${issue.id}`, {
      runToken: token,
      body: { description: 'Steps:\n1. Reproduce', priority: 'high' },
    });
    expect(response.status).toBe(200);
    expect(response.body.data.issue).toMatchObject({
      description: 'Steps:\n1. Reproduce',
      priority: 'high',
    });
    const owner = await h.request('PATCH', `/projects/issues/${issue.id}`, {
      runToken: token,
      body: { ownerUserId: 'bob' },
    });
    expect(owner.status).toBe(403);
  });

  it("returns the run's context", async () => {
    const { issue, token } = await claimedRun();
    const response = await h.request('GET', '/agents/runs/current/context', {
      runToken: token,
    });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      kind: 'issue',
      issue: { id: issue.id, identifier: issue.identifier, title: 'Fix login' },
    });
  });
});

describe('claims and endings', () => {
  it('hands the runner the issue as brief, prompt, context and working directories', async () => {
    h.roles.set('alice', 'admin');
    const project = await h.projects.projects.create(alice(), { name: 'Web' });
    const repo = await h.projects.projects.addResource(alice(), project.id, {
      type: 'gitRepo',
      url: 'https://example.com/acme/web.git',
      defaultRef: 'develop',
      initPrompt: 'Run pnpm install.',
    });
    await h.agents.variables.set(
      { scope: 'project', scopeId: project.id },
      'API_URL',
      'https://api.example.com',
      'alice',
    );
    await h.agents.variables.set(
      { scope: 'workdir', scopeId: repo.id },
      'NPM_TOKEN',
      'npm-1',
      'alice',
    );
    const skill = await h.agents.skills.create('alice', {
      content: composeSkillMarkdown(
        { name: 'team-prs', description: 'How the team writes pull requests.' },
        '# Team PRs\n',
      ),
    });
    await h.agents.skills.attach({ scope: 'project', scopeId: project.id }, [
      skill.id,
    ]);
    const { issue, payload } = await stepRun(
      {
        actions: ['pm.issues/view', 'pm.issues/comment', 'pm.issues/edit'],
        instructions: 'Prefer small commits.',
      },
      {
        title: 'Fix login',
        description: 'It fails on Safari.',
        projectId: project.id,
      },
    );
    expect(payload.subject).toEqual({
      key: issue.identifier,
      title: 'Fix login',
      url: `/issues/${issue.identifier}`,
    });
    // The four layers, in order: the rules with the workspace, the environment check and the skills; the task; the
    // context; the agent's own instructions.
    const system = payload.prompt.system as string;
    const order = [
      'You are Coder',
      '{{runner.workspaceNotes}}',
      'AGENTS.md, CLAUDE.md or README',
      '{{runner.workspaceInit}}',
      '<name>team-prs</name>',
      `Issue ${issue.identifier}: Fix login`,
      'It fails on Safari.',
      'Prefer small commits.',
    ].map((text) => system.indexOf(text));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The issue's own rules for an agent doing a step: one reply in the thread that handed it, no status moves.
    const key = issue.identifier;
    const reply = `\`nb-studio issue comment add ${key} --parent <comment-id> --content-file <path>\``;
    expect(system).toContain(
      [
        `- Answer the step you were handed once, when you finish, in the thread of the comment that handed it to you (${reply}). People and the project manager read the comments, not your terminal.`,
        `- Files on issue ${key} and its comments are listed in the context with their ids: save one with \`nb-studio issue attachment download <file-id>\`.`,
        '- Before initializing an application, check the project description, selected application baseline, and existing code and AGENTS.md for the intended framework generation, template and package source. A proposal revision (such as v3) is not a framework version. If the target is unspecified or conflicts with existing code, ask for that requirement before installing; do not guess an initializer from a familiar tutorial.',
        "- Do not change the issue's status.",
        '- When you are done, or need a person, say so in a comment and end your turn. Do not wait for an answer: new comments reach you as new input.',
        '',
        'Workspace:',
      ].join('\n'),
    );
    expect(system).toContain(
      `- If you cannot get the environment working, say exactly what is missing in a reply on issue ${key} (${reply}) and end your turn instead of guessing.\n{{runner.workspaceInit}}`,
    );
    expect(payload.prompt.turn).toContain('please fix it');
    expect(payload.app).toEqual({ id: 'nb-studio', name: 'NocoBase Studio' });
    expect(payload.cli).toMatchObject({
      name: 'nb-studio',
      // No tarball is served here: the runner uses the nb-studio the install script put beside it.
      package: { kind: 'preinstalled' },
      credential: {
        file: '.nb-studio/run.json',
        content: { runId: payload.run.id, manifestUrl: expect.any(String) },
      },
    });
    expect(payload.workspace.dirs).toEqual([
      {
        kind: 'repo',
        url: 'https://example.com/acme/web.git',
        defaultBranch: 'develop',
        branch: `agent/${issue.identifier}`,
        path: 'web',
        initPrompt: 'Run pnpm install.',
      },
    ]);
    expect(payload.workspace.env).toEqual([
      { name: 'API_URL', value: 'https://api.example.com' },
      { name: 'NPM_TOKEN', value: 'npm-1' },
    ]);
    expect(payload.skills.map((item: { slug: string }) => item.slug)).toEqual([
      'team-prs',
    ]);
  });

  it('passes verified-empty initialization permission to an assigned coding run', async () => {
    h.roles.set('alice', 'admin');
    const project = await h.projects.projects.create(alice(), {
      name: 'New app',
    });
    await h.projects.projects.addResource(alice(), project.id, {
      type: 'gitRepo',
      url: 'https://example.com/acme/empty.git',
      defaultRef: 'main',
    });
    const agentId = await h.createAgent({
      actions: [
        'pm.issues/view',
        'pm.issues/comment',
        'pm.issues/edit',
        'studio.git/open-pr',
      ],
    });
    const issue = await openIssue(alice(), {
      title: 'Create a NocoBase 3 application',
      projectId: project.id,
    });
    await h.projects.comments.create(alice(), issue.id, {
      content: `${mention(agentId)} create it`,
    });
    const payload = await h.claimOne();
    expect(payload.workspace.dirs[0]).toMatchObject({
      branch: `agent/${issue.identifier}`,
      defaultBranch: 'main',
      initializeIfEmpty: true,
    });
    expect(payload.workspace.dirs[0]).not.toHaveProperty('initial');
    expect(payload.prompt.system).toContain(
      'runner may initialize a repository only after verifying',
    );
    expect(payload.prompt.system).toContain(
      'NocoBase 3 via `pnpm create @nocobase/app`',
    );
  });

  it("lets a project's managers change its variables, and its members see their names", async () => {
    h.roles.set('alice', 'admin');
    const project = await h.projects.projects.create(alice(), { name: 'Web' });
    const lead = await h.agents.scopes.access('project', project.id, 'alice');
    expect(lead).toEqual({ visible: true, manage: true });
    expect(
      await h.agents.scopes.access('workdir', 'missing', 'alice'),
    ).toBeNull();
  });

  it('asks the owner and the waking person what next when a run fails for good', async () => {
    const planned: any[] = [];
    h.projects.events.on('notice.planned', (event) => {
      planned.push(event.notice);
    });
    const { issue, runId } = await claimedRun();
    const failed = await h.runner(RUNNER_ROUTES.fail, runId, {
      reason: 'toolAuth',
      detail: 'Not signed in.',
    });
    expect(failed.status).toBe(200);
    await expect.poll(() => planned.length).toBe(1);
    expect(planned[0]).toMatchObject({
      key: `agents:run-failed:${runId}`,
      kind: 'decision',
      type: 'run_failed_final',
      issue: { id: issue.id, identifier: issue.identifier },
      userIds: ['alice'],
      actor: { type: 'agent', name: 'Coder' },
      params: {
        runId,
        failureReason: 'toolAuth',
        actions: 'retry,reassign,cancel',
      },
    });
  });

  describe("deciding a failed run's card", () => {
    /** Studio's inbox as the decision needs it: the card waits until resolved. */
    function inbox() {
      const resolved: { decisionKey: string; outcome: string }[] = [];
      return {
        resolved,
        waiting: ({ decisionKey }: { decisionKey: string }) =>
          Promise.resolve(
            !resolved.some((item) => item.decisionKey === decisionKey),
          ),
        resolve: (ref: { decisionKey: string; outcome: string }) => {
          resolved.push({ decisionKey: ref.decisionKey, outcome: ref.outcome });
          return Promise.resolve();
        },
      };
    }

    async function failedRun() {
      const claimed = await claimedRun();
      await h.runner(RUNNER_ROUTES.fail, claimed.runId, {
        reason: 'toolAuth',
        detail: 'Not signed in.',
      });
      const cards = inbox();
      const deps = {
        runs: h.agents.runs,
        projects: () => h.projects,
        viewerOf: (userId: string) => Promise.resolve(h.viewer(userId)),
        inbox: cards,
      };
      return { ...claimed, cards, deps };
    }

    it('retries as a new run woken by the person deciding, once', async () => {
      const { runId, deps, cards } = await failedRun();
      const result = await decideFailedRun(deps, 'alice', runId, {
        action: 'retry',
      });
      expect(result.outcome).toBe('retried');
      expect(await h.agents.runs.get(result.runId!)).toMatchObject({
        status: 'queued',
        retryOfRunId: runId,
        actorUserId: 'alice',
      });
      expect(cards.resolved).toEqual([
        { decisionKey: `agents:run-failed:${runId}`, outcome: 'retried' },
      ]);
      await expect(
        decideFailedRun(deps, 'alice', runId, { action: 'cancel' }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
      await expect(
        decideFailedRun(deps, 'alice', runId, { action: 'retry' }),
      ).rejects.toMatchObject({
        code: 'RUN_ALREADY_RETRIED',
        details: { runId: result.runId },
      });
    });

    it('gives the issue to a person, through the issue rules', async () => {
      const { issue, runId, deps, cards } = await failedRun();
      await expect(
        decideFailedRun(deps, 'alice', runId, { action: 'reassign' }),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      const result = await decideFailedRun(deps, 'alice', runId, {
        action: 'reassign',
        userId: 'bob',
      });
      expect(result.outcome).toBe('reassigned');
      const detail = await h.projects.issueQueries.detail(alice(), issue.id);
      expect(detail.executor).toEqual({ type: 'user', id: 'bob' });
      expect(cards.resolved.map((item) => item.outcome)).toEqual([
        'reassigned',
      ]);
    });

    it('cancels without another run, and refuses whoever may not see the issue', async () => {
      const { issue, runId, deps, cards } = await failedRun();
      h.roles.set('carol', 'none');
      await expect(
        decideFailedRun(deps, 'carol', runId, { action: 'retry' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(cards.resolved).toEqual([]);
      const result = await decideFailedRun(deps, 'alice', runId, {
        action: 'cancel',
      });
      expect(result.outcome).toBe('cancelled');
      expect((await runsOf(issue.id)).map((run) => run.status)).toEqual([
        'failed',
      ]);
    });
  });
});

describe('the agent kind', () => {
  it('offers its business actions to the agent editor, and names agents', async () => {
    // By group, as the catalog lists the businesses: projects, issues, releases, knowledge; then Git, previews, reports.
    expect(h.agents.actions.keys()).toEqual([
      'pm.projects/view',
      'pm.projects/create',
      'pm.projects/manage',
      'pm.issues/view',
      'pm.issues/create',
      'pm.issues/edit',
      'pm.issues/comment',
      'pm.issues/close',
      'pm.issues/change-owner',
      'pm.issues/delete',
      'pm.attachments/upload',
      // Release management's: never configuring, deleting or deploying to a protected environment.
      'rel.apps/view',
      'rel.apps/read-logs',
      'rel.apps/deploy',
      // The knowledge base's: reading and proposing, never editing.
      'kb.knowledge/read',
      'kb.knowledge/propose',
      // Actions of their own beside the base a role grants: opening pull requests, managing previews.
      'studio.git/open-pr',
      'studio.previews/manage',
      // The Reports page's, for whoever woke the agent holds it.
      'studio.reports/read',
    ]);
    // Titled and described as the plugin registered it; a new agent starts able to read and comment.
    const projectsText = (key: string) => ({
      key: `access.businesses.issues.${key}`,
      ns: '@nocobase/app-plugin-projects',
    });
    expect(
      h.agents.actions.list().find((action) => action.key === 'pm.issues/view'),
    ).toEqual({
      key: 'pm.issues/view',
      group: 'pm.issues',
      title: projectsText('actions.view.title'),
      groupTitle: projectsText('title'),
      description: projectsText('actions.view.description'),
      defaultOn: true,
    });
    // Attaching files is listed with the issue actions.
    expect(
      h.agents.actions
        .list()
        .find((action) => action.key === 'pm.attachments/upload')?.group,
    ).toBe('pm.issues');
    // What is never granted is listed, greyed out with the reason, and not among the keys: every other business
    // action, then each settings item under administration.
    const never = h.agents.actions
      .list()
      .filter((action) => action.grantable === false);
    expect(never.map((action) => action.key)).toEqual([
      'pm.projects/delete',
      'pm.issues/moderate-comments',
      'rel.apps/create',
      'rel.apps/configure',
      'rel.apps/upload',
      'rel.apps/deploy-protected',
      'rel.apps/operate',
      'rel.apps/delete',
      'kb.knowledge/edit',
      'kb.knowledge/manage',
      'agents.agents/edit',
      'pm.general',
      'pm.labels',
      'pm.members',
      'agents.agents',
      'agents.runners',
      'agents.prices',
      'agents.services',
      'rel.environments',
      'studio.apiKeys',
      'studio.personalApiKeys',
      'studio.git',
      'studio.knowledgeSearch',
    ]);
    const text = (key: string) => ({ key, ns: '@nocobase/i18n/application' });
    expect(never.find((action) => action.key === 'pm.members')).toEqual({
      key: 'pm.members',
      group: 'studio.admin',
      title: {
        key: 'access.settings.pm.members',
        ns: '@nocobase/app-plugin-projects',
      },
      groupTitle: text('studioAgents.actionGroups.studio.admin'),
      grantable: false,
      reason: text('studioAgents.actionReasons.pm.members'),
    });
    expect(
      h.agents.actions
        .list()
        .filter((action) => action.defaultOn)
        .map((action) => action.key),
    ).toEqual([
      'pm.issues/view',
      'pm.issues/comment',
      'rel.apps/view',
      'rel.apps/read-logs',
      'kb.knowledge/read',
      'kb.knowledge/propose',
      'studio.git/open-pr',
      'studio.previews/manage',
    ]);
    await h.createAgent();
    const issue = await openIssue(alice(), {
      executor: { type: 'agent', id: PM },
    });
    const detail = await h.projects.issueQueries.detail(alice(), issue.id);
    expect(detail.executorName).toBe('Project manager');
    const described = await h.projects.kinds.get('agent')!.executor!.describe!(
      h.database.connection(),
      [PM],
    );
    expect(described).toEqual([
      expect.objectContaining({
        id: PM,
        name: 'Project manager',
        online: false,
        busy: 1,
      }),
    ]);
  });

  it('offers the executor picker the project manager alone, as the default', async () => {
    await h.createAgent();
    await h.createAgent({ name: 'Reviewer' });
    expect(await h.projects.members.executors(bob())).toEqual([
      expect.objectContaining({
        type: 'agent',
        id: PM,
        name: 'Project manager',
        isDefault: true,
      }),
    ]);
  });

  it('offers the enabled agents to mention, with what they are good at', async () => {
    const coder = await h.createAgent();
    const disabled = await h.createAgent({ name: 'Disabled' });
    await disable(disabled);
    const candidates = await h.projects.kinds
      .get('agent')!
      .mention!.candidates(h.database.connection(), {
        userId: 'alice',
        issueId: null,
        q: '',
        limit: 10,
      });
    expect(candidates).toEqual([
      expect.objectContaining({
        kind: 'agent',
        id: coder,
        name: 'Coder',
        hint: 'Writes and fixes code.',
      }),
    ]);
  });
});

describe('an issue moved to another project', () => {
  /** Two projects with a repository each, and an issue of the first given to an agent. */
  async function movable() {
    h.roles.set('alice', 'admin');
    const studio = await h.projects.projects.create(alice(), {
      name: 'Studio',
    });
    await h.projects.projects.addResource(alice(), studio.id, {
      type: 'gitRepo',
      url: 'https://example.com/acme/studio.git',
    });
    const core = await h.projects.projects.create(alice(), { name: 'Core' });
    await h.projects.projects.addResource(alice(), core.id, {
      type: 'gitRepo',
      url: 'https://example.com/acme/core.git',
    });
    await h.createAgent();
    const issue = await openIssue(alice(), {
      title: 'Fix login',
      projectId: studio.id,
    });
    await assign(issue);
    return { studio, core, agentId: PM, issue };
  }

  async function move(issueId: string, projectId: string) {
    const current = await h.projects.issueQueries.detail(alice(), issueId);
    return collectRunAttempts(() =>
      h.projects.issues.update(alice(), issueId, {
        revision: current.revision,
        projectId,
      }),
    );
  }

  /**
   * The repositories the run's context lists as its project's working directories; the project manager checks none
   * of them out.
   */
  const dirUrls = (payload: any): string[] => {
    expect(payload.workspace.dirs).toEqual([]);
    return [
      'https://example.com/acme/studio.git',
      'https://example.com/acme/core.git',
    ].filter((url) =>
      (payload.prompt.system as string).includes(`- ${url} [primary]`),
    );
  };

  async function start(runId: string) {
    await h.runner(RUNNER_ROUTES.start, runId, {
      workDir: '/tmp/w',
      adapter: { kind: 'claude' },
      acceptsInput: true,
    });
  }

  it('starts queued work in the new project, told where it came from', async () => {
    const { core, issue } = await movable();
    const { attempts } = await move(issue.id, core.id);
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'projectChanged', started: true }),
    ]);
    expect((await runsOf(issue.id)).map((run) => run.status)).toEqual([
      'queued',
    ]);
    const payload = await h.claimOne();
    expect(dirUrls(payload)).toEqual(['https://example.com/acme/core.git']);
    const moved = payload.inputs.at(-1);
    expect(moved).toMatchObject({
      type: 'signal',
      payload: { trigger: 'projectChanged', toProject: core.id },
    });
    expect(moved.text).toContain('from project Studio to project Core');
    expect(moved.text).toContain(
      `\`agent/${issue.identifier}\` of https://example.com/acme/studio.git`,
    );
    expect(payload.prompt.system).toContain(
      'The issue moved to another project',
    );
  });

  it('stops the run working in the previous project, and starts one in the new project once it ended', async () => {
    const { studio, core, issue } = await movable();
    const first = await h.claimOne();
    expect(dirUrls(first)).toEqual(['https://example.com/acme/studio.git']);
    await start(first.run.id);
    const { attempts } = await move(issue.id, core.id);
    expect(attempts).toEqual([]);
    const held = await h.agents.runs.detail(first.run.id);
    expect(held.status).toBe('running');
    expect(held.cancelRequestedAt).not.toBeNull();
    expect(held.inputs.at(-1)).toMatchObject({
      payload: { trigger: 'projectChanged', restartAfter: first.run.id },
    });
    // Nothing starts while the run in the previous project's directories still holds the issue.
    expect((await runsOf(issue.id)).map((run) => run.status)).toEqual([
      'running',
    ]);
    const acked = await h.runner(RUNNER_ROUTES.cancelAck, first.run.id, {});
    expect(acked.status).toBe(200);
    expect((await runsOf(issue.id)).map((run) => run.status).sort()).toEqual([
      'cancelled',
      'queued',
    ]);
    const next = await h.claimOne();
    expect(next.run.id).not.toBe(first.run.id);
    expect(dirUrls(next)).toEqual(['https://example.com/acme/core.git']);
    expect(next.inputs).toEqual([
      expect.objectContaining({
        actor: { kind: 'user', id: 'alice', name: 'alice' },
        payload: {
          trigger: 'projectChanged',
          fromProject: studio.id,
          toProject: core.id,
        },
        text: expect.stringContaining(
          `moved ${issue.identifier} from project Studio to project Core`,
        ),
      }),
    ]);
  });

  it('lets the agent that moved its own issue end its run, then starts one in the new project', async () => {
    const { core, agentId, issue } = await movable();
    const first = await h.claimOne();
    await start(first.run.id);
    const asAgent = { ...alice(), actor: { type: 'agent', id: agentId } };
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(asAgent, issue.id, {
      revision: current.revision,
      projectId: core.id,
    });
    const held = await h.agents.runs.detail(first.run.id);
    expect(held.cancelRequestedAt).toBeNull();
    expect(held.inputs.at(-1)!.text).toContain(
      `You moved ${issue.identifier} to project Core`,
    );
    const done = await h.runner(RUNNER_ROUTES.complete, first.run.id, {
      summary: 'Found it in Core.',
      handledInputIds: held.inputs.map((input) => input.id),
    });
    expect(done.status).toBe(200);
    const next = await h.claimOne();
    expect(next.run.id).not.toBe(first.run.id);
    expect(dirUrls(next)).toEqual(['https://example.com/acme/core.git']);
    expect(next.inputs.at(-1).payload.trigger).toBe('projectChanged');
  });

  it('starts nothing for an issue in backlog', async () => {
    const { core, issue } = await movable();
    const current = await h.projects.issueQueries.detail(alice(), issue.id);
    await h.projects.issues.update(alice(), issue.id, {
      revision: current.revision,
      statusKey: 'backlog',
    });
    const before = await runsOf(issue.id);
    const { attempts } = await move(issue.id, core.id);
    expect(attempts).toEqual([]);
    expect(await runsOf(issue.id)).toEqual(before);
  });
});
