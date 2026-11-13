/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fork } from 'node:child_process';
import { PassThrough, Readable } from 'node:stream';
import type { NocoBaseDriveDisk } from '@nocobase/drive';
import { DriveArtifactResolver } from '../dist/artifact-resolver.js';
import { createHash } from 'node:crypto';
import * as fsPromises from 'node:fs/promises';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { c as createTar } from 'tar';
import { DeploymentCatalog } from '../dist/deployment/catalog.js';
import {
  createAppHost,
  type AppHost,
  type HostDeploymentSet,
  type ArtifactReference,
} from '../dist/index.js';

const tempDirs: string[] = [];
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, readdir: vi.fn(actual.readdir) };
});
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, fork: vi.fn(actual.fork) };
});
const hosts: AppHost[] = [];

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(hosts.splice(0).map((host) => host.close('test cleanup')));
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('managed host reconciliation', () => {
  it('cancels a stalled artifact stream, cleans its files and lets the next deployment continue', async () => {
    const fixture = await createFixture();
    const entered = Promise.withResolvers<void>();
    const stream = new PassThrough();
    const disk = {
      getStream: vi
        .fn()
        .mockImplementationOnce(async () => {
          entered.resolve();
          return stream;
        })
        .mockImplementation(async () =>
          Readable.from(
            await readFile(
              path.join(fixture.artifactDir, fixture.artifact.key),
            ),
          ),
        ),
    } as unknown as NocoBaseDriveDisk;
    const catalog = new DeploymentCatalog({
      deploymentsDir: fixture.deploymentsDir,
      volumesDir: fixture.volumesDir,
    });
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifactResolver: new DriveArtifactResolver(disk, catalog, {
        appRevisionsDir: fixture.deploymentsDir,
      }),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
    const first = host.management
      .applyDeployment({ ...spec, operationId: 'stream' })
      .catch((error: unknown) => error);
    await entered.promise;
    stream.write('partial');
    expect(await host.management.cancelDeployment('stream', 'customer')).toBe(
      'cancelling',
    );
    expect(await first).toMatchObject({ code: 'DEPLOYMENT_CANCELLED' });
    expect(stream.destroyed).toBe(true);
    expect(
      await readdir(path.join(fixture.deploymentsDir, 'customer')),
    ).toEqual([]);
    await host.management.applyDeployment({
      ...spec,
      operationId: 'after-stream',
    });
    expect(await host.management.getOperation('after-stream')).toMatchObject({
      state: 'succeeded',
    });
  });

  it('atomically gates ingress after a streamed request ends, without interrupting that request', async () => {
    const fixture = await createFixture();
    await writeFile(
      path.join(fixture.appRoot, 'dist/server/embedded.js'),
      `export function createServer() { return { fetch() { return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('open')); } })); } }; }`,
    );
    const artifact = await createArtifact(fixture, '1.2.4');
    const host = createAppHost({
      mode: 'managed',
      host: '127.0.0.1',
      port: 0,
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await host.start();
    await host.management.applyDeployment({
      ...deploymentSet(1, artifact).deployments[0]!,
      activation: 'eager',
    });
    const address = host.server.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing listener');
    const url = `http://127.0.0.1:${address.port}/customer`;
    const abort = new AbortController();
    const response = await fetch(url, { signal: abort.signal });
    expect(response.status).toBe(200);
    expect(await host.management.prepareRotation!({})).toBe(false);
    abort.abort();
    await vi.waitFor(async () =>
      expect(await host.management.prepareRotation!({})).toBe(true),
    );
    const gated = await fetch(url);
    expect(gated.status).toBe(503);
    expect(gated.headers.get('retry-after')).toBe('2');
    await host.management.prepareRotation!({ resume: true });
    expect(host.registry.isRotating()).toBe(false);
  });

  it.each(['complete', 'deadline'] as const)(
    'gates new requests and drains a real streamed response until %s',
    async (ending) => {
      const fixture = await createFixture();
      await writeFile(
        path.join(fixture.appRoot, 'dist/server/embedded.js'),
        `export function createServer() { return { fetch() { return new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('open')); } })); } }; }`,
      );
      const artifact = await createArtifact(fixture, '1.2.4');
      const host = createAppHost({
        mode: 'managed',
        host: '127.0.0.1',
        port: 0,
        appRevisionsDir: fixture.deploymentsDir,
        appVolumesDir: fixture.volumesDir,
        artifact: fsArtifact(fixture.artifactDir),
        evictionIntervalMs: 0,
      });
      hosts.push(host);
      await host.start();
      const spec = {
        ...deploymentSet(1, artifact).deployments[0]!,
        activation: 'eager' as const,
      };
      await host.management.applyDeployment(spec);
      const address = host.server.address();
      if (!address || typeof address === 'string')
        throw new Error('Missing listener');
      const url = `http://127.0.0.1:${address.port}/customer`;
      const abort = new AbortController();
      const response = await fetch(url, { signal: abort.signal });
      const reader = response.body!.getReader();
      expect(new TextDecoder().decode((await reader.read()).value)).toBe(
        'open',
      );
      const streamEnded = reader.read().catch((error: unknown) => error);
      let drained = false;
      const draining = host.management.prepareRotation!({
        ignoreConnections: true,
        drainTimeoutMs: ending === 'deadline' ? 200 : 5000,
      }).then((ok) => {
        drained = true;
        return ok;
      });
      expect(host.registry.isRotating()).toBe(true);
      for (let i = 0; i < 3; i++) {
        const retry = await fetch(url);
        expect(retry.status).toBe(503);
        expect(retry.headers.get('retry-after')).toBe('2');
        await retry.text();
      }
      expect(drained).toBe(false);
      expect(() => host.management.startDeployment(spec)).toThrow(
        expect.objectContaining({ code: 'HOST_DRAINING' }),
      );
      if (ending === 'complete') abort.abort();
      expect(await draining).toBe(true);
      expect(await streamEnded).toBeInstanceOf(Error);
    },
  );

  it('retries a recorded capacity failure only when explicitly requested and never reruns a successful operation', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const memory = host.registry.memoryUsage.bind(host.registry);
    const sampler = vi.spyOn(host.registry, 'memoryUsage').mockReturnValue({
      heapUsed: 1000,
      heapLimit: 1000,
      rss: 1000,
      available: 0,
    });
    const spec = {
      ...deploymentSet(1, fixture.artifact).deployments[0]!,
      operationId: 'capacity-retry',
      scope: { id: 'preview', backend: 'in-process' },
      activation: 'eager' as const,
    };
    expect(
      (await host.management.applyDeployment(spec)).deployments[0],
    ).toMatchObject({
      observedState: 'failed',
      errorCode: 'APP_CAPACITY_EXCEEDED',
    });
    sampler.mockImplementation(memory);
    await host.management.applyDeployment({
      ...spec,
      operationId: 'healthy-other-operation',
    });
    expect(host.registry.isActive('customer')).toBe(true);
    expect(
      (await host.management.applyDeployment(spec)).deployments[0]
        ?.observedState,
    ).toBe('failed');
    expect(
      (await host.management.applyDeployment({ ...spec, retryCapacity: true }))
        .deployments[0]?.observedState,
    ).toBe('running');
    const active = host.registry.getMetrics().activations;
    await host.management.applyDeployment({ ...spec, retryCapacity: true });
    expect(host.registry.getMetrics().activations).toBe(active);
    expect(
      await host.management.getOperation('capacity-retry', {
        scope: spec.scope,
      }),
    ).toMatchObject({ state: 'succeeded' });
  });

  it('keeps the expanded revision after a capacity refusal and reuses it after the Host restarts', async () => {
    const fixture = await createFixture();
    const options = {
      mode: 'managed' as const,
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    };
    const host = createAppHost(options);
    hosts.push(host);
    vi.spyOn(host.registry, 'memoryUsage').mockReturnValue({
      heapUsed: 1000,
      heapLimit: 1000,
      rss: 1000,
      available: 0,
    });
    const spec = {
      ...deploymentSet(1, fixture.artifact).deployments[0]!,
      operationId: 'capacity-reuse',
      scope: { id: 'preview', backend: 'in-process' },
      activation: 'eager' as const,
    };
    const refused = (await host.management.applyDeployment(spec))
      .deployments[0];
    expect(refused).toMatchObject({
      observedState: 'failed',
      errorCode: 'APP_CAPACITY_EXCEEDED',
    });
    // No configured limit: the internal sentinel never reaches the message people read.
    expect(refused?.error).not.toContain('maxActiveApps');
    expect(refused?.error).not.toContain(String(Number.MAX_SAFE_INTEGER));
    expect(await revisionNames(fixture.deploymentsDir, 'customer')).toEqual([
      fixture.artifact.checksum,
    ]);

    // A retry on the same Host, still short of memory, reuses the revision instead of extracting it again.
    const again = await host.management.applyDeployment({
      ...spec,
      retryCapacity: true,
    });
    expect(again.deployments[0]).toMatchObject({
      errorCode: 'APP_CAPACITY_EXCEEDED',
    });
    expect(await revisionNames(fixture.deploymentsDir, 'customer')).toEqual([
      fixture.artifact.checksum,
    ]);

    // The Host restarts to recycle memory; the archive is gone, so only the kept revision can satisfy the retry.
    await host.close('rotation');
    await rm(path.join(fixture.artifactDir, fixture.artifact.key));
    const restarted = createAppHost(options);
    hosts.push(restarted);
    const retried = await restarted.management.applyDeployment({
      ...spec,
      retryCapacity: true,
    });
    expect(retried.deployments[0]).toMatchObject({
      observedState: 'running',
      cacheHit: true,
    });
    expect(restarted.registry.definition('customer')?.rootDir).toBe(
      revisionDirectory(fixture.deploymentsDir, fixture.artifact),
    );
  });

  it('removes the expanded revision when the application itself fails to start', async () => {
    const fixture = await createFixture();
    await writeFile(
      path.join(fixture.appRoot, 'dist', 'server', 'embedded.js'),
      'throw new Error("broken release");',
    );
    const broken = await createArtifact(fixture, '1.2.9');
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const result = await host.management.applyDeployment({
      ...deploymentSet(1, broken).deployments[0]!,
      operationId: 'broken-start',
      scope: { id: 'preview', backend: 'in-process' },
      activation: 'eager' as const,
    });
    expect(result.deployments[0]?.observedState).toBe('failed');
    expect(result.deployments[0]?.errorCode).not.toBe('APP_CAPACITY_EXCEEDED');
    expect(await revisionNames(fixture.deploymentsDir, 'customer')).toEqual([]);
  });

  it.each(['cancel', 'timeout', 'exit'] as const)(
    'cleans a stalled extraction on %s and lets the next deployment finish',
    async (outcome) => {
      const fixture = await createFixture();
      const host = createAppHost({
        mode: 'managed',
        appRevisionsDir: fixture.deploymentsDir,
        appVolumesDir: fixture.volumesDir,
        artifact: fsArtifact(fixture.artifactDir),
        evictionIntervalMs: 0,
      });
      hosts.push(host);
      const actual =
        await vi.importActual<typeof import('node:child_process')>(
          'node:child_process',
        );
      let child!: ReturnType<typeof fork>;
      const ready = Promise.withResolvers<void>();
      let intercept = true;
      const spy = vi
        .mocked(fork)
        .mockImplementation((worker, args, options) => {
          if (args?.[0] === 'extract' && intercept) {
            intercept = false;
            child = actual.fork(
              new URL(
                './fixtures/stalled-artifact-worker.mjs',
                import.meta.url,
              ),
              args,
              options,
            );
            child.once('message', () => ready.resolve());
            return child;
          }
          return actual.fork(worker, args, options);
        });
      const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
      const logs: Record<string, unknown>[] = [];
      const first = host.management.applyDeployment(
        { ...spec, operationId: 'stalled' },
        (entry) => {
          logs.push(entry);
          if (outcome === 'timeout' && entry.phase === 'extracting')
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        },
      );
      const firstResult = first.catch((error: unknown) => error);
      await ready.promise;
      const second = host.management.applyDeployment({
        ...spec,
        operationId: 'next',
      });
      if (outcome === 'cancel') {
        expect(
          await host.management.cancelDeployment('stalled', 'customer'),
        ).toBe('cancelling');
      } else if (outcome === 'timeout') {
        await vi.advanceTimersByTimeAsync(121_000);
        vi.useRealTimers();
      } else child.kill('SIGKILL');
      await firstResult;
      expect(child.signalCode).toBe('SIGKILL');
      expect(() => process.kill(child.pid!, 0)).toThrow();
      const operation = await host.management.getOperation('stalled');
      expect(operation).toMatchObject({
        state: outcome === 'cancel' ? 'cancelled' : 'failed',
      });
      if (outcome === 'timeout')
        expect(JSON.stringify(operation)).toContain('timed out');
      await second;
      expect(await host.management.getOperation('next')).toMatchObject({
        state: 'succeeded',
      });
      expect(
        await readdir(path.join(fixture.deploymentsDir, 'customer')),
      ).toEqual([
        '.active-revision',
        '.lifecycle.json',
        fixture.artifact.checksum,
      ]);
      expect(logs.some((entry) => entry.phase === 'extracting')).toBe(true);
      spy.mockRestore();
    },
  );

  it('cancels while the Host is recording admission, before it can enter the queue', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
    const deployment = host.management.applyDeployment({
      ...spec,
      operationId: 'admission',
    });
    const rejection = deployment.catch((error: unknown) => error);
    expect(
      await host.management.cancelDeployment('admission', 'customer', {
        queuedOnly: true,
      }),
    ).toBe('cancelled');
    expect(await rejection).toMatchObject({ code: 'DEPLOYMENT_CANCELLED' });
    expect(await host.management.getOperation('admission')).toMatchObject({
      state: 'cancelled',
    });
    expect(host.registry.has('customer')).toBe(false);
  });

  it('reports queue positions and cancels queued work without waiting for the running deployment', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const resolve = host.artifactResolver.resolve.bind(host.artifactResolver);
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const spy = vi
      .spyOn(host.artifactResolver, 'resolve')
      .mockImplementationOnce(async (reference) => {
        entered();
        await gate;
        return resolve(reference);
      });
    const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
    const first = host.management.applyDeployment({
      ...spec,
      operationId: 'first',
    });
    await started;
    const logs: Record<string, unknown>[] = [];
    const second = host.management.applyDeployment(
      { ...spec, operationId: 'second' },
      (entry) => logs.push(entry),
    );
    const rejected = second.catch((error: unknown) => error);
    await vi.waitFor(async () =>
      expect(
        await host.management.deploymentProgress('second', 'customer'),
      ).toMatchObject({ state: 'queued', queueAhead: 1 }),
    );
    expect(logs.some((entry) => entry.phase === 'resolving')).toBe(false);
    expect(await host.management.cancelDeployment('second', 'other')).toBe(
      'notFound',
    );
    expect(
      await host.management.cancelDeployment('first', 'customer', {
        queuedOnly: true,
      }),
    ).toBe('tooLate');
    expect(await host.management.cancelDeployment('second', 'customer')).toBe(
      'cancelled',
    );
    expect(await rejected).toMatchObject({ code: 'DEPLOYMENT_CANCELLED' });
    expect(await host.management.getOperation('second')).toMatchObject({
      state: 'cancelled',
    });
    release();
    await first;
    spy.mockRestore();
    expect(await host.management.getOperation('first')).toMatchObject({
      state: 'succeeded',
    });
  });

  it.each(['resolving', 'verifying', 'extracting', 'preparing'])(
    'cancels at the %s step boundary and removes candidate files',
    async (phase) => {
      const fixture = await createFixture();
      const host = createAppHost({
        mode: 'managed',
        appRevisionsDir: fixture.deploymentsDir,
        appVolumesDir: fixture.volumesDir,
        artifact: fsArtifact(fixture.artifactDir),
        evictionIntervalMs: 0,
      });
      hosts.push(host);
      const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
      let requested = false;
      const deployment = host.management.applyDeployment(
        { ...spec, operationId: 'cancel-at-step' },
        (entry) => {
          if (entry.phase === phase && !requested) {
            requested = true;
            void host.management.cancelDeployment('cancel-at-step', 'customer');
          }
        },
      );
      await expect(deployment).rejects.toMatchObject({
        code: 'DEPLOYMENT_CANCELLED',
      });
      expect(requested).toBe(true);
      expect(
        await host.management.getOperation('cancel-at-step'),
      ).toMatchObject({ state: 'cancelled' });
      const entries = await readdir(
        path.join(fixture.deploymentsDir, 'customer'),
      );
      expect(
        entries.filter(
          (name) =>
            name.endsWith('.staging') ||
            name.endsWith('.tar.gz') ||
            /^[a-f0-9]{64}$/.test(name),
        ),
      ).toEqual([]);
      expect(host.registry.has('customer')).toBe(false);
    },
  );

  it('keeps the previous runtime, configuration and selected revision after cancellation', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const first = deploymentSet(1, fixture.artifact, {
      activation: 'eager',
      operationId: 'previous',
      config: {
        provider: 'file',
        revision: 'previous',
        content: 'title: previous',
      },
    }).deployments[0]!;
    await host.management.applyDeployment(first);
    const before = host.registry.definition('customer');
    const next = await createArtifact(fixture, '2.0.0');
    await expect(
      host.management.applyDeployment(
        {
          ...first,
          operationId: 'candidate',
          artifact: next,
          config: {
            provider: 'file',
            revision: 'candidate',
            content: 'title: candidate',
          },
        },
        (entry) => {
          if (entry.phase === 'preparing')
            void host.management.cancelDeployment('candidate', 'customer');
        },
      ),
    ).rejects.toMatchObject({ code: 'DEPLOYMENT_CANCELLED' });
    expect(host.registry.definition('customer')).toEqual(before);
    expect(await readFile(before!.configPath!, 'utf8')).toBe('title: previous');
    expect(
      await readFile(
        path.join(fixture.deploymentsDir, 'customer', '.active-revision'),
        'utf8',
      ),
    ).toContain(fixture.artifact.checksum);
    await expect(
      readFile(
        path.join(
          fixture.deploymentsDir,
          'customer',
          next.checksum,
          'package.json',
        ),
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('closes cancellation before switching and preserves the actual successful outcome', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const spec = deploymentSet(1, fixture.artifact).deployments[0]!;
    let cancellation: Promise<string> | undefined;
    await host.management.applyDeployment(
      { ...spec, operationId: 'switching' },
      (entry) => {
        if (entry.phase === 'switching')
          cancellation = host.management.cancelDeployment(
            'switching',
            'customer',
          );
      },
    );
    expect(await cancellation).toBe('tooLate');
    expect(await host.management.getOperation('switching')).toMatchObject({
      state: 'succeeded',
    });
  });

  it.each(['deploy', 'restore'] as const)(
    'waits for revision pruning before %s reads a revision',
    async (operation) => {
      const fixture = await createFixture();
      const host = createAppHost({
        mode: 'managed',
        appRevisionsDir: fixture.deploymentsDir,
        appVolumesDir: fixture.volumesDir,
        artifact: fsArtifact(fixture.artifactDir),
        evictionIntervalMs: 0,
      });
      hosts.push(host);
      let releasePruning!: () => void;
      const gate = new Promise<void>((resolve) => {
        releasePruning = resolve;
      });
      const original = (
        await vi.importActual<typeof import('node:fs/promises')>(
          'node:fs/promises',
        )
      ).readdir;
      let pruningStarted = false;
      const spy = vi
        .spyOn(fsPromises, 'readdir')
        .mockImplementation(async (...args: Parameters<typeof original>) => {
          if (
            String(args[0]) === path.join(fixture.deploymentsDir, 'customer')
          ) {
            pruningStarted = true;
            await gate;
          }
          return original(...args);
        });
      try {
        const set = deploymentSet(1, fixture.artifact, { activation: 'lazy' });
        await host.management.applyDeploymentSet(set);
        await vi.waitFor(() => expect(pruningStarted).toBe(true));
        const discover = vi.spyOn(DeploymentCatalog.prototype, 'discoverAt');
        try {
          const next =
            operation === 'deploy'
              ? host.management.applyDeployment(set.deployments[0]!)
              : host.management.restoreDeploymentSet({ ...set, revision: 2 });
          await new Promise((resolve) => setTimeout(resolve, 20));
          expect(discover).not.toHaveBeenCalled();
          releasePruning();
          await next;
          expect(discover).toHaveBeenCalled();
        } finally {
          discover.mockRestore();
        }
      } finally {
        releasePruning();
        spy.mockRestore();
      }
    },
  );

  it('captures deployment stages and initialization errors before restoring the running app', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const entries: Array<Record<string, unknown>> = [];
    const first = deploymentSet(1, fixture.artifact, { activation: 'eager' })
      .deployments[0]!;
    await host.management.applyDeployment(
      { ...first, operationId: 'first-operation' },
      (entry) => entries.push(entry),
    );
    expect(entries.some((entry) => entry.phase === 'extracting')).toBe(true);
    expect(
      entries.every((entry) => entry.deploymentId === 'first-operation'),
    ).toBe(true);
    await writeFile(
      path.join(fixture.appRoot, 'dist', 'server', 'embedded.js'),
      'export function createServer() { throw new Error("session.secret is still set to the default value"); }',
    );
    const artifact = await createArtifact(fixture, '1.2.4');
    entries.length = 0;
    const result = await host.management.applyDeployment(
      { ...first, artifact, operationId: 'failed-operation' },
      (entry) => entries.push(entry),
    );
    expect(result.deployments[0]?.observedState).toBe('failed');
    expect(JSON.stringify(entries)).toContain('session.secret');
    expect(
      entries.some(
        (entry) => entry.err && JSON.stringify(entry.err).includes('stack'),
      ),
    ).toBe(true);
    expect(host.registry.isActive('customer')).toBe(true);
    const directory = path.join(
      fixture.volumesDir,
      'customer',
      'storage',
      'logs',
    );
    const files = await readdir(directory);
    const content = (
      await Promise.all(
        files.map((file) => readFile(path.join(directory, file), 'utf8')),
      )
    ).join('');
    expect(content).toContain('Application initialization failed');
    expect(content).toContain('failed-operation');
  });

  it('rejects configuration publishing without a registered runtime config', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await expect(
      host.management.publishAppConfig('customer', 'feature: true'),
    ).rejects.toThrow('not registered');
    const set = deploymentSet(1, fixture.artifact, { activation: 'lazy' });
    set.deployments[0]!.config = undefined;
    await host.management.applyDeploymentSet(set);
    await expect(
      host.management.publishAppConfig('customer', 'feature: true'),
    ).rejects.toThrow('no runtime configuration file');
  });

  it('owns runtime config files and cleans up replaced configurations', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const first = deploymentSet(1, fixture.artifact, { activation: 'lazy' });
    first.deployments[0]!.config = {
      provider: 'file',
      revision: 'first',
      content: 'feature: old\n',
    };
    await host.management.applyDeploymentSet(first);
    const oldPath = host.registry.definition('customer')!.configPath!;
    expect(await readFile(oldPath, 'utf8')).toBe('feature: old\n');
    const second = {
      ...first.deployments[0]!,
      config: {
        provider: 'file' as const,
        revision: 'second',
        content: 'feature: new\n',
      },
    };
    await host.management.applyDeployment(second);
    const nextPath = host.registry.definition('customer')!.configPath!;
    expect(nextPath).not.toBe(oldPath);
    await expect(readFile(oldPath)).rejects.toMatchObject({ code: 'ENOENT' });
    await host.management.publishAppConfig('customer', 'feature: published\n');
    expect(await readFile(nextPath, 'utf8')).toBe('feature: published\n');
    expect(host.registry.isActive('customer')).toBe(false);
  });

  it('publishes configuration before starting a registered stopped deployment', async () => {
    const fixture = await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const deployment = deploymentSet(1, fixture.artifact, {
      activation: 'lazy',
      config: {
        provider: 'file',
        revision: 'start',
        content: 'auth:\n  secret: test-auth-secret-at-least-32-characters\n',
      },
    }).deployments[0]!;

    await host.management.applyDeployment(deployment);
    const originalConfigPath =
      host.registry.definition('customer')!.configPath!;
    await rm(originalConfigPath);
    expect(host.registry.isActive('customer')).toBe(false);

    const started = await host.management.startDeployment(deployment);
    expect(started.deployments[0]).toMatchObject({
      appId: 'customer',
      observedState: 'running',
    });
    const startedConfigPath = host.registry.definition('customer')!.configPath!;
    expect(await readFile(startedConfigPath, 'utf8')).toBe(
      deployment.config!.content,
    );
  });

  it('deploys, restores and removes a flat managed revision without changing the volume layout', async () => {
    const fixture = await createFixture();
    const options = {
      mode: 'managed' as const,
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    };
    const host = createAppHost(options);
    hosts.push(host);
    const set = deploymentSet(1, fixture.artifact, { activation: 'eager' });
    await host.management.applyDeploymentSet(set);
    const revision = path.join(
      fixture.deploymentsDir,
      fixture.artifact.appId,
      fixture.artifact.checksum,
    );
    expect(await readdir(revision)).toContain('dist');
    await host.close();
    hosts.pop();
    await rm(path.join(fixture.artifactDir, fixture.artifact.key));
    const restored = createAppHost(options);
    hosts.push(restored);
    expect(
      (await restored.management.restoreDeploymentSet(set)).status
        .deployments[0]?.observedState,
    ).toBe('running');
    await restored.management.removeDeployment(fixture.artifact.appId);
    await expect(readdir(revision)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('restores local revisions without reading artifacts and fails when the revision is missing', async () => {
    const fixture = await createFixture();
    const options = {
      mode: 'managed' as const,
      appRevisionsDir: fixture.deploymentsDir,
      appVolumesDir: fixture.volumesDir,
      artifact: fsArtifact(fixture.artifactDir),
      evictionIntervalMs: 0,
    };
    const initial = createAppHost(options);
    const set = deploymentSet(1, fixture.artifact, { activation: 'eager' });
    await initial.management.applyDeploymentSet(set);
    await initial.close();
    await rm(path.join(fixture.artifactDir, fixture.artifact.key));
    const restored = createAppHost(options);
    hosts.push(restored);
    const discover = vi.spyOn(DeploymentCatalog.prototype, 'discoverAt');
    try {
      expect(
        (await restored.management.restoreDeploymentSet(set)).status
          .deployments[0]?.observedState,
      ).toBe('running');
      expect(discover).toHaveBeenCalledWith(
        fixture.artifact.appId,
        revisionDirectory(fixture.deploymentsDir, fixture.artifact),
        { fingerprint: fixture.artifact.checksum.toLowerCase() },
      );
    } finally {
      discover.mockRestore();
    }
    await restored.close();
    hosts.pop();
    await rm(revisionDirectory(fixture.deploymentsDir, fixture.artifact), {
      recursive: true,
    });
    const missing = createAppHost(options);
    hosts.push(missing);
    const result = await missing.management.restoreDeploymentSet(set);
    expect(result.status.deployments[0]).toMatchObject({
      observedState: 'failed',
      error: expect.stringContaining('Deploy the release again'),
    });
  });

  it('reports pending while startup is in progress and other Apps are queued', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const gate = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    const replace = host.registry.replaceDefinition.bind(host.registry);
    vi.spyOn(host.registry, 'replaceDefinition').mockImplementationOnce(
      async (...args) => {
        entered.resolve();
        await gate.promise;
        return replace(...args);
      },
    );
    const set = deploymentSet(1, artifact, { activation: 'eager' });
    set.deployments.push({
      ...set.deployments[0]!,
      id: 'second',
      appId: 'second',
      artifact: { ...artifact, appId: 'second' },
      basePath: '/second',
    });
    const pending = host.management.applyDeploymentSet(set);
    try {
      await Promise.race([entered.promise, pending]);
      const status = await host.management.getStatus();
      expect(status.deployments.map((item) => item.observedState)).toEqual([
        'pending',
        'pending',
      ]);
    } finally {
      gate.resolve();
      await pending;
    }
    expect(
      (await host.management.getStatus()).deployments.every(
        (item) => item.observedState === 'running',
      ),
    ).toBe(true);
  });

  it('resolves a local artifact and reconciles eager, idempotent, and stopped states', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);

    const firstDeploymentSet = deploymentSet(1, artifact, {
      activation: 'eager',
      config: { provider: 'file' },
    });
    const first = await host.management.applyDeploymentSet(firstDeploymentSet);
    expect(first.accepted).toBe(true);
    expect(first.status.deployments[0]).toMatchObject({
      appId: 'customer',
      observedState: 'running',
      revision: 1,
    });
    expect(host.registry.isActive('customer')).toBe(true);
    expect(host.registry.definition('customer')?.rootDir).toBe(
      revisionDirectory(deploymentsDir, artifact),
    );
    expect(host.registry.definition('customer')?.dataDir).toBe(
      path.join(volumesDir, 'customer', 'storage'),
    );
    const configPath = host.registry.definition('customer')?.configPath;
    expect(configPath).toBe(path.join(volumesDir, 'customer', 'config'));

    const repeated =
      await host.management.applyDeploymentSet(firstDeploymentSet);
    expect(repeated.accepted).toBe(false);
    expect(host.registry.snapshot('customer')?.version).toBe(1);

    const sharedConfigPath = path.join(volumesDir, 'shared', 'customer');
    const replaced = await host.management.applyDeploymentSet(
      deploymentSet(2, artifact, {
        activation: 'lazy',
        config: { provider: 'file', path: sharedConfigPath },
      }),
    );
    expect(replaced.status.deployments[0]).toMatchObject({
      observedState: 'running',
    });
    expect(host.registry.definition('customer')?.configPath).toBe(
      sharedConfigPath,
    );
    expect(host.registry.snapshot('customer')?.version).toBe(2);

    const stopped = await host.management.applyDeploymentSet(
      deploymentSet(3, artifact, { desiredState: 'stopped' }),
    );
    expect(stopped.status.deployments[0]?.observedState).toBe('stopped');
    expect(host.registry.has('customer')).toBe(false);
    await expect(host.registry.ensureActive('customer')).rejects.toThrow();
    expect(host.registry.isActive('customer')).toBe(false);

    const started = await host.management.startDeployment({
      ...firstDeploymentSet.deployments[0]!,
      desiredState: 'running',
    });
    expect(started.deployments[0]?.observedState).toBe('running');
    expect(host.registry.isActive('customer')).toBe(true);
    await host.management.stopDeployment('customer');
    expect(host.registry.has('customer')).toBe(false);
    await expect(host.registry.ensureActive('customer')).rejects.toThrow();
  });

  it('applies and removes one managed deployment without a complete set', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const deployment = deploymentSet(1, artifact, {
      activation: 'eager',
    }).deployments[0]!;

    const deployed = await host.management.applyDeployment(deployment);
    expect(deployed.deployments[0]).toMatchObject({
      appId: 'customer',
      observedState: 'running',
    });

    const removed = await host.management.removeDeployment('customer');
    expect(removed.deployments).toEqual([]);
    expect(host.registry.has('customer')).toBe(false);
  });

  it('reuses an installed artifact with the same release identity', async () => {
    const fixture = await createFixture();
    const { deploymentsDir, volumesDir, artifact, artifactDir } = fixture;
    const replacement = await createArtifact(fixture, '1.2.4');
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const deployment = deploymentSet(1, artifact).deployments[0]!;

    await host.management.applyDeployment(deployment);
    await host.management.applyDeployment(
      deploymentSet(1, replacement).deployments[0]!,
    );
    await rm(path.join(artifactDir, artifact.key));

    const repeated = await host.management.applyDeployment(deployment);
    expect(repeated.deployments[0]).toMatchObject({
      appId: 'customer',
      observedState: 'stopped',
      cacheHit: true,
    });
    expect(host.registry.definition('customer')?.rootDir).toBe(
      revisionDirectory(deploymentsDir, artifact),
    );
  });

  it('keeps immutable revisions and retains the three most recently used builds', async () => {
    const fixture = await createFixture();
    const { deploymentsDir, volumesDir, artifactDir } = fixture;
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const artifacts = [fixture.artifact];
    for (const version of ['1.2.4', '1.2.5', '1.2.6']) {
      artifacts.push(await createArtifact(fixture, version));
    }

    for (const artifact of artifacts) {
      await host.management.applyDeployment(
        deploymentSet(1, artifact).deployments[0]!,
      );
      expect(host.registry.definition('customer')?.rootDir).toBe(
        revisionDirectory(deploymentsDir, artifact),
      );
    }

    await vi.waitFor(
      async () => {
        expect(
          await revisionNames(deploymentsDir, fixture.artifact.appId),
        ).toHaveLength(3);
      },
      { timeout: 2_000 },
    );
    const retained = await revisionNames(
      deploymentsDir,
      fixture.artifact.appId,
    );
    expect(retained).not.toContain(fixture.artifact.checksum);
    expect(retained).toContain(artifacts.at(-1)?.checksum);

    const rollback = await host.management.applyDeployment(
      deploymentSet(1, fixture.artifact).deployments[0]!,
    );
    expect(rollback.deployments[0]?.observedState).toBe('stopped');
    expect(rollback.deployments[0]?.cacheHit).toBe(false);
    expect(host.registry.definition('customer')?.rootDir).toBe(
      revisionDirectory(deploymentsDir, fixture.artifact),
    );
  });

  it('rejects identity collisions in targeted deployment operations', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const deployment = deploymentSet(1, artifact).deployments[0]!;
    await host.management.applyDeployment(deployment);

    await expect(
      host.management.applyDeployment({
        ...deployment,
        appId: 'another-app',
        artifact: { ...deployment.artifact, appId: 'another-app' },
      }),
    ).rejects.toThrow('cannot change app ID');
    await expect(
      host.management.applyDeployment({
        ...deployment,
        id: 'another-deployment',
      }),
    ).rejects.toThrow('already managed by deployment');

    expect((await host.management.getStatus()).desiredRevision).toBe(1);
  });

  it('keeps the previous runtime when a new artifact cannot be resolved', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);

    await host.management.applyDeploymentSet(
      deploymentSet(1, artifact, { activation: 'eager' }),
    );
    const activeVersion = host.registry.snapshot('customer')?.version;
    const failed = await host.management.applyDeploymentSet(
      deploymentSet(2, artifact, {
        activation: 'eager',
        artifact: { ...artifact, version: '9.9.9' },
      }),
    );

    expect(failed.status.deployments[0]).toMatchObject({
      observedState: 'failed',
      revision: 2,
    });
    expect(failed.status.deployments[0]?.error).toContain('version mismatch');
    expect(host.registry.snapshot('customer')?.version).toBe(activeVersion);
  });

  it('removes deployments omitted from a newer complete deployment set', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await host.management.applyDeploymentSet(
      deploymentSet(1, artifact, { activation: 'eager' }),
    );

    const result = await host.management.applyDeploymentSet({
      revision: 2,
      deployments: [],
    });
    expect(result.status.deployments).toEqual([]);
    expect(host.registry.has('customer')).toBe(false);
  });

  it('registers lazy deployments without starting them', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    const result = await host.management.applyDeploymentSet(
      deploymentSet(1, artifact),
    );
    expect(result.status.deployments[0]?.observedState).toBe('stopped');
    expect(host.registry.has('customer')).toBe(true);
    expect(host.registry.isActive('customer')).toBe(false);
    expect(host.registry.definition('customer')?.configPath).toBeUndefined();
    await expect(host.management.restartApp('customer')).rejects.toThrow(
      'App "customer" is not running',
    );
  });

  it('restarts only a running deployment', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);

    await host.management.applyDeploymentSet(
      deploymentSet(1, artifact, { activation: 'eager' }),
    );
    const before = host.registry.snapshot('customer');
    const status = await host.management.restartApp('customer');
    const after = host.registry.snapshot('customer');

    expect(before).toBeDefined();
    expect(after).toBeDefined();
    expect(after?.version).toBeGreaterThan(before?.version ?? 0);
    expect(status.deployments[0]).toMatchObject({
      appId: 'customer',
      observedState: 'running',
    });
  });

  it('routes a managed deployment by its configured base path', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      host: '127.0.0.1',
      port: 0,
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await host.start();
    await host.management.applyDeploymentSet(
      deploymentSet(1, artifact, {
        activation: 'eager',
        basePath: '/workspace',
      }),
    );

    const address = host.server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('App host did not expose a TCP address');
    }
    const response = await fetch(
      `http://127.0.0.1:${address.port}/workspace/api/health`,
    );
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe('ok');
  });

  it('rejects changed payloads that reuse a revision', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await host.management.applyDeploymentSet(deploymentSet(1, artifact));
    await expect(
      host.management.applyDeploymentSet(
        deploymentSet(1, artifact, { activation: 'eager' }),
      ),
    ).rejects.toThrow('revision 1 cannot be changed');
  });

  it('rejects capabilities that are declared but not implemented', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);

    await expect(
      host.management.applyDeploymentSet(
        deploymentSet(1, artifact, {
          restartPolicy: 'always',
        } as Partial<HostDeploymentSet['deployments'][number]>),
      ),
    ).rejects.toThrow('Restart policy is not supported');
    await expect(
      host.management.applyDeploymentSet(
        deploymentSet(1, artifact, {
          backend: 'worker',
        } as unknown as Partial<HostDeploymentSet['deployments'][number]>),
      ),
    ).rejects.toThrow('backend "worker" is not supported');
    await expect(
      host.management.applyDeploymentSet(
        deploymentSet(1, artifact, {
          config: { provider: 'file', path: 'relative/config' },
        }),
      ),
    ).rejects.toThrow('Invalid file config');
    expect((await host.management.getStatus()).desiredRevision).toBe(0);
  });

  it('does not expose managed definitions on the application HTTP server', async () => {
    const { deploymentsDir, volumesDir, artifact, artifactDir } =
      await createFixture();
    const host = createAppHost({
      mode: 'managed',
      host: '127.0.0.1',
      port: 0,
      appRevisionsDir: deploymentsDir,
      appVolumesDir: volumesDir,
      artifact: fsArtifact(artifactDir),
      evictionIntervalMs: 0,
    });
    hosts.push(host);
    await host.start();

    const address = host.server.address();
    if (!address || typeof address !== 'object') {
      throw new Error('App host did not expose a TCP address');
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const appsResponse = await fetch(`${baseUrl}/__apps`);
    expect(appsResponse.status).toBe(404);
    const healthResponse = await fetch(`${baseUrl}/__health`);
    expect(healthResponse.status).toBe(503);
    expect(await healthResponse.json()).toEqual({ status: 'not-ready' });

    await host.management.applyDeploymentSet(deploymentSet(1, artifact));
    const readyResponse = await fetch(`${baseUrl}/__ready`);
    expect(readyResponse.status).toBe(200);
    expect(await readyResponse.json()).toEqual({ status: 'ready' });
  });
});

it('deploys a release artifact into immutable revisions in standalone mode', async () => {
  const { deploymentsDir, volumesDir, artifact, artifactDir } =
    await createFixture();
  const host = createAppHost({
    mode: 'standalone',
    host: '127.0.0.1',
    port: 0,
    appRevisionsDir: deploymentsDir,
    appVolumesDir: volumesDir,
    artifact: fsArtifact(artifactDir),
    evictionIntervalMs: 0,
  });
  hosts.push(host);
  await host.start();

  const address = host.server.address();
  if (!address || typeof address !== 'object') {
    throw new Error('App host did not expose a TCP address');
  }
  const response = await fetch(
    `http://127.0.0.1:${address.port}/__apps/customer/deploy`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ artifact }),
    },
  );

  expect(response.status).toBe(200);
  expect(host.registry.isActive('customer')).toBe(true);
  expect(host.registry.definition('customer')?.rootDir).toBe(
    revisionDirectory(deploymentsDir, artifact),
  );
  const catalog = new DeploymentCatalog({ deploymentsDir, volumesDir });
  expect((await catalog.discover())[0]?.rootDir).toBe(
    revisionDirectory(deploymentsDir, artifact),
  );
});

function deploymentSet(
  revision: number,
  artifact: ArtifactReference,
  overrides: Partial<HostDeploymentSet['deployments'][number]> = {},
): HostDeploymentSet {
  return {
    revision,
    deployments: [
      {
        id: 'customer',
        appId: 'customer',
        artifact,
        desiredState: 'running',
        backend: 'in-process',
        activation: 'lazy',
        ...overrides,
      },
    ],
  };
}

async function createFixture(): Promise<{
  deploymentsDir: string;
  volumesDir: string;
  artifactDir: string;
  appRoot: string;
  artifact: ArtifactReference;
}> {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-managed-'));
  tempDirs.push(rootDir);
  const deploymentsDir = path.join(rootDir, 'apps');
  const volumesDir = path.join(rootDir, 'app-volumes');
  const artifactDir = path.join(rootDir, 'artifacts');
  const sourceDir = path.join(rootDir, 'source');
  const appRoot = path.join(sourceDir, 'customer');
  await mkdir(path.join(appRoot, 'dist', 'server'), { recursive: true });
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer',
      version: '1.2.3',
      type: 'module',
    }),
  );
  await writeFile(
    path.join(appRoot, 'dist', 'server', 'embedded.js'),
    'export function createServer() { return { fetch() { return new Response("ok"); } }; }',
  );
  await writeFile(path.join(appRoot, 'config.yaml'), 'enabled: true\n');
  await mkdir(path.join(appRoot, 'storage'), { recursive: true });
  await writeFile(path.join(appRoot, 'storage', 'seed.txt'), 'seed\n');
  await mkdir(path.join(artifactDir, 'releases', 'customer'), {
    recursive: true,
  });
  const fixture = {
    deploymentsDir,
    volumesDir,
    artifactDir,
    appRoot,
    artifact: {} as ArtifactReference,
  };
  fixture.artifact = await createArtifact(fixture, '1.2.3');
  return fixture;
}

async function createArtifact(
  fixture: { artifactDir: string; appRoot: string },
  version: string,
): Promise<ArtifactReference> {
  await writeFile(
    path.join(fixture.appRoot, 'package.json'),
    JSON.stringify({
      name: '@example/customer',
      version,
      type: 'module',
    }),
  );
  const key = `releases/customer/${version}.tar.gz`;
  const archivePath = path.join(fixture.artifactDir, key);
  await createTar({ cwd: fixture.appRoot, file: archivePath, gzip: true }, [
    '.',
  ]);
  const checksum = createHash('sha256')
    .update(await readFile(archivePath))
    .digest('hex');
  return { key, appId: 'customer', version, checksum };
}

function revisionDirectory(
  deploymentsDir: string,
  artifact: ArtifactReference,
): string {
  return path.join(
    deploymentsDir,
    artifact.appId,
    artifact.checksum.toLowerCase(),
  );
}

async function revisionNames(
  deploymentsDir: string,
  appId: string,
): Promise<string[]> {
  return (
    await readdir(path.join(deploymentsDir, appId), {
      withFileTypes: true,
    })
  )
    .filter((entry) => entry.isDirectory() && /^[a-f0-9]{64}$/.test(entry.name))
    .map((entry) => entry.name);
}

function fsArtifact(location: string) {
  return { driver: 'fs' as const, location, visibility: 'private' as const };
}
