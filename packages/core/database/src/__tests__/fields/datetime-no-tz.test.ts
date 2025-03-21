/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { sleep } from '@nocobase/test';

describe('datetime no tz field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({
      timezone: '+01:00',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not get timezone part', async () => {
    db.collection({
      name: 'tests',
      timestamps: false,
      fields: [{ name: 'date1', type: 'datetimeNoTz' }],
    });

    await db.sync();

    await db.getRepository('tests').create({
      values: {
        date1: '2023-03-24 12:00:00',
      },
    });

    const item = await db.getRepository('tests').findOne();
    expect(item.toJSON()['date1']).toBe('2023-03-24 12:00:00');
  });

  it('should save datetime with timezone to no tz field', async () => {
    db.collection({
      name: 'tests',
      timestamps: false,
      fields: [{ name: 'date1', type: 'datetimeNoTz' }],
    });

    await db.sync();

    await db.getRepository('tests').create({
      values: {
        date1: '2023-03-24T12:00:00.892Z',
      },
    });

    const item = await db.getRepository('tests').findOne();
    expect(item.get('date1')).toBe('2023-03-24 13:00:00');
  });

  it('should set datetime no tz field', async () => {
    db.collection({
      name: 'tests',
      timestamps: false,
      fields: [{ name: 'date1', type: 'datetimeNoTz' }],
    });

    await db.sync();

    const item = await db.getRepository('tests').create({
      values: {
        date1: '2023-03-24 12:00:00',
      },
    });

    expect(item.get('date1')).toBe('2023-03-24 12:00:00');
  });

  it('should set default to current time', async () => {
    const c1 = db.collection({
      name: 'test11',
      fields: [
        {
          name: 'date1',
          type: 'datetimeNoTz',
          defaultToCurrentTime: true,
        },
      ],
    });

    await db.sync();

    const instance = await c1.repository.create({});
    const date1 = instance.get('date1');
    expect(date1).toBeTruthy();
  });

  it('should set to current time when update', async () => {
    const c1 = db.collection({
      name: 'test11',
      fields: [
        {
          name: 'date1',
          type: 'datetimeNoTz',
          onUpdateToCurrentTime: true,
        },
        {
          name: 'title',
          type: 'string',
        },
      ],
    });

    await db.sync();

    const instance = await c1.repository.create({
      values: {
        title: 'test',
      },
    });

    const date1Val = instance.get('date1');
    expect(date1Val).toBeTruthy();

    await sleep(1000);

    await c1.repository.update({
      values: {
        title: 'test2',
      },
      filter: {
        id: instance.get('id'),
      },
    });

    await instance.reload();

    const date1Val2 = instance.get('date1');
    expect(date1Val2).toBeTruthy();
  });
});
