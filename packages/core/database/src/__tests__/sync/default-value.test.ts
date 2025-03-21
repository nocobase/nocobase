/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';

describe('default value', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should sync field default value', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'userName', defaultValue: 'u1' },
        { type: 'string', name: 'userEmail' },
      ],
    });

    await db.sync();

    const getFieldDefaultValue = (tableInfo, fieldName) => {
      const columnName = User.model.rawAttributes[fieldName].field;

      const field = tableInfo[columnName];

      return field.defaultValue || null;
    };

    const userTableInfo: any = await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());

    expect(getFieldDefaultValue(userTableInfo, 'userName')).toBe('u1');
    expect(getFieldDefaultValue(userTableInfo, 'userEmail')).toBeNull();

    User.setField('userName', { type: 'string', name: 'userName' });
    User.setField('userEmail', { type: 'string', name: 'userEmail', defaultValue: 'e1' });

    await db.sync();
    const userTableInfo2: any = await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());

    expect(getFieldDefaultValue(userTableInfo2, 'userName')).toBeNull();
    expect(getFieldDefaultValue(userTableInfo2, 'userEmail')).toBe('e1');
  });
});
