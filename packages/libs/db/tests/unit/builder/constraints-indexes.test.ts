import { describe, expect, it } from 'vitest';
import { CollectionBuilder } from '../../../src/collection/builder/builder.js';

describe('CollectionBuilder constraints and indexes', () => {
  it('inspects planned definitions without exposing mutable builder state', async () => {
    const builder = new CollectionBuilder();
    expect(await builder.getCollection('jobs')).toBeUndefined();
    await builder.createCollection('jobs', (collection) => {
      collection.string('status');
      collection.index(['status'], { name: 'jobs_status' });
    });
    const definition = await builder.getCollection('jobs');
    expect(definition?.indexes).toEqual([
      expect.objectContaining({ name: 'jobs_status', fields: ['status'] }),
    ]);
    definition!.indexes = [];
    expect((await builder.getCollection('jobs'))?.indexes).toHaveLength(1);
    await builder.dropIndex('jobs', 'jobs_status');
    expect((await builder.getCollection('jobs'))?.indexes).toHaveLength(0);
  });

  it('keeps constraints and indexes as separate DSL concepts', async () => {
    const builder = new CollectionBuilder();

    const result = await builder.createCollection(
      'jobs',
      (collection) => {
        collection.string('email');
        collection.integer('accountId');
        collection.integer('programId');
        collection.string('status');
        collection.primary('email', {
          name: 'jobs_primary_key',
          deferrable: 'deferred',
        });
        collection.unique(['accountId', 'programId'], {
          name: 'job_composite_index',
          mode: 'constraint',
          deferrable: 'deferred',
          indexType: 'hash',
          predicate: {
            accountId: { $notNull: true },
          },
        });
        collection.index(['status'], {
          name: 'idx_jobs_status',
          type: 'btree',
        });
      },
      { dryRun: true },
    );

    expect(result.operations[0]).toMatchObject({
      type: 'createCollection',
      definition: {
        constraints: [
          {
            type: 'primary',
            fields: ['email'],
            name: 'jobs_primary_key',
            deferrable: 'deferred',
          },
          {
            type: 'unique',
            fields: ['accountId', 'programId'],
            name: 'job_composite_index',
            mode: 'constraint',
            deferrable: 'deferred',
            indexType: 'hash',
            predicate: {
              accountId: { $notNull: true },
            },
          },
        ],
        indexes: [
          {
            fields: ['status'],
            name: 'idx_jobs_status',
            type: 'btree',
          },
        ],
      },
    });
    expect(result.schemaOperations?.[0]).toMatchObject({
      type: 'createTable',
      table: {
        constraints: [
          {
            type: 'primary',
            columns: ['email'],
            name: 'jobs_primary_key',
          },
          {
            type: 'unique',
            columns: ['account_id', 'program_id'],
            name: 'job_composite_index',
            mode: 'constraint',
            predicate: {
              account_id: { $notNull: true },
            },
          },
        ],
        indexes: [
          {
            columns: ['status'],
            name: 'idx_jobs_status',
          },
        ],
      },
    });
  });

  it('supports field-level references as foreign key constraints', async () => {
    const builder = new CollectionBuilder();

    const result = await builder.createCollection(
      'referencesExample',
      (collection) => {
        collection
          .integer('companyId')
          .references({ collection: 'company', field: 'companyId' });
      },
      { dryRun: true },
    );

    expect(result.operations[0]).toMatchObject({
      type: 'createCollection',
      definition: {
        constraints: [
          {
            type: 'foreignKey',
            fields: ['companyId'],
            references: {
              collection: 'company',
              fields: ['companyId'],
            },
          },
        ],
      },
    });
    expect(result.schemaOperations?.[0]).toMatchObject({
      type: 'createTable',
      table: {
        name: 'references_example',
        constraints: [
          {
            type: 'foreignKey',
            columns: ['company_id'],
            references: {
              table: 'company',
              columns: ['company_id'],
            },
          },
        ],
      },
    });
  });
});
