// @vitest-environment node
/**
 * The batch reads a board of work gathers issues with: `issueQueries.matching`, `approvals.pendingOn` and
 * `subtasks.visibleBlockers`, each limited to what the viewer may see.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'alice', 'bob']) await h.addUser(id, id);
  h.services.kinds.add({
    key: 'bot',
    names: (_conn, ids) =>
      Promise.resolve(new Map(ids.map((id) => [id, `Bot ${id}`]))),
    executor: {
      require: () => Promise.resolve(),
      canKeep: () => Promise.resolve(true),
    },
    mention: { candidates: () => Promise.resolve([]) },
  });
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

async function moveTo(issue: Issue, statusKey: string): Promise<Issue> {
  const current = await h.services.issueQueries.detail(admin(), issue.id);
  return h.services.issues.update(admin(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

describe('issueQueries.matching', () => {
  it("gathers a kind's unfinished issues and the issues asked for by id, within the viewer's filters", async () => {
    const project = await h.services.projects.create(alice(), {
      name: 'Payments',
      visibility: 'members',
    });
    const label = await h.services.labels.create(admin(), {
      name: 'backend',
      color: 'blue',
    });
    const working = await h.services.issues.create(alice(), {
      title: 'Retry callbacks',
      projectId: project.id,
      executor: { type: 'bot', id: 'b1' },
      labelIds: [label.id],
    });
    const finished = await moveTo(
      await h.services.issues.create(alice(), {
        title: 'Old work',
        projectId: project.id,
        executor: { type: 'bot', id: 'b1' },
      }),
      'done',
    );
    const mentioned = await h.services.issues.create(alice(), {
      title: 'Asked a bot about it',
      projectId: project.id,
    });
    await h.services.issues.create(alice(), {
      title: 'Nobody on it',
      projectId: project.id,
    });
    const elsewhere = await h.services.issues.create(bob(), {
      title: "Bob's own",
      executor: { type: 'bot', id: 'b2' },
    });

    const ids = async (
      viewer: ReturnType<typeof alice>,
      query = {},
      issueIds: string[] = [mentioned.id, finished.id],
    ) =>
      (
        await h.services.issueQueries.matching(viewer, query, {
          executorType: 'bot',
          issueIds,
        })
      ).issues
        .map((issue) => issue.title)
        .sort();

    // A finished issue counts only when asked for by id; one nobody works on, never.
    expect(await ids(alice(), {}, [mentioned.id])).toEqual([
      'Asked a bot about it',
      "Bob's own",
      'Retry callbacks',
    ]);
    expect(await ids(alice())).toEqual([
      'Asked a bot about it',
      "Bob's own",
      'Old work',
      'Retry callbacks',
    ]);
    // The list's filters narrow it.
    expect(await ids(alice(), { projectId: project.id, q: 'retry' })).toEqual([
      'Retry callbacks',
    ]);
    expect(await ids(alice(), { labelId: label.id })).toEqual([
      'Retry callbacks',
    ]);
    // Bob is no member of the project, so he sees only his own issue.
    expect(await ids(bob())).toEqual(["Bob's own"]);
    expect(
      (
        await h.services.issueQueries.matching(
          alice(),
          {},
          { executorType: 'bot', limit: 1 },
        )
      ).truncated,
    ).toBe(true);
    // Nothing to gather, nothing read.
    expect(
      await h.services.issueQueries.matching(alice(), {}, { issueIds: [] }),
    ).toEqual({ issues: [], truncated: false });
    expect(working.id).not.toBe(elsewhere.id);
  });
});

describe('approvals.pendingOn', () => {
  it('answers the pending requests on the issues in one read', async () => {
    const [workflow] = await h.services.workflows.list(admin());
    await h.services.workflows.update(admin(), workflow!.id, {
      revision: workflow!.revision,
      definition: {
        states: workflow!.definition.states,
        transitions: [
          ...workflow!.definition.transitions,
          {
            from: 'todo',
            to: 'in_progress',
            actors: ['user'],
            approval: { approvers: ['owner'] },
          },
        ],
      },
    });
    const issue = await h.services.issues.create(bob(), {
      title: 'Needs a yes',
      ownerUserId: 'alice',
    });
    await h.services.issues.update(bob(), issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
    });
    const [request] = await h.services.approvals.pendingOn([issue.id, 'nope']);
    expect(request).toMatchObject({
      issueId: issue.id,
      toStatus: 'in_progress',
      requestedById: 'bob',
      approverUserIds: ['alice'],
      status: 'pending',
    });
    expect(await h.services.approvals.pendingOn([])).toEqual([]);
  });
});

describe('subtasks.visibleBlockers', () => {
  it('answers what holds each issue, leaving out the blockers and issues the viewer may not see', async () => {
    const secret = await h.services.projects.create(alice(), {
      name: 'Secret',
      visibility: 'members',
    });
    const waiting = await h.services.issues.create(bob(), {
      title: 'Waits',
    });
    const first = await h.services.issues.create(bob(), { title: 'First' });
    const second = await h.services.issues.create(bob(), { title: 'Second' });
    const hidden = await h.services.issues.create(alice(), {
      title: 'Hidden',
      projectId: secret.id,
    });
    const done = await h.services.issues.create(bob(), { title: 'Done' });
    for (const blocker of [second, first, hidden, done])
      await h.services.subtasks.addDependency(admin(), waiting.id, {
        dependsOnIssueId: blocker.id,
      });
    await moveTo(done, 'done');
    const free = await h.services.issues.create(bob(), { title: 'Free' });

    const forBob = await h.services.subtasks.visibleBlockers(bob(), [
      waiting.id,
      free.id,
      hidden.id,
    ]);
    // By number, unfinished only; Bob does not see the secret project's issue, nor anything that holds it.
    expect(
      forBob.get(waiting.id)?.map((blocker) => blocker.identifier),
    ).toEqual([first.identifier, second.identifier]);
    expect([...forBob.keys()]).toEqual([waiting.id]);

    const forAlice = await h.services.subtasks.visibleBlockers(alice(), [
      waiting.id,
    ]);
    expect(forAlice.get(waiting.id)?.map((blocker) => blocker.title)).toEqual([
      'First',
      'Second',
      'Hidden',
    ]);
    expect(await h.services.subtasks.visibleBlockers(bob(), [])).toEqual(
      new Map(),
    );
  });
});
