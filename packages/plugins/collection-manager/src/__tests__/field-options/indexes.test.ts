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

  it('field value cannot be duplicated with unique index', async () => {
    await agent
      .resource('collections.fields', 'test1')
      .create({
        values: {
          name: 'title',
          type: 'string',
          unique: true
        },
      });

    const response1 = await agent.resource('test1').create({
      values: {
        title: 't1'
      }
    });
    expect(response1.body.data.title).toBe('t1');

    const response2 = await agent.resource('test1').create({
      values: {
        title: 't1'
      }
    });

    expect(response2.status).toBe(400);
  });
});
