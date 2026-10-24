import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  databaseManagerToken,
  type CollectionDefinition,
  type DatabaseManager,
} from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it, vi } from 'vitest';
import { dataModeling } from '../../server/capabilities/data.js';
import { Inventory, Probe } from '../../server/inventory.js';
import { DefaultFoundationService } from '../../server/services/foundation.js';

const directories: string[] = [];
afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(
    directories
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function application() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'foundation-schema-'));
  directories.push(rootDir);
  await writeFile(path.join(rootDir, 'package.json'), '{"name":"schema-app"}');
  const get = vi.fn(
    async (name: string): Promise<CollectionDefinition | undefined> =>
      ({
        name,
        fields:
          name === 'orders'
            ? [
                { name: 'id', type: 'integer' },
                { name: 'customer', type: 'belongsTo', target: 'customers' },
              ]
            : [],
      }) as CollectionDefinition,
  );
  const database = {
    collections: () => ({
      list: async () => ({
        items: [
          { name: 'orders', kind: 'table', tableName: 'orders' },
          { name: 'orderView', kind: 'view', tableName: 'orderView' },
        ],
      }),
      get,
    }),
    repository: () => ({ count: async () => 7 }),
  } as unknown as DatabaseManager;
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const createService = (timeout = 1000) =>
    new DefaultFoundationService({
      container,
      rootDir,
      config: { get: () => undefined },
      hasClient: true,
      collectors: [dataModeling],
      collectorTimeoutMs: timeout,
    });
  return { get, database, createService };
}

it.each(['missing', 'throwing'] as const)(
  'isolates a %s definition and retains known catalog and schema totals',
  async (mode) => {
    const { get, createService } = await application();
    get.mockImplementation(async (name) => {
      if (name === 'orders') {
        if (mode === 'throwing')
          throw new Error('private driver connection detail');
        return undefined;
      }
      return {
        name,
        fields: [
          { name: 'id', type: 'integer' },
          { name: 'customer', type: 'belongsTo', target: 'customers' },
        ],
      } as CollectionDefinition;
    });
    const overview = await createService().overview();
    expect(overview.capabilities[0]).toMatchObject({
      status: 'active',
      completeness: 'partial',
      facts: [
        {
          code: 'applicationCollections',
          params: { count: 2, names: ['orders', 'orderView'] },
        },
      ],
      issues: [{ code: 'SOURCE_UNREADABLE', source: 'orders' }],
    });
    const metrics = overview.capabilities[0]!.metrics;
    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'businessCollections',
          value: 1,
          complete: true,
        }),
        expect.objectContaining({ key: 'views', value: 1, complete: true }),
        expect.objectContaining({ key: 'fields', value: 1, complete: false }),
        expect.objectContaining({
          key: 'relations',
          value: 1,
          complete: false,
        }),
      ]),
    );
    expect(JSON.stringify(overview)).not.toContain('private driver');
  },
);

it.each(['missing', 'throwing'] as const)(
  'retains schema totals with their original date when every definition is %s and recovers',
  async (mode) => {
    const { get, createService } = await application();
    const service = createService();
    const first = await service.overview({ countRecords: true });
    if (mode === 'missing') get.mockResolvedValue(undefined);
    else get.mockRejectedValue(new Error('private driver connection detail'));
    const failed = await service.overview({ refresh: true });
    expect(failed.capabilities[0]).toMatchObject({
      status: 'active',
      completeness: 'partial',
    });
    expect(failed.capabilities[0]!.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'businessCollections',
          value: 1,
          complete: true,
        }),
        expect.objectContaining({
          key: 'fields',
          value: 1,
          complete: true,
          checkedAt: first.checkedAt,
        }),
        expect.objectContaining({
          key: 'relations',
          value: 1,
          complete: true,
          checkedAt: first.checkedAt,
        }),
        expect.objectContaining({
          key: 'businessRecords',
          value: 7,
          complete: true,
        }),
      ]),
    );
    expect(failed.recordCountCheckedAt).toBe(first.recordCountCheckedAt);
    get.mockImplementation(
      async (name) => ({ name, fields: [] }) as CollectionDefinition,
    );
    const recovered = await service.overview({ refresh: true });
    expect(recovered.capabilities[0]).toMatchObject({
      completeness: 'complete',
      issues: [],
    });
    expect(recovered.capabilities[0]!.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'fields', value: 0, complete: true }),
        expect.objectContaining({ key: 'relations', value: 0, complete: true }),
      ]),
    );
    expect(recovered.recordCountCheckedAt).toBe(first.recordCountCheckedAt);
    expect(JSON.stringify(failed)).not.toContain('private driver');
  },
);

it('records missing definitions as unreadable for field inspection too', async () => {
  const { get, database } = await application();
  get.mockResolvedValue(undefined);
  const probe = new Probe(await Inventory.read(database));
  expect(await probe.fieldNames('orders')).toBeNull();
  expect(probe.issues).toEqual([
    { code: 'SOURCE_UNREADABLE', source: 'orders' },
  ]);
});

it('treats a present definition with omitted optional fields as an exact empty definition', async () => {
  const { get, createService } = await application();
  get.mockImplementation(async (name) => ({ name }));
  const data = (await createService().overview()).capabilities[0]!;
  expect(data).toMatchObject({ completeness: 'complete', issues: [] });
  expect(data.metrics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: 'fields', value: 0, complete: true }),
      expect.objectContaining({ key: 'relations', value: 0, complete: true }),
    ]),
  );
});

it('keeps catalog totals and the last count through a definition deadline and recovers', async () => {
  const { get, createService } = await application();
  const service = createService(50);
  const first = await service.overview({ countRecords: true });
  const finish: (() => void)[] = [];
  let started: () => void = () => undefined;
  const reading = new Promise<void>((resolve) => {
    started = resolve;
  });
  get.mockImplementation(
    (name) =>
      new Promise((resolve) => {
        finish.push(() =>
          resolve({ name, fields: [] } as CollectionDefinition),
        );
        if (finish.length === 2) started();
      }),
  );
  vi.useFakeTimers();
  const pending = service.overview({ refresh: true });
  // Let filesystem discovery and the schema reads start before advancing the collector clock.
  await reading;
  await vi.advanceTimersByTimeAsync(50);
  const timedOut = await pending;
  expect(timedOut.capabilities[0]).toMatchObject({
    status: 'active',
    completeness: 'partial',
    issues: [{ code: 'COLLECTOR_TIMEOUT' }],
  });
  expect(timedOut.capabilities[0]!.metrics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: 'businessCollections',
        value: 1,
        complete: true,
      }),
      expect.objectContaining({
        key: 'fields',
        value: 1,
        complete: true,
        checkedAt: first.checkedAt,
      }),
      expect.objectContaining({
        key: 'businessRecords',
        value: 7,
        complete: true,
      }),
    ]),
  );
  expect(timedOut.recordCountCheckedAt).toBe(first.recordCountCheckedAt);
  finish.forEach((resolve) => resolve());
  vi.useRealTimers();
  get.mockResolvedValue({ name: 'empty', fields: [] } as CollectionDefinition);
  expect(
    (await service.overview({ refresh: true })).capabilities[0],
  ).toMatchObject({ completeness: 'complete', issues: [] });
});
