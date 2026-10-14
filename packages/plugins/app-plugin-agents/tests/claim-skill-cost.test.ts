import { writeFileSync } from 'node:fs';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { claim, createHarness, skillMd, type Harness } from './harness.js';
import { replaceAttachments } from '../server/core/skills/skill.store.js';

interface QueryEvent {
  sql: string;
  __knexTxId?: string;
}
interface Queries {
  on(event: 'query', callback: (query: QueryEvent) => void): void;
  off(event: 'query', callback: (query: QueryEvent) => void): void;
  raw(sql: string): Promise<{ rows: { name?: string; query?: string }[] }>;
}
let h: Harness;
afterEach(async () => {
  await h?.close();
});

// Opt-in complete-claim measurements, identical fixtures on the base and implementation.
const measure = process.env.PM387_COST_REPORT ? describe : describe.skip;
measure('complete claim skill cost', () => {
  const report: Record<string, unknown>[] = [];
  for (const scenario of [
    'empty',
    'one',
    'many',
    'duplicate',
    'no-candidate',
    'multi-candidate',
  ]) {
    for (let sample = 0; sample < 3; sample += 1) {
      it(`${scenario} sample ${sample}`, async () => {
        h = await createHarness();
        const runner = await h.registerRunner();
        h.scopes = [{ scope: 'project', scopeId: 'p' }];
        const count =
          scenario === 'many'
            ? 3
            : ['one', 'duplicate'].includes(scenario)
              ? 1
              : 0;
        const skillIds: string[] = [];
        for (let index = 0; index < count; index += 1)
          skillIds.push(
            (
              await h.services.skills.create('owner', {
                content: skillMd(`team-${index}`, 'Team rules.'),
              })
            ).id,
          );
        await replaceAttachments(
          h.database.connection(),
          'global',
          'default',
          skillIds,
          () => `g-${skillIds.length}-${Math.random()}`,
          new Date().toISOString(),
        );
        if (scenario === 'duplicate')
          await replaceAttachments(
            h.database.connection(),
            'project',
            'p',
            skillIds,
            () => 'project-attachment',
            new Date().toISOString(),
          );
        if (scenario === 'multi-candidate') {
          for (let index = 0; index < 3; index += 1)
            await h.enqueue(
              await h.createAgent({
                modelEntries: [{ tool: 'codex', model: null }],
              }),
              `filtered-${index}`,
            );
        }
        if (scenario !== 'no-candidate')
          await h.enqueue(await h.createAgent(), 'ready');
        const knex = await h.database.connection().client<Queries>();
        const counters = {
          select: 0,
          writes: 0,
          begin: 0,
          commit: 0,
          rollback: 0,
          explicitLocks: 0,
          lockSamples: 0,
        };
        const onQuery = ({ sql }: QueryEvent) => {
          if (sql.includes('pg_stat_activity')) return;
          if (/^\s*(select|with)\b/iu.test(sql)) counters.select += 1;
          if (/^\s*(insert|update|delete)\b/iu.test(sql)) counters.writes += 1;
          if (/^\s*begin\b/iu.test(sql)) counters.begin += 1;
          if (/^\s*commit\b/iu.test(sql)) counters.commit += 1;
          if (/^\s*rollback\b/iu.test(sql)) counters.rollback += 1;
          if (/for update|lock table/iu.test(sql)) counters.explicitLocks += 1;
        };
        let sampling = process.env.NOCOBASE_TEST_DB_DIALECT === 'postgres';
        const schema = sampling
          ? (await knex.raw('select current_schema() as name')).rows[0]!.name
          : '';
        const sampler = (async () => {
          while (sampling) {
            const result = await knex.raw(
              "select query from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock'",
            );
            counters.lockSamples += result.rows.filter((row) =>
              String(row.query).includes(`"${schema}".`),
            ).length;
            await new Promise((resolve) => setTimeout(resolve, 2));
          }
        })();
        knex.on('query', onQuery);
        const start = performance.now();
        const runs = await claim(h, runner);
        const elapsedMs = performance.now() - start;
        knex.off('query', onQuery);
        sampling = false;
        await sampler;
        expect(runs).toHaveLength(scenario === 'no-candidate' ? 0 : 1);
        report.push({
          scenario,
          sample,
          ...counters,
          elapsedMs: Number(elapsedMs.toFixed(2)),
        });
        await h.close();
        h = undefined as unknown as Harness;
      });
    }
  }
  afterAll(() => {
    writeFileSync(
      process.env.PM387_COST_REPORT!,
      JSON.stringify(report, null, 2),
    );
  });
});
