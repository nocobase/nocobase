// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPreviewLabelSync } from '../../server/git/preview-labels.js';
import type { RepoRow } from '../../server/git/store.js';
import {
  previewLabelSnapshot,
  previewLabelState,
  savePreviewLabelSnapshot,
  setPreviewNotRequired,
} from '../../server/previews/preferences.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo, tokenConnection } from './helpers.js';

const REPO = 'acme/concurrent-preview';
const actor = { type: 'user' as const, id: 'alice' };
let h: BridgeHarness;

beforeEach(async () => {
  h = await createBridgeHarness({ previews: true, releases: true });
  await h.addUser('alice');
});
afterEach(async () => {
  vi.restoreAllMocks();
  await h.close();
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function readAuth(repo: RepoRow) {
  return (await h.gitConnections.connectionAuth(repo)).auth;
}

/** Another Studio process: shared persistent state and GitHub, but no shared synchronization queue. */
function anotherInstance(auth = readAuth) {
  return createPreviewLabelSync({
    conn: () => h.projects.tx.read(),
    platformOf: () => h.github.platform,
    readAuth: auth,
  });
}

async function setup() {
  const repo = await connectedRepo(h, REPO, await tokenConnection(h));
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Concurrent preview preference',
    start: false,
  });
  h.github.addPull(REPO, { number: 1, labels: [{ name: 'keep-me' }] });
  const { pullRequest: pr } = await h.git.link(
    h.viewer('alice'),
    issue.id,
    `https://github.com/${REPO}/pull/1`,
    actor,
  );
  return { repo, issue, pr };
}

const labels = () => h.github.pull(REPO, 1).labels?.map((label) => label.name);

describe('preview labels across Studio instances', () => {
  it('does not release ownership when an unmanaged snapshot is the last database writer', async () => {
    const { issue, pr, repo } = await setup();
    const conn = h.projects.tx.read();
    const stale = await previewLabelSnapshot(conn, pr.id);
    expect(stale.managed).toBe(false);
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
    // An instance can finish reading preferences before another instance adds the label, then save last.
    await savePreviewLabelSnapshot(conn, stale);
    expect((await previewLabelState(conn, pr.id)).managed).toBe(true);
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
    await h.git.pollRepo(repo);
    expect(labels()).toEqual(['keep-me']);
  });

  it('keeps ownership when an older synchronization resumes after another instance adds the label', async () => {
    const { issue, pr, repo } = await setup();
    const started = deferred();
    const resume = deferred();
    const other = anotherInstance(async (row) => {
      started.resolve();
      await resume.promise;
      return readAuth(row);
    });
    const stale = other.sync(pr.id);
    await started.promise;
    try {
      await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
      expect(labels()).toEqual(['keep-me', 'no-preview']);
    } finally {
      resume.resolve();
      await stale;
    }

    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      present: true,
      failed: false,
    });
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
    await h.git.pollRepo(repo);
    expect(labels()).toEqual(['keep-me']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      present: false,
      failed: false,
    });
  });

  it.each([false, true])(
    'removes an ADD that completes after another instance requires previews (lost response: %s)',
    async (loseResponse) => {
      const { issue, pr, repo } = await setup();
      const started = deferred();
      const resume = deferred();
      const original = h.github.platform.addPullRequestLabel.bind(
        h.github.platform,
      );
      vi.spyOn(h.github.platform, 'addPullRequestLabel').mockImplementationOnce(
        async (...args) => {
          started.resolve();
          await resume.promise;
          await original(...args);
          if (loseResponse)
            throw new Error('Timed out after GitHub accepted the label.');
        },
      );
      await setPreviewNotRequired(h.projects.tx.read(), issue.id, true);
      const adding = anotherInstance().syncIssue(issue.id);
      await started.promise;
      try {
        await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
        expect(labels()).toEqual(['keep-me']);
      } finally {
        resume.resolve();
        await adding;
      }

      expect(labels()).toEqual(['keep-me', 'no-preview']);
      expect(
        await previewLabelState(h.projects.tx.read(), pr.id),
      ).toMatchObject({
        managed: true,
        failed: loseResponse,
      });
      await h.git.pollRepo(repo);
      expect(labels()).toEqual(['keep-me']);
      expect(
        await previewLabelState(h.projects.tx.read(), pr.id),
      ).toMatchObject({
        managed: true,
        present: false,
        failed: false,
      });
    },
  );

  it('restores a label when a REMOVE completes after another instance opts out of previews', async () => {
    const { issue, pr, repo } = await setup();
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
    const started = deferred();
    const resume = deferred();
    const original = h.github.platform.removePullRequestLabel.bind(
      h.github.platform,
    );
    vi.spyOn(
      h.github.platform,
      'removePullRequestLabel',
    ).mockImplementationOnce(async (...args) => {
      started.resolve();
      await resume.promise;
      return original(...args);
    });
    await setPreviewNotRequired(h.projects.tx.read(), issue.id, false);
    const removing = anotherInstance().syncIssue(issue.id);
    await started.promise;
    try {
      await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
      expect(labels()).toEqual(['keep-me', 'no-preview']);
    } finally {
      resume.resolve();
      await removing;
    }

    expect(labels()).toEqual(['keep-me']);
    await h.git.pollRepo(repo);
    expect(labels()).toEqual(['keep-me', 'no-preview']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      present: true,
      failed: false,
    });
  });

  it('revalidates a delayed 304 after another instance observes a manual label', async () => {
    const { issue, pr, repo } = await setup();
    const started = deferred();
    const resume = deferred();
    let notModified: boolean | undefined;
    const original = h.github.platform.getPullRequest.bind(h.github.platform);
    vi.spyOn(h.github.platform, 'getPullRequest').mockImplementationOnce(
      async (...args) => {
        const response = await original(...args);
        notModified = response.notModified;
        started.resolve();
        await resume.promise;
        return response;
      },
    );
    const stale = anotherInstance().sync(pr.id);
    await started.promise;
    try {
      expect(notModified).toBe(true);
      await h.github.platform.addPullRequestLabel(
        await readAuth(repo),
        REPO,
        1,
        'no-preview',
      );
      await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
      expect(
        await previewLabelState(h.projects.tx.read(), pr.id),
      ).toMatchObject({
        managed: false,
        present: true,
      });
    } finally {
      resume.resolve();
      await stale;
    }

    await h.git.pollRepo(repo);
    expect(labels()).toEqual(['keep-me', 'no-preview']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: false,
      present: true,
      failed: false,
    });
  });
});
