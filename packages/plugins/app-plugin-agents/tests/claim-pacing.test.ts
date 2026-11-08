/**
 * Runners share a queue by how busy each is with the run's coding tool, not by who asks first: the runners' route hands
 * out one run per request, and a claim waits until the run has been queued for the share of the tool's limit the
 * runner already runs, times one second (`claimPace`). These tests run on the wall clock with real waits.
 */
import {
  HEADERS,
  PROTOCOL_VERSION,
  RUNNER_ROUTES,
} from '@nocobase/agent-protocol';
import { afterEach, describe, expect, it } from 'vitest';

import { pause } from '../server/kernel/clock.js';
import {
  api,
  claim,
  claimRepeatedly,
  createHarness,
  type Harness,
} from './harness.js';

const CLAUDE = { kind: 'claude', authenticated: true } as const;
const CODEX = { kind: 'codex', authenticated: true } as const;
/** Longer than any claim's share of a second: work queued this long is taken at once. */
const LONG_QUEUED_MS = 60_000;

describe('claims paced by how busy each runner is with the tool', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  /** A harness on the wall clock whose claims wait for real, with each wait recorded. */
  async function paced() {
    const waits: number[] = [];
    h = await createHarness({
      realTime: true,
      claimPause: async (ms, signal) => {
        waits.push(ms);
        await pause(ms, signal);
      },
    });
    return { harness: h, waits };
  }

  it.each([
    [4, 1, 3],
    [8, 2, 6],
  ])(
    'splits %i runs of one tool between runners with limits 2 and 6 as %i and %i',
    async (runs, small, large) => {
      const { harness } = await paced();
      const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
      const two = await harness.registerRunner({
        slots: 8,
        toolSlots: { claude: 2 },
      });
      const six = await harness.registerRunner({
        slots: 8,
        toolSlots: { claude: 6 },
      });
      for (let index = 0; index < runs; index += 1)
        await harness.enqueue(agent, String(index));

      const [fromTwo, fromSix] = await Promise.all([
        claimRepeatedly(harness, two, 8),
        claimRepeatedly(harness, six, 8),
      ]);
      expect([fromTwo.length, fromSix.length]).toEqual([small, large]);
      expect(
        new Set([...fromTwo, ...fromSix].map((payload) => payload.run.id)).size,
      ).toBe(runs);
    },
  );

  it("takes another tool's run at once while the runner is full of the first", async () => {
    const { harness, waits } = await paced();
    const claude = await harness.createAgent({ maxConcurrentRuns: 8 });
    const codex = await harness.createAgent({
      modelEntries: [{ tool: 'codex', model: null }],
    });
    const runner = await harness.registerRunner({
      tools: [CLAUDE, CODEX],
      slots: 8,
      toolSlots: { claude: 6, codex: 2 },
    });
    for (let index = 0; index < 6; index += 1)
      await harness.enqueue(claude, String(index));
    harness.clock.advance(LONG_QUEUED_MS);
    expect(await claimRepeatedly(harness, runner, 8)).toHaveLength(6);
    expect(waits).toEqual([]);

    const waiting = await harness.enqueue(claude, 'waiting');
    const run = await harness.enqueue(codex, 'codex');
    const taken = await claim(harness, runner, 2);
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    expect(waits).toEqual([]);
    expect(await harness.services.runs.get(waiting)).toMatchObject({
      status: 'queued',
    });
  });

  it('hands a lone busy runner a new run within a second of its queueing', async () => {
    const { harness, waits } = await paced();
    const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
    const runner = await harness.registerRunner({ slots: 6 });
    for (let index = 0; index < 5; index += 1)
      await harness.enqueue(agent, String(index));
    harness.clock.advance(LONG_QUEUED_MS);
    expect(await claimRepeatedly(harness, runner, 6)).toHaveLength(5);

    const queuedAt = performance.now();
    const run = await harness.enqueue(agent, 'next');
    const taken = await claim(harness, runner, 1);
    const elapsed = performance.now() - queuedAt;
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    // Five of six held: five sixths of a second after the run was queued.
    expect(waits).toHaveLength(1);
    expect(waits[0]).toBeGreaterThan(0);
    expect(waits[0]).toBeLessThanOrEqual((5 / 6) * 1000);
    expect(elapsed).toBeGreaterThanOrEqual((5 / 6) * 1000 - 50);
  });

  it('fills an idle runner within a second of the runs entering the queue', async () => {
    const { harness, waits } = await paced();
    const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
    const runner = await harness.registerRunner({ slots: 8 });
    const queuedAt = performance.now();
    for (let index = 0; index < 8; index += 1)
      await harness.enqueue(agent, String(index));
    expect(await claimRepeatedly(harness, runner, 8)).toHaveLength(8);
    // Each run is taken at its share of the second after the queueing, not after the previous claim's.
    expect(waits.reduce((sum, ms) => sum + ms, 0)).toBeLessThan((7 / 8) * 1000);
    expect(performance.now() - queuedAt).toBeGreaterThanOrEqual(
      (7 / 8) * 1000 - 50,
    );
  });

  it('takes nothing when the request ends while it waits', async () => {
    const { harness, waits } = await paced();
    const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
    const registered = await harness.registerRunner({ slots: 2 });
    await harness.enqueue(agent, 'held');
    harness.clock.advance(LONG_QUEUED_MS);
    expect(await claim(harness, registered, 2)).toHaveLength(1);

    const run = await harness.enqueue(agent, 'next');
    const controller = new AbortController();
    const started = performance.now();
    const pending = harness.app.request(
      `${api(RUNNER_ROUTES.claim)}?wait=true`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [HEADERS.protocol]: String(PROTOCOL_VERSION),
          [HEADERS.runnerKey]: registered.key,
        },
        body: JSON.stringify({ free: 1 }),
        signal: controller.signal,
      },
    );
    setTimeout(() => controller.abort(), 100);
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { runs: [] } });
    // It ended with the request, before its half-second turn.
    expect(performance.now() - started).toBeLessThan(450);
    expect(waits).toHaveLength(1);
    expect(await harness.services.runs.get(run)).toMatchObject({
      status: 'queued',
      runnerId: null,
    });

    const next = await claim(harness, registered, 1);
    expect(next.map((payload) => payload.run.id)).toEqual([run]);
  });
});
