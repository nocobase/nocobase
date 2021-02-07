import { Application } from '@nocobase/server';
import Database, { Model, ModelCtor } from '@nocobase/database'
import { getApp, getAPI, getAgent } from '.';
import { AutomationModel } from '../models/automation';
import { AutomationJobModel } from '../models/automation-job';
import _ from 'lodash';
jest.setTimeout(300000);

describe('automations.jobs', () => {
  let app: Application;
  let db: Database;
  let Test: ModelCtor<Model>;
  let Job: ModelCtor<AutomationJobModel>;

  async function expectCount(options, result) {
    const count = await Test.count(options);
    expect(count).toBe(result);
  }

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    Job = db.getModel('automations_jobs') as any;
    Test = db.getModel('tests');
  });

  afterEach(() => db.close());

  describe('create', () => {
    it('values', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'create',
        collection_name: 'tests',
        values: [
          {
            column: 'name1',
            op: 'eq',
            value: 'n1'
          },
        ],
      }, {
        hooks: false,
      });
      await job.process();
      await expectCount({
        where: {
          name1: 'n1',
        }
      }, 1);
    });
    it('values/ref', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'create',
        collection_name: 'tests',
        values: [
          {
            column: 'name1',
            op: 'eq',
            value: 'n1'
          },
          {
            column: 'name2',
            op: 'ref',
            value: 'col2'
          },
        ],
      }, {
        hooks: false,
      });
      await job.process({
        col2: 'n2'
      });
      await expectCount({
        where: {
          name1: 'n1',
          name2: 'n2',
        }
      }, 1);
    });
    it('values/ref', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'create',
        collection_name: 'tests',
        values: [
          {
            column: 'name1',
            op: 'truncate',
          },
          {
            column: 'name2',
            op: 'ref',
            value: 'col2'
          },
        ],
      }, {
        hooks: false,
      });
      await job.process({
        col1: 'n1',
        col2: 'n2'
      });
      await expectCount({
        where: {
          name1: null,
          name2: 'n2',
        }
      }, 1);
    });
  });

  describe('update', () => {
    it('values', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'update',
        collection_name: 'tests',
        values: [
          {
            column: 'name1',
            op: 'eq',
            value: 'n111'
          },
        ],
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process();
      await expectCount({
        where: {}
      }, 2);
      await expectCount({
        where: {
          name1: 'n111',
        }
      }, 2);
    });

    it('values', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'update',
        collection_name: 'tests',
        values: [
          {
            column: 'name1',
            op: 'truncate',
          },
        ],
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process();
      await expectCount({
        where: {}
      }, 2);
      await expectCount({
        where: {
          name1: null,
        }
      }, 2);
    });
    it('filter', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'update',
        collection_name: 'tests',
        filter: {
          name1: 'n1',
        },
        values: [
          {
            column: 'name1',
            op: 'eq',
            value: 'n111'
          },
        ],
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process();
      await expectCount({
        where: {}
      }, 2);
      await expectCount({
        where: {
          name1: 'n111',
        }
      }, 1);
    });
    it('filter - ref', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'update',
        collection_name: 'tests',
        filter: {
          name1: '{{name1}}',
        },
        values: [
          {
            column: 'name2',
            op: 'ref',
            value: 'name2'
          },
        ],
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process({
        name1: 'n1',
        name2: 's2',
      });
      await expectCount({
        where: {}
      }, 2);
      await expectCount({
        where: {
          name1: 'n1',
          name2: 's2',
        }
      }, 1);
    });
  });

  describe('destroy', () => {
    it('values', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'destroy',
        collection_name: 'tests',
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process();
      await expectCount({
        where: {}
      }, 0);
      await expectCount({
        where: {
          name1: 'n111',
        }
      }, 0);
    });
    it('filter', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'destroy',
        collection_name: 'tests',
        filter: {
          name1: 'n1',
        },
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process();
      await expectCount({
        where: {}
      }, 1);
      await expectCount({
        where: {
          name1: 'n111',
        }
      }, 0);
    });
    it('filter - ref', async () => {
      const job = await Job.create({
        title: 'j1',
        enabled: true,
        type: 'destroy',
        collection_name: 'tests',
        filter: {
          name1: '{{name1}}',
        },
      }, {
        hooks: false,
      });
      await Test.bulkCreate([
        {
          name1: 'n1',
        },
        {
          name1: 'n2',
        },
      ]);
      await job.process({
        name1: 'n1',
      });
      await expectCount({
        where: {}
      }, 1);
      await expectCount({
        where: {
          name1: 'n1',
        }
      }, 0);
    });
  });
});
