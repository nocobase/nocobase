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
import Plugin from '../../Plugin';

describe('workflow > actions > workflows', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostModel;
  let PostRepo;
  let WorkflowModel;
  let WorkflowRepo;
  let ExecutionModel;
  let WorkflowStatsRepo;
  let WorkflowVersionStatsRepo;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    WorkflowRepo = db.getCollection('workflows').repository;
    ExecutionModel = db.getCollection('executions').model;
    WorkflowStatsRepo = db.getCollection('workflowStats').repository;
    WorkflowVersionStatsRepo = db.getCollection('workflowVersionStats').repository;
    PostModel = db.getCollection('posts').model;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => app.destroy());

  describe('update', () => {
    it('update unexecuted workflow should be ok', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            mode: 1,
            collection: 'tags',
          },
        },
      });

      expect(status).toBe(200);
    });

    it('update executed workflow should not be ok', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          config: {
            mode: 1,
            collection: 'tags',
          },
        },
      });
      expect(status).toBe(400);
    });

    it('only update executed workflow with "enabled" should be ok', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      const { status } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          enabled: false,
          key: workflow.key,
        },
      });
      expect(status).toBe(200);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(1);
    });

    it('update options should be ok', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 3,
          collection: 'posts',
        },
      });
      await workflow.createNode({
        type: 'create',
        config: {
          collection: 'posts',
          values: {
            title: 't-{{$context.data.id}}',
          },
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const c1 = await workflow.countExecutions();
      expect(c1).toBe(1);

      const { status, body } = await agent.resource('workflows').update({
        filterByTk: workflow.id,
        values: {
          options: {
            stackLimit: 3,
          },
        },
      });
      expect(status).toBe(200);
      expect(body.data[0].options.stackLimit).toBe(3);

      const plugin = app.pm.get(Plugin) as Plugin;
      const w1 = plugin.enabledCache.get(workflow.id);
      expect(w1.options.stackLimit).toBe(3);

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const c2 = await workflow.countExecutions();
      expect(c2).toBe(4);

      const p2s = await PostRepo.find();
      expect(p2s.length).toBe(6);
    });
  });

  describe('destroy', () => {
    it('cascading destroy all revisions, nodes, but not executions and jobs', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'update',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{$context.data.id}}',
            },
            values: {
              title: 't2',
            },
          },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const { model: JobModel } = db.getCollection('jobs');

      const e1c = await workflow.countExecutions();
      expect(e1c).toBe(1);
      const j1c = await JobModel.count();
      expect(j1c).toBe(1);
      const p1 = await PostRepo.findOne();
      expect(p1.title).toBe('t2');

      const { id, ...w1 } = workflow.get();
      const w2 = await WorkflowModel.create(w1);
      const { id: n1Id, ...n1Data } = n1.get();
      const n2 = await w2.createNode(n1Data);

      await agent.resource(`workflows`).destroy({
        filterByTk: w2.id,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const w2c = await WorkflowModel.count();
      expect(w2c).toBe(0);
      const e2c = await ExecutionModel.count();
      expect(e2c).toBe(1);
      const n1c = await workflow.countNodes();
      expect(n1c).toBe(0);
      const n2c = await w2.countNodes();
      expect(n2c).toBe(0);
      const p2c = await PostRepo.count({ filter: { title: 't1' } });
      expect(p2c).toBe(1);

      const j2c = await JobModel.count();
      expect(j2c).toBe(1);

      // NOTE: stats records should be deleted
      const statsCount = await WorkflowStatsRepo.count();
      expect(statsCount).toBe(0);
      const versionStatsCount = await WorkflowVersionStatsRepo.count();
      expect(versionStatsCount).toBe(0);
    });

    it('destroy current version should delete stats record too', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const s1 = await WorkflowStatsRepo.find();
      expect(s1.length).toBe(1);
      expect(s1[0].key).toBe(w1.key);

      await agent.resource(`workflows`).destroy({
        filterByTk: w1.id,
      });

      const statsCount = await WorkflowStatsRepo.count();
      expect(statsCount).toBe(0);
    });

    it('destroy non-current version should not delete stats record', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const s1 = await WorkflowStatsRepo.find();
      expect(s1.length).toBe(1);
      expect(s1[0].key).toBe(w1.key);

      const w2 = await WorkflowRepo.revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
        context: {
          app,
        },
      });

      await agent.resource(`workflows`).destroy({
        filterByTk: w2.id,
      });

      const statsCount = await WorkflowStatsRepo.count();
      expect(statsCount).toBe(1);
    });
  });

  describe('revision', () => {
    it('create revision', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
        options: {
          stackLimit: 2,
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
      });

      expect(status).toBe(200);
      const w2 = await WorkflowModel.findOne({
        where: {
          id: body.data.id,
        },
        include: ['stats', 'versionStats'],
      });
      expect(w2.config).toMatchObject(w1.config);
      expect(w2.key).toBe(w1.key);
      expect(w2.current).toBeFalsy();
      expect(w2.enabled).toBe(false);
      expect(w2.versionStats.executed).toBe(0);
      expect(w2.stats.executed).toBe(1);

      const s1c = await WorkflowStatsRepo.count();
      expect(s1c).toBe(1);
      const sv1c = await WorkflowVersionStatsRepo.count();
      expect(sv1c).toBe(2);
      expect(w2.options.stackLimit).toBe(2);

      await WorkflowModel.update(
        {
          enabled: true,
        },
        {
          where: {
            id: w2.id,
          },
          individualHooks: true,
        },
      );

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const [w1next, w2next] = await WorkflowModel.findAll({
        order: [['id', 'ASC']],
        include: ['stats', 'versionStats'],
      });

      expect(w1next.enabled).toBe(false);
      expect(w1next.current).toBe(null);
      expect(w1next.stats.executed).toBe(2);
      expect(w2next.enabled).toBe(true);
      expect(w2next.current).toBe(true);
      expect(w2next.versionStats.executed).toBe(1);
      expect(w2next.stats.executed).toBe(2);
      expect(w2next.options.stackLimit).toBe(2);

      const [e1] = await w1next.getExecutions();
      const [e2] = await w2next.getExecutions();
      expect(e1.key).toBe(e2.key);
      expect(e1.workflowId).toBe(w1.id);
      expect(e2.workflowId).toBe(w2.id);
    });

    it('revision with nodes', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await w1.createNode({
        type: 'echo',
      });
      const n2 = await w1.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}.data.read}} + {{$jobsMapByNodeKey.${n1.key}.data.read}}`,
        },
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const { body } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
      });
      const w2 = await WorkflowModel.findByPk(body.data.id, {
        include: ['nodes'],
      });

      const n1_2 = w2.nodes.find((n) => !n.upstreamId);
      const n2_2 = w2.nodes.find((n) => !n.downstreamId);

      expect(n1_2.key).toBe(n1.key);
      expect(n1_2.type).toBe('echo');
      expect(n2_2.type).toBe('calculation');
      expect(n2_2.config).toMatchObject({
        engine: 'math.js',
        expression: `{{$jobsMapByNodeKey.${n1_2.key}.data.read}} + {{$jobsMapByNodeKey.${n1_2.key}.data.read}}`,
      });

      await w2.update({ enabled: true });

      await PostRepo.create({
        values: { title: 't1', read: 1 },
      });

      await sleep(500);

      const [execution] = await w2.getExecutions();
      const [echo, calculation] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(calculation.result).toBe(2);
    });

    it('duplicate workflow', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
      });

      expect(status).toBe(200);
      const w2 = await WorkflowModel.findOne({
        where: {
          id: body.data.id,
        },
        include: ['stats', 'versionStats'],
      });
      expect(w2.config).toMatchObject(w1.config);
      expect(w2.key).not.toBe(w1.key);
      expect(w2.current).toBeTruthy();
      expect(w2.enabled).toBe(false);
      expect(w2.stats.executed).toBe(0);
      expect(w2.versionStats.executed).toBe(0);

      // stop w1
      await WorkflowModel.update(
        {
          enabled: false,
        },
        {
          where: {
            id: w1.id,
          },
          individualHooks: true,
        },
      );

      await WorkflowModel.update(
        {
          enabled: true,
        },
        {
          where: {
            id: w2.id,
          },
          individualHooks: true,
        },
      );

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      await sleep(500);

      const [w1next, w2next] = await WorkflowModel.findAll({
        order: [['id', 'ASC']],
        include: ['stats', 'versionStats'],
      });

      expect(w1next.enabled).toBe(false);
      expect(w1next.current).toBe(true);
      expect(w1next.versionStats.executed).toBe(1);
      expect(w1next.stats.executed).toBe(1);
      expect(w2next.enabled).toBe(true);
      expect(w2next.versionStats.executed).toBe(1);
      expect(w2next.stats.executed).toBe(1);

      const [e1] = await w1next.getExecutions();
      const [e2] = await w2next.getExecutions();
      expect(e1.key).not.toBe(e2.key);
      expect(e2.workflowId).toBe(w2.id);
    });

    it('duplicate sync workflow', async () => {
      const w1 = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
        sync: true,
      });

      const p1 = await PostRepo.create({ values: { title: 't1' } });

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
      });

      expect(status).toBe(200);
      const w2 = await WorkflowModel.findOne({
        where: {
          id: body.data.id,
        },
        include: ['stats', 'versionStats'],
      });
      expect(w2.config).toMatchObject(w1.config);
      expect(w2.key).not.toBe(w1.key);
      expect(w2.current).toBeTruthy();
      expect(w2.enabled).toBe(false);
      expect(w2.stats.executed).toBe(0);
      expect(w2.sync).toBe(true);

      // stop w1
      await WorkflowModel.update(
        {
          enabled: false,
        },
        {
          where: {
            id: w1.id,
          },
          individualHooks: true,
        },
      );

      await WorkflowModel.update(
        {
          enabled: true,
        },
        {
          where: {
            id: w2.id,
          },
          individualHooks: true,
        },
      );

      const p2 = await PostRepo.create({ values: { title: 't2' } });

      const [w1next, w2next] = await WorkflowModel.findAll({
        order: [['id', 'ASC']],
        include: ['stats', 'versionStats'],
      });

      expect(w1next.enabled).toBe(false);
      expect(w1next.current).toBe(true);
      expect(w1next.versionStats.executed).toBe(1);
      expect(w1next.stats.executed).toBe(1);
      expect(w2next.enabled).toBe(true);
      expect(w2next.versionStats.executed).toBe(1);
      expect(w2next.stats.executed).toBe(1);

      const [e1] = await w1next.getExecutions();
      const [e2] = await w2next.getExecutions();
      expect(e1.key).not.toBe(e2.key);
      expect(e2.workflowId).toBe(w2.id);
    });

    it('revision with categories', async () => {
      const CategoryRepo = db.getRepository('workflowCategories');
      const categories = await CategoryRepo.create({
        values: [{ title: 'c1' }, { title: 'c2' }, { title: 'c3' }],
      });
      const w1 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'collection',
          config: {
            mode: 1,
            collection: 'posts',
          },
          options: {
            stackLimit: 2,
          },
          categories: categories.map((item) => item.id),
        },
      });
      await w1.reload({
        include: ['categories'],
      });
      expect(w1.categories.length).toBe(categories.length);

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
        filter: {
          key: w1.key,
        },
      });

      expect(status).toBe(200);

      const w2 = await WorkflowModel.findOne({
        where: {
          id: body.data.id,
        },
        include: ['stats', 'versionStats', 'categories'],
      });
      expect(w2.categories.length).toBe(categories.length);
    });

    it('duplicate with categories', async () => {
      const CategoryRepo = db.getRepository('workflowCategories');
      const categories = await CategoryRepo.create({
        values: [{ title: 'c1' }, { title: 'c2' }, { title: 'c3' }],
      });
      const w1 = await WorkflowRepo.create({
        values: {
          enabled: true,
          type: 'collection',
          config: {
            mode: 1,
            collection: 'posts',
          },
          options: {
            stackLimit: 2,
          },
          categories: categories.map((item) => item.id),
        },
      });
      await w1.reload({
        include: ['categories'],
      });
      expect(w1.categories.length).toBe(categories.length);

      const { body, status } = await agent.resource(`workflows`).revision({
        filterByTk: w1.id,
      });

      expect(status).toBe(200);

      const w2 = await WorkflowModel.findOne({
        where: {
          id: body.data.id,
        },
        include: ['stats', 'versionStats', 'categories'],
      });
      expect(w2.categories.length).toBe(categories.length);
      expect(w2.key).not.toBe(w1.key);
    });
  });
});
