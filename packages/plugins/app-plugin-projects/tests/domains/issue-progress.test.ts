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
    'requires needsYou atomically for %s, including same-status requests',
    async (statusKey) => {
      const viewer = h.viewer('alice');
      const issue = await h.services.issues.create(viewer, {
        title: 'Progress',
        statusKey: 'in_progress',
      });
      const activities = await h.database
        .connection()
        .repository('pmActivities')
        .count();
      events.length = 0;
      for (const needsYou of [undefined, null, '', ' \n ']) {
        await expect(
          h.services.issues.update(viewer, issue.id, {
            revision: issue.revision,
            statusKey,
            needsYou,
            next: 'Do not save',
          }),
        ).rejects.toMatchObject({ code: 'NEEDS_YOU_REQUIRED' });
      }
      expect(
        await h.services.issueQueries.detail(viewer, issue.id),
      ).toMatchObject({
        revision: issue.revision,
        statusKey: 'in_progress',
        needsYou: null,
        next: null,
      });
      expect(
        await h.database.connection().repository('pmActivities').count(),
      ).toBe(activities);
      expect(events).toEqual([]);
      const changed = await h.services.issues.update(viewer, issue.id, {
        revision: issue.revision,
        statusKey,
        needsYou: '  Decide on **this** proposal.\nProvide the URL.  ',
        next: 'Await the decision.',
      });
      expect(changed).toMatchObject({
        statusKey,
        needsYou: '  Decide on **this** proposal.\nProvide the URL.  ',
        next: 'Await the decision.',
        revision: issue.revision + 1,
      });
      await expect(
        h.services.issues.update(viewer, issue.id, {
          revision: changed.revision,
          statusKey,
        }),
      ).rejects.toMatchObject({ code: 'NEEDS_YOU_REQUIRED' });
      await expect(
        h.services.issues.update(viewer, issue.id, {
          revision: changed.revision,
          statusKey: statusKey === 'blocked' ? 'in_review' : 'blocked',
        }),
      ).rejects.toMatchObject({ code: 'NEEDS_YOU_REQUIRED' });
      await expect(
        h.services.issues.update(viewer, issue.id, {
          revision: changed.revision,
          needsYou: null,
        }),
      ).rejects.toMatchObject({ code: 'NEEDS_YOU_REQUIRED' });
    },
  );

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

  it('refuses system events into owner states and applies clearing rules to permitted events', async () => {
    const viewer = h.viewer('alice', 'admin');
    let issue = await h.services.issues.create(viewer, {
      title: 'Event target',
      statusKey: 'in_progress',
    });
    for (const to of ['blocked', 'in_review']) {
      const event = to === 'in_review' ? 'test.review' : 'test.blocked';
      h.services.statusEvents.types.add({
        key: event,
        from: ['in_progress'],
        to,
      });
      expect(
        await h.services.statusEvents.fire({
          event,
          issueIds: [issue.id],
          actor: viewer.actor,
        }),
      ).toMatchObject([{ outcome: 'refused', code: 'NEEDS_YOU_REQUIRED' }]);
      expect(
        await h.services.issueQueries.detail(viewer, issue.id),
      ).toMatchObject({ statusKey: 'in_progress', needsYou: null });
    }
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

  it('accepts the same fields through issue.update plan rehearsal and execution', async () => {
    const viewer = h.viewer('alice');
    const issue = await h.services.issues.create(viewer, {
      title: 'Plan target',
      statusKey: 'in_progress',
    });
    const plan = await h.services.plans.create(viewer, {
      title: 'Request decision',
      source: { kind: 'conversation', key: 'progress-test' },
      proposer: { agentId: 'pm', runId: 'run', conversationId: 'conversation' },
      rows: [
        {
          op: 'issue.update',
          params: {
            issue: issue.id,
            set: {
              statusKey: 'blocked',
              needsYou: 'Choose the deployment.',
              next: 'Deploy the choice.',
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
      needsYou: 'Choose the deployment.',
      next: 'Deploy the choice.',
    });
  });
});
