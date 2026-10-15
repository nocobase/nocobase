// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findPullRequestById } from '../../server/git/store.js';
import { previewLabelState } from '../../server/previews/preferences.js';
import { hasLivePreviews } from '../../server/previews/store.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo, tokenConnection } from './helpers.js';

const REPO = 'acme/preview-lifecycle';
let h: BridgeHarness;

beforeEach(async () => {
  h = await createBridgeHarness({ previews: true, releases: true });
  await h.addUser('alice');
});
afterEach(async () => {
  vi.restoreAllMocks();
  await h.close();
});

async function setup() {
  const repo = await connectedRepo(h, REPO, await tokenConnection(h));
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Preview label lifecycle',
    start: false,
  });
  h.github.addPull(REPO, { number: 1, labels: [{ name: 'keep-me' }] });
  expect(
    (
      await h.request('POST', '/git/pullRequests', {
        user: 'alice',
        body: { issueId: issue.id, url: `https://github.com/${REPO}/pull/1` },
      })
    ).status,
  ).toBe(201);
  const pr = (await h.git.list(h.viewer('alice'), issue.id)).data[0]!;
  expect(
    (
      await h.request('POST', '/previews/preference', {
        user: 'alice',
        body: { issueId: issue.id, notRequired: true },
      })
    ).status,
  ).toBe(200);
  expect(labels()).toEqual(['keep-me', 'no-preview']);
  expect(await hasLivePreviews(h.projects.tx.read(), REPO)).toBe(false);
  return { repo, issue, pr };
}

async function unlink(issueId: string, pullRequestId: string) {
  expect(
    (
      await h.request(
        'DELETE',
        `/git/pullRequests/${pullRequestId}?issueId=${issueId}`,
        { user: 'alice' },
      )
    ).status,
  ).toBe(204);
  expect((await h.git.list(h.viewer('alice'), issueId)).data).toEqual([]);
}

const labels = () => h.github.pull(REPO, 1).labels?.map((label) => label.name);

describe('preview labels after the last issue is unlinked', () => {
  it.each(['closed', 'merged'] as const)(
    'stores the %s state and stops reading or changing its labels',
    async (state) => {
      const { repo, issue, pr } = await setup();
      await unlink(issue.id, pr.id);
      expect(labels()).toEqual(['keep-me']);

      const { auth } = await h.gitConnections.connectionAuth(repo);
      if (state === 'merged') {
        await h.github.platform.mergePullRequest(auth, REPO, 1, {
          sha: h.github.pull(REPO, 1).head.sha,
          commitTitle: 'Merge the change',
        });
      } else {
        await h.github.platform.updatePullRequest(auth, REPO, 1, {
          state: 'closed',
        });
      }
      // Someone labels the finished PR before Studio has observed its terminal state.
      await h.github.platform.addPullRequestLabel(auth, REPO, 1, 'no-preview');
      const before = h.github.requests.length;
      await h.git.pollRepo(repo);
      expect(
        await findPullRequestById(h.projects.tx.read(), pr.id),
      ).toMatchObject({ state });
      expect(labels()).toEqual(['keep-me', 'no-preview']);
      expect(
        h.github.requests
          .slice(before)
          .filter((request) => request.path === `/repos/${REPO}/pulls/1`),
      ).toHaveLength(1);

      const after = h.github.requests.length;
      for (let tick = 0; tick < 3; tick++) await h.git.pollRepo(repo);
      expect(
        h.github.requests
          .slice(after)
          .filter(
            (request) =>
              request.path.startsWith(`/repos/${REPO}/pulls/1`) ||
              request.path.startsWith(`/repos/${REPO}/issues/1/labels`),
          ),
      ).toEqual([]);
      expect(labels()).toEqual(['keep-me', 'no-preview']);
      expect(
        await previewLabelState(h.projects.tx.read(), pr.id),
      ).toMatchObject({ managed: true });
    },
  );

  it('retries a failed removal while the unlinked PR remains open', async () => {
    const { repo, issue, pr } = await setup();
    vi.spyOn(h.github.platform, 'removePullRequestLabel').mockRejectedValueOnce(
      new Error('Offline'),
    );
    await unlink(issue.id, pr.id);
    expect(labels()).toEqual(['keep-me', 'no-preview']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      failed: true,
    });

    await h.git.pollRepo(repo);
    expect(labels()).toEqual(['keep-me']);
    expect(
      await findPullRequestById(h.projects.tx.read(), pr.id),
    ).toMatchObject({ state: 'open' });
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      present: false,
      failed: false,
    });
  });
});
