/**
 * Benchmark, not a test: updateMany and deleteMany over 10,000 rows on a
 * file-based SQLite database with no subscription, a keyed one and a
 * count-only one. Skipped unless `EVENTS_BENCH=1`; `EVENTS_BENCH_ROWS` and
 * `EVENTS_BENCH_RUNS` adjust it, and results go to `EVENTS_BENCH_FILE` when
 * set.
 */
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { countStatements, createFixture } from './scenarios.js';

const rows = Number(process.env.EVENTS_BENCH_ROWS ?? 10_000);
const runs = Number(process.env.EVENTS_BENCH_RUNS ?? 7);
type Mode = 'none' | 'keys' | 'count';
const modes: readonly Mode[] = ['none', 'keys', 'count'];

describe.skipIf(process.env.EVENTS_BENCH !== '1')(
  'Repository mutation events: bulk write timing',
  () => {
    it(`updateMany and deleteMany over ${rows} rows`, async () => {
      const results: Record<string, unknown>[] = [];
      for (const operation of ['updateMany', 'deleteMany'] as const) {
        for (const mode of modes) {
          const timings: number[] = [];
          let statements = 0;
          let delivered = 0;
          for (let run = 0; run < runs; run += 1) {
            const fixture = await createFixture({ file: true });
            try {
              await fixture.connection.builder.createCollection(
                'items',
                (c) => {
                  c.increments('id');
                  c.string('status').notNull();
                  c.string('title').notNull();
                  c.integer('rank').notNull();
                },
              );
              const values = Array.from({ length: rows }, (_, index) => ({
                status: 'open',
                title: `item ${index}`,
                rank: index,
              }));
              for (let start = 0; start < rows; start += 500)
                await fixture
                  .knex('items')
                  .insert(values.slice(start, start + 500));
              if (mode !== 'none') {
                fixture.connection.onRepositoryMutation(
                  { collections: ['items'], keys: mode === 'keys' },
                  {
                    afterCommit: (events) => {
                      for (const event of events)
                        delivered +=
                          event.granularity === 'rows'
                            ? event.changes.length
                            : event.count;
                    },
                  },
                );
              }
              const repository = fixture.connection.repository('items');
              // Warm the Collection registry so introspection is not timed.
              expect(await repository.count()).toBe(rows);
              const started = performance.now();
              const counted = await countStatements(fixture.knex, () =>
                operation === 'updateMany'
                  ? repository.updateMany({
                      filter: { status: 'open' },
                      values: { status: 'done' },
                    })
                  : repository.deleteMany({ filter: { status: 'open' } }),
              );
              timings.push(performance.now() - started);
              statements = counted.count;
            } finally {
              await fixture.destroy();
            }
          }
          timings.sort((left, right) => left - right);
          results.push({
            operation,
            mode,
            rows,
            runs,
            medianMs: Number(
              timings[Math.floor(timings.length / 2)]!.toFixed(1),
            ),
            minMs: Number(timings[0]!.toFixed(1)),
            maxMs: Number(timings.at(-1)!.toFixed(1)),
            statements,
            deliveredPerRun: mode === 'none' ? 0 : delivered / runs,
          });
        }
      }
      if (process.env.EVENTS_BENCH_FILE)
        writeFileSync(
          process.env.EVENTS_BENCH_FILE,
          JSON.stringify(results, null, 2),
        );
      console.table(results);
      expect(results).toHaveLength(6);
    }, 600_000);
  },
);
