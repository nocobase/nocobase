// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import type {
  ApproverRole,
  WorkflowDefinition,
  WorkflowStatusRule,
} from '../../shared/workflows.js';
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

/** Moving from in_review to done needs `approvers`; `rules` go on in_review. */
async function needApproval(
  approvers: readonly ApproverRole[],
  rules?: readonly WorkflowStatusRule[],
): Promise<void> {
  const [workflow] = await h.services.workflows.list(admin());
  const definition: WorkflowDefinition = {
    states: workflow.definition.states.map((state) =>
      state.key === 'in_review' && rules ? { ...state, rules } : state,
    ),
    transitions: [
      ...workflow.definition.transitions,
      {
        from: 'in_review',
        to: 'done',
        actors: ['user'],
        approval: { approvers },
      },
    ],
  };
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition,
  });
}

async function issueInReview(projectLead = true): Promise<Issue> {
  const project = projectLead
    ? await h.services.projects.create(lead(), { name: 'Payments' })
    : null;
  const issue = await h.services.issues.create(alice(), {
    title: 'Retry callbacks',
    ...(project ? { projectId: project.id } : {}),
  });
  return moveTo(alice(), issue, 'in_review');
}

async function moveTo(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  statusKey: string,
) {
  const current = await h.services.issueQueries.detail(viewer, issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function actions(issueId: string): Promise<string[]> {
  const page = await h.services.issueQueries.activities(admin(), issueId, {});
  return page.data.map((activity) => activity.action);
}

describe('approvals', () => {
  it('holds a status change until an approver approves it, then moves the issue', async () => {
    await needApproval(['projectLead']);
    const issue = await issueInReview();

    const held = await moveTo(alice(), issue, 'done');
    expect(held).toMatchObject({
      statusKey: 'in_review',
      pendingApproval: {
        fromStatus: 'in_review',
        toStatus: 'done',
        requestedById: 'alice',
        requestedByName: 'alice',
        approvers: ['projectLead'],
        approverUserIds: ['lead'],
        approverNames: ['lead'],
        status: 'pending',
        issueIdentifier: issue.identifier,
      },
    });
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.pendingApproval?.id).toBe(held.pendingApproval?.id);
    await expect(moveTo(alice(), issue, 'done')).rejects.toMatchObject({
      code: 'APPROVAL_PENDING',
    });
    expect(await h.services.approvals.mine(lead())).toHaveLength(1);
    expect(await h.services.approvals.mine(bob())).toEqual([]);

    const id = held.pendingApproval?.id ?? '';
    await expect(
      h.services.approvals.approve(bob(), id, {}),
    ).rejects.toMatchObject({ kind: 'forbidden', code: 'NOT_APPROVER' });
    await expect(
      h.services.approvals.approve(lead(), id, { comment: ' Ship it ' }),
    ).resolves.toMatchObject({
      status: 'approved',
      decidedById: 'lead',
      decidedByName: 'lead',
      comment: 'Ship it',
    });
    const after = await h.services.issueQueries.detail(alice(), issue.id);
    expect(after).toMatchObject({ statusKey: 'done', pendingApproval: null });
    const moved = after.activities.find(
      (activity) =>
        activity.action === 'status_changed' && activity.details.to === 'done',
    );
    expect(moved).toMatchObject({
      actorType: 'system',
      details: { approvedById: 'lead', requestId: id },
    });
    expect(await actions(issue.id)).toEqual(
      expect.arrayContaining(['approval_requested', 'approval_approved']),
    );
    await expect(
      h.services.approvals.approve(lead(), id, {}),
    ).rejects.toMatchObject({ code: 'APPROVAL_DECIDED' });
  });

  it('lets an approver move the issue at once, and anyone when nobody can approve', async () => {
    await needApproval(['projectLead']);
    const issue = await issueInReview();
    await expect(moveTo(lead(), issue, 'done')).resolves.toMatchObject({
      statusKey: 'done',
    });
    expect(await actions(issue.id)).toContain('approval_self');

    const loose = await issueInReview(false);
    await expect(moveTo(alice(), loose, 'done')).resolves.toMatchObject({
      statusKey: 'done',
    });
    expect(await actions(loose.id)).toContain('approval_no_approver');
  });

  it('asks the administrators the application reports', async () => {
    h.admins.push('admin');
    await needApproval(['admin']);
    const issue = await issueInReview();
    const held = await moveTo(alice(), issue, 'done');
    expect(held.pendingApproval?.approverUserIds).toEqual(['admin']);
  });

  it('keeps the status when rejected or withdrawn', async () => {
    await needApproval(['projectLead']);
    const issue = await issueInReview();
    const first = await moveTo(alice(), issue, 'done');
    await expect(
      h.services.approvals.reject(lead(), first.pendingApproval?.id ?? '', {
        comment: 'Not yet',
      }),
    ).resolves.toMatchObject({ status: 'rejected', comment: 'Not yet' });

    const second = await moveTo(alice(), issue, 'done');
    const id = second.pendingApproval?.id ?? '';
    await expect(
      h.services.approvals.withdraw(bob(), id),
    ).rejects.toMatchObject({ code: 'NOT_REQUESTER' });
    await expect(
      h.services.approvals.withdraw(alice(), id),
    ).resolves.toMatchObject({ status: 'withdrawn' });
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.statusKey).toBe('in_review');
    // The issue page lists the decided requests, the most recent first.
    expect(
      detail.recentApprovals.map((request) => [
        request.status,
        request.comment,
      ]),
    ).toEqual([
      ['withdrawn', null],
      ['rejected', 'Not yet'],
    ]);
    expect(detail.pendingApproval).toBeNull();
  });

  it('goes stale when the issue leaves the status some other way', async () => {
    await needApproval(['projectLead']);
    const issue = await issueInReview();
    const held = await moveTo(alice(), issue, 'done');
    await moveTo(alice(), issue, 'in_progress');
    await expect(
      h.services.approvals.approve(lead(), held.pendingApproval?.id ?? '', {}),
    ).rejects.toMatchObject({ code: 'APPROVAL_DECIDED' });
    expect(await actions(issue.id)).toContain('approval_stale');
  });

  it('goes stale when the move no longer passes its checks at approval', async () => {
    await needApproval(
      ['projectLead'],
      [
        {
          type: 'checklist',
          config: { items: [{ key: 'tests', label: 'Tests', required: true }] },
        },
      ],
    );
    const issue = await issueInReview();
    await h.services.checklists.set(alice(), issue.id, 'in_review', 'tests', {
      checked: true,
    });
    const held = await moveTo(alice(), issue, 'done');
    await h.services.checklists.set(bob(), issue.id, 'in_review', 'tests', {
      checked: false,
    });
    await expect(
      h.services.approvals.approve(lead(), held.pendingApproval?.id ?? '', {}),
    ).resolves.toMatchObject({ status: 'stale' });
    expect(
      (await h.services.issueQueries.detail(alice(), issue.id)).statusKey,
    ).toBe('in_review');
  });

  it('only names registered approvers in a workflow', async () => {
    const [workflow] = await h.services.workflows.list(admin());
    await expect(
      h.services.workflows.update(admin(), workflow.id, {
        revision: workflow.revision,
        definition: {
          ...workflow.definition,
          transitions: [
            ...workflow.definition.transitions,
            {
              from: 'in_review',
              to: 'done',
              actors: ['user'],
              approval: { approvers: ['boss' as ApproverRole] },
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_WORKFLOW',
      details: {
        issues: [
          expect.objectContaining({
            path: `transitions[${workflow.definition.transitions.length}].approval.approvers[0]`,
          }),
        ],
      },
    });
  });
});
