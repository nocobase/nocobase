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
    Target = db.getModel('targets');
    Test = db.getModel('tests');
  });

  afterEach(() => db.close());

  it('collections:afterCreate', async () => {
    const automation = await Automation.create({
      title: 'a1',
      enabled: true,
      type: 'collections:afterCreate',
      collection_name: 'tests',
      filter: {},
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

  it('collections:afterUpdate', async () => {
    const automation = await Automation.create({
      title: 'a1',
      enabled: true,
      type: 'collections:afterUpdate',
      collection_name: 'tests',
      filter: {},
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

  it('collections:afterCreateOrUpdate', async () => {
    const automation = await Automation.create({
      title: 'a1',
      enabled: true,
      type: 'collections:afterCreateOrUpdate',
      collection_name: 'tests',
      filter: {},
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

  it('schedule', async (done) => {
    const automation = await Automation.create({
      title: 'a1',
      enabled: true,
      type: 'schedule',
      startTime: {
        value: new Date(Date.now() + 100).toISOString(),
      },
      cron: 'none', // 不重复
    });

    const arr = [];

    automation.startJob('test', async (model) => {
      arr.push('schedule');
    });

    setTimeout(() => {
      expect(arr.length).toBe(1);
      done();
    }, 500);
  });

  it.only('schedule', async () => {
    const automation = await Automation.create({
      title: 'a1',
      enabled: true,
      type: 'schedule',
      startTime: {
        value: new Date(Date.now()).toISOString(),
      },
      cron: 'everysecond', // 不重复
    });

    const arr = [];

    automation.startJob('test', async (date) => {
      arr.push('schedule');
      console.log('schedule', date, arr.length);
    });

    await new Promise((r) => setTimeout(r, 3000));

    expect(arr.length).toBe(3);
    automation.cancelJob('test');
  });
});
