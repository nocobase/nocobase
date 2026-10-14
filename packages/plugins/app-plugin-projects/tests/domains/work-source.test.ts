// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Actor } from '../../server/kernel/actor.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const sources: Actor[] = [
  { type: 'user', id: 'alice' },
  {
    type: 'user',
    id: 'alice',
    via: 'agent',
    trace: {
      agentId: 'bot',
      runId: 'run-source',
      conversationId: 'conversation-source',
      planId: 'plan-source',
    },
  },
];

describe.each(sources)('work source %j', (actor) => {
  it('preserves the source when a dependency is removed and one stage finishes', async () => {
    const viewer = { ...h.viewer('alice', 'admin'), actor };
    const released: (Actor | undefined)[] = [];
    const joined: { actor?: Actor; stage: number | null }[] = [];
    h.services.kinds.add({
      key: 'bot',
      names: (_conn, ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, id]))),
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
      },
      work: {
        onIssueChanged: () => Promise.resolve([]),
        onUnblocked: (_tx, input) => {
          released.push(input.actor);
          return Promise.resolve([]);
        },
        onSubtasksFinished: (_tx, input) => {
          joined.push(input);
          return Promise.resolve([]);
        },
      },
    });
    const parent = await h.services.issues.create(viewer, {
      title: 'Parent',
      executor: { type: 'bot', id: 'worker' },
    });
    const child = await h.services.issues.create(viewer, {
      title: 'First stage',
      parentIssueId: parent.id,
      stage: 0,
    });
    const later = await h.services.issues.create(viewer, {
      title: 'Later stage',
      parentIssueId: parent.id,
      stage: 1,
    });
    const link = await h.services.subtasks.addDependency(viewer, parent.id, {
      dependsOnIssueId: later.id,
    });
    await h.services.subtasks.removeDependency(
      viewer,
      parent.id,
      link.dependencyId,
    );
    expect(released).toEqual([actor]);
    await h.services.issues.update(viewer, child.id, {
      revision: child.revision,
      statusKey: 'done',
    });
    expect(joined).toHaveLength(1);
    expect(joined[0]).toMatchObject({ actor, stage: 0 });
  });

  it('moves on a status event as the system and records its source', async () => {
    const viewer = h.viewer('alice', 'admin');
    h.services.statusEvents.types.add({
      key: 'test.finished',
      from: ['in_progress'],
      to: 'done',
    });
    const issue = await h.services.issues.create(viewer, {
      title: 'Event source',
      statusKey: 'in_progress',
      ownerUserId: 'bob',
    });
    expect(
      await h.services.statusEvents.fire({
        event: 'test.finished',
        issueIds: [issue.id],
        actor,
      }),
    ).toEqual([
      {
        issueId: issue.id,
        outcome: 'moved',
        from: 'in_progress',
        to: 'done',
      },
    ]);
    const activities = (
      await h.services.issueQueries.activities(viewer, issue.id, {})
    ).data;
    // A system transition retains the event's source on the status activity.
    for (const action of ['status_changed'])
      expect(
        activities.find((activity) => activity.action === action),
      ).toMatchObject({ actorType: 'user', actorId: 'alice' });
  });

  it('preserves the source through owner changes and joins', async () => {
    const viewer = { ...h.viewer('alice', 'admin'), actor };
    const heard: { hook: string; actor: Actor | undefined }[] = [];
    h.services.kinds.add({
      key: 'bot',
      names: (_conn, ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, id]))),
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
      },
      work: {
        onIssueChanged: () => Promise.resolve([]),
        onOwnerChanged: (_tx, input) => {
          heard.push({ hook: 'owner', actor: input.actor });
          return Promise.resolve([]);
        },
        onUnblocked: (_tx, input) => {
          heard.push({ hook: 'release', actor: input.actor });
          return Promise.resolve([]);
        },
        onSubtasksFinished: (_tx, input) => {
          heard.push({ hook: 'join', actor: input.actor });
          return Promise.resolve([]);
        },
      },
    });
    const create = (title: string, parentIssueId?: string) =>
      h.services.issues.create(viewer, {
        title,
        executor: { type: 'bot', id: 'worker' },
        ...(parentIssueId ? { parentIssueId } : {}),
      });
    const parent = await create('Parent');
    const child = await create('Child', parent.id);
    const waiting = await create('Waiting');
    await h.services.subtasks.addDependency(viewer, waiting.id, {
      dependsOnIssueId: child.id,
    });
    await h.services.issues.update(viewer, waiting.id, {
      revision: waiting.revision,
      ownerUserId: 'bob',
    });
    await h.services.issues.update(viewer, child.id, {
      revision: child.revision,
      statusKey: 'done',
    });
    expect(heard.map((item) => item.hook)).toEqual([
      'owner',
      'release',
      'join',
    ]);
    for (const item of heard) expect(item.actor).toEqual(actor);
    // The parent's own status does not move on its own.
    expect(
      (await h.services.issueQueries.detail(viewer, parent.id)).statusKey,
    ).toBe('backlog');
  });
});
