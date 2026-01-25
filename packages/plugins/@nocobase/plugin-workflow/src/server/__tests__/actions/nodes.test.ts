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
