// @vitest-environment node
/**
 * The pull request routes behind `nb-studio pr list|link|open` (`server/git/routes.ts`): a person, a scoped key and an
 * agent's run reach them, each as its narrowed `Viewer`; a run on an issue names none and gets its own. The rest of
 * the git routes stay a person's.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import {
  deleteLink,
  insertLink,
  findLink,
  LINK_CHOICES,
} from '../../server/git/store.js';
import { connectedRepo, tokenConnection, bindingOf } from './helpers.js';

const REPO = 'acme/studio';
const PR_URL = (number: number) => `https://github.com/${REPO}/pull/${number}`;
const READ_ISSUES = JSON.stringify({ 'projects.issues': { level: 'read' } });

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
});
afterEach(() => h.close());

/** An issue alice owns, an agent with `actions` she mentions on it, and the token of the step run it was given. */
async function runOn(actions: readonly string[], projectId?: string) {
  const agentId = await h.createAgent({ actions: [...actions] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Fix login',
    ...(projectId === undefined ? {} : { projectId }),
    start: false,
  });
  await h.projects.comments.create(h.viewer('alice'), issue.id, {
    content: `[@Coder](mention://agent/${agentId}) please look`,
  });
  const payload = await h.claimOne();
  expect(payload.agent.id).toBe(agentId);
  return {
    issue,
    agentId,
    token: payload.cli.credential.content.token as string,
  };
}

describe('the pull request routes', () => {
  it('lets a run unlink one of two PRs, suppresses automatic relinking, and lets it explicitly relink', async () => {
    const connection = await tokenConnection(h);
    h.github.addRepo(REPO);
    const project = await h.projects.projects.create(h.viewer('alice'), {
      name: 'Branches',
    });
    await h.projects.projects.addResource(h.viewer('alice'), project.id, {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
      defaultRef: 'main',
      binding: bindingOf(
        connection,
        REPO,
        String(h.github.repos.get(REPO)!.id),
      ),
    });
    const { issue, token } = await runOn(
      ['pm.issues/view', 'pm.issues/edit', 'studio.git/open-pr'],
      project.id,
    );
    const repo = await connectedRepo(h, REPO, connection);
    for (const number of [31, 32])
      h.github.addPull(REPO, {
        number,
        head: {
          ref: number === 31 ? 'human/A' : `agent/${issue.identifier}`,
          sha: `sha${number}`,
        },
      });
    const a = await h.request('POST', '/git/pullRequests', {
      runToken: token,
      body: { url: PR_URL(31) },
    });
    const b = await h.request('POST', '/git/pullRequests', {
      runToken: token,
      body: { url: PR_URL(32) },
    });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(
      (await h.request('GET', '/git/pullRequests', { runToken: token })).body
        .data,
    ).toHaveLength(2);
    const unlink = await h.request(
      'DELETE',
      `/git/pullRequests/${b.body.data.id}?issueId=${issue.id}`,
      { runToken: token },
    );
    expect(unlink.status).toBe(204);
    await h.git.pollRepo(repo);
    expect(
      (await h.request('GET', '/git/pullRequests', { runToken: token })).body
        .data,
    ).toMatchObject([{ number: 31 }]);
    expect(
      await insertLink(h.database.connection(), {
        issueId: issue.id,
        pullRequestId: b.body.data.id,
        linkedByType: 'system',
        linkedById: null,
      }),
    ).toBe(false);
    expect(
      await findLink(h.database.connection(), issue.id, b.body.data.id),
    ).toBeNull();
    expect(
      (
        await h.request('POST', '/git/pullRequests', {
          runToken: token,
          body: { url: PR_URL(32) },
        })
      ).status,
    ).toBe(201);
    expect(
      (await h.request('GET', '/git/pullRequests', { runToken: token })).body
        .data,
    ).toHaveLength(2);
    h.github.pushCommits(REPO, 'human/B', 'branch-b');
    const opened = await h.request('POST', '/git/pullRequests/open', {
      runToken: token,
      body: {
        repo: REPO,
        title: 'feat: branch B',
        head: 'human/B',
        base: 'main',
      },
    });
    expect(opened.status).toBe(201);
    expect(opened.body.data.headRef).toBe('human/B');
    expect(
      (await h.request('GET', '/git/pullRequests', { runToken: token })).body
        .data,
    ).toHaveLength(3);
    const scoped = await h.request(
      'DELETE',
      `/git/pullRequests/${opened.body.data.id}?issueId=${issue.id}`,
      {
        user: 'alice',
        headers: {
          'x-test-key-scope': JSON.stringify({
            'projects.issues': { level: 'write' },
          }),
        },
      },
    );
    expect(scoped.status).toBe(204);
    expect(h.github.pull(REPO, opened.body.data.number).state).toBe('open');
  });

  it('refuses unlink for view-only runs, read-scoped keys, unauthenticated callers and a PR not linked to the named issue', async () => {
    const { issue, token } = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 33, head: { ref: 'human', sha: 'sha' } });
    const pr = await h.git.link(h.viewer('alice'), issue.id, PR_URL(33), {
      type: 'user',
      id: 'alice',
    });
    expect(
      (
        await h.request('DELETE', `/git/pullRequests/${pr.pullRequest.id}`, {
          runToken: token,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request(
          'DELETE',
          `/git/pullRequests/${pr.pullRequest.id}?issueId=${issue.id}`,
          { user: 'alice', headers: { 'x-test-key-scope': READ_ISSUES } },
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request(
          'DELETE',
          `/git/pullRequests/${pr.pullRequest.id}?issueId=${issue.id}`,
        )
      ).status,
    ).toBe(401);
    const other = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Other',
      start: false,
    });
    expect(
      (
        await h.request(
          'DELETE',
          `/git/pullRequests/${pr.pullRequest.id}?issueId=${other.id}`,
          { user: 'alice' },
        )
      ).status,
    ).toBe(404);
    expect(
      await findLink(h.database.connection(), issue.id, pr.pullRequest.id),
    ).not.toBeNull();
  });

  it('serializes explicit choices and keeps one unique suppression record across repeated unlink and relink', async () => {
    const { issue } = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 34, head: { ref: 'human', sha: 'sha' } });
    const linked = await h.git.link(h.viewer('alice'), issue.id, PR_URL(34), {
      type: 'user',
      id: 'alice',
    });
    const input = {
      issueId: issue.id,
      pullRequestId: linked.pullRequest.id,
      linkedByType: 'system' as const,
      linkedById: null,
    };
    await deleteLink(h.database.connection(), issue.id, linked.pullRequest.id);
    expect(
      await Promise.all([
        insertLink(h.database.connection(), input),
        insertLink(h.database.connection(), input),
      ]),
    ).toEqual([false, false]);
    expect(
      await insertLink(h.database.connection(), {
        ...input,
        linkedByType: 'user',
        linkedById: 'alice',
      }),
    ).toBe(true);
    expect(await insertLink(h.database.connection(), input)).toBe(false);
    expect(
      await h.database
        .connection()
        .query.selectFrom(LINK_CHOICES)
        .select('id')
        .where('issueId', '=', issue.id)
        .execute(),
    ).toHaveLength(1);
  });
  it('list the run’s own issue’s pull requests when it names none', async () => {
    const { issue, token } = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 3, head: { ref: 'fix', sha: 'c1' } });
    await h.git.link(h.viewer('alice'), issue.id, PR_URL(3), {
      type: 'user',
      id: 'alice',
    });
    const listed = await h.request('GET', '/git/pullRequests', {
      runToken: token,
    });
    expect(listed.status).toBe(200);
    expect(listed.body.data).toMatchObject([{ repo: REPO, number: 3 }]);
    expect(listed.body.meta).toMatchObject({ total: 1, canMerge: false });
  });

  it('refuse a run outside its agent’s actions', async () => {
    const viewOnly = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 4, head: { ref: 'fix', sha: 'd1' } });
    const link = await h.request('POST', '/git/pullRequests', {
      runToken: viewOnly.token,
      body: { url: PR_URL(4) },
    });
    expect(link.status).toBe(403);
    const open = await h.request('POST', '/git/pullRequests/open', {
      runToken: viewOnly.token,
      body: { title: 'Fix' },
    });
    expect(open.status).toBe(403);
  });

  it('do not show a run an issue its agent may not view', async () => {
    const { token } = await runOn(['pm.issues/comment']);
    const listed = await h.request('GET', '/git/pullRequests', {
      runToken: token,
    });
    expect(listed.status).toBe(403);
    expect(listed.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
  });

  it('let a person link and list, naming the issue', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'By hand',
      start: false,
    });
    h.github.addPull(REPO, { number: 5, head: { ref: 'fix', sha: 'e1' } });
    const linked = await h.request('POST', '/git/pullRequests', {
      user: 'alice',
      body: { issueId: issue.identifier, url: PR_URL(5) },
    });
    expect(linked.status).toBe(201);
    expect(linked.body.meta.message).toContain(`${REPO}#5`);
    expect(linked.body.data.linkedBy).toMatchObject({
      type: 'user',
      id: 'alice',
    });
    const again = await h.request('POST', '/git/pullRequests', {
      user: 'alice',
      body: { issueId: issue.id, url: PR_URL(5) },
    });
    expect(again.status).toBe(200);
    expect(again.body.meta.message).toMatch(/^Already linked/u);
    const listed = await h.request(
      'GET',
      `/git/pullRequests?issueId=${issue.identifier}`,
      { user: 'alice' },
    );
    expect(listed.body.data).toHaveLength(1);
    const unnamed = await h.request('GET', '/git/pullRequests', {
      user: 'alice',
    });
    expect(unnamed.status).toBe(400);
    expect(unnamed.body.error.reason).toBe('ISSUE_REQUIRED');
  });

  it('hold a scoped key to its scope, and keep the other git routes a person’s', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Scoped',
      start: false,
    });
    const headers = { 'x-test-key-scope': READ_ISSUES };
    const listed = await h.request(
      'GET',
      `/git/pullRequests?issueId=${issue.id}`,
      { user: 'alice', headers },
    );
    expect(listed.status).toBe(200);
    h.github.addPull(REPO, { number: 6, head: { ref: 'fix', sha: 'f1' } });
    const link = await h.request('POST', '/git/pullRequests', {
      user: 'alice',
      headers,
      body: { issueId: issue.id, url: PR_URL(6) },
    });
    expect(link.status).toBe(403);
    const status = await h.request('GET', '/git/status', {
      user: 'alice',
      headers,
    });
    expect(status.status).toBe(403);
    expect(status.body.error.reason).toBe('SCOPED_KEY_FORBIDDEN');
    const { token } = await runOn(['pm.issues/view']);
    const byRun = await h.request('GET', '/git/status', { runToken: token });
    expect(byRun.status).toBe(403);
    expect(byRun.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
  });
});
