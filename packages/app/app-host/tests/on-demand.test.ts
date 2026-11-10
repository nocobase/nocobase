/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { once } from 'node:events';
import { NodeServerProxy } from '@nocobase/app-server/node';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRealtimeClient } from '@nocobase/realtime/client';
import { c as createTar } from 'tar';
import {
  createAppHost,
  InProcessAppHandle,
  applyFetchResponse,
  toFetchRequest,
  type AppHost,
  type AppHostOptions,
  type ArtifactReference,
  type HostDeploymentSpec,
} from '../dist/index.js';

const tempDirs: string[] = [];
const hosts: AppHost[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  await Promise.all(hosts.splice(0).map((host) => host.close('test cleanup')));
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('on-demand Apps on a managed Host', () => {
  it.each(['stop', 'stopped-spec'] as const)(
    'keeps explicit %s unavailable through direct and unified HTTP/WebSocket ingress across restoration',
    async (mode) => {
      const fixture = await createFixture();
      let host = await startHost(fixture);
      const deployment = spec(fixture.artifact, {
        activation: 'eager',
        idleStopMs: 1000,
        config: {
          provider: 'file',
          content: 'enabled: true\n',
          revision: 'one',
        },
      });
      await host.management.applyDeployment(deployment);
      const definition = host.registry.definition('customer')!;
      const recordPath = path.join(definition.dataDir!, 'record.json');
      await writeFile(recordPath, '{"name":"retained customer"}');
      const archivePath = path.join(fixture.artifactDir, fixture.artifact.key);
      const archive = await readFile(archivePath);
      const ingress = await startIngress(() => host);
      try {
        // Exercise an established connection separately from refused new handshakes.
        const socket = new WebSocket(`${ingress.url}/customer/ws`);
        const closed = new Promise<CloseEvent>((resolve) =>
          socket.addEventListener('close', resolve, { once: true }),
        );
        await new Promise<void>((resolve, reject) => {
          socket.addEventListener('open', () => resolve(), { once: true });
          socket.addEventListener('error', reject, { once: true });
        });
        expect(
          host.registry.requireSnapshot('customer').activeConnections,
        ).toBe(1);
        const starts = host.registry.getMetrics().activations;
        if (mode === 'stop') await host.management.stopDeployment('customer');
        else
          await host.management.applyDeploymentSet({
            revision: 2,
            deployments: [{ ...deployment, desiredState: 'stopped' }],
          });
        expect((await closed).code).toBe(1001);
        await assertUnavailable(host, ingress.url, starts);

        // Repeated reconciliation must not re-register a wakeable definition.
        const stoppedSet = {
          revision: 3,
          deployments: [{ ...deployment, desiredState: 'stopped' as const }],
        };
        await host.management.applyDeploymentSet(stoppedSet);
        await assertUnavailable(host, ingress.url, starts);
        await host.close('restart with the controller’s stopped desired set');
        hosts.splice(hosts.indexOf(host), 1);
        host = await startHost(fixture);
        await host.management.restoreDeploymentSet(stoppedSet);
        await assertUnavailable(host, ingress.url, 0);

        expect(await readFile(recordPath, 'utf8')).toBe(
          '{"name":"retained customer"}',
        );
        expect(await readFile(definition.configPath!, 'utf8')).toBe(
          'enabled: true\n',
        );
        expect(await readFile(archivePath)).toEqual(archive);
        expect(existsSync(fixture.revisionDir())).toBe(true);
        await host.management.startDeployment(deployment);
        for (const url of [baseUrl(host), ingress.url]) {
          const response = await fetch(`${url}/customer/api/record`);
          expect(response.status).toBe(200);
          expect(await response.json()).toEqual({ name: 'retained customer' });
          expect(await upgradeStatus(`${url}/customer/ws`)).toBe(101);
        }
        expect(host.registry.definition('customer')?.dataDir).toBe(
          definition.dataDir,
        );
        expect(host.registry.definition('customer')?.configPath).toBe(
          definition.configPath,
        );

        // Ordinary idle stop retains its route and can still wake through either transport.
        await vi.waitFor(() =>
          expect(
            host.registry.requireSnapshot('customer').activeConnections,
          ).toBe(0),
        );
        await host.registry.sweep(Date.now() + 2000);
        expect(host.registry.has('customer')).toBe(true);
        expect(host.registry.isActive('customer')).toBe(false);
        expect((await fetch(`${ingress.url}/customer/api/info`)).status).toBe(
          200,
        );
        await host.registry.sweep(Date.now() + 2000);
        expect(host.registry.isActive('customer')).toBe(false);
        expect(await upgradeStatus(`${ingress.url}/customer/ws`)).toBe(101);
        expect(host.registry.getMetrics().activations).toBe(3);
      } finally {
        await ingress.close();
      }
    },
  );

  it.each(['stop', 'stopped-spec'] as const)(
    'rejects %s when runtime destruction fails without reporting a successful stop',
    async (mode) => {
      const fixture = await createFixture();
      const host = await startHost(fixture);
      const deployment = spec(fixture.artifact, { activation: 'eager' });
      await host.management.applyDeployment(deployment);
      // Inject failure at the runtime boundary; keep the real management and registry paths.
      vi.spyOn(InProcessAppHandle.prototype, 'destroy').mockRejectedValueOnce(
        new Error('runtime stop failed'),
      );
      const stopping =
        mode === 'stop'
          ? host.management.stopDeployment('customer')
          : host.management.applyDeploymentSet({
              revision: 2,
              deployments: [{ ...deployment, desiredState: 'stopped' }],
            });
      await expect(stopping).rejects.toThrow('runtime stop failed');
      const status = await host.management.getStatus();
      expect(status.reconciledRevision).toBe(1);
      expect(status.deployments[0]).toMatchObject({
        desiredState: 'running',
        observedState: 'running',
      });
      expect(host.registry.isActive('customer')).toBe(true);
      expect((await fetch(`${baseUrl(host)}/customer/api/info`)).status).toBe(
        200,
      );
      await host.management.stopDeployment('customer');
      expect(host.registry.has('customer')).toBe(false);
    },
  );

  it.each([401, 403])(
    'lets status %i traffic expire and refuses its repeated background wakes',
    async (status) => {
      const fixture = await createFixture({ deniedStatus: status });
      const host = await startHost(fixture);
      await host.management.applyDeployment(
        spec(fixture.artifact, { activation: 'lazy', idleStopMs: 1000 }),
      );
      const url = `${baseUrl(host)}/customer/api/pulse`;
      const headers = { authorization: 'Bearer expired' };
      expect((await fetch(url, { headers })).status).toBe(status);
      const lastAccess = host.registry.lastAccessedAt('customer');
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 2000);
      expect((await fetch(url, { headers })).status).toBe(status);
      expect(host.registry.lastAccessedAt('customer')).toBe(lastAccess);
      await host.registry.sweep();
      expect(host.registry.isActive('customer')).toBe(false);
      const starts = host.registry.getMetrics().activations;
      for (let i = 0; i < 3; i++) {
        const denied = await fetch(url, { headers });
        expect(denied.status).toBe(503);
        expect(denied.headers.get('retry-after')).toBe('2');
        expect(host.registry.isActive('customer')).toBe(false);
      }
      expect(host.registry.getMetrics().activations).toBe(starts);
      expect(
        (await fetch(url, { headers: { authorization: 'Bearer valid' } }))
          .status,
      ).toBe(200);
      expect(host.registry.isActive('customer')).toBe(true);
      expect(host.registry.getMetrics().activations).toBe(starts + 1);
      vi.setSystemTime(Date.now() + 2000);
      await host.registry.sweep();
      expect(host.registry.isActive('customer')).toBe(false);
      expect(
        (
          await fetch(`${baseUrl(host)}/customer/`, {
            headers: { accept: 'text/html' },
          })
        ).status,
      ).toBe(200);
      expect(host.registry.isActive('customer')).toBe(true);
    },
  );

  it('lets a hidden tab release its slot without waking the App again until visible', async () => {
    const document = Object.assign(new EventTarget(), {
      visibilityState: 'visible',
    });
    vi.stubGlobal('document', document);
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'lazy', idleStopMs: 1000 }),
    );
    const client = createRealtimeClient({
      resolveUrl: () => `${baseUrl(host)}/customer/ws`,
      pingInterval: 0,
      hiddenDisconnectMs: 20,
    });
    try {
      const ready = vi.fn();
      client.watch('test:keepalive', { onReady: ready });
      await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce());
      document.visibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.waitFor(() => {
        expect(client.connected).toBe(false);
        expect(
          host.registry.requireSnapshot('customer').activeConnections,
        ).toBe(0);
      });
      for (let cycle = 1; cycle <= 3; cycle++) {
        await host.registry.sweep(Date.now() + cycle * 2000);
        client.reconnect();
        expect(host.registry.isActive('customer')).toBe(false);
        expect(host.registry.getMetrics().activations).toBe(1);
      }
      document.visibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.waitFor(() => expect(ready).toHaveBeenCalledTimes(2));
      expect(host.registry.getMetrics().activations).toBe(2);
      expect(host.registry.requireSnapshot('customer').activeConnections).toBe(
        1,
      );
    } finally {
      client.close();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('keeps a real realtime socket through three idle cycles and closes it during Host shutdown', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, {
        activation: 'eager',
        idleStopMs: 1000,
        dormantAfterMs: 5000,
      }),
    );
    const client = createRealtimeClient({
      resolveUrl: () => `${baseUrl(host)}/customer/ws`,
      pingInterval: 0,
    });
    try {
      await new Promise<void>((resolve) => {
        client.watch('test:keepalive', { onReady: resolve });
      });
      expect(host.registry.requireSnapshot('customer').activeConnections).toBe(
        1,
      );
      for (let cycle = 1; cycle <= 3; cycle++) {
        await host.registry.sweep(Date.now() + cycle * 6000);
        expect(client.ready).toBe(true);
        expect(host.registry.getMetrics().activations).toBe(1);
        expect(host.registry.isDormant('customer')).toBe(false);
      }
      await host.close();
      hosts.splice(hosts.indexOf(host), 1);
      await vi.waitFor(() => expect(client.connected).toBe(false));
    } finally {
      client.close();
    }
  });

  it('stops an App after its idle time and starts it on the next request', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'eager', idleStopMs: 1_000 }),
    );
    expect(lifecycle(await host.management.getStatus())?.state).toBe('running');

    await host.registry.sweep(Date.now() + 500);
    expect(host.registry.isActive('customer')).toBe(true);
    await host.registry.sweep(Date.now() + 2_000);
    const stopped = await host.management.getStatus();
    expect(lifecycle(stopped)?.state).toBe('stopped');
    expect(stopped.counters?.idleStops).toBe(1);
    // No `maxActiveApps` configured: nothing limits how many run at once.
    expect(stopped.counters?.maxActiveApps).toBeNull();
    expect(existsSync(fixture.revisionDir())).toBe(true);

    const response = await fetch(`${baseUrl(host)}/customer/api/info`);
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('ok');
    expect(lifecycle(await host.management.getStatus())?.state).toBe('running');
  });

  it('never stops an App whose idle time is 0, whatever the Host default', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture, { idleTtlMs: 10 });
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'eager', idleStopMs: 0 }),
    );
    await host.registry.sweep(Date.now() + 24 * 3_600_000);
    expect(host.registry.isActive('customer')).toBe(true);
  });

  it('makes an App dormant: files removed, definition, configuration and data kept', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, {
        activation: 'lazy',
        idleStopMs: 1_000,
        dormantAfterMs: 5_000,
        config: { provider: 'file', content: 'app: {}\n', revision: 'one' },
      }),
    );
    await host.registry.sweep(Date.now() + 2_000);
    expect(lifecycle(await host.management.getStatus())?.state).toBe('stopped');
    expect(existsSync(fixture.revisionDir())).toBe(true);

    await host.registry.sweep(Date.now() + 6_000);
    const status = await host.management.getStatus();
    expect(lifecycle(status)?.state).toBe('dormant');
    expect(status.counters?.dormancies).toBe(1);
    expect(status.deployments).toHaveLength(1);
    expect(existsSync(fixture.revisionDir())).toBe(false);
    expect(
      existsSync(
        path.join(fixture.volumesDir, 'customer', 'configs', 'config.one.yml'),
      ),
    ).toBe(true);
    expect(
      existsSync(path.join(fixture.volumesDir, 'customer', 'storage')),
    ).toBe(true);
    const state = JSON.parse(
      await readFile(
        path.join(fixture.deploymentsDir, 'customer', '.lifecycle.json'),
        'utf8',
      ),
    ) as { dormant: boolean };
    expect(state.dormant).toBe(true);
  });

  it('prepares a dormant App again on its next request, assets included', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, {
        activation: 'lazy',
        idleStopMs: 1_000,
        dormantAfterMs: 2_000,
      }),
    );
    await host.registry.sweep(Date.now() + 3_000);
    expect(lifecycle(await host.management.getStatus())?.state).toBe('dormant');

    const asset = await fetch(`${baseUrl(host)}/customer/assets/app.js`);
    expect(asset.status).toBe(200);
    expect(existsSync(fixture.revisionDir())).toBe(true);

    await host.registry.sweep(Date.now() + 3_000);
    expect(existsSync(fixture.revisionDir())).toBe(false);
    const response = await fetch(`${baseUrl(host)}/customer/api/info`);
    expect(response.status).toBe(200);
    const status = await host.management.getStatus();
    expect(lifecycle(status)?.state).toBe('running');
    expect(status.counters?.materializations).toBe(2);
  });

  it('answers a page request with the starting page while a slow App starts, then serves it', async () => {
    const fixture = await createFixture({ startDelayMs: 600 });
    const host = await startHost(fixture, { activationHoldMs: 50 });
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'lazy', idleStopMs: 60_000 }),
    );

    const page = await navigate(`${baseUrl(host)}/customer/`, 'zh-CN,zh;q=0.9');
    expect(page.status).toBe(503);
    expect(page.headers['retry-after']).toBe('2');
    const html = page.body;
    expect(html).toContain('data-app-host="starting"');
    expect(html).toContain('正在启动应用');
    expect(html).toContain('http-equiv="refresh"');
    expect(lifecycle(await host.management.getStatus())?.state).toBe(
      'starting',
    );

    // A request that is not a page waits for the start instead.
    const api = await fetch(`${baseUrl(host)}/customer/api/info`);
    expect(api.status).toBe(200);
    const again = await navigate(`${baseUrl(host)}/customer/`);
    expect(again.status).toBe(200);
  });

  it('answers other requests with 503 and Retry-After when the start takes longer than the wait', async () => {
    const fixture = await createFixture({ startDelayMs: 600 });
    const host = await startHost(fixture, { activationWaitMs: 50 });
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'lazy' }),
    );
    const response = await fetch(`${baseUrl(host)}/customer/api/info`);
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('2');
    await expect(response.json()).resolves.toMatchObject({
      code: 'APP_STARTING',
    });
  });

  it('shows the dormant wording when a page wakes a dormant App', async () => {
    const fixture = await createFixture({ startDelayMs: 400 });
    const host = await startHost(fixture, { activationHoldMs: 20 });
    await host.management.applyDeployment(
      spec(fixture.artifact, {
        activation: 'lazy',
        idleStopMs: 1_000,
        dormantAfterMs: 2_000,
      }),
    );
    await host.registry.sweep(Date.now() + 3_000);
    const page = await navigate(`${baseUrl(host)}/customer/`);
    expect(page.status).toBe(503);
    expect(page.body).toContain('Preparing the application');
  });

  it('changes only the policy of a running App without restarting it', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, { activation: 'eager', idleStopMs: 0 }),
    );
    const before = host.registry.snapshot('customer');
    await host.management.restoreDeploymentSet({
      revision: 100,
      deployments: [
        spec(fixture.artifact, {
          activation: 'lazy',
          idleStopMs: 600_000,
          dormantAfterMs: 86_400_000,
        }),
      ],
    });
    const after = host.registry.snapshot('customer');
    expect(after?.version).toBe(before?.version);
    expect(host.registry.definition('customer')?.resourcePolicy).toMatchObject({
      idleTtlMs: 600_000,
      dormantAfterMs: 86_400_000,
    });
  });

  it('keeps a dormant App dormant and its last access across a Host restart', async () => {
    const fixture = await createFixture();
    const first = await startHost(fixture);
    const deployment = spec(fixture.artifact, {
      activation: 'lazy',
      idleStopMs: 1_000,
      dormantAfterMs: 2_000,
    });
    await first.management.applyDeployment(deployment);
    await first.registry.sweep(Date.now() + 3_000);
    const lastAccessedAt = first.registry.lastAccessedAt('customer');
    await first.close('restart');
    hosts.splice(hosts.indexOf(first), 1);

    const second = await startHost(fixture);
    const restored = await second.management.restoreDeploymentSet({
      revision: 1,
      deployments: [deployment],
    });
    expect(restored.status.deployments[0]?.observedState).toBe('stopped');
    expect(lifecycle(restored.status)?.state).toBe('dormant');
    expect(second.registry.lastAccessedAt('customer')).toBe(lastAccessedAt);

    const response = await fetch(`${baseUrl(second)}/customer/api/info`);
    expect(response.status).toBe(200);
    expect(existsSync(fixture.revisionDir())).toBe(true);
  });

  it('removes the App with its data only on an explicit removal', async () => {
    const fixture = await createFixture();
    const host = await startHost(fixture);
    await host.management.applyDeployment(
      spec(fixture.artifact, {
        activation: 'lazy',
        idleStopMs: 1_000,
        dormantAfterMs: 2_000,
      }),
    );
    await host.registry.sweep(Date.now() + 3_000);
    await host.management.removeDeployment('customer');
    const status = await host.management.getStatus();
    expect(status.deployments).toHaveLength(0);
    expect(existsSync(path.join(fixture.volumesDir, 'customer'))).toBe(false);
    expect(existsSync(path.join(fixture.deploymentsDir, 'customer'))).toBe(
      false,
    );
  });
});

async function assertUnavailable(
  host: AppHost,
  ingressUrl: string,
  activations: number,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const url of [baseUrl(host), ingressUrl]) {
      for (const route of ['/', '/api/info', '/assets/app.js']) {
        const response = await fetch(`${url}/customer${route}`);
        await response.arrayBuffer();
        expect(response.status).toBe(404);
      }
      expect(await upgradeStatus(`${url}/customer/ws`)).toBe(404);
    }
  }
  expect(host.registry.has('customer')).toBe(false);
  expect(host.registry.isActive('customer')).toBe(false);
  expect(host.registry.getMetrics().activations).toBe(activations);
  expect((await host.management.getStatus()).deployments[0]).toMatchObject({
    desiredState: 'stopped',
    observedState: 'stopped',
    app: null,
  });
}

/** A real upgrade handshake, including its HTTP rejection status. */
function upgradeStatus(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, {
      headers: {
        connection: 'Upgrade',
        upgrade: 'websocket',
        'sec-websocket-version': '13',
        'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
    });
    request.on('error', reject);
    request.on('response', (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode ?? 0));
    });
    request.on('upgrade', (response, socket) => {
      socket.destroy();
      resolve(response.statusCode ?? 0);
    });
  });
}

/** Use the same HTTP/WebSocket proxy as the unified standalone application listener. */
async function startIngress(currentHost: () => AppHost) {
  const proxy = new NodeServerProxy({
    match: () => true,
    target: () => new URL(baseUrl(currentHost())),
  });
  const server = http.createServer((req, res) => {
    const request = toFetchRequest(req, {
      basePath: '',
      signal: new AbortController().signal,
    });
    void proxy
      .fetch(request)
      .then((response) => applyFetchResponse(res, response));
  });
  server.on('upgrade', (req, socket, head) => {
    void proxy.upgrade(req, socket, head);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address !== 'object')
    throw new Error('The ingress has no TCP address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      proxy.close();
      const closed = once(server, 'close');
      server.close();
      server.closeAllConnections();
      await closed;
    },
  };
}

/** A browser navigation: `fetch` cannot send `sec-fetch-mode: navigate`. */
function navigate(
  url: string,
  language = 'en',
): Promise<{
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const request = http.get(
      url,
      {
        headers: {
          accept: 'text/html',
          'accept-language': language,
          'sec-fetch-mode': 'navigate',
        },
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => (body += chunk));
        response.on('end', () =>
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body,
          }),
        );
      },
    );
    request.on('error', reject);
  });
}

function lifecycle(status: {
  deployments: Array<{ appId: string; lifecycle?: { state: string } | null }>;
}) {
  return status.deployments.find((item) => item.appId === 'customer')
    ?.lifecycle;
}

function spec(
  artifact: ArtifactReference,
  overrides: Partial<HostDeploymentSpec> = {},
): HostDeploymentSpec {
  return {
    id: 'customer',
    appId: 'customer',
    artifact,
    desiredState: 'running',
    backend: 'in-process',
    ...overrides,
  };
}

function baseUrl(host: AppHost): string {
  const address = host.server.address();
  if (!address || typeof address !== 'object')
    throw new Error('The Host has no TCP address');
  return `http://127.0.0.1:${address.port}`;
}

async function startHost(
  fixture: Fixture,
  options: Partial<AppHostOptions> = {},
): Promise<AppHost> {
  const host = createAppHost({
    mode: 'managed',
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: fixture.deploymentsDir,
    appVolumesDir: fixture.volumesDir,
    artifact: {
      driver: 'fs',
      location: fixture.artifactDir,
      visibility: 'private',
    },
    evictionIntervalMs: 0,
    logging: { level: 'silent' },
    ...options,
  });
  hosts.push(host);
  await host.start();
  return host;
}

interface Fixture {
  deploymentsDir: string;
  volumesDir: string;
  artifactDir: string;
  artifact: ArtifactReference;
  revisionDir(): string;
}

async function createFixture(
  options: { startDelayMs?: number; deniedStatus?: number } = {},
): Promise<Fixture> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-on-demand-'));
  tempDirs.push(rootDir);
  const deploymentsDir = path.join(rootDir, 'apps');
  const volumesDir = path.join(rootDir, 'app-volumes');
  const artifactDir = path.join(rootDir, 'artifacts');
  const appRoot = path.join(rootDir, 'source', 'customer');
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await mkdir(path.join(appRoot, 'dist', 'client', 'assets'), {
    recursive: true,
  });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer',
      version: '1.0.0',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    `import { readFile } from 'node:fs/promises';
    import path from 'node:path';
    export async function createServer(scope) {
      await new Promise((resolve) => setTimeout(resolve, ${options.startDelayMs ?? 0}));
      return {
        websocket() {
          return { onMessage(event, ws) {
            const message = JSON.parse(event.data);
            if (message.type === 'subscribe') ws.send(JSON.stringify({ type: 'subscribed', id: message.id, topic: message.topic, subscriptionId: message.id }));
          } };
        },
        async fetch(request) {
          const url = new URL(request.url);
          if (url.pathname === '/api/record') return new Response(await readFile(path.join(scope.dataDir, 'record.json')), { headers: { 'content-type': 'application/json' } });
          if (url.pathname === '/api/pulse' && request.headers.get('authorization') !== 'Bearer valid')
            return new Response('denied', { status: ${options.deniedStatus ?? 401} });
          if (url.pathname === '/') return new Response('<!doctype html><title>Customer</title>', { headers: { 'content-type': 'text/html' } });
          return new Response('ok');
        },
      };
    }`,
  );
  await writeFile(
    path.join(appRoot, 'dist', 'client', 'assets', 'app.js'),
    'console.log("customer");\n',
  );
  await mkdir(path.join(artifactDir, 'releases', 'customer'), {
    recursive: true,
  });
  const key = 'releases/customer/1.0.0.tar.gz';
  const archivePath = path.join(artifactDir, key);
  await createTar({ cwd: appRoot, file: archivePath, gzip: true }, ['.']);
  const checksum = createHash('sha256')
    .update(await readFile(archivePath))
    .digest('hex');
  const artifact = { key, appId: 'customer', version: '1.0.0', checksum };
  return {
    deploymentsDir,
    volumesDir,
    artifactDir,
    artifact,
    revisionDir: () => path.join(deploymentsDir, 'customer', checksum),
  };
}
