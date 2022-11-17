/**
 * @jest-environment node
 */

import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { IRequestConfig } from '../../instructions/request';
import axios from 'axios';

jest.mock('axios', () => {
  return {
    get: async (url: string, config) => {
      return {
        data: config.params,
        status: 200,
      };
    },
    post: async (url, data: string, config) => {
      return {
        data: JSON.parse(data),
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

  afterEach(() => db.close());

  describe('request GET', () => {
    it('GET', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          getMethodParam: { name: 'lily', age: 20 },
          requestUrl: 'https://www.baidu.com',
          httpMethod: 'GET',
        } as IRequestConfig,
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.data).toEqual({ name: 'lily', age: 20 });
    });

    it('GET with param template', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          getMethodParam: { title: '<%= ctx.data.title // 测试 %>' },
          requestUrl: 'https://www.xxx.com',
          httpMethod: 'GET',
        } as IRequestConfig,
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.data).toEqual({ title: 't1' });
    });
  });

  describe('request POST', () => {
    it('post data', async () => {
      const n1 = await workflow.createNode({
        type: 'request',
        config: {
          requestUrl: 'https://nocobase.com',
          httpMethod: 'POST',
          postMethodData: '{"title": "<%=ctx.data.title%>"}',
        } as IRequestConfig,
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result.data).toEqual({ title: 't1' });
    });
  });
});
