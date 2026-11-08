/**
 * Runners share a queue by how busy each is with the run's coding tool, not by who asks first: the runners' route hands
 * out one run per request, and a claim waits until the run has been queued for the share of the tool's limit the
 * runner already runs, times one second (`claimPace`).
 *
 * The waits run on the harness's clock, not the wall clock, so the outcome does not depend on how fast requests are:
 * a waiting claim parks, and once every runner of the test is parked, the clock moves to the earliest moment and that
 * claim goes on (`virtualTime`).
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
  type RegisteredRunner,
} from './harness.js';

const CLAUDE = { kind: 'claude', authenticated: true } as const;
const CODEX = { kind: 'codex', authenticated: true } as const;
/** Longer than any claim's share of a second: work queued this long is taken at once. */
const LONG_QUEUED_MS = 60_000;

/**
 * Claims' waits on the harness clock. `drive` runs one runner the way it polls (`claimRepeatedly`); a wait parks it,
 * and when every driven runner is parked or done, the earliest parked wait moves the clock to its moment and goes on.
 */
function virtualTime() {
  let h: Harness | undefined;
  let running = 0;
  const parked: { at: number; wake: () => void }[] = [];
  const waits: number[] = [];
  const settle = () => {
    if (running > 0 || parked.length === 0) return;
    let next = 0;
    for (let index = 1; index < parked.length; index += 1)
      if (parked[index]!.at < parked[next]!.at) next = index;
    const [{ at, wake }] = parked.splice(next, 1);
    const now = h!.clock.now().getTime();
    if (at > now) h!.clock.advance(at - now);
    running += 1;
    wake();
  };
  return {
    waits,
    attach(harness: Harness) {
      h = harness;
    },
    pause(ms: number): Promise<void> {
      waits.push(ms);
      return new Promise((wake) => {
        parked.push({ at: h!.clock.now().getTime() + ms, wake });
        running -= 1;
        settle();
      });
    },
    async drive(runner: RegisteredRunner, free: number) {
      running += 1;
      try {
        return await claimRepeatedly(h!, runner, free);
      } finally {
        running -= 1;
        settle();
      }
    },
  };
}

describe('claims paced by how busy each runner is with the tool', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  async function paced() {
    const time = virtualTime();
    h = await createHarness({ claimPause: (ms) => time.pause(ms) });
    time.attach(h);
    return { harness: h, time };
  }

  it.each([
    [4, 1, 3],
    [8, 2, 6],
  ])(
    'splits %i runs of one tool between runners with limits 2 and 6 as %i and %i',
    async (runs, small, large) => {
      const { harness, time } = await paced();
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
        time.drive(two, 8),
        time.drive(six, 8),
      ]);
      expect([fromTwo.length, fromSix.length]).toEqual([small, large]);
      expect(
        new Set([...fromTwo, ...fromSix].map((payload) => payload.run.id)).size,
      ).toBe(runs);
    },
  );

  it("takes another tool's run at once while the runner is full of the first", async () => {
    const { harness, time } = await paced();
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
    expect(await time.drive(runner, 6)).toHaveLength(6);
    expect(time.waits).toEqual([]);

    const waiting = await harness.enqueue(claude, 'waiting');
    const run = await harness.enqueue(codex, 'codex');
    const taken = await time.drive(runner, 2);
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    expect(time.waits).toEqual([]);
    expect(await harness.services.runs.get(waiting)).toMatchObject({
      status: 'queued',
    });
  });

  it('hands a lone busy runner a new run within a second of its queueing', async () => {
    const { harness, time } = await paced();
    const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
    const runner = await harness.registerRunner({ slots: 6 });
    for (let index = 0; index < 5; index += 1)
      await harness.enqueue(agent, String(index));
    harness.clock.advance(LONG_QUEUED_MS);
    expect(await time.drive(runner, 6)).toHaveLength(5);

    const run = await harness.enqueue(agent, 'next');
    const queuedAt = harness.clock.now().getTime();
    const taken = await time.drive(runner, 1);
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    // Five of six held: five sixths of a second after the run was queued.
    expect(time.waits).toHaveLength(1);
    expect(time.waits[0]).toBeCloseTo((5 / 6) * 1000, 3);
    expect(harness.clock.now().getTime() - queuedAt).toBeLessThan(1000);
  });

  it('fills an idle runner within a second of the runs entering the queue', async () => {
    const { harness, time } = await paced();
    const agent = await harness.createAgent({ maxConcurrentRuns: 8 });
    const runner = await harness.registerRunner({ slots: 8 });
    const queuedAt = harness.clock.now().getTime();
    for (let index = 0; index < 8; index += 1)
      await harness.enqueue(agent, String(index));
    expect(await time.drive(runner, 8)).toHaveLength(8);
    // Each run is taken at its share of the second after the queueing, not after the previous claim: the eighth at
    // seven eighths of a second, where waits counted from each request would add up to three and a half.
    expect(harness.clock.now().getTime() - queuedAt).toBe((7 / 8) * 1000);
  });

  it('takes nothing when the request ends while it waits', async () => {
    // The request ends once the claim is in its wait, not after a guessed delay.
    let entered: () => void = () => undefined;
    const waiting = new Promise<void>((resolve) => {
      entered = resolve;
    });
    h = await createHarness({
      claimPause: (ms, signal) => {
        if (ms > 0) entered();
        return pause(ms, signal);
      },
    });
    const agent = await h.createAgent({ maxConcurrentRuns: 8 });
    const registered = await h.registerRunner({ slots: 2 });
    await h.enqueue(agent, 'held');
    h.clock.advance(LONG_QUEUED_MS);
    expect(await claim(h, registered, 2)).toHaveLength(1);

    // One of two held: the claim waits half a second, and the request ends first.
    const run = await h.enqueue(agent, 'next');
    const controller = new AbortController();
    const pending = h.app.request(`${api(RUNNER_ROUTES.claim)}?wait=true`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [HEADERS.protocol]: String(PROTOCOL_VERSION),
        [HEADERS.runnerKey]: registered.key,
      },
      body: JSON.stringify({ free: 1 }),
      signal: controller.signal,
    });
    await waiting;
    controller.abort();
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { runs: [] } });
    expect(await h.services.runs.get(run)).toMatchObject({
      status: 'queued',
      runnerId: null,
    });

    h.clock.advance(LONG_QUEUED_MS);
    const next = await claim(h, registered, 1);
    expect(next.map((payload) => payload.run.id)).toEqual([run]);
  });
});
