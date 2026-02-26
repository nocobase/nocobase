/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import Database, { Op } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import Plugin from '..';
import { CONTEXT_TYPE } from '../../common/constants';

describe('workflow: custom action trigger > manually execute', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let root;
  let rootAgent;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      acl: true,
      plugins: ['users', 'auth', 'acl', 'data-source-manager', 'error-handler', Plugin],
    });

    db = app.db;

    PostRepo = db.getCollection('posts').repository;

    WorkflowModel = db.getModel('workflows');

    const UserRepo = db.getCollection('users').repository;
    root = await UserRepo.findOne();
    rootAgent = await app.agent().login(root);
    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a' },
        { id: 3, nickname: 'b' },
      ],
    });

    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(() => app.destroy());

  describe('roles', () => {
    it('root execute', async () => {
      const w1 = await WorkflowModel.create({
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
          appends: ['category'],
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
      });

      const { category, ...data } = p1.toJSON();
      const res1 = await rootAgent.resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          data,
          userId: users[1].id,
        },
      });

      expect(res1.status).toBe(200);
      expect(res1.body.data.execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [e1] = await w1.getExecutions();
      expect(e1.id).toBe(res1.body.data.execution.id);
      expect(e1.context.data).toMatchObject({ id: data.id, categoryId: category.id, category: { title: 'c1' } });
      expect(e1.context.user).toMatchObject({ id: users[1].id });
    });

    it('admin execute', async () => {
      const w1 = await WorkflowModel.create({
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
          appends: ['category'],
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
      });

      const { category, ...data } = p1.toJSON();
      const res1 = await userAgents[0].resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          data,
          userId: users[0].id,
          roleName: 'admin',
        },
      });
      expect(res1.status).toBe(403);
      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(0);
    });

    it('member execute', async () => {
      const w1 = await WorkflowModel.create({
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.SINGLE_RECORD,
          collection: 'posts',
          appends: ['category'],
        },
      });

      const p1 = await PostRepo.create({
        values: { title: 't1', category: { title: 'c1' } },
      });

      const { category, ...data } = p1.toJSON();
      const res1 = await userAgents[0].resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          data,
          userId: users[0].id,
          roleName: 'member',
        },
      });
      expect(res1.status).toBe(403);
      const e1s = await w1.getExecutions();
      expect(e1s.length).toBe(0);
    });
  });

  describe('type', async () => {
    it('global', async () => {
      const w1 = await WorkflowModel.create({
        sync: true,
        type: 'custom-action',
        config: {},
      });

      const res1 = await rootAgent.resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          userId: users[0].id,
          roleName: 'admin',
        },
      });

      expect(res1.status).toBe(200);

      const [e1] = await w1.getExecutions();
      expect(e1).toBeDefined();
      expect(e1.id).toBe(res1.body.data.execution.id);
    });

    it('multiple records', async () => {
      const w1 = await WorkflowModel.create({
        type: 'custom-action',
        config: {
          type: CONTEXT_TYPE.MULTIPLE_RECORDS,
          collection: 'posts',
          appends: ['category'],
        },
      });

      const p1s = await PostRepo.create({
        values: [
          { title: 't1', category: { title: 'c1' } },
          { title: 't2', category: { title: 'c2' } },
        ],
      });

      const res1 = await rootAgent.resource('workflows').execute({
        filterByTk: w1.id,
        values: {
          filterByTk: [p1s[0].id, p1s[1].id],
          userId: users[0].id,
          roleName: 'admin',
        },
      });
      expect(res1.status).toBe(200);
      expect(res1.body.data.execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [e1] = await w1.getExecutions();
      expect(e1.id).toBe(res1.body.data.execution.id);
      expect(e1.context.data).toMatchObject(
        p1s.map((item) => {
          const { createdAt, updatedAt, createdById, updatedById, category, ...record } = item.get();
          const { createdAt: c1, updatedAt: c2, createdById: c3, updatedById: c4, ...categoryRecord } = category.get();
          return {
            ...record,
            category: categoryRecord,
          };
        }),
      );
      expect(e1.context.user).toMatchObject({ id: users[0].id });
    });
  });
});
