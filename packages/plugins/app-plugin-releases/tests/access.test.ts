// @vitest-environment node
/**
 * Declared access through a fake access port: what the declarations offer, `related` as the Apps a user created
 * plus the application's own, settings, agents refused the human-only actions and protected environments that take
 * every deployment through a request.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BUSINESS_KEYS,
  HUMAN_ONLY_ACTIONS,
  PAGES,
  RELATIONS,
  SETTINGS_KEYS,
} from '../shared/access.js';
import {
  createArtifact,
  createHarness,
  streamOf,
  testKeyScope,
  type Harness,
} from './harness.js';

describe('declared access', () => {
  it('declares a page, a settings item and nine App actions', () => {
    expect(PAGES).toEqual(['rel-apps']);
    expect(SETTINGS_KEYS.map(({ key }) => key)).toEqual([
      'rel.environments/read',
      'rel.environments/manage',
    ]);
    expect(BUSINESS_KEYS.map(({ action }) => action)).toEqual([
      'view',
      'read-logs',
      'create',
      'configure',
      'upload',
      'deploy',
      'deploy-protected',
      'operate',
      'delete',
    ]);
    expect(RELATIONS['rel.apps/create']).toBeNull();
    expect(RELATIONS['rel.apps/delete']).toBe('owned');
    expect(
      Object.values(RELATIONS).filter((value) => value === null),
    ).toHaveLength(1);
    expect(HUMAN_ONLY_ACTIONS).toEqual([
      'deploy-protected',
      'delete',
      'configure',
    ]);
  });
});

describe('access through the application port', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
    await harness.environment({
      id: 'production',
      name: 'Production',
      driver: 'fake',
      protected: true,
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  it('limits a contributor to the Apps they created, plus the ones the application relates', async () => {
    const alice = await harness.as('alice', 'contributor');
    const bob = await harness.as('bob', 'contributor');
    await harness.services.releases.createApp(alice, {
      id: 'a',
      name: 'A',
      environmentId: 'staging',
    });
    await harness.services.releases.createApp(bob, {
      id: 'b',
      name: 'B',
      environmentId: 'staging',
    });
    await harness.services.releases.createApp(bob, {
      id: 'c',
      name: 'C',
      environmentId: 'staging',
    });
    const visible = async () =>
      (await harness.services.releases.listApps(alice)).items
        .map((item) => item.app.id)
        .sort();
    expect(await visible()).toEqual(['a']);
    await expect(
      harness.services.releases.getApp(alice, 'b'),
    ).rejects.toMatchObject({
      status: 'PERMISSION_DENIED',
    });
    harness.application.related.set('alice', ['b']);
    expect(await visible()).toEqual(['a', 'b']);
    // The single-App read says what the caller may do there, as the server would decide each action.
    expect(
      (await harness.services.releases.getApp(alice, 'b')).allowed,
    ).toEqual([
      'view',
      'read-logs',
      'configure',
      'upload',
      'deploy',
      'operate',
    ]);
    // A contributor holds no delete at all; an admin sees everything.
    await expect(
      harness.services.releases.deleteApp(alice, 'a', { confirm: 'a' }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    const admin = await harness.as('admin', 'admin');
    expect((await harness.services.releases.listApps(admin)).total).toBe(3);
    // Nobody holds nothing.
    const nobody = await harness.as('nobody', 'nobody');
    await expect(
      harness.services.releases.listApps(nobody),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await expect(
      harness.services.releases.createApp(nobody, {
        id: 'd',
        name: 'D',
        environmentId: 'staging',
      }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
  });

  it('keeps environment management to the settings item and never returns credentials', async () => {
    const contributor = await harness.as('carol', 'contributor');
    await expect(
      harness.services.environments.create(contributor, {
        id: 'x',
        name: 'X',
        driver: 'fake',
      }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    expect(
      (await harness.services.environments.list(contributor)).map(
        (env) => env.id,
      ),
    ).toEqual(['production', 'staging']);
    const admin = await harness.as('admin', 'admin');
    const created = await harness.services.environments.create(admin, {
      id: 'remote',
      name: 'Remote',
      driver: 'fake',
      secret: { token: 'super-secret' },
    });
    expect(created).toMatchObject({ hasSecret: true });
    expect(JSON.stringify(created)).not.toContain('super-secret');
    const stored = await harness.database
      .connection()
      .query.selectFrom('relEnvironments')
      .select('secret')
      .where('id', '=', 'remote')
      .executeTakeFirst();
    expect(String(stored?.secret)).not.toContain('super-secret');
    // The driver receives the decrypted credentials.
    await harness.services.releases.createApp(admin, {
      id: 'r',
      name: 'R',
      environmentId: 'remote',
    });
    await expect(
      harness.services.environments.check(admin, 'remote'),
    ).resolves.toMatchObject({
      ok: true,
      details: { secret: { token: 'super-secret' } },
    });
    await expect(
      harness.services.environments.remove(admin, 'remote'),
    ).rejects.toMatchObject({
      reason: 'ENVIRONMENT_IN_USE',
    });
    await expect(
      harness.services.environments.create(admin, {
        id: 'bad',
        name: 'Bad',
        driver: 'fake',
        config: { invalid: true },
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_ENVIRONMENT_CONFIG' });
    await expect(
      harness.services.environments.create(admin, {
        id: 'none',
        name: 'None',
        driver: 'missing',
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_DRIVER' });
  });

  it('refuses agents the human-only actions whatever they hold', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'a',
      name: 'A',
      environmentId: 'staging',
    });
    const agent = await harness.services.callerForUser('admin', 'agent');
    await expect(
      harness.services.releases.getApp(agent, 'a'),
    ).resolves.toBeTruthy();
    await expect(
      harness.services.releases.readConfig(agent, 'a'),
    ).rejects.toMatchObject({
      reason: 'HUMAN_REQUIRED',
    });
    await expect(
      harness.services.releases.updateApp(agent, 'a', { name: 'Renamed' }),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    await expect(
      harness.services.releases.deleteApp(agent, 'a', { confirm: 'a' }),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    // The application marks an agent through its identity.
    const marked = await harness.services.callerOf({
      principal: { type: 'user', id: 'admin' },
      subjects: [{ type: 'agent', id: 'dev' }],
    });
    expect(marked.kind).toBe('agent');
  });

  it('takes every deployment to a protected environment through a request, decided by deploy-protected without approvers', async () => {
    const admin = await harness.as('admin', 'admin');
    const contributor = await harness.as('carol', 'contributor');
    await harness.services.releases.createApp(contributor, {
      id: 'prod',
      name: 'Prod',
      environmentId: 'production',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      contributor,
      'prod',
      {
        stream: streamOf(artifact.bytes),
      },
    );
    // Nobody deploys there directly: a person holding deploy-protected, an agent or a key alike.
    for (const caller of [
      contributor,
      admin,
      await harness.services.callerForUser('admin', 'agent'),
      await harness.services.callerForUser('admin', 'key'),
    ])
      await expect(
        harness.services.releases.deploy(caller, 'prod', {
          releaseId: release.id,
        }),
      ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    await expect(
      harness.services.releases.rollback(admin, 'prod', {
        deploymentId: 'any',
      }),
    ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    // Whoever may deploy the App requests it instead.
    const request = await harness.services.requests.create(
      contributor,
      'prod',
      { releaseId: release.id },
    );
    expect(request).toMatchObject({ status: 'pending' });
    // With no approvers named, a person holding deploy-protected decides; a contributor does not.
    const dave = await harness.as('dave', 'contributor');
    await expect(
      harness.services.requests.approve(dave, request.id, undefined, 'prod'),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await expect(
      harness.services.requests.approve(admin, request.id),
    ).rejects.toMatchObject({ reason: 'CONFIRMATION_REQUIRED' });
    const approved = await harness.services.requests.approve(
      admin,
      request.id,
      undefined,
      'prod',
    );
    expect(
      await harness.services.releases.waitForDeployment(approved.deploymentId!),
    ).toMatchObject({ status: 'succeeded', actorKind: 'human' });
  });

  it('keeps a scoped key within its scope and its owner, whatever it asks', async () => {
    const admin = await harness.as('admin', 'admin');
    for (const id of ['a', 'b'])
      await harness.services.releases.createApp(admin, {
        id,
        name: id.toUpperCase(),
        environmentId: 'staging',
      });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(admin, 'a', {
      stream: streamOf(artifact.bytes),
      checksum: artifact.checksum,
    });
    const identity = (keyScope: ReturnType<typeof testKeyScope>) => ({
      principal: { type: 'user', id: 'admin' },
      subjects: [{ type: 'authenticated', id: '*' }],
      keyScope,
    });
    // CI deploy: read and write on App `a` only.
    const ci = await harness.services.callerOf(
      identity(
        testKeyScope({
          actions: [
            'rel.apps/view',
            'rel.apps/read-logs',
            'rel.apps/upload',
            'rel.apps/deploy',
            'rel.apps/operate',
          ],
          pages: ['rel-apps'],
          apps: ['a'],
        }),
      ),
    );
    expect(ci.kind).toBe('key');
    expect(ci.permissions.scopes['rel.apps/configure']).toBe('none');
    expect(ci.permissions.settings['rel.environments/read']).toBe(false);
    expect(ci.permissions.pages['rel-apps']).toBe(true);
    // Only the Apps it picked, though its owner sees every App.
    expect(
      (await harness.services.releases.listApps(ci)).items.map(
        ({ app }) => app.id,
      ),
    ).toEqual(['a']);
    await expect(
      harness.services.releases.getApp(ci, 'b'),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await expect(
      harness.services.releases.deploy(ci, 'b', { releaseId: release.id }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    // Nothing its scope leaves out: no managing environments, no creating or configuring Apps.
    await expect(
      harness.services.environments.create(ci, {
        id: 'made-by-ci',
        name: 'CI',
        driver: 'fake',
      }),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    expect(() => harness.services.guard.requireCreate(ci)).toThrow();
    await expect(
      harness.services.releases.readConfig(ci, 'a'),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    const deployment = await harness.services.releases.deploy(ci, 'a', {
      releaseId: release.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(deployment.id),
    ).toMatchObject({ status: 'succeeded', actorKind: 'key' });

    // A key whose scope covers everything still never configures, deletes or deploys to a protected environment.
    const broad = await harness.services.callerOf(
      identity(
        testKeyScope({
          actions: [
            'rel.apps/view',
            'rel.apps/configure',
            'rel.apps/delete',
            'rel.apps/deploy',
            'rel.apps/deploy-protected',
            'rel.apps/create',
          ],
        }),
      ),
    );
    await expect(
      harness.services.releases.readConfig(broad, 'a'),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    await expect(
      harness.services.releases.deleteApp(broad, 'b', { confirm: 'b' }),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
    expect(() => harness.services.guard.requireCreate(broad)).not.toThrow();

    // A scope never grants: a viewer's key with deploy in its scope still cannot deploy.
    harness.application.roles.set('vera', 'viewer');
    const viewerKey = await harness.services.callerOf({
      principal: { type: 'user', id: 'vera' },
      subjects: [{ type: 'authenticated', id: '*' }],
      keyScope: testKeyScope({
        actions: ['rel.apps/view', 'rel.apps/deploy'],
      }),
    });
    expect(viewerKey.permissions.scopes['rel.apps/deploy']).toBe('none');
  });

  it('lets a scoped key ask for a deployment to a protected environment, never deploy there', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.environments.update(admin, 'staging', {
      protected: true,
      approvers: ['wang'],
    });
    await harness.services.releases.createApp(admin, {
      id: 'a',
      name: 'A',
      environmentId: 'staging',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(admin, 'a', {
      stream: streamOf(artifact.bytes),
      checksum: artifact.checksum,
    });
    const key = await harness.services.callerOf({
      principal: { type: 'user', id: 'admin' },
      subjects: [{ type: 'authenticated', id: '*' }],
      keyScope: testKeyScope({
        actions: ['rel.apps/view', 'rel.apps/deploy'],
      }),
    });
    await expect(
      harness.services.releases.deploy(key, 'a', { releaseId: release.id }),
    ).rejects.toMatchObject({ reason: 'APPROVAL_REQUIRED' });
    const request = await harness.services.requests.create(key, 'a', {
      releaseId: release.id,
    });
    expect(request).toMatchObject({ status: 'pending', requestedVia: 'key' });
    // And it never decides one.
    await expect(
      harness.services.requests.approve(key, request.id),
    ).rejects.toMatchObject({ reason: 'HUMAN_REQUIRED' });
  });
});
