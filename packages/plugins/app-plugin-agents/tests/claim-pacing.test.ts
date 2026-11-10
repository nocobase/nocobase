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

  it('hands out jobs at once, without a run and its wait', async () => {
    const waits: number[] = [];
    h = await createHarness({
      claimPause: (ms) => {
        waits.push(ms);
        return Promise.resolve();
      },
    });
    h.runners.jobs.register('build', {});
    const agent = await h.createAgent({ maxConcurrentRuns: 8 });
    const registered = await h.registerRunner({
      features: ['input', 'checkout', 'secrets', 'jobs.build'],
      slots: 4,
    });
    await h.runners.runners.update(registered.runnerId, { acceptJobs: true });
    await h.enqueue(agent, 'held');
    h.clock.advance(LONG_QUEUED_MS);
    expect(await claim(h, registered, 4)).toHaveLength(1);

    // One of four held: a run would wait a quarter of a second. The job does not: the request takes no run.
    const run = await h.enqueue(agent, 'next');
    await h.runners.jobs.enqueue({
      kind: 'build',
      spec: {
        repo: {
          url: 'https://example.com/acme/app.git',
          ref: 'main',
          sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
        },
        command: { argv: ['pnpm', 'build'] },
        outputs: [],
        timeoutSec: 600,
      },
      actorUserId: 'owner',
    });
    const response = await h.request('POST', api(RUNNER_ROUTES.claim), {
      runnerKey: registered.key,
      body: { free: 3 },
    });
    expect(response.body.data).toMatchObject({
      runs: [],
      jobs: [{ job: { kind: 'build' } }],
    });
    expect(waits.filter((ms) => ms > 0)).toEqual([]);
    expect(await h.services.runs.get(run)).toMatchObject({ status: 'queued' });

    // The runner asks again at once and takes the run after its wait.
    const next = await claim(h, registered, 2);
    expect(next.map((payload) => payload.run.id)).toEqual([run]);
    expect(waits.filter((ms) => ms > 0)).toHaveLength(1);
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

describe('claims paced by the kind of runner the actor prefers', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  async function paced(preference: 'auto' | 'personal' | 'team') {
    const time = virtualTime();
    h = await createHarness({ claimPause: (ms) => time.pause(ms) });
    time.attach(h);
    await h.services.chat.updatePreferences('owner', {
      runnerPreference: preference,
    });
    const agent = await h.createAgent({ maxConcurrentRuns: 8 });
    const team = await h.registerRunner({ name: 'team', slots: 2 });
    const personal = await h.registerRunner({
      name: 'personal',
      trust: 'ownerOnly',
      ownerUserId: 'owner',
      slots: 2,
    });
    return { harness: h, time, agent, team, personal };
  }

  it.each([
    ['personal', 'personal'],
    ['team', 'team'],
  ] as const)(
    'gives a run preferring %s runners to an idle one of that kind',
    async (preference, winner) => {
      const { harness, time, agent, team, personal } = await paced(preference);
      const run = await harness.enqueue(agent);
      const [fromTeam, fromPersonal] = await Promise.all([
        time.drive(team, 1),
        time.drive(personal, 1),
      ]);
      const taken = winner === 'team' ? fromTeam : fromPersonal;
      expect(taken.map((payload) => payload.run.id)).toEqual([run]);
      expect([...fromTeam, ...fromPersonal]).toHaveLength(1);
    },
  );

  it.each([
    ['personal', 'team'],
    ['team', 'personal'],
  ] as const)(
    'lets the other kind take a run preferring %s runners one second after its queueing when none of them can',
    async (preference, other) => {
      const { harness, time, agent, ...runners } = await paced(preference);
      const run = await harness.enqueue(agent);
      const queuedAt = harness.clock.now().getTime();
      // The preferred runner is offline: it never asks.
      const taken = await time.drive(runners[other], 1);
      expect(taken.map((payload) => payload.run.id)).toEqual([run]);
      expect(time.waits).toEqual([1000]);
      expect(harness.clock.now().getTime() - queuedAt).toBe(1000);
    },
  );

  it('lets a shared runner take a run preferring personal runners once the personal one is full', async () => {
    const { harness, time, agent, team, personal } = await paced('personal');
    await harness.enqueue(agent, 'first');
    await harness.enqueue(agent, 'second');
    expect(await time.drive(personal, 2)).toHaveLength(2);

    const run = await harness.enqueue(agent, 'third');
    const queuedAt = harness.clock.now().getTime();
    const [fromTeam, fromPersonal] = await Promise.all([
      time.drive(team, 1),
      time.drive(personal, 1),
    ]);
    expect(fromPersonal).toEqual([]);
    expect(fromTeam.map((payload) => payload.run.id)).toEqual([run]);
    expect(harness.clock.now().getTime() - queuedAt).toBe(1000);
  });

  it('lets a personal runner take a run preferring shared runners once the shared one is full', async () => {
    const { harness, time, agent, team, personal } = await paced('team');
    await harness.enqueue(agent, 'first');
    await harness.enqueue(agent, 'second');
    expect(await time.drive(team, 2)).toHaveLength(2);

    const run = await harness.enqueue(agent, 'third');
    const queuedAt = harness.clock.now().getTime();
    const [fromTeam, fromPersonal] = await Promise.all([
      time.drive(team, 1),
      time.drive(personal, 1),
    ]);
    expect(fromTeam).toEqual([]);
    expect(fromPersonal.map((payload) => payload.run.id)).toEqual([run]);
    expect(harness.clock.now().getTime() - queuedAt).toBeLessThanOrEqual(1000);
  });

  it('gives a run preferring personal runners but holding a variable for shared runners only to a shared runner alone', async () => {
    const { harness, time, agent, team, personal } = await paced('personal');
    await harness.services.variables.set(
      { scope: 'agent', scopeId: agent },
      'TOKEN',
      'synthetic-test-value',
      'owner',
      { teamRunnersOnly: true },
    );
    const run = await harness.enqueue(agent);
    const queuedAt = harness.clock.now().getTime();
    const [fromTeam, fromPersonal] = await Promise.all([
      time.drive(team, 1),
      time.drive(personal, 1),
    ]);
    expect(fromPersonal).toEqual([]);
    expect(fromTeam.map((payload) => payload.run.id)).toEqual([run]);
    expect(fromTeam[0].workspace.env).toEqual([
      { name: 'TOKEN', value: 'synthetic-test-value' },
    ]);
    expect(harness.clock.now().getTime() - queuedAt).toBeLessThanOrEqual(1000);
  });

  it('adds no wait when the actor has no preference', async () => {
    const { harness, time, agent, team } = await paced('auto');
    const run = await harness.enqueue(agent);
    const taken = await time.drive(team, 1);
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    expect(time.waits).toEqual([]);
  });

  it('keeps the preference a run was queued with', async () => {
    const { harness, time, agent, team } = await paced('auto');
    const run = await harness.enqueue(agent);
    await harness.services.chat.updatePreferences('owner', {
      runnerPreference: 'personal',
    });
    const taken = await time.drive(team, 1);
    expect(taken.map((payload) => payload.run.id)).toEqual([run]);
    expect(time.waits).toEqual([]);
  });
});
