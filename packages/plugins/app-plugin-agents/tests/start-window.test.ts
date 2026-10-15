import { afterEach, expect, it } from 'vitest';
import { TIMINGS } from '@nocobase/agent-protocol';
import {
  claim,
  createHarness,
  type Harness,
  type RegisteredRunner,
} from './harness.js';

let h: Harness;
afterEach(async () => {
  await h?.close();
});
const start = {
  workDir: '/work/sample',
  adapter: { kind: 'claude' },
  acceptsInput: true,
};
async function heartbeat(runner: RegisteredRunner) {
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
}

it.each([46_000, 299_000])(
  'starts after a delayed batch delivery of %i ms while the runtime is online',
  async (delay) => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxConcurrentRuns: 10 });
    const runner = await h.registerRunner({ slots: 2 });
    const runId = await h.enqueue(agentId, 'first');
    await h.enqueue(agentId, 'second');
    let prepared = 0;
    h.services.briefs.sections.register({
      key: 'slow-preparation',
      prepare: async () => {
        if (++prepared === 2) {
          h.clock.advance(delay);
          await heartbeat(runner);
        }
      },
      section: async () => null,
    });
    expect(await claim(h, runner, 2)).toHaveLength(2);
    expect(await h.sweep()).toMatchObject({ requeued: 0, failed: 0 });
    expect(
      await h.services.reports.start({ id: runner.runnerId }, runId, start),
    ).toMatchObject({ status: 'running' });
    expect(await h.services.runs.get(runId)).toMatchObject({
      attempt: 1,
      status: 'running',
    });
  },
);

it('requeues at five minutes despite a renewed lease, without finishing the agent work', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runId = await h.enqueue(agentId);
  const runner = await h.registerRunner();
  await claim(h, runner);
  h.clock.advance(46_000);
  await heartbeat(runner);
  const renewed = await h.services.reports.lease(
    { id: runner.runnerId },
    runId,
  );
  expect(Date.parse(renewed.leaseExpiresAt) - h.clock.now().getTime()).toBe(
    TIMINGS.startTimeoutMs - 46_000,
  );
  h.clock.advance(TIMINGS.startTimeoutMs - 46_000);
  await heartbeat(runner);
  await h.services.reports.lease({ id: runner.runnerId }, runId);
  expect(await h.sweep()).toMatchObject({ requeued: 1, failed: 0 });
  expect(await h.services.runs.get(runId)).toMatchObject({
    status: 'queued',
    attempt: 2,
    failureReason: 'startTimeout',
    availableAt: null,
  });
  expect(h.finished).toEqual([]);
});

it('hands an offline runtime’s unstarted work and all unhandled messages to another compatible runtime immediately', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runId = await h.enqueue(agentId, 'first', { text: 'CI failed' });
  const runner = await h.registerRunner();
  const [first] = await claim(h, runner);
  // Already delivered by claim, never acknowledged as handled.
  await h.enqueue(agentId, 'first', { text: 'New message during dispatch' });
  h.clock.advance(TIMINGS.offlineAfterMs + 1);
  const survivor = await h.registerRunner({ name: 'survivor' });
  expect(await h.sweep()).toMatchObject({ requeued: 1, failed: 0 });
  expect(await h.services.runs.get(runId)).toMatchObject({
    failureReason: 'runnerOfflineBeforeStart',
  });
  await h.enqueue(agentId, 'first', { text: 'New message while queued' });
  const [next] = await claim(h, survivor);
  expect(next.run).toMatchObject({ id: runId, attempt: 2 });
  expect(await h.services.runs.get(runId)).toMatchObject({ agentId });
  expect(next.inputs.map((input) => input.text)).toEqual([
    'CI failed',
    'New message during dispatch',
    'New message while queued',
  ]);
  expect(next.inputs[0].id).toBe(first.inputs[0].id);
  expect(h.finished).toEqual([]);
  await expect(
    h.services.reports.start({ id: runner.runnerId }, runId, start),
  ).rejects.toMatchObject({ code: 'LEASE_LOST' });
});

it.each(['startTimeout', 'runnerOfflineBeforeStart'])(
  'does not spend or reset real failures across repeated %s interruptions',
  async (reason) => {
    h = await createHarness();
    const agentId = await h.createAgent({ maxAttempts: 2 });
    const runId = await h.enqueue(agentId);
    let runner = await h.registerRunner();
    await claim(h, runner);
    await h.services.reports.start({ id: runner.runnerId }, runId, start);
    expect(
      await h.services.reports.fail({ id: runner.runnerId }, runId, {
        reason: 'toolNetwork',
      }),
    ).toMatchObject({ status: 'queued' });
    h.clock.advance(30_000);
    for (let index = 0; index < 5; index++) {
      await heartbeat(runner);
      expect(await claim(h, runner)).toHaveLength(1);
      if (reason === 'runnerOfflineBeforeStart') {
        h.clock.advance(TIMINGS.offlineAfterMs + 1);
        runner = await h.registerRunner({ name: `survivor-${index}` });
      } else {
        h.clock.advance(TIMINGS.startTimeoutMs);
        await heartbeat(runner);
      }
      expect(await h.sweep()).toMatchObject({ requeued: 1, failed: 0 });
      expect(h.finished).toEqual([]);
    }
    await claim(h, runner);
    await h.services.reports.start({ id: runner.runnerId }, runId, start);
    expect(
      await h.services.reports.fail({ id: runner.runnerId }, runId, {
        reason: 'toolNetwork',
      }),
    ).toMatchObject({ status: 'failed' });
    expect(h.finished).toHaveLength(1);
    expect(h.finished[0]).toMatchObject({
      attempt: 7,
      failureReason: 'toolNetwork',
    });
  },
);
