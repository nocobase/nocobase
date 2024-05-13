/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '../../database';
import { mockDatabase } from '../index';

describe.runIf(process.env['DB_DIALECT'] === 'postgres')('sync inherits', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should update table fields', async () => {
    const person = db.collection({
      name: 'person',
      fields: [{ type: 'string', name: 'name' }],
    });

    const student = db.collection({
      name: 'student',
      inherits: 'person',
    });

    await db.sync();

    student.setField('score', { type: 'integer' });

    await db.sync();

    const studentTableInfo = await db.sequelize.getQueryInterface().describeTable(student.model.tableName);
    expect(studentTableInfo.score).toBeDefined();
  });
});
