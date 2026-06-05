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
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow > instructions > sql > security', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let PostCollection;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostCollection = db.getCollection('posts');
    PostRepo = PostCollection.repository;

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

  describe('sql injection prevention (safe mode)', () => {
    it('tautology in WHERE clause (1 OR 1=1)', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      await PostRepo.create({ values: { title: 't1' }, hooks: false });
      await PostRepo.create({ values: { title: 't2' }, hooks: false });

      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `select * from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier(
            'title',
          )} = :a`,
          unsafeInjection: false,
          variables: [{ name: 'a', value: '1 OR 1=1' }],
        },
      });

      const post = await PostRepo.create({ values: { title: 't3' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      // "1 OR 1=1" is treated as a literal string, not as SQL expression
      expect(sqlJob.result.length).toBe(0);
    });

    it('UNION SELECT injection', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      await PostRepo.create({ values: { title: 'normal' }, hooks: false });

      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `select ${queryInterface.quoteIdentifier(
            'title',
          )} from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier('title')} = :a`,
          unsafeInjection: false,
          variables: [{ name: 'a', value: "' UNION SELECT usename FROM pg_user --" }],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(sqlJob.result.length).toBe(0);
    });

    it('semicolon with DROP TABLE', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      await PostRepo.create({ values: { title: 'keep' }, hooks: false });

      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `select * from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier(
            'title',
          )} = :a`,
          unsafeInjection: false,
          variables: [{ name: 'a', value: `'; DROP TABLE ${PostCollection.quotedTableName()}; --` }],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);

      // Table should still exist and data should be intact
      const remaining = await PostRepo.find();
      expect(remaining.length).toBeGreaterThanOrEqual(2);
    });

    it('comment bypass (-- )', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      await PostRepo.create({ values: { title: 'secret' }, hooks: false });

      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `select * from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier(
            'title',
          )} = :a AND ${queryInterface.quoteIdentifier('published')} = true`,
          unsafeInjection: false,
          variables: [{ name: 'a', value: "secret' --" }],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(sqlJob.result.length).toBe(0);
    });

    it('numeric parameter with dynamic variable', async () => {
      const queryInterface = db.sequelize.getQueryInterface();

      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `select * from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier('id')} = :a`,
          unsafeInjection: false,
          variables: [{ name: 'a', value: '{{$context.data.id}}' }],
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(sqlJob.result.length).toBe(1);
      expect(sqlJob.result[0].id).toBe(post.id);
    });
  });
});
