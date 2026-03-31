/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { isPg } from '@nocobase/test';
import { createApp } from '..';

const pgOnly = () => (isPg() ? describe : describe.skip);

pgOnly()('Inherited Collection with schema options', () => {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        schema: 'testSchema',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create inherited collection in difference schema', async () => {
    await collectionRepository.create({
      values: {
        name: 'b',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'a',
        inherits: ['b'],
        fields: [{ type: 'string', name: 'bField' }],
      },
      context: {},
    });
  });

  it('should list parent collection with children in difference schema in same table name', async () => {
    await collectionRepository.create({
      values: {
        name: 'fakeParent',
        schema: 'fake_schema',
        tableName: 'parent',
      },
    });

    const parent = await collectionRepository.create({
      values: {
        name: 'parent',
        schema: 'rootSchema',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const child1 = await collectionRepository.create({
      values: {
        name: 'child1',
        schema: 'child_1',
        inherits: [parent.get('name')],
      },
      context: {},
    });

    // same table name with "otherTable" but in different schema
    const child2 = await collectionRepository.create({
      values: {
        name: 'child2',
        schema: 'public',
        tableName: 'child2',
        inherits: [parent.get('name')],
      },
      context: {},
    });

    const otherTable = await collectionRepository.create({
      values: {
        name: 'otherTable',
        schema: 'other_schema',
        tableName: 'child2',
      },
      context: {},
    });

    await db.getCollection('parent').repository.create({
      values: {
        name: 'parent',
      },
    });

    await db.getCollection('child2').repository.create({
      values: {
        name: 'child2-1',
      },
    });

    await db.getCollection('child1').repository.create({
      values: {
        name: 'chid1-1',
      },
    });

    await db.getCollection('otherTable').repository.create({
      values: {},
    });

    const list = await db.getCollection('parent').repository.find({});
    const child2Record = list.find((item) => item.get('name') === 'child2-1');
    expect(child2Record.get('__collection')).toBe(child2.get('name'));
  });
});
