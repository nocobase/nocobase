// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from '../harness.js';
import type { DomainEvent } from '../../server/kernel/events.js';

let h: Harness;
let events: DomainEvent[];
beforeEach(async () => {
  h = await createHarness();
  await h.addUser('alice');
  await h.addUser('bob');
  events = [];
  h.services.events.onAny((event) => {
    events.push(event);
  });
});
afterEach(() => h.close());

describe('structured issue progress', () => {
  it.each(['blocked', 'in_review'])(
    'allows optional progress for %s and preserves or explicitly clears it',
    async (statusKey) => {
      const viewer = h.viewer('alice');
      let issue = await h.services.issues.create(viewer, {
        title: 'Progress',
        statusKey: 'in_progress',
      });
      for (const needsYou of [undefined, null, '', ' \n ']) {
        issue = await h.services.issues.update(viewer, issue.id, {
          revision: issue.revision,
          statusKey,
          needsYou,
        });
        expect(issue).toMatchObject({ statusKey, needsYou: null });
      }
      const text = '  Decide on **this** proposal.\nProvide the URL.  ';
      issue = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        needsYou: text,
        next: 'Await the decision.',
      });
      expect(issue.needsYou).toBe(text);
      issue = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey: statusKey === 'blocked' ? 'in_review' : 'blocked',
      });
      expect(issue.needsYou).toBe(text);
      issue = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        needsYou: null,
      });
      expect(issue).toMatchObject({
        needsYou: null,
        next: 'Await the decision.',
      });
    },
  );

  it('keeps an acceptance list while In review only, and clears it on leaving', async () => {
    const viewer = h.viewer('alice');
    let issue = await h.services.issues.create(viewer, {
      title: 'Acceptance',
      statusKey: 'in_progress',
    });
    const list = '### Acceptance criteria\n\n- [ ] Export only Studio\n';
    // Outside In review an acceptance list is not kept.
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      acceptance: list,
    });
    expect(issue.acceptance).toBeNull();
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_review',
      needsYou: 'Check the export and accept it.',
      acceptance: list,
    });
    expect(issue.acceptance).toBe(list);
    // Omitted, it stays; whitespace clears it.
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      next: 'Await acceptance.',
    });
    expect(issue.acceptance).toBe(list);
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      acceptance: '  ',
    });
    expect(issue.acceptance).toBeNull();
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      acceptance: list,
    });
    // Sent back, the list goes with the status.
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
    });
    expect(issue.acceptance).toBeNull();
    await expect(
      h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey: 'in_review',
        needsYou: 'Accept it.',
        acceptance: 'x'.repeat(20_001),
      }),
    ).rejects.toThrow();
  });

  it.each(['blocked', 'in_review'])(
    'allows an application-authorized agent to omit progress for %s',
    async (statusKey) => {
      h.services.kinds.add({
        key: 'bot',
        names: async (_conn, ids) =>
          new Map(ids.map((id) => [id, 'Other application agent'])),
        moves: [
          { from: 'in_progress', to: 'blocked' },
          { from: 'in_progress', to: 'in_review' },
        ],
      });
      const viewer = {
        ...h.viewer('alice'),
        actor: { type: 'bot', id: 'worker' },
      };
      const issue = await h.services.issues.create(h.viewer('alice'), {
        title: 'Agent progress',
        statusKey: 'in_progress',
      });
      const changed = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey,
      });
      expect(changed).toMatchObject({ statusKey, needsYou: null, next: null });
    },
  );

  it('rejects invalid field types and lengths without advancing revision', async () => {
    const viewer = h.viewer('alice');
    const issue = await h.services.issues.create(viewer, {
      title: 'Field validation',
      statusKey: 'in_progress',
    });
    for (const field of ['needsYou', 'next']) {
      for (const value of [42, 'x'.repeat(2001)]) {
        await expect(
          h.services.issues.update(viewer, issue.id, {
            revision: issue.revision,
            [field]: value,
          } as never),
        ).rejects.toMatchObject({ code: 'INVALID_FIELD' });
        expect(
          (await h.services.issueQueries.detail(viewer, issue.id)).revision,
        ).toBe(issue.revision);
      }
    }
  });

  it('saves individual fields, emits refresh, retains omitted next and clears terminal progress', async () => {
    const viewer = h.viewer('alice');
    let issue = await h.services.issues.create(viewer, {
      title: 'Progress',
      statusKey: 'in_progress',
    });
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'blocked',
      needsYou: 'Choose the source.',
      next: 'Implement the choice.',
    });
    const revision = issue.revision;
    events.length = 0;
    issue = await h.services.issues.update(viewer, issue.id, {
      revision,
      needsYou: 'Provide the source URL.',
    });
    expect(issue).toMatchObject({
      revision: revision + 1,
      needsYou: 'Provide the source URL.',
      next: 'Implement the choice.',
    });
    expect(events).toContainEqual({ type: 'issue.changed', issueId: issue.id });
    await expect(
      h.services.issues.update(viewer, issue.id, {
        revision,
        next: 'Conflicting change',
      }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    await expect(
      h.services.issues.update(h.viewer('bob', 'none'), issue.id, {
        revision: issue.revision,
        next: 'Forbidden change',
      }),
    ).rejects.toMatchObject({ kind: 'notFound' });
    for (const next of [null, '', ' \n ']) {
      issue = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        next: 'Work next.',
      });
      const rev = issue.revision;
      events.length = 0;
      issue = await h.services.issues.update(viewer, issue.id, {
        revision: rev,
        next,
      });
      expect(issue).toMatchObject({ next: null, revision: rev + 1 });
      expect(events).toContainEqual({
        type: 'issue.changed',
        issueId: issue.id,
      });
    }
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
      next: 'Finish it.',
    });
    expect(issue).toMatchObject({ needsYou: null, next: 'Finish it.' });
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'done',
      next: 'Discard this.',
    });
    expect(issue).toMatchObject({ needsYou: null, next: null });
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      next: 'Cannot retain a terminal next.',
    });
    expect(issue.next).toBeNull();
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
    });
    expect(issue.next).toBeNull();
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'cancelled',
      next: 'Discard this too.',
    });
    expect(issue.next).toBeNull();
  });

  it('allows ordinary edits of historical blocked rows with null progress', async () => {
    const viewer = h.viewer('alice');
    const issue = await h.services.issues.create(viewer, {
      title: 'Historical',
    });
    await h.database
      .connection()
      .repository('pmIssues')
      .updateOne({
        filter: { id: issue.id },
        values: { statusKey: 'blocked' },
      });
    const current = await h.services.issueQueries.detail(viewer, issue.id);
    expect(
      await h.services.issues.update(viewer, issue.id, {
        revision: current.revision,
        title: 'Renamed',
      }),
    ).toMatchObject({ title: 'Renamed', needsYou: null });
  });

  it('allows system events into owner states and applies clearing rules', async () => {
    const viewer = h.viewer('alice', 'admin');
    let issue = await h.services.issues.create(viewer, {
      title: 'Event target',
      statusKey: 'in_progress',
    });
    for (const to of ['blocked', 'in_review']) {
      const event = to === 'in_review' ? 'test.review' : 'test.blocked';
      h.services.statusEvents.types.add({
        key: event,
        from: ['in_progress', 'blocked'],
        to,
      });
      expect(
        await h.services.statusEvents.fire({
          event,
          issueIds: [issue.id],
          actor: viewer.actor,
        }),
      ).toMatchObject([{ outcome: 'moved' }]);
      expect(
        await h.services.issueQueries.detail(viewer, issue.id),
      ).toMatchObject({ statusKey: to, needsYou: null });
    }
    issue = await h.services.issueQueries.detail(viewer, issue.id);
    issue = await h.services.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'blocked',
      needsYou: 'Choose the source.',
      next: 'Finish the work.',
    });
    h.services.statusEvents.types.add({
      key: 'test.resume',
      from: ['blocked'],
      to: 'in_progress',
    });
    expect(
      await h.services.statusEvents.fire({
        event: 'test.resume',
        issueIds: [issue.id],
        actor: viewer.actor,
      }),
    ).toMatchObject([{ outcome: 'moved' }]);
    expect(
      await h.services.issueQueries.detail(viewer, issue.id),
    ).toMatchObject({ needsYou: null, next: 'Finish the work.' });
    h.services.statusEvents.types.add({
      key: 'test.finish',
      from: ['in_progress'],
      to: 'done',
    });
    expect(
      await h.services.statusEvents.fire({
        event: 'test.finish',
        issueIds: [issue.id],
        actor: viewer.actor,
      }),
    ).toMatchObject([{ outcome: 'moved' }]);
    expect(
      await h.services.issueQueries.detail(viewer, issue.id),
    ).toMatchObject({ next: null });
  });

  it.each([true, false])(
    'accepts optional fields through issue.update plans (withProgress=%s)',
    async (withProgress) => {
      const viewer = h.viewer('alice');
      const issue = await h.services.issues.create(viewer, {
        title: 'Plan target',
        statusKey: 'in_progress',
      });
      const plan = await h.services.plans.create(viewer, {
        title: 'Request decision',
        source: { kind: 'conversation', key: 'progress-test' },
        proposer: {
          agentId: 'pm',
          runId: 'run',
          conversationId: 'conversation',
        },
        rows: [
          {
            op: 'issue.update',
            params: {
              issue: issue.id,
              set: {
                statusKey: 'blocked',
                ...(withProgress
                  ? {
                      needsYou: 'Choose the deployment.',
                      next: 'Deploy the choice.',
                    }
                  : {}),
              },
            },
          },
        ],
      });
      expect(
        await h.services.plans.execute(viewer, plan.id, {
          revision: plan.revision,
        }),
      ).toMatchObject({ status: 'executed' });
      expect(
        await h.services.issueQueries.detail(viewer, issue.id),
      ).toMatchObject({
        statusKey: 'blocked',
        needsYou: withProgress ? 'Choose the deployment.' : null,
        next: withProgress ? 'Deploy the choice.' : null,
      });
    },
  );
});
