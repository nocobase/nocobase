import { writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { setTimeout as sleep } from 'node:timers/promises';
import { Client } from 'pg';
import type { Knex } from 'knex';
import { expect, test } from 'vitest';
import { testDatabaseDialect } from '@nocobase/app-testing/server';
import { createJobExecutorService } from '@nocobase/jobs';

import { createHarness } from '../harness.js';
import { createRunDataPurge } from '../../server/core/runs/run-data-purge.js';
import { createTxRunner, type TxRunner } from '../../server/kernel/tx.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';

/** Run with NOCOBASE_TEST_DB_DIALECT=postgres, POSTGRES_PORT and PM386_REPORT_DIR. */
test('measures the production cleanup on synthetic PostgreSQL data and shared Redis scheduling', async () => {
  expect(testDatabaseDialect()).toBe('postgres');
  const report: Record<string, unknown> = {
    cpu: cpus()[0]?.model,
    logicalCpus: cpus().length,
    memoryBytes: totalmem(),
    cache: 'Warm after synthetic data insertion; OS caches were not flushed.',
    scenarios: [],
  };
  for (const scenario of [
    { name: 'uniform', runs: 3500, perRun: 80, oversized: 0 },
    { name: 'skewed', runs: 500, perRun: 80, oversized: 140000 },
  ]) {
    const h = await createHarness();
    const monitor = new Client({
      host: process.env.POSTGRES_HOST ?? '127.0.0.1',
      port: Number(process.env.POSTGRES_PORT),
      user: 'nocobase',
      password: 'nocobase',
      database: 'nocobase_collection_builder',
      application_name: 'pm386-lock-monitor',
    });
    try {
      await monitor.connect();
      const conn = h.database.connection();
      const knex = await conn.client<Knex>();
      const schema = String(
        (await knex.raw('select current_schema() as name')).rows[0].name,
      );
      const q = `"${schema}"`;
      report.postgres = (await knex.raw('select version()')).rows[0].version;
      const agent = await h.createAgent();
      const id = await h.enqueue(agent);
      const template = await conn.query
        .selectFrom('agRuns')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirstOrThrow();
      const old = '2026-09-01T00:00:00Z';
      await conn.query
        .updateTable('agRuns')
        .set({ status: 'completed', finishedAt: old })
        .where('id', '=', id)
        .execute();
      for (let start = 1; start < scenario.runs; start += 100)
        await conn.query
          .insertInto('agRuns')
          .values(
            Array.from(
              { length: Math.min(100, scenario.runs - start) },
              (_, offset) => ({
                ...template,
                id: `bench-${String(start + offset).padStart(5, '0')}`,
                status: 'completed',
                finishedAt: old,
              }),
            ),
          )
          .execute();
      await knex.raw(`insert into ${q}.ag_run_events (id,run_id,seq,at,type,output,created_at)
        select r.id || '-' || s, r.id, s, now(), 'toolResult',
          (select string_agg(md5(r.id || '-' || s || '-' || k),'') from generate_series(1,48) k), now()
        from ${q}.ag_runs r cross join generate_series(1,${scenario.perRun}) s`);
      if (scenario.oversized)
        await knex.raw(`insert into ${q}.ag_run_events (id,run_id,seq,at,type,output,created_at)
          select '${id}-' || s, '${id}', s, now(), 'toolResult',
            (select string_agg(md5('skew-' || s || '-' || k),'') from generate_series(1,48) k), now()
          from generate_series(${scenario.perRun + 1},${scenario.perRun + scenario.oversized}) s`);
      await knex.raw(`insert into ${q}.ag_run_briefs (id,run_id,attempt,system,task,context,agent,turn,prompt,created_at)
        select 'brief-' || r.id,r.id,1,'','','','','',
          (select string_agg(md5(r.id || '-' || k),'') from generate_series(1,1875) k),now() from ${q}.ag_runs r`);
      await knex.raw(`analyze ${q}.ag_runs`);
      await knex.raw(`analyze ${q}.ag_run_events`);
      await knex.raw(`analyze ${q}.ag_run_briefs`);
      const size = (
        await knex.raw(`select pg_total_relation_size('${q}.ag_run_events') as events_bytes,
        pg_total_relation_size('${q}.ag_run_briefs') as briefs_bytes`)
      ).rows[0];
      const plan = (
        await knex.raw(`explain (analyze,buffers,format json) select id,finished_at from ${q}.ag_runs r
        where status in ('completed','failed','cancelled') and finished_at < now() - interval '14 days'
        and (exists(select 1 from ${q}.ag_run_events e where e.run_id=r.id) or exists(select 1 from ${q}.ag_run_briefs b where b.run_id=r.id))
        order by finished_at,id limit 200`)
      ).rows;
      const stats = async () => ({
        database: (
          await monitor.query(
            'select blks_read,blks_hit,temp_bytes,blk_read_time,blk_write_time from pg_stat_database where datname=current_database()',
          )
        ).rows[0],
        wal: (
          await monitor.query(
            'select wal_records,wal_fpi,wal_bytes from pg_stat_wal',
          )
        ).rows[0],
        io: (
          await monitor.query(
            "select backend_type,object,context,reads,writes,writebacks,extends,op_bytes,hits,evictions from pg_stat_io where backend_type='client backend'",
          )
        ).rows,
      });
      const before = await stats();
      let sampling = true;
      let samples = 0;
      const lockWaits: unknown[] = [];
      const sampler = (async () => {
        while (sampling) {
          // This benchmark owns a dedicated PostgreSQL container. The query adapter uses search_path, so
          // production DELETE statements need not contain the schema name.
          const result = await monitor.query(
            "select pid,wait_event,query from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and pid<>pg_backend_pid() and (query like '%ag_run_events%' or query like '%ag_run_briefs%' or query like '%ag_runs%')",
          );
          samples++;
          lockWaits.push(...result.rows);
          await sleep(2);
        }
      })();
      const batches: unknown[] = [];
      const base = createTxRunner(h.database, h.services.events);
      const tx: TxRunner = {
        read: base.read,
        run: async (fn) => {
          const start = performance.now();
          let deletes = 0;
          let ids = 0;
          const onQuery = (query: {
            sql: string;
            bindings?: readonly unknown[];
          }) => {
            if (/^delete /u.test(query.sql)) {
              deletes++;
              ids = query.bindings?.length ?? 0;
            }
          };
          knex.on('query', onQuery);
          try {
            return await base.run(async (unit) => {
              const client = await unit.conn.client<Knex>();
              await client.raw("set local lock_timeout = '100ms'");
              return fn(unit);
            });
          } finally {
            knex.off('query', onQuery);
            batches.push({
              runs: ids,
              deletes,
              transactionMs: performance.now() - start,
            });
          }
        },
      };
      const start = performance.now();
      let count: number;
      try {
        count = await createRunDataPurge({ tx, retentionDays: () => 14 })();
      } finally {
        sampling = false;
        await sampler;
      }
      const roundMs = performance.now() - start;
      await knex.raw('select pg_stat_force_next_flush()');
      await sleep(1000);
      const after = await stats();
      const remaining = await conn.query
        .selectFrom('agRunBriefs')
        .select('id')
        .execute();
      expect(count).toBe(Math.min(2000, scenario.runs));
      expect(remaining).toHaveLength(scenario.runs - count);
      expect(lockWaits).toHaveLength(0);
      (report.scenarios as unknown[]).push({
        ...scenario,
        events: scenario.runs * scenario.perRun + scenario.oversized,
        size,
        batches,
        count,
        roundMs,
        samples,
        lockWaits,
        lockTimeoutFailures: 0,
        before,
        after,
        plan,
      });
      await writeFile(
        `${process.env.PM386_REPORT_DIR}/postgres-retention.json`,
        JSON.stringify(report, null, 2),
      );
    } finally {
      await monitor.end();
      await h.close();
    }
  }
  const services = [0, 1].map(() =>
    createJobExecutorService(
      {
        default: 'redis',
        redis: {
          adapter: 'redis',
          connection: {
            host: '127.0.0.1',
            port: Number(process.env.REDIS_PORT),
          },
          namespace: `pm386-${process.pid}`,
        },
      },
      { appName: 'pm386', storagePath: process.env.PM386_REPORT_DIR! },
    ),
  );
  const firings: { instance: number; jobId: string }[] = [];
  try {
    for (const [index, service] of services.entries()) {
      const executor = service.getScheduleExecutor(ACCESS_NAMESPACE);
      await executor.addJob({
        name: 'RunDataPurge',
        options: { every: 300 },
        payload: {},
        execute: async ({ jobId }) => {
          firings.push({ instance: index, jobId });
        },
      });
      await executor.setup();
    }
    const deadline = Date.now() + 10_000;
    while (firings.length < 8 && Date.now() < deadline) await sleep(50);
    expect(firings.length).toBeGreaterThanOrEqual(8);
  } finally {
    await Promise.all(services.map((s) => s.shutdown()));
  }
  expect(new Set(firings.map((f) => f.jobId)).size).toBe(firings.length);
  report.redisFirings = firings;
  await writeFile(
    `${process.env.PM386_REPORT_DIR}/postgres-retention.json`,
    JSON.stringify(report, null, 2),
  );
});
