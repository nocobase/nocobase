/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, Field, Repository } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { createApp } from '.';

class MockField extends Field {
  get dataType() {
    return 'mock';
  }

  bind() {
    throw new Error('MockField not implemented.');
  }
}

describe('load field', async () => {
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
    db.registerFieldTypes({
      mock: MockField,
    });

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should not in collection when binding error', async () => {
    const collection = await collectionRepository.create({
      values: {
        name: 'test1',
        fields: [
          {
            type: 'bigInt',
            name: 'id',
          },
        ],
      },
    });
    await collection.load();
    expect(db.hasCollection('test1')).toBeTruthy();
    try {
      await db.sequelize.transaction(async (transaction) => {
        const field = await fieldsRepository.create({
          values: {
            name: 'mock',
            collectionName: 'test1',
            type: 'mock',
          },
          transaction,
        });
        await field.load({ transaction });
      });
    } catch (error) {
      expect(error.message).toBe('MockField not implemented.');
    }

    const instance = await fieldsRepository.findOne({
      filter: {
        name: 'mock',
      },
    });
    expect(instance).toBeFalsy();
    const field = db.getCollection('test1').getField('mock');
    expect(field).toBeUndefined();
  });
});
