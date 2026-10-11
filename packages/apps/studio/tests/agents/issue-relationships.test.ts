// @vitest-environment node
import { setTimeout as delay } from 'node:timers/promises';

import type {
  CreateIssueRequest,
  Issue,
  IssueDetail,
} from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
});
afterEach(() => h.close());

function api() {
  const request = async (method: string, path: string, body?: unknown) => {
    const result = await h.request(method, path, { user: 'alice', body });
    if (result.status >= 400) throw new Error(result.body.error.reason);
    return result.body?.data;
  };
  return {
    createIssue: (input: CreateIssueRequest): Promise<Issue> =>
      request('POST', '/projects/issues', input),
    issue: (id: string): Promise<IssueDetail> =>
      request('GET', `/projects/issues/${id}`),
    addDependency: (
      id: string,
      input: { dependsOnIssueId: string; type?: 'blockedBy' | 'relatedTo' },
    ) => request('POST', `/projects/issues/${id}/dependencies`, input),
    updateDependency: (
      id: string,
      link: string,
      input: {
        type: 'blockedBy' | 'relatedTo';
        expectedType: 'blockedBy' | 'relatedTo';
      },
    ) => request('PATCH', `/projects/issues/${id}/dependencies/${link}`, input),
    removeDependency: async (id: string, link: string) => {
      await request('DELETE', `/projects/issues/${id}/dependencies/${link}`);
    },
  };
}

it.each(['done', 'cancelled', 'approval', 'event batch', 'parent'] as const)(
  'does not lose the last release when conversion overlaps %s',
  async (operation) => {
    h.roles.set('alice', 'admin');
    await h.addUser('bob');
    const client = api();
    const workflow = await h.projects.workflows.create(h.viewer('alice'), {
      name: 'Concurrent releases',
      copyFrom: null,
    });
    h.projects.workflowEvents.types.add({ key: 'test.finished' });
    await h.projects.workflows.update(h.viewer('alice'), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        transitions: [
          { from: '*', to: '*', actors: ['user'] },
          {
            from: 'todo',
            to: 'done',
            actors: ['system'],
            on: operation === 'parent' ? 'subtasks.done' : 'test.finished',
          },
          ...(operation === 'approval'
            ? [
                {
                  from: 'todo',
                  to: 'done',
                  actors: ['user'],
                  approval: { approvers: ['projectLead' as const] },
                },
              ]
            : []),
        ],
      },
    });
    await h.projects.workflows.setDefault(h.viewer('alice'), workflow.id);
    const project = await h.projects.projects.create(h.viewer('bob'), {
      name: 'Release work',
    });
    const b = await client.createIssue({ title: 'First prerequisite' });
    const c = await client.createIssue({
      title: 'Last prerequisite',
      projectId: project.id,
    });
    const child =
      operation === 'parent'
        ? await client.createIssue({
            title: 'Last child',
            parentIssueId: c.id,
            stage: 0,
          })
        : null;
    const agentId = await h.createAgent();
    const a = await client.createIssue({
      title: 'Waiting for both',
      statusKey: 'todo',
      executor: { type: 'agent', id: agentId },
      blockedBy: [b.id, c.id],
      start: true,
    });
    const before = await client.issue(a.id);
    expect(before.blockers).toHaveLength(2);
    const link = before.blockedBy.find((item) => item.issueId === b.id)!;
    const runs = () =>
      h.agents.runs.list({ subjectKind: 'issue', subjectId: a.id });
    expect(await runs()).toEqual([]);
    const move = async (issue: Issue, statusKey: string) =>
      h.request('PATCH', `/projects/issues/${issue.id}`, {
        user: 'alice',
        body: { revision: (await client.issue(issue.id)).revision, statusKey },
      });
    let approvalId: string | undefined;
    if (operation === 'approval') {
      const pending = await move(c, 'done');
      expect(pending.status).toBe(202);
      approvalId = pending.body.data.pendingApproval.id;
    }
    const released: string[] = [];
    h.projects.events.on('issue.dependencyReleased', (event) => {
      if (event.issueId === a.id) released.push(event.issueId);
    });
    const releaseChecked = Promise.withResolvers<void>();
    const allowCommit = Promise.withResolvers<void>();
    const changed = h.projects.subtasks.relations.changed.bind(
      h.projects.subtasks.relations,
    );
    const spy = vi
      .spyOn(h.projects.subtasks.relations, 'changed')
      .mockImplementation(async (tx, change) => {
        await changed(tx, change);
        if (change.after.id === c.id) {
          // C has really moved and checked its dependents, but its transaction has not committed. A still waits for B.
          releaseChecked.resolve();
          await allowCommit.promise;
        }
      });
    const finish = async () => {
      if (operation === 'event batch') {
        expect(
          await h.projects.workflowEvents.fire({
            event: 'test.finished',
            issueIds: [c.id],
          }),
        ).toEqual([expect.objectContaining({ outcome: 'moved', to: 'done' })]);
      } else if (operation === 'approval') {
        const response = await h.request(
          'POST',
          `/projects/approvals/${approvalId!}/approve`,
          {
            user: 'bob',
            body: {},
          },
        );
        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('approved');
      } else {
        expect(
          (
            await move(
              child ?? c,
              operation === 'cancelled' ? 'cancelled' : 'done',
            )
          ).status,
        ).toBe(200);
      }
    };
    const finishing = finish();
    let converting: ReturnType<BridgeHarness['request']> | undefined;
    try {
      await Promise.race([
        releaseChecked.promise,
        finishing.then(() => {
          throw new Error('Completion did not check the dependent issue.');
        }),
      ]);
      const convert = () =>
        h.request(
          'PATCH',
          `/projects/issues/${a.id}/dependencies/${link.dependencyId}`,
          {
            user: 'alice',
            body: { expectedType: 'blockedBy', type: 'relatedTo' },
          },
        );
      converting = convert();
      // Without serialization both writes finish against the other's old blocker and neither emits a release.
      // With it, conversion waits for C; do not hold C forever waiting for a correctly blocked request.
      await Promise.race([converting, delay(200)]);
      allowCommit.resolve();
      await finishing;
      let response = await converting;
      if (response.status === 409) {
        expect(response.body.error.reason).toBe('DEPENDENCY_GRAPH_CHANGED');
        expect((await client.issue(a.id)).blockers).toEqual([
          expect.objectContaining({ issueId: b.id }),
        ]);
        expect(released).toEqual([]);
        expect(await runs()).toEqual([]);
        // A caller retries the rejected operation after reloading, as the API contract requires.
        response = await convert();
      }
      expect(response.status).toBe(200);
      expect((await client.issue(c.id)).statusKey).toBe(
        operation === 'cancelled' ? 'cancelled' : 'done',
      );
      expect((await client.issue(a.id)).blockers).toEqual([]);
      expect(released).toEqual([a.id]);
      const queued = await runs();
      expect(queued).toEqual([expect.objectContaining({ status: 'queued' })]);
      expect((await h.agents.runs.detail(queued[0]!.id)).inputs).toEqual([
        expect.objectContaining({
          payload: expect.objectContaining({
            trigger: 'unblocked',
            releasedBy: b.id,
          }),
        }),
      ]);
    } finally {
      allowCommit.resolve();
      await Promise.allSettled([
        finishing,
        ...(converting ? [converting] : []),
      ]);
      spy.mockRestore();
    }
  },
);

it.each(
  [
    'convert',
    'remove by id',
    'remove by target',
    'delete issue',
    'finish issue',
  ].flatMap((operation) =>
    [false, true].map((completed) => ({ operation, completed })),
  ),
)(
  '$operation releases an actual wait only (prerequisite completed: $completed)',
  async ({ operation, completed }) => {
    h.roles.set('alice', 'admin');
    const client = api();
    const agentId = await h.createAgent();
    const b = await client.createIssue({ title: 'Prerequisite' });
    const finish = async () => {
      const current = await client.issue(b.id);
      const response = await h.request('PATCH', `/projects/issues/${b.id}`, {
        user: 'alice',
        body: { revision: current.revision, statusKey: 'done' },
      });
      expect(response.status).toBe(200);
    };
    if (completed) await finish();
    const a = await client.createIssue({
      title: 'Intentionally not started',
      statusKey: 'todo',
      executor: { type: 'agent', id: agentId },
      start: false,
    });
    const link = await client.addDependency(a.id, {
      dependsOnIssueId: b.id,
      type: 'blockedBy',
    });
    const runs = () =>
      h.agents.runs.list({ subjectKind: 'issue', subjectId: a.id });
    expect((await client.issue(a.id)).blockers).toHaveLength(completed ? 0 : 1);
    expect(await runs()).toEqual([]);
    const released: string[] = [];
    h.projects.events.on('issue.dependencyReleased', (event) => {
      released.push(event.issueId);
    });

    if (operation === 'convert') {
      await client.updateDependency(a.id, link.dependencyId, {
        expectedType: 'blockedBy',
        type: 'relatedTo',
      });
    } else if (operation === 'remove by id') {
      await client.removeDependency(a.id, link.dependencyId);
    } else if (operation === 'remove by target') {
      const response = await h.request(
        'POST',
        `/projects/issues/${a.id}/removeDependency`,
        {
          user: 'alice',
          body: { dependsOnIssueId: b.id, type: 'blockedBy' },
        },
      );
      expect(response.status).toBe(204);
    } else if (operation === 'delete issue') {
      const response = await h.request('DELETE', `/projects/issues/${b.id}`, {
        user: 'alice',
      });
      expect(response.status).toBe(204);
    } else await finish();

    expect((await client.issue(a.id)).blockers).toEqual([]);
    expect(released).toEqual(completed ? [] : [a.id]);
    const queued = await runs();
    if (completed) expect(queued).toEqual([]);
    else {
      expect(queued).toEqual([expect.objectContaining({ status: 'queued' })]);
      const run = await h.agents.runs.detail(queued[0]!.id);
      expect(run.inputs).toEqual([
        expect.objectContaining({
          payload: expect.objectContaining({
            trigger: 'unblocked',
            releasedBy: b.id,
          }),
        }),
      ]);
    }
  },
);

it('waits for the remaining prerequisite after conversion and wakes once it is removed', async () => {
  const client = api();
  const agentId = await h.createAgent();
  const a = await client.createIssue({
    title: 'Waiting',
    executor: { type: 'agent', id: agentId },
    start: false,
  });
  const b = await client.createIssue({ title: 'First prerequisite' });
  const c = await client.createIssue({ title: 'Last prerequisite' });
  const first = await client.addDependency(a.id, { dependsOnIssueId: b.id });
  const last = await client.addDependency(a.id, { dependsOnIssueId: c.id });
  const released: string[] = [];
  h.projects.events.on('issue.dependencyReleased', (event) =>
    released.push(event.issueId),
  );
  await client.updateDependency(a.id, first.dependencyId, {
    expectedType: 'blockedBy',
    type: 'relatedTo',
  });
  expect((await client.issue(a.id)).blockers).toHaveLength(1);
  expect(
    await h.agents.runs.list({ subjectKind: 'issue', subjectId: a.id }),
  ).toEqual([]);
  expect(released).toEqual([]);
  await client.removeDependency(a.id, last.dependencyId);
  expect((await client.issue(a.id)).blockers).toEqual([]);
  expect(released).toEqual([a.id]);
  expect(
    await h.agents.runs.list({ subjectKind: 'issue', subjectId: a.id }),
  ).toEqual([expect.objectContaining({ status: 'queued' })]);
});

async function pair() {
  const viewer = h.viewer('alice');
  return [
    await h.projects.issues.create(viewer, { title: 'First' }),
    await h.projects.issues.create(viewer, { title: 'Second' }),
  ] as const;
}

it('shows related issues at both ends without blockers, and removes them from the reverse end', async () => {
  const [a, b] = await pair();
  const client = api();
  const link = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  expect((await client.issue(a.id)).relatedTo).toEqual([
    expect.objectContaining({ issueId: b.id }),
  ]);
  expect((await client.issue(b.id)).relatedTo).toEqual([
    expect.objectContaining({ issueId: a.id }),
  ]);
  expect((await client.issue(a.id)).blockers).toEqual([]);
  expect((await client.issue(b.id)).blockers).toEqual([]);
  await client.removeDependency(b.id, link.dependencyId);
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
  expect((await client.issue(b.id)).relatedTo).toEqual([]);
});

it('converts a reverse related link in place and back, with the current issue waiting', async () => {
  const [a, b] = await pair();
  const client = api();
  const related = await client.addDependency(b.id, {
    dependsOnIssueId: a.id,
    type: 'relatedTo',
  });
  const converted = await client.updateDependency(a.id, related.dependencyId, {
    type: 'blockedBy',
    expectedType: 'relatedTo',
  });
  expect(converted).toMatchObject({
    dependencyId: related.dependencyId,
    issueId: b.id,
    type: 'blockedBy',
  });
  const blocked = await client.issue(a.id);
  expect(blocked.relatedTo).toEqual([]);
  expect(blocked.blockedBy).toEqual([
    expect.objectContaining({ dependencyId: related.dependencyId }),
  ]);
  expect(blocked.blockers).toEqual([
    expect.objectContaining({ issueId: b.id }),
  ]);
  expect((await client.issue(b.id)).blocks).toEqual([
    expect.objectContaining({ issueId: a.id }),
  ]);
  await client.updateDependency(a.id, related.dependencyId, {
    type: 'relatedTo',
    expectedType: 'blockedBy',
  });
  expect((await client.issue(a.id)).blockers).toEqual([]);
  expect((await client.issue(b.id)).blocks).toEqual([]);
  expect((await client.issue(b.id)).relatedTo).toEqual([
    expect.objectContaining({
      dependencyId: related.dependencyId,
      issueId: a.id,
    }),
  ]);
});

it('preserves the related link when a cyclic prerequisite is refused', async () => {
  const [a, b] = await pair();
  const client = api();
  await client.addDependency(b.id, {
    dependsOnIssueId: a.id,
    type: 'blockedBy',
  });
  const related = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  await expect(
    client.updateDependency(a.id, related.dependencyId, {
      type: 'blockedBy',
      expectedType: 'relatedTo',
    }),
  ).rejects.toThrow('DEPENDENCY_CYCLE');
  expect((await client.issue(a.id)).relatedTo).toEqual([
    expect.objectContaining({ dependencyId: related.dependencyId }),
  ]);
  expect((await client.issue(b.id)).relatedTo).toHaveLength(1);
  expect((await client.issue(a.id)).blockedBy).toEqual([]);
});

it('rejects stale conversions without changing or recreating a link', async () => {
  const [a, b] = await pair();
  const client = api();
  const related = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'relatedTo',
  });
  const input = { type: 'blockedBy', expectedType: 'relatedTo' } as const;
  await client.updateDependency(a.id, related.dependencyId, input);
  const path = `/projects/issues/${a.id}/dependencies/${related.dependencyId}`;
  const stale = await h.request('PATCH', path, {
    user: 'alice',
    body: input,
  });
  expect(stale.status).toBe(409);
  expect(stale.body.error.reason).toBe('DEPENDENCY_CHANGED');
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
  expect((await client.issue(a.id)).blockedBy).toEqual([
    expect.objectContaining({ dependencyId: related.dependencyId }),
  ]);
  await client.removeDependency(a.id, related.dependencyId);
  const removed = await h.request('PATCH', path, {
    user: 'alice',
    body: { type: 'relatedTo', expectedType: 'blockedBy' },
  });
  expect(removed.status).toBe(404);
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
  expect((await client.issue(a.id)).blockedBy).toEqual([]);
});

it.each(['forward', 'reverse'] as const)(
  'preserves both relationship types when two windows convert in opposite directions (%s related link)',
  async (direction) => {
    const [a, b] = await pair();
    const client = api();
    const blocker = await client.addDependency(a.id, {
      dependsOnIssueId: b.id,
      type: 'blockedBy',
    });
    const related = await client.addDependency(
      direction === 'forward' ? a.id : b.id,
      {
        dependsOnIssueId: direction === 'forward' ? b.id : a.id,
        type: 'relatedTo',
      },
    );
    // Two detail windows display both types before submitting opposite conversions.
    const windows = await Promise.all([client.issue(a.id), client.issue(a.id)]);
    for (const detail of windows) {
      expect(detail.blockedBy).toHaveLength(1);
      expect(detail.relatedTo).toHaveLength(1);
    }
    const responses = await Promise.all([
      h.request(
        'PATCH',
        `/projects/issues/${a.id}/dependencies/${blocker.dependencyId}`,
        {
          user: 'alice',
          body: { type: 'relatedTo', expectedType: 'blockedBy' },
        },
      ),
      h.request(
        'PATCH',
        `/projects/issues/${a.id}/dependencies/${related.dependencyId}`,
        {
          user: 'alice',
          body: { type: 'blockedBy', expectedType: 'relatedTo' },
        },
      ),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(409);
      expect(response.body.error.reason).toBe('DEPENDENCY_EXISTS');
    }
    const detail = await client.issue(a.id);
    expect(detail.blockedBy).toEqual([
      expect.objectContaining({
        dependencyId: blocker.dependencyId,
        issueId: b.id,
      }),
    ]);
    expect(detail.relatedTo).toEqual([
      expect.objectContaining({
        dependencyId: related.dependencyId,
        issueId: b.id,
      }),
    ]);
    expect(detail.blockers).toEqual([
      expect.objectContaining({ issueId: b.id }),
    ]);
    const reverse = await client.issue(b.id);
    expect(reverse.blocks).toEqual([
      expect.objectContaining({
        dependencyId: blocker.dependencyId,
        issueId: a.id,
      }),
    ]);
    expect(reverse.relatedTo).toEqual([
      expect.objectContaining({
        dependencyId: related.dependencyId,
        issueId: a.id,
      }),
    ]);
  },
);

it('does not let an incoming Blocks row change the other issue prerequisite', async () => {
  const [a, b] = await pair();
  const client = api();
  const blocker = await client.addDependency(a.id, {
    dependsOnIssueId: b.id,
    type: 'blockedBy',
  });
  await expect(
    client.updateDependency(b.id, blocker.dependencyId, {
      type: 'relatedTo',
      expectedType: 'blockedBy',
    }),
  ).rejects.toThrow('NOT_FOUND');
  expect((await client.issue(a.id)).blockedBy).toEqual([
    expect.objectContaining({ dependencyId: blocker.dependencyId }),
  ]);
  expect((await client.issue(a.id)).relatedTo).toEqual([]);
});

it('enforces permissions for direct dependency writes', async () => {
  const [a, b] = await pair();
  const path = `/projects/issues/${a.id}/dependencies`;
  const body = { dependsOnIssueId: b.id, type: 'relatedTo' } as const;
  expect((await h.request('POST', path, { body })).status).toBe(401);
  await h.addUser('reader');
  h.roles.set('reader', 'none');
  expect((await h.request('POST', path, { user: 'reader', body })).status).toBe(
    404,
  );
  const related = await api().addDependency(a.id, body);
  const updatePath = `${path}/${related.dependencyId}`;
  const update = { type: 'blockedBy', expectedType: 'relatedTo' };
  expect((await h.request('PATCH', updatePath, { body: update })).status).toBe(
    401,
  );
  expect(
    (await h.request('PATCH', updatePath, { user: 'reader', body: update }))
      .status,
  ).toBe(403);
  expect((await api().issue(a.id)).relatedTo).toEqual([
    expect.objectContaining({ dependencyId: related.dependencyId }),
  ]);
  expect((await api().issue(a.id)).blockedBy).toEqual([]);
});
