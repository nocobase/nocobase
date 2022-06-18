import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('collections.fields', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('destroy field', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test1',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
      });
    const collection = app.db.getCollection('test1');
    const field = collection.getField('name');
    expect(collection.hasField('name')).toBeTruthy();
    const r1 = await field.existsInDb();
    expect(r1).toBeTruthy();
    await app.agent().resource('collections.fields', 'test1').destroy({
      filterByTk: 'name',
    });
    expect(collection.hasField('name')).toBeFalsy();
    const r2 = await field.existsInDb();
    expect(r2).toBeFalsy();
  });

  test('destroy field', async () => {
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
          type: 'string',
          name: 'name',
        },
      });
    const collection = app.db.getCollection('test1');
    const field = collection.getField('name');
    expect(collection.hasField('name')).toBeTruthy();
    const r1 = await field.existsInDb();
    expect(r1).toBeTruthy();
    await app.agent().resource('collections.fields', 'test1').destroy({
      filterByTk: 'name',
    });
    expect(collection.hasField('name')).toBeFalsy();
    const r2 = await field.existsInDb();
    expect(r2).toBeFalsy();
  });

  test('remove association field', async () => {
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
    const collection = app.db.getCollection('test1');
    const collection2 = app.db.getCollection('test2');
    expect(collection.hasField('test2')).toBeTruthy();
    expect(collection2.hasField('test1')).toBeTruthy();
    await app.agent().resource('collections.fields', 'test1').destroy({
      filterByTk: 'test2',
    });
    expect(collection.hasField('test2')).toBeFalsy();
    expect(collection2.hasField('test1')).toBeTruthy();
  });
});
