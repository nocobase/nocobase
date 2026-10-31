/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MigrationContext } from '@nocobase/database';
import type { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../migrations/20261008000000-remove-self-source';

describe('remove self source of belongs to array fields', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-m2m-array', 'data-source-manager', 'field-sort', 'data-source-main', 'error-handler'],
    });
    db = app.db;
    await db.getRepository('collections').create({
      values: {
        name: 'tags',
        fields: [
          { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
          { name: 'title', type: 'string' },
        ],
      },
      context: {},
    });
    await db.getRepository('collections').create({
      values: {
        name: 'users',
        fields: [
          { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
          { name: 'username', type: 'string' },
        ],
      },
      context: {},
    });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should restore belongs to array fields saved with the current collection as source', async () => {
    const fieldRepo = db.getRepository('fields');
    await fieldRepo.create({
      values: {
        collectionName: 'users',
        name: 'tags',
        interface: 'mbm',
        type: 'belongsToArray',
        target: 'tags',
        targetKey: 'id',
        foreignKey: 'tag_ids',
        source: 'users',
      },
      context: {},
    });
    await fieldRepo.create({
      values: {
        collectionName: 'users',
        name: 'inheritedTags',
        interface: 'mbm',
        type: 'belongsToArray',
        target: 'tags',
        targetKey: 'id',
        foreignKey: 'inherited_tag_ids',
        source: 'users.tags',
      },
      context: {},
    });
    await fieldRepo.create({
      values: {
        collectionName: 'users',
        name: 'tag',
        interface: 'm2o',
        type: 'belongsTo',
        target: 'tags',
        targetKey: 'id',
        foreignKey: 'tag_id',
        source: 'users',
      },
    });
    expect(db.getCollection('users').hasField('tags')).toBe(false);

    const migration = new Migration({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const getSource = async (name: string) => {
      const field = await fieldRepo.findOne({ filter: { collectionName: 'users', name } });
      return field.get('source');
    };
    expect(await getSource('tags')).toBeUndefined();
    expect(await getSource('inheritedTags')).toBe('users.tags');
    expect(await getSource('tag')).toBe('users');

    await db.getRepository<CollectionRepository>('collections').load({ filter: { name: 'users' } });
    expect(db.getCollection('users').hasField('tags')).toBe(true);
    const [tag] = await db.getRepository('tags').create({ values: [{ title: 'a' }] });
    const user = await db.getRepository('users').create({ values: { username: 'u', tags: [tag.id] } });
    const record = await db.getRepository('users').findOne({ filterByTk: user.id, appends: ['tags'] });
    expect(record.get('tags').map((item) => item.title)).toEqual(['a']);
  });

  it('should keep fields whose foreign key cannot hold an array of target keys', async () => {
    const fieldRepo = db.getRepository('fields');
    await fieldRepo.create({
      values: {
        collectionName: 'users',
        name: 'tags',
        interface: 'mbm',
        type: 'belongsToArray',
        target: 'tags',
        targetKey: 'id',
        foreignKey: 'username',
        source: 'users',
      },
      context: {},
    });

    const migration = new Migration({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    const field = await fieldRepo.findOne({ filter: { collectionName: 'users', name: 'tags' } });
    expect(field.get('source')).toBe('users');
    await db.getRepository<CollectionRepository>('collections').load({ filter: { name: 'users' } });
    expect(db.getCollection('users').hasField('tags')).toBe(false);
  });
});
