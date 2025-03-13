/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer } from '@nocobase/test';
import { describe, test } from 'vitest';
import workflowManualTasks from '../../collections/workflowManualTasks';
import Migration from '../../migrations/20250312100512-change-table-name';

const matrix: [string, string][] = [
  // schema, tablePrefix
  [undefined, undefined],
  ['ss', undefined],
  [undefined, 'tt_'],
  ['ss', 'tt_'],
];

function matrixTest() {
  for (const [schema, tablePrefix] of matrix) {
    if (schema && process.env.DB_DIALECT !== 'postgres') {
      continue;
    }
    test(`schema: ${schema}, tablePrefix: ${tablePrefix}`, async () => {
      const app = await createMockServer({
        database: {
          schema,
          tablePrefix,
        },
      });
      await app.version.update('1.5.0');
      const oldCollection = app.db.collection({
        ...workflowManualTasks,
        name: 'users_jobs',
      });
      await app.db.sync();
      const r1 = await oldCollection.repository.create({});
      const migration = new Migration({ db: app.db, app } as any);
      await migration.up();

      const newCollection = app.db.collection({
        ...workflowManualTasks,
      });
      const r2 = await newCollection.repository.findOne({
        filterByTk: r1.id,
      });
      expect(r2).toBeTruthy();

      await app.destroy();
    });
  }
}

describe('20250225175712-change-table-name.test', () => {
  matrixTest();

  test(`new table exists`, async () => {
    const app = await createMockServer();
    await app.version.update('1.5.0');
    const oldCollection = app.db.collection({
      ...workflowManualTasks,
      name: 'users_jobs',
    });
    const newCollection = app.db.collection({
      ...workflowManualTasks,
    });
    await app.db.sync();
    const r1 = await oldCollection.repository.create({});
    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const r2 = await newCollection.repository.findOne({
      filterByTk: r1.id,
    });
    expect(r2).toBeTruthy();

    await app.destroy();
  });
});
