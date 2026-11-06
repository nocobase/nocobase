// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Issue } from '../../shared/issues.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** The actor a bot's request acts as: the bot itself, for the person. */
const asBot = (id: string) => ({
  ...h.viewer('alice'),
  actor: { type: 'bot', id },
});

/** Bots that move issues between active statuses; only `lead` may move them out of progress. */
function addBots(
  options: { readonly defaultExecutor?: string | null } = {},
): void {
  h.services.kinds.add({
    key: 'bot',
    names: (_conn, ids) =>
      Promise.resolve(new Map(ids.map((id) => [id, `Bot ${id}`]))),
    executor: {
      require: () => Promise.resolve(),
      canKeep: () => Promise.resolve(true),
      candidates: () => Promise.resolve(['lead', 'worker']),
    },
    moves: [
      { from: 'in_progress', to: 'blocked' },
      { from: 'in_progress', to: 'in_review' },
      { from: 'blocked', to: 'in_progress' },
    ],
    mayMove: (_conn, actor) => actor.id === 'lead',
    ...(options.defaultExecutor === undefined
      ? {}
      : {
          defaultExecutor: () =>
            Promise.resolve(options.defaultExecutor ?? null),
        }),
  });
}

async function move(
  viewer: ReturnType<typeof alice>,
  issue: Issue,
  statusKey: string,
): Promise<Issue> {
  const current = await h.services.issueQueries.detail(alice(), issue.id);
  return h.services.issues.update(viewer, issue.id, {
    revision: current.revision,
    statusKey,
    ...(statusKey === 'blocked' || statusKey === 'in_review'
      ? { needsYou: 'Choose how to proceed.' }
      : {}),
  });
}

describe('the fixed statuses', () => {
  it('lets people make any move', async () => {
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    for (const to of [
      'done',
      'in_progress',
      'blocked',
      'cancelled',
      'in_review',
      'backlog',
    ])
      expect((await move(alice(), issue, to)).statusKey).toBe(to);
    await expect(move(alice(), issue, 'todo')).rejects.toMatchObject({
      code: 'INVALID_STATUS',
    });
  });

  it('lets another kind make only its own moves, and only when it agrees', async () => {
    addBots();
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      statusKey: 'in_progress',
    });
    expect(h.services.statuses.allowedMoves('bot', 'in_progress')).toEqual([
      'blocked',
      'in_review',
    ]);
    expect(h.services.statuses.allowedMoves('bot', 'done')).toEqual([]);
    expect(h.services.statuses.allowedMoves('user', 'done')).toEqual([
      'backlog',
      'in_progress',
      'blocked',
      'in_review',
      'cancelled',
    ]);
    // Not one of its moves.
    await expect(move(asBot('lead'), issue, 'done')).rejects.toMatchObject({
      code: 'TRANSITION_NOT_ALLOWED',
    });
    // One of its moves, but `mayMove` refuses this bot.
    await expect(
      move(asBot('worker'), issue, 'in_review'),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    expect((await move(asBot('lead'), issue, 'in_review')).statusKey).toBe(
      'in_review',
    );
    // The issue's context names the moves the reading kind may make.
    const context = await h.services.issueContext.contextFor(
      h.database.connection(),
      issue.id,
      { kind: 'bot' },
    );
    expect(context?.allowedTransitions).toEqual([]);
    expect(context?.statuses.map((status) => status.key)).toEqual([
      'backlog',
      'in_progress',
      'blocked',
      'in_review',
      'done',
      'cancelled',
    ]);
  });

  it('gives a new issue the default executor a kind names, unless one is given', async () => {
    addBots({ defaultExecutor: 'lead' });
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    expect(issue.executor).toEqual({ type: 'bot', id: 'lead' });
    const nobody = await h.services.issues.create(alice(), {
      title: 'B',
      executor: null,
    });
    expect(nobody.executor).toBeNull();
    const person = await h.services.issues.create(alice(), {
      title: 'C',
      executor: { type: 'user', id: 'bob' },
    });
    expect(person.executor).toEqual({ type: 'user', id: 'bob' });
    expect(
      await h.services.kinds.executorCandidates(
        h.database.connection(),
        'alice',
      ),
    ).toEqual([
      { type: 'bot', id: 'lead', name: 'Bot lead', isDefault: true },
      { type: 'bot', id: 'worker', name: 'Bot worker' },
    ]);
  });

  it('gives no executor when no kind names a default', async () => {
    addBots({ defaultExecutor: null });
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    expect(issue.executor).toBeNull();
  });
});

describe('status events', () => {
  it('updates validated progress on a move and on an already matching status without replaying entry actions', async () => {
    h.services.statusEvents.types.add({
      key: 'test.stopped',
      from: ['in_progress', 'blocked'],
      to: 'blocked',
    });
    const issue = await h.services.issues.create(alice(), {
      title: 'Stop',
      statusKey: 'in_progress',
    });
    const fire = (needsYou: string) =>
      h.services.statusEvents.fire({
        event: 'test.stopped',
        issueIds: [issue.id],
        actor: { type: 'user', id: 'bob' },
        needsYou,
        next: 'Wait for a person.',
      });
    await fire('Bob stopped this run.');
    expect(
      await h.services.issueQueries.detail(alice(), issue.id),
    ).toMatchObject({
      statusKey: 'blocked',
      needsYou: 'Bob stopped this run.',
      next: 'Wait for a person.',
    });
    const before = (
      await h.services.issueQueries.activities(alice(), issue.id, {})
    ).data;
    await fire('Bob stopped another run.');
    expect(
      await h.services.issueQueries.detail(alice(), issue.id),
    ).toMatchObject({ needsYou: 'Bob stopped another run.' });
    expect(
      (await h.services.issueQueries.activities(alice(), issue.id, {})).data,
    ).toEqual(before);
    await expect(fire('x'.repeat(2001))).resolves.toMatchObject([
      { outcome: 'refused', code: 'INVALID_FIELD' },
    ]);
  });
  it('moves the issues in one of its statuses, and tells where it would take one', async () => {
    h.services.statusEvents.types.add({
      key: 'test.merged',
      from: ['in_progress', 'in_review'],
      to: 'done',
    });
    const working = await h.services.issues.create(alice(), {
      title: 'Working',
      statusKey: 'in_progress',
    });
    const waiting = await h.services.issues.create(alice(), { title: 'Later' });
    expect(
      await h.services.statusEvents.target('test.merged', working.identifier),
    ).toEqual({ issueId: working.id, from: 'in_progress', to: 'done' });
    expect(
      await h.services.statusEvents.target('test.merged', waiting.id),
    ).toEqual({ issueId: waiting.id, to: null, reason: 'noTransition' });
    expect(
      await h.services.statusEvents.fire({
        event: 'test.merged',
        issueIds: [working.id, waiting.id, 'missing'],
        note: 'acme#1 merged',
      }),
    ).toEqual([
      {
        issueId: working.id,
        outcome: 'moved',
        from: 'in_progress',
        to: 'done',
      },
      { issueId: waiting.id, outcome: 'ignored', reason: 'noTransition' },
      { issueId: 'missing', outcome: 'ignored', reason: 'notFound' },
    ]);
    const activity = (
      await h.services.issueQueries.activities(alice(), working.id, {})
    ).data.find((entry) => entry.action === 'status_changed');
    expect(activity).toMatchObject({
      actorType: 'system',
      details: { from: 'in_progress', to: 'done', event: 'test.merged' },
    });
    // An event nobody registered is a programming error.
    await expect(
      h.services.statusEvents.fire({ event: 'test.unknown', issueIds: [] }),
    ).rejects.toThrow(TypeError);
  });

  it('refuses an event naming a status that does not exist', () => {
    expect(() =>
      h.services.statusEvents.types.add({
        key: 'test.bad',
        from: ['todo'],
        to: 'done',
      }),
    ).toThrow(TypeError);
    expect(() =>
      h.services.statusEvents.types.add({
        key: 'bad',
        from: ['in_progress'],
        to: 'done',
      }),
    ).toThrow(TypeError);
  });
});
