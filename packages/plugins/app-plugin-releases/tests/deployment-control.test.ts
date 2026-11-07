import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createReleases } from '../server/composition.js';
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Knex } from 'knex';
import type {
  AppDeploymentSpec,
  AppObservedStatus,
  DeploymentEvent,
} from '../server/drivers/types.js';
import {
  createApiServer,
  createArtifact,
  createFakeDriver,
  createHarness,
  streamOf,
  TEST_SECRETS,
  type Harness,
} from './harness.js';

function controlledDriver() {
  const fake = createFakeDriver('controlled');
  const operations = new Map<
    string,
    {
      spec: AppDeploymentSpec;
      started: boolean;
      cancelled: boolean;
      event?: (entry: DeploymentEvent) => void;
      finish(): void;
    }
  >();
  const open = fake.driver.open.bind(fake.driver);
  fake.driver.open = async (...args) => {
    const session = await open(...args);
    const apply = session.apply.bind(session);
    return {
      ...session,
      progress: async (id: string) => {
        const op = operations.get(id);
        return op
          ? {
              state: op.started ? ('running' as const) : ('queued' as const),
              queueAhead: op.started ? null : 1,
              cancellable: true,
            }
          : null;
      },
      cancel: async (id: string, _app: string, queuedOnly?: boolean) => {
        const op = operations.get(id);
        if (!op) return 'notFound' as const;
        if (queuedOnly && op.started) return 'tooLate' as const;
        op.cancelled = true;
        if (!op.started) op.finish();
        return op.started ? ('cancelling' as const) : ('cancelled' as const);
      },
      apply: async (
        spec: AppDeploymentSpec,
        event?: (entry: DeploymentEvent) => void,
      ): Promise<AppObservedStatus> => {
        let finish!: () => void;
        const gate = new Promise<void>((resolve) => {
          finish = resolve;
        });
        const op = { spec, started: false, cancelled: false, event, finish };
        operations.set(spec.deploymentId, op);
        event?.({ phase: 'queued', queueAhead: 1 });
        await gate;
        if (op.cancelled)
          return {
            state: 'cancelled',
            version: null,
            deploymentId: spec.deploymentId,
            startedAt: null,
            error: null,
          };
        return apply(spec, event);
      },
    };
  };
  return {
    driver: fake.driver,
    state: fake.state,
    operations,
    async ready(id: string) {
      await vi.waitFor(() => expect(operations.has(id)).toBe(true));
    },
    start(id: string) {
      const op = operations.get(id)!;
      op.started = true;
      op.event?.({ phase: 'resolving' });
    },
  };
}

describe('deployment control', () => {
  let harness: Harness;
  let control: ReturnType<typeof controlledDriver>;
  let server: Awaited<ReturnType<typeof createApiServer>> | undefined;
  beforeEach(async () => {
    control = controlledDriver();
    harness = await createHarness({ drivers: [control.driver] });
    await harness.environment({
      id: 'preview',
      name: 'Preview',
      driver: 'controlled',
    });
  });
  afterEach(async () => {
    for (const op of control.operations.values()) op.finish();
    await server?.close();
    server = undefined;
    await harness.close();
  });
  async function setup() {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'shop',
      name: 'Shop',
      environmentId: 'preview',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'shop',
      { stream: streamOf(artifact.bytes) },
    );
    return { admin, release };
  }

  it('reopens cancellation after a completed attempt enters a capacity wait', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'capacity',
      name: 'Capacity',
      environmentId: 'preview',
    });
    const artifact = await createArtifact(harness.rootDir, '1.0.0');
    const release = await harness.services.releases.uploadRelease(
      admin,
      'capacity',
      {
        stream: (async function* () {
          yield artifact.bytes;
        })(),
      },
    );
    const deployment = await harness.services.releases.deploy(
      admin,
      'capacity',
      { releaseId: release.id },
    );
    await control.ready(deployment.id);
    const operation = control.operations.get(deployment.id)!;
    operation.event?.({ phase: 'starting', sequence: 1 });
    await vi.waitFor(async () =>
      expect(
        (
          await harness.services.releases.listDeployments(admin, 'capacity')
        ).items.find((item) => item.id === deployment.id)!.cancellable,
      ).toBe(false),
    );
    operation.event?.({
      phase: 'queued',
      queueAhead: 0,
      sequence: 2,
      cancellable: true,
    });
    await vi.waitFor(async () =>
      expect(
        (
          await harness.services.releases.listDeployments(admin, 'capacity')
        ).items.find((item) => item.id === deployment.id)!.cancellable,
      ).toBe(true),
    );
    expect(
      (
        await harness.services.releases.cancelDeployment(
          admin,
          'capacity',
          deployment.id,
        )
      ).status,
    ).toBe('cancelled');
  });

  it('keeps the running deployment and only the newest queued deployment, including upload-and-deploy', async () => {
    const { admin, release } = await setup();
    const releases = harness.services.releases;
    const first = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(first.id);
    control.start(first.id);
    await vi.waitFor(async () =>
      expect(
        (await releases.getDeployment(admin, 'shop', first.id)).status,
      ).toBe('deploying'),
    );
    const second = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(second.id);
    const third = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(third.id);
    expect((await releases.waitForDeployment(second.id)).status).toBe(
      'cancelled',
    );
    expect((await releases.getDeployment(admin, 'shop', first.id)).status).toBe(
      'deploying',
    );
    await expect(
      releases.deploy(admin, 'shop', { releaseId: 'missing' }),
    ).rejects.toMatchObject({ reason: 'RELEASE_NOT_FOUND' });
    expect((await releases.getDeployment(admin, 'shop', third.id)).status).toBe(
      'queued',
    );
    const artifact = await createArtifact(harness.rootDir, '2.0.0');
    const upload = await releases.uploadRelease(admin, 'shop', {
      stream: streamOf(artifact.bytes),
      deploy: {},
    });
    await control.ready(upload.deploymentId!);
    expect((await releases.waitForDeployment(third.id)).status).toBe(
      'cancelled',
    );
    control.operations.get(first.id)!.finish();
    expect((await releases.waitForDeployment(first.id)).status).toBe(
      'succeeded',
    );
    control.start(upload.deploymentId!);
    control.operations.get(upload.deploymentId!)!.finish();
    expect(
      (await releases.waitForDeployment(upload.deploymentId!)).status,
    ).toBe('succeeded');
    const app = await releases.getApp(admin, 'shop');
    expect(app.app.currentDeploymentId).toBe(upload.deploymentId);
    expect(
      harness.events.filter((event) => event.type === 'deployment.cancelled'),
    ).toHaveLength(2);
  });

  it('settles runtime successors in order when an earlier success transaction is delayed', async () => {
    const { admin, release } = await setup();
    const releases = harness.services.releases;
    const first = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
      config: { mode: 'file', content: 'app:\n  title: First\n' },
    });
    await control.ready(first.id);
    control.start(first.id);
    await vi.waitFor(async () =>
      expect(
        (await releases.getDeployment(admin, 'shop', first.id)).status,
      ).toBe('deploying'),
    );
    const obsolete = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(obsolete.id);
    const second = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
      config: { mode: 'file', content: 'app:\n  title: Second\n' },
    });
    // Cancellation drains its own run immediately even though the settlement chain still contains First.
    expect((await releases.waitForDeployment(obsolete.id)).status).toBe(
      'cancelled',
    );
    await control.ready(second.id);
    let releaseTransaction!: () => void;
    let reachedTransaction = false;
    const held = new Promise<void>((resolve) => {
      releaseTransaction = resolve;
    });
    const transaction = harness.database.transaction.bind(harness.database);
    vi.spyOn(harness.database, 'transaction').mockImplementationOnce(
      async (...args) => {
        reachedTransaction = true;
        await held;
        return transaction(...args);
      },
    );
    try {
      control.operations.get(first.id)!.finish();
      await vi.waitFor(() => expect(reachedTransaction).toBe(true));
      control.start(second.id);
      control.operations.get(second.id)!.finish();
      // The Host can finish the warm successor while the predecessor's SQL is held.
      await vi.waitFor(() =>
        expect(control.state.running.get('shop')?.deploymentId).toBe(second.id),
      );
      expect(
        harness.events.filter((event) => event.type === 'deployment.succeeded'),
      ).toHaveLength(0);
    } finally {
      releaseTransaction();
    }
    expect((await releases.waitForDeployment(first.id)).status).toBe(
      'succeeded',
    );
    const finished = await releases.waitForDeployment(second.id);
    expect(finished.status).toBe('succeeded');
    expect(finished.previousDeploymentId).toBe(first.id);
    expect((await releases.getApp(admin, 'shop')).app.currentDeploymentId).toBe(
      second.id,
    );
    const configs = await harness.database
      .connection()
      .query.selectFrom('relDeployments')
      .select(['id', 'configPath'])
      .where('id', 'in', [first.id, second.id])
      .execute();
    const current = configs.find((row) => row.id === second.id)!;
    expect(await readFile(current.configPath!, 'utf8')).toContain(
      'title: Second',
    );
    await expect(
      readFile(configs.find((row) => row.id === first.id)!.configPath!, 'utf8'),
    ).rejects.toMatchObject({ code: 'ENOENT' });
    const events = harness.events.filter(
      (event) => event.type === 'deployment.succeeded',
    );
    expect(events.map((event) => event.deployment.id)).toEqual([
      first.id,
      second.id,
    ]);
    expect(events.map((event) => event.app.currentDeploymentId)).toEqual([
      first.id,
      second.id,
    ]);
  });

  it('waits for cleanup before settling a running cancellation and repeats safely', async () => {
    const { admin, release } = await setup();
    const releases = harness.services.releases;
    const deployment = await releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(deployment.id);
    control.start(deployment.id);
    expect(
      (await releases.cancelDeployment(admin, 'shop', deployment.id)).status,
    ).toBe('cancelling');
    expect(
      (await releases.cancelDeployment(admin, 'shop', deployment.id)).status,
    ).toBe('cancelling');
    control.operations.get(deployment.id)!.finish();
    expect((await releases.waitForDeployment(deployment.id)).status).toBe(
      'cancelled',
    );
    expect(
      (await releases.cancelDeployment(admin, 'shop', deployment.id)).status,
    ).toBe('cancelled');
    expect(
      harness.events.filter((event) => event.type === 'deployment.cancelled'),
    ).toHaveLength(1);
    expect(
      harness.events.filter((event) => event.type === 'deployment.failed'),
    ).toHaveLength(0);
  });

  it('asks the runtime to cancel when another controller has no local dispatch record', async () => {
    const { admin, release } = await setup();
    const deployment = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(deployment.id);
    control.start(deployment.id);
    await vi.waitFor(async () =>
      expect(
        (
          await harness.services.releases.getDeployment(
            admin,
            'shop',
            deployment.id,
          )
        ).status,
      ).toBe('deploying'),
    );
    const reopened = createReleases({
      database: harness.database,
      drivers: harness.services.drivers,
      access: () => harness.application,
      secrets: TEST_SECRETS,
      config: {
        artifact: {
          driver: 'fs',
          location: path.join(harness.rootDir, 'artifacts'),
          visibility: 'private',
        },
        dataDir: path.join(harness.rootDir, 'data'),
      },
    });
    try {
      expect(
        (await reopened.releases.cancelDeployment(admin, 'shop', deployment.id))
          .status,
      ).toBe('cancelling');
      expect(control.operations.get(deployment.id)!.cancelled).toBe(true);
      control.operations.get(deployment.id)!.finish();
      expect(
        (await harness.services.releases.waitForDeployment(deployment.id))
          .status,
      ).toBe('cancelled');
    } finally {
      await reopened.releases.shutdown();
    }
  });

  it('enforces authentication, deploy permission and App scope at the production cancel route', async () => {
    const { admin, release } = await setup();
    const deployment = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(deployment.id);
    server = await createApiServer(harness.services);
    await harness.as('viewer', 'viewer');
    await harness.as('outsider', 'contributor');
    const url = `${server.url}/apps/shop/deployments/${deployment.id}/cancel`;
    expect((await fetch(url, { method: 'POST' })).status).toBe(401);
    for (const user of ['viewer', 'outsider'])
      expect(
        (await fetch(url, { method: 'POST', headers: { 'x-test-user': user } }))
          .status,
      ).toBe(403);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'x-test-user': 'admin' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: { status: 'cancelled' },
    });
  });

  it('does not write queue positions and bounds a detail poll to three reads', async () => {
    const { admin, release } = await setup();
    const deployment = await harness.services.releases.deploy(admin, 'shop', {
      releaseId: release.id,
    });
    await control.ready(deployment.id);
    const client = await harness.database.connection().client<Knex>();
    const queries: string[] = [];
    const record = ({ sql }: { sql: string }) => queries.push(sql);
    client.on('query', record);
    try {
      const view = await harness.services.releases.getDeployment(
        admin,
        'shop',
        deployment.id,
      );
      expect(view).toMatchObject({
        status: 'queued',
        queueAhead: 1,
        startedAt: null,
      });
      expect(queries.length).toBeLessThanOrEqual(3);
      expect(queries.every((sql) => /^select /i.test(sql))).toBe(true);
    } finally {
      client.off('query', record);
    }
  });
});
