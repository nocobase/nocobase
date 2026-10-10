// @vitest-environment node
/**
 * What may start an agent's work on an issue: an issue that waits for unfinished issues starts nothing and gives up
 * its queued work, an issue in backlog starts when it leaves backlog, and the runs of more urgent issues are claimed
 * first. Each rule leaves a record on the issue's activity.
 */
import { collectRunAttempts } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { WorkflowListItem } from '@nocobase/app-plugin-projects/shared/workflows';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_QUEUED_EXPIRY_HOURS } from '../../server/agents/bind.js';
import { ISSUE_RUN_PRIORITY } from '../../server/agents/work.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

async function asAdmin<T>(run: () => Promise<T>): Promise<T> {
  h.roles.set('alice', 'admin');
  try {
    return await run();
  } finally {
    h.roles.delete('alice');
  }
}

async function update(
  issue: Issue,
  patch: Record<string, unknown>,
): Promise<Issue> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  return h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    ...patch,
  });
}

const assign = (issue: Issue, agentId: string) =>
  update(issue, { executor: { type: 'agent', id: agentId } });

const moveTo = (issue: Issue, statusKey: string) =>
  update(issue, { statusKey });

const block = (issue: Issue, blocker: Issue) =>
  h.projects.subtasks.addDependency(alice(), issue.id, {
    dependsOnIssueId: blocker.id,
  });

async function runsOf(issueId: string) {
  return h.agents.runs.list({ subjectKind: 'issue', subjectId: issueId });
}

async function activities(issueId: string) {
  return (await h.projects.issueQueries.activities(alice(), issueId, {})).data;
}

async function triggersOf(runId: string) {
  return (await h.agents.runs.detail(runId)).inputs.map(
    (input) => (input.payload as { trigger?: string } | null)?.trigger,
  );
}

describe('an issue that waits for unfinished issues', () => {
  it('starts no work for the agent given it, and records what it waits for', async () => {
    const agentId = await h.createAgent();
    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), { title: 'Then' });
    await block(issue, first);
    const { attempts } = await collectRunAttempts(() => assign(issue, agentId));
    expect(attempts).toEqual([
      expect.objectContaining({
        principalId: agentId,
        triggerType: 'assigned',
        started: false,
        skipped: 'blocked',
      }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_skipped',
      ),
    ).toMatchObject({
      actorType: 'agent',
      actorId: agentId,
      details: {
        reason: 'blocked',
        trigger: 'assigned',
        blockers: [{ issueId: first.id, identifier: first.identifier }],
      },
    });
  });

  it('does not wake a mentioned agent either', async () => {
    const agentId = await h.createAgent();
    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), { title: 'Then' });
    await block(issue, first);
    const { value, attempts } = await collectRunAttempts(() =>
      h.projects.comments.create(alice(), issue.id, {
        content: `Look [@Coder](mention://agent/${agentId})`,
      }),
    );
    expect(value.triggered).toEqual([]);
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'mention', skipped: 'blocked' }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('gives up its queued work when a blocker is added, and leaves work a runner holds', async () => {
    const agentId = await h.createAgent();
    const other = await h.createAgent({ name: 'Reviewer' });
    const held = await h.projects.issues.create(alice(), { title: 'Held' });
    await assign(held, agentId);
    await h.claimOne();
    const issue = await h.projects.issues.create(alice(), { title: 'Queued' });
    await assign(issue, other);
    const first = await h.projects.issues.create(alice(), { title: 'First' });

    await block(held, first);
    await block(issue, first);

    expect((await runsOf(held.id))[0]).toMatchObject({ status: 'dispatched' });
    const [withdrawn] = await runsOf(issue.id);
    expect(withdrawn).toMatchObject({
      status: 'cancelled',
      failureReason: 'cancelled',
      failureDetail: `${issue.identifier} is waiting for unfinished issues.`,
    });
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_withdrawn',
      ),
    ).toMatchObject({
      actorType: 'agent',
      actorId: other,
      details: {
        reason: 'blocked',
        runId: withdrawn!.id,
        blockers: [{ identifier: first.identifier }],
      },
    });
    expect(
      (await activities(held.id)).some(
        (entry) => entry.action === 'work_withdrawn',
      ),
    ).toBe(false);
  });

  it('wakes its agent again once the last blocker is finished', async () => {
    const agentId = await h.createAgent();
    const one = await h.projects.issues.create(alice(), { title: 'One' });
    const two = await h.projects.issues.create(alice(), { title: 'Two' });
    const issue = await h.projects.issues.create(alice(), { title: 'Then' });
    await assign(issue, agentId);
    await block(issue, one);
    await block(issue, two);
    expect((await runsOf(issue.id))[0]).toMatchObject({ status: 'cancelled' });

    await moveTo(one, 'done');
    expect(await runsOf(issue.id)).toHaveLength(1);

    const { attempts } = await collectRunAttempts(() => moveTo(two, 'done'));
    expect(attempts).toEqual([
      expect.objectContaining({
        principalId: agentId,
        triggerType: 'unblocked',
        started: true,
      }),
    ]);
    const queued = (await runsOf(issue.id)).find(
      (run) => run.status === 'queued',
    );
    expect(queued).toBeDefined();
    expect(await triggersOf(queued!.id)).toEqual(['unblocked']);
  });

  it('does not wake its agent when released while in backlog', async () => {
    const agentId = await h.createAgent();
    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Someday',
      statusKey: 'backlog',
      executor: { type: 'agent', id: agentId },
    });
    await block(issue, first);
    const { attempts } = await collectRunAttempts(() => moveTo(first, 'done'));
    expect(attempts).toEqual([
      expect.objectContaining({
        triggerType: 'unblocked',
        skipped: 'dormant',
      }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
  });
});

describe('an issue in backlog', () => {
  it('starts no work when an agent is given it, and starts it when the issue leaves backlog', async () => {
    const agentId = await h.createAgent();
    const { value: issue, attempts } = await collectRunAttempts(() =>
      h.projects.issues.create(alice(), {
        title: 'Someday',
        statusKey: 'backlog',
        executor: { type: 'agent', id: agentId },
      }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'assigned', skipped: 'dormant' }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_skipped',
      ),
    ).toMatchObject({
      actorType: 'agent',
      actorId: agentId,
      details: { reason: 'dormant', trigger: 'assigned', status: 'backlog' },
    });

    const moved = await collectRunAttempts(() => moveTo(issue, 'todo'));
    expect(moved.attempts).toEqual([
      expect.objectContaining({ triggerType: 'statusChange', started: true }),
    ]);
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({ status: 'queued', actorUserId: 'alice' });
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      type: 'statusChange',
      payload: { trigger: 'statusChange', from: 'backlog', to: 'todo' },
    });
  });

  it('starts nothing when the person moves it out asking not to start now', async () => {
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Someday',
      statusKey: 'backlog',
      executor: { type: 'agent', id: agentId },
    });
    const { attempts } = await collectRunAttempts(() =>
      update(issue, { statusKey: 'todo', start: false }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({
        triggerType: 'statusChange',
        skipped: 'deferred',
      }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('starts nothing when it leaves backlog for a finished status, or while it is held', async () => {
    const agentId = await h.createAgent();
    const closed = await h.projects.issues.create(alice(), {
      title: 'Dropped',
      statusKey: 'backlog',
      executor: { type: 'agent', id: agentId },
    });
    await moveTo(closed, 'cancelled');
    expect(await runsOf(closed.id)).toEqual([]);

    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const held = await h.projects.issues.create(alice(), {
      title: 'Held',
      statusKey: 'backlog',
      executor: { type: 'agent', id: agentId },
    });
    await block(held, first);
    const { attempts } = await collectRunAttempts(() => moveTo(held, 'todo'));
    expect(attempts).toEqual([
      expect.objectContaining({
        triggerType: 'statusChange',
        skipped: 'blocked',
      }),
    ]);
    expect(await runsOf(held.id)).toEqual([]);
  });
});

describe('the claim order of issue runs', () => {
  it('gives a run its issue’s priority, so a runner takes urgent issues first', async () => {
    const agentId = await h.createAgent();
    const later = await h.projects.issues.create(alice(), {
      title: 'Later',
      priority: 'low',
      executor: { type: 'agent', id: agentId },
    });
    const urgent = await h.projects.issues.create(alice(), {
      title: 'Urgent',
      priority: 'urgent',
      executor: { type: 'agent', id: agentId },
    });
    expect((await runsOf(later.id))[0]?.priority).toBe(ISSUE_RUN_PRIORITY.low);
    expect((await runsOf(urgent.id))[0]?.priority).toBe(
      ISSUE_RUN_PRIORITY.urgent,
    );
    const payload = await h.claimOne();
    expect(payload.run.id).toBe((await runsOf(urgent.id))[0]?.id);
  });
});

describe('an issue run no runner takes', () => {
  it('fails as queuedExpired after a day, and asks the owner what next', async () => {
    const planned: any[] = [];
    h.projects.events.on('notice.planned', (event) => {
      planned.push(event.notice);
    });
    expect(h.agents.subjects.get('issue')?.queuedExpiryMs).toBe(
      DEFAULT_QUEUED_EXPIRY_HOURS * 3_600_000,
    );
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Nobody home',
      executor: { type: 'agent', id: agentId },
    });
    const [run] = await runsOf(issue.id);
    await h.agents.sweeper.sweep();
    expect((await h.agents.runs.get(run!.id)).status).toBe('queued');

    // As if it had been waiting for longer than a day.
    const longAgo = new Date(
      Date.now() - (DEFAULT_QUEUED_EXPIRY_HOURS + 1) * 3_600_000,
    ).toISOString();
    await h.database
      .connection()
      .repository('agRuns')
      .updateMany({ filter: { id: run!.id }, values: { updatedAt: longAgo } });
    await h.agents.sweeper.sweep();
    expect(await h.agents.runs.get(run!.id)).toMatchObject({
      status: 'failed',
      failureReason: 'queuedExpired',
    });
    await expect.poll(() => planned.length).toBe(1);
    expect(planned[0]).toMatchObject({
      type: 'run_failed_final',
      issue: { id: issue.id },
      params: { runId: run!.id, failureReason: 'queuedExpired' },
    });
  });
});

describe('a workflow stage that runs agents', () => {
  async function runAgentIn(statusKey: string): Promise<WorkflowListItem> {
    return asAdmin(async () => {
      const created = await h.projects.workflows.create(alice(), {
        name: 'Staged',
        copyFrom: null,
      });
      const workflow = await h.projects.workflows.setDefault(
        alice(),
        created.id,
      );
      return h.projects.workflows.update(alice(), workflow.id, {
        revision: workflow.revision,
        definition: {
          ...workflow.definition,
          states: workflow.definition.states.map((state) =>
            state.key === statusKey
              ? {
                  ...state,
                  rules: [
                    {
                      type: 'runAgent',
                      config: { instruction: 'Build {{issue.identifier}}.' },
                    },
                  ],
                }
              : state,
          ),
        },
      });
    });
  }

  it('skips its run while the issue is held, and gives the instruction when the issue is released', async () => {
    await runAgentIn('in_progress');
    const agentId = await h.createAgent();
    const first = await h.projects.issues.create(alice(), { title: 'First' });
    const issue = await h.projects.issues.create(alice(), {
      title: 'Then',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await block(issue, first);
    await moveTo(issue, 'in_progress');
    expect(await runsOf(issue.id)).toEqual([]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'stage_action_skipped',
      )?.details,
    ).toMatchObject({
      rule: 'runAgent',
      reason: 'blocked',
      blockers: [{ identifier: first.identifier }],
    });

    await moveTo(first, 'done');
    const [run] = await runsOf(issue.id);
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      payload: {
        trigger: 'unblocked',
        status: 'in_progress',
        instruction: `Build ${issue.identifier}.`,
      },
    });
    const claimed = await h.claimOne();
    expect(claimed.prompt.system as string).toContain(
      `> Build ${issue.identifier}.`,
    );
  });

  it('gives its run the issue’s priority', async () => {
    await runAgentIn('in_progress');
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Hot',
      priority: 'high',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    await moveTo(issue, 'in_progress');
    expect((await runsOf(issue.id))[0]?.priority).toBe(ISSUE_RUN_PRIORITY.high);
  });
});
