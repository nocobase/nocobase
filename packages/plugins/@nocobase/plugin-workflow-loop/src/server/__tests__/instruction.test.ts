import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import Plugin from '..';

describe('workflow > instructions > loop', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;
  let plugin;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
    });
    plugin = app.pm.get('workflow');

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

  afterEach(() => app.destroy());

  describe('branch', () => {
    it('no branch just pass', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(0);
    });

    it('should exit when branch meets error', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'error',
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n3);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.ERROR);
      expect(jobs[0].result).toBe(0);
      expect(jobs[1].status).toBe(JOB_STATUS.ERROR);
    });
  });

  describe('config', () => {
    it('no target just pass', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(0);
    });

    it('null target just pass', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: null,
        },
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(0);
    });

    it('empty array just pass', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: [],
        },
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(2);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(0);
    });

    it('target is number, cycle number times', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2.5,
        },
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

      expect(jobs.length).toBe(4);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(2);
    });

    it('target is no array, set as an array', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: {},
        },
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

      expect(jobs.length).toBe(3);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(1);
    });

    it('multiple targets', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: [1, 2],
        },
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

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });

      expect(jobs.length).toBe(4);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
      expect(jobs[0].result).toBe(2);
      expect(jobs.filter((j) => j.nodeId === n2.id).length).toBe(2);
    });
  });

  describe('scope variable', () => {
    it('item.key', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: '{{$context.data.comments}}',
        },
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `{{$scopes.${n1.id}.item.content}}`,
        },
        upstreamId: n1.id,
        branchIndex: 0,
      });

      const post = await PostRepo.create({
        values: {
          title: 't1',
          comments: [{ content: 'c1' }, { content: 'c2' }],
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs[1].result).toBe('c1');
      expect(jobs[2].result).toBe('c2');
    });
  });

  describe('mixed', () => {
    it.skip('loop branch contains parallel branches', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'parallel',
        branchIndex: 0,
        upstreamId: n1.id,
        config: {
          mode: 'any',
        },
      });

      const n3 = await workflow.createNode({
        type: 'condition',
        config: {
          rejectOnFalse: true,
          calculation: {
            calculator: '<',
            operands: [`{{$scopes.${n1.id}.item}}`, 1],
          },
        },
        branchIndex: 0,
        upstreamId: n2.id,
      });
      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n3.id,
      });
      await n3.setDownstream(n4);

      const n5 = await workflow.createNode({
        type: 'condition',
        config: {
          rejectOnFalse: true,
          calculation: {
            calculator: '<',
            operands: [`{{$scopes.${n1.id}.item}}`, 1],
          },
        },
        branchIndex: 1,
        upstreamId: n2.id,
      });
      const n6 = await workflow.createNode({
        type: 'echo',
        upstreamId: n5.id,
      });
      await n5.setDownstream(n6);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.FAILED);
      const e1jobs = await e1.getJobs();
      expect(e1jobs.length).toBe(7);
    });

    it('condition contains loop (target as 0)', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
      });

      const n2 = await workflow.createNode({
        type: 'loop',
        branchIndex: 1,
        upstreamId: n1.id,
        config: {
          target: 0,
        },
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n2.id,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
    });

    it('condition contains loop (target as 2)', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
      });

      const n2 = await workflow.createNode({
        type: 'loop',
        branchIndex: 1,
        upstreamId: n1.id,
        config: {
          target: 2,
        },
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: 0,
        upstreamId: n2.id,
      });

      const n4 = await workflow.createNode({
        type: 'echo',
        upstreamId: n1.id,
      });

      await n1.setDownstream(n4);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await e1.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(5);
      expect(jobs[0].status).toBe(JOB_STATUS.RESOLVED);
    });
  });
});
