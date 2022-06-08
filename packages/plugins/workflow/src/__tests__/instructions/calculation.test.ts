import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp } from '..';



describe('workflow > instructions > calculation', () => {
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
        collection: 'posts'
      }
    });
  });

  afterEach(() => db.close());

  describe('operand types', () => {
    it('constant', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { value: 1 }
            ]
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });

    it('context (legacy)', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { type: '$context', options: { path: 'data.read' } }
            ]
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });

    it('context by json-template', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { value: '{{$context.data.read}}' }
            ]
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(1);
    });

    it('job result (legacy)', async () => {
      const n1 = await workflow.createNode({
        type: 'echo'
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { type: '$jobsMapByNodeId', options: { nodeId: n1.id, path: 'data.read' } }
            ]
          }
        },
        upstreamId: n1.id
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [n1Job, n2Job] = await execution.getJobs({ order: [['id', 'ASC']]});
      expect(n2Job.result).toBe(1);
    });

    it('job result by json-template', async () => {
      const n1 = await workflow.createNode({
        type: 'echo'
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { value: `{{$jobsMapByNodeId.${n1.id}.data.read}}` }
            ]
          }
        },
        upstreamId: n1.id
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [n1Job, n2Job] = await execution.getJobs({ order: [['id', 'ASC']]});
      expect(n2Job.result).toBe(1);
    });

    it('function', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              { value: '{{$fn.no1}}' }
            ]
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });
  });

  describe('nested operands', () => {
    it('1 + ( 0 - 2 )', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          calculation: {
            calculator: 'add',
            operands: [
              { value: 1 },
              {
                type: '$calculation',
                options: {
                  calculator: 'minus',
                  operands: [
                    { value: '{{$context.data.read}}' },
                    { value: 2 }
                  ]
                }
              }
            ]
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });
      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(-1);
    });
  });
});
