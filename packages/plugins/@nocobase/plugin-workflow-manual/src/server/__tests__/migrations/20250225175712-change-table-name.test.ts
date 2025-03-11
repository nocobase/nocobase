/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { describe, test } from 'vitest';
import workflowManualTasks from '../../collections/workflowManualTasks';
import Migration from '../../migrations/20250225175712-change-table-name';

const pgOnly = process.env.DB_DIALECT == 'postgres' ? it : it.skip;

const matrix: [string, string][] = [
  // schema, tablePrefix
  [undefined, undefined],
  ['ss', undefined],
  [undefined, 'tt_'],
  ['ss', 'tt_'],
];

function matrixTest() {
  for (const [schema, tablePrefix] of matrix) {
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
});
