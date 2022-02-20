import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '..';

import { get } from 'lodash';

import { getValue } from '../../utils/getter';
import { BRANCH_INDEX } from '../../constants';

describe('value getter', () => {
  let app: Application;
  let db: Database;
  let JobModel;
  let WorkflowModel;
  let ExecutionModel;
  let PostModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    JobModel = db.getCollection('jobs').model;
    ExecutionModel = db.getCollection('executions').model;
    PostModel = db.getCollection('posts').model;

    workflow = await WorkflowModel.create({
      title: 'test workflow',
      enabled: true,
      type: 'model',
      config: {
        mode: 1,
        collection: 'posts'
      }
    });
  });

  afterEach(() => db.close());

  describe('get from constants', () => {
    it('null', () => {
      const v1 = getValue({
        value: null
      }, null, null);
      expect(v1).toBe(null);
    });

    it('number', () => {
      const v1 = getValue({
        value: 1
      }, null, null);
      expect(v1).toBe(1);
    });
  });

  describe('get from context', () => {
    it('paths', async () => {
      const post = await PostModel.create({ title: 't1' });
      const [execution] = await workflow.getExecutions();

      const v1 = getValue({
        type: 'context',
        options: {}
      }, null, execution);
      expect(v1).toMatchObject({ data: { title: 't1' } });

      const v2 = getValue({
        type: 'context',
        options: { path: 'data' }
      }, null, execution);
      expect(v2).toMatchObject({ title: 't1' });

      const v3 = getValue({
        type: 'context',
        options: { path: 'data.title' }
      }, null, execution);
      expect(v3).toBe(post.title);
    });
  });

  describe('get from job by id', () => {
    it('base getting from executed job', async () => {
      const n1 = await workflow.createNode({
        type: 'echo'
      });
      const post = await PostModel.create({ title: 't1' });
      const [execution] = await workflow.getExecutions();
      await execution.prepare({}, true);

      const v1 = getValue({
        type: 'job',
        options: {
          nodeId: n1.id,
          path: 'data.title'
        }
      }, null, execution);

      expect(v1).toBe(post.title);
    });

    it('result of unexecuted job could not be got', async () => {
      const n1 = await workflow.createNode({
        type: 'condition'
      });

      const n2 = await workflow.createNode({
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_TRUE,
        upstreamId: n1.id
      });

      const n3 = await workflow.createNode({
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_FALSE,
        upstreamId: n1.id
      });

      const post = await PostModel.create({ title: 't1' });
      const [execution] = await workflow.getExecutions();
      await execution.prepare({}, true);

      const v1 = getValue({
        type: 'job',
        options: {
          nodeId: n3.id
        }
      }, null, execution);

      expect(v1).toBeUndefined();

      const v2 = getValue({
        type: 'job',
        options: {
          nodeId: n2.id
        }
      }, null, execution);

      expect(v2).toBe(true);
    });
  });
});
