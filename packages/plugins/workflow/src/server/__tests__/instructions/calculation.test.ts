import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '..';
import { JOB_STATUS } from '../../constants';



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

  describe('math.js', () => {
    it('syntax error', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '1 1'
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.ERROR);
      expect(job.result.startsWith('SyntaxError: ')).toBe(true);
    });

    it('constant', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: ' 1 + 1 '
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });

    it('$context', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '{{$context.data.read}} + 1',
        }
      });

      const post = await PostRepo.create({ values: { title: 't1', read: 1 } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });

    it('$jobsMapByNodeId', async () => {
      const n1 = await workflow.createNode({
        type: 'echo'
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: `{{$jobsMapByNodeId.${n1.id}.data.read}} + 1`,
        },
        upstreamId: n1.id
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [n1Job, n2Job] = await execution.getJobs({ order: [['id', 'ASC']]});
      expect(n2Job.result).toBe(1);
    });

    it('$system', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '1 + {{$system.no1}}',
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });
  });

  describe('formula.js', () => {
    it('string variable without quote should throw error', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `CONCATENATE('a', {{$context.data.title}})`,
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.status).toBe(JOB_STATUS.ERROR);
    });

    it('text', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `CONCATENATE('a', '{{$context.data.title}}')`,
        }
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe('at1');
    });
  });
});
