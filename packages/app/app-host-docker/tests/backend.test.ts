/**
 * The Docker backend under a real managed App Host, against a fake Engine whose running containers really listen:
 * deployments pull the release image by digest, start the container and switch only once it is healthy and reachable,
 * the Host forwards requests (streaming, cookies, upgrades) to it, the idle stop, dormancy and removal act on
 * containers, a restarted Host adopts what still runs, and logs come from the container.
 */
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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createDockerBackend } from '../src/backend.js';
import type { DockerSettings } from '../src/config.js';
import { LABEL } from '../src/naming.js';
import { FakeDocker, type FakeContainer } from './fake-docker.js';
import { specFor, testRelease } from './release.js';

const v1 = testRelease('1.0.0');
const v2 = testRelease('2.0.0');
const broken = testRelease('3.0.0-broken');

let docker: FakeDocker;
const hosts: AppHost[] = [];
const dirs: string[] = [];

beforeEach(() => {
  docker = new FakeDocker();
  docker.health = (version) =>
    version?.includes('broken') ? 'unhealthy' : 'healthy';
});

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((host) => host.close('test')));
  await docker.close();
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

function scope(
  config: Record<string, unknown> = {},
  secret: Record<string, unknown> = {},
): HostScope {
  return { id: 'staging', backend: 'docker', backendConfig: config, secret };
}

async function startHost(
  options: {
    readonly settings?: Partial<DockerSettings>;
    readonly dir?: string;
    readonly start?: boolean;
  } = {},
): Promise<{ host: AppHost; url: string; dir: string }> {
  const dir =
    options.dir ?? (await mkdtemp(path.join(os.tmpdir(), 'docker-host-')));
  if (!options.dir) dirs.push(dir);
  const host = createAppHost({
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
        createApi: () => docker,
        endpoint: 'unix:///test/docker.sock',
        settings: { namePrefix: 't-', ...options.settings },
        sleep: () => new Promise((resolve) => setTimeout(resolve, 1)),
        pollIntervalMs: 0,
        reachTimeoutMs: 200,
        hostname: 'not-a-container',
      }),
    ],
  });
  hosts.push(host);
  await host.start();
  const { port } = host.server.address() as AddressInfo;
  return { host, url: `http://127.0.0.1:${port}`, dir };
}

function appContainers(appId: string): FakeContainer[] {
  return [...docker.containers.values()].filter(
    (container) =>
      container.body.Labels?.[LABEL.app] === appId &&
      container.body.Labels[LABEL.role] === 'app',
  );
}

async function json(
  url: string,
  init?: RequestInit,
): Promise<{
  version: string;
  container: string;
  path: string;
  method: string;
  body: string;
  forwardedFor: string | null;
}> {
  const response = await fetch(url, init);
  expect(response.status).toBe(200);
  return (await response.json()) as never;
}

describe('the Docker backend', () => {
  it('describes itself and refuses settings it cannot use', async () => {
    const { host } = await startHost();
    const [backend] = (await host.management.describeHost()).backends;
    expect(backend).toMatchObject({
      name: 'docker',
      kind: 'external-service',
      capabilities: { onDemand: true, rollout: 'start-first', images: true },
    });
    expect(await host.management.checkScope(scope())).toMatchObject({
      ok: true,
      details: {
        endpoint: 'unix:///test/docker.sock',
        platform: 'linux/arm64',
        reach: 'published (127.0.0.1)',
      },
    });
    for (const [config, message] of [
      [{ bogus: true }, /Unknown setting bogus/],
      [{ endpoint: '/var/run/docker.sock' }, /Unknown setting endpoint/],
    ] as const)
      expect(
        await host.management.checkScope(scope(config as never)),
      ).toMatchObject({ ok: false, message: expect.stringMatching(message) });
  });

  it('pulls the release image by digest, starts the container and forwards requests to it', async () => {
    const { host, url } = await startHost();
    const logs: Record<string, unknown>[] = [];
    const spec = specFor('shop', v1, {
      scope: scope(
        {},
        {
          registryAuth: {
            serveraddress: 'registry.test',
            username: 'puller',
            password: 'pull-pass',
          },
        },
      ),
      images: [
        {
          ref: 'registry.test/team/shop',
          digest: `sha256:${'f'.repeat(64)}`,
          platform: 'linux/amd64',
        },
        {
          ref: 'registry.test/team/shop',
          digest: v1.digest,
          platform: 'linux/arm64',
        },
      ],
    });
    const status = await host.management.applyDeployment(spec, (entry) =>
      logs.push(entry as never),
    );
    expect(status.deployments).toMatchObject([
      {
        appId: 'shop',
        observedState: 'running',
        operationId: spec.operationId,
        version: '1.0.0',
      },
    ]);
    // The fake Engine is linux/arm64: its image, pulled by digest with the registry's credentials.
    expect(docker.pullAuth).toEqual([
      {
        reference: `registry.test/team/shop@${v1.digest}`,
        serveraddress: 'registry.test',
        username: 'puller',
        password: 'pull-pass',
      },
    ]);
    expect(logs.find((entry) => entry.artifact)).toMatchObject({
      artifact: {
        kind: 'image',
        ref: 'registry.test/team/shop',
        digest: v1.digest,
        platform: 'linux/arm64',
      },
    });

    const [container] = appContainers('shop');
    expect(container!.body.Image).toBe(
      `t-shop:d-${v1.digest.replace('sha256:', '').slice(0, 12)}`,
    );
    const env = container!.body.Env!;
    expect(env).toEqual(
      expect.arrayContaining([
        'APP_BASE_PATH=/shop',
        'APP_SERVER_PORT=13000',
        'APP_CONFIG_FILE=/app/config.yml',
      ]),
    );
    expect(container!.body.HostConfig).toMatchObject({
      Mounts: [
        { Type: 'volume', Source: 't-shop-storage', Target: '/app/storage' },
      ],
      NetworkMode: 't-apps',
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      PortBindings: { '13000/tcp': [{ HostIp: '127.0.0.1', HostPort: '' }] },
    });
    expect(JSON.stringify(container!.body)).not.toContain('docker.sock');
    expect(container!.files.get('/app')!.toString()).toContain(
      'greeting: hello 1.0.0',
    );
    // No credentials in the definition the registry keeps.
    expect(JSON.stringify(host.registry.definition('shop'))).not.toContain(
      'pull-pass',
    );

    // The Host forwards requests as they arrived: path, method, body, cookies, the client's address.
    const answer = await json(`${url}/shop/orders?x=1`, {
      method: 'POST',
      body: 'hello',
    });
    expect(answer).toMatchObject({
      version: '1.0.0',
      path: '/shop/orders?x=1',
      method: 'POST',
      body: 'hello',
      forwardedFor: '127.0.0.1',
    });
    const page = await fetch(`${url}/shop/`);
    expect(page.headers.getSetCookie()).toEqual(['a=1; Path=/', 'b=2; Path=/']);
    // Streams pass through as they come.
    const stream = await fetch(`${url}/shop/stream`);
    expect(await stream.text()).toBe('data: one\n\ndata: two\n\n');
    // Upgrades are joined end to end.
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
  });

  it("gives the container the App's variables, after which its own come", async () => {
    const { host } = await startHost();
    const spec = {
      ...specFor('vars', v1, {
        scope: scope(),
        images: [
          {
            ref: 'registry.test/team/vars',
            digest: v1.digest,
            platform: 'linux/arm64',
          },
        ],
      }),
      env: {
        DB_PASSWORD: 's3cret',
        APP_SERVER_PORT: '1',
        NODE_ENV: 'development',
      },
    };
    const logs: unknown[] = [];
    await host.management.applyDeployment(spec, (entry) => logs.push(entry));
    const env = appContainers('vars')[0]!.body.Env!;
    expect(env).toContain('DB_PASSWORD=s3cret');
    expect(env).toContain('APP_SERVER_PORT=13000');
    expect(env).toContain('NODE_ENV=production');
    expect(env).not.toContain('APP_SERVER_PORT=1');
    expect(JSON.stringify(logs)).not.toContain('s3cret');
  });

  it('switches start-first without a failed request, and keeps the running version when the new one is unhealthy', async () => {
    const { host, url } = await startHost();
    await host.management.applyDeployment(
      specFor('shop', v1, { scope: scope() }),
    );
    const [old] = appContainers('shop');

    // Requests keep flowing while the next release deploys.
    let running = true;
    const failures: string[] = [];
    const versions = new Set<string>();
    const traffic = (async () => {
      while (running) {
        try {
          const response = await fetch(`${url}/shop/`);
          if (response.status !== 200) failures.push(String(response.status));
          else
            versions.add(
              ((await response.json()) as { version: string }).version,
            );
        } catch (error) {
          failures.push(String(error));
        }
      }
    })();
    const second = specFor('shop', v2, { scope: scope() });
    const status = await host.management.applyDeployment(second);
    await new Promise((resolve) => setTimeout(resolve, 50));
    running = false;
    await traffic;
    expect(failures).toEqual([]);
    expect(versions).toEqual(new Set(['1.0.0', '2.0.0']));
    expect(status.deployments[0]).toMatchObject({
      observedState: 'running',
      version: '2.0.0',
    });
    // The new container started before the old one stopped, and the old one is gone.
    const order = docker.calls.filter((call) =>
      /^(start|stop|remove) t-shop/.test(call),
    );
    const [current] = appContainers('shop');
    expect(order.indexOf(`start ${current!.name}`)).toBeLessThan(
      order.indexOf(`stop ${old!.name}`),
    );
    expect(appContainers('shop')).toHaveLength(1);

    // A release that never becomes healthy never takes traffic; the running one stays.
    const failed = await host.management.applyDeployment(
      specFor('shop', broken, { scope: scope() }),
    );
    expect(failed.deployments[0]).toMatchObject({ observedState: 'failed' });
    expect(failed.deployments[0]!.error).toContain('health check');
    expect(appContainers('shop')).toHaveLength(1);
    expect((await json(`${url}/shop/`)).version).toBe('2.0.0');
    expect(
      (await host.management.getStatus({ scope: 'staging' })).deployments[0],
    ).toMatchObject({ app: { state: 'active' } });
  });

  it('rolls back with the image it kept, and pulls one that was pruned again', async () => {
    const { host, url } = await startHost({
      settings: { image: { platform: null, keep: 1 } },
    });
    const settings = scope();
    await host.management.applyDeployment(
      specFor('shop', v1, { scope: settings }),
    );
    await host.management.applyDeployment(
      specFor('shop', v2, { scope: settings }),
    );
    // keep: 1 removed the 1.0.0 image once 2.0.0 ran.
    const tag = (digest: string) =>
      `t-shop:d-${digest.replace('sha256:', '').slice(0, 12)}`;
    expect(docker.images.has(tag(v1.digest))).toBe(false);
    await host.management.applyDeployment(
      specFor('shop', v1, { scope: settings }),
    );
    expect((await json(`${url}/shop/`)).version).toBe('1.0.0');
    expect(
      docker.pulled.filter((reference) => reference.endsWith(v1.digest)),
    ).toHaveLength(2);
  });

  it('refuses a release without an image for its platform before anything runs', async () => {
    const { host } = await startHost();
    const refused = await host.management.applyDeployment(
      specFor('shop', v2, {
        scope: scope(),
        images: [
          {
            ref: 'registry.test/team/shop',
            digest: v2.digest,
            platform: 'linux/amd64',
          },
        ],
      }),
    );
    expect(refused.deployments[0]).toMatchObject({
      observedState: 'failed',
      error: expect.stringMatching(/no image for linux\/arm64/),
    });
    expect(appContainers('shop')).toHaveLength(0);
  });

  it('stops an idle App and starts it on the next request, makes it dormant and creates it again', async () => {
    const { host, url } = await startHost();
    await host.management.applyDeployment(
      specFor('shop', v1, {
        scope: scope(),
        idleStopMs: 1,
        dormantAfterMs: 60_000,
      }),
    );
    const [container] = appContainers('shop');
    await host.registry.sweep(Date.now() + 1000);
    expect(container!.status).toBe('exited');
    expect(
      (await host.management.getStatus({ scope: 'staging' })).deployments[0],
    ).toMatchObject({ observedState: 'stopped' });
    // The next request starts the same container again.
    expect((await json(`${url}/shop/`)).container).toBe(container!.name);
    expect(appContainers('shop')).toHaveLength(1);

    // Dormancy removes the container and keeps its volume; the next request creates it from the kept image.
    await host.registry.sweep(Date.now() + 120_000);
    expect(appContainers('shop')).toHaveLength(0);
    expect(docker.volumes.has('t-shop-storage')).toBe(true);
    expect(host.registry.isDormant('shop')).toBe(true);
    expect((await json(`${url}/shop/`)).version).toBe('1.0.0');
    expect(appContainers('shop')).toHaveLength(1);
    // The kept image, not another pull.
    expect(docker.pulled).toHaveLength(1);
  });

  it('leaves containers running when the Host stops, and the next Host adopts them', async () => {
    const first = await startHost();
    const spec = specFor('shop', v1, { scope: scope() });
    await first.host.management.applyDeployment(spec);
    const [container] = appContainers('shop');
    await first.host.close('restart');
    hosts.splice(hosts.indexOf(first.host), 1);
    expect(container!.status).toBe('running');

    const next = await startHost({ dir: first.dir });
    await next.host.management.restoreDeploymentSet({
      scope: scope(),
      revision: 1,
      deployments: [{ ...spec, activation: 'lazy' }],
    });
    expect(next.host.registry.isActive('shop')).toBe(true);
    expect(
      docker.calls.filter((call) => call.startsWith('create t-shop')),
    ).toHaveLength(1);
    expect((await json(`${next.url}/shop/`)).container).toBe(container!.name);
    // The deployment's outcome outlived the Host.
    expect(
      await next.host.management.getOperation(spec.operationId!, {
        scope: scope(),
      }),
    ).toMatchObject({ state: 'succeeded' });
  });

  it('answers at its own host name, finds a container on a new port, applies new configuration and removes an App with its data', async () => {
    const { host, url } = await startHost();
    await host.management.applyDeployment(
      specFor('site', v1, {
        scope: scope(),
        hostname: 'site.apps.example.com',
      }),
    );
    const [container] = appContainers('site');
    expect(container!.body.Env).toContain('APP_BASE_PATH=/');
    const { port } = new URL(url);
    const get = (requestPath: string): Promise<string> =>
      new Promise((resolve, reject) => {
        http
          .get(
            {
              host: '127.0.0.1',
              port,
              path: requestPath,
              headers: { host: 'site.apps.example.com' },
            },
            (res) => {
              let text = '';
              res.setEncoding('utf8');
              res.on('data', (chunk: string) => (text += chunk));
              res.on('end', () => resolve(text));
            },
          )
          .on('error', reject);
      });
    expect(JSON.parse(await get('/catalog'))).toMatchObject({
      path: '/catalog',
    });

    // Docker restarted the container on its own, on another published port: the Host finds it there.
    await docker.restartContainer(container!.id);
    expect(JSON.parse(await get('/again'))).toMatchObject({ path: '/again' });

    // New configuration is copied in and the container restarted.
    await host.management.publishAppConfig('site', 'greeting: changed\n');
    expect(container!.files.get('/app')!.toString()).toContain(
      'greeting: changed',
    );

    await host.management.removeDeployment('site', { purgeData: true });
    expect(appContainers('site')).toHaveLength(0);
    expect(docker.volumes.has('t-site-storage')).toBe(false);
    expect(
      [...docker.images.keys()].filter((image) => image.startsWith('t-site:')),
    ).toEqual([]);
  });

  it('reads the container log as journal pages', async () => {
    const { host } = await startHost();
    await host.management.applyDeployment(
      specFor('shop', v1, { scope: scope() }),
    );
    appContainers('shop')[0]!.logs.push(
      {
        stream: 'stdout',
        time: '2026-10-02T01:00:00.1Z',
        text: '{"level":30,"time":1,"msg":"listening"}',
      },
      {
        stream: 'stderr',
        time: '2026-10-02T01:00:01.123456789Z',
        text: 'warning: password=hunter2',
      },
    );
    const page = await host.management.readAppLogs('shop', {
      fromStart: true,
    });
    expect(page.entries).toHaveLength(2);
    expect(page.entries[0]).toMatchObject({ level: 'info', msg: 'listening' });
    expect(page.entries[1]!.msg).toContain('[REDACTED]');
  });
});
