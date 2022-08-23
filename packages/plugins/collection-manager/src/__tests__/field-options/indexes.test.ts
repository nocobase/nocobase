import { MockServer } from '@nocobase/test';
import { createApp } from '..';

describe('field indexes', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    await app.install({ clean: true });
    await app.start();
    agent = app.agent();
    await agent
      .resource('collections')
      .create({
        values: {
          name: 'test1',
        },
      });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('create unique constraint after added dulplicated records', async () => {
    const tableName = 'test1';
    // create an field with unique constraint
    const field = await agent
      .resource('collections.fields', tableName)
      .create({
        values: {
          name: 'title',
          type: 'string'
        },
      });

    // create a record
    const response1 = await agent.resource(tableName).create({
      values: { title: 't1' }
    });
    // create another same record
    const response2 = await agent.resource(tableName).create({
      values: { title: 't1' }
    });

    const response3 = await agent.resource('fields').update({
      filterByTk: field.id,
      values: {
        unique: true
      }
    });
    expect(response3.status).toBe(400);
  });

  it('field value cannot be duplicated with unique index', async () => {
    const tableName = 'test1';
    // create an field with unique constraint
    const field = await agent
      .resource('collections.fields', tableName)
      .create({
        values: {
          name: 'title',
          type: 'string',
          unique: true
        },
      });

    // create a record
    const response1 = await agent.resource(tableName).create({
      values: {
        title: 't1'
      }
    });
    expect(response1.status).toBe(200);
    expect(response1.body.data.title).toBe('t1');

    // create another record with the same value on unique field should fail
    const response2 = await agent.resource(tableName).create({
      values: {
        title: 't1'
      }
    });
    expect(response2.status).toBe(400);

    // update field to remove unique constraint
    await agent.resource('fields').update({
      filterByTk: field.id,
      values: {
        unique: false
      }
    });

    // create another record with the same value on unique field should be ok
    const response3 = await agent.resource(tableName).create({
      values: {
        title: 't1'
      }
    });
    expect(response3.status).toBe(200);
    expect(response3.body.data.title).toBe('t1');

    // update field to add unique constraint should fail because of duplicated records
    const response4 = await agent.resource('fields').update({
      filterByTk: field.id,
      values: {
        unique: true
      }
    });
    expect(response4.status).toBe(400);

    // remove a duplicated record
    await agent.resource(tableName).destroy({
      filterByTk: response3.body.data.id
    });

    // update field to add unique constraint should be ok
    const response6 = await agent.resource('fields').update({
      filterByTk: field.id,
      values: {
        unique: true
      }
    });
    expect(response6.status).toBe(200);
  });
});
