import path from 'path';

import Database from '@nocobase/database';
import { Application } from '@nocobase/server';
import { testkit, EXECUTION_STATUS, JOB_STATUS, BRANCH_INDEX } from '@nocobase/plugin-workflow';

import Plugin from '..';

const { getApp, sleep } = testkit;

describe('workflow > instructions > sql', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let PostCollection;
  let ReplyRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp({
      plugins: [Plugin],
      collectionPath: path.join(__dirname, './collections'),
    });

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostCollection = db.getCollection('posts');
    PostRepo = PostCollection.repository;
    ReplyRepo = db.getCollection('replies').repository;

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

  describe('invalid', () => {
    it('no sql', async () => {
      const n1 = await workflow.createNode({
        type: 'sql',
        config: {},
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('empty sql', async () => {
      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: '',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
    });

    it('invalid sql', async () => {
      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: '1',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(execution.status).toBe(EXECUTION_STATUS.ERROR);
      expect(sqlJob.status).toBe(JOB_STATUS.ERROR);
    });
  });

  describe('sql with variables', () => {
    it('update', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `update ${PostCollection.quotedTableName()} set ${queryInterface.quoteIdentifier(
            'read',
          )}={{$context.data.id}} where ${queryInterface.quoteIdentifier('id')}={{$context.data.id}}`,
        },
      });

      const n2 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{ $context.data.id }}',
            },
          },
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob, queryJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(queryJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(queryJob.result.read).toBe(post.id);
    });

    it('delete', async () => {
      const queryInterface = db.sequelize.getQueryInterface();
      const n1 = await workflow.createNode({
        type: 'sql',
        config: {
          sql: `delete from ${PostCollection.quotedTableName()} where ${queryInterface.quoteIdentifier(
            'id',
          )}={{$context.data.id}};`,
        },
      });

      const n2 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              id: '{{ $context.data.id }}',
            },
          },
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [sqlJob, queryJob] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(sqlJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(queryJob.status).toBe(JOB_STATUS.RESOLVED);
      expect(queryJob.result).toBeNull();
    });
  });

  describe('mixed', () => {
    it.skip('condition contains loop (target as 0)', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
      });

      const n2 = await workflow.createNode({
        type: 'loop',
        branchIndex: BRANCH_INDEX.ON_TRUE,
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
        branchIndex: BRANCH_INDEX.ON_TRUE,
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
