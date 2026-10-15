// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { createBridgeHarness } from '../agents/bridge-harness.js';
import { connectedRepo, signBody } from './helpers.js';
import { createWebhookRouter } from '../../server/git/routes.js';
import {
  createGitSecrets,
  GIT_SECRET_PURPOSES,
} from '../../server/git/sealing.js';
import { TEST_SECRETS } from '../agents/bridge-harness.js';
import { updateRepo, findPullRequest } from '../../server/git/store.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
let h: Awaited<ReturnType<typeof createBridgeHarness>>;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});
it.each(['moved', 'closed', 'same'] as const)(
  'checks response revalidates the current PR: %s',
  async (change) => {
    h = await createBridgeHarness();
    await h.addUser('alice');
    await h.createAgent();
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Head race',
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
      start: false,
    });
    const repo = await connectedRepo(h, 'acme/studio');
    const secret = 'review-webhook-fixture-only';
    await updateRepo(h.projects.tx.read(), repo.id, {
      webhookSecretSealed: createGitSecrets(TEST_SECRETS).seal(
        secret,
        GIT_SECRET_PURPOSES.repoWebhookSecret,
        [repo.id],
      ),
    });
    h.github.addPull('acme/studio', {
      number: 77,
      head: { ref: 'feature', sha: 'old' },
    });
    const { pullRequest } = await h.git.link(
      viewer,
      issue.id,
      'https://github.com/acme/studio/pull/77',
      { type: 'user', id: 'alice' },
    );
    h.github.setCheck('acme/studio', 'old', {
      name: 'test',
      status: 'completed',
      conclusion: 'success',
    });
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>((r) => {
      enter = r;
    });
    const released = new Promise<void>((r) => {
      release = r;
    });
    let paused = false;
    const original = h.github.platform.getChecks.bind(h.github.platform);
    vi.spyOn(h.github.platform, 'getChecks').mockImplementation(
      async (...args) => {
        const result = await original(...args);
        if (args[2] === 'old' && !paused) {
          paused = true;
          enter();
          await released;
        }
        return result;
      },
    );
    const body = JSON.stringify({
      sha: 'old',
      state: 'success',
      repository: { full_name: 'acme/studio' },
    });
    const incoming = createWebhookRouter(h.git.receiveWebhook).request(
      `/webhooks/github/repositories/${repo.id}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-github-event': 'status',
          'x-github-delivery': 'review-head-race',
          'x-hub-signature-256': signBody(secret, body),
        },
        body,
      },
    );
    await entered;
    if (change === 'moved') h.github.pull('acme/studio', 77).head.sha = 'new';
    if (change === 'closed') h.github.pull('acme/studio', 77).state = 'closed';
    h.github.setCheck('acme/studio', 'new', {
      name: 'test',
      status: 'in_progress',
      conclusion: null,
    });
    if (change !== 'same')
      await h.git.refresh(viewer, issue.id, pullRequest.id);
    expect(
      (await findPullRequest(h.projects.tx.read(), repo.id, 77))?.headSha,
    ).toBe(change === 'moved' ? 'new' : 'old');
    const changesBeforeResponse = h.gitChanges.length;
    release();
    expect((await incoming).status).toBe(200);
    const stored = await findPullRequest(h.projects.tx.read(), repo.id, 77);
    const runs = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    const signals = (
      await Promise.all(runs.map((r) => h.agents.runs.detail(r.id)))
    )
      .flatMap((r) => r.inputs)
      .filter(
        (i) => (i.payload as { trigger?: string }).trigger === 'prChecksPassed',
      )
      .map((i) => (i.payload as { headSha?: string }).headSha);
    expect(stored).toMatchObject(
      change === 'moved'
        ? { headSha: 'new', ciState: 'pending', state: 'open' }
        : change === 'closed'
          ? { headSha: 'old', state: 'closed' }
          : { headSha: 'old', ciState: 'success', state: 'open' },
    );
    expect(signals).toEqual(change === 'same' ? ['old'] : []);
    expect(h.gitChanges.slice(changesBeforeResponse)).toEqual(
      change === 'same' ? [pullRequest.id] : [],
    );
  },
  120000,
);
