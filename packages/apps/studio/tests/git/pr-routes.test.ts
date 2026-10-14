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
async function runOn(actions: readonly string[]) {
  const agentId = await h.createAgent({ actions: [...actions] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Fix login',
    executor: null,
    statusKey: 'in_progress',
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
  it('unlinks through run identity and write-scoped keys, rejects read scope and revoked identity', async () => {
    const { issue, token } = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 21 });
    const linked = await h.git.link(h.viewer('alice'), issue.id, PR_URL(21), {
      type: 'user',
      id: 'alice',
    });
    const endpoint = `/git/pullRequests/${linked.pullRequest.id}?issueId=${issue.id}`;
    expect(
      (
        await h.request('DELETE', endpoint, {
          user: 'alice',
          headers: { 'x-test-key-scope': READ_ISSUES },
        })
      ).status,
    ).toBe(403);
    h.roles.set('alice', 'none');
    expect(
      (await h.request('DELETE', endpoint, { runToken: token })).status,
    ).toBe(403);
    h.roles.set('alice', 'member');
    expect(
      (await h.request('DELETE', endpoint, { runToken: token })).status,
    ).toBe(204);
    await h.git.link(h.viewer('alice'), issue.id, PR_URL(21), {
      type: 'user',
      id: 'alice',
    });
    expect(
      (
        await h.request('DELETE', endpoint, {
          user: 'alice',
          headers: {
            'x-test-key-scope': JSON.stringify({
              'projects.issues': { level: 'write' },
            }),
          },
        })
      ).status,
    ).toBe(204);
    expect((await h.git.list(h.viewer('alice'), issue.id)).data).toHaveLength(
      0,
    );
    expect(h.github.pull(REPO, 21).state).toBe('open');
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

  it('links with identity permission despite missing legacy actions and rejects a read-scoped open', async () => {
    const viewOnly = await runOn(['pm.issues/view']);
    h.github.addPull(REPO, { number: 4, head: { ref: 'fix', sha: 'd1' } });
    const link = await h.request('POST', '/git/pullRequests', {
      runToken: viewOnly.token,
      body: { url: PR_URL(4) },
    });
    expect(link.status).toBe(201);
    const open = await h.request('POST', '/git/pullRequests/open', {
      user: 'alice',
      headers: { 'x-test-key-scope': READ_ISSUES },
      body: { issueId: viewOnly.issue.id, title: 'Fix' },
    });
    expect(open.status).toBe(403);
  });

  it('reads with identity permission and denies after identity revocation', async () => {
    const { token } = await runOn(['pm.issues/comment']);
    const listed = await h.request('GET', '/git/pullRequests', {
      runToken: token,
    });
    expect(listed.status).toBe(200);
    h.roles.set('alice', 'none');
    const denied = await h.request('GET', '/git/pullRequests', {
      runToken: token,
    });
    expect(denied.status).toBe(403);
    expect(denied.body.error.reason).toBe('RUN_ACTION_FORBIDDEN');
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
