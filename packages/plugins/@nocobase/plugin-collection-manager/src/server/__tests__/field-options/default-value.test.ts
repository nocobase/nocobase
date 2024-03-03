import { MockServer } from '@nocobase/test';
import { createApp } from '..';
import { Collection } from '@nocobase/database';

describe('field defaultValue', () => {
  let app: MockServer;

  let TestCollection: Collection;

  beforeEach(async () => {
    app = await createApp();
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'test1',
        },
      });

    TestCollection = app.db.getCollection('test1');

    await app
      .agent()
      .resource('collections.fields', 'test1')
      .create({
        values: {
          name: 'field1',
          type: 'string',
          defaultValue: 'abc',
        },
      });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should be updated', async () => {
    const dialect = app.db.sequelize.getDialect();

    if (dialect != 'postgres') {
      return;
    }

    const response1 = await app.agent().resource('test1').create();
    expect(response1.body.data.field1).toBe('abc');
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .update({
        filterByTk: 'field1',
        values: {
          type: 'string',
          defaultValue: 'cba',
        },
      });

    const response2 = await app.agent().resource('test1').create();
    expect(response2.body.data.field1).toBe('cba');

    const results = await app.db.sequelize.getQueryInterface().describeTable(TestCollection.getTableNameWithSchema());

    expect(results.field1.defaultValue).toBe('cba');
  });

  it('should be cleaned', async () => {
    await app
      .agent()
      .resource('collections.fields', 'test1')
      .update({
        filterByTk: 'field1',
        values: {
          type: 'string',
          defaultValue: null,
        },
        context: {},
      });

    await app.agent().resource('test1').create();
    const item = await app.agent().resource('test1').get();
    expect(item.body.data.field1).toBeNull();
  });
});
