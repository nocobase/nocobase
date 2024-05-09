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
import { createApp } from '../index';
import { uid } from '@nocobase/utils';

describe('view collection', function () {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        tablePrefix: '',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should set view collection filterTargetKey', async () => {
    await collectionRepository.create({
      values: {
        name: 'tests',
        autoGenId: false,
        timestamps: false,
        fields: [
          {
            name: 'test',
            type: 'string',
          },
          {
            name: 'uuid',
            type: 'uuid',
          },
        ],
      },
      context: {},
    });

    // insert some data
    await db.getCollection('tests').repository.create({
      values: [
        {
          test: 'test1',
        },
        {
          test: 'test2',
        },
        {
          test: 'test3',
        },
      ],
    });

    const viewName = `test_view_${uid(6)}`;
    await db.sequelize.query(`DROP VIEW IF EXISTS ${viewName}`);

    const createSQL = `CREATE VIEW ${viewName} AS SELECT * FROM ${db.getCollection('tests').quotedTableName()}`;

    await db.sequelize.query(createSQL);

    // create view collection
    await collectionRepository.create({
      values: {
        name: 'view_tests',
        autoGenId: false,
        timestamps: false,
        view: true,
        viewName,
        fields: [
          { name: 'test', type: 'string' },
          { name: 'uuid', type: 'uuid' },
        ],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    // update filterTargetKey Options
    await collectionRepository.update({
      values: {
        filterTargetKey: 'uuid',
      },
      filter: {
        name: 'view_tests',
      },
      context: {},
    });

    expect(db.getCollection('view_tests').options['filterTargetKey']).toBe('uuid');

    // get view collection items
    const items = await db.getCollection('view_tests').repository.find();
    const uuidVal = items[0].get('uuid');
    console.log('uuidVal:', uuidVal);

    // filter item by uuid
    const item = await db.getCollection('view_tests').repository.findOne({
      filterByTk: uuidVal,
    });

    expect(item.get('uuid')).toBe(uuidVal);
  });
});
