import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Job, JobExecutor } from '@nocobase/jobs';
import { createJobExecutorService } from '@nocobase/jobs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  FoundationSnapshots,
  RUNNING_KERNEL_VERSION,
  type ScanPayload,
} from '../../server/snapshots.js';
import { DefaultFoundationService } from '../../server/services/foundation.js';
import type { FoundationOverview } from '../../shared/foundation.js';

let database: TestDatabase;
let jobs: Job<ScanPayload>[];
let collector: DefaultFoundationService;
let result: FoundationOverview;
let collect: ReturnType<typeof vi.spyOn>;
let executor: JobExecutor;
const base: FoundationOverview = {
  capabilities: [],
  checkedAt: '2026-10-20T08:00:00.000Z',
  durationMs: 12,
  connection: 'default',
};

beforeEach(async () => {
  database = await createTestDatabase();
  await database.migrate([
    {
      packageName: '@nocobase/app-plugin-foundation',
      directory: fileURLToPath(
        new URL('../../database/migrations', import.meta.url),
      ),
    },
  ]);
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database.database);
  collector = new DefaultFoundationService({
    container,
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    hasClient: true,
    config: { get: () => undefined },
  });
  result = base;
  collect = vi
    .spyOn(collector, 'overview')
    .mockImplementation(async () => result);
  jobs = [];
  executor = {
    registerJob: () => undefined,
    setup: async () => undefined,
    shutdown: async () => undefined,
    subscribe: () => () => undefined,
    addJob: async (job) => {
      jobs.push(job as Job<ScanPayload>);
      return {
        jobId: String(jobs.length),
        jobName: 'foundationScan',
        enqueuedAt: new Date(),
      };
    },
  };
});
afterEach(async () => {
  await database.destroy();
});

function service(kernelVersion = RUNNING_KERNEL_VERSION, appName = 'test') {
  return new FoundationSnapshots({
    database: database.database,
    appName,
    kernelVersion,
    executor,
    collector: () => collector,
  });
}
async function run(
  service: FoundationSnapshots,
  index = 0,
  signal = new AbortController().signal,
) {
  await service.run(jobs[index]!.payload, { jobId: String(index + 1), signal });
}

it('claims once across simultaneous first visits and refreshes; reads and time do not scan or write', async () => {
  const a = service(),
    b = service();
  expect((await a.snapshot()).needsScan).toBe(true);
  await Promise.all([
    a.ensureScan(),
    b.ensureScan(),
    a.ensureScan({ refresh: true }),
  ]);
  expect(jobs).toHaveLength(1);
  expect(collect).not.toHaveBeenCalled();
  await run(a);
  expect((await b.snapshot()).overview).toEqual(base);
  const client = await database.database.connection().client<{
    on(event: string, handler: (query: { sql: string }) => void): void;
    removeListener(
      event: string,
      handler: (query: { sql: string }) => void,
    ): void;
  }>();
  const queries: string[] = [];
  const record = (query: { sql: string }) => {
    queries.push(query.sql);
  };
  client.on('query', record);
  try {
    await a.snapshot();
    expect(queries).toHaveLength(1);
    queries.length = 0;
    await a.scanStatus();
    expect(queries).toHaveLength(1);
    expect(queries[0]).not.toContain('checkpoint');
    expect(queries[0]).not.toContain('overview');
  } finally {
    client.removeListener('query', record);
  }
  await b.start(true);
  await a.ensureScan();
  expect(jobs).toHaveLength(1);
  expect(collect).toHaveBeenCalledExactlyOnceWith({
    refresh: true,
    countRecords: false,
  });
});

it('keeps reliable result and completion time on failure and allows a manual retry', async () => {
  const a = service();
  await a.ensureScan();
  await run(a);
  collect.mockRejectedValueOnce(new Error('private storage details'));
  await a.ensureScan({ refresh: true });
  await run(a, 1);
  expect(await a.snapshot()).toMatchObject({
    status: 'failed',
    overview: base,
    checkedAt: base.checkedAt,
  });
  await a.ensureScan();
  expect(jobs).toHaveLength(2);
  result = { ...base, checkedAt: '2026-10-21T08:00:00.000Z' };
  await a.ensureScan({ refresh: true });
  await run(a, 2);
  expect(await a.snapshot()).toMatchObject({
    status: 'succeeded',
    overview: result,
  });
});

it('records first failure without inventing a zero result or automatically retrying on visits', async () => {
  const a = service();
  collect.mockRejectedValue(new Error('unavailable'));
  await a.ensureScan();
  await run(a);
  expect(await a.snapshot()).toMatchObject({
    status: 'failed',
    needsScan: false,
  });
  expect((await a.snapshot()).overview).toBeUndefined();
  await a.start(true);
  await a.ensureScan();
  expect(jobs).toHaveLength(1);
});

it('saves partial observations with their actual zero and unknown semantics', async () => {
  result = {
    ...base,
    capabilities: [
      {
        key: 'dataModeling',
        status: 'active',
        facts: [],
        metrics: [
          { key: 'views', value: 0, complete: true, unit: 'count' },
          { key: 'fields', value: 4, complete: false, unit: 'count' },
          {
            key: 'businessRecords',
            value: null,
            complete: false,
            unit: 'count',
          },
        ],
        parts: [],
        packages: [],
        completeness: 'partial',
        issues: [{ code: 'SOURCE_UNREADABLE', source: 'fixture' }],
      },
    ],
  };
  const a = service();
  await a.ensureScan();
  await run(a);
  expect(await service().snapshot()).toMatchObject({
    status: 'succeeded',
    overview: result,
  });
});

it('supersedes a previous kernel generation and never lets its old job publish', async () => {
  const old = service('fixture-kernel-1'),
    current = service('fixture-kernel-2');
  await old.ensureScan();
  await run(old);
  await old.ensureScan({ refresh: true });
  let finish!: (overview: FoundationOverview) => void;
  collect.mockImplementationOnce(
    () =>
      new Promise<FoundationOverview>((resolve) => {
        finish = resolve;
      }),
  );
  const pending = run(old, 1);
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  await current.ensureScan();
  expect(await current.snapshot()).toMatchObject({
    status: 'queued',
    snapshotKernelVersion: 'fixture-kernel-1',
    overview: base,
  });
  result = { ...base, checkedAt: '2026-10-22T08:00:00.000Z' };
  await run(current, 2);
  finish(base);
  await pending;
  expect(await current.snapshot()).toMatchObject({
    status: 'succeeded',
    snapshotKernelVersion: 'fixture-kernel-2',
    overview: result,
  });
});

it('recovers a lost memory task after interruption without losing history', async () => {
  const a = service();
  await a.ensureScan();
  await run(a);
  await a.ensureScan({ refresh: true });
  const abort = new AbortController();
  abort.abort();
  await expect(run(a, 1, abort.signal)).rejects.toThrow();
  expect((await a.scanStatus()).status).toBe('running');
  const restarted = service();
  await restarted.start(true);
  await run(restarted, 2);
  expect(await restarted.snapshot()).toMatchObject({
    status: 'succeeded',
    overview: base,
  });
  await run(a, 1);
  expect(collect).toHaveBeenCalledTimes(2);
});

it('isolates applications and only asks for heavy record counts explicitly', async () => {
  const a = service(),
    b = service(RUNNING_KERNEL_VERSION, 'other');
  await a.ensureScan();
  await run(a);
  expect((await b.snapshot()).overview).toBeUndefined();
  await a.ensureScan({ countRecords: true });
  await run(a, 1);
  expect(collect).toHaveBeenLastCalledWith({
    refresh: true,
    countRecords: true,
  });
  await a.ensureScan({ refresh: true });
  await run(a, 2);
  expect(collect).toHaveBeenLastCalledWith({
    refresh: true,
    countRecords: false,
  });
});

it('keeps saved data after structure and record changes and retains independent counts through restart', async () => {
  collect.mockRestore();
  const a = service();
  await database.database.builder().createCollection('orders', (table) => {
    table.string('id', { primaryKey: true });
  });
  await database.database
    .repository('orders')
    .createOne({ values: { id: 'one' } });
  await a.ensureScan();
  await run(a);
  const records = (value: FoundationOverview | undefined) =>
    value?.capabilities
      .find((item) => item.key === 'dataModeling')
      ?.metrics.find((item) => item.key === 'businessRecords');
  expect(records((await a.snapshot()).overview)?.value).toBeNull();
  await a.ensureScan({ countRecords: true });
  await run(a, 1);
  const counted = (await a.snapshot()).overview!;
  expect(records(counted)?.value).toBe(1);
  expect(counted.recordCountCheckedAt).toEqual(expect.any(String));
  await database.database
    .repository('orders')
    .createOne({ values: { id: 'two' } });
  const restarted = service();
  await restarted.start(true);
  await restarted.ensureScan();
  expect(jobs).toHaveLength(2);
  expect((await restarted.snapshot()).overview).toEqual(counted);
  await restarted.ensureScan({ refresh: true });
  await run(restarted, 2);
  const refreshed = (await restarted.snapshot()).overview!;
  expect(records(refreshed)?.value).toBe(1);
  expect(refreshed.recordCountCheckedAt).toBe(counted.recordCountCheckedAt);
  await database.database
    .builder()
    .createCollection('newStructure', (table) => {
      table.string('id', { primaryKey: true });
    });
  await restarted.ensureScan();
  expect(jobs).toHaveLength(3);
  expect((await restarted.snapshot()).overview).toEqual(refreshed);
});

it('executes the registered production job through real Jobs and resumes with the same durable snapshot', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'foundation-jobs-'));
  const jobsService = createJobExecutorService(undefined, {
    appName: 'test',
    storagePath: directory,
  });
  const worker = jobsService.getJobExecutor('foundation-test');
  const a = new FoundationSnapshots({
    database: database.database,
    appName: 'test',
    executor: worker,
    collector: () => collector,
  });
  worker.registerJob(a.job);
  try {
    await worker.setup();
    await a.start(false);
    await expect
      .poll(async () => (await a.scanStatus()).status)
      .toBe('succeeded');
    expect((await a.snapshot()).overview).toEqual(base);
  } finally {
    await jobsService.shutdown();
    await rm(directory, { recursive: true, force: true });
  }
  expect((await service().snapshot()).overview).toEqual(base);
  expect(collect).toHaveBeenCalledTimes(1);
});
