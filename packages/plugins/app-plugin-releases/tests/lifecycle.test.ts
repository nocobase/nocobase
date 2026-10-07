// @vitest-environment node
/**
 * Labelled Apps within an environment's limit, removed only explicitly, and deployment requests on an environment that
 * requires approval (no self-approval, people only, approvers from the application).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

describe('Apps of an environment', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'fake',
      maxApps: 2,
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  it('creates labelled Apps within the limit and removes one only when asked', async () => {
    const rule = await harness.as('owner', 'admin', 'rule');
    const preview = await harness.services.releases.createApp(rule, {
      id: 'fg-12--acme',
      name: 'FG-12',
      environmentId: 'preview',
      labels: { issue: 'FG-12', branch: 'agent/FG-12' },
    });
    expect(preview.app).toMatchObject({
      labels: { issue: 'FG-12' },
      createdVia: 'rule',
      createdBy: 'owner',
    });
    // Apps no longer expire: there is no expiry to report.
    expect(preview.app).not.toHaveProperty('temporary');
    expect(preview.app).not.toHaveProperty('expiresAt');
    await harness.services.releases.createApp(rule, {
      id: 'fg-13--acme',
      name: 'FG-13',
      environmentId: 'preview',
      labels: { issue: 'FG-13' },
    });
    await expect(
      harness.services.releases.createApp(rule, {
        id: 'fg-14--acme',
        name: 'FG-14',
        environmentId: 'preview',
      }),
    ).rejects.toMatchObject({ reason: 'ENVIRONMENT_FULL' });
    const filtered = await harness.services.releases.listApps(rule, {
      labels: { issue: 'FG-13' },
    });
    expect(filtered.items.map((item) => item.app.id)).toEqual(['fg-13--acme']);

    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      rule,
      'fg-13--acme',
      {
        stream: streamOf(artifact.bytes),
        deploy: {},
      },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    expect(harness.fake.running.has('fg-13--acme')).toBe(true);

    // Nothing removes an App on a timer; removing it is an explicit delete.
    expect('removeExpired' in harness.services.releases).toBe(false);
    await harness.services.releases.deleteApp(rule, 'fg-13--acme');
    expect(harness.fake.removed).toEqual(['fg-13--acme']);
    expect(harness.fake.running.has('fg-13--acme')).toBe(false);
    const remaining = await harness.services.releases.listApps(rule);
    expect(remaining.items.map((item) => item.app.id)).toEqual(['fg-12--acme']);
    expect(
      await harness.database
        .connection()
        .query.selectFrom('relReleases')
        .select('id')
        .where('appId', '=', 'fg-13--acme')
        .execute(),
    ).toEqual([]);
    expect(harness.events.at(-1)).toMatchObject({
      type: 'app.removed',
      app: { id: 'fg-13--acme' },
      actor: { kind: 'rule' },
    });
  });
});

describe('deployment requests', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'production',
      name: 'Production',
      driver: 'fake',
      protected: true,
      approvers: ['wang'],
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  async function prepare() {
    const lead = await harness.as('li', 'admin');
    await harness.services.releases.createApp(lead, {
      id: 'acme',
      name: 'Acme',
      environmentId: 'production',
    });
    const artifact = await createArtifact(harness.rootDir, '13.0.0');
    const release = await harness.services.releases.uploadRelease(
      lead,
      'acme',
      {
        stream: streamOf(artifact.bytes),
      },
    );
    return { lead, release };
  }

  it('refuses a direct deployment and deploys once someone else approves the request', async () => {
    const { lead, release } = await prepare();
    await expect(
      harness.services.releases.deploy(lead, 'acme', {
        releaseId: release.id,
      }),
    ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    const request = await harness.services.requests.create(lead, 'acme', {
      releaseId: release.id,
      note: 'R-13',
      labels: { release: 'R-13' },
    });
    expect(request).toMatchObject({
      status: 'pending',
      requestedBy: 'li',
      kind: 'deploy',
    });
    expect(harness.events.at(-1)).toMatchObject({
      type: 'request.created',
      approvers: ['wang'],
    });
    await expect(
      harness.services.requests.create(lead, 'acme', {
        releaseId: release.id,
      }),
    ).rejects.toMatchObject({ reason: 'REQUEST_PENDING' });

    // The requester may decide their own request once they are an approver.
    harness.application.approvers = ['wang', lead.userId!];
    expect(
      (await harness.services.requests.get(lead, request.id)).decidable,
    ).toBe(true);
    // An agent cannot approve, even for an approver.
    const agent = await harness.services.callerForUser('wang', 'agent');
    await expect(
      harness.services.requests.approve(agent, request.id),
    ).rejects.toMatchObject({
      reason: 'HUMAN_REQUIRED',
    });
    // Someone who is not an approver cannot either.
    const other = await harness.as('zhao', 'admin');
    harness.application.approvers = ['wang'];
    await expect(
      harness.services.requests.approve(other, request.id),
    ).rejects.toMatchObject({
      status: 'PERMISSION_DENIED',
    });
    const approver = await harness.as('wang', 'viewer');
    // The reads say what the request deploys, where, and whether the caller may decide it.
    const awaiting = await harness.services.requests.list(approver, {
      awaitingMe: true,
    });
    expect(awaiting.items.map((item) => item.id)).toEqual([request.id]);
    expect(awaiting.items[0]).toMatchObject({
      release: { version: release.version },
      environment: { protected: true },
      decidable: true,
    });
    expect(await harness.services.requests.get(lead, request.id)).toMatchObject(
      { decidable: false, release: { version: release.version } },
    );
    // On the protected environment the approver types the App ID again, as a direct deployment asks.
    await expect(
      harness.services.requests.approve(approver, request.id, 'Go'),
    ).rejects.toMatchObject({ reason: 'CONFIRMATION_REQUIRED' });
    expect((await harness.services.requests.get(lead, request.id)).status).toBe(
      'pending',
    );
    const approved = await harness.services.requests.approve(
      approver,
      request.id,
      'Go',
      'acme',
    );
    expect(approved).toMatchObject({ status: 'approved', decidedBy: 'wang' });
    const deployment = await harness.services.releases.waitForDeployment(
      approved.deploymentId!,
    );
    expect(deployment).toMatchObject({
      status: 'succeeded',
      actorId: 'wang',
      requestId: request.id,
    });
    expect(await harness.services.requests.get(lead, request.id)).toMatchObject(
      {
        status: 'deployed',
      },
    );
    await expect(
      harness.services.requests.approve(approver, request.id),
    ).rejects.toMatchObject({
      reason: 'REQUEST_DECIDED',
    });
  });

  it('deploys exactly the release it was asked for, and nothing whose bytes changed since', async () => {
    const { lead, release } = await prepare();
    const request = await harness.services.requests.create(lead, 'acme', {
      releaseId: release.id,
    });
    expect(request).toMatchObject({
      releaseId: release.id,
      releaseChecksum: release.checksum,
    });
    // A newer release arriving meanwhile does not take the request's place.
    const newer = await harness.services.releases.uploadRelease(lead, 'acme', {
      stream: streamOf((await createArtifact(harness.rootDir, '13.1.0')).bytes),
    });
    expect(newer.id).not.toBe(release.id);
    // Bytes that are not the ones asked for are refused, and the request stays pending.
    await harness.database
      .connection()
      .query.updateTable('relReleases')
      .set({ checksum: 'f'.repeat(64) })
      .where('id', '=', release.id)
      .execute();
    const approver = await harness.as('wang', 'viewer');
    await expect(
      harness.services.requests.approve(
        approver,
        request.id,
        undefined,
        'acme',
      ),
    ).rejects.toMatchObject({ reason: 'RELEASE_CHANGED' });
    expect((await harness.services.requests.get(lead, request.id)).status).toBe(
      'pending',
    );
    await harness.database
      .connection()
      .query.updateTable('relReleases')
      .set({ checksum: release.checksum })
      .where('id', '=', release.id)
      .execute();
    const approved = await harness.services.requests.approve(
      approver,
      request.id,
      undefined,
      'acme',
    );
    const deployment = await harness.services.releases.waitForDeployment(
      approved.deploymentId!,
    );
    expect(deployment).toMatchObject({
      releaseId: release.id,
      status: 'succeeded',
    });
  });

  it('records rejections and withdrawals, and requests rollbacks', async () => {
    const { lead, release } = await prepare();
    const agent = await harness.services.callerForUser('li', 'agent');
    // An agent may propose; a person decides.
    const proposed = await harness.services.requests.create(agent, 'acme', {
      releaseId: release.id,
    });
    expect(proposed).toMatchObject({ requestedVia: 'agent' });
    const approver = await harness.as('wang', 'viewer');
    const rejected = await harness.services.requests.reject(
      approver,
      proposed.id,
      'Not today',
    );
    expect(rejected).toMatchObject({
      status: 'rejected',
      decisionNote: 'Not today',
    });
    expect(harness.events.at(-1)).toMatchObject({
      type: 'request.decided',
      decision: 'rejected',
    });

    const again = await harness.services.requests.create(lead, 'acme', {
      releaseId: release.id,
    });
    await expect(
      harness.services.requests.cancel(agent, again.id),
    ).resolves.toMatchObject({
      status: 'cancelled',
    });

    const deploy = await harness.services.requests.create(lead, 'acme', {
      releaseId: release.id,
    });
    const approved = await harness.services.requests.approve(
      approver,
      deploy.id,
      undefined,
      'acme',
    );
    const first = await harness.services.releases.waitForDeployment(
      approved.deploymentId!,
    );
    const rollbackRequest = await harness.services.requests.create(
      lead,
      'acme',
      {
        rollbackToDeploymentId: first.id,
      },
    );
    expect(rollbackRequest).toMatchObject({
      kind: 'rollback',
      releaseId: release.id,
    });
    const rolledBack = await harness.services.requests.approve(
      approver,
      rollbackRequest.id,
      undefined,
      'acme',
    );
    expect(
      await harness.services.releases.waitForDeployment(
        rolledBack.deploymentId!,
      ),
    ).toMatchObject({ kind: 'rollback', status: 'succeeded' });
    expect(
      harness.events.some((event) => event.type === 'deployment.rolledBack'),
    ).toBe(true);
  });

  it('lets anyone who may deploy-protected decide when the environment names no approvers', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.environments.update(admin, 'production', {
      approvers: [],
    });
    harness.application.approvers = undefined;
    const { lead, release } = await prepare();
    const request = await harness.services.requests.create(lead, 'acme', {
      releaseId: release.id,
    });
    const viewer = await harness.as('vera', 'viewer');
    await expect(
      harness.services.requests.approve(viewer, request.id),
    ).rejects.toMatchObject({
      status: 'PERMISSION_DENIED',
    });
    await expect(
      harness.services.requests.approve(admin, request.id, undefined, 'acme'),
    ).resolves.toMatchObject({
      status: 'approved',
    });
  });
});
