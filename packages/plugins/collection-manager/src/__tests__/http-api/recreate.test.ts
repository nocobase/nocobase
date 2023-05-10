import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('recreate field', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should recreate field', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'a1',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'a2',
      },
    });

    await agent.resource('fields').create({
      values: {
        name: 'a',
        type: 'string',
        collectionName: 'a1',
      },
    });

    await agent.resource('a1').create({
      values: {
        a: 'a-value',
      },
    });

    await agent.resource('fields').destroy({
      filter: {
        name: 'a',
        collectionName: 'a1',
      },
    });

    await agent.resource('fields').create({
      values: {
        name: 'a',
        type: 'belongsToMany',
        collectionName: 'a1',
        target: 'a2',
      },
    });

    const response = await agent.resource('a1').list({
      appends: ['a'],
    });

    expect(response.statusCode).toBe(200);
  });
});
