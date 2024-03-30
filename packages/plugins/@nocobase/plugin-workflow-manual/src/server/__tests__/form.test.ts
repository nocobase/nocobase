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
  let CommentRepo;
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
    CommentRepo = db.getCollection('comments').repository;
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

  describe('actions configuration', () => {
    it('no action configured', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {},
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });

      expect(res1.status).toBe(400);
    });

    it('no actionKey provided', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 } },
        },
      });

      expect(res1.status).toBe(400);
    });

    it('values resolved will be overrided by action assigned', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [
                {
                  status: JOB_STATUS.RESOLVED,
                  key: 'resolve',
                  values: { a: 2 },
                },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 }, _: 'resolve' },
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toEqual({ f1: { a: 2 }, _: 'resolve' });
    });

    it('values rejected will not be overrided by action assigned', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [
                {
                  status: JOB_STATUS.REJECTED,
                  key: 'reject',
                  values: { a: 2 },
                },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 }, _: 'reject' },
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.REJECTED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.REJECTED);
      expect(job.result).toEqual({ f1: { a: 1 }, _: 'reject' });
    });

    it('values saved as pending will not be overrided by action assigned', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [
                {
                  status: JOB_STATUS.PENDING,
                  key: 'save',
                  values: { a: 2 },
                },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 1 }, _: 'save' },
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.STARTED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.PENDING);
      expect(job.result).toEqual({ f1: { a: 1 }, _: 'save' });
    });

    it('variable within assigned values should work when resolve', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id],
          forms: {
            f1: {
              actions: [
                {
                  status: JOB_STATUS.RESOLVED,
                  key: 'resolve',
                  values: {
                    a: '{{currentUser.id}}',
                    b: '{{currentRecord.id}}',
                    c: '{{currentTime}}',
                    d: '{{$context.data.title}}',
                  },
                },
              ],
            },
          },
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [pending] = await workflow.getExecutions();
      expect(pending.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await pending.getJobs();
      expect(j1.status).toBe(JOB_STATUS.PENDING);

      const usersJobs = await UserJobModel.findAll();
      expect(usersJobs.length).toBe(1);
      expect(usersJobs[0].status).toBe(JOB_STATUS.PENDING);
      expect(usersJobs[0].userId).toBe(users[0].id);
      expect(usersJobs[0].jobId).toBe(j1.id);

      const now = new Date();
      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: usersJobs[0].id,
        values: {
          result: { f1: { a: 2, id: 3 }, _: 'resolve' },
        },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toMatchObject({ f1: { a: users[0].id, id: 3, b: 3, d: post.title }, _: 'resolve' });
      const time = new Date(job.result.f1.c);
      expect(time.getTime() - now.getTime()).toBeLessThan(1000);
    });
  });

  describe('use result of submitted form in manual node', () => {
    it('result should be available and correct', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          forms: {
            f1: {
              actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
            },
          },
        },
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}.f1.number}} + 1`,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const UserJobModel = db.getModel('users_jobs');
      const pendingJobs = await UserJobModel.findAll({
        order: [['userId', 'ASC']],
      });
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { number: 1 }, _: 'resolve' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(1000);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j1, j2] = await e2.getJobs({ order: [['createdAt', 'ASC']] });
      expect(j2.status).toBe(JOB_STATUS.RESOLVED);
      expect(j2.result).toBe(2);
    });

    it('save all forms, only reserve submitted ones', async () => {
      const n1 = await workflow.createNode({
        type: 'manual',
        config: {
          assignees: [users[0].id, users[1].id],
          forms: {
            f1: {
              actions: [
                { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                { status: JOB_STATUS.PENDING, key: 'pending' },
              ],
            },
            f2: {
              actions: [
                { status: JOB_STATUS.RESOLVED, key: 'resolve' },
                { status: JOB_STATUS.PENDING, key: 'pending' },
              ],
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
      expect(pendingJobs.length).toBe(2);

      const res1 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f1: { number: 1 }, _: 'pending' },
        },
      });
      expect(res1.status).toBe(202);

      await sleep(500);

      const [e1] = await workflow.getExecutions();
      expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
      const [j1] = await e1.getJobs({ order: [['createdAt', 'ASC']] });
      expect(j1.status).toBe(JOB_STATUS.PENDING);
      expect(j1.result).toMatchObject({ f1: { number: 1 } });

      const res2 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f2: { number: 2 }, _: 'pending' },
        },
      });
      expect(res2.status).toBe(202);

      await sleep(500);

      const [e2] = await workflow.getExecutions();
      expect(e2.status).toBe(EXECUTION_STATUS.STARTED);
      const [j2] = await e2.getJobs({ order: [['createdAt', 'ASC']] });
      expect(j2.status).toBe(JOB_STATUS.PENDING);
      expect(j2.result).toMatchObject({
        f1: { number: 1 },
        f2: { number: 2 },
      });

      const res3 = await userAgents[0].resource('users_jobs').submit({
        filterByTk: pendingJobs[0].get('id'),
        values: {
          result: { f2: { number: 3 }, _: 'resolve' },
        },
      });
      expect(res3.status).toBe(202);

      await sleep(500);

      const [e3] = await workflow.getExecutions();
      expect(e3.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [j3] = await e3.getJobs({ order: [['createdAt', 'ASC']] });
      expect(j3.status).toBe(JOB_STATUS.RESOLVED);
      expect(j3.result).toMatchObject({ f2: { number: 3 } });
    });
  });

  describe('forms', () => {
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
                collection: 'comments',
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
            result: { f1: { status: 1 }, _: 'resolve' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(1000);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j1] = await e1.getJobs();
        expect(j1.status).toBe(JOB_STATUS.RESOLVED);
        expect(j1.result).toMatchObject({ f1: { status: 1 } });

        const comments = await CommentRepo.find();
        expect(comments.length).toBe(1);
        expect(comments[0]).toMatchObject({ status: 1 });
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
                collection: 'comments',
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
            result: { f1: { status: 1 }, _: 'pending' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(500);

        const [e1] = await workflow.getExecutions();
        expect(e1.status).toBe(EXECUTION_STATUS.STARTED);
        const [j1] = await e1.getJobs();
        expect(j1.status).toBe(JOB_STATUS.PENDING);
        expect(j1.result).toMatchObject({ f1: { status: 1 } });

        const c1 = await CommentRepo.find();
        expect(c1.length).toBe(0);

        const res2 = await userAgents[0].resource('users_jobs').submit({
          filterByTk: pendingJobs[0].get('id'),
          values: {
            result: { f1: { status: 1 }, _: 'resolve' },
          },
        });

        await sleep(500);

        const [e2] = await workflow.getExecutions();
        expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j2] = await e2.getJobs();
        expect(j2.status).toBe(JOB_STATUS.RESOLVED);
        expect(j2.result).toMatchObject({ f1: { status: 1 } });

        const c2 = await CommentRepo.find();
        expect(c2.length).toBe(1);
      });
    });

    describe('update', () => {
      it('update as configured', async () => {
        const n1 = await workflow.createNode({
          type: 'manual',
          config: {
            assignees: [users[0].id],
            forms: {
              f1: {
                type: 'update',
                actions: [{ status: JOB_STATUS.RESOLVED, key: 'resolve' }],
                collection: 'posts',
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
            result: { f1: { title: 't2' }, _: 'resolve' },
          },
        });
        expect(res1.status).toBe(202);

        await sleep(1000);

        const [e2] = await workflow.getExecutions();
        expect(e2.status).toBe(EXECUTION_STATUS.RESOLVED);
        const [j1] = await e2.getJobs();
        expect(j1.status).toBe(JOB_STATUS.RESOLVED);
        expect(j1.result).toMatchObject({ f1: { title: 't2' } });

        const postsAfter = await PostRepo.find();
        expect(postsAfter.length).toBe(1);
        expect(postsAfter[0]).toMatchObject({ title: 't2' });
      });
    });
  });
});
