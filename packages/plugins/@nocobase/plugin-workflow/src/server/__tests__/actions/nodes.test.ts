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
import { JOB_STATUS } from '../../constants';
import { FlowNodeModel } from '../../types';

describe('workflow > actions > nodes', () => {
  let app: MockServer;
  let agent;
  let db: Database;
  let PostModel;
  let PostRepo;
  let WorkflowModel;

  beforeEach(async () => {
    app = await getApp();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostModel = db.getCollection('posts').model;
    PostRepo = db.getCollection('posts').repository;
  });

  afterEach(() => app.destroy());

  describe('create', () => {
    it('create in unexecuted workflow', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const {
        status,
        body: { data },
      } = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(status).toBe(200);
      expect(data.type).toBe('echo');
    });

    it.skipIf(process.env.DB_DIALECT === 'sqlite')('create in executed workflow', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });
      await workflow.stats.update({ executed: 1 });
      await workflow.versionStats.update({ executed: 1 });

      const res1 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res1.status).toBe(400);

      await workflow.stats.update({ executed: '10000000000000001' });
      await workflow.versionStats.update({ executed: '10000000000000001' });

      const res2 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res2.status).toBe(400);
    });

    it('create as head', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const res1 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res1.status).toBe(200);
      expect(res1.body.data.type).toBe('echo');
      expect(res1.body.data.upstreamId).toBeFalsy();

      const res2 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res2.status).toBe(200);
      expect(res2.body.data.type).toBe('echo');
      expect(res2.body.data.upstreamId).toBeFalsy();
      expect(res2.body.data.downstreamId).toBe(res1.body.data.id);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].upstreamId).toBe(nodes[1].id);
      expect(nodes[1].downstreamId).toBe(nodes[0].id);
    });

    it.skip('create as head concurrently', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const [res1, res2] = await Promise.all([
        agent.resource('workflows.nodes', workflow.id).create({
          values: {
            type: 'echo',
          },
        }),
        agent.resource('workflows.nodes', workflow.id).create({
          values: {
            type: 'echo',
          },
        }),
      ]);
      expect(res1.status).toBe(200);
      expect(res1.body.data.type).toBe('echo');
      expect(res1.body.data.upstreamId).toBeFalsy();

      expect(res2.status).toBe(200);
      expect(res2.body.data.type).toBe('echo');
      expect(res2.body.data.upstreamId).toBeFalsy();
      expect(res2.body.data.downstreamId).toBe(res1.body.data.id);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].upstreamId).toBe(nodes[1].id);
      expect(nodes[1].downstreamId).toBe(nodes[0].id);
    });

    it('create after other node', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const res1 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });

      const res2 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
          upstreamId: res1.body.data.id,
        },
      });
      expect(res2.body.data.upstreamId).toBe(res1.body.data.id);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].downstreamId).toBe(nodes[1].id);
      expect(nodes[1].upstreamId).toBe(nodes[0].id);
    });

    it('create as branch', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const res1 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });

      const res2 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
          upstreamId: res1.body.data.id,
          branchIndex: 0,
        },
      });
      expect(res2.body.data.upstreamId).toBe(res1.body.data.id);
      expect(res2.body.data.branchIndex).toBe(0);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].downstreamId).toBeNull();
      expect(nodes[1].upstreamId).toBe(nodes[0].id);
    });

    it('create with nodes limit', async () => {
      const NODES_LIMIT = process.env.WORKFLOW_NODES_LIMIT ? parseInt(process.env.WORKFLOW_NODES_LIMIT, 10) : null;
      process.env.WORKFLOW_NODES_LIMIT = '2';

      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const res1 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res1.status).toBe(200);

      const res2 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res2.status).toBe(200);

      const res3 = await agent.resource('workflows.nodes', workflow.id).create({
        values: {
          type: 'echo',
        },
      });
      expect(res3.status).toBe(400);

      if (NODES_LIMIT) {
        process.env.WORKFLOW_NODES_LIMIT = NODES_LIMIT.toString();
      } else {
        delete process.env.WORKFLOW_NODES_LIMIT;
      }
    });
  });

  describe('duplicate', () => {
    it('should duplicate config but not key', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const origin = await workflow.createNode({
        type: 'echo',
        config: {
          duplicateFlag: true,
          foo: 'bar',
        },
      });

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: origin.id,
        values: {
          // NOTE: test if key is stripped
          key: origin.key,
          upstreamId: origin.id,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.key).not.toBe(origin.key);
      expect(res.body.data.config).toMatchObject({
        duplicateFlag: true,
        foo: 'bar',
        duplicated: true,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[1].upstreamId).toBe(origin.id);
    });

    it('should duplicate config when required', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const origin = await workflow.createNode({
        type: 'echo',
        config: {
          duplicateFlag: true,
          foo: 'bar',
        },
      });

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: origin.id,
        values: {
          config: {
            a: 1,
          },
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.key).not.toBe(origin.key);
      expect(res.body.data.config).toMatchObject({
        a: 1,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].upstreamId).toBe(nodes[1].id);
    });

    it('duplicate as head when upstreamId is null', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: n2.id,
        values: {
          upstreamId: null,
        },
      });

      expect(res.status).toBe(200);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      const newNode = nodes.find((node) => node.id === res.body.data.id);
      const n1Reload = nodes.find((node) => node.id === n1.id);
      const n2Reload = nodes.find((node) => node.id === n2.id);

      expect(newNode.upstreamId).toBeNull();
      expect(newNode.downstreamId).toBe(n1.id);
      expect(n1Reload.upstreamId).toBe(newNode.id);
      expect(n1Reload.downstreamId).toBe(n2.id);
      expect(n2Reload.upstreamId).toBe(n1.id);
    });

    it('duplicate after node with downstream', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);
      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
      });
      await n2.setDownstream(n3);

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: n1.id,
        values: {
          upstreamId: n1.id,
        },
      });

      expect(res.status).toBe(200);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      const newNode = nodes.find((node) => node.id === res.body.data.id);
      const n1Reload = nodes.find((node) => node.id === n1.id);
      const n2Reload = nodes.find((node) => node.id === n2.id);
      const n3Reload = nodes.find((node) => node.id === n3.id);

      expect(n1Reload.downstreamId).toBe(newNode.id);
      expect(newNode.upstreamId).toBe(n1.id);
      expect(newNode.downstreamId).toBe(n2.id);
      expect(n2Reload.upstreamId).toBe(newNode.id);
      expect(n2Reload.downstreamId).toBe(n3.id);
      expect(n3Reload.upstreamId).toBe(n2.id);
    });

    it('duplicate to branch head', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const b1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });
      const b2 = await workflow.createNode({
        type: 'echo',
        upstreamId: b1.id,
      });
      await b1.setDownstream(b2);

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: b1.id,
        values: {
          upstreamId: n1.id,
          branchIndex: 0,
        },
      });

      expect(res.status).toBe(200);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      const newNode = nodes.find((node) => node.id === res.body.data.id);
      const b1Reload = nodes.find((node) => node.id === b1.id);
      const b2Reload = nodes.find((node) => node.id === b2.id);

      expect(newNode.upstreamId).toBe(n1.id);
      expect(newNode.branchIndex).toBe(0);
      expect(newNode.downstreamId).toBe(b1.id);
      expect(b1Reload.upstreamId).toBe(newNode.id);
      expect(b1Reload.branchIndex).toBeNull();
      expect(b1Reload.downstreamId).toBe(b2.id);
      expect(b2Reload.upstreamId).toBe(b1.id);
    });

    it('duplicate to branch middle', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const b1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });
      const b2 = await workflow.createNode({
        type: 'echo',
        upstreamId: b1.id,
      });
      await b1.setDownstream(b2);
      const b3 = await workflow.createNode({
        type: 'echo',
        upstreamId: b2.id,
      });
      await b2.setDownstream(b3);

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: b1.id,
        values: {
          upstreamId: b1.id,
        },
      });

      expect(res.status).toBe(200);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      const newNode = nodes.find((node) => node.id === res.body.data.id);
      const b1Reload = nodes.find((node) => node.id === b1.id);
      const b2Reload = nodes.find((node) => node.id === b2.id);
      const b3Reload = nodes.find((node) => node.id === b3.id);

      expect(b1Reload.downstreamId).toBe(newNode.id);
      expect(newNode.upstreamId).toBe(b1.id);
      expect(newNode.downstreamId).toBe(b2.id);
      expect(b2Reload.upstreamId).toBe(newNode.id);
      expect(b2Reload.downstreamId).toBe(b3.id);
      expect(b3Reload.upstreamId).toBe(b2.id);
    });

    it('duplicate to branch tail', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });
      const b1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });
      const b2 = await workflow.createNode({
        type: 'echo',
        upstreamId: b1.id,
      });
      await b1.setDownstream(b2);

      const res = await agent.resource('flow_nodes').duplicate({
        filterByTk: b1.id,
        values: {
          upstreamId: b2.id,
        },
      });

      expect(res.status).toBe(200);

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      const newNode = nodes.find((node) => node.id === res.body.data.id);
      const b2Reload = nodes.find((node) => node.id === b2.id);

      expect(b2Reload.downstreamId).toBe(newNode.id);
      expect(newNode.upstreamId).toBe(b2.id);
      expect(newNode.downstreamId).toBeNull();
    });
  });

  describe('destroy', () => {
    it('node in executed workflow could not be destroyed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      await PostRepo.create({});

      await sleep(500);

      const { status } = await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
      });

      expect(status).toBe(400);
    });

    it('cascading destroy all nodes in sub-branches', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n1.id,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n2.id,
      });

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(0);
    });

    it('target has no upstream, 1 branch, no downstream, no `keepBranch`', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(0);
    });

    it('target has no upstream, 1 branch, no downstream, `keepBranch` as branch 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const res1 = await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 1,
      });
      expect(res1.status).toBe(400);

      const res2 = await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 'a',
      });
      expect(res2.status).toBe(400);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe(n2.id);
    });

    it('target has no upstream, 2 branches, no downstream, `keepBranch` as branch 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1,
      });

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe(n2.id);
      // NOTE: ensure key is not updated to new value
      expect(nodes[0].key).toBe(n2.key);
    });

    it('target has no upstream, 2 branches, no downstream, `keepBranch` as branch 2', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1,
      });

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 1,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe(n3.id);
    });

    it('target has no upstream, 1 branch, has downstream, `keepBranch` as branch 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n3);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].id).toBe(n2.id);
      expect(nodes[1].id).toBe(n3.id);
    });

    it('target has no upstream, 1 branch with 2 nodes, has downstream, `keepBranch` as branch 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
      });
      await n2.setDownstream(n3);

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n4);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n1.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(3);
      expect(nodes[0].id).toBe(n2.id);
      expect(nodes[1].id).toBe(n3.id);
      expect(nodes[1].downstreamId).toBe(n4.id);
      expect(nodes[2].id).toBe(n4.id);
      expect(nodes[2].upstreamId).toBe(n3.id);
    });

    it('target has upstream, 1 branch, has downstream, no `keepBranch`', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
        branchIndex: 0,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n2.setDownstream(n4);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n2.id,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(2);
      expect(nodes[0].id).toBe(n1.id);
      expect(nodes[1].id).toBe(n4.id);
    });

    it('target has upstream, 1 branch, has downstream, `keepBranch` as 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
        branchIndex: 0,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n2.setDownstream(n4);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n2.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(3);
      expect(nodes[0].id).toBe(n1.id);
      expect(nodes[1].id).toBe(n3.id);
      expect(nodes[2].id).toBe(n4.id);
    });

    it('target as branch, 1 branch, no downstream, `keepBranch` as 1', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
        branchIndex: 0,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n4);

      await agent.resource('flow_nodes').destroy({
        filterByTk: n2.id,
        keepBranch: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'asc']] });
      expect(nodes.length).toBe(3);
      expect(nodes[0].id).toBe(n1.id);
      expect(nodes[0].downstreamId).toBe(n4.id);
      expect(nodes[1].id).toBe(n3.id);
      expect(nodes[1].upstreamId).toBe(n1.id);
      expect(nodes[1].branchIndex).toBe(1);
      expect(nodes[1].downstreamId).toBe(null);
      expect(nodes[2].id).toBe(n4.id);
      expect(nodes[2].upstreamId).toBe(n1.id);
    });
  });

  describe('destroyBranch', () => {
    it('branch in executed workflow could not be destroyed', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      await workflow.stats.update({ executed: 1 });
      await workflow.versionStats.update({ executed: 1 });

      const { status } = await agent.resource('flow_nodes').destroyBranch({
        filterByTk: n1.id,
        branchIndex: 0,
      });

      expect(status).toBe(400);
    });

    it('destroyBranch removes branch nodes recursively', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const branchHead = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const branchNode = await workflow.createNode({
        type: 'echo',
        upstreamId: branchHead.id,
      });
      await branchHead.setDownstream(branchNode);

      const nestedBranchHead = await workflow.createNode({
        type: 'echo',
        upstreamId: branchNode.id,
        branchIndex: 0,
      });

      const nestedBranchNode = await workflow.createNode({
        type: 'echo',
        upstreamId: nestedBranchHead.id,
      });
      await nestedBranchHead.setDownstream(nestedBranchNode);

      await agent.resource('flow_nodes').destroyBranch({
        filterByTk: n1.id,
        branchIndex: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      expect(nodes.length).toBe(1);
      expect(nodes[0].id).toBe(n1.id);
    });

    it('destroyBranch reorders indices after removing a branch', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const keepBranch = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const removedBranch = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1,
      });

      const removedBranchChild = await workflow.createNode({
        type: 'echo',
        upstreamId: removedBranch.id,
      });
      await removedBranch.setDownstream(removedBranchChild);

      const shiftedBranch = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 2,
      });

      await agent.resource('flow_nodes').destroyBranch({
        filterByTk: n1.id,
        branchIndex: 1,
        shift: 1,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      const branchHeads = nodes
        .filter((item) => item.upstreamId === n1.id && item.branchIndex != null)
        .sort((a, b) => a.branchIndex - b.branchIndex);

      expect(nodes.find((item) => item.id === removedBranch.id)).toBeUndefined();
      expect(nodes.find((item) => item.id === removedBranchChild.id)).toBeUndefined();
      expect(branchHeads.length).toBe(2);
      expect(branchHeads[0].id).toBe(keepBranch.id);
      expect(branchHeads[0].branchIndex).toBe(0);
      expect(branchHeads[1].id).toBe(shiftedBranch.id);
      expect(branchHeads[1].branchIndex).toBe(1);
    });

    it('destroyBranch reorders indices even if the target branch has no nodes when shift enabled', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const branch0 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const branch2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 2,
      });

      await agent.resource('flow_nodes').destroyBranch({
        filterByTk: n1.id,
        branchIndex: 1,
        shift: 1,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      const branchHeads = nodes
        .filter((item) => item.upstreamId === n1.id && item.branchIndex != null)
        .sort((a, b) => a.branchIndex - b.branchIndex);

      expect(branchHeads.length).toBe(2);
      expect(branchHeads[0].id).toBe(branch0.id);
      expect(branchHeads[0].branchIndex).toBe(0);
      expect(branchHeads[1].id).toBe(branch2.id);
      expect(branchHeads[1].branchIndex).toBe(1);
    });

    it('destroyBranch keeps indices when shift flag is not set', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'collection',
        config: {
          mode: 1,
          collection: 'posts',
        },
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const branch0 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const branch1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 1,
      });

      await agent.resource('flow_nodes').destroyBranch({
        filterByTk: n1.id,
        branchIndex: 0,
      });

      const nodes = await workflow.getNodes({ order: [['id', 'ASC']] });
      const branchHeads = nodes
        .filter((item) => item.upstreamId === n1.id && item.branchIndex != null)
        .sort((a, b) => a.branchIndex - b.branchIndex);

      expect(nodes.find((item) => item.id === branch0.id)).toBeUndefined();
      expect(branchHeads.length).toBe(1);
      expect(branchHeads[0].id).toBe(branch1.id);
      expect(branchHeads[0].branchIndex).toBe(1);
    });
  });

  describe('move', () => {
    it('move node to head', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
      });
      await n2.setDownstream(n3);

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n3.id,
        values: {
          upstreamId: null,
        },
      });
      expect(status).toBe(200);

      const nodes = (await workflow.getNodes({ order: [['id', 'asc']] })) as FlowNodeModel[];
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const n1After = nodeMap.get(n1.id);
      const n2After = nodeMap.get(n2.id);
      const n3After = nodeMap.get(n3.id);

      expect(n3After.upstreamId).toBeNull();
      expect(n3After.downstreamId).toBe(n1.id);
      expect(n1After.upstreamId).toBe(n3.id);
      expect(n1After.downstreamId).toBe(n2.id);
      expect(n2After.upstreamId).toBe(n1.id);
      expect(n2After.downstreamId).toBeNull();
    });

    it('move node to branch', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n2.id,
      });
      await n2.setDownstream(n3);

      const b1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const b2 = await workflow.createNode({
        type: 'echo',
        upstreamId: b1.id,
      });
      await b1.setDownstream(b2);

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n2.id,
        values: {
          upstreamId: n1.id,
          branchIndex: 0,
        },
      });
      expect(status).toBe(200);

      const nodes = (await workflow.getNodes({ order: [['id', 'asc']] })) as FlowNodeModel[];
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const n1After = nodeMap.get(n1.id);
      const n2After = nodeMap.get(n2.id);
      const n3After = nodeMap.get(n3.id);
      const b1After = nodeMap.get(b1.id);
      const b2After = nodeMap.get(b2.id);

      expect(n1After.downstreamId).toBe(n3.id);
      expect(n3After.upstreamId).toBe(n1.id);
      expect(n2After.upstreamId).toBe(n1.id);
      expect(n2After.branchIndex).toBe(0);
      expect(n2After.downstreamId).toBe(b1.id);
      expect(b1After.upstreamId).toBe(n2.id);
      expect(b1After.branchIndex).toBeNull();
      expect(b2After.upstreamId).toBe(b1.id);
    });

    it('returns 400 when upstream does not change', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n2.id,
        values: {
          upstreamId: n1.id,
        },
      });
      expect(status).toBe(400);
    });

    it('returns 400 when upstream is self', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n1.id,
        values: {
          upstreamId: n1.id,
        },
      });
      expect(status).toBe(400);
    });

    it('returns 404 when upstream not found', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n1.id,
        values: {
          upstreamId: '999999999999',
        },
      });
      expect(status).toBe(404);
    });

    it('returns 400 when upstream not in workflow', async () => {
      const workflow1 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const workflow2 = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow1.createNode({
        type: 'echo',
      });

      const n2 = await workflow2.createNode({
        type: 'echo',
      });

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n1.id,
        values: {
          upstreamId: n2.id,
        },
      });
      expect(status).toBe(400);
    });

    it('returns 400 when branchIndex is invalid', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: n2.id,
        values: {
          upstreamId: n1.id,
          branchIndex: 'invalid',
        },
      });
      expect(status).toBe(400);
    });

    it('replaces branch head after moving out', async () => {
      const workflow = await WorkflowModel.create({
        enabled: true,
        type: 'asyncTrigger',
      });

      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });
      await n1.setDownstream(n2);

      const b1 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const b2 = await workflow.createNode({
        type: 'echo',
        upstreamId: b1.id,
      });
      await b1.setDownstream(b2);

      const { status } = await agent.resource('flow_nodes').move({
        filterByTk: b1.id,
        values: {
          upstreamId: null,
        },
      });
      expect(status).toBe(200);

      const nodes: FlowNodeModel[] = await workflow.getNodes({ order: [['id', 'asc']] });
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const n1After = nodeMap.get(n1.id);
      const n2After = nodeMap.get(n2.id);
      const b1After = nodeMap.get(b1.id);
      const b2After = nodeMap.get(b2.id);

      expect(b1After.upstreamId).toBeNull();
      expect(b1After.downstreamId).toBe(n1.id);
      expect(n1After.upstreamId).toBe(b1.id);
      expect(n1After.downstreamId).toBe(n2.id);
      expect(n2After.upstreamId).toBe(n1.id);
      expect(b2After.upstreamId).toBe(n1.id);
      expect(b2After.branchIndex).toBe(0);
    });
  });

  describe('test', () => {
    it('test method not implemented', async () => {
      const { status } = await agent.resource('flow_nodes').test({ values: { type: 'error' } });

      expect(status).toBe(400);
    });

    it('test method implemented', async () => {
      const {
        status,
        body: { data },
      } = await agent.resource('flow_nodes').test({ values: { type: 'echo' } });

      expect(status).toBe(200);
      expect(data.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('test with pending status', async () => {
      const {
        status,
        body: { data },
      } = await agent.resource('flow_nodes').test({ values: { type: 'pending' } });

      expect(status).toBe(200);
      expect(data.status).toBe(JOB_STATUS.PENDING);
    });
  });
});
