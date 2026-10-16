import type { Knex } from 'knex';
import { afterEach, describe, expect, it } from 'vitest';

import { claim, createHarness, type Harness } from './harness.js';

/** Held and queued runs of one kind: `held` running ones that reported twice, then `queued` waiting ones. */
async function seed(h: Harness, held: number, queued: number) {
  const runner = await h.registerRunner({ slots: held });
  const agent = await h.createAgent({ maxConcurrentRuns: held });
  for (let index = 0; index < held; index += 1)
    await h.enqueue(agent, `held-${index}`);
  const payloads = await claim(h, runner, held);
  expect(payloads).toHaveLength(held);
  for (const payload of payloads) {
    const runId = payload.run.id as string;
    await h.request('POST', `/agents/runners/runs/${runId}/start`, {
      runnerKey: runner.key,
      body: {
        workDir: '/w',
        adapter: { kind: 'claude' },
        acceptsInput: true,
      },
    });
    await h.request('POST', `/agents/runners/runs/${runId}/events`, {
      runnerKey: runner.key,
      body: {
        events: [1, 2].map((seq) => ({
          seq,
          at: new Date().toISOString(),
          type: 'text',
          content: `${runId} step ${seq}`,
        })),
      },
    });
  }
  const waiting: string[] = [];
  for (let index = 0; index < queued; index += 1)
    waiting.push(await h.enqueue(agent, `queued-${index}`));
  return { waiting };
}

async function countQueries(h: Harness, action: () => Promise<unknown>) {
  const client = await h.database.connection().client<Knex>();
  let count = 0;
  const listener = () => {
    count += 1;
  };
  client.on('query', listener);
  try {
    await action();
  } finally {
    client.off('query', listener);
  }
  return count;
}

describe('the workload read', () => {
  let h: Harness | undefined;
  afterEach(async () => {
    await h?.close();
    h = undefined;
  });

  async function measure(held: number, queued: number) {
    h = await createHarness();
    const { waiting } = await seed(h, held, queued);
    const harness = h;
    const queries = await countQueries(harness, () =>
      harness.services.runs.workload({ subjectKind: 'sample' }),
    );
    const workload = await harness.services.runs.workload({
      subjectKind: 'sample',
    });
    const exact = await harness.services.runs.queueWait(waiting[0]!);
    await harness.close();
    h = undefined;
    return { queries, workload, exact };
  }

  it('reads a fixed number of times whatever the number of held and queued runs', async () => {
    const small = await measure(1, 1);
    const large = await measure(4, 6);
    expect(large.queries).toBe(small.queries);

    const running = large.workload.runs.filter(
      (run) => run.status === 'running',
    );
    expect(running).toHaveLength(4);
    // Each held run shows its own newest report.
    for (const run of running)
      expect(run.lastActivity?.text).toBe(`${run.id} step 2`);
    const queued = large.workload.runs.filter((run) => run.status === 'queued');
    expect(queued).toHaveLength(6);
    expect(queued[0]?.wait).toMatchObject({
      reason: 'concurrencyFull',
      position: 1,
    });
    // One run's exact wait carries the same place in the claim order.
    expect(large.exact).toMatchObject({ position: 1, agentPosition: 1 });
  });

  it('answers no exact wait for a run that is not queued', async () => {
    h = await createHarness();
    expect(await h.services.runs.queueWait('missing')).toBeNull();
  });
});
