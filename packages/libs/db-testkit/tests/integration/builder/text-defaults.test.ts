import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';

/**
 * A text default has to reach the table, not only the Collection metadata.
 *
 * A Repository fills a missing value from the metadata, so it cannot tell whether the column carries the default.
 * These rows are therefore inserted without the column, below the Repository, as a migration's `query` or another
 * writer would. MySQL takes a default on a TEXT column only in the expression form `default ('…')`, which Knex does
 * not compile: it drops the default without a word. OceanBase takes none in any form, so its profile skips these.
 */
describeIntegrationDatabases('text field defaults', (context) => {
  const supported = context.profile.schema.textDefaults !== 'unsupported';
  const alterable =
    supported && context.profile.schema.textAlterations !== 'unsupported';

  it.runIf(supported)(
    'gives a row inserted without the column the default of a created text field',
    async () => {
      await context.builder.createCollection('textDefaults', (collection) => {
        collection.string('id').primary();
        collection.text('body').notNull().defaultTo('draft');
      });

      await context.db(context.table('textDefaults')).insert({ id: 'raw' });

      expect(
        await context.database
          .repository('textDefaults')
          .findOne({ filter: { id: 'raw' } }),
      ).toEqual({ id: 'raw', body: 'draft' });
      const resolved = await context.database
        .connection()
        .collections.get('textDefaults');
      expect(
        resolved?.fields.find((field) => field.name === 'body')?.defaultValue,
      ).toBe('draft');
    },
  );

  it.runIf(supported)(
    'gives a row inserted without the column the default of an added text field',
    async () => {
      await context.builder.createCollection(
        'textDefaultsAdded',
        (collection) => {
          collection.string('id').primary();
        },
      );
      await context.builder.addField('textDefaultsAdded', {
        name: 'note',
        type: 'text',
        nullable: false,
        defaultValue: "it's here",
      });

      await context
        .db(context.table('textDefaultsAdded'))
        .insert({ id: 'raw' });

      expect(
        await context.database
          .repository('textDefaultsAdded')
          .findOne({ filter: { id: 'raw' } }),
      ).toEqual({ id: 'raw', note: "it's here" });
      // The inspector reads the default back from the table. MySQL reports the expression form with its quotes
      // backslash-escaped, so a quote inside the value is what exercises that decoding.
      const resolved = await context.database
        .connection()
        .collections.get('textDefaultsAdded');
      expect(
        resolved?.fields.find((field) => field.name === 'note')?.defaultValue,
      ).toBe("it's here");
    },
  );

  it.runIf(alterable)(
    'gives a row inserted without the column the default an altered text field gained',
    async () => {
      await context.builder.createCollection(
        'textDefaultsAltered',
        (collection) => {
          collection.string('id').primary();
          collection.text('body').notNull();
        },
      );
      await context.builder.alterField('textDefaultsAltered', 'body', {
        type: 'text',
        nullable: false,
        defaultValue: 'pending',
      });

      await context
        .db(context.table('textDefaultsAltered'))
        .insert({ id: 'raw' });

      expect(
        await context.database
          .repository('textDefaultsAltered')
          .findOne({ filter: { id: 'raw' } }),
      ).toEqual({ id: 'raw', body: 'pending' });
      const resolved = await context.database
        .connection()
        .collections.get('textDefaultsAltered');
      expect(
        resolved?.fields.find((field) => field.name === 'body')?.defaultValue,
      ).toBe('pending');
    },
  );
});
