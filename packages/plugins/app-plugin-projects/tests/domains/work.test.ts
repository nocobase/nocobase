// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { IssueWorkHandler, RunAttempt } from '../../server/kernel/work.js';
import { collectRunAttempts } from '../../server/kernel/work.js';
import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id, id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

interface Seen {
  readonly hook: string;
  readonly issueId: string;
  readonly detail?: unknown;
}

/** A kind whose work handler records what it hears and starts work for every call, unless told to refuse. */
function addBots(options: { refuse?: boolean } = {}): Seen[] {
  const seen: Seen[] = [];
  const attempt = (
    subjectId: string,
    triggerType: string,
    principalId = 'b1',
  ): RunAttempt[] => [
    {
      kind: 'bot',
      principalId,
      subjectId,
      triggerType,
      started: true,
      runId: `run-${seen.length}`,
    },
  ];
  const work: IssueWorkHandler = {
    onIssueChanged(_tx, change) {
      if (options.refuse) return Promise.reject(new Error('No runner.'));
      seen.push({
        hook: 'changed',
        issueId: change.after.id,
        detail: change.before?.executor ?? null,
      });
      return Promise.resolve(
        change.after.executor?.type === 'bot'
          ? attempt(change.after.id, 'assigned')
          : [],
      );
    },
    onCommentCreated(_tx, change) {
      seen.push({
        hook: 'comment',
        issueId: change.issue.id,
        detail: change.mentions,
      });
      return Promise.resolve(
        change.mentions
          .filter((ref) => ref.kind === 'bot')
          .flatMap((ref) => attempt(change.issue.id, 'mention', ref.id)),
      );
    },
    onOwnerChanged(_tx, input) {
      seen.push({
        hook: 'owner',
        issueId: input.issue.id,
        detail: [input.from, input.to],
      });
      return Promise.resolve([]);
    },
  };
  h.services.kinds.add({
    key: 'bot',
    names: (_conn, ids) =>
      Promise.resolve(new Map(ids.map((id) => [id, `Bot ${id}`]))),
    executor: {
      require: () => Promise.resolve(),
      canKeep: () => Promise.resolve(true),
    },
    mention: { candidates: () => Promise.resolve([]) },
    work,
  });
  return seen;
}

describe('work handlers of registered kinds', () => {
  it('hears an issue given to its kind, in the same transaction, and reports the attempt', async () => {
    const seen = addBots();
    const { value: issue, attempts } = await collectRunAttempts(() =>
      h.services.issues.create(alice(), {
        title: 'A',
        executor: { type: 'bot', id: 'b1' },
      }),
    );
    expect(seen).toEqual([
      { hook: 'changed', issueId: issue.id, detail: null },
    ]);
    expect(attempts).toEqual([
      expect.objectContaining({
        kind: 'bot',
        principalId: 'b1',
        subjectId: issue.id,
        triggerType: 'assigned',
        started: true,
      }),
    ]);
  });

  it('refuses the change when the handler throws, leaving the issue as it was', async () => {
    addBots({ refuse: true });
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    await expect(
      h.services.issues.update(alice(), issue.id, {
        revision: issue.revision,
        executor: { type: 'bot', id: 'b1' },
      }),
    ).rejects.toThrow('No runner.');
    const detail = await h.services.issueQueries.detail(alice(), issue.id);
    expect(detail.executor).toBeNull();
    expect(detail.revision).toBe(issue.revision);
  });

  it('tells the executing kind when the owner changes', async () => {
    const seen = addBots();
    const issue = await h.services.issues.create(alice(), {
      title: 'A',
      executor: { type: 'bot', id: 'b1' },
    });
    await h.services.issues.update(alice(), issue.id, {
      revision: issue.revision,
      ownerUserId: 'bob',
    });
    expect(seen.at(-1)).toEqual({
      hook: 'owner',
      issueId: issue.id,
      detail: ['alice', 'bob'],
    });
  });

  it('starts work for a mentioned principal and returns it as triggered', async () => {
    const seen = addBots();
    const issue = await h.services.issues.create(alice(), { title: 'A' });
    const { value, attempts } = await collectRunAttempts(() =>
      h.services.comments.create(alice(), issue.id, {
        content: 'Please look [@B](mention://bot/b2)',
      }),
    );
    expect(value.triggered).toEqual([{ kind: 'bot', id: 'b2' }]);
    expect(attempts).toHaveLength(1);
    expect(seen.at(-1)).toMatchObject({ hook: 'comment', issueId: issue.id });
    // A note starts nothing.
    await h.services.comments.create(alice(), issue.id, {
      content: '/note [@B](mention://bot/b2)',
    });
    expect(seen.filter((entry) => entry.hook === 'comment')).toHaveLength(1);
  });
});

describe('work held back, and withdrawn', () => {
  /**
   * A kind whose handler asks the plugin what holds an issue, as an agent runtime does: it starts nothing for a held
   * issue (`blocked`) or one in backlog (`dormant`), and withdraws one queued run when the issue becomes held.
   */
  function addCautiousBots(): { blocked: string[] } {
    const heard = { blocked: [] as string[] };
    const work: IssueWorkHandler = {
      async onIssueChanged(tx, change) {
        const { after } = change;
        if (after.executor?.type !== 'bot') return [];
        const attempt = {
          kind: 'bot',
          principalId: after.executor.id,
          subjectId: after.id,
          triggerType: 'assigned',
        };
        if (after.statusKey === 'backlog')
          return [{ ...attempt, started: false, skipped: 'dormant' }];
        const blockers = await h.services.subtasks.blockersOf(tx.conn, after);
        if (blockers.length > 0)
          return [{ ...attempt, started: false, skipped: 'blocked' }];
        return [{ ...attempt, started: true, runId: 'run-1' }];
      },
      onBlocked(_tx, { issue }) {
        heard.blocked.push(issue.id);
        return Promise.resolve([
          {
            kind: 'bot',
            principalId: 'b1',
            subjectId: issue.id,
            runId: 'run-queued',
            reason: 'blocked',
          },
        ]);
      },
    };
    h.services.kinds.add({
      key: 'bot',
      names: (_conn, ids) =>
        Promise.resolve(new Map(ids.map((id) => [id, `Bot ${id}`]))),
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
      },
      mention: { candidates: () => Promise.resolve([]) },
      work,
    });
    return heard;
  }

  const activities = async (issueId: string) =>
    (await h.services.issueQueries.activities(alice(), issueId, {})).data;

  it('records, as the principal’s, that work did not start while the issue waits for another', async () => {
    addCautiousBots();
    const blocker = await h.services.issues.create(alice(), { title: 'First' });
    const issue = await h.services.issues.create(alice(), { title: 'Then' });
    await h.services.subtasks.addDependency(alice(), issue.id, {
      dependsOnIssueId: blocker.id,
    });
    const current = await h.services.issueQueries.detail(alice(), issue.id);
    const { attempts } = await collectRunAttempts(() =>
      h.services.issues.update(alice(), issue.id, {
        revision: current.revision,
        executor: { type: 'bot', id: 'b1' },
      }),
    );
    expect(attempts).toEqual([
      expect.objectContaining({ started: false, skipped: 'blocked' }),
    ]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_skipped',
      ),
    ).toMatchObject({
      actorType: 'bot',
      actorId: 'b1',
      actorName: 'Bot b1',
      details: {
        reason: 'blocked',
        trigger: 'assigned',
        blockers: [{ issueId: blocker.id, identifier: blocker.identifier }],
      },
    });
  });

  it('records that work did not start while the issue is in backlog', async () => {
    addCautiousBots();
    const issue = await h.services.issues.create(alice(), {
      title: 'Someday',
      statusKey: 'backlog',
      executor: { type: 'bot', id: 'b1' },
    });
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_skipped',
      ),
    ).toMatchObject({
      actorType: 'bot',
      details: { reason: 'dormant', trigger: 'assigned', status: 'backlog' },
    });
  });

  it('tells every kind when a new dependency holds the issue, and records the work it withdrew', async () => {
    const heard = addCautiousBots();
    const blocker = await h.services.issues.create(alice(), { title: 'First' });
    const issue = await h.services.issues.create(alice(), { title: 'Then' });
    await h.services.subtasks.addDependency(alice(), issue.id, {
      dependsOnIssueId: blocker.id,
    });
    expect(heard.blocked).toEqual([issue.id]);
    expect(
      (await activities(issue.id)).find(
        (entry) => entry.action === 'work_withdrawn',
      ),
    ).toMatchObject({
      actorType: 'bot',
      actorId: 'b1',
      details: {
        reason: 'blocked',
        runId: 'run-queued',
        blockers: [{ identifier: blocker.identifier }],
      },
    });
  });
});

describe('issue context', () => {
  it('reads an issue for an executor: workflow, moves its kind may make, and the newest comments', async () => {
    const issue = await h.services.issues.create(alice(), {
      title: 'Context',
      description: 'Do it.',
    });
    await h.services.comments.create(alice(), issue.id, { content: 'First' });
    const context = await h.services.issueContext.contextFor(
      h.database.connection(),
      issue.identifier,
      { kind: 'user' },
    );
    expect(context).toMatchObject({
      id: issue.id,
      identifier: issue.identifier,
      title: 'Context',
      description: 'Do it.',
      status: { key: issue.statusKey },
      owner: { id: 'alice', name: 'alice' },
      executor: null,
      project: null,
      parent: null,
      children: [],
      comments: [
        expect.objectContaining({
          content: 'First',
          author: { type: 'user', id: 'alice', name: 'alice' },
        }),
      ],
      url: `/issues/${issue.identifier}`,
    });
    expect(context?.allowedTransitions).toContain('in_review');
    expect(
      await h.services.issueContext.describe(h.database.connection(), issue.id),
    ).toEqual({ key: issue.identifier, url: `/issues/${issue.identifier}` });
    expect(
      await h.services.issueContext.contextFor(
        h.database.connection(),
        'NOPE-1',
      ),
    ).toBeUndefined();
  });
});
