import Database from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { MockServer } from '@nocobase/test';

// NOTE: skipped because time is not stable on github ci, but should work in local
describe('workflow > instructions > manual', () => {
  let app: MockServer;
  let agent;
  let userAgents;
  let db: Database;
  let PostRepo;
  let AnotherPostRepo;
  let WorkflowModel;
  let workflow;
  let UserModel;
  let users;
  let UserJobModel;

  beforeEach(async () => {
    app = await getApp({
      plugins: ['users', 'auth', 'workflow-manual'],
    });
    // await app.getPlugin('auth').install();
    agent = app.agent();
    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    AnotherPostRepo = app.dataSourceManager.dataSources.get('another').collectionManager.getRepository('posts');
    UserModel = db.getCollection('users').model;
    UserJobModel = db.getModel('users_jobs');

    users = await UserModel.bulkCreate([
      { id: 2, nickname: 'a' },
      { id: 3, nickname: 'b' },
    ]);

    userAgents = users.map((user) => app.agent().login(user));

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

  describe('multiple data source', () => {
    describe('create', () => {
      it('create as configured', async () => {
        const n1 = await workflow.createNode({
          type: 'manual',
          config: {
            assignees: [users[0].id],
            forms: {
              f1: {
                type: 'create',
                actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
                collection: 'posts',
                dataSource: 'another',
              },
            },
          },
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        await sleep(500);

        const UserJobModel = db.getModel('users_jobs');
        const pendingJobs = await UserJobModel.findAll({
          order: [['userId', 'ASC']],
        });
        expect(pendingJobs.length).toBe(1);

        const res1 = await userAgents[0].resource('users_jobs').submit({
          filterByTk: pendingJobs[0].get('id'),
          values: {
            result: { f1: { title: 't1' }, _: 'resolve' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(500);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j1] = await e1.getJobs();
        expect(j1.status).toBe(JOB_STATUS.RESOLVED);
        expect(j1.result).toMatchObject({ f1: { title: 't1' } });

        const posts = await AnotherPostRepo.find();
        expect(posts.length).toBe(1);
        expect(posts[0]).toMatchObject({ title: 't1' });
      });

      it('save first and then commit', async () => {
        const n1 = await workflow.createNode({
          type: 'manual',
          config: {
            assignees: [users[0].id],
            forms: {
              f1: {
                type: 'create',
                actions: [
                  { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                  { status: JOB_STATUS.PENDING, key: 'pending' },
                ],
                collection: 'posts',
                dataSource: 'another',
              },
            },
          },
        });

        const post = await PostRepo.create({ values: { title: 't1' } });

        await sleep(500);

        const UserJobModel = db.getModel('users_jobs');
        const pendingJobs = await UserJobModel.findAll({
          order: [['userId', 'ASC']],
        });
        expect(pendingJobs.length).toBe(1);

        const res1 = await userAgents[0].resource('users_jobs').submit({
          filterByTk: pendingJobs[0].get('id'),
          values: {
            result: { f1: { title: 't1' }, _: 'pending' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(500);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
        const [j1] = await e1.getJobs();
        expect(j1.status).toBe(JOB_STATUS.PENDING);
        expect(j1.result).toMatchObject({ f1: { title: 't1' } });

        const c1 = await AnotherPostRepo.find();
        expect(c1.length).toBe(0);

        const res2 = await userAgents[0].resource('users_jobs').submit({
          filterByTk: pendingJobs[0].get('id'),
          values: {
            result: { f1: { title: 't2' }, _: 'resolve' },
          },
        });

        await sleep(500);

        const [e2] = await workflow.getExecutions();
        expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j2] = await e2.getJobs();
        expect(j2.status).toBe(JOB_STATUS.RESOLVED);
        expect(j2.result).toMatchObject({ f1: { title: 't2' } });

        const c2 = await AnotherPostRepo.find();
        expect(c2.length).toBe(1);
      });
    });

    describe('update', () => {
      it('update as configured', async () => {
        const post = await AnotherPostRepo.create({ values: { title: 't1' } });

        const n1 = await workflow.createNode({
          type: 'manual',
          config: {
            assignees: [users[0].id],
            forms: {
              f1: {
                type: 'update',
                actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
                collection: 'posts',
                dataSource: 'another',
                filter: {
                  id: post.id,
                },
              },
            },
          },
        });

        await PostRepo.create({ values: { title: 't1' } });

        await sleep(500);

        const UserJobModel = db.getModel('users_jobs');
        const pendingJobs = await UserJobModel.findAll({
          order: [['userId', 'ASC']],
        });
        expect(pendingJobs.length).toBe(1);

        const res1 = await userAgents[0].resource('users_jobs').submit({
          filterByTk: pendingJobs[0].get('id'),
          values: {
            result: { f1: { title: 't2' }, _: 'resolve' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(500);

        const [e2] = await workflow.getExecutions();
        expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j1] = await e2.getJobs();
        expect(j1.status).toBe(JOB_STATUS.RESOLVED);
        expect(j1.result).toMatchObject({ f1: { title: 't2' } });

        const postsAfter = await AnotherPostRepo.find();
        expect(postsAfter.length).toBe(1);
        expect(postsAfter[0]).toMatchObject({ title: 't2' });
      });
    });
  });
});
