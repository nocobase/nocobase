// @vitest-environment node
/**
 * The Host driver against fake Host management services: how an App's runtime policy becomes the Host's deployment
 * spec (a deployment always starts the App; a restore leaves an on-demand App stopped), how environments stay apart as
 * scopes on one Host, how the Host's lifecycle reaches the observed status, how a recorded outcome is read back, which
 * settings an environment may hold and which Host each run mode reaches (credentials only to the Docker Host), and how
 * idle stops and dormancies count towards `restartAfterChurn` without cutting off an on-demand App someone is using.
 */
import { Readable } from 'node:stream';

import type {
  HostDeploymentSet,
  HostDeploymentSpec,
  HostManagementService,
  HostOperation,
  HostScope,
  HostStatus,
} from '@nocobase/app-host/management';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createHostDriver,
  type HostEndpointOptions,
} from '../server/drivers/host/driver.js';
import type {
  AppDeploymentSpec,
  DriverEnvironment,
} from '../server/drivers/types.js';

const CHECKSUM = 'a'.repeat(64);

function appSpec(
  appId: string,
  overrides: Partial<AppDeploymentSpec> = {},
): AppDeploymentSpec {
  return {
    deploymentId: `${appId}-d1`,
    appId,
    kind: 'deploy',
    release: { id: 'r1', version: '1.0.0', checksum: CHECKSUM },
    artifact: {
      key: `releases/${appId}.tar.gz`,
      checksum: CHECKSUM,
      version: '1.0.0',
      size: 1,
      open: () => Promise.resolve(Readable.from([])),
    },
    config: { mode: 'external' },
    desiredState: 'running',
    activation: 'eager',
    idleStopMinutes: null,
    dormantAfterHours: null,
    ...overrides,
  };
}

type Lifecycle = 'running' | 'starting' | 'stopped' | 'dormant';

/** A Host's management service as the driver sees it: it records what it is sent and reports what a test sets. */
interface FakeHost {
  readonly endpoint: HostEndpointOptions;
  readonly applied: HostDeploymentSpec[];
  readonly restored: HostDeploymentSet[];
  readonly checked: HostScope[];
  readonly restarts: string[];
  /** Lifecycle states reported per App; Apps without one report running. */
  readonly lifecycle: Map<string, Lifecycle>;
  counters: NonNullable<HostStatus['counters']>;
  /** When set, the next deployment fails with it while the previous runtime keeps serving (a start-first switch). */
  failure: string | null;
  /** What `checkScope` answers. */
  check: { ok: boolean; message?: string; details?: Record<string, unknown> };
}

function fakeHost(restartAfterChurn?: number): FakeHost {
  /** Each scope's Apps and revision; a restart forgets them, as a new child would. */
  let scopes = new Map<
    string,
    { revision: number; apps: Map<string, HostDeploymentSpec> }
  >();
  const operations = new Map<string, HostOperation>();
  const scopeOf = (id: string) => {
    let scope = scopes.get(id);
    if (!scope) {
      scope = { revision: 0, apps: new Map() };
      scopes.set(id, scope);
    }
    return scope;
  };
  const deploymentOf = (scopeId: string, spec: HostDeploymentSpec) => {
    const state = host.lifecycle.get(spec.appId) ?? 'running';
    return {
      id: spec.id,
      appId: spec.appId,
      desiredState: spec.desiredState,
      observedState:
        state === 'running' ? ('running' as const) : ('stopped' as const),
      revision: scopes.get(scopeId)?.revision ?? 0,
      cacheHit: true,
      scopeId,
      ...(spec.operationId ? { operationId: spec.operationId } : {}),
      version: spec.artifact.version,
      app:
        state === 'running'
          ? ({
              state: 'active',
              desiredVersion: spec.artifact.version,
              createdAt: '2026-10-02T00:00:00.000Z',
              lastError: null,
            } as never)
          : null,
      error: null,
      lifecycle: {
        state,
        lastAccessedAt: '2026-10-02T01:00:00.000Z',
        lastFailure: null,
      },
    };
  };
  const status = (
    query: { scope?: string; appIds?: string[] } = {},
  ): HostStatus => {
    const ids = query.scope ? [query.scope] : [...scopes.keys()];
    const bound = query.scope ? scopes.get(query.scope) : undefined;
    return {
      mode: 'managed',
      ready: true,
      desiredRevision: 1,
      reconciledRevision: 1,
      deployments: ids.flatMap((id) =>
        [...(scopes.get(id)?.apps.values() ?? [])]
          .filter((spec) => !query.appIds || query.appIds.includes(spec.appId))
          .map((spec) => deploymentOf(id, spec)),
      ),
      counters: host.counters,
      ...(query.scope && bound && bound.revision > 0
        ? { scope: { id: query.scope, revision: bound.revision } }
        : {}),
    };
  };
  const management = {
    getStatus: (query) => Promise.resolve(status(query)),
    restoreDeploymentSet(set: HostDeploymentSet) {
      host.restored.push(set);
      const scope = scopeOf(set.scope!.id);
      if (set.revision <= scope.revision)
        return Promise.resolve({
          accepted: false,
          status: status({ scope: set.scope!.id }),
          revision: scope.revision,
        });
      scope.revision = set.revision;
      scope.apps.clear();
      for (const spec of set.deployments) scope.apps.set(spec.appId, spec);
      return Promise.resolve({
        accepted: true,
        status: status({ scope: set.scope!.id }),
        revision: scope.revision,
      });
    },
    applyDeployment(spec: HostDeploymentSpec) {
      host.applied.push(spec);
      const scopeId = spec.scope!.id;
      if (host.failure) {
        const error = host.failure;
        host.failure = null;
        const result = status({ scope: scopeId, appIds: [spec.appId] });
        return Promise.resolve({
          ...result,
          deployments: result.deployments.map((item) => ({
            ...item,
            observedState: 'failed' as const,
            error,
          })),
        });
      }
      scopeOf(scopeId).apps.set(spec.appId, spec);
      const result = status({ scope: scopeId });
      operations.set(spec.operationId!, {
        operationId: spec.operationId!,
        scopeId,
        appId: spec.appId,
        state: 'succeeded',
        status: result.deployments.find((item) => item.appId === spec.appId)!,
        error: null,
        startedAt: '2026-10-02T00:00:00.000Z',
        finishedAt: '2026-10-02T00:00:01.000Z',
      });
      return Promise.resolve(result);
    },
    startDeployment(spec: HostDeploymentSpec) {
      scopeOf(spec.scope!.id).apps.set(spec.appId, spec);
      return Promise.resolve(status());
    },
    stopDeployment: () => Promise.resolve(status()),
    removeDeployment(appId: string) {
      for (const scope of scopes.values()) scope.apps.delete(appId);
      return Promise.resolve(status());
    },
    restartApp: () => Promise.resolve(status()),
    publishAppConfig: () => Promise.resolve(null),
    reloadAppConfig: () => Promise.resolve(null),
    applyDeploymentSet: () => Promise.reject(new Error('unused')),
    getOperation(operationId, options) {
      const found = operations.get(operationId);
      return Promise.resolve(
        found && found.scopeId === options?.scope?.id ? found : null,
      );
    },
    describeHost: () => Promise.reject(new Error('unused')),
    checkScope(scope: HostScope) {
      host.checked.push(scope);
      return Promise.resolve(host.check);
    },
    readAppLogs: () => Promise.resolve({ entries: [] } as never),
  } satisfies HostManagementService;
  const host: FakeHost = {
    applied: [],
    restored: [],
    checked: [],
    restarts: [],
    lifecycle: new Map(),
    counters: {
      activations: 0,
      idleStops: 0,
      dormancies: 0,
      materializations: 0,
    },
    failure: null,
    check: { ok: true },
    endpoint: {
      restartAfterChurn,
      controller: {
        getInfo: () => ({ status: 'ready', targetUrl: 'http://127.0.0.1:1/' }),
        onReady: () => () => undefined,
        ensureStarted: () => Promise.resolve(new URL('http://127.0.0.1:1/')),
        getManagementClient: () => Promise.resolve(management),
        restart: (reason) => {
          host.restarts.push(reason ?? '');
          // A new child knows no scope yet.
          scopes = new Map();
          return Promise.resolve(new URL('http://127.0.0.1:1/'));
        },
      },
    },
  };
  return host;
}

const IN_PROCESS = { backend: 'in-process' };

function environment(
  id: string,
  config: Record<string, unknown> = IN_PROCESS,
  secret: Record<string, unknown> | null = null,
  publicUrl: string | null = null,
): DriverEnvironment {
  return { id, name: id, config, secret, publicUrl };
}

describe('Host driver', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const driverFor = (host: FakeHost, docker?: FakeHost) =>
    createHostDriver({
      hosts: {
        'in-process': host.endpoint,
        ...(docker ? { docker: docker.endpoint } : {}),
      },
      churnCheckIntervalMs: 60_000,
    });

  const open = (
    driver: ReturnType<typeof driverFor>,
    desired:
      readonly AppDeploymentSpec[] | (() => readonly AppDeploymentSpec[]),
    id = 'preview',
  ) =>
    driver.open(environment(id), {
      desired: () =>
        Promise.resolve(typeof desired === 'function' ? desired() : desired),
    });
  it('starts an App on deployment and leaves an on-demand one stopped on restore', async () => {
    const host = fakeHost();
    const preview = appSpec('fg-1--app', {
      activation: 'onDemand',
      idleStopMinutes: 10,
      dormantAfterHours: 24,
    });
    const session = await open(driverFor(host), [preview, appSpec('site')]);
    const applied = await session.apply(preview);
    expect(applied).toMatchObject({ state: 'running', version: '1.0.0' });
    expect(host.applied.at(-1)).toMatchObject({
      appId: 'fg-1--app',
      operationId: 'fg-1--app-d1',
      activation: 'eager',
      idleStopMs: 600_000,
      dormantAfterMs: 86_400_000,
    });
    await session.restore([]);
    expect(host.restored.at(-1)!.scope).toMatchObject({
      id: 'preview',
      backend: 'in-process',
    });
    const restored = host.restored.at(-1)!.deployments;
    expect(restored.find((spec) => spec.appId === 'fg-1--app')).toMatchObject({
      activation: 'lazy',
      idleStopMs: 600_000,
      dormantAfterMs: 86_400_000,
    });
    // An App without timers never stops for idleness, whatever the Host's default.
    expect(restored.find((spec) => spec.appId === 'site')).toMatchObject({
      activation: 'eager',
      idleStopMs: 0,
      dormantAfterMs: 0,
    });
  });

  it('restores one environment without touching another on the same Host', async () => {
    const host = fakeHost();
    const driver = driverFor(host);
    let previewApps = [appSpec('fg-1--app')];
    const preview = await open(driver, () => previewApps, 'preview');
    const staging = await open(driver, [appSpec('site')], 'staging');
    await preview.restore([]);
    await staging.restore([]);
    expect(
      host.restored.map((set) => [
        set.scope!.id,
        set.deployments.map((spec) => spec.appId),
      ]),
    ).toEqual([
      ['preview', ['fg-1--app']],
      ['staging', ['site']],
    ]);
    // The preview loses its App, in a newer revision of its own scope; the staging App stays.
    previewApps = [];
    await preview.restore([]);
    expect(host.restored.at(-1)).toMatchObject({
      scope: { id: 'preview' },
      revision: 2,
      deployments: [],
    });
    expect([...(await staging.status()).keys()]).toEqual(['site']);
    expect([...(await preview.status()).keys()]).toEqual([]);
  });

  it('reports the Host lifecycle as the observed state, with the last access', async () => {
    const host = fakeHost();
    const apps = ['a', 'b', 'c', 'd'].map((id) => appSpec(id));
    const session = await open(driverFor(host), apps);
    await session.restore([]);
    host.lifecycle.set('a', 'dormant');
    host.lifecycle.set('b', 'starting');
    host.lifecycle.set('c', 'stopped');
    const status = await session.status();
    expect(status.get('a')).toMatchObject({
      state: 'dormant',
      lastAccessedAt: '2026-10-02T01:00:00.000Z',
    });
    expect(status.get('b')?.state).toBe('starting');
    expect(status.get('c')?.state).toBe('stopped');
    expect(status.get('d')).toMatchObject({
      state: 'running',
      deploymentId: 'd-d1',
    });
  });

  it('reports why a deployment failed while the previous version keeps serving', async () => {
    const host = fakeHost();
    const session = await open(driverFor(host), []);
    expect(await session.apply(appSpec('site'))).toMatchObject({
      state: 'running',
    });
    host.failure = 'The health check did not pass within 20 seconds.';
    expect(
      await session.apply(
        appSpec('site', {
          deploymentId: 'site-d2',
          release: { id: 'r2', version: '2.0.0', checksum: CHECKSUM },
        }),
      ),
    ).toMatchObject({
      state: 'failed',
      deploymentId: 'site-d2',
      error: 'The health check did not pass within 20 seconds.',
    });
  });

  it('reads a deployment’s recorded outcome', async () => {
    const host = fakeHost();
    const session = await open(driverFor(host), []);
    await session.apply(appSpec('site'));
    expect(
      await session.operation!({ deploymentId: 'site-d1', appId: 'site' }),
    ).toMatchObject({ state: 'running', deploymentId: 'site-d1' });
    expect(
      await session.operation!({ deploymentId: 'other', appId: 'site' }),
    ).toBeNull();
    expect(
      await session.operation!({ deploymentId: 'site-d1', appId: 'shop' }),
    ).toBeNull();
  });

  it('takes a run mode and its settings, and sends credentials only to the Docker Host', async () => {
    const host = fakeHost();
    const docker = fakeHost();
    const driver = driverFor(host, docker);
    expect(driver.configSchema).toMatchObject({
      required: ['backend'],
      properties: { backend: { enum: ['in-process', 'docker'] } },
    });
    expect(driver.capabilitiesOf!(IN_PROCESS)).toMatchObject({ images: false });
    expect(driver.capabilitiesOf!({ backend: 'docker' })).toMatchObject({
      images: true,
      urlModes: ['path', 'subdomain'],
    });
    await expect(driver.validate!(IN_PROCESS, null)).resolves.toBeUndefined();
    await expect(driver.validate!({}, null)).rejects.toThrow(
      'names no run mode',
    );
    await expect(driver.validate!({ backend: 'k8s' }, null)).rejects.toThrow(
      'offers no "k8s" run mode',
    );
    await expect(
      driver.validate!({ ...IN_PROCESS, backendConfig: { port: 1 } }, null),
    ).rejects.toThrow('In-process Apps take no backend settings.');
    await expect(driver.validate!(IN_PROCESS, { token: 'x' })).rejects.toThrow(
      'In-process Apps take no credentials.',
    );
    await expect(
      driver.validate!({ ...IN_PROCESS, adapter: 'local' }, null),
    ).rejects.toThrow('not "adapter"');
    // The Docker Host checks its own settings; invalid ones are refused, an unreachable daemon is not.
    docker.check = {
      ok: false,
      message: 'image.platform is not a platform',
      details: { invalidSettings: true },
    };
    await expect(
      driver.validate!(
        { backend: 'docker', backendConfig: { image: { platform: 'x' } } },
        null,
      ),
    ).rejects.toThrow('image.platform is not a platform');
    docker.check = { ok: false, message: 'Docker is not reachable' };
    await expect(
      driver.validate!({ backend: 'docker', backendConfig: {} }, null),
    ).resolves.toBeUndefined();

    docker.check = { ok: true };
    const session = await driver.open(
      environment(
        'production',
        { backend: 'docker', backendConfig: { image: { keep: 2 } } },
        { registryAuth: { serveraddress: 'r.example.com' } },
        'https://{appId}.apps.example.com',
      ),
      { desired: () => Promise.resolve([]) },
    );
    expect(await session.check()).toMatchObject({ ok: true });
    expect(docker.checked.at(-1)).toMatchObject({
      id: 'production',
      backend: 'docker',
      backendConfig: { image: { keep: 2 } },
      secret: { registryAuth: { serveraddress: 'r.example.com' } },
    });
    const image = {
      ref: 'r.example.com/site',
      digest: `sha256:${CHECKSUM}`,
      platform: 'linux/amd64',
    };
    await session.apply(
      appSpec('site', {
        artifact: undefined,
        images: [image],
        registryAuth: { serveraddress: 'r.example.com', username: 'ci' },
      }),
    );
    expect(docker.applied.at(-1)).toMatchObject({
      appId: 'site',
      backend: 'external-service',
      images: [image],
      hostname: 'site.apps.example.com',
      artifact: { key: '', checksum: CHECKSUM, version: '1.0.0' },
      scope: {
        id: 'production',
        secret: {
          registryAuth: { serveraddress: 'r.example.com', username: 'ci' },
        },
      },
    });
    expect(host.applied).toHaveLength(0);
    expect(session.url('site')).toBe('https://site.apps.example.com');

    // The in-process Host never sees a credential.
    const preview = await driver.open(environment('preview'), {
      desired: () => Promise.resolve([]),
    });
    await preview.apply(appSpec('fg-1--app'));
    expect(host.applied.at(-1)!.scope).toEqual({
      id: 'preview',
      backend: 'in-process',
    });
  });

  it('counts idle stops and dormancies as churn and restarts once no on-demand App is in use', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const host = fakeHost(3);
    const driver = driverFor(host);
    const preview = appSpec('fg-1--app', {
      activation: 'onDemand',
      idleStopMinutes: 10,
    });
    const session = await open(driver, [preview]);
    await session.apply(preview);
    host.counters = {
      activations: 4,
      idleStops: 2,
      dormancies: 1,
      materializations: 0,
    };
    await vi.advanceTimersByTimeAsync(60_000);
    expect(driver.churn()).toBe(3);
    // Someone is using the preview: the restart waits.
    expect(host.restarts).toHaveLength(0);

    host.lifecycle.set('fg-1--app', 'stopped');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(host.restarts).toHaveLength(1);
    expect(host.restarts[0]).toContain('stopped or made dormant');
    expect(driver.churn()).toBe(0);
    // The fresh child got the environment's set again.
    expect(host.restored.at(-1)!.deployments.map((spec) => spec.appId)).toEqual(
      ['fg-1--app'],
    );
  });
});
