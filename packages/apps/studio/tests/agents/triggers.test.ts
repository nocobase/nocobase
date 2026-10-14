// @vitest-environment node
/**
 * What starts the project manager's work on an issue it executes (`server/agents/work.ts`): being given an open issue,
 * a person starting it from backlog, a person's move while it works, a release; an issue that waits for unfinished
 * issues starts nothing and gives up its queued work, an issue in backlog or finished starts nothing, and the runs of
 * more urgent issues are claimed first. Each rule leaves a record on the issue's activity.
 */
import { collectRunAttempts } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_QUEUED_EXPIRY_HOURS } from '../../server/agents/bind.js';
import { ISSUE_RUN_PRIORITY } from '../../server/agents/work.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

async function update(
  issue: Issue,
  patch: Record<string, unknown>,
): Promise<Issue> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  return h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    ...(patch.statusKey === 'blocked' || patch.statusKey === 'in_review'
      ? { needsYou: 'Choose how to proceed.' }
      : {}),
    ...patch,
  });
}

const MANAGER = { type: 'agent', id: PROJECT_MANAGER_ID } as const;

/** Gives the issue to the project manager. */
const manage = (issue: Issue) => update(issue, { executor: MANAGER });

/** An issue a person executes, so no agent works on it. */
const personal = (title: string, statusKey = 'in_progress') =>
  h.projects.issues.create(alice(), {
    title,
    statusKey,
    executor: { type: 'user', id: 'alice' },
  });

/** An open issue the project manager executes; its work starts unless `start` is false. */
const managed = (title: string, extra: Record<string, unknown> = {}) =>
  h.projects.issues.create(alice(), {
    title,
    statusKey: 'in_progress',
    executor: MANAGER,
    ...extra,
  });

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
  it('starts no work for the project manager given it, and records what it waits for', async () => {
    await h.createAgent();
    const first = await personal('First');
    const issue = await personal('Then');
    await block(issue, first);
    const { attempts } = await collectRunAttempts(() => manage(issue));
    expect(attempts).toEqual([
      expect.objectContaining({
        principalId: PROJECT_MANAGER_ID,
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
      actorId: PROJECT_MANAGER_ID,
      details: {
        reason: 'blocked',
        trigger: 'assigned',
        blockers: [{ issueId: first.id, identifier: first.identifier }],
      },
    });
  });

  it('does not wake a mentioned agent either', async () => {
    const agentId = await h.createAgent();
    const first = await personal('First');
    const issue = await personal('Then');
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
    await h.createAgent();
    const held = await managed('Held');
    await h.claimOne();
    const issue = await managed('Queued');
    const first = await personal('First');

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
      actorId: PROJECT_MANAGER_ID,
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

  it('wakes the project manager again once the last blocker is finished', async () => {
    await h.createAgent();
    const one = await personal('One');
    const two = await personal('Two');
    const issue = await managed('Then');
    await block(issue, one);
    await block(issue, two);
    expect((await runsOf(issue.id))[0]).toMatchObject({ status: 'cancelled' });

    await moveTo(one, 'done');
    expect(await runsOf(issue.id)).toHaveLength(1);

    const { attempts } = await collectRunAttempts(() => moveTo(two, 'done'));
    expect(attempts).toEqual([
      expect.objectContaining({
        principalId: PROJECT_MANAGER_ID,
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

  it('does not wake the project manager when released while in backlog', async () => {
    await h.createAgent();
    const first = await personal('First');
    const issue = await h.projects.issues.create(alice(), {
      title: 'Someday',
      statusKey: 'backlog',
      executor: MANAGER,
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
  it('starts no work when the project manager is given it, and starts it when a person starts the issue', async () => {
    await h.createAgent();
    const { value: issue, attempts } = await collectRunAttempts(() =>
      h.projects.issues.create(alice(), {
        title: 'Someday',
        statusKey: 'backlog',
        executor: MANAGER,
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
      actorId: PROJECT_MANAGER_ID,
      details: { reason: 'dormant', trigger: 'assigned', status: 'backlog' },
    });

    const moved = await collectRunAttempts(() => moveTo(issue, 'in_progress'));
    expect(moved.attempts).toEqual([
      expect.objectContaining({ triggerType: 'started', started: true }),
    ]);
    const [run] = await runsOf(issue.id);
    expect(run).toMatchObject({
      status: 'queued',
      agentId: PROJECT_MANAGER_ID,
      actorUserId: 'alice',
    });
    expect((await h.agents.runs.detail(run!.id)).inputs[0]).toMatchObject({
      type: 'statusChange',
      payload: { trigger: 'started', from: 'backlog', to: 'in_progress' },
    });
  });

  it('starts nothing when the person moves it out asking not to start now', async () => {
    await h.createAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: 'Someday',
      statusKey: 'backlog',
      executor: MANAGER,
    });
    const { attempts } = await collectRunAttempts(() =>
      update(issue, { statusKey: 'in_progress', start: false }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'started', skipped: 'deferred' }),
    ]);
    expect(await runsOf(issue.id)).toEqual([]);
  });

  it('starts nothing when it leaves backlog for a finished status, or while it is held', async () => {
    await h.createAgent();
    const closed = await h.projects.issues.create(alice(), {
      title: 'Dropped',
      statusKey: 'backlog',
      executor: MANAGER,
    });
    await moveTo(closed, 'cancelled');
    expect(await runsOf(closed.id)).toEqual([]);

    const first = await personal('First');
    const held = await h.projects.issues.create(alice(), {
      title: 'Held',
      statusKey: 'backlog',
      executor: MANAGER,
    });
    await block(held, first);
    const { attempts } = await collectRunAttempts(() =>
      moveTo(held, 'in_progress'),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'started', skipped: 'blocked' }),
    ]);
    expect(await runsOf(held.id)).toEqual([]);
  });

  it('gives the project manager a new issue only once it is open', async () => {
    await h.createAgent();
    // New issues go to the project manager, in backlog, unless their creator says otherwise.
    const { value: issue, attempts } = await collectRunAttempts(() =>
      h.projects.issues.create(alice(), { title: 'Later' }),
    );
    expect(issue).toMatchObject({ statusKey: 'backlog', executor: MANAGER });
    expect(attempts).toEqual([
      expect.objectContaining({ triggerType: 'assigned', skipped: 'dormant' }),
    ]);
    const now = await managed('Now');
    expect(await runsOf(now.id)).toEqual([
      expect.objectContaining({
        agentId: PROJECT_MANAGER_ID,
        status: 'queued',
      }),
    ]);
    expect(await triggersOf((await runsOf(now.id))[0]!.id)).toEqual([
      'assigned',
    ]);
  });
});

describe("a person's move of an open issue", () => {
  it('tells a run that has not ended, and starts nothing when none is open', async () => {
    await h.createAgent();
    const issue = await managed('Ship');
    const [run] = await runsOf(issue.id);
    const told = await collectRunAttempts(() => moveTo(issue, 'blocked'));
    expect(told.attempts).toEqual([
      expect.objectContaining({
        triggerType: 'statusChange',
        started: true,
        runId: run!.id,
      }),
    ]);
    expect(await triggersOf(run!.id)).toEqual(['assigned', 'statusChange']);

    const quiet = await managed('Quiet', { start: false });
    expect(await runsOf(quiet.id)).toEqual([]);
    const moved = await collectRunAttempts(() => moveTo(quiet, 'in_review'));
    expect(moved.attempts).toEqual([]);
    expect(await runsOf(quiet.id)).toEqual([]);
    // Back into In progress, the work starts again.
    const resumed = await collectRunAttempts(() =>
      moveTo(quiet, 'in_progress'),
    );
    expect(resumed.attempts).toEqual([
      expect.objectContaining({ triggerType: 'statusChange', started: true }),
    ]);
  });

  it('withdraws queued work when the issue is finished', async () => {
    await h.createAgent();
    const issue = await managed('Drop');
    await moveTo(issue, 'cancelled');
    expect(await runsOf(issue.id)).toEqual([
      expect.objectContaining({ status: 'cancelled' }),
    ]);
  });

  it('wakes nothing when the project manager moves the issue itself', async () => {
    await h.createAgent();
    const issue = await managed('Ask');
    const payload = await h.claimOne();
    const moved = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      {
        runToken: payload.cli.credential.content.token as string,
        body: {
          statusKey: 'blocked',
          needsYou: 'Which database should the migration target?',
        },
      },
    );
    expect(moved.status).toBe(200);
    const runs = await runsOf(issue.id);
    expect(runs).toHaveLength(1);
    expect(await triggersOf(runs[0]!.id)).toEqual(['assigned']);
  });
});

describe('sub-issues that all finish', () => {
  it('wake the project manager of their parent', async () => {
    await h.createAgent();
    const parent = await managed('Parent', { start: false });
    const child = await personal('Child');
    await update(child, { parentIssueId: parent.id });
    const { attempts } = await collectRunAttempts(() => moveTo(child, 'done'));
    expect(attempts).toEqual([
      expect.objectContaining({
        principalId: PROJECT_MANAGER_ID,
        triggerType: 'subtasksFinished',
        started: true,
      }),
    ]);
    const [run] = await runsOf(parent.id);
    expect(await triggersOf(run!.id)).toEqual(['subtasksFinished']);
  });
});

describe('the claim order of issue runs', () => {
  it('gives a run its issue’s priority, so a runner takes urgent issues first', async () => {
    await h.createAgent();
    const later = await managed('Later', { priority: 'low' });
    const urgent = await managed('Urgent', { priority: 'urgent' });
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
    await h.createAgent();
    const issue = await managed('Nobody home');
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
