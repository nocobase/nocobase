import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createRunDataPurge,
  runRetentionDays,
} from '../server/core/runs/run-data-purge.js';
import { createTxRunner } from '../server/kernel/tx.js';
import { createHarness, type Harness } from './harness.js';

const NOW = Date.parse('2026-10-14T12:00:00Z');
const OLD = '2026-09-01T00:00:00Z';
const CUTOFF = '2026-09-30T12:00:00Z';

describe('run process data retention', () => {
  let h: Harness;
  afterEach(async () => h?.close());

  it('defaults to 14 days, accepts zero and rejects invalid values', () => {
    expect(runRetentionDays(undefined)).toBe(14);
    expect(runRetentionDays(0)).toBe(0);
    for (const value of [-1, 1.5, '14', null, false, NaN, Infinity])
      expect(() => runRetentionDays(value)).toThrow('retentionDays');
  });

  function purge(
    days = 14,
    overrides: {
      now?: () => number;
      pause?: (ms: number) => Promise<unknown>;
    } = {},
  ) {
    return createRunDataPurge({
      tx: createTxRunner(h.database, h.services.events),
      retentionDays: () => days,
      now: () => NOW,
      pause: async () => undefined,
      ...overrides,
    });
  }

  async function fixture(count: number) {
    h = await createHarness();
    const agent = await h.createAgent();
    const id = await h.enqueue(agent);
    const conn = h.database.connection();
    const template = await conn.query
      .selectFrom('agRuns')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
    await conn.query
      .updateTable('agRuns')
      .set({ status: 'completed', finishedAt: OLD, summary: 'Delivery kept' })
      .where('id', '=', id)
      .execute();
    for (let start = 1; start < count; start += 100) {
      await conn.query
        .insertInto('agRuns')
        .values(
          Array.from({ length: Math.min(100, count - start) }, (_, offset) => ({
            ...template,
            id: `purge-${String(start + offset).padStart(5, '0')}`,
            status: 'completed',
            finishedAt: OLD,
          })),
        )
        .execute();
    }
    const ids = [
      id,
      ...Array.from(
        { length: count - 1 },
        (_, i) => `purge-${String(i + 1).padStart(5, '0')}`,
      ),
    ];
    for (let start = 0; start < ids.length; start += 50) {
      const batch = ids.slice(start, start + 50);
      await conn.query
        .insertInto('agRunEvents')
        .values(
          batch.map((runId) => ({
            id: `event-${runId}`,
            runId,
            seq: 1,
            at: OLD,
            type: 'text',
            content: 'Synthetic',
            createdAt: OLD,
          })),
        )
        .execute();
      await conn.query
        .insertInto('agRunBriefs')
        .values(
          batch.map((runId) => ({
            id: `brief-${runId}`,
            runId,
            attempt: 1,
            system: '',
            task: '',
            context: '',
            agent: '',
            turn: '',
            prompt: 'Synthetic',
            createdAt: OLD,
          })),
        )
        .execute();
    }
    return ids;
  }

  it('deletes only strictly expired terminal process data and keeps run records and inputs unchanged', async () => {
    const ids = await fixture(12);
    const conn = h.database.connection();
    const cases = [
      ['completed', OLD],
      ['failed', OLD],
      ['cancelled', OLD],
      ['running', OLD],
      ['queued', OLD],
      ['dispatched', OLD],
      ['completed', CUTOFF],
      ['completed', '2026-10-14T00:00:00Z'],
      ['completed', null],
      ['completed', OLD],
      ['completed', OLD],
      ['completed', OLD],
    ];
    for (const [i, [status, finishedAt]] of cases.entries())
      await conn.query
        .updateTable('agRuns')
        .set({ status, finishedAt })
        .where('id', '=', ids[i]!)
        .execute();
    await conn.query
      .deleteFrom('agRunEvents')
      .where('runId', '=', ids[9]!)
      .execute();
    await conn.query
      .deleteFrom('agRunBriefs')
      .where('runId', '=', ids[10]!)
      .execute();
    for (const table of ['agRunEvents', 'agRunBriefs'])
      await conn.query
        .deleteFrom(table)
        .where('runId', '=', ids[11]!)
        .execute();
    await conn.query
      .insertInto('agRunUsage')
      .values({
        id: 'usage-kept',
        runId: ids[0]!,
        tool: 'claude',
        inputTokens: 42,
        outputTokens: 17,
        createdAt: OLD,
      })
      .execute();
    await conn.query
      .insertInto('agRunRepos')
      .values({
        id: 'repo-kept',
        runId: ids[0]!,
        url: 'https://example.com/synthetic/repo.git',
        branch: 'delivery',
        pushed: true,
        updatedAt: OLD,
      })
      .execute();
    const usage = await conn.query
      .selectFrom('agRunUsage')
      .selectAll()
      .execute();
    const repos = await conn.query
      .selectFrom('agRunRepos')
      .selectAll()
      .execute();
    const before = await conn.query
      .selectFrom('agRuns')
      .selectAll()
      .orderBy('id')
      .execute();
    const inputs = await conn.query
      .selectFrom('agRunInputs')
      .selectAll()
      .execute();
    expect(await purge(0)()).toBe(0);
    expect(await purge()()).toBe(5);
    expect(await purge()()).toBe(0);
    expect(
      await conn.query.selectFrom('agRuns').selectAll().orderBy('id').execute(),
    ).toEqual(before);
    expect(
      await conn.query.selectFrom('agRunInputs').selectAll().execute(),
    ).toEqual(inputs);
    expect(
      await conn.query.selectFrom('agRunUsage').selectAll().execute(),
    ).toEqual(usage);
    expect(
      await conn.query.selectFrom('agRunRepos').selectAll().execute(),
    ).toEqual(repos);
    for (const table of ['agRunEvents', 'agRunBriefs']) {
      const remaining = await conn.query
        .selectFrom(table)
        .select('runId')
        .orderBy('runId')
        .execute();
      expect(remaining.map((r) => String(r.runId))).toEqual(
        ids.slice(3, 9).sort(),
      );
    }
  });

  it('uses batches of 200, pauses between transactions and caps each round at 2000', async () => {
    await fixture(2001);
    const sleep = vi.fn(async () => {
      const count = await h.database
        .connection()
        .query.selectFrom('agRunBriefs')
        .select('id')
        .execute();
      expect(count.length % 200).toBe(1);
    });
    expect(await purge(14, { pause: sleep })()).toBe(2000);
    expect(sleep).toHaveBeenCalledTimes(9);
    expect(sleep).toHaveBeenCalledWith(100);
    expect(await purge()()).toBe(1);
  });

  it('stops starting batches at the soft deadline', async () => {
    await fixture(201);
    let time = NOW;
    const sleep = vi.fn(async () => {
      time += 5 * 60_000;
    });
    expect(await purge(14, { now: () => time, pause: sleep })()).toBe(200);
    expect(await purge()()).toBe(1);
  });

  it('rolls back both child table deletions when a batch fails', async () => {
    await fixture(1);
    const base = createTxRunner(h.database, h.services.events);
    const failing = createRunDataPurge({
      tx: {
        read: base.read,
        run: (fn) =>
          base.run(async (unit) => {
            await fn(unit);
            throw new Error('Synthetic batch failure');
          }),
      },
      retentionDays: () => 14,
      now: () => NOW,
    });
    await expect(failing()).rejects.toThrow('Synthetic batch failure');
    for (const table of ['agRunEvents', 'agRunBriefs'])
      expect(
        await h.database
          .connection()
          .query.selectFrom(table)
          .select('id')
          .execute(),
      ).toHaveLength(1);
    expect(await purge()()).toBe(1);
  });

  it('does not read business tables when disabled', async () => {
    const tx = { read: vi.fn(), run: vi.fn() };
    expect(await createRunDataPurge({ tx, retentionDays: () => 0 })()).toBe(0);
    expect(tx.read).not.toHaveBeenCalled();
    expect(tx.run).not.toHaveBeenCalled();
  });
});
