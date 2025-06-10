/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import moment from 'moment';

describe('unix timestamp field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should set default to current time', async () => {
    const c1 = db.collection({
      name: 'test11',
      fields: [
        {
          name: 'date1',
          type: 'unixTimestamp',
          defaultToCurrentTime: true,
        },
      ],
    });

    await db.sync();

    const instance = await c1.repository.create({});
    const date1 = instance.get('date1');
    expect(date1).toBeDefined();

    console.log(instance.toJSON());
  });

  it('should set date value', async () => {
    const c1 = db.collection({
      name: 'test12',
      fields: [
        {
          name: 'date1',
          type: 'unixTimestamp',
        },
      ],
    });

    await db.sync();

    await c1.repository.create({
      values: {
        date1: '2021-01-01T00:00:00Z',
      },
    });

    const item = await c1.repository.findOne();
    const val = item.get('date1');
    const date = moment(val).utc().format('YYYY-MM-DD HH:mm:ss');
    expect(date).toBe('2021-01-01 00:00:00');
  });

  it('number as second input should be kept as same', async () => {
    const c1 = db.collection({
      name: 'test13',
      fields: [
        {
          name: 'date1',
          type: 'unixTimestamp',
          accuracy: 'second',
        },
      ],
    });

    await db.sync();

    const d = new Date();
    const second = Math.floor(d.getTime() / 1000);

    const instance = await c1.repository.create({ values: { date1: second } });
    const date1 = instance.get('date1');
    expect(date1 instanceof Date).toBe(true);
    expect(date1.getTime()).toBe(second * 1000);
  });

  describe('timezone', () => {
    test('custom', async () => {
      db.collection({
        name: 'tests',
        timestamps: false,
        fields: [{ name: 'date1', type: 'unixTimestamp', timezone: '+06:00' }],
      });

      await db.sync();
      const repository = db.getRepository('tests');
      const instance = await repository.create({ values: { date1: '2023-03-24 00:00:00' } });
      const date1 = instance.get('date1');
      expect(date1.toISOString()).toEqual('2023-03-23T18:00:00.000Z');
    });
  });
});
