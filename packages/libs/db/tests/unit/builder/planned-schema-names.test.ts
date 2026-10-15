import { describe, expect, it } from 'vitest';
import { CollectionBuilder } from '../../../src/collection/builder/builder.js';
import type {
  CollectionDefinition,
  ConstraintDefinition,
  IndexDefinition,
} from '../../../src/collection/types.js';

describe('CollectionBuilder planned schema names', () => {
  it('removes and recreates indexes and constraints with generated names', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('jobs', (collection) => {
      collection.string('status');
      collection.string('jobKey');
      collection.index(['status']);
      collection.unique(['jobKey']);
    });

    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [{ name: 'idx_jobs_status', fields: ['status'] }],
      constraints: [
        { type: 'unique', name: 'idx_jobs_job_key', fields: ['jobKey'] },
      ],
    });
    await builder.dropIndex('jobs', 'idx_jobs_status');
    await builder.dropConstraint('jobs', 'idx_jobs_job_key');
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [],
      constraints: [],
    });

    await builder.addIndex('jobs', { fields: ['status'] });
    await builder.addConstraint('jobs', {
      type: 'unique',
      fields: ['jobKey'],
    });
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [{ name: 'idx_jobs_status', fields: ['status'] }],
      constraints: [{ name: 'idx_jobs_job_key', fields: ['jobKey'] }],
    });
    await builder.dropIndex('jobs', 'idx_jobs_status');
    await builder.dropConstraint('jobs', 'idx_jobs_job_key');
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [],
      constraints: [],
    });
  });

  it('resolves names for indexes and constraints added with new fields', async () => {
    const builder = new CollectionBuilder({ naming: { tablePrefix: 'app_' } });
    await builder.createCollection('jobs', (collection) => {
      collection.string('id');
    });
    await builder.alterCollection('jobs', (collection) => {
      collection.string('jobStatus');
      collection.string('jobKey');
      collection.index(['jobStatus']);
      collection.unique(['jobKey']);
    });

    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [{ name: 'idx_app_jobs_job_status', fields: ['jobStatus'] }],
      constraints: [{ name: 'idx_app_jobs_job_key', fields: ['jobKey'] }],
    });
    await builder.alterCollection('jobs', {
      dropIndexes: ['idx_app_jobs_job_status'],
      dropConstraints: ['idx_app_jobs_job_key'],
    });
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [],
      constraints: [],
    });
  });

  it.each([
    { tablePrefix: 'archive_', underscored: true },
    { tablePrefix: '', underscored: false },
  ])(
    'uses collection naming overrides and compiler truncation: %j',
    async (naming) => {
      const builder = new CollectionBuilder({
        naming: { tablePrefix: 'app_' },
      });
      const fieldName = `status${'Code'.repeat(20)}`;
      const created = await builder.createCollection(
        'auditJobs',
        (collection) => {
          collection.naming(naming);
          collection.string(fieldName);
          collection.string('jobKey');
          collection.index([fieldName]);
          collection.unique(['jobKey']);
        },
      );
      const operation = created.schemaOperations?.[0];
      expect(operation?.type).toBe('createTable');
      if (operation?.type !== 'createTable')
        throw new Error('Expected createTable');
      const indexName = operation.table.indexes[0].name!;
      const constraintName = operation.table.constraints[0].name!;
      expect(indexName.length).toBeLessThanOrEqual(63);
      expect(await builder.getCollection('auditJobs')).toMatchObject({
        indexes: [{ name: indexName, fields: [fieldName] }],
        constraints: [{ name: constraintName, fields: ['jobKey'] }],
      });
      await builder.dropIndex('auditJobs', indexName);
      await builder.dropConstraint('auditJobs', constraintName);
      expect(await builder.getCollection('auditJobs')).toMatchObject({
        indexes: [],
        constraints: [],
      });
    },
  );

  it('resolves relation columns and sibling collection names for foreign keys', async () => {
    const builder = new CollectionBuilder({ naming: { tablePrefix: 'app_' } });
    await builder.createCollections([
      {
        name: 'jobs',
        definition: (collection) => {
          collection.integer('ownerId');
          collection
            .belongsTo('owner', 'users')
            .foreignKey('ownerId')
            .targetKey('userId');
          collection.index(['owner']);
          collection.foreignKey(['owner'], {
            references: { collection: 'users', fields: ['userId'] },
          });
        },
      },
      {
        name: 'users',
        definition: (collection) => {
          collection.naming({ tablePrefix: 'auth_' });
          collection.integer('userId').primary();
        },
      },
    ]);

    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [{ name: 'idx_app_jobs_owner_id', fields: ['owner'] }],
      constraints: [
        { name: 'fk_app_jobs_owner_id_auth_users', fields: ['owner'] },
      ],
    });
    await builder.dropIndex('jobs', 'idx_app_jobs_owner_id');
    await builder.dropConstraint('jobs', 'fk_app_jobs_owner_id_auth_users');
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [],
      constraints: [],
    });
  });

  it('retains existing names across a collection rename and names new objects for the new table', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('jobs', (collection) => {
      collection.string('status');
      collection.string('jobKey');
      collection.index(['status']);
      collection.unique(['jobKey']);
    });
    await builder.renameCollection('jobs', 'archivedJobs');
    expect(await builder.getCollection('archivedJobs')).toMatchObject({
      indexes: [{ name: 'idx_jobs_status' }],
      constraints: [{ name: 'idx_jobs_job_key' }],
    });
    await builder.dropIndex('archivedJobs', 'idx_jobs_status');
    await builder.dropConstraint('archivedJobs', 'idx_jobs_job_key');
    await builder.addIndex('archivedJobs', { fields: ['status'] });
    await builder.addConstraint('archivedJobs', {
      type: 'unique',
      fields: ['jobKey'],
    });
    expect(await builder.getCollection('archivedJobs')).toMatchObject({
      indexes: [{ name: 'idx_archived_jobs_status' }],
      constraints: [{ name: 'idx_archived_jobs_job_key' }],
    });
  });

  it('preserves explicit names without mutating input definitions', async () => {
    const builder = new CollectionBuilder();
    const index: IndexDefinition = {
      fields: ['status'],
      name: 'custom_status',
    };
    const constraint: ConstraintDefinition = {
      type: 'unique',
      fields: ['jobKey'],
    };
    const definition: CollectionDefinition = {
      fields: [
        { name: 'status', type: 'string' },
        { name: 'jobKey', type: 'string' },
      ],
      indexes: [index],
    };
    await builder.createCollection('jobs', definition);
    await builder.addConstraint('jobs', constraint);
    expect(constraint.name).toBeUndefined();
    expect(definition.name).toBeUndefined();
    expect(index.name).toBe('custom_status');
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [{ name: 'custom_status' }],
      constraints: [{ name: 'idx_jobs_job_key' }],
    });
    await builder.dropIndex('jobs', 'custom_status');
    expect((await builder.getCollection('jobs'))?.indexes).toEqual([]);
  });

  it('does not update planned names or remove objects during a dry run', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('jobs', (collection) => {
      collection.string('status');
      collection.string('jobKey');
      collection.index(['status']);
    });
    const before = await builder.getCollection('jobs');
    await builder.dropIndex('jobs', 'idx_jobs_status', { dryRun: true });
    await builder.addConstraint(
      'jobs',
      { type: 'unique', fields: ['jobKey'] },
      { dryRun: true },
    );
    expect(await builder.getCollection('jobs')).toEqual(before);
    await builder.dropIndex('jobs', 'idx_jobs_status');
    expect((await builder.getCollection('jobs'))?.indexes).toEqual([]);
  });

  it('applies additions and drops in the same alteration in schema order', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('jobs', (collection) => {
      collection.string('status');
      collection.string('jobKey');
    });
    await builder.alterCollection('jobs', {
      addIndexes: [{ fields: ['status'] }],
      dropIndexes: ['idx_jobs_status'],
      addConstraints: [{ type: 'unique', fields: ['jobKey'] }],
      dropConstraints: ['idx_jobs_job_key'],
    });
    expect(await builder.getCollection('jobs')).toMatchObject({
      indexes: [],
      constraints: [],
    });
  });

  it('preserves explicit constraint names and resolves unnamed primary keys', async () => {
    const builder = new CollectionBuilder();
    await builder.createCollection('jobs', (collection) => {
      collection.string('jobKey');
      collection.string('externalKey');
      collection.primary(['jobKey']);
      collection.unique(['externalKey'], { name: 'custom_external_key' });
    });
    expect(await builder.getCollection('jobs')).toMatchObject({
      constraints: [
        { type: 'primary', name: 'idx_jobs_job_key' },
        { type: 'unique', name: 'custom_external_key' },
      ],
    });
    await builder.dropConstraint('jobs', 'idx_jobs_job_key');
    await builder.dropConstraint('jobs', 'custom_external_key');
    expect((await builder.getCollection('jobs'))?.constraints).toEqual([]);
  });
});
