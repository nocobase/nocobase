import type { Knex } from 'knex';
import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';

/**
 * Converting a temporal Field between `datetime` and `datetimeTz` has to mean one thing on every database.
 *
 * The two types disagree about what a stored value is: `datetime` holds a wall clock, `datetimeTz` holds an
 * instant, and turning one into the other requires naming a zone. Left to each dialect the answer differs —
 * MySQL keeps the same `datetime(3)` bytes and the projection pivots on UTC, PostgreSQL casts through whatever
 * the session time zone happens to be, and SQLite's text is not touched at all, which leaves a `datetimeTz`
 * column holding values that carry no offset.
 *
 * The contract is UTC in both directions, because it is the only pivot that is reproducible: it does not depend
 * on the host the migration runs on, and it round-trips. Reading a converted value must therefore return the
 * same string on every dialect, in every TZ, and must never fail.
 */

// Deliberately literal rather than computed from the host clock: a value that shifts with TZ cannot show that
// the conversion does not.
const wall = '2026-08-24T01:18:19.007';
const instant = `${wall}Z`;

describeIntegrationDatabases('Temporal field type changes', (context) => {
  /**
   * Oracle cannot run this contract at all. Every case here converts a column that holds rows, which is the
   * whole point, and Oracle answers `ORA-01439: column to be modified must be empty to change datatype`.
   * Supporting it means the dialect rebuilding the column — add, copy, drop, rename — instead of issuing the
   * plain MODIFY it issues today; until then the conversion is simply not available there.
   */
  const unsupported = context.spec.dialect === 'oracle';

  it.skipIf(unsupported)(
    'reads a datetime widened to datetimeTz as the same wall clock in UTC',
    async () => {
      await context.builder.createCollection(
        'temporalWidened',
        (collection) => {
          collection.string('id').primary();
          collection.datetime('at').nullable();
          collection.datetime('empty').nullable();
        },
      );
      const repository = context.database.repository('temporalWidened');
      await repository.createOne({ values: { id: 'row', at: wall } });

      await context.builder.alterField('temporalWidened', 'at', {
        type: 'datetimeTz',
      });
      await context.builder.alterField('temporalWidened', 'empty', {
        type: 'datetimeTz',
      });

      await expect(
        repository.findOne({
          filter: { id: 'row' },
          select: (select) => select.fields('at', 'empty'),
        }),
      ).resolves.toEqual({ at: instant, empty: null });
    },
  );

  it.skipIf(unsupported)(
    'reads a datetimeTz narrowed to datetime as the UTC wall clock of the instant',
    async () => {
      await context.builder.createCollection(
        'temporalNarrowed',
        (collection) => {
          collection.string('id').primary();
          collection.datetimeTz('at').nullable();
          collection.datetimeTz('empty').nullable();
        },
      );
      const repository = context.database.repository('temporalNarrowed');
      await repository.createOne({ values: { id: 'row', at: instant } });

      await context.builder.alterField('temporalNarrowed', 'at', {
        type: 'datetime',
      });
      await context.builder.alterField('temporalNarrowed', 'empty', {
        type: 'datetime',
      });

      await expect(
        repository.findOne({
          filter: { id: 'row' },
          select: (select) => select.fields('at', 'empty'),
        }),
      ).resolves.toEqual({ at: wall, empty: null });
    },
  );

  // PostgreSQL does not satisfy this yet, and neither does Kingbase, which inherits its casts: widening a
  // zone-free timestamp there reads each value in the session time zone, so a server that is not on UTC moves
  // every row by its offset and records nothing saying so. `ALTER ... USING (col AT TIME ZONE 'UTC')` is what
  // makes it deterministic; until the schema layer emits that, a migration has to pin the session itself.
  it.skipIf(
    unsupported ||
      context.profile.temporal.sessionTimezone === 'unsupported' ||
      ['postgres', 'kingbase'].includes(context.spec.dialect),
  )(
    'converts on the UTC pivot whatever the database session time zone says',
    async () => {
      // The one setting that can still move the answer, and the only one outside the library's control.
      await context.builder.createCollection('temporalZonedAlter', (c) => {
        c.string('id').primary();
        c.datetime('at').nullable();
      });
      const repository = context.database.repository('temporalZonedAlter');
      await repository.createOne({ values: { id: 'row', at: wall } });

      await context.database
        .connection(context.spec.name)
        .transaction(async (connection) => {
          const client = await connection.client<Knex>();
          if (context.profile.temporal.sessionTimezone === 'setConfig')
            await client.raw("select set_config('TimeZone', ?, true)", [
              'Asia/Shanghai',
            ]);
          if (context.profile.temporal.sessionTimezone === 'setTimeZone')
            await client.raw('set time_zone = ?', ['+08:00']);
          if (context.profile.temporal.sessionTimezone === 'alterSession')
            await client.raw("alter session set time_zone = '+08:00'");
          await connection.builder.alterField('temporalZonedAlter', 'at', {
            type: 'datetimeTz',
          });
        });

      await expect(
        repository.findOne({
          filter: { id: 'row' },
          select: (select) => select.fields('at'),
        }),
      ).resolves.toEqual({ at: instant });
    },
  );

  it.skipIf(unsupported)(
    'returns the original value when a Field is converted and converted back',
    async () => {
      await context.builder.createCollection(
        'temporalRoundTrip',
        (collection) => {
          collection.string('id').primary();
          collection.datetime('local').nullable();
          collection.datetimeTz('instant').nullable();
        },
      );
      const repository = context.database.repository('temporalRoundTrip');
      await repository.createOne({
        values: { id: 'row', local: wall, instant },
      });

      for (const [field, to] of [
        ['local', 'datetimeTz'],
        ['instant', 'datetime'],
      ] as const)
        await context.builder.alterField('temporalRoundTrip', field, {
          type: to,
        });
      for (const [field, back] of [
        ['local', 'datetime'],
        ['instant', 'datetimeTz'],
      ] as const)
        await context.builder.alterField('temporalRoundTrip', field, {
          type: back,
        });

      await expect(
        repository.findOne({
          filter: { id: 'row' },
          select: (select) => select.fields('local', 'instant'),
        }),
      ).resolves.toEqual({ local: wall, instant });
    },
  );
});
