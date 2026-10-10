// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { connectedRepo, tokenConnection } from './helpers.js';
import { previewLabelState } from '../../server/previews/preferences.js';

const REPO = 'acme/preview';
let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness({ previews: true, releases: true });
  await h.addUser('alice');
});
afterEach(async () => {
  vi.restoreAllMocks();
  await h.close();
});
const actor = { type: 'user' as const, id: 'alice' };
async function setup() {
  const connection = await tokenConnection(h);
  const repo = await connectedRepo(h, REPO, connection);
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Preview choice',
    start: false,
  });
  h.github.addPull(REPO, { number: 1, labels: [{ name: 'keep-me' }] });
  return { repo, issue };
}
async function link(issueId: string) {
  return (
    await h.git.link(
      h.viewer('alice'),
      issueId,
      `https://github.com/${REPO}/pull/1`,
      actor,
    )
  ).pullRequest;
}
const labels = () => h.github.pull(REPO, 1).labels?.map((label) => label.name);

describe('issue preview preferences', () => {
  it('default to previews and synchronize both directions without changing other labels', async () => {
    const { issue } = await setup();
    expect(
      (await h.previewApi!.read(h.viewer('alice'), issue.id)).notRequired,
    ).toBe(false);
    const pr = await link(issue.id);
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
    expect(labels()).toEqual(['keep-me', 'no-preview']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: true,
      present: true,
      failed: false,
    });
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
    expect(labels()).toEqual(['keep-me']);
  });
  it('requires every linked issue and recomputes after linking and unlinking', async () => {
    const { issue } = await setup();
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
    const pr = await link(issue.id);
    expect(labels()).toContain('no-preview');
    const other = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Needs preview',
      start: false,
    });
    await link(other.id);
    expect(labels()).not.toContain('no-preview');
    await h.git.unlink(h.viewer('alice'), other.id, pr.id);
    expect(labels()).toContain('no-preview');
    await h.git.unlink(h.viewer('alice'), issue.id, pr.id);
    expect(labels()).not.toContain('no-preview');
  });
  it('preserves a label that a person added before Studio managed it', async () => {
    const { issue } = await setup();
    h.github.pull(REPO, 1).labels = [{ name: 'no-preview' }];
    const pr = await link(issue.id);
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, true);
    await h.previewApi!.setPreference(h.viewer('alice'), issue.id, false);
    expect(labels()).toEqual(['no-preview']);
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      managed: false,
      present: true,
    });
  });
  it('saves failed synchronization and the poller retries it from the latest preference', async () => {
    const { issue, repo } = await setup();
    const pr = await link(issue.id);
    const add = vi
      .spyOn(h.github.platform, 'addPullRequestLabel')
      .mockRejectedValueOnce(new Error('Offline'));
    const saved = await h.previewApi!.setPreference(
      h.viewer('alice'),
      issue.id,
      true,
    );
    expect(saved.notRequired).toBe(true);
    expect(saved.labels?.[0]?.failed).toBe(true);
    expect(add).toHaveBeenCalledOnce();
    await h.git.pollRepo(repo);
    expect(labels()).toContain('no-preview');
    expect(await previewLabelState(h.projects.tx.read(), pr.id)).toMatchObject({
      failed: false,
      present: true,
    });
  });
  it('queues a newer toggle behind an in-flight label write', async () => {
    const { issue } = await setup();
    await link(issue.id);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = h.github.platform.addPullRequestLabel.bind(
      h.github.platform,
    );
    const add = vi
      .spyOn(h.github.platform, 'addPullRequestLabel')
      .mockImplementationOnce(async (...args) => {
        await gate;
        return original(...args);
      });
    const first = h.previewApi!.setPreference(
      h.viewer('alice'),
      issue.id,
      true,
    );
    await vi.waitFor(() => expect(add).toHaveBeenCalledOnce());
    const second = h.previewApi!.setPreference(
      h.viewer('alice'),
      issue.id,
      false,
    );
    release();
    await Promise.all([first, second]);
    expect(labels()).not.toContain('no-preview');
  });
});
