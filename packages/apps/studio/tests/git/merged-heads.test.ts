// @vitest-environment node
/**
 * The head a pull request was merged at (`mergedHeadSha`), which runners take as proof that a working directory's
 * commits were pushed: recorded only from what GitHub confirmed (a merge Studio made, a read of the merged pull
 * request), never from a person's mark, a fork's head, the squash commit, or a later snapshot that disagrees; and filled
 * in by polling for merged pull requests recorded without one, a bounded batch at a time, a failing one not holding the
 * others back.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  MERGED_HEAD_BATCH,
  MERGED_HEAD_RETRY_SECONDS,
} from '../../server/git/service.js';
import {
  findPullRequest,
  findPullRequestById,
  findRepoById,
  insertLink,
  updatePullRequest,
  upsertPullRequest,
  type RepoRow,
} from '../../server/git/store.js';
import type { PullRequestSnapshot } from '../../server/git/platform.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo } from './helpers.js';

const REPO = 'acme/studio';
const PR_URL = (number: number) => `https://github.com/${REPO}/pull/${number}`;
const sha = (n: number) => n.toString(16).padStart(40, 'a');

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  h.roles.set('alice', 'admin');
  await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
  const software = (await h.projects.workflows.list(h.viewer('alice'))).find(
    (workflow) => workflow.builtInKey === 'software',
  )!;
  await h.projects.workflows.setDefault(h.viewer('alice'), software.id);
  h.roles.delete('alice');
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

async function move(issue: Pick<Issue, 'id'>, statusKey: string) {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  return h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
}

async function reviewIssue(title = 'Fix login') {
  const issue = await h.projects.issues.create(alice(), {
    title,
    start: false,
  });
  await move(issue, 'in_progress');
  await move(issue, 'in_review');
  return issue;
}

/** A merged pull request as Studio recorded it before it kept merged heads: linked, merged, no confirmed head. */
async function legacyMerged(repo: RepoRow, issue: Issue, number: number) {
  const conn = h.projects.tx.read();
  const snapshot: PullRequestSnapshot = {
    repo: REPO,
    number,
    url: PR_URL(number),
    title: 'Old work',
    body: null,
    state: 'merged',
    draft: false,
    headRef: `agent/${issue.identifier}-${number}`,
    baseRef: 'main',
    headSha: sha(number),
    authorLogin: 'agent',
    mergeableState: null,
    mergedAt: new Date().toISOString(),
    mergedByLogin: 'bob',
    mergeCommitSha: null,
    closedAt: null,
  };
  const { pr } = await upsertPullRequest(conn, repo.id, snapshot);
  await insertLink(conn, {
    issueId: issue.id,
    pullRequestId: pr.id,
    linkedByType: 'system',
    linkedById: null,
  });
  return { pr, snapshot };
}

describe('merged heads', () => {
  it('records the head a merge from Studio squashed, never the squash commit', async () => {
    const issue = await reviewIssue();
    await connectedRepo(h, REPO);
    h.github.addPull(REPO, { number: 7, head: { ref: 'x', sha: sha(7) } });
    h.github.setStatus(REPO, sha(7), 'success');
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(7),
      { type: 'user', id: 'alice' },
    );
    expect(
      (await findPullRequestById(h.projects.tx.read(), pullRequest.id))
        ?.mergedHeadSha,
    ).toBeNull();

    await h.git.merge(alice(), issue.identifier, pullRequest.id, sha(7));

    const stored = await findPullRequestById(
      h.projects.tx.read(),
      pullRequest.id,
    );
    expect(stored).toMatchObject({
      state: 'merged',
      mergedHeadSha: sha(7),
      mergedHeadSource: 'api',
    });
    expect(stored?.mergeCommitSha).toMatch(/^[0-9a-f]{40}$/u);
    expect(stored?.mergeCommitSha).not.toBe(sha(7));
  });

  it('records the head the merge named when GitHub has not caught up with it yet', async () => {
    const issue = await reviewIssue();
    await connectedRepo(h, REPO);
    h.github.addPull(REPO, { number: 6, head: { ref: 'x', sha: sha(6) } });
    h.github.setStatus(REPO, sha(6), 'success');
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(6),
      { type: 'user', id: 'alice' },
    );
    // The read after the merge fails: Studio stores what it decided, with the head GitHub merged on its word.
    const merge = h.github.merge.bind(h.github);
    h.github.merge = (repo, number, login) => {
      merge(repo, number, login);
      h.github.failures.set(`${REPO}/pulls/6`, 500);
    };
    await h.git.merge(alice(), issue.identifier, pullRequest.id, sha(6));
    expect(
      await findPullRequestById(h.projects.tx.read(), pullRequest.id),
    ).toMatchObject({
      state: 'merged',
      mergedHeadSha: sha(6),
      mergedHeadSource: 'merge',
    });
  });

  it('records none for a pull request a person marked merged', async () => {
    const issue = await reviewIssue();
    await connectedRepo(h, REPO);
    h.github.addPull(REPO, { number: 8, head: { ref: 'y', sha: sha(8) } });
    const { pullRequest } = await h.git.link(
      alice(),
      issue.identifier,
      PR_URL(8),
      { type: 'user', id: 'alice' },
    );
    await h.git.markMerged(alice(), issue.identifier, pullRequest.id);
    expect(
      await findPullRequestById(h.projects.tx.read(), pullRequest.id),
    ).toMatchObject({
      state: 'merged',
      mergedManually: true,
      mergedHeadSha: null,
      mergedHeadSource: null,
    });
  });

  it('keeps a confirmed head through later reads, and stops trusting it when two confirmations disagree', async () => {
    const repo = await connectedRepo(h, REPO);
    const issue = await reviewIssue();
    const { pr, snapshot } = await legacyMerged(repo, issue, 3);
    const conn = h.projects.tx.read();
    await upsertPullRequest(
      conn,
      repo.id,
      snapshot,
      {},
      {
        sha: sha(3),
        source: 'webhook',
      },
    );
    // An older open snapshot, an empty head, or a confirmation of an open pull request change nothing.
    await upsertPullRequest(conn, repo.id, {
      ...snapshot,
      state: 'open',
      headSha: sha(30),
    });
    await upsertPullRequest(
      conn,
      repo.id,
      { ...snapshot, headSha: '' },
      {},
      { sha: '', source: 'api' },
    );
    await upsertPullRequest(
      conn,
      repo.id,
      { ...snapshot, state: 'open' },
      {},
      { sha: sha(31), source: 'api' },
    );
    expect(await findPullRequestById(conn, pr.id)).toMatchObject({
      mergedHeadSha: sha(3),
      mergedHeadSource: 'webhook',
    });

    await upsertPullRequest(
      conn,
      repo.id,
      snapshot,
      {},
      {
        sha: sha(32),
        source: 'api',
      },
    );
    expect(await findPullRequestById(conn, pr.id)).toMatchObject({
      mergedHeadSha: null,
      mergedHeadSource: 'conflict',
    });
    // Only Git sync's own read settles it again.
    await upsertPullRequest(
      conn,
      repo.id,
      snapshot,
      {},
      {
        sha: sha(3),
        source: 'webhook',
      },
    );
    expect(await findPullRequestById(conn, pr.id)).toMatchObject({
      mergedHeadSha: null,
      mergedHeadSource: 'conflict',
    });
    await upsertPullRequest(
      conn,
      repo.id,
      snapshot,
      {},
      {
        sha: sha(3),
        source: 'api',
        reconcile: true,
      },
    );
    expect(await findPullRequestById(conn, pr.id)).toMatchObject({
      mergedHeadSha: sha(3),
      mergedHeadSource: 'api',
    });
  });

  it('fills in merged pull requests recorded without a head while polling, a batch at a time, failures later', async () => {
    const repo = await connectedRepo(h, REPO);
    const issue = await reviewIssue();
    const conn = h.projects.tx.read();
    const numbers = Array.from(
      { length: MERGED_HEAD_BATCH + 3 },
      (_, index) => 100 + index,
    );
    for (const number of numbers) {
      h.github.addPull(REPO, {
        number,
        head: { ref: `w-${number}`, sha: sha(number) },
      });
      h.github.merge(REPO, number, 'bob');
      await legacyMerged(repo, issue, number);
    }
    // One GitHub no longer has, one from a fork, and one GitHub says is still open: none gets a head.
    h.github.failures.set(`${REPO}/pulls/100`, 404);
    h.github.pull(REPO, 101).head.repo = { full_name: 'someone/studio' };
    const reopened = h.github.pull(REPO, 102);
    reopened.state = 'open';
    reopened.merged = false;
    reopened.merged_at = null;

    const confirmed = async () =>
      (
        await Promise.all(
          numbers.map((number) => findPullRequest(conn, repo.id, number)),
        )
      )
        .filter((pr) => pr?.mergedHeadSha === sha(pr.number))
        .map((pr) => pr!.number)
        .sort((a, b) => a - b);

    const before = h.github.requests.length;
    await h.git.pollRepo((await findRepoById(conn, repo.id))!);
    const asked = h.github.requests
      .slice(before)
      .filter((request) => /\/pulls\/\d+$/u.test(request.path));
    expect(asked).toHaveLength(MERGED_HEAD_BATCH);
    const first = await confirmed();
    expect(first.length).toBeGreaterThanOrEqual(MERGED_HEAD_BATCH - 3);
    expect(first.every((number) => number > 102)).toBe(true);

    // The next poll reads only those never asked: one that could not be confirmed waits before it is read again.
    const asked2 = h.github.requests.length;
    await h.git.pollRepo((await findRepoById(conn, repo.id))!);
    expect(
      h.github.requests
        .slice(asked2)
        .filter((request) => /\/pulls\/\d+$/u.test(request.path)),
    ).toHaveLength(3);
    expect(await confirmed()).toEqual(numbers.slice(3));
    expect(await findPullRequest(conn, repo.id, 102)).toMatchObject({
      state: 'merged',
      mergedHeadSha: null,
    });

    // Once that wait is over they are read again, the oldest attempts first.
    h.github.failures.delete(`${REPO}/pulls/100`);
    for (const number of [100, 101, 102]) {
      const pr = await findPullRequest(conn, repo.id, number);
      await updatePullRequest(conn, pr!.id, {
        mergedHeadCheckedAt: new Date(
          Date.now() - (MERGED_HEAD_RETRY_SECONDS + 60) * 1000,
        ),
      });
    }
    await h.git.pollRepo((await findRepoById(conn, repo.id))!);
    expect(await confirmed()).toEqual([100, ...numbers.slice(3)]);
    expect(await findPullRequest(conn, repo.id, 101)).toMatchObject({
      mergedHeadSha: null,
    });
  });
});
