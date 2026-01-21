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

describe('workflow > actions > jobs', () => {
  let app: MockServer;
  let rootAgent;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let users;
  let userAgents;

  beforeEach(async () => {
    app = await getApp({
      acl: true,
    });
    db = app.db;
    const UserRepo = db.getCollection('users').repository;
    const user = await UserRepo.findOne();
    rootAgent = await app.agent().loginUsingId(user.id);
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
    users = await UserRepo.createMany({
      records: [
        { id: 2, nickname: 'a', roles: ['admin'] },
        { id: 3, nickname: 'b' },
      ],
    });
    userAgents = await Promise.all(users.map((user) => app.agent().login(user)));
  });

  afterEach(async () => await app.destroy());

  describe('resume', () => {
    it('only root could resume jobs', async () => {
      const n1 = await workflow.createNode({
        type: 'pending',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);
      const j1s = await e1[0].getJobs();
      expect(j1s.length).toBe(1);
      const res1 = await userAgents[0].resource('jobs').resume({
        filterByTk: j1s[0].id,
      });
      expect(res1.status).toBe(403);

      const res2 = await rootAgent.resource('jobs').resume({
        filterByTk: j1s[0].id,
        values: {
          status: JOB_STATUS.RESOLVED,
        },
      });
      expect(res2.status).toBe(202);
      await sleep(500);

      await e1[0].reload();
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.RESOLVED);
      const j2s = await e1[0].getJobs({ order: [['id', 'ASC']] });
      expect(j2s.length).toBe(2);
      expect(j2s[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(j2s[1].status).toBe(JOB_STATUS.RESOLVED);
    });

    it('resume with reject status', async () => {
      const n1 = await workflow.createNode({
        type: 'pending',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);
      const j1s = await e1[0].getJobs();
      expect(j1s.length).toBe(1);

      const res1 = await rootAgent.resource('jobs').resume({
        filterByTk: j1s[0].id,
        values: {
          status: JOB_STATUS.REJECTED,
        },
      });
      expect(res1.status).toBe(202);
      await sleep(500);

      await e1[0].reload();
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.REJECTED);
      const j2s = await e1[0].getJobs({ order: [['id', 'ASC']] });
      expect(j2s.length).toBe(1);
      expect(j2s[0].status).toBe(JOB_STATUS.REJECTED);
    });

    it('resume with pending status', async () => {
      const n1 = await workflow.createNode({
        type: 'pending',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const e1 = await workflow.getExecutions();
      expect(e1.length).toBe(1);
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);
      const j1s = await e1[0].getJobs();
      expect(j1s.length).toBe(1);

      const res1 = await rootAgent.resource('jobs').resume({
        filterByTk: j1s[0].id,
      });
      expect(res1.status).toBe(202);
      await sleep(500);

      await e1[0].reload();
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);
      const j2s = await e1[0].getJobs({ order: [['id', 'ASC']] });
      expect(j2s.length).toBe(1);
      expect(j2s[0].status).toBe(JOB_STATUS.PENDING);

      const res2 = await rootAgent.resource('jobs').resume({
        filterByTk: j1s[0].id,
        values: {
          status: JOB_STATUS.PENDING,
        },
      });
      expect(res2.status).toBe(202);
      await sleep(500);

      await e1[0].reload();
      expect(e1[0].get('status')).toBe(EXECUTION_STATUS.STARTED);
      const j3s = await e1[0].getJobs({ order: [['id', 'ASC']] });
      expect(j3s.length).toBe(1);
      expect(j3s[0].status).toBe(JOB_STATUS.PENDING);
    });
  });
});
