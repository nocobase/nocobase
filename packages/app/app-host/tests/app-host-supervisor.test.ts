/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { c as createTar } from 'tar';
import type { ArtifactReference } from '../dist/index.js';
import {
  findAvailablePort,
  sanitizeAppHostChildNodeOptions,
} from '../dist/supervisor.js';
import { AppHostSupervisor } from '../dist/supervisor.js';
import {
  AppHostSupervisor as SourceAppHostSupervisor,
  appHostChildForcesColor,
} from '../src/supervisor.ts';

describe('AppHostSupervisor', () => {
  it('uses explicit options instead of ambient supervisor configuration', async () => {
    vi.stubEnv('APP_HOST_ENABLED', 'false');
    vi.stubEnv('APP_HOST_MODE', 'invalid');
    vi.stubEnv('APP_HOST_URL', 'http://ambient.invalid');
    vi.stubEnv('APP_HOST_DRIVER', 'tsx');
    vi.stubEnv('APP_REVISIONS_DIR', '/ambient/deployments');
    try {
      const supervisor = AppHostSupervisor.initialize({ mode: 'managed' });
      try {
        expect(supervisor.getInfo()).toMatchObject({
          mode: 'managed',
          driver: 'node',
          status: 'stopped',
          targetUrl: undefined,
          appRevisionsDir: undefined,
        });
      } finally {
        await supervisor.shutdown();
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('removes preserve symlink flags from app-host child NODE_OPTIONS', () => {
    expect(
      sanitizeAppHostChildNodeOptions(
        '--preserve-symlinks --max_old_space_size=4096 --preserve-symlinks-main=true',
      ),
    ).toBe('--max_old_space_size=4096');
  });

  it('removes empty NODE_OPTIONS when only preserve symlink flags are present', () => {
    expect(
      sanitizeAppHostChildNodeOptions(
        '--preserve-symlinks --preserve-symlinks-main',
      ),
    ).toBe('');
  });

  it('tells a managed child about terminal color only when nothing else states an intent', () => {
    expect(appHostChildForcesColor({}, true)).toBe(true);
    expect(appHostChildForcesColor({}, false)).toBe(false);
    expect(appHostChildForcesColor({}, undefined)).toBe(false);
    expect(appHostChildForcesColor({ FORCE_COLOR: '1' }, false)).toBe(false);
    expect(appHostChildForcesColor({ FORCE_COLOR: '0' }, true)).toBe(false);
    expect(appHostChildForcesColor({ NO_COLOR: '1' }, true)).toBe(false);
  });

  it('stops port probing at the requested upper bound', async () => {
    vi.spyOn(net, 'createServer').mockImplementation(() => {
      const server = new EventEmitter() as net.Server;
      server.listen = (() => {
        const error = Object.assign(new Error('occupied'), {
          code: 'EADDRINUSE',
        });
        queueMicrotask(() => server.emit('error', error));
        return server;
      }) as net.Server['listen'];
      return server;
    });

    await expect(findAvailablePort(65_535, '127.0.0.1')).rejects.toThrow(
      'No available app-host port found from 65535 through 65535',
    );
  });

  it('does not treat port binding errors as occupied ports', async () => {
    const error = Object.assign(new Error('permission denied'), {
      code: 'EPERM',
    });
    vi.spyOn(net, 'createServer').mockImplementation(() => {
      const server = new EventEmitter() as net.Server;
      server.listen = (() => {
        queueMicrotask(() => server.emit('error', error));
        return server;
      }) as net.Server['listen'];
      return server;
    });

    await expect(findAvailablePort(13_010, '127.0.0.1')).rejects.toBe(error);
  });

  it('does not probe beyond the TCP port range', async () => {
    await expect(findAvailablePort(65_536, '127.0.0.1')).rejects.toThrow(
      'Invalid app-host port range start: 65536',
    );
  });

  it('uses an explicit singleton lifecycle', async () => {
    expect(() => AppHostSupervisor.getInstance()).toThrow(
      'AppHostSupervisor is not initialized',
    );

    const supervisor = AppHostSupervisor.initialize({ enabled: false });
    expect(AppHostSupervisor.getInstance()).toBe(supervisor);
    expect(() => AppHostSupervisor.initialize({ enabled: false })).toThrow(
      'AppHostSupervisor is already initialized',
    );

    await supervisor.shutdown();
    expect(() => AppHostSupervisor.getInstance()).toThrow(
      'AppHostSupervisor is not initialized',
    );
  });

  it('shares instance shutdown and allows initialization after cleanup', async () => {
    const sigintListeners = process.listenerCount('SIGINT');
    const sigtermListeners = process.listenerCount('SIGTERM');
    const supervisor = AppHostSupervisor.initialize({ enabled: false });
    const stopped = Promise.withResolvers<void>();
    const stop = vi.spyOn(supervisor, 'stop').mockReturnValue(stopped.promise);
    const shutdown = supervisor.shutdown();
    expect(supervisor.shutdown()).toBe(shutdown);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(() => AppHostSupervisor.initialize()).toThrow('already initialized');
    stopped.resolve();
    await shutdown;
    expect(process.listenerCount('SIGINT')).toBe(sigintListeners);
    expect(process.listenerCount('SIGTERM')).toBe(sigtermListeners);
    await expect(supervisor.ensureStarted()).rejects.toThrow('is shut down');

    const next = AppHostSupervisor.initialize({ enabled: false });
    await supervisor.shutdown();
    expect(AppHostSupervisor.getInstance()).toBe(next);
    await next.shutdown();
    stop.mockRestore();
  });

  it('auto-selects the source launcher and manages a host through authenticated IPC', async () => {
    const volumesDir = await mkdtemp(path.join(os.tmpdir(), 'app-host-data-'));
    const fixture = await createManagedFixture(volumesDir);
    const supervisor = SourceAppHostSupervisor.initialize({
      mode: 'managed',
      driver: 'auto',
      appRevisionsDir: fixture.appRevisionsDir,
      appVolumesDir: fixture.appVolumesDir,
      configPath: fixture.configPath,
      startTimeoutMs: 10_000,
    });
    try {
      expect(supervisor.getInfo().driver).toBe('tsx');
      await supervisor.ensureStarted();

      const deployment = {
        id: 'demo',
        appId: 'demo',
        artifact: fixture.artifact,
        desiredState: 'running' as const,
        backend: 'in-process' as const,
        activation: 'eager' as const,
      };
      const result = await supervisor.applyDeploymentSet({
        revision: 1,
        deployments: [deployment],
      });
      expect(result.status.deployments[0]).toMatchObject({
        appId: 'demo',
        observedState: 'running',
      });

      const stopped = await supervisor.stopDeployment('demo');
      expect(stopped.deployments[0]?.observedState).toBe('stopped');
      const started = await supervisor.startDeployment(deployment);
      expect(started.deployments[0]?.observedState).toBe('running');

      supervisor.onReady(() => {
        void supervisor.restoreDeploymentSet({
          revision: 3,
          deployments: [deployment],
        });
      });
      await supervisor.restart('test restart');
      await vi.waitFor(
        async () => {
          const recovered = await (
            await supervisor.getManagementClient()
          ).getStatus();
          expect(recovered).toMatchObject({
            ready: true,
            desiredRevision: 3,
            reconciledRevision: 3,
            // The Host child reports its own runtime across the management IPC.
            runtime: {
              platform: process.platform,
              arch: process.arch,
              nodeAbi: Number(process.versions.modules),
              nodeMajor: Number(process.versions.node.split('.')[0]),
            },
          });
          expect(recovered.deployments[0]).toMatchObject({
            appId: 'demo',
            observedState: 'running',
          });
        },
        { timeout: 10_000, interval: 50 },
      );

      const removed = await supervisor.removeDeployment('demo');
      expect(removed.deployments).toEqual([]);
    } finally {
      await supervisor.shutdown();
      await rm(volumesDir, { recursive: true, force: true });
    }
  });

  it('auto-starts a compiled package without source files in development', async () => {
    const rootDir = await mkdtemp(
      path.join(os.tmpdir(), 'app-host-installed-'),
    );
    const packageDir = path.join(rootDir, 'package');
    await cp(
      fileURLToPath(new URL('../dist', import.meta.url)),
      path.join(packageDir, 'dist'),
      { recursive: true },
    );
    await writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    await symlink(
      fileURLToPath(new URL('../node_modules', import.meta.url)),
      path.join(packageDir, 'node_modules'),
      'dir',
    );
    const { AppHostSupervisor: InstalledSupervisor } = (await import(
      pathToFileURL(path.join(packageDir, 'dist/supervisor.js')).href
    )) as typeof import('../dist/supervisor.js');
    const fixture = await createManagedFixture(rootDir);
    vi.stubEnv('NODE_ENV', 'development');
    // Only app-host is copied as a compiled package here. Its dependencies
    // still resolve workspace TypeScript exports, which need this loader.
    // app-host itself has no source CLI to fall back to.
    vi.stubEnv(
      'NODE_OPTIONS',
      `${process.env.NODE_OPTIONS ?? ''} --import ${pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href}`.trim(),
    );
    const supervisor = InstalledSupervisor.initialize({
      mode: 'managed',
      driver: 'auto',
      appRevisionsDir: fixture.appRevisionsDir,
      appVolumesDir: fixture.appVolumesDir,
      configPath: fixture.configPath,
      startTimeoutMs: 10_000,
    });
    try {
      expect(supervisor.getInfo().driver).toBe('node');
      await supervisor.ensureStarted();
      expect(supervisor.getInfo()).toMatchObject({
        status: 'ready',
        entrypoint: await realpath(path.join(packageDir, 'dist/cli.js')),
      });
      const { status } = await supervisor.applyDeploymentSet({
        revision: 1,
        deployments: [],
      });
      expect(status.ready).toBe(true);
    } finally {
      await supervisor.shutdown();
      vi.unstubAllEnvs();
      await rm(rootDir, { recursive: true, force: true });
    }
  });

  it('notifies the controller after a crash so it can restore its deployment set', async () => {
    const volumesDir = await mkdtemp(path.join(os.tmpdir(), 'app-host-data-'));
    const fixture = await createManagedFixture(volumesDir);
    const supervisor = AppHostSupervisor.initialize({
      mode: 'managed',
      driver: 'tsx',
      appRevisionsDir: fixture.appRevisionsDir,
      appVolumesDir: fixture.appVolumesDir,
      configPath: fixture.configPath,
      startTimeoutMs: 10_000,
      automaticRestartBaseDelayMs: 10,
      maxAutomaticRestarts: 3,
    });
    try {
      await supervisor.applyDeploymentSet({
        revision: 1,
        deployments: [
          {
            id: 'demo',
            appId: 'demo',
            artifact: fixture.artifact,
            desiredState: 'running',
            backend: 'in-process',
            activation: 'eager',
          },
        ],
      });
      const previousPid = supervisor.getInfo().pid;
      supervisor.onReady(() => {
        void supervisor.restoreDeploymentSet({
          revision: 1,
          deployments: [
            {
              id: 'demo',
              appId: 'demo',
              artifact: fixture.artifact,
              desiredState: 'running',
              backend: 'in-process',
              activation: 'eager',
            },
          ],
        });
      });
      await rm(path.join(volumesDir, 'app-artifacts', fixture.artifact.key));
      if (!previousPid) {
        throw new Error('Managed app-host has no process ID');
      }
      process.kill(previousPid, 'SIGKILL');

      await waitUntil(
        () =>
          supervisor.getStatus() === 'ready' &&
          supervisor.getInfo().pid !== previousPid,
        10_000,
      );
      await vi.waitFor(
        async () => {
          const recovered = await (
            await supervisor.getManagementClient()
          ).getStatus();
          expect(recovered).toMatchObject({
            ready: true,
            desiredRevision: 1,
            reconciledRevision: 1,
            deployments: [
              expect.objectContaining({ observedState: 'running' }),
            ],
          });
        },
        { timeout: 10_000 },
      );
    } finally {
      await supervisor.shutdown();
      await rm(volumesDir, { recursive: true, force: true });
    }
  });
});

async function createManagedFixture(rootDir: string): Promise<{
  appRevisionsDir: string;
  appVolumesDir: string;
  configPath: string;
  artifact: ArtifactReference;
}> {
  const sourceDir = fileURLToPath(
    new URL('../fixtures/app-dist/demo', import.meta.url),
  );
  const artifactDir = path.join(rootDir, 'app-artifacts');
  const appRevisionsDir = path.join(rootDir, 'app-deployments');
  const appVolumesDir = path.join(rootDir, 'app-volumes');
  const key = 'releases/demo/0.0.1.tar.gz';
  const archivePath = path.join(artifactDir, key);
  await mkdir(path.dirname(archivePath), { recursive: true });
  await createTar({ cwd: sourceDir, file: archivePath, gzip: true }, ['.']);
  const checksum = createHash('sha256')
    .update(await readFile(archivePath))
    .digest('hex');
  const configPath = path.join(rootDir, 'host.json');
  await writeFile(
    configPath,
    JSON.stringify({
      host: {
        mode: 'managed',
        server: { host: '127.0.0.1', port: 13010 },
        artifact: {
          driver: 'fs',
          location: artifactDir,
          visibility: 'private',
        },
        appRevisionsDir,
        appVolumesDir,
        // The child host inherits this package as its working directory, so
        // the default log directory would land in the package tree.
        logging: { file: { directory: path.join(rootDir, 'host-logs') } },
      },
    }),
  );
  return {
    appRevisionsDir,
    appVolumesDir,
    configPath,
    artifact: { key, appId: 'demo', version: '0.0.1', checksum },
  };
}

async function waitUntil(
  predicate: () => boolean,
  timeoutMs: number,
): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error(`Condition was not met within ${timeoutMs}ms`);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 25));
  }
}
