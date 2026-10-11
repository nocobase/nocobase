// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Actor } from '../../server/kernel/actor.js';
import type {
  StatusRuleCheck,
  StatusRuleEntry,
} from '../../server/domains/workflows/index.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
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

  it('keeps system permissions and reports the source of a contributed workflow event', async () => {
    const viewer = h.viewer('alice', 'admin');
    const entries: StatusRuleEntry[] = [];
    h.services.statusRules.add({
      type: 'rememberSource',
      entered: (entry) => {
        entries.push(entry);
        return Promise.resolve(undefined);
      },
    });
    h.services.workflowEvents.types.add({ key: 'test.finished' });
    const [workflow] = await h.services.workflows.list(viewer);
    await h.services.workflows.update(viewer, workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'done'
            ? { ...state, rules: [{ type: 'rememberSource' }] }
            : state,
        ),
        transitions: [
          ...workflow.definition.transitions,
          { from: 'todo', to: 'done', actors: ['system'], on: 'test.finished' },
        ],
      },
    });
    const issue = await h.services.issues.create(viewer, {
      title: 'Event source',
    });
    expect(
      await h.services.workflowEvents.fire({
        event: 'test.finished',
        issueIds: [issue.id],
        actor,
      }),
    ).toEqual([
      { issueId: issue.id, outcome: 'moved', from: 'todo', to: 'done' },
    ]);
    expect(entries[0]).toMatchObject({
      actor: { type: 'system', id: null },
      sourceActor: actor,
    });
    const systemIssue = await h.services.issues.create(viewer, {
      title: 'System source',
    });
    await h.services.workflowEvents.fire({
      event: 'test.finished',
      issueIds: [systemIssue.id],
    });
    expect(entries[1]).toMatchObject({
      actor: { type: 'system', id: null },
      sourceActor: { type: 'system', id: null },
    });
  });

  it('preserves the source through owner changes, release, joins and cascading system rules', async () => {
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
    const checks: StatusRuleCheck[] = [];
    const entries: StatusRuleEntry[] = [];
    h.services.statusRules.add({
      type: 'rememberSource',
      canEnter: (check) => {
        checks.push(check);
        return Promise.resolve(null);
      },
      entered: (entry) => {
        entries.push(entry);
        return Promise.resolve(undefined);
      },
    });
    const [workflow] = await h.services.workflows.list(viewer);
    await h.services.workflows.update(viewer, workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'done'
            ? { ...state, rules: [{ type: 'rememberSource' }] }
            : state,
        ),
        transitions: [
          ...workflow.definition.transitions,
          { from: 'todo', to: 'done', actors: ['system'], on: 'subtasks.done' },
        ],
      },
    });
    const create = (title: string, parentIssueId?: string) =>
      h.services.issues.create(viewer, {
        title,
        executor: { type: 'bot', id: 'worker' },
        ...(parentIssueId ? { parentIssueId } : {}),
      });
    const grandparent = await create('Grandparent');
    const parent = await create('Parent', grandparent.id);
    const child = await create('Child', parent.id);
    const waiting = await create('Waiting');
    await h.services.subtasks.addDependency(viewer, waiting.id, {
      dependsOnIssueId: parent.id,
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
      'join',
      'release',
      'join',
    ]);
    for (const item of heard) expect(item.actor).toEqual(actor);
    expect(checks).toHaveLength(3);
    expect(entries).toHaveLength(3);
    for (const item of [...checks, ...entries])
      expect(item.sourceActor).toEqual(actor);
    expect(entries[0]?.actor).toEqual(actor);
    expect(checks[0]?.actor).toEqual(actor);
    for (const item of [...entries.slice(1), ...checks.slice(1)])
      expect(item.actor).toEqual({ type: 'system', id: null });
    expect(
      (await h.services.issueQueries.detail(viewer, grandparent.id)).statusKey,
    ).toBe('done');
  });
});
