// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import {
  bindingOf,
  connectedRepo,
  mentionAgent,
  tokenConnection,
} from './helpers.js';
import { runBranches } from '../../server/git/run-git.js';
import { updateRepo } from '../../server/git/store.js';

const REPO = 'acme/studio';
let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
});
afterEach(() => h.close());

async function setup() {
  h.roles.set('alice', 'admin');
  const connection = await tokenConnection(h);
  const repo = await connectedRepo(h, REPO, connection);
  const project = await h.projects.projects.create(h.viewer('alice'), {
    name: 'Code',
  });
  const resource = await h.projects.projects.addResource(
    h.viewer('alice'),
    project.id,
    {
      type: 'gitRepo',
      url: `https://github.com/${REPO}.git`,
      defaultRef: 'main',
      binding: bindingOf(connection, REPO, repo.id),
    },
  );
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Branch selection',
    projectId: project.id,
    statusKey: 'in_progress',
    start: false,
  });
  const repos = [
    { id: resource.id, binding: bindingOf(connection, REPO, repo.id) },
  ];
  const select = async () =>
    runBranches(h.projects.tx.read(), repos, issue.identifier, {
      issueId: issue.id,
      heads: await h.git.checkoutPullRequests(issue.id),
    });
  const link = async (
    number: number,
    source: string | null = REPO,
    branch = `fix/pr-${number}`,
  ) => {
    h.github.addPull(REPO, {
      number,
      head: {
        ref: branch,
        sha: `head-${number}`,
        repo: source ? { full_name: source } : null,
      },
    });
    return (
      await h.git.link(
        h.viewer('alice'),
        issue.id,
        `https://github.com/${REPO}/pull/${number}`,
        { type: 'user', id: 'alice' },
      )
    ).pullRequest;
  };
  return { repo, issue, resource, repos, select, link };
}

describe('initial checkout branch selection', () => {
  it('uses the default or configured branch rule without a qualified PR', async () => {
    const s = await setup();
    expect((await s.select()).get(s.resource.id)).toBe(
      `agent/${s.issue.identifier}`,
    );
    await updateRepo(h.projects.tx.read(), s.repo.id, {
      branchRules: ['fix/{key}'],
    });
    expect((await s.select()).get(s.resource.id)).toBe(
      `fix/${s.issue.identifier}`,
    );
  });

  it('passes a human PR branch through the real claim payload', async () => {
    const s = await setup();
    await s.link(17, REPO, 'fix/human-work');
    const agent = await h.createAgent();
    await mentionAgent(h, 'alice', s.issue.id, agent);
    const payload = await h.claimOne();
    expect(payload.workspace.dirs[0]).toMatchObject({
      branch: 'fix/human-work',
    });
    expect(payload.prompt.system).toContain(
      'starting from target branch `fix/human-work`',
    );
    h.github.pushCommits(REPO, 'fix/switched-head', 'switched-commit');
    const token = payload.cli.credential.content.token as string;
    const opened = await h.request('POST', '/git/pullRequests/open', {
      runToken: token,
      body: { title: 'fix: switched branch', head: 'fix/switched-head' },
    });
    expect(opened.status).toBe(201);
    expect(opened.body.data.headRef).toBe('fix/switched-head');
    expect(
      (
        await h.request(
          'DELETE',
          `/git/pullRequests/${opened.body.data.id}?issueId=${s.issue.id}`,
          { runToken: token },
        )
      ).status,
    ).toBe(204);
    expect((await s.select()).get(s.resource.id)).toBe('fix/human-work');
  });

  it('sorts by earliest association then PR number, independent of update time', async () => {
    const s = await setup();
    const first = await s.link(30);
    const second = await s.link(10);
    await h.projects.tx
      .read()
      .query.updateTable('studioIssuePullRequests')
      .set({ createdAt: new Date('2026-01-01T00:00:00Z') })
      .where('pullRequestId', '=', first.id)
      .execute();
    await h.projects.tx
      .read()
      .query.updateTable('studioIssuePullRequests')
      .set({ createdAt: new Date('2026-01-02T00:00:00Z') })
      .where('pullRequestId', '=', second.id)
      .execute();
    expect((await s.select()).get(s.resource.id)).toBe('fix/pr-30');
    await h.projects.tx
      .read()
      .query.updateTable('studioIssuePullRequests')
      .set({ createdAt: new Date('2026-01-01T00:00:00Z') })
      .where('pullRequestId', '=', second.id)
      .execute();
    expect((await s.select()).get(s.resource.id)).toBe('fix/pr-10');
  });

  it('excludes forks, unknown sources and freshly closed PRs even with matching branch names', async () => {
    const s = await setup();
    await s.link(1, 'fork/studio', 'fix/same-name');
    await s.link(2, null, 'fix/same-name');
    await s.link(3, REPO, 'fix/closed');
    h.github.pull(REPO, 3).state = 'closed';
    expect((await s.select()).get(s.resource.id)).toBe(
      `agent/${s.issue.identifier}`,
    );
    await s.link(4, REPO, 'fix/eligible');
    expect((await s.select()).get(s.resource.id)).toBe('fix/eligible');
  });

  it('rechecks associations during assembly and falls back when live source cannot be read', async () => {
    const s = await setup();
    const pr = await s.link(8);
    const heads = await h.git.checkoutPullRequests(s.issue.id);
    await h.git.unlink(h.viewer('alice'), s.issue.id, pr.id);
    expect(
      (
        await runBranches(h.projects.tx.read(), s.repos, s.issue.identifier, {
          issueId: s.issue.id,
          heads,
        })
      ).get(s.resource.id),
    ).toBe(`agent/${s.issue.identifier}`);
    await s.link(9);
    h.github.tokens.clear();
    h.github.tokens.add('unrelated-token');
    expect((await s.select()).get(s.resource.id)).toBe(
      `agent/${s.issue.identifier}`,
    );
  });
});
