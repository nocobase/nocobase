// @vitest-environment node
import { i18nToken } from '@nocobase/app-server/i18n';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import {
  createVisibilityFilter,
  startNotifications,
} from '../../server/providers/notifications.js';
import {
  projectsNoticesToken,
  type ProjectNotice,
  type ProjectsNotices,
} from '../../server/tokens.js';
import { createHarness, permissionsOf, type Harness } from '../harness.js';

let h: Harness;
let sent: ProjectNotice[];
let resolved: Parameters<ProjectsNotices['resolve']>[0][];
let stop: () => void;

/** An application that binds its own notices and translates keys as `key(values)`. */
function application(): AppPluginApplication {
  const services = new Map<unknown, unknown>([
    [
      projectsNoticesToken,
      {
        send: (notice: ProjectNotice) => {
          sent.push(notice);
          return Promise.resolve();
        },
        resolve: (ref: Parameters<ProjectsNotices['resolve']>[0]) => {
          resolved.push(ref);
          return Promise.resolve();
        },
      } satisfies ProjectsNotices,
    ],
    [
      i18nToken,
      {
        getDefaultLocale: () => 'en-US',
        ensureLocaleLoaded: () => Promise.resolve(),
        getFixedT:
          () =>
          (key: string, values: Record<string, unknown> = {}) =>
            `${key}(${Object.entries(values)
              .filter(([name]) => name !== 'defaultValue')
              .map(([name, value]) => `${name}=${String(value)}`)
              .join(',')})`,
      },
    ],
  ]);
  return {
    config: { get: () => undefined },
    container: {
      has: (token: unknown) => services.has(token),
      resolve: (token: unknown) => services.get(token),
    },
  } as unknown as AppPluginApplication;
}

beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'lead', 'alice']) await h.addUser(id, id);
  sent = [];
  resolved = [];
  stop = startNotifications(application(), h.services.events);
});
afterEach(async () => {
  stop();
  await h.close();
});

const admin = () => h.viewer('admin', 'admin');
const lead = () => h.viewer('lead');
const alice = () => h.viewer('alice');

async function moveTo(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  to: string,
) {
  const current = await h.services.issueQueries.detail(viewer, issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey: to,
  });
}

/** An issue of a project `lead` leads, in review, whose move to done waits for the project lead. */
async function heldIssue(): Promise<{ issue: Issue; requestId: string }> {
  const [workflow] = await h.services.workflows.list(admin());
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition: {
      ...workflow.definition,
      transitions: [
        ...workflow.definition.transitions,
        {
          from: 'in_review',
          to: 'done',
          actors: ['user'],
          approval: { approvers: ['projectLead'] },
        },
      ],
    },
  });
  const project = await h.services.projects.create(lead(), {
    name: 'Payments',
  });
  const created = await h.services.issues.create(alice(), {
    title: 'Retry callbacks',
    projectId: project.id,
  });
  const issue = await moveTo(alice(), created, 'in_review');
  const held = await moveTo(alice(), issue, 'done');
  return { issue, requestId: held.pendingApproval?.id ?? '' };
}

describe('notices', () => {
  it('asks the approvers to decide, then resolves the decision and tells whoever asked', async () => {
    const { issue, requestId } = await heldIssue();
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      key: `pm:approval-requested:${requestId}`,
      kind: 'decision',
      type: 'approval_requested',
      userIds: ['lead'],
      title: `notifications.approvalRequested(identifier=${issue.identifier},status=status.done())`,
      body: 'Retry callbacks',
      path: `/issues/${issue.identifier}`,
      issue: { id: issue.id, identifier: issue.identifier },
      approvalRequestId: requestId,
      params: {
        identifier: issue.identifier,
        status: 'done',
        statusName: 'Done',
      },
    });

    await h.services.approvals.approve(lead(), requestId, {
      comment: 'Ship it',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    expect(resolved).toEqual([
      { approvalRequestId: requestId, outcome: 'approved' },
    ]);
    expect(sent[1]).toMatchObject({
      kind: 'info',
      type: 'approval_decided',
      userIds: ['alice'],
      body: 'Ship it',
      approvalRequestId: requestId,
      params: { outcome: 'approved' },
    });
  });

  it('resolves a withdrawn request without telling anyone', async () => {
    const { requestId } = await heldIssue();
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    await h.services.approvals.withdraw(alice(), requestId);
    await vi.waitFor(() =>
      expect(resolved).toEqual([
        { approvalRequestId: requestId, outcome: 'withdrawn' },
      ]),
    );
    expect(sent).toHaveLength(1);
  });
});

describe('approval outcomes', () => {
  /** An approval request's outcome, as the approvals domain announces it. */
  const decided = (
    issue: Issue,
    overrides: Partial<{
      status: 'approved' | 'rejected' | 'withdrawn' | 'stale';
      requestedBy: { type: string; id: string };
      decidedById: string | null;
      staleReason: {
        code: string;
        message: string | null;
        attemptedById: string | null;
      } | null;
    }>,
  ) =>
    h.services.events.emit({
      type: 'approval.decided',
      requestId: 'r1',
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      status: 'approved',
      toStatus: 'done',
      toStatusName: 'Done',
      requestedBy: { type: 'agent', id: 'coder' },
      ownerUserId: issue.ownerUserId,
      approverUserIds: ['lead'],
      decidedById: 'lead',
      comment: null,
      staleReason: null,
      ...overrides,
    });

  it("tells the issue's owner the outcome of a request an agent made", async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Agent' });
    decided(issue, { status: 'rejected' });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      key: 'pm:approval-decided:r1',
      kind: 'info',
      type: 'approval_decided',
      userIds: ['alice'],
      params: { outcome: 'rejected', requestedByType: 'agent' },
    });
  });

  it('tells nobody when the owner decided the request an agent made', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Agent' });
    decided(issue, { decidedById: 'alice' });
    await vi.waitFor(() =>
      expect(resolved).toEqual([
        { approvalRequestId: 'r1', outcome: 'approved' },
      ]),
    );
    expect(sent).toHaveLength(0);
  });

  it('tells the approvers and the asker that an approved request no longer applies, but not who approved it', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Stale' });
    decided(issue, {
      status: 'stale',
      requestedBy: { type: 'user', id: 'alice' },
      decidedById: null,
      staleReason: {
        code: 'CHECKLIST_INCOMPLETE',
        message: 'Check the required items of in_review first: Tests.',
        attemptedById: 'lead',
      },
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      key: 'pm:approval-stale:r1',
      kind: 'info',
      type: 'approval_stale',
      userIds: ['alice'],
      body: 'Check the required items of in_review first: Tests.',
      params: {
        outcome: 'stale',
        code: 'CHECKLIST_INCOMPLETE',
        status: 'done',
      },
    });
  });

  it('tells nobody when a request went stale because the issue moved on', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Moved' });
    decided(issue, {
      status: 'stale',
      requestedBy: { type: 'user', id: 'alice' },
      decidedById: null,
    });
    await vi.waitFor(() =>
      expect(resolved).toEqual([{ approvalRequestId: 'r1', outcome: 'stale' }]),
    );
    expect(sent).toHaveLength(0);
  });

  it('carries why an approved request went stale', async () => {
    const [workflow] = await h.services.workflows.list(admin());
    await h.services.workflows.update(admin(), workflow.id, {
      revision: workflow.revision,
      definition: {
        states: workflow.definition.states.map((state) =>
          state.key === 'in_review'
            ? {
                ...state,
                rules: [
                  {
                    type: 'checklist',
                    config: {
                      items: [{ key: 'tests', label: 'Tests', required: true }],
                    },
                  },
                ],
              }
            : state,
        ),
        transitions: [
          ...workflow.definition.transitions,
          {
            from: 'in_review',
            to: 'done',
            actors: ['user'],
            approval: { approvers: ['projectLead'] },
          },
        ],
      },
    });
    const project = await h.services.projects.create(lead(), { name: 'P' });
    const created = await h.services.issues.create(alice(), {
      title: 'Checked',
      projectId: project.id,
    });
    const issue = await moveTo(alice(), created, 'in_review');
    await h.services.checklists.set(alice(), issue.id, 'in_review', 'tests', {
      checked: true,
    });
    const held = await moveTo(alice(), issue, 'done');
    await h.services.checklists.set(alice(), issue.id, 'in_review', 'tests', {
      checked: false,
    });
    await h.services.approvals.approve(
      lead(),
      held.pendingApproval?.id ?? '',
      {},
    );
    await vi.waitFor(() =>
      expect(sent.map((notice) => notice.type)).toContain('approval_stale'),
    );
    expect(
      sent.find((notice) => notice.type === 'approval_stale'),
    ).toMatchObject({
      userIds: ['alice'],
      params: { code: 'CHECKLIST_INCOMPLETE' },
    });
  });
});

describe('collaboration notices', () => {
  const bob = () => h.viewer('bob');
  const mention = (id: string) => `[@${id}](mention://user/${id})`;

  beforeEach(async () => {
    await h.addUser('bob', 'Bob');
    await h.addUser('carol', 'Carol');
  });

  it('tells followers of a comment and the people it mentions, never the author', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Callbacks',
    });
    await h.services.subscriptions.set(h.viewer('carol'), issue.id, true);
    const { comment } = await h.services.comments.create(bob(), issue.id, {
      content: `Ping ${mention('alice')} please`,
    });
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    const byType = Object.fromEntries(
      sent.map((notice) => [notice.type, notice]),
    );
    expect(byType.mentioned).toMatchObject({
      key: `pm:mentioned:comment:${comment.id}`,
      userIds: ['alice'],
      group: `mentioned:${issue.id}`,
      path: `/issues/${issue.identifier}?comment=${comment.id}`,
      body: 'Ping @alice please',
      params: { source: 'comment', commentId: comment.id, actorName: 'Bob' },
    });
    expect(byType.commented).toMatchObject({
      key: `pm:commented:${comment.id}`,
      userIds: ['carol'],
      title: `notifications.commented(identifier=${issue.identifier},actor=Bob)`,
    });
  });

  it('tells nobody of a note written by another kind', async () => {
    h.services.kinds.add({ key: 'bot' });
    const issue = await h.services.issues.create(alice(), { title: 'Bots' });
    await h.services.comments.post({ type: 'bot', id: 'b1' }, issue.id, {
      content: `/note ${mention('alice')}`,
    });
    await h.services.comments.post({ type: 'bot', id: 'b1' }, issue.id, {
      content: 'Done',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ type: 'commented', userIds: ['alice'] });
  });

  it('tells new owners, executors and followers of a status change by a person', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Handover',
      executor: { type: 'user', id: 'carol' },
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      type: 'executor_assigned',
      userIds: ['carol'],
    });
    const current = await h.services.issueQueries.detail(alice(), issue.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: current.revision,
      ownerUserId: 'bob',
      statusKey: 'in_progress',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(3));
    expect(
      sent.slice(1).map((notice) => [notice.type, notice.userIds]),
    ).toEqual([
      ['owner_assigned', ['bob']],
      ['status_changed', ['carol', 'bob']],
    ]);
    expect(sent[2]?.params).toMatchObject({
      from: 'todo',
      status: 'in_progress',
      statusName: 'In progress',
    });
  });

  it('lets a plugin rule join, and a decision beat a status change', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'Rules' });
    await h.services.subscriptions.set(bob(), issue.id, true);
    const stopRule = h.services.noticeRules.add(async ({ events }) =>
      events.some((event) => event.type === 'issue.updated')
        ? [
            {
              key: `test:decide:${issue.id}`,
              kind: 'decision',
              type: 'test_decision',
              issue: {
                id: issue.id,
                identifier: issue.identifier,
                title: issue.title,
              },
              userIds: ['bob'],
              actor: { type: 'user', id: 'alice', name: 'alice' },
              slot: 'change',
              params: { title: 'Decide', body: 'Please' },
            },
          ]
        : [],
    );
    const current = await h.services.issueQueries.detail(alice(), issue.id);
    await h.services.issues.update(alice(), issue.id, {
      revision: current.revision,
      statusKey: 'in_progress',
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({
      type: 'test_decision',
      kind: 'decision',
      userIds: ['bob'],
      title: 'Decide',
    });
    stopRule();
  });

  it('sends only to those who may see the issue', async () => {
    stop();
    stop = startNotifications(
      application(),
      h.services.events,
      createVisibilityFilter(
        {
          permissionsOfUser: (userId) =>
            Promise.resolve(
              permissionsOf(userId === 'carol' ? 'none' : 'member', userId),
            ),
        },
        () => h.database.connection(),
      ),
    );
    const issue = await h.services.issues.create(alice(), { title: 'Secret' });
    await h.services.comments.create(bob(), issue.id, {
      content: `${mention('carol')} ${mention('alice')}`,
    });
    await vi.waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ type: 'mentioned', userIds: ['alice'] });
  });
});
