// The runtime on the application's jobs service: effects run as jobs,
// retries wait for their backoff, the sweep reclaims and fires triggers, and
// a start picks up what the previous one left queued.
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createJobExecutorService } from '@nocobase/jobs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  LifecycleRuntime,
  MemoryLifecycleStore,
  type LifecycleRecord,
} from '../src/index.js';
import { createLifecycleJobs, type LifecycleJobs } from '../src/jobs.js';

type State = 'open' | 'sent' | 'done' | 'expired';

interface Invoice extends LifecycleRecord {
  readonly status: State;
}

interface Controls {
  send(attempt: number): Promise<unknown>;
}

interface InvoiceTypes {
  record: Invoice;
  state: State;
  parameters: object;
  services: Controls;
}

const send = defineEffect<InvoiceTypes>({
  name: 'invoices.send',
  retry: { attempts: 3, backoffMs: 30 },
  onSuccess: 'deliver',
  run: ({ services, attempt }) => services.send(attempt),
});

const invoices = defineLifecycle<InvoiceTypes>({
  name: 'invoices',
  initial: 'open',
  states: [
    'open',
    'sent',
    { name: 'done', final: true },
    { name: 'expired', final: true },
  ],
  transitions: {
    send: { from: 'open', to: 'sent', effects: [send] },
    deliver: { from: 'sent', to: 'done' },
    expire: {
      from: 'open',
      to: 'expired',
      guard: ({ actor }) => actor.system === true,
    },
  },
  triggers: {
    expireIdle: { transition: 'expire', when: 'open', after: () => 60_000 },
  },
});

let directory: string;
let service: ReturnType<typeof createJobExecutorService>;
let store: MemoryLifecycleStore;
let jobs: LifecycleJobs;
let runtime: LifecycleRuntime;
let controls: Controls;
let now: number;
let swept: number;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'lifecycle-jobs-'));
  service = createJobExecutorService(undefined, {
    appName: 'main',
    storagePath: path.join(directory, 'jobs'),
  });
  store = new MemoryLifecycleStore();
  now = Date.parse('2026-10-01T09:00:00Z');
  swept = 0;
  controls = { send: () => Promise.resolve({ ok: true }) };
  jobs = createLifecycleJobs({
    jobs: service.getJobExecutor('lifecycle-test'),
    schedule: service.getScheduleExecutor('lifecycle-test'),
    jobName: 'lifecycle-test/effect',
    sweepEveryMs: 100,
    clock: () => new Date(now),
    onSweep: () => {
      swept += 1;
      return Promise.resolve();
    },
  });
  runtime = new LifecycleRuntime({
    store,
    dispatcher: jobs,
    clock: () => new Date(now),
  });
  runtime.register(invoices, { services: controls });
});

afterEach(async () => {
  await jobs.shutdown();
  await service.shutdown();
  await rm(directory, { recursive: true, force: true });
});

async function eventually<T>(
  read: () => Promise<T> | T,
  done: (value: T) => boolean,
): Promise<T> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const value = await read();
    if (done(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('The condition never held.');
}

function invoice(): Invoice {
  return store.insertRecord('invoices', {
    status: 'open',
    statusChangedAt: new Date(now).toISOString(),
    lifecycleVersion: 0,
  }) as Invoice;
}

describe('lifecycle jobs', () => {
  it('runs an effect as a job and retries it after its backoff', async () => {
    await jobs.start(runtime);
    const started: number[] = [];
    controls.send = (attempt) => {
      started.push(Date.now());
      return attempt === 1
        ? Promise.reject(new Error('The mail server is busy.'))
        : Promise.resolve({ ok: true });
    };
    const { id } = invoice();
    await runtime.fire('invoices', id, 'send', { actor: { id: 'clerk' } });
    await eventually(
      () => store.record('invoices', id),
      (record) => record?.status === 'done',
    );
    const [run] = (await runtime.history('invoices', id)).effectRuns;
    expect(run).toMatchObject({ status: 'succeeded', attempts: 2 });
    expect(started[1]! - started[0]!).toBeGreaterThanOrEqual(25);
  });

  it('sweeps on its schedule: triggers fire and the extra work runs', async () => {
    const { id } = invoice();
    now += 2 * 60_000;
    await jobs.start(runtime);
    await eventually(
      () => store.record('invoices', id),
      (record) => record?.status === 'expired',
    );
    await eventually(
      () => swept,
      (count) => count >= 1,
    );
  });

  it('recovers a run an earlier start left queued, and refuses to dispatch before it starts', async () => {
    const { id } = invoice();
    // Fired before start: the dispatch fails, the run stays queued.
    await runtime.fire('invoices', id, 'send', { actor: { id: 'clerk' } });
    expect((await runtime.history('invoices', id)).effectRuns[0]).toMatchObject(
      { status: 'queued' },
    );
    await jobs.start(runtime);
    await eventually(
      () => store.record('invoices', id),
      (record) => record?.status === 'done',
    );
  });
});
