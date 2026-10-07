// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import type { WorkflowDefinition } from '../../shared/workflows.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'lead', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const lead = () => h.viewer('lead');
const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

const RANGE = {
  from: new Date(Date.now() - 24 * 3600 * 1000),
  to: new Date(Date.now() + 24 * 3600 * 1000),
  agentKind: 'agent',
};

async function moveTo(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  statusKey: string,
): Promise<Issue> {
  const current = await h.services.issueQueries.detail(viewer, issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function giveToAgent(issueId: string, agentId: string): Promise<void> {
  await h.database
    .connection()
    .repository('pmIssues')
    .updateMany({
      filter: { id: issueId },
      values: { executorType: 'agent', executorId: agentId },
    });
}

describe('issue reports', () => {
  it('counts adoption, deliveries, review exits and decisions over the issues the viewer sees', async () => {
    const open = await h.services.projects.create(lead(), { name: 'Open' });
    const secret = await h.services.projects.create(lead(), {
      name: 'Secret',
      visibility: 'members',
    });
    // Delivered by an agent, through review.
    const shipped = await h.services.issues.create(alice(), {
      title: 'Ship it',
      projectId: open.id,
    });
    await h.services.comments.create(alice(), shipped.id, { content: 'Go' });
    await moveTo(alice(), shipped, 'in_review');
    await moveTo(alice(), shipped, 'done');
    await giveToAgent(shipped.id, 'ag-1');
    // Sent back from review, in the private project bob does not see.
    const reworked = await h.services.issues.create(lead(), {
      title: 'Rework it',
      projectId: secret.id,
    });
    await moveTo(lead(), reworked, 'in_review');
    await moveTo(lead(), reworked, 'in_progress');
    // Delivered by a person, with an approval on the way.
    const [workflow] = await h.services.workflows.list(admin());
    const definition: WorkflowDefinition = {
      states: workflow.definition.states,
      transitions: [
        ...workflow.definition.transitions,
        {
          from: 'in_review',
          to: 'done',
          actors: ['user'],
          approval: { approvers: ['projectLead'] },
        },
      ],
    };
    await h.services.workflows.update(admin(), workflow.id, {
      revision: workflow.revision,
      definition,
    });
    const approved = await h.services.issues.create(alice(), {
      title: 'Approve it',
      projectId: open.id,
    });
    await moveTo(alice(), approved, 'in_review');
    const held = await moveTo(alice(), approved, 'done');
    await h.services.approvals.approve(lead(), held.pendingApproval!.id, {});
    // Still waiting for a decision.
    const waiting = await h.services.issues.create(alice(), {
      title: 'Wait for it',
      projectId: open.id,
    });
    await moveTo(alice(), waiting, 'in_review');
    await moveTo(alice(), waiting, 'done');

    const all = await h.services.reports.report(admin(), RANGE);
    expect(all.adoption).toMatchObject({
      issuesCreated: 4,
      commentsCreated: 1,
      memberIds: ['alice', 'lead'],
    });
    expect(all.adoption.activityDays).toEqual([
      new Date().toISOString().slice(0, 10),
    ]);
    expect(all.aiShare).toMatchObject({
      deliveredTotal: 2,
      deliveredByAgent: 1,
      byAgent: { 'ag-1': 1 },
      daily: {
        [new Date().toISOString().slice(0, 10)]: { total: 2, byAgent: 1 },
      },
    });
    expect(all.aiShare.cycleMs).toHaveLength(2);
    expect(all.aiShare.cycleMs.every((ms) => ms >= 0)).toBe(true);

    // Work in progress now: the open statuses, in workflow order; done ones are left out.
    expect(await h.services.reports.wip(admin())).toEqual([
      {
        key: 'in_progress',
        name: 'In progress',
        category: 'started',
        count: 1,
      },
      { key: 'in_review', name: 'In review', category: 'started', count: 1 },
    ]);
    expect(await h.services.reports.wip(bob())).toEqual([
      { key: 'in_review', name: 'In review', category: 'started', count: 1 },
    ]);
    expect(all.trust).toEqual({
      reviewExits: 3,
      reviewPassed: 2,
      reworked: 1,
      approvalsApproved: 1,
      approvalsRejected: 0,
    });
    expect(all.decisions).toMatchObject({
      created: 2,
      resolved: 1,
      open: 1,
      byOutcome: { approved: 1 },
    });
    expect(all.decisions.resolveMs).toHaveLength(1);

    // Bob sees neither the private project's issue nor its review exit.
    const mine = await h.services.reports.report(bob(), RANGE);
    expect(mine.adoption.issuesCreated).toBe(3);
    expect(mine.trust).toMatchObject({ reviewExits: 2, reworked: 0 });

    // One project only.
    const secretOnly = await h.services.reports.report(admin(), {
      ...RANGE,
      projectId: secret.id,
    });
    expect(secretOnly.adoption.issuesCreated).toBe(1);
    expect(secretOnly.aiShare.deliveredTotal).toBe(0);

    // Nothing outside the range.
    const before = await h.services.reports.report(admin(), {
      ...RANGE,
      from: new Date('2020-01-01T00:00:00Z'),
      to: new Date('2020-01-02T00:00:00Z'),
    });
    expect(before.adoption.issuesCreated).toBe(0);
    expect(before.decisions.open).toBe(0);
  });

  it('names the work in progress as the workflow names its statuses', async () => {
    const [workflow] = await h.services.workflows.list(admin());
    await h.services.workflows.update(admin(), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'in_review' ? { ...state, name: 'Peer review' } : state,
        ),
      },
    });
    const issue = await h.services.issues.create(alice(), { title: 'Check' });
    await moveTo(alice(), issue, 'in_review');
    expect(await h.services.reports.wip(admin())).toEqual([
      { key: 'in_review', name: 'Peer review', category: 'started', count: 1 },
    ]);
  });

  it('describes issues with their project and whether the viewer sees them', async () => {
    const secret = await h.services.projects.create(lead(), {
      name: 'Secret',
      visibility: 'members',
    });
    const hidden = await h.services.issues.create(lead(), {
      title: 'Hidden',
      projectId: secret.id,
    });
    const loose = await h.services.issues.create(alice(), { title: 'Loose' });
    const facts = await h.services.reports.describe(bob(), [
      hidden.id,
      loose.id,
      'missing',
    ]);
    expect(facts.size).toBe(2);
    expect(facts.get(hidden.id)).toMatchObject({
      identifier: hidden.identifier,
      visible: false,
      project: { id: secret.id, name: 'Secret' },
    });
    expect(facts.get(loose.id)).toMatchObject({
      title: 'Loose',
      visible: true,
      project: null,
    });
  });
});

describe('issue flow, projects and attention', () => {
  const DAY = 24 * 3600 * 1000;
  const conn = () => h.database.connection();

  /** Dates the issue's status changes, oldest first, at these times. */
  async function backdate(issueId: string, times: readonly Date[]) {
    const rows = await conn()
      .repository<{ id: string }>('pmActivities')
      .findMany({
        filter: { issueId, action: 'status_changed' },
        sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
      });
    expect(rows).toHaveLength(times.length);
    for (const [index, row] of rows.entries())
      await conn()
        .repository('pmActivities')
        .updateMany({
          filter: { id: row.id },
          values: { createdAt: times[index] },
        });
  }

  it('lists completed issues with their cycle, work sent back and agents blocking', async () => {
    const now = Date.now();
    const open = await h.services.projects.create(lead(), { name: 'Open' });
    const secret = await h.services.projects.create(lead(), {
      name: 'Secret',
      visibility: 'members',
    });
    // Started three days ago, done yesterday, by an agent: a two-day cycle.
    let shipped = await h.services.issues.create(alice(), {
      title: 'Ship it',
      projectId: open.id,
    });
    for (const status of ['in_progress', 'in_review', 'done'])
      shipped = await moveTo(alice(), shipped, status);
    await giveToAgent(shipped.id, 'ag-1');
    await backdate(shipped.id, [
      new Date(now - 3 * DAY),
      new Date(now - 2 * DAY),
      new Date(now - DAY),
    ]);
    // Sent back from review once, then done, in the project bob does not see.
    let reworked = await h.services.issues.create(lead(), {
      title: 'Rework it',
      projectId: secret.id,
    });
    for (const status of [
      'in_progress',
      'in_review',
      'in_progress',
      'in_review',
      'done',
    ])
      reworked = await moveTo(lead(), reworked, status);
    // Done without being started: no cycle time.
    const quick = await h.services.issues.create(alice(), {
      title: 'Quick fix',
      projectId: open.id,
    });
    await moveTo(alice(), quick, 'done');
    // Reopened after done.
    let reopened = await h.services.issues.create(alice(), {
      title: 'Reopen it',
      projectId: open.id,
    });
    reopened = await moveTo(alice(), reopened, 'done');
    await moveTo(alice(), reopened, 'todo');
    // An agent asks the owner: its run moves the issue to blocked.
    const asked = await h.services.issues.create(alice(), {
      title: 'Ask me',
      projectId: open.id,
    });
    await giveToAgent(asked.id, 'ag-1');
    await conn()
      .repository('pmActivities')
      .createOne({
        values: {
          id: 'act-agent-block',
          issueId: asked.id,
          actorType: 'agent',
          actorId: 'ag-1',
          action: 'status_changed',
          details: { from: 'todo', to: 'blocked', trace: { runId: 'run-1' } },
          createdAt: new Date(),
        },
      });

    const range = { from: new Date(now - 7 * DAY), to: new Date(now + DAY) };
    const flow = await h.services.reports.flow(admin(), {
      ...range,
      agentKind: 'agent',
    });
    const completed = new Map(flow.completed.map((row) => [row.id, row]));
    expect([...completed.keys()].sort()).toEqual(
      [shipped.id, reworked.id, quick.id, reopened.id].sort(),
    );
    const ship = completed.get(shipped.id)!;
    expect(ship).toMatchObject({
      projectId: open.id,
      byAgent: true,
      executorId: 'ag-1',
    });
    expect(Date.parse(ship.doneAt) - Date.parse(ship.startedAt!)).toBe(2 * DAY);
    expect(completed.get(quick.id)?.startedAt).toBeNull();
    expect(completed.get(reworked.id)?.byAgent).toBe(false);
    expect(
      flow.returned.map((row) => [row.id, row.from, row.to]).sort(),
    ).toEqual(
      [
        [reworked.id, 'in_review', 'in_progress'],
        [reopened.id, 'done', 'todo'],
      ].sort(),
    );
    expect(flow.agentBlocks).toEqual([
      expect.objectContaining({
        issueId: asked.id,
        agentId: 'ag-1',
        runId: 'run-1',
      }),
    ]);

    // Bob sees neither the private project's completion nor its rework.
    const bobs = await h.services.reports.flow(bob(), {
      ...range,
      agentKind: 'agent',
    });
    expect(bobs.completed.map((row) => row.id)).not.toContain(reworked.id);
    expect(bobs.returned.map((row) => row.id)).toEqual([reopened.id]);
    // One project only.
    const secretOnly = await h.services.reports.flow(admin(), {
      ...range,
      projectId: secret.id,
      agentKind: 'agent',
    });
    expect(secretOnly.completed.map((row) => row.id)).toEqual([reworked.id]);
    // Before yesterday nothing was completed.
    const earlier = await h.services.reports.flow(admin(), {
      from: range.from,
      to: new Date(now - 1.5 * DAY),
      agentKind: 'agent',
    });
    expect(earlier.completed).toEqual([]);
  });

  it('counts each visible project’s issues, and lists blocked and overdue ones', async () => {
    const open = await h.services.projects.create(lead(), { name: 'Open' });
    const secret = await h.services.projects.create(lead(), {
      name: 'Secret',
      visibility: 'members',
    });
    const dropped = await h.services.projects.create(lead(), {
      name: 'Dropped',
    });
    await conn()
      .repository('pmProjects')
      .updateMany({
        filter: { id: dropped.id },
        values: { status: 'cancelled' },
      });
    const make = (title: string, projectId: string) =>
      h.services.issues.create(alice(), { title, projectId });
    const done = await make('Done', open.id);
    await moveTo(alice(), done, 'done');
    const blocked = await make('Blocked', open.id);
    await moveTo(alice(), blocked, 'blocked');
    const cancelled = await make('Cancelled', open.id);
    await moveTo(alice(), cancelled, 'cancelled');
    const late = await make('Late', open.id);
    const lateDone = await make('Late but done', open.id);
    await moveTo(alice(), lateDone, 'done');
    const later = await make('Later', open.id);
    const secretIssue = await h.services.issues.create(lead(), {
      title: 'Hidden late',
      projectId: secret.id,
    });
    const due = (id: string, dueDate: string) =>
      conn()
        .repository('pmIssues')
        .updateMany({ filter: { id }, values: { dueDate } });
    await due(late.id, '2026-10-01');
    await due(lateDone.id, '2026-10-01');
    await due(later.id, '2026-10-09');
    await due(secretIssue.id, '2026-09-30');

    expect(await h.services.reports.projects(admin())).toEqual([
      {
        id: open.id,
        name: 'Open',
        status: open.status,
        total: 5,
        done: 2,
        blocked: 1,
      },
      {
        id: secret.id,
        name: 'Secret',
        status: secret.status,
        total: 1,
        done: 0,
        blocked: 0,
      },
    ]);
    expect(
      (await h.services.reports.projects(bob())).map((row) => row.name),
    ).toEqual(['Open']);

    const attention = await h.services.reports.attention(admin(), {
      today: '2026-10-07',
      limit: 10,
    });
    expect(attention.blocked).toMatchObject({
      total: 1,
      items: [{ id: blocked.id, statusKey: 'blocked', projectId: open.id }],
    });
    expect(attention.overdue.total).toBe(2);
    expect(
      attention.overdue.items.map((row) => [row.title, row.dueDate]),
    ).toEqual([
      ['Hidden late', '2026-09-30'],
      ['Late', '2026-10-01'],
    ]);
    const bobs = await h.services.reports.attention(bob(), {
      today: '2026-10-07',
      limit: 1,
    });
    expect(bobs.overdue).toMatchObject({
      total: 1,
      items: [{ title: 'Late' }],
    });
  });
});
