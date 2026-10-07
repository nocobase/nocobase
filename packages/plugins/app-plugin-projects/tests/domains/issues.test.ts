// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['admin', 'lead', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const admin = () => h.viewer('admin', 'admin');

describe('creating issues', () => {
  it('starts in todo, owned by the creator', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: '  Fix login  ',
    });
    expect(issue).toMatchObject({
      identifier: 'PM-1',
      title: 'Fix login',
      description: '',
      statusKey: 'todo',
      priority: 'none',
      ownerUserId: 'alice',
      executor: null,
      revision: 1,
      createdById: 'alice',
    });
  });

  it('always has an owner', async () => {
    await expect(
      h.services.issues.create(alice(), { title: 'X', ownerUserId: '' }),
    ).rejects.toMatchObject({ code: 'OWNER_REQUIRED' });
    await expect(
      h.services.issues.create(alice(), { title: 'X', ownerUserId: 'nobody' }),
    ).rejects.toMatchObject({ code: 'INVALID_OWNER' });
  });

  it('cannot be created done or closed', async () => {
    for (const statusKey of ['done', 'cancelled'])
      await expect(
        h.services.issues.create(alice(), { title: 'X', statusKey }),
      ).rejects.toMatchObject({ code: 'INVALID_STATUS' });
    await expect(
      h.services.issues.create(alice(), { title: 'X', statusKey: 'backlog' }),
    ).resolves.toMatchObject({ statusKey: 'backlog' });
  });

  it('inherits the parent project and records the sub-issue on the parent', async () => {
    const project = await h.services.projects.create(alice(), { name: 'P' });
    const parent = await h.services.issues.create(alice(), {
      title: 'Parent',
      projectId: project.id,
    });
    const child = await h.services.issues.create(alice(), {
      title: 'Child',
      parentIssueId: parent.id,
    });
    expect(child.projectId).toBe(project.id);
    const detail = await h.services.issueQueries.detail(alice(), parent.id);
    expect(detail.activities.map((activity) => activity.action)).toEqual([
      'issue_created',
      'subtask_added',
    ]);
  });

  it('needs pm.issues create, which edit does not imply', async () => {
    await expect(
      h.services.issues.create(h.viewer('bob', 'none'), { title: 'X' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    const editor = h.viewer('bob');
    const withoutCreate = {
      ...editor,
      permissions: {
        ...editor.permissions,
        scopes: {
          ...editor.permissions.scopes,
          'pm.issues/create': 'none' as const,
        },
      },
    };
    await expect(
      h.services.issues.create(withoutCreate, { title: 'X' }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('creates into projects the creator sees, or any project with create on every record', async () => {
    const open = await h.services.projects.create(h.viewer('lead'), {
      name: 'Open',
    });
    const secret = await h.services.projects.create(h.viewer('lead'), {
      name: 'Secret',
      visibility: 'members',
    });
    await expect(
      h.services.issues.create(alice(), { title: 'A', projectId: open.id }),
    ).resolves.toMatchObject({ projectId: open.id });
    await expect(
      h.services.issues.create(alice(), { title: 'B', projectId: secret.id }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT' });
    const creator = alice();
    const everywhere = {
      ...creator,
      permissions: {
        ...creator.permissions,
        scopes: {
          ...creator.permissions.scopes,
          'pm.issues/create': 'all' as const,
        },
      },
    };
    await expect(
      h.services.issues.create(everywhere, {
        title: 'C',
        projectId: secret.id,
      }),
    ).resolves.toMatchObject({ projectId: secret.id });
  });

  it('refuses agent executors until agents exist', async () => {
    await expect(
      h.services.issues.create(alice(), {
        title: 'X',
        executor: { type: 'agent', id: 'agent-1' },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EXECUTOR' });
  });
});

describe('updating issues', () => {
  it('writes only against the revision it read', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    const updated = await h.services.issues.update(alice(), issue.id, {
      revision: 1,
      title: 'B',
      priority: 'high',
    });
    expect(updated).toMatchObject({
      title: 'B',
      priority: 'high',
      revision: 2,
    });
    await expect(
      h.services.issues.update(alice(), issue.id, { revision: 1, title: 'C' }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    await expect(
      h.services.issues.update(alice(), issue.id, { title: 'C' } as never),
    ).rejects.toMatchObject({ code: 'REVISION_REQUIRED' });
  });

  it('records one activity per changed field', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await h.services.issues.update(alice(), issue.id, {
      revision: 1,
      title: 'B',
      dueDate: '2026-10-01',
      description: 'More',
    });
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.activities.map((activity) => activity.action)).toEqual([
      'issue_created',
      'title_changed',
      'description_changed',
      'due_date_changed',
    ]);
    expect(detail.activities[1]).toMatchObject({
      actorName: 'alice',
      details: { from: 'A', to: 'B' },
    });
  });

  it('lets only the owner, the project lead or an administrator close an issue', async () => {
    const project = await h.services.projects.create(h.viewer('lead'), {
      name: 'P',
    });
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: project.id,
    });
    await expect(
      h.services.issues.update(h.viewer('bob'), issue.id, {
        revision: 1,
        statusKey: 'done',
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.issues.update(h.viewer('lead'), issue.id, {
        revision: 1,
        statusKey: 'done',
      }),
    ).resolves.toMatchObject({ statusKey: 'done' });
  });

  it('lets only the owner, the project lead or an administrator change the owner', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await expect(
      h.services.issues.update(h.viewer('bob'), issue.id, {
        revision: 1,
        ownerUserId: 'bob',
      }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: 1,
        ownerUserId: '',
      }),
    ).rejects.toMatchObject({ code: 'OWNER_REQUIRED' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: 1,
        ownerUserId: 'bob',
      }),
    ).resolves.toMatchObject({ ownerUserId: 'bob' });
  });

  it('refuses a parent that would make a cycle', async () => {
    const a = await h.services.issues.create(alice(), { title: 'A' });
    const b = await h.services.issues.create(alice(), {
      title: 'B',
      parentIssueId: a.id,
    });
    await expect(
      h.services.issues.update(alice(), a.id, {
        revision: a.revision,
        parentIssueId: b.id,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PARENT' });
  });

  it('replaces the labels as a set', async () => {
    const [x, y] = [
      await h.services.labels.create(admin(), { name: 'x' }),
      await h.services.labels.create(admin(), { name: 'y' }),
    ];
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      labelIds: [x!.id],
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: 1,
      labelIds: [y!.id],
    });
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.labels.map((label) => label.name)).toEqual(['y']);
    expect(detail.activities.at(-1)).toMatchObject({
      action: 'labels_changed',
      details: { added: [y!.id], removed: [x!.id] },
    });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: 2,
        labelIds: ['nope'],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_LABEL' });
  });
});

describe('visibility', () => {
  it('hides the issues of a private project from those who did not join it', async () => {
    const secret = await h.services.projects.create(h.viewer('lead'), {
      name: 'Secret',
      visibility: 'members',
    });
    const hidden = await h.services.issues.create(h.viewer('lead'), {
      title: 'Hidden',
      projectId: secret.id,
    });
    await h.services.issues.create(h.viewer('lead'), { title: 'Open' });
    const titles = async (
      userId: string,
      role: 'admin' | 'member' = 'member',
    ) =>
      (await h.services.issueQueries.page(h.viewer(userId, role), {})).data.map(
        (issue) => issue.title,
      );
    expect(await titles('alice')).toEqual(['Open']);
    expect(await titles('lead')).toEqual(['Open', 'Hidden']);
    expect(await titles('admin', 'admin')).toEqual(['Open', 'Hidden']);
    await expect(
      h.services.issueQueries.detail(alice(), hidden.id),
    ).rejects.toMatchObject({
      kind: 'notFound',
    });
    await expect(
      h.services.issueQueries.detail(alice(), hidden.identifier.toLowerCase()),
    ).rejects.toMatchObject({ kind: 'notFound' });
    await expect(
      h.services.issueQueries.detail(
        h.viewer('lead'),
        hidden.identifier.toLowerCase(),
      ),
    ).resolves.toMatchObject({ id: hidden.id });
  });

  it('shows nothing without pm.issues view', async () => {
    await h.services.issues.create(alice(), { title: 'A' });
    expect(
      (await h.services.issueQueries.page(h.viewer('bob', 'none'), {})).data,
    ).toEqual([]);
  });
});

describe('deleting issues', () => {
  it('is for administrators, and keeps the issue restorable', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await expect(
      h.services.issues.remove(alice(), issue.id),
    ).rejects.toMatchObject({
      kind: 'forbidden',
    });
    await h.services.issues.remove(admin(), issue.id);
    expect((await h.services.issueQueries.page(admin(), {})).data).toEqual([]);
    await expect(
      h.services.issueQueries.detail(admin(), issue.id),
    ).rejects.toMatchObject({
      kind: 'notFound',
    });
    expect(
      (await h.services.issueQueries.page(admin(), { deleted: true })).data.map(
        (i) => i.id,
      ),
    ).toEqual([issue.id]);
    await expect(
      h.services.issueQueries.page(alice(), { deleted: true }),
    ).rejects.toMatchObject({ kind: 'forbidden' });
    await h.services.issues.restore(admin(), issue.id);
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.activities.map((activity) => activity.action)).toEqual([
      'issue_created',
      'issue_deleted',
      'issue_restored',
    ]);
  });
});

describe('lists and the board', () => {
  it('pages newest first and filters', async () => {
    const x = await h.services.labels.create(admin(), { name: 'x' });
    for (let i = 1; i <= 5; i += 1)
      await h.services.issues.create(alice(), {
        title: `Issue ${i}`,
        ...(i % 2 === 0 ? { labelIds: [x.id], ownerUserId: 'bob' } : {}),
      });
    const first = await h.services.issueQueries.page(alice(), {
      limit: 2,
      sort: 'created',
    });
    expect(first.data.map((issue) => issue.title)).toEqual([
      'Issue 5',
      'Issue 4',
    ]);
    const second = await h.services.issueQueries.page(alice(), {
      limit: 2,
      sort: 'created',
      cursor: first.nextCursor ?? undefined,
    });
    expect(second.data.map((issue) => issue.title)).toEqual([
      'Issue 3',
      'Issue 2',
    ]);
    const labelled = await h.services.issueQueries.page(alice(), {
      labelId: x.id,
    });
    expect(labelled.data.map((issue) => issue.title).sort()).toEqual([
      'Issue 2',
      'Issue 4',
    ]);
    expect(labelled.data[0]).toMatchObject({
      owner: { id: 'bob', name: 'bob' },
      labels: [expect.objectContaining({ name: 'x' })],
    });
    const found = await h.services.issueQueries.page(alice(), { q: 'pm-3' });
    expect(found.data.map((issue) => issue.identifier)).toEqual(['PM-3']);
  });

  it('puts every status of the workflow in a column', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await h.services.issues.create(alice(), {
      title: 'B',
      statusKey: 'backlog',
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: 1,
      statusKey: 'in_progress',
    });
    const board = await h.services.issueQueries.board(alice(), {});
    expect(board.columns.map((column) => column.status.key)).toEqual([
      'backlog',
      'todo',
      'analysis',
      'proposal_review',
      'in_progress',
      'in_review',
      'blocked',
      'done',
      'cancelled',
    ]);
    const titles = Object.fromEntries(
      board.columns.map((column) => [
        column.status.key,
        column.issues.map((i) => i.title),
      ]),
    );
    expect(titles).toMatchObject({
      backlog: ['B'],
      todo: [],
      in_progress: ['A'],
    });
  });

  it('pages older activities', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    for (let i = 1; i <= 3; i += 1)
      await h.services.issues.update(alice(), issue.id, {
        revision: i,
        title: `T${i}`,
      });
    const newest = await h.services.issueQueries.activities(alice(), issue.id, {
      limit: 2,
    });
    expect(newest.data.map((activity) => activity.details.to)).toEqual([
      'T2',
      'T3',
    ]);
    const older = await h.services.issueQueries.activities(alice(), issue.id, {
      limit: 2,
      cursor: newest.nextCursor ?? undefined,
    });
    expect(older.data.map((activity) => activity.action)).toEqual([
      'issue_created',
      'title_changed',
    ]);
    expect(older.nextCursor).toBeNull();
  });
});

describe('moving between projects', () => {
  it('needs a status the new project has', async () => {
    const admin = h.viewer('admin', 'admin');
    // No workflow is the default: the plain project has the built-in statuses.
    const qa = await h.services.workflows.create(admin, {
      name: 'With QA',
      copyFrom: null,
    });
    await h.services.workflows.update(admin, qa.id, {
      revision: qa.revision,
      definition: {
        ...qa.definition,
        states: [
          ...qa.definition.states,
          { key: 'qa', name: 'QA', category: 'started', color: 'blue' },
        ],
      },
    });
    const withQa = await h.services.projects.create(alice(), { name: 'QA' });
    await h.services.projects.update(admin, withQa.id, { workflowId: qa.id });
    const plain = await h.services.projects.create(alice(), { name: 'P' });
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      projectId: withQa.id,
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: 1,
      statusKey: 'qa',
    });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: 2,
        projectId: plain.id,
      }),
    ).rejects.toMatchObject({ code: 'STATUS_REQUIRED' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: 2,
        projectId: plain.id,
        statusKey: 'todo',
      }),
    ).resolves.toMatchObject({ projectId: plain.id, statusKey: 'todo' });
  });
});

describe('statuses', () => {
  it('lists the workflow of a visible project, and hides a private one', async () => {
    const statuses = await h.services.issueQueries.statuses(
      h.viewer('alice'),
      null,
    );
    expect(statuses.map((status) => status.key)).toContain('todo');
    const secret = await h.services.projects.create(h.viewer('bob'), {
      name: 'Secret',
      visibility: 'members',
    });
    await expect(
      h.services.issueQueries.statuses(h.viewer('alice'), secret.id),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('sorting', () => {
  it('orders by number either way and pages through with the cursor', async () => {
    const admin = h.viewer('admin', 'admin');
    for (const title of ['A', 'B', 'C'])
      await h.services.issues.create(admin, { title });
    const identifiers = async (direction: 'asc' | 'desc') => {
      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await h.services.issueQueries.page(admin, {
          sort: 'number',
          direction,
          limit: 2,
          ...(cursor ? { cursor } : {}),
        });
        seen.push(...page.data.map((issue) => issue.identifier));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      return seen;
    };
    expect(await identifiers('asc')).toEqual(['PM-1', 'PM-2', 'PM-3']);
    expect(await identifiers('desc')).toEqual(['PM-3', 'PM-2', 'PM-1']);
  });

  it('orders by priority, the most urgent first, across pages', async () => {
    const admin = h.viewer('admin', 'admin');
    for (const priority of ['low', 'urgent', 'none', 'high', 'medium'] as const)
      await h.services.issues.create(admin, { title: priority, priority });
    const order = async (direction: 'asc' | 'desc') => {
      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await h.services.issueQueries.page(admin, {
          sort: 'priority',
          direction,
          limit: 2,
          ...(cursor ? { cursor } : {}),
        });
        seen.push(...page.data.map((issue) => issue.priority));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      return seen;
    };
    expect(await order('desc')).toEqual([
      'urgent',
      'high',
      'medium',
      'low',
      'none',
    ]);
    expect(await order('asc')).toEqual([
      'none',
      'low',
      'medium',
      'high',
      'urgent',
    ]);
    const [first] = (await h.services.issueQueries.page(admin, {})).data;
    expect(first).not.toHaveProperty('priorityRank');
  });
});
