import { afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});

describe('preserved quota work', () => {
  async function setup() {
    h = await createHarness();
    const binding = h.services.subjects.get('sample')!;
    h.services.subjects.register({
      ...binding,
      kind: 'quota',
      quotaWait: true,
      queuedExpiryMs: 1,
    });
    const agentId = await h.createAgent({ maxAttempts: 1 });
    const runner = await h.registerRunner({
      features: [
        'strictSession',
        'input',
        'checkout',
        'directories',
        'skills',
        'secrets',
      ],
    });
    const queued = await h.services.runs.enqueue({
      agentId,
      subject: { kind: 'quota', id: '1' },
      actorUserId: 'owner',
      input: {
        type: 'signal',
        actor: { kind: 'user', id: 'owner', name: 'Owner' },
        text: 'Continue the step',
      },
    });
    const [payload] = await claim(h, runner);
    expect(payload.run.id).toBe(queued.runId);
    await h.runners.reports.start(
      await h.services.runners.get(runner.runnerId),
      payload.run.id,
      {
        workDir: '/work/original',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      },
    );
    return { runner, runId: payload.run.id };
  }

  it('requeues the same run without consuming its budget and resumes only on the original capable Runner', async () => {
    const { runner, runId } = await setup();
    const machine = await h.services.runners.get(runner.runnerId);
    const reset = new Date(h.clock.now().getTime() + 60_000).toISOString();
    await h.runners.reports.fail(machine, runId, {
      reason: 'toolQuota',
      sessionId: 'original-session',
      quota: {
        windows: [
          {
            scope: 'tool',
            target: 'claude',
            window: 'test',
            exhausted: true,
            resetsAt: reset,
          },
        ],
      },
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'queued',
      runnerPinId: runner.runnerId,
      sessionId: 'original-session',
      availableAt: reset,
    });
    expect(await claim(h, runner)).toEqual([]);
    const other = await h.registerRunner({
      features: ['strictSession', 'input'],
    });
    h.clock.advance(61_000);
    expect(await claim(h, other)).toEqual([]);
    // Expiry cannot destroy a quota wait, including an offline Runner.
    await h.sweep();
    expect((await h.services.runs.get(runId)).status).toBe('queued');
    const [resumed] = await claim(h, runner);
    expect(resumed).toMatchObject({
      run: { id: runId },
      session: { strict: true },
      prompt: { session: 'resume', resumeSessionId: 'original-session' },
    });
  });

  it('keeps unknown resets and unavailable sessions pinned for explicit retry', async () => {
    const { runner, runId } = await setup();
    const machine = await h.services.runners.get(runner.runnerId);
    await h.runners.reports.fail(machine, runId, {
      reason: 'toolQuota',
      sessionId: 'kept',
    });
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'failed',
      runnerPinId: runner.runnerId,
    });
    h.clock.advance(100_000_000);
    expect(await claim(h, runner)).toEqual([]);
    const retry = await h.services.runs.retry(runId, 'owner');
    expect(retry).toMatchObject({
      runnerPinId: runner.runnerId,
      sessionId: 'kept',
      tool: 'claude',
    });
  });

  it('records a replacement once, so the original cannot also be retried or replaced again', async () => {
    const { runner, runId } = await setup();
    const machine = await h.services.runners.get(runner.runnerId);
    await h.runners.reports.fail(machine, runId, {
      reason: 'toolQuota',
      sessionId: 'kept',
    });
    const other = await h.createAgent({ maxAttempts: 1 });
    const replace = () =>
      h.services.runs.enqueue({
        agentId: other,
        subject: { kind: 'quota', id: '1' },
        actorUserId: 'owner',
        runnerId: runner.runnerId,
        freshSession: true,
        replacesRunId: runId,
        input: {
          type: 'signal',
          actor: { kind: 'user', id: 'owner', name: 'Owner' },
          text: 'Take over the step',
        },
      });
    const next = await replace();
    expect(next.outcome).toBe('created');
    expect(await h.services.runs.get(runId)).toMatchObject({
      status: 'cancelled',
      cancelledById: 'owner',
    });
    expect(await h.services.runs.retryInfo(runId)).toMatchObject({
      runId: next.runId,
    });
    await expect(h.services.runs.retry(runId, 'owner')).rejects.toMatchObject({
      code: 'RUN_ALREADY_RETRIED',
    });
    await expect(replace()).rejects.toMatchObject({
      code: 'RUN_ALREADY_RETRIED',
    });
  });

  it('refuses a replacement after the original was retried, and cancels a queued original it replaces', async () => {
    const { runner, runId } = await setup();
    const machine = await h.services.runners.get(runner.runnerId);
    await h.runners.reports.fail(machine, runId, { reason: 'toolQuota' });
    const retry = await h.services.runs.retry(runId, 'owner');
    const other = await h.createAgent({ maxAttempts: 1 });
    const replace = (target: string) =>
      h.services.runs.enqueue({
        agentId: other,
        subject: { kind: 'quota', id: '1' },
        actorUserId: 'owner',
        runnerId: runner.runnerId,
        freshSession: true,
        replacesRunId: target,
        input: {
          type: 'signal',
          actor: { kind: 'user', id: 'owner', name: 'Owner' },
          text: 'Take over the step',
        },
      });
    await expect(replace(runId)).rejects.toMatchObject({
      code: 'RUN_ALREADY_RETRIED',
    });
    // The queued retry is itself replaceable while it waits.
    const next = await replace(retry.id);
    expect(next.outcome).toBe('created');
    expect(await h.services.runs.get(retry.id)).toMatchObject({
      status: 'cancelled',
    });
  });
});
