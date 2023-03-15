import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { EXECUTION_STATUS, BRANCH_INDEX } from '../../constants';



describe('workflow > instructions > condition', () => {
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

  describe('config.rejectOnFalse', () => {

  });

  describe('single calculation', () => {
    it('calculation to true downstream', async () => {

      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          engine: 'math.js',
          expression: '1 == 1'
        }
      });

      const n2 = await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_TRUE,
        upstreamId: n1.id
      });

      const n3 = await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_FALSE,
        upstreamId: n1.id
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      expect(jobs[1].result).toEqual(true);
    });

    it('calculation to false downstream', async () => {
      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          engine: 'math.js',
          // false
          expression: '0 == 1'
        }
      });

      await workflow.createNode({
        title: 'true to echo',
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_TRUE,
        upstreamId: n1.id
      });

      await workflow.createNode({
        title: 'false to echo',
        type: 'echo',
        branchIndex: BRANCH_INDEX.ON_FALSE,
        upstreamId: n1.id
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const jobs = await execution.getJobs();
      expect(jobs.length).toEqual(2);
      expect(jobs[1].result).toEqual(false);
    });
  });

  describe('group calculation', () => {
    it('and true', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        config: {
          calculation: {
            group: {
              type: 'and',
              calculations: [
                { calculator: 'equal', operands: [1, 1] },
                { calculator: 'equal', operands: [1, 1] }
              ]
            }
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(true);
    });

    it('and false', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        config: {
          calculation: {
            group: {
              type: 'and',
              calculations: [
                { calculator: 'equal', operands: [1, 1] },
                { calculator: 'equal', operands: [0, 1] }
              ]
            }
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(false);
    });

    it('or true', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        config: {
          calculation: {
            group: {
              type: 'or',
              calculations: [
                { calculator: 'equal', operands: [1, 1] },
                { calculator: 'equal', operands: [0, 1] }
              ]
            }
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions({ include: ['jobs'] });
      const [job] = execution.jobs;
      expect(job.result).toBe(true);
    });

    it('or false', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        config: {
          calculation: {
            group: {
              type: 'and',
              calculations: [
                { calculator: 'equal', operands: [0, 1] },
                { calculator: 'equal', operands: [0, 1] }
              ]
            }
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(false);
    });

    it('nested', async () => {
      const n1 = await workflow.createNode({
        type: 'condition',
        config: {
          calculation: {
            group: {
              type: 'and',
              calculations: [
                { calculator: 'equal', operands: [1, 1] },
                {
                  group: {
                    type: 'or',
                    calculations: [
                      { calculator: 'equal', operands: [0, 1] },
                      { calculator: 'equal', operands: [0, 1] }
                    ]
                  }
                }
              ]
            }
          }
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(false);
    });
  });

  describe('engines', () => {
    it('default as basic', async () => {
      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          calculation: {
            calculator: 'equal',
            operands: [1, '{{$context.data.read}}']
          }
        }
      });

      const post = await PostRepo.create({ values: { read: 1 } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const [job] = await execution.getJobs();
      expect(job.result).toEqual(true);
    });

    it('basic engine', async () => {
      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          engine: 'basic',
          calculation: {
            calculator: 'equal',
            operands: [1, '{{$context.data.read}}']
          }
        }
      });

      const post = await PostRepo.create({ values: { read: 1 } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const [job] = await execution.getJobs();
      expect(job.result).toEqual(true);
    });

    it('math.js', async () => {
      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          engine: 'math.js',
          expression: '1 == 1'
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const [job] = await execution.getJobs();
      expect(job.result).toEqual(true);
    });

    it('formula.js', async () => {
      const n1 = await workflow.createNode({
        title: 'condition',
        type: 'condition',
        config: {
          engine: 'formula.js',
          expression: '1 == 1'
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      expect(execution.status).toEqual(EXECUTION_STATUS.RESOLVED);

      const [job] = await execution.getJobs();
      expect(job.result).toEqual(true);
    });
  });
});
