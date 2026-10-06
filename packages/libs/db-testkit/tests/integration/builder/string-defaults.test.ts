import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../helpers.js';

/**
 * The default of a string or enum field is read back from the table as the value it was given.
 *
 * A resolved Collection takes `defaultValue` from what the inspector reads in the catalog, not from the Builder call,
 * and a field whose default it cannot read is treated as having none: the API document then lists a defaulted
 * NOT NULL field as required on create. MySQL reports a literal default as the bare text, `draft` rather than
 * `'draft'`, which the shared literal parser took for an expression, so every such default was lost there — and a
 * numeric-looking string read back as a number. MariaDB reports the declared form instead, `'draft'`, and the bare word
 * `NULL` for a nullable column without a default, which must not become a default either.
 */
describeIntegrationDatabases('string field defaults', (context) => {
  it('resolves the default of a string and an enum field to the value it was given', async () => {
    await context.builder.createCollection('stringDefaults', (collection) => {
      collection.string('id').primary();
      collection.string('status', { length: 20 }).notNull().defaultTo('draft');
      collection.string('code', { length: 20 }).notNull().defaultTo('42');
      collection.string('quoted', { length: 20 }).defaultTo("it's");
      collection.string('word', { length: 20 }).defaultTo('NULL');
      collection.string('optional', { length: 20 }).nullable();
      collection
        .enum('stage', { values: ['draft', 'paid'] })
        .notNull()
        .defaultTo('paid');
    });

    const resolved = await context.database
      .connection()
      .collections.get('stringDefaults');
    const defaults = Object.fromEntries(
      (resolved?.fields ?? [])
        .filter((field) => field.name !== 'id')
        .map((field) => [field.name, field.defaultValue]),
    );
    expect(defaults).toEqual({
      status: 'draft',
      code: '42',
      quoted: "it's",
      word: 'NULL',
      stage: 'paid',
    });
    // A nullable column without a default has none, rather than null or the text NULL.
    expect(defaults.optional).toBeUndefined();
  });
});
