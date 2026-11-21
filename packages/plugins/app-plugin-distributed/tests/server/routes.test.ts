import {
  findApiDocumentSchemaProblems,
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../../server/routes/index.js';
import { DISTRIBUTED_STATUS_ACCESS } from '../../shared/types.js';
import type { DistributedStatus } from '../../shared/types.js';
import { z } from 'zod';

import {
  createDistributedStatusRegistry,
  distributedStatusToken,
  sharedBackendSnippet,
} from '../../server/index.js';
import { FixtureStatusExtension } from '../fixtures/server-extension.js';
import { application, SECRETS } from '../helpers/application.js';

const PATH = '/distributed/status';

async function status(
  options: Parameters<typeof application>[0] = {},
): Promise<DistributedStatus> {
  const router = await apiRoutes.createRouter(application(options));
  const response = await router.request(PATH);
  expect(response.status).toBe(200);
  return ((await response.json()) as { data: DistributedStatus }).data;
}

const SHARED = {
  caching: { default: 'redis', adapter: 'redis', sharing: 'shared' },
  concurrency: { default: 'redis', adapter: 'redis', sharing: 'shared' },
  jobs: { default: 'redis', adapter: 'redis', sharing: 'shared' },
  queue: { default: 'redis', adapter: 'redis', sharing: 'shared' },
  realtime: { default: 'redis', adapter: 'redis', sharing: 'shared' },
} as const;

describe('GET /api/distributed/status', () => {
  it('rejects anonymous callers', async () => {
    const router = await apiRoutes.createRouter(
      application({ identity: 'anonymous' }),
    );
    expect((await router.request(PATH)).status).toBe(401);
  });

  it('answers 403 without the page grant of the settings page', async () => {
    const can = vi.fn().mockResolvedValue(false);
    const router = await apiRoutes.createRouter(application({ can }));

    const response = await router.request(PATH);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: expect.objectContaining({
        status: 'PERMISSION_DENIED',
        reason: 'DISTRIBUTED_STATUS_FORBIDDEN',
        domain: 'distributed',
      }),
    });
    expect(can).toHaveBeenCalledWith(DISTRIBUTED_STATUS_ACCESS);
  });

  it('reports the default template as a single instance', async () => {
    const result = await status();

    expect(result.mode).toBe('single');
    expect(
      result.services.map(({ key, sharing, source }) => [key, sharing, source]),
    ).toEqual([
      ['caching', 'local', 'default'],
      ['concurrency', 'local', 'default'],
      ['jobs', 'local', 'default'],
      ['queue', 'local', 'default'],
      ['realtime', 'local', 'default'],
    ]);
    expect(result.idGeneration).toEqual({
      mode: 'manual',
      workerId: 0,
      source: 'default',
    });
    const levels = Object.fromEntries(
      result.checks.map(({ id, level }) => [id, level]),
    );
    expect(levels).toMatchObject({
      'database.sqlite': 'recommended',
      'idGeneration.manual': 'recommended',
      'services.local': 'recommended',
      'secrets.missing': 'recommended',
    });
    expect(result.checks.some(({ level }) => level === 'required')).toBe(false);
  });

  it('shows a configured shared backend as shared and configured', async () => {
    const result = await status({
      services: { caching: SHARED.caching },
      userProvided: ['caching.default'],
    });

    expect(result.services[0]).toMatchObject({
      key: 'caching',
      sharing: 'shared',
      source: 'configured',
      default: 'redis',
      adapter: 'redis',
      registered: true,
    });
    expect(result.mode).toBe('multi');
  });

  it('requires the queue with a configuration snippet when only it stays local', async () => {
    const result = await status({
      services: {
        ...SHARED,
        queue: { default: null, adapter: 'inMemory', sharing: 'local' },
      },
      config: {
        database: {
          default: 'main',
          connections: { main: { dialect: 'postgres' } },
        },
      },
    });

    const queue = result.checks.filter(
      ({ id, params }) => id === 'service.local' && params?.service === 'queue',
    );
    expect(queue).toEqual([
      expect.objectContaining({
        level: 'required',
        fix: expect.objectContaining({
          snippet: sharedBackendSnippet('queue'),
        }),
      }),
    ]);
    expect(
      result.checks.filter(({ id }) => id === 'service.local'),
    ).toHaveLength(1);
    expect(result.checks[0]?.level).toBe('required');
  });

  it('marks a configured but unregistered adapter as required', async () => {
    const result = await status({
      services: {
        jobs: {
          default: 'redis',
          adapter: 'redis',
          sharing: 'unknown',
          registered: false,
        },
      },
    });
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'service.unregistered',
        level: 'required',
        params: expect.objectContaining({ service: 'jobs', adapter: 'redis' }),
      }),
    );
  });

  it('asks to confirm an adapter that does not declare its sharing', async () => {
    const result = await status({
      services: {
        caching: { default: 'acme', adapter: 'acme', sharing: 'unknown' },
      },
    });
    expect(result.services[0]?.sharing).toBe('unknown');
    expect(result.mode).toBe('single');
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'service.undeclared',
        level: 'recommended',
        params: expect.objectContaining({
          service: 'caching',
          adapter: 'acme',
        }),
      }),
    );
  });

  it('names the file collections stored on a local disk', async () => {
    const result = await status({
      localDiskUsage: {
        defaultDiskIsLocal: true,
        collections: [
          { connection: 'main', collection: 'attachments' },
          { connection: 'main', collection: 'contracts' },
        ],
      },
    });
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'files.local',
        params: { collections: ['attachments', 'contracts'] },
      }),
    );
  });

  it('names local files of another connection even when the default disk is shared', async () => {
    const result = await status({
      services: SHARED,
      localDiskUsage: {
        defaultDiskIsLocal: false,
        collections: [
          { connection: 'main', collection: 'attachments' },
          { connection: 'reports', collection: 'attachments' },
        ],
        uncheckedConnections: ['archive'],
      },
    });
    const files = result.checks.filter(({ id }) => id.startsWith('files.'));
    expect(files).toEqual([
      expect.objectContaining({
        id: 'files.local',
        level: 'required',
        params: { collections: ['attachments', 'reports.attachments'] },
      }),
      expect.objectContaining({
        id: 'files.unchecked',
        level: 'recommended',
        params: { connections: ['archive'] },
      }),
    ]);
  });

  it('does not report files as fine when a connection could not be checked', async () => {
    const result = await status({
      localDiskUsage: {
        defaultDiskIsLocal: false,
        collections: [],
        uncheckedConnections: ['archive'],
      },
    });
    const ids = result.checks.map(({ id }) => id);
    expect(ids).toContain('files.unchecked');
    expect(ids).not.toContain('files.shared');
  });

  it('shows only the origin of the public address', async () => {
    const result = await status({
      config: {
        app: {
          publicOrigin:
            'https://admin:hunter2@apps.example.com:8443/base?token=tok_live_123',
        },
      },
    });
    const check = result.checks.find(({ id }) => id === 'publicOrigin.set');
    expect(check).toMatchObject({
      params: { origin: 'https://apps.example.com:8443' },
      detail: 'app.publicOrigin = https://apps.example.com:8443',
    });
    const body = JSON.stringify(result);
    for (const secret of ['hunter2', 'tok_live_123', 'admin'])
      expect(body).not.toContain(secret);
  });

  it('does not echo a public address that is not http or https', async () => {
    const result = await status({
      services: SHARED,
      config: { app: { publicOrigin: 'redis://user:hunter2@redis.internal' } },
    });
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'publicOrigin.invalid',
        level: 'required',
      }),
    );
    expect(JSON.stringify(result)).not.toContain('hunter2');
  });

  it('asks to confirm that a shareable database is the same for every instance', async () => {
    const result = await status({
      config: {
        database: {
          default: 'main',
          connections: { main: { dialect: 'postgres' } },
        },
      },
    });
    expect(
      result.checks.find(({ id }) => id === 'database.shared')?.detail,
    ).toMatch(/can be shared by several instances\. Confirm/u);
  });

  it('counts a shared backend a caller selected by name as the intent to scale out', async () => {
    const result = await status({
      services: {
        caching: {
          default: 'memory',
          adapter: 'memory',
          sharing: 'local',
          backends: [{ name: 'redis', adapter: 'redis', sharing: 'shared' }],
          selections: [{ consumer: 'sessions', backend: 'redis' }],
        },
      },
    });
    expect(result.mode).toBe('multi');
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'service.local',
        level: 'required',
        params: expect.objectContaining({ service: 'caching' }),
      }),
    );
    expect(result.checks.map(({ id }) => id)).not.toContain(
      'service.selectionLocal',
    );
  });

  it('tells a local selection from an undeclared one under a shared default', async () => {
    const result = await status({
      services: {
        ...SHARED,
        caching: {
          default: 'redis',
          adapter: 'redis',
          sharing: 'shared',
          backends: [
            { name: 'memory', adapter: 'memory', sharing: 'local' },
            { name: 'acme', adapter: 'acme', sharing: 'unknown' },
          ],
          selections: [
            { consumer: 'local-only', backend: 'memory' },
            { consumer: 'custom', backend: 'acme' },
          ],
        },
      },
    });
    const selection = result.checks
      .filter(({ id }) => id.startsWith('service.selection'))
      .map(({ id, params }) => [id, params?.consumer]);
    expect(selection).toEqual([
      ['service.selectionLocal', 'local-only'],
      ['service.selectionUndeclared', 'custom'],
    ]);
  });

  it('treats automatic worker IDs as the intent to run several instances', async () => {
    const result = await status({ autoWorkerIds: true });
    expect(result.idGeneration).toEqual({
      mode: 'auto',
      workerId: null,
      source: 'configured',
    });
    expect(result.mode).toBe('multi');
  });

  it('never returns connection addresses, user names, passwords or tokens', async () => {
    const result = await status({
      services: SHARED,
      config: {
        secrets: { keys: ['tok_live_123'] },
        app: { publicOrigin: 'https://app.example.com' },
      },
    });
    const body = JSON.stringify(result);
    for (const secret of SECRETS) expect(body).not.toContain(secret);
    expect(body).not.toMatch(/"(?:options|url|connection|password|host)"/);
  });

  it('includes the checks and data other plugins register', async () => {
    const registry = createDistributedStatusRegistry();
    registry.addCheck({
      id: 'fixture',
      run: ({ mode }) => [
        {
          id: 'fixture.instances',
          level: 'ok',
          title: 'Fixture',
          detail: `mode ${mode}`,
        },
      ],
    });
    registry.addCheck({
      id: 'broken',
      run: () => {
        throw new Error('boom');
      },
    });
    registry.addData('fixture', {
      schema: z.object({ instances: z.number() }),
      read: () => ({ instances: 2 }),
    });
    registry.addData('mismatch', {
      schema: z.object({ instances: z.number() }),
      read: () => ({ instances: 'two' }),
    });

    const result = await status({ registry });

    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'fixture.instances',
        detail: 'mode single',
      }),
    );
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'checkFailed',
        params: { check: 'broken' },
      }),
    );
    expect(result.extensions).toEqual({ fixture: { instances: 2 } });
  });

  it('lets an external plugin add a check and data from its provider', async () => {
    const app = application();
    await new FixtureStatusExtension(app).boot();
    const router = await apiRoutes.createRouter(app);

    const result = (
      (await (await router.request(PATH)).json()) as { data: DistributedStatus }
    ).data;

    expect(result.checks).toContainEqual(
      expect.objectContaining({ id: 'fixture.instances', level: 'ok' }),
    );
    expect(result.extensions).toEqual({
      fixture: { instances: ['node-a', 'node-b'] },
    });
  });

  it('sends only the fields extension data declares, at any depth', async () => {
    const app = application();
    await new FixtureStatusExtension(app).boot();
    app.container.resolve(distributedStatusToken).addData('nested', {
      schema: z.object({ pool: z.object({ size: z.number() }) }),
      read: () => ({
        pool: {
          size: 2,
          options: { url: 'redis://user:hunter2@redis.internal' },
        },
        token: 'tok_live_123',
      }),
    });
    const router = await apiRoutes.createRouter(app);

    const body = await (await router.request(PATH)).text();
    const result = (JSON.parse(body) as { data: DistributedStatus }).data;

    expect(result.extensions).toEqual({
      fixture: { instances: ['node-a', 'node-b'] },
      nested: { pool: { size: 2 } },
    });
    for (const secret of ['redis.internal', 'hunter2', 'tok_live_123'])
      expect(body).not.toContain(secret);
  });

  it('rejects data registered without a schema', () => {
    expect(() =>
      createDistributedStatusRegistry().addData('bare', {
        read: () => ({}),
      } as never),
    ).toThrow('zod schema');
  });

  it('declares itself in the API document', async () => {
    const router = await apiRoutes.createRouter(application());
    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'test', version: '0.0.0' },
    });
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(document.paths?.[`/api${PATH}`]?.get).toMatchObject({
      operationId: 'distributedGetStatus',
      tags: ['Distributed'],
    });
  });
});
