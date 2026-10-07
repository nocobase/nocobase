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
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { c as createTar } from 'tar';
import {
  createAppHost,
  type AppHost,
  type AppHostOptions,
  type ArtifactReference,
  type HostDeploymentSpec,
} from '../dist/index.js';

const tempDirs: string[] = [];
const hosts: AppHost[] = [];

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((host) => host.close('test cleanup')));
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('on-demand Apps on a managed Host', () => {
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
  options: { startDelayMs?: number } = {},
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
    `export async function createServer() {
      await new Promise((resolve) => setTimeout(resolve, ${options.startDelayMs ?? 0}));
      return {
        fetch(request) {
          const url = new URL(request.url);
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
