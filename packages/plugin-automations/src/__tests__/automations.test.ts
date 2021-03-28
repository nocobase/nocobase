import { Application } from '@nocobase/server';
import Database, { Model, ModelCtor } from '@nocobase/database'
import { getApp, getAPI, getAgent } from '.';
import { AutomationModel } from '../models/automation';
import _ from 'lodash';
jest.setTimeout(300000);

describe('automations', () => {
  let app: Application;
  let db: Database;
  let Test: ModelCtor<Model>;
  let Target: ModelCtor<Model>;
  let Automation: ModelCtor<AutomationModel>;

  beforeEach(async () => {
    app = await getApp();
    db = app.database;
    Automation = db.getModel('automations') as any;
    Test = db.getModel('tests');
    Target = db.getModel('targets');
  });

  afterEach(() => db.close());

  describe('collections:afterCreate', () => {
    it('collections:afterCreate', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreate',
        collection_name: 'tests',
        filter: {},
      }, {
        hooks: false,
      });

      let data = {}
      const arr = [];

      automation.startJob('test', async (model) => {
        data = _.cloneDeep(model.get());
        arr.push('afterCreate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });

      const t = _.cloneDeep(test.get());
      expect(t).toEqual(data);

      await test.update({
        name1: 'n3',
      });

      expect(t).toEqual(data);
      expect(arr.length).toBe(1);
    });
    it('collections:afterCreate - filter', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreate',
        collection_name: 'tests',
        filter: {
          name1: 'n1',
        },
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterCreate');
      });

      await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(1);

      await Test.create({
        name1: 'n3',
        name2: 'n4',
      });
      expect(arr.length).toBe(1);
    });
  });

  describe('collections:afterUpdate', () => {
    it('collections:afterUpdate', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterUpdate',
        collection_name: 'tests',
        filter: {},
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(1);
    });
    it('collections:afterUpdate - changed', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterUpdate',
        collection_name: 'tests',
        filter: {},
        changed: ['name2']
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name2: 'n4',
      });
      expect(arr.length).toBe(1);
    });
    it('collections:afterUpdate - filter/changed', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterUpdate',
        collection_name: 'tests',
        filter: {
          name1: 'n7',
        },
        changed: ['name2']
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name2: 'n4',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n5',
        name2: 'n6',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n7',
        name2: 'n8',
      });
      expect(arr.length).toBe(1);
    });
  });

  describe('collections:afterCreateOrUpdate', () => {
    it('collections:afterCreateOrUpdate', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreateOrUpdate',
        collection_name: 'tests',
        filter: {},
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });

      expect(arr.length).toBe(1);

      await test.update({
        name1: 'n3',
        name2: 'n4',
      });

      expect(arr.length).toBe(2);
    });
    it('collections:afterCreateOrUpdate - changed', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreateOrUpdate',
        collection_name: 'tests',
        changed: ['name2'],
        filter: {},
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(1);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(1);

      await test.update({
        name2: 'n4',
      });
      expect(arr.length).toBe(2);
    });
    it('collections:afterCreateOrUpdate - filter', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreateOrUpdate',
        collection_name: 'tests',
        filter: {
          name1: 'n7',
        },
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      await Test.create({
        name1: 'n1',
      });
      expect(arr.length).toBe(0);

      const test = await Test.create({
        name1: 'n7',
      });
      expect(arr.length).toBe(1);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(1);

      await test.update({
        name1: 'n7',
      });
      expect(arr.length).toBe(2);
    });
    it('collections:afterCreateOrUpdate - filter/changed', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreateOrUpdate',
        collection_name: 'tests',
        filter: {
          name1: 'n7',
        },
        changed: ['name2']
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('afterUpdate');
      });

      const test = await Test.create({
        name1: 'n1',
        name2: 'n2',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n3',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name2: 'n4',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n7',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n5',
        name2: 'n6',
      });
      expect(arr.length).toBe(0);

      await test.update({
        name1: 'n7',
        name2: 'n8',
      });
      expect(arr.length).toBe(1);
    });
  });

  describe('collections:schedule', () => {
    it('collections:schedule', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:schedule',
        collection_name: 'tests',
        startTime: {
          byField: 'date1',
        },
        // cron: 'none', // 不重复
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('schedule');
      });

      await Test.create({
        date1: new Date(Date.now() + 200).toISOString(),
      });

      await new Promise((r) => setTimeout(r, 1000));

      expect(arr.length).toBe(1);
    });

    it('collections:schedule - cron', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:schedule',
        collection_name: 'tests',
        startTime: {
          byField: 'date1',
        },
        cron: '* * * * * *',
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('schedule');
        console.log('schedule', new Date(), arr.length);
      });

      await Test.create({
        date1: new Date(Date.now() + 1000).toISOString(),
      });

      await new Promise((r) => setTimeout(r, 3000));

      expect(arr.length).toBe(2);

      await automation.cancelJob('test');
    });

    it('collections:schedule - endField', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:schedule',
        collection_name: 'tests',
        startTime: {
          byField: 'date1',
        },
        endMode: 'byField',
        endTime: {
          byField: 'date2',
        },
        cron: '* * * * * *',
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('schedule');
        console.log('schedule', new Date(), arr.length);
      });

      await Test.create({
        date1: new Date(Date.now() + 1000).toISOString(),
        date2: new Date(Date.now() + 3000).toISOString(),
      });

      await new Promise((r) => setTimeout(r, 4000));

      expect(arr.length).toBe(2);

      await automation.cancelJob('test');
    });
  });

  describe('schedule', () => {
    it('schedule', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'schedule',
        startTime: {
          value: new Date(Date.now() + 100).toISOString(),
        },
        // cron: 'none', // 不重复
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (model) => {
        arr.push('schedule');
      });
      await new Promise((r) => setTimeout(r, 500));
      expect(arr.length).toBe(1);
    });
    it('schedule - cron', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'schedule',
        startTime: {
          value: new Date(Date.now()).toISOString(),
        },
        cron: '* * * * * *',
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (date) => {
        arr.push('schedule');
        console.log('schedule', date, arr.length);
      });

      await new Promise((r) => setTimeout(r, 3000));

      expect(arr.length).toBe(3);
      await automation.cancelJob('test');
    });
    it('schedule - endTime', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'schedule',
        startTime: {
          value: new Date(Date.now()).toISOString(),
        },
        endMode: 'customTime',
        endTime: {
          value: new Date(Date.now() + 2000).toISOString(),
        },
        cron: '* * * * * *',
      }, {
        hooks: false,
      });

      const arr = [];

      automation.startJob('test', async (date) => {
        arr.push('schedule');
        console.log('schedule', date, arr.length);
      });

      await new Promise((r) => setTimeout(r, 3000));

      expect(arr.length).toBe(2);
      await automation.cancelJob('test');
    });
  });

  describe('jobs', () => {
    it('create', async () => {
      const automation = await Automation.create({
        title: 'a1',
        enabled: true,
        type: 'collections:afterCreate',
        collection_name: 'tests',
      });
      await automation.updateAssociations({
        jobs: [
          {
            title: 'j1',
            enabled: true,
            type: 'create',
            collection_name: 'targets',
            values: [
              {
                column: 'col1',
                op: 'eq',
                value: 'n1'
              },
              {
                column: 'col2',
                op: 'ref',
                value: 'name2'
              },
            ],
          }
        ],
      });
      await Test.create({
        name1: 'n11',
        name2: 'n22',
      });
      await new Promise((r) => setTimeout(r, 1000));

      const count = await Target.count({
        where: { col1: 'n1', col2: 'n22' }
      });
      expect(count).toBe(1);
    });
  });
});
