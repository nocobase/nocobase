// @vitest-environment node
/**
 * "My follow-ups" (`server/follow-ups/`): the overview at `/followUps`, replacing the followed issues
 * (`/followUps/following`), following or unfollowing one (`/followUps/issues/:issueId/follow|unfollow`) and marking an
 * issue seen (`/followUps/issues/:issueId/markSeen`), and how the routes are declared.
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { userPreferencesServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import type { MiddlewareHandler } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { followUpsRoutes } from '../../server/follow-ups/routes.js';
import {
  FOLLOWING_PREFERENCE,
  SEEN_MAX,
  SEEN_PREFERENCE,
  parseFollowing,
  parseSeen,
  pruneSeen,
} from '../../shared/follow-ups.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
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
  it('lists queued work on a followed issue, and leaves why it waits to the issue’s own progress', async () => {
    await h.createAgent();
    const task = await create('alice', {
      statusKey: 'in_progress',
      start: false,
    });
    await h.agents.runs.enqueue({
      agentId: PROJECT_MANAGER_ID,
      subject: { kind: 'issue', id: task.id },
      actorUserId: 'alice',
      input: {
        type: 'signal',
        actor: { kind: 'system', id: 'system', name: 'Studio' },
        text: 'PR checks passed',
        payload: { trigger: 'prChecksPassed' },
      },
    });
    expect((await follow([task.id])).status).toBe(200);

    const data = await overview();
    const row = data.issues.find((item: { id: string }) => item.id === task.id);
    expect(row).toMatchObject({
      followed: true,
      progress: {
        state: 'queued',
        agent: { id: PROJECT_MANAGER_ID },
        waiting: null,
      },
    });
    expect(row.progress.managerWait).toBeUndefined();
    const own = await h.request('GET', `/issueProgress/${task.id}`, {
      user: 'alice',
    });
    expect(own.body.data).toMatchObject({
      state: 'queued',
      agent: { id: PROJECT_MANAGER_ID },
      waiting: { reason: 'noRunner', owner: { id: 'alice' } },
    });
  });

  it('leaves queue diagnostics to the issue’s own progress, with only the viewer machine details', async () => {
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
    const busy = await create('alice', {
      statusKey: 'in_progress',
      start: false,
    });
    await h.projects.comments.create(h.viewer('alice'), busy.id, {
      content: `[@Worker](mention://agent/${worker}) first step`,
    });
    await h.claimOne();
    const queued = await create('alice', {
      statusKey: 'in_progress',
      start: false,
    });
    await h.projects.comments.create(h.viewer('alice'), queued.id, {
      content: `[@Worker](mention://agent/${worker}) second step`,
    });
    const data = await overview();
    const item = data.issues.find(
      (issue: { id: string }) => issue.id === queued.id,
    );
    expect(item.progress).toMatchObject({ state: 'queued', waiting: null });
    expect(item.progress.managerWait).toBeUndefined();
    const own = await h.request('GET', `/issueProgress/${queued.id}`, {
      user: 'alice',
    });
    expect(own.body.data).toMatchObject({
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

  it.each([false, true])(
    'clears the old blocked decision after manager recovery (manual follow: %s)',
    async (manual) => {
      // No executor, run, dependency or pending checks can mask the status-derived progress.
      const issue = await create('alice', {
        statusKey: 'in_progress',
        executor: null,
      });
      await move(issue, 'blocked');
      if (manual) expect((await follow([issue.id])).status).toBe(200);
      const before = await overview();
      expect(
        before.issues.find((item: any) => item.id === issue.id),
      ).toMatchObject({
        statusKey: 'blocked',
        followed: true,
        progress: { state: 'needsDecision' },
      });
      const current = await h.projects.issueQueries.detail(
        h.viewer('alice'),
        issue.id,
      );
      await h.projects.issues.update(
        {
          ...h.viewer('alice'),
          actor: { type: 'agent', id: PROJECT_MANAGER_ID },
        },
        issue.id,
        { revision: current.revision, statusKey: 'in_progress' },
      );
      const after = await overview();
      const resumed = after.issues.find((item: any) => item.id === issue.id);
      expect(resumed.statusKey).toBe('in_progress');
      expect(resumed.progress?.state).not.toBe('needsDecision');
      expect(after.counts.blocked).toBe(0);
      if (manual) {
        expect(resumed.followed).toBe(true);
        expect(resumed.progress.state).toBe('idle');
      }
    },
  );

  it('refuses someone signed out or who may not view issues', async () => {
    expect((await h.request('GET', '/followUps')).status).toBe(401);
    h.roles.set('bob', 'none');
    expect((await h.request('GET', '/followUps', { user: 'bob' })).status).toBe(
      403,
    );
  });
});

describe('the rows of named issues', () => {
  const rows = (issueIds: readonly string[], user = 'alice') =>
    h.request('GET', `/followUps/issues?issueIds=${issueIds.join(',')}`, {
      user,
    });

  it('answers the overview’s rows of the named issues it lists, and leaves the others out', async () => {
    const review = await create('alice', { title: 'Ready' });
    await move(review, 'in_review');
    const backlog = await create('alice', { title: 'Later' });
    const done = await create('alice', { title: 'Shipped' });
    await move(done, 'done');
    const theirs = await create('bob', { title: 'Theirs' });
    const followedTheirs = await create('bob', { title: 'Followed' });
    expect((await follow([review.id, followedTheirs.id])).status).toBe(200);

    const listed = new Map<string, unknown>(
      (await overview()).issues.map((issue: { id: string }) => [
        issue.id,
        issue,
      ]),
    );
    const answer = await rows([
      review.id,
      backlog.id,
      done.id,
      theirs.id,
      followedTheirs.id,
      'nope',
    ]);
    expect(answer.status).toBe(200);
    expect(answer.body.meta).toEqual({ total: 3 });
    expect(
      new Map(
        answer.body.data.map((issue: { id: string }) => [issue.id, issue]),
      ),
    ).toEqual(
      new Map(
        [review.id, backlog.id, followedTheirs.id].map((id) => [
          id,
          listed.get(id),
        ]),
      ),
    );
    expect((await rows([theirs.id])).body).toEqual({
      data: [],
      meta: { total: 0 },
    });
  });

  it('refuses someone signed out or who may not view issues, and too many issues', async () => {
    expect(
      (await h.request('GET', '/followUps/issues?issueIds=a')).status,
    ).toBe(401);
    h.roles.set('bob', 'none');
    expect((await rows(['a'], 'bob')).status).toBe(403);
    const tooMany = await rows(
      Array.from({ length: 101 }, (_, index) => `issue-${index}`),
    );
    expect(tooMany.status).toBe(400);
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

describe('following one issue', () => {
  const star = (verb: 'follow' | 'unfollow', issue: string, user = 'alice') =>
    h.request('POST', `/followUps/issues/${issue}/${verb}`, { user });

  it('adds an issue by id or key after the others, once, and takes it off again', async () => {
    const first = await create('alice', { title: 'First' });
    const second = await create('bob', { title: 'Second' });
    const added = await star('follow', first.id);
    expect(added.status).toBe(200);
    expect(added.body.data).toEqual({ issueIds: [first.id] });
    const byKey = await star('follow', second.identifier);
    expect(byKey.body.data).toEqual({ issueIds: [first.id, second.id] });
    // Following it again changes nothing.
    expect((await star('follow', first.id)).body.data).toEqual({
      issueIds: [first.id, second.id],
    });
    const data = await overview();
    expect(data.following).toEqual([first.id, second.id]);
    expect(
      data.issues.find((issue: any) => issue.id === second.id).seenAt,
    ).toEqual(expect.any(String));

    const removed = await star('unfollow', first.identifier);
    expect(removed.status).toBe(200);
    expect(removed.body.data).toEqual({ issueIds: [second.id] });
    // Unfollowing one not followed changes nothing.
    expect((await star('unfollow', first.id)).body.data).toEqual({
      issueIds: [second.id],
    });
    expect((await overview()).following).toEqual([second.id]);
  });

  it('starts from the default list, and makes it the caller’s own once they change it', async () => {
    const review = await create('alice', { title: 'Ready' });
    await move(review, 'in_review');
    const other = await create('alice', { title: 'Other' });
    expect((await star('follow', other.id)).body.data).toEqual({
      issueIds: [review.id, other.id],
    });
    expect((await overview()).followingStored).toBe(true);
  });

  it('refuses a sixth issue with what to do instead', async () => {
    const issues = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        create('alice', { title: `Issue ${index}` }),
      ),
    );
    for (const issue of issues.slice(0, 5))
      expect((await star('follow', issue.id)).status).toBe(200);
    const refused = await star('follow', issues[5]!.id);
    expect(refused.status).toBe(400);
    expect(refused.body.error.reason).toBe('FOLLOWING_LIMIT_REACHED');
    expect(refused.body.error.message).toContain('Unfollow one first');
    expect((await overview()).following).toHaveLength(5);
    // One already followed is still fine.
    expect((await star('follow', issues[0]!.id)).status).toBe(200);
  });

  it('answers 404 for an issue the caller cannot find, and 403 without issue access', async () => {
    for (const verb of ['follow', 'unfollow'] as const) {
      expect((await star(verb, 'nope')).status).toBe(404);
      expect((await star(verb, 'ZZ-99999')).status).toBe(404);
    }
    expect(h.preferences.has(`alice:${FOLLOWING_PREFERENCE}`)).toBe(false);
    const issue = await create('alice');
    h.roles.set('bob', 'none');
    expect((await star('follow', issue.id, 'bob')).status).toBe(403);
    expect(
      (await h.request('POST', `/followUps/issues/${issue.id}/follow`)).status,
    ).toBe(401);
  });
});

describe('the routes in the API document', () => {
  const pass: MiddlewareHandler = async (_context, next) => next();

  it('declares every route, with the follow star’s own commands', async () => {
    const container = new ServiceContainer();
    container.instance(authenticationToken, { required: () => pass } as never);
    container.instance(authorizationToken, { middleware: () => pass } as never);
    container.instance(projectsToken, {} as never);
    container.instance(agentsToken, {} as never);
    container.instance(userPreferencesServiceToken, {} as never);
    const router = await followUpsRoutes.createRouter({
      container,
    } as unknown as Application);
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    const follow =
      document.paths?.['/api/followUps/issues/{issueId}/follow']?.post;
    const unfollow =
      document.paths?.['/api/followUps/issues/{issueId}/unfollow']?.post;
    expect(follow?.operationId).toBe('followUpsFollowIssue');
    expect(document.paths?.['/api/followUps/issues']?.get?.operationId).toBe(
      'followUpsListIssues',
    );
    expect(unfollow?.operationId).toBe('followUpsUnfollowIssue');
    expect(
      (follow as { 'x-cli'?: { command?: string } })['x-cli']?.command,
    ).toBe('follow-up follow');
    expect(
      (unfollow as { 'x-cli'?: { command?: string } })['x-cli']?.command,
    ).toBe('follow-up unfollow');
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
