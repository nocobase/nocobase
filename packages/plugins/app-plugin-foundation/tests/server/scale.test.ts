import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it, vi } from 'vitest';
import { dataModeling, files } from '../../server/capabilities/data.js';
import { DefaultFoundationService } from '../../server/services/foundation.js';
import { ReadQueue } from '../../server/read-queue.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function application(size: number) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'foundation-scale-'));
  directories.push(rootDir);
  await writeFile(
    path.join(rootDir, 'package.json'),
    JSON.stringify({ name: 'scale-app' }),
  );
  const names = Array.from(
    { length: size },
    (_, index) => `order${String(index).padStart(5, '0')}`,
  );
  let active = 0;
  let peak = 0;
  const count = vi.fn(async () => {
    active++;
    peak = Math.max(peak, active);
    await setImmediate();
    active--;
    return 2;
  });
  const database = {
    collections: () => ({
      list: async ({
        cursor = '0',
        limit,
      }: {
        cursor?: string;
        limit: number;
      }) => {
        const offset = Number(cursor);
        return {
          items: names
            .slice(offset, offset + limit)
            .map((name) => ({ name, kind: 'table', tableName: name })),
          ...(offset + limit < size
            ? { nextCursor: String(offset + limit) }
            : {}),
        };
      },
      get: async () => ({ fields: [{ name: 'id', type: 'integer' }] }),
    }),
    repository: () => ({ count }),
  } as unknown as DatabaseManager;
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  const service = new DefaultFoundationService({
    container,
    rootDir,
    config: { get: () => undefined },
    hasClient: true,
    collectors: [dataModeling, files],
    cacheTtlMs: 0,
  });
  return { service, count, peak: () => peak };
}

it.each([0, 28, 1000, 5000])(
  'keeps %i Collections out of the initial payload and counts rows only on demand',
  async (size) => {
    const { service, count, peak } = await application(size);
    const first = await service.overview();
    const data = first.capabilities.find(
      (item) => item.key === 'dataModeling',
    )!;
    expect(count).not.toHaveBeenCalled();
    expect(
      data.metrics.find((item) => item.key === 'businessCollections')?.value,
    ).toBe(size);
    expect(
      data.facts.flatMap((fact) => fact.params?.names ?? []).length,
    ).toBeLessThanOrEqual(5);
    expect(JSON.stringify(first).length).toBeLessThan(5000);
    const counted = await service.overview({ countRecords: true });
    expect(count).toHaveBeenCalledTimes(size);
    expect(peak()).toBeLessThanOrEqual(4);
    expect(
      counted.capabilities[0]?.metrics.find(
        (item) => item.key === 'businessRecords',
      )?.value,
    ).toBe(size * 2);
    expect(counted.recordCountCheckedAt).toBeTruthy();
    count.mockClear();
    const refreshed = await service.overview({ refresh: true });
    expect(count).not.toHaveBeenCalled();
    expect(refreshed.recordCountCheckedAt).toBe(counted.recordCountCheckedAt);
    expect(
      refreshed.capabilities[0]?.metrics.find(
        (item) => item.key === 'businessRecords',
      )?.value,
    ).toBe(size * 2);
    const page = await service.collections({ search: '', offset: 0 });
    expect(page?.items.length).toBe(Math.min(size, 50));
    if (size === 5000) {
      expect(
        (
          await service.collections({ search: 'ORDER04999', offset: 0 })
        )?.items.map((item) => item.name),
      ).toEqual(['order04999']);
      expect(
        (await service.collections({ search: '', offset: 50 }))?.items[0]?.name,
      ).toBe('order00050');
    }
  },
);

it('stops queued reads on timeout and keeps running reads bounded across subsequent requests', async () => {
  const queue = new ReadQueue();
  const first = new AbortController();
  const complete: (() => void)[] = [];
  const read = vi.fn(
    () => new Promise<void>((resolve) => complete.push(resolve)),
  );
  const pending = Array.from({ length: 1000 }, () =>
    queue.run(read, first.signal),
  );
  const settled = Promise.allSettled(pending);
  await setImmediate();
  expect(read).toHaveBeenCalledTimes(4);
  first.abort();
  expect((await settled).every((item) => item.status === 'rejected')).toBe(
    true,
  );
  const second = new AbortController();
  const next = queue.run(read, second.signal);
  const nextSettled = Promise.allSettled([next]);
  await setImmediate();
  expect(read).toHaveBeenCalledTimes(4);
  second.abort();
  await nextSettled;
  complete.forEach((resolve) => resolve());
  await setImmediate();
  expect(read).toHaveBeenCalledTimes(4);
});

it('retains the last successful count and its original time when a later explicit count fails', async () => {
  const { service, count } = await application(28);
  const first = await service.overview({ countRecords: true });
  count.mockRejectedValue(new Error('private driver detail'));
  const next = await service.overview({ countRecords: true });
  expect(
    next.capabilities[0]?.metrics.find((item) => item.key === 'businessRecords')
      ?.value,
  ).toBe(56);
  expect(next.recordCountCheckedAt).toBe(first.recordCountCheckedAt);
  expect(next.capabilities[0]?.completeness).toBe('partial');
  expect(JSON.stringify(next)).not.toContain('private driver detail');
});
