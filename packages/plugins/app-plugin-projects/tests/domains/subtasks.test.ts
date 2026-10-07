// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CreateIssueRequest, Issue } from '../../shared/issues.js';
import type {
  WorkflowDefinition,
  WorkflowStatusRule,
} from '../../shared/workflows.js';
import type { DomainEvent } from '../../server/kernel/events.js';
import {
  batchDoneNotice,
  dependencyReleasedNotice,
} from '../../server/domains/subtasks/index.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
let released: DomainEvent<'issue.dependencyReleased'>[];
let batches: DomainEvent<'issue.batchDone'>[];
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'alice', 'bob']) await h.addUser(id, id);
  released = [];
  batches = [];
  h.services.events.on('issue.dependencyReleased', (event) => {
    released.push(event);
  });
  h.services.events.on('issue.batchDone', (event) => {
    batches.push(event);
  });
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

const create = (title: string, input: Partial<CreateIssueRequest> = {}) =>
  h.services.issues.create(admin(), { title, ...input });

async function moveTo(issue: Issue, statusKey: string, viewer = admin()) {
  const current = await h.services.issueQueries.detail(admin(), issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
  });
}

const detail = (issue: Issue, viewer = admin()) =>
  h.services.issueQueries.detail(viewer, issue.id);

const block = (issue: Issue, on: Issue, type?: 'blockedBy' | 'relatedTo') =>
  h.services.subtasks.addDependency(admin(), issue.id, {
    dependsOnIssueId: on.identifier,
    ...(type ? { type } : {}),
  });

async function actions(issueId: string): Promise<string[]> {
  const page = await h.services.issueQueries.activities(admin(), issueId, {});
  return page.data.map((activity) => activity.action);
}

async function editWorkflow(
  edit: (definition: WorkflowDefinition) => WorkflowDefinition,
) {
  const [workflow] = await h.services.workflows.list(admin());
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition: edit(workflow.definition),
  });
}

const withRules = (
  definition: WorkflowDefinition,
  rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>,
): WorkflowDefinition => ({
  ...definition,
  states: definition.states.map((state) =>
    rules[state.key] ? { ...state, rules: rules[state.key] } : state,
  ),
});

describe('dependencies', () => {
  it('links, shows both sides and counts what holds an issue', async () => {
    const a = await create('A');
    const b = await create('B');
    const link = await block(a, b);
    expect(link).toMatchObject({
      issueId: b.id,
      identifier: b.identifier,
      type: 'blockedBy',
      status: { key: 'todo' },
    });
    const left = await detail(a);
    expect(left.blockedBy.map((dep) => dep.identifier)).toEqual([b.identifier]);
    expect(left.blockers).toEqual([
      expect.objectContaining({ issueId: b.id, reason: 'dependency' }),
    ]);
    expect((await detail(b)).blocks.map((dep) => dep.identifier)).toEqual([
      a.identifier,
    ]);
    const page = await h.services.issueQueries.page(admin(), {});
    expect(page.data.find((row) => row.id === a.id)?.blockedCount).toBe(1);
    expect(await actions(a.id)).toContain('dependency_added');
  });

  it('refuses itself, duplicates, cycles and issues the viewer cannot see', async () => {
    const a = await create('A');
    const b = await create('B');
    const c = await create('C');
    await expect(block(a, a)).rejects.toMatchObject({
      code: 'INVALID_DEPENDENCY',
    });
    await block(a, b);
    await expect(block(a, b)).rejects.toMatchObject({
      code: 'DEPENDENCY_EXISTS',
    });
    await expect(block(b, a)).rejects.toMatchObject({
      code: 'DEPENDENCY_CYCLE',
    });
    await block(b, c);
    await expect(block(c, a)).rejects.toMatchObject({
      code: 'DEPENDENCY_CYCLE',
      details: {
        via: [c.identifier, a.identifier, b.identifier, c.identifier],
      },
    });
    // The refused link left nothing behind.
    expect((await detail(c)).blockedBy).toEqual([]);
    await expect(
      h.services.subtasks.addDependency(admin(), a.id, {
        dependsOnIssueId: 'PM-999',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_DEPENDENCY' });
  });

  it('needs edit on the issue', async () => {
    const a = await h.services.issues.create(alice(), { title: 'A' });
    const b = await h.services.issues.create(alice(), { title: 'B' });
    const reader = { ...bob(), permissions: { ...bob().permissions } };
    const scopes = { ...reader.permissions.scopes, 'pm.issues/edit': 'none' };
    await expect(
      h.services.subtasks.addDependency(
        { ...reader, permissions: { ...reader.permissions, scopes } } as never,
        a.id,
        { dependsOnIssueId: b.id },
      ),
    ).rejects.toMatchObject({ kind: 'forbidden' });
  });

  it('removes a link by id or by the other issue, and 404s an unknown one', async () => {
    const a = await create('A');
    const b = await create('B');
    const c = await create('C');
    const first = await block(a, b);
    await block(a, c);
    await h.services.subtasks.removeDependency(
      admin(),
      a.id,
      first.dependencyId,
    );
    await h.services.subtasks.removeDependencyTo(admin(), a.id, c.identifier);
    expect((await detail(a)).blockedBy).toEqual([]);
    expect(await actions(a.id)).toContain('dependency_removed');
    await expect(
      h.services.subtasks.removeDependency(admin(), a.id, first.dependencyId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('keeps relatedTo apart: it holds nothing and is not linked twice', async () => {
    const a = await create('A');
    const b = await create('B');
    await block(a, b, 'relatedTo');
    await expect(block(b, a, 'relatedTo')).rejects.toMatchObject({
      code: 'DEPENDENCY_EXISTS',
    });
    expect((await detail(a)).blockers).toEqual([]);
    expect((await detail(b)).relatedTo.map((dep) => dep.identifier)).toEqual([
      a.identifier,
    ]);
  });

  it('releases the issues waiting for one that finishes, and tells the right person', async () => {
    const blocker = await create('Blocker');
    const waiting = await create('Waiting', {
      executor: { type: 'user', id: 'bob' },
    });
    const other = await create('Other');
    await block(waiting, blocker);
    await block(waiting, other);
    await moveTo(blocker, 'done');
    expect(released).toEqual([]);
    await moveTo(other, 'cancelled');
    expect(released).toEqual([
      expect.objectContaining({
        issueId: waiting.id,
        releasedBy: expect.objectContaining({ issueId: other.id }),
      }),
    ]);
    const t = (key: string) => key;
    expect(dependencyReleasedNotice(released[0], t)?.userIds).toEqual(['bob']);
    // With nobody working on it, its owner hears it; nobody hears about their own action.
    expect(
      dependencyReleasedNotice(
        { ...released[0], executor: null, actor: { type: 'user', id: 'bob' } },
        t,
      )?.userIds,
    ).toEqual(['admin']);
    expect(
      dependencyReleasedNotice(
        { ...released[0], actor: { type: 'user', id: 'bob' } },
        t,
      ),
    ).toBeNull();
    expect(
      dependencyReleasedNotice(
        { ...released[0], executor: { type: 'robot', id: 'r1' } },
        t,
      ),
    ).toBeNull();
  });

  it('releases when the last link is removed or the blocker is deleted', async () => {
    const a = await create('A');
    const b = await create('B');
    const c = await create('C');
    const d = await create('D');
    const link = await block(a, b);
    await h.services.subtasks.removeDependency(
      admin(),
      a.id,
      link.dependencyId,
    );
    await block(c, d);
    await h.services.issues.remove(admin(), d.id);
    expect(released.map((event) => event.issueId)).toEqual([a.id, c.id]);
    expect((await detail(c)).blockers).toEqual([]);
  });

  it('calls the onBlocked hook only when a link leaves the issue held', async () => {
    const a = await create('A');
    const b = await create('B');
    expect(await detail(a)).toMatchObject({ blockers: [] });
    await moveTo(b, 'done');
    await block(a, b);
    expect((await detail(a)).blockers).toEqual([]);
  });
});

describe('a project’s setup issue', () => {
  it('holds every issue created in the project until it is finished, but not its own sub-issues', async () => {
    const project = await h.services.projects.create(admin(), {
      name: 'Shop',
    });
    const before = await create('Before', { projectId: project.id });
    const setup = await create('Initialize project', {
      projectId: project.id,
      projectSetup: true,
    });
    expect(
      (await h.services.projects.get(admin(), project.id)).setupIssueId,
    ).toBe(setup.id);
    // Only one setup at a time, and only by someone who manages the project.
    await expect(
      create('Again', { projectId: project.id, projectSetup: true }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT_SETUP' });
    await expect(
      h.services.issues.create(alice(), {
        title: 'Elsewhere',
        projectSetup: true,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PROJECT_SETUP' });
    const after = await create('After', { projectId: project.id });
    expect((await detail(after)).blockers).toEqual([
      expect.objectContaining({ issueId: setup.id, reason: 'dependency' }),
    ]);
    // Issues created earlier, the setup's own sub-issues and issues of other projects wait for nothing.
    expect((await detail(before)).blockers).toEqual([]);
    const part = await create('Part', { parentIssueId: setup.id });
    expect((await detail(part)).blockers).toEqual([]);
    expect((await detail(await create('Unrelated'))).blockers).toEqual([]);
    await moveTo(setup, 'done');
    expect(released.map((event) => event.issueId)).toEqual([after.id]);
    expect(
      (await detail(await create('Later', { projectId: project.id }))).blockers,
    ).toEqual([]);
  });
});

describe('sub-issues and stages', () => {
  it('lists sub-issues with their stage and orders them into batches', async () => {
    const parent = await create('Parent');
    const one = await create('One', { parentIssueId: parent.id, stage: 1 });
    const two = await create('Two', { parentIssueId: parent.id, stage: 2 });
    const free = await create('Free', { parentIssueId: parent.id });
    const view = await detail(parent);
    expect(
      view.subtasks.map((child) => [
        child.identifier,
        child.stage,
        child.blockedCount,
      ]),
    ).toEqual([
      [one.identifier, 1, 0],
      [two.identifier, 2, 1],
      [free.identifier, null, 0],
    ]);
    expect((await detail(two)).blockers).toEqual([
      expect.objectContaining({ issueId: one.id, reason: 'stage' }),
    ]);
    const page = await h.services.issueQueries.page(admin(), {});
    expect(page.data.find((row) => row.id === parent.id)?.subtaskCount).toBe(3);
  });

  it('gives a stage to sub-issues only, and clears it with the parent', async () => {
    const parent = await create('Parent');
    await expect(create('Top', { stage: 1 })).rejects.toMatchObject({
      code: 'INVALID_STAGE',
    });
    await expect(
      create('Big', { parentIssueId: parent.id, stage: 1001 }),
    ).rejects.toMatchObject({ code: 'INVALID_STAGE' });
    const child = await create('Child', { parentIssueId: parent.id, stage: 2 });
    const moved = await h.services.issues.update(admin(), child.id, {
      revision: child.revision,
      parentIssueId: null,
    });
    expect(moved.stage).toBeNull();
    expect(await actions(child.id)).toEqual(
      expect.arrayContaining(['parent_changed', 'stage_changed']),
    );
  });

  it('refuses waits against the stage order or on an ancestor, and rolls a bad move back', async () => {
    const parent = await create('Parent');
    const first = await create('First', { parentIssueId: parent.id, stage: 1 });
    const second = await create('Second', {
      parentIssueId: parent.id,
      stage: 2,
    });
    await expect(block(first, second)).rejects.toMatchObject({
      code: 'DEPENDENCY_CYCLE',
    });
    await expect(block(first, parent)).rejects.toMatchObject({
      code: 'DEPENDENCY_CYCLE',
    });
    const loose = await create('Loose', { parentIssueId: parent.id });
    await block(second, loose);
    // Second waits for Loose; putting Loose after Second's stage would make them wait for each other.
    await expect(
      h.services.issues.update(admin(), loose.id, {
        revision: loose.revision,
        stage: 3,
      }),
    ).rejects.toMatchObject({ code: 'DEPENDENCY_CYCLE' });
    expect((await detail(loose)).stage).toBeNull();
  });

  it('moves a stage across a sibling without a false cycle', async () => {
    const parent = await create('Parent');
    const moving = await create('Moving', {
      parentIssueId: parent.id,
      stage: 1,
    });
    await create('Middle', { parentIssueId: parent.id, stage: 2 });
    const updated = await h.services.issues.update(admin(), moving.id, {
      revision: moving.revision,
      stage: 3,
    });
    expect(updated.stage).toBe(3);
  });

  it('announces a finished stage, then all sub-issues once, and releases the next stage', async () => {
    const parent = await create('Parent');
    const a = await create('A', { parentIssueId: parent.id, stage: 1 });
    const b = await create('B', { parentIssueId: parent.id, stage: 1 });
    const c = await create('C', { parentIssueId: parent.id, stage: 2 });
    await moveTo(a, 'done');
    expect(batches).toEqual([]);
    expect(released).toEqual([]);
    await moveTo(b, 'cancelled');
    expect(batches.map((event) => [event.stage, event.all])).toEqual([
      [1, false],
    ]);
    expect(released.map((event) => event.issueId)).toEqual([c.id]);
    await moveTo(c, 'done');
    expect(batches.map((event) => [event.stage, event.all])).toEqual([
      [1, false],
      [null, true],
    ]);
    const bob = { type: 'user', id: 'bob' };
    expect(
      batchDoneNotice({ ...batches[1], actor: bob }, (key) => key),
    ).toMatchObject({
      type: 'batch_done',
      userIds: ['admin'],
      title: 'notifications.batchDone',
    });
    expect(
      batchDoneNotice({ ...batches[0], actor: bob }, (key) => key)?.params,
    ).toMatchObject({ stage: '1' });
    // The owner finished it: nobody is told.
    expect(batchDoneNotice(batches[1], (key) => key)).toBeNull();
  });
});

describe('the workflow reacts to sub-issues', () => {
  const autoMove = (definition: WorkflowDefinition): WorkflowDefinition => ({
    ...definition,
    transitions: [
      ...definition.transitions,
      {
        from: 'in_progress',
        to: 'in_review',
        actors: ['system'],
        on: 'subtasks.done',
      },
    ],
  });

  it('moves the parent on subtasks.done, up the tree', async () => {
    await editWorkflow((definition) => ({
      ...autoMove(definition),
      transitions: [
        ...autoMove(definition).transitions,
        {
          from: 'in_review',
          to: 'done',
          actors: ['system'],
          on: 'subtasks.done',
        },
      ],
    }));
    const top = await create('Top');
    const middle = await create('Middle', { parentIssueId: top.id });
    const leaf = await create('Leaf', { parentIssueId: middle.id });
    await moveTo(top, 'in_review');
    await moveTo(middle, 'in_progress');
    await moveTo(leaf, 'done');
    expect((await detail(middle)).statusKey).toBe('in_review');
    // Middle is not finished: its parent stays.
    expect((await detail(top)).statusKey).toBe('in_review');
    const view = await detail(middle);
    expect(
      view.activities.find(
        (activity) =>
          activity.action === 'status_changed' &&
          activity.actorType === 'system',
      )?.details,
    ).toMatchObject({ event: 'subtasks.done', causeIssueId: leaf.id });
  });

  it('records a refused move and keeps the sub-issue moved', async () => {
    await editWorkflow((definition) =>
      withRules(autoMove(definition), {
        in_progress: [
          {
            type: 'checklist',
            config: { items: [{ key: 'qa', label: 'QA', required: true }] },
          },
        ],
      }),
    );
    const parent = await create('Parent');
    const child = await create('Child', { parentIssueId: parent.id });
    await moveTo(parent, 'in_progress');
    await moveTo(child, 'done');
    expect((await detail(child)).statusKey).toBe('done');
    expect((await detail(parent)).statusKey).toBe('in_progress');
    expect(await actions(parent.id)).toContain('auto_move_skipped');
  });

  it('leaves the default workflow without an automatic move', async () => {
    const parent = await create('Parent');
    const child = await create('Child', { parentIssueId: parent.id });
    await moveTo(parent, 'in_progress');
    await moveTo(child, 'done');
    expect((await detail(parent)).statusKey).toBe('in_progress');
  });

  it('subtasksDone waits for open sub-issues except into a closed status', async () => {
    await editWorkflow((definition) =>
      withRules(definition, {
        done: [{ type: 'subtasksDone' }],
        cancelled: [{ type: 'subtasksDone' }],
      }),
    );
    const parent = await create('Parent');
    const child = await create('Child', { parentIssueId: parent.id });
    await expect(moveTo(parent, 'done')).rejects.toMatchObject({
      code: 'SUBTASKS_OPEN',
      details: { count: 1, issues: [child.identifier] },
    });
    await moveTo(child, 'done');
    await moveTo(parent, 'done');
    const other = await create('Other');
    await create('Open', { parentIssueId: other.id });
    await moveTo(other, 'cancelled');
  });

  it('blockersDone waits while the issue is held', async () => {
    await editWorkflow((definition) =>
      withRules(definition, { in_progress: [{ type: 'blockersDone' }] }),
    );
    const a = await create('A');
    const b = await create('B');
    await block(a, b);
    await expect(moveTo(a, 'in_progress')).rejects.toMatchObject({
      code: 'ISSUE_BLOCKED',
    });
    await moveTo(b, 'done');
    await moveTo(a, 'in_progress');
  });

  it('keeps event transitions to the system', async () => {
    await expect(
      editWorkflow((definition) => ({
        ...definition,
        transitions: [
          ...definition.transitions,
          {
            from: 'in_progress',
            to: 'in_review',
            actors: ['user'],
            on: 'subtasks.done',
          },
        ],
      })),
    ).rejects.toMatchObject({ code: 'INVALID_WORKFLOW' });
  });
});
