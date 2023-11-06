import { HasManyRepository } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collections', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('remove collection with cascade options', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });
    const collection = app.db.getCollection('test');
    expect(await collection.existsInDb()).toBeTruthy();

    // create a database view for test
    await app.db.sequelize.query(`
      CREATE VIEW test_view AS SELECT * FROM ${collection.getTableNameWithSchemaAsString()};
    `);

    await app.agent().resource('collections').destroy({
      filterByTk: 'test',
      cascade: true,
    });

    expect(await collection.existsInDb()).toBeFalsy();
  });

  test('remove collection 1', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });
    const collection = app.db.getCollection('test');
    expect(await collection.existsInDb()).toBeTruthy();
    await app.agent().resource('collections').destroy({
      filterByTk: 'test',
    });

    expect(await collection.existsInDb()).toBeFalsy();
  });

  test('remove collection 2', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test1',
        },
      });
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test2',
        },
      });
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .create({
        values: {
          type: 'belongsTo',
          name: 'test2',
          target: 'test2',
          reverseField: {
            name: 'test1',
          },
        },
      });
    await app.agent().resource('collections').destroy({
      filterByTk: 'test1',
    });
    expect(app.db.hasCollection('test1')).toBeFalsy();
    expect(!!app.db.sequelize.modelManager.getModel('test1')).toBeFalsy();
    const collection2 = app.db.getCollection('test2');
    expect(collection2.hasField('test2')).toBeFalsy();
    const count = await app.db.getRepository<HasManyRepository>('collections.fields', 'test2').count({
      filter: {
        name: 'test2',
      },
    });
    expect(count).toBe(0);
  });

  test('remove collection 3', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test1',
        },
      });
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test2',
        },
      });
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test3',
        },
      });
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .create({
        values: {
          type: 'belongsToMany',
          name: 'test2',
          target: 'test2',
          through: 'test3',
          reverseField: {
            name: 'test1',
          },
        },
      });
    await app.agent().resource('collections').destroy({
      filterByTk: 'test3',
    });
    expect(app.db.hasCollection('test3')).toBeFalsy();
    expect(!!app.db.sequelize.modelManager.getModel('test3')).toBeFalsy();
    const collection1 = app.db.getCollection('test1');
    expect(collection1.hasField('test2')).toBeFalsy();
    const collection2 = app.db.getCollection('test2');
    expect(collection2.hasField('test1')).toBeFalsy();
  });
});
