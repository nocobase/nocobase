// @vitest-environment node
/**
 * Apps, releases and deployments through the fake driver: upload with checksum dedupe, idempotency and size limits;
 * deploy, rollback and failure with their phases, logs and events; configuration from the release template with
 * generated secrets; promotion between Apps.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parse as parseYaml } from 'yaml';

import { UNRESTORED_APP_ERROR } from '../server/drivers/types.js';
import { ReleasesError } from '../server/errors.js';
import { CONFIG_SECRET_MASK } from '../shared/releases.js';
import {
  createArtifact,
  createFakeDriver,
  createHarness,
  streamOf,
  testKeyScope,
  type Harness,
} from './harness.js';

describe('releases', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness({ maxArtifactSizeMB: 1 });
    await harness.environment({
      id: 'staging',
      name: 'Staging',
      driver: 'fake',
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  /** The configuration the runtime was given with the App's running deployment. */
  function runtimeConfig(appId: string): string {
    const config = harness.fake.running.get(appId)?.config;
    if (config?.mode !== 'file')
      throw new Error(`${appId} runs no file config`);
    return config.content;
  }

  async function createApp(id = 'shop') {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id,
      name: 'Shop',
      environmentId: 'staging',
    });
    return admin;
  }

  it('answers the shared runtime on the single-App read, naming only the occupants the caller may view', async () => {
    const admin = await createApp('crm');
    const contributor = await harness.as('dev', 'contributor');
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'fake',
    });
    await harness.services.releases.createApp(contributor, {
      id: 'pr-1',
      name: 'PR 1',
      environmentId: 'preview',
    });
    await harness.services.releases.createApp(contributor, {
      id: 'pr-2',
      name: 'PR 2',
      environmentId: 'preview',
    });
    const app = (
      appId: string,
      environmentId: string | null,
      fields: Record<string, unknown>,
    ) => ({
      appId,
      environmentId,
      version: '1.0.0',
      deploymentId: null,
      startedAt: null,
      error: null,
      lastAccessedAt: null,
      ...fields,
    });
    harness.fake.occupancy = {
      id: 'in-process',
      memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
      recycling: 'pending',
      apps: [
        app('pr-2', 'preview', { state: 'stopped' }),
        app('pr-1', 'preview', { state: 'stopped', waiting: 'recycle' }),
        app('crm', 'staging', {
          state: 'running',
          holds: ['requests', 'resident'],
          error: 'crm detail',
          lastAccessedAt: '2026-11-07T01:00:00.000Z',
        }),
        app('outside', null, { state: 'running', holds: ['recent'] }),
      ],
      failedEnvironments: [
        {
          environmentId: 'staging',
          error: 'secret-crm internal-archive-path cannot restore',
        },
      ],
    };
    const seen = await harness.services.releases.getApp(contributor, 'pr-1');
    expect(seen.host).toEqual({
      id: 'in-process',
      memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
      recycling: 'pending',
      deployed: 4,
      running: 2,
      occupants: [
        {
          app: null,
          state: 'running',
          holds: ['requests', 'resident'],
          waiting: null,
          lastAccessedAt: null,
          error: null,
        },
        {
          app: null,
          state: 'running',
          holds: ['recent'],
          waiting: null,
          lastAccessedAt: null,
          error: null,
        },
        {
          app: {
            id: 'pr-1',
            name: 'PR 1',
            environmentId: 'preview',
            environmentName: 'Preview',
            previewOf: null,
          },
          state: 'stopped',
          holds: [],
          waiting: 'recycle',
          lastAccessedAt: null,
          error: null,
        },
      ],
      // Reading environments does not reveal what their restore error says about Apps the caller cannot view.
      failedEnvironments: [{ id: 'staging', name: 'Staging', error: null }],
    });
    // Nothing of the hidden App reaches the caller in any field.
    expect(JSON.stringify(seen)).not.toMatch(/crm|internal-archive-path/);
    // Nor through a key limited to the caller's own App.
    const key = await harness.services.callerOf({
      principal: { type: 'user', id: 'admin' },
      subjects: [{ type: 'authenticated', id: '*' }],
      keyScope: testKeyScope({ actions: ['rel.apps/view'], apps: ['pr-1'] }),
    });
    const scoped = await harness.services.releases.getApp(key, 'pr-1');
    expect(scoped.host?.occupants.map((item) => item.app?.id ?? null)).toEqual([
      null,
      null,
      'pr-1',
    ]);
    expect(JSON.stringify(scoped)).not.toMatch(/crm|internal-archive-path/);
    const all = await harness.services.releases.getApp(admin, 'pr-1');
    expect(all.host?.failedEnvironments).toEqual([
      {
        id: 'staging',
        name: 'Staging',
        error: 'secret-crm internal-archive-path cannot restore',
      },
    ]);
    expect(all.host?.occupants[0]?.lastAccessedAt).toBe(
      '2026-11-07T01:00:00.000Z',
    );
    expect(all.host?.occupants[0]?.app).toMatchObject({
      id: 'crm',
      environmentName: 'Staging',
    });
    expect(all.host?.occupants[0]?.error).toBe('crm detail');
    // Lists stay cheap: only the single-App read asks the driver about the runtime.
    const page = await harness.services.releases.listApps(admin, {});
    expect(page.items.every((item) => item.host === undefined)).toBe(true);
  });

  it('lists each shared runtime once for the environments page, with its environments and the occupants the caller may view', async () => {
    const admin = await createApp('crm');
    const contributor = await harness.as('dev', 'contributor');
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'fake',
    });
    // An environment without Apps runs nothing on a runtime: it is not listed with it.
    await harness.environment({ id: 'empty', name: 'Empty', driver: 'fake' });
    await harness.services.releases.createApp(contributor, {
      id: 'pr-1',
      name: 'PR 1',
      environmentId: 'preview',
    });
    const occupant = (appId: string, environmentId: string) => ({
      appId,
      environmentId,
      version: '1.0.0',
      deploymentId: null,
      startedAt: null,
      error: null,
      lastAccessedAt: '2026-11-07T01:00:00.000Z',
      state: 'running' as const,
      holds: ['resident' as const],
    });
    // A driver whose environments share no runtime lists none.
    expect(await harness.services.releases.listHosts(admin)).toEqual([]);
    harness.fake.occupancy = {
      id: 'in-process',
      memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
      recycling: 'restarting',
      apps: [occupant('crm', 'staging'), occupant('pr-1', 'preview')],
      failedEnvironments: [
        { environmentId: 'staging', error: 'crm internal-archive-path' },
      ],
    };
    // Both environments report the same runtime: it is listed once, naming both.
    const all = await harness.services.releases.listHosts(admin);
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: 'in-process',
      recycling: 'restarting',
      deployed: 2,
      running: 2,
      environments: [
        { id: 'preview', name: 'Preview' },
        { id: 'staging', name: 'Staging' },
      ],
      failedEnvironments: [
        { id: 'staging', error: 'crm internal-archive-path' },
      ],
    });
    expect(all[0]!.occupants.map((item) => item.app?.id)).toEqual([
      'crm',
      'pr-1',
    ]);
    // Someone who reads environments but views only their own App sees the others' state and nothing else.
    const seen = await harness.services.releases.listHosts(contributor);
    expect(seen[0]!.occupants).toEqual([
      {
        app: null,
        state: 'running',
        holds: ['resident'],
        waiting: null,
        lastAccessedAt: null,
        error: null,
      },
      expect.objectContaining({ app: expect.objectContaining({ id: 'pr-1' }) }),
    ]);
    expect(seen[0]!.failedEnvironments).toEqual([
      { id: 'staging', name: 'Staging', error: null },
    ]);
    expect(JSON.stringify(seen)).not.toMatch(/crm|internal-archive-path/);
    // Without the environments setting there is nothing to list.
    const nobody = await harness.as('guest', 'nobody');
    await expect(
      harness.services.releases.listHosts(nobody),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
  });

  it('keeps an environment restore diagnostic out of the whole App detail for callers who may not read it', async () => {
    const admin = await harness.as('admin', 'admin');
    const contributor = await harness.as('dev', 'contributor');
    await harness.services.releases.createApp(contributor, {
      id: 'own',
      name: 'Own',
      environmentId: 'staging',
    });
    await harness.services.releases.createApp(admin, {
      id: 'secret-crm',
      name: 'Secret CRM',
      environmentId: 'staging',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      contributor,
      'own',
      { stream: streamOf(artifact.bytes), checksum: artifact.checksum },
    );
    const deployment = await harness.services.releases.deploy(
      contributor,
      'own',
      { releaseId: release.id },
    );
    await harness.services.releases.waitForDeployment(deployment.id);
    const diagnosis = 'secret-crm internal-archive-path cannot restore';
    // Even a driver that put the environment's restore error on each of its Apps.
    harness.fake.reported.set('own', { state: 'failed', error: diagnosis });
    const failed = (appId: string) => ({
      appId,
      environmentId: 'staging',
      state: 'failed' as const,
      version: null,
      deploymentId: null,
      startedAt: null,
      error: diagnosis,
      lastAccessedAt: '2026-11-07T01:00:00.000Z',
    });
    harness.fake.occupancy = {
      id: 'in-process',
      memory: null,
      recycling: null,
      apps: [failed('own'), failed('secret-crm')],
      failedEnvironments: [{ environmentId: 'staging', error: diagnosis }],
    };
    const key = await harness.services.callerOf({
      principal: { type: 'user', id: 'admin' },
      subjects: [{ type: 'authenticated', id: '*' }],
      keyScope: testKeyScope({ actions: ['rel.apps/view'], apps: ['own'] }),
    });
    for (const caller of [contributor, key]) {
      const detail = await harness.services.releases.getApp(caller, 'own');
      expect(JSON.stringify(detail)).not.toMatch(
        /secret-crm|Secret CRM|internal-archive-path/,
      );
      // The failure itself is still said, on the App and on its environment.
      expect(detail.runtime).toMatchObject({
        state: 'failed',
        error: UNRESTORED_APP_ERROR,
      });
      expect(detail.host?.failedEnvironments).toEqual([
        { id: 'staging', name: 'Staging', error: null },
      ]);
    }
    const all = await harness.services.releases.getApp(admin, 'own');
    expect(all.runtime?.error).toBe(diagnosis);
    expect(all.host?.failedEnvironments[0]?.error).toBe(diagnosis);
  });

  it('checks who may view the shared runtime occupants with at most one related-App lookup per read', async () => {
    const admin = await harness.as('admin', 'admin');
    const contributor = await harness.as('dev', 'contributor');
    await harness.services.releases.createApp(contributor, {
      id: 'own',
      name: 'Own',
      environmentId: 'staging',
    });
    const lookups = {
      related: 0,
      list: 0,
      among: [] as (readonly string[] | undefined)[],
    };
    const { isRelated, relatedAppIds } = harness.application;
    harness.application.isRelated = (...args) => {
      lookups.related += 1;
      return isRelated!(...args);
    };
    harness.application.relatedAppIds = (...args) => {
      lookups.list += 1;
      lookups.among.push(args[2]);
      return relatedAppIds!(...args);
    };
    const occupant = (appId: string) => ({
      appId,
      environmentId: 'staging',
      version: '1.0.0',
      deploymentId: null,
      startedAt: null,
      error: null,
      lastAccessedAt: null,
      state: 'running' as const,
      holds: ['resident' as const],
    });
    for (const count of [1, 10, 25]) {
      const others = Array.from(
        { length: count },
        (_, i) => `other-${count}-${i}`,
      );
      for (const id of others)
        await harness.services.releases.createApp(admin, {
          id,
          name: id,
          environmentId: 'staging',
        });
      // One of them is related to the contributor, so the lookup must still find it.
      harness.application.related.set('dev', [others[0]!]);
      harness.fake.occupancy = {
        id: 'in-process',
        memory: null,
        recycling: null,
        apps: [occupant('own'), ...others.map(occupant)],
        failedEnvironments: [],
      };
      lookups.related = 0;
      lookups.list = 0;
      lookups.among = [];
      const seen = await harness.services.releases.getApp(contributor, 'own');
      // One lookup, limited to the occupants: Apps elsewhere (the earlier rounds' are off this Host) are not asked.
      expect(lookups.related).toBe(0);
      expect(lookups.list).toBe(1);
      expect([...(lookups.among[0] ?? [])].sort()).toEqual([...others].sort());
      expect(
        seen.host?.occupants
          .map((item) => item.app?.id)
          .filter(Boolean)
          .sort(),
      ).toEqual(['own', others[0]].sort());
    }
  });

  it('refuses the App IDs `new` and `requests`, which the pages take beside an App', async () => {
    await expect(createApp('new')).rejects.toMatchObject({
      reason: 'INVALID_APP_ID',
    });
    await expect(createApp('requests')).rejects.toMatchObject({
      reason: 'INVALID_APP_ID',
    });
  });

  it('stores an upload once per archive and answers repeats with the same release', async () => {
    const admin = await createApp();
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const first = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(artifact.bytes),
      checksum: artifact.checksum,
      labels: { branch: 'main' },
    });
    expect(first).toMatchObject({
      version: '1.0.0',
      checksum: artifact.checksum,
      reused: false,
      labels: { branch: 'main' },
      createdBy: 'admin',
      createdVia: 'human',
    });
    const again = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(artifact.bytes),
    });
    expect(again).toMatchObject({ id: first.id, reused: true });
    expect(
      await harness.services.releases.listReleases(admin, 'shop'),
    ).toHaveLength(1);
    expect(
      harness.events.filter((event) => event.type === 'release.created'),
    ).toHaveLength(1);
  });

  it('uploads, promotes and reads archives with the longest supported artifact keys', async () => {
    const sourceId = 's'.repeat(128);
    const targetId = 't'.repeat(128);
    const admin = await createApp(sourceId);
    await createApp(targetId);
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const source = await harness.services.releases.uploadRelease(
      admin,
      sourceId,
      {
        stream: streamOf(artifact.bytes),
      },
    );
    const promoted = await harness.services.releases.promoteRelease(
      admin,
      sourceId,
      source.id,
      targetId,
    );
    for (const [appId, releaseId] of [
      [sourceId, source.id],
      [targetId, promoted.id],
    ]) {
      const row = await harness.database
        .connection()
        .query.selectFrom('relReleases')
        .select('artifactKey')
        .where('id', '=', releaseId)
        .executeTakeFirstOrThrow();
      expect(String(row.artifactKey)).toHaveLength(172);
      const deployment = await harness.services.releases.deploy(admin, appId, {
        releaseId,
      });
      // The fake driver reads the stored archive and verifies its checksum.
      expect(
        await harness.services.releases.waitForDeployment(deployment.id),
      ).toMatchObject({ status: 'succeeded' });
    }
  });

  it('replays an idempotency key and refuses it for another archive', async () => {
    const admin = await createApp();
    const one = await createArtifact(harness.rootDir, '1.0.0');
    const two = await createArtifact(harness.rootDir, '2.0.0');
    const first = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(one.bytes),
      idempotencyKey: 'build-1',
    });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(one.bytes),
        idempotencyKey: 'build-1',
      }),
    ).resolves.toMatchObject({ id: first.id, reused: true });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(two.bytes),
        idempotencyKey: 'build-1',
      }),
    ).rejects.toMatchObject({
      reason: 'IDEMPOTENCY_CONFLICT',
      status: 'ABORTED',
    });
  });

  it('refuses a wrong checksum, an empty body, an oversized archive and an invalid one', async () => {
    const admin = await createApp();
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(artifact.bytes),
        checksum: 'a'.repeat(64),
      }),
    ).rejects.toMatchObject({ reason: 'CHECKSUM_MISMATCH' });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(new Uint8Array()),
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_ARTIFACT_SIZE' });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(new Uint8Array(1024 * 1024 + 1)),
      }),
    ).rejects.toMatchObject({
      reason: 'ARTIFACT_TOO_LARGE',
      status: 'INVALID_ARGUMENT',
    });
    await expect(
      harness.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(new TextEncoder().encode('not a tarball')),
      }),
    ).rejects.toBeInstanceOf(ReleasesError);
  });

  it('deploys, records phases and logs, generates secrets and rolls back', async () => {
    const admin = await createApp();
    const v1 = await createArtifact(harness.rootDir, '1.0.0', {
      configTemplate:
        'auth:\n  secret: replace-with-a-unique-secret\napp:\n  title: Shop\n',
    });
    const v2 = await createArtifact(harness.rootDir, '2.0.0');
    const r1 = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(v1.bytes),
    });
    const r2 = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(v2.bytes),
    });

    const first = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: r1.id,
    });
    expect(first).toMatchObject({
      status: 'queued',
      kind: 'deploy',
      actorId: 'admin',
    });
    expect(
      await harness.services.releases.waitForDeployment(first.id),
    ).toMatchObject({
      status: 'succeeded',
      phase: 'completed',
    });
    // What leaves the server is masked; the runtime gets the generated secrets.
    const config = await harness.services.releases.readConfig(admin, 'shop');
    expect(config.secrets.map((secret) => secret.path.join('.'))).toEqual([
      'auth.secret',
      'secrets.keys.0.key',
      'session.secret',
    ]);
    expect(parseYaml(config.content!)).toMatchObject({
      auth: { secret: CONFIG_SECRET_MASK },
      secrets: { keys: [{ version: 1, key: CONFIG_SECRET_MASK }] },
    });
    const parsed = parseYaml(runtimeConfig('shop')) as {
      auth: { secret: string };
      session: { secret: string };
      secrets: { keys: { version: number; key: string }[] };
      app: { title: string; publicOrigin: string };
    };
    expect(parsed.app.title).toBe('Shop');
    expect(parsed.app.publicOrigin).toBe('https://shop.fake.test');
    expect(parsed.auth.secret).not.toBe('replace-with-a-unique-secret');
    expect(parsed.auth.secret.length).toBeGreaterThanOrEqual(32);
    expect(parsed.session.secret.length).toBeGreaterThanOrEqual(32);
    expect(parsed.secrets.keys).toEqual([
      { version: 1, key: expect.stringMatching(/^[0-9a-f]{64}$/u) },
    ]);

    const second = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: r2.id,
    });
    await harness.services.releases.waitForDeployment(second.id);
    // A later release keeps the configuration the App already uses, secrets included.
    const kept = parseYaml(runtimeConfig('shop')) as {
      auth: { secret: string };
      secrets: unknown;
    };
    expect(kept.auth.secret).toBe(parsed.auth.secret);
    expect(kept.secrets).toEqual(parsed.secrets);
    expect(harness.fake.running.get('shop')?.release.version).toBe('2.0.0');

    const rollback = await harness.services.releases.rollback(admin, 'shop', {
      deploymentId: first.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(rollback.id),
    ).toMatchObject({
      status: 'succeeded',
      kind: 'rollback',
      rollbackTargetDeploymentId: first.id,
      releaseId: r1.id,
    });
    expect(harness.fake.running.get('shop')?.release.version).toBe('1.0.0');
    const summary = await harness.services.releases.getApp(admin, 'shop');
    expect(summary).toMatchObject({
      currentVersion: '1.0.0',
      runtime: { state: 'running', version: '1.0.0' },
      url: 'https://shop.fake.test/',
    });
    const history = await harness.services.releases.listDeployments(
      admin,
      'shop',
    );
    expect(history.items.map((item) => item.kind)).toEqual([
      'rollback',
      'deploy',
      'deploy',
    ]);
    const logs = await harness.services.releases.readLogs(
      admin,
      'shop',
      { fromStart: true },
      first.id,
    );
    expect(logs.entries.map((entry) => entry.phase)).toEqual(
      expect.arrayContaining([
        'queued',
        'resolving',
        'starting',
        'health_check',
        'completed',
      ]),
    );
    expect(harness.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(['deployment.succeeded', 'deployment.rolledBack']),
    );
  });

  it('keeps the previous version when a deployment fails and reports it', async () => {
    const admin = await createApp();
    const good = await createArtifact(harness.rootDir, '1.0.0');
    const bad = await createArtifact(harness.rootDir, '1.1.0');
    harness.fake.failing.add('1.1.0');
    const r1 = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(good.bytes),
      deploy: {},
    });
    await harness.services.releases.waitForDeployment(r1.deploymentId!);
    const r2 = await harness.services.releases.uploadRelease(admin, 'shop', {
      stream: streamOf(bad.bytes),
    });
    const failed = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: r2.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(failed.id),
    ).toMatchObject({
      status: 'failed',
      error: 'boom',
    });
    expect(
      (await harness.services.releases.getApp(admin, 'shop')).currentVersion,
    ).toBe('1.0.0');
    const event = harness.events.find(
      (item) => item.type === 'deployment.failed',
    );
    expect(event).toMatchObject({
      error: 'boom',
      deployment: { id: failed.id },
    });
    // Rolling back to a failed deployment is refused.
    await expect(
      harness.services.releases.rollback(admin, 'shop', {
        deploymentId: failed.id,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_ROLLBACK_TARGET' });
  });

  it('promotes a release into another App by checksum, without uploading again', async () => {
    const admin = await createApp('shop');
    await harness.environment({
      id: 'production',
      name: 'Production',
      driver: 'fake',
    });
    await harness.services.releases.createApp(admin, {
      id: 'shop-prod',
      name: 'Shop',
      environmentId: 'production',
    });
    const artifact = await createArtifact(harness.rootDir, '3.0.0');
    const source = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      {
        stream: streamOf(artifact.bytes),
        labels: { release: 'R-12' },
      },
    );
    const promoted = await harness.services.releases.promoteRelease(
      admin,
      'shop',
      source.id,
      'shop-prod',
    );
    expect(promoted).toMatchObject({
      appId: 'shop-prod',
      checksum: artifact.checksum,
      sourceReleaseId: source.id,
      labels: { release: 'R-12' },
      reused: false,
    });
    await expect(
      harness.services.releases.promoteRelease(
        admin,
        'shop',
        source.id,
        'shop-prod',
      ),
    ).resolves.toMatchObject({ id: promoted.id, reused: true });
    const deployment = await harness.services.releases.deploy(
      admin,
      'shop-prod',
      {
        releaseId: promoted.id,
      },
    );
    expect(
      await harness.services.releases.waitForDeployment(deployment.id),
    ).toMatchObject({
      status: 'succeeded',
    });
    // Labels are the application's to change, and filter listings.
    await harness.services.releases.labelRelease(
      admin,
      'shop-prod',
      promoted.id,
      {
        release: 'R-12',
        issues: 'FG-1,FG-2',
      },
    );
    expect(
      await harness.services.releases.listReleases(admin, 'shop-prod', {
        labels: { issues: 'FG-1,FG-2' },
      }),
    ).toHaveLength(1);
  });

  it('restores the desired set at startup and fails interrupted deployments', async () => {
    const admin = await createApp();
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      {
        stream: streamOf(artifact.bytes),
        deploy: {},
      },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    await harness.database
      .connection()
      .query.insertInto('relDeployments')
      .values({
        id: '00000000-0000-0000-0000-000000000001',
        appId: 'shop',
        releaseId: release.id,
        kind: 'deploy',
        status: 'deploying',
        phase: 'starting',
        configMode: 'file',
        actorKind: 'human',
        createdAt: new Date(),
      })
      .execute();
    await harness.services.releases.restore();
    await harness.services.releases.listApps(admin);
    expect(harness.fake.restored.at(-1)?.map((spec) => spec.appId)).toEqual([
      'shop',
    ]);
    // The interrupted deployment is finalised in the background, once its driver says it knows nothing of it.
    await harness.services.releases.waitForDeployment(
      '00000000-0000-0000-0000-000000000001',
      5_000,
    );
    expect(
      await harness.services.releases.getDeployment(
        admin,
        'shop',
        '00000000-0000-0000-0000-000000000001',
      ),
    ).toMatchObject({ status: 'failed' });
  });

  it('finalises recorded deployments in creation order before restoring the environment', async () => {
    const recorded = createFakeDriver('recorded');
    const local = await createHarness({ drivers: [recorded.driver] });
    try {
      await local.environment({
        id: 'preview',
        name: 'Preview',
        driver: 'recorded',
      });
      const admin = await local.as('admin', 'admin');
      await local.services.releases.createApp(admin, {
        id: 'shop',
        name: 'Shop',
        environmentId: 'preview',
      });
      const first = await createArtifact(local.rootDir, '1.0.0');
      const v1 = await local.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(first.bytes),
        deploy: {},
      });
      await local.services.releases.waitForDeployment(v1.deploymentId!);
      const second = await createArtifact(local.rootDir, '2.0.0');
      const v2 = await local.services.releases.uploadRelease(admin, 'shop', {
        stream: streamOf(second.bytes),
      });
      const finished = '00000000-0000-0000-0000-000000000004';
      const forgotten = '00000000-0000-0000-0000-000000000005';
      const latest = '00000000-0000-0000-0000-000000000006';
      const createdAt = Date.now();
      // Storage iteration order must not decide which completed deployment becomes current.
      for (const [id, offset] of [
        [latest, 2],
        [forgotten, 3],
        [finished, 1],
      ] as const)
        await local.database
          .connection()
          .query.insertInto('relDeployments')
          .values({
            id,
            appId: 'shop',
            releaseId: v2.id,
            kind: 'deploy',
            status: 'deploying',
            phase: 'starting',
            configMode: 'file',
            previousDeploymentId: v1.deploymentId,
            actorKind: 'human',
            createdAt: new Date(createdAt + offset),
          })
          .execute();
      // Both runtime operations completed before SQL settlement; the third never reached the Host.
      for (const id of [finished, latest])
        recorded.state.resumable.set(id, {
          state: 'running',
          version: '2.0.0',
          deploymentId: id,
          startedAt: new Date().toISOString(),
          error: null,
        });
      await local.services.releases.restore();
      // Readers wait for the outcome, and the environment is restored with the finished deployment as current.
      await local.services.releases.listApps(admin);
      expect(
        await local.services.releases.getDeployment(admin, 'shop', finished),
      ).toMatchObject({
        status: 'succeeded',
        previousDeploymentId: v1.deploymentId,
      });
      expect(
        await local.services.releases.getDeployment(admin, 'shop', latest),
      ).toMatchObject({ status: 'succeeded', previousDeploymentId: finished });
      expect(
        (await local.services.releases.getApp(admin, 'shop')).app
          .currentDeploymentId,
      ).toBe(latest);
      expect(
        local.events
          .filter((event) => event.type === 'deployment.succeeded')
          .slice(-2)
          .map((event) => event.deployment.id),
      ).toEqual([finished, latest]);
      expect(
        await local.services.releases.getDeployment(admin, 'shop', forgotten),
      ).toMatchObject({
        status: 'failed',
        error:
          'Deployment was interrupted by a restart. Deploy the release again.',
      });
      expect(recorded.state.restored.at(-1)).toEqual([
        expect.objectContaining({
          deploymentId: latest,
          release: expect.objectContaining({ version: '2.0.0' }),
        }),
      ]);
    } finally {
      await local.close();
    }
  });

  it('deletes an App with its data only after confirmation', async () => {
    const admin = await createApp();
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      {
        stream: streamOf(artifact.bytes),
        deploy: {},
      },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    await expect(
      harness.services.releases.deleteApp(admin, 'shop'),
    ).rejects.toMatchObject({
      reason: 'CONFIRMATION_REQUIRED',
    });
    await harness.services.releases.deleteApp(admin, 'shop', {
      confirm: 'shop',
    });
    expect(harness.fake.removed).toEqual(['shop']);
    await expect(
      harness.services.releases.getApp(admin, 'shop'),
    ).rejects.toMatchObject({
      reason: 'APP_NOT_FOUND',
    });
    expect(harness.events.at(-1)).toMatchObject({ type: 'app.removed' });
  });

  it('mints an upload ticket inside a caller’s transaction, on its connection', async () => {
    const admin = await createApp();
    // SQLite in memory has one connection: a ticket read or written outside the transaction would wait for it.
    const ticket = await harness.database.transaction((conn) =>
      harness.services.tickets.create(admin, 'shop', { ttlSeconds: 60 }, conn),
    );
    expect(ticket).toMatchObject({ appId: 'shop', deploy: false });
    const used = await harness.services.tickets.consume(ticket.token, 'shop');
    expect(used.caller).toMatchObject({ userId: 'admin', kind: 'key' });
    await expect(
      harness.database.transaction((conn) =>
        harness.services.tickets.create(admin, 'shop', { deploy: true }, conn),
      ),
    ).rejects.toMatchObject({ reason: 'TICKET_DEPLOY_REFUSED' });
  });
});
