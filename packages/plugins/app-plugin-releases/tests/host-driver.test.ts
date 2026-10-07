// @vitest-environment node
/**
 * The real chain: HTTP upload with an upload ticket → the plugin's services → the Host driver → the production
 * `AppHostSupervisor`, which spawns a real App Host child that expands the release and serves the App over HTTP. The
 * child starts with an environment allowlist, so the App cannot read this process's secrets.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { AppHostSupervisor } from '@nocobase/app-host/supervisor';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createHostDriver,
  writeHostConfig,
  type HostDeploymentDriver,
} from '../server/drivers/host/driver.js';
import type { AppDeploymentSpec } from '../server/drivers/types.js';
import {
  createApiServer,
  createArtifact,
  createHarness,
  type Harness,
} from './harness.js';

const require = createRequire(import.meta.url);
const HOST_PORT = 14241;

describe('Host driver end to end', () => {
  let rootDir: string;
  let harness: Harness;
  let supervisor: AppHostSupervisor;
  let driver: HostDeploymentDriver;
  let server: Awaited<ReturnType<typeof createApiServer>>;

  beforeAll(async () => {
    rootDir = await mkdtemp(path.join(os.tmpdir(), 'releases-host-'));
    process.env.RELEASES_TEST_PARENT_SECRET = 'parent-only';
    const appVolumesDir = path.join(rootDir, 'app-volumes');
    const appRevisionsDir = path.join(rootDir, 'app-revisions');
    const configPath = path.join(rootDir, 'host', 'config.yml');
    supervisor = AppHostSupervisor.initialize({
      mode: 'managed',
      driver: 'node',
      entrypoint: await writeAppHostBootstrap(rootDir),
      appRevisionsDir,
      appVolumesDir,
      configPath,
      childOutputDir: path.join(rootDir, 'host', 'output'),
      host: '127.0.0.1',
      port: HOST_PORT,
      autoRestart: false,
      startTimeoutMs: 60_000,
      // The child sees none of this process's variables beyond what Node needs; NODE_PATH resolves the tsx loader.
      env: { allow: ['NODE_PATH'] },
    });
    driver = createHostDriver({
      hosts: {
        'in-process': {
          controller: supervisor,
          prepare: () =>
            writeHostConfig(configPath, {
              artifact: {
                driver: 'fs',
                location: path.join(rootDir, 'artifacts'),
                visibility: 'private',
              },
              appVolumesDir,
              appRevisionsDir,
              controlDir: path.join(rootDir, 'host', 'control'),
              logging: { file: { enabled: false } },
            }),
          restartAfterChurn: 100,
        },
      },
    });
    harness = await createHarness({ drivers: [driver], rootDir });
    await harness.environment({
      id: 'local',
      name: 'Local Host',
      driver: 'host',
      config: { backend: 'in-process' },
    });
    harness.application.roles.set('admin', 'admin');
    server = await createApiServer(harness.services);
  }, 120_000);

  afterAll(async () => {
    delete process.env.RELEASES_TEST_PARENT_SECRET;
    await server?.close();
    await harness?.close();
    await supervisor?.shutdown();
    await rm(rootDir, { recursive: true, force: true });
  }, 60_000);

  it('deploys, serves, rolls back, stops, starts and removes a real App', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'demo',
      name: 'Demo',
      environmentId: 'local',
    });
    const v1 = await createArtifact(rootDir, '1.0.0', {
      body: echoServer('1.0.0'),
    });
    const v2 = await createArtifact(rootDir, '2.0.0', {
      body: echoServer('2.0.0'),
    });

    // A build job's upload: a one-time ticket that deploys, streamed over HTTP.
    const ticket = await harness.services.tickets.create(admin, 'demo', {
      deploy: true,
    });
    const response = await fetch(`${server.url}/apps/demo/releases`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${ticket.token}`,
        'content-type': 'application/gzip',
        'x-artifact-sha256': v1.checksum,
      },
      body: v1.bytes,
    });
    expect(response.status).toBe(202);
    const uploaded = (await response.json()) as {
      data: { id: string; deploymentId: string };
    };
    const first = await harness.services.releases.waitForDeployment(
      uploaded.data.deploymentId,
      120_000,
    );
    expect(first).toMatchObject({ status: 'succeeded' });
    expect(await served('demo')).toMatchObject({
      version: '1.0.0',
      secret: null,
    });

    const summary = await harness.services.releases.getApp(admin, 'demo');
    expect(summary).toMatchObject({
      runtime: { available: true, state: 'running' },
      currentVersion: '1.0.0',
    });
    expect(summary.url).toBe(`http://127.0.0.1:${HOST_PORT}/demo/`);
    const config = await harness.services.releases.readConfig(admin, 'demo');
    expect(config.content).toContain(
      `publicOrigin: http://127.0.0.1:${HOST_PORT}`,
    );

    const r2 = await harness.services.releases.uploadRelease(admin, 'demo', {
      stream: (async function* () {
        yield v2.bytes;
      })(),
    });
    const second = await harness.services.releases.deploy(admin, 'demo', {
      releaseId: r2.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(second.id, 120_000),
    ).toMatchObject({
      status: 'succeeded',
    });
    expect((await served('demo')).version).toBe('2.0.0');
    expect(driver.churn()).toBe(1);

    const rollback = await harness.services.releases.rollback(admin, 'demo', {
      deploymentId: first.id,
    });
    expect(
      await harness.services.releases.waitForDeployment(rollback.id, 120_000),
    ).toMatchObject({
      status: 'succeeded',
      kind: 'rollback',
    });
    expect((await served('demo')).version).toBe('1.0.0');
    const logs = await harness.services.releases.readLogs(
      admin,
      'demo',
      { fromStart: true },
      rollback.id,
    );
    expect(logs.entries.length).toBeGreaterThan(2);

    const stopped = await harness.services.releases.stop(admin, 'demo');
    expect(stopped.runtime.state).toBe('stopped');
    const started = await harness.services.releases.start(admin, 'demo');
    expect(started.runtime.state).toBe('running');
    expect((await served('demo')).version).toBe('1.0.0');

    // A Host restart replays the desired set into a fresh child.
    await driver.restartHost('test');
    expect(driver.churn()).toBe(0);
    await expect
      .poll(async () => (await served('demo').catch(() => null))?.version, {
        timeout: 60_000,
      })
      .toBe('1.0.0');

    // Deleting the App removes it and its data from the Host.
    await harness.services.releases.deleteApp(admin, 'demo', {
      confirm: 'demo',
    });
    const target = supervisor.getInfo().targetUrl!;
    const gone = await fetch(new URL('/demo/api/version', target));
    await gone.arrayBuffer();
    expect(gone.status).toBe(404);
  }, 300_000);

  it('finalises a deployment the Host finished while this application was gone, across a Host restart', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'recovered',
      name: 'Recovered',
      environmentId: 'local',
    });
    const v1 = await createArtifact(rootDir, '5.0.0', {
      body: echoServer('5.0.0'),
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      'recovered',
      {
        stream: (async function* () {
          yield v1.bytes;
        })(),
      },
    );
    const row = await harness.database
      .connection()
      .query.selectFrom('relReleases')
      .select(['artifactKey'])
      .where('id', '=', release.id)
      .executeTakeFirstOrThrow();
    const deploymentId = '00000000-0000-0000-0000-0000000000a1';
    await harness.database
      .connection()
      .query.insertInto('relDeployments')
      .values({
        id: deploymentId,
        appId: 'recovered',
        releaseId: release.id,
        kind: 'deploy',
        status: 'deploying',
        phase: 'starting',
        configMode: 'external',
        actorKind: 'human',
        createdAt: new Date(),
      })
      .execute();
    // The Host ran the deployment while release management was not there to record it.
    const scope = { id: 'local', backend: 'in-process' };
    const management = await supervisor.getManagementClient();
    await management.applyDeployment({
      id: 'recovered',
      appId: 'recovered',
      operationId: deploymentId,
      scope,
      artifact: {
        key: String(row.artifactKey),
        appId: 'recovered',
        version: '5.0.0',
        checksum: v1.checksum,
      },
      desiredState: 'running',
      backend: 'in-process',
      activation: 'eager',
      basePath: '/recovered',
    });
    expect(
      await management.getOperation(deploymentId, { scope }),
    ).toMatchObject({ state: 'succeeded', appId: 'recovered' });
    // The operation log outlives the Host child.
    await driver.restartHost('test');
    await harness.services.releases.restore();
    await harness.services.releases.listApps(admin);
    expect(
      await harness.services.releases.getDeployment(
        admin,
        'recovered',
        deploymentId,
      ),
    ).toMatchObject({ status: 'succeeded' });
    expect(
      (await harness.services.releases.getApp(admin, 'recovered')).app
        .currentDeploymentId,
    ).toBe(deploymentId);
    await expect
      .poll(
        async () => (await served('recovered').catch(() => null))?.version,
        {
          timeout: 60_000,
        },
      )
      .toBe('5.0.0');
  }, 300_000);

  it('leaves an on-demand App stopped after a Host restart and starts it on its first request', async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'ondemand',
      name: 'On demand',
      environmentId: 'local',
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    const v1 = await createArtifact(rootDir, '3.0.0', {
      body: echoServer('3.0.0'),
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      'ondemand',
      {
        stream: (async function* () {
          yield v1.bytes;
        })(),
        deploy: {},
      },
    );
    expect(
      await harness.services.releases.waitForDeployment(
        release.deploymentId!,
        120_000,
      ),
    ).toMatchObject({ status: 'succeeded' });
    // A deployment proves the release starts.
    expect(
      (await harness.services.releases.getApp(admin, 'ondemand')).runtime.state,
    ).toBe('running');

    await driver.restartHost('test');
    await expect
      .poll(
        async () =>
          (await harness.services.releases.getApp(admin, 'ondemand')).runtime
            .state,
        { timeout: 60_000 },
      )
      .toBe('stopped');
    const stopped = await harness.services.releases.getApp(admin, 'ondemand');
    expect(stopped.runtime.lastAccessedAt).not.toBeNull();

    expect((await served('ondemand')).version).toBe('3.0.0');
    const running = await harness.services.releases.getApp(admin, 'ondemand');
    expect(running.runtime.state).toBe('running');
    expect(Date.parse(running.runtime.lastAccessedAt!)).toBeGreaterThan(
      Date.parse(stopped.runtime.lastAccessedAt!),
    );
  }, 300_000);

  it("gives an in-process App its deployment's variables, and the Host none of them", async () => {
    const admin = await harness.as('admin', 'admin');
    await harness.services.releases.createApp(admin, {
      id: 'withenv',
      name: 'With variables',
      environmentId: 'local',
    });
    const artifact = await createArtifact(rootDir, '6.0.0', {
      body: scopeEnvServer('6.0.0'),
    });
    const release = await harness.services.releases.uploadRelease(
      admin,
      'withenv',
      {
        stream: (async function* () {
          yield artifact.bytes;
        })(),
      },
    );
    const row = await harness.database
      .connection()
      .query.selectFrom('relReleases')
      .select(['artifactKey'])
      .where('id', '=', release.id)
      .executeTakeFirstOrThrow();
    const spec: AppDeploymentSpec = {
      deploymentId: '00000000-0000-0000-0000-0000000000b1',
      appId: 'withenv',
      kind: 'deploy',
      release: {
        id: release.id,
        version: '6.0.0',
        checksum: artifact.checksum,
      },
      artifact: {
        key: String(row.artifactKey),
        checksum: artifact.checksum,
        version: '6.0.0',
        size: artifact.bytes.length,
        open: () => Promise.reject(new Error('The Host reads the disk.')),
      },
      config: { mode: 'external' },
      env: { RELEASES_TEST_APP_SECRET: 'app-only' },
      desiredState: 'running',
      activation: 'eager',
      idleStopMinutes: null,
      dormantAfterHours: null,
    };
    const session = await driver.open(
      {
        id: 'direct',
        name: 'Direct',
        config: { backend: 'in-process' },
        secret: null,
        publicUrl: null,
      },
      { desired: () => Promise.resolve([spec]) },
    );
    try {
      const observed = await session.apply(spec);
      expect(observed.state).toBe('running');
      expect(await served('withenv')).toMatchObject({
        version: '6.0.0',
        secret: 'app-only',
        hostSecret: null,
      });
      await session.remove('withenv', { purgeData: true });
    } finally {
      await session.close();
    }
  }, 300_000);

  async function served(
    appId: string,
  ): Promise<{ version: string; secret: string | null }> {
    const target = supervisor.getInfo().targetUrl;
    if (!target) throw new Error('App Host is not running');
    const response = await fetch(new URL(`/${appId}/api/version`, target));
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as {
      version: string;
      secret: string | null;
    };
  }
});

function echoServer(version: string): string {
  return `export function createServer() {
  return {
    fetch() {
      return Response.json({
        version: ${JSON.stringify(version)},
        secret: process.env.RELEASES_TEST_PARENT_SECRET ?? null,
      });
    },
  };
}
`;
}

/** An App answering with the variable its scope gives it, and whether the Host process has it too. */
function scopeEnvServer(version: string): string {
  return `export function createServer(scope) {
  return {
    fetch() {
      return Response.json({
        version: ${JSON.stringify(version)},
        secret: scope.env?.RELEASES_TEST_APP_SECRET ?? null,
        hostSecret: process.env.RELEASES_TEST_APP_SECRET ?? null,
      });
    },
  };
}
`;
}

/**
 * The supervisor's `node` driver runs an explicit entrypoint: this one loads tsx and then the App Host CLI source, so
 * the test needs no compiled `dist`.
 */
async function writeAppHostBootstrap(rootDir: string): Promise<string> {
  const tsxApi = pathToFileURL(
    path.join(
      path.dirname(require.resolve('tsx/package.json')),
      'dist/esm/api/index.mjs',
    ),
  ).href;
  const appHostCli = new URL(
    '../node_modules/@nocobase/app-host/src/cli.ts',
    import.meta.url,
  ).href;
  const entrypoint = path.join(rootDir, 'app-host-entry.mjs');
  await writeFile(
    entrypoint,
    `import { register } from ${JSON.stringify(tsxApi)};
register();
await import(${JSON.stringify(appHostCli)});
`,
  );
  return entrypoint;
}
