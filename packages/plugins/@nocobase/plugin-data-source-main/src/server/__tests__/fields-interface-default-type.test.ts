/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Collection as DBCollection } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from '.';

describe('field interface default type', () => {
  let db: Database;
  let app: Application;
  let Collection: DBCollection;
  let Field: DBCollection;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
    Collection = db.getCollection('collections');
    Field = db.getCollection('fields');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('applies the interface default type when type is missing', async () => {
    await Collection.repository.create({
      values: {
        name: 'withInterfaceDefault',
      },
      context: {},
    });

    const field = await Field.repository.create({
      values: {
        name: 'amount',
        interface: 'number',
        collectionName: 'withInterfaceDefault',
      },
      context: {},
    });

    expect(field.get('type')).toBe('double');

    // The collection really got a usable column, not just a metadata row.
    await db.getRepository('withInterfaceDefault').create({
      values: {
        amount: 12.5,
      },
    });
  });

  it('maps string interfaces to their default type', async () => {
    await Collection.repository.create({
      values: {
        name: 'withStringInterface',
      },
      context: {},
    });

    const field = await Field.repository.create({
      values: {
        name: 'note',
        interface: 'input',
        collectionName: 'withStringInterface',
      },
      context: {},
    });

    expect(field.get('type')).toBe('string');
  });

  it('keeps an explicit type over the interface default', async () => {
    await Collection.repository.create({
      values: {
        name: 'withExplicitType',
      },
      context: {},
    });

    const field = await Field.repository.create({
      values: {
        name: 'amount',
        interface: 'number',
        type: 'float',
        collectionName: 'withExplicitType',
      },
      context: {},
    });

    expect(field.get('type')).toBe('float');
  });
});
