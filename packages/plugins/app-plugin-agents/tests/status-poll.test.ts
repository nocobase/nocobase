import type { Knex } from 'knex';
import { afterEach, expect, it, vi } from 'vitest';
import { claim, createHarness, type Harness } from './harness.js';
import * as store from '../server/core/runs/run.store.js';

let h: Harness;
afterEach(async () => {
  vi.restoreAllMocks();
  await h?.close();
});

async function readOnly<T>(work: () => Promise<T>, selects: number) {
  const client = await h.database.connection().client<Knex>();
  const sql: string[] = [];
  const listener = (query: { sql: string }) => sql.push(query.sql);
  client.on('query', listener);
  try {
    const result = await work();
    expect(sql).toHaveLength(selects);
    expect(sql.every((query) => /^select\b/iu.test(query))).toBe(true);
    return result;
  } finally {
    client.off('query', listener);
  }
}

it('polls empty, cancelled and terminal runs with one read and resends delivered input with two', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runner = await h.registerRunner();
  const runId = await h.enqueue(agentId);
  await claim(h, runner);
  const identity = { id: runner.runnerId };
  await h.services.reports.start(identity, runId, {
    workDir: '/work',
    acceptsInput: true,
  });
  const poll = () => h.services.reports.status(identity, runId);
  await poll(); // Warm collection metadata on the root connection.
  const old = await readOnly(poll, 2);
  expect(old.inputs).toHaveLength(1);
  expect(await readOnly(poll, 2)).toEqual(old);
  await store.inputsRepo(h.database.connection()).updateMany({
    filter: { runId },
    values: { handledAt: h.clock.now().toISOString() },
  });
  const empty = await readOnly(poll, 1);
  expect(empty).toMatchObject({
    status: 'running',
    cancelRequested: false,
    inputs: [],
  });
  // Expiration alone does not revoke ownership; the sweeper does that.
  h.clock.advance(10 * 60_000);
  expect(await readOnly(poll, 1)).toEqual(empty);
  const http = await readOnly(
    () =>
      h.request('GET', `/agents/runners/runs/${runId}/status`, {
        runnerKey: runner.key,
      }),
    3,
  );
  expect(http.status).toBe(200);
  await h.services.runs.cancel(runId, 'owner');
  await poll(); // Finish the cancellation notification's asynchronous read before measuring.
  expect(await readOnly(poll, 1)).toMatchObject({
    cancelRequested: true,
    inputs: [],
  });
  await h.services.reports.cancelAck(identity, runId, { handledInputIds: [] });
  await poll(); // Finish the terminal notification before measuring the next poll.
  await store.inputsRepo(h.database.connection()).updateMany({
    filter: { runId },
    values: { handledAt: null },
  });
  expect(await readOnly(poll, 1)).toMatchObject({
    status: 'cancelled',
    cancelRequested: true,
    inputs: [],
    leaseExpiresAt: null,
  });
});

it('delivers new input once, preserves ordering on redelivery and revalidates after the pre-read', async () => {
  h = await createHarness();
  const agentId = await h.createAgent();
  const runner = await h.registerRunner();
  const runId = await h.enqueue(agentId);
  await claim(h, runner);
  const identity = { id: runner.runnerId };
  await h.services.reports.start(identity, runId, {
    workDir: '/work',
    acceptsInput: true,
  });
  await h.enqueue(agentId, '1', { text: 'New input' });
  const delivered = await h.services.reports.status(identity, runId);
  expect(delivered.inputs.map((input) => input.text)).toEqual([
    'Please do it.',
    'New input',
  ]);
  expect(
    await readOnly(() => h.services.reports.status(identity, runId), 2),
  ).toEqual(delivered);
  await h.enqueue(agentId, '1', { text: 'After transfer' });
  const pending = store.pendingInputs;
  vi.spyOn(store, 'pendingInputs').mockImplementationOnce(async (conn, id) => {
    const inputs = await pending(conn, id);
    await store.runsRepo(conn).updateMany({
      filter: { id },
      values: { runnerId: null, status: 'queued' },
    });
    return inputs;
  });
  await expect(
    h.services.reports.status(identity, runId),
  ).rejects.toMatchObject({ code: 'LEASE_LOST' });
  expect(
    (await pending(h.database.connection(), runId)).at(-1)?.deliveredAt,
  ).toBeNull();
  await expect(
    h.services.reports.status({ id: 'stranger' }, runId),
  ).rejects.toMatchObject({ code: 'RUN_NOT_OWNED' });
  await expect(
    h.services.reports.status(identity, 'missing'),
  ).rejects.toMatchObject({ code: 'RUN_NOT_OWNED' });
});
