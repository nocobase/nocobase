// @vitest-environment node
/**
 * Deployment marks over a real database, with release management on an in-memory driver and the repository on the
 * GitHub stand-in: a deployment to the staging App a repository links marks the issues whose commits it contains (Studio
 * asks the host's compare API, a squash-merged issue by its merge commit); every later deployment checks the marks
 * again, renewing what it contains and withdrawing what it does not (an older release, a rollback) with a reopen
 * suggestion; a check a newer deployment overtook decides nothing; and the unreleased list and reminder follow
 * production.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { SYSTEM_CALLER } from '@nocobase/app-plugin-releases/server';
import { allPermissions } from '@nocobase/app-plugin-releases/shared/access';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SOFTWARE_TEMPLATE } from '../../server/agents/catalog/workflow-templates.js';
import {
  ensureRepo,
  insertLink,
  upsertPullRequest,
} from '../../server/git/store.js';
import { API, bindingOf, tokenConnection } from '../git/helpers.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { createArtifact } from '../releases/fixtures.js';

const FULL_NAME = 'acme/app';
const REPO = `https://github.com/${FULL_NAME}.git`;
const SHA1 = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const SHA2 = 'b1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const MAIN1 = 'c1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const MAIN2 = 'd1b2c3d4e5f60718293a4b5c6d7e8f9012345678';

let h: BridgeHarness;
let dir: string;
let projectId: string;
let resourceId: string;

const alice = () => h.viewer('alice');
const asPerson = (userId: string) => ({
  userId,
  kind: 'human' as const,
  permissions: allPermissions(),
});

async function waitFor<T>(
  read: () => Promise<T>,
  ok: (value: T) => boolean,
  what: string,
): Promise<T> {
  const deadline = Date.now() + 5000;
  for (;;) {
    const value = await read();
    if (ok(value)) return value;
    if (Date.now() > deadline)
      throw new Error(
        `Timed out waiting for ${what}: ${JSON.stringify(value)}`,
      );
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function asAdmin<T>(run: () => Promise<T>): Promise<T> {
  h.roles.set('alice', 'admin');
  try {
    return await run();
  } finally {
    h.roles.delete('alice');
  }
}

async function move(issue: Issue, statusKey: string): Promise<Issue> {
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  const result = await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    statusKey,
  });
  return result.issue;
}

/** An issue an agent worked on, whose run pushed `sha` to the repository. */
async function pushedIssue(title: string, sha: string): Promise<Issue> {
  const agentId = await h.createAgent({ name: `Coder ${title}` });
  const issue = await h.projects.issues.create(alice(), {
    title,
    projectId,
  });
  const current = await h.projects.issueQueries.detail(alice(), issue.id);
  await h.projects.issues.update(alice(), issue.id, {
    revision: current.revision,
    executor: { type: 'agent', id: agentId },
  });
  const payload = await h.claimOne();
  await h.runner(RUNNER_ROUTES.start, payload.run.id, {
    workDir: '/tmp/w',
    adapter: { kind: 'claude' },
    acceptsInput: false,
  });
  const done = await h.runner(RUNNER_ROUTES.complete, payload.run.id, {
    summary: 'Done.',
    handledInputIds: payload.inputs.map((input: { id: string }) => input.id),
    repos: [
      {
        url: REPO,
        branch: `agent/${issue.identifier}`,
        pushed: true,
        headSha: sha,
      },
    ],
  });
  expect(done.status).toBe(200);
  return (await h.projects.issueQueries.detail(alice(), issue.id)) as Issue;
}

beforeEach(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'studio-previews-'));
  h = await createBridgeHarness({ releases: true, previews: true });
  for (const id of ['alice', 'bob']) await h.addUser(id);
  const releases = h.releases!;
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'preview',
    name: 'Preview',
    driver: 'fake',
    config: {},
    publicUrl: '/{appId}/',
  });
  await releases.environments.create(SYSTEM_CALLER, {
    id: 'staging',
    name: 'Staging',
    driver: 'fake',
    config: {},
  });
  await releases.releases.createApp(asPerson('alice'), {
    id: 'app-staging',
    name: 'App staging',
    environmentId: 'staging',
  });
  await asAdmin(async () => {
    if (!(await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE)))
      throw new Error('The Software development template did not install.');
    const software = (await h.projects.workflows.list(alice())).find(
      (workflow) => workflow.builtInKey === 'software',
    )!;
    await h.projects.workflows.setDefault(alice(), software.id);
  });
  const project = await h.projects.projects.create(alice(), {
    name: 'Acme',
    visibility: 'members',
  });
  projectId = project.id;
  h.github.addRepo(FULL_NAME);
  resourceId = await asAdmin(async () => {
    const connection = await tokenConnection(h);
    return (
      await h.projects.projects.addResource(alice(), projectId, {
        type: 'gitRepo',
        url: REPO,
        label: 'app',
        defaultRef: 'main',
        binding: bindingOf(connection, FULL_NAME),
      } as never)
    ).id;
  });
  await h.links!.save(
    { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
    resourceId,
    {
      apps: [
        {
          appId: 'app-staging',
          role: 'staging',
          previewEnvironmentId: 'preview',
        },
      ],
    },
  );
});

afterEach(async () => {
  await h.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('deployment marks', () => {
  async function upload(appId: string, version: string, sha: string) {
    const { bytes } = await createArtifact(dir, version);
    return h.releases!.releases.uploadRelease(asPerson('alice'), appId, {
      stream: (async function* () {
        yield new Uint8Array(bytes);
      })(),
      labels: { sha },
    });
  }

  async function deployRelease(appId: string, releaseId: string) {
    const deployment = await h.releases!.releases.deploy(
      asPerson('alice'),
      appId,
      { releaseId },
    );
    return h.releases!.releases.waitForDeployment(deployment.id);
  }

  async function deploy(appId: string, version: string, sha: string) {
    const release = await upload(appId, version, sha);
    return { release, deployment: await deployRelease(appId, release.id) };
  }

  const deployStaging = async (version: string, sha: string) =>
    (await deploy('app-staging', version, sha)).deployment;

  /** Waits for the deployment's check: answers the commits Studio asked the host about for `head`. */
  let askedBefore = 0;
  async function check(head: string) {
    await h.deploys!.settled();
    const asked = h.deployChecks.asked.slice(askedBefore);
    askedBefore = h.deployChecks.asked.length;
    expect(asked.every((item) => item.head === head)).toBe(true);
    return asked.flatMap((item) => item.shas);
  }

  /** Commits onto the repository's `main` on the GitHub stand-in, oldest first. */
  const onMain = (...shas: string[]) =>
    h.github.pushCommits(FULL_NAME, 'main', ...shas);

  const markOf = async (issue: Issue, role = 'staging') =>
    (await h.deploys!.marksFor(alice(), [issue.id]))[issue.id]?.find(
      (mark) => mark.role === role,
    );

  /** A pull request of the issue, squash-merged into `squash`. */
  async function squashMerged(issue: Issue, number: number, squash: string) {
    const conn = h.database.connection();
    const repo = await ensureRepo(conn, API, FULL_NAME);
    const { pr } = await upsertPullRequest(conn, repo.id, {
      repo: 'acme/app',
      number,
      url: `https://git.example.com/acme/app/pull/${number}`,
      title: issue.title,
      body: null,
      state: 'merged',
      draft: false,
      headRef: `agent/${issue.identifier}`,
      baseRef: 'main',
      headSha: SHA1,
      authorLogin: 'agent',
      mergeableState: null,
      mergedAt: new Date().toISOString(),
      mergedByLogin: 'alice',
      mergeCommitSha: squash,
      closedAt: null,
    });
    await insertLink(conn, {
      issueId: issue.id,
      pullRequestId: pr.id,
      linkedByType: 'system',
      linkedById: null,
    });
  }

  it('marks the issues a staging deployment contains, renews them on the next one, withdraws them on a rollback and proposes reopening', async () => {
    askedBefore = 0;
    onMain(SHA1, MAIN1);
    const first = await pushedIssue('First', SHA1);
    await move(first, 'done');
    const firstDeploy = await deployStaging('1.0.0', MAIN1);
    expect(firstDeploy.status).toBe('succeeded');

    expect(await check(MAIN1)).toEqual([SHA1]);
    const marks = await h.deploys!.marksFor(alice(), [first.id]);
    expect(marks[first.id]).toEqual([
      expect.objectContaining({
        role: 'staging',
        // Labelled with its environment's name: "Staging ✓ a1b2c3d".
        environmentName: 'Staging',
        status: 'deployed',
        sha: SHA1,
        version: '1.0.0',
        deploymentId: firstDeploy.id,
      }),
    ]);
    expect(await h.deploys!.marksFor(h.viewer('bob'), [first.id])).toEqual({});

    // The next deployment checks the marked issue again with the newly finished one; both are renewed or added.
    onMain(SHA2, MAIN2);
    const second = await pushedIssue('Second', SHA2);
    await move(second, 'done');
    const secondDeploy = await deployStaging('1.1.0', MAIN2);
    expect((await check(MAIN2)).sort()).toEqual([SHA1, SHA2]);
    expect(await markOf(second)).toMatchObject({
      status: 'deployed',
      deploymentId: secondDeploy.id,
    });
    expect(await markOf(first)).toMatchObject({
      status: 'deployed',
      version: '1.1.0',
      deploymentId: secondDeploy.id,
    });

    // Rolling back to the first deployment withdraws the second issue's mark and proposes reopening it.
    const rollback = await h.releases!.releases.rollback(
      asPerson('alice'),
      'app-staging',
      { deploymentId: firstDeploy.id },
    );
    await h.releases!.releases.waitForDeployment(rollback.id);
    await check(MAIN1);
    expect(await markOf(second)).toMatchObject({
      status: 'withdrawn',
      withdrawnByDeploymentId: rollback.id,
      withdrawnVersion: '1.0.0',
    });
    expect(await markOf(first)).toMatchObject({
      status: 'deployed',
      deploymentId: rollback.id,
      version: '1.0.0',
    });
    // Whoever rolled back gets a card suggesting to reopen it; one click reopens it.
    const card = await waitFor(
      () =>
        Promise.resolve(
          h.notices.find((notice) => notice.type === 'reopen_suggested'),
        ),
      (found) => found !== undefined,
      'the reopen suggestion',
    );
    expect(card).toMatchObject({
      source: 'deploys',
      kind: 'decision',
      userIds: ['alice'],
      decisionKey: 'reopen:app-staging',
      data: {
        appId: 'app-staging',
        rollback: true,
        version: '1.0.0',
        issues: [
          expect.objectContaining({
            id: second.id,
            identifier: second.identifier,
            statusKey: 'in_progress',
          }),
        ],
      },
    });
    await expect(
      h.deploys!.decideReopen(h.viewer('bob'), 'app-staging', 'reopen'),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      await h.deploys!.decideReopen(alice(), 'app-staging', 'reopen'),
    ).toEqual({ reopened: [second.identifier], failed: [] });
    expect(
      (await h.projects.issueQueries.detail(alice(), second.id)).statusKey,
    ).toBe('in_progress');
    // Answered, the card no longer waits.
    await expect(
      h.deploys!.decideReopen(alice(), 'app-staging', 'dismiss'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('marks a squash-merged issue by its merge commit', async () => {
    const SQUASH = 'e1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
    askedBefore = 0;
    // The pushed head stays on the issue's branch; the squash commit lands on main.
    h.github.pushCommits(FULL_NAME, 'agent/squashed', SHA1);
    onMain(SQUASH, MAIN1);
    const issue = await pushedIssue('Squashed', SHA1);
    await squashMerged(issue, 7, SQUASH);
    await move(issue, 'done');
    await deployStaging('1.0.0', MAIN1);
    // The pushed head is not in the base branch after a squash; the squash commit is.
    expect((await check(MAIN1)).sort()).toEqual([SHA1, SQUASH]);
    expect(await markOf(issue)).toMatchObject({
      status: 'deployed',
      sha: SQUASH,
      version: '1.0.0',
    });
  });

  it('withdraws production marks when an older release is deployed or rolled back to, and renews them on a redeploy', async () => {
    await h.releases!.environments.create(SYSTEM_CALLER, {
      id: 'production',
      name: 'Production',
      driver: 'fake',
      config: {},
    });
    await h.releases!.releases.createApp(asPerson('alice'), {
      id: 'app-prod',
      name: 'App',
      environmentId: 'production',
    });
    await h.links!.save(
      { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
      resourceId,
      {
        apps: [
          { appId: 'app-prod', role: 'production', previewEnvironmentId: null },
        ],
      },
    );
    askedBefore = 0;
    onMain(MAIN1, SHA2, MAIN2);
    const issue = await pushedIssue('Ship', SHA2);
    await move(issue, 'done');
    const older = await upload('app-prod', '1.0.0', MAIN1);
    const newer = await upload('app-prod', '1.1.0', MAIN2);

    // B1: the newer release contains the issue.
    const b1 = await deployRelease('app-prod', newer.id);
    await check(MAIN2);
    expect(await markOf(issue, 'production')).toMatchObject({
      status: 'deployed',
      deploymentId: b1.id,
      version: '1.1.0',
    });

    // A: deploying the older release withdraws it, and whoever deployed is asked about reopening.
    const a = await deployRelease('app-prod', older.id);
    await check(MAIN1);
    expect(await markOf(issue, 'production')).toMatchObject({
      status: 'withdrawn',
      withdrawnByDeploymentId: a.id,
      withdrawnVersion: '1.0.0',
    });
    const withdrawCard = await waitFor(
      () =>
        Promise.resolve(
          h.notices.findLast(
            (notice) =>
              notice.type === 'reopen_suggested' &&
              notice.decisionKey === 'reopen:app-prod',
          ),
        ),
      (found) => found !== undefined,
      'the reopen suggestion of the older release',
    );
    expect(withdrawCard).toMatchObject({
      userIds: ['alice'],
      data: {
        rollback: false,
        issues: [
          expect.objectContaining({ id: issue.id, statusKey: 'in_progress' }),
        ],
      },
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey,
    ).toBe('done');

    // B2: the same commit again renews the mark.
    const b2 = await deployRelease('app-prod', newer.id);
    await check(MAIN2);
    expect(await markOf(issue, 'production')).toMatchObject({
      status: 'deployed',
      deploymentId: b2.id,
    });

    // A check a newer deployment overtook decides nothing: the older release's check is held until the newer one
    // deployed and decided.
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    h.deployChecks.gate = (head) => (head === MAIN1 ? held : Promise.resolve());
    const stale = await deployRelease('app-prod', older.id);
    const latest = await deployRelease('app-prod', newer.id);
    expect(stale.id).not.toBe(latest.id);
    await waitFor(
      () => markOf(issue, 'production'),
      (mark) => mark?.deploymentId === latest.id,
      'the newer deployment to decide',
    );
    release();
    h.deployChecks.gate = null;
    await h.deploys!.settled();
    askedBefore = h.deployChecks.asked.length;
    expect(await markOf(issue, 'production')).toMatchObject({
      status: 'deployed',
      deploymentId: latest.id,
    });

    // Rolling back to A withdraws it again and proposes reopening.
    const rollback = await h.releases!.releases.rollback(
      asPerson('alice'),
      'app-prod',
      { deploymentId: a.id },
    );
    await h.releases!.releases.waitForDeployment(rollback.id);
    await check(MAIN1);
    expect(await markOf(issue, 'production')).toMatchObject({
      status: 'withdrawn',
      withdrawnByDeploymentId: rollback.id,
      withdrawnVersion: '1.0.0',
    });
    const rollbackCard = await waitFor(
      () =>
        Promise.resolve(
          h.notices.findLast(
            (notice) =>
              notice.type === 'reopen_suggested' &&
              notice.data?.rollback === true,
          ),
        ),
      (found) => found !== undefined,
      'the reopen suggestion of the rollback',
    );
    // One suggestion per App: the rollback's replaces the one the older release left waiting.
    expect(rollbackCard).toMatchObject({ decisionKey: 'reopen:app-prod' });
    expect(
      await h.deploys!.decideReopen(alice(), 'app-prod', 'dismiss'),
    ).toEqual({ reopened: [], failed: [] });
    expect(
      (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey,
    ).toBe('done');
  });

  it('lists finished issues not in production and reminds the release owner', async () => {
    expect(await h.deploys!.unreleased(alice(), projectId)).toEqual({
      projectId,
      hasProduction: false,
      // Previews are CI's: none was deployed yet.
      hasPreview: false,
      items: [],
    });
    await h.releases!.environments.create(SYSTEM_CALLER, {
      id: 'production',
      name: 'Production',
      driver: 'fake',
      config: {},
    });
    await h.releases!.releases.createApp(asPerson('alice'), {
      id: 'app-prod',
      name: 'App',
      environmentId: 'production',
    });
    await h.links!.save(
      { userId: 'alice', permissions: { scopes: alice().permissions.scopes } },
      resourceId,
      {
        apps: [
          {
            appId: 'app-staging',
            role: 'staging',
            previewEnvironmentId: 'preview',
          },
          { appId: 'app-prod', role: 'production', previewEnvironmentId: null },
        ],
      },
    );
    const issue = await h.projects.issues.create(alice(), {
      title: 'Ship it',
      projectId,
    });
    await move(issue, 'done');
    const list = await h.deploys!.unreleased(alice(), projectId);
    expect(list).toMatchObject({
      hasProduction: true,
      items: [{ id: issue.id, staging: false }],
    });
    const reminder = await waitFor(
      () => Promise.resolve(h.notices.filter((n) => n.type === 'unreleased')),
      (found) => found.length > 0,
      'the reminder',
    );
    expect(reminder[0]).toMatchObject({
      source: 'deploys',
      userIds: ['alice'],
      group: `unreleased:${projectId}`,
    });
  });

  it('removes the marks of an unlinked pull request’s commits, keeping those another linked one or the agent’s push names', async () => {
    const SQUASH = 'e1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
    const issue = await pushedIssue('Unlinked', SHA1);
    const conn = h.database.connection();
    const repo = await ensureRepo(conn, API, FULL_NAME);
    const linked = async (
      number: number,
      headSha: string,
      mergeCommitSha: string | null,
    ) => {
      const { pr } = await upsertPullRequest(conn, repo.id, {
        repo: FULL_NAME,
        number,
        url: `https://git.example.com/acme/app/pull/${number}`,
        title: `Change ${number}`,
        body: null,
        state: mergeCommitSha ? 'merged' : 'open',
        draft: false,
        headRef: `feature/${number}`,
        baseRef: 'main',
        headSha,
        authorLogin: 'agent',
        mergeableState: null,
        mergedAt: mergeCommitSha ? new Date().toISOString() : null,
        mergedByLogin: mergeCommitSha ? 'alice' : null,
        mergeCommitSha,
        closedAt: null,
      });
      await insertLink(conn, {
        issueId: issue.id,
        pullRequestId: pr.id,
        linkedByType: 'system',
        linkedById: null,
      });
      return pr.id;
    };
    // #6 alone carries MAIN2; #7's head is the agent's newest push and its squash commit is #8's head.
    const only = await linked(6, SHA2, MAIN2);
    const shared = await linked(7, SHA1, SQUASH);
    await linked(8, SQUASH, null);
    const mark = (appId: string, sha: string, status = 'deployed') =>
      conn.query
        .insertInto('studioDeployMarks')
        .values({
          id: `mark-${appId}`,
          issueId: issue.id,
          projectId,
          appId,
          environmentId: 'staging',
          role: 'staging',
          status,
          sha,
          deploymentId: `d-${appId}`,
          releaseId: `r-${appId}`,
          version: '1.0.0',
          checkId: status === 'checking' ? `c-${appId}` : null,
          deployedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    await mark('app-merge', MAIN2.slice(0, 7));
    await mark('app-squash', SQUASH);
    await mark('app-push', SHA1);
    // A check still under way decides its own rows.
    await mark('app-checking', MAIN2, 'checking');

    await asAdmin(async () => {
      await h.git.unlink(alice(), issue.id, only);
      await h.git.unlink(alice(), issue.id, shared);
    });

    const left = await conn.query
      .selectFrom('studioDeployMarks')
      .select(['appId'])
      .where('issueId', '=', issue.id)
      .orderBy('appId')
      .execute();
    expect(left.map((row) => row.appId)).toEqual([
      'app-checking',
      'app-push',
      'app-squash',
    ]);
  });
});
