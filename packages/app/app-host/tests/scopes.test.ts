/**
 * Scopes on a managed Host, through the management service: sets that replace only their scope's Apps under their own
 * revision, Apps owned by one scope, deployments run once and recorded in an operation log that outlives the process,
 * draining before shutdown, an external-service backend under the registry (start-first replacement, the idle stop,
 * dormancy, removal, adoption after a restart, the Host forwarding requests), the
 * separation of in-process Apps from a backend holding credentials, and the IPC transport of the new calls.
 */
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  FileOperationLog,
  InProcessAppBackend,
  AppEventBus,
  IpcHostManagementClient,
  IpcHostManagementServer,
  createAppHost,
  type ActiveAppHandle,
  type AppDefinition,
  type AppHost,
  type HostDeploymentSpec,
  type HostScope,
  type ServiceBackend,
} from '../dist/index.js';

const tempDirs: string[] = [];
const hosts: AppHost[] = [];

afterEach(async () => {
  await Promise.all(hosts.splice(0).map((host) => host.close('test cleanup')));
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'host-scopes-'));
  tempDirs.push(dir);
  return dir;
}

const CHECKSUM = 'a'.repeat(64);

function serviceScope(id: string, config: Record<string, unknown> = {}) {
  return {
    id,
    backend: 'fake',
    backendConfig: config,
    secret: { token: `secret-${id}` },
  } satisfies HostScope;
}

function spec(
  appId: string,
  overrides: Partial<HostDeploymentSpec> = {},
): HostDeploymentSpec {
  return {
    id: appId,
    appId,
    operationId: `${appId}-d1`,
    artifact: {
      key: `releases/${appId}.tar.gz`,
      appId,
      version: '1.0.0',
      checksum: CHECKSUM,
    },
    desiredState: 'running',
    backend: 'external-service',
    activation: 'eager',
    ...overrides,
  };
}

interface FakeContainer {
  definition: AppDefinition;
  running: boolean;
}

/**
 * An external-service backend that keeps "containers" in memory: one per definition (by its deployment ID), started
 * on activation, stopped on an idle stop, removed when retired, made dormant or disposed. `fail-*` Apps never become
 * ready; `gate` holds an activation.
 */
function fakeService() {
  const state = {
    bound: new Map<string, { config: unknown; secret: unknown }>(),
    containers: new Map<string, FakeContainer>(),
    disposed: [] as { appId: string; purgeData: boolean }[],
    backups: [] as string[],
    detached: [] as string[],
    gate: null as Promise<void> | null,
  };
  const key = (definition: AppDefinition): string =>
    `${definition.id}@${String(definition.backendOptions?.deploymentId)}`;
  const handle = (definition: AppDefinition): ActiveAppHandle => {
    const controller = new AbortController();
    let current: ActiveAppHandle['state'] = 'active';
    const snapshot = () => ({
      id: definition.id,
      version: 1,
      basePath: definition.basePath,
      backend: definition.backend,
      configVersion: definition.configVersion,
      desiredVersion: definition.desiredVersion,
      codeVersion: definition.desiredVersion,
      isolation: definition.isolation,
      tier: definition.tier,
      state: current,
      endpoint: {
        kind: 'external-http' as const,
        url: `fake://${key(definition)}`,
      },
      activeRequests: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: null,
      lastError: null,
      disposerCount: 0,
    });
    return {
      id: definition.id,
      version: 1,
      basePath: definition.basePath,
      backend: definition.backend,
      signal: controller.signal,
      get state() {
        return current;
      },
      reloadConfig: () => Promise.resolve({ changedNamespaces: [] }),
      dispatch: () => Promise.resolve(new Response(key(definition))),
      acceptWebSocket: () => Promise.resolve(null as never),
      forward(_req: IncomingMessage, res: ServerResponse) {
        res.setHeader('x-container', key(definition));
        res.end(`served by ${key(definition)}`);
        return Promise.resolve();
      },
      destroy(options) {
        current = 'destroyed';
        controller.abort();
        const container = state.containers.get(key(definition));
        if (typeof options === 'object' && options.retire)
          state.containers.delete(key(definition));
        else if (container) container.running = false;
        return Promise.resolve();
      },
      detach() {
        state.detached.push(definition.id);
        return Promise.resolve();
      },
      snapshot,
    };
  };
  const backend: ServiceBackend = {
    kind: 'external-service',
    name: 'fake',
    loadsAppCode: false,
    replacement: 'start-first',
    capabilities: {
      onDemand: true,
      rollout: 'start-first',
      images: true,
      backup: true,
      logs: true,
      urlModes: ['path', 'subdomain'],
    },
    configSchema: { type: 'object' },
    secretSchema: { type: 'object' },
    validate(config) {
      if (config.bad) throw new Error('These settings cannot work.');
    },
    bindScope(scope) {
      state.bound.set(scope.scopeId, {
        config: scope.config,
        secret: scope.secret,
      });
      return Promise.resolve();
    },
    releaseScope(scopeId) {
      state.bound.delete(scopeId);
      return Promise.resolve();
    },
    check(scopeId) {
      return Promise.resolve({
        ok: true,
        details: { bound: state.bound.has(scopeId) },
      });
    },
    inspect(definition) {
      const container = state.containers.get(key(definition));
      return Promise.resolve(
        container ? (container.running ? 'running' : 'stopped') : 'absent',
      );
    },
    async activate({ definition }) {
      if (!state.bound.has(String(definition.backendOptions?.scope)))
        throw new Error('The scope is not bound.');
      if (state.gate) await state.gate;
      if (definition.id.startsWith('fail-'))
        throw new Error('The health check failed.');
      state.containers.set(key(definition), { definition, running: true });
      return handle(definition);
    },
    hibernate(definition) {
      state.containers.delete(key(definition));
      return Promise.resolve();
    },
    dispose(definition, options) {
      state.disposed.push({ appId: definition.id, ...options });
      for (const name of [...state.containers.keys()])
        if (name.startsWith(`${definition.id}@`)) state.containers.delete(name);
      return Promise.resolve();
    },
    logs: () =>
      Promise.resolve({
        entries: [{ msg: 'container log' }] as never,
        cursor: '',
        hasMore: false,
        available: true,
        reset: false,
      }),
    beforeDeploy(definition) {
      state.backups.push(definition.id);
      return Promise.resolve();
    },
  };
  return { backend, state };
}

async function serviceHost(
  backend: ServiceBackend,
  options: { operations?: FileOperationLog } = {},
): Promise<AppHost> {
  const dir = await tempDir();
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
    backends: [backend],
    evictionIntervalMs: 0,
    ...(options.operations ? { operations: options.operations } : {}),
  });
  hosts.push(host);
  return host;
}

describe('scopes', () => {
  it('describes its backends and checks settings without touching a running scope', async () => {
    const { backend, state } = fakeService();
    const host = await serviceHost(backend);
    expect(
      (await host.management.describeHost()).backends.map((item) => [
        item.name,
        item.kind,
      ]),
    ).toEqual([['fake', 'external-service']]);
    expect(
      await host.management.checkScope(serviceScope('staging')),
    ).toMatchObject({ ok: true, details: { bound: true } });
    expect(state.bound.size).toBe(0);
    expect(
      await host.management.checkScope(serviceScope('staging', { bad: true })),
    ).toEqual({
      ok: false,
      message: 'These settings cannot work.',
      details: { invalidSettings: true },
    });
    // This Host runs no App code itself.
    expect(await host.management.checkScope({ id: 'preview' })).toMatchObject({
      ok: false,
      message: 'This Host runs no in-process Apps',
    });
  });

  it('keeps each scope’s set and revision apart and an App in one scope', async () => {
    const { backend, state } = fakeService();
    const host = await serviceHost(backend);
    const { management } = host;
    const staging = {
      scope: serviceScope('staging'),
      revision: 1,
      deployments: [spec('a')],
    };
    expect(await management.restoreDeploymentSet(staging)).toMatchObject({
      accepted: true,
      revision: 1,
    });
    await management.restoreDeploymentSet({
      scope: serviceScope('production'),
      revision: 1,
      deployments: [spec('b')],
    });
    // Each scope reports its own Apps; the credentials reached the backend, never a definition.
    const status = await management.getStatus({ scope: 'staging' });
    expect(status.scope).toEqual({ id: 'staging', revision: 1 });
    expect(status.deployments).toMatchObject([
      {
        appId: 'a',
        scopeId: 'staging',
        operationId: 'a-d1',
        observedState: 'running',
      },
    ]);
    expect(state.bound.get('staging')).toEqual({
      config: {},
      secret: { token: 'secret-staging' },
    });
    expect(JSON.stringify(host.registry.definition('a'))).not.toContain(
      'secret',
    );

    // A repeat is not applied again; a stale set is ignored; a changed set under the same revision is refused.
    expect(await management.restoreDeploymentSet(staging)).toMatchObject({
      accepted: false,
      revision: 1,
    });
    await management.restoreDeploymentSet({ ...staging, revision: 3 });
    expect(
      await management.restoreDeploymentSet({
        ...staging,
        revision: 2,
        deployments: [],
      }),
    ).toMatchObject({ accepted: false, revision: 3 });
    await expect(
      management.restoreDeploymentSet({
        ...staging,
        revision: 3,
        deployments: [],
      }),
    ).rejects.toThrow('cannot be changed');

    // An App belongs to one scope on a Host.
    await expect(
      management.restoreDeploymentSet({
        scope: serviceScope('production'),
        revision: 2,
        deployments: [spec('b'), spec('a')],
      }),
    ).rejects.toMatchObject({ code: 'APP_OWNED_BY_OTHER_SCOPE' });

    // Dropping an App from its scope removes its service, leaves its data and frees it; the other scope is untouched.
    await management.restoreDeploymentSet({
      ...staging,
      revision: 4,
      deployments: [],
    });
    expect(state.disposed).toEqual([{ appId: 'a', purgeData: false }]);
    expect(
      (await management.getStatus({ scope: 'production' })).deployments,
    ).toMatchObject([{ appId: 'b', observedState: 'running' }]);
    await management.restoreDeploymentSet({
      scope: serviceScope('production'),
      revision: 2,
      deployments: [spec('b'), spec('a')],
    });

    // The scope's backend kind has to match its Apps', and the backend has to exist.
    await expect(
      management.restoreDeploymentSet({
        scope: serviceScope('qa'),
        revision: 1,
        deployments: [spec('c', { backend: 'in-process' })],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_SCOPE' });
    await expect(
      management.restoreDeploymentSet({
        scope: { id: 'qa', backend: 'docker' },
        revision: 1,
        deployments: [],
      }),
    ).rejects.toMatchObject({ code: 'BACKEND_UNAVAILABLE' });
  });

  it('runs a deployment once, records its outcome, backs up first and keeps the previous version on failure', async () => {
    const dir = await tempDir();
    const { backend, state } = fakeService();
    const host = await serviceHost(backend, {
      operations: new FileOperationLog(dir),
    });
    const { management } = host;
    const scope = serviceScope('staging');
    const logs: unknown[] = [];
    const first = await management.applyDeployment(
      { ...spec('a'), scope },
      (entry) => logs.push(entry),
    );
    expect(first.deployments).toMatchObject([
      { appId: 'a', observedState: 'running', operationId: 'a-d1' },
    ]);
    expect(logs.length).toBeGreaterThan(0);
    expect(state.backups).toEqual(['a']);
    await management.applyDeployment({ ...spec('a'), scope });
    expect(state.backups).toEqual(['a']);
    expect(await management.getOperation('a-d1', { scope })).toMatchObject({
      state: 'succeeded',
      scopeId: 'staging',
      appId: 'a',
      status: { observedState: 'running' },
    });
    expect(await management.getOperation('nothing', { scope })).toBeNull();

    // A deployment that never becomes ready fails, and the running version keeps serving.
    const failed = await management.applyDeployment({
      ...spec('fail-b'),
      scope,
    });
    expect(
      failed.deployments.find((item) => item.appId === 'fail-b'),
    ).toMatchObject({ observedState: 'failed' });
    expect(await management.getOperation('fail-b-d1', { scope })).toMatchObject(
      { state: 'failed', error: expect.stringContaining('health') },
    );

    // A new process reads what this one recorded, and marks what it left running interrupted.
    await new FileOperationLog(dir).put({
      operationId: 'left',
      scopeId: 'staging',
      appId: 'a',
      state: 'running',
      status: null,
      error: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    });
    const after = new FileOperationLog(dir);
    expect(await after.get('staging', 'a-d1')).toMatchObject({
      state: 'succeeded',
    });
    expect(await after.get('staging', 'left')).toMatchObject({
      state: 'interrupted',
      error: 'The App Host stopped before the operation finished.',
    });
  });

  it('switches start-first: the running version serves until the new one is ready', async () => {
    const { backend, state } = fakeService();
    const host = await serviceHost(backend);
    await host.start();
    const { management } = host;
    const scope = serviceScope('staging');
    await management.applyDeployment({ ...spec('a'), scope });
    const url = `http://127.0.0.1:${(host.server.address() as { port: number }).port}`;
    expect(await (await fetch(`${url}/a/anything`)).text()).toBe(
      'served by a@a-d1',
    );

    let release!: () => void;
    state.gate = new Promise((resolve) => {
      release = resolve;
    });
    const deploying = management.applyDeployment({
      ...spec('a', { operationId: 'a-d2' }),
      scope,
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    // Requests during the deployment reach the running version, without waiting for it.
    const during = await fetch(`${url}/a/assets/x.js`);
    expect(await during.text()).toBe('served by a@a-d1');
    release();
    await deploying;
    state.gate = null;
    expect(await (await fetch(`${url}/a/`)).text()).toBe('served by a@a-d2');
    // The replaced container was retired; the new one runs.
    expect([...state.containers.keys()]).toEqual(['a@a-d2']);

    // An idle stop stops the container and keeps it; the next request starts it again.
    await host.registry.evict('a');
    expect(state.containers.get('a@a-d2')?.running).toBe(false);
    expect(
      (await management.getStatus({ scope: 'staging' })).deployments[0],
    ).toMatchObject({ observedState: 'stopped' });
    expect(await (await fetch(`${url}/a/`)).text()).toBe('served by a@a-d2');

    // Its log comes from the backend.
    expect(
      (await management.readAppLogs('a', { fromStart: true })).entries,
    ).toEqual([{ msg: 'container log' }]);

    // Removing the App with its data disposes of everything.
    await management.removeDeployment('a', { purgeData: true });
    expect(state.disposed).toEqual([{ appId: 'a', purgeData: true }]);
    expect(state.containers.size).toBe(0);
  });

  it('answers on its own host name, makes idle Apps dormant and adopts running services after a restart', async () => {
    const { backend, state } = fakeService();
    const host = await serviceHost(backend);
    await host.start();
    const scope = serviceScope('preview');
    await host.management.restoreDeploymentSet({
      scope,
      revision: 1,
      deployments: [
        spec('site', { hostname: 'site.apps.example.com' }),
        spec('nap', { activation: 'lazy', dormantAfterMs: 1 }),
      ],
    });
    const port = (host.server.address() as { port: number }).port;
    // Fetch does not let a caller set `Host`; a plain request does.
    const body = await new Promise<string>((resolve, reject) => {
      http
        .get(
          {
            host: '127.0.0.1',
            port,
            path: '/any/path',
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
    expect(body).toBe('served by site@site-d1');
    expect(host.registry.definition('site')?.backendOptions).toMatchObject({
      scope: 'preview',
      routing: 'subdomain',
      release: { checksum: CHECKSUM },
    });

    await host.registry.sweep(Date.now() + 1000);
    expect(host.registry.isDormant('nap')).toBe(true);
    expect(
      (await host.management.getStatus({ scope: 'preview', appIds: ['nap'] }))
        .deployments[0]?.lifecycle,
    ).toMatchObject({ state: 'dormant' });

    // Shutting down leaves the services running for the next Host, which adopts them.
    await host.close('restart');
    expect(state.detached).toEqual(['site']);
    expect(state.containers.get('site@site-d1')?.running).toBe(true);
    const next = await serviceHost(backend);
    await next.management.restoreDeploymentSet({
      scope,
      revision: 1,
      deployments: [
        spec('site', { activation: 'lazy', hostname: 'site.apps.example.com' }),
        spec('nap', { activation: 'lazy', dormantAfterMs: 1 }),
      ],
    });
    expect(next.registry.isActive('site')).toBe(true);
    expect(next.registry.isDormant('nap')).toBe(true);
  });

  it('drains deployments under way and then refuses changes', async () => {
    const { backend, state } = fakeService();
    const host = await serviceHost(backend);
    let release!: () => void;
    state.gate = new Promise((resolve) => {
      release = resolve;
    });
    const scope = serviceScope('staging');
    const pending = host.management.applyDeployment({ ...spec('a'), scope });
    await new Promise((resolve) => setTimeout(resolve, 10));
    let drained = false;
    const manager = host.management as unknown as {
      drain(ms: number): Promise<void>;
    };
    const draining = manager.drain(5_000).then(() => {
      drained = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(drained).toBe(false);
    release();
    await draining;
    expect((await pending).deployments[0]).toMatchObject({
      observedState: 'running',
    });
    await expect(
      host.management.restoreDeploymentSet({
        scope,
        revision: 1,
        deployments: [],
      }),
    ).rejects.toMatchObject({ code: 'HOST_DRAINING' });
    // Reads keep working.
    expect(
      (await host.management.getStatus({ scope: 'staging' })).deployments,
    ).toHaveLength(1);
  });

  it('waits for a previous owner that is still running before taking the log over', async () => {
    const dir = await tempDir();
    const previous = spawn(process.execPath, [
      '-e',
      'setTimeout(() => {}, 800)',
    ]);
    await new Promise((resolve) => previous.once('spawn', resolve));
    await writeFile(
      path.join(dir, 'owner.json'),
      JSON.stringify({
        pid: previous.pid,
        bootId: 'previous',
        startedAt: new Date().toISOString(),
        hostname: os.hostname(),
      }),
    );
    const started = Date.now();
    await new FileOperationLog(dir, { pollMs: 20 }).open();
    expect(Date.now() - started).toBeGreaterThanOrEqual(500);
    expect(previous.exitCode).toBe(0);
    // A lease from another machine or container is not waited for.
    await writeFile(
      path.join(dir, 'owner.json'),
      JSON.stringify({
        pid: process.ppid,
        bootId: 'elsewhere',
        startedAt: new Date().toISOString(),
        hostname: 'another-container',
      }),
    );
    const quick = Date.now();
    await new FileOperationLog(dir, { pollMs: 20 }).open();
    expect(Date.now() - quick).toBeLessThan(500);
    expect(
      JSON.parse(await readFile(path.join(dir, 'owner.json'), 'utf8')),
    ).toMatchObject({ hostname: os.hostname() });
  });
});

describe('backend separation', () => {
  it('refuses in-process Apps beside a backend holding credentials unless they are trusted', async () => {
    const { backend } = fakeService();
    const events = new AppEventBus();
    expect(() =>
      createAppHost({
        mode: 'managed',
        backends: [new InProcessAppBackend(events), backend],
      }),
    ).toThrow('holds platform credentials');
    const trusted = createAppHost({
      mode: 'managed',
      backends: [new InProcessAppBackend(events), backend],
      trustedApps: true,
      appRevisionsDir: path.join(await tempDir(), 'revisions'),
      evictionIntervalMs: 0,
    });
    hosts.push(trusted);
    expect(
      (await trusted.management.describeHost()).backends.map(
        (item) => item.name,
      ),
    ).toEqual(['in-process', 'fake']);
  });
});

describe('management over IPC', () => {
  it('relays the scoped calls, streams deployment logs and keeps error codes', async () => {
    const child = new EventEmitter() as ChildProcess;
    Object.defineProperty(child, 'connected', { value: true });
    child.send = ((
      message: unknown,
      callback: (error: Error | null) => void,
    ) => {
      process.emit('message', message as never, undefined);
      callback(null);
      return true;
    }) as ChildProcess['send'];
    const originalSend = Object.getOwnPropertyDescriptor(process, 'send');
    Object.defineProperty(process, 'send', {
      configurable: true,
      value: (message: unknown) => child.emit('message', message),
    });
    const { backend } = fakeService();
    const host = await serviceHost(backend);
    const server = new IpcHostManagementServer(host.management, 'test');
    const client = new IpcHostManagementClient(child, { session: 'test' });
    try {
      server.attach();
      expect((await client.describeHost()).backends[0]?.name).toBe('fake');
      expect(await client.checkScope(serviceScope('staging'))).toMatchObject({
        ok: true,
      });
      const scope = serviceScope('staging');
      const logs: unknown[] = [];
      const status = await client.applyDeployment(
        { ...spec('b'), scope },
        (entry) => logs.push(entry),
      );
      expect(status.deployments[0]).toMatchObject({ appId: 'b' });
      expect(logs.length).toBeGreaterThan(0);
      expect(
        (await client.getStatus({ scope: 'staging', appIds: ['b'] }))
          .deployments,
      ).toHaveLength(1);
      expect(await client.getOperation('b-d1', { scope })).toMatchObject({
        state: 'succeeded',
      });
      expect(
        (await client.readAppLogs('b', { fromStart: true })).entries,
      ).toHaveLength(1);
      await expect(
        client.restoreDeploymentSet({
          scope: serviceScope('other'),
          revision: 1,
          deployments: [spec('b')],
        }),
      ).rejects.toMatchObject({ code: 'APP_OWNED_BY_OTHER_SCOPE' });
      await client.removeDeployment('b', { purgeData: false });
      expect(child.listenerCount('message')).toBe(0);
    } finally {
      server.close();
      if (originalSend) Object.defineProperty(process, 'send', originalSend);
      else Reflect.deleteProperty(process, 'send');
    }
  });
});
