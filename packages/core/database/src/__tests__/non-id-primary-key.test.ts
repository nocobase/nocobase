/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database, mockDatabase } from '@nocobase/database';

describe('non-id primary key', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create auto increment field as primary key', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
    });
    await db.sync();

    User.setField('field_auto_incr', { type: 'integer', primaryKey: true, autoIncrement: true });

    await db.sync();

    await User.repository.create({});
  });

  it('should add createdAt && updatedAt field', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    User.setField('createdAt', {
      uiSchema: {
        'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: true, timeFormat: 'HH:mm:ss' },
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
      },
      name: 'xxxx',
      type: 'date',
      field: 'createdAt',
      interface: 'createdAt',
    });

    User.setField('updatedAt', {
      uiSchema: {
        'x-component-props': { dateFormat: 'YYYY-MM-DD', showTime: true, timeFormat: 'HH:mm:ss' },
        type: 'datetime',
        title: '{{t("Updated at")}}',
        'x-component': 'DatePicker',
        'x-read-pretty': true,
      },
      name: 'updatedAttt',
      type: 'date',
      field: 'updatedAt',
      interface: 'updatedAt',
    });

    await db.sync();

    const user = await User.repository.create({
      values: { name: 'test' },
    });

    expect(user.get('xxxx')).toBeTruthy();
    expect(user.get('updatedAttt')).toBeTruthy();
  });
});
