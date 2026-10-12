// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBranches } from '../../server/git/run-git.js';
import { snapshotFromPayload } from '../../server/git/github.js';
import {
  insertLink,
  upsertPullRequest,
  updateRepo,
  LINKS,
  PULL_REQUESTS,
} from '../../server/git/store.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { bindingOf, connectedRepo } from './helpers.js';

const REPO = 'acme/studio';
let h: BridgeHarness;
let repoId: string;
let dirs: {
  id: string;
  binding: ReturnType<typeof bindingOf>;
  defaultRef: string;
}[];
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  const repo = await connectedRepo(h, REPO);
  repoId = repo.id;
  dirs = [
    {
      id: 'work',
      binding: bindingOf((await h.gitConnections.list())[0], REPO),
      defaultRef: 'main',
    },
  ];
});
afterEach(() => h.close());

async function link(
  number: number,
  options: {
    headRepo?: string | null;
    state?: 'open' | 'closed' | 'merged';
    draft?: boolean;
    head?: string;
    time?: string;
  } = {},
) {
  const { pr } = await upsertPullRequest(
    h.database.connection(),
    repoId,
    snapshotFromPayload(
      {
        state: options.state === 'closed' ? 'closed' : 'open',
        merged: options.state === 'merged',
        draft: options.draft,
        head: {
          ref: options.head ?? `fix/human-${number}`,
          sha: 'a',
          repo:
            options.headRepo === null
              ? null
              : { full_name: options.headRepo ?? REPO },
        },
        base: { ref: 'v3-develop' },
      },
      REPO,
      number,
    ),
  );
  await insertLink(h.database.connection(), {
    issueId: 'issue',
    pullRequestId: pr.id,
    linkedByType: 'user',
    linkedById: 'alice',
  });
  await h.database
    .connection()
    .query.updateTable(LINKS)
    .set({ createdAt: new Date(options.time ?? '2026-10-01T00:00:00Z') })
    .where('pullRequestId', '=', pr.id)
    .execute();
  return pr;
}
const selected = async () =>
  (await runBranches(h.database.connection(), dirs, 'PM-294', 'issue')).get(
    'work',
  );

describe('issue PR branch selection', () => {
  it('preserves default and custom branch rules without an eligible PR', async () => {
    expect(await selected()).toEqual({ branch: 'agent/PM-294' });
    await updateRepo(h.database.connection(), repoId, {
      branchRules: ['fix/{key}'],
    });
    expect(await selected()).toEqual({ branch: 'fix/PM-294' });
  });
  it('selects the earliest association, ties by ascending PR number, including drafts', async () => {
    await link(9, { time: '2026-10-02T00:00:00Z' });
    await link(3);
    const first = await link(2, { draft: true });
    expect(await selected()).toEqual({
      branch: 'fix/human-2',
      base: 'v3-develop',
      pullRequest: { number: 2, url: first.url },
    });
  });
  it('excludes closed, merged, default/base heads, forks and unknown origins, also in a mixed set', async () => {
    await link(1, { state: 'closed' });
    await link(2, { state: 'merged' });
    await link(3, { head: 'main' });
    await link(4, { head: 'v3-develop' });
    const fork = await link(5, { headRepo: 'other/studio' });
    const unknown = await link(6, { headRepo: null });
    const exclusions = [
      { number: 5, url: fork.url, reason: 'fork' },
      { number: 6, url: unknown.url, reason: 'unknown' },
    ];
    expect(await selected()).toEqual({
      branch: 'agent/PM-294',
      excludedPullRequests: exclusions,
    });
    await link(7);
    expect(await selected()).toMatchObject({
      branch: 'fix/human-7',
      excludedPullRequests: exclusions,
    });
  });
  it('selects a legacy unknown record after the existing refresh path updates its snapshot', async () => {
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Legacy PR',
      start: false,
    });
    h.github.addPull(REPO, {
      number: 11,
      head: { ref: 'fix/human', sha: 'a', repo: { full_name: REPO } },
    });
    await h.git.link(
      h.viewer('alice'),
      issue.id,
      `https://github.com/${REPO}/pull/11`,
      { type: 'user', id: 'alice' },
    );
    const conn = h.database.connection();
    const pr = await conn.query
      .selectFrom(PULL_REQUESTS)
      .selectAll()
      .where('number', '=', 11)
      .executeTakeFirstOrThrow();
    await conn.query
      .updateTable(PULL_REQUESTS)
      .set({ headRepo: null })
      .where('id', '=', pr.id)
      .execute();
    expect(
      (await runBranches(conn, dirs, issue.identifier, issue.id)).get('work'),
    ).not.toHaveProperty('pullRequest');
    await h.git.refresh(h.viewer('alice'), issue.id, String(pr.id));
    expect(
      (await runBranches(conn, dirs, issue.identifier, issue.id)).get('work'),
    ).toMatchObject({ branch: 'fix/human', pullRequest: { number: 11 } });
  });
});
