import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import { getApp, sleep } from '@nocobase/plugin-workflow-test';
import { JOB_STATUS } from '../../constants';

describe('workflow > instructions > calculation', () => {
  let app: Application;
  let db: Database;
  let PostRepo;
  let CategoryRepo;
  let WorkflowModel;
  let workflow;

  beforeEach(async () => {
    app = await getApp();

    db = app.db;
    WorkflowModel = db.getCollection('workflows').model;
    PostRepo = db.getCollection('posts').repository;
    CategoryRepo = db.getCollection('categories').repository;

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

  afterEach(() => app.destroy());

  describe('math.js', () => {
    it('syntax error', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '1 1',
        },
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
          expression: ' 1 + 1 ',
        },
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
        },
      });

      const post = await PostRepo.create({ values: { title: 't1', read: 1 } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });

    it('$jobsMapByNodeKey', async () => {
      const n1 = await workflow.createNode({
        type: 'echo',
      });

      const n2 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: `{{$jobsMapByNodeKey.${n1.key}.data.read}} + 1`,
        },
        upstreamId: n1.id,
      });

      await n1.setDownstream(n2);

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [n1Job, n2Job] = await execution.getJobs({ order: [['id', 'ASC']] });
      expect(n2Job.result).toBe(1);
    });

    it('$system', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '1 + {{$system.no1}}',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe(2);
    });

    it('$system.now()', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'math.js',
          expression: '{{$system.now}}',
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z/);
    });
  });

  describe('formula.js', () => {
    it('string variable with quote should be wrong result', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `CONCATENATE('a', '{{$context.data.title}}')`,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe('a$$0');
    });

    it('text', async () => {
      const n1 = await workflow.createNode({
        type: 'calculation',
        config: {
          engine: 'formula.js',
          expression: `CONCATENATE('a', {{$context.data.title}})`,
        },
      });

      const post = await PostRepo.create({ values: { title: 't1' } });

      await sleep(500);

      const [execution] = await workflow.getExecutions();
      const [job] = await execution.getJobs();
      expect(job.result).toBe('at1');
    });
  });
});
