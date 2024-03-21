import { Server } from 'http';
import jwt from 'jsonwebtoken';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';

import PluginWorkflow, { Processor, EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import { RequestConfig } from '../RequestInstruction';

const HOST = 'localhost';

function getRandomPort() {
  const minPort = 1024;
  const maxPort = 49151;
  return Math.floor(Math.random() * (maxPort - minPort + 1)) + minPort;
}

class MockAPI {
  app: Koa;
  server: Server;
  port: number;
  get URL_DATA() {
    return `http://${HOST}:${this.port}/api/data`;
  }
  get URL_400() {
    return `http://${HOST}:${this.port}/api/400`;
  }
  get URL_TIMEOUT() {
    return `http://${HOST}:${this.port}/api/timeout`;
  }
  constructor() {
    this.app = new Koa();
    this.app.use(bodyParser());

    this.app.use(async (ctx, next) => {
      if (ctx.path === '/api/400') {
        return ctx.throw(400);
      }
      if (ctx.path === '/api/timeout') {
        await sleep(2000);
        ctx.status = 204;
        return;
      }
      if (ctx.path === '/api/data') {
        await sleep(100);
        ctx.body = {
          meta: { title: ctx.query.title },
          data: { title: ctx.request.body['title'] },
        };
      }
      await next();
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        this.port = this.server.address()['port'];
        resolve(true);
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      this.server.close(() => {
        resolve(true);
      });
    });
  }
}

describe('workflow > instructions > request', () => {
  let app: MockServer;
  let db: Database;
  let PostRepo;
  let PostCollection;
  let ReplyRepo;
  let WorkflowModel;
  let workflow;
  let api: MockAPI;

  beforeEach(async () => {
    api = new MockAPI();
    api.start();
    app = await getApp({
      resourcer: {
        prefix: '/api',
      },
      plugins: ['users', 'auth', 'workflow-request'],
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

  afterEach(async () => {
    await api.close();
    await app.destroy();
  });

  describe('request static app routes', () => {
    it('get data', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result).toEqual({ meta: {}, data: {} });
    });

    it('timeout', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_TIMEOUT,
          method: 'GET',
          timeout: 250,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.FAILED);

      expect(job.result).toMatchObject({
        code: 'ECONNABORTED',
        name: 'Error',
        status: null,
        message: 'timeout of 250ms exceeded',
      });

      // NOTE: to wait for the response to finish and avoid non finished promise.
      await sleep(1500);
    });

    it('ignoreFail', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_TIMEOUT,
          method: 'GET',
          timeout: 250,
          ignoreFail: true,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result).toMatchObject({
        code: 'ECONNABORTED',
        name: 'Error',
        status: null,
        message: 'timeout of 250ms exceeded',
      });
    });

    it('response 400', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400,
          method: 'GET',
          ignoreFail: false,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.FAILED);
      expect(job.result.status).toBe(400);
    });

    it('response 400 ignoreFail', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400,
          method: 'GET',
          timeout: 1000,
          ignoreFail: true,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result.status).toBe(400);
    });

    it('request with data', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { title: '{{$context.data.title}}' },
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result.data).toEqual({ title: 't1' });
    });

    // TODO(bug): should not use ejs
    it('request json data with multiple lines', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { title: '{{$context.data.title}}' },
        } as RequestConfig,
      });

      const title = 't1\n\nline 2';
      await PostRepo.create({
        values: { title },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result.data).toEqual({ title });
    });

    it.skip('request inside loop', async () => {
      const n1 = await workflow.createNode({
        type: 'loop',
        config: {
          target: 2,
        },
      });

      const n2 = await workflow.createNode({
        type: 'request',
        upstreamId: n1.id,
        branchIndex: 0,
        config: {
          url: api.URL_DATA,
          method: 'GET',
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs.map((item) => item.status)).toEqual(Array(3).fill(JOB_STATUS.RESOLVED));
      expect(jobs[0].result).toBe(2);
    });
  });

  describe('request db resource', () => {
    it('request db resource', async () => {
      const user = await db.getRepository('users').create({});

      const token = jwt.sign(
        {
          userId: typeof user.id,
        },
        process.env.APP_KEY,
        {
          expiresIn: '1d',
        },
      );

      const server = app.listen(12346, () => {});

      await sleep(1000);

      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: `http://localhost:12346/api/categories`,
          method: 'POST',
          headers: [{ name: 'Authorization', value: `Bearer ${token}` }],
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const category = await db.getRepository('categories').findOne({});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data).toMatchObject({});

      server.close();
    });
  });

  describe('sync request', () => {
    it('sync trigger', async () => {
      const syncFlow = await WorkflowModel.create({
        type: 'syncTrigger',
        enabled: true,
      });
      await syncFlow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
        } as RequestConfig,
      });

      const workflowPlugin = app.pm.get(PluginWorkflow) as PluginWorkflow;
      const processor = (await workflowPlugin.trigger(syncFlow, { data: { title: 't1' } })) as Processor;

      const [execution] = await syncFlow.getExecutions();
      expect(processor.execution.id).toEqual(execution.id);
      expect(processor.execution.status).toEqual(execution.status);
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result).toEqual({ meta: {}, data: {} });
    });
  });
});
