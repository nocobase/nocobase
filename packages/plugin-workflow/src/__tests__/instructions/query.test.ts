import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '..';
import { EXECUTION_STATUS, BRANCH_INDEX } from '../../constants';



describe('workflow > instructions > query', () => {
  let app: Application;
  let db: Database;
  let PostModel;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
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

  describe('query one', () => {
    it('params: empty', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts'
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.title).toEqual(post.title);
    });

    it('params.filter: match', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: 't1'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.title).toEqual(post.title);
    });

    it('params.filter: unmatch', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: 't2'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result).toEqual(null);
    });

    it('params.filter: value from context', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: '{{$context.data.title}}'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.title).toEqual(post.title);
    });

    it('params.filter: value from job of node', async () => {
      const n1 = await workflow.createNode({
        type: 'echo'
      });
      const n2 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            filter: {
              title: `{{$jobsMapByNodeId.${n1.id}.data.title}}`
            }
          }
        },
        upstreamId: n1.id
      });
      await n1.setDownstream(n2);

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const jobs = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(jobs[1].result.title).toEqual(post.title);
    });

    it('params.sort', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          params: {
            sort: 'id'
          }
        }
      });

      const p1 = await PostModel.create({ title: 't1' });
      const p2 = await PostModel.create({ title: 't2' });

      // get the 2nd execution
      const [execution] = await workflow.getExecutions({ order: [['id', 'DESC']] });
      expect(execution.context.data.title).toEqual(p2.title);
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.title).toEqual(p1.title);
    });
  });

  describe('query all', () => {
    it('params: empty', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.length).toEqual(1);
      expect(job.result[0].title).toEqual(post.title);
    });

    it('params.filter: match', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            filter: {
              title: 't1'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.length).toEqual(1);
      expect(job.result[0].title).toEqual(post.title);
    });

    it('params.filter: unmatch', async () => {
      const n1 = await workflow.createNode({
        type: 'query',
        config: {
          collection: 'posts',
          multiple: true,
          params: {
            filter: {
              title: 't2'
            }
          }
        }
      });

      const post = await PostModel.create({ title: 't1' });

      const [execution] = await workflow.getExecutions();
      await execution.prepare();
      await execution.commit();
      const [job] = await execution.getJobs();
      expect(job.result.length).toEqual(0);
    });
  });
});