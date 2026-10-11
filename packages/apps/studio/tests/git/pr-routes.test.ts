// @vitest-environment node
/**
 * The pull request routes behind `nb-studio pr list|link|open` (`server/git/routes.ts`): a person, a scoped key and an
 * agent's run reach them, each as its narrowed `Viewer`; a run on an issue names none and gets its own. The rest of
 * the git routes stay a person's.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
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
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  const software = (await h.projects.workflows.list(h.viewer('alice'))).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(h.viewer('alice'), software.id);
  h.roles.delete('alice');
});
afterEach(() => h.close());

/** An issue alice owns, executed by an agent with `actions`, and the token of the run it was given. */
async function runOn(actions: readonly string[]) {
  const agentId = await h.createAgent({ actions: [...actions] });
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Fix login',
    executor: { type: 'agent', id: agentId },
  });
  const payload = await h.claimOne();
  return {
    issue,
    agentId,
    token: payload.cli.credential.content.token as string,
  };
}

describe('the pull request routes', () => {
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
