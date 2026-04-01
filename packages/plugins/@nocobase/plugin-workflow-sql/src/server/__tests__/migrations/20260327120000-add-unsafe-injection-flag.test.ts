/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { getApp } from '@nocobase/plugin-workflow-test';

import Plugin from '../..';
import Migration from '../../migrations/20260327120000-add-unsafe-injection-flag';

describe('migration - add unsafe injection flag', () => {
  let app: Application;
  let db: Database;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.destroy());

  it('should mark node with variables as unsafeInjection', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: `select * from posts where id = {{$context.data.id}}`,
      },
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    expect(n1.config.unsafeInjection).toBe(true);
  });

  it('should not mark node without variables', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: `select 1 as a`,
      },
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    expect(n1.config.unsafeInjection).toBeUndefined();
  });

  it('should not mark node with empty sql', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: '',
      },
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    expect(n1.config.unsafeInjection).toBeUndefined();
  });

  it('should handle node without sql config', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {},
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    expect(n1.config.unsafeInjection).toBeUndefined();
  });

  it('should mark node with multiple variables', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: `update posts set read = {{$context.data.id}} where id = {{$context.data.id}}`,
      },
    });

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    expect(n1.config.unsafeInjection).toBe(true);
  });

  it('should only mark nodes with variables among mixed nodes', async () => {
    const n1 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: `select 1 as a`,
      },
    });

    const n2 = await workflow.createNode({
      type: 'sql',
      config: {
        sql: `select * from posts where id = {{$context.data.id}}`,
      },
      upstreamId: n1.id,
    });

    await n1.setDownstream(n2);

    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    await n1.reload();
    await n2.reload();
    expect(n1.config.unsafeInjection).toBeUndefined();
    expect(n2.config.unsafeInjection).toBe(true);
  });
});
