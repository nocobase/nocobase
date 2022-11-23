/**
 * @jest-environment node
 */

import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { RequestConfig } from '../../instructions/request';
import axios, { AxiosRequestConfig } from 'axios';
import { JOB_STATUS } from '../../constants';

const testUrl = 'https://nocobase.com/test';
const url_400 = 'https://nocobase.com/400';
const timeoutUrl = 'https://nocobase.com/timeout';
jest.mock('axios', () => {
  return {
    request: async (config: AxiosRequestConfig) => {
      await sleep(1000);
      if (config.url === url_400) {
        return {
          data: config,
          status: 400,
        };
      }
      if (config.url === timeoutUrl) {
        throw new Error('timeout');
      }
      return {
        data: config,
        status: 200,
      };
    },
  };
});

describe('workflow > instructions > request', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'collection',
      config: {
        mode: 1,
        collection: 'posts',
      },
    });
  });

  afterEach(() => app.stop());

  describe('request', () => {
    it('request', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: 'https://www.baidu.com?name=lily&age=20',
          method: 'GET',
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(2000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
    });

    it('request - url with variable template', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: 'https://www.xxx.com?title=<%= ctx.data.title // 测试 %>',
          method: 'GET',
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result.url).toEqual('https://www.xxx.com?title=t1');
    });

    it('request - timeout', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: timeoutUrl,
          method: 'GET',
          timeout: 1000,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.REJECTED);
      expect(job.result).toMatch('timeout');

    });

    it('request - ignoreFail', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: timeoutUrl,
          method: 'GET',
          timeout: 1000,
          ignoreFail: true,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result).toMatch('timeout');
    });

    it('response 400', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: url_400,
          method: 'GET',
          timeout: 1000,
          ignoreFail: false,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.REJECTED);
      expect(job.result.status).toBe(400);
    });

    it('response 400 ignoreFail', async () => {
      await workflow.createNode({
        type: 'request',
        config: {
          url: url_400,
          method: 'GET',
          timeout: 1000,
          ignoreFail: true,
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(job.result.status).toBe(400);
    });

    it('request with data', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          url: testUrl,
          method: 'POST',
          data: '{"title": "<%=ctx.data.title%>"}',
        } as RequestConfig,
      });

      await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      let [execution] = await workflow.getExecutions();
      let [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.PENDING);

      await sleep(1000);

      [execution] = await workflow.getExecutions();
      [job] = await execution.getJobs();
      expect(job.status).toEqual(JOB_STATUS.RESOLVED);
      expect(JSON.parse(job.result.data)).toEqual({ title: 't1' });
    });
  });
});
