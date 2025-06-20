/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Server } from 'http';
import jwt from 'jsonwebtoken';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import type { AddressInfo } from 'net';

import Database from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { koaMulter as multer } from '@nocobase/utils';

import PluginWorkflow, { EXECUTION_STATUS, JOB_STATUS, Processor } from '@nocobase/plugin-workflow';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';

import RequestInstruction, { RequestInstructionConfig } from '../RequestInstruction';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import path from 'path';
import fs from 'fs/promises';
import { Buffer } from 'buffer';

const HOST = 'localhost';

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
  get URL_400_MESSAGE() {
    return `http://${HOST}:${this.port}/api/400_message`;
  }
  get URL_400_OBJECT() {
    return `http://${HOST}:${this.port}/api/400_object`;
  }
  get URL_404() {
    return `http://${HOST}:${this.port}/api/404`;
  }
  get URL_TIMEOUT() {
    return `http://${HOST}:${this.port}/api/timeout`;
  }
  get URL_END() {
    return `http://${HOST}:${this.port}/api/end`;
  }
  get URL_FORM_DATA() {
    return `http://${HOST}:${this.port}/api/form_data`;
  }
  constructor() {
    this.app = new Koa();
    this.app.use(bodyParser());

    const upload = multer().array('file');
    this.app.use(upload);

    this.app.use(async (ctx, next) => {
      if (ctx.path === '/api/400') {
        return ctx.throw(400);
      }
      if (ctx.path === '/api/400_message') {
        return ctx.throw(400, 'bad request message');
      }
      if (ctx.path === '/api/400_object') {
        ctx.body = { a: 1 };
        ctx.status = 400;
        return;
      }
      if (ctx.path === '/api/end') {
        ctx.res.socket.end();
        return;
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
          data: ctx.request.body,
        };
      }
      if (ctx.path === '/api/form_data') {
        await sleep(100);
        ctx.body = {
          meta: { title: ctx.query.title },
          data: ctx.request.body,
          files: ctx.request['files'], // Multer.File[]
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
  let instruction: RequestInstruction;

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

    instruction = (app.pm.get(PluginWorkflow) as PluginWorkflow).instructions.get('request') as RequestInstruction;

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

  describe('params processing', () => {
    it('trim should not crash', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
          params: [{ name: 'id', value: '{{$context.data.id}}' }],
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
    });
  });

  describe('request static app routes', () => {
    it('get data (legacy)', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
          onlyData: true,
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toMatchObject({ meta: {}, data: {} });
    });

    it('get data', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toMatchObject({
        data: { meta: {}, data: {} },
      });
    });

    it('timeout', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_TIMEOUT,
          method: 'GET',
          timeout: 250,
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);

      expect(job.result).toMatchObject({
        code: 'ECONNABORTED',
        name: 'AxiosError',
        // status: null,
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
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(1000);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result).toMatchObject({
        code: 'ECONNABORTED',
        name: 'AxiosError',
        // status: null,
        message: 'timeout of 250ms exceeded',
      });
    });

    it('response 400 without body', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);
      expect(job.result.status).toBe(400);
    });

    it('response 400 with text message', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400_MESSAGE,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);
      expect(job.result.status).toBe(400);
      expect(job.result.data).toBe('bad request message');
    });

    it('response 400 with object', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400_OBJECT,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);
      expect(job.result.status).toBe(400);
      expect(job.result.data).toEqual({ a: 1 });
    });

    it('response just end', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_END,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.FAILED);
      expect(job.result).toMatchObject({
        code: 'ECONNRESET',
        name: 'Error',
        // status: null,
        message: 'socket hang up',
      });
    });

    it('response 400 ignoreFail', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_400,
          method: 'GET',
          timeout: 1000,
          ignoreFail: true,
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.status).toBe(400);
    });

    it('request with data', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { title: '{{$context.data.title}}' },
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ title: 't1' });
    });

    // TODO(bug): should not use ejs
    it('request json data with multiple lines', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { title: '{{$context.data.title}}' },
        } as RequestInstructionConfig,
      });

      const title = 't1\n\nline 2';
      await PostRepo.create({
        values: { title },
      });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ title });
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
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs.length).toBe(3);
      expect(jobs.map((item) => item.status)).toEqual(Array(3).fill(JOB_STATUS.RESOLVED));
      expect(jobs[0].result).toBe(2);
    });
  });

  describe('contentType', () => {
    it('no contentType as "application/json"', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { a: '{{$context.data.title}}' },
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ a: 't1' });
    });

    it('contentType as "application/x-www-form-urlencoded"', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: [
            { name: 'a', value: '{{$context.data.title}}' },
            { name: 'a', value: '&=1' },
          ],
          contentType: 'application/x-www-form-urlencoded',
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ a: ['t1', '&=1'] });
    });

    it('contentType as "multipart/form-data" with 1 file', async () => {
      const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

      const path1 = path.resolve(__dirname, './files/text1.txt');
      const model1 = await Plugin.createFileRecord({
        collectionName: 'attachments',
        filePath: path1,
      });

      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_FORM_DATA,
          method: 'POST',
          data: [
            { valueType: 'text', name: 'a', text: '{{$context.data.title}}' },
            { valueType: 'file', name: 'file', file: model1.dataValues },
          ],
          contentType: 'multipart/form-data',
        },
      });
      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ a: 't1' });

      expect(job.result.data.files?.length).toEqual(1);

      const got = Buffer.from(job.result.data.files[0].buffer.data);
      const expected = await fs.readFile(path1);
      expect(got).toEqual(expected);
    });

    it('contentType as "multipart/form-data" with multiple files', async () => {
      const Plugin = app.pm.get(PluginFileManagerServer) as PluginFileManagerServer;

      const path1 = path.resolve(__dirname, './files/text1.txt');
      const model1 = await Plugin.createFileRecord({
        collectionName: 'attachments',
        filePath: path1,
      });

      const path2 = path.resolve(__dirname, './files/text2.txt');
      const model2 = await Plugin.createFileRecord({
        collectionName: 'attachments',
        filePath: path2,
      });

      await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_FORM_DATA,
          method: 'POST',
          data: [
            { valueType: 'text', name: 'a', text: '{{$context.data.title}}' },
            { valueType: 'file', name: 'file', file: model1.dataValues },
            { valueType: 'file', name: 'file', file: model2.dataValues },
          ],
          contentType: 'multipart/form-data',
        },
      });
      await PostRepo.create({ values: { title: 't1' } });
      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ a: 't1' });

      expect(job.result.data.files?.length).toEqual(2);

      const got1 = Buffer.from(job.result.data.files[0].buffer.data);
      const expected1 = await fs.readFile(path1);
      expect(got1).toEqual(expected1);

      const got2 = Buffer.from(job.result.data.files[1].buffer.data);
      const expected2 = await fs.readFile(path2);
      expect(got2).toEqual(expected2);
    });
  });

  describe('invalid characters', () => {
    it('\\n in header value should be trimed, and should not cause error', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'POST',
          data: { a: '{{$context.data.title}}' },
          headers: [{ name: 'Authorization', value: 'abc\n' }],
        },
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toEqual({ a: 't1' });
    });
  });

  describe('request db resource', () => {
    it('request db resource', async () => {
      const user = await db.getRepository('users').create({});

      const token = jwt.sign(
        {
          userId: user.id,
          signInTime: Date.now(),
        },
        process.env.APP_KEY,
        {
          expiresIn: '1d',
        },
      );

      const server = app.listen(0, () => {});

      await sleep(1000);

      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: `http://localhost:${(server.address() as AddressInfo).port}/api/categories`,
          method: 'POST',
          headers: [{ name: 'Authorization', value: `Bearer ${token}` }],
        } as RequestInstructionConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const category = await db.getRepository('categories').findOne({});

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data.data).toMatchObject({});

      server.close();
    });
  });

  describe('sync request', () => {
    let syncFlow;

    beforeEach(async () => {
      syncFlow = await WorkflowModel.create({
        type: 'syncTrigger',
        enabled: true,
      });
    });

    it('sync trigger', async () => {
      await syncFlow.createNode({
        type: 'request',
        config: {
          url: api.URL_DATA,
          method: 'GET',
        } as RequestInstructionConfig,
      });

      const workflowPlugin = app.pm.get(PluginWorkflow) as PluginWorkflow;
      const processor = (await workflowPlugin.trigger(syncFlow, { data: { title: 't1' } })) as Processor;

      const [execution] = await syncFlow.getExecutions();
      expect(processor.execution.id).toEqual(execution.id);
      expect(processor.execution.status).toBe(execution.status);
      expect(execution.status).toBe(EXECUTION_STATUS.RESOLVED);
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.data).toEqual({ meta: {}, data: {} });
    });

    it('ignoreFail', async () => {
      await syncFlow.createNode({
        type: 'request',
        config: {
          url: api.URL_404,
          method: 'GET',
          ignoreFail: true,
        } as RequestInstructionConfig,
      });

      const workflowPlugin = app.pm.get(PluginWorkflow) as PluginWorkflow;
      const processor = (await workflowPlugin.trigger(syncFlow, { data: { title: 't1' } })) as Processor;

      const [execution] = await syncFlow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.RESOLVED);
      expect(job.result.status).toBe(404);
    });
  });

  describe('test run', () => {
    it('invalid config', async () => {
      const { status, result } = await instruction.test(Object.create({}));
      expect(status).toBe(JOB_STATUS.FAILED);
      expect(result).toBe('Invalid URL');
    });

    it('data url', async () => {
      const { status, result } = await instruction.test({
        url: api.URL_DATA,
        method: 'POST',
        contentType: 'application/json',
        data: { a: 1 },
      });
      expect(status).toBe(JOB_STATUS.RESOLVED);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ meta: {}, data: { a: 1 } });
    });

    it('404', async () => {
      const { status, result } = await instruction.test({
        url: api.URL_404,
        method: 'GET',
        contentType: '',
      });
      expect(status).toBe(JOB_STATUS.FAILED);
      expect(result.status).toBe(404);
    });

    it('timeout', async () => {
      const { status, result } = await instruction.test({
        url: api.URL_TIMEOUT,
        method: 'GET',
        timeout: 1000,
        contentType: '',
      });
      expect(status).toBe(JOB_STATUS.FAILED);
      expect(result.code).toBe('ECONNABORTED');
    });

    it('ignoreFail', async () => {
      const { status, result } = await instruction.test({
        url: api.URL_404,
        method: 'GET',
        ignoreFail: true,
        contentType: '',
      });
      expect(status).toBe(JOB_STATUS.RESOLVED);
      expect(result.status).toBe(404);
    });

    it('timeout and ignoreFail', async () => {
      const { status, result } = await instruction.test({
        url: api.URL_TIMEOUT,
        method: 'GET',
        timeout: 1000,
        ignoreFail: true,
        contentType: '',
      });
      expect(status).toBe(JOB_STATUS.RESOLVED);
      expect(result.code).toBe('ECONNABORTED');
    });
  });
});
