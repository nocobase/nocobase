/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '../../constants';

describe('workflow > actions > executions', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(async () => await app.destroy());

  describe('destroy', () => {
    it('completed execution could be deleted', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(0);
    });

    it('started execution could not be deleted', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').destroy({
        filter: {
          key: workflow.key,
        },
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(1);
    });
  });

  describe('cancel', () => {
    it('execution not exists could not be canceled', async () => {
      const { status } = await agent.resource('executions').cancel({
        filterByTk: -1,
      });

      expect(status).toBe(404);
    });

    it('completed execution could not be canceled', async () => {
      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);

      const { status } = await agent.resource('executions').cancel({
        filterByTk: e1.id,
      });

      expect(status).toBe(400);
    });

    it('pending execution could be cancel', async () => {
      await workflow.createNode({
        type: 'pending',
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);

      await agent.resource('executions').cancel({
        filterByTk: e1.id,
      });

      const e2 = await workflow.getExecutions();
      expect(e2.length).toBe(1);
      expect(e2[0].get('status')).toBe(EXECUTION_STATUS.CANCELED);
      const jobs = await e2[0].getJobs();
      expect(jobs[0].status).toBe(JOB_STATUS.CANCELED);
    });
  });
});
