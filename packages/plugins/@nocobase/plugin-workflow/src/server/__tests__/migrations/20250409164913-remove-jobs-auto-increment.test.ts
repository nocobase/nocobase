/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import { getApp } from '@nocobase/plugin-workflow-test';

import Migration from '../../migrations/20250409164913-remove-jobs-auto-increment';

describe.skipIf(process.env.DB_DIALECT === 'sqlite')('20250409164913-remove-jobs-auto-increment', () => {
  let app: MockServer;
  let OldCollection;

  beforeEach(async () => {
    app = await getApp();
    await app.version.update('1.6.0');
    OldCollection = app.db.collection({
      name: 'jobs',
      fields: [],
    });
    await app.db.sync({ force: true });
  });

  afterEach(() => app.destroy());

  it.runIf(process.env.DB_DIALECT === 'postgres')('[PG] no auto increment any more', async () => {
    const oldColumns = await app.db.sequelize.getQueryInterface().describeTable(OldCollection.getTableNameWithSchema());
    expect(oldColumns.id.defaultValue.includes('jobs_id_seq::regclass')).toBe(true);

    const JobRepo = app.db.getRepository('jobs');
    const j1 = await JobRepo.create({});
    expect(j1.id).toBe(1);

    const migration = new Migration({ app, db: app.db } as any);
    await migration.up();

    const newColumns = await app.db.sequelize.getQueryInterface().describeTable(OldCollection.getTableNameWithSchema());
    expect(newColumns.id.defaultValue).toBeFalsy();

    await expect(async () => await JobRepo.create({})).rejects.toThrow();
  });

  it.runIf(['mysql', 'mariadb'].includes(process.env.DB_DIALECT))('[MySQL] no auto increment any more', async () => {
    const oldColumns = await app.db.sequelize.getQueryInterface().describeTable(OldCollection.getTableNameWithSchema());
    expect(oldColumns.id.autoIncrement).toBe(true);

    const JobRepo = app.db.getRepository('jobs');
    const j1 = await JobRepo.create({});
    expect(j1.id).toBe(1);

    const migration = new Migration({ app, db: app.db } as any);
    await migration.up();

    const newColumns = await app.db.sequelize.getQueryInterface().describeTable(OldCollection.getTableNameWithSchema());
    expect(newColumns.id.autoIncrement).toBe(false);

    await expect(async () => await JobRepo.create({})).rejects.toThrow();
  });
});
