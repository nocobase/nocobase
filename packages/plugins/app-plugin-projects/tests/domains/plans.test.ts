// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type {
  CreatePlanRequest,
  Plan,
  PlanDecided,
  PlanRowInput,
} from '../../shared/plans.js';
import type { Viewer } from '../../server/access/viewer.js';
import type { DomainEvent } from '../../server/kernel/events.js';
import type { IssueWorkHandler, RunAttempt } from '../../server/kernel/work.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
let events: DomainEvent[];
let decisions: PlanDecided[];
/** Work the bots' handler really queued (outside rehearsals), and what it was asked in rehearsals. */
let queued: RunAttempt[];
let rehearsed: RunAttempt[];

beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob', 'carol']) await h.addUser(id, id);
  events = [];
  h.services.events.onAny((event) => {
    events.push(event);
  });
  decisions = [];
  h.planHooks.current = {
    onPlanDecided: (_tx, decided) => {
      decisions.push(decided);
      return Promise.resolve();
    },
  };
  queued = [];
  rehearsed = [];
  addAgents();
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

/** An `agent` kind whose work handler starts work for every assignment and mention, and queues it only for real. */
function addAgents(): void {
  const attempt = (subjectId: string, triggerType: string, id: string) => ({
    kind: 'agent',
    principalId: id,
    subjectId,
    triggerType,
    started: true,
  });
  const work: IssueWorkHandler = {
    onIssueChanged(tx, change) {
      if (change.after.executor?.type !== 'agent') return Promise.resolve([]);
      const found = attempt(
        change.after.id,
        'assigned',
        change.after.executor.id,
      );
      (tx.rehearsal ? rehearsed : queued).push(found);
      return Promise.resolve([found]);
    },
    onCommentCreated(tx, change) {
      const found = change.mentions
        .filter((ref) => ref.kind === 'agent')
        .map((ref) => attempt(change.issue.id, 'mention', ref.id));
      (tx.rehearsal ? rehearsed : queued).push(...found);
      return Promise.resolve(found);
    },
  };
  h.services.kinds.add({
    key: 'agent',
    names: (_conn, ids) =>
      Promise.resolve(new Map([...ids].map((id) => [id, `Agent ${id}`]))),
    executor: {
      require: () => Promise.resolve(),
      canKeep: () => Promise.resolve(true),
    },
    mention: { candidates: () => Promise.resolve([]) },
    work,
  });
}

function plan(
  rows: readonly PlanRowInput[],
  extra: Partial<CreatePlanRequest> = {},
): CreatePlanRequest {
  return {
    title: 'Plan',
    source: { kind: 'conversation', key: 'conversation:c1' },
    proposer: { agentId: 'pm', runId: 'run-1', conversationId: 'c1' },
    rows,
    ...extra,
  };
}

async function counts() {
  const conn = h.database.connection();
  return {
    issues: await conn.repository('pmIssues').count(),
    comments: await conn.repository('pmComments').count(),
    activities: await conn.repository('pmActivities').count(),
    projects: await conn.repository('pmProjects').count(),
    plans: await conn.repository('pmPlans').count(),
  };
}

async function failure(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as {
      code: string;
      kind: string;
      details?: Record<string, unknown>;
    };
  }
  throw new Error('Expected a failure.');
}

describe('rehearsal', () => {
  it('runs every row and leaves nothing behind: no rows, no events, no queued work', async () => {
    const existing = await h.services.issues.create(alice(), { title: 'Old' });
    events = [];
    const before = await counts();
    const result = await h.services.plans.rehearse(
      alice(),
      plan([
        {
          op: 'issue.create',
          ref: 'a',
          params: { title: 'New', executor: { type: 'agent', id: 'dev' } },
        },
        {
          op: 'comment.create',
          params: {
            issue: existing.id,
            content: 'Ping [@Reviewer](mention://agent/rev)',
          },
        },
        {
          op: 'issue.update',
          params: { issue: existing.identifier, set: { priority: 'high' } },
        },
        {
          op: 'dependency',
          params: {
            action: 'add',
            issue: existing.id,
            dependsOn: { ref: 'a' },
          },
        },
      ]),
    );
    expect(result.ok).toBe(true);
    expect(await counts()).toEqual(before);
    expect(events).toEqual([]);
    expect(queued).toEqual([]);
    expect(rehearsed).toHaveLength(2);

    const [create, comment, update, link] = result.rows;
    expect(create?.wakes).toEqual([
      expect.objectContaining({
        kind: 'agent',
        principalId: 'dev',
        name: 'Agent dev',
        started: true,
      }),
    ]);
    expect(create?.flags).toEqual(
      expect.arrayContaining(['agentExecutor', 'startsRun']),
    );
    // What the rehearsal created was rolled back: the card shows no id for it.
    expect(create?.target).toMatchObject({ type: 'issue', id: null });
    expect(comment?.wakes[0]).toMatchObject({ principalId: 'rev' });
    expect(update?.baseline).toEqual({
      target: expect.objectContaining({ id: existing.id }),
      fields: { priority: 'none' },
    });
    expect(update?.flags).toEqual([]);
    expect(link?.ok).toBe(true);
  });

  it('reports every failing row and stores nothing', async () => {
    const before = await counts();
    const error = await failure(
      h.services.plans.create(
        alice(),
        plan([
          { op: 'issue.create', params: { title: 'Fine' } },
          {
            op: 'issue.create',
            params: { title: 'Child', parentIssueId: { ref: 'nope' } },
          },
          {
            op: 'issue.update',
            params: { issueId: 'PM-1', set: {} } as never,
          },
        ]),
      ),
    );
    expect(error.code).toBe('PLAN_INVALID');
    const rows = error.details?.rows as {
      ok: boolean;
      error: { code: string } | null;
    }[];
    expect(rows.map((row) => row.ok)).toEqual([true, false, false]);
    expect(rows[1]?.error?.code).toBe('INVALID_REF');
    expect(rows[2]?.error?.code).toBe('INVALID_PARAMS');
    expect(await counts()).toEqual(before);
  });

  it('refuses rows the decider may not perform', async () => {
    h.roles.set('carol', 'none');
    const error = await failure(
      h.services.plans.create(
        h.viewer('carol', 'none'),
        plan([{ op: 'issue.create', params: { title: 'Nope' } }]),
      ),
    );
    expect(error.code).toBe('PLAN_INVALID');
    expect(
      (error.details?.rows as { error: { code: string } }[])[0]?.error.code,
    ).toBe('FORBIDDEN');
  });
});

describe('execution', () => {
  it('runs rows that refer to earlier ones, in one transaction, as the person who clicks, via the agent', async () => {
    const created = await h.services.plans.create(
      alice(),
      plan([
        { op: 'project.create', ref: 'p', params: { name: 'Launch' } },
        {
          op: 'issue.create',
          ref: 'api',
          params: { title: 'API', projectId: { ref: 'p' } },
        },
        {
          op: 'issue.create',
          ref: 'docs',
          params: {
            title: 'Docs',
            parentIssueId: { ref: 'api' },
            executor: { type: 'agent', id: 'writer' },
          },
        },
        {
          op: 'issue.create',
          ref: 'design',
          params: { title: 'Design', projectId: { ref: 'p' } },
        },
        {
          op: 'dependency',
          params: {
            action: 'add',
            issue: { ref: 'docs' },
            dependsOn: { ref: 'design' },
          },
        },
      ]),
    );
    expect(created.status).toBe('pending');
    expect(created.rows[0]?.check?.flags).toContain('createsProject');
    events = [];

    const executed = await h.services.plans.execute(alice(), created.id, {
      revision: created.revision,
    });
    expect(executed.status).toBe('executed');
    expect(executed.executedById).toBe('alice');
    expect(executed.undoableUntil).not.toBeNull();
    const [project, api, docs, design] = executed.rows.map(
      (row) => row.result?.created,
    );
    const apiIssue = await h.services.issueQueries.detail(
      alice(),
      api?.id as string,
    );
    expect(apiIssue.projectId).toBe(project?.id);
    const docsIssue = await h.services.issueQueries.detail(
      alice(),
      docs?.id as string,
    );
    expect(docsIssue.parentIssueId).toBe(api?.id);
    expect(docsIssue.projectId).toBe(project?.id);
    expect(docsIssue.blockedBy.map((link) => link.issueId)).toEqual([
      design?.id,
    ]);
    // The agent was woken for real once, after the rehearsal only reported it.
    expect(queued).toEqual([
      expect.objectContaining({ principalId: 'writer', subjectId: docs?.id }),
    ]);
    expect(executed.rows[2]?.result?.wakes[0]).toMatchObject({
      principalId: 'writer',
    });
    // Events went out after the commit.
    expect(events.some((event) => event.type === 'issue.created')).toBe(true);
    // The timeline says who did it and through what.
    const created2 = docsIssue.activities.find(
      (a) => a.action === 'issue_created',
    );
    expect(created2?.actorId).toBe('alice');
    expect(created2?.via).toEqual({
      type: 'agent',
      agentId: 'pm',
      agentName: 'Agent pm',
      runId: 'run-1',
      conversationId: 'c1',
      planId: created.id,
    });
    expect(decisions).toEqual([
      expect.objectContaining({
        planId: created.id,
        outcome: 'executed',
        decidedById: 'alice',
        proposer: { agentId: 'pm', runId: 'run-1', conversationId: 'c1' },
      }),
    ]);
    // The decision names the work each row started, for whoever follows it.
    expect(decisions[0]?.rows[2]?.wakes).toEqual([
      expect.objectContaining({ principalId: 'writer', subjectId: docs?.id }),
    ]);
  });

  it('goes stale when a target changed after the rehearsal, rolls everything back, and runs after a retry', async () => {
    const target = await h.services.issues.create(alice(), { title: 'Target' });
    const created = await h.services.plans.create(
      alice(),
      plan([
        { op: 'issue.create', params: { title: 'Side effect' } },
        {
          op: 'issue.update',
          params: { issue: target.id, set: { priority: 'high' } },
        },
      ]),
    );
    await h.services.issues.update(bob(), target.id, {
      revision: target.revision,
      priority: 'low',
    });
    const before = await counts();

    const stale = await h.services.plans.execute(alice(), created.id, {
      revision: created.revision,
    });
    expect(stale.status).toBe('stale');
    expect(stale.failure).toMatchObject({
      code: 'PLAN_STALE',
      rowId: created.rows[1]?.id,
    });
    expect((await counts()).issues).toBe(before.issues);
    expect(decisions.at(-1)).toMatchObject({ outcome: 'stale' });
    // Executing again needs a retry first.
    expect(
      (
        await failure(
          h.services.plans.execute(alice(), created.id, {
            revision: stale.revision,
          }),
        )
      ).code,
    ).toBe('PLAN_NOT_OPEN');

    const retried = await h.services.plans.retry(alice(), created.id, {
      revision: stale.revision,
    });
    expect(retried.status).toBe('pending');
    expect(retried.rows[1]?.check?.baseline?.fields).toEqual({
      priority: 'low',
    });
    const executed = await h.services.plans.execute(alice(), created.id, {
      revision: retried.revision,
    });
    expect(executed.status).toBe('executed');
    const detail = await h.services.issueQueries.detail(alice(), target.id);
    expect(detail.priority).toBe('high');
  });

  it('fails as a whole when a row is refused at execution', async () => {
    const target = await h.services.issues.create(alice(), { title: 'Target' });
    const created = await h.services.plans.create(
      alice(),
      plan([
        { op: 'issue.create', params: { title: 'Rolled back' } },
        { op: 'comment.create', params: { issue: target.id, content: 'Hi' } },
      ]),
    );
    // Bob executes nothing of alice's: he cannot even see it.
    expect(
      (
        await failure(
          h.services.plans.execute(bob(), created.id, {
            revision: created.revision,
          }),
        )
      ).code,
    ).toBe('NOT_FOUND');
    await h.services.issues.remove(h.viewer('alice', 'admin'), target.id);
    const before = await counts();
    const failed = await h.services.plans.execute(alice(), created.id, {
      revision: created.revision,
    });
    expect(failed.status).toBe('failed');
    expect(failed.failure).toMatchObject({
      code: 'NOT_FOUND',
      rowId: created.rows[1]?.id,
    });
    expect(await counts()).toEqual(before);
  });

  it('executes only once', async () => {
    const created = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'Once' } }]),
    );
    const results = await Promise.allSettled([
      h.services.plans.execute(alice(), created.id, {
        revision: created.revision,
      }),
      h.services.plans.execute(alice(), created.id, {
        revision: created.revision,
      }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect((await counts()).issues).toBe(1);
  });
});

describe('editing', () => {
  it('changes params and removes rows, rehearsing again', async () => {
    const created = await h.services.plans.create(
      alice(),
      plan([
        { op: 'issue.create', params: { title: 'One' } },
        { op: 'issue.create', params: { title: 'Two' } },
      ]),
    );
    const [one, two] = created.rows;
    const edited = await h.services.plans.edit(alice(), created.id, {
      revision: created.revision,
      rows: [
        { id: one?.id as string, params: { title: 'Uno', priority: 'urgent' } },
        { id: two?.id as string, remove: true },
      ],
    });
    expect(edited.rows).toHaveLength(1);
    expect(edited.rows[0]?.params).toEqual({
      title: 'Uno',
      priority: 'urgent',
    });
    expect(edited.revision).toBe(created.revision + 1);
    // An edit that breaks a row is refused and changes nothing.
    const error = await failure(
      h.services.plans.edit(alice(), created.id, {
        revision: edited.revision,
        rows: [{ id: one?.id as string, params: { title: '' } }],
      }),
    );
    expect(error.code).toBe('PLAN_INVALID');
    expect(
      (
        await failure(
          h.services.plans.edit(alice(), created.id, {
            revision: created.revision,
            rows: [],
          }),
        )
      ).code,
    ).toBe('REVISION_CONFLICT');
  });
});

describe('permissions', () => {
  it('shows a plan to its decider only', async () => {
    const created = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'Mine' } }]),
    );
    expect((await failure(h.services.plans.get(bob(), created.id))).code).toBe(
      'NOT_FOUND',
    );
    expect((await h.services.plans.list(bob(), {})).data).toEqual([]);
    expect(
      (await h.services.plans.list(alice(), {})).data.map((p) => p.id),
    ).toEqual([created.id]);
    expect(
      (
        await failure(
          h.services.plans.create(alice(), {
            ...plan([{ op: 'issue.create', params: { title: 'X' } }]),
            deciderUserId: 'bob',
          }),
        )
      ).code,
    ).toBe('FORBIDDEN');
  });

  it("shows a status rule's plan to the issue's owner and editors, and lets the owner decide it", async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Owned' });
    const proposed = await h.services.plans.propose({
      title: 'Suggested executors',
      source: {
        kind: 'statusRule',
        key: `statusRule:${issue.id}`,
        issueId: issue.id,
      },
      deciderUserId: 'bob',
      rows: [
        {
          op: 'issue.update',
          params: {
            issue: issue.id,
            set: { executor: { type: 'agent', id: 'dev' } },
          },
        },
      ],
    });
    expect(proposed.createdBy).toEqual({ type: 'system', id: null });
    expect(proposed.rows[0]?.check?.flags).toEqual(
      expect.arrayContaining(['agentExecutor', 'startsRun']),
    );
    // Alice owns the issue; carol may edit issues she sees; someone without edit may not see it.
    expect((await h.services.plans.get(alice(), proposed.id)).id).toBe(
      proposed.id,
    );
    expect(
      (await h.services.plans.get(h.viewer('carol'), proposed.id)).id,
    ).toBe(proposed.id);
    expect(
      (
        await failure(
          h.services.plans.get(h.viewer('carol', 'none'), proposed.id),
        )
      ).code,
    ).toBe('NOT_FOUND');
    expect(
      (await h.services.plans.list(alice(), { issueId: issue.id })).data.map(
        (p) => p.id,
      ),
    ).toEqual([proposed.id]);
    const executed = await h.services.plans.execute(alice(), proposed.id, {
      revision: proposed.revision,
    });
    expect(executed.status).toBe('executed');
    // A plan nobody's agent proposed is marked as a plan on the timeline.
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.activities.at(-1)?.via).toEqual({
      type: 'plan',
      planId: proposed.id,
    });
  });
});

describe('plans about an issue', () => {
  const about = async (viewer: Viewer, issueId: string) =>
    (await h.services.plans.list(viewer, { issueId })).data.map((p) => p.id);

  it('lists a conversation plan on the issue one of its rows changes', async () => {
    const target = await h.services.issues.create(alice(), { title: 'A' });
    const other = await h.services.issues.create(alice(), { title: 'B' });
    const created = await h.services.plans.create(
      alice(),
      plan([
        {
          op: 'issue.update',
          params: { issue: target.identifier, set: { title: 'A2' } },
        },
      ]),
    );
    expect(await about(alice(), target.id)).toEqual([created.id]);
    expect(await about(alice(), target.identifier)).toEqual([created.id]);
    expect(await about(alice(), other.id)).toEqual([]);

    // Editing the plan records what its rows touch now.
    const edited = await h.services.plans.edit(alice(), created.id, {
      revision: created.revision,
      rows: [
        {
          id: created.rows[0]?.id as string,
          params: { issue: other.id, set: { title: 'B2' } },
        },
      ],
    });
    expect(edited.status).toBe('pending');
    expect(await about(alice(), target.id)).toEqual([]);
    expect(await about(alice(), other.id)).toEqual([created.id]);
  });

  it('lists a plan creating a child on the parent, and on the child once executed', async () => {
    const parent = await h.services.issues.create(alice(), { title: 'Epic' });
    const created = await h.services.plans.create(
      alice(),
      plan([
        {
          op: 'issue.create',
          params: { title: 'Child', parentIssueId: parent.id },
        },
      ]),
    );
    expect(await about(alice(), parent.id)).toEqual([created.id]);
    const executed = await h.services.plans.execute(alice(), created.id, {
      revision: created.revision,
    });
    const child = executed.rows[0]?.result?.created?.id as string;
    expect(child).toBeTruthy();
    expect(await about(alice(), child)).toEqual([created.id]);
    expect(await about(alice(), parent.id)).toEqual([created.id]);
  });

  it('leaks nothing about an issue the caller may not see, nor plans they may not see', async () => {
    const target = await h.services.issues.create(alice(), { title: 'A' });
    const created = await h.services.plans.create(
      alice(),
      plan([
        {
          op: 'comment.create',
          params: { issue: target.id, content: 'Looks good' },
        },
      ]),
    );
    expect(await about(alice(), target.id)).toEqual([created.id]);
    // The decider without the issue in sight, someone else who sees the issue, and an unknown issue.
    expect(await about(h.viewer('alice', 'none'), target.id)).toEqual([]);
    expect(await about(bob(), target.id)).toEqual([]);
    expect(await about(alice(), 'missing')).toEqual([]);
  });
});

describe('expiry and voiding', () => {
  it('voids the older open plan of the same source, and lets the decider void one', async () => {
    const first = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'First' } }]),
    );
    const second = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'Second' } }]),
    );
    const old = await h.services.plans.get(alice(), first.id);
    expect(old).toMatchObject({ status: 'voided', voidReason: 'superseded' });
    expect(decisions).toEqual([]);

    const voided = await h.services.plans.void(alice(), second.id, {
      revision: second.revision,
    });
    expect(voided).toMatchObject({ status: 'voided', voidReason: 'person' });
    expect(decisions.map((decision) => decision.outcome)).toEqual(['voided']);
    expect(
      (
        await failure(
          h.services.plans.execute(alice(), second.id, {
            revision: voided.revision,
          }),
        )
      ).code,
    ).toBe('PLAN_NOT_OPEN');
  });

  it('expires an open plan after its time', async () => {
    const created = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'Late' } }]),
    );
    await h.database
      .connection()
      .repository('pmPlans')
      .updateOne({
        filter: { id: created.id },
        values: { expiresAt: new Date(Date.now() - 1000).toISOString() },
      });
    expect((await h.services.plans.get(alice(), created.id)).status).toBe(
      'expired',
    );
    expect(
      (await h.services.plans.list(alice(), { status: 'open' })).data,
    ).toEqual([]);
    expect(
      (
        await failure(
          h.services.plans.execute(alice(), created.id, {
            revision: created.revision,
          }),
        )
      ).code,
    ).toBe('PLAN_EXPIRED');
    expect((await counts()).issues).toBe(0);

    const other = await h.services.plans.create(
      alice(),
      plan([{ op: 'issue.create', params: { title: 'Later' } }], {
        source: { kind: 'intake' },
      }),
    );
    expect(
      await h.services.plans.expire(new Date(Date.now() + 25 * 3600_000)),
    ).toBe(1);
    expect((await h.services.plans.get(alice(), other.id)).status).toBe(
      'expired',
    );
  });
});

describe('undo', () => {
  it('reverses what nobody changed since and lists what it leaves alone', async () => {
    const kept = await h.services.issues.create(alice(), { title: 'Kept' });
    const touched = await h.services.issues.create(alice(), {
      title: 'Touched',
    });
    const executed = await executePlan(alice(), [
      { op: 'project.create', ref: 'p', params: { name: 'Temp' } },
      {
        op: 'issue.create',
        ref: 'n',
        params: { title: 'New', projectId: { ref: 'p' } },
      },
      {
        op: 'issue.update',
        params: { issue: kept.id, set: { priority: 'high', title: 'Kept!' } },
      },
      {
        op: 'issue.update',
        params: { issue: touched.id, set: { priority: 'urgent' } },
      },
      { op: 'comment.create', params: { issue: kept.id, content: 'Done' } },
      {
        op: 'dependency',
        params: { action: 'add', issue: kept.id, dependsOn: touched.id },
      },
    ]);
    // Someone changes one of the targets afterwards.
    const now = await h.services.issueQueries.detail(bob(), touched.id);
    await h.services.issues.update(bob(), touched.id, {
      revision: now.revision,
      priority: 'low',
    });

    // Only the person who executed it may undo it.
    expect(
      (await failure(h.services.plans.undo(bob(), executed.id))).code,
    ).toBe('NOT_FOUND');
    // The preview changes nothing and says what will be reverted and what is left alone.
    const preview = await h.services.plans.previewUndo(alice(), executed.id);
    expect(preview.revert.map((row) => row.op)).toEqual([
      'dependency',
      'comment.retract',
      'issue.update',
      'issue.retract',
      'project.retract',
    ]);
    expect(preview.revert[2]).toMatchObject({
      position: 2,
      target: expect.objectContaining({ id: kept.id }),
      restore: { priority: 'none', title: 'Kept' },
    });
    expect(preview.skipped).toEqual([
      expect.objectContaining({ position: 3, reason: 'changed' }),
    ]);
    expect((await h.services.plans.get(alice(), executed.id)).status).toBe(
      'executed',
    );

    // Undoing applies it at once: there is no plan of its own to execute.
    const undone = await h.services.plans.undo(alice(), executed.id);
    expect(undone).toMatchObject({ id: executed.id, status: 'undone' });
    expect(undone.skipped).toEqual(preview.skipped);
    expect(undone.undoableUntil).toBeNull();
    expect(decisions.at(-1)).toMatchObject({
      planId: executed.id,
      outcome: 'undone',
    });
    const listed = await h.services.plans.list(alice(), {});
    expect(listed.data.map((item) => item.id)).toEqual([executed.id]);

    const keptNow = await h.services.issueQueries.detail(alice(), kept.id);
    expect(keptNow).toMatchObject({ title: 'Kept', priority: 'none' });
    expect(keptNow.blockedBy).toEqual([]);
    expect(keptNow.threads.every((thread) => thread.root.deleted)).toBe(true);
    expect(
      (await h.services.issueQueries.detail(alice(), touched.id)).priority,
    ).toBe('low');
    const created = executed.rows[1]?.result?.created?.id as string;
    expect(
      (await failure(h.services.issueQueries.detail(alice(), created))).code,
    ).toBe('NOT_FOUND');
    expect(await h.services.projects.list(alice())).toEqual([]);
    // An undone plan cannot be undone again.
    expect(
      (await failure(h.services.plans.undo(alice(), executed.id))).code,
    ).toBe('PLAN_NOT_OPEN');
    expect(
      (await failure(h.services.plans.previewUndo(alice(), executed.id))).code,
    ).toBe('PLAN_NOT_OPEN');
  });

  it('has nothing to undo when everything changed since', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    const executed = await executePlan(alice(), [
      {
        op: 'issue.update',
        params: { issue: issue.id, set: { priority: 'high' } },
      },
    ]);
    const now = await h.services.issueQueries.detail(alice(), issue.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: now.revision,
      priority: 'low',
    });
    const preview = await h.services.plans.previewUndo(alice(), executed.id);
    expect(preview.revert).toEqual([]);
    expect(preview.skipped).toEqual([
      expect.objectContaining({ position: 0, reason: 'changed' }),
    ]);
    const error = await failure(h.services.plans.undo(alice(), executed.id));
    expect(error.code).toBe('NOTHING_TO_UNDO');
  });

  it('may no longer undo after its time', async () => {
    const executed = await executePlan(alice(), [
      { op: 'issue.create', params: { title: 'A' } },
    ]);
    await h.database
      .connection()
      .repository('pmPlans')
      .updateOne({
        filter: { id: executed.id },
        values: {
          executedAt: new Date(Date.now() - 25 * 3600_000).toISOString(),
        },
      });
    expect(
      (await failure(h.services.plans.undo(alice(), executed.id))).code,
    ).toBe('UNDO_EXPIRED');
  });
});

describe('direct writes', () => {
  it('creates and executes at once as the asker via the agent, and stays undoable', async () => {
    const asker: Viewer = {
      ...alice(),
      actor: {
        type: 'user',
        id: 'alice',
        via: 'agent',
        trace: { agentId: 'pm', runId: 'run-9', conversationId: 'c9' },
      },
    };
    const done = await h.services.plans.create(
      asker,
      {
        title: 'Direct',
        source: { kind: 'conversation', key: 'conversation:c9' },
        rows: [{ op: 'issue.create', params: { title: 'Quick' } }],
      },
      { execute: true },
    );
    expect(done.status).toBe('executed');
    expect(done.proposer).toEqual({
      agentId: 'pm',
      runId: 'run-9',
      conversationId: 'c9',
    });
    const issueId = done.rows[0]?.result?.created?.id as string;
    const detail = await h.services.issueQueries.detail(alice(), issueId);
    expect(detail.activities[0]?.via).toMatchObject({
      type: 'agent',
      agentName: 'Agent pm',
      planId: done.id,
    });
    expect(done.undoableUntil).not.toBeNull();
  });
});

async function executePlan(
  viewer: Viewer,
  rows: readonly PlanRowInput[],
): Promise<Plan> {
  const created = await h.services.plans.create(
    viewer,
    plan(rows, { source: { kind: 'intake' } }),
  );
  const executed = await h.services.plans.execute(viewer, created.id, {
    revision: created.revision,
  });
  expect(executed.status).toBe('executed');
  return executed;
}
