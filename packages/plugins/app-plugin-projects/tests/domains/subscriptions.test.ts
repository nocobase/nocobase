// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../harness.js';

let h: Harness;
beforeEach(async () => {
  h = await createHarness();
  for (const id of ['alice', 'bob', 'carol', 'dan']) await h.addUser(id, id);
});
afterEach(() => h.close());

const viewer = (id: string) => h.viewer(id);
const mention = (id: string) => `[@${id}](mention://user/${id})`;

async function followers(issueId: string) {
  return (await h.services.issueQueries.detail(viewer('alice'), issueId))
    .subscribers;
}

describe('following issues', () => {
  it('follows for the creator, owner, executor and the people the description mentions', async () => {
    const issue = await h.services.issues.create(viewer('alice'), {
      title: 'A',
      ownerUserId: 'bob',
      executor: { type: 'user', id: 'carol' },
      description: `cc ${mention('dan')}`,
    });
    expect(await followers(issue.id)).toEqual([
      { userId: 'alice', name: 'alice', reason: 'creator' },
      { userId: 'bob', name: 'bob', reason: 'owner' },
      { userId: 'carol', name: 'carol', reason: 'executor' },
      { userId: 'dan', name: 'dan', reason: 'mentioned' },
    ]);
  });

  it('follows commenters and the people a comment or an edit mentions', async () => {
    const issue = await h.services.issues.create(viewer('alice'), {
      title: 'A',
    });
    const { comment } = await h.services.comments.create(
      viewer('bob'),
      issue.id,
      { content: 'First' },
    );
    await h.services.comments.update(viewer('bob'), comment.id, {
      content: `First ${mention('carol')}`,
    });
    expect((await followers(issue.id)).map((row) => row.reason)).toEqual([
      'creator',
      'commenter',
      'mentioned',
    ]);
  });

  it('keeps an unsubscribe until the person owns the issue or follows it again', async () => {
    const issue = await h.services.issues.create(viewer('alice'), {
      title: 'A',
    });
    await h.services.comments.create(viewer('bob'), issue.id, {
      content: 'Hi',
    });
    expect(
      await h.services.subscriptions.set(viewer('bob'), issue.id, false),
    ).toEqual({ subscribed: false });
    await h.services.comments.create(viewer('bob'), issue.id, {
      content: 'Again',
    });
    await h.services.comments.create(viewer('alice'), issue.id, {
      content: mention('bob'),
    });
    expect((await followers(issue.id)).map((row) => row.userId)).toEqual([
      'alice',
    ]);
    const current = await h.services.issueQueries.detail(
      viewer('alice'),
      issue.id,
    );
    await h.services.issues.update(viewer('alice'), issue.id, {
      revision: current.revision,
      ownerUserId: 'bob',
    });
    expect(await followers(issue.id)).toContainEqual({
      userId: 'bob',
      name: 'bob',
      reason: 'owner',
    });
    await h.services.subscriptions.set(viewer('carol'), issue.id, false);
    await h.services.subscriptions.set(viewer('carol'), issue.id, true);
    expect(await followers(issue.id)).toContainEqual({
      userId: 'carol',
      name: 'carol',
      reason: 'manual',
    });
  });

  it('does not follow for other kinds or for disabled accounts', async () => {
    h.services.kinds.add({
      key: 'bot',
      executor: {
        require: () => Promise.resolve(),
        canKeep: () => Promise.resolve(true),
      },
    });
    await h.database
      .connection()
      .repository('user')
      .updateOne({ filter: { id: 'dan' }, values: { disabledAt: new Date() } });
    const issue = await h.services.issues.create(viewer('alice'), {
      title: 'A',
      executor: { type: 'bot', id: 'b1' },
      description: mention('dan'),
    });
    expect((await followers(issue.id)).map((row) => row.userId)).toEqual([
      'alice',
    ]);
  });
});
