// @vitest-environment node
/**
 * What the environment form relies on from the server: the names of stored credentials without their values,
 * credential changes that keep the rest, a driver's facts, and trying settings before they are saved
 * (`POST environment-checks`) on a throwaway session that is closed afterwards, and a variant (a run mode) an
 * environment keeps.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { DeploymentDriver } from '../server/drivers/types.js';
import { createApiServer, createHarness, type Harness } from './harness.js';

/** A driver that reports what its session received, and the sessions it opened and closed. */
function createProbeDriver() {
  const opened: string[] = [];
  const closed: string[] = [];
  const driver: DeploymentDriver = {
    kind: 'probe',
    title: { key: 'drivers.probe', ns: 'test' },
    configSchema: { type: 'object' },
    capabilities: {
      logs: false,
      urlModes: ['path'],
    },
    facts: { launchPrefix: ['setpriv', '--'] },
    variants: {
      key: 'mode',
      capabilities: {
        near: { logs: false, urlModes: ['path'] },
        far: { logs: false, urlModes: ['path'], images: true },
      },
    },
    validate(config) {
      if (config.invalid) throw new Error('Invalid probe settings.');
    },
    open(environment) {
      opened.push(environment.id);
      return Promise.resolve({
        check: () =>
          Promise.resolve(
            environment.config.down
              ? { ok: false, message: 'connect ECONNREFUSED 127.0.0.1:2375' }
              : {
                  ok: true,
                  details: {
                    version: '28.1.1',
                    secretKeys: Object.keys(environment.secret ?? {}).sort(),
                    host: environment.config.host ?? null,
                  },
                },
          ),
        apply: () => Promise.reject(new Error('unused')),
        start: () => Promise.reject(new Error('unused')),
        stop: () => Promise.reject(new Error('unused')),
        restart: () => Promise.reject(new Error('unused')),
        remove: () => Promise.resolve(),
        status: () => Promise.resolve(new Map()),
        restore: () => Promise.resolve(),
        logs: () => Promise.resolve({ entries: [], nextCursor: null }),
        url: () => null,
        close: () => {
          closed.push(environment.id);
          return Promise.resolve();
        },
      } as unknown as Awaited<ReturnType<DeploymentDriver['open']>>);
    },
  };
  return { driver, opened, closed };
}

describe('environment form support', () => {
  let harness: Harness;
  let server: Awaited<ReturnType<typeof createApiServer>>;
  let probe: ReturnType<typeof createProbeDriver>;

  beforeEach(async () => {
    probe = createProbeDriver();
    harness = await createHarness({ drivers: [probe.driver] });
    harness.application.roles.set('admin', 'admin');
    harness.application.roles.set('carol', 'contributor');
    server = await createApiServer(harness.services);
  });
  afterEach(async () => {
    await server.close();
    await harness.close();
  });

  const call = async (
    path: string,
    init: RequestInit & { user?: string; json?: unknown } = {},
  ) => {
    const headers = new Headers(init.headers);
    if (init.user) headers.set('x-test-user', init.user);
    if (init.json !== undefined)
      headers.set('content-type', 'application/json');
    const response = await fetch(`${server.url}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
    const text = await response.text();
    return {
      status: response.status,
      text,
      body: JSON.parse(text) as { data?: any; error?: { code: string } },
    };
  };

  it('names stored credentials without returning them, and changes some while keeping the rest', async () => {
    const created = await call('/environments', {
      method: 'POST',
      user: 'admin',
      json: {
        id: 'remote',
        name: 'Remote',
        driver: 'probe',
        config: { host: 'a' },
        secretChanges: { sshPrivateKey: 'KEY-1', sshPassphrase: 'PASS-1' },
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      hasSecret: true,
      secretKeys: ['sshPassphrase', 'sshPrivateKey'],
    });
    expect(created.text).not.toContain('KEY-1');
    const listed = await call('/environments', { user: 'carol' });
    expect(listed.text).not.toContain('KEY-1');
    expect(listed.text).not.toContain('PASS-1');

    const updated = await call('/environments/remote', {
      method: 'PATCH',
      user: 'admin',
      json: { secretChanges: { sshPrivateKey: 'KEY-2', sshPassphrase: null } },
    });
    expect(updated.body.data.secretKeys).toEqual(['sshPrivateKey']);
    const checked = await call('/environments/remote/check', {
      method: 'POST',
      user: 'admin',
    });
    expect(checked.body.data.details.secretKeys).toEqual(['sshPrivateKey']);

    // Saving other settings keeps the credentials.
    await call('/environments/remote', {
      method: 'PATCH',
      user: 'admin',
      json: { config: { host: 'b' } },
    });
    expect(
      (await call('/environments/remote', { user: 'admin' })).body.data
        .secretKeys,
    ).toEqual(['sshPrivateKey']);

    // Removing the last credential stores none.
    const cleared = await call('/environments/remote', {
      method: 'PATCH',
      user: 'admin',
      json: { secretChanges: { sshPrivateKey: null } },
    });
    expect(cleared.body.data).toMatchObject({
      hasSecret: false,
      secretKeys: [],
    });
  });

  it('keeps an environment’s variant once it is created', async () => {
    const created = await call('/environments', {
      method: 'POST',
      user: 'admin',
      json: {
        id: 'near',
        name: 'Near',
        driver: 'probe',
        config: { mode: 'near' },
      },
    });
    expect(created.status).toBe(201);
    const changed = await call('/environments/near', {
      method: 'PATCH',
      user: 'admin',
      json: { config: { mode: 'far' } },
    });
    expect(changed.status).toBe(400);
    expect(changed.body.error?.reason).toBe('ENVIRONMENT_VARIANT_FIXED');
    const renamed = await call('/environments/near', {
      method: 'PATCH',
      user: 'admin',
      json: { name: 'Nearby', config: { mode: 'near', host: 'h' } },
    });
    expect(renamed.status).toBe(200);
  });

  it('reports a driver’s facts with its summary', async () => {
    const drivers = await call('/drivers', { user: 'admin' });
    expect(
      drivers.body.data.find((item: { kind: string }) => item.kind === 'probe'),
    ).toMatchObject({ facts: { launchPrefix: ['setpriv', '--'] } });
    expect(
      drivers.body.data.find((item: { kind: string }) => item.kind === 'fake')
        .facts,
    ).toBeNull();
  });

  it('tries unsaved settings on a throwaway session, with the stored credentials not changed', async () => {
    const fresh = await call('/environments/check', {
      method: 'POST',
      user: 'admin',
      json: {
        driver: 'probe',
        config: { host: 'new' },
        secretChanges: { tlsCa: 'CA' },
      },
    });
    expect(fresh.status).toBe(200);
    expect(fresh.body.data).toEqual({
      ok: true,
      details: { version: '28.1.1', secretKeys: ['tlsCa'], host: 'new' },
    });

    await call('/environments', {
      method: 'POST',
      user: 'admin',
      json: {
        id: 'remote',
        name: 'Remote',
        driver: 'probe',
        secretChanges: { tlsCa: 'CA', tlsKey: 'KEY' },
      },
    });
    const sessionsBefore = probe.opened.length;
    const editing = await call('/environments/check', {
      method: 'POST',
      user: 'admin',
      json: {
        id: 'remote',
        driver: 'probe',
        config: { host: 'edited' },
        secretChanges: { tlsCert: 'CERT', tlsKey: null },
      },
    });
    expect(editing.body.data.details).toMatchObject({
      secretKeys: ['tlsCa', 'tlsCert'],
      host: 'edited',
    });
    const draftIds = probe.opened.slice(sessionsBefore);
    expect(draftIds).toHaveLength(1);
    expect(draftIds[0]).not.toBe('remote');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(probe.closed).toContain(draftIds[0]);
    // Nothing was saved.
    expect(
      (await call('/environments/remote', { user: 'admin' })).body.data
        .secretKeys,
    ).toEqual(['tlsCa', 'tlsKey']);
  });

  it('reports a failed check, refuses invalid settings and needs the manage grant', async () => {
    const down = await call('/environments/check', {
      method: 'POST',
      user: 'admin',
      json: { driver: 'probe', config: { down: true } },
    });
    expect(down.body.data).toEqual({
      ok: false,
      message: 'connect ECONNREFUSED 127.0.0.1:2375',
    });
    const invalid = await call('/environments/check', {
      method: 'POST',
      user: 'admin',
      json: { driver: 'probe', config: { invalid: true } },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error?.reason).toBe('INVALID_ENVIRONMENT_CONFIG');
    const unknown = await call('/environments/check', {
      method: 'POST',
      user: 'admin',
      json: { driver: 'nope', config: {} },
    });
    expect(unknown.body.error?.reason).toBe('INVALID_DRIVER');
    const contributor = await call('/environments/check', {
      method: 'POST',
      user: 'carol',
      json: { driver: 'probe', config: {} },
    });
    expect(contributor.status).toBe(403);
  });
});
