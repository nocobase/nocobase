import path from 'path';
import Database, { ModelCtor, TableOptions } from '@nocobase/database';
import { Agent, getAgent, getApp, getDatabase } from '.';
import CollectionModel from '../models/collection';
import { Application } from '@nocobase/server';

describe('collection hooks', () => {
  let app: Application;
  let agent: Agent;

  beforeAll(async () => {
    app = await getApp();
    agent = getAgent(app);
  });

  afterAll(() => app.database.close());

  it('create table', async () => {
    const response = await agent.resource('collections').create({
      values: {
        name: 'tests',
        title: 'tests',
      },
    });
    console.log(response.body);
  });

  it('list', async () => {
    const response = await agent.resource('collections').list();
    console.log(response.body);
  });

  it('list fields', async () => {
    const response = await agent.resource('collections.fields').list({
      associatedKey: 1,
      // values: {
      //   type: 'string',
      //   name: 'title',
      //   title: '标题',
      // },
    });
    console.log(response.body);
  });

  it('create field', async () => {
    const response = await agent.resource('collections.fields').create({
      associatedKey: 'tests',
      values: {
        type: 'string',
        name: 'name',
        options: {
          type: 'string',
          name: 'name',
        },
      },
    });
    console.log(response.body);
  });
});
