/**
 * Against a real Docker Engine, through a real managed App Host whose listener forwards to the containers: builds the
 * test App's images as CI would and pushes them to a local `registry:2`, deploys them by digest, replaces one
 * start-first without a failed request, keeps it when a broken release fails its health check, rolls back to a pruned
 * image (pulled again), streams and joins an upgrade through the Host, stops it when idle and starts it on the next
 * request, makes it dormant and creates it again, survives a Host restart, reads logs and removes it with its
 * data. Opt in with `APP_HOST_DOCKER_IT=1` (`pnpm test:docker`); it pulls
 * `node:24-bookworm-slim` and `registry:2`. Override the socket with `APP_HOST_DOCKER_SOCKET` and the ports from
 * `APP_HOST_DOCKER_PORT` (14300). Everything it creates is named `app-host-docker-it-*` and removed afterwards.
 */
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  FileOperationLog,
  createAppHost,
  type AppHost,
  type HostScope,
} from '@nocobase/app-host';
import Docker from 'dockerode';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDockerBackend } from '../src/backend.js';
import { DOCKER_DEFAULT_SETTINGS } from '../src/config.js';
import { LABEL } from '../src/naming.js';
import { imageContext, specFor, type TestRelease } from './release.js';

const SOCKET = process.env.APP_HOST_DOCKER_SOCKET ?? '/var/run/docker.sock';
const PORT = Number(process.env.APP_HOST_DOCKER_PORT ?? 14300);
const REGISTRY_PORT = PORT + 2;
const PREFIX = 'app-host-docker-it-';
const SCOPE_ID = `it-${randomUUID().slice(0, 8)}`;
const REPOSITORY = `127.0.0.1:${REGISTRY_PORT}/it/shop`;
const enabled = process.env.APP_HOST_DOCKER_IT === '1';

const docker = new Docker({ socketPath: SOCKET });

let v1: TestRelease;
let v2: TestRelease;
let broken: TestRelease;
let platform: string;
let dir: string;
let host: AppHost;
let url: string;

function scope(): HostScope {
  return {
    id: SCOPE_ID,
    backend: 'docker',
    backendConfig: {},
    secret: {
      registryAuth: { serveraddress: `127.0.0.1:${REGISTRY_PORT}` },
    },
  };
}

function deployment(release: TestRelease, extra: Record<string, unknown> = {}) {
  return {
    ...specFor('shop', release, {
      scope: scope(),
      images: [{ ref: REPOSITORY, digest: release.digest, platform }],
    }),
    ...extra,
  };
}

async function startHost(): Promise<void> {
  host = createAppHost({
    mode: 'managed',
    port: 0,
    appRevisionsDir: path.join(dir, 'revisions'),
    appVolumesDir: path.join(dir, 'volumes'),
    artifact: {
      driver: 'fs',
      location: path.join(dir, 'artifacts'),
      visibility: 'private',
    },
    evictionIntervalMs: 0,
    operations: new FileOperationLog(path.join(dir, 'control')),
    backends: [
      createDockerBackend({
        pollIntervalMs: 500,
        endpoint: `unix://${SOCKET}`,
        settings: {
          ...DOCKER_DEFAULT_SETTINGS,
          namePrefix: PREFIX,
          image: { platform: null, keep: 1 },
          healthCheck: {
            path: '/api/healthz',
            timeoutSeconds: 40,
            intervalSeconds: 5,
          },
          stopTimeoutSeconds: 5,
        },
      }),
    ],
  });
  await host.start();
  url = `http://127.0.0.1:${(host.server.address() as AddressInfo).port}`;
}

async function getJson(
  target: string,
  timeoutMs = 30_000,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(target, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok)
        return (await response.json()) as Record<string, unknown>;
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${target} did not answer: ${last}`);
}

/** Requests `target` continuously until stopped; records the versions served and every failed request. */
function watch(target: string): {
  stop(): Promise<{ versions: Set<string>; failures: string[] }>;
} {
  const versions = new Set<string>();
  const failures: string[] = [];
  let running = true;
  const loop = (async () => {
    while (running) {
      try {
        const response = await fetch(target, {
          signal: AbortSignal.timeout(10_000),
        });
        if (response.ok)
          versions.add(
            String(((await response.json()) as { version: unknown }).version),
          );
        else failures.push(`HTTP ${response.status}`);
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  })();
  return {
    async stop() {
      running = false;
      await loop;
      return { versions, failures };
    },
  };
}

async function shopContainers(all = false): Promise<Docker.ContainerInfo[]> {
  return await docker.listContainers({
    all,
    filters: { label: [`${LABEL.app}=shop`, `${LABEL.scope}=${SCOPE_ID}`] },
  });
}

async function cleanup(): Promise<void> {
  for (const container of await docker.listContainers({ all: true }))
    if (
      container.Names.some((name) => name.startsWith(`/${PREFIX}`)) ||
      container.Labels[LABEL.scope] === SCOPE_ID
    )
      await docker
        .getContainer(container.Id)
        // `v`: also the anonymous volume the registry image declares.
        .remove({ force: true, v: true })
        .catch(() => undefined);
  for (const image of await docker.listImages())
    for (const tag of [...(image.RepoTags ?? []), ...(image.RepoDigests ?? [])])
      if (
        tag.startsWith(PREFIX) ||
        tag.startsWith(`127.0.0.1:${REGISTRY_PORT}/`)
      )
        await docker
          .getImage(tag)
          .remove({ force: true })
          .catch(() => undefined);
  const { Volumes } = await docker.listVolumes();
  for (const volume of Volumes ?? [])
    if (volume.Name.startsWith(PREFIX))
      await docker
        .getVolume(volume.Name)
        .remove()
        .catch(() => undefined);
  for (const network of await docker.listNetworks())
    if (network.Name.startsWith(PREFIX))
      await docker
        .getNetwork(network.Id)
        .remove()
        .catch(() => undefined);
}

async function follow(
  stream: NodeJS.ReadableStream,
): Promise<{ aux?: { Digest?: string }; error?: string }[]> {
  const output = await new Promise<
    { aux?: { Digest?: string }; error?: string }[]
  >((resolve, reject) => {
    docker.modem.followProgress(
      stream,
      (error: Error | null, result: unknown[]) =>
        error ? reject(error) : resolve(result as never),
    );
  });
  const failed = output.find((item) => item.error);
  if (failed) throw new Error(failed.error);
  return output;
}

/** Builds the test App's image at `version` and pushes it to the test registry, as CI would; answers the release. */
async function release(version: string): Promise<TestRelease> {
  const context = await imageContext(version);
  try {
    const tag = `${REPOSITORY}:${version}`;
    await follow(
      await docker.buildImage(
        { context, src: ['Dockerfile', 'dist'] },
        { t: tag },
      ),
    );
    const output = await follow(
      await docker.getImage(tag).push({
        authconfig: { serveraddress: `127.0.0.1:${REGISTRY_PORT}` },
      }),
    );
    const digest = output.find((item) => item.aux?.Digest)?.aux?.Digest;
    if (!digest) throw new Error('The registry answered no digest.');
    // Only the registry keeps it: the Host has to pull it.
    await docker.getImage(tag).remove({ force: true });
    return { version, digest };
  } finally {
    await rm(context, { recursive: true, force: true });
  }
}

describe.skipIf(!enabled)('the Docker backend against Docker', () => {
  beforeAll(async () => {
    await docker.ping();
    await cleanup();
    await follow(await docker.pull('node:24-bookworm-slim'));
    await follow(await docker.pull('registry:2'));
    const registry = await docker.createContainer({
      name: `${PREFIX}registry`,
      Image: 'registry:2',
      HostConfig: {
        PortBindings: {
          '5000/tcp': [
            { HostIp: '127.0.0.1', HostPort: String(REGISTRY_PORT) },
          ],
        },
      },
    });
    await registry.start();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const version = await docker.version();
    platform = `${version.Os}/${({ aarch64: 'arm64', x86_64: 'amd64' } as Record<string, string>)[version.Arch] ?? version.Arch}`;
    v1 = await release('1.0.0');
    v2 = await release('2.0.0');
    broken = await release('3.0.0-broken');
    dir = await mkdtemp(path.join(os.tmpdir(), 'app-host-docker-it-'));
    await startHost();
  }, 600_000);

  afterAll(async () => {
    if (!enabled) return;
    await host?.close('test end').catch(() => undefined);
    await cleanup();
    if (dir) await rm(dir, { recursive: true, force: true });
  }, 120_000);

  it('pulls by digest, switches start-first, survives a failing release, rolls back and forwards streams and upgrades', async () => {
    const target = `${url}/shop/`;
    const logs: Record<string, unknown>[] = [];
    const first = await host.management.applyDeployment(
      deployment(v1),
      (entry) => logs.push(entry as never),
    );
    expect(first.deployments[0]).toMatchObject({
      observedState: 'running',
      version: '1.0.0',
    });
    const served = await getJson(target);
    expect(served).toMatchObject({ version: '1.0.0', base: '/shop' });
    expect(String(served.config)).toContain('greeting: hello 1.0.0');
    expect(logs.find((entry) => entry.artifact)).toMatchObject({
      artifact: { kind: 'image', ref: REPOSITORY, digest: v1.digest },
    });
    expect((await shopContainers())[0]?.Image).toBe(
      `${PREFIX}shop:d-${v1.digest.replace('sha256:', '').slice(0, 12)}`,
    );

    // The switch is gapless: requests made throughout the deployment are all answered.
    const switching = watch(target);
    const second = await host.management.applyDeployment(deployment(v2));
    await new Promise((resolve) => setTimeout(resolve, 300));
    const switched = await switching.stop();
    expect(second.deployments[0]).toMatchObject({ version: '2.0.0' });
    expect(switched.failures).toEqual([]);
    expect([...switched.versions].sort()).toEqual(['1.0.0', '2.0.0']);
    // The storage volume carries over between releases.
    const after = await getJson(target);
    expect(Number(after.count)).toBeGreaterThan(Number(served.count));

    // A release that never passes its health check never receives traffic.
    const failing = watch(target);
    const failed = await host.management.applyDeployment(deployment(broken));
    const duringFailure = await failing.stop();
    expect(duringFailure.failures).toEqual([]);
    expect([...duringFailure.versions]).toEqual(['2.0.0']);
    expect(failed.deployments[0]?.observedState).toBe('failed');
    expect(failed.deployments[0]?.error).toMatch(/health check/);

    // keep: 1 pruned the 1.0.0 image, so the rollback pulls it again.
    const tags = (await docker.listImages()).flatMap(
      (image) => image.RepoTags ?? [],
    );
    expect(tags).not.toContain(
      `${PREFIX}shop:d-${v1.digest.replace('sha256:', '').slice(0, 12)}`,
    );
    await host.management.applyDeployment(deployment(v1));
    expect((await getJson(target)).version).toBe('1.0.0');
    await host.management.applyDeployment(deployment(v2));
    expect((await getJson(target)).version).toBe('2.0.0');

    // Streams and upgrades pass through the Host.
    expect(await (await fetch(`${url}/shop/stream`)).text()).toBe(
      'data: one\n\ndata: two\n\n',
    );
    const echoed = await new Promise<string>((resolve, reject) => {
      const request = http.request(`${url}/shop/ws`, {
        headers: {
          connection: 'Upgrade',
          upgrade: 'websocket',
          'sec-websocket-version': '13',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
        },
      });
      request.on('upgrade', (_res, socket) => {
        socket.once('data', (chunk: Buffer) => {
          resolve(chunk.toString('utf8'));
          socket.destroy();
        });
        socket.write('ping');
      });
      request.on('error', reject);
      request.end();
    });
    expect(echoed).toBe('ping');

    const page = await host.management.readAppLogs('shop', {
      fromStart: true,
    });
    expect(page.entries.some((entry) => entry.msg === 'listening')).toBe(true);
  }, 900_000);

  it('stops an idle App and starts it on a request, makes it dormant, survives a Host restart and removes it with its data', async () => {
    const target = `${url}/shop/`;
    await host.registry.evict('shop');
    expect((await shopContainers(true))[0]?.State).toBe('exited');
    expect((await getJson(target)).version).toBe('2.0.0');

    // Dormancy is a policy of the App: set it without a new deployment, then sweep.
    const current = (await host.management.getStatus({ scope: SCOPE_ID }))
      .deployments[0]!;
    const spec = deployment(v2, {
      operationId: current.operationId!,
      dormantAfterMs: 1000,
    });
    await host.management.restoreDeploymentSet({
      scope: scope(),
      revision: 10,
      deployments: [spec],
    });
    await host.registry.sweep(Date.now() + 60_000);
    expect(host.registry.isDormant('shop')).toBe(true);
    expect(await shopContainers(true)).toHaveLength(0);
    expect((await getJson(target)).version).toBe('2.0.0');

    // A restarted Host adopts the running container.
    const [before] = await shopContainers();
    await host.close('restart');
    await startHost();
    await host.management.restoreDeploymentSet({
      scope: scope(),
      revision: 1,
      deployments: [{ ...spec, activation: 'lazy' }],
    });
    expect(host.registry.isActive('shop')).toBe(true);
    expect((await shopContainers())[0]?.Id).toBe(before?.Id);
    expect((await getJson(`${url}/shop/`)).version).toBe('2.0.0');

    await host.management.removeDeployment('shop', { purgeData: true });
    expect(await shopContainers(true)).toHaveLength(0);
    expect(
      (await docker.listVolumes()).Volumes?.some(
        (volume) => volume.Name === `${PREFIX}shop-storage`,
      ),
    ).toBe(false);
  }, 600_000);
});
