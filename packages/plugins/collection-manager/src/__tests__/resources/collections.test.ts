import { HasManyRepository } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collections', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('remove collection', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test',
        },
      });
    const collection = app.db.getCollection('test');
    const r1 = await collection.existsInDb();
    expect(r1).toBe(true);
    await app.agent().resource('collections').destroy({
      filterByTk: 'test',
    });
    const r2 = await collection.existsInDb();
    expect(r2).toBe(false);
  });

  test('remove collection', async () => {
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

  test('remove collection', async () => {
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
