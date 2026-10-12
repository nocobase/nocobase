// @vitest-environment node
/**
 * "My follow-ups" (`server/follow-ups/`): the overview at `/followUps`, replacing the followed issues
 * (`/followUps/following`) and marking an issue seen (`/followUps/issues/:issueId/markSeen`).
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  FOLLOWING_PREFERENCE,
  SEEN_MAX,
  SEEN_PREFERENCE,
  parseFollowing,
  parseSeen,
  pruneSeen,
} from '../../shared/follow-ups.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const create = (owner: string, input: Record<string, unknown> = {}) =>
  h.projects.issues.create(h.viewer(owner), { title: 'An issue', ...input });

async function move(issue: Issue, statusKey: string): Promise<void> {
  const current = await h.projects.issueQueries.detail(
    h.viewer('alice'),
    issue.id,
  );
  await h.projects.issues.update(h.viewer('alice'), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

const overview = async (user = 'alice') => {
  const answer = await h.request('GET', '/followUps', { user });
  expect(answer.status).toBe(200);
  return answer.body.data;
};

const follow = (issueIds: readonly string[], user = 'alice') =>
  h.request('PUT', '/followUps/following', { user, body: { issueIds } });

describe('the overview', () => {
  it('includes shared queue diagnostics and only the viewer machine details', async () => {
    h.roles.set('alice', 'admin');
    const worker = await h.createAgent({
      name: 'Worker',
      maxConcurrentRuns: 2,
    });
    await h.claimOne();
    await h.database
      .connection()
      .query.updateTable('agRunners')
      .set({
        toolSlots: { claude: 1 },
        name: 'alice-machine',
        ownerUserId: 'alice',
      })
      .allowAllRows()
      .execute();
    await create('alice', {
      statusKey: 'in_progress',
      executor: { type: 'agent', id: worker },
    });
    await h.claimOne();
    const queued = await create('alice', {
      statusKey: 'in_progress',
      executor: { type: 'agent', id: worker },
    });
    const data = await overview();
    const item = data.issues.find(
      (issue: { id: string }) => issue.id === queued.id,
    );
    expect(item.progress).toMatchObject({
      state: 'queued',
      managerWait: {
        entries: [{ reason: 'busy', runners: ['alice-machine'] }],
      },
    });
  });

  it('lists the caller’s open issues by status, following their blocked and in-review ones by default', async () => {
    const backlog = await create('alice', { title: 'Later' });
    const blocked = await create('alice', { title: 'Asks' });
    await move(blocked, 'blocked');
    const review = await create('alice', { title: 'Ready' });
    await move(review, 'in_review');
    const done = await create('alice', { title: 'Shipped' });
    await move(done, 'done');
    await create('bob', { title: 'Not mine' });

    const data = await overview();
    expect(data.counts).toEqual({
      in_review: 1,
      blocked: 1,
      in_progress: 0,
      backlog: 1,
    });
    expect(data.truncated).toBe(false);
    expect(data.followingStored).toBe(false);
    // Newest activity first.
    expect(data.following).toEqual([review.id, blocked.id]);
    const byId = new Map<string, any>(
      data.issues.map((issue: any) => [issue.id, issue]),
    );
    expect([...byId.keys()].sort()).toEqual(
      [backlog.id, blocked.id, review.id].sort(),
    );
    expect(byId.get(review.id)).toMatchObject({
      identifier: review.identifier,
      owned: true,
      followed: true,
      unread: 0,
      seenAt: null,
      progress: { state: 'inReview' },
    });
    expect(byId.get(blocked.id).progress.state).toBe('needsDecision');
    expect(byId.get(backlog.id)).toMatchObject({
      followed: false,
      progress: null,
    });
    // Nothing was stored for a default.
    expect(h.preferences.has(`alice:${FOLLOWING_PREFERENCE}`)).toBe(false);
  });

  it('refuses someone signed out or who may not view issues', async () => {
    expect((await h.request('GET', '/followUps')).status).toBe(401);
    h.roles.set('bob', 'none');
    expect((await h.request('GET', '/followUps', { user: 'bob' })).status).toBe(
      403,
    );
  });
});

describe('following', () => {
  it('keeps the chosen issues in order, the caller’s or not, and counts what others did since', async () => {
    const mine = await create('alice', { title: 'Mine' });
    const theirs = await create('bob', { title: 'Theirs' });
    const answer = await follow([theirs.id, mine.id]);
    expect(answer.status).toBe(200);
    expect(answer.body.data).toEqual({ issueIds: [theirs.id, mine.id] });

    let data = await overview();
    expect(data.followingStored).toBe(true);
    expect(data.following).toEqual([theirs.id, mine.id]);
    const followed = data.issues.find((issue: any) => issue.id === theirs.id);
    expect(followed).toMatchObject({
      owned: false,
      followed: true,
      unread: 0,
      progress: { state: 'notStarted' },
    });
    expect(followed.seenAt).toEqual(expect.any(String));

    // Wait a tick so the comments come after the seen marker.
    await new Promise((resolve) => setTimeout(resolve, 5));
    await h.projects.comments.create(h.viewer('bob'), theirs.id, {
      content: 'Here is what I found.',
    });
    await h.projects.comments.create(h.viewer('alice'), theirs.id, {
      content: 'Thanks.',
    });
    data = await overview();
    expect(
      data.issues.find((issue: any) => issue.id === theirs.id).unread,
    ).toBe(1);

    const seen = await h.request(
      'POST',
      `/followUps/issues/${theirs.id}/markSeen`,
      { user: 'alice' },
    );
    expect(seen.status).toBe(204);
    data = await overview();
    expect(
      data.issues.find((issue: any) => issue.id === theirs.id).unread,
    ).toBe(0);
  });

  it('refuses more than five issues or one the caller cannot find', async () => {
    const issues = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        create('alice', { title: `Issue ${index}` }),
      ),
    );
    const tooMany = await follow(issues.map((issue) => issue.id));
    expect(tooMany.status).toBe(400);
    const missing = await follow([issues[0]!.id, 'nope']);
    expect(missing.status).toBe(400);
    expect(missing.body.error.reason).toBe('FOLLOW_UP_ISSUE_NOT_FOUND');
    expect(h.preferences.has(`alice:${FOLLOWING_PREFERENCE}`)).toBe(false);
    expect((await follow([], 'alice')).body.data).toEqual({ issueIds: [] });
    expect((await overview()).following).toEqual([]);
  });

  it('marks only an issue the caller can see', async () => {
    const answer = await h.request('POST', '/followUps/issues/nope/markSeen', {
      user: 'alice',
    });
    expect(answer.status).toBe(404);
    expect(h.preferences.has(`alice:${SEEN_PREFERENCE}`)).toBe(false);
  });
});

describe('the stored values', () => {
  it('reads only well-formed ones', () => {
    expect(parseFollowing('x')).toBeNull();
    expect(parseFollowing(['a', 'a', 2, '', 'b', 'c', 'd', 'e', 'f'])).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ]);
    expect(
      parseSeen({ a: '2026-10-01T00:00:00.000Z', b: 'never', c: 1 }),
    ).toEqual({ a: '2026-10-01T00:00:00.000Z' });
  });

  it('keeps the followed issues and the most recently seen', () => {
    const seen: Record<string, string> = {};
    for (let index = 0; index < SEEN_MAX + 5; index += 1)
      seen[`issue-${index}`] = new Date(
        Date.UTC(2026, 0, 1, 0, index),
      ).toISOString();
    const pruned = pruneSeen(seen, ['issue-0']);
    expect(Object.keys(pruned)).toHaveLength(SEEN_MAX);
    expect(pruned['issue-0']).toBeDefined();
    expect(pruned[`issue-${SEEN_MAX + 4}`]).toBeDefined();
    expect(pruned['issue-1']).toBeUndefined();
  });
});
