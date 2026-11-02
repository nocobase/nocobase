import { getRepositoryMutationIdentity } from '@nocobase/db';
import { expect, it } from 'vitest';
import { describeIntegrationDatabases } from '../../helpers.js';

describeIntegrationDatabases(
  'Repository identity feature combinations',
  (context) => {
    it('keeps root identity private under a restricted projection and nested self-relation creation', async () => {
      await context.builder.createCollection('privateIdentities', (c) => {
        c.increments('sequence');
        c.string('label');
        c.integer('parentSequence').nullable();
        c.belongsTo('parent', 'privateIdentities')
          .foreignKey('parentSequence')
          .targetKey('sequence');
      });
      const repository = context.database
        .repository('privateIdentities')
        .withPolicy({
          read: { scope: true, fields: ['label'] },
          create: true,
          update: true,
          delete: false,
        });
      const created = await repository.createOne({
        values: { label: 'Root', parent: { create: { label: 'Nested' } } },
        select: (s) => s.fields('label'),
      });
      expect(created.record).toEqual({ label: 'Root' });
      const identity = getRepositoryMutationIdentity(created);
      expect(identity?.sequence).toBeDefined();
      expect(JSON.stringify(created)).not.toContain('sequence');
      expect(
        await context.database
          .repository('privateIdentities')
          .findOne({ filter: identity! }),
      ).toMatchObject({ label: 'Root' });
      const updated = await context.database
        .repository('privateIdentities')
        .withPolicy({
          read: { scope: true, fields: ['label'] },
          create: false,
          update: true,
          delete: false,
        })
        .updateOne({
          filter: { label: 'Root' },
          values: { label: 'Changed' },
          select: (s) => s.fields('label'),
        });
      expect(getRepositoryMutationIdentity(updated)).toEqual(identity);
      expect(updated.record).toEqual({ label: 'Changed' });
    });
    it('preserves bigint identities above Number.MAX_SAFE_INTEGER', async () => {
      const key = '9007199254740993';
      await context.builder.createCollection('exactKeys', (c) => {
        c.bigInt('key').primary().notNull();
        c.string('label');
      });
      const records = context.database.repository('exactKeys');
      expect(
        (await records.createOne({ values: { key, label: 'original' } })).record
          .key,
      ).toBe(key);
      expect(
        (
          await records.updateOne({
            filter: { label: 'original' },
            values: { label: 'changed' },
          })
        ).record.key,
      ).toBe(key);
      expect(
        await records.deleteOne({
          filter: { label: 'changed' },
          select: (s) => s.fields('key'),
        }),
      ).toEqual({ deleted: true, record: { key } });
      expect(await records.count()).toBe(0);
    });
    it('uses a non-id generated primary key through create and returning mutations', async () => {
      await context.builder.createCollection('generatedKeys', (c) => {
        c.increments('sequence');
        c.string('label');
      });
      const records = context.database.repository('generatedKeys');
      const created = await records.createOne({ values: { label: 'first' } });
      expect(created.record).toEqual({ sequence: 1, label: 'first' });
      expect(
        await records.updateMany({
          filter: { sequence: 1 },
          values: { label: 'changed' },
          select: (s) => s.fields('label'),
        }),
      ).toEqual({ updatedCount: 1, records: [{ label: 'changed' }] });
      expect(
        await records.deleteOne({
          filter: { sequence: 1 },
          select: (s) => s.fields('label'),
        }),
      ).toEqual({ deleted: true, record: { label: 'changed' } });
    });

    it('connects UUID keys and preserves them through mutations', async () => {
      const account = '123e4567-e89b-12d3-a456-426614174000';
      const other = '123e4567-e89b-12d3-a456-426614174001';
      await context.database.transaction(async (connection) => {
        await connection.builder.createCollection('uuidAccounts', (c) => {
          c.uuid('account').primary().notNull();
          c.string('label');
          c.hasMany('tasks', 'uuidTasks')
            .sourceKey('account')
            .foreignKey('accountRef');
        });
        await connection.builder.createCollection('uuidTasks', (c) => {
          c.string('taskNo').primary().notNull();
          c.uuid('accountRef').nullable();
          c.belongsTo('owner', 'uuidAccounts')
            .foreignKey('accountRef')
            .targetKey('account');
        });
      });
      const accounts = context.database.repository('uuidAccounts');
      const tasks = context.database.repository('uuidTasks');
      await accounts.createOne({
        values: { account, label: 'first', tasks: { create: { taskNo: 'T' } } },
      });
      await accounts.createOne({ values: { account: other, label: 'other' } });
      expect(
        await tasks.findOne({
          filter: { taskNo: 'T' },
          select: (s) =>
            s.fields('taskNo').include('owner', (o) => o.fields('account')),
        }),
      ).toEqual({ taskNo: 'T', owner: { account } });
      expect(
        (
          await accounts.updateOne({
            filter: { account },
            values: { label: 'changed' },
          })
        ).record.account,
      ).toBe(account);
      await accounts.updateOne({
        filter: { account },
        values: { tasks: { disconnect: { taskNo: 'T' } } },
      });
      expect(
        await accounts.deleteOne({
          filter: { account },
          select: (s) => s.fields('account'),
        }),
      ).toEqual({ deleted: true, record: { account } });
      expect(await accounts.findMany()).toEqual([
        { account: other, label: 'other' },
      ]);
    });

    it('paginates and returns projections with complete composite primary keys', async () => {
      await context.builder.createCollection('compositePages', (c) => {
        c.string('tenant').notNull();
        c.integer('sequence').notNull();
        c.string('label');
        c.string('category');
        c.primary(['tenant', 'sequence']);
      });
      const records = context.database.repository('compositePages');
      expect(
        await records.createMany({
          values: [
            { tenant: 'A', sequence: 1, label: 'A1', category: 'same' },
            { tenant: 'A', sequence: 2, label: 'A2', category: 'same' },
            { tenant: 'B', sequence: 1, label: 'B1', category: 'other' },
          ],
          select: (s) => s.fields('label'),
        }),
      ).toEqual({
        createdCount: 3,
        records: [{ label: 'A1' }, { label: 'A2' }, { label: 'B1' }],
      });
      const forward = await records.findMany({
        sort: (s) => [s.field('tenant').asc(), s.field('sequence').asc()],
        cursor: { tenant: 'A', sequence: 1 },
        limit: 1,
        select: (s) => s.fields('label'),
      });
      expect(forward).toEqual([{ label: 'A2' }]);
      expect(
        await records.findMany({
          sort: (s) => [s.field('tenant').asc(), s.field('sequence').asc()],
          cursor: { tenant: 'B', sequence: 1 },
          direction: 'backward',
          limit: 1,
          select: (s) => s.fields('label'),
        }),
      ).toEqual(forward);
      await expect(
        records.findMany({
          sort: (s) => s.field('tenant').asc(),
          cursor: { tenant: 'A' },
        }),
      ).rejects.toMatchObject({ code: 'INVALID_PAGINATION' });
      expect(
        await records.findMany({
          distinct: ['category'],
          select: (s) => s.fields('label'),
        }),
      ).toEqual([{ label: 'A1' }, { label: 'B1' }]);
      expect(
        await records.updateMany({
          filter: { tenant: 'A' },
          values: { label: 'changed' },
          select: (s) => s.fields('label'),
        }),
      ).toEqual({
        updatedCount: 2,
        records: [{ label: 'changed' }, { label: 'changed' }],
      });
      expect(
        await records.deleteMany({
          filter: { tenant: 'A' },
          select: (s) => s.fields('label'),
        }),
      ).toEqual({
        deletedCount: 2,
        records: [{ label: 'changed' }, { label: 'changed' }],
      });
      expect(await records.findMany()).toEqual([
        { tenant: 'B', sequence: 1, label: 'B1', category: 'other' },
      ]);
    });

    it('uses bigint identities outside the 32-bit range without treating them as integer ids', async () => {
      await context.builder.createCollection('largeKeys', (c) => {
        c.bigInt('externalKey').primary().notNull();
        c.string('label');
      });
      const records = context.database.repository('largeKeys');
      const key = 4294967297;
      const created = await records.createOne({
        values: { externalKey: key, label: 'original' },
      });
      expect(String(created.record.externalKey)).toBe(String(key));
      await expect(
        records.updateOne({
          filter: { externalKey: String(key) },
          values: { label: 'string-filter' },
        }),
      ).resolves.toMatchObject({
        record: { externalKey: String(key), label: 'string-filter' },
      });
      expect(
        (
          await records.updateOne({
            filter: { externalKey: key },
            values: { label: 'changed' },
            select: (s) => s.fields('label'),
          })
        ).record,
      ).toEqual({ label: 'changed' });
      await records.deleteOne({ filter: { externalKey: key } });
      expect(await records.count()).toBe(0);
    });
  },
);
