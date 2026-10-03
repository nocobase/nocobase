/**
 * What Repository mutation events cost in SQL, on SQLite where the exact text
 * is stable. Without a subscription every scenario must send exactly the
 * statements it sent before events existed: `baseline-statements.json` was
 * recorded with `WRITE_EVENTS_BASELINE=1` on the commit before recording was
 * added, and is compared statement by statement.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
  countStatements,
  createFixture,
  scenarios,
  seed,
  type Fixture,
} from './scenarios.js';

const baselinePath = fileURLToPath(
  new URL('./baseline-statements.json', import.meta.url),
);
const writeBaseline = process.env.WRITE_EVENTS_BASELINE === '1';
const baseline = writeBaseline
  ? {}
  : (JSON.parse(readFileSync(baselinePath, 'utf8')) as Record<
      string,
      string[]
    >);
const observed: Record<string, string[]> = {};

async function withFixture(
  run: (fixture: Fixture) => Promise<void>,
): Promise<void> {
  const fixture = await createFixture();
  try {
    await seed(fixture.connection);
    await run(fixture);
  } finally {
    await fixture.destroy();
  }
}

function scenario(name: string): (typeof scenarios)[number] {
  const found = scenarios.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`Unknown scenario ${name}`);
  return found;
}

describe('Repository mutation events: SQL without subscriptions', () => {
  afterAll(() => {
    if (writeBaseline)
      writeFileSync(baselinePath, `${JSON.stringify(observed, null, 2)}\n`);
  });

  it.each(scenarios.map((entry) => [entry.name, entry] as const))(
    'sends the baseline statements for %s',
    async (name, entry) => {
      await withFixture(async (fixture) => {
        const { sql } = await countStatements(fixture.knex, () =>
          entry.run(fixture.connection),
        );
        observed[name] = sql;
        if (!writeBaseline) expect(sql).toEqual(baseline[name]);
      });
    },
  );

  it('is unaffected by a subscription on an unrelated Collection', async () => {
    await withFixture(async (fixture) => {
      fixture.connection.onRepositoryMutation(
        { collections: ['users'] },
        { afterCommit: () => undefined },
      );
      const name = 'updateMany';
      const { sql } = await countStatements(fixture.knex, () =>
        scenario(name).run(fixture.connection),
      );
      expect(sql).toEqual(baseline[name]);
    });
  });
});

describe.skipIf(writeBaseline)(
  'Repository mutation events: SQL a subscription adds',
  () => {
    it.each(['updateMany', 'deleteMany', 'createMany generated keys'])(
      'keeps %s a single statement when every subscription accepts counts',
      async (name) => {
        await withFixture(async (fixture) => {
          fixture.connection.onRepositoryMutation(
            { collections: ['tasks', 'notes'], keys: false },
            { afterCommit: () => undefined },
          );
          const { sql } = await countStatements(fixture.knex, () =>
            scenario(name).run(fixture.connection),
          );
          expect(sql).toEqual(baseline[name]);
        });
      },
    );

    it('locks, then writes by key, in one transaction for a keyed updateMany', async () => {
      await withFixture(async (fixture) => {
        fixture.connection.onRepositoryMutation(
          { collections: ['tasks'] },
          { afterCommit: () => undefined },
        );
        const { sql } = await countStatements(fixture.knex, () =>
          scenario('updateMany').run(fixture.connection),
        );
        expect(sql).toHaveLength(4);
        expect(sql[0]).toBe('BEGIN;');
        expect(sql[1]).toMatch(/^select .* from `main`\.`tasks`/u);
        expect(sql[2]).toMatch(/^update `main`\.`tasks` set .* where/u);
        expect(sql[3]).toBe('COMMIT;');
      });
    });

    it('inserts supplied keys in the original statement and generated keys with one RETURNING', async () => {
      await withFixture(async (fixture) => {
        fixture.connection.onRepositoryMutation(
          { collections: ['tasks', 'notes'] },
          { afterCommit: () => undefined },
        );
        const supplied = await countStatements(fixture.knex, () =>
          scenario('createMany explicit keys').run(fixture.connection),
        );
        expect(supplied.sql).toEqual([
          'BEGIN;',
          ...baseline['createMany explicit keys']!,
          'COMMIT;',
        ]);
        const generated = await countStatements(fixture.knex, () =>
          scenario('createMany generated keys').run(fixture.connection),
        );
        expect(generated.sql).toHaveLength(3);
        expect(generated.sql[1]).toMatch(/^insert into .* returning /u);
      });
    });

    it.each([
      ['updateOne hasOne connect (detaches the current target)', 0],
      ['updateOne hasOne disconnect (clear by condition)', 1],
      ['updateOne hasMany set (nulls remaining by condition)', 1],
      ['updateOne belongsToMany delete target (deletes edges by condition)', 1],
      [
        'updateOne hasMany patch (create/connect/disconnect/update/upsert/delete)',
        0,
      ],
    ] as const)(
      '%s sends %i extra statements when observed',
      async (name, extra) => {
        await withFixture(async (fixture) => {
          fixture.connection.onRepositoryMutation(
            {
              collections: [
                'projects',
                'projectProfiles',
                'tasks',
                'projectTags',
              ],
            },
            { afterCommit: () => undefined },
          );
          const { sql } = await countStatements(fixture.knex, () =>
            scenario(name).run(fixture.connection),
          );
          expect(sql.length - baseline[name]!.length).toBe(extra);
        });
      },
    );
  },
);
