// @vitest-environment node
/**
 * An App's runtime policy: `eager` or `onDemand` activation, the idle stop and dormancy. Created and changed through
 * the services, checked, stored, handed to the driver in every deployment spec, and sent again when it changes; the
 * runtime's `starting` and `dormant` states and last access reach the App summary.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createArtifact,
  createHarness,
  streamOf,
  type Harness,
} from './harness.js';

describe('App runtime policy', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await createHarness();
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'fake',
    });
  });
  afterEach(async () => {
    await harness.close();
  });

  it('defaults to an App that always runs, with no timers', async () => {
    const admin = await harness.as('admin', 'admin');
    const created = await harness.services.releases.createApp(admin, {
      id: 'site',
      name: 'Site',
      environmentId: 'preview',
    });
    expect(created.app).toMatchObject({
      activation: 'eager',
      idleStopMinutes: null,
      dormantAfterHours: null,
    });
    expect(created.runtime.lastAccessedAt).toBeNull();
  });

  it('stores an on-demand policy and hands it to the driver with each deployment', async () => {
    const rule = await harness.as('owner', 'admin', 'rule');
    const created = await harness.services.releases.createApp(rule, {
      id: 'fg-1--app',
      name: 'FG-1 preview',
      environmentId: 'preview',
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    expect(created.app).toMatchObject({
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      rule,
      'fg-1--app',
      { stream: streamOf(artifact.bytes), deploy: {} },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    expect(harness.fake.applied.at(-1)).toMatchObject({
      appId: 'fg-1--app',
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
  });

  it('refuses a policy that cannot work', async () => {
    const admin = await harness.as('admin', 'admin');
    const base = { name: 'X', environmentId: 'preview' } as const;
    await expect(
      harness.services.releases.createApp(admin, {
        ...base,
        id: 'a1',
        activation: 'lazy' as never,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_ACTIVATION_POLICY' });
    await expect(
      harness.services.releases.createApp(admin, {
        ...base,
        id: 'a2',
        idleStopMinutes: 0,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_IDLE_STOP' });
    await expect(
      harness.services.releases.createApp(admin, {
        ...base,
        id: 'a3',
        idleStopMinutes: 1.5,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_IDLE_STOP' });
    await expect(
      harness.services.releases.createApp(admin, {
        ...base,
        id: 'a4',
        dormantAfterHours: 0.001,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_DORMANCY' });
    // Dormant only after it stopped: six minutes is before a ten-minute idle stop.
    await expect(
      harness.services.releases.createApp(admin, {
        ...base,
        id: 'a5',
        idleStopMinutes: 10,
        dormantAfterHours: 0.1,
      }),
    ).rejects.toMatchObject({ reason: 'INVALID_DORMANCY' });
    const short = await harness.services.releases.createApp(admin, {
      ...base,
      id: 'a6',
      activation: 'onDemand',
      idleStopMinutes: 1,
      dormantAfterHours: 0.05,
    });
    expect(short.app.dormantAfterHours).toBeCloseTo(0.05);
  });

  it('sends a changed policy to the runtime and clears a timer with null', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'site',
      name: 'Site',
      environmentId: 'preview',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'site',
      { stream: streamOf(artifact.bytes), deploy: {} },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    const restores = harness.fake.restored.length;

    const changed = await harness.services.releases.updateApp(admin, 'site', {
      activation: 'onDemand',
      idleStopMinutes: 15,
      dormantAfterHours: 48,
    });
    expect(changed.app).toMatchObject({
      activation: 'onDemand',
      idleStopMinutes: 15,
      dormantAfterHours: 48,
    });
    expect(harness.fake.restored).toHaveLength(restores + 1);
    expect(harness.fake.restored.at(-1)?.[0]).toMatchObject({
      appId: 'site',
      activation: 'onDemand',
      idleStopMinutes: 15,
      dormantAfterHours: 48,
    });

    // Labels alone do not reach the runtime.
    await harness.services.releases.updateApp(admin, 'site', {
      labels: { team: 'web' },
    });
    expect(harness.fake.restored).toHaveLength(restores + 1);

    const cleared = await harness.services.releases.updateApp(admin, 'site', {
      dormantAfterHours: null,
    });
    expect(cleared.app).toMatchObject({
      idleStopMinutes: 15,
      dormantAfterHours: null,
      labels: { team: 'web' },
    });
    expect(harness.fake.restored.at(-1)?.[0]).toMatchObject({
      dormantAfterHours: null,
    });
  });

  it('reports a starting or dormant runtime and its last access', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'site',
      name: 'Site',
      environmentId: 'preview',
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'site',
      { stream: streamOf(artifact.bytes), deploy: {} },
    );
    await harness.services.releases.waitForDeployment(release.deploymentId!);
    harness.fake.reported.set('site', {
      state: 'dormant',
      lastAccessedAt: '2026-10-01T08:00:00.000Z',
    });
    expect(
      (await harness.services.releases.getApp(admin, 'site')).runtime,
    ).toMatchObject({
      state: 'dormant',
      lastAccessedAt: '2026-10-01T08:00:00.000Z',
    });
    harness.fake.reported.set('site', { state: 'starting' });
    expect(
      (await harness.services.releases.getApp(admin, 'site')).runtime.state,
    ).toBe('starting');
  });
});
