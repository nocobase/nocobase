// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import type {
  WorkflowDefinition,
  WorkflowStatusRule,
  WorkflowTransition,
} from '../../shared/workflows.js';
import type {
  StatusRuleCheck,
  StatusRuleType,
} from '../../server/domains/workflows/index.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  await h.installStandardWorkflow();
  for (const id of ['admin', 'alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const admin = () => h.viewer('admin', 'admin');
const alice = () => h.viewer('alice');

const MERGED = 'test.merged';
const mergedOn = (from: string, to: string): WorkflowTransition => ({
  from,
  to,
  actors: ['system'],
  on: MERGED,
});

async function defaultWorkflow() {
  const [workflow] = await h.services.workflows.list(admin());
  return workflow;
}

async function save(
  edit: (definition: WorkflowDefinition) => WorkflowDefinition,
): Promise<void> {
  const workflow = await defaultWorkflow();
  await h.services.workflows.update(admin(), workflow.id, {
    revision: workflow.revision,
    definition: edit(workflow.definition),
  });
}

const withTransitions =
  (...transitions: WorkflowTransition[]) =>
  (definition: WorkflowDefinition): WorkflowDefinition => ({
    ...definition,
    transitions: [...definition.transitions, ...transitions],
  });

const withRules =
  (rules: Readonly<Record<string, readonly WorkflowStatusRule[]>>) =>
  (definition: WorkflowDefinition): WorkflowDefinition => ({
    ...definition,
    states: definition.states.map((state) =>
      rules[state.key] ? { ...state, rules: rules[state.key] } : state,
    ),
  });

async function issuesOf(error: Promise<unknown>): Promise<string[]> {
  try {
    await error;
    return [];
  } catch (caught) {
    return (
      (caught as { details?: { issues?: { path: string }[] } }).details
        ?.issues ?? []
    ).map((issue) => issue.path);
  }
}

async function moveTo(issue: Issue, statusKey: string): Promise<Issue> {
  const current = await h.services.issueQueries.detail(alice(), issue.id);
  return h.services.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

const statusOf = async (issue: Issue) =>
  (await h.services.issueQueries.detail(admin(), issue.id)).statusKey;

async function activities(issueId: string) {
  const page = await h.services.issueQueries.activities(admin(), issueId, {});
  return page.data;
}

/** An entry condition: refuses unless the issue's title says it is merged; remembers what it was asked. */
function mergedOnly(seen: StatusRuleCheck[]): StatusRuleType {
  return {
    type: 'mergedOnly',
    categories: ['done'],
    async canEnter(check) {
      seen.push(check);
      return check.issue.title.includes('merged')
        ? null
        : {
            code: 'TEST_NOT_MERGED',
            message: 'Merge it first.',
            details: { why: 'unmerged' },
          };
    },
  };
}

describe('workflow events other plugins contribute', () => {
  it('registers well-formed, new keys only', () => {
    const { types } = h.services.workflowEvents;
    const remove = types.add({ key: MERGED, from: ['started'] });
    expect(types.get(MERGED)).toEqual({ key: MERGED, from: ['started'] });
    expect(types.list().map((type) => type.key)).toEqual([MERGED]);
    expect(() => types.add({ key: MERGED })).toThrow(/registered already/u);
    expect(() => types.add({ key: 'subtasks.done' })).toThrow(
      /registered already/u,
    );
    expect(() => types.add({ key: 'merged' })).toThrow(/must match/u);
    expect(() => types.add({ key: 'Test.Merged' })).toThrow(/must match/u);
    remove();
    expect(types.get(MERGED)).toBeUndefined();
  });

  it('lets a workflow name a registered event, between the categories it allows, and refuses others', async () => {
    h.services.workflowEvents.types.add({
      key: MERGED,
      from: ['started'],
      to: ['done'],
    });
    await save(withTransitions(mergedOn('in_review', 'done')));
    const transitions = (await defaultWorkflow()).definition.transitions;
    expect(transitions.at(-1)).toEqual(mergedOn('in_review', 'done'));

    const workflow = await defaultWorkflow();
    const attempt = (transition: WorkflowTransition) =>
      issuesOf(
        h.services.workflows.update(admin(), workflow.id, {
          revision: workflow.revision,
          definition: withTransitions(transition)(workflow.definition),
        }),
      );
    const index = workflow.definition.transitions.length;
    expect(await attempt(mergedOn('todo', 'in_review'))).toEqual([
      `transitions[${index}].from`,
      `transitions[${index}].to`,
    ]);
    expect(
      await attempt({ ...mergedOn('in_progress', 'done'), on: 'other.event' }),
    ).toEqual([`transitions[${index}].on`]);
    expect(
      await attempt({ ...mergedOn('in_progress', 'done'), actors: ['user'] }),
    ).toEqual([`transitions[${index}].actors`]);
  });

  it('keeps a transition on an event whose plugin is gone, and refuses a new one', async () => {
    const remove = h.services.workflowEvents.types.add({ key: MERGED });
    await save(withTransitions(mergedOn('in_review', 'done')));
    remove();

    // Unchanged, it still saves around it.
    await save(withRules({ in_review: [{ type: 'notifyOwner' }] }));
    expect((await defaultWorkflow()).definition.transitions).toContainEqual(
      mergedOn('in_review', 'done'),
    );
    // A new transition on it is refused.
    const workflow = await defaultWorkflow();
    expect(
      await issuesOf(
        h.services.workflows.update(admin(), workflow.id, {
          revision: workflow.revision,
          definition: withTransitions(mergedOn('in_progress', 'done'))(
            workflow.definition,
          ),
        }),
      ),
    ).toEqual([`transitions[${workflow.definition.transitions.length}].on`]);
    // Nobody may fire it any more.
    await expect(
      h.services.workflowEvents.fire({ event: MERGED, issueIds: [] }),
    ).rejects.toThrow(/No plugin registered/u);
  });

  it('moves a batch of issues along their transition on the event, recording whose action it reports', async () => {
    h.services.workflowEvents.types.add({ key: MERGED });
    await save(withTransitions(mergedOn('in_review', 'done')));
    const a = await h.services.issues.create(alice(), { title: 'A' });
    const b = await h.services.issues.create(alice(), { title: 'B' });
    const c = await h.services.issues.create(alice(), { title: 'C' });
    await moveTo(a, 'in_review');
    await moveTo(b, 'in_review');

    const moves = await h.services.workflowEvents.fire({
      event: MERGED,
      issueIds: [a.id, b.identifier, c.id, 'missing', a.id],
      actor: { type: 'user', id: 'bob' },
      note: ' #12 merged ',
      details: { pullRequest: 12 },
    });

    expect(moves).toEqual([
      { issueId: a.id, outcome: 'moved', from: 'in_review', to: 'done' },
      { issueId: b.id, outcome: 'moved', from: 'in_review', to: 'done' },
      { issueId: c.id, outcome: 'ignored', reason: 'noTransition' },
      { issueId: 'missing', outcome: 'ignored', reason: 'notFound' },
    ]);
    expect(await statusOf(a)).toBe('done');
    expect(await statusOf(b)).toBe('done');
    expect(await statusOf(c)).toBe('todo');
    const moved = (await activities(a.id)).find(
      (entry) =>
        entry.action === 'status_changed' && entry.details.event === MERGED,
    );
    expect(moved).toMatchObject({
      actorType: 'user',
      actorId: 'bob',
      details: {
        from: 'in_review',
        to: 'done',
        event: MERGED,
        note: '#12 merged',
        cause: { pullRequest: 12 },
      },
    });
  });

  it('says where firing the event would take an issue, without moving it', async () => {
    h.services.workflowEvents.types.add({ key: MERGED });
    await save(withTransitions(mergedOn('in_review', 'done')));
    const a = await h.services.issues.create(alice(), { title: 'A' });
    const b = await h.services.issues.create(alice(), { title: 'B' });
    await moveTo(a, 'in_review');

    expect(
      await h.services.workflowEvents.target(MERGED, a.identifier),
    ).toEqual({ issueId: a.id, from: 'in_review', to: 'done' });
    expect(await h.services.workflowEvents.target(MERGED, b.id)).toEqual({
      issueId: b.id,
      to: null,
      reason: 'noTransition',
    });
    expect(await h.services.workflowEvents.target(MERGED, 'missing')).toEqual({
      issueId: 'missing',
      to: null,
      reason: 'notFound',
    });
    expect(await statusOf(a)).toBe('in_review');
    expect(() => h.services.workflowEvents.target('other.event', a.id)).toThrow(
      /No plugin registered/u,
    );
  });

  it('joins the caller transaction, so a rollback undoes the moves', async () => {
    h.services.workflowEvents.types.add({ key: MERGED });
    await save(withTransitions(mergedOn('in_review', 'done')));
    const a = await h.services.issues.create(alice(), { title: 'A' });
    await moveTo(a, 'in_review');

    await expect(
      h.services.tx.run(async (tx) => {
        const moves = await h.services.workflowEvents.fire(
          { event: MERGED, issueIds: [a.id] },
          tx,
        );
        expect(moves[0]).toMatchObject({ outcome: 'moved' });
        throw new Error('The caller failed.');
      }),
    ).rejects.toThrow('The caller failed.');
    expect(await statusOf(a)).toBe('in_review');
  });

  it('fires only registered, contributed events, with a short note', async () => {
    h.services.workflowEvents.types.add({ key: MERGED });
    await expect(
      h.services.workflowEvents.fire({ event: 'subtasks.done', issueIds: [] }),
    ).rejects.toThrow(/built-in/u);
    await expect(
      h.services.workflowEvents.fire({ event: 'other.event', issueIds: [] }),
    ).rejects.toThrow(/No plugin registered/u);
    await expect(
      h.services.workflowEvents.fire({
        event: MERGED,
        issueIds: ['x'],
        note: 'x'.repeat(201),
      }),
    ).rejects.toMatchObject({ code: 'INVALID_EVENT_FIRING' });
  });
});

describe('entry conditions contributed rule types hold', () => {
  it('refuses a person moving the issue in with its own code, and lets it through once met', async () => {
    const seen: StatusRuleCheck[] = [];
    h.services.statusRules.add(mergedOnly(seen));
    await save(withRules({ done: [{ type: 'mergedOnly' }] }));
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });

    await expect(moveTo(issue, 'done')).rejects.toMatchObject({
      kind: 'conflict',
      code: 'TEST_NOT_MERGED',
      details: { why: 'unmerged', rule: 'mergedOnly' },
    });
    expect(await statusOf(issue)).toBe('todo');
    expect(seen[0]).toMatchObject({
      from: 'todo',
      status: { key: 'done', category: 'done' },
      actor: { type: 'user', id: 'alice' },
      event: null,
    });
    expect(seen[0].issue.statusKey).toBe('todo');

    const merged = await h.services.issues.create(alice(), {
      title: 'Ship, merged',
    });
    expect((await moveTo(merged, 'done')).statusKey).toBe('done');
    // A condition only: nothing is recorded on entering.
    expect(
      (await activities(merged.id)).some((entry) =>
        entry.action.startsWith('stage_action_'),
      ),
    ).toBe(false);
  });

  it('holds back an event move too: the issue stays, the refusal is recorded and reported', async () => {
    const seen: StatusRuleCheck[] = [];
    h.services.statusRules.add(mergedOnly(seen));
    h.services.workflowEvents.types.add({ key: MERGED });
    await save((definition) =>
      withRules({ done: [{ type: 'mergedOnly' }] })(
        withTransitions(mergedOn('in_review', 'done'))(definition),
      ),
    );
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });
    await moveTo(issue, 'in_review');

    const [move] = await h.services.workflowEvents.fire({
      event: MERGED,
      issueIds: [issue.id],
    });

    expect(move).toEqual({
      issueId: issue.id,
      outcome: 'refused',
      from: 'in_review',
      to: 'done',
      code: 'TEST_NOT_MERGED',
      message: 'Merge it first.',
    });
    expect(seen.at(-1)).toMatchObject({
      actor: { type: 'system', id: null },
      event: MERGED,
    });
    expect(await statusOf(issue)).toBe('in_review');
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'auto_move_skipped',
      )?.details,
    ).toMatchObject({ event: MERGED, to: 'done', code: 'TEST_NOT_MERGED' });
  });

  it('asks nothing once its plugin is gone', async () => {
    const remove = h.services.statusRules.add(mergedOnly([]));
    await save(withRules({ done: [{ type: 'mergedOnly' }] }));
    remove();
    const issue = await h.services.issues.create(alice(), { title: 'Ship' });
    expect((await moveTo(issue, 'done')).statusKey).toBe('done');
  });
});
