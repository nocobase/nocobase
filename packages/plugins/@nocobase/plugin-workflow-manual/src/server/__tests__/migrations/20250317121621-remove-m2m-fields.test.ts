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

import Migration from '../../migrations/20250317121621-remove-m2m-fields';

describe('20250225175712-change-table-name.test', () => {
  test(`old table and fields should not exist after migrated with fields removed`, async () => {
    const app = await createMockServer();
    await app.version.update('1.5.0');
    const fieldCollection = app.db.collection({
      name: 'fields',
      fields: [
        {
          name: 'collectionName',
          type: 'string',
        },
        {
          name: 'name',
          type: 'string',
        },
      ],
    });
    const usersCollection = app.db.collection({
      name: 'users',
      fields: [
        {
          name: 'jobs',
          type: 'belongsToMany',
        },
        {
          name: 'usersJobs',
          type: 'hasMany',
        },
      ],
    });
    const jobsCollection = app.db.collection({
      name: 'jobs',
      fields: [
        {
          name: 'users',
          type: 'belongsToMany',
        },
        {
          name: 'usersJobs',
          type: 'hasMany',
        },
      ],
    });
    const oldCollection = app.db.collection({
      name: 'users_jobs',
      fields: [
        {
          name: 'jobs',
          type: 'belongsTo',
        },
        {
          name: 'users',
          type: 'belongsTo',
        },
      ],
    });
    await app.db.sync();

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const oldTableExists = await app.db.sequelize
      .getQueryInterface()
      .tableExists(oldCollection.getTableNameWithSchema());
    expect(oldTableExists).toBe(false);

    const f1 = await fieldCollection.repository.find({
      filter: {
        collectionName: 'users',
        name: ['jobs', 'usersJobs'],
      },
    });
    expect(f1.length).toBe(0);

    const f2 = await fieldCollection.repository.find({
      filter: {
        collectionName: 'jobs',
        name: ['users', 'usersJobs'],
      },
    });
    expect(f2.length).toBe(0);

    await app.destroy();
  });
});
