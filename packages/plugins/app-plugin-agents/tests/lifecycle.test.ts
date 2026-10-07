import { afterEach, describe, expect, it } from 'vitest';

import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

const start = {
  workDir: '/work/SMP-1',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};

describe('run lifecycle', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  async function claimed(): Promise<{
    runner: RegisteredRunner;
    runId: string;
    token: string;
    inputIds: string[];
  }> {
    const agentId = await h.createAgent();
    await h.enqueue(agentId, '1');
    const runner = await h.registerRunner();
    const [payload] = await claim(h, runner);
    return {
      runner,
      runId: payload.run.id,
      token: payload.cli.credential.content.token,
      inputIds: payload.inputs.map((input: { id: string }) => input.id),
    };
  }

  const post = (
    runner: RegisteredRunner,
    runId: string,
    action: string,
    body: unknown = {},
  ) =>
    h.request('POST', `/agents/runners/runs/${runId}/${action}`, {
      runnerKey: runner.key,
      body,
    });

  it('runs from start to completion, recording events once', async () => {
    h = await createHarness();
    const { runner, runId, inputIds } = await claimed();
    const started = await post(runner, runId, 'start', start);
    expect(started.body.data).toMatchObject({
      status: 'running',
      cancelRequested: false,
    });

    const events = [
      { seq: 1, at: '2026-10-01T00:00:01.000Z', type: 'text', content: 'Hi' },
      {
        seq: 2,
        at: '2026-10-01T00:00:02.000Z',
        type: 'toolUse',
        tool: 'Bash',
        input: { command: 'ls' },
      },
    ];
    expect((await post(runner, runId, 'events', { events })).body.data).toEqual(
      {
        accepted: 2,
        duplicates: 0,
        cancelRequested: false,
      },
    );
    // A resent batch is stored once.
    expect(
      (
        await post(runner, runId, 'events', {
          events: [
            ...events,
            { seq: 3, at: 'x', type: 'text', content: 'Bye' },
          ],
        })
      ).body.data,
    ).toMatchObject({ accepted: 1, duplicates: 2 });
    const page = await h.services.runs.events(runId, 0, 100);
    expect(page.events.map((event) => event.seq)).toEqual([1, 2, 3]);
    expect(page.events[1]).toMatchObject({
      tool: 'Bash',
      input: { command: 'ls' },
    });

    const done = await post(runner, runId, 'complete', {
      summary: 'Fixed.',
      handledInputIds: inputIds,
      usage: [
        { tool: 'claude', model: 'opus', inputTokens: 10, outputTokens: 5 },
      ],
      sessionId: 'session-1',
      repos: [
        {
          url: 'git@x:a/b.git',
          branch: 'agent/SMP-1',
          pushed: true,
          headSha: 'abc',
        },
      ],
    });
    expect(done.status).toBe(200);
    expect(done.body.data).toEqual({ status: 'completed' });
    const detail = await h.services.runs.detail(runId);
    expect(detail).toMatchObject({
      status: 'completed',
      summary: 'Fixed.',
      repos: [{ branch: 'agent/SMP-1', pushed: true }],
      usage: [{ tool: 'claude', inputTokens: 10, outputTokens: 5 }],
    });
    expect(detail.inputs.every((input) => input.handledAt)).toBe(true);
    expect(h.finished.map((run) => run.status)).toEqual(['completed']);

    // Reports after the end are refused.
    const late = await post(runner, runId, 'events', {
      events: [{ seq: 4, at: 'x', type: 'text' }],
    });
    expect(late.status).toBe(400);
    expect(late.body.error.reason).toBe('RUN_NOT_ACTIVE');
  });

  it('delivers input added while a run is dispatched or running, and fences completion on it', async () => {
    h = await createHarness();
    const { runner, runId, inputIds } = await claimed();
    const whileDispatched = await h.services.runs.addInput(runId, {
      type: 'comment',
      actor: { kind: 'user', id: 'bob', name: 'Bob' },
      text: 'Also update the docs.',
    });
    const lease = await post(runner, runId, 'lease');
    expect(
      lease.body.data.inputs.map((input: { id: string }) => input.id),
    ).toEqual([...inputIds, whileDispatched]);

    await post(runner, runId, 'start', start);
    const whileRunning = await h.services.runs.enqueue({
      agentId: (await h.services.runs.get(runId)).agentId,
      subject: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'bob', name: 'Bob' },
        text: 'And the changelog.',
      },
    });
    expect(whileRunning).toMatchObject({ runId, outcome: 'appended' });
    const status = await h.request(
      'GET',
      `/agents/runners/runs/${runId}/status`,
      {
        runnerKey: runner.key,
      },
    );
    expect(
      status.body.data.inputs.map((input: { text: string }) => input.text),
    ).toEqual(['Please do it.', 'Also update the docs.', 'And the changelog.']);

    const early = await post(runner, runId, 'complete', {
      summary: 'Done.',
      handledInputIds: [...inputIds, whileDispatched],
    });
    expect(early.status).toBe(400);
    expect(early.body.error).toMatchObject({
      reason: 'RUN_INPUT_PENDING',
      metadata: { inputIds: [whileRunning.inputId] },
    });
    expect((await h.services.runs.get(runId)).status).toBe('running');

    const complete = await post(runner, runId, 'complete', {
      summary: 'Done.',
      handledInputIds: [...inputIds, whileDispatched, whileRunning.inputId],
    });
    expect(complete.body.data.status).toBe('completed');
  });

  it('asks the runner to stop a cancelled run and records the acknowledgement', async () => {
    h = await createHarness();
    const { runner, runId } = await claimed();
    await post(runner, runId, 'start', start);
    const cancelled = await h.services.runs.cancel(runId, 'owner');
    expect(cancelled.cancelRequestedAt).not.toBeNull();
    expect(cancelled.status).toBe('running');

    const status = await h.request(
      'GET',
      `/agents/runners/runs/${runId}/status`,
      {
        runnerKey: runner.key,
      },
    );
    expect(status.body.data.cancelRequested).toBe(true);
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '1',
        features: ['input'],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [{ runId }, { runId: 'gone' }],
        load: { slots: 2, free: 1 },
      },
    });
    expect(beat.body.data).toMatchObject({
      cancelRequested: [runId],
      release: ['gone'],
    });

    const ack = await post(runner, runId, 'cancelAck', {});
    expect(ack.body.data).toEqual({ status: 'cancelled' });
    expect(h.finished.map((run) => run.status)).toEqual(['cancelled']);
  });

  it('cancels a queued run at once, and records an unacknowledged cancellation after the grace period', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const queued = await h.enqueue(agentId, '9');
    expect((await h.services.runs.cancel(queued, 'owner')).status).toBe(
      'cancelled',
    );

    const { runId } = await claimed();
    await h.services.runs.cancel(runId, 'owner');
    h.clock.advance(61_000);
    // The runner stays in touch, but never acknowledges.
    await h.sweep();
    expect((await h.services.runs.get(runId)).status).toBe('cancelled');
  });

  it('retries a retryable failure after a back-off, then fails when attempts run out', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxAttempts: 2 });
    const runId = await h.enqueue(agentId);
    const runner = await h.registerRunner();
    await claim(h, runner);
    await post(runner, runId, 'start', start);
    await post(runner, runId, 'events', {
      events: [{ seq: 1, at: 'x', type: 'text' }],
    });
    const failed = await post(runner, runId, 'fail', {
      reason: 'toolRateLimit',
      detail: 'Slow down.',
    });
    expect(failed.body.data).toEqual({
      status: 'queued',
      retryAt: '2026-10-01T00:00:30.000Z',
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      attempt: 2,
      runnerId: null,
    });
    // Not before the back-off.
    expect(await claim(h, runner)).toEqual([]);
    h.clock.advance(30_000);
    const [again] = await claim(h, runner);
    expect(again.run).toMatchObject({ id: runId, attempt: 2, firstSeq: 2 });

    await post(runner, runId, 'start', start);
    const final = await post(runner, runId, 'fail', { reason: 'toolNetwork' });
    expect(final.body.data).toEqual({ status: 'failed' });
    expect(h.finished.map((run) => [run.status, run.failureReason])).toEqual([
      ['failed', 'toolNetwork'],
    ]);
  });

  it('fails a non-retryable failure at once', async () => {
    h = await createHarness();
    const { runner, runId } = await claimed();
    const failed = await post(runner, runId, 'fail', { reason: 'toolAuth' });
    expect(failed.body.data).toEqual({ status: 'failed' });
  });

  it('takes back a run whose lease lapsed, and the old runner learns it lost the run', async () => {
    h = await createHarness();
    const { runner, runId } = await claimed();
    await post(runner, runId, 'start', start);
    h.clock.advance(30_000);
    expect((await post(runner, runId, 'lease')).status).toBe(200);
    h.clock.advance(46_000);
    // The runner keeps its heartbeat but stopped renewing the lease.
    await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '1',
        features: ['input'],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [],
        load: { slots: 2, free: 2 },
      },
    });
    const report = await h.sweep();
    expect(report.requeued).toBe(1);
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      attempt: 2,
      failureReason: 'leaseExpired',
    });
    const lost = await post(runner, runId, 'events', {
      events: [{ seq: 9, at: 'x', type: 'text' }],
    });
    expect(lost.status).toBe(409);
    expect(lost.body.error.reason).toBe('LEASE_LOST');
  });

  it('recovers the runs of a runner killed outright', async () => {
    h = await createHarness();
    const { runner, runId, token } = await claimed();
    await post(runner, runId, 'start', start);
    expect(
      (await h.request('GET', '/agents/runs/current', { runToken: token }))
        .status,
    ).toBe(200);

    // kill -9: no heartbeat, no lease, no report for 150 seconds.
    h.clock.advance(151_000);
    const survivor = await h.registerRunner({ name: 'survivor' });
    const report = await h.sweep();
    expect(report).toMatchObject({ runnersOffline: 1, requeued: 1 });
    expect(
      (await h.request('GET', '/agents/runs/current', { runToken: token }))
        .status,
    ).toBe(401);

    const [taken] = await claim(h, survivor);
    expect(taken.run).toMatchObject({ id: runId, attempt: 2 });

    // The restarted runner reports its orphan and is told to let it go.
    const beat = await h.request('POST', '/agents/runners/heartbeat', {
      runnerKey: runner.key,
      body: {
        version: '1',
        features: ['input'],
        tools: [{ kind: 'claude', authenticated: true }],
        active: [{ runId }],
        load: { slots: 2, free: 1 },
      },
    });
    expect(beat.body.data.release).toEqual([runId]);
    const orphan = await post(runner, runId, 'fail', {
      reason: 'leaseExpired',
    });
    expect(orphan.body.error.reason).toBe('LEASE_LOST');
  });

  it('serves the run to its token while the run is held, and the context again', async () => {
    h = await createHarness();
    const { runner, runId, token, inputIds } = await claimed();
    const self = await h.request('GET', '/agents/runs/current', {
      runToken: token,
    });
    expect(self.body.data).toMatchObject({
      runId,
      status: 'dispatched',
      subjectRef: { kind: 'sample', id: '1' },
      actorUserId: 'owner',
      cancelRequested: false,
    });
    expect(
      self.body.data.inputs.map((input: { id: string }) => input.id),
    ).toEqual(inputIds);
    expect(
      (
        await h.request('GET', '/agents/runs/current/context', {
          runToken: token,
        })
      ).body.data,
    ).toEqual({ sampleId: '1' });
    expect(
      (await h.request('GET', '/agents/runs/current', { runToken: 'fgr_bad' }))
        .status,
    ).toBe(401);

    await post(runner, runId, 'complete', {
      summary: '',
      handledInputIds: inputIds,
    });
    const after = await h.request('GET', '/agents/runs/current', {
      runToken: token,
    });
    expect(after.status).toBe(401);
    expect(after.body.error.reason).toBe('RUN_TOKEN_INVALID');
  });

  it('refuses a runner that never held the run', async () => {
    h = await createHarness();
    const { runId } = await claimed();
    const stranger = await h.registerRunner({ name: 'stranger' });
    const response = await post(stranger, runId, 'lease');
    expect(response.status).toBe(403);
    expect(response.body.error.reason).toBe('RUN_NOT_OWNED');
  });

  it('fails a run that reports nothing for twice its idle timeout', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({
      toolPolicy: { idleTimeoutMs: 60_000 },
    });
    const runId = await h.enqueue(agentId);
    const runner = await h.registerRunner();
    await claim(h, runner);
    await post(runner, runId, 'start', start);
    for (let i = 0; i < 5; i += 1) {
      h.clock.advance(30_000);
      await post(runner, runId, 'lease');
    }
    await h.sweep();
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'failed',
      failureReason: 'idleTimeout',
    });
  });

  const work = (
    agentId: string,
    subjectId: string,
    extra: { priority?: number; fireAt?: string; kind?: string } = {},
  ) =>
    h.services.runs.enqueue({
      agentId,
      subject: { kind: extra.kind ?? 'sample', id: subjectId },
      actorUserId: 'owner',
      ...(extra.priority === undefined ? {} : { priority: extra.priority }),
      ...(extra.fireAt === undefined ? {} : { fireAt: extra.fireAt }),
      input: {
        type: 'comment',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Please do it.',
      },
    });

  it('claims the most urgent run first, and raises a waiting run to the work merged into it', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 5 });
    const low = await work(agentId, '1', { priority: 0 });
    const urgent = await work(agentId, '2', { priority: -4 });
    const raised = await work(agentId, '3', { priority: 0 });
    expect((await work(agentId, '3', { priority: -5 })).outcome).toBe('merged');
    expect((await h.services.runs.get(raised.runId)).priority).toBe(-5);
    // Merging less urgent work leaves it.
    await work(agentId, '3', { priority: 2 });
    expect((await h.services.runs.get(raised.runId)).priority).toBe(-5);

    const runner = await h.registerRunner({ slots: 5 });
    const claimed = [];
    for (let i = 0; i < 3; i += 1)
      claimed.push(...(await claim(h, runner)).map((p) => p.run.id));
    expect(claimed).toEqual([raised.runId, urgent.runId, low.runId]);
  });

  it('holds a delayed run until its moment, unless work for now is merged into it', async () => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 5 });
    const delayed = await work(agentId, '1', {
      fireAt: '2026-10-01T00:10:00.000Z',
    });
    const merged = await work(agentId, '2', {
      fireAt: '2026-10-01T00:10:00.000Z',
    });
    await work(agentId, '2');
    // A moment already past is now.
    const past = await work(agentId, '3', {
      fireAt: '2026-09-30T00:00:00.000Z',
    });
    expect(await h.services.runs.get(past.runId)).toMatchObject({
      availableAt: null,
    });

    const runner = await h.registerRunner({ slots: 5 });
    const first = (await claim(h, runner, 5)).map((p) => p.run.id).sort();
    expect(first).toEqual([merged.runId, past.runId].sort());
    h.clock.advance(10 * 60_000);
    expect((await claim(h, runner, 5)).map((p) => p.run.id)).toEqual([
      delayed.runId,
    ]);
    await expect(
      work(agentId, '4', { fireAt: 'not a date' }),
    ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('keeps why queued work was withdrawn', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const queued = await work(agentId, '1');
    const [ended] = await h.services.runs.withdrawQueued({
      subject: { kind: 'sample', id: '1' },
      byUserId: null,
      detail: 'The sample waits for another.',
    });
    expect(ended).toMatchObject({
      id: queued.runId,
      status: 'cancelled',
      failureReason: 'cancelled',
      failureDetail: 'The sample waits for another.',
    });
  });

  it('fails a queued run that waited longer than its subject allows', async () => {
    h = await createHarness();
    h.services.subjects.register({
      kind: 'expiring',
      queuedExpiryMs: 60 * 60_000,
      context: {
        assemble: () => Promise.reject(new Error('Not claimed here.')),
      },
    });
    const agentId = await h.createAgent({ maxConcurrentRuns: 5 });
    const stale = await work(agentId, '1', { kind: 'expiring' });
    const delayed = await work(agentId, '2', {
      kind: 'expiring',
      fireAt: '2026-10-01T00:50:00.000Z',
    });
    // Subjects without an expiry wait however long it takes.
    const patient = await work(agentId, '3');
    h.clock.advance(61 * 60_000);
    await h.sweep();
    expect(await h.services.runs.get(stale.runId)).toMatchObject({
      status: 'failed',
      failureReason: 'queuedExpired',
    });
    // Counted from when the delayed run became claimable.
    expect((await h.services.runs.get(delayed.runId)).status).toBe('queued');
    expect((await h.services.runs.get(patient.runId)).status).toBe('queued');
    h.clock.advance(50 * 60_000);
    await h.sweep();
    expect((await h.services.runs.get(delayed.runId)).status).toBe('failed');
  });

  it('cancels the queued runs of an archived agent', async () => {
    h = await createHarness();
    const agentId = await h.createAgent();
    const runId = await h.enqueue(agentId);
    await h.services.agents.archive(agentId, 'owner');
    await h.sweep();
    expect((await h.services.runs.get(runId)).status).toBe('cancelled');
  });
});
