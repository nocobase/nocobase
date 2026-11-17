// @vitest-environment node
/**
 * Apps, releases and deployments through the fake driver: upload with checksum dedupe, idempotency and size limits;
 * deploy, rollback and failure with their phases, logs and events; configuration from the release template with
 * generated secrets; promotion between Apps.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parse as parseYaml } from 'yaml';

import {
  UNRESTORED_APP_ERROR,
  type AppDeploymentSpec,
  type AppObservedStatus,
  type HostOccupancy,
} from '../server/drivers/types.js';
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

  /** Marks an App as running on the fake driver, with what its status reports instead. */
  function observe(
    appId: string,
    reported: Partial<AppObservedStatus> = {},
  ): void {
    harness.fake.running.set(appId, {
      appId,
      deploymentId: null,
      release: { version: '1.0.0' },
    } as unknown as AppDeploymentSpec);
    harness.fake.reported.set(appId, reported);
  }

  /** What the host reports: the Apps on it with their environment and observed state. */
  function occupancyOf(
    apps: readonly [string, string | null, Partial<AppObservedStatus>][],
    fields: Partial<HostOccupancy> = {},
  ): HostOccupancy {
    return {
      id: 'in-process',
      memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
      recycling: null,
      maxActive: 4,
      apps: apps.map(([appId, environmentId, observed]) => ({
        appId,
        environmentId,
        state: 'running',
        version: '1.0.0',
        deploymentId: null,
        startedAt: null,
        error: null,
        lastAccessedAt: null,
        ...observed,
      })),
      failedEnvironments: [],
      ...fields,
    };
  }

  it('keeps an App not yet on the host, pending a first start or a restore, out of the running count and its link alike', async () => {
    const admin = await createApp('restoring');
    observe('restoring', { state: 'pending' });
    // A restart restoring it: the host lists it pending, holding no slot.
    harness.fake.occupancy = occupancyOf([
      ['restoring', 'staging', { state: 'pending' }],
    ]);
    const [host] = await harness.services.releases.listHosts(admin);
    expect(host?.running).toBe(0);
    const linked = await harness.services.releases.listApps(admin, {
      environmentIds: ['staging'],
      runStates: ['running', 'starting'],
    });
    expect(linked.total).toBe(host?.running);
    // It is found under its own state.
    const pending = await harness.services.releases.listApps(admin, {
      runStates: ['pending'],
    });
    expect(pending.items.map((item) => item.app.id)).toEqual(['restoring']);
    // Once it starts, the card and the link count it alike.
    observe('restoring', { state: 'starting' });
    harness.fake.occupancy = occupancyOf([
      ['restoring', 'staging', { state: 'starting' }],
    ]);
    const [started] = await harness.services.releases.listHosts(admin);
    expect(started?.running).toBe(1);
    expect(
      (
        await harness.services.releases.listApps(admin, {
          environmentIds: ['staging'],
          runStates: ['running', 'starting'],
        })
      ).total,
    ).toBe(1);
  });

  it('answers the shared runtime on the single-App read as whole-host totals, naming no other App', async () => {
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
    harness.fake.occupancy = occupancyOf(
      [
        ['crm', 'staging', { holds: ['requests'], error: 'crm detail' }],
        ['pr-1', 'preview', { state: 'stopped', waiting: 'memory' }],
        ['broken', 'preview', { state: 'failed', error: 'boom' }],
        ['outside', null, { state: 'starting' }],
      ],
      {
        recycling: 'pending',
        failedEnvironments: [
          {
            environmentId: 'staging',
            error: 'secret-crm internal-archive-path cannot restore',
          },
        ],
      },
    );
    const seen = await harness.services.releases.getApp(contributor, 'pr-1');
    expect(seen.host).toEqual({
      id: 'in-process',
      memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
      recycling: 'pending',
      deployed: 4,
      // Running or starting; the failed App holds nothing.
      running: 2,
      maxActive: 4,
      // Reading environments does not reveal what their restore error says about Apps the caller cannot view.
      failedEnvironments: [{ id: 'staging', name: 'Staging', error: null }],
    });
    // Nothing of another App reaches the caller in any field.
    expect(JSON.stringify(seen)).not.toMatch(
      /crm|internal-archive-path|broken/,
    );
    const all = await harness.services.releases.getApp(admin, 'pr-1');
    expect(all.host?.failedEnvironments).toEqual([
      {
        id: 'staging',
        name: 'Staging',
        error: 'secret-crm internal-archive-path cannot restore',
      },
    ]);
    // Lists stay cheap: only the single-App read asks the driver about the runtime.
    const page = await harness.services.releases.listApps(admin, {});
    expect(page.items.every((item) => item.host === undefined)).toBe(true);
  });

  it('lists each shared runtime once for the environments page, with its environments, limit and running count', async () => {
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
    // A driver whose environments share no runtime lists none.
    expect(await harness.services.releases.listHosts(admin)).toEqual([]);
    harness.fake.occupancy = occupancyOf(
      [
        ['crm', 'staging', {}],
        ['pr-1', 'preview', { state: 'failed', error: 'boom' }],
      ],
      {
        recycling: 'restarting',
        maxActive: null,
        failedEnvironments: [
          { environmentId: 'staging', error: 'crm internal-archive-path' },
        ],
      },
    );
    // Both environments report the same runtime: it is listed once, naming both with their running Apps (the failed
    // one holds nothing), which add up to the host's.
    const all = await harness.services.releases.listHosts(admin);
    expect(all).toEqual([
      {
        id: 'in-process',
        memory: { heapUsed: 1, heapLimit: 2, rss: 3, available: 4 },
        recycling: 'restarting',
        deployed: 2,
        running: 1,
        maxActive: null,
        environments: [
          { id: 'preview', name: 'Preview', running: 0 },
          { id: 'staging', name: 'Staging', running: 1 },
        ],
        failedEnvironments: [
          {
            id: 'staging',
            name: 'Staging',
            error: 'crm internal-archive-path',
          },
        ],
      },
    ]);
    // Someone who reads environments but not their restore errors gets the same totals without them.
    const seen = await harness.services.releases.listHosts(contributor);
    expect(seen[0]).toMatchObject({ running: 1, deployed: 2 });
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

  it('filters Apps by environments and runtime state before it cuts the page, among the Apps the caller may view', async () => {
    const admin = await harness.as('admin', 'admin');
    const contributor = await harness.as('dev', 'contributor');
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'fake',
    });
    await harness.environment({ id: 'other', name: 'Other', driver: 'fake' });
    const create = async (
      caller: typeof admin,
      id: string,
      environmentId: string,
    ) =>
      await harness.services.releases.createApp(caller, {
        id,
        name: id,
        environmentId,
      });
    // Twelve running Apps spread over the list, created between stopped ones so no single page holds them all.
    for (let i = 0; i < 12; i += 1) {
      await create(admin, `run-${i}`, i % 2 ? 'preview' : 'staging');
      observe(`run-${i}`);
      await create(admin, `idle-${i}`, 'staging');
    }
    await create(admin, 'starting', 'preview');
    observe('starting', { state: 'starting' });
    await create(admin, 'broken', 'staging');
    observe('broken', { state: 'failed', error: 'boom' });
    await create(admin, 'queued', 'preview');
    observe('queued', { state: 'stopped', waiting: 'memory' });
    await create(admin, 'elsewhere', 'other');
    observe('elsewhere');
    await create(contributor, 'mine', 'preview');
    observe('mine');

    const list = async (
      caller: typeof admin,
      options: Parameters<typeof harness.services.releases.listApps>[1],
    ) => await harness.services.releases.listApps(caller, options);
    const ids = (page: { items: readonly { app: { id: string } }[] }) =>
      page.items.map((item) => item.app.id).sort();

    // What the host card links to: running or starting Apps of its environments; failed and waiting ones are not.
    const card = {
      environmentIds: ['staging', 'preview'],
      runStates: ['running', 'starting'] as const,
    };
    const first = await list(admin, { ...card, pageSize: 5 });
    expect(first.total).toBe(14);
    expect(first.items).toHaveLength(5);
    const pages = [first];
    for (let page = 2; page <= 3; page += 1)
      pages.push(await list(admin, { ...card, pageSize: 5, page }));
    expect(pages.flatMap((page) => ids(page)).sort()).toEqual(
      [
        ...Array.from({ length: 12 }, (_, i) => `run-${i}`),
        'starting',
        'mine',
      ].sort(),
    );
    expect(first.items[0]?.runtime.state).toMatch(/running|starting/);
    expect(ids(await list(admin, { runStates: ['failed'] }))).toEqual([
      'broken',
    ]);
    expect(ids(await list(admin, { runStates: ['waiting'] }))).toEqual([
      'queued',
    ]);
    expect(
      (
        await list(admin, {
          runStates: ['stopped'],
          environmentIds: ['staging'],
        })
      ).total,
    ).toBe(12);
    // Another environment's App is left out unless named.
    expect(
      ids(
        await list(admin, {
          runStates: ['running'],
          environmentIds: ['other'],
        }),
      ),
    ).toEqual(['elsewhere']);
    // The same filter for someone who views only their own App: the subset they may view, no hidden rows.
    const own = await list(contributor, { ...card });
    expect(ids(own)).toEqual(['mine']);
    expect(own.total).toBe(1);
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
      maxActive: null,
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
