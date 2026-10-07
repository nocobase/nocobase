import { JobPayloadSchema, type RunnerFeature } from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import type { Job } from '../../shared/jobs.js';
import type { JobChange } from '../../server/jobs/index.js';
import {
  createHarness,
  type Harness,
  type RegisteredRunner,
  type RunnerOptions,
} from './harness.js';

const SHA = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const JOB_FEATURES: RunnerFeature[] = ['checkout', 'secrets', 'jobs.build'];

const buildSpec = {
  repo: { url: 'https://example.com/acme/app.git', ref: 'main', sha: SHA },
  command: { argv: ['pnpm', 'build'] },
  env: [{ name: 'NODE_ENV', value: 'production' }],
  outputs: [
    {
      path: 'dist.tgz',
      upload: { url: '/upload', method: 'POST', headers: {} },
    },
  ],
  timeoutSec: 600,
};

const buildResult = {
  kind: 'build',
  sha: SHA,
  exitCode: 0,
  durationMs: 1000,
  outputs: [
    {
      path: 'dist.tgz',
      sha256: 'f'.repeat(64),
      size: 10,
      upload: { status: 201, body: { id: 'rel1' } },
    },
  ],
};

describe('jobs', () => {
  let h: Harness;
  let done: Job[];
  let events: number;
  afterEach(async () => {
    await h?.close();
  });

  async function setUp(): Promise<void> {
    h = await createHarness();
    done = [];
    events = 0;
    h.services.jobs.register('build', {
      onDone: (_tx, job) => {
        done.push(job);
        return Promise.resolve();
      },
      onEvent: (_job, added) => {
        events += added.length;
      },
    });
  }

  /** A runner that reports the job features and whose owner let it take jobs. */
  async function jobRunner(
    options: RunnerOptions = {},
  ): Promise<RegisteredRunner> {
    const runner = await h.registerRunner({
      features: JOB_FEATURES,
      ...options,
    });
    await h.services.runners.update(runner.runnerId, { acceptJobs: true });
    return runner;
  }

  const enqueue = (overrides: Record<string, unknown> = {}) =>
    h.services.jobs.enqueue({
      kind: 'build',
      spec: buildSpec,
      actorUserId: 'owner',
      title: 'Build SMP-1',
      subject: { kind: 'preview', id: 'p1' },
      ...overrides,
    });

  const claimJobs = async (runner: RegisteredRunner, free = 1) => {
    const response = await h.request('POST', '/agents/runners/claim', {
      runnerKey: runner.key,
      body: { free },
    });
    expect(response.status).toBe(200);
    return (response.body.data.jobs ?? []) as any[];
  };

  const post = (
    runner: RegisteredRunner,
    jobId: string,
    action: string,
    body: unknown = {},
  ) =>
    h.request('POST', `/agents/runners/jobs/${jobId}/${action}`, {
      runnerKey: runner.key,
      body,
    });

  it('refuses kinds nobody registered and specs that do not fit', async () => {
    await setUp();
    await expect(
      h.services.jobs.enqueue({ kind: 'deploy', spec: {}, actorUserId: 'u' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      enqueue({ spec: { ...buildSpec, workdir: '../outside' } }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    await expect(
      enqueue({ spec: { ...buildSpec, repo: { url: 'x' } } }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
    expect(() => h.services.jobs.register('preview', {})).toThrow(
      /names no executor/u,
    );
    expect(() => h.services.jobs.register('build', {})).toThrow(
      /already registered/u,
    );
    h.services.jobs.register('acme.preview', {
      executor: 'build',
      validate: (spec) => {
        if ((spec as { app?: unknown }).app !== 'a1')
          throw new Error('Which app?');
        return spec;
      },
      prepare: () => Promise.resolve(buildSpec),
    });
    await expect(
      h.services.jobs.enqueue({
        kind: 'acme.preview',
        spec: { app: 'a2' },
        actorUserId: 'u',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST', message: 'Which app?' });
    expect(
      (
        await h.services.jobs.enqueue({
          kind: 'acme.preview',
          spec: { app: 'a1' },
          actorUserId: 'u',
        })
      ).executor,
    ).toBe('build');
  });

  it('hands a job only to a runner that has the feature and was allowed to take jobs', async () => {
    await setUp();
    const job = await enqueue();
    expect(job).toMatchObject({
      status: 'queued',
      kind: 'build',
      executor: 'build',
      attempt: 1,
      maxAttempts: 2,
      via: 'human',
    });

    // No job feature: runs only.
    const plain = await h.registerRunner();
    await h.services.runners.update(plain.runnerId, { acceptJobs: true });
    expect(await claimJobs(plain)).toEqual([]);

    // The feature, but nobody allowed it: off by default, for team runners too.
    const capable = await h.registerRunner({ features: JOB_FEATURES });
    expect((await h.services.runners.get(capable.runnerId)).acceptJobs).toBe(
      false,
    );
    expect(await claimJobs(capable)).toEqual([]);

    // Someone else's personal runner does not take the owner's job, even when allowed.
    const personal = await jobRunner({
      trust: 'ownerOnly',
      ownerUserId: 'alice',
    });
    expect(await claimJobs(personal)).toEqual([]);

    // Its owner turns the switch on through the admin API.
    const patched = await h.request(
      'PATCH',
      `/agents/runners/${capable.runnerId}`,
      { user: 'owner', body: { acceptJobs: true } },
    );
    expect(patched.status).toBe(200);
    expect(patched.body.data.acceptJobs).toBe(true);
    const [payload] = await claimJobs(capable);
    expect(JobPayloadSchema.parse(payload)).toEqual(payload);
    expect(payload).toMatchObject({
      job: {
        id: job.id,
        kind: 'build',
        attempt: 1,
        maxAttempts: 2,
        firstSeq: 1,
        requires: ['jobs.build'],
        spec: { repo: { sha: SHA }, command: { argv: ['pnpm', 'build'] } },
      },
      app: { id: 'acme', name: 'Acme' },
      title: 'Build SMP-1',
    });
    expect((await h.services.jobs.get(job.id)).status).toBe('dispatched');
    expect(await claimJobs(capable)).toEqual([]);

    // A job that names runners waits for them.
    const named = await enqueue({ runnerIds: [personal.runnerId] });
    expect(await claimJobs(await jobRunner())).toEqual([]);
    const own = await enqueue({
      runnerIds: [personal.runnerId],
      actorUserId: 'alice',
    });
    expect((await claimJobs(personal, 2)).map((item) => item.job.id)).toEqual([
      own.id,
    ]);
    expect((await h.services.jobs.get(named.id)).status).toBe('queued');
  });

  it('opens the stored variables a job names through the secret source, for the runner that takes it', async () => {
    await setUp();
    const stored = new Map([
      ['workdir\u0000repo1\u0000NPM_TOKEN', 'npm_secret'],
      ['workdir\u0000repo1\u0000REPO_TOKEN', 'ghs_secret'],
    ]);
    const deliveries: { names: string[]; jobId: string; runnerId: string }[] =
      [];
    h.services.jobs.provideSecrets({
      open(_conn, refs, delivery) {
        deliveries.push({ names: refs.map((ref) => ref.name), ...delivery });
        return Promise.resolve(
          new Map(
            refs.flatMap((ref) => {
              const key = `${ref.scope}\u0000${ref.scopeId}\u0000${ref.name}`;
              const value = stored.get(key);
              return value === undefined ? [] : [[key, value] as const];
            }),
          ),
        );
      },
    });
    const job = await enqueue({
      spec: {
        ...buildSpec,
        repo: {
          ...buildSpec.repo,
          credentials: {
            scope: 'workdir',
            scopeId: 'repo1',
            name: 'REPO_TOKEN',
            username: 'x-access-token',
          },
        },
        env: [
          { name: 'NODE_ENV', value: 'production' },
          {
            name: 'NPM_TOKEN',
            secret: { scope: 'workdir', scopeId: 'repo1', name: 'NPM_TOKEN' },
          },
        ],
      },
    });
    // The stored job keeps the reference, never the value.
    const record = await h.database
      .connection()
      .repository<{ spec: unknown }>('agJobs')
      .findOne({ filter: { id: job.id } });
    expect(JSON.stringify(record?.spec)).not.toContain('npm_secret');

    // A runner without the `secrets` feature does not get it.
    const noSecrets = await jobRunner({ features: ['jobs.build'] });
    expect(await claimJobs(noSecrets)).toEqual([]);

    const runner = await jobRunner();
    const [payload] = await claimJobs(runner);
    expect(payload.job.requires).toEqual(['jobs.build', 'secrets']);
    expect(payload.job.spec.repo.auth).toEqual({
      token: 'ghs_secret',
      username: 'x-access-token',
    });
    expect(payload.job.spec.env).toEqual([
      { name: 'NODE_ENV', value: 'production' },
      { name: 'NPM_TOKEN', value: 'npm_secret', secret: true },
    ]);
    expect(deliveries).toEqual([
      {
        names: expect.arrayContaining(['NPM_TOKEN', 'REPO_TOKEN']),
        jobId: job.id,
        runnerId: runner.runnerId,
      },
    ]);
  });

  it('prepares the spec at claim, and fails a job that cannot be prepared', async () => {
    await setUp();
    let tickets = 0;
    let broken = false;
    h.services.jobs.register('acme.release', {
      executor: 'build',
      prepare: ({ spec, runner }) => {
        if (broken) return Promise.reject(new Error('The app is gone.'));
        tickets += 1;
        return Promise.resolve({
          ...buildSpec,
          outputs: [
            {
              path: 'dist.tgz',
              upload: {
                url: `/upload/${(spec as { app: string }).app}`,
                method: 'PUT',
                headers: {
                  authorization: `Bearer ticket-${tickets}-${runner.id}`,
                },
              },
            },
          ],
        });
      },
    });
    await h.services.jobs.enqueue({
      kind: 'acme.release',
      spec: { app: 'a1' },
      actorUserId: 'owner',
    });
    const runner = await jobRunner();
    const [payload] = await claimJobs(runner);
    expect(payload.job.spec.outputs[0].upload).toEqual({
      url: '/upload/a1',
      method: 'PUT',
      headers: { authorization: `Bearer ticket-1-${runner.runnerId}` },
    });

    broken = true;
    const failing = await h.services.jobs.enqueue({
      kind: 'acme.release',
      spec: { app: 'a2' },
      actorUserId: 'owner',
    });
    for (let i = 0; i < 3; i += 1) expect(await claimJobs(runner)).toEqual([]);
    expect(await h.services.jobs.get(failing.id)).toMatchObject({
      status: 'failed',
      failureReason: 'setupFailed',
      failureDetail: 'The app is gone.',
    });
  });

  it('runs from start to completion, recording events once and telling the application', async () => {
    await setUp();
    const job = await enqueue();
    const runner = await jobRunner();
    const changes: JobChange[] = [];
    const stop = h.services.jobs.watch(job.id, (change) =>
      changes.push(change),
    );
    await claimJobs(runner);
    const started = await post(runner, job.id, 'start', {
      workDir: '/work/jobs/1',
    });
    expect(started.body.data).toMatchObject({
      status: 'running',
      cancelRequested: false,
    });
    const batch = [
      {
        seq: 1,
        at: '2026-10-01T00:00:01.000Z',
        type: 'phase',
        phase: 'checkout',
      },
      {
        seq: 2,
        at: '2026-10-01T00:00:02.000Z',
        type: 'log',
        stream: 'stdout',
        content: 'building',
      },
    ];
    expect(
      (await post(runner, job.id, 'events', { events: batch })).body.data,
    ).toEqual({ accepted: 2, duplicates: 0, cancelRequested: false });
    expect(
      (await post(runner, job.id, 'events', { events: batch })).body.data,
    ).toMatchObject({ accepted: 0, duplicates: 2 });
    expect(events).toBe(2);
    expect((await post(runner, job.id, 'lease')).body.data).toMatchObject({
      status: 'running',
      cancelRequested: false,
    });
    // The result must be a build's: another kind is refused.
    expect(
      (
        await post(runner, job.id, 'complete', {
          result: {
            kind: 'git.check',
            target: 'main',
            targetSha: SHA,
            commits: [],
          },
        })
      ).status,
    ).toBe(400);
    const completed = await post(runner, job.id, 'complete', {
      result: buildResult,
    });
    expect(completed.body.data).toEqual({ status: 'completed' });
    stop();

    const ended = await h.services.jobs.get(job.id);
    expect(ended).toMatchObject({
      status: 'completed',
      sha: SHA,
      exitCode: 0,
      result: buildResult,
      runnerId: runner.runnerId,
      subject: { kind: 'preview', id: 'p1' },
    });
    expect(done.map((item) => item.status)).toEqual(['completed']);
    expect(changes).toEqual([
      { type: 'status', jobId: job.id, status: 'dispatched' },
      { type: 'status', jobId: job.id, status: 'running' },
      { type: 'events', jobId: job.id, lastSeq: 2 },
      { type: 'status', jobId: job.id, status: 'completed' },
    ]);
    expect(
      (await h.services.jobs.events(job.id)).map((event) => event.content),
    ).toEqual([null, 'building']);
    // The runner may still ask how it ended; reporting more is refused.
    const status = await h.request(
      'GET',
      `/agents/runners/jobs/${job.id}/status`,
      {
        runnerKey: runner.key,
      },
    );
    expect(status.body.data).toMatchObject({ status: 'completed' });
    expect((await post(runner, job.id, 'lease')).body.error.reason).toBe(
      'RUN_NOT_ACTIVE',
    );
  });

  it('retries a retryable failure and fails the rest with what the runner reported', async () => {
    await setUp();
    const job = await enqueue();
    const runner = await jobRunner();
    await claimJobs(runner);
    await post(runner, job.id, 'start');
    const retried = await post(runner, job.id, 'fail', {
      reason: 'checkoutFailed',
      detail: 'Could not reach the remote.',
    });
    expect(retried.body.data.status).toBe('queued');
    h.clock.advance(60_000);
    const [again] = await claimJobs(runner);
    expect(again.job).toMatchObject({ id: job.id, attempt: 2 });
    await post(runner, job.id, 'start');
    const failed = await post(runner, job.id, 'fail', {
      reason: 'commandFailed',
      detail: 'exit 2',
      exitCode: 2,
      sha: SHA,
    });
    expect(failed.body.data).toEqual({ status: 'failed' });
    expect(await h.services.jobs.get(job.id)).toMatchObject({
      status: 'failed',
      failureReason: 'commandFailed',
      exitCode: 2,
      sha: SHA,
    });
    expect(done).toHaveLength(1);
  });

  it('takes jobs back from runners that went silent or lost their lease', async () => {
    await setUp();
    const job = await enqueue();
    const first = await jobRunner();
    await claimJobs(first);
    await post(first, job.id, 'start');
    h.clock.advance(46_000);
    // Keep the runner online; only the lease lapsed.
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: first.key,
      body: {
        version: '1',
        features: JOB_FEATURES,
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        jobs: [{ jobId: job.id }],
        load: { slots: 2, free: 1 },
      },
    });
    const report = await h.services.sweeper.sweep();
    expect(report.jobs).toEqual({ requeued: 1, failed: 0, cancelled: 0 });
    // The runner that lost it is told so, another that never had it is told it does not hold it.
    expect(
      (await post(first, job.id, 'events', { events: [] })).body.error.reason,
    ).toBe('LEASE_LOST');
    const second = await jobRunner();
    expect((await post(second, job.id, 'lease')).body.error.reason).toBe(
      'RUN_NOT_OWNED',
    );
    // A heartbeat naming the job it lost is told to release it.
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: first.key,
      body: {
        version: '1',
        features: JOB_FEATURES,
        tools: [],
        active: [],
        jobs: [{ jobId: job.id }],
        load: { slots: 2, free: 1 },
      },
    });
    expect(beat.body.data.jobs).toEqual({
      cancelRequested: [],
      release: [job.id],
    });

    // The last attempt's runner goes offline: no attempt is left, so the job fails.
    const [payload] = await claimJobs(second);
    expect(payload.job.attempt).toBe(2);
    h.clock.advance(151_000);
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: first.key,
      body: {
        version: '1',
        features: JOB_FEATURES,
        tools: [],
        active: [],
        load: { slots: 2, free: 2 },
      },
    });
    expect((await h.services.sweeper.sweep()).jobs).toMatchObject({
      failed: 1,
    });
    expect(await h.services.jobs.get(job.id)).toMatchObject({
      status: 'failed',
      failureReason: 'runnerOffline',
    });
  });

  it('cancels a queued job at once and a held one through its runner', async () => {
    await setUp();
    const queued = await enqueue();
    expect((await h.services.jobs.cancel(queued.id, 'owner')).status).toBe(
      'cancelled',
    );
    expect(done.map((job) => job.id)).toEqual([queued.id]);

    const held = await enqueue();
    const runner = await jobRunner();
    await claimJobs(runner);
    await post(runner, held.id, 'start');
    const requested = await h.services.jobs.cancel(held.id, 'owner');
    expect(requested).toMatchObject({
      status: 'running',
      cancelledById: 'owner',
    });
    expect(requested.cancelRequestedAt).not.toBeNull();
    expect(
      (await post(runner, held.id, 'lease')).body.data.cancelRequested,
    ).toBe(true);
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '1',
        features: JOB_FEATURES,
        tools: [],
        active: [],
        jobs: [{ jobId: held.id }],
        load: { slots: 2, free: 1 },
      },
    });
    expect(beat.body.data.jobs).toEqual({
      cancelRequested: [held.id],
      release: [],
    });
    // A failure after a cancel is the cancel.
    expect((await post(runner, held.id, 'cancelAck')).body.data).toEqual({
      status: 'cancelled',
    });

    // A runner that never acknowledges: the sweeper records the cancel after the grace period.
    const stuck = await enqueue();
    await claimJobs(runner);
    await h.services.jobs.cancel(stuck.id, null);
    h.clock.advance(30_000);
    await post(runner, stuck.id, 'lease');
    h.clock.advance(31_000);
    await post(runner, stuck.id, 'lease');
    expect((await h.services.sweeper.sweep()).jobs.cancelled).toBe(1);
    expect((await h.services.jobs.get(stuck.id)).status).toBe('cancelled');
  });

  it('fails a job its runner let run far past its timeout', async () => {
    await setUp();
    const job = await enqueue({ spec: { ...buildSpec, timeoutSec: 60 } });
    const runner = await jobRunner();
    await claimJobs(runner);
    await post(runner, job.id, 'start');
    for (let i = 0; i < 12; i += 1) {
      h.clock.advance(15_000);
      await post(runner, job.id, 'lease');
    }
    await h.services.sweeper.sweep();
    expect(await h.services.jobs.get(job.id)).toMatchObject({
      status: 'failed',
      failureReason: 'jobTimeout',
    });
  });

  it('still serves a runner of protocol 3, which is never handed a job', async () => {
    await setUp();
    await enqueue();
    await h.enqueue(await h.createAgent());
    const runner = await h.registerRunner();
    const response = await h.request('POST', '/agents/runners/claim', {
      runnerKey: runner.key,
      headers: { 'x-nocobase-protocol': '3' },
      body: { free: 2 },
    });
    expect(response.status).toBe(200);
    expect(response.body.data.runs).toHaveLength(1);
    expect(response.body.data).not.toHaveProperty('jobs');
    // A runner of protocol 2 is kept connected but needs an upgrade: no work.
    const old = await h.request('POST', '/agents/runners/claim', {
      runnerKey: runner.key,
      headers: { 'x-nocobase-protocol': '2' },
      body: { free: 1 },
    });
    expect(old.status).toBe(200);
    expect(old.body.data).toEqual({ runs: [] });
  });
});
